# 04C1 WEB クライアント API 統合設計

- **RUN_ID=20251204T120000Z** / 期間: 2025-12-04 11:00〜12:30 JST
- **対象**: Web クライアント UX/Features（特に Reception/Charts/Patients/Administration の外来 API 回路）
- **参照チェーン**: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ファイル
- **依存資料**: `docs/server-modernization/phase2/foundation/IMPACT_MATRIX.md`、`docs/server-modernization/phase2/operations/orca-master-sprint-plan.md`、`docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md`、`docs/server-modernization/phase2/operations/logs/20251204T064209Z-api-gap.md`、`docs/web-client/architecture/web-client-api-mapping.md`

## 1. 目的

Phase2 foundation で優先度 High とされた ORCA 外来 API を Web クライアントの `httpClient` 層で明示的に登録し、`resolveMasterSource`/監査 `auditEvent`/`cacheHit`/`missingMaster` の伝播を UX 設計側に図示・伝達することで、実装前提を整備する。

## 2. 現況と対応

1. `web-client/src/libs/http/httpClient.ts` に `OUTPATIENT_API_ENDPOINTS` を追加し、`/orca/claim/outpatient/*`、`/orca/appointments/list/*`、`/orca21/medicalmodv2/outpatient`、`/orca12/patientmodv2/outpatient` を一覧化しました。`purpose`/`auditMetadata`/`sourceDocs` を含めることで開発者が各エンドポイントに必要な `runId`/`cacheHit`/`missingMaster`/`fallbackUsed` を即座に把握できます。`docs/web-client/architecture/web-client-api-mapping.md` にテーブルと図を作成し、今後の UI 連携設計で `httpClient` との対応表を二次資料として使えるようにしています。
2. ORCA 監査 metadata（`runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt`）は `docs/server-modernization/phase2/operations/orca-master-sprint-plan.md` で合意済みであり、`resolveMasterSource` が `dataSourceTransition=server` を返す場合は `fetchWithResolver` の出口で `cacheHit`/`missingMaster` を `true|false` で明示的に送信する必要があります。`docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md` にあるフローを参考に、MSW→snapshot→server→fallback の順で `dataSource` が昇降するアサーションを `docs/web-client/ux/ux-documentation-plan.md` に図示しておきました。
3. `auditEvent` の `action` は `ORCA_CLAIM_OUTPATIENT`/`ORCA_APPOINTMENT_OUTPATIENT`/`ORCA_MEDICAL_GET`/`ORCA_PATIENT_MUTATION` を想定し、`details` に `facilityId`/`patientId`/`appointmentId`/`recordsReturned`/`operation` などの業務キーと metadata を載せることで `txt/d_audit_event` の突合を容易にします。`docs/server-modernization/phase2/operations/logs/20251204T064209Z-api-gap.md` で指摘した gap（`recordAudit` が呼ばれていない箇所）の補完と `approve audit` 連携は、本設計の前提です。

## 3. 今後の実装仮定

- UX では `resolveMasterSource` が `server` を返すケースを `dataSourceTransition=server` の図付きフロー（Reception/Charts の warning banner との接続）で示し、Playwright/Stage での `warning banner tone=server` 確認へと結びつける。
- `cacheHit`/`missingMaster`/`fallbackUsed` のフラグは fetch 成功時 (`cacheHit` の命中/不命中) とフォールバック選択時 (`fallbackUsed=true` / `missingMaster` が true なら b anners) に `audit.logUiState` または `AuditTrail` 経由で `d_audit_event` に透過し、A/B/Stage ログ（`artifacts/e2e/...`）と `docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md` を一致させる。
- `docs/web-client/ux/ux-documentation-plan.md` で作成した図は `resolveMasterSource` + `httpClient` + `auditEvent` の役割を同時に示すため、Implementation/QA チームとのレビュー資料としても活用する。

## 4. 次のアクション

1. `httpClient` で定義した `OUTPATIENT_API_ENDPOINTS` を実装/テストチームに通知し、`resolveMasterSource`/`auditEvent` の期待値（`dataSourceTransition=server`/`cacheHit`/`missingMaster`/`fallbackUsed`）をテスト項目に加える。
2. `docs/web-client/ux/ux-documentation-plan.md` と新設 `docs/web-client/architecture/web-client-api-mapping.md` に図解とテキストを追加し、`docs/web-client/planning/phase2/DOC_STATUS.md` の「Web クライアント UX/Features」行に RUN_ID `20251204T120000Z` と本 log/artifact パスを追記して整合させる。
3. `artifacts/webclient/ux-notes/20251204T120000Z-integration-design.md` と `docs/server-modernization/phase2/operations/logs/20251204T120000Z-integration-design.md` に本作業の概要を記録し、DOC_STATUS に記載した `証跡` パスと合わせて各マネージャーチェックリストへリンクを張る。
