# ChartEvent DELETE/Lifecycle モック期待値ドラフト（RUN_ID=20251123T130134Z-B）

## 目的
- ChartEvent の削除/再購読時に UI が二重描画や孤児イベントを出さないことを確認する。
- SSE 優先→LP フォールバックの互換フラグ（`X-Client-Compat: lp-only`）を MSW で再現し、タイムアウト/キャンセルも制御する。

## 対象 UI
- ChartsPage 右ペイン: DocumentTimelinePanel と ChartEvent 履歴表示。
- SSE 再接続時のトースト/Badge 更新。

## エンドポイントと期待値
- `DELETE /api/chartEvent/:id` → 204 No Content（ボディ無し）
- `GET /api/chartEvent/subscribe?lastEventId=<n>` → 200 stream（LP）
  - 55s タイムアウトを 5 回まで繰り返し、6 回目で 204 を返す。
  - 例イベント: `{ "id": 501, "chartId": "chart-001", "category": "stamp", "status": "deleted", "updatedAt": "2025-11-23T00:01:23Z" }`
- `GET /api/chart-events`（SSE） → `event: chartUpdate\ndata: {...}` を 1 件送信後、`retry: 3000` を設定。

## MSW 実装方針
- LP: `ctx.delay(55000)` で 55s を再現し、`AbortSignal` でキャンセルされた場合は 499 相当を返す（UI ではリトライ表示のみ）。
- SSE: `new ReadableStream` で 1 イベント+`retry` を返し、`lp-only` ヘッダーが付いたら SSE ハンドラをバイパスして LP ハンドラを使用。
- `?simulateConflict=1` で 409 + `{"reason":"chart locked"}` を返し、UI のトーストを確認するブランチを追加。

## 実サーバー切替手順（記述のみ）
1. `VITE_DISABLE_MSW=1 VITE_API_BASE_URL=https://<host>/api npm run preview -- --host` を実行。
2. ブラウザの DevTools で SSE 接続先が `/api/chart-events` になっていることを確認し、LP にはフォールバックしないことを前提にする。
3. サーバーが LP のみを実装している場合、MSW 側の `lp-only` フラグと実挙動の差分（再接続回数・タイムアウト値）をログへ記録する。

## 残課題
- `ux/CHART_UI_GUIDE_INDEX.md` に記載の再接続 UX（トースト/Badge）とイベントペイロードの型を突合し、`schemas/chart-event.json` を別途追加する。
- 複数タブ開時の SSE 競合（`EventSource` 多重接続）を再現するテストケースは未整備。 
