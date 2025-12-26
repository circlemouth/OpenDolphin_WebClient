# PHR Export 証跡取得
- 期間: 2026-01-09 11:00 - 2026-01-10 11:00 / 優先度: medium / 緊急度: medium
- RUN_ID: 20251226T140447Z
- YAML ID: `src/server_modernized_gap_20251221/08_evidence_package/PHR_Export_証跡取得.md`

## 目的
- PHR Export の S3/署名 URL 実測と監査証跡を取得する。
- 運用設定（S3/署名鍵/TTL）と監査メタ（storageType/bandwidthProfile/kmsKeyAlias）の整合を確認する。

## 実測ステータス
- **S3 backend で PHR Export が成功**（ジョブ登録 → 署名URL発行 → アーティファクト取得まで完了）。
- `PHR_EXPORT_STORAGE_TYPE=S3` で署名URLが発行され、S3(`opendolphin-phr-export`) に成果物が保存された。
- `DELETE /status/{jobId}` はジョブ完了後のため **409 (invalid_state)** を返却（キャンセル不可状態）。

## 実施環境
- Modernized サーバー: `http://localhost:9080/openDolphin/resources`
- 認証: `userName=dolphindev` / `password=<MD5>`
- Facility: `1.3.6.1.4.1.9414.10.1`
- PHR Export 設定（抜粋）:
  - `PHR_EXPORT_STORAGE_TYPE=S3`
  - `PHR_EXPORT_SIGNING_SECRET=dev-phr-signing-secret`
  - `PHR_EXPORT_TOKEN_TTL_SECONDS=300`
  - `PHR_EXPORT_S3_BUCKET=opendolphin-phr-export`
  - `PHR_EXPORT_S3_REGION=ap-northeast-1`
  - `PHR_EXPORT_S3_ENDPOINT=http://minio:9000`
  - `PHR_EXPORT_S3_FORCE_PATH_STYLE=true`
  - `PHR_EXPORT_S3_ACCESS_KEY=opendolphin`
  - `PHR_EXPORT_S3_SECRET_KEY=opendolphin-secret`
  - 証跡: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/logs/env_phr_export.txt`

## Evidence 記録（実測結果）
- 実施日時: 2025-12-26 23:42–23:43 JST
- 実施者: worker-phr
- RUN_ID: 20251226T140447Z

### Request/Response（HTTP）
- `POST /20/adm/phr/export` → **200**
  - request: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/http/phr_export_request.json`
  - response header: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/http/phr_export_response_headers.txt`
  - response body: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/http/phr_export_response_body.json`
- `GET /20/adm/phr/status/{jobId}` → **200 (SUCCEEDED + signed URL)**
  - response header: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/http/phr_status_response_headers.txt`
  - response body: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/http/phr_status_response_body.json`
- `GET /20/adm/phr/export/{jobId}/artifact` → **200**
  - response header: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/http/phr_export_artifact_response_headers.txt`
  - artifact: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/http/phr_export_artifact.zip`
- `DELETE /20/adm/phr/status/{jobId}` → **409 (invalid_state)**
  - response header: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/http/phr_status_delete_response_headers.txt`
  - response body: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/http/phr_status_delete_response_body.json`

### 監査ログ（DB 抽出）
- `PHR_EXPORT_REQUEST` / `PHR_SIGNED_URL_ISSUED` / `PHR_EXPORT_STATUS` / `PHR_EXPORT_ARTIFACT` を記録。
- `PHR_EXPORT_CANCEL` は **409 (invalid_state)** の失敗監査が記録。
- 抽出先: `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/db/audit_events.txt`

### サーバーログ（成功フロー）
- `PHR_EXPORT_REQUEST` / `PHR_SIGNED_URL_ISSUED` / `PHR_EXPORT_STATUS` / `PHR_EXPORT_ARTIFACT` の成功ログを記録。
- 証跡:
  - `artifacts/server-modernized-gap/20251226/phr_export_evidence/20251226T140447Z/logs/server_phr_export.txt`

## 未達項目
- なし（S3 保存・署名URL発行・成果物取得まで完了）。

## 次アクション
1. `DELETE /status/{jobId}` の 409 応答は仕様通りのため、必要に応じてキャンセル可能状態の運用フローを整理する。

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_Export_ジョブ_署名URL.md`
- `src/server_modernized_gap_20251221/08_evidence_package/PHR_E2E_証跡.md`
- `docs/DEVELOPMENT_STATUS.md`
