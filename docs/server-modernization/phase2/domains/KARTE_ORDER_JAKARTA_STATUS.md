# カルテ記載・オーダー機能 Jakarta EE 10 移行確認（更新日: 2025-11-02）

## 対象範囲
- カルテ文書 CRUD（`server/src/main/java/open/dolphin/rest/KarteResource.java`, `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`）
- 傷病名・観察・患者メモ・CLAIM 送信（`KarteServiceBean`, `DocumentModel`, `DiagnosisSendWrapper`）
- スタンプ/オーダ管理（`StampResource`, `StampServiceBean`）
- 予定カルテ・受付連携（`ScheduleServiceBean`, `PVTServiceBean`）
- ChartEvent 通知とドラフト同期（`ChartEventResource`, `ChartEventServiceBean`）

## 1. CRUD シナリオ差分表
| シナリオ | 旧サーバー (`server`) | モダナイズ版 (`server-modernized`) | ギャップ・課題 |
| --- | --- | --- | --- |
| 文書保存（確定/CLAIM送信） | `KarteResource#postDocument` → `KarteServiceBean#addDocument` が `javax.ws.rs`/Jackson1 で JSON を受け、`ClaimSender` を同期呼び出し。 | `jakarta.ws.rs` + Jackson 2.17 で受信し、`KarteServiceBean#addDocument` が `MessagingGateway.dispatchClaim` に渡す。`@Transactional` と `SessionOperationInterceptor` に依存。 | JMS キュー（`java:/queue/dolphin`）経由でのサーバー送信へ復旧済み。引き続き WildFly 33 へのキュー/接続ファクトリ定義の CLI 化と、`DocumentModel` など `jakarta.persistence` 未移行部分の解消が必要。 |
| 文書保存 + 受付状態更新 | `/karte/document/pvt/{params}` で `addDocumentAndUpdatePVTState` が EJB (`@Stateless`) トランザクション上で PVT 状態を更新。 | CDI (`@ApplicationScoped` + `@Transactional`) に移行、`messagingGateway` の非同期送信後に `PatientVisitModel` を更新。 | Jakarta CDI 4 スキーマの `beans.xml` へ更新済み。今後は JMS 経由の CLAIM 完了後に PVT 更新が期待どおりロールバック連動するか統合テストで確認し、`PVTServiceBean` のスレッドセーフ性を検証する必要がある。 |
| 文書削除 | `deleteDocument` がリレーションを逐次 `STATUS_DELETE` に更新し、`javax.persistence` エンティティを使用。 | 実装はほぼ同じだが `@Transactional` 付与のみ。 | `jakarta.persistence` へ変換されておらず、WildFly 33 の JPA モジュールと API 名称が不一致。楽観ロックがなく同時削除検知ができない。 |
| 傷病名一括処理 + CLAIM | `postPutSendDiagnosis` が削除/更新/追加後に `ClaimSender` を同期呼出。 | `MessagingGateway.dispatchDiagnosis` で非同期送信。 | `DiagnosisSendWrapper` に Bean Validation がなく、Jakarta 変換後も入力検証が未実装。`MessagingGateway` は `custom.properties` に依存し、WildFly 33 での配置手順未整理。 |
| 観察 CRUD | `ObservationList` を Jackson1 で処理し、`em.persist`/`merge` を直呼び。 | Jackson 2.17 へ更新、`@Transactional` により一括コミット。 | JSON バリデーション不在、`javax.persistence` 変換未了。 |
| スタンプツリー同期 | `StampServiceBean` が `@Stateless` + `SessionContext` を使用しつつ `First Commit Win` 例外で競合検知。 | `@ApplicationScoped` + `@Transactional` に切替、例外でロールバックする設計。 | `SessionContext` 廃止により `RuntimeException` で確実にロールバックするか要検証。`beans.xml` 未更新だと `SessionOperationInterceptor` が動作せず例外ロギング/トレースも無効。 |
| スタンプ項目 CRUD | `StampResource#putStamp` 等が Jackson1 で変換し `StampServiceBean` が `em.merge`。 | Jackson 2.17 ベースで同等処理。 | `jakarta.validation` 未導入で入力検証不足。ロールバック動作は前行と同じ懸念。 |
| 予定カルテ作成 / CLAIM | `ScheduleServiceBean#makeScheduleAndSend` が `custom.properties` を都度読み込み、`ClaimSender` へ同期送信。 | `messagingGateway.dispatchClaim` を共有化し、JMS キューへ ObjectMessage を投げて MDB (`MessageSender`) が送信処理を担当。 | WildFly の `messaging-activemq` へ `java:/queue/dolphin` と `java:/JmsXA` を登録し、ORCA 連携・PVT 連携のE2Eテストを実施する必要がある。フォールバック動作（同期送信）も併せて検証する。 |
| ChartEvent 通知 | `ChartEventServiceBean#notifyEvent` が `javax.servlet.AsyncContext` を操作し SSE は別実装。 | `jakarta.servlet.AsyncContext` + `ChartEventSseSupport` で同等処理。 | `ServletContextHolder` の `List<AsyncContext>` 共有が Jakarta 以降も synchronized ブロック頼み。`web.xml` 旧スキーマのままだと非同期サーブレット設定が不完全になる恐れ。 |

## 2. `javax.*` 参照と Jakarta 化課題
| 領域 | 参照ファイル | 現状 | 必要な対応 |
| --- | --- | --- | --- |
| REST API (`javax.ws.rs`) | `server/src/main/java/open/dolphin/rest/*.java` | 旧サーバーは `javax.ws.rs` / `javax.servlet` に依存。 | 運用対象を `server-modernized` へ切替し、旧モジュールはビルド対象から外す。RESTEasy 6 設定を `jakarta.ws.rs.core.Application` ベースへ整理。 |
| サーブレット/非同期 (`javax.servlet`) | `server/src/main/java/open/dolphin/rest/ChartEventResource.java` ほか | 旧コードは `javax.servlet`、新コードは `jakarta.servlet` へ切替済みだが `web.xml` が JavaEE 3.0 スキーマ。 | `web.xml` を `https://jakarta.ee/xml/ns/jakartaee` + 6.0 schema に更新し、WildFly 33 で async filter/servlet が正しく登録されるようにする。 |
| トランザクション (`javax.transaction`) | `docker/server/configure-wildfly.cli` | モジュール依存に `javax.transaction.api` を指定。 | CLI スクリプトを `jakarta.transaction.api` へ更新し、WildFly 33 のモジュール名と整合させる。 |
| 永続化 (`javax.persistence`) | `common/src/main/java/open/dolphin/infomodel/*` | エンティティ/リスナーを `javax.persistence` で宣言。 | `jakarta.persistence` へ全面置換し、`common/pom.xml` の依存を Jakarta API + WildFly 付属ライブラリへ揃える。 |
| バリデーション (`javax.validation`) | ※参照なし | 入力 DTO に Bean Validation 未導入。 | `jakarta.validation` を BOM に追加し、カルテ/オーダ API のリクエスト DTO へ `@NotNull` 等を付与。 |

## 3. トランザクション・ドラフト・競合制御の静的分析
- `KarteServiceBean#addDocument`（`server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`）は親ドキュメントを `STATUS_MODIFIED` へ更新し、新旧モジュール/スキーマ/添付をループで更新する。`@Transactional` は `SessionOperationInterceptor` 経由で付与される想定だが、`WEB-INF/beans.xml` が JavaEE 1.0 のままなので CDI インターセプタが登録されない恐れがある。
- `DocumentModel`/`DocInfoModel` は `STATUS_F`（確定）、`STATUS_T`（ドラフト）、`STATUS_M`（修正）、`STATUS_D`（削除）でドラフト管理を実装しているが、`@Version` が無く同時編集の検知はアプリケーションコード頼み。Jakarta 移行時に JPA 変換と併せて楽観ロック導入を検討する必要がある。
- `StampServiceBean#getNextVersion`（`server-modernized/src/main/java/open/dolphin/session/StampServiceBean.java`）はバージョン衝突時に `RuntimeException` を投げる。旧実装は EJB により自動ロールバックされたが、現状は CDI 例外を拾う仕組みが `SessionOperationInterceptor` 依存のため、インターセプタが有効かどうかが重要。
- `ScheduleServiceBean#makeScheduleAndSend` は予約カルテ生成後に `MessagingGateway.dispatchClaim` を呼び、`custom.properties` の設定値に依存する。旧実装で行っていた `ConnectionFactory` や JMS の送信は未復元であり、非同期送信の失敗時リトライ/監査は `MessagingGateway` 側のロギング（`ExternalServiceAuditLogger`）頼り。
- `ChartEventServiceBean#notifyEvent` は `ServletContextHolder#getAsyncContextList` を `synchronized` で保護しつつ `AsyncContext` を再ディスパッチする。WildFly 33 のサーブレット 6.0 では非同期ディスパッチ時に `ServletRequest` 属性へ `ChartEventResource.KEY_NAME` を再セットしており、`web.xml` を更新しないと async サポートフラグが欠落する。
- `PVTServiceBean#addPvt` は既存患者の健康保険を差し替え、未来日の受付を予約カルテとして保存する。`BIT_*` フラグによる競合検知はビット演算で行っており、Jakarta 移行による挙動変更は無いが、`@Transactional` によりバッチ更新が 1 トランザクションにまとまる点を再確認する必要がある。
- `MessagingGateway`（`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java`）は `ManagedExecutorService` へ `@Resource` 注入する設計で、WildFly 33 側にデフォルト executor が無い場合は同期実行へフォールバックする。非同期送信が想定通りに動作するか起動時にロギングで確認すべき。 

## 4. テンプレート/Bean 定義の Jakarta スキーマ影響
- 2025-11-02 時点で `server-modernized/src/main/webapp/WEB-INF/web.xml` を Servlet 6.0 スキーマへ更新済み。WildFly 33 での再デプロイ時に async filter/servlet 設定が問題なく読み込まれるかを確認する。
- 同日 `WEB-INF/beans.xml` も CDI 4.0 (`beans_4_0.xsd`) へ更新し、`SessionOperationInterceptor` を `<interceptors>` セクションで有効化した。稼働時ログでインターセプタ登録を確認するタスクが残る。
- `MessageSender` を Jakarta Messaging 3.0 の MDB として復旧済み。`messaging-activemq` サブシステムへ `java:/JmsXA` / `java:/queue/dolphin` を登録し、ORCA 連携キューのヘルスチェック手順を整備する必要がある。 

## 5. 未移植機能・優先度
- **High**: `common` モジュールの `javax.persistence` → `jakarta.persistence` 変換（`common/pom.xml`, `DocumentModel` ほか）。カルテ CRUD で使用する全エンティティに影響。
- **High**: WildFly 33 の `messaging-activemq` へ `java:/JmsXA` / `java:/queue/dolphin` を定義し、Worker4 と決めた永続化ポリシーを CLI/ドキュメントへ反映する。
- **High**: `MessagingGateway`／`MessageSender` の監査ログフローとフォールバック（同期送信）パスを実機で検証し、失敗時リトライや DLQ 設定を決定する。
- **Medium**: `jakarta.validation` を導入し、カルテ・オーダ入力 DTO へ妥当性制約を設定。UI とのエラー連携仕様も整理。
- **Medium**: ドキュメント/スタンプへの楽観ロック（`@Version`）追加と API 側の 409 応答設計。
- **Medium**: Servlet/CDI 初期化ログに `SessionOperationInterceptor` 登録が出力されるかを確認し、手順書へ追記する。
- **Low**: `ServletContextHolder` の `List<AsyncContext>` 共有を `CopyOnWriteArrayList` 等へ見直し、マルチスレッド競合を抑制。 

## 6. 推奨対応
1. 2025-11-05 までに `configure-wildfly.cli` へ `messaging-activemq` の `java:/JmsXA` `java:/queue/dolphin` 定義を追加し、Worker4 に設定レビューを依頼する。
2. 2025-11-06 までに モダナイズ環境で CLAIM/DIAGNOSIS の JMS 経路とフォールバック（同期送信）の統合テストを実施し、監査ログの出力結果を記録する。
3. 2025-11-08 までに `common` と `server-modernized` の JPA 依存を `jakarta.persistence` へ切り替え、BOM（`pom.server-modernized.xml`）へ Jakarta API を明示する。
4. `jakarta.validation` を導入し、カルテ保存系 DTO に必須項目制約を付与して Web クライアントのエラーハンドリング仕様と同期させる。
5. `SessionOperationInterceptor` 登録ログと WildFly 再起動時の挙動を確認し、運用手順へ追記する。 
