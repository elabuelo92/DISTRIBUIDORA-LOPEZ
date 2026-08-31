"""Inspeccion y despliegue seguro de main en Vultr sin reemplazar datos productivos."""

import argparse
import json
import os
import shlex
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".deploy-tools" / "python"))

import paramiko


HOST = os.environ.get("VULTR_HOST", "216.128.169.34").strip()
USER = os.environ.get("VULTR_USER", "dlops").strip()
KEY_PATH = Path(os.environ.get("VULTR_PRIVATE_KEY_PATH", ROOT / ".deploy-tools" / "dl_vultr_ed25519"))
APP_DIR = "/opt/distribuidora-lopez/app"
DATA_DIR = "/opt/distribuidora-lopez/data"
BACKUP_ROOT = "/opt/distribuidora-lopez/backups"
SERVICE = "distribuidora-lopez.service"
PUBLIC_HEALTH = "https://lopez.gruporochaapp.com/api/health"


def connect():
    key = paramiko.Ed25519Key.from_private_key_file(str(KEY_PATH))
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=HOST, username=USER, pkey=key, timeout=20, banner_timeout=30, auth_timeout=30)
    return client


def run(client, command, timeout=120, check=True):
    _, stdout, stderr = client.exec_command(command, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    if check and code != 0:
        raise RuntimeError(f"REMOTE CMD FAILED ({code})\n{err or out}")
    return code, out, err


def inspect(client):
    command = f"""
set -u
echo __DATE__; date -Is
echo __SERVICE__; systemctl is-active {SERVICE} || true
systemctl show {SERVICE} -p MainPID -p MemoryCurrent -p MemoryHigh -p MemoryMax -p ActiveState -p SubState --no-pager
echo __HEALTH_LOCAL__; curl -sS --max-time 10 http://127.0.0.1:8790/api/health || true; echo
echo __HEALTH_PUBLIC__; curl -sS --max-time 15 {PUBLIC_HEALTH} || true; echo
echo __GIT__; cd {APP_DIR} && git status --short 2>/dev/null || echo NOT_GIT
git rev-parse --short HEAD 2>/dev/null || true
git remote -v 2>/dev/null || true
echo __ENV_VERSION__; grep '^DL_VERSION=' /etc/distribuidora-lopez.env 2>/dev/null || true
echo __UNIT_VERSION__; sudo systemctl cat {SERVICE} | grep -E '^(Environment=DL_VERSION=|EnvironmentFile=|ExecStart=)' || true
echo __ADMIN3__; node -e 'const fs=require("fs"); const raw=JSON.parse(fs.readFileSync("{DATA_DIR}/users.json","utf8")); const users=Array.isArray(raw)?raw:(raw.users||[]); const u=users.find(x=>String(x.username||"").toLowerCase()==="admin3"); console.log(JSON.stringify(u?{{username:u.username,name:u.name,role:u.role,active:u.active!==false}}:null))'
echo __STATIC_V116__; curl -fsS --max-time 10 https://lopez.gruporochaapp.com/index.html | grep -o '8790-116' | head -n1 || true
echo __DISK__; df -h /opt/distribuidora-lopez
echo __MEMORY__; free -h
"""
    _, out, _ = run(client, command, timeout=60)
    print(out)


def deploy(client, version):
    version_q = shlex.quote(version)
    command = f"""
set -euo pipefail
cd {APP_DIR}
if [ ! -d .git ]; then echo 'ERROR: APP_NOT_GIT'; exit 31; fi
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then echo 'ERROR: REMOTE_TRACKED_WORKTREE_DIRTY'; git status --short; exit 32; fi
OLD_COMMIT="$(git rev-parse HEAD)"
OLD_VERSION="$(sudo grep '^DL_VERSION=' /etc/distribuidora-lopez.env | head -n1 | cut -d= -f2- || true)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="{BACKUP_ROOT}/emergency-$STAMP"
sudo mkdir -p "$BACKUP_DIR"
sudo tar -C /opt/distribuidora-lopez -czf "$BACKUP_DIR/app.tar.gz" app
sudo systemctl stop {SERVICE}
if ! sudo tar -C /opt/distribuidora-lopez -czf "$BACKUP_DIR/data.tar.gz" data; then
  sudo systemctl start {SERVICE}
  echo 'ERROR: DATA_BACKUP_FAILED'
  exit 33
fi
sudo systemctl start {SERVICE}
sudo cp /etc/distribuidora-lopez.env "$BACKUP_DIR/distribuidora-lopez.env"
if [ -f {DATA_DIR}/integrity-manifest.json ]; then sudo cp {DATA_DIR}/integrity-manifest.json "$BACKUP_DIR/integrity-manifest.json"; fi
sudo chown -R {USER}:{USER} "$BACKUP_DIR"
echo "BACKUP=$BACKUP_DIR"

git fetch origin main
git checkout main
git reset --hard origin/main
npm install --omit=dev --no-audit --no-fund
node --check server.js
node --check app.js
node --check order-engine.js
if grep -q '^DL_VERSION=' /etc/distribuidora-lopez.env; then
  sudo sed -i "s/^DL_VERSION=.*/DL_VERSION={version_q}/" /etc/distribuidora-lopez.env
else
  echo "DL_VERSION={version}" | sudo tee -a /etc/distribuidora-lopez.env >/dev/null
fi
if sudo systemctl cat {SERVICE} | grep -q '^Environment=DL_VERSION='; then
  sudo sed -i "s/^Environment=DL_VERSION=.*/Environment=DL_VERSION={version_q}/" /etc/systemd/system/{SERVICE}
  sudo systemctl daemon-reload
fi

sudo bash -lc 'set -e; cd /opt/distribuidora-lopez/app; set -a; . /etc/distribuidora-lopez.env; set +a; node scripts/license-admin.js manifest; node scripts/license-admin.js status'
sudo chown {USER}:{USER} {DATA_DIR}/integrity-manifest.json {DATA_DIR}/security-audit.log 2>/dev/null || true

sudo systemctl restart {SERVICE}
for attempt in $(seq 1 20); do
  if curl -fsS --max-time 5 http://127.0.0.1:8790/api/health > /tmp/dl-health.json; then break; fi
  sleep 1
done
if ! curl -fsS --max-time 8 http://127.0.0.1:8790/api/health > /tmp/dl-health.json; then
  echo 'DEPLOY_HEALTH_FAILED_ROLLBACK'
  git reset --hard "$OLD_COMMIT"
  sudo cp "$BACKUP_DIR/distribuidora-lopez.env" /etc/distribuidora-lopez.env
  if [ -f "$BACKUP_DIR/integrity-manifest.json" ]; then sudo cp "$BACKUP_DIR/integrity-manifest.json" {DATA_DIR}/integrity-manifest.json; fi
  sudo systemctl restart {SERVICE}
  exit 41
fi
echo __DEPLOYED_COMMIT__; git rev-parse --short HEAD
echo __BACKUP__; echo "$BACKUP_DIR"
echo __HEALTH_LOCAL__; cat /tmp/dl-health.json; echo
echo __HEALTH_PUBLIC__; curl -fsS --max-time 15 {PUBLIC_HEALTH}; echo
echo __SERVICE__; systemctl show {SERVICE} -p MainPID -p MemoryCurrent -p ActiveState -p SubState --no-pager
"""
    _, out, _ = run(client, command, timeout=420)
    print(out)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["inspect", "deploy"])
    parser.add_argument("--version", default="8790-121")
    args = parser.parse_args()
    client = connect()
    try:
        if args.action == "inspect":
            inspect(client)
        else:
            deploy(client, args.version)
    finally:
        client.close()


if __name__ == "__main__":
    main()
