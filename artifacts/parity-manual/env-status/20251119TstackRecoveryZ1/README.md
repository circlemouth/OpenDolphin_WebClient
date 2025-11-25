# RUN_ID=20251119TstackRecoveryZ1 環境ステータス再取得

## 1. 実行コマンド
- `./ops/tools/env-status-check.sh --run-id 20251119TstackRecoveryZ1 --compose-file docker-compose.yml --compose-file ops/base/docker-compose.yml --compose-file docker-compose.modernized.dev.yml --log-target server --log-target server-modernized-dev`
- 実行タイムスタンプ: 2025-11-13 17:16 JST（`legacy.meta.json` / `modern.meta.json` の `capturedAt` は UTC で記録）。

## 2. 8080 / 9080 応答状況
- Legacy 8080 (`http://localhost:8080/openDolphin/resources/serverinfo/jamri`): `HTTP/1.1 401 Unauthorized`。Basic 認証ヘッダー未付与のため 401 だが、`Server: WildFly/10` / `X-Trace-Id=36b4e484-...` が返っており、参照用 Legacy 環境の応答自体は安定している。
- Modernized 9080 (`http://localhost:9080/openDolphin/resources/serverinfo/jamri`): 2025-11-13 18:21 JST に Basic + ヘッダ認証で `HTTP/1.1 200 OK` を取得。`Authorization: Basic OTAwMTpkb2N0b3IxOmRvY3RvcjIwMjU=`（`9001:doctor1` / `doctor2025`）を送信しつつ、`password` ヘッダは MD5 値 `632080fabdb968f9ac4f31fb55104648`、`Accept: text/plain` を指定することで jamri プロパティ取得 API が応答した（ボディは空）。
  - Basic 認証ユーザーは `application-users.properties` / `application-roles.properties` へ `9001:doctor1=60a8f2d97fc9c64925b55f751447a982` / `9001:doctor1=user` を追記済み（`MD5(9001:doctor1:ApplicationRealm:doctor2025)`）。コンテナを再作成した際は `bin/add-user.sh` ではなくファイル追記で再登録すること。
  - DB 側の `d_users.userid='9001:doctor1'` は `docker exec -i opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern < ops/db/local-baseline/stamp_public_seed.sql` で復元済み。再構築時も同 SQL を流して facility=9001 クローンを作る。

## 3. curl headers / meta 主要値
- Legacy: `legacy.headers.txt` は 401 応答（`WWW-Authenticate: Basic realm="OpenDolphin"`）、`legacy.meta.json` でも `status=401` / `curlExitCode=0` / `auth.userName=9001:doctor1`。
- Modernized: `modern.headers.txt` は 200 応答（`Content-Type: text/plain;charset=UTF-8`, `X-Trace-Id=a1528761-...`）。`modern.meta.json` も `status=200` / `capturedAt=2025-11-13T09:21:30Z` / `notes="manual curl basic auth (Accept=text/plain, password header MD5 doctor2025)"`。
- レスポンスボディは Legacy 側が 401 JSON（`{"error":"unauthorized",...}`）、Modernized 側は空文字（`jamri.code` 未設定）。Trace ID は監視ダッシュボード転記用に保持。

## 4. docker compose ps（`docker_compose_status.txt`）
- `opendolphin-{minio,postgres,postgres-modernized,server,server-modernized-dev}` がすべて `Up 3 hours (healthy)`。公開ポート: 8080/9080/5432/55432/9000-9001/9990/9995。
- Legacy は参照用として待機、Modernized (`server-modernized-dev`) を主監視対象として 9080 の疎通とログを継続採取する方針を明記。

## 5. server / server-modernized-dev ログ要約
- `server.logs.txt`: 直近 200 行で `/dolphin` への GET が 30 秒間隔で継続し、WARN/ERROR なし。
- `server-modernized-dev.logs.txt`: Collector 起動前は `java.net.UnknownHostException: otel-collector` WARN を出力していたが、`logs/otel_collector/server-modernized-dev.after-otel.log` に記録したとおり 18:26:46 以降は INFO のみ。Collector 停止時に WARN が戻るため、再発時は `logs/otel_collector/` へ追加で採取する。

## 6. 次アクション
1. 9080 Basic 200 手順を毎 RUN で再確認する。`password` ヘッダーは `doctor2025` の MD5（`632080fabdb968f9ac4f31fb55104648`）、`Accept: text/plain` を維持し、`modern.{headers,meta}.txt` に 200 応答が揃っているかチェックする。
2. `docker compose --profile otlp ... up -d otel-collector` で Collector を常駐させ、停止・再起動時は `logs/otel_collector/` に collector / server-modernized-dev のログと `curl http://localhost:9464/metrics` の抜粋を追記する。WARN 再発時は README に日時/原因を記載。
3. Legacy 8080 は参照用アーカイブとして 401 応答のみを監視しつつ、Modernized 側の 200 応答・OTLP 健康状態を主監視対象とする。

## 7. OTLP Collector 起動ログ
- `ops/monitoring/docker-compose.otlp.yml` + `ops/monitoring/otel-collector-config.yaml` を追加し、`otel/opentelemetry-collector-contrib:0.101.0` を `--profile otlp` で常駐化。`MICROMETER_OTLP_ENDPOINT` などの env は `.env` へ追記済み。
- collector 起動コマンド: `docker compose --profile otlp -f docker-compose.yml -f ops/base/docker-compose.yml -f docker-compose.modernized.dev.yml -f ops/monitoring/docker-compose.otlp.yml up -d otel-collector`
- 証跡（`artifacts/parity-manual/env-status/20251119TstackRecoveryZ1/logs/otel_collector/`）
  - `otel-collector.logs.txt`: Collector 起動～メトリクス受信ログ。
  - `server-modernized-dev.after-otel.log`: Collector 稼働後 2 分間の WildFly ログ。UnknownHostException が消えている。
  - `prometheus_metrics_sample.txt`: `curl http://localhost:9464/metrics | head -n 40` の抜粋。
- Collector 停止時は `docker compose --profile otlp ... down` を実行し、停止理由と WARN 再発の有無を README へ追記する。
