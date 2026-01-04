# ORCA Connectivity Evidence (RUN_ID=20260104T071138Z)

## 接続情報（マスク済み）
- Base URL: https://weborca.cloud.orcamo.jp:443
- 認証: PKCS#12 + Basic（値は <MASKED>）

## 実行ログ
- DNS: `dns/resolve.log`
- TLS: `tls/openssl_s_client.log`
- ORCA API (system01dailyv2):
  - Request: `docs/server-modernization/phase2/operations/assets/orca-api-requests/44_system01dailyv2_request.json`
  - Response headers: `trial/system01dailyv2/response.headers`
  - Response body: `trial/system01dailyv2/response.json`
  - Trace: `trace/system01dailyv2.trace`

## Web クライアント操作（UI RUN_ID）
- Reception/Charts/Patients: `RUN_ID=20260104T073430Z`
- Administration (system_admin): `RUN_ID=20260104T073931Z`
- 監査ログ到達確認: `audit/audit_events.tsv`

## スクリーンショット
- Reception: `screenshots/reception.png`
- Charts: `screenshots/charts.png`
- Patients: `screenshots/patients.png`
- Administration: `screenshots/administration.png`

## ServerInfo
- claim.conn: `serverinfo/claim_conn.json` (expect: `server`)
