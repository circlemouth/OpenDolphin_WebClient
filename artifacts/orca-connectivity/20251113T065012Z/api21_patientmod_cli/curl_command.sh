#!/bin/sh
# 未実行: Patient_ID 未採番のため。
# 実行時は tmp/orca-api-payloads/03_medicalmodv2_payload.xml の Patient_ID を採番済み 8 桁へ置換してから以下を使用。
docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 sh -c "cd / && \
  curl -sS -D /tmp/api21_headers.txt -o /tmp/api21_body.json \
    -u ormaster:change_me \
    -H 'Content-Type: application/xml; charset=UTF-8' \
    --data-binary @tmp/orca-api-payloads/03_medicalmodv2_payload.xml \
    'http://localhost:8000/api/api21/medicalmodv2?class=01'"
