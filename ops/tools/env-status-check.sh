#!/usr/bin/env bash
# docker compose ps / serverinfo ヘルスチェック / ログ採取を 1 コマンドで実行するユーティリティ。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

RUN_ID=""
OUTPUT_ROOT="${REPO_ROOT}/artifacts/parity-manual/env-status"
LEGACY_URL="http://localhost:8080/openDolphin/resources/serverinfo/jamri"
MODERN_URL="http://localhost:9080/openDolphin/resources/serverinfo/jamri"
AUTH_USER="9001:doctor1"
AUTH_PASSWORD="doctor2025"
BASIC_AUTH_FILE=""
BASIC_AUTH_HEADER=""
CURL_MAX_TIME="${ENV_STATUS_CURL_MAX_TIME:-10}"
PROJECT_NAME="${PROJECT_NAME:-legacy-vs-modern}"
LEGACY_NOTE=""
MODERN_NOTE=""
SKIP_LEGACY=0
SKIP_MODERN=0
OTEL_PROFILES=()

DEFAULT_COMPOSE_FILES=(
  "${REPO_ROOT}/docker-compose.yml"
  "${REPO_ROOT}/ops/base/docker-compose.yml"
  "${REPO_ROOT}/docker-compose.modernized.dev.yml"
)
COMPOSE_FILES=()
COMPOSE_PROFILE_ARGS=()

DEFAULT_LOG_TARGETS=(
  server
  server-modernized-dev
)
LOG_TARGETS=()
LOG_TAIL="${ENV_STATUS_LOG_TAIL:-200}"

COMPOSE_CMD=()

usage() {
  cat <<'USAGE'
usage:
  ops/tools/env-status-check.sh [options]

options:
  --run-id VALUE        RUN_ID を明示指定（default: UTC 時刻ベースで自動生成）
  --output-dir DIR      artifacts 直下以外へ保存する場合に指定
  --legacy-url URL      Legacy (8080) 側 serverinfo URL（default: localhost:8080）
  --modern-url URL      Modernized (9080) 側 serverinfo URL（default: localhost:9080）
  --user VALUE          `userName` ヘッダー値（default: 9001:doctor1）
  --password VALUE      `password` ヘッダー値（default: doctor2025）
  --basic-auth-file FILE Basic 認証で送信する `username:password` の文字列を 1 行で保存したファイル
  --max-time SEC        curl の --max-time 値（default: 10）
  --project-name NAME   docker compose の --project-name（default: legacy-vs-modern）
  --otel-profile NAME   docker compose --profile を追加指定（例: otlp）。複数指定可。
  --compose-file FILE   追加の compose ファイル。複数指定可
  --log-target NAME     docker compose logs を採取するサービス。複数指定可
  --log-tail LINES      logs --tail の行数（default: 200）
  --legacy-note TEXT    legacy.meta.json の notes に追記する文言
  --modern-note TEXT    modern.meta.json の notes に追記する文言
  --skip-legacy         Legacy 8080 への curl をスキップ
  --skip-modern         Modernized 9080 への curl をスキップ
  -h, --help            このメッセージを表示

環境変数:
  ENV_STATUS_COMPOSE_FILES  スペース区切りで compose ファイルリストを上書き
  ENV_STATUS_LOG_TARGETS    デフォルトログ採取ターゲットを上書き（スペース区切り）
  ENV_STATUS_LOG_TAIL       docker compose logs --tail 行数を上書き
  ENV_STATUS_CURL_MAX_TIME  curl --max-time の秒数
USAGE
}

log_info() { printf '[INFO] %s\n' "$*"; }
log_warn() { printf '[WARN] %s\n' "$*" >&2; }
abort() { printf '[ERROR] %s\n' "$*" >&2; exit 1; }

json_escape() {
  local input="${1-}"
  input="${input//\\/\\\\}"
  input="${input//\"/\\\"}"
  input="${input//$'\n'/\\n}"
  input="${input//$'\r'/\\r}"
  input="${input//$'\t'/\\t}"
  printf '%s' "$input"
}

json_string() {
  printf '"%s"' "$(json_escape "$1")"
}

parse_args() {
  if [[ -n "${ENV_STATUS_COMPOSE_FILES:-}" ]]; then
    # shellcheck disable=SC2206
    COMPOSE_FILES=(${ENV_STATUS_COMPOSE_FILES})
  fi
  if [[ -n "${ENV_STATUS_LOG_TARGETS:-}" ]]; then
    # shellcheck disable=SC2206
    LOG_TARGETS=(${ENV_STATUS_LOG_TARGETS})
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --run-id)
        [[ $# -ge 2 ]] || abort "--run-id の後に値を指定してください"
        RUN_ID="$2"
        shift 2
        ;;
      --output-dir)
        [[ $# -ge 2 ]] || abort "--output-dir の後にパスを指定してください"
        OUTPUT_ROOT="$2"
        shift 2
        ;;
      --legacy-url)
        [[ $# -ge 2 ]] || abort "--legacy-url の後に URL を指定してください"
        LEGACY_URL="$2"
        shift 2
        ;;
      --modern-url)
        [[ $# -ge 2 ]] || abort "--modern-url の後に URL を指定してください"
        MODERN_URL="$2"
        shift 2
        ;;
      --user)
        [[ $# -ge 2 ]] || abort "--user の後に値を指定してください"
        AUTH_USER="$2"
        shift 2
        ;;
      --password)
        [[ $# -ge 2 ]] || abort "--password の後に値を指定してください"
        AUTH_PASSWORD="$2"
        shift 2
        ;;
      --basic-auth-file)
        [[ $# -ge 2 ]] || abort "--basic-auth-file の後にパスを指定してください"
        BASIC_AUTH_FILE="$2"
        shift 2
        ;;
      --max-time)
        [[ $# -ge 2 ]] || abort "--max-time の後に秒数を指定してください"
        CURL_MAX_TIME="$2"
        shift 2
        ;;
      --project-name)
        [[ $# -ge 2 ]] || abort "--project-name の後に値を指定してください"
        PROJECT_NAME="$2"
        shift 2
        ;;
      --otel-profile)
        [[ $# -ge 2 ]] || abort "--otel-profile の後にプロファイル名を指定してください"
        OTEL_PROFILES+=("$2")
        shift 2
        ;;
      --compose-file)
        [[ $# -ge 2 ]] || abort "--compose-file の後にパスを指定してください"
        COMPOSE_FILES+=("$2")
        shift 2
        ;;
      --log-target)
        [[ $# -ge 2 ]] || abort "--log-target の後に値を指定してください"
        LOG_TARGETS+=("$2")
        shift 2
        ;;
      --log-tail)
        [[ $# -ge 2 ]] || abort "--log-tail の後に行数を指定してください"
        LOG_TAIL="$2"
        shift 2
        ;;
      --legacy-note)
        [[ $# -ge 2 ]] || abort "--legacy-note の後に文言を指定してください"
        LEGACY_NOTE="$2"
        shift 2
        ;;
      --modern-note)
        [[ $# -ge 2 ]] || abort "--modern-note の後に文言を指定してください"
        MODERN_NOTE="$2"
        shift 2
        ;;
      --skip-legacy)
        SKIP_LEGACY=1
        shift
        ;;
      --skip-modern)
        SKIP_MODERN=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        abort "未知のオプション: $1"
        ;;
    esac
  done
}

ensure_prerequisites() {
  if [[ ${#COMPOSE_FILES[@]} -eq 0 ]]; then
    COMPOSE_FILES=(${DEFAULT_COMPOSE_FILES[@]})
  fi
  if [[ ${#LOG_TARGETS[@]} -eq 0 ]]; then
    LOG_TARGETS=(${DEFAULT_LOG_TARGETS[@]})
  fi
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD=(docker-compose)
  else
    abort "docker compose (v2) または docker-compose が必要です"
  fi
  command -v curl >/dev/null 2>&1 || abort "curl コマンドが必要です"
  command -v date >/dev/null 2>&1 || abort "date コマンドが必要です"
}

build_compose_args() {
  COMPOSE_FILE_ARGS=()
  local file
  for file in "${COMPOSE_FILES[@]}"; do
    [[ -n "$file" ]] || continue
    if [[ ! -f "$file" ]]; then
      abort "compose ファイルが見つかりません: $file"
    fi
    COMPOSE_FILE_ARGS+=(-f "$file")
  done

  COMPOSE_PROFILE_ARGS=()
  local profile
  for profile in "${OTEL_PROFILES[@]}"; do
    [[ -n "$profile" ]] || continue
    COMPOSE_PROFILE_ARGS+=(--profile "$profile")
  done
}

prepare_basic_auth_header() {
  BASIC_AUTH_HEADER=""
  if [[ -z "$BASIC_AUTH_FILE" ]]; then
    return
  fi

  [[ -f "$BASIC_AUTH_FILE" ]] || abort "--basic-auth-file のパスが存在しません: $BASIC_AUTH_FILE"
  command -v base64 >/dev/null 2>&1 || abort "--basic-auth-file を使用するには base64 コマンドが必要です"

  local first_line
  first_line="$(head -n 1 "$BASIC_AUTH_FILE" | tr -d '\r\n')"
  [[ -n "$first_line" ]] || abort "--basic-auth-file で指定したファイルの先頭行が空です: $BASIC_AUTH_FILE"

  local encoded
  encoded="$(printf '%s' "$first_line" | base64 | tr -d '\r\n')"
  BASIC_AUTH_HEADER="Authorization: Basic ${encoded}"
}

resolve_run_id() {
  if [[ -z "$RUN_ID" ]]; then
    RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)envStatus"
  fi
  OUTPUT_DIR="${OUTPUT_ROOT}/${RUN_ID}"
  mkdir -p "$OUTPUT_DIR"
}

capture_compose_status() {
  local dest="$OUTPUT_DIR/docker_compose_status.txt"
  log_info "docker compose ps → $dest"
  if ! "${COMPOSE_CMD[@]}" --project-name "$PROJECT_NAME" "${COMPOSE_FILE_ARGS[@]}" "${COMPOSE_PROFILE_ARGS[@]}" ps >"$dest"; then
    abort "docker compose ps に失敗しました"
  fi
}

capture_logs() {
  local target dest
  for target in "${LOG_TARGETS[@]}"; do
    [[ -n "$target" ]] || continue
    dest="$OUTPUT_DIR/${target}.logs.txt"
    log_info "logs --tail ${LOG_TAIL} $target → $dest"
    if ! "${COMPOSE_CMD[@]}" --project-name "$PROJECT_NAME" "${COMPOSE_FILE_ARGS[@]}" "${COMPOSE_PROFILE_ARGS[@]}" \
      logs --tail "$LOG_TAIL" "$target" >"$dest"; then
      log_warn "${target} のログ採取に失敗しました"
      rm -f "$dest"
    fi
  done
}

status_value() {
  local code="$1"
  if [[ "$code" =~ ^[0-9]+$ ]]; then
    printf '%s' "$code"
  else
    printf 'null'
  fi
}

perform_probe() {
  local name="$1" url="$2" note="$3"
  local headers_file="$OUTPUT_DIR/${name}.headers.txt"
  local body_file="$OUTPUT_DIR/${name}.body.txt"
  local meta_file="$OUTPUT_DIR/${name}.meta.json"
  local log_file="$OUTPUT_DIR/${name}.curl.log"
  local captured_at
  captured_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  local tmp_headers tmp_body tmp_log
  tmp_headers="$(mktemp)"
  tmp_body="$(mktemp)"
  tmp_log="$(mktemp)"
  local http_code exit_code=0

  log_info "curl ${url} (${name})"
  local curl_cmd=(curl --silent --show-error
    --max-time "$CURL_MAX_TIME"
    -H "userName: ${AUTH_USER}"
    -H "password: ${AUTH_PASSWORD}"
    -o "$tmp_body"
    -D "$tmp_headers"
    -w '%{http_code}'
  )
  if [[ -n "$BASIC_AUTH_HEADER" ]]; then
    curl_cmd+=(-H "$BASIC_AUTH_HEADER")
  fi
  curl_cmd+=("$url")

  http_code="$("${curl_cmd[@]}" 2>"$tmp_log")" || exit_code=$?

  http_code="${http_code//$'\n'/}"
  http_code="${http_code//$'\r'/}"

  mv "$tmp_headers" "$headers_file"
  mv "$tmp_body" "$body_file"
  local log_basename=""
  if [[ -s "$tmp_log" ]]; then
    mv "$tmp_log" "$log_file"
    log_basename="$(basename "$log_file")"
  else
    rm -f "$tmp_log"
  fi

  local default_note="env-status-check.sh";
  if [[ -n "$note" ]]; then
    default_note="$note"
  fi
  if [[ $exit_code -ne 0 ]]; then
    default_note+=" (curl exit ${exit_code}. see ${log_basename:-${name}.curl.log})"
  fi

  local meta_tmp="$(mktemp)"
  {
    printf '{\n'
    printf '  "runId": %s,\n' "$(json_string "$RUN_ID")"
    printf '  "capturedAt": %s,\n' "$(json_string "$captured_at")"
    printf '  "endpoint": %s,\n' "$(json_string "$url")"
    printf '  "status": %s,\n' "$(status_value "$http_code")"
    printf '  "headersFile": %s,\n' "$(json_string "$(basename "$headers_file")")"
    printf '  "bodyFile": %s,\n' "$(json_string "$(basename "$body_file")")"
    printf '  "auth": {\n'
    printf '    "userName": %s' "$(json_string "$AUTH_USER")"
    if [[ -n "$BASIC_AUTH_FILE" ]]; then
      printf ',\n    "basicAuthFile": %s' "$(json_string "$(basename "$BASIC_AUTH_FILE")")"
    fi
    printf '\n  },\n'
    printf '  "notes": %s,\n' "$(json_string "$default_note")"
    printf '  "curlExitCode": %d' "$exit_code"
    if [[ -n "$log_basename" ]]; then
      printf ',\n  "curlLogFile": %s\n' "$(json_string "$log_basename")"
    else
      printf '\n'
    fi
    printf '}\n'
  } >"$meta_tmp"
  mv "$meta_tmp" "$meta_file"
}

main() {
  parse_args "$@"
  ensure_prerequisites
  prepare_basic_auth_header
  build_compose_args
  resolve_run_id
  capture_compose_status
  capture_logs

  if [[ $SKIP_LEGACY -eq 0 ]]; then
    perform_probe "legacy" "$LEGACY_URL" "$LEGACY_NOTE"
  else
    log_info "--skip-legacy が指定されたため legacy 側の curl を省略"
  fi

  if [[ $SKIP_MODERN -eq 0 ]]; then
    perform_probe "modern" "$MODERN_URL" "$MODERN_NOTE"
  else
    log_info "--skip-modern が指定されたため modern 側の curl を省略"
  fi

  log_info "完了: ${OUTPUT_DIR} に証跡を保存しました"
}

main "$@"
