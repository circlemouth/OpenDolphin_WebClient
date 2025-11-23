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

### 2025-11-23 追記 (RUN_ID=20251123T130134Z-A / Worker-A)
- **PUT /karte/document (Charts)**: Web は本文 PUT、Modernized はタイトル PUT `/karte/document/{id}`。UI では DocumentTimeline の編集ボタンが本文更新を前提。推奨: 互換 flag `legacy-doc-update` を有効にし、MSW 期待値を `artifacts/api-stability/20251123T130134Z/schemas/karte-document-put.json` に配置。実サーバー経路は `/karte/document/{id}` にパス変換。
- **GET /chartEvent/subscribe + GET /chartEvent/dispatch (Charts/Reception SSE)**: UI は LP 優先で SSE fallback。Modernized は SSE `/chart-events` 先行。推奨: `lp-only` flag で LP 固定。MSW に 55s×5 タイムアウトと dispatch 成功/失敗のモックを追加。実サーバー検証は modernized-dev の `/chartEvent/subscribe` で実施。
- **GET /orca/tensu/*, /orca/disease/*, PUT /orca/interaction (Charts ORCA)**: Trial 環境で 404/405 や `Api_Result` 欠落が発生し UI に警告が出る。推奨: `orca-trial` flag で 200 + `apiResult=79` + warning header へ正規化。MSW に warning 付き成功レスポンスを追加。実サーバー経路は ORCA dev を参照（mac-dev-login.local.md 手前で止める）。
- **DELETE /pvt/{pvtPK}, DELETE /pvt2/{pvtPK} (Reception)**: Legacy 204/空ボディ、Modernized は JSON 0/1 の揺れ。UI は VisitManagementDialog Danger 操作で空レスポンスを期待。推奨: `strict-delete` flag で 204/空 JSON を固定し、MSW モックを追加。実サーバー検証は modernized-dev `/pvt2/{pvtPK}` で確認。
- **GET /karte/modules/*, GET /karte/images/* (Charts attachments)**: UI 未移植だが API インベントリでは ⚠。UI 影響はクラッシュ防止のみ。推奨: MSW placeholder で空 list + 必須メタを返し、互換レイヤーは透過。実サーバー経路は未公開、モック優先。
- **POST /stamp/tree/sync (Administration/Stamp)**: 旧クライアント同期専用。UI 未実装で no-op を期待。推奨: 互換層で現行 tree を返す no-op、MSW で 200 + unchanged tree を返すモックを追加。実サーバー経路は未使用のためモック固定。

### 2025-11-23 追記 (RUN_ID=20251123T130134Z-B / Worker-B)
- Charts/Stamp/Image/ChartEvent UI のモック期待値ドラフトを作成し、`artifacts/api-stability/20251123T130134Z/mocks/` に追加。
  - `/stamp/tree/sync` no-op + 503 ブランチ: `mocks/stamps-sync.md`
  - ChartEvent DELETE / LP・SSE タイムアウト再現: `mocks/chartEvent-delete.md`
  - 画像タブ空レスポンス/409: `mocks/images-placeholder.md`
  - モジュール空レスポンス/503 バックオフ: `mocks/modules-placeholder.md`
- 実サーバー切替は `VITE_DISABLE_MSW=1` + preview 起動のみを記述し、接続自体は未実施（Python/ORCA 禁止ルール遵守）。モックは MSW 前提で UI クラッシュ防止を優先。

### 2025-11-23 追記 (RUN_ID=20251123T130134Z-C / Worker-C)
- MSW ハンドラへ上記 4 モックを組み込み。`src/mocks/handlers/chartHandlers.ts` に互換フラグ別コメントを追加（lp-only/SSE バイパス、strict-delete 固定 204、attachment placeholder、no-op sync）。LP は 55s×5 回で 6 回目 204、AbortSignal で 499 を返す。SSE は 1 イベント + `retry:3000` を返す。
- MSW 用フィクスチャを `src/mocks/fixtures/apiStability.ts` に追加し、レスポンスサンプルを `artifacts/api-stability/20251123T130134Z/schemas/` へ格納:
  - `chart-event-lp.json`（LP イベント）
  - `chart-events-sse.json`（SSE フレーム）
  - `karte-images-placeholder.json`（添付空レスポンス）
  - `karte-modules-placeholder.json`（モジュール空レスポンス）
  - `stamp-tree-sync-noop.json`（text/plain no-op）
- 実サーバー接続時の確認手順（実行なし、記述のみ）: `VITE_DISABLE_MSW=1 VITE_API_BASE_URL=https://<host>/api npm run preview -- --host` を起動し、以下を期待値として比較する。
  - `GET /api/chartEvent/subscribe` … 200 LP または 204 タイムアウト（Modernized SSE 優先の場合は 404/405 も想定、UI は LP 優先でハンドリング）
  - `GET /api/chart-events` … 200 `text/event-stream`（SSE 1 件以上を期待）。LP 互換が必要なら `X-Client-Compat: lp-only` でバイパス。
  - `DELETE /api/chartEvent/:id` … 204（strict-delete 互換で空ボディ）。`?simulateConflict=1` 相当の 409 が返る場合は UI トーストで確認。
  - `GET /api/karte/images` … 404/405/501 いずれか。UI 側で空状態へ正規化するためステータスと body を記録。
  - `GET /api/karte/modules` … 404/405/501 想定。503 + `Retry-After` が返る場合はバックオフ動作を確認。
  - `PUT /api/stamp/tree/sync` … 未実装なら 404/405/501。実装済みなら `id,version` 形式の text/plain を期待。fail 系は `retryAfter` を記録。

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
