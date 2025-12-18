# 20251218T183545Z Charts auditEvent / telemetry runId 突合ログ

- 実施日時: 2025-12-18T18:40:17Z（計画期間 02/04 09:00 - 02/06 09:00 に先行）
- 実施者: codex（web-client）
- 対象: Web クライアント Charts 外来（MSW 環境）
- 目的: 主要操作（ORCA_SEND）の `auditEvent` と telemetry (`recordOutpatientFunnel`) が同一 `runId` / `traceId` で追跡できることを証跡化する。
- RUN_ID: `20251218T183545Z`
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `docs/web-client/planning/phase2/logs/20251218T183545Z-charts-audit-telemetry.md` → 本ログ
- 成果物: `web-client/src/features/charts/__tests__/auditTelemetryRunId.test.ts`

## 環境・前提
- `web-client` 直下で `npm install --cache .npm-cache` を実施し、ローカル依存を準備。
- Observability meta を手動でセット: `runId=20251218T183545Z`, `traceId=trace-52-run`, `dataSourceTransition=server`, `cacheHit=false`, `missingMaster=false`, `fallbackUsed=false`。
- MSW（デフォルト dev）前提。外部 ORCA/Stage 接続なし。

## 手順
1. テスト追加: `auditTelemetryRunId.test.ts` で ORCA_SEND を対象に telemetry と auditEvent の runId/traceId 整合を検証。
2. 実行: `npm test -- src/features/charts/__tests__/auditTelemetryRunId.test.ts`

## 実行結果（抜粋）
- telemetry 出力
  - stage=`charts_action`, action=`ORCA_SEND`, outcome=`started`
  - runId=`20251218T183545Z`, traceId=`trace-52-run`
  - dataSourceTransition=`server`, cacheHit=`false`, missingMaster=`false`, fallbackUsed=`false`
  - recordedAt=`2025-12-18T18:40:17.315Z`
- auditEvent 出力
  - action=`ORCA_SEND`, outcome=`started`, note=`telemetry-audit-run-id-check`
  - details.runId=`20251218T183545Z`, details.traceId=`trace-52-run`
  - details.dataSourceTransition=`server`, cacheHit=`false`, missingMaster=`false`, fallbackUsed=`false`
  - timestamp=`2025-12-18T18:40:17.316Z`
- テスト結果: 1 test passed（runId/traceId 整合を確認）

## 期待値と評価
- 期待: 主要操作で auditEvent.details と telemetry record の `runId` / `traceId` / dataSource メタが一致すること。
- 評価: ORCA_SEND ケースで一致を確認済み。今後 ENCOUNTER_CLOSE / PRINT_OUTPATIENT / CHARTS_ACTION_FAILURE へ拡張予定。

## 添付コマンド
- `npm install --cache .npm-cache`
- `npm test -- src/features/charts/__tests__/auditTelemetryRunId.test.ts`
