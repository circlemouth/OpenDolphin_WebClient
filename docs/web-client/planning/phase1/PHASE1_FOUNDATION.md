# フェーズ1 技術基盤メモ (作成: 2025-10-29)

フェーズ1のプラットフォーム基盤整備に向け、使用技術と初期構成方針を整理する。

## 採用スタック
- フロントエンド: React 18 + TypeScript 5 系
- ビルド/開発サーバー: Vite 6（ESM ベースの高速ビルド、環境変数管理を活用）
- ルーティング: React Router v7
- データ取得・キャッシュ: TanStack Query v5
- HTTP クライアント: Axios（リトライ・タイムアウト・インターセプタ実装を前提）
- 認証ユーティリティ: Web Crypto API を優先しつつ、MD5 は `crypto-js` をフォールバック利用
- UUID 生成: `uuid`（v4）
- 状態管理: 必要最小限は React のコンテキストで賄い、グローバル共有が増加した場合は Zustand を追加検討
- フォーム: React Hook Form + Zod（バリデーションスキーマ共通化を目的）
- スタイリング: Emotion（`@emotion/react` / `@emotion/styled`）でテーマ／トークン設計を行い、Radix UI Primitives を必要に応じて採用
- テスト: Vitest + React Testing Library（ユニット・コンポーネントテスト）、MSW で API をモック
- ドキュメント/デザインレビュー: Storybook 8（デザインシステム α 版の公開手段）

## ディレクトリ構成（初期案）
```
web-client/
  src/
    app/               # ルーティング・アプリシェル
    components/        # 汎用 UI コンポーネント
    features/          # ドメイン単位（auth, patient, dashboard 等）
    libs/
      http/            # Axios ラッパー、API クライアント
      auth/            # 認証 SDK、ヘッダー生成
      utils/           # 汎用ユーティリティ
    styles/            # テーマ・グローバルスタイル
    test/              # テストユーティリティ
    main.tsx
  public/
  package.json
  tsconfig.json
  vite.config.ts
```

## 初期セットアップ方針
- `npm create vite@latest web-client -- --template react-ts` でスキャフォールドし、上記ディレクトリへリファクタする。
- ESlint/Prettier 設定を TypeScript 対応で適用し、`lint` `typecheck` `test` スクリプトを `package.json` に定義。
- Storybook を導入し、アプリシェルと主要 UI コンポーネントのプレビュー環境を段階的に整備。
- Vitest + MSW により API モックを用意し、認証・HTTP クライアントのユニットテストをカバー。
- `.github/workflows/web-client-ci.yml` を新設し、Lint/Typecheck/Test を CI で実行できるようにする（セットアップ完了後に実装）。

## 2025-11-01 追記: 開発モック導入（担当: Codex）
- `main.tsx` の `enableMocking()` で DEV モード起動時に MSW を自動登録。`/api/pvt2/pvtList` `/api/chartEvent/*` `/api/karte/docinfo/*` をスタブし、カルテ DocumentTimeline のリグレッションテストをローカルで完結できるようにした。
- 開発手順: `npm run dev` でモック起動、実 API 検証は `npm run build && npm run preview -- --host` を利用。切替時はブラウザで `mockServiceWorker` を解除する運用を定義。
- フィクスチャ配置を `src/mocks/fixtures/` に統一。API が増えた際は `src/mocks/handlers/` をエリア毎に分割し、`handlers/index.ts` で束ねるガイドラインを追加。
- ドキュメント反映: `web-client/README.md` に詳細手順を追記し、`docs/web-client/README.md` で参照案内を更新。

## チェックリスト（次アクション）
- [x] web-client プロジェクトのスキャフォールドと依存関係インストール
  - 2025-10-29: `npm create vite@latest web-client -- --template react-ts` をベースに React 18 + TypeScript プロジェクトを初期化し、主要ライブラリを導入。
- [x] 認証 SDK の雛形（MD5/UUID ラッパー、認証ヘッダー生成）
  - 2025-11-04: `auth-service`/`auth-storage` を追加し、MD5 ハッシュ生成・`clientUUID` 付与・/user 認証 API 呼び出し・セッション永続化を実装。`AuthProvider` はストレージ復元とストレージイベント同期に対応。
- [x] 共通 HTTP クライアント（タイムアウト・リトライ・監査ログフック）
  - 2025-11-04: 認証ヘッダー自動付与・指数バックオフに加えて `setHttpAuditLogger` を公開し、リクエスト/レスポンス/リトライ失敗の監査イベントを収集可能にした。単体テストでリトライ挙動を検証。
- [x] アプリシェル骨組み（固定ヘッダ/フッタ/左右カラム）
  - 2025-10-29: `AppShell` を実装し、Nav/Sidebar の 3 カラム構成を確立。初期に配置していたダッシュボード仮コンテンツはフェーズ4で撤去済み。
- [x] Storybook 初期構成
  - 2025-11-04: `@storybook/react-vite` + Emotion テーマの Storybook 8.6 を導入し、Button/TextField/SurfaceCard などデザインシステム α 版コンポーネントを登録。
- [x] CI ワークフロー追加
  - 2025-11-04: `.github/workflows/web-client-ci.yml` を新設し、`npm ci` → `lint` → `typecheck` → `test` → `build-storybook` を実行するパイプラインを構築。
- [x] 認証ラッパーのセキュリティレビュー
  - 2025-11-05: セキュリティチームが認証ラッパーのダイアグラムとコードを確認し、指摘事項ゼロで承認。詳細は [`PHASE1_SECURITY_REVIEW.md`](./PHASE1_SECURITY_REVIEW.md) を参照。
- [x] MSW モック運用ルール整備
  - 2025-11-01 (担当: Codex): `main.tsx` に MSW 初期化フックを追加し、`src/mocks/handlers`/`fixtures` を作成。`docs/web-client/README.md` と `web-client/README.md` に切替手順を明記。

## セキュリティレビューサマリ（2025-11-05 実施）
- 対象: `web-client/src/libs/auth` の `auth-service.ts`、`auth-storage.ts`、`AuthProvider.tsx`、および `docs/web-client/design-system/ALPHA_COMPONENTS.md` に記載された認証関連 UI 運用ガイド。
- 参加者: セキュリティチーム（担当: K. Nishimura）、フロントエンド開発（担当: Agent）。
- 論点:
  - MD5 ハッシュ生成をブラウザ側で実行する際のフォールバック処理とログ抑制の妥当性。
  - `clientUUID` 再生成タイミングとストレージ同期による多重ログイン検知。
  - ローカルストレージ破損時のリカバリフロー、`AuthProvider` の循環更新防止策。
- 結果: 重大なリスクは無し。改善として以下を確認または対応済みとした。
  1. `auth-storage` で Web Storage 例外時の警告ログが重複しないよう制御されていることをコードレビューで検証。
  2. `AuthProvider` のストレージイベントハンドリングに無限ループ防止の `originClientUUID` 判定が存在することをダイアグラムとコードで確認。
- フォローアップ: フェーズ2で `/login` 実サービス接続検証を行う際に、長輪講セッションタイムアウトと監査ログポリシーを再評価する。
