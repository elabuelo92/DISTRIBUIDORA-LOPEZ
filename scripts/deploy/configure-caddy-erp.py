#!/usr/bin/env python3
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / ".deploy-tools" / "python"))

import paramiko

HOST = os.environ.get("VULTR_HOST", "216.128.169.34")
USER = os.environ.get("VULTR_USER", "dlops")
KEY_PATH = Path(os.environ.get("VULTR_PRIVATE_KEY_PATH", ".deploy-tools/dl_vultr_ed25519")).resolve()
HOSTNAMES = [
    host.strip()
    for host in os.environ.get(
        "DL_HTTPS_HOSTS",
        "lopez.gruporochaapp.com,distribuidora.gruporochaapp.com,distribuidora-lopez.216-128-169-34.sslip.io",
    ).split(",")
    if host.strip()
]


def run(client, command, input_text=None, timeout=60):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    if input_text is not None:
        stdin.write(input_text)
        stdin.channel.shutdown_write()
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    if out:
        print(out)
    if err:
        print(err, file=sys.stderr)
    if code != 0:
        raise RuntimeError(f"REMOTE CMD FAILED {code}: {command}")
    return out


def main():
    key = paramiko.Ed25519Key.from_private_key_file(str(KEY_PATH))
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=HOST, username=USER, pkey=key, timeout=20)
    try:
        script = """
from pathlib import Path
from datetime import datetime, timezone

path = Path("/home/rocha/apps/caddy/Caddyfile")
hosts = __HOSTNAMES__
text = path.read_text(encoding="utf-8")
backup = path.with_name(path.name + ".bak-" + datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S"))
backup.write_text(text, encoding="utf-8")
blocks = []
for host in hosts:
    if host not in text:
        blocks.append("\\n" + host + " {\\n    reverse_proxy 127.0.0.1:8790\\n}\\n")
if blocks:
    path.write_text(text.rstrip() + "".join(blocks), encoding="utf-8", newline="\\n")
print(f"caddyfile={path}")
print(f"backup={backup}")
print("hosts=" + ",".join(hosts))
""".replace("__HOSTNAMES__", repr(HOSTNAMES))
        run(client, "sudo python3 -", script, timeout=30)
        run(client, "sudo docker exec caddy caddy validate --config /etc/caddy/Caddyfile", timeout=30)
        run(client, "sudo docker exec caddy caddy reload --config /etc/caddy/Caddyfile", timeout=60)
        run(client, "sudo docker exec caddy sed -n '1,260p' /etc/caddy/Caddyfile", timeout=30)
    finally:
        client.close()


if __name__ == "__main__":
    main()
