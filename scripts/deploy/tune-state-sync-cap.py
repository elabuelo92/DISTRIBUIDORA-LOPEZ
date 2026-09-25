"""Ajusta solo el limite de sincronizaciones del ERP con respaldo y rollback."""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".deploy-tools" / "python"))

import paramiko


HOST = os.environ.get("VULTR_HOST", "216.128.169.34").strip()
USER = os.environ.get("VULTR_USER", "dlops").strip()
KEY_PATH = Path(os.environ.get("VULTR_PRIVATE_KEY_PATH", ROOT / ".deploy-tools" / "dl_vultr_ed25519"))


def main():
    if sys.argv[1:] != ["4"]:
        raise SystemExit("Uso: tune-state-sync-cap.py 4")

    command = r"""
set -euo pipefail
APP=/opt/distribuidora-lopez/app
DATA=/opt/distribuidora-lopez/data
ENV=/etc/distribuidora-lopez.env
SERVICE=distribuidora-lopez.service
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="/opt/distribuidora-lopez/backups/state-sync-cap-$STAMP"
TARGET_DATE="$(TZ=America/Argentina/Buenos_Aires date +%F)"

cd "$APP"
test "$(git rev-parse --short HEAD)" = "1c0f49b"
test "$(systemctl is-active "$SERVICE")" = "active"
test ! -e "$DATA/maintenance-mode.json"
CURRENT="$(sudo sed -n 's/^DL_MAX_FULL_STATE_RESPONSES=//p' "$ENV" | tail -n 1)"
if [ -n "$CURRENT" ] && [ "$CURRENT" != "2" ]; then
  echo "ERROR: limite previo inesperado: $CURRENT"
  exit 31
fi

sudo mkdir "$BACKUP"
sudo cp "$ENV" "$BACKUP/distribuidora-lopez.env"
sudo chown dlops:dlops "$BACKUP"
rollback() {
  CODE="$?"
  trap - ERR
  echo "ROLLBACK=STATE_SYNC_CAP"
  sudo cp "$BACKUP/distribuidora-lopez.env" "$ENV" || true
  sudo systemctl restart "$SERVICE" || true
  sudo rm -f "$DATA/maintenance-mode.json" || true
  exit "$CODE"
}
trap rollback ERR

printf '%s\n' '{"active":true,"startedAt":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'","message":"Ajuste preventivo de sincronizacion"}' | sudo tee "$DATA/maintenance-mode.json" >/dev/null
sudo chown dlops:dlops "$DATA/maintenance-mode.json"
sudo systemctl stop "$SERVICE"
sudo tar -C /opt/distribuidora-lopez -czf "$BACKUP/data.tar.gz" data
sudo node scripts/order-dispatch-snapshot.js create --state "$DATA/demo-state.json" --date "$TARGET_DATE" --output "$BACKUP/orders-before.json" >/dev/null

if sudo grep -q '^DL_MAX_FULL_STATE_RESPONSES=' "$ENV"; then
  sudo sed -i 's/^DL_MAX_FULL_STATE_RESPONSES=.*/DL_MAX_FULL_STATE_RESPONSES=4/' "$ENV"
else
  printf '%s\n' 'DL_MAX_FULL_STATE_RESPONSES=4' | sudo tee -a "$ENV" >/dev/null
fi
sudo systemctl start "$SERVICE"
for attempt in $(seq 1 20); do
  if curl -fsS --max-time 5 http://127.0.0.1:8790/api/health > "$BACKUP/health-local.json"; then break; fi
  sleep 1
done
jq -e '.ok == true and .stateSync.maxConcurrent == 4 and .security.license.ok == true and .security.integrity.ok == true' "$BACKUP/health-local.json" >/dev/null

sudo node scripts/order-dispatch-snapshot.js create --state "$DATA/demo-state.json" --date "$TARGET_DATE" --output "$BACKUP/orders-after.json" >/dev/null
sudo node scripts/order-dispatch-snapshot.js compare --before "$BACKUP/orders-before.json" --after "$BACKUP/orders-after.json" --output "$BACKUP/orders-comparison.json" >/dev/null
sudo chown -R dlops:dlops "$BACKUP"
sudo rm -f "$DATA/maintenance-mode.json"
curl -fsS --max-time 15 https://lopez.gruporochaapp.com/api/health > "$BACKUP/health-public.json"
jq -e '.ok == true and .maintenance.active == false and .stateSync.maxConcurrent == 4' "$BACKUP/health-public.json" >/dev/null
trap - ERR

echo "BACKUP=$BACKUP"
echo "COMMIT=$(git rev-parse --short HEAD)"
echo "SERVICE=$(systemctl is-active "$SERVICE")"
echo "PID=$(systemctl show "$SERVICE" -p MainPID --value)"
echo "SYNC_LIMIT=$(jq -r '.stateSync.maxConcurrent' "$BACKUP/health-public.json")"
echo "ORDERS=$(jq -r '.summary.orders' "$BACKUP/orders-before.json")"
echo "ORDER_HASH_BEFORE=$(jq -r '.beforeHash' "$BACKUP/orders-comparison.json")"
echo "ORDER_HASH_AFTER=$(jq -r '.afterHash' "$BACKUP/orders-comparison.json")"
echo "ORDER_DIFFERENCES=$(jq -c '{missing:(.missing|length),added:(.added|length),changed:(.changed|length),summaryDifferences:(.summaryDifferences|length)}' "$BACKUP/orders-comparison.json")"
"""

    key = paramiko.Ed25519Key.from_private_key_file(str(KEY_PATH))
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(hostname=HOST, username=USER, pkey=key, timeout=20, banner_timeout=30, auth_timeout=30)
    try:
        _, stdout, stderr = client.exec_command(command, timeout=300)
        output = stdout.read().decode("utf-8", errors="replace")
        errors = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        if output:
            print(output, end="")
        if errors:
            print(errors, end="", file=sys.stderr)
        if code:
            raise SystemExit(code)
    finally:
        client.close()


if __name__ == "__main__":
    main()
