#!/bin/sh
curl -sS -D api21_headers.txt -o api21_body.json \
  -u ormaster:change_me \
  -H 'Content-Type: application/xml; charset=UTF-8' \
  --data-binary @tmp/orca-api-payloads/03_medicalmodv2_payload.xml \
  'http://localhost:8000/api/api21/medicalmodv2?class=01'
