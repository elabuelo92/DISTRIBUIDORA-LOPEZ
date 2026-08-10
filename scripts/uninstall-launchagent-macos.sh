#!/usr/bin/env bash
set -euo pipefail

LABEL="ar.com.distribuidoralopez.server"
PLIST_FILE="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ -f "$PLIST_FILE" ]; then
  launchctl bootout "gui/$(id -u)" "$PLIST_FILE" >/dev/null 2>&1 || true
  rm -f "$PLIST_FILE"
  echo "LaunchAgent eliminado."
else
  echo "No existe LaunchAgent instalado."
fi
