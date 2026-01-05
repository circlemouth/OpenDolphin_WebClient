# RUN_ID=20260105T125005Z ORCA Trial API-only 疎通ログ

- 実施日: 2026-01-05 (UTC)
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic (trial / weborcatrial)
- 方式: API-only (XML UTF-8)
- 証跡: artifacts/orca-connectivity/20260105T125005Z/
- 起動: `MINIO_API_PORT=19010 MINIO_CONSOLE_PORT=19011 MODERNIZED_POSTGRES_PORT=55434 MODERNIZED_APP_HTTP_PORT=9082 MODERNIZED_APP_ADMIN_PORT=9997 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`

## 実施 API (HTTP 200 / Api_Result 記録)
- system01dailyv2: HTTP 200 / Api_Result=00
  - request: trial/system01dailyv2/request.xml
  - response: trial/system01dailyv2/response.xml
  - headers: trial/system01dailyv2/response.headers
  - curl verbose: trial/system01dailyv2/request_v.curl_verbose.txt
- systeminfv2: HTTP 200 / Api_Result=0000
  - request: trial/systeminfv2/request.xml
  - response: trial/systeminfv2/response.xml
  - headers: trial/systeminfv2/response.headers
  - curl verbose: trial/systeminfv2/request_v.curl_verbose.txt
- system01lstv2 (class=01): HTTP 200 / Api_Result=00
  - request: trial/system01lstv2/request.xml
  - response: trial/system01lstv2/response.xml
  - headers: trial/system01lstv2/response.headers
  - curl verbose: trial/system01lstv2/request_v.curl_verbose.txt

## CLAIM 依存ログ確認
- server-modernized / web-client のログを `claim|jms` で検索し、該当なしを確認。
  - logs/server-modernized.claim_jms.txt
  - logs/web-client-dev.claim_jms.txt
  - raw logs: logs/server-modernized.log.txt, logs/web-client-dev.tail.txt

## 補足
- Authorization ヘッダは verbose log で確認済み（trial/weborcatrial）。
- systeminfv2 は Request_Date/Time を Trial 側時刻（JST）で送信。
