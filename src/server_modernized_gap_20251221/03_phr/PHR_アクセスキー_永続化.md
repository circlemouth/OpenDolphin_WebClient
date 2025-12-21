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

## 状態
- 机上確認のみ（実 DB への Flyway 実行・接続検証は未実施）。

## 変更ファイル
- `server-modernized/tools/flyway/sql/V0228__phr_key_and_async_job.sql`
- `server-modernized/src/main/resources/META-INF/persistence.xml`
- `common/src/main/java/open/dolphin/infomodel/PHRKey.java`
- `common/src/main/java/open/dolphin/infomodel/PHRAsyncJob.java`

## 留意点
- Phase2/Legacy 文書は参照のみで更新対象外。
- ORCA 実環境接続や Stage/Preview 実測は本タスクで未実施。
