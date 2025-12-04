# 20251204T120000Z API 統合設計メモ

- **目的**: Reception/Charts/Patients/Administration の外来 API を `httpClient` 層に登録し、`resolveMasterSource` → `dataSourceTransition=server` → ORCA バナーの `warning banner tone=server` を UX と監査 metadata で一致させる。
- **主な成果**:
  - `web-client/src/libs/http/httpClient.ts` に `OUTPATIENT_API_ENDPOINTS` を追加し、`claim`/`appointment`/`medicalmodv2`/`patientmodv2` を `runId`/`dataSource`/`cacheHit`/`missingMaster`/`fallbackUsed` 付きで整理。
  - `docs/web-client/architecture/web-client-api-mapping.md` に table と `resolveMasterSource` 図を用意し、`docs/web-client/ux/ux-documentation-plan.md` で図を参照。
  - `auditEvent` は `ORCA_CLAIM_OUTPATIENT`/`ORCA_APPOINTMENT_OUTPATIENT`/`ORCA_MEDICAL_GET`/`ORCA_PATIENT_MUTATION` で `facilityId`/`patientId` などを入れ、`cacheHit`/`missingMaster`/`fallbackUsed`/`dataSourceTransition` を `details` に透過。
- **UX への落とし込み**:
  1. `resolveMasterSource` が `server` を返すトリガ（`WEB_ORCA_MASTER_SOURCE=server` + `VITE_DEV_PROXY_TARGET` での接続成功、MSW/snapshot からの昇格）を `aria-live=assertive` 付きバナーと `data-run-id` で表現。
  2. `missingMaster=true` で `warning` tone を出し、`fallbackUsed=true` の時は保存をブロックし `audit.logValidationError` を呼ぶ。
  3. `cacheHit=false` は強制リフェッチや TTL を超えた再取得で発生するため、インジケータにグレードを追加して `cache` 命中と `server` 取得を UI で見える化。
- **次ステップ**:
  - DOC_STATUS の「Web クライアント UX/Features」行にこの RUN_ID と本メモ／設計ログへのリンクを追加。
  - Implementation/QA に `OUTPATIENT_API_ENDPOINTS` と `dataSourceTransition=server` の期待値を共有し、Playwright/Stage のログに `warning banner tone=server` が記録されるチェックを加える。
