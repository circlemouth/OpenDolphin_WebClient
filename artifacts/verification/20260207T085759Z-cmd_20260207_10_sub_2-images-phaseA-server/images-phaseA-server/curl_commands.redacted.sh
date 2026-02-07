#!/usr/bin/env bash
set -euo pipefail
BASE_URL="http://localhost:9080/openDolphin/resources"
PID="P0002"
AUTH_USER="<userName>"   # set real value in env or replace
AUTH_PASS="<password>"   # set real value in env or replace

curl -sS -D 00_no_auth.headers.txt -o 00_no_auth.body.txt -w '%{http_code}\n' \
  "$BASE_URL/patients/$PID/images"

curl -sS -D 01_feature_off.headers.txt -o 01_feature_off.body.json -w '%{http_code}\n' \
  -H "userName: $AUTH_USER" -H "password: $AUTH_PASS" \
  "$BASE_URL/patients/$PID/images"

curl -sS -D 02_upload.headers.txt -o 02_upload.body.json -w '%{http_code}\n' \
  -H "X-Feature-Images: 1" \
  -H "userName: $AUTH_USER" -H "password: $AUTH_PASS" \
  -F "file=@test.png;type=image/png" \
  "$BASE_URL/patients/$PID/images"

curl -sS -D 03_list.headers.txt -o 03_list.body.json -w '%{http_code}\n' \
  -H "X-Feature-Images: 1" \
  -H "userName: $AUTH_USER" -H "password: $AUTH_PASS" \
  "$BASE_URL/patients/$PID/images"

IMG_ID="<imageId from upload response>"
curl -sS -D 04_download.headers.txt -o 04_downloaded.bin -w '%{http_code}\n' \
  -H "X-Feature-Images: 1" \
  -H "userName: $AUTH_USER" -H "password: $AUTH_PASS" \
  "$BASE_URL/patients/$PID/images/$IMG_ID"
