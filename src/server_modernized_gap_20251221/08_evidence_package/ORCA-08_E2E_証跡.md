# ORCA-08 E2E 証跡パッケージ
- 期間: 2026-01-08 09:00 - 2026-01-10 09:00 / 優先度: medium / 緊急度: medium
- RUN_ID: 20251226T062106Z
- YAML ID: `src/server_modernized_gap_20251221/08_evidence_package/ORCA-08_E2E_証跡.md`

## 目的
- ORCA-08（電子点数表 `/orca/tensu/etensu`）の実 ORCA DB 実測を最終段階で実施し、レスポンス差分と監査ログを証跡化する。
- 監査イベントに含まれる `runId/dataSource/cacheHit/missingMaster/fallbackUsed/fetchedAt/apiRoute` 等のキーを確認し、監査基準を満たすことを示す。

## 対象範囲
- API: `/orca/tensu/etensu`
- DB: `TBL_ETENSU_1~5`（ORCA 公式テーブル）
- ログ/監査: `auditEvent` / `audit.logUiState`

## 実測ステータス
- **未実施（外部依存待ち）**: ORCA certification 環境の接続情報確定後に実測する。

## 実測前提（外部依存）
- 接続情報は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に従う（機微情報はマスクして記録）。
- サーバー起動: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`（未起動時のみ）。

## 検証観点（E2E）
- ORCA DB 実測時の HTTP ステータス、レスポンス内容、`totalCount/items` を記録。
- 監査ログで `dataSource=orca-db`（または同等の実 ORCA 指標）が記録されることを確認。
- MSW/スナップショットとの差分（件数・主要フィールド）を記録。

## 必須証跡（実測時に追記）
- 接続先（URL/Basic）をマスク済みで記録。
- DNS/TLS 証跡（`dig` / `openssl s_client`）。
- `/orca/tensu/etensu` の Request/Response（マスク済み、HTTP ステータス、`Api_Result` があれば記録）。
- 監査ログ（マスク済み、`runId`/`dataSource`/`cacheHit`/`missingMaster`/`fallbackUsed`/`fetchedAt`/`apiRoute`）。
- MSW/スナップショットとの差分サマリ（件数・hash/主要フィールド）。

## Evidence 記録テンプレート（実測時に追記）
- 実施日時: `<YYYY-MM-DD HH:MM:SS JST>`
- 実施者: `<NAME>`
- RUN_ID: `<RUN_ID>`
- 接続先: `<MASKED_ORCA_CERT_URL>`
- 認証: `<MASKED_BASIC>`
- DNS 証跡: `artifacts/orca-connectivity/<RUN_ID>/dns/resolve.log`
- TLS 証跡: `artifacts/orca-connectivity/<RUN_ID>/tls/openssl_s_client.log`
- Feature Flag / Env:
  - `WEB_ORCA_MASTER_SOURCE=server`
  - `VITE_ORCA_MASTER_BRIDGE=server`
- Request/Response（マスク済み）:
  - `/orca/tensu/etensu` → `<HTTP_STATUS>` / `<Api_Result or N/A>`
- 監査ログ（マスク済み）:
  - `auditEvent`/`audit.logUiState` の該当レコード
  - 必須キー: `runId`, `dataSource`, `cacheHit`, `missingMaster`, `fallbackUsed`, `fetchedAt`, `apiRoute`
- 差分記録:
  - MSW/スナップショットとの差分サマリ（件数・hash/主要フィールド）

## 参照
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_E2E_証跡.md`
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_ETENSU_API連携.md`
- `src/server_modernized_gap_20251221/02_orca08_etensu/ORCA-08_キャッシュ_監査_性能.md`
- `docs/DEVELOPMENT_STATUS.md`

## Evidence 記録（2025-12-26 実測）
- 実施日時: 2025-12-26 15:31 JST
- 実施者: Codex (worker-orca-master)
- RUN_ID: 20251226T062842Z
- 接続先: `https://weborca.cloud.orcamo.jp:443`
- 認証: Basic/PKCS#12 ともに `<MASKED>`
- DNS 証跡: `artifacts/orca-connectivity/20251226T062842Z/dns/resolve.log`
- TLS 証跡: `artifacts/orca-connectivity/20251226T062842Z/tls/openssl_s_client.log`
- Feature Flag / Env:
  - `WEB_ORCA_MASTER_SOURCE=server`
  - `VITE_ORCA_MASTER_BRIDGE=server`

### ORCA certification 実測（直叩き）
- Request:
  - `GET https://weborca.cloud.orcamo.jp/orca/tensu/etensu?keyword=110000001&category=11&asOf=20240401&tensuVersion=202404&page=1&pageSize=20`
- Response:
  - HTTP 404 / Body: `{"Code":404,"Message":"code=404, message=Not Found"}`
- 証跡:
  - `artifacts/orca-connectivity/20251226T062842Z/httpdump/orca08-cert/headers.txt`
  - `artifacts/orca-connectivity/20251226T062842Z/httpdump/orca08-cert/body.json`
  - `artifacts/orca-connectivity/20251226T062842Z/httpdump/orca08-cert/httpcode.txt`

### server-modernized 実測（監査ログ採取）
- Request:
  - `GET http://localhost:9080/openDolphin/resources/orca/tensu/etensu?keyword=110000001&category=11&asOf=20240401&tensuVersion=202404&page=1&pageSize=20`
  - Header: `userName=1.3.6.1.4.1.9414.70.1:admin` / `password=<MD5>`
- Response:
  - HTTP 503 / `code=ETENSU_UNAVAILABLE`
  - `runId=20251219T144408Z`, `correlationId=5be5cdb8-ac6c-4965-ae5e-d470747a2cbd`
- 監査ログ（d_audit_event）:
  - `action=ORCA_MASTER_FETCH`, `resource=/orca/tensu/etensu`
  - `dataSource=server`, `cacheHit=false`, `missingMaster=false`, `fallbackUsed=false`, `status=failed`, `httpStatus=503`
- 証跡:
  - `artifacts/orca-connectivity/20251226T062842Z/httpdump/orca08-local/headers.txt`
  - `artifacts/orca-connectivity/20251226T062842Z/httpdump/orca08-local/body.json`
  - `artifacts/orca-connectivity/20251226T062842Z/httpdump/orca08-local/httpcode.txt`
  - `artifacts/orca-connectivity/20251226T062842Z/audit/d_audit_event_orca08.tsv`

### 判定
- ORCA certification 直叩きは 404 のため、API 経路が未公開/非対応。
- server-modernized 側は ORCA DB 取得不可により 503（ETENSU_UNAVAILABLE）。

### 次アクション
1. ORCA certification 側の `/orca/tensu/etensu` 提供状況を確認（Allow/公開可否）。
2. server-modernized の ORCA DB 接続（ORCADS）を復旧し、HTTP 200 の監査証跡を再取得。
