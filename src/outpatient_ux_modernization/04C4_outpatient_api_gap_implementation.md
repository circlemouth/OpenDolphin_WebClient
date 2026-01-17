# 04C4 外来 API ギャップ実装（RUN_ID=20251208T124645Z）

- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → 本ファイル
- スコープ: `/orca/claim/outpatient/mock` と `/orca21/medicalmodv2/outpatient` を server-modernized に追加し、`web-client/architecture/web-client-api-mapping.md` で定義した telemetry/audit フィールドを返す stub を用意する。MSW/fixtures との整合と DOC_STATUS 更新までを含む。
- 期間/優先度: 2025-12-17 09:00 - 2025-12-19 09:00 JST / Priority=High / Urgency=Medium

## 実施内容
- 共通 DTO `OutpatientFlagResponse` を新設し、`runId/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/fetchedAt/recordsReturned/auditEvent` をまとめて返却可能にした。
- `OrcaClaimOutpatientResource`（`/orca/claim/outpatient/mock`）と `OrcaMedicalModV2Resource`（`/orca21/medicalmodv2/outpatient`）を server-modernized に追加し、`resolve_master` → `charts_orchestration` funnel へ渡す flag をデフォルトで埋め込んだ。両リソースの `auditEvent` に `recordsReturned`/`telemetryFunnelStage` を含め、`SessionAuditDispatcher` で `ORCA_CLAIM_OUTPATIENT` / `ORCA_MEDICAL_GET` を記録。
- 契約モックを `artifacts/api-stability/20251208T124645Z/outpatient/` に配置し、`OutpatientMockPage` の fallback RUN_ID を `20251208T124645Z` に更新。
- ローカル server-modernized（`WEB_CLIENT_MODE=npm ./setup-modernized-env.sh` 起動、MSW OFF、`VITE_DEV_PROXY_TARGET=http://localhost:9080/openDolphin/resources`）への curl POST で `/orca/claim/outpatient/mock` / `/orca21/medicalmodv2/outpatient` が **200 OK**。`runId=20251208T124645Z`、`dataSourceTransition=server`、`auditEvent` を取得（mock: cacheHit=false/missingMaster=false、medical: cacheHit=true/missingMaster=false）。証跡: `docs/server-modernization/phase2/operations/logs/20251208T124645Z-dev-proxy-validation.md`（ローカル節） + `artifacts/webclient/e2e/20251208T124645Z-local/`。
- ORCA_API_STATUS 外来行・`PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` 外来セクション・`docs/web-client/planning/phase2/DOC_STATUS.md` の RUN_ID=20251208T124645Z 箇条書きをローカル結果で上書き済み。
- 証跡ログ: `docs/server-modernization/phase2/operations/logs/20251208T124645Z-api-gap-implementation.md`（実装）、`.../20251208T124645Z-dev-proxy-validation.md`（Stage timeout + ローカル成功）。

## 残課題 / 次のアクション
- Stage/Preview で MSW OFF + dev proxy 経路の疎通を再試行し、`auditEvent/runId/cacheHit/missingMaster/dataSourceTransition` を取得できたら本ドキュメント・ORCA_API_STATUS・チェックリスト・DOC_STATUS を同 RUN_ID で上書きする（Stage DNS/ネットワーク復旧待ち）。

## 懸念点（要フォロー）
- 現状は **stub 実装のみ** で ORCA 実データを返していない。Stage/Preview 実データでの検証が未完。
- `missingMaster/cacheHit` は固定値（mock:false/false、medical:true/false）で返却。マスタ欠損やキャッシュ未命中の異常系は未再現。UI トーン/telemetry の degraded path は MSW で確認済みだが実データでの再現が必要。
- `patientId` 抽出は最小限のパース（`Patient_ID` フィールドのみ）で、ORCA 実レスポンスの入れ子構造差異を考慮していない。schema との差分が出た場合は DTO を拡張する。
- `resolveMasterSource`/`dataSourceTransition` を常に `server` 固定のため、snapshot/fallback への降格パスを観測できない。実データ or fixture での切替テストを計画する。
- AuditEvent は固定レスポンス由来のため、Stage/Preview で実データ件数に応じた `recordsReturned`/`missingMaster` 変動を追う必要がある。
