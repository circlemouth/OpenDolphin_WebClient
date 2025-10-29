# フェーズ1 技術基盤メモ (作成: 2025-10-29)

フェーズ1のプラットフォーム基盤整備に向け、使用技術と初期構成方針を整理する。

## 採用スタック
- フロントエンド: React 18 + TypeScript 5 系
- ビルド/開発サーバー: Vite 5（ESM ベースの高速ビルド、環境変数管理を活用）
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

## チェックリスト（次アクション）
- [x] web-client プロジェクトのスキャフォールドと依存関係インストール
  - 2025-10-29: `npm create vite@latest web-client -- --template react-ts` をベースに React 18 + TypeScript プロジェクトを初期化し、主要ライブラリを導入。
- [ ] 認証 SDK の雛形（MD5/UUID ラッパー、認証ヘッダー生成）
  - 2025-10-29: `AuthProvider` と `auth-headers` ユーティリティを追加。API 応答処理・セッション永続化は未着手。
- [x] 共通 HTTP クライアント（タイムアウト・リトライ・監査ログフック）
  - 2025-10-29: Axios インスタンスで認証ヘッダー挿入・指数バックオフリトライ・開発用ログ出力を実装。監査ログ永続化は後続対応。
- [x] アプリシェル骨組み（固定ヘッダ/フッタ/左右カラム）
  - 2025-10-29: `AppShell` とダッシュボード仮コンテンツを配置し、Nav/Sidebar の 3 カラム構成を確立。
- [ ] Storybook 初期構成
- [ ] CI ワークフロー追加
