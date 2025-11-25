# RUN_ID=20251121TenvCheckZ3 環境ステータス（Basic 200 + OTLP 常駐）

## 1. 実行コマンド
- `./ops/tools/env-status-check.sh --run-id 20251121TenvCheckZ3 --project-name opendolphin_webclient --compose-file docker-compose.yml --compose-file ops/base/docker-compose.yml --compose-file docker-compose.modernized.dev.yml --compose-file ops/monitoring/docker-compose.otlp.yml --log-target server --log-target server-modernized-dev --log-target otel-collector --basic-auth-file /tmp/env-status-basic-auth.txt --password 632080fabdb968f9ac4f31fb55104648 --otel-profile otlp`
- 実行タイムスタンプ: 2025-11-13 21:43 JST（`capturedAt` は UTC）。Basic 認証ファイルは 1 行 `9001:doctor1:doctor2025` のみ（`env-status-basic-auth.txt`）。

## 2. 8080 / 9080 応答状況
- Legacy 8080: `curl` が 10 秒で `Operation timed out`（`legacy.meta.json` は `status=000` / `curlExitCode=28`）。`opendolphin-server` コンテナは稼働中だが `serverinfo/jamri` が応答しない状態のため、`legacy.curl.log` に timeout を記録して保留。
- Modernized 9080: Basic 認証（`Authorization: Basic OTAwMTpkb2N0b3IxOmRvY3RvcjIwMjU=`）＋ `userName: 9001:doctor1` ／ `password: 632080fabdb968f9ac4f31fb55104648` で `HTTP/1.1 200 OK`（`modern.headers.txt`）。ボディは空だが `X-Trace-Id=6d0ab042-57ec-4af7-ab8c-f0b3da3bf5ca` を取得。

## 3. docker compose ps（`docker_compose_status.txt`）
- `opendolphin-{server-modernized-dev,postgres,postgres-modernized,minio}` と `opendolphin-otel-collector` / `opendolphin_webclient-helper-1` が `Up (healthy)`。公開ポート: 9080/9000-9001/55432-55433/4318/9464。
- Legacy (`opendolphin-server`) は `com.docker.compose.project` ラベルなしで起動しているため `docker compose ps --project-name opendolphin_webclient` には表示されず、現状の `server.logs.txt` も空。Legacy 側ログを要取得の場合は `docker logs opendolphin-server` を手動採録する。

## 4. ログ採取
- `server-modernized-dev.logs.txt`: 60 秒周期の `/dolphin` 健康チェック INFO と Micrometer OTLP 成功ログ。警告はなし。
- `otel-collector.logs.txt`: collector 起動～ `MetricsExporter` 情報ログ、および duplicate label WARN。OTLP profile 常駐確認用の一次情報として保存。
- `server.logs.txt`: 上記理由により空。Compose プロジェクトに再紐付け後に再取得予定。

## 5. トピック / 次アクション
1. Legacy 8080 の timeout (curl exit 28) を `PHASE2_PROGRESS.md` へ記録し、`serverinfo/jamri` が応答しない理由を確認。再取得時は `--skip-legacy` で無効化するか、Compose 側へ Legacy サービスを再作成して `docker compose logs server` が機能する状態に戻す。
2. Modernized 側の Basic 200 証跡（`modern.{headers,body,meta}.txt`）と OTLP Collector ログ（本 RUN_ID 配下）を PHASE2_PROGRESS / DOC_STATUS の監視節に転記する。
3. Collector WARN（duplicate label）について `ops/monitoring/otel-collector-config.yaml` でメトリクス名を整理し、Prometheus exporter で metrics 衝突が発生しないように後続タスクで対処。
