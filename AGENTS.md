# AGENTS README

## リポジトリ概要
- `client/`: 既存 Swing クライアントと共通ライブラリ。Java/Swing 資産で、参照のみ。
- `docs/`: 設計・要件ドキュメント。Web クライアント関連は `docs/web-client/README.md` をナビゲーションハブとする。
- `common/`, `ext_lib/`: 共有ユーティリティおよび外部ライブラリ。
- `server/`: 既存サーバー実装。**サーバースクリプトは絶対に触らないこと。**

## プロジェクト目的
`docs/web-client/planning/WEB_CLIENT_WORK_PLAN.md` に記載されている通り、本プロジェクトの目的は電子カルテの Web クライアントを新規に構築すること。ロードマップ・マイルストーン・UX 指針は同ドキュメントおよび `docs/web-client/ux/ONE_SCREEN_LAYOUT_GUIDE.md` を参照する。

## 作業方針
- 変更対象は Web クライアント開発に必要なフロントエンド資産とドキュメントのみとし、`server/` 配下のコード・スクリプトには手を加えない。
- 必要な資料は `docs/web-client/README.md` から辿り、更新時は同 README に概要と保存場所を追記する。
- タスク遂行時は `docs/web-client/planning/WEB_CLIENT_WORK_PLAN.md` のフェーズ計画に従い、進捗や決定事項をドキュメントへ反映する。

## コミュニケーション
- すべての返答・コメントは日本語で行うこと。
- 仕様不明点がある場合は該当ドキュメントへメモを残し、関係者確認を取ってから実装を進める。
