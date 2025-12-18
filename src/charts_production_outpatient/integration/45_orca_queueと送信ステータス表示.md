# 45 `/api/orca/queue` と送信ステータス表示（RUN_ID=20251218T114241Z）

## 目的
- Charts に ORCA キュー（`/api/orca/queue`）の状態を表示し、送信の **待ち/処理中/成功/失敗** を “現場が判断できる” 形で可視化する。
- DocumentTimeline（受付→診療→会計）と **送信ステータス** を整合させ、会計へ進める/待つ/再送する判断を助ける。
- `runId/traceId` と紐づけて UI 状態・監査イベントを残し、問い合わせ対応（いつ何が起きたか）に耐える形にする。

## 対象
- Web クライアント: `web-client/` 配下（Legacy 資産は参照のみ）
- エンドポイント:
  - `GET /api/orca/queue`（全件取得）
  - `GET /api/orca/queue?patientId=<id>`（患者フィルタ）
  - `GET /api/orca/queue?patientId=<id>&retry=1`（再送トリガー: Charts ActionBar から利用）

## UI 反映（要点）
- `DocumentTimeline` の各患者行に **送信ステータスバッジ** を追加し、`送信:待ち/処理中/成功/失敗` を表示する。
  - `失敗` はエラー詳細（`error`）を併記。
  - `待ち/処理中` は `lastDispatchAt` を併記し、一定時間を超える場合は `滞留` バッジを追加。
- `ChartsActionBar` の状態行に、可能な範囲で `送信状態` を併記（`runId/traceId` と併せて現場で照会可能にする）。
- `DocumentTimeline` の “ORCA キュー連携” セクションに、選択患者の送信状態・`traceId`・キュー件数などを集約表示。

## ステータスマッピング（暫定）
- `/api/orca/queue` の `status` を UI の送信ステータスへ正規化する（環境差があるためフォールバックあり）。
  - `delivered/ack` → **成功**
  - `failed/error` → **失敗**
  - `pending/queued/waiting` → **待ち**（`lastDispatchAt` が直近の場合は **処理中** 扱い）
  - `retry/sent/processing...` → **処理中**

## 証跡（問い合わせ対応）
- Charts は `/api/orca/queue` のポーリング結果を `logUiState(screen=charts/orca-queue)` と `recordChartsAuditEvent(action=ORCA_QUEUE_STATUS)` へ記録する。
- `traceId` は `httpFetch` の `X-Trace-Id` で付与され、応答ヘッダー（`x-trace-id`）があれば自動更新される。

## 証跡ログ
- `src/charts_production_outpatient/integration/logs/20251218T114241Z-orca-queue-send-status.md`

