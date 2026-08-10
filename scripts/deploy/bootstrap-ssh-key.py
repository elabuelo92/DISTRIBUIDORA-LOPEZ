import os
import sys

sys.path.insert(0, os.path.join(os.getcwd(), ".deploy-tools", "python"))

import paramiko


def main():
    host = os.environ.get("VULTR_HOST", "").strip()
    password = os.environ.get("VULTR_ROOT_PASSWORD", "")
    public_key_path = os.environ.get("VULTR_PUBLIC_KEY_PATH", r"C:\DistribuidoraLopez\.ssh\dl_vultr_ed25519.pub")

    if not host or not password:
        raise SystemExit("Faltan VULTR_HOST o VULTR_ROOT_PASSWORD.")

    with open(public_key_path, "r", encoding="utf-8") as fh:
        public_key = fh.read().strip()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=host, username="root", password=password, timeout=15, banner_timeout=30, auth_timeout=30)

    command = (
        "mkdir -p /root/.ssh && chmod 700 /root/.ssh && "
        "touch /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && "
        "grep -qxF {key} /root/.ssh/authorized_keys || echo {key} >> /root/.ssh/authorized_keys && "
        "echo SSH_KEY_INSTALLED"
    ).format(key=sh_quote(public_key))

    stdin, stdout, stderr = client.exec_command(command)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    client.close()

    if code != 0:
        raise SystemExit(f"Error instalando llave SSH: {err or out}")

    print(out)


def sh_quote(value):
    return "'" + value.replace("'", "'\"'\"'") + "'"


if __name__ == "__main__":
    main()
