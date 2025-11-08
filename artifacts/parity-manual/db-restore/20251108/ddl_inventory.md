# DDL / Tableseed 所在一覧（2025-11-08 時点）

| 区分 | ファイル/場所 | 備考 |
| --- | --- | --- |
| Legacy スキーマベースライン | Secrets Storage › `legacy-server/db-baseline/opendolphin-legacy-schema.sql`（Ops 配布） | `facility_num` シーケンス、CLAIM テーブル、`stamp_tree` など旧サーバーが参照するオブジェクトを含む `pg_dump --schema-only` 出力。リポジトリには含まれないため、Ops/DBA からの受け取りが必須。 |
| Legacy 初期データシード | Secrets Storage › `legacy-server/db-baseline/opendolphin-legacy-seed.sql`（要申請） | 施設アカウント・ユーザー・WEB1001〜1010 の患者データ。`docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` の JSONL 例と整合を取る。 |
| Modernized スキーマベースライン | Secrets Storage › `server-modernized/db-baseline/opendolphin-modern-schema.sql` | `d_audit_event`、`d_factor2_*`、`d_third_party_disclosure`、`phr_async_job` など Flyway `V0003+` で生成されないテーブルを含む。`V0001__baseline_tag.sql` で本ファイルをベースラインとして扱う前提。 |
| Flyway 差分マイグレーション | `server-modernized/tools/flyway/sql/V0002__performance_indexes.sql` 以降 | ベースライン適用後に `flyway migrate` で適用する差分。`pg_trgm` 拡張作成、カルテ検索インデックス、2FA/監査テーブル、`phr_async_job`、`d_document.admflag` / `d_module.performflag` 列追加を含む。 |
| スキーマ再エクスポートスクリプト | `server-modernized/tools/flyway/scripts/export-schema.sh` | `pg_dump --schema-only` を実行して Secrets ストレージへ再アップロードする際に使用。`DB_HOST/DB_NAME/DB_USER/DB_PASSWORD`/`OUTPUT_DIR` を環境変数で渡す。 |
| 監査ログ／2FA テストデータ | `docs/server-modernization/phase2/notes/test-data-inventory.md` 3.1 節、`artifacts/manual/audit_log.txt` | `d_audit_event` 欠損時のエラーメモ、成功時に採取すべき SQL、`docker exec ... psql` コマンド例を記録。監査証跡のゲート判定資料となる。 |
