# DB初期化基盤整備ログ

- RUN_ID: 20260123T221243Z
- 作業日: 2026-01-23
- 対象IC: IC-01 / IC-02 / IC-03
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769206266004-f9c002

## 目的
- legacy schema dump を前提とした DB 初期化の必須化。
- search_path と必須シーケンスの起動時補正。

## 変更概要
- `setup-modernized-env.sh` に起動チェック + 修復 SQL 実行 + 初期化ログ出力を追加。
- `ops/db/maintenance/modernized_db_init_repair.sql` を新設。

## 修復SQL
- `ops/db/maintenance/modernized_db_init_repair.sql`
  - opendolphin スキーマ作成。
  - search_path を `opendolphin,public` に固定。
  - 必須シーケンスの作成と `setval` 補正。

## 初期化ログ
- `artifacts/preprod/db-init/db-init-<RUN_ID>.log`
  - `setup-modernized-env.sh` 実行時に生成。

## 検証
- 実行コマンド:
  `MODERNIZED_APP_HTTP_PORT=19092 MODERNIZED_APP_ADMIN_PORT=20097 MODERNIZED_POSTGRES_PORT=55540 MINIO_API_PORT=19202 MINIO_CONSOLE_PORT=19203 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- 結果: Modernized Server 起動・DB修復SQL適用・baseline seed・初期ユーザー登録まで完了。
- 初期化ログ: `artifacts/preprod/db-init/db-init-20260123T222356Z.log`
