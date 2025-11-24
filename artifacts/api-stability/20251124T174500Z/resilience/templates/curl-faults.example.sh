#!/usr/bin/env bash
# ORCA マスター フォールトインジェクション curl テンプレート
# RUN_ID や BASE URL を環境に合わせて上書きしてください。

set -euo pipefail

RUN_ID=${RUN_ID:-20251124T174500Z}
BASE=${BASE:-http://100.102.17.40:8000}
TARGET=${TARGET:-"${BASE}/orca/master/address?zip=0600000"}

log() { printf "[%s] %s\n" "$(date -u +%FT%TZ)" "$*"; }

scenario_db_down() {
  log "DB down / network遮断 (connect-to 127.0.0.1)"
  curl --connect-to 100.102.17.40:8000:127.0.0.1 -m 2 -s -D - "$TARGET" \
    -H "X-Run-Id:${RUN_ID}" -w '\nstatus=%{http_code} time_total=%{time_total}\n'
}

scenario_slow_query() {
  log "スロークエリ (>3s)"
  curl -m 2 -s -D - "$TARGET" \
    -H "X-Run-Id:${RUN_ID}" -w '\nstatus=%{http_code} time_total=%{time_total}\n'
}

scenario_http_500() {
  log "500 応答"
  curl -s -D - "$TARGET" \
    -H "X-Debug-Fault: http-500" -H "X-Run-Id:${RUN_ID}" -w '\nstatus=%{http_code}\n'
}

scenario_http_503() {
  log "503 応答"
  curl -s -D - "$TARGET" \
    -H "X-Debug-Fault: http-503" -H "X-Run-Id:${RUN_ID}" -w '\nstatus=%{http_code}\n'
}

scenario_429() {
  log "429 レート制限"
  curl -s -D - -o /dev/null "$TARGET" \
    -H "Retry-After: 5" -H "X-Run-Id:${RUN_ID}" -w 'status=%{http_code}\n'
}

scenario_dns_fail() {
  log "DNS 失敗 (無効ホスト強制)"
  curl --resolve api.orca.invalid:8000:0.0.0.0 -s -D - "http://api.orca.invalid:8000/orca/master/address?zip=0600000" \
    -H "X-Run-Id:${RUN_ID}" -w '\nstatus=%{http_code} time_total=%{time_total}\n'
}

scenario_tls_fail() {
  log "TLS 失敗 (無効 CA)"
  curl --cacert "$(dirname "$0")/invalid-ca.crt" -s -D - "$TARGET" \
    -H "X-Run-Id:${RUN_ID}" -w '\nstatus=%{http_code} time_total=%{time_total}\n'
}

main() {
  scenario_db_down
  scenario_slow_query
  scenario_http_500
  scenario_http_503
  scenario_429
  scenario_dns_fail
  scenario_tls_fail
}

main "$@"
