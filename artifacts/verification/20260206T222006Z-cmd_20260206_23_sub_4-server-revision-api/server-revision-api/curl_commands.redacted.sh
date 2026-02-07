# redacted: set USER_NAME/PASSWORD values locally; do not commit secrets
BASE_URL="http://localhost:9080/openDolphin/resources"
USER_NAME="<REDACTED>"
PASSWORD="<REDACTED>"

# 1) history list
curl -sS -D history.headers.txt -o history.body.json -w "%{http_code}\n" -H "userName: ${USER_NAME}" -H "password: ${PASSWORD}" "$BASE_URL/karte/revisions?karteId=9058&visitDate=2026-02-06" > history.http_code.txt
# 2) get revision snapshot
curl -sS -D rev_9192.headers.txt -o rev_9192.body.json -w "%{http_code}\n" -H "userName: ${USER_NAME}" -H "password: ${PASSWORD}" "$BASE_URL/karte/revisions/9192" > rev_9192.http_code.txt
# 3) diff
curl -sS -D diff.headers.txt -o diff.body.json -w "%{http_code}\n" -H "userName: ${USER_NAME}" -H "password: ${PASSWORD}" "$BASE_URL/karte/revisions/diff?fromRevisionId=9192&toRevisionId=9193" > diff.http_code.txt
