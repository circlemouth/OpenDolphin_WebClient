# PHR Export 証跡取得
- 期間: 2026-01-09 11:00 - 2026-01-10 11:00 / 優先度: medium / 緊急度: medium
- RUN_ID: 20251226T133021Z
- YAML ID: `src/server_modernized_gap_20251221/08_evidence_package/PHR_Export_証跡取得.md`

## 目的
- PHR Export の S3/署名 URL 実測と監査証跡を取得する。
- 運用設定（S3/署名鍵/TTL）と監査メタ（storageType/bandwidthProfile/kmsKeyAlias）の整合を確認する。

## 実測ステータス
- **実測は HTTP 500 で停止**（ジョブ登録で `PGobject` 参照の `NoClassDefFoundError` が発生）。
- 署名 URL 発行まで到達せず、S3 backend の実測は未達。
- 実行環境の `PHR_EXPORT_STORAGE_TYPE` は `filesystem` のまま（S3 設定未反映）。
- サーバーは起動済みのため再起動は行っていない。

## 実施環境
- Modernized サーバー: `http://localhost:9080/openDolphin/resources`
- 認証: `userName=dolphindev` / `password=<MD5>`
- Facility: `1.3.6.1.4.1.9414.10.1`
- PHR Export 設定（抜粋）:
  - `PHR_EXPORT_STORAGE_TYPE=filesystem`
  - `PHR_EXPORT_SIGNING_SECRET=dev-phr-signing-secret`
  - `PHR_EXPORT_TOKEN_TTL_SECONDS=300`
  - 証跡: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T133021Z/logs/env_phr_export.txt`

## Evidence 記録（実測結果）
- 実施日時: 2025-12-26 22:35–22:36 JST
- 実施者: worker-phr
- RUN_ID: 20251226T133021Z

### Request/Response（HTTP）
- `POST /20/adm/phr/export` → **500**
  - request: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T133021Z/http/phr_export_request.json`
  - response header: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T133021Z/http/phr_export_response_headers.txt`
  - response body: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T133021Z/http/phr_export_response_body.json`

### 監査ログ（DB 抽出）
- `PHR_EXPORT_REQUEST` / `REST_ERROR_RESPONSE` の失敗監査を記録。
- 抽出先: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T133021Z/db/audit_events.txt`

### サーバーログ（失敗原因）
- `PHRAsyncJobServiceBean#createJob` のトランザクション commit 失敗（`PGobject` 未解決）。
- 証跡:
  - `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T133021Z/logs/server_phr_export.log`
  - `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T133021Z/logs/server_phr_async_job_error.log`
  - `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T133021Z/logs/server_pgobject_error.log`

## 未達項目
- S3 backend によるアーティファクト保存・取得の実測。
- `GET /20/adm/phr/status/{jobId}` における署名 URL の発行（storageType=S3、ttl=300）。
- 署名 URL での `GET /20/adm/phr/export/{jobId}/artifact` 成功証跡。

## 次アクション
1. `org.postgresql.util.PGobject` を WildFly 側で解決できるように依存解決（Hibernate module から Postgres driver 参照）を整備。
2. `PHR_EXPORT_STORAGE_TYPE=S3` と `PHR_EXPORT_S3_*` を設定した上で再起動し、S3 実測を再実施。
3. `PHR_EXPORT_STATUS`/`PHR_SIGNED_URL_SUCCESS`/`PHR_EXPORT_ARTIFACT` の成功監査を取得。

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_Export_ジョブ_署名URL.md`
- `src/server_modernized_gap_20251221/08_evidence_package/PHR_E2E_証跡.md`
- `docs/DEVELOPMENT_STATUS.md`
