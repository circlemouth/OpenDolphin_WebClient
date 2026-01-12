# ORCA Trial 公式 API 疎通確認（RUN_ID=20260112T004756Z）

## 実施内容
- modernized server 起動: `WEB_CLIENT_MODE=npm MODERNIZED_APP_HTTP_PORT=19182 MODERNIZED_APP_ADMIN_PORT=19998 MODERNIZED_POSTGRES_PORT=55440 MINIO_API_PORT=19102 MINIO_CONSOLE_PORT=19103 ./setup-modernized-env.sh`
- ORCA 接続先: `https://weborca-trial.orca.med.or.jp`（Basic `trial` / `<MASKED>`）
- 送信ヘッダー: `Content-Type: application/xml; charset=UTF-8`, `Accept: application/xml`
- 認証ヘッダー: `userName: dolphindev`, `password: <MASKED>`（MD5）, `X-Facility-Id: 1.3.6.1.4.1.9414.10.1`

## 結果
- `POST /api/api01rv2/system01lstv2?class=02` → HTTP 200 / `Api_Result=00`（Dr コード取得）
- `POST /api/orca101/manageusersv2` → HTTP 200 / `Api_Result=0000`
- `POST /api/api01rv2/acceptlstv2?class=01` → HTTP 200 / `Api_Result=21`（受付なし）

## 証跡
- `artifacts/orca-connectivity/20260112T004756Z/request/*.xml`
- `artifacts/orca-connectivity/20260112T004756Z/response/*.body.xml`
- `artifacts/orca-connectivity/20260112T004756Z/response/*.status.txt`
- `artifacts/orca-connectivity/20260112T004756Z/headers/*.headers.txt`
