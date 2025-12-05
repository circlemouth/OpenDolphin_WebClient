-# 04C2 WEB クライアント API 統合実装

- **RUN_ID=20251205T150000Z** / 期間: 2025-12-05 15:00 - 2025-12-09 09:00 JST
- **対象**: Reception/Charts 保守 Orchestration における外来 API 回路の telemetry funnel への接続と、`dataSourceTransition=server` での `cacheHit`/`missingMaster` フラグ継承
- **参照チェーン**: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `docs/web-client/ux/ux-documentation-plan.md` → 本ファイル
- **依存資料**: `docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md`、`docs/server-modernization/phase2/operations/orca-master-sprint-plan.md`、`docs/web-client/architecture/web-client-api-mapping.md`、`docs/web-client/ux/reception-schedule-ui-policy.md`

## 1. 目的

04C1 で設計した `resolveMasterSource` → `httpClient` → `auditEvent` の接続を、実装フェーズで telemetry funnel と Reception/Charts Orchestration のトーン同期にまで広げる。`dataSourceTransition=server` を維持しつつ `cacheHit`/`missingMaster` を telemetry へ送信し、Orchestration 側が flag を受信した時点で `tone=server` バナー＋ `audit.logUiState` のメタを残せるようにする。

## 2. 実装タスク

1. `web-client/src/libs/http/httpClient.ts` の `OUTPATIENT_API_ENDPOINTS` を `outpatient` グループでまとめ、`/api01rv2/claim/outpatient/*`、`/api01rv2/appointment/outpatient/*`、`/api01rv2/patient/outpatient/*`、`/orca21/medicalmodv2/outpatient`、`/orca12/patientmodv2/outpatient` を登録して `resolveMasterSource` が `dataSourceTransition=server` を返す際に `cacheHit`/`missingMaster` を `telemetryClient` へ渡す。すべてのエンドポイントに `runId`/`dataSourceTransition`/`cacheHit`/`missingMaster`/`fallbackUsed` を付与し、`telemetry` に `funnelStage` を添えた `audit` 設計を明文化した。
2. `web-client/src/libs/telemetry/telemetryClient.ts` をフックし、Charts Orchestration で受信した flag (`tone=server` + `dataSourceTransition=server`) でファネルログを残す。`charts` の Orchestration 層は `tone=server` トリガを受けたら `telemetryClient.recordFunnel`（仮）を呼び、`cacheHit`/`missingMaster` をラベルに含む。
3. docs 連携: `docs/web-client/ux/reception-schedule-ui-policy.md` と `docs/web-client/ux/ux-documentation-plan.md` に接続フロー図＋差分を追記し、新 log `docs/server-modernization/phase2/operations/logs/20251205T150000Z-integration-implementation.md` へ API パス一覧・telemetry funnel/Orchestration flag 実装を記録。`docs/web-client/planning/phase2/DOC_STATUS.md` の `Web クライアント UX/Features` 行にも RUN_ID=`20251205T150000Z` を反映。

## 3. 現状・懸念

- RUN_ID=`20251205T150000Z` で `telemetryClient`/`charts/orchestration`/`OrderConsole` の `cacheHit`/`missingMaster` トリガを `funnels/outpatient` に記録する差分を適用し、`docs/server-modernization/phase2/operations/logs/20251205T150000Z-integration-implementation.md` に実装内容と API パス一覧を証跡化した。今後 Stage/Playwright で同ログを再現し、`tone=server` + `dataSourceTransition=server` の `telemetry` funnel を観測することが残る。
- `resolveMasterSource` の本体は `web-client/src/features/charts/orchestration.ts` に定義され、`cacheHit` 受信時に `setResolveMasterSource('server')` が呼ばれる仕組みを導入済み。Playwright/Stage で `tone=server` バナーと `audit.logUiState` の `dataSourceTransition=server` が同期していることを引き続き検証し、必要なら追加スクリーンショット/ログを `artifacts/webclient/ux-notes/` に記録する。

## 4. 次のステップ

1. Stage/Playwright で `cacheHit`/`missingMaster` → `telemetry` funnel の連鎖と、`setResolveMasterSource('server')` による `tone=server` バナーの同期を再現し、そのログ・スクリーンショットを `artifacts/webclient/ux-notes/20251205T150000Z-*` に記録して `docs/server-modernization/phase2/operations/logs/20251205T150000Z-integration-implementation.md` へ追記する。
2. 04C2 の実装を `CODex` Orchestration チームと共有し、Playwright/Stage の `tone=server` + `dataSourceTransition=server` 経路を含むログと `artifacts` を本ログ・DOC_STATUS・マネージャーチェックリストへ連携する。
3. DOC_STATUS に RUN_ID=`20251205T150000Z` を維持し、manager checklist の該当行と README で本ログと `docs/web-client/ux/ux-documentation-plan.md` / `docs/web-client/ux/reception-schedule-ui-policy.md` の差分を参照できるようにする。
