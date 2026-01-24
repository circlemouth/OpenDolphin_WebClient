# DB初期化/自動検証フロー追加ログ

- RUN_ID: 20260123T232657Z
- 作業日: 2026-01-23
- 対象IC: IC-01 / IC-02 / IC-03
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769206266004-f9c002

## 目的
- /api/* 500 回避の自動検証を追加し、起動ログへ HTTP 結果と RUN_ID を残す。
- 修復SQLの常時適用を避け、search_path/必須シーケンス欠落時のみ適用する。
- SCHEMA_DUMP_FILE の取得元・生成手順・期待パスを明文化する。
- check_db_baseline の必須テーブル/シーケンス一覧を補強し、差分をログへ残す。

## 変更概要
- `ops/tools/api_health_check.sh` を追加（/api/admin/config の 401/403 を正常扱い、500 は即失敗）。
- `setup-modernized-env.sh` で API health check を起動フローへ組み込み。
- DB修復SQLは `search_path` または必須シーケンス欠落時のみ実行。
- `check_db_baseline` の必須テーブル/シーケンスを強化し、差分を `artifacts/preprod/db-init/db-init-<RUN_ID>.log` に出力。
- SCHEMA_DUMP_FILE 取得ガイドを `docs/preprod/implementation-issue-inventory/data-migration.md` に追記。

## 生成ログ
- DB初期化ログ: `artifacts/preprod/db-init/db-init-20260123T232657Z.log`
- API health log: `artifacts/preprod/api-health/api-health-20260123T232657Z.log`

## 検証
- 実行コマンド:
  `DB_INIT_RUN_ID=20260123T232657Z MODERNIZED_APP_HTTP_PORT=19092 MODERNIZED_APP_ADMIN_PORT=20097 MODERNIZED_POSTGRES_PORT=55540 MINIO_API_PORT=19202 MINIO_CONSOLE_PORT=19203 WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
- 結果:
  - DB init repair は baseline OK のためスキップ。
  - `/api/admin/config` は 401（正常扱い）で API health check OK。
  - DB baseline check OK（必須テーブル/シーケンス差分なし）。
