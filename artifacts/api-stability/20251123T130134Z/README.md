# API Stability Assets (RUN_ID=20251123T130134Z)

- 目的: `src/webclient_modernized_bridge/01_API互換レイヤー再確認とギャップ整理.md` で列挙した追加モック/期待値/ベンチマークを格納する。
- 追加対象: `/karte/modules`, `/karte/images`, `/chartEvent/dispatch`（LP/SSE 切替）, `/stamp/tree/sync`, `/pvt{,2}` delete 応答、ORCA warning 正規化レスポンス。
- 既存流用: `artifacts/api-stability/20251120T191203Z` の handlers/schemas/benchmarks をベースにコピーし、差分のみ本 RUN_ID で追加する。
- ベンチマーク計測は modernized-dev を対象に 11/25 以降実施予定（`ops/tools/send_parallel_request.sh --targets modern --loop 3 --loop-sleep 0.2 --run-id 20251123T130134Z`）。結果は `benchmarks/` 以下に保存する。
