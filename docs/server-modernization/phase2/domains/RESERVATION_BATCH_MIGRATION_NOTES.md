# 予約・通知・バッチ機能 Jakarta EE 10 移行メモ（2025-11-02）

Jakarta EE 10 化、依存更新、WildFly 33 への切替が予約（受付）・通知・バッチ処理へ与える影響を旧サーバー（`server/`）との比較で整理した。静的解析のみで作業し、サーバー実行は行っていない。

## 1. `javax` → `jakarta` 置換対象と設計差分

- **定期ジョブ（EJB タイマ → Managed Executor）**  
  旧実装は `@Singleton @Startup` と `@Schedule` で日次・月次ジョブを起動していた（`server/src/main/java/open/dolphin/mbean/ServletStartup.java:10-105`）。Jakarta EE 10 版では `@ApplicationScoped` と `ManagedScheduledExecutorService` へ置換し、手動で次回実行を再スケジュールしている（`server-modernized/src/main/java/open/dolphin/mbean/ServletStartup.java:1-131`）。WildFly 33 では `java:jboss/ee/concurrency/scheduler/default` が前提のため、ドメイン設定で同名リソースが無効化されている場合はジョブが動作しない点に注意する。

- ✅ **CLAIM 送信（JMS 経由の非同期化）**  
  `MessagingGateway` は ActiveMQ Artemis の `java:/queue/dolphin` へ `ObjectMessage` を enqueue し、送信失敗時のみ従来の同期送信（`ClaimSender` / `DiagnosisSender` 直呼び出し）へフォールバックする実装へ統合した（`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java`）。`ScheduleServiceBean` からの呼び出しは `ManagedScheduledExecutorService` を介した即時タスクとして登録し、JTA コミット後に安全にメッセージを投入できるようになった。

- ✅ **JMS リソース定義の復旧**  
  `ops/modernized-server/docker/configure-wildfly.cli` に ActiveMQ Artemis 用 CLI を追加し、`/subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue`（`java:/queue/dolphin` / `java:jboss/exported/jms/queue/dolphin`）と `pooled-connection-factory=JmsXA`（`java:/JmsXA`）を idempotent に登録。`connection-factory=DolphinConnectionFactory` も `java:/ConnectionFactory` として公開した。Micrometer 監視との整合を明文化するコメントも追記し、運用時のメトリクス確認ポイントを共有している。
  `SystemServiceBean` や `KarteServiceBean` のコメントアウトされた `@Resource` は今後の MDB 再移植方針に合わせて整理予定。

- **チャートイベント配信（SSE 化）**  
  旧サーバーは `AsyncContext` を使ったロングポーリングのみだったが、新実装では `jakarta.ws.rs.sse` を用いた SSE サポートを追加している（`server-modernized/src/main/java/open/dolphin/rest/ChartEventSseSupport.java:1-199`、`server-modernized/src/main/java/open/dolphin/rest/ChartEventStreamResource.java:1-52`）。UI 側の購読 URL と `Last-Event-ID` リプレイ運用を文書化する必要がある。

- **メール／MIME API の混在**  
  サーバー側および共通モジュールは `jakarta.mail` へ統一済み（例: `server-modernized/src/main/java/open/dolphin/msg/OidSender.java`, `common/src/main/java/open/dolphin/converter/PlistParser.java`）。レガシー `server/` をビルド対象とする場合のみ `javax.mail` が残存するため、モダナイズ版では Jakarta Mail での動作確認を続ける。

## 2. 予約状態遷移（静的図）

`PatientVisitModel` の状態はビットフラグで管理される（`common/src/main/java/open/dolphin/infomodel/PatientVisitModel.java:21-40`）。主要フローと遷移トリガは以下の通り。

```
[受付登録/待ち] state=0
   │  (UI で診察開始: BIT_TREATMENT)                     ┌─> [一時外出] BIT_GO_OUT=1<<5
   ├─> [診察中] BIT_TREATMENT=1<<3 ----------------------┤
   │        │ (救急対応切替) ──> [救急優先] BIT_HURRY=1<<4
   │        └ (診察終了確認) ──> state<=1 清算ステートへ戻し
   │
   ├─> [カルテ編集中] BIT_OPEN=1<<0 （`ChartEventHandler.publishKarteOpened`）
   ├─> [CLAIM 保存] BIT_SAVE_CLAIM=1<<1 (`PVTServiceBean.updatePvtState`)
   ├─> [CLAIM 修正] BIT_MODIFY_CLAIM=1<<2 (`PVTServiceBean.updatePvtState`)
   └─> [キャンセル] BIT_CANCEL=1<<6 （UI 確認ダイアログ）
```

- UI の状態変更は `WatingListImpl#setValueAt` が担当し、選択された `BitAndIconPair` を `setStateBit` で反映する（`client/src/main/java/open/dolphin/impl/pvt/WatingListImpl.java:443-497`）。  
- カルテオープン時は `ChartEventHandler.publishKarteOpened` が `BIT_OPEN` と `ownerUUID` をセットし、イベントブロードキャスト後に SSE へ転送される（`client/src/main/java/open/dolphin/client/ChartEventHandler.java:148-207`）。  
- サーバー側での整合性チェックは `ChartEventServiceBean.processPvtStateEvent` が担い、`state <= 1` に戻った際は `BIT_CANCEL/BIT_TREATMENT/BIT_GO_OUT/BIT_HURRY` をクリアして通知値を補正する（`server-modernized/src/main/java/open/dolphin/session/ChartEventServiceBean.java:161-267`）。  
- 日付更新では `renewPvtList` が `BIT_SAVE_CLAIM`・`BIT_MODIFY_CLAIM`・`BIT_CANCEL` を含むエントリを一覧から削除してクライアントへ通知する（`server-modernized/src/main/java/open/dolphin/session/ChartEventServiceBean.java:432-489`）。

## 3. 通知処理フロー（静的整理）

1. **受付ステータス更新**  
   - クライアントが REST `/pvt/{pvtPK,state}` を叩くと `PVTServiceBean.updatePvtState` が状態を検証（`server-modernized/src/main/java/open/dolphin/session/PVTServiceBean.java:720-782`）。  
   - `ChartEventServiceBean.processChartEvent` から `notifyEvent` が呼ばれ、同施設・別端末へ chart-event をロングポール／SSE の両方で配信する（`server-modernized/src/main/java/open/dolphin/session/ChartEventServiceBean.java:48-128`、`server-modernized/src/main/java/open/dolphin/rest/ChartEventSseSupport.java:54-135`）。

2. **CLAIM／診断電文送信**  
   - `ScheduleServiceBean.makeScheduleAndSend` や `KarteServiceBean` が `MessagingGateway.dispatchClaim/dispatchDiagnosis` を呼び出す（`server-modernized/src/main/java/open/dolphin/session/ScheduleServiceBean.java:348-411`、`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java:31-74`）。  
   - `MessagingGateway` は `ManagedExecutorService` で非同期化し、監査ログ (`ExternalServiceAuditLogger`) とトレース ID を紐付ける。`claim.conn=server` が未設定の場合は WARN ログのみでスキップする。

3. **PVT 受信サーバー**  
   - `PvtService` は ORCA 側からのソケット接続を処理し、受信 XML を `PVTBuilder` で解析後に `PVTServiceBean.addPvt` を呼び出す（`server-modernized/src/main/java/open/dolphin/mbean/PvtService.java:45-205`）。  
   - 旧 JMS 送信コードはコメントアウトされており、再びキュー送信へ戻す場合は `connectionFactory` と `queue` の `@Resource` を復活させる必要がある（`server-modernized/src/main/java/open/dolphin/mbean/PvtService.java:190-236`）。

4. **SMS 通知**  
   - `PlivoSender` は OkHttp 5.x の `Duration` API を用い、TLS 1.2/1.3 固定・接続 10 秒／読み書き 30 秒／呼び出し 45 秒を既定値とする HTTP クライアントを生成する（`server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java`）。必要に応じて設定値を上書きできるよう、負の値や 0 はフォールバックされる。  
   - 認証情報と HTTP タイムアウト・リトライ設定は `SmsGatewayConfig` が環境変数 → `custom.properties` の順で読み込み、`PLIVO_HTTP_*`（接続/読込/書込/コール/リトライ）を ISO-8601 または `5000ms` / `30s` といった簡易表記で受け付ける（`server-modernized/src/main/java/open/dolphin/msg/gateway/SmsGatewayConfig.java`）。  
   - `server-modernized/pom.xml` では `plivo-java:5.46.0` と OkHttp 5.2.1 を BOM 管理下へ統合済みで、ビルド時の依存欠如は解消した。残課題は本番相当環境での TLS 検証とリトライポリシー合意のみ。

## 4. Jakarta / 依存対応課題まとめ

| 項目 | 現状 | 必要な対応 |
| --- | --- | --- |
| `jakarta.mail` への統一 | `server-modernized` / `common` ともに `jakarta.mail` へ移行済み | Jakarta Mail 3.x の互換性検証（マルチバイト添付、文字化け再現テスト）を継続。 |
| Plivo SDK & OkHttp | BOM 管理下で `plivo-java:5.46.0`＋OkHttp 5.2.1 を利用し、`SmsGatewayConfig` が `PLIVO_HTTP_*` でタイムアウト／リトライを調整可能 | 本番相当のネットワーク（プロキシ／mTLS）で TLS1.3・リトライ挙動を検証し、Micrometer／監査ログで可視化する。 |
| JMS 資産 | `configure-wildfly.cli` に `dolphinQueue`／`JmsXA`／`DolphinConnectionFactory` を追加済み、`MessagingGateway` は JMS enqueue → 同期フォールバックの二段構え | Docker Compose / 本番サーバーで ActiveMQ Artemis 起動後のヘルスチェックとメトリクス収集を確認し、MDB 再移植の要否を整理する。 |
| Micrometer への移行 | REST/DB メトリクスが MicroProfile Metrics API 依存（`server-modernized/src/main/java/open/dolphin/metrics/*.java`） | WildFly 33 の Micrometer サブシステムへ紐付けるため、`io.micrometer` ベースのメトリクス登録クラスへ置き換え、`OBSERVABILITY_AND_METRICS.md` を更新する。 |
| Jakarta SSE | `jakarta.jakartaee-web-api` が提供するが、SSE の再接続ロジック／ヘッダは未ドキュメント | Web クライアントの購読 API 仕様（`/chart-events` エンドポイント、`Last-Event-ID` 再送）を `architecture/REST_API_INVENTORY.md` へ追記し、切断時のバックオフ戦略を決める。 |

## 5. リスクと推奨アクション

- **JMS 運用検証不足**: CLI 上は `dolphinQueue`／`JmsXA` を再作成済みだが、Docker Compose / 本番サーバーで ActiveMQ Artemis を起動しヘルスチェック・メトリクス収集まで確認する迄は本番可否を判断できない。メッセージ滞留時の監査ログ／Micrometer での警告設計も合わせて検討する。  
- **メール API の二重ロード**: 旧 `server/` モジュールをビルド対象に含める場合のみ `javax.mail` が残る。モダナイズ版のみを運用する際は Jakarta Mail のみをロードし、競合が発生しないことを確認済み。  
- **Micrometer 移行遅延**: WildFly 33 では MicroProfile Metrics サブシステムが非推奨であり、`RequestMetricsFilter` が 404 以外のレスポンスで例外を抑止できなくなる恐れがある。Micrometer ブリッジを早期に検証してダッシュボード更新を進める。  
- **Plivo タイムアウト設定の周知不足**: `PLIVO_HTTP_*` による秒数指定を誤るとフォールバック値で動作するため、運用チームへ ISO-8601 / 単位付き数値の指定ルールと標準値（接続10秒等）を周知し、監査ログでの可視化方針を整える。  
- **SSE 運用ドキュメント不足**: 新チャート通知は SSE へ移行済みだが、既存クライアントがロングポールのみを使用する場合のフォールバックや `Last-Event-ID` の扱いが決まっていない。REST API ドキュメントとテストケースを更新し、ブラウザ側のリコネクト実装を確定する。

上記の詳細と JMS 設定ギャップは `WORKER0_MESSAGING_BACKLOG.md` にも共有した。次のアクションとして、依存追加と Micrometer 移行 PoC のオーナー決定、SSE 仕様の公開、そして JMS CLI テンプレートのドラフト作成を提案する。

## 8. Claim/Diagnosis 送信 CLI 検証ログ（2025-11-08）

- **ORCA 接続前提（2025-11-14 更新）**  
  `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md#44-weborca-クラウド接続2025-11-14-更新` に従い、WebORCA クラウド本番（`https://weborca.cloud.orcamo.jp:443`）のみを疎通先とする。`curl --cert-type P12`（`ORCAcertification/103867__JP_u00001294_client3948.p12` + Basic）で `/api/api01rv2/system01dailyv2` を実行し、`artifacts/orca-connectivity/20251113TorcaProdCertZ1/weborca-prod/` へ HTTP/`Api_Result` を保存。Legacy WildFly 10 は `./scripts/start_legacy_modernized.sh start --build` → `start` で再起動し、`ServerInfoResource`（`/serverinfo/{claim/conn,jamri,cloud/zero}`）の値（`claim.conn=server`, `jamri=''`, `cloud.zero=false`）を `artifacts/parity-manual/CLAIM_SEND_ATTEMPT/legacy/serverinfo_*_20251108T19*.txt` に記録した。`ops/shared/docker/custom.properties` では `claim.host=weborca.cloud.orcamo.jp` / `claim.send.port=443` / `claim.send.encoding=MS932` へ切り替え済み。
- **Claim/Diagnosis 実装更新（2025-11-09）**  
  `server-modernized/src/main/java/open/dolphin/msg/{ClaimSender,DiagnosisSender}.java` のロガー初期化を `Logger#isLoggable(Level.FINE)` ベースへ差し替え、`ops/modernized-server/docker/{configure-wildfly.cli,Dockerfile}` で `logger.category.dolphin.claim.level=INFO` を WildFly へ恒久設定した。`server-modernized/src/main/resources/META-INF/persistence.xml` には `open.dolphin.infomodel.{PatientModel,HealthInsuranceModel,KarteBean,RegisteredDiagnosisModel}` を明示登録し、`jar tf server-modernized/target/opendolphin-server-2.7.1/WEB-INF/lib/opendolphin-common-2.7.1-jakarta.jar | rg RegisteredDiagnosis` で WAR に `RegisteredDiagnosisModel.class` がバンドルされていることを確認した上で `./scripts/start_legacy_modernized.sh start --build --force-recreate` を実行した。
- **ClaimSender: logger ガード後の再計測**  
  `ops/tools/send_parallel_request.sh --profile compose PUT /20/adm/eht/sendClaim 20251108T200320Z`（ボディ: `tmp/claim-tests/send_claim_success.json`）を再実行し、`artifacts/parity-manual/CLAIM_SEND_ATTEMPT/20251108T200320Z/{legacy,modern}/` と `.../logs/` にレスポンス／Docker ログ／ORCA ログを保存した。Legacy 側は 404（従来どおり）だが、Modernized 側は `traceId=b72b5c74-1af8-4b43-8091-11b99860c544` で `MessagingGateway` の JMS enqueue が `jakarta.jms.JMSRuntimeException: AMQ139012: The property name 'open.dolphin.traceId' is not a valid java identifier.` により失敗 → 同期フォールバック（直接 `ClaimSender` 呼び出し）へ移行し、`open.dolphin.adm20.rest.EHTResource.sendPackage` が `StringIndexOutOfBoundsException: begin 0, end -1, length 9` を返している。`dolphin.claim` ロガーは INFO で立ち上がり、CLAIM 本文ログも取得できたため、次の課題は (1) JMS プロパティ名を `openDolphinTraceId` など Artemis の命名規則に沿う形へ変更すること、(2) `sendPackage` の文字列解析（9 桁の請求番号を前提にしている箇所）を再実装して 500 を取り除くこと、(3) ORCA 側にアクセスが発生していない理由を調査すること（今回も `.../logs/orca.log` は空のまま）。  
 なお `legacy/serverinfo_*` には `claim.conn=server` / `cloud.zero=false` / `jamri=""` の取得結果を追記済み。
- **DiagnosisSender: RegisteredDiagnosisModel 永続化は通過するが DB 定義が未整備**  
  レガシー Postgres へ最小レコード（`d_facility.id=5001`, `d_users.id=9001`, `d_patient.id=1001`, `d_karte.id=2001`）を投入後、`ops/tools/send_parallel_request.sh --profile compose POST /karte/diagnosis/claim 20251108T200335Z`（ボディ: `tmp/claim-tests/send_diagnosis_success.json` / 手順: `artifacts/parity-manual/CLAIM_DIAGNOSIS_ATTEMPT/sql_setup_notes.txt`）を再実行した。Modernized 側は `traceId=d8176f81-a2d3-43c4-9004-2c17e4a929d6` で `org.hibernate.exception.SQLGrammarException: select nextval('d_diagnosis_SEQ')` → `SessionServiceException` を返し、成果物は `artifacts/parity-manual/CLAIM_DIAGNOSIS_ATTEMPT/20251108T200335Z/` に保存した。`docker exec opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -c "\ds d_diagnosis*"` の結果が「Did not find any relation named 'd_diagnosis*'.」となるため、モダナイズ DB には `d_diagnosis` テーブル／シーケンスがまだ存在しない。DB マイグレーション計画（`docs/server-modernization/phase2/operations/POSTGRES_BASELINE_RESTORE.md`）へ本件を追加し、`d_diagnosis_seq` を作成したうえで `/karte/diagnosis/claim` の再検証を行う。
- **Legacy サーバーの状態**  
  2025-11-08 時点で `opendolphin-server`（WildFly 10）は `service jboss.persistenceunit."opendolphin-server.war#opendolphinPU"` の起動に失敗し、REST エンドポイント（例: `/openDolphin/resources/serverinfo/claim/conn`）が 404 のまま停止していた。Docker を `jma-receipt-docker-for-ubuntu-2204_default`／`legacy-vs-modern_default` の 2 ネットワークへ接続した結果、両ネットワークに `db` エイリアスが存在し、Legacy の JDBC URL `jdbc:postgresql://db:5432/opendolphin` が ORCA 用 Postgres へ誤接続→`FATAL: password authentication failed for user "opendolphin"` となっていた（証跡: `artifacts/parity-manual/CLAIM_SEND_ATTEMPT/logs/server-legacy.log`, `docker-network-*.json`）。以下の手順で復旧済み。
    1. `docker-compose*.yml` / `ops/legacy-server/docker-compose.yml` / `scripts/start_legacy_modernized.sh` / `ops/legacy-server/docker/configure-wildfly.cli` を更新し、`DB_HOST` の既定値と CLI のフォールバックをユニーク名 `opendolphin-postgres` へ切り替え（`docker inspect opendolphin-server --format '{{json .NetworkSettings.Networks}}'` を `artifacts/parity-manual/CLAIM_SEND_ATTEMPT/logs/docker-inspect-opendolphin-server-networks.json` に保存）。
    2. `./scripts/start_legacy_modernized.sh start --build` で Legacy イメージを再ビルドし、`start` で再起動。`wildfly/standalone/deployments` 内の WAR と `.deployed` を `artifacts/parity-manual/CLAIM_SEND_ATTEMPT/logs/wildfly_deployments.txt` に記録。
    3. `jboss-cli.sh --connect` で `/subsystem=datasources/data-source=PostgresDS:test-connection-in-pool` と `/deployment=opendolphin-server.war/subsystem=jpa/hibernate-persistence-unit=opendolphin-server.war#opendolphinPU:read-resource(include-runtime=true)` を実行し、結果を `artifacts/parity-manual/CLAIM_SEND_ATTEMPT/logs/jboss-cli_PostgresDS_test.txt` / `jboss-cli_opendolphinPU.txt` に保存。
    4. 復旧後の `docker logs opendolphin-server` を `artifacts/parity-manual/CLAIM_SEND_ATTEMPT/logs/server-legacy-fixed.log` として控え、従来ログとの差分を比較できるようにした。
  これらの修正により Legacy REST が 200 を返す状態へ戻り、API パリティ比較と ORCA 連携の再実行が可能になった。
- **MMLSender 送信経路の再接続 (2025-11-08)**  
  `MmlResource` に `PUT /mml/send`（`ISendPackage` 互換）を追加し、`MmlSenderBean` が `open.dolphin.msg.MMLSender` と Velocity テンプレート `mml2.3Helper.vm` を呼び出すよう復旧した。CLI フィクスチャは `tmp/mml-tests/`（`mml.headers` / `send_mml_success.json`）へ追加済みで、`ops/tools/send_parallel_request.sh --profile compose PUT /mml/send MML_SEND` を実行すると `artifacts/parity-manual/MML_SEND/20251108T195618Z/{legacy,modern}/` にレスポンスが保存される。今回のモダナイズ側レスポンスは `405 Method Not Allowed`（WAR 展開前に `jboss.persistenceunit."opendolphin-server.war#opendolphinPU"` が `RegisteredDiagnosisModel.karte` の未知エンティティで停止）であり、アプリ WAR が有効化されるまで REST 呼び出しは動作しない。サーバーログと ORCA ヘルスチェック (`orca_response.txt`) は同ディレクトリ配下に採取済み。
- **証跡**  
  Claim: `artifacts/parity-manual/CLAIM_SEND_ATTEMPT/`（`legacy/`・`modern/` のレスポンス、`meta.json`、`logs/` 以下に Docker ログと ORCA ログ）。  
  Diagnosis: `artifacts/parity-manual/CLAIM_DIAGNOSIS_ATTEMPT/`（REST レスポンス、SQL 投入メモ、Docker ログ）。  
  いずれも `ops/tools/send_parallel_request.sh` の `PARITY_HEADER_FILE=tmp/claim-tests/*.headers` / `PARITY_BODY_FILE=tmp/claim-tests/*.json` で採取した。

> **Next Action（要チケット化）**
> 1. `MessagingGateway` が JMS プロパティ `openDolphinTraceId` を設定できるよう Artemis の命名規則に沿ったキーへリネームし、`ClaimSender` フォールバック無しで ACK/NAK を取得する。
> 2. `open.dolphin.adm20.rest.EHTResource#sendPackage` の `StringIndexOutOfBoundsException`（9 桁未満の請求番号を想定していない）を解消し、CLAIM リクエストが 200 になることを確認する。
> 3. `opendolphin_modern` DB に `d_diagnosis` テーブル／`d_diagnosis_seq` を作成し、`/karte/diagnosis/claim` が `RegisteredDiagnosisModel` を永続化できるところまでマイグレーション Runbook を更新する。
> 4. `MMLSender` の実行経路（Chart 保存／CLI）を再確認し、呼び出しポイントが削除されている場合は Runbook からテスト対象を外すか、代替テストを設計する。

## 6. JMS 設定ギャップ統合メモ（Worker0 引き継ぎ）

本節は `operations/WORKER0_MESSAGING_BACKLOG.md` の要点を取り込み、JMS サブシステムの確認・復旧・証跡取得フローを一元化した。

1. **設定テンプレートの適用**: `ops/modernized-server/docker/configure-wildfly.cli` を適用し、`dolphinQueue`／`JmsXA`／`ConnectionFactory` が `outcome => success` で登録されることを CLI ログに残す。ログは `docs/server-modernization/phase2/operations/logs/` へ保存。
2. **ヘルスチェック**: `ops/modernized-server/checks/verify_startup.sh opendolphin-server-modernized-dev` を実行し、Secrets/JDBC/JMS/Concurrency が全て `OK` であるスクリーンショットまたはログを取得する。
3. **CLI 直接確認**: `jboss-cli.sh --connect` から `jms-queue list` と `/subsystem=messaging-activemq/server=default/pooled-connection-factory=JmsXA:read-resource` を発行し、`entries` が `java:/queue/dolphin`／`java:jboss/exported/jms/queue/dolphin` を含むことを記録。
4. **再起動テスト**: `docker restart opendolphin-server-modernized-dev` 後に手順 1-3 を繰り返し、リソースが自動復元されることを確認する。
5. **アラート連携**: Micrometer から JMS メトリクスを取得するまでは `server.log` の `WFLYMSGAMQ` WARN を SRE へ即時共有する。`docs/web-client/planning/phase2/DOC_STATUS.md` のタスク欄に検証日・担当を追記する。

## 7. クライアント統合テストシナリオ

旧サーバーとモダナイズサーバーを切り替えながら Web クライアントを検証する際は [`docs/web-client/operations/LEGACY_INTEGRATION_CHECKS.md`](../../../web-client/operations/LEGACY_INTEGRATION_CHECKS.md) を使用する。同ドキュメントでは以下を扱う。

- `/pvt` REST 更新と SSE 購読の同時検証手順。
- JMS 経由での CLAIM 送信可否チェックと `MessagingGateway` フォールバック確認。
- 予約状態のビットフラグが UI と合致しているかの確認項目（BIT_OPEN/BIT_TREATMENT/BIT_CANCEL 等）。

検証結果は `planning/phase2/DOC_STATUS.md` の「Active ドキュメント」にメモし、未消化の項目は Dormant/Archive 移行条件として扱う。
