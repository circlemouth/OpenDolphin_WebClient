#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: run.sh [--compose-file FILE] [--output-root DIR]

Runs attachment upload/download parity tests for database and S3 modes.
  --compose-file   docker compose file to use (default: docker-compose.modernized.dev.yml)
  --output-root    artifact root directory (default: artifacts/parity-manual/attachments)
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
ARTIFACT_ROOT="$OUTPUT_ROOT/$timestamp"
mkdir -p "$ARTIFACT_ROOT"

BASE_URL="http://localhost:${APP_PORT}/openDolphin/resources"

cleanup() {
  MODERNIZED_STORAGE_MODE=database docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

run_mode() {
  local mode="$1"
  local mode_dir="$ARTIFACT_ROOT/$mode"
  mkdir -p "$mode_dir"

  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" up -d db-modernized minio minio-mc >/dev/null
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" up -d server-modernized-dev >/dev/null

  wait_for_health "$mode"
  bootstrap_environment "$mode" "$mode_dir"
  exercise_attachment_flow "$mode" "$mode_dir"
  collect_logs "$mode" "$mode_dir"
  MODERNIZED_STORAGE_MODE=$mode docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
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
  local now_iso=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local ms_now=$(( $(date +%s) * 1000 ))
  local doc_id="ATTACH-${mode}-$(uuidgen)"
  local request="$mode_dir/document_request.json"
  cat <<JSON > "$request"
{
  "confirmed": "$now_iso",
  "started": "$now_iso",
  "recorded": "$now_iso",
  "status": "F",
  "linkId": 0,
  "docInfo": {
    "docId": "$doc_id",
    "docType": "karte",
    "title": "Attachment Storage Test ($mode)",
    "purpose": "diagnosis",
    "confirmDate": "$now_iso",
    "firstConfirmDate": "$now_iso",
    "department": "01",
    "departmentDesc": "General",
    "healthInsurance": "060",
    "hasImage": false,
    "hasRp": false,
    "hasTreatment": false,
    "hasLaboTest": false,
    "sendClaim": false
  },
  "karteBean": {"id": $KARTE_ID},
  "userModel": {"id": $DOCTOR_USER_ID},
  "attachment": [
    {
      "confirmed": "$now_iso",
      "started": "$now_iso",
      "recorded": "$now_iso",
      "status": "F",
      "userModel": {"id": $DOCTOR_USER_ID},
      "karteBean": {"id": $KARTE_ID},
      "fileName": "sample-attachment.txt",
      "contentType": "text/plain",
      "contentSize": $attachment_size,
      "lastModified": $ms_now,
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

run_mode database
run_mode s3

cp ops/modernized-server/docker/configure-wildfly.cli "$ARTIFACT_ROOT/configure-wildfly.cli"
cat <<EOF2 > "$ARTIFACT_ROOT/README.md"
- Timestamp (UTC): $timestamp
- Compose file: $COMPOSE_FILE
- Sample attachment: $SAMPLE_FILE
EOF2

echo "Artifacts stored under $ARTIFACT_ROOT"
