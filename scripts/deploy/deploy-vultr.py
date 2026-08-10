import json
import os
import posixpath
import shutil
import subprocess
import sys
import time
import zipfile
from pathlib import Path

sys.path.insert(0, os.path.join(os.getcwd(), ".deploy-tools", "python"))

import paramiko


ROOT = Path(__file__).resolve().parents[2]
BUILD_DIR = ROOT / ".deploy-tools" / "build"
PACKAGE_FILE = BUILD_DIR / "distribuidora-lopez-vultr.zip"
LICENSE_FILE = BUILD_DIR / "license-vultr.json"

HOST = os.environ.get("VULTR_HOST", "216.128.169.34").strip()
USER = os.environ.get("VULTR_USER", "dlops").strip()
KEY_PATH = Path(os.environ.get("VULTR_PRIVATE_KEY_PATH", ROOT / ".deploy-tools" / "dl_vultr_ed25519"))
NODE = Path(os.environ.get("NODE_EXE", r"C:\Users\Distribuidora Lopez\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"))

REMOTE_BASE = "/opt/distribuidora-lopez"
REMOTE_APP = f"{REMOTE_BASE}/app"
REMOTE_DATA = f"{REMOTE_BASE}/data"
REMOTE_DEPLOY = f"/home/{USER}/deploy"
REMOTE_PACKAGE = f"{REMOTE_DEPLOY}/distribuidora-lopez-vultr.zip"
REMOTE_LICENSE = f"{REMOTE_DEPLOY}/license-vultr.json"
REMOTE_ENV_TMP = f"{REMOTE_DEPLOY}/distribuidora-lopez.env"
REMOTE_UNIT_TMP = f"{REMOTE_DEPLOY}/distribuidora-lopez.service"
VERSION = "8790-88"

ROOT_FILES = [
    ".gitignore",
    "account-engine.js",
    "app.js",
    "config.js",
    "delivery-engine.js",
    "erpnext-engine.js",
    "event-engine.js",
    "index.html",
    "legal-engine.js",
    "license-engine.js",
    "manifest.json",
    "maps-config.js",
    "order-engine.js",
    "package.json",
    "production.env.example",
    "README.md",
    "server.js",
    "styles.css",
    "sw.js",
]

APP_DIRS = ["config", "icons", "scripts"]
DATA_FILES = [
    "demo-state.json",
    "users.json",
    "install-id.json",
    "integrity-manifest.json",
    "license.json",
    "license-grace.json",
    "session-config.json",
    "parametros-soporte.json",
]
EXCLUDED_SCRIPT_DIRS = {"deploy"}


def main():
    if not HOST:
        raise SystemExit("Falta VULTR_HOST.")
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    build_package()

    client = connect()
    try:
        ensure_remote_runtime(client)
        upload(client, PACKAGE_FILE, REMOTE_PACKAGE)
        deploy_package(client)
        remote_fp = remote_fingerprint(client)
        issue_license(remote_fp)
        upload(client, LICENSE_FILE, REMOTE_LICENSE)
        install_license_env_and_service(client)
        health = remote_health(client)
        print(json.dumps({"ok": True, "host": HOST, "version": VERSION, "health": health}, indent=2))
    finally:
        client.close()


def build_package():
    if PACKAGE_FILE.exists():
        PACKAGE_FILE.unlink()
    with zipfile.ZipFile(PACKAGE_FILE, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for rel in ROOT_FILES:
            add_file(zf, ROOT / rel, f"app/{rel}")
        for directory in APP_DIRS:
            base = ROOT / directory
            if not base.exists():
                continue
            for file in base.rglob("*"):
                if not file.is_file():
                    continue
                parts = file.relative_to(base).parts
                if directory == "scripts" and parts and parts[0] in EXCLUDED_SCRIPT_DIRS:
                    continue
                add_file(zf, file, "app/" + str(Path(directory, *parts)).replace("\\", "/"))
        for rel in DATA_FILES:
            file = ROOT / "data" / rel
            if file.exists():
                add_file(zf, file, f"data/{rel}")
    print(f"PACKAGE {PACKAGE_FILE} {PACKAGE_FILE.stat().st_size} bytes")


def add_file(zf, src, arcname):
    zf.write(src, arcname)


def connect():
    key = paramiko.Ed25519Key.from_private_key_file(str(KEY_PATH))
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=HOST, username=USER, pkey=key, timeout=20, banner_timeout=30, auth_timeout=30)
    return client


def upload(client, local, remote):
    run(client, f"mkdir -p {sh_quote(posixpath.dirname(remote))}")
    with client.open_sftp() as sftp:
        sftp.put(str(local), remote)
    print(f"UPLOAD {local} -> {remote}")


def ensure_remote_runtime(client):
    run(client, "sudo -n whoami")
    install = (
        "if ! command -v node >/dev/null 2>&1 || ! command -v unzip >/dev/null 2>&1; then "
        "sudo apt-get update && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm unzip; "
        "fi; "
        "node -v && npm -v && unzip -v >/dev/null"
    )
    print(run(client, install, timeout=300))


def deploy_package(client):
    stamp = time.strftime("%Y%m%d-%H%M%S")
    cmd = f"""
set -eu
sudo systemctl stop distribuidora-lopez.service >/dev/null 2>&1 || true
sudo mkdir -p {REMOTE_BASE}/backups {REMOTE_DATA}
if [ -d {REMOTE_APP} ]; then
  sudo mkdir -p {REMOTE_BASE}/backups/deploy-{stamp}
  sudo cp -a {REMOTE_APP} {REMOTE_BASE}/backups/deploy-{stamp}/app || true
  sudo cp -a {REMOTE_DATA} {REMOTE_BASE}/backups/deploy-{stamp}/data || true
fi
sudo rm -rf {REMOTE_BASE}/stage
sudo mkdir -p {REMOTE_BASE}/stage {REMOTE_APP} {REMOTE_DATA}
sudo unzip -q -o {REMOTE_PACKAGE} -d {REMOTE_BASE}/stage
sudo rm -rf {REMOTE_APP}
sudo mkdir -p {REMOTE_APP}
sudo cp -a {REMOTE_BASE}/stage/app/. {REMOTE_APP}/
sudo cp -a {REMOTE_BASE}/stage/data/. {REMOTE_DATA}/
sudo mkdir -p {REMOTE_DATA}/backups {REMOTE_DATA}/delivery-uploads {REMOTE_DATA}/supplier-uploads {REMOTE_DATA}/print-jobs
sudo chown -R {USER}:{USER} {REMOTE_BASE}
"""
    run(client, cmd, timeout=180)


def remote_fingerprint(client):
    cmd = (
        f"cd {REMOTE_APP} && "
        f"DATA_DIR={sh_quote(REMOTE_DATA)} "
        f"STATE_FILE={sh_quote(REMOTE_DATA + '/demo-state.json')} "
        f"USERS_FILE={sh_quote(REMOTE_DATA + '/users.json')} "
        f"DL_INSTALLATION_NAME=SERVIDOR_UNICO_8790 "
        f"DL_VERSION={VERSION} "
        "node scripts/license-admin.js fingerprint"
    )
    out = run(client, cmd, timeout=60)
    payload = json.loads(out)
    print("REMOTE_FINGERPRINT", payload["fingerprint"])
    return payload["fingerprint"]


def issue_license(fingerprint):
    private_key = ROOT.parent / ".security" / "distribuidora-lopez-license-private.pem"
    if not private_key.exists():
        raise SystemExit(f"No existe clave privada de licencia: {private_key}")
    if LICENSE_FILE.exists():
        LICENSE_FILE.unlink()
    cmd = [
        str(NODE),
        "scripts/license-admin.js",
        "issue",
        "--client",
        "Distribuidora Lopez",
        "--installation",
        "SERVIDOR_UNICO_8790",
        "--version",
        VERSION,
        "--version-pattern",
        "8790-*",
        "--fingerprint",
        fingerprint,
        "--private",
        str(private_key),
        "--license",
        str(LICENSE_FILE),
    ]
    completed = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, check=True)
    print(completed.stdout.strip())


def install_license_env_and_service(client):
    env_text = f"""PORT=8790
DL_HOST=0.0.0.0
DATA_DIR={REMOTE_DATA}
STATE_FILE={REMOTE_DATA}/demo-state.json
USERS_FILE={REMOTE_DATA}/users.json
DL_SUPPORT_WHATSAPP_PHONE=5493512410535
DL_STOCK_PRINTER_NAME=
GOOGLE_MAPS_API_KEY=
DL_VERSION={VERSION}
DL_INSTALLATION_NAME=SERVIDOR_UNICO_8790
DL_LICENSE_FILE={REMOTE_DATA}/license.json
DL_LICENSE_PUBLIC_KEY_FILE={REMOTE_APP}/config/license-public-key.pem
DL_INSTALL_ID_FILE={REMOTE_DATA}/install-id.json
DL_INTEGRITY_FILE={REMOTE_DATA}/integrity-manifest.json
DL_SECURITY_AUDIT_FILE={REMOTE_DATA}/security-audit.log
DL_LICENSE_ENFORCEMENT=strict
DL_INTEGRITY_ENFORCE=block
DL_API_BASE_URL=http://{HOST}:8790
DL_API_PORT=8790
DL_SOCKET_URL=
DL_SERVER_NAME=VULTR-216-128-169-34
DL_MAGIC_DNS_HOST=
DL_TIMEOUT_SERVER_MS=7000
DL_TIMEOUT_HEALTH_MS=4500
DL_TIMEOUT_LOGIN_GRACE_MS=30000
DL_SYNC_INTERVAL_MS=2500
ERPNEXT_ENABLED=false
"""
    unit_text = f"""[Unit]
Description=Distribuidora Lopez ERP
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory={REMOTE_APP}
EnvironmentFile=/etc/distribuidora-lopez.env
ExecStart=/usr/bin/node {REMOTE_APP}/server.js
Restart=always
RestartSec=5
User={USER}
Group={USER}

[Install]
WantedBy=multi-user.target
"""
    write_local_tmp("distribuidora-lopez.env", env_text)
    write_local_tmp("distribuidora-lopez.service", unit_text)
    upload(client, BUILD_DIR / "distribuidora-lopez.env", REMOTE_ENV_TMP)
    upload(client, BUILD_DIR / "distribuidora-lopez.service", REMOTE_UNIT_TMP)
    cmd = f"""
set -eu
sudo cp {REMOTE_LICENSE} {REMOTE_DATA}/license.json
sudo cp {REMOTE_ENV_TMP} /etc/distribuidora-lopez.env
sudo cp {REMOTE_UNIT_TMP} /etc/systemd/system/distribuidora-lopez.service
sudo chown {USER}:{USER} {REMOTE_DATA}/license.json
sudo chmod 640 /etc/distribuidora-lopez.env
sudo bash -lc 'cd {REMOTE_APP} && set -a && . /etc/distribuidora-lopez.env && set +a && node scripts/license-admin.js manifest'
sudo chown {USER}:{USER} {REMOTE_DATA}/integrity-manifest.json {REMOTE_DATA}/security-audit.log 2>/dev/null || true
sudo systemctl daemon-reload
sudo systemctl enable distribuidora-lopez.service
sudo systemctl restart distribuidora-lopez.service
"""
    run(client, cmd, timeout=90)


def write_local_tmp(name, text):
    with (BUILD_DIR / name).open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(text)


def remote_health(client):
    cmd = (
        "python3 - <<'PY'\n"
        "import json, urllib.request\n"
        "with urllib.request.urlopen('http://127.0.0.1:8790/api/health', timeout=10) as r:\n"
        "    print(r.read().decode('utf-8'))\n"
        "PY"
    )
    out = run(client, cmd, timeout=30)
    return json.loads(out)


def run(client, command, timeout=60):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"REMOTE CMD FAILED ({code})\nCMD:\n{command}\nSTDOUT:\n{out}\nSTDERR:\n{err}")
    return out


def sh_quote(value):
    return "'" + str(value).replace("'", "'\"'\"'") + "'"


if __name__ == "__main__":
    main()
