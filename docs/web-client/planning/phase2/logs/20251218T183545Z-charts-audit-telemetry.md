# 20251218T183545Z — Charts 監査ログ/テレメトリ runId 突合

- 指示: `src/charts_production_outpatient/quality/52_監査ログ_テレメトリ_証跡化.md`
- 目的: 主要操作の `auditEvent` と telemetry (`recordOutpatientFunnel`) が **同一 runId** で追跡できることを確認し、traceId を含む証跡を残す。
- 実施日時: 2025-12-18T18:40Z（計画期間 02/04 09:00 - 02/06 09:00 に先行実施）
- RUN_ID: `20251218T183545Z`
- 証跡: `docs/server-modernization/phase2/operations/logs/20251218T183545Z-charts-audit-telemetry.md`
- 追加テスト: `web-client/src/features/charts/__tests__/auditTelemetryRunId.test.ts`

## 手順
1. `web-client` 直下で依存をインストール（ローカルキャッシュ使用）。  
   - `npm install --cache .npm-cache`
2. Observability meta を `runId=20251218T183545Z / traceId=trace-52-run / dataSourceTransition=server` に更新した上で、主要操作 ORCA_SEND を対象に vitest で突合テストを追加・実行。  
   - `npm test -- src/features/charts/__tests__/auditTelemetryRunId.test.ts`

## 結果
- Telemetry (charts_action) と auditEvent の両方で `runId=20251218T183545Z` を取得し、`traceId=trace-52-run` も一致。`dataSourceTransition=server / cacheHit=false / missingMaster=false / fallbackUsed=false` が双方に揃うことを確認。
- vitest 実行ログに telemetry/audit 出力を残し、traceId を証跡ログへ転記済み。

## 今後
- ENCOUNTER_CLOSE / PRINT_OUTPATIENT / CHARTS_ACTION_FAILURE も同テストパターンに拡張する余地あり（本 RUN では ORCA_SEND のみ確認）。
