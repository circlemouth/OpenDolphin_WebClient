#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
JavaTime 出力監視サンプルを採取するユーティリティ

使用方法:
  bash ops/monitoring/scripts/java-time-sample.sh [--dry-run]

オプション:
  --dry-run   外部コマンドを実行せずに手順だけを表示
  -h, --help  このヘルプを表示

主要な環境変数:
  JAVA_TIME_OUTPUT_DIR      サンプル保存先 (default: tmp/java-time)
  JAVA_TIME_PSQL_CMD        d_audit_event 取得用の psql コマンド
                             (default: docker compose exec -T modernized-db psql -U dolphin -d opendolphin)
  JAVA_TIME_BASE_URL_MODERN モダナイズ版 API のベース URL (default: http://localhost:18080/opendolphin/api)
  JAVA_TIME_AUTH_HEADER     Authorization ヘッダー（例: "Authorization: Bearer xxxx"）
  JAVATIME_BEARER_TOKEN     JAVA_TIME_AUTH_HEADER が未指定の場合に Bearer トークンとして利用
  JAVA_TIME_TRACE_PREFIX    X-Trace-Id のプレフィックス (default: java-time-cron)
  JAVA_TIME_TOUCH_PATIENT   sendPackage 用 patientId (default: 000001)
  JAVA_TIME_TOUCH_DEPT      sendPackage 用 department (default: 01)
  JAVA_TIME_TOUCH_BUNDLE    sendPackage 用 bundleList JSON（未指定の場合は空配列）
  JAVA_TIME_AUDIT_LIMIT     audit サンプル件数 (default: 20)
USAGE
}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*" >&2
}

fail() {
  log "ERROR: $*"
  exit 1
}

ensure_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "コマンド '$1' が見つかりません"
  fi
}

DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      exit 1
      ;;
  esac
done

ensure_cmd date
ensure_cmd jq
ensure_cmd curl

OUTPUT_ROOT="${JAVA_TIME_OUTPUT_DIR:-tmp/java-time}"
LOG_DIR="$OUTPUT_ROOT/logs"
DATE_STAMP="$(date +%Y%m%d)"
AUDIT_FILE="$OUTPUT_ROOT/audit-${DATE_STAMP}.sql"
ORCA_REQUEST_FILE="$OUTPUT_ROOT/orca-request-${DATE_STAMP}.json"
ORCA_RESPONSE_FILE="$OUTPUT_ROOT/orca-response-${DATE_STAMP}.json"
TOUCH_REQUEST_FILE="$OUTPUT_ROOT/touch-request-${DATE_STAMP}.json"
TOUCH_RESPONSE_FILE="$OUTPUT_ROOT/touch-response-${DATE_STAMP}.json"
SUMMARY=()

mkdir -p "$OUTPUT_ROOT" "$LOG_DIR"

PSQL_CMD_STR="${JAVA_TIME_PSQL_CMD:-docker compose exec -T modernized-db psql -U dolphin -d opendolphin}"
read -r -a PSQL_CMD <<<"$PSQL_CMD_STR"

BASE_URL_MODERN="${JAVA_TIME_BASE_URL_MODERN:-${BASE_URL_MODERN:-http://localhost:18080/opendolphin/api}}"
BASE_URL_MODERN="${BASE_URL_MODERN%/}"
if [[ "$BASE_URL_MODERN" != */api ]]; then
  BASE_URL_MODERN="${BASE_URL_MODERN}/api"
fi
TRACE_PREFIX="${JAVA_TIME_TRACE_PREFIX:-java-time-cron}"
AUTH_HEADER_VALUE="${JAVA_TIME_AUTH_HEADER:-}"
if [[ -z "$AUTH_HEADER_VALUE" && -n "${JAVATIME_BEARER_TOKEN:-}" ]]; then
  AUTH_HEADER_VALUE="Authorization: Bearer ${JAVATIME_BEARER_TOKEN}"
fi

ISO8601_REGEX='^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?([+-][0-9]{2}:[0-9]{2}|Z)$'
AUDIT_LIMIT="${JAVA_TIME_AUDIT_LIMIT:-20}"
TOUCH_PATIENT="${JAVA_TIME_TOUCH_PATIENT:-000001}"
TOUCH_DEPT="${JAVA_TIME_TOUCH_DEPT:-01}"
TOUCH_BUNDLE_JSON="${JAVA_TIME_TOUCH_BUNDLE:-[]}"

log "OUTPUT_ROOT = $OUTPUT_ROOT"
log "BASE_URL_MODERN = $BASE_URL_MODERN"
(( DRY_RUN )) && log "DRY-RUN モード: 外部コマンドは実行されません"

generate_trace_id() {
  printf '%s-%s' "$TRACE_PREFIX" "$(date +%s)"
}

append_summary() {
  SUMMARY+=("$1")
}

check_iso8601() {
  local value="$1"
  local label="$2"
  [[ -z "$value" ]] && { log "WARN: $label が空または null"; return; }
  if [[ "$value" =~ $ISO8601_REGEX ]]; then
    log "OK: $label = $value"
  else
    log "WARN: $label が ISO8601 形式ではありません -> $value"
  fi
}

collect_audit_samples() {
  local sql
  read -r -d '' sql <<SQL || true
\\pset tuples_only on
\\pset pager off
SELECT id,
       event_time,
       action,
       payload::jsonb ->> 'issuedAt' AS issued_at_iso,
       payload::jsonb #>> '{request,createdAt}' AS request_created_at
  FROM d_audit_event
 WHERE action IN ('ORCA_INTERACTION','TOUCH_SENDPACKAGE','TOUCH_SENDPACKAGE2')
 ORDER BY event_time DESC
 LIMIT ${AUDIT_LIMIT};
SQL

  log "d_audit_event サンプルを ${AUDIT_FILE} へ書き出します"
  if (( DRY_RUN )); then
    log "[DRY-RUN] ${PSQL_CMD_STR} <SQL> > ${AUDIT_FILE}"
  else
    printf '%s\n' "$sql" | "${PSQL_CMD[@]}" >"$AUDIT_FILE"
  fi
  append_summary "audit_sql=${AUDIT_FILE}"
}

build_orca_body() {
  local trace_id="$1"
  local issued_at
  issued_at="$(date --iso-8601=seconds)"
  cat <<JSON
{
  "codes1": ["620001601"],
  "codes2": ["610007155"],
  "issuedAt": "${issued_at}",
  "traceId": "${trace_id}"
}
JSON
}

invoke_orca() {
  local trace_id body
  trace_id="$(generate_trace_id)"
  body="$(build_orca_body "$trace_id")"
  log "ORCA interaction サンプル (trace: ${trace_id}) を取得します"

  if (( DRY_RUN )); then
    log "[DRY-RUN] curl -X PUT ${BASE_URL_MODERN}/orca/interaction"
  else
    printf '%s\n' "$body" >"$ORCA_REQUEST_FILE"
  fi

  append_summary "orca_request=${ORCA_REQUEST_FILE}"
  append_summary "orca_response=${ORCA_RESPONSE_FILE}"

  if (( DRY_RUN )); then
    return
  fi

  local curl_args=(-sS -X PUT "$BASE_URL_MODERN/orca/interaction" -H 'Content-Type: application/json' -H "X-Trace-Id: ${trace_id}")
  if [[ -n "$AUTH_HEADER_VALUE" ]]; then
    curl_args+=(-H "$AUTH_HEADER_VALUE")
  fi
  curl "${curl_args[@]}" --data-binary @"$ORCA_REQUEST_FILE" >"$ORCA_RESPONSE_FILE"

  jq -r '
    [
      {"label":"issuedAt","value":.issuedAt},
      (.result[]? | {"label":"result.timestamp","value":.timestamp})
    ]
    | map(select(.value != null))
    | .[]
    | "\(.label)\t\(.value)"
  ' "$ORCA_RESPONSE_FILE" | while IFS=$'\t' read -r label value; do
    check_iso8601 "$value" "ORCA:$label"
  done
}

build_touch_body() {
  local trace_id="$1"
  local issued_at
  issued_at="$(date --iso-8601=seconds)"
  cat <<JSON
{
  "issuedAt": "${issued_at}",
  "traceId": "${trace_id}",
  "patientId": "${TOUCH_PATIENT}",
  "department": "${TOUCH_DEPT}",
  "bundleList": ${TOUCH_BUNDLE_JSON}
}
JSON
}

invoke_touch() {
  local trace_id body
  trace_id="$(generate_trace_id)"
  body="$(build_touch_body "$trace_id")"
  log "Touch sendPackage サンプル (trace: ${trace_id}) を取得します"

  if (( DRY_RUN )); then
    log "[DRY-RUN] curl -X POST ${BASE_URL_MODERN}/touch/sendPackage"
  else
    printf '%s\n' "$body" >"$TOUCH_REQUEST_FILE"
  fi

  append_summary "touch_request=${TOUCH_REQUEST_FILE}"
  append_summary "touch_response=${TOUCH_RESPONSE_FILE}"

  if (( DRY_RUN )); then
    return
  fi

  local curl_args=(-sS -X POST "$BASE_URL_MODERN/touch/sendPackage" -H 'Content-Type: application/json' -H "X-Trace-Id: ${trace_id}")
  if [[ -n "$AUTH_HEADER_VALUE" ]]; then
    curl_args+=(-H "$AUTH_HEADER_VALUE")
  fi
  curl "${curl_args[@]}" --data-binary @"$TOUCH_REQUEST_FILE" >"$TOUCH_RESPONSE_FILE"

  jq -r '
    [
      {"label":"issuedAt","value":.issuedAt},
      (.bundleList[]? | {"label":"bundle.startedAt","value":.startedAt}),
      (.bundleList[]? | {"label":"bundle.completedAt","value":.completedAt})
    ]
    | map(select(.value != null))
    | .[]
    | "\(.label)\t\(.value)"
  ' "$TOUCH_RESPONSE_FILE" | while IFS=$'\t' read -r label value; do
    check_iso8601 "$value" "Touch:$label"
  done
}

collect_audit_samples
invoke_orca
invoke_touch

printf '\n=== JavaTime サンプル出力 ===\n'
for entry in "${SUMMARY[@]}"; do
  printf ' - %s\n' "$entry"
done

if (( DRY_RUN )); then
  printf '\n※ --dry-run のため外部 API にはアクセスしていません。\n'
fi
