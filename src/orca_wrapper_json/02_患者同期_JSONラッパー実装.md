# 02 患者同期（Webクライアント接続）

- RUN_ID: `20251212T143720Z`
- YAML ID: `src/orca_wrapper_json/02_患者同期_JSONラッパー実装.md`
- 状態: 完了

## 対象API
- `/orca/patients/local-search`
- `/orca/patients/local-search/mock`
- `/orca12/patientmodv2/outpatient`
- `/orca12/patientmodv2/outpatient/mock`

## 実装内容
- `web-client/src/features/patients/api.ts` で取得/更新フローを実装。
- `web-client/src/features/patients/PatientsPage.tsx` の検索/一覧/保存 UI を整備。
- `web-client/src/libs/observability/observability.ts` へ runId/traceId を透過。
- MSW fixture で normal/missingMaster/fallback/timeout の4パターンを追加。

## 受け入れ条件（達成済み）
- 患者検索/一覧で runId/traceId/requestId が透過される。
- audit/telemetry に patient_fetch / patient_mutation が記録される。
- MSW と実運用の切替が UI で判別できる。

## 参照
- `docs/web-client/architecture/web-client-api-mapping.md`
- `docs/web-client/planning/phase2/logs/20251212T143720Z-charts-outpatient-api-contract.md`
