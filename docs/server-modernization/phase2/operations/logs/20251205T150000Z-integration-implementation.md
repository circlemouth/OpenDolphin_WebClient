# RUN_ID=20251205T150000Z WEBクライアント API 統合実装

- 期間: 2025-12-05 15:00 - 2025-12-05 18:00（優先度: high / 緊急度: high）。外来 API の `resolveMasterSource` → `httpClient` → `telemetry` → Reception/Charts Orchestration の経路に telemetry funnel を追加し、`cacheHit`/`missingMaster` flag で `tone=server` + `dataSourceTransition=server` を同期させた差分を本番品質で落とし込んだ。
- 参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `docs/web-client/ux/ux-documentation-plan.md` → `docs/web-client/ux/reception-schedule-ui-policy.md` → `src/outpatient_ux_modernization/04C2_WEBクライアントAPI統合実装.md`。

## 1. 実装概要

1. `web-client/src/libs/http/httpClient.ts` の `OUTPATIENT_API_ENDPOINTS` を `outpatient` グループで維持し、外来請求/予約/患者/Medical ルートごとに `runId`/`dataSource`/`cacheHit`/`missingMaster`/`fallbackUsed`/`dataSourceTransition` を auditMetadata へ含めた。RUN_ID=20251205T150000Z ではこの一覧が `dataSourceTransition=server` のリクエストを突き抜けたことを前提とし、`docs/server-modernization/phase2/operations/logs/20251205T150000Z-integration-implementation.md` に telemetry funnel の前後を記録する。
2. `web-client/src/features/charts/authService.tsx` の `AuthServiceProvider` に `useEffect` を追加し、`runId`/`cacheHit`/`missingMaster` の flag を受信するたび `recordOutpatientFunnel('resolve_master', …)` を呼ぶようにすると同時に `handleOutpatientFlags` を叩いて `charts_orchestration` ステージへ通知する。これにより `dataSourceTransition=server` を通知した瞬間に `setResolveMasterSource('server')` が実行されるようになり、Prometheus の `tone=server` テストと `audit.logUiState` の `dataSourceTransition` 表示が並行する状態を確保した。
3. `web-client/src/features/charts/orchestration.ts` の `handleOutpatientFlags` を `dataSourceTransition` を引き継ぐ形で拡張し、`cacheHit` が true のタイミングで `setResolveMasterSource('server')` を呼び出した上で `recordOutpatientFunnel('charts_orchestration', …)` に実際の transition を渡す。これにより `telemetry` は `resolve_master` → `charts_orchestration` の順で `funnels/outpatient` に記録され、`cacheHit` と `missingMaster` の両フラグが `bun` analytics で追えるようになった。

## 2. API パス一覧

| ID | パス | 目的 | 監査 metadata |
| --- | --- | --- | --- |
| claimOutpatient | `/orca/claim/outpatient/*` | ORCA 連携バンドル（`claim:information`/`claim:bundle`）を Reception で取得し、`missingMaster`/`cacheHit` を `tone=server` に反映 | runId/dataSource/dataSourceTransition/cacheHit/missingMaster/fallbackUsed/fetchedAt |
| appointmentOutpatient | `/orca/appointments/list/*` | 予約一覧・来院状況・試算を取得して ORCA バナーへ `runId`/`dataSource` を展開 | runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition |
| medicalOutpatient | `/orca21/medicalmodv2/outpatient` | Charts/DocumentTimeline の Medical record 取得。`recordsReturned` も auditMetadata に含めて status badge と `tone=server` を同期 | runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/recordsReturned |
| patientOutpatient | `/orca12/patientmodv2/outpatient` | Patients/Administration で基本情報・保険情報更新。`auditEvent` に `operation` を含めたフラグを乗せて `missingMaster`/`cacheHit` を記録 | runId/dataSource/cacheHit/missingMaster/fallbackUsed/operation |
| patientOutpatientInfo | `/orca/patients/local-search/*` | Reception/Patients で基本情報・来院履歴を取得して `missingMaster` フラグを `telemetry` と `status-badge` に連携 | runId/dataSource/cacheHit/missingMaster/fallbackUsed/dataSourceTransition |

## 3. ドキュメント更新

- `docs/web-client/ux/reception-schedule-ui-policy.md` に RUN_ID=20251205T150000Z での接続フローを追記し、`resolveMasterSource` → `httpClient` → `telemetry` → `AuthServiceProvider` → `charts` という実装を示すフロー図と `funnels/outpatient` の `cacheHit`/`missingMaster` 展開を差分として記録した。
- `docs/web-client/ux/ux-documentation-plan.md` の開発履歴に新 RUN_ID を追加し、`telemetry` funnel 2 ステージ（`resolve_master`/`charts_orchestration`）および `setResolveMasterSource('server')` の同期を本文・接続図で明記した。
- `docs/web-client/planning/phase2/DOC_STATUS.md` の `Web クライアント UX/Features` 行へ RUN_ID=20251205T150000Z を追記し、本ログと `docs/web-client/ux/reception-schedule-ui-policy.md` / `docs/web-client/ux/ux-documentation-plan.md` の更新を証跡として登録した。
- `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` に RUN_ID=20251205T150000Z のチェック項目を追加し、DOC_STATUS/README/本ログの連携を記載した。

## 4. ブロッカー／補足

- Stage/Playwright で `tone=server` + `dataSourceTransition=server` の経路を実行するには本ログの RUN_ID を ReplayFlag に渡し、`cacheHit=true` の telemetry event が `funnels/outpatient` に記録されることを確認する必要がある。

## 5. 次のアクション

1. Stage/Playwright（`VITE_DISABLE_MSW=1` + `VITE_DEV_PROXY_TARGET` + `PLAYWRIGHT_BASE_URL`）で `cacheHit`/`missingMaster` flag を順番に切り替え、`document.outpatientFunnel.log` 形式の trace を `artifacts/webclient/ux-notes/20251205T150000Z-*` に保存して本ログへ追記する。
2. Production 面レベルでは `resolveMasterSource`/`dataSourceTransition` を正しく表示する tone banner が `OrderConsole`/`Chart` の `audit.logUiState` で確認できるかを `npm run lint` + `npm run test` で再検証し、結果を doc status と manager checklist に追記する。
