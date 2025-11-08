# 未復旧オブジェクトと取得元メモ（2025-11-08）

| 種別 | オブジェクト | 現状 | 復旧方法 / 出典 |
| --- | --- | --- | --- |
| シーケンス | `facility_num` | `SystemServiceBean` で `select nextval('facility_num')` を実行するが、現行 DB にはシーケンス未作成。施設登録 API が `EntityExistsException` を投げる。 | Legacy ベースライン DDL (`legacy-server/db-baseline/opendolphin-legacy-schema.sql`) に含まれるため、`psql -f` で再作成。または `CREATE SEQUENCE facility_num START WITH <latest>` を DBA が実行し `ALTER SEQUENCE ... OWNED BY` を設定。 |
| テーブル | `d_audit_event` | `artifacts/manual/audit_log.txt` にもある通り `ERROR: relation "d_audit_event" does not exist`。監査ログ取得・TRACE_PROPAGATION_CHECK が進められない。 | Modernized ベースライン DDL（Secrets）を適用後に Flyway `V0003__security_phase3_stage7.sql` の `CREATE TABLE` が実行済みであることを `flyway_schema_history` で確認。 |
| テーブル | `d_factor2_credential`, `d_factor2_challenge`, `d_factor2_backupkey` | 2FA API 実行時に `psql` 参照が失敗する。 | 同上。Flyway `V0003` でテーブル定義と `DELETE FROM d_factor2_backupkey` が含まれるため、ベースライン + `flyway migrate` が必須。 |
| テーブル | `d_third_party_disclosure` | Touch 個人情報 API の監査結果保存先。現行 DB では未作成。 | Modernized ベースライン DDLに含まれる。 |
| テーブル | `phr_async_job` | `V0220__phr_async_job.sql` で作成されるが、`flyway migrate` を回していない環境では欠損。 | ベースライン適用後に `flyway migrate` を実行して `flyway_schema_history` に `22.0` の記録を残す。 |
| カラム | `d_document.admflag`, `d_module.performflag` | Legacy 側で参照されるフラグ列。Modernized DB では列欠損により JPQL が失敗。 | `V0221__doc_module_flag_columns.sql` を `flyway migrate` で適用する。 |
| その他 | `flyway_schema_history` | 現状の DB では `flyway_schema_history` 自体が存在せず、どこまでマイグレーション済みか追跡できない。 | `flyway baseline` を Secrets から取得した DDL 適用直後に実行し、`baselineVersion=0` 記録を作成。その後 `flyway migrate` を実施。 |
| ダンプ | 監査/テスト用マスキング済み SQL | `artifacts/manual/audit_log.txt` には失敗ログのみ。 | `docs/server-modernization/phase2/notes/test-data-inventory.md` の手順に沿って `psql` で `	` / `` の設定済みログを保存し、`artifacts/parity-manual/audit/` に配置する。 |
