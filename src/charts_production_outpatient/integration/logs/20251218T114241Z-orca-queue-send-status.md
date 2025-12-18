# 証跡ログ: 45 `/api/orca/queue` と送信ステータス表示（RUN_ID=20251218T114241Z）

## 実施内容（概要）
- Charts に `/api/orca/queue` の取得を追加し、DocumentTimeline の各患者行に送信ステータス（待ち/処理中/成功/失敗）を表示するようにした。
- `lastDispatchAt` と `error` を併記し、一定時間を超えた場合は `滞留` として強調表示するようにした。
- `runId/traceId` を UI とログ（`logUiState` / `recordChartsAuditEvent`）へ残し、問い合わせ時に追えるようにした。

## 変更ファイル（実装）
- `web-client/src/features/outpatient/orcaQueueApi.ts`：`/api/orca/queue` の取得/再送/破棄 API（共通化）
- `web-client/src/features/administration/api.ts`：上記共通 API を再エクスポート
- `web-client/src/features/outpatient/orcaQueueStatus.ts`：送信ステータスの正規化（待ち/処理中/成功/失敗）と ClaimQueueEntry への変換
- `web-client/src/features/charts/pages/ChartsPage.tsx`：`/api/orca/queue` 取得＋状態差分ログ（`charts/orca-queue`）
- `web-client/src/features/charts/DocumentTimeline.tsx`：送信ステータスバッジ/滞留表示/選択患者サマリ表示
- `web-client/src/features/charts/ChartsActionBar.tsx`：状態行に送信状態（可能な範囲）を表示
- `web-client/src/features/charts/styles.ts`：`document-timeline__badge-success` を追加
- `web-client/src/features/charts/audit.ts`：`ORCA_QUEUE_STATUS` を監査アクションに追加（details で `counts/selectedSendStatus` を許可）

## UI で確認する観点（手動）
- Charts → DocumentTimeline の患者行に `送信:待ち/処理中/成功/失敗` が表示される
- `失敗` の場合、エラー文言（`error`）が併記される
- `lastDispatchAt` が一定時間以上前の `待ち/処理中` は `滞留` バッジが付与される
- 右側 “ORCA キュー連携” に `traceId` と `entries=<件数>`、およびキュー内訳（待ち/処理中/成功/失敗 + 滞留/不明）が表示される

## 監査/ログ（問い合わせ対応）
- `window.__AUDIT_EVENTS__`（監査ログ）に `action=ORCA_QUEUE_STATUS` が残る
- `window.__AUDIT_UI_STATE__`（UI 状態ログ）に `screen=charts/orca-queue` が残る
  - `runId/traceId`、`counts`、`selectedSendStatus` を含む
