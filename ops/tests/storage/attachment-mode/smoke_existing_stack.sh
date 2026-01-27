#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
README_TEMPLATE="$TEMPLATES_DIR/README.smoke.template.md"

usage() {
  cat <<'USAGE'
Usage: smoke_existing_stack.sh [options]

Runs the attachment upload/download scenario against an already running stack.
コンテナの再起動・再ビルドは禁止されている状況で、REST API だけを叩いて証跡を採取するテンプレートです。

Options:
  --mode-label NAME     アーティファクトに付与するラベル（既定: manual)
  --output-root DIR     出力ルート（既定: artifacts/parity-manual/attachments)
  --sample-file PATH    アップロードに使用するファイル（既定: ops/tests/storage/attachment-mode/payloads/sample-attachment.txt)
  --app-port PORT       `openDolphin/resources` への HTTP ポート（既定: 9080）
  --compose-file FILE   ログ採取に用いる docker compose ファイル（既定: docker-compose.modernized.dev.yml）
  --no-logs             docker compose logs 取得をスキップ
  --run-id ID           アーティファクト生成先を固定（既定: UTC タイムスタンプ）
  --use-existing        既存の施設/ユーザーを使う（環境変数参照。詳細はスクリプト冒頭のコメントを参照）
  --dry-run             HTTP/API 実行やログ採取をスキップし、雛形のみ生成
  -h, --help            このヘルプを表示

環境変数:
  SYSAD_USER_NAME / SYSAD_PASSWORD  : `/dolphin` 初期化用ヘッダー
  ATTACHMENT_MODE_ADMIN_MD5         : 施設管理者の MD5 パスワード（既定: e88df8596ff8847e232b1e4b1b5ffde2）
  ATTACHMENT_MODE_DOCTOR_MD5        : 医師ユーザーの MD5 パスワード（既定: 632080fabdb968f9ac4f31fb55104648）
  ATTACHMENT_MODE_PATIENT_QUERY     : `/patient/digit/<query>` のクエリ（既定: D_)
  ATTACHMENT_MODE_PATIENT_FROM_DATE : `GET /karte/{patientId},{from}` の from 指定（既定: 2000-01-01 00:00:00）
  --use-existing 併用時:
    ATTACHMENT_MODE_EXISTING_FACILITY_ID
    ATTACHMENT_MODE_EXISTING_ADMIN_LOGIN / ATTACHMENT_MODE_EXISTING_ADMIN_PASSWORD
    ATTACHMENT_MODE_EXISTING_DOCTOR_LOGIN / ATTACHMENT_MODE_EXISTING_DOCTOR_PASSWORD
USAGE
}

MODE_LABEL="manual"
OUTPUT_ROOT="artifacts/parity-manual/attachments"
SAMPLE_FILE="ops/tests/storage/attachment-mode/payloads/sample-attachment.txt"
APP_PORT="${MODERNIZED_APP_HTTP_PORT:-9080}"
COMPOSE_FILE="docker-compose.modernized.dev.yml"
COLLECT_LOGS=1
LOG_LINES=400
RUN_ID=""
DRY_RUN=0
USE_EXISTING=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode-label)
      MODE_LABEL="$2"
      shift 2
      ;;
    --output-root)
      OUTPUT_ROOT="$2"
      shift 2
      ;;
    --sample-file)
      SAMPLE_FILE="$2"
      shift 2
      ;;
    --app-port)
      APP_PORT="$2"
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --no-logs)
      COLLECT_LOGS=0
      shift 1
      ;;
    --run-id)
      RUN_ID="$2"
      shift 2
      ;;
    --use-existing)
      USE_EXISTING=1
      shift 1
      ;;
    --dry-run)
      DRY_RUN=1
      shift 1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_command() {
  for cmd in "$@"; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      echo "[ERROR] Missing required command: $cmd" >&2
      exit 1
    fi
  done
}

if [[ $DRY_RUN -eq 0 ]]; then
  require_command curl jq base64 uuidgen date sed
else
  require_command date sed
fi

if [[ $DRY_RUN -eq 0 && ! -f "$SAMPLE_FILE" ]]; then
  echo "[ERROR] Sample file not found: $SAMPLE_FILE" >&2
  exit 1
fi

if [[ $DRY_RUN -eq 0 ]]; then
  if command -v sha256sum >/dev/null 2>&1; then
    calc_sha256() { sha256sum "$1" | awk '{print $1}'; }
  elif command -v shasum >/dev/null 2>&1; then
    calc_sha256() { shasum -a 256 "$1" | awk '{print $1}'; }
  else
    echo "[ERROR] Requires sha256sum or shasum" >&2
    exit 1
  fi
fi

case "$(uname -s)" in
  Darwin)
    BASE64_DECODE_FLAGS="-D"
    BASE64_ENCODE_FLAGS="-i"
    ;;
  *)
    BASE64_DECODE_FLAGS="--decode"
    BASE64_ENCODE_FLAGS=""
    ;;
esac

SYSAD_USER="${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}"
SYSAD_PASS="${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}"
ADMIN_MD5="${ATTACHMENT_MODE_ADMIN_MD5:-e88df8596ff8847e232b1e4b1b5ffde2}"
DOCTOR_MD5="${ATTACHMENT_MODE_DOCTOR_MD5:-632080fabdb968f9ac4f31fb55104648}"
BASE_URL="http://localhost:${APP_PORT}/openDolphin/resources"
PATIENT_QUERY="${ATTACHMENT_MODE_PATIENT_QUERY:-D_}"
PATIENT_FROM_DATE="${ATTACHMENT_MODE_PATIENT_FROM_DATE:-2000-01-01 00:00:00}"

if [[ -z "$RUN_ID" ]]; then
  RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
fi
RUN_DIR="$OUTPUT_ROOT/$RUN_ID"
MODE_DIR="$RUN_DIR/$MODE_LABEL"
mkdir -p "$RUN_DIR"
mkdir -p "$MODE_DIR/logs"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\\/&]/\\&/g'
}

seed_run_readme() {
  local run_dir="$1"
  local label="$2"
  local run_id
  run_id="$(basename "$run_dir")"
  if [[ -f "$README_TEMPLATE" && ! -f "$run_dir/README.md" ]]; then
    mkdir -p "$run_dir"
    sed -e "s/{{RUN_ID}}/$(escape_sed "$run_id")/g" \
        -e "s/{{MODE_LABEL}}/$(escape_sed "$label")/g" \
        "$README_TEMPLATE" > "$run_dir/README.md"
  fi
}

seed_run_readme "$RUN_DIR" "$MODE_LABEL"

if [[ $DRY_RUN -eq 1 ]]; then
  cat <<NOTES > "$MODE_DIR/dry-run.log"
runId=${RUN_ID}
modeLabel=${MODE_LABEL}
outputDir=${MODE_DIR}
composeFile=${COMPOSE_FILE}
appPort=${APP_PORT}
notes=Attachment smoke テンプレのみ生成。既存スタックへの HTTP 実行は未実施。
NOTES
  cat <<SUMMARY
[OK] 添付モード dry-run を完了しました（実行は未実施）。
- run dir  : $RUN_DIR
- mode dir : $MODE_DIR
- mode label : $MODE_LABEL
- logs      : seeded only
SUMMARY
  exit 0
fi

enforce_health() {
  if ! curl -sf -H "userName:$SYSAD_USER" -H "password:$SYSAD_PASS" "$BASE_URL/dolphin" >/dev/null; then
    echo "[ERROR] WildFly health check failed. 既存スタックが起動していることを確認してください" >&2
    exit 1
  fi
}

enforce_health

assert_existing_params() {
  local missing=0
  for var in ATTACHMENT_MODE_EXISTING_FACILITY_ID ATTACHMENT_MODE_EXISTING_ADMIN_LOGIN ATTACHMENT_MODE_EXISTING_ADMIN_PASSWORD ATTACHMENT_MODE_EXISTING_DOCTOR_LOGIN ATTACHMENT_MODE_EXISTING_DOCTOR_PASSWORD; do
    if [[ -z "${!var:-}" ]]; then
      echo "[ERROR] --use-existing 指定時は $var を設定してください" >&2
      missing=1
    fi
  done
  if [[ $missing -eq 1 ]]; then
    exit 1
  fi
}

create_facility_admin() {
  local payload="$MODE_DIR/admin_payload.json"
  cat <<JSON > "$payload"
{
  "userId": "admin",
  "password": "$ADMIN_MD5",
  "sirName": "Attachment",
  "givenName": "Admin",
  "commonName": "Attachment Admin",
  "email": "admin@example.com",
  "memberType": "FACILITY_USER",
  "registeredDate": "2025-11-01",
  "facilityModel": {
    "facilityName": "Attachment Storage Test Clinic",
    "zipCode": "1000000",
    "address": "東京都千代田区",
    "telephone": "03-0000-0000",
    "memberType": "FACILITY_USER",
    "registeredDate": "2025-11-01"
  },
  "licenseModel": {
    "license": "doctor",
    "licenseDesc": "Doctor",
    "licenseCodeSys": "MML0026"
  },
  "departmentModel": {
    "department": "01",
    "departmentDesc": "General",
    "departmentCodeSys": "MML0028"
  },
  "roles": [
    {"role": "admin"},
    {"role": "user"}
  ]
}
JSON
  local response
  response=$(curl -sf -H "userName:$SYSAD_USER" -H "password:$SYSAD_PASS" -H "Content-Type: application/json" "$BASE_URL/dolphin" -d @"$payload")
  response=${response//$'\n'/}
  FACILITY_ID="${response%%:*}"
  ADMIN_LOGIN="$response"
  echo "$response" > "$MODE_DIR/admin_response.txt"
}

hydrate_existing_facility() {
  assert_existing_params
  FACILITY_ID="$ATTACHMENT_MODE_EXISTING_FACILITY_ID"
  ADMIN_LOGIN="$ATTACHMENT_MODE_EXISTING_ADMIN_LOGIN"
  ADMIN_MD5="$ATTACHMENT_MODE_EXISTING_ADMIN_PASSWORD"
  DOCTOR_LOGIN="$ATTACHMENT_MODE_EXISTING_DOCTOR_LOGIN"
  DOCTOR_MD5="$ATTACHMENT_MODE_EXISTING_DOCTOR_PASSWORD"
  echo "$ADMIN_LOGIN" > "$MODE_DIR/admin_response.txt"
}

create_doctor_user() {
  local payload="$MODE_DIR/doctor_payload.json"
  DOCTOR_LOGIN="$FACILITY_ID:doctor1"
  cat <<JSON > "$payload"
{
  "userId": "$DOCTOR_LOGIN",
  "password": "$DOCTOR_MD5",
  "sirName": "Attachment",
  "givenName": "Doctor",
  "commonName": "Attachment Doctor",
  "email": "doctor@example.com",
  "memberType": "FULL",
  "registeredDate": "2025-11-01",
  "facilityModel": {},
  "licenseModel": {
    "license": "doctor",
    "licenseDesc": "Doctor",
    "licenseCodeSys": "MML0026"
  },
  "departmentModel": {
    "department": "01",
    "departmentDesc": "General",
    "departmentCodeSys": "MML0028"
  },
  "roles": [
    {"role": "doctor"}
  ]
}
JSON
  curl -sf -H "userName:$ADMIN_LOGIN" -H "password:$ADMIN_MD5" -H "Content-Type: application/json" "$BASE_URL/user" -d @"$payload" > "$MODE_DIR/create_doctor_response.txt"
  local doctor_info
  doctor_info=$(curl -sf -H "userName:$DOCTOR_LOGIN" -H "password:$DOCTOR_MD5" "$BASE_URL/user/$DOCTOR_LOGIN")
  echo "$doctor_info" > "$MODE_DIR/doctor_profile.json"
  DOCTOR_USER_ID=$(echo "$doctor_info" | jq '.id')
}

fetch_existing_doctor() {
  local doctor_info
  doctor_info=$(curl -sf -H "userName:$DOCTOR_LOGIN" -H "password:$DOCTOR_MD5" "$BASE_URL/user/$DOCTOR_LOGIN")
  echo "$doctor_info" > "$MODE_DIR/doctor_profile.json"
  DOCTOR_USER_ID=$(echo "$doctor_info" | jq '.id')
}

select_patient_and_karte() {
  local patient_json
  patient_json=$(curl -sf -H "userName:$ADMIN_LOGIN" -H "password:$ADMIN_MD5" "$BASE_URL/patient/digit/$PATIENT_QUERY")
  echo "$patient_json" > "$MODE_DIR/patient_list.json"
  PATIENT_PK=$(echo "$patient_json" | jq -r '.list[0].id // empty')
  if [[ -z "$PATIENT_PK" ]]; then
    echo "[ERROR] 患者リストが空です。ATTACHMENT_MODE_PATIENT_QUERY を見直してください" >&2
    exit 1
  fi
  local from_date="${PATIENT_FROM_DATE// /%20}"
  local karte_json
  karte_json=$(curl -sf -H "userName:$ADMIN_LOGIN" -H "password:$ADMIN_MD5" "$BASE_URL/karte/${PATIENT_PK},${from_date}")
  echo "$karte_json" > "$MODE_DIR/karte.json"
  KARTE_ID=$(echo "$karte_json" | jq '.id')
}

exercise_attachment_flow() {
  local attachment_sha
  local attachment_size
  attachment_sha=$(calc_sha256 "$SAMPLE_FILE")
  attachment_size=$(wc -c < "$SAMPLE_FILE" | tr -d ' ')
  local attachment_b64
  attachment_b64=$(base64 $BASE64_ENCODE_FLAGS "$SAMPLE_FILE" | tr -d '\n')
  local now_epoch_ms=$(( $(date +%s) * 1000 ))
  local doc_id
  doc_id=$(uuidgen | tr -d '-' | tr '[:lower:]' '[:upper:]')
  local request="$MODE_DIR/document_request.json"
  cat <<JSON > "$request"
{
  "confirmed": $now_epoch_ms,
  "started": $now_epoch_ms,
  "recorded": $now_epoch_ms,
  "status": "F",
  "linkId": 0,
  "docInfoModel": {
    "docId": "$doc_id",
    "docType": "karte",
    "title": "Attachment Storage Test ($MODE_LABEL)",
    "purpose": "diagnosis",
    "confirmDate": $now_epoch_ms,
    "firstConfirmDate": $now_epoch_ms,
    "department": "01",
    "departmentDesc": "General",
    "healthInsurance": "060",
    "hasImage": false,
    "hasRp": false,
    "hasTreatment": false,
    "hasLaboTest": false
  },
  "karteBean": {"id": $KARTE_ID},
  "userModel": {"id": $DOCTOR_USER_ID},
  "attachment": [
    {
      "confirmed": $now_epoch_ms,
      "started": $now_epoch_ms,
      "recorded": $now_epoch_ms,
      "status": "F",
      "userModel": {"id": $DOCTOR_USER_ID},
      "karteBean": {"id": $KARTE_ID},
      "fileName": "sample-attachment.txt",
      "contentType": "text/plain",
      "contentSize": $attachment_size,
      "lastModified": $now_epoch_ms,
      "digest": "$attachment_sha",
      "title": "Sample Attachment",
      "bytes": "$attachment_b64"
    }
  ]
}
JSON
  # DocumentModel の PK はサーバー側で採番するため、payload に id が残っていれば削除する
  if [[ $(jq 'has("id") and (.id != null)' "$request") == "true" ]]; then
    local sanitized="$MODE_DIR/document_request.sanitized.json"
    jq 'del(.id)' "$request" > "$sanitized"
    mv "$sanitized" "$request"
  fi
  local response
  response=$(curl -sf -H "userName:$DOCTOR_LOGIN" -H "password:$DOCTOR_MD5" -H "Content-Type: application/json" "$BASE_URL/karte/document" -d @"$request")
  response=${response//$'\n'/}
  local doc_pk="$response"
  echo "$response" > "$MODE_DIR/document_response.txt"
  local documents_json
  documents_json=$(curl -sf -H "userName:$DOCTOR_LOGIN" -H "password:$DOCTOR_MD5" "$BASE_URL/karte/documents/$doc_pk")
  echo "$documents_json" > "$MODE_DIR/document_metadata.json"
  local attachment_id
  attachment_id=$(echo "$documents_json" | jq '.list[0].attachment[0].id')
  local attachment_json
  attachment_json=$(curl -sf -H "userName:$DOCTOR_LOGIN" -H "password:$DOCTOR_MD5" "$BASE_URL/karte/attachment/$attachment_id")
  echo "$attachment_json" > "$MODE_DIR/attachment_response.json"
  printf '%s' "$(echo "$attachment_json" | jq -r '.bytes')" | base64 $BASE64_DECODE_FLAGS > "$MODE_DIR/attachment-download.bin"
  local download_sha
  download_sha=$(calc_sha256 "$MODE_DIR/attachment-download.bin")
  {
    echo "source    $attachment_sha"
    echo "download $download_sha"
  } > "$MODE_DIR/hashes.txt"
  cp "$SAMPLE_FILE" "$MODE_DIR/original-sample.txt"
}

collect_runtime_state() {
  if [[ $COLLECT_LOGS -eq 0 ]]; then
    return
  fi
  if ! command -v docker >/dev/null 2>&1; then
    echo "[WARN] docker command not available. ログ採取をスキップしました" >&2
    return
  fi
  if ! docker compose -f "$COMPOSE_FILE" ps server-modernized-dev >/dev/null 2>&1; then
    echo "[WARN] docker compose ps で server-modernized-dev を確認できません" >&2
    return
  fi
  docker compose -f "$COMPOSE_FILE" logs --tail "$LOG_LINES" server-modernized-dev > "$MODE_DIR/logs/server-tail.log" || true
  if docker compose -f "$COMPOSE_FILE" ps minio >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" logs --tail "$LOG_LINES" minio > "$MODE_DIR/logs/minio-tail.log" || true
  fi
  if docker compose -f "$COMPOSE_FILE" ps minio-mc >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" logs --tail "$LOG_LINES" minio-mc > "$MODE_DIR/logs/minio-mc-tail.log" || true
  fi
}

if [[ $USE_EXISTING -eq 1 ]]; then
  hydrate_existing_facility
  fetch_existing_doctor
else
  create_facility_admin
  create_doctor_user
fi
select_patient_and_karte
exercise_attachment_flow
collect_runtime_state

log_state=$(if [[ $COLLECT_LOGS -eq 1 ]]; then echo "logs collected"; else echo "logs skipped"; fi)

cat <<SUMMARY
[OK] 既存スタックに対する添付アップロード/ダウンロードを完了しました。
- output dir : $MODE_DIR
- mode label : $MODE_LABEL
- compose    : $COMPOSE_FILE ($log_state)
SUMMARY
