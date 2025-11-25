# 2025-11-09 DB ベースライン復旧ログ

## 実施内容
- Legacy / Modernized 両方の Postgres へ `ops/db/local-baseline/local_synthetic_seed.sql` を投入 (`legacy_seed.log`, `modern_seed.log`)。
- Flyway 9.22.3 を `mvn -f pom.server-modernized.xml -pl server-modernized` 経由で実行。
  - `baseline` は `tools/flyway/flyway.conf` を直接参照する形に修正し、`d_audit_event` 系テーブルが version 0 から管理されることを確認 (`legacy_flyway_baseline.log`, `modern_flyway_baseline.log`)。
  - `migrate` で V0001/V0002/V0003/V0220/V0221/V0222 を適用。Legacy 側は `d_audit_event`・`d_factor2_*`・`phr_async_job` まで生成済み (`legacy_flyway_migrate.log`, `modern_flyway_migrate.log`)。
- Flyway 後に `psql` で代表テーブルと `d_document.admflag` / `d_module.performflag` を確認 (`legacy_psql_check.log`, `modern_psql_check.log`)。

## 残課題 / マネージャー確認依頼
1. `opendolphin-server(-modernized)` コンテナ再起動後も Flyway が維持されるか要確認（並列作業で stop→start が行われたため、現状は未確認）。
2. Modernized DB では `d_audit_event_seq` が欠落していたため手動で `CREATE SEQUENCE d_audit_event_seq` を実施済み。ただし再初期化時に失われる恐れがあるため、Docker 再起動後に `\ds d_audit_event*` を再チェックし、必要なら Flyway へ登録する。
3. `d_users` / `d_facility` の Modernized 側を Legacy 相当に合わせた（facilityId=`1.3.6.1.4.1.9414.72.103`、doctor/admin ユーザー）。他ワーカーの再投入で書き戻された場合は本 README を参照して差分を再適用してほしい。

## 証跡ファイル

| ファイル | 内容 |
| --- | --- |
| `legacy_seed.log` / `modern_seed.log` | `local_synthetic_seed.sql` 投入ログ。`facility_num` シーケンスや 2FA テーブル挿入の状況を記録。 |
| `legacy_flyway_baseline.log` / `modern_flyway_baseline.log` | Flyway Baseline 実行ログ。`tools/flyway/sql` 経由に修正した際の Maven 出力。 |
| `legacy_flyway_migrate.log` / `modern_flyway_migrate.log` | Flyway Migrate 実行ログ。`d_factor2_backupkey` への列追加など警告を含む。 |
| `legacy_psql_check.log` / `modern_psql_check.log` | 主要テーブルの存在確認と `d_users` / `d_audit_event` レコード数。 |

