# Worker 0 メモ: JMS／メッセージング設定ギャップ（2025-11-02）

- **現状把握**  
  - `server-modernized` の各セッション Bean で `jakarta.jms` を import しているものの、`@Resource(mappedName="java:/queue/dolphin")` などは全てコメントアウトされている（例: `server-modernized/src/main/java/open/dolphin/session/SystemServiceBean.java:68-73`、`ScheduleServiceBean.java:93-100`）。  
  - WildFly 設定 CLI には ActiveMQ サブシステム／キュー定義が存在せず、`java:/queue/dolphin` がレジストリに登録されていない（`ops/modernized-server/docker/configure-wildfly.cli`）。  
  - `MessageSender` は Jakarta Messaging 3.0 の MDB として再構築済みで、`META-INF/ejb-jar.xml` からリソースアダプタを解決する（`server-modernized/src/main/java/open/dolphin/session/MessageSender.java`）。リソースアダプタ名はシステムプロパティ `messaging.resource.adapter` で外部化され、既定値は `activemq-ra.rar`。WildFly のプロパティ置換機能に依存する点に留意。 

- **参照資料**  
  - 詳細な整理・推奨アクションは「[予約・通知・バッチ機能 Jakarta EE 10 移行メモ](RESERVATION_BATCH_MIGRATION_NOTES.md#1-javax-%E2%86%92-jakarta-%E7%BD%AE%E6%8F%9B%E5%AF%BE%E8%B1%A1%E3%81%A8%E8%A8%AD%E8%A8%88%E5%B7%AE%E5%88%86)」を参照。  
  - JMS 再導入時の設定ドラフトは ActiveMQ 定義（キュー名、接続ファクトリ、耐久設定）を先に確定する必要がある。

- **次アクション（Worker 0 向け）**
  1. `messaging-activemq` サブシステムに `java:/queue/dolphin` と `java:/JmsXA` を追加する CLI テンプレート案を作成。
  2. `MessagingGateway` を JMS 経由で再実装する場合の分岐（Executor ベースとの切替条件）を設計。
  3. 依存更新タスクと連動し、Jakarta JMS ドライバのバージョン整合を BOM へ反映。
  4. WildFly の `standalone.conf` などで `-Dmessaging.resource.adapter=<RAモジュール名>` を指定する運用手順を整備し、プロパティ未設定時に既定の `activemq-ra.rar` が利用されることを確認する。

## JMS 設定完了証跡（2026-06-03 更新）

- `ops/modernized-server/docker/configure-wildfly.cli` に `dolphinQueue`／`InVmConnectionFactory`／`JmsXA`／`activemq-ra` を冪等に作成するスニペットを追加済み。CLI を再適用した際の標準出力（`outcome => success` の記録）と `wildfly-cli-YYYYMMDD.log` を `docs/server-modernization/phase2/operations/logs/` に保存しておくこと。
- Worker S3 が整備した `ops/modernized-server/checks/verify_startup.sh` を `./verify_startup.sh opendolphin-server-modernized-dev | tee docs/server-modernization/phase2/operations/logs/jms-verify-YYYYMMDD.txt` で実行し、`JMS queue dolphinQueue ... => success` と `pooled-connection-factory JmsXA ... => success` が出力されることを証跡とする。
- `docker exec -it opendolphin-server-modernized-dev /opt/jboss/wildfly/bin/jboss-cli.sh --connect` から以下を実行し、`result="activemq-ra"` と各キューの `entries` 値が期待どおりであることを記録する。CLI の実行ログは `docs/server-modernization/phase2/operations/logs/` 配下へ貼付。
  ```bash
  /subsystem=messaging-activemq/server=default:read-attribute(name=default-resource-adapter-name)
  jms-queue list
  /subsystem=messaging-activemq/server=default/pooled-connection-factory=JmsXA:read-resource
  ```

### 検証方法
1. `docker compose -p modern-testing -f docker-compose.yml -f docker-compose.modernized.dev.yml up -d db-modernized server-modernized-dev` で環境を起動後、`verify_startup.sh` を実行して Secrets／JDBC／JMS／Concurrency が全て `OK` になることを確認する。
2. `jms-queue read --name=dolphinQueue` の結果で `entries` に `java:/queue/dolphin`／`java:jboss/exported/jms/queue/dolphin` が含まれていること、`durable=true` が設定されていることを残す。
3. `server-modernized/log/server.log` に `WFLYMSGAMQ` 系の Warning が出力されていないこと、`MessagingGateway` の起動ログが `bound to java:/queue/dolphin` と出力していることをスクリーンショットまたはログで添付する。
4. フェールオーバーテストとして `docker restart opendolphin-server-modernized-dev` 実行後に手順 1-3 を繰り返し、再起動後もリソースが自動復元されることを確認する。
