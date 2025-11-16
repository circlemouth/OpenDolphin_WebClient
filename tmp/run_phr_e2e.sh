#!/usr/bin/env bash
set -euo pipefail
RUN_ID=20251121TrialPHRSeqZ1-E2E
BASE="http://localhost:9080/openDolphin/resources"
RUN_DIR="artifacts/orca-connectivity/${RUN_ID}"
HTTP_DIR="${RUN_DIR}/httpdump"
TRACE_DIR="${RUN_DIR}/trace"
LOG_DIR="${RUN_DIR}/logs"
mkdir -p "${HTTP_DIR}" "${TRACE_DIR}" "${LOG_DIR}/audit"
COMMON=(-sS
  -H "userName:1.3.6.1.4.1.9414.72.103:doctor1"
  -H "password:632080fabdb968f9ac4f31fb55104648"
  -H "X-Facility-Id:1.3.6.1.4.1.9414.72.103"
  -H "X-Touch-TraceId:${RUN_ID}"
  -H "X-Access-Reason:phr-e2e")
run_curl() {
  local dir="$1"; shift
  local trace_name="$1"; shift
  local output="$1"; shift
  mkdir -p "${dir}" "$(dirname "${TRACE_DIR}/${trace_name}")"
  curl "${COMMON[@]}" "$@" -D "${dir}/response.headers" \
    --trace-ascii "${TRACE_DIR}/${trace_name}" \
    -o "${output}"
}
run_curl_accept() {
  local dir="$1"; shift
  local trace_name="$1"; shift
  local output="$1"; shift
  local accept="$1"; shift
  run_curl "${dir}" "${trace_name}" "${output}" -H "Accept: ${accept}" "$@"
}
run_curl_text() {
  local dir="$1"; shift
  local trace_name="$1"; shift
  local output="$1"; shift
  run_curl_accept "${dir}" "${trace_name}" "${output}" 'text/plain' "$@"
}
run_curl_json() {
  local dir="$1"; shift
  local trace_name="$1"; shift
  local output="$1"; shift
  run_curl_accept "${dir}" "${trace_name}" "${output}" 'application/json' "$@"
}
run_curl_octet() {
  local dir="$1"; shift
  local trace_name="$1"; shift
  local output="$1"; shift
  run_curl_accept "${dir}" "${trace_name}" "${output}" 'application/octet-stream' "$@"
}
# Phase A: PUT accessKey
run_curl_octet \
  "${HTTP_DIR}/phr02_accessKey" \
  "phr02_accessKey.trace.log" \
  "${HTTP_DIR}/phr02_accessKey/response.bin" \
  -X PUT -H 'Content-Type: application/json' \
  --data @"${RUN_DIR}/phr-seq/10_key-management/PHR-02_request.json" \
  "${BASE}/20/adm/phr/accessKey"
# Phase A: GET accessKey by key
run_curl_json \
  "${HTTP_DIR}/phr03_accessKey_lookup" \
  "phr03_accessKey_lookup.trace.log" \
  "${HTTP_DIR}/phr03_accessKey_lookup/response.json" \
  "${BASE}/20/adm/phr/accessKey/PHR-WEB1001-ACCESS"
# Phase A: GET accessKey by patient
run_curl_json \
  "${HTTP_DIR}/phr10_patient_lookup" \
  "phr10_patient_lookup.trace.log" \
  "${HTTP_DIR}/phr10_patient_lookup/response.json" \
  "${BASE}/20/adm/phr/patient/WEB1001"
# Phase B endpoints
run_curl_text "${HTTP_DIR}/phr04_allergy" "phr04_allergy.trace.log" "${HTTP_DIR}/phr04_allergy/response.txt" "${BASE}/20/adm/phr/allergy/WEB1001"
run_curl_text "${HTTP_DIR}/phr05_disease" "phr05_disease.trace.log" "${HTTP_DIR}/phr05_disease/response.txt" "${BASE}/20/adm/phr/disease/WEB1001"
run_curl_text "${HTTP_DIR}/phr09_medication" "phr09_medication.trace.log" "${HTTP_DIR}/phr09_medication/response.txt" "${BASE}/20/adm/phr/medication/WEB1001"
run_curl_text "${HTTP_DIR}/phr08_labtest" "phr08_labtest.trace.log" "${HTTP_DIR}/phr08_labtest/response.txt" "${BASE}/20/adm/phr/labtest/WEB1001"
run_curl_text "${HTTP_DIR}/phr01_abnormal" "phr01_abnormal.trace.log" "${HTTP_DIR}/phr01_abnormal/response.txt" "${BASE}/20/adm/phr/abnormal/WEB1001"
# Phase C: identityToken
run_curl_text \
  "${HTTP_DIR}/phr06_identityToken" \
  "phr06_identityToken.trace.log" \
  "${HTTP_DIR}/phr06_identityToken/response.txt" \
  -H 'Content-Type: application/json' \
  -H 'X-Consent-Token: consent-20251115' \
  --data @"${RUN_DIR}/phr-seq/30_layer-id/PHR-06_request.json" \
  "${BASE}/20/adm/phr/identityToken"
# Phase D: image
run_curl_accept \
  "${HTTP_DIR}/phr07_image" \
  "phr07_image.trace.log" \
  "${HTTP_DIR}/phr07_image/response.jpg" \
  'image/jpeg' \
  "${BASE}/20/adm/phr/image/WEB1001"
# Phase E: container
run_curl_json \
  "${HTTP_DIR}/phr11_container" \
  "phr11_container.trace.log" \
  "${HTTP_DIR}/phr11_container/response.json" \
  "${BASE}/20/adm/phr/1.3.6.1.4.1.9414.72.103,WEB1001,20240101,20240101"
# Export job submit
run_curl_json \
  "${HTTP_DIR}/phr_export_submit" \
  "phr_export_submit.trace.log" \
  "${HTTP_DIR}/phr_export_submit/response.json" \
  -X POST -H 'Content-Type: application/json' \
  --data @"${RUN_DIR}/phr-seq/60_export-track/PHR_EXPORT_REQUEST.json" \
  "${BASE}/20/adm/phr/export"
JOB_ID=$(jq -r '.jobId' "${HTTP_DIR}/phr_export_submit/response.json")
printf '%s\n' "${JOB_ID}" > "${LOG_DIR}/job_id.txt"
for attempt in {1..10}; do
  run_curl_json \
    "${HTTP_DIR}/phr_export_status" \
    "phr_export_status.trace.log" \
    "${HTTP_DIR}/phr_export_status/response.json" \
    "${BASE}/20/adm/phr/status/${JOB_ID}"
  state=$(jq -r '.state' "${HTTP_DIR}/phr_export_status/response.json")
  [[ "${state}" == "SUCCEEDED" ]] && break
  sleep 1
done
DOWNLOAD_URL=$(jq -r '.downloadUrl' "${HTTP_DIR}/phr_export_status/response.json")
printf '%s\n' "${DOWNLOAD_URL}" > "${LOG_DIR}/audit/signed_url.txt"
if [[ "${DOWNLOAD_URL}" == http* ]]; then
  DOWNLOAD_TARGET="${DOWNLOAD_URL}"
else
  DOWNLOAD_TARGET="http://localhost:9080${DOWNLOAD_URL}"
fi
run_curl \
  "${HTTP_DIR}/phr_export_artifact" \
  "phr_export_artifact.trace.log" \
  "${HTTP_DIR}/phr_export_artifact/artifact.zip" \
  -L "${DOWNLOAD_TARGET}"
unzip -l "${HTTP_DIR}/phr_export_artifact/artifact.zip" > "${HTTP_DIR}/phr_export_artifact/contents.txt"
