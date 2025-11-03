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
