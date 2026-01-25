# RUN_ID=20260125T012500Z WebORCA 直結 + dev proxy 検証

## 目的
- WebORCA 直結時に `/api` 付与が正しく行われ、404/405 が発生しないことを実測で確認する。
- dev proxy 経由でも `/api` 補完が有効で、同様に 404/405 を回避できることを確認する。

## 接続情報（機微情報はマスク）
- 接続先: WebORCA Trial（`https://weborca-trial.orca.med.or.jp`）
- 認証: Basic（`trial/<MASKED>`）
- ORCA_MODE: `weborca`
- ORCA_API_PATH_PREFIX: `auto`（/api 自動付与）

## WebORCA 直結（curl）
### system01dailyv2
- Endpoint: `POST /api/api01rv2/system01dailyv2`
- Status: **200**
- Api_Result: **00**
- req: `artifacts/orca-connectivity/20260125T012500Z/44_system01dailyv2_request.xml`
- res: `artifacts/orca-connectivity/20260125T012500Z/system01dailyv2_response.xml`
- headers/status: `artifacts/orca-connectivity/20260125T012500Z/system01dailyv2_headers.txt`
  / `artifacts/orca-connectivity/20260125T012500Z/system01dailyv2_status.txt`

### manageusersv2 (Request_Number=01)
- Endpoint: `POST /api/orca101/manageusersv2`
- Status: **200**
- Api_Result: **0000**
- req: `artifacts/orca-connectivity/20260125T012500Z/manageusersv2_list_request.xml`
- res: `artifacts/orca-connectivity/20260125T012500Z/manageusersv2_list_response.xml`
- headers/status: `artifacts/orca-connectivity/20260125T012500Z/manageusersv2_list_headers.txt`
  / `artifacts/orca-connectivity/20260125T012500Z/manageusersv2_list_status.txt`

## dev proxy（Vite）
### 起動
- `WEB_CLIENT_MODE=npm` / `WEB_CLIENT_DEV_PROXY_TARGET=https://weborca-trial.orca.med.or.jp`
- `VITE_ORCA_MODE=weborca`
- `FLYWAY_MIGRATE_ON_BOOT=0`（Flyway 重複版 `V0230` を回避）

### system01dailyv2
- Endpoint: `POST http://localhost:5173/api01rv2/system01dailyv2`
- Status: **200**
- Api_Result: **00**
- res: `artifacts/webclient/orca-e2e/20260125T012500Z/devproxy_system01dailyv2_response.xml`
- headers/status: `artifacts/webclient/orca-e2e/20260125T012500Z/devproxy_system01dailyv2_headers.txt`
  / `artifacts/webclient/orca-e2e/20260125T012500Z/devproxy_system01dailyv2_status.txt`

### manageusersv2
- Endpoint: `POST http://localhost:5173/orca101/manageusersv2`
- Status: **200**
- Api_Result: **0000**
- res: `artifacts/webclient/orca-e2e/20260125T012500Z/devproxy_manageusersv2_response.xml`
- headers/status: `artifacts/webclient/orca-e2e/20260125T012500Z/devproxy_manageusersv2_headers.txt`
  / `artifacts/webclient/orca-e2e/20260125T012500Z/devproxy_manageusersv2_status.txt`

## 結論
- WebORCA 直結および dev proxy 経由の双方で **HTTP 200** を確認。
- `/api` 付与漏れによる **404/405 は発生しない** ことを実測で確認できた。
