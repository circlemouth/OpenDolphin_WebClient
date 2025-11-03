# Jakarta EE 10 移行ギャップリスト（更新日: 2025-11-03）

server-modernized を WildFly 33 / Jakarta EE 10 へ移行する際に残存している課題をカテゴリ別に整理した。各項目には参照ファイルと他ワーカーが確認すべき指針を併記している。

## 1. ビルド・依存管理のギャップ

- ✅ 2025-11-02 Codex: `common/pom.xml` を Java 17 / Jakarta API 前提に更新済み。`jakarta.jakartaee-api:10.0.0` を provided 参照とし、Hibernate ORM 6.4.4.Final（WildFly 33 同梱版）を provided 依存へ切替。`maven-compiler-plugin` も release 17 指定に揃えた。
- ✅ 2025-11-02 Codex: `server-modernized/pom.xml` の `dependencyManagement` に Jakarta BOM / Plivo / OkHttp / OpenPDF / BouncyCastle / Yubico WebAuthn を登録し、依存宣言を BOM 管理下へ整理。`com.squareup.okhttp3:okhttp` は WAR へ直結するコンパイル依存として追加済み。残課題: JSON-P/JSON-B 実装（`jakarta.json` 系）の明示依存可否を確認し、必要なら追加する。
- ✅ 2025-11-02 Codex: `com.plivo:plivo-java` のバージョンを Maven Central 公開版の `5.46.0` に戻し、`dependencyManagement` 管理下へ移行。private 版への依存は解消済み。
- ✅ 2025-11-03 Worker0: Docker / CI ビルドから Hibernate 5 系ベースの `StringClobType` 互換 JAR 生成を撤廃し、Hibernate ORM 6 系標準の文字列 CLOB マッピングへ移行。`server-modernized` エンティティは Jakarta Persistence 3.1 と整合することをビルド検証済み。
- ⚠️ 2025-11-03 Codex: 旧 `docker/server(-modernized)/Dockerfile` に残る `dependency:get org.hibernate:hibernate-core:5.0.10.Final` の削除と CI キャッシュ更新を Worker C が追跡中。Compose から新 Type を使用する回帰テストを 2025-11-06 までに実施。

## 2. ソースコードのギャップ

- ✅ 2025-11-02 Codex: `common/src/main/java/open/dolphin/infomodel/` 配下のエンティティ import を `jakarta.persistence.*` へ全置換済み。`@Temporal` の FQCN なども `jakarta.persistence` へ更新し、共通 DTO が Jakarta Persistence 3.1 と整合することを確認した。
- ✅ 2025-11-03 Codex: `PatientMemoModel` / `LetterText` / `PatientFreeDocumentModel` / `NurseProgressCourseModel` の `@Type(type="org.hibernate.type.StringClobType")` を Hibernate 6 推奨の `@JdbcTypeCode(SqlTypes.CLOB)` へ置換し、`org.hibernate.annotations.Type` 依存を除去。ローカル環境に Maven CLI が無いため `mvn -pl common -DskipTests package` は `command not found` で失敗しており、環境整備後にビルド確認を再実施する必要がある。
- ✅ 2025-11-02 Codex: `common/src/main/java/open/dolphin/converter/PlistParser.java` / `PlistConverter.java` の Mail API import を `jakarta.mail.*` へ更新。`MessagingException` / `MimeUtility` の参照も Jakarta Mail 3.x と互換になるよう調整済み（ビルド検証は環境未整備のため別途）。
- ✅ 2025-11-02 Codex: `open.dolphin.adm20.PlivoSender` が要求する OkHttp 5.2.1 を `server-modernized/pom.xml` に追加済み（BOM 管理下）。WAR へのバンドル不足による `ClassNotFoundException` リスクは解消。TLS1.3 設定検証は別途継続。
- ✅ 2025-11-03 Worker1: CLAIM / PVT 送信で利用していた XSLT テンプレート群を Java ベースのビルダーロジックへ置換し、Jakarta XML Binding で再生成するフローへ統一。変換結果の差分比較レポートも共有済み。
- ⚠️ 2025-11-03 Codex: XSLT 廃止後の CLAIM 送達確認を ORCA Stub 含めて自動化するテストが未整備。`PHASE2_PROGRESS.md` TODO に記載した通り、Worker4 が 2025-11-08 までにテストシナリオを追加予定。
- JMS 連携は `server-modernized/src/main/java/open/dolphin/session/ScheduleServiceBean.java:18-104` や `MessageSender.java` などで `jakarta.jms` を利用しているが、`@Resource` 定義はコメントアウトされたままで JMS リソースの JNDI 名が未確定。
- `server-modernized/src/main/java/open/dolphin/session/MessageSender.java` は MDB 実装がスタブ化されており、キュー経由の CLAIM／PVT 連携が未移植のまま。Jakarta Messaging 3.0 の MDB 再構築または別経路への統合が必要。
- `server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java` は `ManagedExecutorService` を `@Resource` で取得する設計だが、WildFly 33 でのデフォルト executor JNDI を明示せず依存している。非同期送信を利用する場合はサーバー設定およびフォールバック動作を確認すること。
- `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java:17-99` は `jakarta.servlet` へ移行済みだが、ヘッダベースの独自認証を温存しており Elytron / Jakarta Security との統合が未着手。WildFly 33 の Elytron HTTP 認証または Bearer Token 方式へ再設計する必要がある。
- `server-modernized/src/main/java/open/dolphin/security/SecondFactorSecurityConfig.java:17-51` は TOTP AES キーが未設定の場合に開発用固定キーへフォールバックする。Jakarta EE 10 移行後も秘匿性要件を満たすため、キーの環境変数必須化と Secrets 管理（Vault 等）への移行が必要。

## 3. 設定ファイルのギャップ

- `server-modernized/src/main/webapp/WEB-INF/web.xml:2-7` と `beans.xml:2-4` が `http://java.sun.com/xml/ns/javaee` を参照している。Jakarta Servlet 6 / CDI 4.1 では `https://jakarta.ee/xml/ns/jakartaee` と `_6_0.xsd` / `beans_4_0.xsd` へ更新する必要がある。
- ✅ 2025-11-02 Codex: `server-modernized/src/main/resources/META-INF/persistence.xml` を Jakarta Persistence 3.1 スキーマへ更新し、`jakarta.persistence.schema-generation.database.action` などのプロパティ名も Jakarta 名前空間に統一した。
- ✅ 2025-11-02 Codex: `common/src/main/resources/META-INF/persistence.xml` も Jakarta Persistence 3.1 に合わせてスキーマ・プロバイダ定義を更新し、共通モジュールの設定整合性を確保した。

## 4. WildFly 33 固有の設定ギャップ

- MicroProfile Metrics サブシステムは WildFly 33 で非推奨となり、デフォルトで Micrometer が推奨される。`RequestMetricsFilter`／`DatasourceMetricsRegistrar` を `io.micrometer.core.instrument` へ書き換えるとともに、`docker/server-modernized/configure-wildfly.cli` へ `subsystem=micrometer` の有効化と Prometheus エクスポータ設定を追加する必要がある。運用ドキュメント（`docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md`）も Micrometer 前提に更新すること。
- `module add` は `jakarta.api,jakarta.transaction.api` に更新済みだが、JMS キューや接続ファクトリの CLI 定義が未追加。`java:/queue/dolphin` などの旧設定を WildFly 33 の `messaging-activemq` サブシステムへ登録する設計が未確定。
- `ServletStartup` / `MessagingGateway` は `ManagedScheduledExecutorService` / `ManagedExecutorService` のデフォルト JNDI へ依存しているが、WildFly 33 では `ee-concurrency` サブシステムのリソース名を CLI で明示しなければ一致しないケースがある。再デプロイ時の重複スケジュールやフォールバック動作を監視する仕組みも未整備。
- Undertow へのセキュリティヘッダ適用（`configure-wildfly.cli:24-65`）は実装済みだが、HTTPS 常時化に必要な証明書設定・リバースプロキシ前提の `forwarded` ヘッダ検証は未整理。

## 5. オープンな疑問点・確認依頼

1. Hibernate 6 以降で `string_clob` カスタムタイプが不要になるかを要検証。検証方針と代替案を確定させる必要がある。
2. JMS キュー／トピックの最終的な JNDI 名と永続化方針（クラスタ構成時の HA 要件含む）を関係者に確認する。
3. `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` の記述を WildFly 33 の Micrometer ベースに刷新するタスクオーナーを決定する。
4. `SecondFactorSecurityConfig` が利用する TOTP 暗号キーをどの Secrets 管理（環境変数、Vault 等）で配布しローテーションするかをセキュリティチームと合意し、運用手順を明示する。

他ワーカーは本リストを踏まえ、優先度の高いビルド・設定ギャップから着手すること。更新結果は本ファイルと `PHASE2_PROGRESS.md` に追記すること。
