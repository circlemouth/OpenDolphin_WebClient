# Postgres Baseline Attempt (20251108T062436Z)

## 手順サマリ
1. `./scripts/start_legacy_modernized.sh down` で既存 `legacy-vs-modern` プロジェクトのコンテナ/ボリュームを停止し、`legacy-vs-modern_postgres-data*` を削除してクリーンアップ。
2. `docker compose -f docker-compose.modernized.dev.yml up -d db-modernized` で Modernized Postgres を単体起動し、`psql` で `\dt` / `SELECT COUNT(*)` を実行して欠損を確認。
3. `docker run --network container:opendolphin-postgres-modernized flyway/flyway:10.17 migrate` を実行し、Secrets 由来 DDL 未取得のまま `V0002__performance_indexes.sql` が `relation "appointment_model" does not exist` で失敗したログを採取。
4. 同じタイムスタンプで Legacy `db` も起動し、`d_users` / `facility_num` / `d_audit_event` / `d_factor2_*` の存在とレコード件数を採取。
5. `docker compose ... stop && rm` で両 DB を停止し、全コマンド結果・`psql` 出力・検索ログを本ディレクトリへ保存。

## 主なログ
- `precheck.md`: Docker / Compose / Secrets 事前確認
- `baseline_search.log`: Home 配下でベースライン SQL を検索した結果（未検出）
- `docker_compose_*.log`: up/down/ps/stop の実行ログ
- `psql_*.log`: Modernized/Legacy の `\dt`, `SELECT COUNT(*)`, シーケンス確認
- `flyway_migrate.log`: `V0002` 失敗詳細（`42P01`）
