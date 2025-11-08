#!/usr/bin/env bash
# Legacy / Modernized 向け JMS フォールバック検証を自動化するスクリプト。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SEND_PARALLEL="${SCRIPT_DIR}/send_parallel_request.sh"
PROFILE_FILE="${SCRIPT_DIR}/send_parallel_request.profile.env.sample"
PROFILE_NAME="compose"
OUTPUT_ROOT="${REPO_ROOT}/artifacts/parity-manual/JMS"
TIMESTAMP=""
SCENARIOS=("claim")
LOG_TARGETS=()
LOG_SINCE=""
PROJECT_NAME_DEFAULT="${JMS_PROBE_PROJECT_NAME:-${PROJECT_NAME:-}}"

usage() {
  cat <<'USAGE'
usage:
  ops/tools/jms-probe.sh [options]

options:
  --scenario LIST       実行シナリオ (claim,diagnosis)。カンマ区切り指定可 (default: claim)
  --profile NAME        send_parallel_request.sh の --profile 値 (default: compose)
  --profile-file FILE   プロファイルファイルパス (default: ops/tools/send_parallel_request.profile.env.sample)
  --timestamp VALUE     出力フォルダ名に使う UTC タイムスタンプ (default: 現在時刻)
  --output-dir DIR      出力ルート (default: artifacts/parity-manual/JMS)
  --log-target NAME     docker logs を採取するコンテナ名。複数指定可
  -h, --help            このメッセージを表示

環境変数:
  JMS_PROBE_LOG_TARGETS  追加のログ採取コンテナ (スペース区切り)
  JMS_PROBE_HEADER_ROOT  ヘッダーファイル配置ディレクトリ (default: tmp/claim-tests)
  JMS_PROBE_BODY_ROOT    ボディファイル配置ディレクトリ (default: tmp/claim-tests)
  JMS_PROBE_PROJECT_NAME docker compose 用 PROJECT_NAME 上書き値
USAGE
}

log_info() { printf '[INFO] %s\n' "$*"; }
log_warn() { printf '[WARN] %s\n' "$*" >&2; }
abort() { printf '[ERROR] %s\n' "$*" >&2; exit 1; }

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    abort "$1 コマンドが必要です"
  fi
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || abort "必要なファイルが見つかりません: $path"
}

parse_scenarios() {
  local raw="$1"
  local saved_ifs="$IFS"
  IFS=',' read -r -a parsed <<<"$raw"
  IFS="$saved_ifs"
  local normalized=()
  local item
  for item in "${parsed[@]}"; do
    case "$item" in
      "" ) ;;
      claim|diagnosis) normalized+=("$item") ;;
      *) abort "未知のシナリオ: $item" ;;
    esac
  done
  [[ ${#normalized[@]} -gt 0 ]] || abort "--scenario には claim/diagnosis のいずれかを含めてください"
  SCENARIOS=("${normalized[@]}")
}

parse_args() {
  if [[ -n "${JMS_PROBE_LOG_TARGETS:-}" ]]; then
    # shellcheck disable=SC2206
    LOG_TARGETS=(${JMS_PROBE_LOG_TARGETS})
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --scenario)
        [[ $# -ge 2 ]] || abort "--scenario の後に値を指定してください"
        parse_scenarios "$2"
        shift 2
        ;;
      --profile)
        [[ $# -ge 2 ]] || abort "--profile の後に値を指定してください"
        PROFILE_NAME="$2"
        shift 2
        ;;
      --profile-file)
        [[ $# -ge 2 ]] || abort "--profile-file の後にパスを指定してください"
        PROFILE_FILE="$2"
        shift 2
        ;;
      --timestamp)
        [[ $# -ge 2 ]] || abort "--timestamp の後に値を指定してください"
        TIMESTAMP="$2"
        shift 2
        ;;
      --output-dir)
        [[ $# -ge 2 ]] || abort "--output-dir の後にパスを指定してください"
        OUTPUT_ROOT="$2"
        shift 2
        ;;
      --log-target)
        [[ $# -ge 2 ]] || abort "--log-target の後に値を指定してください"
        LOG_TARGETS+=("$2")
        shift 2
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
  [[ -x "$SEND_PARALLEL" ]] || abort "send_parallel_request.sh が実行できません: $SEND_PARALLEL"
  require_file "$PROFILE_FILE"
  require_command curl
  require_command docker
  require_command jq
}

resolve_timestamp() {
  if [[ -z "$TIMESTAMP" ]]; then
    TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
  fi
}

resolve_log_targets() {
  if [[ ${#LOG_TARGETS[@]} -eq 0 ]]; then
    LOG_TARGETS=(
      opendolphin-server
      opendolphin-server-modernized-dev
      opendolphin-server-modernized
      opendolphin-claim-jms
    )
  fi
  local seen_list=""
  local unique=()
  local target
  for target in "${LOG_TARGETS[@]}"; do
    [[ -z "$target" ]] && continue
    case " $seen_list " in
      *" $target "*) continue ;;
      *)
        seen_list+=" $target"
        unique+=("$target")
        ;;
    esac
  done
  LOG_TARGETS=("${unique[@]}")
}

run_scenario() {
  local scenario="$1"
  local header_root="${JMS_PROBE_HEADER_ROOT:-${REPO_ROOT}/tmp/claim-tests}"
  local body_root="${JMS_PROBE_BODY_ROOT:-${REPO_ROOT}/tmp/claim-tests}"
  local method path header_file body_file

  case "$scenario" in
    claim)
      method="PUT"
      path="/20/adm/eht/sendClaim"
      header_file="${header_root}/claim.headers"
      body_file="${body_root}/send_claim_success.json"
      ;;
    diagnosis)
      method="POST"
      path="/karte/diagnosis/claim"
      header_file="${header_root}/diagnosis.headers"
      body_file="${body_root}/send_diagnosis_success.json"
      ;;
    *)
      abort "未知のシナリオ: $scenario"
      ;;
  esac

  require_file "$header_file"
  require_file "$body_file"

  local scenario_http_dir="${RUN_DIR}/http/${scenario}"
  mkdir -p "$scenario_http_dir"

  log_info "シナリオ開始: ${scenario} (${method} ${path})"

  env \
    PROJECT_NAME="${PROJECT_NAME_DEFAULT}" \
    PARITY_HEADER_FILE="$header_file" \
    PARITY_BODY_FILE="$body_file" \
    PARITY_OUTPUT_DIR="$scenario_http_dir" \
    "$SEND_PARALLEL" \
      --profile "$PROFILE_NAME" \
      --profile-file "$PROFILE_FILE" \
      "$method" \
      "$path" \
      "JMS_${scenario}"

  diff_http_payloads "$scenario" || true
}

diff_http_payloads() {
  local scenario="$1"
  local base_dir="${RUN_DIR}/http/${scenario}/JMS_${scenario}"
  local legacy_resp="${base_dir}/legacy/response.json"
  local modern_resp="${base_dir}/modern/response.json"
  if [[ -f "$legacy_resp" && -f "$modern_resp" ]]; then
    if ! diff -u "$legacy_resp" "$modern_resp" >"${base_dir}/response.diff"; then
      log_info "HTTP レスポンス差分を ${base_dir}/response.diff に保存しました"
    else
      rm -f "${base_dir}/response.diff"
      log_info "HTTP レスポンスに差分はありません"
    fi
  fi
}

collect_docker_logs() {
  mkdir -p "${RUN_DIR}/logs"
  local containers
  containers="$(docker ps -a --format '{{.Names}}')"
  local target
  for target in "${LOG_TARGETS[@]}"; do
    [[ -z "$target" ]] && continue
    local log_path="${RUN_DIR}/logs/${target}.log"
    if grep -Fxq "$target" <<<"$containers"; then
      if [[ -n "$LOG_SINCE" ]]; then
        docker logs --since "$LOG_SINCE" "$target" >"$log_path" 2>&1 || true
      else
        docker logs "$target" >"$log_path" 2>&1 || true
      fi
      log_info "docker logs -> ${log_path}"
    else
      printf 'container "%s" not found\n' "$target" >"$log_path"
      log_warn "コンテナが見つかりません: ${target}"
    fi
  done
}

diff_server_logs() {
  local legacy_log="${RUN_DIR}/logs/opendolphin-server.log"
  local modern_dev="${RUN_DIR}/logs/opendolphin-server-modernized-dev.log"
  local modern_std="${RUN_DIR}/logs/opendolphin-server-modernized.log"
  local modern_source=""
  local modern_path=""
  if [[ -s "$modern_dev" ]]; then
    modern_source="opendolphin-server-modernized-dev"
    modern_path="$modern_dev"
  elif [[ -s "$modern_std" ]]; then
    modern_source="opendolphin-server-modernized"
    modern_path="$modern_std"
  fi

  if [[ -s "$legacy_log" && -n "$modern_path" ]]; then
    if ! diff -u "$legacy_log" "$modern_path" >"${RUN_DIR}/logs/${modern_source}-vs-legacy.diff"; then
      log_info "Legacy/Modernized ログ差分を保存しました"
    else
      rm -f "${RUN_DIR}/logs/${modern_source}-vs-legacy.diff"
      log_info "Legacy/Modernized ログに差分はありませんでした"
    fi
  fi
}

write_metadata() {
  local scenarios_json log_targets_json
  scenarios_json="$(printf '%s\n' "${SCENARIOS[@]}" | jq -R . | jq -s .)"
  log_targets_json="$(printf '%s\n' "${LOG_TARGETS[@]}" | jq -R . | jq -s .)"
  jq -n \
    --arg timestamp "$TIMESTAMP" \
    --arg profile "$PROFILE_NAME" \
    --arg profile_file "$PROFILE_FILE" \
    --arg output_dir "$RUN_DIR" \
    --arg project_name "$PROJECT_NAME_DEFAULT" \
    --arg log_since "$LOG_SINCE" \
    --argjson scenarios "$scenarios_json" \
    --argjson log_targets "$log_targets_json" \
    '{
      timestamp: $timestamp,
      profile: $profile,
      profile_file: $profile_file,
      output_dir: $output_dir,
      project_name: $project_name,
      log_since: $log_since,
      scenarios: $scenarios,
      log_targets: $log_targets
    }' >"${RUN_DIR}/metadata.json"
}

main() {
  parse_args "$@"
  ensure_prerequisites
  resolve_timestamp
  resolve_log_targets
  LOG_SINCE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  RUN_DIR="${OUTPUT_ROOT}/${TIMESTAMP}"
  mkdir -p "$RUN_DIR/http"
  log_info "出力ディレクトリ: ${RUN_DIR}"

  local scenario
  for scenario in "${SCENARIOS[@]}"; do
    run_scenario "$scenario"
  done

  collect_docker_logs
  diff_server_logs
  write_metadata

  log_info "JMS プローブ完了: ${RUN_DIR}"
}

main "$@"
