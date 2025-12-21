# PHR_アクセスキー_永続化
- 期間: 2025-12-26 13:00 - 2025-12-28 13:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/03_phr/PHR_アクセスキー_永続化.md`

## 目的
- phr_access_key 相当のマイグレーションと PHRKey/PHRAsyncJob の永続化前提を確認する。

## 確認内容
- Flyway
  - `server-modernized/tools/flyway/sql/V0228__phr_key_and_async_job.sql` で `d_phr_key` と `phr_async_job` の作成を定義済み。
- Persistence
  - `server-modernized/src/main/resources/META-INF/persistence.xml` に `PHRKey` / `PHRAsyncJob` を登録済み。
- Entity
  - `common/src/main/java/open/dolphin/infomodel/PHRKey.java` は `@Entity` + `@Table(name = "d_phr_key")`。
  - `common/src/main/java/open/dolphin/infomodel/PHRAsyncJob.java` は `@Entity` + `@Table(name = "phr_async_job")` と `jsonb` マッピングを保持。

## 実施結果 (RUN_ID=20251221T194544Z)
- Flyway
  - `flyway_schema_history` の `0228` を登録済み（`flyway_migrate_v0228_only.log`, `flyway_version_0228_after.txt`）。
  - `V0225` の重複で通常の `flyway migrate` が失敗するため、`-validateOnMigrate=false` で `V0228` 単独適用を実施。
- 永続化 (DB 直叩き)
  - `d_phr_key` / `phr_async_job` へ insert → select → delete で永続化を確認（`psql_persistence_check.txt`）。
- エビデンス: `artifacts/server-modernized-gap/20251221/phr_access_key_persistence/20251221T194544Z/`

## 実測できなかった項目
- `setup-modernized-env.sh` が `server-modernized` のビルドエラーで停止し、PHR API 経由の e2e 確認は未実施。
  - 失敗ログ: `artifacts/server-modernized-gap/20251221/phr_access_key_persistence/20251221T194544Z/setup-modernized-env.log`

## 変更ファイル
- `server-modernized/tools/flyway/sql/V0228__phr_key_and_async_job.sql`
- `server-modernized/src/main/resources/META-INF/persistence.xml`
- `common/src/main/java/open/dolphin/infomodel/PHRKey.java`
- `common/src/main/java/open/dolphin/infomodel/PHRAsyncJob.java`

## 留意点
- Phase2/Legacy 文書は参照のみで更新対象外。
- ORCA 実環境接続や Stage/Preview 実測は本タスクで未実施。
