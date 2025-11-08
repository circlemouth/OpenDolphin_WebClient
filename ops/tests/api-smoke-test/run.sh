#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
PARALLEL_SCRIPT="${REPO_ROOT}/ops/tools/send_parallel_request.sh"
OUTPUT_BASE="${REPO_ROOT}/artifacts/parity-manual/smoke"
DEFAULT_HEADER="${REPO_ROOT}/ops/tests/api-smoke-test/headers/legacy-default.headers"

SCENARIO=""
RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
MODE="dual"
PROFILE_NAME=""
PROFILE_FILE=""
declare -a EXTRA_PARALLEL_ARGS=()

usage() {
  cat <<'USAGE'
API スモークベースライン実行スクリプト (Python 禁止モード)

使い方:
  ops/tests/api-smoke-test/run.sh --scenario <name> [--run-id <id>] [--dual]
                                  [--profile <name>] [--profile-file <path>]

オプション:
  --scenario NAME     実行するシナリオ名（例: base_readonly）。必須。
  --run-id ID         保存ディレクトリ名を明示指定する（既定: UTC タイムスタンプ）。
  --dual              レガシー／モダナイズ双方へ送信（既定）。
  --profile NAME      ops/tools/send_parallel_request.sh の --profile に委譲する。
  --profile-file PATH --profile で使用するテンプレートファイルを指定する。
  -h, --help          このヘルプを表示。

保存形式: artifacts/parity-manual/smoke/<run-id>/{legacy,modernized}/<case-id>/...
USAGE
}

die() {
  printf '[ERROR] %s\n' "$*" >&2
  exit 1
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || die "ファイルが見つかりません: $path"
}

declare -a SCENARIO_CASES=()

load_scenario_cases() {
  case "$SCENARIO" in
    base_readonly)
      SCENARIO_CASES=(
        "GET|/dolphin|base_readonly_dolphin|${DEFAULT_HEADER}|"
        "GET|/serverinfo/jamri|base_readonly_serverinfo|${DEFAULT_HEADER}|"
        "GET|/mml/patient/list/1.3.6.1.4.1.9414.72.103|base_readonly_patient_list|${DEFAULT_HEADER}|"
      )
      ;;
    *)
      die "未知のシナリオです: ${SCENARIO}"
      ;;
  esac
}

PARSE_STATE=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --scenario)
      [[ $# -ge 2 ]] || die "--scenario には値が必要です"
      SCENARIO="$2"
      shift 2
      ;;
    --run-id)
      [[ $# -ge 2 ]] || die "--run-id には値が必要です"
      RUN_ID="$2"
      shift 2
      ;;
    --dual)
      MODE="dual"
      shift
      ;;
    --profile)
      [[ $# -ge 2 ]] || die "--profile には値が必要です"
      PROFILE_NAME="$2"
      EXTRA_PARALLEL_ARGS+=(--profile "$2")
      shift 2
      ;;
    --profile-file)
      [[ $# -ge 2 ]] || die "--profile-file には値が必要です"
      PROFILE_FILE="$2"
      EXTRA_PARALLEL_ARGS+=(--profile-file "$2")
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

[[ -n "$SCENARIO" ]] || die "--scenario を指定してください"
[[ "$MODE" == "dual" ]] || die "現在サポートしているのは --dual のみです"

require_file "$PARALLEL_SCRIPT"
require_file "$DEFAULT_HEADER"
load_scenario_cases

if [[ ${#SCENARIO_CASES[@]} -eq 0 ]]; then
  die "シナリオ ${SCENARIO} にケースが定義されていません"
fi

RUN_ROOT="${OUTPUT_BASE}/${RUN_ID}"
RAW_DIR="${RUN_ROOT}/_raw"
mkdir -p "$RAW_DIR"

printf '[INFO] scenario=%s run-id=%s output=%s\n' "$SCENARIO" "$RUN_ID" "$RUN_ROOT"

declare -a EXECUTED_CASES=()

for entry in "${SCENARIO_CASES[@]}"; do
  IFS='|' read -r method path request_id header_file body_file <<<"$entry"
  [[ -n "$method" && -n "$path" && -n "$request_id" ]] || die "エントリ解析に失敗しました: $entry"

  header_file="${header_file:-$DEFAULT_HEADER}"
  require_file "$header_file"
  if [[ -n "$body_file" ]]; then
    require_file "$body_file"
  fi

  export PARITY_HEADER_FILE="$header_file"
  if [[ -n "$body_file" ]]; then
    export PARITY_BODY_FILE="$body_file"
  else
    unset PARITY_BODY_FILE 2>/dev/null || true
  fi
  export PARITY_OUTPUT_DIR="$RAW_DIR"

  if [[ ${#EXTRA_PARALLEL_ARGS[@]} -gt 0 ]]; then
    "$PARALLEL_SCRIPT" "${EXTRA_PARALLEL_ARGS[@]}" "$method" "$path" "$request_id"
  else
    "$PARALLEL_SCRIPT" "$method" "$path" "$request_id"
  fi

  case_dir="${RAW_DIR}/${request_id}"
  [[ -d "$case_dir" ]] || die "想定した出力が見つかりません: $case_dir"

  mkdir -p "${RUN_ROOT}/legacy" "${RUN_ROOT}/modernized"
  if [[ -d "${case_dir}/legacy" ]]; then
    mv "${case_dir}/legacy" "${RUN_ROOT}/legacy/${request_id}"
  else
    die "legacy 側の出力が不足しています: ${case_dir}/legacy"
  fi
  if [[ -d "${case_dir}/modern" ]]; then
    mv "${case_dir}/modern" "${RUN_ROOT}/modernized/${request_id}"
  else
    die "modernized 側の出力が不足しています: ${case_dir}/modern"
  fi

  rmdir "$case_dir" 2>/dev/null || true
  EXECUTED_CASES+=("$request_id")
done

rmdir "$RAW_DIR" 2>/dev/null || true

timestamp_iso="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat >"${RUN_ROOT}/metadata.json" <<META
{
  "scenario": "${SCENARIO}",
  "mode": "${MODE}",
  "run_id": "${RUN_ID}",
  "generated_at": "${timestamp_iso}",
  "profile": "${PROFILE_NAME}",
  "cases": [
    $(printf '"%s", ' "${EXECUTED_CASES[@]}" | sed 's/, $//')
  ]
}
META

printf '[INFO] %d 件のケースを artifacts/parity-manual/smoke/%s に保存しました\n' "${#EXECUTED_CASES[@]}" "$RUN_ID"
