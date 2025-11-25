# RUN_ID=20251122TenvCheckZ4 環境ステータス（Basic 200 + duplicate label 解消後）

## 1. 実行コマンド
- `./ops/tools/env-status-check.sh --run-id 20251122TenvCheckZ4 --project-name opendolphin_webclient --compose-file docker-compose.yml --compose-file ops/base/docker-compose.yml --compose-file docker-compose.modernized.dev.yml --compose-file ops/monitoring/docker-compose.otlp.yml --log-target server-modernized-dev --log-target otel-collector --basic-auth-file ~/.opendolphin/env-status-basic-auth.txt --password 632080fabdb968f9ac4f31fb55104648 --otel-profile otlp --skip-legacy --modern-note "Basic+MD5 200 OK after deployment label fix"`
- 実行タイムスタンプ: 2025-11-13 22:15 JST（`capturedAt=2025-11-13T13:15:24Z`）。Basic 認証ファイルは `~/.opendolphin/env-status-basic-auth.txt`（1 行 `9001:doctor1:doctor2025`）。

## 2. 8080 / 9080 応答状況
- Legacy 8080: `opendolphin-server` が compose 管理外（`com.docker.compose.project` ラベル無し）のため `--skip-legacy` で curl を抑止。`docker logs opendolphin-server --tail 400` を `opendolphin-server.manual.log` に採録し、18:39JST 台の `GET /system/license` 405 / stacktrace を保存。
- Modernized 9080: Basic 認証（`Authorization: Basic OTAwMTpkb2N0b3IxOmRvY3RvcjIwMjU=`）＋ `userName: 9001:doctor1` ／ `password: 632080fabdb968f9ac4f31fb55104648` で `HTTP/1.1 200 OK` を継続確認（`modern.headers.txt`）。ボディは空だが `X-Trace-Id=58364c00-b47b-453d-a8bf-b8511c084a37` を採取。

## 3. docker compose ps（`docker_compose_status.txt`）
- `opendolphin-{server-modernized-dev,postgres,postgres-modernized,minio,otel-collector}` と helper が `Up (healthy)`。公開ポート: 9080/9995, 9000-9001, 5432, 55433, 4318, 9464。
- Legacy (`opendolphin-server`) は docker compose から独立稼働のまま。Compose プロジェクトへ再結合するまでは `docker logs opendolphin-server` で補完する運用とする。

## 4. ログ採取
- `server-modernized-dev.logs.txt`: 60 秒周期の `/dolphin` ヘルスチェック INFO のみ。ERROR/WARN なし。
- `otel-collector.logs.txt`: `MetricsExporter` の INFO が 60 秒周期で列挙され、`duplicate label` 文字列は `rg` で検出されず（collector 再起動直後から WARN 消失）。
- `opendolphin-server.manual.log`: Legacy WildFly の 400 行 tail。`RESTEASY002010` WARN と `GET /system/license` 405 応答を記録。

## 5. Collector duplicate label 解消
- `ops/monitoring/otel-collector-config.yaml` に `metricstransform/rename_deployment_label`（Micrometer 側ラベル `deployment` → `deployment_source` へ改名）と `resource/deployment_env`（resource 属性 `deployment=local-dev` を upsert）を追加。Prometheus exporter 側の `const_labels.deployment=local-dev` と衝突しなくなり、`20251121TenvCheckZ3` で記録された WARN は再現しないことを `otel-collector.logs.txt` で確認。

## 6. トピック / 次アクション
1. Legacy 8080 は compose への再紐付け or `docker logs opendolphin-server` での代替証跡取得方針をマネージャーと相談する。現状は `RUN_ID=20251122TenvCheckZ4` に manual log を同梱してタイムアウト原因の切り分け材料を確保。
2. Collector 側の構成変更を `README.md` env-status 節と `docs/server-modernization/phase2/PHASE2_PROGRESS.md` に記録し、`DOC_STATUS.md` の RUN_ID 房を `20251122TenvCheckZ4` へ更新。Basic 200 と OTLP 常駐が揃っている最新 RUN_ID として本フォルダを参照できるようリンクする。
