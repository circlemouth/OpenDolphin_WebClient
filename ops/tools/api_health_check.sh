#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${API_HEALTH_BASE_URL:-}"
RUN_ID="${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
LOG_FILE="${API_HEALTH_LOG_FILE:-}"

if [[ -z "$BASE_URL" ]]; then
  echo "API_HEALTH_BASE_URL is required" >&2
  exit 1
fi

log_line() {
  local line="$1"
  if [[ -n "$LOG_FILE" ]]; then
    printf '%s\n' "$line" | tee -a "$LOG_FILE"
  else
    printf '%s\n' "$line"
  fi
}

log_line "api_health_check runId=${RUN_ID} baseUrl=${BASE_URL}"

# path:allowed_status_csv
ENDPOINTS=(
  "/api/admin/config:200,401,403"
  "/api/admin/delivery:200,401,403"
  "/api/admin/security/header-credentials/cache:200,401,403"
)

for entry in "${ENDPOINTS[@]}"; do
  path="${entry%%:*}"
  allowed="${entry#*:}"
  url="${BASE_URL}${path}"
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  log_line "${status} ${path}"

  if [[ "$status" =~ ^5 ]]; then
    log_line "FAIL ${path} status=${status}"
    exit 1
  fi

  IFS=',' read -r -a allowed_list <<< "$allowed"
  allowed_ok=0
  for code in "${allowed_list[@]}"; do
    if [[ "$status" == "$code" ]]; then
      allowed_ok=1
      break
    fi
  done
  if [[ "$allowed_ok" -ne 1 ]]; then
    log_line "FAIL ${path} status=${status} allowed=${allowed}"
    exit 1
  fi

done

log_line "api_health_check OK"
