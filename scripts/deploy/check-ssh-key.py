import os
import sys

sys.path.insert(0, os.path.join(os.getcwd(), ".deploy-tools", "python"))

import paramiko


def main():
    host = os.environ.get("VULTR_HOST", "216.128.169.34").strip()
    username = os.environ.get("VULTR_USER", "dlops").strip()
    key_path = os.environ.get("VULTR_PRIVATE_KEY_PATH", r"C:\DistribuidoraLopez\.ssh\dl_vultr_ed25519")
    key = paramiko.Ed25519Key.from_private_key_file(key_path)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=host,
        username=username,
        pkey=key,
        timeout=15,
        banner_timeout=30,
        auth_timeout=30,
    )
    stdin, stdout, stderr = client.exec_command("whoami && hostname && uname -a")
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    client.close()
    if code != 0:
        raise SystemExit(err or out)
    print(out)


if __name__ == "__main__":
    main()
