# 02_接続基盤セットアップ（MSW 無効化と VITE_DEV_PROXY_TARGET 設定）

- RUN_ID: `20251123T132854Z`
- 期間: 2025-11-25 09:00 〜 2025-11-26 09:00 (JST)
- 優先度: Medium / 緊急度: High
- エージェント: gemini cli
- YAML ID: `src/webclient_modernized_bridge/02_接続基盤セットアップ（MSW無効化とVITE_DEV_PROXY_TARGET設定）.md`

## 参照チェーン（遵守）
1. `AGENTS.md`
2. `docs/web-client/README.md`
3. `docs/server-modernization/phase2/INDEX.md`
4. `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md`
5. 関連チェックリスト: `docs/managerdocs/PHASE2_WEB_CLIENT_EXPERIENCE_MANAGER_CHECKLIST.md`, `docs/managerdocs/PHASE2_SERVER_FOUNDATION_MANAGER_CHECKLIST.md`

## ゴール
- Stage/モダナイズ接続時に MSW/Service Worker を確実に無効化し、`VITE_DEV_PROXY_TARGET` / `.env.stage` で接続先を切り替えるテンプレートを用意する。
- 開発用 ORCA 接続情報の参照先（`docs/web-client/operations/mac-dev-login.local.md`）を `src/modernized_server/09_統合E2E接続確認（Webクライアント連携）.md` の記述に沿って明記する。
- 接続先未設定ガードと TraceId バナーの表示確認を行う手動チェックリストを準備する。
- 証跡・実行コマンドの雛形は `docs/server-modernization/phase2/operations/logs/20251123T132854Z-webclient-msw-proxy.md` に集約する。

## 1. Stage / Modernized 接続の前提と `.env.stage` テンプレ
- Vite 6.4 以降は `npm run dev:stage --https` が非対応。**HTTPS が必要な場合は `@vitejs/plugin-basic-ssl` + `server.https` を別途設定する。基本は HTTP で起動する。**
- `.env.stage`（例）  
  ```
  VITE_API_BASE_URL=https://<stage-host>/openDolphin/resources
  VITE_DEV_PROXY_TARGET=https://<stage-host>/openDolphin/resources
  VITE_AUDIT_ENDPOINT=https://<stage-host>/audit
  VITE_HTTP_TIMEOUT_MS=15000
  VITE_HTTP_MAX_RETRIES=3
  VITE_DISABLE_MSW=1
  ```
- `VITE_API_BASE_URL` と `VITE_DEV_PROXY_TARGET` は同一 URL を指定し、ビルド時埋め込みと開発プロキシの両方を Stage 向けに揃える。値未設定のまま MSW を無効化すると接続先未設定バナーが出る想定（後述チェックリスト）。

## 2. MSW / Service Worker 無効化手順（Stage 接続前に必須）
- **起動パラメータで無効化**: `VITE_DISABLE_MSW=1` を指定して Vite を起動する（`.env.stage` に含めるか、起動コマンドで付与）。`web-client/src/main.tsx` でこのフラグを見て MSW 登録をスキップする。
- **ブラウザの Service Worker を解除**: DevTools → Application → Service Workers から `mockServiceWorker.js` を `Unregister`。またはコンソールで  
  ```js
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
  ```
- **キャッシュ/自動登録のリスク回避**: 以前 MSW を使ったブラウザプロファイルではキャッシュが残るため、Stage 接続時はシークレットウィンドウか新規プロファイルで確認する。

## 3. 実行コマンドテンプレ（Vite 6.4+）
- **Stage 接続（推奨・HTTP）**  
  ```
  VITE_DEV_PROXY_TARGET=https://<stage-host>/openDolphin/resources \
  VITE_API_BASE_URL=$VITE_DEV_PROXY_TARGET \
  VITE_DISABLE_MSW=1 \
  npx vite --host --mode stage --port 4173 --clearScreen false
  ```
  - `--https` は付与しない（Vite 6.4 非対応）。HTTPS が必須な場合は別途 SSL プラグインを設定した上で `--https` を有効化する。
  - `.env.stage` を併用する場合は `--mode stage` で読み込まれる。値を直指定する場合は上記のように環境変数で上書きする。
- **preview 経由で実 API を確認したい場合（MSW なし）**  
  ```
  VITE_DEV_PROXY_TARGET=https://<stage-host>/openDolphin/resources \
  VITE_API_BASE_URL=$VITE_DEV_PROXY_TARGET \
  VITE_DISABLE_MSW=1 \
  npm run build && npm run preview -- --host --mode stage --port 4173
  ```
- **接続先未設定ガード確認用（意図的に未設定）**  
  ```
  VITE_API_BASE_URL= \
  VITE_DEV_PROXY_TARGET= \
  VITE_DISABLE_MSW=1 \
  npx vite --host --mode stage --port 4173 --clearScreen false
  ```
  - 上記で起動し `https://localhost:4173` へアクセスすると、画面上部に「接続先未設定（Stage URL を .env.stage に記入してください）」バナーが表示される想定。

## 4. ORCA 接続情報の参照ポイント
- Stage/開発用 ORCA の接続先・資格情報は `docs/web-client/operations/mac-dev-login.local.md` を参照する。
- `src/modernized_server/09_統合E2E接続確認（Webクライアント連携）.md` にも同ファイルへの参照が明記されている。Trial や本番経路、`curl --cert-type P12` の利用は禁止。

## 5. 手動チェックリスト（証跡は RUN_ID=`20251123T132854Z` で採取）
- **Service Worker 無効化確認**  
  - [ ] `VITE_DISABLE_MSW=1` で起動。ブラウザ DevTools → Application → Service Workers に `mockServiceWorker` が表示されないことを確認（表示された場合は Unregister）。
  - [ ] `network` タブで `/mockServiceWorker.js` へのリクエストが発生していないこと。
- **接続先未設定ガード**  
  - [ ] 3.の未設定テンプレートで起動し、上部バナー「接続先未設定（Stage URL を .env.stage に記入してください）」が表示されることをスクリーンショット取得。
- **TraceId バナー（ErrorBoundary/NoticeCenter）**  
  - [ ] Stage 接続状態で存在しない API を呼び出す（例: `/api/ping-missing` へ手動ナビゲートまたは故意に 500 を発生させる）。  
  - [ ] エラートーストと TraceErrorBoundary に同一 TraceId/RequestId が表示され、コピー可能であることを確認。スクリーンショットを `artifacts/observability/20251123T132854Z/` に保存。
- **プロキシ経由の実 API 呼び出し**  
  - [ ] `VITE_DEV_PROXY_TARGET` を Stage URL に設定した状態で `/api/version` などの疎通 API が 200 になることを Network タブで確認し、Host が Stage になっていることを記録。
- **mac-dev-login.credentials の参照導線**  
  - [ ] `docs/web-client/operations/mac-dev-login.local.md` の参照箇所を README/本ファイル/ログで相互リンクし、資格情報が一箇所から辿れることを確認（資格情報本文はログへ記載しない）。

## 6. 証跡・ログ配置（RUN_ID=`20251123T132854Z`）
- 手順・コマンド雛形: `docs/server-modernization/phase2/operations/logs/20251123T132854Z-webclient-msw-proxy.md`
- スクリーンショット（ガード/TraceId）: `artifacts/observability/20251123T132854Z/`（未取得の場合は「未取得」メモを残す）
- 追加メモ/追記先: `docs/web-client/planning/phase2/DOC_STATUS.md` に本ファイル行を追加し、備考へ RUN_ID とログパスを記載する。

## 禁止事項リマインダー
- Python スクリプトの実行禁止（明示指示時を除く）。
- `server/` 配下や Legacy 資産（`client/`、`common/`、`ext_lib/`）の変更禁止。
- ORCA 本番/Trial 経路への接続や `curl --cert-type P12` 利用は禁止。開発用接続は `mac-dev-login.local.md` の記述のみを使用する。
