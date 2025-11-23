# /stamp/tree/sync モック期待値ドラフト（RUN_ID=20251123T130134Z-B）

## 目的
- スタンプツリー未実装 UI がクラッシュせず読み込み待ち/空状態で戻ることを保証する。
- Modernized サーバーでは API 実装が透過のため、MSW で no-op レスポンスを提供し、flag で無効化できるようにする。

## 対象 UI
- ChartsPage 左カラム「スタンプ」タブ（未表示でも初期化処理が走るケースを想定）。
- 共有/施設/公開スタンプの切替セレクタ。

## エンドポイントと期待値
- `GET /api/stamp/tree/sync` → 200 OK
- レスポンスボディ: `{"tree": [], "facilityId": "9001", "syncedAt": "2025-11-23T00:00:00Z"}`
- ヘッダー: `X-Compat-Mode: msw-noop`

## MSW 実装方針
- `ctx.delay(120)` で軽微な待機を入れ、UI のローディング表示を確認可能にする。
- env flag `VITE_DISABLE_MSW=1` で実サーバーへ切替、`X-Client-Compat: orca-trial` 等の互換ヘッダーはそのまま透過。
- エラー挙動検証用に `?fail=1` で 503 + `retryAfter=3` を返すブランチを用意する（デフォルト OFF）。

## 実サーバー切替手順（記述のみ）
1. `npm run build && npm run preview -- --host` で MSW 無効のプレビューを起動。
2. `.env.preview` または CLI で `VITE_API_BASE_URL=https://<modernized-host>/api` を設定。
3. サーバー側で `/stamp/tree/sync` が未実装の場合は 404/405 が返る想定。UI 側は空ツリーとして扱うため、MSW の no-op との差分確認のみ実施。

## 残課題
- `features/PHASE3_STAMP_AND_ORCA.md` の UI 設計と同期して階層構造の JSON サンプルを作成する。
- スタンプ編集ダイアログの保存 API（未実装）を別ファイルで定義する。現状は閲覧専用。 
