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
`.env.sample` を参照してください。最低限 `VITE_API_BASE_URL` を既存サーバーのリバースプロキシ URL に設定します。

## 今後の予定
- 認証ラッパーと長輪講ラッパーの具体実装
- 共通 UI コンポーネントと Storybook の導入
- CI（lint/typecheck/test）の GitHub Actions 化
