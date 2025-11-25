# /karte/modules/* プレースホルダー（RUN_ID=20251123T130134Z-B）

## 目的
- 未移植のカルテモジュール API に対し、UI 初期化時の 404/405 を MSW 側で吸収して空状態を返す。

## 対象 UI
- ChartsPage 補助カード（ProblemListCard/SafetySummaryCard など）で将来利用予定のモジュール読み込みフック。

## エンドポイントと期待値
- `GET /api/karte/modules?chartId=<id>` → 200 OK
- レスポンス: `{ "list": [], "chartId": "chart-001", "syncedAt": "2025-11-23T00:00:00Z" }`

## MSW 実装方針
- GET: 空配列 + `X-Compat-Mode: modules-placeholder` を返却。
- `?withDraft=1` を付けた場合のみ 503 + `retryAfter=2` を返し、UI がリトライバックオフすることを確認。

## 実サーバー切替手順（記述のみ）
1. `VITE_API_BASE_URL=<modernized>` で preview を実行し、404/405/501 のどれになるかを確認。
2. 404/405 を UI 側で空リストに正規化し、差分をログへ残す（MSW は 200/空リストを返す）。

## 残課題
- ProblemListCard や SafetySummaryCard の `schema` 定義が確定した時点で、サンプル JSON を `schemas/` 配下に追加する。
- `process/API_UI_GAP_ANALYSIS.md` の該当行に「placeholder 対応済み」を追記するタスクを別途発行。 
