# 2025-11-10T23:10Z Schedule/DocumentModel 再検証 (RUN_ID=20251110T231006Z)

## 実施内容
1. `server-modernized/tools/flyway/sql/V0224__document_module_tables.sql` を Modern DB へ適用 (`docker run --network container:opendolphin-postgres-modernized flyway/flyway:10.17 migrate`).
2. `mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests` で WAR を再ビルド。
3. `scripts/start_legacy_modernized.sh down && start --build` で Legacy/Modernized 両スタックを再作成し、`docker ps` で `opendolphin-server-modernized-dev` が `healthy` になるまで待機。
4. `curl -H userName:1.3.6.1.4.1.9414.72.103:doctor1 ... /schedule/pvt/2025-11-09` を実行し、Modernized が `HTTP 200` とカルテ予定 JSON を返すことを確認。

## 証跡
- `flyway_migrate.log`: V0224 が schema "opendolphin" に適用され、`d_document`/`d_module`/`d_image`/`d_attachment` が作成されたログ。
- `flyway_history.log`: `flyway_schema_history` に version 0224 が追加されたことを確認。
- `mvn_server_modernized_package.log`: WAR 再ビルドの全出力。
- `compose_down.log` / `compose_start_build.log`: docker スタック再構築ログ。
- `docker_ps.log`: 起動直後のコンテナ状態 (`opendolphin-server-modernized-dev` healthy)。
- `server_modernized.log`: `LogFilter` の認証警告と、最終的に doctor1 で 200 を返した INFO ログを含む。
- `schedule_pvt_2025-11-09.json`: Modernized 200 レスポンス本文。`架空 花子` の予約 1 件を返却。
- `curl_schedule_pvt.log`: 送信したヘッダー（`password=632080fabdb968f9ac4f31fb55104648`）と HTTP 200。
- `psql_d_document.log` / `psql_document_counts.log`: `opendolphin` スキーマに `d_document`/`d_module`/`d_attachment` が存在し 0 件であることを確認。

## 既知の残課題
- `opendolphin.d_audit_event` に `/schedule/pvt/` の監査行が記録されず、TraceId 付きヘッダーを送っても `action=SYSTEM_ACTIVITY_SUMMARY` のみ。`LogFilter`/`AuditEventServiceBean` の連携調査が必要。
- JMS コネクション／`d_document` 系テーブルの seed は未投入（0 件）。`ops/db/local-baseline/local_synthetic_seed.sql` を Document/Module/Schema/Attachment 分まで拡張するタスクは別途管理。
