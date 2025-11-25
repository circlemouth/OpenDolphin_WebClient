#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
SEND_SCRIPT="${REPO_ROOT}/ops/tools/send_parallel_request.sh"

PROFILE_NAME="compose"
HEADER_FILE="${REPO_ROOT}/tmp/reporting-headers/doctor.headers"
PAYLOAD_JA="${REPO_ROOT}/tmp/reporting_karte_payload_ja.json"
PAYLOAD_EN="${REPO_ROOT}/tmp/reporting_karte_payload_en.json"
OUTPUT_ROOT="${REPO_ROOT}/artifacts/parity-manual"
RUN_ID_DEFAULT="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_ID="${REPORTING_KARTE_RUN_ID:-$RUN_ID_DEFAULT}"
TRACE_RUN_ID_OVERRIDE="${TRACE_RUN_ID:-}" # honor external override if provided
declare -a REQUESTED_LOCALES=()

usage() {
  cat <<'USAGE'
Usage: ops/tests/reporting/karte_cli.sh [options]

Options:
  --profile NAME        send_parallel_request の --profile（default: compose）
  --header-file PATH    PARITY_HEADER_FILE に渡すファイル（default: tmp/reporting-headers/doctor.headers）
  --run-id ID           RUN_ID / TRACE_RUN_ID として使用する識別子（default: UTC timestamp）
  --locale LOCALE       対象ロケールを指定（ja|en）。複数回指定可。未指定時は両方実行。
  --payload-ja PATH     日本語ペイロード JSON（default: tmp/reporting_karte_payload_ja.json）
  --payload-en PATH     英語ペイロード JSON（default: tmp/reporting_karte_payload_en.json）
  --output-root DIR     artifacts ルート（default: artifacts/parity-manual）
  -h, --help            このメッセージを表示

例:
  # RUN_ID を手動指定し、doctor ユーザーで両ロケールを実行
  REPORTING_KARTE_RUN_ID=20251112TfontHotdeployZ ops/tests/reporting/karte_cli.sh

  # helper コンテナ内から sysad ヘッダーで日本語のみ実行
  ./ops/tests/reporting/karte_cli.sh --header-file tmp/reporting-headers/sysad.headers --locale ja
USAGE
}

require_command() {
  local cmd
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      printf '[ERROR] Missing required command: %s\n' "$cmd" >&2
      exit 1
    fi
  done
}

make_abs_path() {
  local path="$1"
  if [[ "$path" = /* ]]; then
    printf '%s' "$path"
  else
    printf '%s/%s' "$REPO_ROOT" "$path"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE_NAME="$2"
      shift 2
      ;;
    --header-file)
      HEADER_FILE="$(make_abs_path "$2")"
      shift 2
      ;;
    --run-id)
      RUN_ID="$2"
      shift 2
      ;;
    --locale)
      REQUESTED_LOCALES+=("$2")
      shift 2
      ;;
    --payload-ja)
      PAYLOAD_JA="$(make_abs_path "$2")"
      shift 2
      ;;
    --payload-en)
      PAYLOAD_EN="$(make_abs_path "$2")"
      shift 2
      ;;
    --output-root)
      OUTPUT_ROOT="$(make_abs_path "$2")"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    *)
      printf '[ERROR] Unknown argument: %s\n' "$1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -x "$SEND_SCRIPT" ]]; then
  printf '[ERROR] send_parallel_request.sh not found at %s\n' "$SEND_SCRIPT" >&2
  exit 1
fi

require_command jq curl

if [[ ${#REQUESTED_LOCALES[@]} -eq 0 ]]; then
  REQUESTED_LOCALES=(ja en)
fi

if [[ ! -f "$HEADER_FILE" ]]; then
  printf '[ERROR] Header file not found: %s\n' "$HEADER_FILE" >&2
  exit 1
fi

if [[ ! -f "$PAYLOAD_JA" ]]; then
  printf '[ERROR] Japanese payload not found: %s\n' "$PAYLOAD_JA" >&2
  exit 1
fi

if [[ ! -f "$PAYLOAD_EN" ]]; then
  printf '[ERROR] English payload not found: %s\n' "$PAYLOAD_EN" >&2
  exit 1
fi

TRACE_RUN_ID_VALUE="$RUN_ID"
if [[ -n "$TRACE_RUN_ID_OVERRIDE" ]]; then
  TRACE_RUN_ID_VALUE="$TRACE_RUN_ID_OVERRIDE"
fi

rename_binary_response() {
  local locale="$1"
  local run_id="$2"
  local target_root="$3"
  local base_dir="${target_root}/${run_id}"
  for label in legacy modern; do
    local meta_file="${base_dir}/${label}/meta.json"
    local headers_file="${base_dir}/${label}/headers.txt"
    local body_json="${base_dir}/${label}/response.json"
    local body_pdf="${base_dir}/${label}/response.pdf"
    [[ -f "$meta_file" && -f "$headers_file" ]] || continue
    if [[ -f "$body_pdf" ]]; then
      continue
    fi
    if [[ ! -f "$body_json" ]]; then
      continue
    fi
    local status_code
    status_code=$(jq -r '.status_code // 0' "$meta_file" 2>/dev/null || echo 0)
    if [[ "$status_code" != "200" ]]; then
      continue
    fi
    if grep -qi 'Content-Type:.*application/pdf' "$headers_file"; then
      mv "$body_json" "$body_pdf"
    fi
  done
}

for locale in "${REQUESTED_LOCALES[@]}"; do
  case "$locale" in
    ja)
      payload_file="$PAYLOAD_JA"
      ;;
    en)
      payload_file="$PAYLOAD_EN"
      ;;
    *)
      printf '[ERROR] Unsupported locale: %s (expected ja|en)\n' "$locale" >&2
      exit 1
      ;;
  esac
  target_root="${OUTPUT_ROOT}/reporting_karte_${locale}"
  mkdir -p "$target_root"
  printf '\n[reporting] locale=%s run_id=%s profile=%s\n' "$locale" "$RUN_ID" "$PROFILE_NAME"
  (
    export PARITY_HEADER_FILE="$HEADER_FILE"
    export PARITY_BODY_FILE="$payload_file"
    export PARITY_OUTPUT_DIR="$target_root"
    export TRACE_RUN_ID="$TRACE_RUN_ID_VALUE"
    "$SEND_SCRIPT" --profile "$PROFILE_NAME" POST /reporting/karte "$RUN_ID"
  )
  rename_binary_response "$locale" "$RUN_ID" "$target_root"
  printf '[reporting] artifacts stored under %s\n' "${target_root}/${RUN_ID}"
  printf '[reporting] legacy headers: %s\n' "${target_root}/${RUN_ID}/legacy/headers.txt"
  printf '[reporting] modern headers: %s\n' "${target_root}/${RUN_ID}/modern/headers.txt"
  printf '[reporting] modern PDF : %s\n' "${target_root}/${RUN_ID}/modern/response.pdf"
  printf '[reporting] legacy PDF : %s\n' "${target_root}/${RUN_ID}/legacy/response.pdf"

done
