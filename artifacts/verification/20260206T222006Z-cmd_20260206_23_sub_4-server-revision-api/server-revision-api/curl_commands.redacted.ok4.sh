#!/usr/bin/env bash
set -euo pipefail
BASE_URL='http://localhost:9080/openDolphin/resources'
: "${OD_USER:?set OD_USER}"
: "${OD_PASS:?set OD_PASS}"

curl -sS -H "userName: $OD_USER" -H "password: $OD_PASS" "$BASE_URL/karte/revisions?karteId=9058&visitDate=2026-02-06" | jq .
curl -sS -H "userName: $OD_USER" -H "password: $OD_PASS" "$BASE_URL/karte/revisions/9192" | jq .
curl -sS -H "userName: $OD_USER" -H "password: $OD_PASS" "$BASE_URL/karte/revisions/diff?fromRevisionId=9192&toRevisionId=9193" | jq .
