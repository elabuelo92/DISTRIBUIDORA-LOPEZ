#!/usr/bin/env python3
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / ".deploy-tools" / "python"))

import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def main():
    host = os.environ.get("VULTR_HOST", "216.128.169.34")
    user = os.environ.get("VULTR_USER", "dlops")
    key_path = Path(os.environ.get("VULTR_PRIVATE_KEY_PATH", ".deploy-tools/dl_vultr_ed25519")).resolve()
    command = " ".join(sys.argv[1:]).strip()
    if not command:
        raise SystemExit("Uso: remote-exec.py <comando-remoto>")

    key = paramiko.Ed25519Key.from_private_key_file(str(key_path))
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=host, username=user, pkey=key, timeout=20)
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=60)
        code = stdout.channel.recv_exit_status()
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        if out:
            print(out, end="")
        if err:
            print(err, end="", file=sys.stderr)
        raise SystemExit(code)
    finally:
        client.close()


if __name__ == "__main__":
    main()
