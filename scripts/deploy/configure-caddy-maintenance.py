#!/usr/bin/env python3
"""Instala el fallback de mantenimiento del ERP en Caddy."""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / ".deploy-tools" / "python"))

import paramiko


ROOT = Path(__file__).resolve().parents[2]
HOST = os.environ.get("VULTR_HOST", "216.128.169.34").strip()
USER = os.environ.get("VULTR_USER", "dlops").strip()
KEY_PATH = Path(os.environ.get("VULTR_PRIVATE_KEY_PATH", ROOT / ".deploy-tools" / "dl_vultr_ed25519"))


def run(client, command, input_text=None, timeout=60):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    if input_text is not None:
        stdin.write(input_text)
        stdin.channel.shutdown_write()
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"REMOTE CMD FAILED ({code})\n{err or out}")
    return out


def main():
    key = paramiko.Ed25519Key.from_private_key_file(str(KEY_PATH))
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=HOST, username=USER, pkey=key, timeout=20, banner_timeout=30, auth_timeout=30)
    try:
        remote_script = r'''
from datetime import datetime, timezone
from pathlib import Path
import re

path = Path("/etc/caddy/Caddyfile")
text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
header = "lopez.gruporochaapp.com, distribuidora.gruporochaapp.com"
replacement = """lopez.gruporochaapp.com, distribuidora.gruporochaapp.com {
    @maintenanceAssets path /maintenance.html /icons/logo-distribuidora-lopez-512.png
    handle @maintenanceAssets {
        root * /opt/distribuidora-lopez/app
        file_server
    }

    handle {
        reverse_proxy 127.0.0.1:8790
    }

    handle_errors {
        rewrite * /maintenance.html
        root * /opt/distribuidora-lopez/app
        file_server
    }
}
"""

if header in text and "@maintenanceAssets" not in text:
    pattern = re.compile(r"(?ms)^lopez\.gruporochaapp\.com,\s*distribuidora\.gruporochaapp\.com\s*\{.*?^\}\s*")
    updated, count = pattern.subn(replacement + "\n", text, count=1)
    if count != 1:
        raise SystemExit("No se pudo localizar de forma segura el bloque del ERP en Caddy.")
    backup = path.with_name(path.name + ".bak-maintenance-" + datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S"))
    backup.write_text(text, encoding="utf-8", newline="\n")
    Path("/etc/caddy/Caddyfile.maintenance-next").write_text(updated, encoding="utf-8", newline="\n")
    print(f"changed=true\nbackup={backup}")
elif "@maintenanceAssets" in text:
    Path("/etc/caddy/Caddyfile.maintenance-next").write_text(text, encoding="utf-8", newline="\n")
    print("changed=false")
else:
    raise SystemExit("No existe el bloque esperado del ERP en Caddy.")
'''
        print(run(client, "sudo python3 -", remote_script, timeout=30))
        print(run(client, "sudo caddy validate --config /etc/caddy/Caddyfile.maintenance-next --adapter caddyfile", timeout=30))
        print(run(client, "sudo install -o root -g root -m 644 /etc/caddy/Caddyfile.maintenance-next /etc/caddy/Caddyfile && sudo rm -f /etc/caddy/Caddyfile.maintenance-next && sudo systemctl reload caddy", timeout=30))
        print(run(client, "systemctl is-active caddy && curl -fsS --max-time 12 https://lopez.gruporochaapp.com/api/health >/dev/null && echo maintenance_fallback=ready", timeout=30))
    finally:
        client.close()


if __name__ == "__main__":
    main()
