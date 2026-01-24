# Flyway/DDL 同期 作業ログ

- RUN_ID: 20260124T143904Z
- 作業日: 2026-01-24
- 作業ディレクトリ: /Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/.worktrees/task-1769265461073-30fab0

## 目的
- Flyway マイグレーションの適用保証と DDL 差分の解消。
- `d_module.bean_json` 欠落および監査 payload 型不整合の再発防止。

## 変更内容
- `server-modernized/tools/flyway/sql` と `server-modernized/src/main/resources/db/migration` を同期。
- 重複バージョン解消（`V0227_1__audit_event_trace_id.sql` / `V0230__letter_lab_stamp_tables.sql`）。
- `setup-modernized-env.sh` に Flyway migrate 自動適用とログ出力を追加。

## 検証
- `bash -n setup-modernized-env.sh`
- `diff -qr server-modernized/tools/flyway/sql server-modernized/src/main/resources/db/migration`
  - 差分なしを確認。
