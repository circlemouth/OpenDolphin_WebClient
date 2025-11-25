# Ops 観測性・Nightly CPD 実行計画（2026-06-16 更新、担当: Worker D）

## 2026-06-16 追記: Secrets 読み込み順と Micrometer/Prometheus 試行（担当: Worker Codex）

### .env / configure-wildfly 読み込み順
| 順序 | レイヤ | ファイル / エントリ | 摘要 |
| --- | --- | --- | --- |
| 1 | Compose ルート | `.env` / `.env.sample` | `POSTGRES_*`, `FACTOR2_AES_KEY_B64`, `LOGFILTER_HEADER_AUTH_ENABLED`（2026-06-16 追加）をここで定義。`ops/tools/logfilter_toggle.sh` もこのファイルを編集する。 |
| 2 | docker-compose (legacy) | `docker-compose.yml` → `services.server{,-modernized}.environment` | `.env` の値を `${VAR:-default}` で展開し、コンテナ環境変数へ渡す。`server-modernized` には `LOGFILTER_HEADER_AUTH_ENABLED` を追加済み。 |
| 3 | docker-compose (modernized dev) | `docker-compose.modernized.dev.yml` | `server-modernized-dev` の DB 接続情報、FIDO2、FACTOR2、Micrometer 系パラメータを注入。 |
| 4 | WildFly CLI | `ops/legacy-server/docker/configure-wildfly.cli` / `ops/modernized-server/docker/configure-wildfly.cli` | `${env.DB_HOST}`, `${env.DB_SSLMODE}` などでコンテナ環境変数を参照し、JDBC/JMS/Micrometer/Elytron リソースを定義。 |
| 5 | Jakarta EE | `SecondFactorSecurityConfig` / `Fido2Config` | `System.getenv` から 2FA Secrets を直接参照。`FACTOR2_AES_KEY_B64` が空の場合は `IllegalStateException` を即時送出。 |

関連ログ/証跡: `artifacts/parity-manual/secrets/env-loading-notes.md`, `artifacts/parity-manual/secrets/wildfly-start.log`

### Micrometer / Prometheus 試行
- `ops/tools/send_parallel_request.sh --loop 5 GET /dolphin observability_loop` で負荷を作り、レスポンスを `artifacts/parity-manual/observability/observability_loop_loop###/*` に保存（Legacy/Modern を同一 URL に向け、リクエストメトリクスが発火することを確認）。
- `curl http://localhost:9080/actuator/{health,metrics,prometheus}` および `curl http://localhost:9080/metrics/application` を実行し、レスポンス/ヘッダーを `artifacts/parity-manual/observability/actuator_health.log` などへ保存した。WildFly は起動しているものの、いずれも `HTTP/1.1 404 Not Found` で Micrometer エンドポイントが公開されていないことが判明。
- `ops/modernized-server/docker/configure-wildfly.cli` には legacy 版と異なり `subsystem=micrometer` ブロックが未定義のため、`micrometer` サブシステムと `registry=prometheus` を modernized 側にも追加し、`MICROMETER_PROMETHEUS_CONTEXT=/metrics/application` を有効化するタスクが残る。
- 監視連携の現状: `RequestMetricsFilter` / `DatasourceMetricsRegistrar` は Micrometer API へ記録しているが、JNDI `java:jboss/micrometer/registry` が未バインドなため `Metrics.globalRegistry` フォールバックで稼働中（`docker logs | rg \"Micrometer registry not found\"` 参照）。Prometheus 連携を確認するには WildFly 管理 CLI で `subsystem=micrometer:add(...)` を適用し、再度 `/metrics/application` を取得する必要がある。
- 2025-11-08 再試行 (headless profile): `ops/modernized-server/docker/configure-wildfly.cli` に Micrometer サブシステムと Undertow 逆プロキシを追加し（`remote-destination-outbound-socket-binding=management-metrics` + `/actuator/{health,metrics,prometheus}` を WildFly 管理ポート 9990 へ転送）、`management-interface` の Basic 認証を強制。`docker compose --project-name modernized-headless --file docker-compose.modernized.dev.yml up -d --build` → `scripts/start_wildfly_headless.sh down` の流れで構成差分を適用し、`artifacts/parity-manual/observability/20251108T063106Z/` に CLI/compose ログ (`compose_up_retry.log`/`wildfly_start.log`)、`curl` 証跡 (`actuator_*.log`/`metrics_application.log`) および `README.md`（再現手順）を保存した。
  - `curl http://localhost:9080/actuator/{health,metrics,prometheus}` は `HTTP/1.1 503 Service Unavailable`（`boot-errors` に Micrometer CDI 二重登録が記録）。Prometheus 形式は取得できず、成功ケース採取タスクが残った。
  - `ops/tools/send_parallel_request.sh --profile compose --loop 5 GET /dolphin observability_loop` を `PARITY_OUTPUT_DIR=.../20251108T063106Z` で再実行。Legacy (8080) は headless profile に含まれず `curl: (7)`、Modernized 側は 404 だが `opendolphin_api_error_total` と `opendolphin_api_request_duration` のメトリクスが上昇している。ヘッダーは `ops/tests/api-smoke-test/headers/legacy-default.headers`。
  - WildFly 33 では `subsystem=micrometer/registry=prometheus` リソースが提供されていないため、`MICROMETER_PROMETHEUS_CONTEXT` のような CLI 属性は設定不可。Prometheus Pull は管理ポート (9990) で公開されるデフォルトパス (`/metrics` / `/metrics/application`) を利用し、アプリケーションポート側は Undertow 逆プロキシで `/actuator/*` へ転送する方式に統一する。環境差異がある場合は `MICROMETER_MANAGEMENT_HOST` / `MICROMETER_MANAGEMENT_PORT` でプロキシ先を上書きする。

### Secrets 欠落ケース監視マトリクス（2025-11-08 追加）
| ケース | 検知シグナル（Prometheus） | Grafana パネル (UID) | PagerDuty ルート | 備考 / Evidence |
| --- | --- | --- | --- | --- |
| DB 認証値欠落（`MODERNIZED_POSTGRES_PASSWORD` 破棄） | `opendolphin_db_active_connections == 0` 且つ `increase(opendolphin_api_error_total{status="500"}[1m]) > 3` を 2 分連続で検出したら `ALERT modernized_db_secret_missing` を発火。 | `modernized_wildfly::db_pool`（新設）。`opendolphin_db_active_connections` / `opendolphin_db_available_connections` を 5 分平均で表示し、`max_used` をサブパネルで追跡。 | PagerDuty サービス `Modernized-WildFly` → エスカレーション `Ops L2 → Apps L3`。 | ログ: `artifacts/parity-manual/secrets/20251108T204806Z/missing_db_secret/server_logs.log`。HTTP 200 でも 500 カウンタが増加するため Micrometer ベースで検出。 |
| Factor2 AES Key 欠落 | `up{job="modernized-actuator"} == 0` を 30 秒継続、または `increase(opendolphin_auth_reject_total{path="/20/adm/factor2/.*"}[1m]) > 0` で `ALERT modernized_factor2_missing` を発火。 | `modernized_wildfly::factor2`。`up` と `opendolphin_auth_reject_total` を重ね、再起動後も 0 のままなら赤表示。 | PagerDuty サービス `Security-Integrations`（Ops L2 → SRE）。 | Compose 側の `${FACTOR2_AES_KEY_B64:-default}` が空文字をマスクしているため、`artifacts/parity-manual/secrets/20251108T204806Z/missing_factor2/` は「未再現」ログとして保存。デフォルト撤廃タスクを `SERVER_MODERNIZED_DEBUG_CHECKLIST.md:73` に追記。 |
- **2025-11-10 追記: compose 既定値バイパス準備と Docker ブロッカー**  
  - `tmp/secrets-repro/missing_factor2.env:23` と `tmp/secrets-repro/missing_sysad.env:9-10` に空白文字を挿入し、`${VAR:-default}` が空欄を上書きする問題を回避できるようにした。これにより FA2/SYSAD 系の欠落をブランクのまま WildFly へ伝播させる準備が整った。  
  - `scripts/start_wildfly_headless.sh --env-file tmp/secrets-repro/base.env down` で事前確認したが、WSL 側では `docker` / `docker-compose` が未導入のため `The command 'docker-compose' could not be found in this WSL 2 distro...` で停止。WildFly 起動ログ、`ops/tests/security/factor2/*.http`、Micrometer 採取は実施できていない。  
  - Docker Desktop を有効化済みの Mac 環境へ切り替えて 4 パターン（baseline / DB secret 欠落 / Factor2 欠落 / SYSAD 欠落）を再取得し、`artifacts/parity-manual/secrets/<新UTC>/` へ証跡を保存した後に Runbook / Checklist / `PHASE2_PROGRESS.md` を更新する。WSL 側の compose 設定は差分保持のみ行い、Docker 解消後に再試行する。
- 2025-11-08 再試行 (legacy + modernized 同時構成・成功ケース): `scripts/start_legacy_modernized.sh start --build` を用いて legacy/modernized/両 DB を同時起動し、`server-modernized` WAR に `WEB-INF/jboss-deployment-structure.xml`（`<module name="org.wildfly.micrometer.deployment"/>` を除外）を追加して Micrometer CDI 二重登録を解消。`PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-actuator.headers` を指定し、`ops/tools/send_parallel_request.sh --profile compose --loop 5 GET /dolphin observability_loop` を `PARITY_OUTPUT_DIR=artifacts/parity-manual/observability/20251108T074657Z-success/` で実行した。
  - `curl -i http://localhost:9080/actuator/{health,metrics,prometheus}` および `curl -i http://localhost:9995/metrics/application` を同ディレクトリへ保存し、`boot-errors` の `outcome=true` を確認。`README.md` には 404/503 証跡（`artifacts/parity-manual/observability/20251108T063106Z/`）との比較手順を追記。Grafana `Static Analysis / Request Metrics` のクエリ差分と `wildfly_undertow_request_count_total` の値を README／ログへ記録し、PagerDuty (`Server-Modernized-Ops`) の runbook ログ `docs/server-modernization/phase2/operations/logs/2025-11-08-pagerduty-observability.txt` を更新。
  - Evidence: `OBS-ACTUATOR-20251108-02`（成功ケース、比較対象: `OBS-ACTUATOR-20251108-01`）。`README.md` に差分確認方法と `wildfly_undertow_request_count_total` / `opendolphin_api_request_duration_sum` の増分を記載。
- 2025-11-08 本番反映 (Observability-本番反映担当): success 証跡をもとに `mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests` を再実行し、`jar tf server-modernized/target/opendolphin-server-2.7.1.war | grep WEB-INF/jboss-deployment-structure.xml` で Micrometer CDI 二重登録抑止モジュールが WAR に組み込まれていることを確認。`artifacts/parity-manual/observability/20251108T074657Z-success/` 配下に `actuator_health.log` / `actuator_metrics.log` / `actuator_prometheus.log` / `metrics_application.log` を添付し、本番 Grafana ダッシュボード（`Static Analysis / Request Metrics` UID: `req-metrics-prod`）と PagerDuty ルール `Server-Modernized-Ops` へ Evidence ID `OBS-ACTUATOR-20251108-02` を適用。適用日時・承認者・URL は `docs/server-modernization/phase2/operations/logs/2025-11-08-pagerduty-observability.txt` に記録し、Runbook（`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`）および Checklist フェーズ8備考は「本番反映完了／残課題なし」で更新済み。
- メトリクス/アラートメモ（2025-11-08 取得分）
  - `wildfly_undertow_request_count_total{server="default-server",http_listener="default"}`（counter）: 直近5分平均で 404 を含む総リクエスト数を算出。Grafana では `rate(...[5m])` を閾値 50req/s でトレンド化し、PagerDuty では `rate(error_count_total)/rate(request_count_total) > 0.05` が 5 分継続したら Critical。
  - `wildfly_request_controller_active_requests`（gauge）: 現在処理中のスレッド数。`> 64` が 3 分継続したら Warning、`> 96` で Critical。
  - `wildfly_datasources_pool_active_count{data_source="ORCADS"}` / `wildfly_datasources_pool_available_count`: プール枯渇を監視。`available_count < 5` が 2 分続いたら PagerDuty に通知し、Grafana では `wait_count` を重ねて原因を特定。
  - `wildfly_datasources_pool_wait_count{data_source="ORCADS"}`（counter）: 接続待ちが発生した回数。`increase(...[5m]) > 0` の時に Slack #server-modernized-alerts へ INFO 通知を投げる。
  - `wildfly_undertow_processing_time_total` / `wildfly_undertow_max_processing_time_seconds`: レイテンシ計測。`rate(processing_time_total[5m]) / rate(request_count_total[5m])` を P95 として Grafana 上に折れ線で表示し、500ms 超過が 10 分続いたら Warning。
  - `wildfly_datasources_jdbc_prepared_statement_cache_miss_count`（counter）: Miss が異常に増えた場合は `PreparedStatement` キャッシュが不足しているサイン。`increase(...[15m]) > 1000` で Low 優先度の PagerDuty ルールを作成。
  - 上記メトリクス/アラート設定は `artifacts/parity-manual/observability/20251108T063106Z/actuator_prometheus.log` を基準にし、Grafana パネルのサンプルと PagerDuty ルール ID を `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ8 備考で参照する。


## 2025-11-07 追記: TraceID-JMS ログ採取トライアル（担当: TraceID-JMS）
- 代表 API: `/serverinfo/version`, `/user/doctor1`, `/chart/WEB1001/summary` を `ops/tests/api-smoke-test/test_config.manual.csv` の `serverinfo` / `user_profile` / `chart_summary` ケースから選定し、`ops/tests/api-smoke-test/README.manual.md` 手順に従って `PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/legacy-default.headers` を利用する方針を確定。
- HTTP/JMS/セッションログは `artifacts/parity-manual/TRACEID_JMS/<legacy|modern>/` に `response.json` と `meta.json` を保存し、同じ ID で `artifacts/parity-manual/TRACEID_JMS/trace/<traceId>-{http|jms|session}.log` を並べて証跡化する計画。
- Modernized サーバーを `scripts/start_legacy_modernized.sh start --build`（内部で `docker compose` を利用）で起動し、`ops/tools/send_parallel_request.sh` で `BASE_URL_LEGACY`/`BASE_URL_MODERN` を `http://localhost:9080/openDolphin/resources` へ向ける段取りだったが、ローカル環境に Docker/Compose が存在せず `[ERROR] docker compose (v2) または docker-compose が見つかりません。` で停止。サーバー非起動のため API 呼び出し・ログ採取は未実施。
- 次アクション: ① Docker/Compose 付きのホストまたは既存モダナイズド環境へのアクセス許可を確保、② `scripts/start_legacy_modernized.sh` で modernized のみ起動（legacy 側は不要なら `--profile server-modernized-dev` のみで再構成）、③ `docker compose logs server-modernized-dev | rg traceId=<value>` と `docker compose logs server-modernized-dev | rg MessagingGateway` で HTTP/JMS ログを抽出し、`/opt/jboss/wildfly/standalone/log/server.log` を `docker cp` で取得、④ `SessionTraceManager` デバッグログを出すため `standalone-full.xml` の `org.slf4j.simpleLogger.log.open.dolphin.session.framework.SessionTraceManager=DEBUG` を一時設定する。

## 2026-06-15 追記: Nightly CPD サンドボックス実行証跡
- Codex サンドボックスから Jenkins へアクセスできないため、本番ジョブの代替として `mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis pmd:cpd -Dcpd.outputXML=true` をローカルで実行し、生成物を `ops/analytics/evidence/nightly-cpd/20240615/` へ集約した。`build-local-sandbox.log` に Maven ログを保存済み。
- `server-modernized/target/static-analysis/pmd/cpd.xml` → `ops/tools/cpd-metrics.sh`（CRLF 除去と絶対パス対応を追加）でメトリクスを抽出。`cpd-metrics.json` には `duplicate_lines=21837 / duplication_count=258 / file_count=175` を記録。
- Slack / PagerDuty / Grafana はネットワーク制限で実測不可のため、同ディレクトリにプレースホルダ (`slack_notify.txt`, `pagerduty_event.json`, `grafana_panel_screenshot.png`) と README を配置。Ops は Jenkins 本番ジョブ `Server-Modernized-Static-Analysis-Nightly` を起動し、取得した Permalink / Incident ID / ダッシュボードスクリーンショットで置き換えること。
- Grafana パネルは `ops/analytics/grafana/static_analysis_cpd_panels.json` を `Static Analysis` ダッシュボードへ適用後、BigQuery 側に 3 日分のダミーデータを投入してスクリーンショットを採取する。撮影ファイルは `ops/analytics/evidence/nightly-cpd/<yyyymmdd>/grafana_panel_screenshot.png` を差し替え。
- Jenkins 実行時は `server-modernized/target/static-analysis/pmd/cpd.xml`（`reporting` の outputDirectory 指定で配置）をアーティファクトへ保存し、`ops/tools/cpd-metrics.sh` に `REPO_ROOT` を指定して相対パス化すると BigQuery 取り込みでモジュール列が `server-modernized/...` になる。

## 2025-11-07 追記: REST-Exception-Review（担当: Worker Codex）
- 対象: `server-modernized/src/main/java/open/dolphin/rest/AbstractResource.java` と同ディレクトリ配下のすべての `*Resource` クラス（Appo/User/Patient/PVT/PVT2/Schedule/NLab/Mml/Karte/Letter/Stamp/System/ServerInfo/ChartEvent*/DemoResourceAsp ほか）、および `LogFilter`。
- 例外・HTTP ステータス現状
  - `AbstractResource` は JSON マッパー/日付変換のみ提供し、共通の例外ユーティリティや `Response` ビルダーを持たない。
  - `LogFilter`（server-modernized/src/main/java/open/dolphin/rest/LogFilter.java:70-105）は認証エラー時に 403 を即時返却し、アクセスログとして `remoteAddr shortUser method path traceId` を INFO で出力するが、レスポンスステータス/処理時間/エラーコードは記録されない。
  - `UserResource`（同 UserResource.java:36-80）をはじめ、`PatientResource`、`AppoResource`、`PVTResource(2)`、`ScheduleResource`、`NLabResource`、`MmlResource`、`ChartEventResource`、`KarteResource#sendDocument`（同 KarteResource.java:640-659）、`ServerInfoResource` などは、権限 NG や例外時にも 200 + `"0"`/`null`/空文字を返す。StackTrace を `System.err` に出すだけの箇所もあり、フロントエンドからは異常を検知できない。
  - HTTP 例外 (`BadRequestException`/`NotFoundException`/`NotAuthorizedException`) を投げているのは `SystemResource`, `StampResource`, `LetterResource`, `ChartEventStreamResource`, `DemoResourceAsp` の一部 API に限られ、メッセージはプレーンテキストで JSON 定型レスポンスは存在しない。
  - Touch 系 `DemoResourceAsp` は `WebApplicationException` を返すヘルパー `failure(...)` を持つが、`Response` エンティティは `text/plain` かつ `traceId` や `errorCode` を含まない。
  - 監査ログ (`AuditTrailService`) へ書き込むのは `SystemResource`・`LetterResource`・`StampResource` の限定的な操作のみで、患者情報・スタンプ削除以外の 4xx/5xx には追跡手段が無い。
- ログ出力仕様のギャップ
  - `Logger.getLogger("open.dolphin")` と `org.slf4j.Logger` が混在しており、フォーマットも自由記述。例: `UserResource` は WARNING ログのみ、`ServerInfoResource` は `printStackTrace` のみ。
  - `LogFilter` で `X-Trace-Id` ヘッダを付与しているものの、後段でレスポンス/エラーコードと結び付ける箇所が無いため、AP サーバーログから原因を逆引きできない。
  - Micrometer `RequestMetricsFilter` は `/metrics` 用のカウンタ値を記録するが、アプリのエラー応答テンプレートと連動していないため運用監査視点では参照しにくい。
- curl 検証結果
  - `docker compose -f docker-compose.modernized.dev.yml up -d` を試行したが、作業環境に Docker 実行環境がインストールされておらず `bash: docker: command not found` で失敗。
  - 代替として `mvn -f pom.server-modernized.xml -pl server-modernized -DskipTests wildfly:run` で WildFly 直接起動を試みたが、Galleon Feature Pack のパースエラー（`unexpected content: element ... feature-pack`）でサーバーをプロビジョニングできなかった。したがって `curl` での 400/401/500 実応答とログ差分確認は未実施。専用のモダナイズサーバーが利用できる CI/検証環境で再トライすること。
- 望ましいレスポンステンプレート案（JSON, UTF-8）
  ```json
  {
    "timestamp": "2025-11-07T12:57:14+09:00",
    "traceId": "<LogFilter で生成した UUID>",
    "requestId": "<X-Request-Id またはサーバー生成>",
    "status": 403,
    "error": "Forbidden",
    "code": "USER_ID_MISMATCH",
    "message": "ログインユーザーとリクエストされた userId が一致しません。",
    "path": "/openDolphin/resources/user/{userId}",
    "details": {
      "facilityId": "1.3.6.1.4.1.9414.10.1",
      "userId": "demo"
    }
  }
  ```
  - 4xx 系: バリデーションは 400（`code=INVALID_PARAMETER`）、認証ヘッダ欠落は 401、権限不一致は 403、リソースなしは 404、楽観ロックや業務制約違反は 409。
  - 5xx 系: 既存ビジネス例外を `ApiException`（`code`, `httpStatus`, `userMessage`, `detail`）にラップし、`ExceptionMapper<ApiException>`/`ExceptionMapper<Throwable>` で JSON を標準化する。スタックトレースはログにのみ記録し、レスポンスには含めない。
  - 成功時も `Location`/`X-Trace-Id`/`X-Request-Id` を統一ヘッダとして返却する（POST = 201, DELETE = 204等）。
- 望ましいログフィールド
  - 1行 JSON で `{"ts":"...","level":"ERROR","traceId":"...","requestId":"...","method":"PUT","path":"/karte/claim","status":500,"latencyMs":842,"facilityId":"...","userId":"...","clientIp":"...","userAgent":"...","errorCode":"PDF_SEND_FAILED","exception":"MessagingException","stacktraceRef":"logstash#20251107-1257-01"}` のようにキーを固定。
  - 収集必須フィールド: timestamp, level, traceId, requestId, sessionOperation (`SessionTraceManager`), facilityId, userId, httpMethod, path, status, latencyMs, clientIp, userAgent, requestBytes/responseBytes, errorCode, exceptionClass, message。任意フィールドとして patientId/karteId/letterId など業務キーを details に格納。
  - 実装案: `LogFilter` で `traceId` を MDC に入れつつ、`ContainerResponseFilter` を追加してレスポンス確定時に status/latency を MDC に載せ、`org.jboss.logmanager` の JSON Formatter か SLF4J+logstash-encoder へ統一する。
  - 監査ログ (`AuditTrailService`) は `traceId`/`requestId`/`status`/`reason` を必須キーとして、現状カバー外の CRUD（患者登録、スタンプ更新、スケジュール削除、PVT受付）にもフックを追加。
- フォローアップタスク
  1. `ApiProblem` DTO と `@Provider` `GlobalExceptionMapper` を作成し、`UserResource` 等の `return "0"`/`null` をすべて `throw` に置き換える。
  2. `LogFilter` を `OncePerRequestFilter` 化し、`Stopwatch` で処理時間を測定して INFO/ERROR の構造化ログを出力。レスポンスヘッダ `X-Trace-Id`/`X-Request-Id` を常に付加。
  3. `DemoResourceAsp.failure(...)` を JSON エンティティへ置き換え、Touch クライアントともフォーマットを合わせる。
  4. 再度 `docker compose` での検証が可能になった時点で、下記 3 ケースを自動化:  
     - `curl -H 'userName: demo' ... /dolphin/activity/''` → 400 （バリデーション）  
     - `curl /user/{notSelf}`（ヘッダ mismatch）→ 403  
     - `curl -X PUT /karte/claim`（無効 JSON）→ 500  
     それぞれ `server-modernized/standalone/log/server.log` の対応ログとレスポンスボディを照合し、本ノートに Evidence を追記する。

## 1. Nightly CPD ジョブ運用
- Jenkins パイプライン `ci/jenkins/nightly-cpd.groovy` を `Server-Modernized-Static-Analysis-Nightly` として登録し、`cron('H 3 * * *')` で毎日 03:00 JST に起動する。
- 実行前提:
  - Jenkins ノード `maven-jdk17` に JDK 17 / Maven 3.9 / `spotbugs:spotbugs` 用キャッシュを準備。
  - Secrets: `slack-static-analysis-webhook`, `pagerduty-static-analysis-routing-key`（いずれも Global credentials / Secret text）。登録状況は毎月 `Manage Jenkins > Credentials` で棚卸しし、監査ログへ記録。
  - `docs/web-client/operations/TEST_SERVER_DEPLOY.md` の手順で用意した WildFly + PostgreSQL リファレンス環境で `server-modernized` WAR のビルドが緑であることを事前確認（`mvn -f pom.server-modernized.xml clean package -DskipTests`）。
- 実行手順（初回セットアップ時）:
  1. ジョブタイプ: Pipeline → 「Pipeline script from SCM」→ SCM: Git（本リポジトリ）。Script Path: `ci/jenkins/nightly-cpd.groovy`。
  2. 「Build Triggers」で `H 3 * * *` を設定。`Build Discarder` は 30 日保持。
  3. 「Bindings」で Slack/PagerDuty 資格情報を紐付け、`withCredentials` で参照できることを確認。
  4. `Build with Parameters` で手動実行し、`Console Output` と `server-modernized/target/site/cpd.{xml,html}`、`cpd-metrics.json` が生成されることを確認。
- 証跡保存:
  - `ops/analytics/evidence/nightly-cpd/<YYYYMMDD>/` を作成し、`build-<number>.log`, `cpd-metrics.json`, `slack_notify.txt`, `pagerduty_event.json`, `grafana_panel_screenshot.png` を格納。
  - Slack / PagerDuty の Permalink / インシデント ID は `PHASE2_PROGRESS.md` にも記録。

## 2. Slack / PagerDuty 連携
- Slack:
  - チャンネル: `#dev-quality`。Webhook ID: `slack-static-analysis-webhook`。
  - テンプレートはパイプライン `Notify` ステージのフォーマットを利用し、成功時は `duplicate_lines`/`file_count` サマリ、失敗時は `直前に取得できたメトリクス` を含める。
  - 疎通確認は Jenkins `Replay` → `error 'notification verification'` で失敗を発生させ、Slack Permalink を `ops/analytics/evidence/nightly-cpd/<YYYYMMDD>/slack_notify.txt` に保存。
- PagerDuty:
  - サービス: `server-modernized-static-analysis`。Routing key は `pagerduty-static-analysis-routing-key`。
  - イベント: 失敗時のみ `trigger`。`custom_details` に `duplicate_lines` / `duplicated_file_count` / `git_branch` / `git_commit` を含め、`links` へ Jenkins Build URL を付与。
  - 疎通確認は Slack と同じ失敗ビルドで実施し、PagerDuty インシデント ID・エスカレーション結果を `PHASE2_PROGRESS.md` に記載。

## 3. BigQuery / Grafana 取り込み
- CPD メトリクス抽出: `ops/tools/cpd-metrics.sh --cpd-xml server-modernized/target/site/cpd.xml --output cpd-metrics.json --job-name Server-Modernized-Static-Analysis-Nightly ...`。
- BigQuery:
  - 取り込みテーブル: `static_analysis.duplicate_code_staging`（JSON ロード）。
  - 本番テーブル反映: `ops/analytics/bigquery/static_analysis_duplicate_code_daily.sql` を `bq query --use_legacy_sql=false` で実行。
- Grafana:
  - データソース: `grafana-bigquery-datasource`（UID: `${DS_BIGQUERY_STATIC_ANALYSIS}`）。
  - パネル JSON: `ops/analytics/grafana/static_analysis_cpd_panels.json`。`CPD Duplicate Lines (Daily)` / `CPD Top Modules` を `Static Analysis` ダッシュボードに追加し、`job_name` 変数は `Server-Modernized-Static-Analysis-Nightly` 固定。
  - 初回は BigQuery に 3 日分のダミーデータを投入してレンダリングを確認し、スクリーンショットを証跡として保存。

## 4. 監視・Micrometer との連携
- CPD アラート後の調査で参照するログ / メトリクス:
  - `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` と `docs/server-modernization/phase2/operations/WILDFLY33_MICROMETER_OPERATIONS_GAP.md` に従い、Micrometer → Prometheus → Grafana の経路を確認。
  - `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` のネットワーク・Secrets セクションで JMS/ORCA 等の接続値を照合。
- Trace ID の取り扱い:
  - `RequestMetricsFilter` が `traceId` を MDC に設定、`SessionTraceManager` が監査ログへ自動反映する。CPD 関連の Slack/PagerDuty 通知には `traceId` は含まれないため、`ops/tests/api-smoke-test` の `/serverinfo/*` ケースを再実行し、`server-modernized` ログと `d_audit_event` を突合する。

## 5. フォローアップと残課題
- Ops チームは Nightly CPD を 3 連続成功させ、Slack/PagerDuty Permalink と Grafana パネル更新を本ノートへ追記する（完了後に更新日を差し替える）。
- Jenkins / GitHub Actions でネットワーク制約により CPD 実行が失敗する場合は、`docs/web-client/operations/TEST_SERVER_DEPLOY.md` のローカル Docker 手順で代替環境を立ち上げ、`mvn -f pom.server-modernized.xml -Pstatic-analysis pmd:cpd` をローカル保存して Evidence に添付する。


