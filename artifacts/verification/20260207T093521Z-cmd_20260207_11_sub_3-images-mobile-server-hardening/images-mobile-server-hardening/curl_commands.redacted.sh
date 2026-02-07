#!/usr/bin/env bash
set -euo pipefail
BASE_URL="http://localhost:9080/openDolphin/resources"
PID="P0002"
RUN_ID="<run_id>"
AUTH_USER_OK="<userName>"
AUTH_PASS_OK="<password>"
AUTH_USER_OTHER="<other_userName>"
AUTH_PASS_OTHER="<other_password>"

curl -sS -D 01_401_no_auth.headers.txt -o 01_401_no_auth.body.txt -w '%{http_code}\n' \
  -H "X-Run-Id: $RUN_ID" -H "X-Feature-Images: 1" \
  "$BASE_URL/patients/$PID/images"

curl -sS -D 02_404_feature_off.headers.txt -o 02_404_feature_off.body.json -w '%{http_code}\n' \
  -H "X-Run-Id: $RUN_ID" \
  -H "userName: $AUTH_USER_OK" -H "password: $AUTH_PASS_OK" \
  "$BASE_URL/patients/$PID/images"

curl -sS -D 03_403_other_facility.headers.txt -o 03_403_other_facility.body.json -w '%{http_code}\n' \
  -H "X-Run-Id: $RUN_ID" -H "X-Feature-Images: 1" \
  -H "userName: $AUTH_USER_OTHER" -H "password: $AUTH_PASS_OTHER" \
  "$BASE_URL/patients/$PID/images"

curl -sS -D 04_415_unsupported.headers.txt -o 04_415_unsupported.body.json -w '%{http_code}\n' \
  -H "X-Run-Id: $RUN_ID" -H "X-Feature-Images: 1" \
  -H "userName: $AUTH_USER_OK" -H "password: $AUTH_PASS_OK" \
  -F "file=@bad.bin;type=application/octet-stream" \
  "$BASE_URL/patients/$PID/images"

curl -sS -D 05_413_too_large.headers.txt -o 05_413_too_large.body.json -w '%{http_code}\n' \
  -H "X-Run-Id: $RUN_ID" -H "X-Feature-Images: 1" \
  -H "userName: $AUTH_USER_OK" -H "password: $AUTH_PASS_OK" \
  -F "file=@too_large.png;type=image/png" \
  "$BASE_URL/patients/$PID/images"

curl -sS -D 06_200_upload_ok.headers.txt -o 06_200_upload_ok.body.json -w '%{http_code}\n' \
  -H "X-Run-Id: $RUN_ID" -H "X-Feature-Images: 1" \
  -H "userName: $AUTH_USER_OK" -H "password: $AUTH_PASS_OK" \
  -F "file=@ok.png;type=image/png" \
  "$BASE_URL/patients/$PID/images"

curl -sS -D 07_200_list.headers.txt -o 07_200_list.body.json -w '%{http_code}\n' \
  -H "X-Run-Id: $RUN_ID" -H "X-Feature-Images: 1" \
  -H "userName: $AUTH_USER_OK" -H "password: $AUTH_PASS_OK" \
  "$BASE_URL/patients/$PID/images"

IMG_ID="<imageId from upload response>"
curl -sS -D 08_200_download.headers.txt -o 08_200_download.bin -w '%{http_code}\n' \
  -H "X-Run-Id: $RUN_ID" -H "X-Feature-Images: 1" \
  -H "userName: $AUTH_USER_OK" -H "password: $AUTH_PASS_OK" \
  "$BASE_URL/patients/$PID/images/$IMG_ID"
