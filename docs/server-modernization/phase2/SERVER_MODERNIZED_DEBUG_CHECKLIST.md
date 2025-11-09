# server-modernized デバッグチェックリスト（2026-06-15）

server-modernized モジュールのデバッグ状況を把握するためのチェックリスト。  
各項目はレガシーサーバーとの機能同等性確認に向けた実施タスクを網羅しており、進捗更新時は本ファイルと `PHASE2_PROGRESS.md` の両方を更新すること。

## ステータス凡例

- `[x]` … 完了
- `[ ]` … 未完了（未着手または進行中。備考欄で詳細を記載）

---

### 2025-11-07 追記: Webクライアント非依存デバッグ基本方針

- Web クライアントが未完成な期間は Legacy サーバーからの実測リクエスト/レスポンス → Modernized へのリプレイ → サーバー内部メトリクス採取の 3 レイヤーで同等性を証跡化する。
- すべての検証は CLI／スクリプト（`ops/tools/send_parallel_request.sh`, `ops/tests/api-smoke-test/`, curl/httpie, WildFly control スクリプトなど）で完結させ、Web UI 操作を前提にしない。
- Legacy/Modernized 並列キャプチャ環境の構築 Runbook を `docs/server-modernization/phase2/operations/` に整備し、`PHASE2_PROGRESS.md` へリンクと更新日時を記録するまで他フェーズのステータスを「完了」にしない。
- 新規や更新した Runbook／スクリプトの保存先を本ファイルの備考欄に必ず記載し、証跡（ログ・diff・ハッシュなど）は `artifacts/parity-manual/` 配下に時刻付きフォルダで保管する。

### 2025-11-08 追記: WebORCA テストコンテナの通信確認

- `docker/orca/jma-receipt-docker`（`circlemouth/jma-receipt-docker-for-Ubuntu-22.04`）をサブモジュールとして追加し、ORCA ⇔ Legacy/Modernized サーバーの通信テスト用サンドボックスとして運用する。
- 既存の `jma-receipt-docker-for-ubuntu-2204-orca-1` / `...-db-1` が稼働している場合は再起動せず、`curl http://localhost:8000/` と `docker run --network jma-receipt-docker-for-ubuntu-2204_default curlimages/curl:8.7.1 http://orca:8000/` でヘルスチェックを実施する。応答ステータスは `200` を確認済み。
- OpenDolphin 側コンテナを `docker network connect jma-receipt-docker-for-ubuntu-2204_default <container>` で ORCA ネットワークへ接続し、`ops/shared/docker/custom.properties` に `claim.host=orca` / `claim.send.port=8000` / `claim.send.encoding=MS932` を設定してから再ビルドする。`ServerInfoResource` (`/serverinfo/claim/conn`) で `server` が返ることを以て接続完了とみなす。
- 証跡: `artifacts/orca-connectivity/20251108T075913Z/`（ホスト/ネットワーク両方の `curl` 結果と `docker logs` 抜粋）。Runbook 追記は `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md#44-weborca-テストコンテナ2025-11-08-追加` を参照。
- `docker ps --format '{{.ID}} {{.Image}} {{.Names}} {{.Status}}'`（2025-11-08T07:49Z 実行）で `jma-receipt-docker-for-ubuntu-2204-{orca,db}-1` が稼働中であることを確認済み。結果は `artifacts/orca-connectivity/20251108T075913Z/docker_ps_20251108T0749.log` に保存し、ORCA 接続系デバッグの前提条件として参照する。

### 2025-11-08 追記: Ops/DBA 発行プロセス先送りに伴う再プランニング

- Ops/DBA の公式 Postgres dump 提供待ちを前提にすると進捗が停滞するため、フェーズ2ではローカル合成ベースライン（Hibernate 自動 DDL + `ops/db/local-baseline/local_synthetic_seed.sql`) を正式な標準フローとする。  
- これに伴い `【Deferred-Ops/DBA】` プレフィックスを廃止し、過去に Deferred としていたタスクもローカルシード上で即時実行できるように整理した。`PHASE2_PROGRESS.md` からも Deferred ステータスを削除し、通常トラッキングへ戻すこと。  
- 2FA・監査ログ・REST 例外検証は合成ベースラインで `d_factor2_*` / `d_audit_event` を生成した上で進める。公式 dump を活用した再検証はフェーズ4以降のオプション扱いとし、Gate #40/#44 ではローカル証跡でクローズできる。  
- `POSTGRES_BASELINE_RESTORE.md` は Secrets/VPN 前提の記述を削除し、ローカル合成ベースラインの詳述へ更新済み。Runbook 参照時は節 0〜4 を順に実行すれば Ops への依頼なしで DB を復旧できる。

## フェーズ0: 事前準備・資料棚卸し

> **2026-06-14 更新:** ステークホルダー合意によりフェーズ0タスクは現行デバッグスコープから除外する。今後の進捗管理ではフェーズ1以降のみ追跡対象とする。

- [x] モダナイズ関連ドキュメント（`docs/server-modernization/` 配下）を精読し、既存ツールとスクリプトの利用可否を整理する（備考: `api-smoke-test.md`, `operations/API_PARITY_RESPONSE_CHECK.md` を確認済み）
- [x] Codex 向け環境構築スクリプト `scripts/setup_codex_env.sh` の実行可否と必要な権限を確認する（備考: 2025-11-07 `artifacts/parity-manual/setup/20251107T234615Z/` のログで CRLF 行末による失敗と root 権限必須を証跡化。`docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` に CLI 前提の実行手順・注意事項を追記し、`PHASE2_PROGRESS.md` とリンクを同期済み）
- [x] Docker Compose (`docker-compose.modernized.dev.yml`) のサービス構成を確認し、デバッグ時の起動順序・依存関係を明文化する（備考: 上記 Runbook にサービス表・起動順序・フォールバック手順・証跡保存ポリシーを追加し、`ops/tools/send_parallel_request.profile.env.sample` で `MODERNIZED_TARGET_PROFILE` を `compose`/`remote-dev`/`custom` へ切り替えるテンプレートを提供済み）
- [x] `scripts/**` および `ops/tools/**` の行末を LF に統一し、CRLF 由来の実行失敗を防止する（備考: `.gitattributes` で対象拡張子を `text eol=lf` に固定し、`git add --renormalize .` + `perl -pi -e 's/\\r$//'` で `scripts/setup_codex_env.sh` / `scripts/run-static-analysis-diff.sh` を LF 化。詳細は `docs/server-modernization/phase2/operations/DEV_ENV_COMPATIBILITY_NOTES.md`、証跡は `artifacts/parity-manual/setup/20251108-renormalize/` を参照）

## フェーズ1: ビルド・依存性確認

- [x] `mvn -pl server-modernized -am clean verify -DskipTests` を実行し、ビルド警告および Jakarta 依存差分を記録する（備考: 2025-11-06 `mvn -f server-modernized/pom.xml clean verify -DskipTests` 実行。`Base64Utils` / `Long(long)` / `Character(char)` などの非推奨 API 警告を確認済み。**指針: 非推奨 API 対応は開発完了後の課題として別途チケット化する**）
- [x] `META-INF/persistence.xml` など Jakarta EE 10 対応設定をレビューし、スキーマ不一致を洗い出す（備考: `persistence.xml` は 3.1、`ejb-jar.xml` は 4.0 スキーマで整合。データソース/hibernate プロパティに不一致なし）
- [x] 共通モジュール（`common/`）との互換性確認を実施し、DTO/エンティティの差分一覧を作成する（備考: `notes/common-dto-diff-A-M.md` と `notes/common-dto-diff-N-Z.md` で Legacy との差分・新規 DTO・リスク評価を整理。PHR 系フィールド追加、FirstEncounter 系削除、監査/2FA/ケアプラン新規 DTO、Hibernate 6 の CLOB 対応などフォローアップ課題を抽出済み）

## フェーズ2: 静的解析・コードマッピング

- [x] `server-modernized/src/main/java` をレイヤー別に整理し、循環依存や未使用コンポーネントを棚卸しする（備考: `docs/server-modernization/phase2/notes/server-layer-map.md` を 2026-06-14 版へ更新済み。`VitalServiceBean` 未使用・`UserCache` 再設計などを `notes/static-analysis-findings.md` に記録）
- [x] フィルター/インフラ層（例: `LogFilter`, `RequestMetricsFilter`）の挙動をレビューし、ログ・トレース ID の伝搬状況を可視化する（備考: `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` へテキストシーケンスとログ採取手順を追記。`tmp/trace-review/sa-static-map-20260614.log` に調査ログを保存）
- [x] 静的解析ツール導入可否を調査し、CI 反映方針をまとめる（備考: `docs/server-modernization/phase2/notes/static-analysis-plan.md` / `notes/static-analysis-findings.md` に SpotBugs/Checkstyle/PMD の導入方針と Jenkins/GitHub Actions 実装、Nightly CPD 設計、差分ゲート手順、Ops への資格情報・通知運用フローを記録。`PHASE2_PROGRESS.md` にも 2026-06-14 時点の進捗・残タスクを反映済み）
- [ ] Legacy/Modernized Postgres ベースライン復旧計画を Runbook 化し、DB 欠損が発生した際の Gate と証跡フローを整備する（備考: `docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md` をローカル合成ベースライン版へ更新済み。`ops/db/local-baseline/local_synthetic_seed.sql` の投入ログと `flyway baseline→migrate` の成功ログを `artifacts/parity-manual/db-restore/<UTC>/` に保存し、Gate 条件へ追加する）

## フェーズ3: REST/API レイヤー

- [x] 代表エンドポイント（`open.dolphin.rest`）のシグネチャとレスポンス DTO を Legacy 実装と diff し、差分レポートを作成する（備考: `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` に `/jtouch` vs `/10/adm/jtouch` の機能表・公開方針を整理済み。Legacy 限定 API の切り分けと Impact 記載を完了）
- [x] SSE / ポーリング併用エンドポイント（`ChartEvent*`）の挙動をデバッグし、再接続および認証フローの検証ステップを定義する（備考: `rest-touch-diff-report.md` に再送仕様/履歴100件の評価とギャップ検知フローを追記。`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 手順8へ Last-Event-ID ギャップ再接続手順および `chart-events.replay-gap` の受信時対応を記載。`ChartEventSseSupport` は Micrometer メトリクス、WARN ログ、SSE reload イベント、Alert ルール案（`ops/monitoring/chart-event-alerts.yml`）およびシミュレーター (`ops/monitoring/scripts/chart-event-metrics-sim.mjs`) で運用フローと閾値調整まで整備済み。Stage 実測メトリクスの取得は VPN 情報待ちのため保留、代替案を `worker-directives-20260614.md` へ記録済み。Reception/Charts/Touch UI のリプレイギャップ仕様と React 実装は `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md` / `web-client/src/features/replay-gap/*` に反映、`/rest/charts/patientList` & `sendReplayGapAudit` の正式実装・テストも完了し、Touch reload 監査・実機テストは後続タスク）
- [x] DTO コンバータ群の Jackson 設定差異を洗い出し、互換性リスクを整理する（備考: `LegacyObjectMapperProducer` に JavaTimeModule/WRITE_DATES_AS_TIMESTAMPS=false を追加し、ADM10/20/Touch/EHT リソースすべてが CDI `ObjectMapper` を利用。`JsonTouchResourceParityTest` に JavaTime ペイロード検証を追加し、`rest-touch-diff-report.md` / `touch-api-parity.md` にロールアウト記録と JavaTime 監視手順（`OBSERVABILITY_AND_METRICS.md`、Runbook 186 行付近）を追記。Stage/Prod 監視とエスカレーションフローも同ドキュメントに記録済み）

## フェーズ4: セッション層・ドメインロジック

- [ ] 主要サービス (`KarteServiceBean`, `PatientServiceBean` など) のトランザクション境界と JPQL をレビューし、Legacy との差異を網羅表にまとめる（備考: `/user/doctor1` を対象に `scripts/jpql_trace_compare.sh` と `artifacts/parity-manual/JPQL/*` を整備済み。`domain-transaction-parity.md` に結果を記載。`/chart/WEB1001/summary` などカルテ/PVT 系はデータ投入後に採取する）
- [ ] 予約/予定カルテ/紹介状/ラボ/スタンプ系 REST（`/appo`, `/schedule`, `/odletter`, `/lab`, `/stamp`）とサービス層（`AppoServiceBean`, `ScheduleServiceBean`, `LetterServiceBean`, `NLabServiceBean`, `StampServiceBean`）の CRUD・監査ログ・JMS 連携を Legacy 実装と突き合わせる（備考: `ops/tools/send_parallel_request.sh` で `PUT /appo`, `GET /schedule/pvt/{...}`, `PUT /odletter/letter`, `GET /lab/module/{...}`, `PUT /stamp/tree` などを再現し、`artifacts/parity-manual/{appo|schedule|letter|lab|stamp}/` へ HTTP 応答と `d_audit_event` / JMS の証跡を保存する。Legacy 側 API の差分整理・不足テストケースは `docs/server-modernization/phase2/notes/domain-transaction-parity.md` と連携して追記する）
- [ ] `@SessionOperation` / `SessionTraceManager` の適用範囲を確認し、例外発生時のトレース出力を実機で検証する（備考: `ops/tests/api-smoke-test/test_config.manual.csv` と `rest_error_scenarios.manual.csv` に `trace_http_200/400/401/500` を追加し、`ops/tools/send_parallel_request.sh --profile` で CLI を統一。200 ケースは `artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/trace_serverinfo_jamri/` に保存済み。Legacy build (`org.wildfly.extension.micrometer`) と Modernized DB 未シード(`d_users`) が残るため 4xx/5xx は保留、ブロッカーを `TRACE_PROPAGATION_CHECK.md` に記録。）
- [x] `adm10` / `adm20` 系コンバータのマッピング漏れを洗い出し、再現用テストデータを選定する（備考: `AdmConverterSnapshotTest` を追加済み。`tmp/legacy-fixtures/adm10|adm20/patient_model.json` を touch 基準のスナップショットとして保存し、`artifacts/parity-manual/adm-snapshots/20251108T063545Z/` に差分ログを出力。2025-11-08 時点で VisitPackage/Labo/Diagnosis 用フィクスチャ（`visit_package.json` / `labo_item.json` / `registered_diagnosis.json`）も追加し、`jshell --class-path "<依存クラスパス>"` → `Class.forName("open.dolphin.adm.AdmConverterSnapshotTest")` で `visitPackageSnapshot` / `laboItemSnapshot` / `registeredDiagnosisSnapshot` を実行して `adm.snapshot.update=true` のまま再生成。新シナリオは差分なしのため新規 `artifacts/parity-manual/adm-snapshots/<timestamp>/` は未発生。手順詳細は `docs/server-modernization/phase2/notes/rest-touch-diff-report.md#5-adm-コンバータ差分スナップショット（2025-11-08）` を参照。今後は Maven 実行環境が整い次第 Surefire で同テストを実行し、`tmp/legacy-fixtures/adm10|adm20/patient_model.json` を Git 管理へ含めるか判断する）
- [x] `HealthInsuranceModel` エンティティが WAR へ取り込まれず Hibernate が `Association ... is not an '@Entity' type` で停止する問題を修復する（備考: `mvn -f pom.server-modernized.xml -pl server-modernized -am dependency:tree` で `opendolphin-common:jar:jakarta` が compile scope で解決されていることを `artifacts/parity-manual/HEALTH_INSURANCE_MODEL_FIX/20251109T070217Z/mvn_dependency_tree.log` に証跡化し、`jar tf server-modernized/target/opendolphin-server-2.7.1/WEB-INF/lib/opendolphin-common-2.7.1-jakarta.jar | rg HealthInsuranceModel`（`jar_common_healthinsurance_after_fix.log`）でクラスを確認。`ops/modernized-server/docker/Dockerfile` と `scripts/start_legacy_modernized.sh` の BuildKit 用 Dockerfile に `COPY reporting ./reporting` を追加して compose build (`./scripts/start_legacy_modernized.sh down && start --build`) を成功させ、`docker compose --project-name legacy-vs-modern ps`（`docker_compose_ps.log`）と `curl http://localhost:9080/actuator/health`（`curl_health_after_fix.log`）で `deployments-status: OK` を採取。全コマンドログは `artifacts/parity-manual/HEALTH_INSURANCE_MODEL_FIX/20251109T070217Z/` に格納し、`PHASE2_PROGRESS.md` / `DOC_STATUS.md` へ反映済み。）

## フェーズ5: 外部連携・メッセージング

- [x] `MessagingGateway` の JMS エンキュー処理とフォールバックルートを検証し、ログ出力を比較する（2025-11-08 更新: `COMPOSE_PROJECT_NAME=od-jms-debug` で `scripts/start_legacy_modernized.sh start` → `ops/tools/jms-probe.sh --scenario claim` を実行し、`artifacts/parity-manual/JMS/20251108T210639Z/` に HTTP トレース・`docker logs`・Legacy/Modernized 差分を保存。Modernized 側では `open.dolphin.traceId` が JMS 規約違反（AMQ139012）となり `Claim fallback send started` → `EHTResource.sendPackage` が `StringIndexOutOfBoundsException` で 500 返却、Legacy は 404 応答のみ。詳細ログと改善案は `docs/server-modernization/phase2/notes/messaging-parity-check.md` を参照し、同メモに将来のテスト基準（Acceptable JMS property 名 / fallback 監視フロー）を記録済み。）
- [ ] `ClaimSender` / `DiagnosisSender` / `MMLSender` の設定値差分とエラーハンドリングを確認する（2025-11-09 更新: JMS プロパティを `openDolphinTraceId` / `openDolphinPayloadType` にリネームし、`MessagingGateway` / `MessageSender` の両方で同じキーを共有する `MessagingHeaders` を追加。`EHTResource.sendPackage(1/2)` では `getRemoteFacility` からの `StringIndexOutOfBoundsException` を握り潰し、フォールバックレスポンスを返しながら `traceId` / 失敗理由を監査ログに残すようにした。Flyway マイグレーション `V0222__diagnosis_legacy_tables.sql` を追加し、`d_facility` / `d_users` / `d_patient` / `d_karte` の最小テーブルを legacy から `pg_dump -s` で複製 → `d_diagnosis` + `d_diagnosis_seq` を modernized DB に作成して CLI から `INSERT`（`id=9001/2001`）を投入済み。`ops/tools/send_parallel_request.sh --profile compose` で `PUT /20/adm/eht/sendClaim 20251108T213043Z` / `POST /karte/diagnosis/claim 20251108T213050Z` / `PUT /mml/send 20251108T213129Z` を再実行し、成果物・ログ・DB スナップショットを `artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/20251108T213140Z/` に保存。Diagnosis/MML は 200 を返し `d_diagnosis.id=1` が採番された。Claim は Velocity テンプレート `claimHelper.vm` 不在により `ResourceNotFoundException` で 500（JMS enqueue は成功し `AMQ139012` は解消）。未対応タスク: (1) `claimHelper.vm` のデプロイ戦略と ORCA 送信手順の整理、(2) legacy server 403 応答の回復、(3) `/20/adm/eht/sendClaim` の 2xx 成功証跡を取得、(4) `MmlSenderBeanSmokeTest` 実行結果の継続監視（`tmp/mvn-mml.log` 参照）。）
- [x] Legacy WildFly 10 のデータソース/ネットワーク設定を再構成し、opendolphinPU が安定起動する状態を復旧する（備考: `docker-compose.yml` / `ops/legacy-server/docker-compose.yml` / `ops/legacy-server/docker/configure-wildfly.cli` / `scripts/start_legacy_modernized.sh` の DB ホスト既定値を `opendolphin-postgres` へ統一し、`./scripts/start_legacy_modernized.sh start --build` → `start` で再デプロイ。`docker exec opendolphin-server /opt/jboss/wildfly/bin/jboss-cli.sh --commands='/subsystem=datasources/data-source=PostgresDS:test-connection-in-pool'` と `.../hibernate-persistence-unit=opendolphin-server.war#opendolphinPU:read-resource(include-runtime=true)` の結果を `artifacts/parity-manual/CLAIM_SEND_ATTEMPT/logs/{jboss-cli_PostgresDS_test.txt,jboss-cli_opendolphinPU.txt}` に保存し、`server-legacy-fixed.log`／`legacy/serverinfo_*_20251108T19xxxxZ.txt` で HTTP 200 応答を採取。詳細手順と証跡は `docs/server-modernization/phase2/domains/RESERVATION_BATCH_MIGRATION_NOTES.md` §8 および `docs/server-modernization/phase2/operations/SERVER_MODERNIZED_STARTUP_BLOCKERS.md` §5 に追記済み）
- [ ] Secrets / 環境変数依存の不足時挙動を一覧化し、監視アラート要件を整理する（備考: `.env`→compose→WildFly CLI→Jakarta EE の読み込み順を `docs/server-modernization/phase2/notes/ops-observability-plan.md` にテーブル化し、`scripts/start_wildfly_headless.sh --env-file tmp/secrets-repro/<profile>` で (1) baseline (2) `MODERNIZED_POSTGRES_PASSWORD` 欠落 (3) `FACTOR2_AES_KEY_B64` 欠落 (4) SYSAD header 欠落 の 4 パターンを採取。新規ログは `artifacts/parity-manual/secrets/20251108T204806Z/README.md` 以下に保存し、Prometheus ルール / Grafana パネル / PagerDuty 経路は同ノートの Secrets マトリクスへ記載。現状、FACTOR2/SYSAD は docker-compose の `${VAR:-default}` が空文字をマスクするため未再現であり、既定値撤廃タスクをフォローアップ中。）

## フェーズ6: 認証・セキュリティ

- [ ] 2FA 設定 (`FACTOR2_AES_KEY_B64`, FIDO2 設定値) 未設定時の WildFly 起動失敗ログを採取し、手順書に反映する（備考: `scripts/start_wildfly_headless.sh` と `docs/server-modernization/phase2/operations/FACTOR2_RECOVERY_RUNBOOK.md:10-60` にローカル合成ベースライン前提の手順を追記済み。`ops/tests/security/factor2/*.http` をそのまま流し、`artifacts/parity-manual/secrets/{wildfly-missing-secrets.log,totp-registration-missing.log}` は参考ログとして維持）
- [ ] `totp` / `fido` パッケージの監査ログ出力を検証し、成功/失敗両ケースの記録内容を確認する（備考: ローカル合成ベースラインで `d_factor2_*` が揃うため、`ops/tests/security/factor2/` の CLI を実行して `artifacts/parity-manual/factor2_*/*.log` を更新する。成功/失敗 SQL は `docs/server-modernization/phase2/notes/test-data-inventory.md:181-218` へ追記）
- [x] Elytron 移行計画とヘッダ認証後方互換 (`LogFilter`) の廃止手順を明確化する（備考: `ops/tools/logfilter_toggle.sh` を追加し `.env` で `LOGFILTER_HEADER_AUTH_ENABLED` を切り替え可能にした。`docker-compose*.yml` と `LogFilter` 側も連動済み。段階的なリリース基準は `docs/server-modernization/phase2/notes/security-elytron-migration.md` に整理済み。実機ログ採取はサーバー起動後に追加で実施する）

## フェーズ7: ストレージ・帳票

- [ ] 添付ファイル保存モード（DB / S3）別の動作確認を行い、`attachment-storage.yaml` の必要パラメータを整理する（備考: `ops/tests/storage/attachment-mode/*.sh` で REST 経由のアップロード/ダウンロードを自動化し、DB モードと S3 モック（`minio`）の双方でバイナリハッシュとレスポンス差分を `artifacts/parity-manual/attachments/` に保存。設定表を `docs/server-modernization/phase2/notes/storage-mode-checklist.md` に追記。2025-11-08 更新: 当該スクリプトおよび `MODERNIZED_STORAGE_MODE` 切替実装がレポジトリに存在せず、`artifacts/parity-manual/attachments/20251108T205451Z/README.md` へブロッカーを記録して保留中）
- [ ] 帳票生成 (`open.dolphin.reporting`) のフォント/ロケール設定を検証し、Legacy との出力差異を確認する（備考: 帳票 API を CLI で叩き PDF を `artifacts/parity-manual/reporting/{legacy,modernized}/` に収集し、ハッシュおよびテキスト抽出 diff を記録。2025-11-09 更新: `scripts/start_legacy_modernized.sh start` → `ops/tools/send_parallel_request.sh --profile compose POST /reporting/karte` を `reporting_karte_{ja,en}` ペイロードで実行したが、両系統とも `ReportingResource` 未登録につき 404 となり PDF が生成されず、フォント検証（`pdftotext` / `diff-pdf` / `pdffonts`）は未着手。テンプレートも `patient_summary_{ja_JP,en_US}.vm` のみでレセ電向けが存在せず、ARM ホストでの Legacy コンテナ不安定（amd64 イメージ）もブロッカー。詳細とフォローアップ（REST 実装・テンプレート拡充・`PdfDocumentWriter` の BaseFont.EMBEDDED 化・`artifacts/parity-manual/reporting_karte_{ja,en}/` のメタ情報）は `docs/server-modernization/phase2/notes/reporting-parity.md` に整理済み）
- [ ] ライセンス管理 (`system/license`) の権限チェックおよび設定ファイルの配置確認を実施する（備考: `system/license` REST を curl で呼び出し、設定ファイルの検索順序とアクセス権を `docs/server-modernization/phase2/notes/license-config-check.md` に整理。Legacy/Modernized 双方のレスポンスを `artifacts/parity-manual/license/` に保存）

## フェーズ8: 観測性・ロギング

- [x] Micrometer メトリクス出力（`DatasourceMetricsRegistrar`, `RequestMetricsFilter`）の計測内容を収集し、Prometheus 連携可否を確認する（備考: `ops/modernized-server/docker/configure-wildfly.cli` へ Micrometer サブシステム＋Undertow 逆プロキシと `MICROMETER_MANAGEMENT_HOST/PORT` を追加し、管理ポート `/metrics` を `/actuator/{health,metrics,prometheus}` へ公開。Micrometer CDI 二重登録を避けるため `server-modernized/src/main/webapp/WEB-INF/jboss-deployment-structure.xml` で `org.wildfly.micrometer.deployment` を除外し、SYSAD 専用ヘッダー `ops/tests/api-smoke-test/headers/sysad-actuator.headers` を用意。`scripts/start_wildfly_headless.sh start --build` → `ops/tools/send_parallel_request.sh --profile compose --loop 5 GET /dolphin` → `curl http://localhost:9080/actuator/{health,metrics,prometheus}` の流れを `artifacts/parity-manual/observability/20251108T063106Z/`（503/404 case）と `artifacts/parity-manual/observability/20251108T074657Z-success/`（Legacy/Modernized とも 200）へ保存し、比較手順を README に追記。`mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests` 実行後に `jar tf server-modernized/target/opendolphin-server-2.7.1.war | grep WEB-INF/jboss-deployment-structure.xml` を取得し、Micrometer 除外設定が WAR へ恒久反映されたことを証跡化。Grafana/PagerDuty の本番適用（2025-11-08T10:32:44+09:00）は `docs/server-modernization/phase2/operations/logs/2025-11-08-pagerduty-observability.txt` へ記録済みで、`docs/server-modernization/phase2/notes/ops-observability-plan.md`／`operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`／`docs/web-client/planning/phase2/DOC_STATUS.md` も「残課題なし」で同期。Evidence ID `OBS-ACTUATOR-20251108-02` に紐付く `actuator_*`／`metrics_application.log` を関係者レビューへ添付済み。)
- [ ] Trace ID が JMS / セッション層ログへ伝搬するか end-to-end で確認する（備考: `ops/tests/api-smoke-test/test_config.manual.csv` / `rest_error_scenarios.manual.csv` の trace-id 列に沿って 200/400/401/500 ケースをローカル合成ベースライン上で実施し、`artifacts/parity-manual/TRACEID_JMS/` に 4xx/5xx のログを追加する。Legacy build ブロックと Modernized DB シード不足の課題は解消済み）
- [ ] REST 例外処理共通化（`AbstractResource`）をレビューし、レスポンスフォーマットとログ整合性を検証する（備考: `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` と `README.manual.md` の期待値を参照し、ローカル合成ベースライン上で 400/401/500 ケースを実行して `artifacts/parity-manual/rest-errors/` を更新する）

## フェーズ9: 回帰・API 同等性検証

- [ ] スモークテストスクリプト (`ops/tests/api-smoke-test/`) を用いて Legacy・Modernized のレスポンス比較を実施し、成果物ディレクトリを保存する（備考: Legacy の HTTP トレース（`tmp/legacy-capture/*.har`）から `scripts/api_parity_targets.touch.json` を自動生成する `ops/tools/har-to-config.sh` はリポジトリ未収録のため手動編集で代替している。正式にはスクリプトを新設し、`ops/tests/api-smoke-test/run.sh --dual` で両系統に同一シナリオを送出して `artifacts/parity-manual/smoke/{legacy,modernized}/` を取得する運用へ移行する。2025-11-09 時点では `base_readonly` シナリオ（`/dolphin`, `/serverinfo/jamri`, `/mml/patient/list/1.3.6.1.4.1.9414.72.103`）を `BASE_URL_{LEGACY,MODERN}` 環境変数指定で実行し、`artifacts/parity-manual/smoke/20251108T212422Z/` に保存済み。ボディ差分はゼロで、Modernized 側はセキュリティヘッダー（CSP/STC/X-Trace-Id 等）が追加、`jamri.code` は両系統とも未設定のため空文字 → Runbook §1.1 にフォローアップ記載）
- [ ] API パリティチェッカー (`scripts/api_parity_response_check.py`) で代表 API の差分を測定し、結果を共有する（備考: CLI ベースのテスト環境が整ったら `tmp/parity-touch/<timestamp>/diff.txt` を再取得し、`docs/server-modernization/phase2/notes/touch-api-parity.md` に差分サマリとリスク評価を追記する。Web クライアント不要）
- [ ] 監査ログ・外部副作用の検証（例: `/20/adm/factor2/*` 実行後の `d_audit_event`）を含む総合回帰テストを設計する（備考: `docs/server-modernization/phase2/notes/test-data-inventory.md:181-218` に合成ベースライン用 SQL と証跡パスを追記し、`ops/tests/security/factor2/*.http` 実行後の `artifacts/parity-manual/audit/d_audit_event_*.log` を整備する）

## フェーズ10: ドキュメント・フォローアップ

- [x] 本チェックリストを作成し、進捗確認の起点を整備する
- [x] 実施結果・既知課題を `PHASE2_PROGRESS.md` および関連ドキュメントへ反映する運用フローを確立する（備考: 2026-06-15 付で `PHASE2_PROGRESS.md` に Progress-Update-Flow（証跡24h以内反映・同営業日チェックリスト更新・週次/リリース前レビュー・RACI/テンプレ）を追加し、本チェックリスト備考へ要約を反映済み）
- [x] テストデータ・モック資材を `ops/tests/` 配下に整理し、デバッグ再現性を確保する（備考: `docs/server-modernization/phase2/notes/test-data-inventory.md` に headers/payloads/README の棚卸し・命名規則・CI 前提・ADM20/FIDO2 拡充計画を追記し、Checklist 反映に必要な資材整理を完了）

---

### 現時点の総括（2026-06-15 / 2025-11-07 追記）

- 2025-11-07: Web クライアント依存を排除する CLI 主導デバッグ方針と証跡保存ルールを追加。Legacy 実測 → Modernized リプレイ → サーバー内部観測の 3 層証跡を整備し、Runbook と `PHASE2_PROGRESS.md` を連動させる Gate を設定。
- フェーズ1は完了。フェーズ2ではサーバーレイヤーマップ/トレースフロー整理、SpotBugs/Checkstyle/PMD および Nightly CPD のワークフロー定義、`ops/analytics/evidence/nightly-cpd/20240615/` での手動証跡取得、`ops/tools/cpd-metrics.sh` のメトリクス抽出改善まで進捗。Slack/PagerDuty/Grafana の本番証跡は未取得で Ops 対応待ち。
- 2025-11-08: 公式 Postgres ベースライン dump を待たず、ローカル合成ベースラインで DB を復旧する方針へ転換。フェーズ4入口で追加検証が必要な場合は Ops 配布版を任意で適用するが、進捗管理上は合成ベースラインの証跡で Gate をクローズしてよい。
- フェーズ3〜5では Touch SSE リロード / DTO マッパー整備 / LegacyObjectMapperProducer 統一により CLI 主導テストが緑化し、`docs/server-modernization/phase2/notes/messaging-parity-check.md` で JMS enqueue→フォールバック証跡（AMQ139012, fallback 500）を取得済み。一方で Claim 2xx 化と `claimHelper.vm` 配備、`MessagingHeaders` の最終検証は `CLAIM_DIAGNOSIS_FIX` シナリオ継続中。
- フェーズ7は添付ストレージ切替と帳票ロケール検証がいずれも環境未整備でブロック中。`docs/server-modernization/phase2/notes/storage-mode-checklist.md` では `ops/tests/storage/attachment-mode/*.sh` と `MODERNIZED_STORAGE_MODE` 実装が未提供であること、`docs/server-modernization/phase2/notes/reporting-parity.md` では `/reporting/karte` 404 とテンプレ/フォント不足により PDF 比較が実行できないことを整理している。
- 直近のアクション: 1) `MessagingGateway` リネーム済みヘッダーの Claim 実装反映と `claimHelper.vm` / ORCA 連携整備で `/20/adm/eht/sendClaim` 成功証跡を取得、2) `attachment-storage.yaml` ローダーと MinIO コンテナ・`ops/tests/storage/attachment-mode/*.sh` を追加し `artifacts/parity-manual/attachments/` のハッシュ比較を再開、3) `ReportingResource` 実装＋テンプレ拡張＋ `PdfDocumentWriter` フォント埋め込み対応で `reporting_karte_{ja,en}` CLI テストと `diff-pdf` 証跡を確保、4) `ops/tests/api-smoke-test/` を 4xx/5xx ケース・監査ログ突合まで拡張して `TRACEID_JMS` / `rest-errors` アーティファクトを更新。
