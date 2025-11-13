#!/bin/bash
set -euo pipefail
export PATIENT_ID_TEST=0000001
curl -sS -u ormaster:change_me -H 'Content-Type: application/xml; charset=UTF-8' -H 'Expect:' \
  --data-binary @tmp/orca-api-payloads/03_medicalmodv2_payload.xml \
  'http://localhost:8000/api/api21/medicalmodv2?class=01'
