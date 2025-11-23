# Web クライアント互換レイヤー整理ログ（RUN_ID=20251123T130134Z）

参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `src/webclient_modernized_bridge/01_API互換レイヤー再確認とギャップ整理.md`

## 0. 前提
- タスク: Web クライアント × モダナイズ版サーバーの互換レイヤー再確認とギャップ整理（期間 11/25 09:00 - 11/27 09:00 JST）。
- RUN_ID=`20251123T130134Z`。Python 禁止、`server/` 配下は変更しない。
- 既存成果物: `artifacts/api-stability/20251120T191203Z/{mocks,schemas,benchmarks}/`（docinfo/pvtList/user/orca master）と `docs/server-modernization/phase2/operations/logs/20251120T191203Z-api-stability.md` を参照。

## 1. REST_API_INVENTORY × API_UI_GAP_ANALYSIS 差分
| 領域 | 差分内容 | 対応策（互換レイヤー/モック） |
| --- | --- | --- |
| カルテ更新 | Web は `PUT /karte/document` 本文更新、Modernized は `PUT /karte/document/{id}` タイトル更新のみ。 | `X-Client-Compat: legacy-doc-update` を有効化したときに本文更新を許可。期待レスポンス JSON を本 RUN_ID アーティファクトへ追加。 |
| ChartEvent | SSE `/chart-events` と LP `/chartEvent/subscribe` の優先度が異なる。 | `lp-only` flag で LP を強制、SSE をフォールバック。MSW で 55s×5 タイムアウトを再現するモックを追加。 |
| ORCA wrapper | Trial 404/405 や `apiResult` 欠落が UI に伝播。 | `orca-trial` flag で 404/405 → 200 + `apiResult=79` + warning ヘッダーに正規化。warning 付き期待値を artifacts へ追加。 |
| 受付削除 | Legacy=204 ボディ無し, Modernized=JSON 0/1 返却ケース。 | `strict-delete` flag で 204/空 JSON を強制。`/pvt` `/pvt2` delete 用モックと期待値を追加。 |
| 添付/モジュール | `/karte/modules/*` `/karte/images/*` が UI 未移植・⚠。 | 互換層は透過。MSW で空 list を返す placeholder を用意し UI クラッシュを防止。 |
| スタンプ同期 | `/stamp/tree/sync` は旧クライアント依存で UI 未実装。 | no-op 応答（現行 tree を返す）をモックし、flag で OFF 可能にする。 |

## 2. モック・アーティファクト方針
- **再利用**: `20251120T191203Z` の MSW/期待値/ベンチマークは全て流用可。
- **追加**: 本 RUN_ID で `artifacts/api-stability/20251123T130134Z/{mocks,schemas}/` を作成し、上表 6 項目＋ ORCA warning 応答を追加。ベンチマーク再取得時は seed→再起動 or `/pvt2` POST ウォームアップ手順を踏襲し、`benchmarks/README.md` をコピーしてパラメータのみ更新。

## 3. DoD
1) 上記ギャップの互換マッピングと flag 設定が本ログとタスク YAML に明記されている。  
2) 追加モック/期待値が `artifacts/api-stability/20251123T130134Z/` に揃い、クライアント開発チームが MSW に組み込める。  
3) DOC_STATUS 備考に RUN_ID とログ/アーティファクトパスを追記し、ハブと同期できる。  
4) ベンチマークを 11/25 以降に再採取し、SLA 超過時の暫定策を提示できる。  

## 4. 次の一手（期限 11/27 09:00 JST）
- MSW 追加: `/karte/modules`, `/karte/images`, `/chartEvent/dispatch`, `/stamp/tree/sync`, `/pvt{,2}` delete, ORCA warning 正規化。
- 期待 JSON 追加: doc update 成功/失敗、delete 成功（204/空 JSON）、ORCA warning 付きレスポンス。
- ベンチマーク: modernized-dev で `send_parallel_request.sh --targets modern --loop 3 --loop-sleep 0.2` を本 RUN_ID 名義で再実行し、結果を `benchmarks/` に保存。
