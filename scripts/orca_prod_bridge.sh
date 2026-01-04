#!/usr/bin/env bash
set -euo pipefail

DEFAULT_HOST="weborca-trial.orca.med.or.jp"
DEFAULT_PORT="443"
DEFAULT_SCHEME="https"
DEFAULT_API_PATH="/api01rv2/system01dailyv2"
DEFAULT_METHOD="POST"

usage() {
  cat <<'EOF'
Usage: ./scripts/orca_prod_bridge.sh [options]

Options:
  --run-id <id>          Required if RUN_ID is unset (format: YYYYMMDDThhmmssZ)
  --api-path <path>      API path (defaults to ORCA_TRIAL_API_PATH or /api01rv2/system01dailyv2)
  --method <verb>        HTTP method for curl (default: POST)
  --payload <file>       Optional payload file passed via --data-binary @<file>
  --dry-run              Prepare paths/log template only; skip curl
  --yes                  Skip interactive confirmation
  --force-target <host>  Allow a non-default host (must match ORCA_TRIAL_HOST/ORCA_PROD_HOST when used)
  -h, --help             Show this help

Environment variables:
  RUN_ID (alternative to --run-id)
  ORCA_TRIAL_USER (required)       Basic auth user
  ORCA_TRIAL_PASS (required)       Basic auth password
  ORCA_TRIAL_HOST (default: weborca-trial.orca.med.or.jp)
  ORCA_TRIAL_PORT (default: 443)
  ORCA_TRIAL_SCHEME (default: https)
  ORCA_TRIAL_API_PATH (default: /api01rv2/system01dailyv2)
  ORCA_TRIAL_METHOD (default: POST)

Optional (legacy / production only; use when explicitly approved):
  ORCA_PROD_CERT_PATH              PKCS#12 file path
  ORCA_PROD_CERT_PASS              PKCS#12 passphrase
  ORCA_PROD_BASIC_USER             Basic auth user
  ORCA_PROD_BASIC_KEY              Basic auth key
  ORCA_PROD_HOST                   Production host override
  ORCA_PROD_PORT                   Production port override
  ORCA_PROD_SCHEME                 Production scheme override
  ORCA_PROD_API_PATH               Production API path override
  ORCA_PROD_METHOD                 Production method override
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

validate_run_id() {
  local id="$1"
  [[ "$id" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || die "RUN_ID must match YYYYMMDDThhmmssZ"
}

require_env() {
  local missing=0
  for name in "$@"; do
    local value="${!name:-}"
    if [[ -z "$value" ]]; then
      echo "Missing required env: $name" >&2
      missing=1
    fi
  done
  [[ $missing -eq 0 ]] || die "Required environment variables are missing."
}

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

RUN_ID="${RUN_ID:-}"
API_PATH="${ORCA_TRIAL_API_PATH:-${ORCA_PROD_API_PATH:-$DEFAULT_API_PATH}}"
HTTP_METHOD="${ORCA_TRIAL_METHOD:-${ORCA_PROD_METHOD:-$DEFAULT_METHOD}}"
DRY_RUN=0
AUTO_YES=0
FORCE_TARGET=""
PAYLOAD_PATH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --run-id)
      RUN_ID="${2:-}"; shift 2;;
    --api-path)
      API_PATH="${2:-}"; shift 2;;
    --method)
      HTTP_METHOD="${2:-}"; shift 2;;
    --payload)
      PAYLOAD_PATH="${2:-}"; shift 2;;
    --dry-run)
      DRY_RUN=1; shift;;
    --yes)
      AUTO_YES=1; shift;;
    --force-target)
      FORCE_TARGET="${2:-}"; shift 2;;
    -h|--help)
      usage; exit 0;;
    *)
      die "Unknown option: $1";;
  esac
done

[[ -n "$RUN_ID" ]] || die "RUN_ID is required (set RUN_ID env or --run-id)."
validate_run_id "$RUN_ID"

TARGET_HOST="${ORCA_TRIAL_HOST:-${ORCA_PROD_HOST:-$DEFAULT_HOST}}"
TARGET_PORT="${ORCA_TRIAL_PORT:-${ORCA_PROD_PORT:-$DEFAULT_PORT}}"
TARGET_SCHEME="${ORCA_TRIAL_SCHEME:-${ORCA_PROD_SCHEME:-$DEFAULT_SCHEME}}"
TARGET_URL="${TARGET_SCHEME}://${TARGET_HOST}:${TARGET_PORT}${API_PATH}"

if [[ "$TARGET_HOST" != "$DEFAULT_HOST" || "$TARGET_PORT" != "$DEFAULT_PORT" || "$TARGET_SCHEME" != "$DEFAULT_SCHEME" ]]; then
  if [[ -z "$FORCE_TARGET" || "$FORCE_TARGET" != "$TARGET_HOST" ]]; then
    die "Target ${TARGET_SCHEME}://${TARGET_HOST}:${TARGET_PORT} is not the standard Trial host. Re-run with --force-target ${TARGET_HOST} only if explicitly approved."
  fi
fi

BASIC_USER="${ORCA_TRIAL_USER:-${ORCA_PROD_BASIC_USER:-}}"
BASIC_PASS="${ORCA_TRIAL_PASS:-${ORCA_PROD_BASIC_KEY:-}}"
CERT_PATH="${ORCA_PROD_CERT_PATH:-}"
CERT_PASS="${ORCA_PROD_CERT_PASS:-}"

if [[ -z "$BASIC_USER" || -z "$BASIC_PASS" ]]; then
  die "Missing required env: ORCA_TRIAL_USER/ORCA_TRIAL_PASS (or legacy ORCA_PROD_BASIC_USER/ORCA_PROD_BASIC_KEY)."
fi

if [[ -n "$CERT_PATH" || -n "$CERT_PASS" ]]; then
  [[ -n "$CERT_PATH" && -n "$CERT_PASS" ]] || die "ORCA_PROD_CERT_PATH and ORCA_PROD_CERT_PASS must be set together."
  [[ -r "$CERT_PATH" ]] || die "Cannot read ORCA_PROD_CERT_PATH: $CERT_PATH"
fi

require_cmd curl

umask 077

LOG_PATH="${REPO_ROOT}/docs/server-modernization/phase2/operations/logs/${RUN_ID}-orca-prod-bridge.md"
ARTIFACT_ROOT="${REPO_ROOT}/artifacts/orca-connectivity/${RUN_ID}"
HTTPDUMP_DIR="${ARTIFACT_ROOT}/httpdump"
TRACE_DIR="${ARTIFACT_ROOT}/trace"
DATA_DIR="${ARTIFACT_ROOT}/data-check"
TMP_DIR="${REPO_ROOT}/tmp/orca-prod-bridge/${RUN_ID}"

mkdir -p "$HTTPDUMP_DIR" "$TRACE_DIR" "$DATA_DIR" "$TMP_DIR"

render_log_stub() {
  if [[ -f "$LOG_PATH" ]]; then
    return
  fi

  cat > "$LOG_PATH" <<EOF
# RUN_ID=${RUN_ID} orca-prod-bridge
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md
- 接続先: ${TARGET_SCHEME}://${TARGET_HOST}:${TARGET_PORT}（標準は WebORCA Trial、非標準は --force-target 必須）
- 認証情報: ORCA_TRIAL_USER/ORCA_TRIAL_PASS（任意: ORCA_PROD_CERT_PATH/ORCA_PROD_CERT_PASS）（ログには <MASKED> で記載すること）
- 証跡: docs/server-modernization/phase2/operations/logs/${RUN_ID}-orca-prod-bridge.md（本ファイル）、artifacts/orca-connectivity/${RUN_ID}/{httpdump,trace,data-check}/

## Summary
- 実行結果: <記入>
- 実行端末: <記入>（例: WSL2, outbound HTTPS 許可端末）
- 備考: <PHI を含めずに記載>

## Evidence
- HTTP ヘッダー: artifacts/orca-connectivity/${RUN_ID}/httpdump/${RUN_ID}-headers.txt
- トレース: artifacts/orca-connectivity/${RUN_ID}/trace/${RUN_ID}-trace.log
- レスポンス: artifacts/orca-connectivity/${RUN_ID}/data-check/${RUN_ID}-response.xml （PHI はマスク）

## Commands
- 実行コマンド: <MASKED> curl [-H XML headers] -u "<MASKED>:<MASKED>" -X ${HTTP_METHOD} "${TARGET_URL}"
EOF
}

append_run_note() {
  local now_utc
  now_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  cat >> "$LOG_PATH" <<EOF

## Run ${now_utc}
- モード: $( [[ $DRY_RUN -eq 1 ]] && echo "dry-run" || echo "execute")
- Target: ${TARGET_URL}
- Method: ${HTTP_METHOD}
- Payload: $( [[ -n "$PAYLOAD_PATH" ]] && echo "$PAYLOAD_PATH" || echo "なし" )
- 出力: ${HTTPDUMP_DIR}/${RUN_ID}-headers.txt, ${TRACE_DIR}/${RUN_ID}-trace.log, ${DATA_DIR}/${RUN_ID}-response.xml
EOF
}

render_log_stub

echo "Target      : ${TARGET_URL}"
echo "RUN_ID      : ${RUN_ID}"
echo "Log file    : ${LOG_PATH}"
echo "Artifacts   : ${ARTIFACT_ROOT}"
echo "Auth checks : ORCA_TRIAL_USER=<MASKED>, ORCA_TRIAL_PASS=<MASKED>, ORCA_PROD_CERT_PATH=<MASKED> (exists=$([[ -n "$CERT_PATH" && -r "$CERT_PATH" ]] && echo yes || echo no))"
echo "Method      : ${HTTP_METHOD}"
echo "Payload     : ${PAYLOAD_PATH:-なし}"

if [[ $AUTO_YES -ne 1 ]]; then
  read -r -p "Proceed to call ${TARGET_URL} with RUN_ID=${RUN_ID}? [y/N] " answer
  case "$answer" in
    y|Y|yes|YES) ;;
    *) die "Aborted by user.";;
  esac
fi

append_run_note

if [[ $DRY_RUN -eq 1 ]]; then
  echo "dry-run requested; curl is skipped."
  exit 0
fi

HTTPDUMP_FILE="${HTTPDUMP_DIR}/${RUN_ID}-headers.txt"
TRACE_FILE="${TRACE_DIR}/${RUN_ID}-trace.log"
DATA_FILE="${DATA_DIR}/${RUN_ID}-response.xml"

curl_args=(
  --silent
  --show-error
  -u "${BASIC_USER}:${BASIC_PASS}"
  -H "Accept: application/xml"
  -H "Content-Type: application/xml; charset=UTF-8"
  --dump-header "$HTTPDUMP_FILE"
  --trace-ascii "$TRACE_FILE"
  --output "$DATA_FILE"
  -X "$HTTP_METHOD"
  "$TARGET_URL"
)

if [[ -n "$CERT_PATH" ]]; then
  curl_args+=(--cert-type P12 --cert "${CERT_PATH}:${CERT_PASS}")
fi

if [[ -n "$PAYLOAD_PATH" ]]; then
  curl_args+=(--data-binary "@${PAYLOAD_PATH}")
fi

echo "curl executing... (output to ${DATA_FILE})"
curl "${curl_args[@]}"
echo "DONE. Evidence saved under ${ARTIFACT_ROOT}"
