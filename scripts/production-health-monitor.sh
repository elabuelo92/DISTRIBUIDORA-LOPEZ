#!/usr/bin/env bash
set -u

SERVICE_NAME="${DL_MONITOR_SERVICE_NAME:-distribuidora-lopez.service}"
HEALTH_URL="${DL_MONITOR_HEALTH_URL:-http://127.0.0.1:8790/api/health}"
STATE_DIR="${DL_MONITOR_STATE_DIR:-/var/lib/distribuidora-lopez-monitor}"
LOG_FILE="${DL_MONITOR_LOG_FILE:-/var/log/distribuidora-lopez-monitor.log}"
FAILURE_LIMIT="${DL_MONITOR_FAILURE_LIMIT:-3}"
MEMORY_HIGH_BYTES="${DL_MONITOR_MEMORY_HIGH_BYTES:-1073741824}"
MEMORY_RESTART_BYTES="${DL_MONITOR_MEMORY_RESTART_BYTES:-1610612736}"
MEMORY_FAILURE_LIMIT="${DL_MONITOR_MEMORY_FAILURE_LIMIT:-2}"
RESTART_COOLDOWN_SECONDS="${DL_MONITOR_RESTART_COOLDOWN_SECONDS:-300}"
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

restart_service() {
  local reason="$1"
  local now last_restart elapsed
  now="$(date +%s)"
  last_restart="$(read_counter "$STATE_DIR/last_restart")"
  [[ "$last_restart" =~ ^[0-9]+$ ]] || last_restart=0
  elapsed=$((now - last_restart))
  if (( elapsed < RESTART_COOLDOWN_SECONDS )); then
    log_event WARN "restart_omitted=cooldown reason=$reason remaining_seconds=$((RESTART_COOLDOWN_SECONDS - elapsed))"
    return 0
  fi

  log_event ERROR "restart_requested=true reason=$reason"
  if systemctl restart "$SERVICE_NAME"; then
    write_counter "$STATE_DIR/last_restart" "$now"
    write_counter "$STATE_DIR/health_failures" 0
    write_counter "$STATE_DIR/memory_failures" 0
    sleep 4
    if curl --silent --show-error --fail --max-time 8 "$HEALTH_URL" >/dev/null; then
      log_event INFO "restart_result=healthy reason=$reason"
    else
      log_event ERROR "restart_result=unhealthy reason=$reason"
    fi
  else
    log_event ERROR "restart_result=failed reason=$reason"
    return 1
  fi
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
  health_failures=0
  write_counter "$STATE_DIR/health_failures" 0
else
  health_failures=$((health_failures + 1))
  write_counter "$STATE_DIR/health_failures" "$health_failures"
  log_event WARN "health=failed active=$active_state code=${health_code:-none} consecutive=$health_failures"
fi

if (( memory_current >= MEMORY_RESTART_BYTES )); then
  memory_failures=$((memory_failures + 1))
  write_counter "$STATE_DIR/memory_failures" "$memory_failures"
  log_event WARN "memory=critical bytes=$memory_current consecutive=$memory_failures"
elif (( memory_current >= MEMORY_HIGH_BYTES )); then
  memory_failures=0
  write_counter "$STATE_DIR/memory_failures" 0
  log_event WARN "memory=high bytes=$memory_current"
else
  memory_failures=0
  write_counter "$STATE_DIR/memory_failures" 0
fi

if (( health_failures >= FAILURE_LIMIT )); then
  restart_service "health_failures_$health_failures"
elif (( memory_failures >= MEMORY_FAILURE_LIMIT )); then
  restart_service "memory_critical_$memory_current"
elif [[ "$MODE" == "preflight" ]]; then
  log_event INFO "preflight=ok active=$active_state health_code=${health_code:-none} latency_seconds=${health_seconds:-unknown} memory_bytes=$memory_current"
fi

exit 0
