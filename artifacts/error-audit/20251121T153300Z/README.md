# 20251121T153300Z エラーハンドリング採取ノート（親 RUN_ID=20251120T193040Z）

- 接続先: `http://100.102.17.40:8000`（Basic: ormaster/change_me、Authorization はマスク済み）。
- 目的: 新 ORCA で Api_Result=00 の成功ケースと、認証失敗・患者未登録エラーの HTTP 失敗ケースを採取し、trace/httpdump/metrics へ保存する。
- 取得結果:
  - `POST /api01rv2/system01dailyv2?class=00`（正しい Basic）→ HTTP 200 / Api_Result=00。`trace_http/trace_http_success.txt` と `httpdump/system01dailyv2_success/` に保存。
  - `POST /api01rv2/system01dailyv2?class=00`（誤パスワード）→ HTTP 401 JSON（code=401, message=Unauthorized）。`trace_http/trace_http_authfail.txt` と `httpdump/system01dailyv2_authfail/`。
  - `GET /api01rv2/patientgetv2?id=999999`（未登録患者）→ HTTP 404 JSON（code=404, message=Not Found）。`trace_http/trace_http_patient.txt` と `httpdump/patientgetv2_notfound/`。
  - `GET /actuator/health`（監視エンドポイント確認）→ HTTP 404 JSON（code=404, message=Not Found）。`metrics/health_<timestamp>.{headers,json}`。
- ディレクトリ: `trace_http/`（Authorization マスク済み trace）、`httpdump/`（request/response）、`metrics/`（actuator 健康チェック）。
