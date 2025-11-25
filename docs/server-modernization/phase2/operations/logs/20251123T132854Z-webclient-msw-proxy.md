# 20251123T132854Z Web クライアント接続基盤セットアップログ（MSW 無効化 / VITE_DEV_PROXY_TARGET）

- YAML ID: `src/webclient_modernized_bridge/02_接続基盤セットアップ（MSW無効化とVITE_DEV_PROXY_TARGET設定）.md`
- 期間: 2025-11-25 09:00 〜 2025-11-26 09:00 (JST)
- スコープ: Stage 接続時の MSW/Service Worker 無効化、`VITE_DEV_PROXY_TARGET` と `.env.stage` の設定テンプレート、TraceId/接続先未設定ガードの表示確認手順整理。
- 実行端末: CLI（ブラウザ操作未実施）。スクリーンショットは未取得（取得先のみ定義）。

## 1. 参照チェーン
- `AGENTS.md`
- `docs/web-client/README.md#開発モックmswとバックエンド切替`
- `src/modernized_server/09_統合E2E接続確認（Webクライアント連携）.md`
- `docs/web-client/operations/mac-dev-login.local.md`

## 2. コマンドテンプレート（Vite 6.4 以降）
- Stage 接続（HTTP 推奨）
  ```
  VITE_DEV_PROXY_TARGET=https://<stage-host>/openDolphin/resources \
  VITE_API_BASE_URL=$VITE_DEV_PROXY_TARGET \
  VITE_DISABLE_MSW=1 \
  npx vite --host --mode stage --port 4173 --clearScreen false
  ```
- preview 経由
  ```
  VITE_DEV_PROXY_TARGET=https://<stage-host>/openDolphin/resources \
  VITE_API_BASE_URL=$VITE_DEV_PROXY_TARGET \
  VITE_DISABLE_MSW=1 \
  npm run build && npm run preview -- --host --mode stage --port 4173
  ```
- 接続先未設定ガード確認用（意図的に空）
  ```
  VITE_API_BASE_URL= \
  VITE_DEV_PROXY_TARGET= \
  VITE_DISABLE_MSW=1 \
  npx vite --host --mode stage --port 4173 --clearScreen false
  ```

## 3. 手動チェック予定
- [ ] Service Worker が未登録（`mockServiceWorker` が DevTools に出ない）ことを確認しスクリーンショット取得。
- [ ] 接続先未設定バナーが表示されることをスクリーンショット取得。
- [ ] TraceErrorBoundary / TraceNoticeCenter に同一 TraceId/RequestId が表示されコピーできることを確認しスクリーンショットを `artifacts/observability/20251123T132854Z/` に保存。
- [ ] `/api/version` などの疎通 API が Stage ホストへプロキシされていることを Network タブで確認し、Host ヘッダーとレスポンスコードを記録。

## 4. 備考
- ORCA 接続情報は `docs/web-client/operations/mac-dev-login.local.md` を参照する。Trial/本番経路や `curl --cert-type P12` は利用しない。
- 画面操作を伴う確認は未実施。GUI 環境で再開する際は本テンプレートを流用し、RUN_ID=`20251123T132854Z` で証跡を採取する。
