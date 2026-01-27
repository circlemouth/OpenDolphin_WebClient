#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: run.sh [--compose-file FILE] [--output-root DIR] [--run-id ID] [--modes LIST]

Runs attachment upload/download parity tests for database and S3 modes.
  --compose-file   docker compose file to use (default: docker-compose.modernized.dev.yml)
  --output-root    artifact root directory (default: artifacts/parity-manual/attachments)
  --run-id         artifact subdirectory name (default: UTC timestamp)
  --modes          comma separated list or `all` (database->s3->database)
USAGE
}

COMPOSE_FILE="docker-compose.modernized.dev.yml"
OUTPUT_ROOT="artifacts/parity-manual/attachments"
SAMPLE_FILE="ops/tests/storage/attachment-mode/payloads/sample-attachment.txt"
SYSAD_USER="${SYSAD_USER_NAME:-1.3.6.1.4.1.9414.10.1:dolphin}"
SYSAD_PASS="${SYSAD_PASSWORD:-36cdf8b887a5cffc78dcd5c08991b993}"
ADMIN_MD5="${ATTACHMENT_MODE_ADMIN_MD5:-e88df8596ff8847e232b1e4b1b5ffde2}"
DOCTOR_MD5="${ATTACHMENT_MODE_DOCTOR_MD5:-632080fabdb968f9ac4f31fb55104648}"
APP_PORT="${MODERNIZED_APP_HTTP_PORT:-9080}"
RUN_ID=""
MODES_ARG="database,s3"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOAD_CONFIG_SCRIPT="$SCRIPT_DIR/load_config.sh"
SERVER_SERVICE="server-modernized-dev"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --output-root)
      OUTPUT_ROOT="$2"
      shift 2
      ;;
    --run-id)
      RUN_ID="$2"
      shift 2
      ;;
    --modes)
      MODES_ARG="$2"
      shift 2
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

require_command curl jq base64 uuidgen docker

if [[ ! -f "$SAMPLE_FILE" ]]; then
  echo "[ERROR] Sample attachment file not found at $SAMPLE_FILE" >&2
  exit 1
fi

if command -v sha256sum >/dev/null 2>&1; then
  calc_sha256() { sha256sum "$1" | awk '{print $1}'; }
elif command -v shasum >/dev/null 2>&1; then
  calc_sha256() { shasum -a 256 "$1" | awk '{print $1}'; }
else
  echo "[ERROR] Requires sha256sum or shasum" >&2
  exit 1
fi

case "$(uname -s)" in
  Darwin)
    BASE64_DECODE_FLAGS="-D"
    BASE64_ENCODE_FLAGS=""
    ;;
  *)
    BASE64_DECODE_FLAGS="--decode"
    BASE64_ENCODE_FLAGS=""
    ;;
 esac

timestamp=$(date -u +%Y%m%dT%H%M%SZ)
if [[ -z "$RUN_ID" ]]; then
  RUN_ID="$timestamp"
fi
ARTIFACT_ROOT="$OUTPUT_ROOT/$RUN_ID"
mkdir -p "$ARTIFACT_ROOT"

BASE_URL="http://localhost:${APP_PORT}/openDolphin/resources"

cleanup() {
  MODERNIZED_STORAGE_MODE=database docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

normalize_mode() {
  local token="$1"
  case "$token" in
    database|db)
      printf '%s' "database"
      ;;
    s3)
      printf '%s' "s3"
      ;;
    *)
      return 1
      ;;
  esac
}

apply_mode_config() {
  local mode="$1"
  local log_file="$2"
  if [[ ! -f "$LOAD_CONFIG_SCRIPT" ]]; then
    echo "[WARN] load_config.sh が見つからないため設定反映をスキップ: $LOAD_CONFIG_SCRIPT" | tee -a "$log_file" >&2
    return
  fi
  if ! bash "$LOAD_CONFIG_SCRIPT" --compose-file "$COMPOSE_FILE" --service "$SERVER_SERVICE" --mode "$mode" --apply >"$log_file" 2>&1; then
    echo "[ERROR] load_config.sh の実行に失敗しました。ログ: $log_file" >&2
    tail -n 50 "$log_file" >&2 || true
    exit 1
  fi
}

run_mode() {
  local mode="$1"
  local mode_label="$2"
  local mode_dir="$ARTIFACT_ROOT/$mode_label"
  mkdir -p "$mode_dir"

  echo "[INFO] ==== モード開始: $mode_label ($mode) ===="
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" up -d db-modernized minio minio-mc >/dev/null
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" up -d "$SERVER_SERVICE" >/dev/null

  wait_for_health "$mode"
  apply_mode_config "$mode" "$mode_dir/load_config.log"
  wait_for_health "$mode"
  bootstrap_environment "$mode" "$mode_dir"
  exercise_attachment_flow "$mode" "$mode_dir"
  collect_logs "$mode" "$mode_dir"
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
  echo "[INFO] ==== モード完了: $mode_label ===="
}

wait_for_health() {
  local mode="$1"
  local retries=60
  while (( retries > 0 )); do
    if curl -sf -H "userName:$SYSAD_USER" -H "password:$SYSAD_PASS" "$BASE_URL/dolphin" >/dev/null; then
      return
    fi
    sleep 5
    retries=$((retries-1))
  done
  echo "[ERROR] WildFly health check failed for mode $mode" >&2
  exit 1
}

bootstrap_environment() {
  local mode="$1"
  local mode_dir="$2"
  create_facility_admin "$mode_dir"
  create_doctor_user "$mode_dir"
  select_patient_and_karte "$mode_dir"
}

create_facility_admin() {
  local mode_dir="$1"
  local payload="$mode_dir/admin_payload.json"
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
  echo "$response" > "$mode_dir/admin_response.txt"
}

create_doctor_user() {
  local mode_dir="$1"
  local payload="$mode_dir/doctor_payload.json"
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
  curl -sf -H "userName:$ADMIN_LOGIN" -H "password:$ADMIN_MD5" -H "Content-Type: application/json" "$BASE_URL/user" -d @"$payload" > "$mode_dir/create_doctor_response.txt"
  local doctor_info
  doctor_info=$(curl -sf -H "userName:$DOCTOR_LOGIN" -H "password:$DOCTOR_MD5" "$BASE_URL/user/$DOCTOR_LOGIN")
  echo "$doctor_info" > "$mode_dir/doctor_profile.json"
  DOCTOR_USER_ID=$(echo "$doctor_info" | jq '.id')
}

select_patient_and_karte() {
  local mode_dir="$1"
  local patient_json
  patient_json=$(curl -sf -H "userName:$ADMIN_LOGIN" -H "password:$ADMIN_MD5" "$BASE_URL/patient/digit/D_")
  echo "$patient_json" > "$mode_dir/patient_list.json"
  PATIENT_PK=$(echo "$patient_json" | jq '.list[0].id')
  PATIENT_ID=$(echo "$patient_json" | jq -r '.list[0].patientId')
  local from_date="2000-01-01%2000:00:00"
  local karte_json
  karte_json=$(curl -sf -H "userName:$ADMIN_LOGIN" -H "password:$ADMIN_MD5" "$BASE_URL/karte/${PATIENT_PK},${from_date}")
  echo "$karte_json" > "$mode_dir/karte.json"
  KARTE_ID=$(echo "$karte_json" | jq '.id')
}

exercise_attachment_flow() {
  local mode="$1"
  local mode_dir="$2"
  local attachment_sha
  local attachment_size
  attachment_sha=$(calc_sha256 "$SAMPLE_FILE")
  attachment_size=$(wc -c < "$SAMPLE_FILE" | tr -d ' ')
  local attachment_b64
  attachment_b64=$(base64 $BASE64_ENCODE_FLAGS "$SAMPLE_FILE" | tr -d '\n')
  local now_epoch_ms=$(( $(date +%s) * 1000 ))
  local doc_id="ATTACH-${mode}-$(uuidgen)"
  local request="$mode_dir/document_request.json"
  cat <<JSON > "$request"
{
  "confirmed": $now_epoch_ms,
  "started": $now_epoch_ms,
  "recorded": $now_epoch_ms,
  "status": "F",
  "linkId": 0,
  "docInfo": {
    "docId": "$doc_id",
    "docType": "karte",
    "title": "Attachment Storage Test ($mode)",
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
  local response
  response=$(curl -sf -H "userName:$DOCTOR_LOGIN" -H "password:$DOCTOR_MD5" -H "Content-Type: application/json" "$BASE_URL/karte/document" -d @"$request")
  response=${response//$'\n'/}
  echo "$response" > "$mode_dir/document_response.txt"
  local doc_pk="$response"
  local documents_json
  documents_json=$(curl -sf -H "userName:$DOCTOR_LOGIN" -H "password:$DOCTOR_MD5" "$BASE_URL/karte/documents/$doc_pk")
  echo "$documents_json" > "$mode_dir/document_metadata.json"
  local attachment_id
  attachment_id=$(echo "$documents_json" | jq '.list[0].attachment[0].id')
  local attachment_json
  attachment_json=$(curl -sf -H "userName:$DOCTOR_LOGIN" -H "password:$DOCTOR_MD5" "$BASE_URL/karte/attachment/$attachment_id")
  echo "$attachment_json" > "$mode_dir/attachment_response.json"
  local attachment_b64_remote
  attachment_b64_remote=$(echo "$attachment_json" | jq -r '.bytes')
  printf '%s' "$attachment_b64_remote" | base64 $BASE64_DECODE_FLAGS > "$mode_dir/attachment-download.bin"
  local download_sha
  download_sha=$(calc_sha256 "$mode_dir/attachment-download.bin")
  {
    echo "source  $attachment_sha"
    echo "download $download_sha"
  } > "$mode_dir/hashes.txt"
  cp "$SAMPLE_FILE" "$mode_dir/original-sample.txt"
}

collect_logs() {
  local mode="$1"
  local mode_dir="$2/logs"
  mkdir -p "$mode_dir"
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" logs server-modernized-dev > "$mode_dir/server.log" || true
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" logs minio > "$mode_dir/minio.log" || true
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" logs minio-mc > "$mode_dir/minio-mc.log" || true
}

MODES_ARG="${MODES_ARG// /}"
declare -a REQUESTED_MODES=()
if [[ "$MODES_ARG" == "all" ]]; then
  REQUESTED_MODES=(database s3 database)
else
  IFS=',' read -r -a _raw_modes <<< "$MODES_ARG"
  for token in "${_raw_modes[@]}"; do
    [[ -z "$token" ]] && continue
    if ! normalized=$(normalize_mode "$token"); then
      echo "[ERROR] Unknown mode token: $token" >&2
      exit 1
    fi
    REQUESTED_MODES+=("$normalized")
  done
fi
if [[ ${#REQUESTED_MODES[@]} -eq 0 ]]; then
  echo "[ERROR] --modes には少なくとも 1 つのモードを指定してください" >&2
  exit 1
fi

database_count=0
s3_count=0
declare -a MODE_SEQUENCE=()
for mode in "${REQUESTED_MODES[@]}"; do
  case "$mode" in
    database)
      database_count=$((database_count + 1))
      local_count=$database_count
      ;;
    s3)
      s3_count=$((s3_count + 1))
      local_count=$s3_count
      ;;
    *)
      local_count=1
      ;;
  esac
  label="$mode"
  if (( local_count > 1 )); then
    label="$mode-$local_count"
  fi
  MODE_SEQUENCE+=("$mode:$label")
done

for entry in "${MODE_SEQUENCE[@]}"; do
  mode="${entry%%:*}"
  label="${entry##*:}"
  run_mode "$mode" "$label"
done

cp ops/modernized-server/docker/configure-wildfly.cli "$ARTIFACT_ROOT/configure-wildfly.cli"
mode_summary=""
for entry in "${MODE_SEQUENCE[@]}"; do
  label="${entry##*:}"
  if [[ -z "$mode_summary" ]]; then
    mode_summary="$label"
  else
    mode_summary+=" -> $label"
  fi
done
cat <<EOF2 > "$ARTIFACT_ROOT/README.md"
- RUN_ID: $RUN_ID
- Timestamp (UTC): $timestamp
- Compose file: $COMPOSE_FILE
- Sample attachment: $SAMPLE_FILE
- Modes: $mode_summary
EOF2

echo "Artifacts stored under $ARTIFACT_ROOT"
