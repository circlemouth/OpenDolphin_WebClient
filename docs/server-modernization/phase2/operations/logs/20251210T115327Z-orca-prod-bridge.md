# RUN_ID=20251210T115327Z orca-prod-bridge 実装ログ
- 期間: 2025-12-12 09:00 - 2025-12-14 09:00 JST / 目的: webORCA 本番向け接続スクリプトの実装（接続試行なし・ドキュメント整備のみ）。
- 参照チェーン: AGENTS.md → docs/web-client/README.md → docs/server-modernization/phase2/INDEX.md → docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md → docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md
- 関連タスク: YAML ID=`src/orca_prod_bridge/implementation/接続スクリプト実装.md`

## 実施内容
- 新規スクリプト `scripts/orca_prod_bridge.sh` を作成。RUN_ID 必須・環境変数から ORCAcertification 資格情報を読み込み、`docs/server-modernization/phase2/operations/logs/<RUN_ID>-orca-prod-bridge.md` と `artifacts/orca-connectivity/<RUN_ID>/` 配下（httpdump/trace/data-check/）を自動作成する処理を実装。
- webORCA 本番 (`https://weborca.cloud.orcamo.jp:443`) 以外への接続は、`--force-target` で明示しない限り abort するフェイルセーフを追加。確認プロンプトは `--yes` でのみスキップ可能。
- 認証情報は `<MASKED>` 表示で存在チェックのみ実施し、PKCS#12 パスは `umask 077` のもとで読み込み。`bash -n scripts/orca_prod_bridge.sh` で構文検証のみ実施（ネットワーク・curl 実行なし）。

## 証跡
- スクリプト: `scripts/orca_prod_bridge.sh`
- ログテンプレート: 本ファイル（初期生成のみ、接続実績は未記入）
- 実行状況: 接続試行なし（dry-run も未実施）。認証情報・PHI の出力なし。

## メモ/フォローアップ
- `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` がリポジトリ上に存在しないため、接続運用ルールを参照する際は復旧・共有が必要。
- 端末で実行する際は `RUN_ID` の統一、`ORCA_PROD_*` 環境変数の事前設定、実行後の PHI マスクと `unset ORCA_PROD_*` を徹底すること。
