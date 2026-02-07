#!/usr/bin/env bash
set -euo pipefail
BASE_URL='http://localhost:9080/openDolphin/resources'
USER='<REDACTED_USER>'
PASS='<REDACTED_PASSWORD>'
REQ_ID='<REDACTED_REQUEST_ID>'
TRACE_ID='<REDACTED_TRACE_ID>'

curl -sS -D history.headers.txt -o history.body.json -w '%{http_code}\n' \
  -H "userName: ${USER}" -H "password: ${PASS}" \
  -H "X-Request-Id: ${REQ_ID}" -H "X-Trace-Id: ${TRACE_ID}" \
  "${BASE_URL}/karte/revisions?karteId=9058&visitDate=2026-02-07" > history.http_code.txt

curl -sS -D revision.headers.txt -o revision.body.json -w '%{http_code}\n' \
  -H "userName: ${USER}" -H "password: ${PASS}" \
  -H "X-Request-Id: ${REQ_ID}" -H "X-Trace-Id: ${TRACE_ID}" \
  "${BASE_URL}/karte/revisions/9193" > revision.http_code.txt

curl -sS -D diff.headers.txt -o diff.body.json -w '%{http_code}\n' \
  -H "userName: ${USER}" -H "password: ${PASS}" \
  -H "X-Request-Id: ${REQ_ID}" -H "X-Trace-Id: ${TRACE_ID}" \
  "${BASE_URL}/karte/revisions/diff?fromRevisionId=9192&toRevisionId=9193" > diff.http_code.txt
