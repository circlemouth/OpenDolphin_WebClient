# AGENTS README
作業をするにあたり、明示的に指示された場合を除き、Pythonスクリプトの実行は禁止する

## リポジトリ概要
- `client/`: 既存 Swing クライアントと共通ライブラリ。Java/Swing 資産で、参照のみ。
- `docs/`: 設計・要件ドキュメント。Web クライアント関連は `docs/web-client/README.md` をナビゲーションハブとする。
- サーバーモダナイズに関する資料は `docs/server-modernization/phase2/README.md` を起点に辿る。
- `common/`, `ext_lib/`: 共有ユーティリティおよび外部ライブラリ。
- `server/`: 既存サーバー実装。**サーバースクリプトは絶対に触らないこと。**

## プロジェクト目的
本プロジェクトの目的は電子カルテの Web クライアントを新規に構築すること。ロードマップ・マイルストーン・UX 指針は `docs/web-client/README.md` および `docs/web-client/ux/ONE_SCREEN_LAYOUT_GUIDE.md` を参照する。

## 作業方針
- 変更対象は Web クライアント開発に必要なフロントエンド資産とドキュメントのみとし、`server/` 配下のコード・スクリプトには手を加えない。
- 必要な資料は `docs/web-client/README.md` から辿り、更新時は同 README に概要と保存場所を追記する。
- タスク遂行時は `docs/web-client/planning/phase*/` 配下のフェーズ計画に従い、進捗や決定事項をドキュメントへ反映する。
- 機能や UI 実装を行う際は、暫定版ではなく実運用を前提とした完成度（業務フローに即した操作性・アクセシビリティ・例外処理まで含む）で仕上げること。利用者視点で本番投入できる品質を常に確保する。
- カルテ UI（`ChartsPage` などカルテ画面に関係するフロントエンド）を変更するタスクでは、作業前に必ず `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` を確認し、同ファイルからリンクされるレイアウト・ワークフロー・監査要件を踏まえて設計・実装・ドキュメント更新を行うこと。

## ドキュメント整理・保存ルール
- Web クライアント側の資料は `docs/web-client/README.md`、サーバーモダナイズ側は `docs/server-modernization/phase2/INDEX.md` を必ず起点とし、リンクを追加したら棚卸し台帳 `docs/web-client/planning/phase2/DOC_STATUS.md` のステータスを更新する。
- 参照頻度が低下した資料は `DOC_STATUS.md` で Dormant/Archive に区分し、Archive 判定になったら `docs/archive/<YYYYQn>/`（例: `docs/archive/2025Q4/`）へ移動する。移動元ファイルにはスタブとアーカイブ先リンクを残すこと。
- サーバー系タスクで作成する Runbook や計画書は `docs/server-modernization/phase2/(foundation|domains|operations|notes)/` 配下へ保存する。クライアント系タスクは `docs/web-client/(architecture|features|guides|operations|ux)/` を使用し、`LEGACY_INTEGRATION_CHECKS.md` など既存カテゴリに追記する。
- マネージャーが `【ワーカー指示】` を出す場合は、指示内に保存先ディレクトリを明記し、サーバー系・クライアント系の成果物が衝突しないようディレクトリを分ける。ワーカーは `【ワーカー報告】` と合わせて保存先パスと `DOC_STATUS.md` への反映状況を報告する。
- サーバーとクライアントの検証タスクを並列で行う際は、ログやスクリーンショットを `docs/server-modernization/phase2/operations/logs/` に日付付きで保存し、Web クライアント側の手順書（例: `docs/web-client/operations/LEGACY_INTEGRATION_CHECKS.md`）から参照できるようにする。

## タスク分担と役割
- 作業量が大きいと判断したタスクではマネージャーとして対応し、必要なワーカー数を検討したうえでタスクを分割する。
- 各ワーカーには担当範囲が重複しないよう十分配慮した明快なプロンプトを用意し、成果物と着手手順が即座に把握できる記述とする。
- マネージャーからワーカーへの指示には共通の接頭語 `【ワーカー指示】` を用い、ワーカーからの報告には `【ワーカー報告】` を用いる。
- `【ワーカー指示】` と明示されたタスクを受けた場合は、指示内容をそのまま遂行し、完了後は `【ワーカー報告】` でマネージャーへ結果を返す。


### サーバースクリプト関連作業について
- 原則として `server/` 配下のスクリプト変更は行わないが、関係者からの明示的な依頼等で例外的に修正を行う場合は、変更後に Docker Compose を用いて旧来版サーバーまたはモダナイズ版サーバーを起動し、ヘルスチェックエンドポイントへのアクセスで応答を確認すること。
- テスト手順の詳細は `docs/web-client/operations/TEST_SERVER_DEPLOY.md` を参照し、記載された設定調整・ビルド・起動・ヘルスチェックをすべて実施して結果を記録すること。

## コミュニケーション
- すべての返答・コメントは日本語で行うこと。
- 仕様不明点がある場合は該当ドキュメントへメモを残し、関係者確認を取ってから実装を進める。
