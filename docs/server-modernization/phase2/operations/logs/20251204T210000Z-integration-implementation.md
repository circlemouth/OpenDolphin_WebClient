# RUN_ID=20251204T210000Z WEBクライアント API 統合実装

- 期間: 2025-12-12 09:00 - 2025-12-14 09:00（優先度: high / 緊急度: medium）。外来 API に対する `resolveMasterSource`/`httpClient`/`telemetryClient` の接続フローを Reception/Charts Orchestration に落とし込み、`cacheHit`/`missingMaster` のファネルログを漏れなく残す実装計画を策定した。
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `docs/web-client/ux/ux-documentation-plan.md` → `docs/web-client/ux/reception-schedule-ui-policy.md` → `src/outpatient_ux_modernization/04C2_WEBクライアントAPI統合実装.md`。

## 1. 実装予定

1. `web-client/src/libs/http/httpClient.ts` に登録済みの `OUTPATIENT_API_ENDPOINTS`（請求・予約・Medical/Patient）を telemetry フロー対応でグルーピングし、`resolveMasterSource` が `dataSourceTransition=server` を返す経路では fetch 終了時に `cacheHit`/`missingMaster` を `telemetryClient` へ送る形へ変える。各エンドポイントは `runId`/`dataSourceTransition`/`cacheHit`/`missingMaster` に加え、`telemetryFunnelStage` ラベルを持たせる。
2. `web-client/src/libs/telemetry/telemetryClient.ts` をフックし、Charts Orchestration 側で `tone=server` flag を受信すると `funnelStage` (`resolve_master`/`orchestration`) と `cacheHit`/`missingMaster` を記録する。次段階で `charts` Orchestration が `tone=server` を再現する時点に `audit.logUiState` との整合性を取る。
3. UX ドキュメント: `docs/web-client/ux/reception-schedule-ui-policy.md` と `docs/web-client/ux/ux-documentation-plan.md` に接続フロー図・差分を追記し、`docs/server-modernization/phase2/operations/logs/20251204T210000Z-integration-implementation.md` に API パス一覧・実装予定を記録。`docs/web-client/planning/phase2/DOC_STATUS.md` の `Web クライアント UX/Features` 行に RUN_ID=`20251204T210000Z` と本ログ/アーティファクトへのリンクを追記する。

## 2. API パス一覧

| ID | パス | 目的 | 監査 metadata |
| --- | --- | --- | --- |
| claimOutpatient | `/orca/claim/outpatient/*` | ORCA 連携バンドル（`claim:information`/`claim:bundle`）を Reception で利用 | runId/dataSource/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/fetchedAt |
| appointmentOutpatient | `/orca/appointments/list/*` | 予約一覧・来院状況・試算の取得と ORCA バナー連携 | runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition |
| medicalOutpatient | `/orca21/medicalmodv2/outpatient` | Charts/DocumentTimeline の Medical record 取得 | runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/recordsReturned |
| patientOutpatient | `/orca12/patientmodv2/outpatient` | Patients/Administration で患者基本・保険情報を操作 | runId/dataSource/cacheHit/missingMaster/fallbackUsed/operation |

## 3. ドキュメント更新

- `src/outpatient_ux_modernization/04C2_WEBクライアントAPI統合実装.md` に RUN_ID/依存資料/実装タスク・懸念・次ステップを記録。
- `docs/web-client/ux/reception-schedule-ui-policy.md` と `docs/web-client/ux/ux-documentation-plan.md` に接続フローと差分を追加し、`docs/server-modernization/phase2/operations/logs/20251204T210000Z-integration-implementation.md` を証跡として参照する。
- `docs/web-client/planning/phase2/DOC_STATUS.md` の `Web クライアント UX/Features` 行に RUN_ID=`20251204T210000Z` と `docs/server-modernization/phase2/operations/logs/20251204T210000Z-integration-implementation.md` / `src/outpatient_ux_modernization/04C2_WEBクライアントAPI統合実装.md` へのリンクを記録する。

## 4. ブロッカー／補足

- 現行ブランチには `web-client/src/libs/telemetry/telemetryClient.ts` および `web-client/src/features/charts` が含まれていないため、実装 (1)/(2) の差分は対象ファイルが復元してから着手する必要がある。データフローの mock も同時に提供されていないため、Playwright/Stage での `tone=server` 再現作業は `telemetryClient` が入手次第再開する。
- `resolveMasterSource` の居場所も確認できなかったため、実装途中で `cacheHit`/`missingMaster` を引き渡す箇所が判明したらこのログに追記する。

## 5. 次のアクション

1. `telemetryClient` と `charts` の assets が揃った時点で、`httpClient`→`telemetryClient`→`Charts` へのフローを差分として取り込み、Playwright/Stage の `tone=server` 試験でファネルログを検証。
2. `docs/server-modernization/phase2/operations/logs/20251204T210000Z-integration-implementation.md` に Playwright/Stage で取得した `tone=server` + `cacheHit`/`missingMaster` の telemetry screenshot/trace を追記し、DOC_STATUS と manager checklist へ反映。
