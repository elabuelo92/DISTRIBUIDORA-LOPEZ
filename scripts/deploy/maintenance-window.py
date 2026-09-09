#!/usr/bin/env python3
"""Activa, desactiva o consulta la ventana de mantenimiento del ERP."""

import argparse
import base64
import json
import os
import shlex
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / ".deploy-tools" / "python"))

import paramiko


ROOT = Path(__file__).resolve().parents[2]
HOST = os.environ.get("VULTR_HOST", "216.128.169.34").strip()
USER = os.environ.get("VULTR_USER", "dlops").strip()
KEY_PATH = Path(os.environ.get("VULTR_PRIVATE_KEY_PATH", ROOT / ".deploy-tools" / "dl_vultr_ed25519"))
MAINTENANCE_FILE = "/opt/distribuidora-lopez/data/maintenance-mode.json"
HEALTH_URL = "http://127.0.0.1:8790/api/health"


def run(client, command, timeout=60, check=True):
    _, stdout, stderr = client.exec_command(command, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    if check and code != 0:
        raise RuntimeError(f"REMOTE CMD FAILED ({code})\n{err or out}")
    return code, out, err


def enable(client, message):
    payload = json.dumps({
        "active": True,
        "startedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "message": message,
    }, ensure_ascii=True).encode("utf-8")
    encoded = base64.b64encode(payload).decode("ascii")
    command = (
        f"printf %s {shlex.quote(encoded)} | base64 -d > /tmp/dl-maintenance-mode.json && "
        f"sudo install -o {USER} -g {USER} -m 640 /tmp/dl-maintenance-mode.json {MAINTENANCE_FILE} && "
        "rm -f /tmp/dl-maintenance-mode.json"
    )
    run(client, command)
    _, status, _ = run(client, f"cat {MAINTENANCE_FILE}; echo; curl -sS -o /dev/null -w 'http=%{{http_code}}' https://lopez.gruporochaapp.com/", check=False)
    print(status)


def disable(client, force):
    code, _, _ = run(client, f"curl -fsS --max-time 10 {HEALTH_URL} >/dev/null", check=False)
    if code != 0 and not force:
        raise RuntimeError("El ERP todavia no esta sano. Se conserva la pantalla de mantenimiento; usar --force solo para una excepcion controlada.")
    run(client, f"sudo rm -f {MAINTENANCE_FILE}")
    _, status, _ = run(client, f"systemctl is-active distribuidora-lopez; test ! -e {MAINTENANCE_FILE} && echo maintenance=off", check=False)
    print(status)


def status(client):
    _, output, _ = run(client, f"echo __SERVICE__; systemctl is-active distribuidora-lopez || true; echo __MAINTENANCE__; if [ -f {MAINTENANCE_FILE} ]; then cat {MAINTENANCE_FILE}; else echo off; fi", check=False)
    print(output)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["on", "off", "status"])
    parser.add_argument("--message", default="Ventana de trabajo programada")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    key = paramiko.Ed25519Key.from_private_key_file(str(KEY_PATH))
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=HOST, username=USER, pkey=key, timeout=20, banner_timeout=30, auth_timeout=30)
    try:
        if args.action == "on":
            enable(client, args.message)
        elif args.action == "off":
            disable(client, args.force)
        else:
            status(client)
    finally:
        client.close()


if __name__ == "__main__":
    main()
