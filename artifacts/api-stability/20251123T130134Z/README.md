# API Stability Assets (RUN_ID=20251123T130134Z)

- 目的: `src/webclient_modernized_bridge/01_API互換レイヤー再確認とギャップ整理.md` で列挙した追加モック/期待値/ベンチマークを格納する。
- 追加対象: `/karte/modules`, `/karte/images`, `/chartEvent/dispatch`（LP/SSE 切替）, `/stamp/tree/sync`, `/pvt{,2}` delete 応答、ORCA warning 正規化レスポンス。
- 既存流用: `artifacts/api-stability/20251120T191203Z` の handlers/schemas/benchmarks をベースにコピーし、差分のみ本 RUN_ID で追加する。
- ベンチマーク計測は modernized-dev を対象に 11/25 以降実施予定（`ops/tools/send_parallel_request.sh --targets modern --loop 3 --loop-sleep 0.2 --run-id 20251123T130134Z`）。結果は `benchmarks/` 以下に保存する。

## 本 RUN_ID で追加したドラフト（Worker-B, RUN_ID=20251123T130134Z-B）
- `mocks/stamps-sync.md`: `/stamp/tree/sync` の no-op 応答と MSW 失敗分岐のドラフト。
- `mocks/chartEvent-delete.md`: ChartEvent DELETE / LP・SSE 切替・タイムアウト再現の期待値。
- `mocks/images-placeholder.md`: 画像タブ用の空レスポンス/409 分岐のプレースホルダー。
- `mocks/modules-placeholder.md`: モジュール API 未実装時の空レスポンスとリトライ確認用 503 ブランチ。

## 追加済みスキーマサンプル（RUN_ID=20251123T130134Z-C）
- `schemas/chart-event-lp.json` / `schemas/chart-events-sse.json`
- `schemas/karte-images-placeholder.json` / `schemas/karte-modules-placeholder.json`
- `schemas/stamp-tree-sync-noop.json`
