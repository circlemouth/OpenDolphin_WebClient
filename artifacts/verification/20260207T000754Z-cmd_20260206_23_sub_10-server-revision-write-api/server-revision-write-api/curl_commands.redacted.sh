#!/usr/bin/env bash
set -euo pipefail
BASE_URL='http://localhost:9080/openDolphin/resources'
: "${OD_USER:?set OD_USER}"
: "${OD_PASS:?set OD_PASS}"

# Phase2 write APIs
curl -sS -H "userName: $OD_USER" -H "password: $OD_PASS" -H 'Content-Type: application/json' \
  -X POST "$BASE_URL/karte/revisions/revise" \
  -d '{"sourceRevisionId": 9192, "baseRevisionId": 9193}' | jq .

curl -sS -H "userName: $OD_USER" -H "password: $OD_PASS" -H 'Content-Type: application/json' \
  -X POST "$BASE_URL/karte/revisions/restore" \
  -d '{"sourceRevisionId": 9193, "baseRevisionId": 9194}' | jq .

# Conflict example (stale baseRevisionId should return 409)
curl -sS -H "userName: $OD_USER" -H "password: $OD_PASS" -H 'Content-Type: application/json' \
  -X POST "$BASE_URL/karte/revisions/revise" \
  -d '{"sourceRevisionId": 9192, "baseRevisionId": 9193}' -D /dev/stderr -o /dev/stdout
