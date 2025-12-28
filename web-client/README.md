# OpenDolphin Web クライアント基盤

フェーズ1「プラットフォーム基盤」で整備する React + TypeScript プロジェクトです。認証 SDK ・共通 HTTP クライアント・アプリシェル・デザインシステム α 版の足場となる最小構成を用意しています。

## 必要環境
- Node.js 20 以上
- npm 10 以上（リポジトリ既定のロックファイルは `package-lock.json`）

## 初期設定
```bash
npm install
cp .env.sample .env.local # 環境に応じて API エンドポイント等を編集
```

## 主なスクリプト
- `npm run dev`: Vite 開発サーバーを起動
- `npm run build`: 型チェック + 本番ビルド
- `npm run typecheck`: TypeScript 型チェックのみ実行
- `npm run lint`: ESLint を実行
- `npm run test`: Vitest をヘッドレス実行
- `npm run test:watch`: Vitest をウォッチモードで実行
- `npm run msw:init`: `public/mockServiceWorker.js` を再生成（MSW アップデート時に実行）

## 開発モック(MSW)とバックエンド切替
2025-11-01 更新（担当: Codex）。DocumentTimeline の安定化検証を即座に行えるよう、開発サーバーで MSW を標準起動する構成に移行しました。Charts Page では `/api/pvt2/pvtList`・`/api/chartEvent/*`・`/api/karte/docinfo/*` をモックし、カルテタイムラインの再描画とエラーメッセージ挙動をローカルのみで再現できます。

### モック（既定設定）で起動する
1. 依存関係をインストール: `npm install`
2. 開発サーバーを起動: `npm run dev`
3. ブラウザコンソールに `[MSW] 開発用モックを有効化しました。` と表示されていることを確認。
- モックデータは `src/mocks/fixtures/charts.ts` に集約。変更後はブラウザをリロードすれば即反映されます。
- 提供中のエンドポイント
  - `GET /api/pvt2/pvtList`: 受付 ID `72001`（患者「佐藤花子」）の受付 1 件を返却。`healthInsurances[].beanBytes` に XML を含め、保険パース処理を検証可能。
  - `GET /api/chartEvent/subscribe`: `PVT_STATE` イベントを即時返却し、`useChartEventSubscription` の状態更新を確認できる。
  - `PUT /api/chartEvent/event`: 常に `"1"` を返し、排他イベント送信成功をシミュレート。
  - `GET /api/karte/docinfo/{karteId,fromDate,includeModified}`: 2025-11-01 と 2024-10-15 のカルテ文書 2 件を返却。保険 GUID や `hasRp`・`hasLaboTest` などのフラグを含む。
- MSW をアップデートした際は `npm run msw:init` を実行し、`public/mockServiceWorker.js` を再生成する。

### 実サーバーに接続して確認する
1. 既定のモック登録を避けるため、ビルド + プレビューを使用: `npm run build && npm run preview -- --host`
2. `vite.config.ts` の `VITE_DEV_PROXY_TARGET` で WildFly 等のエンドポイントを指定し、`preview` サーバー経由で API プロキシを有効化。
3. 以前にモックを起動していた場合は、ブラウザの DevTools → Application → Service Workers から `mockServiceWorker` を Unregister（もしくはコンソールで `navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()))` を実行）。
4. 接続先を切り替えたら、再度 `ChartsPage` のタイムラインが API レスポンスで更新されること、エラー時に実 API のメッセージが `InlineFeedback` に反映されることを確認。

### Stage 接続手順
1. `.env.stage.example` をコピーして `.env.stage` を作成し、Stage 用の `VITE_API_BASE_URL` / `VITE_AUDIT_ENDPOINT` / `VITE_HTTP_TIMEOUT_MS` / `VITE_HTTP_MAX_RETRIES` を入力する（MSW 無効化は `VITE_DISABLE_MSW=1` 既定）。
2. `npm run dev:stage` を実行して HTTPS 開発サーバーを起動する（`--env-file .env.stage` で Stage 向け環境変数を読み込み、MSW を無効化）。
3. ブラウザで https://localhost:4173 を開き、Stage API への疎通を確認する。自己署名証明書を受け入れる必要がある場合はブラウザで明示許可する。

### DocumentTimeline 安定化の確認ポイント
- カテゴリトグルを切り替えても最新イベントが自動でフォーカスされ、詳細ペインと参照カルテが同期する。
- 取得失敗時は API からのメッセージがそのまま赤背景で表示される（`resolveErrorMessage`）。網羅されていない例外はデフォルト文言「イベントの取得に失敗しました。」で通知。
- ドキュメントイベント選択時にタイトル編集が行え、更新成功/失敗が青 or 赤の `InlineFeedback` で即時フィードバックされる。
- Visit/Lab/Order イベントは自動操作（参照パネル更新／Plan ドラフト挿入）と情報メッセージが連動することを手動確認。

## ディレクトリ概要
```
src/
  app/            # ルーティングとアプリシェル
  components/     # 汎用 UI コンポーネント（今後追加）
  features/       # 機能単位の画面/ロジック
  libs/
    auth/         # 認証 SDK（MD5 ハッシュ・UUID 等）
    http/         # Axios ベースの HTTP クライアント
    utils/        # 共通ユーティリティ
  styles/         # テーマとグローバルスタイル
  test/           # テスト用ユーティリティ・セットアップ
```

## 環境変数
`.env.sample` を参照してください。最低限 `VITE_API_BASE_URL` を同一オリジンの `/api` に設定します（未指定時の既定値も `/api`）。

### 本番/ステージ環境の分離
- Stage: `web-client/.env.stage.example` を `.env.stage` として作成し、`npm run dev:stage`（`--env-file .env.stage`）で起動します。
- Prod: `web-client/.env.prod.example` を基にデプロイ先の環境変数（または `.env.prod`）を用意し、`VITE_DISABLE_MSW=1` を固定します。

### MSW 無効化時の接続パス（本番向け）
- `web-client/src/main.tsx` は `VITE_DISABLE_MSW !== '1'` のときのみ MSW を登録します（`VITE_DISABLE_MSW=1` で完全に無効化）。
- `web-client/src/LoginScreen.tsx` は `VITE_API_BASE_URL ?? '/api'` を API ベースとして参照します（既定値は `/api`）。
- 本番/Stage は **同一オリジンで `/api` をリバースプロキシ**する前提に統一し、CORS を回避します。
- 別オリジン運用が不可避な場合のみ、API 側で `Access-Control-Allow-Origin`/`Access-Control-Allow-Credentials` を許可し、Cookie 利用時は `SameSite=None; Secure` を設定します。

### 本番/Stage の証明書・CORS・プロキシ前提
- **Stage**: `/api` を同一オリジンへリバースプロキシ。HTTPS 前提（自己署名の場合はブラウザ許可）。CORS 設定は不要。
- **Prod**: `/api` を同一オリジンへリバースプロキシ。TLS 設定は本番証明書前提。CORS 設定は不要。
- **Dev/Preview**: ローカル検証のみ `VITE_DEV_PROXY_TARGET` を利用（`/api` をこのオリジンへ中継）。
- **ORCA**: mTLS が必要な本番/Stage 経路は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を厳守（証明書・Basic 認証情報はログに残さない）。

## 今後の予定
- 認証ラッパーと長輪講ラッパーの具体実装
- 共通 UI コンポーネントと Storybook の導入
- CI（lint/typecheck/test）の GitHub Actions 化

## 更新履歴
- 2025-11-01 (担当: Codex): DocumentTimeline 検証用の MSW モック導入手順と実サーバー切替フローを追記し、タイムライン安定化の確認ポイントを整理。
