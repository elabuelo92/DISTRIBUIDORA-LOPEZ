#!/usr/bin/env bash
set -u

SERVICE_NAME="${DL_MONITOR_SERVICE_NAME:-distribuidora-lopez.service}"
HEALTH_URL="${DL_MONITOR_HEALTH_URL:-http://127.0.0.1:8790/api/health/live}"
STATE_DIR="${DL_MONITOR_STATE_DIR:-/var/lib/distribuidora-lopez-monitor}"
LOG_FILE="${DL_MONITOR_LOG_FILE:-/var/log/distribuidora-lopez-monitor.log}"
FAILURE_LIMIT="${DL_MONITOR_FAILURE_LIMIT:-6}"
MEMORY_HIGH_BYTES="${DL_MONITOR_MEMORY_HIGH_BYTES:-1073741824}"
MEMORY_CRITICAL_BYTES="${DL_MONITOR_MEMORY_CRITICAL_BYTES:-${DL_MONITOR_MEMORY_RESTART_BYTES:-1610612736}}"
MEMORY_FAILURE_LIMIT="${DL_MONITOR_MEMORY_FAILURE_LIMIT:-2}"
ALERT_REPEAT_SECONDS="${DL_MONITOR_ALERT_REPEAT_SECONDS:-900}"
MODE="${1:-monitor}"

mkdir -p "$STATE_DIR"
touch "$LOG_FILE"

read_counter() {
  local file="$1"
  if [[ -f "$file" ]]; then
    cat "$file" 2>/dev/null || printf '0'
  else
    printf '0'
  fi
}

write_counter() {
  printf '%s' "$2" > "$1"
}

log_event() {
  local level="$1"
  shift
  local message="$*"
  local line
  line="$(date --iso-8601=seconds) level=$level mode=$MODE $message"
  printf '%s\n' "$line" >> "$LOG_FILE"
  logger -t distribuidora-lopez-monitor -- "$line"
}

alert_operator() {
  local reason="$1"
  local now last_alert elapsed alert_file
  now="$(date +%s)"
  alert_file="$STATE_DIR/last_alert_$reason"
  last_alert="$(read_counter "$alert_file")"
  [[ "$last_alert" =~ ^[0-9]+$ ]] || last_alert=0
  elapsed=$((now - last_alert))
  if (( elapsed < ALERT_REPEAT_SECONDS )); then
    return 0
  fi
  write_counter "$alert_file" "$now"
  log_event ERROR "alert=operator_required reason=$reason active=$active_state health_code=${health_code:-none} memory_bytes=$memory_current action=diagnose_no_automatic_restart"
}

health_failures="$(read_counter "$STATE_DIR/health_failures")"
memory_failures="$(read_counter "$STATE_DIR/memory_failures")"
[[ "$health_failures" =~ ^[0-9]+$ ]] || health_failures=0
[[ "$memory_failures" =~ ^[0-9]+$ ]] || memory_failures=0

active_state="$(systemctl is-active "$SERVICE_NAME" 2>/dev/null || true)"
memory_current="$(systemctl show "$SERVICE_NAME" --property=MemoryCurrent --value 2>/dev/null || printf '0')"
[[ "$memory_current" =~ ^[0-9]+$ ]] || memory_current=0

health_output="$(curl --silent --show-error --fail --max-time 8 --write-out $'\n%{http_code} %{time_total}' "$HEALTH_URL" 2>/dev/null || true)"
health_meta="$(printf '%s\n' "$health_output" | tail -n 1)"
health_code="$(printf '%s' "$health_meta" | awk '{print $1}')"
health_seconds="$(printf '%s' "$health_meta" | awk '{print $2}')"

if [[ "$active_state" == "active" && "$health_code" == "200" ]]; then
  if (( health_failures > 0 )); then
    log_event INFO "health=recovered previous_failures=$health_failures"
    write_counter "$STATE_DIR/last_alert_health" 0
    write_counter "$STATE_DIR/last_alert_health_warning" 0
  fi
  write_counter "$STATE_DIR/last_alert_service" 0
  health_failures=0
  write_counter "$STATE_DIR/health_failures" 0
else
  health_failures=$((health_failures + 1))
  write_counter "$STATE_DIR/health_failures" "$health_failures"
  log_event WARN "health=failed active=$active_state code=${health_code:-none} consecutive=$health_failures"
fi

if (( memory_current >= MEMORY_CRITICAL_BYTES )); then
  memory_failures=$((memory_failures + 1))
  write_counter "$STATE_DIR/memory_failures" "$memory_failures"
  log_event WARN "memory=critical bytes=$memory_current consecutive=$memory_failures"
elif (( memory_current >= MEMORY_HIGH_BYTES )); then
  memory_failures=0
  write_counter "$STATE_DIR/memory_failures" 0
  log_event WARN "memory=high bytes=$memory_current"
else
  if (( memory_failures > 0 )); then
    log_event INFO "memory=recovered previous_failures=$memory_failures"
    write_counter "$STATE_DIR/last_alert_memory" 0
  fi
  memory_failures=0
  write_counter "$STATE_DIR/memory_failures" 0
fi

if [[ "$active_state" != "active" ]]; then
  alert_operator service
fi
if (( health_failures >= 3 && health_failures < FAILURE_LIMIT )); then
  alert_operator health_warning
fi
if (( health_failures >= FAILURE_LIMIT )); then
  alert_operator health
fi
if (( memory_failures >= MEMORY_FAILURE_LIMIT )); then
  alert_operator memory
fi
if [[ "$MODE" == "preflight" ]]; then
  if [[ "$active_state" == "active" && "$health_code" == "200" && "$memory_current" -lt "$MEMORY_CRITICAL_BYTES" ]]; then
    log_event INFO "preflight=ok active=$active_state health_code=$health_code latency_seconds=${health_seconds:-unknown} memory_bytes=$memory_current"
  else
    log_event ERROR "preflight=attention_required active=$active_state health_code=${health_code:-none} latency_seconds=${health_seconds:-unknown} memory_bytes=$memory_current"
  fi
fi

exit 0
