# 04C2 WEB クライアント API 統合実装

- **RUN_ID=20251204T210000Z** / 期間: 2025-12-12 09:00 - 2025-12-14 09:00 JST
- **対象**: Reception/Charts 保守 Orchestration における外来 API 回路の telemetry funnel への接続と、`dataSourceTransition=server` での `cacheHit`/`missingMaster` フラグ継承
- **参照チェーン**: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md` → `docs/web-client/ux/ux-documentation-plan.md` → 本ファイル
- **依存資料**: `docs/server-modernization/phase2/operations/logs/20251124T073245Z-webclient-master-bridge.md`、`docs/server-modernization/phase2/operations/orca-master-sprint-plan.md`、`docs/web-client/architecture/web-client-api-mapping.md`、`docs/web-client/ux/reception-schedule-ui-policy.md`

## 1. 目的

04C1 で設計した `resolveMasterSource` → `httpClient` → `auditEvent` の接続を、実装フェーズで telemetry funnel と Reception/Charts Orchestration のトーン同期にまで広げる。`dataSourceTransition=server` を維持しつつ `cacheHit`/`missingMaster` を telemetry へ送信し、Orchestration 側が flag を受信した時点で `tone=server` バナー＋ `audit.logUiState` のメタを残せるようにする。

## 2. 実装タスク

1. `web-client/src/libs/http/httpClient.ts` の `OUTPATIENT_API_ENDPOINTS` を telemetry 対応前提でグルーピングし、`resolveMasterSource` から `dataSourceTransition=server` を返す経路では `cacheHit`/`missingMaster` を明示的に保ちつつ `telemetryClient` に渡す。各エンドポイント (`/api01rv2/claim/outpatient/*` など) には `runId`/`dataSourceTransition`/`cacheHit`/`missingMaster` を含めた監査 metadata を付与しつつ、telemetry に `funnelStage` を添える。
2. `web-client/src/libs/telemetry/telemetryClient.ts` をフックし、Charts Orchestration で受信した flag (`tone=server` + `dataSourceTransition=server`) でファネルログを残す。`charts` の Orchestration 層は `tone=server` トリガを受けたら `telemetryClient.recordFunnel`（仮）を呼び、`cacheHit`/`missingMaster` をラベルに含む。
3. docs 連携: `docs/web-client/ux/reception-schedule-ui-policy.md` と `docs/web-client/ux/ux-documentation-plan.md` に接続フロー図＋差分を追記し、新 log `docs/server-modernization/phase2/operations/logs/20251204T210000Z-integration-implementation.md` へ API パス一覧と実装計画（telemetry funnel/Orchestration flag）を記録。`docs/web-client/planning/phase2/DOC_STATUS.md` の `Web クライアント UX/Features` 行にも RUN_ID=`20251204T210000Z` を反映。

## 3. 現状・懸念

- 現在の `web-client` ソースツリーには `web-client/src/libs/telemetry/telemetryClient.ts` および `web-client/src/features/charts` が存在していないため、該当モジュールが戻ってくるまで telemetry funnel の実装を進められない。上記ファイル群が復元された時点で (1)/(2) を順に実装する予定。
- `resolveMasterSource` がどこに定義されているかもこの作業ブランチでは確認できないため、実装箇所が判明次第 (1) で `cacheHit`/`missingMaster` を telemetry に渡すコードを差分に組み込む。

## 4. 次のステップ

1. `web-client` に telemetry/Charts assets が揃ったタイミングで `httpClient` と `telemetryClient` の差分を `forge` し、`DataSourceTransition` 周りのユニットテストを追加。
2. 04C2 の仕様を `CODex` Orchestration チームと共有し、Playwright/Stage で `tone=server` + `resolveMasterSource=server` 経路をキャプチャしたログ（`artifacts/webclient/ux-notes/20251204T210000Z-*` 予定）を `docs/server-modernization/phase2/operations/logs/20251204T210000Z-integration-implementation.md` に追記。
3. DOC_STATUS に RUN_ID=`20251204T210000Z` を反映し、manager checklist へも同 RUN_ID とログパスを伝播する。
