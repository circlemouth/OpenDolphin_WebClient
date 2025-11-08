# モダナイズ版サーバー起動ブロッカー調査メモ（2026-06-02 作成: Codex）

## 背景

`server-modernized` モジュールは Jakarta EE 10 / WildFly 33 へ移行済みだが、起動時に必要となるインフラ機能が揃っていないとデプロイが失敗する。現状のブロッカーと必要な追加実装を洗い出し、下表の対応を完了すれば WildFly 起動が通る状態にできるよう整理した。

## 起動ブロッカー一覧

### 1. 2FA 秘密鍵（環境変数 `FACTOR2_AES_KEY_B64`）

- 根拠: `server-modernized/src/main/java/open/dolphin/security/SecondFactorSecurityConfig.java:14-46` では `@PostConstruct` 内で Base64 化された AES 鍵を必須取得し、未設定の場合 `IllegalStateException` を送出する。
- 影響: Secrets が配布されていない環境では WildFly デプロイメントの初期化フェーズで例外となりサーバーが停止する。
- 対応:
  1. Secrets Manager もしくは `.env` で 32 バイトの AES キーを Base64 化して `FACTOR2_AES_KEY_B64` として供給する（Compose では `docker-compose.modernized.dev.yml` がデフォルト値を用意）。
  2. ローテーション手順・監査ログ出力を `docs/server-modernization/security/DEPLOYMENT_WORKFLOW.md` に追記し、運用との合意を取る。
  3. 詳細な生成・配布フローは `docs/server-modernization/security/DEPLOYMENT_WORKFLOW.md` の「2.1 FACTOR2_AES_KEY_B64 の生成・ローテーション」「2.2 Jakarta EE 10 環境での Secrets 配布フロー」を参照し、更新があれば本メモへも反映する。

### 2. JDBC データソース（`java:jboss/datasources/PostgresDS` / `java:jboss/datasources/ORCADS`）

- 根拠:
  - `server-modernized/src/main/java/open/dolphin/mbean/InitialAccountMaker.java:34-69` は `@Resource(mappedName="java:jboss/datasources/PostgresDS")` を必須注入し、`@PostConstruct` で即時にインデックス作成 SQL を実行する。
  - `server-modernized/src/main/java/open/dolphin/metrics/DatasourceMetricsRegistrar.java:22-78` でも同 JNDI を Micrometer メトリクス登録に利用。
  - ORCA 連携は `server-modernized/src/main/java/open/orca/rest/ORCAConnection.java:66-76` で `java:jboss/datasources/ORCADS` を `InitialContext` から解決する。
- 影響: WildFly に両データソースが存在しないとリソース注入段階で `WFLYCTL0412` が発生し、サーバーが起動しない。
- 対応:
  1. `ops/modernized-server/docker/configure-wildfly.cli` に含まれる `PostgresDS` / `ORCADS` 追加コマンドを本番相当の CLI 手順にも反映させる。
  2. 接続先 DB（`DB_HOST`, `DB_NAME` 等）と SSL パラメータを Secrets / 環境変数として管理し、CLI 実行後に `data-source read-resource` で稼働確認する。

### 3. JMS リソース（`java:/queue/dolphin` / `java:/JmsXA`）

- 根拠:
  - `server-modernized/src/main/java/open/dolphin/session/MessageSender.java:31-60` の MDB は `destinationLookup="java:/queue/dolphin"` を必須とする。
  - `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java:21-90` は `@Resource(lookup = "java:/JmsXA")` と `@Resource(lookup = "java:/queue/dolphin")` を介して非同期送信を実装。どちらかが欠けると起動時にデプロイメント例外となる。
- 影響: ActiveMQ Artemis 側にキュー／接続ファクトリが未定義だと MDB 有効化が失敗し、WildFly 起動が中断される。
- 対応:
  1. WildFly の `messaging-activemq` サブシステムに以下を登録する（CLI 例: `ops/modernized-server/docker/configure-wildfly.cli` 51-70 行目を参照）。
     - `jms-queue=dolphinQueue:add(entries=["java:/queue/dolphin","java:jboss/exported/jms/queue/dolphin"], durable=true)`
     - `connection-factory=InVmConnectionFactory:add/use-...` で `java:/ConnectionFactory` / `java:/JmsXA` をエクスポート。
  2. `messaging.resource.adapter`（既定値 `activemq-ra.rar`）が解決できるよう RA を配置し、`ejb-jar.xml` の設定と整合を取る。
  3. 設定後に `jms-queue list`・`/subsystem=messaging-activemq/server=default:read-resource` でエントリを検証する。

### 4. Jakarta Concurrency リソース（Managed Executor / Scheduler / ThreadFactory）

- 根拠:
  - `server-modernized/src/main/java/open/dolphin/mbean/PvtService.java:35-113` は `@Resource(lookup="java:jboss/ee/concurrency/factory/default")` を使用して受付ソケット待受スレッドを生成。
  - `server-modernized/src/main/java/open/dolphin/mbean/ServletStartup.java:34-55` は `ManagedScheduledExecutorService` を `java:jboss/ee/concurrency/scheduler/default` から取得し、日次・月次ジョブをスケジュール。
  - `server-modernized/src/main/java/open/dolphin/adm20/export/PhrExportJobManager.java:24-42` は `java:jboss/ee/concurrency/executor/default` を利用し、未注入時は例外を投げる。
- 影響: `ee-concurrency` サブシステムでデフォルトリソースが無効な場合、いずれかの bean がデプロイ不可となりサーバーが停止する。
- 対応:
  1. WildFly CLI で以下を確認／作成する。
     ```
     /subsystem=ee/service=managed-executor-service=default:read-resource
     /subsystem=ee/service=managed-scheduled-executor-service=default:read-resource
     /subsystem=ee/service=managed-thread-factory=default:read-resource
     ```
     存在しない場合は `add` コマンドでコアプールサイズ・キュー長を含めて明示定義する。
 2. `ops/modernized-server/docker/configure-wildfly.cli` へ同コマンドを追記し、Docker / 手動構築のどちらでも再現できるよう統一する。
 3. 起動後に `server.log` へ `ManagedScheduledExecutorService is not available` 警告が出ていないことを確認し、Micrometer のジョブメトリクスが取得できるかを合わせて検証する。

### 5. Legacy WildFly 10 参考情報（2025-11-09 追加）

- 背景: Legacy `opendolphin-server`（WildFly 10）を Modernized サービスと同居させるため `docker compose` で `jma-receipt-docker-for-ubuntu-2204_default` ネットワークへ接続すると、Legacy/Modernized 双方の `db` サービスと ORCA スタックの `db` が同名エイリアスになる。`DB_HOST=db` のままでは Legacy の JDBC URL が ORCA Postgres へ向かい、`jboss.persistenceunit."opendolphin-server.war#opendolphinPU"` が `FATAL: password authentication failed for user "opendolphin"` で停止する。
- 影響: `server-legacy.log` に `WFLYCTL0412` / `WFLYCTL0186` が記録され、`/openDolphin/resources/serverinfo/*` が 404 のままになるため API パリティ比較が実施できない。
- 対応: `docker-compose.yml` / `ops/legacy-server/docker-compose.yml` / `scripts/start_legacy_modernized.sh` / `ops/legacy-server/docker/configure-wildfly.cli` を更新し、`DB_HOST` 既定値と CLI のフォールバックを固有名 `opendolphin-postgres` に変更。再ビルド後に `jboss-cli PostgresDS:test-connection-in-pool` と `deployment=...opendolphinPU:read-resource` を実行し、`ServerInfoResource` の 200 応答と合わせて `artifacts/parity-manual/CLAIM_SEND_ATTEMPT/legacy/` 配下へ保存（`server-legacy-fixed.log`, `jboss-cli_*.txt`, `serverinfo_*_20251108T19*.txt` など）。
- 補足: 誤配線の再発を防ぐため `docker network inspect` 結果（`docker-network-legacy-vs-modern_default.json` / `docker-network-orca-default.json`）と `docker inspect opendolphin-server --format '{{json .NetworkSettings.Networks}}'` を同フォルダに残し、今後 ORCA ネットワークへ接続する際はホスト名衝突の有無を確認すること。

## 実装フロー提案

1. Secrets／環境変数（`FACTOR2_AES_KEY_B64` ほか DB 接続情報）を整理し、各環境へ安全に配布する。
2. WildFly 設定をコード化（CLI スクリプト更新）し、データソース・JMS・Concurrency リソースを provision してから `standalone-full.xml` へ適用する。
3. Docker Compose または実機で `server-modernized` を起動し、`server.log` でデプロイエラーが発生しないこと、`/openDolphin/resources/dolphin` ヘルスチェックが 2xx を返すことを確認する。
4. すべての対応が完了したら `docs/server-modernization/phase2/PHASE2_PROGRESS.md` に日付・担当者・適用結果を追記する。

## Ops 自動検証スクリプト（Worker S3）

- 起動ブロッカーの有無を自動検知するため、`ops/modernized-server/checks/verify_startup.sh` を追加した。WildFly コンテナ名を指定すると `docker exec` と `jboss-cli.sh` を用いて以下を検証する。
  - 環境変数 `FACTOR2_AES_KEY_B64` が設定されているか
  - JDBC データソース `PostgresDS` / `ORCADS` の `read-resource(include-runtime=true)` が成功するか
  - JMS キュー `dolphinQueue` と `pooled-connection-factory=JmsXA` が `read-resource` で取得できるか
  - `ManagedExecutorService` / `ManagedScheduledExecutorService` / `ManagedThreadFactory` が `read-resource` で取得できるか
- スクリプトの導入背景と使用手順は `ops/modernized-server/checks/README.md` を参照。運用チェックリストへ組み込むことで、Secrets 欠落や WildFly リソース未登録をデプロイ前に検出できる。

## 今後の管理

- 上記 4 項目が揃っているかを CI / 運用チェックリストへ組み込み、欠落時はビルド段階で検知できるようにする。
- JMS と Concurrency の設定は `WORKER0_MESSAGING_BACKLOG.md` のタスクと連動しているため、完了後に同ドキュメントのステータスを更新すること。
- Secrets 配布や CLI 実行結果に不明点が残る場合は、`docs/server-modernization/phase2/foundation/IMPACT_MATRIX.md` の担当者セクションへ質問・メモを追記する。
