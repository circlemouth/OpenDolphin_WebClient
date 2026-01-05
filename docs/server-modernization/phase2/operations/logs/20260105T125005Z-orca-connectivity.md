# RUN_ID=20260105T125005Z ORCA Trial API-only 疎通ログ

- 実施日: 2026-01-05 (UTC)
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic (trial / weborcatrial)
- 方式: API-only (XML UTF-8)
- 証跡: artifacts/orca-connectivity/20260105T125005Z/
- 起動: `MINIO_API_PORT=19010 MINIO_CONSOLE_PORT=19011 MODERNIZED_POSTGRES_PORT=55434 MODERNIZED_APP_HTTP_PORT=9082 MODERNIZED_APP_ADMIN_PORT=9997 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`

## API-only 主要ユースケース (HTTP 200 / Api_Result 記録)
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
### 手順
- server-modernized / web-client の raw log を対象に検索。
  - raw logs: logs/server-modernized.log.txt, logs/web-client-dev.tail.txt
- CLAIM 依存判定は `claim` のみで抽出して確認（JMS 起動ログは基盤ログ扱いで判定から除外）。
  - `rg -i "claim" logs/server-modernized.log.txt > logs/server-modernized.claim_only.txt`
  - `rg -i "claim" logs/web-client-dev.tail.txt > logs/web-client-dev.claim_only.txt`
- 参考として `claim|jms` も保存（JMS の起動/初期化ログが含まれる可能性があるため、CLAIM 依存判定には使わない）。
  - `rg -i "claim|jms" logs/server-modernized.log.txt > logs/server-modernized.claim_or_jms.txt`
  - `rg -i "claim|jms" logs/web-client-dev.tail.txt > logs/web-client-dev.claim_or_jms.txt`

### 判定
- `logs/*claim_only.txt` は `no matches` のみで、CLAIM 依存ログなしを確認。
- `logs/*claim_or_jms.txt` は JMS 起動ログが含まれても「基盤ログ」として扱い、CLAIM 依存判定から除外。

## 補足
- Authorization ヘッダは verbose log で確認済み（trial/weborcatrial）。
- systeminfv2 は Request_Date/Time を Trial 側時刻（JST）で送信。
