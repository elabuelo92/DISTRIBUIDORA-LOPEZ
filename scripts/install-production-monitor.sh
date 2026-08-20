#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${DL_APP_DIR:-/opt/distribuidora-lopez/app}"
MONITOR_SCRIPT="$APP_DIR/scripts/production-health-monitor.sh"

if [[ ! -f "$MONITOR_SCRIPT" ]]; then
  echo "No existe $MONITOR_SCRIPT" >&2
  exit 1
fi

install -d -m 0755 /var/lib/distribuidora-lopez-monitor
touch /var/log/distribuidora-lopez-monitor.log
chmod 0644 /var/log/distribuidora-lopez-monitor.log
chmod 0755 "$MONITOR_SCRIPT"

install -d -m 0755 /etc/systemd/system/distribuidora-lopez.service.d
cat > /etc/systemd/system/distribuidora-lopez.service.d/resources.conf <<'EOF'
[Service]
MemoryHigh=1G
MemoryMax=1536M
MemorySwapMax=2G
OOMPolicy=stop
Restart=always
RestartSec=5s
EOF

cat > /etc/systemd/system/distribuidora-lopez-monitor.service <<EOF
[Unit]
Description=Monitor de salud Distribuidora Lopez
After=network-online.target distribuidora-lopez.service

[Service]
Type=oneshot
ExecStart=/bin/bash $MONITOR_SCRIPT monitor
User=root
Group=root
EOF

cat > /etc/systemd/system/distribuidora-lopez-monitor.timer <<'EOF'
[Unit]
Description=Ejecuta el monitor Distribuidora Lopez cada minuto

[Timer]
OnBootSec=2min
OnUnitActiveSec=1min
AccuracySec=5s
Persistent=true
Unit=distribuidora-lopez-monitor.service

[Install]
WantedBy=timers.target
EOF

cat > /etc/systemd/system/distribuidora-lopez-preflight.service <<EOF
[Unit]
Description=Comprobacion previa diaria Distribuidora Lopez
After=network-online.target distribuidora-lopez.service

[Service]
Type=oneshot
ExecStart=/bin/bash $MONITOR_SCRIPT preflight
User=root
Group=root
EOF

cat > /etc/systemd/system/distribuidora-lopez-preflight.timer <<'EOF'
[Unit]
Description=Comprobacion diaria antes de las 07:00 ART

[Timer]
OnCalendar=*-*-* 06:45:00 America/Argentina/Buenos_Aires
AccuracySec=30s
Persistent=true
Unit=distribuidora-lopez-preflight.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now distribuidora-lopez-monitor.timer
systemctl enable --now distribuidora-lopez-preflight.timer
systemctl restart distribuidora-lopez.service
sleep 4
systemctl start distribuidora-lopez-monitor.service
systemctl start distribuidora-lopez-preflight.service

systemctl show distribuidora-lopez.service --property=ActiveState,SubState,MainPID,MemoryCurrent,MemoryHigh,MemoryMax,MemorySwapMax --no-pager
systemctl list-timers distribuidora-lopez-monitor.timer distribuidora-lopez-preflight.timer --no-pager
