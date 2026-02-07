#!/usr/bin/env bash
set -euo pipefail
BASE_URL='http://localhost:9080/openDolphin/resources'
# NOTE: provide credentials via env vars (do not write to disk)
: "${OD_USER:?set OD_USER}"
: "${OD_PASS:?set OD_PASS}"

curl -sS -u "$OD_USER:$OD_PASS" "$BASE_URL/karte/revisions?karteId=9058&visitDate=2026-02-06" | jq .
curl -sS -u "$OD_USER:$OD_PASS" "$BASE_URL/karte/revisions/9192" | jq .
curl -sS -u "$OD_USER:$OD_PASS" "$BASE_URL/karte/revisions/diff?fromRevisionId=9192&toRevisionId=9193" | jq .
