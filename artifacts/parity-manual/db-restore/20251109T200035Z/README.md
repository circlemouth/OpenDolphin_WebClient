# 2025-11-09 DB ベースライン復旧証跡

- **実行日時 (UTC)**: 2025-11-09T20:00:35Z 開始 / 20:05Z 完了
- **環境**: `scripts/start_legacy_modernized.sh start --build`（docker-compose.modernized.dev.yml 利用）
- **目的**: ローカル合成ベースライン + Flyway baseline/migrate 実施済み環境の Gate 証跡更新

## 取得ログ

| ファイル | 内容 |
| --- | --- |
| `start_legacy_modernized_start_build.log` | start --build の全出力（既存イメージの再利用を含む） |
| `psql_legacy_dt.log` | Legacy Postgres (`opendolphin-postgres`) で `psql -h localhost -U opendolphin opendolphin -c '\dt'` を実行した結果 |
| `psql_modern_dt.log` | Modernized Postgres (`opendolphin-postgres-modernized`) で同上 |
| `psql_legacy_d_users_count.log` | Legacy DB `SELECT count(*) FROM d_users;` |
| `psql_modern_d_users_count.log` | Modernized DB `SELECT count(*) FROM d_users;` |
| `flyway_info_legacy.log` | Legacy DB を対象に `flyway/flyway:10.17 info` を実行した結果 |
| `flyway_info_modern.log` | Modernized DB を対象に `flyway/flyway:10.17 info` を実行した結果 |

## 備考

- ホスト環境に `psql` クライアントが存在せず、Homebrew 経由での導入は approval policy=Never のため不可。代替として `docker exec <container> bash -lc "psql -h localhost ..."` で同一コマンドを実行し、コンテナ内 localhost を利用して取得した。
- Flyway は `docker run --network container:<db container>` + `flyway/flyway:10.17` で実行し、`server-modernized/tools/flyway/flyway.conf` / `sql` をボリュームマウントして baseline/migrate 履歴を確認。
- 両 DB とも `flyway_schema_history` に `0,0001,0002,0003,0220,0221,0222` が整合している。
