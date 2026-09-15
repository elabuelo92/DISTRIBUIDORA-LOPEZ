#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
monitor="$root/scripts/production-health-monitor.sh"
tmp="$(mktemp -d)"
trap '[[ -d "$tmp" ]] && rm -r -- "$tmp"' EXIT
export TEST_RESTARTS="$tmp/restarts"

systemctl() {
  case "$1" in
    is-active) printf '%s\n' "${FAKE_ACTIVE:-active}" ;;
    show) printf '%s\n' "${FAKE_MEMORY:-0}" ;;
    restart) printf 'restart\n' >> "$TEST_RESTARTS" ;;
    *) return 1 ;;
  esac
}

curl() {
  if [[ "${FAKE_HEALTH:-ok}" == "fail" ]]; then
    printf '\n000 8.000\n'
    return 22
  fi
  printf '{"ok":true}\n200 0.010\n'
}

logger() { :; }
export -f systemctl curl logger

run_monitor() {
  DL_MONITOR_STATE_DIR="$tmp/state" DL_MONITOR_LOG_FILE="$tmp/monitor.log" \
    FAKE_ACTIVE="${FAKE_ACTIVE:-active}" FAKE_HEALTH="${FAKE_HEALTH:-ok}" \
    FAKE_MEMORY="${FAKE_MEMORY:-0}" bash "$monitor" "${1:-monitor}"
}

for ((i = 0; i < 7; i++)); do
  FAKE_HEALTH=fail run_monitor
done
[[ "$(grep -c 'alert=operator_required reason=health_warning' "$tmp/monitor.log")" == 1 ]]
[[ "$(grep -c 'alert=operator_required reason=health ' "$tmp/monitor.log")" == 1 ]]
[[ ! -e "$TEST_RESTARTS" ]]

run_monitor
grep -q 'health=recovered' "$tmp/monitor.log"
for ((i = 0; i < 6; i++)); do
  FAKE_HEALTH=fail run_monitor
done
[[ "$(grep -c 'alert=operator_required reason=health ' "$tmp/monitor.log")" == 2 ]]

run_monitor
FAKE_MEMORY=1610612736 run_monitor
FAKE_MEMORY=1610612736 run_monitor
[[ "$(grep -c 'alert=operator_required reason=memory ' "$tmp/monitor.log")" == 1 ]]
[[ ! -e "$TEST_RESTARTS" ]]

FAKE_ACTIVE=inactive run_monitor preflight
grep -q 'alert=operator_required reason=service ' "$tmp/monitor.log"
grep -q 'preflight=attention_required' "$tmp/monitor.log"
[[ ! -e "$TEST_RESTARTS" ]]

printf 'OK: timeout, memoria, recuperacion y servicio inactivo alertan sin reiniciar.\n'
