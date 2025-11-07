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
