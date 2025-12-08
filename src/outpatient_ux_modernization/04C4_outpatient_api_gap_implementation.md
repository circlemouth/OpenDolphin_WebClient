# 04C4 外来 API ギャップ実装（RUN_ID=20251208T124645Z）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ファイル
- スコープ: `/api01rv2/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` を server-modernized に追加し、`web-client/architecture/web-client-api-mapping.md` で定義した telemetry/audit フィールドを返す stub を用意する。MSW/fixtures との整合と DOC_STATUS 更新までを含む。
- 期間/優先度: 2025-12-17 09:00 - 2025-12-19 09:00 JST / Priority=High / Urgency=Medium

## 実施内容
- 共通 DTO `OutpatientFlagResponse` を新設し、`runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/fetchedAt/recordsReturned/auditEvent` をまとめて返却可能にした。
- `OutpatientClaimResource`（`/api01rv2/claim/outpatient/mock`）と `OrcaMedicalModV2Resource`（`/orca21/medicalmodv2/outpatient`）を server-modernized に追加し、`resolve_master` → `charts_orchestration` funnel へ渡す flag をデフォルトで埋め込んだ。両リソースの `auditEvent` に `recordsReturned`/`telemetryFunnelStage` を含め、`SessionAuditDispatcher` で `ORCA_CLAIM_OUTPATIENT` / `ORCA_MEDICAL_GET` を記録。
- 契約モックを `artifacts/api-stability/20251208T124645Z/outpatient/` に配置し、`OutpatientMockPage` の fallback RUN_ID を `20251208T124645Z` に更新。
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251208T124645Z-api-gap-implementation.md`。DOC_STATUS/`web-client-api-mapping.md` と同期済み。

## 残課題 / 次のアクション
- Stage/Preview で MSW OFF + dev proxy 経路の疎通確認を実施し、`04C3_WEBクライアントAPI接続検証.md` に 404 解消後の観測結果を追記する。
- `ORCA_API_STATUS.md` への影響有無を確認し、必要に応じて `PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` の外来セクションをアップデートする。

## 懸念点（要フォロー）
- 現状は **stub 実装のみ** で ORCA 実データを返していない。Stage/Preview で MSW OFF かつ dev proxy 経路の実レスポンス検証が必要。
- `missingMaster/cacheHit` を固定値で返しており、マスタ欠損やキャッシュ未命中の異常系が未再現。UI トーン/telemetry の degraded path を別途検証する必要がある。
- `patientId` 抽出は最小限のパース（`Patient_ID` フィールドのみ）で、ORCA 実レスポンスの入れ子構造差異を考慮していない。schema との差分が出た場合は DTO を拡張する。
- `resolveMasterSource`/`dataSourceTransition` を常に `server` に固定しているため、snapshot/fallback への降格パスを観測できない。MSW 併用や snapshot fixture での切替テストを計画する。
- AuditEvent は ORCA 側レスポンスが固定のため、Stage/Preview で実データ件数に応じた `recordsReturned`/`missingMaster` が変動するかを追って検証する。
