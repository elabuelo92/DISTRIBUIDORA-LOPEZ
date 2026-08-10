#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-8790}"

echo "== Distribuidora Lopez / preflight macOS =="
echo "Carpeta: $PROJECT_DIR"

if command -v node >/dev/null 2>&1; then
  echo "Node: $(node -v)"
else
  echo "Node: NO INSTALADO"
fi

if command -v lsof >/dev/null 2>&1; then
  echo "Puerto $PORT:"
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN || true
fi

if command -v lpstat >/dev/null 2>&1; then
  echo "Impresoras:"
  lpstat -d || true
  lpstat -p || true
fi

echo "Red local:"
if command -v ipconfig >/dev/null 2>&1; then
  ipconfig getifaddr en0 2>/dev/null || true
  ipconfig getifaddr en1 2>/dev/null || true
fi

if command -v curl >/dev/null 2>&1; then
  echo "Health:"
  curl -fsS "http://127.0.0.1:$PORT/api/health" || true
  echo
fi
