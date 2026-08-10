#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
DATA_DIR_DEFAULT="$PROJECT_DIR/data"
LOG_FILE="$LOG_DIR/server.log"

mkdir -p "$LOG_DIR" "$DATA_DIR_DEFAULT"

export PORT="${PORT:-8790}"
export DL_HOST="${DL_HOST:-0.0.0.0}"
export DATA_DIR="${DATA_DIR:-$DATA_DIR_DEFAULT}"
export STATE_FILE="${STATE_FILE:-$DATA_DIR/demo-state.json}"
export USERS_FILE="${USERS_FILE:-$DATA_DIR/users.json}"
export DL_SUPPORT_WHATSAPP_PHONE="${DL_SUPPORT_WHATSAPP_PHONE:-5493512410535}"
export DL_STOCK_PRINTER_NAME="${DL_STOCK_PRINTER_NAME:-}"

NODE_BIN="${NODE_BIN:-}"
if [ -z "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node || true)"
fi

if [ -z "$NODE_BIN" ]; then
  echo "Node.js no esta instalado o no esta en PATH. Instalar Node.js LTS y volver a ejecutar." >&2
  exit 1
fi

cd "$PROJECT_DIR"
echo "$(date '+%Y-%m-%dT%H:%M:%S') - Starting Distribuidora Lopez on $DL_HOST:$PORT" >> "$LOG_FILE"
exec "$NODE_BIN" server.js >> "$LOG_FILE" 2>&1

