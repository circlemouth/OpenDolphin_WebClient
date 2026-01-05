# RUN_ID=20260105T112435Z ORCA Trial API-only 疎通ログ

- 実施日: 2026-01-05 (UTC)
- 接続先: https://weborca-trial.orca.med.or.jp
- 認証: Basic (trial / weborcatrial)
- 方式: API-only (XML UTF-8)
- 証跡: artifacts/orca-connectivity/20260105T112435Z/

## 結果
- system01dailyv2: HTTP 200 / Api_Result=00
  - request: trial/system01dailyv2/request.xml
  - response: trial/system01dailyv2/response_v5.xml
  - headers: trial/system01dailyv2/response_v5.headers
  - curl verbose: trial/system01dailyv2/request_v5.curl_verbose.log
- systeminfv2: HTTP 200 / Api_Result=0006（時間ずれ）
  - request: trial/systeminfv2/request.xml
  - response: trial/systeminfv2/response_v2.xml
  - headers: trial/systeminfv2/response_v2.headers
  - curl verbose: trial/systeminfv2/request_v2.curl_verbose.log

## 補足
- Authorization ヘッダは verbose log で確認済み（trial/weborcatrial）。
- 旧URL (`/api01rv2/...`) でも 200 だが、WebORCA 仕様に合わせ `/api/api01rv2/...` を正とする。
