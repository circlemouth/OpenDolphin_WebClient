# Charts fetchWithResolver 統一ログ（RUN_ID=`20251213T133932Z`）

- タスク: webclient charts production outpatient plan / 13_データ取得レイヤの統一_fetchWithResolver
- 期間: 2025-12-26 09:00 - 2025-12-29 09:00 (JST)
- 対象: Charts/Reception の外来 API fetch レイヤ（claim/appointment/medical）

## 実施内容
1. `fetchWithResolver` を新設し、外来 API の共通メタ（runId/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/resolveMasterSource/fetchedAt/recordsReturned/fromCache/retryCount）を付与。
2. DTO→ViewModel 変換とメタ統合を `features/outpatient/transformers.ts` に集約し、Reception/Charts から共通利用。
3. `reception/api.ts` / `charts/api.ts` を `fetchWithResolver` 経由へ移行。React Query meta（servedFromCache/retryCount）を UI Pill/Badge・`logUiState(action='outpatient_fetch')`・`telemetryClient.recordOutpatientFunnel('charts_orchestration')` と同期。
4. `ResolveMasterSource` を observability 型に追加し、auditLogger へ `outpatient_fetch` を登録。

## 影響ファイル
- web-client/src/features/outpatient/fetchWithResolver.ts
- web-client/src/features/outpatient/transformers.ts
- web-client/src/features/outpatient/types.ts
- web-client/src/features/reception/api.ts
- web-client/src/features/charts/api.ts
- web-client/src/features/reception/pages/ReceptionPage.tsx
- web-client/src/features/charts/pages/ChartsPage.tsx
- web-client/src/libs/observability/types.ts
- web-client/src/libs/audit/auditLogger.ts

## 確認状況
- npm run lint ... -> スクリプト未定義で実行不可（package.json に lint エントリなし）。手動レビューのみ。
- UI/E2E: 未実施（MSW 依存）。次回の Stage/Preview/Playwright で本 RUN_ID を再利用予定。

## メモ/残課題
- React Query retry ポリシーと 12 章の cooldown ルールを揃えるタスクが残り。現状は meta 収集のみ。
- 患者取得/保存系の fetch は未統一。次 RUN で `fetchWithResolver` へ移行し、PatientsTab/PatientsPage のガードと整合させる。
