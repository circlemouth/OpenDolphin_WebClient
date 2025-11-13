#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
FETCH_SCRIPT="${REPO_ROOT}/ops/tools/fetch_license_secrets.sh"
SMOKE_SCRIPT="${REPO_ROOT}/ops/tests/api-smoke-test/run.sh"
DEFAULT_PROFILE="compose"
RUN_ID=""
PROFILE="$DEFAULT_PROFILE"
VAULT_PATH="kv/modernized-server/license/dev"
SLACK_WEBHOOK="${SLACK_LICENSE_ALERT_WEBHOOK:-}"
PAGERDUTY_KEY="${PAGERDUTY_ROUTING_KEY:-}"
SKIP_VAULT=0
SKIP_HTTP=0
SKIP_AUDIT=0
SEQUENCE="1"
LOG_SINCE="20m"
LEGACY_DB_CONTAINER="${LEGACY_DB_CONTAINER:-opendolphin-postgres}"
LEGACY_DB_USER="${POSTGRES_USER:-opendolphin}"
LEGACY_DB_NAME="${POSTGRES_DB:-opendolphin}"
LEGACY_DB_PASSWORD="${POSTGRES_PASSWORD:-opendolphin}"
MODERN_DB_CONTAINER="${MODERN_DB_CONTAINER:-opendolphin-postgres-modernized}"
MODERN_DB_USER="${MODERNIZED_POSTGRES_USER:-opendolphin}"
MODERN_DB_NAME="${MODERNIZED_POSTGRES_DB:-opendolphin_modern}"
MODERN_DB_PASSWORD="${MODERNIZED_POSTGRES_PASSWORD:-opendolphin}"
LEGACY_SERVER_CONTAINER="${LEGACY_SERVER_CONTAINER:-opendolphin-server}"
MODERN_SERVER_CONTAINER="${MODERN_SERVER_CONTAINER:-opendolphin-server-modernized-dev}"
BASE_EXPECT_POST=200
BASE_EXPECT_GET_DOLPHIN=405
SYSTEM_EXPECT_CODES=(404 405)
LATEST_STATUS_FILE="${REPO_ROOT}/artifacts/parity-manual/license/latest_status.json"
STAGE_VAULT_STATUS="pending"
STAGE_VAULT_MESSAGE=""
STAGE_API_STATUS="pending"
STAGE_API_MESSAGE=""
STAGE_AUDIT_STATUS="pending"
STAGE_AUDIT_MESSAGE=""

usage() {
  cat <<'USAGE'
ライセンス監視ジョブ (Vault → API スモーク → d_audit_event 判定 → 通知)。

使い方:
  ops/tools/license_monitor_job.sh [options]

主なオプション:
  --run-id VALUE           追跡用 RUN_ID（default: UTC タイムスタンプ + licenseNightlyZ<SEQ>）
  --sequence N             RUN_ID 末尾 ZN の N を指定（default: 1）
  --profile NAME           ops/tests/api-smoke-test/run.sh --profile（default: compose）
  --vault-path PATH        fetch_license_secrets.sh に渡す Vault パス（default: kv/modernized-server/license/dev）
  --skip-vault             Vault シークレット取得と WildFly 配備をスキップ
  --skip-http              API スモークをスキップ
  --skip-audit             d_audit_event エクスポートとゲート判定をスキップ
  --slack-webhook URL      Slack Webhook URL（未指定時は環境変数 SLACK_LICENSE_ALERT_WEBHOOK を使用）
  --pagerduty-key KEY      PagerDuty Events v2 routing key（未指定時は環境変数 PAGERDUTY_ROUTING_KEY を使用）
  --log-since DURATION     docker logs --since に渡す期間（default: 20m）
  -h, --help               このメッセージを表示
USAGE
}

log_info() { printf '[INFO] %s\n' "$*"; }
log_warn() { printf '[WARN] %s\n' "$*" >&2; }
log_error() { printf '[ERROR] %s\n' "$*" >&2; }
die() { log_error "$*"; exit 1; }

require_cmd() {
  local cmd
  for cmd in "$@"; do
    command -v "$cmd" >/dev/null 2>&1 || die "${cmd} コマンドが見つかりません"
  done
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --run-id)
        [[ $# -ge 2 ]] || die "--run-id には値が必要です"
        RUN_ID="$2"
        shift 2
        ;;
      --sequence)
        [[ $# -ge 2 ]] || die "--sequence には値が必要です"
        SEQUENCE="$2"
        shift 2
        ;;
      --profile)
        [[ $# -ge 2 ]] || die "--profile には値が必要です"
        PROFILE="$2"
        shift 2
        ;;
      --vault-path)
        [[ $# -ge 2 ]] || die "--vault-path には値が必要です"
        VAULT_PATH="$2"
        shift 2
        ;;
      --skip-vault)
        SKIP_VAULT=1
        shift
        ;;
      --skip-http)
        SKIP_HTTP=1
        shift
        ;;
      --skip-audit)
        SKIP_AUDIT=1
        shift
        ;;
      --slack-webhook)
        [[ $# -ge 2 ]] || die "--slack-webhook には値が必要です"
        SLACK_WEBHOOK="$2"
        shift 2
        ;;
      --pagerduty-key)
        [[ $# -ge 2 ]] || die "--pagerduty-key には値が必要です"
        PAGERDUTY_KEY="$2"
        shift 2
        ;;
      --log-since)
        [[ $# -ge 2 ]] || die "--log-since には値が必要です"
        LOG_SINCE="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "未知の引数です: $1"
        ;;
    esac
  done
}

ensure_run_id() {
  if [[ -z "$RUN_ID" ]]; then
    RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)licenseNightlyZ${SEQUENCE}"
  fi
}

prepare_env() {
  if [[ -x "${REPO_ROOT}/tmp/local-bin/vault" ]]; then
    PATH="${REPO_ROOT}/tmp/local-bin:${PATH}"
  fi
  if [[ -x "${REPO_ROOT}/tmp/fakebin/vault" ]]; then
    PATH="${REPO_ROOT}/tmp/fakebin:${PATH}"
  fi
}

init_paths() {
  ARTIFACT_ROOT="${REPO_ROOT}/artifacts/parity-manual/license/${RUN_ID}"
  SMOKE_OUTPUT="${REPO_ROOT}/artifacts/parity-manual/smoke/${RUN_ID}"
  HTTP_DIR="${ARTIFACT_ROOT}/http"
  SECRETS_DIR="${ARTIFACT_ROOT}/secrets"
  LOG_DIR="${ARTIFACT_ROOT}/logs"
  NOTIFY_DIR="${ARTIFACT_ROOT}/notifications"
  mkdir -p "${ARTIFACT_ROOT}" "${HTTP_DIR}" "${SECRETS_DIR}" "${LOG_DIR}" "${NOTIFY_DIR}"
}

stage_status() {
  local stage="$1" status="$2" message="$3"
  case "$stage" in
    VAULT_FETCH)
      STAGE_VAULT_STATUS="$status"
      STAGE_VAULT_MESSAGE="$message"
      ;;
    API_SMOKE)
      STAGE_API_STATUS="$status"
      STAGE_API_MESSAGE="$message"
      ;;
    AUDIT_CHECK)
      STAGE_AUDIT_STATUS="$status"
      STAGE_AUDIT_MESSAGE="$message"
      ;;
  esac
}

run_fetch() {
  if [[ "$SKIP_VAULT" -eq 1 ]]; then
    log_info "[VAULT_FETCH] スキップ"
    stage_status VAULT_FETCH skipped 'manual-skip'
    return 0
  fi
  log_info "[VAULT_FETCH] Vault シークレットを取得し WildFly へ配備"
  if VAULT_FETCH_OUT=$("${FETCH_SCRIPT}" --run-id "$RUN_ID" --vault-path "$VAULT_PATH" --artifact-dir "$SECRETS_DIR" --log-json 2>&1); then
    stage_status VAULT_FETCH success 'completed'
    printf '%s\n' "$VAULT_FETCH_OUT" >"${LOG_DIR}/vault_fetch.log"
    return 0
  else
    printf '%s\n' "$VAULT_FETCH_OUT" >"${LOG_DIR}/vault_fetch.log"
    stage_status VAULT_FETCH failure 'fetch_failed'
    OVERALL_STATUS=failure
    FAILED_STAGE=VAULT_FETCH
    FAILED_REASON='fetch_failed'
    return 1
  fi
}

run_smoke() {
  if [[ "$SKIP_HTTP" -eq 1 ]]; then
    log_info "[API_SMOKE] スキップ"
    stage_status API_SMOKE skipped 'manual-skip'
    return 0
  fi
  log_info "[API_SMOKE] ライセンス API スモークを実行 (profile=${PROFILE})"
  mkdir -p "${REPO_ROOT}/artifacts/parity-manual/smoke"
  local smoke_log="${LOG_DIR}/api_smoke.log"
  if TRACE_RUN_ID="$RUN_ID" "${SMOKE_SCRIPT}" --scenario license --profile "$PROFILE" --run-id "$RUN_ID" --targets modern >"$smoke_log" 2>&1; then
    stage_status API_SMOKE success 'completed'
    sync_http_artifacts
    return 0
  else
    stage_status API_SMOKE failure 'http_failed'
    OVERALL_STATUS=failure
    FAILED_STAGE=API_SMOKE
    FAILED_REASON='http_failed'
    return 1
  fi
}

sync_http_artifacts() {
  if [[ ! -d "$SMOKE_OUTPUT" ]]; then
    log_warn "スモーク出力が見つかりません: $SMOKE_OUTPUT"
    return
  fi
  if ! rsync -a --delete "$SMOKE_OUTPUT"/ "$HTTP_DIR"/; then
    log_warn "HTTP 出力の同期に失敗しました"
  fi
}

collect_logs() {
  log_info "[LOGS] docker logs を採取 (since=${LOG_SINCE})"
  docker logs --since "$LOG_SINCE" "$LEGACY_SERVER_CONTAINER" >"${LOG_DIR}/legacy_server.log" 2>&1 || log_warn "legacy サーバーログ取得に失敗"
  docker logs --since "$LOG_SINCE" "$MODERN_SERVER_CONTAINER" >"${LOG_DIR}/modernized_server.log" 2>&1 || log_warn "modern サーバーログ取得に失敗"
}

export_audit_csv() {
  local label="$1" container="$2" db="$3" user="$4" password="$5" outfile="$6"
  local query
  local safe_run_id="${RUN_ID//\'/\'\'}"
  read -r -d '' query <<SQL
COPY (
  SELECT
    to_char(event_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS event_time_utc,
    action,
    trace_id,
    COALESCE((regexp_replace(payload, E'[\\n\\r]+', '', 'g'))::json->>'status','') AS status,
    COALESCE(REPLACE((regexp_replace(payload, E'[\\n\\r]+', '', 'g'))::json->>'uid', E'\\n', ''),'') AS uid
  FROM d_audit_event
  WHERE action = 'SYSTEM_LICENSE_CHECK'
    AND trace_id = '${safe_run_id}'
  ORDER BY event_time
) TO STDOUT WITH CSV HEADER DELIMITER E'\t';
SQL
  if ! docker exec -i "$container" env PGPASSWORD="$password" \
      psql -U "$user" -d "$db" -v ON_ERROR_STOP=1 -c "$query" >"$outfile"; then
    log_warn "${label} 側 CSV 取得に失敗"
    return 1
  fi
  return 0
}

summarize_tsv() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    printf '0'
    return
  fi
  awk -F '\t' 'NR>1 && NF>0 {count++} END {print count+0}' "$file"
}

count_non_success() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    printf '0'
    return
  fi
  awk -F '\t' 'NR>1 && $4 != "success" {count++} END {print count+0}' "$file"
}

check_http_expectations() {
  local meta_dir="$1"
  if [[ ! -d "$meta_dir" ]]; then
    log_warn "HTTP メタが見つかりません: $meta_dir"
    return 1
  fi
  local post_meta="${meta_dir}/license_post/meta.json"
  local post_body="${meta_dir}/license_post/response.json"
  local get_meta="${meta_dir}/license_get_dolphin/meta.json"
  local system_meta="${meta_dir}/license_get_system/meta.json"
  for f in "$post_meta" "$post_body" "$get_meta" "$system_meta"; do
    if [[ ! -f "$f" ]]; then
      HTTP_FAILURE_REASON="http_artifact_missing"
      return 1
    fi
  done
  MODERN_POST_STATUS=$(jq -r '.status_code' "$post_meta")
  MODERN_POST_BODY=$(tr -d '\r\n[:space:]' <"$post_body" 2>/dev/null || printf '')
  MODERN_GET_STATUS=$(jq -r '.status_code' "$get_meta")
  MODERN_SYSTEM_STATUS=$(jq -r '.status_code' "$system_meta")

  if [[ "$MODERN_POST_STATUS" != "$BASE_EXPECT_POST" ]] || [[ "$MODERN_POST_BODY" != "0" ]]; then
    HTTP_FAILURE_REASON="license_post_unexpected"
    return 1
  fi
  if [[ "$MODERN_GET_STATUS" != "$BASE_EXPECT_GET_DOLPHIN" ]]; then
    HTTP_FAILURE_REASON="license_get_dolphin_unexpected"
    return 1
  fi
  local ok=1
  for code in "${SYSTEM_EXPECT_CODES[@]}"; do
    if [[ "$MODERN_SYSTEM_STATUS" == "$code" ]]; then
      ok=0
      break
    fi
  done
  if [[ "$ok" -ne 0 ]]; then
    HTTP_FAILURE_REASON="license_get_system_unexpected"
    return 1
  fi
  return 0
}

run_audit_stage() {
  if [[ "$SKIP_AUDIT" -eq 1 ]]; then
    log_info "[AUDIT_CHECK] スキップ"
    stage_status AUDIT_CHECK skipped 'manual-skip'
    return 0
  fi
  log_info "[AUDIT_CHECK] d_audit_event をエクスポートしゲート判定"
  local modern_csv="${LOG_DIR}/d_audit_event_modern.tsv"
  local legacy_csv="${LOG_DIR}/d_audit_event_legacy.tsv"
  export_audit_csv modern "$MODERN_DB_CONTAINER" "$MODERN_DB_NAME" "$MODERN_DB_USER" "$MODERN_DB_PASSWORD" "$modern_csv" || true
  export_audit_csv legacy "$LEGACY_DB_CONTAINER" "$LEGACY_DB_NAME" "$LEGACY_DB_USER" "$LEGACY_DB_PASSWORD" "$legacy_csv" || true

  MODERN_AUDIT_COUNT=$(summarize_tsv "$modern_csv")
  MODERN_AUDIT_ERRORS=$(count_non_success "$modern_csv")
  LEGACY_AUDIT_COUNT=$(summarize_tsv "$legacy_csv")

  cat >"${LOG_DIR}/d_audit_event_summary.txt" <<EOF
run_id=${RUN_ID}
modern_count=${MODERN_AUDIT_COUNT}
modern_non_success=${MODERN_AUDIT_ERRORS}
legacy_count=${LEGACY_AUDIT_COUNT}
EOF

  if [[ "$MODERN_AUDIT_COUNT" -lt 1 ]]; then
    AUDIT_FAILURE_REASON='modern_count_zero'
    return 1
  fi
  if [[ "$MODERN_AUDIT_ERRORS" -gt 0 ]]; then
    AUDIT_FAILURE_REASON='modern_status_failure'
    return 1
  fi
  return 0
}

notify_slack() {
  local status="$1" stage="$2" reason="$3"
  if [[ "$status" == "not_triggered" ]]; then
    printf 'status=not_triggered stage=%s reason=%s\n' "$stage" "$reason" >"${NOTIFY_DIR}/slack.log"
    return 0
  fi
  local payload
  payload=$(jq -n --arg text "[license-nightly] RUN_ID=${RUN_ID} ${status} (stage=${stage}, reason=${reason}) → artifacts/parity-manual/license/${RUN_ID}" '{text:$text}')
  if [[ -z "$SLACK_WEBHOOK" ]]; then
    printf 'status=%s reason=%s (no webhook configured)\n' "$status" "$reason" >"${NOTIFY_DIR}/slack.log"
    return 0
  fi
  if curl -sS -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK" >>"${NOTIFY_DIR}/slack.log" 2>&1; then
    printf '\n' >>"${NOTIFY_DIR}/slack.log"
    return 0
  else
    printf '\n[ERROR] Slack 通知に失敗\n' >>"${NOTIFY_DIR}/slack.log"
    return 1
  fi
}

notify_pagerduty() {
  local reason="$1"
  local payload
  payload=$(jq -n --arg routing_key "$PAGERDUTY_KEY" --arg dedup_key "license-nightly" --arg summary "license-nightly ${RUN_ID} ${reason}" '{routing_key:$routing_key, event_action:"trigger", dedup_key:$dedup_key, payload:{summary:$summary, source:"license-monitor", severity:"error"}}')
  if [[ -z "$PAGERDUTY_KEY" ]]; then
    printf 'status=skipped (no routing key) reason=%s\n' "$reason" >"${NOTIFY_DIR}/pagerduty.log"
    return 0
  fi
  if curl -sS -X POST -H 'Content-type: application/json' --data "$payload" https://events.pagerduty.com/v2/enqueue >>"${NOTIFY_DIR}/pagerduty.log" 2>&1; then
    printf '\n' >>"${NOTIFY_DIR}/pagerduty.log"
    return 0
  else
    printf '\n[ERROR] PagerDuty 通知に失敗\n' >>"${NOTIFY_DIR}/pagerduty.log"
    return 1
  fi
}

update_latest_status() {
  jq -n --arg run_id "$RUN_ID" \
        --arg status "$OVERALL_STATUS" \
        --arg stage "$FAILED_STAGE" \
        --arg reason "$FAILED_REASON" \
        --arg modern_count "${MODERN_AUDIT_COUNT:-0}" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '{run_id:$run_id,status:$status,failed_stage:$stage,failed_reason:$reason,modern_count:$modern_count,updated_at:$timestamp}' >"$LATEST_STATUS_FILE"
}

load_previous_status() {
  if [[ -f "$LATEST_STATUS_FILE" ]]; then
    PREV_STATUS=$(jq -r '.status' "$LATEST_STATUS_FILE" 2>/dev/null || printf '')
    PREV_RUN_ID=$(jq -r '.run_id' "$LATEST_STATUS_FILE" 2>/dev/null || printf '')
  else
    PREV_STATUS=""
    PREV_RUN_ID=""
  fi
}

main() {
  parse_args "$@"
  require_cmd docker jq curl rsync awk
  ensure_run_id
  prepare_env
  init_paths
  OVERALL_STATUS=success
  FAILED_STAGE=""
  FAILED_REASON=""
  HTTP_FAILURE_REASON=""
  AUDIT_FAILURE_REASON=""
  MODERN_AUDIT_COUNT=0
  MODERN_AUDIT_ERRORS=0
  LEGACY_AUDIT_COUNT=0
  load_previous_status

  run_fetch || true
  [[ "$OVERALL_STATUS" == "failure" ]] && finalize && return

  run_smoke || true
  if [[ "$OVERALL_STATUS" == "failure" ]]; then
    stage_status AUDIT_CHECK skipped 'api_failed'
    finalize
    return
  fi

  collect_logs || true

  if ! check_http_expectations "${HTTP_DIR}/modernized"; then
    stage_status API_SMOKE failure "${HTTP_FAILURE_REASON:-http_unexpected}"
    OVERALL_STATUS=failure
    FAILED_STAGE=API_SMOKE
    FAILED_REASON="${HTTP_FAILURE_REASON:-http_unexpected}"
    finalize
    return
  fi

  if run_audit_stage; then
    stage_status AUDIT_CHECK success 'completed'
  else
    stage_status AUDIT_CHECK failure "${AUDIT_FAILURE_REASON:-audit_failed}"
    OVERALL_STATUS=failure
    FAILED_STAGE=AUDIT_CHECK
    FAILED_REASON="${AUDIT_FAILURE_REASON:-audit_failed}"
  fi

  finalize
}

finalize() {
  update_latest_status
  if [[ "$OVERALL_STATUS" == "failure" ]]; then
    notify_slack triggered "$FAILED_STAGE" "$FAILED_REASON" || true
    local need_pd=0
    local today="${RUN_ID:0:8}"
    local prev_day="${PREV_RUN_ID:0:8}"
    if [[ "$FAILED_STAGE" == "AUDIT_CHECK" && "$FAILED_REASON" == "modern_count_zero" ]]; then
      need_pd=1
    elif [[ "$PREV_STATUS" == "failure" && "$today" == "$prev_day" ]]; then
      need_pd=1
    fi
    if [[ "$need_pd" -eq 1 ]]; then
      notify_pagerduty "$FAILED_REASON" || true
    else
      printf 'status=not_triggered reason=%s\n' "$FAILED_REASON" >"${NOTIFY_DIR}/pagerduty.log"
    fi
    exit 1
  else
    notify_slack not_triggered SUCCESS ok || true
    printf 'status=not_triggered\n' >"${NOTIFY_DIR}/pagerduty.log"
    exit 0
  fi
}

main "$@"
