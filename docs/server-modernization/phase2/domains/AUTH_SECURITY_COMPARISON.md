# 認証・権限・監査実装比較メモ（2025-11-02）

本メモは `server`（旧サーバー）と `server-modernized`（Jakarta EE 10 対応を進めているモダナイズ版）の認証／セッション／MFA／ロール制御／監査ログ実装を静的に比較し、Jakarta EE 10 への移行観点でのギャップと外部依存の課題を整理したものです。

## 1. 認証系コンポーネント対応表

| コンポーネント | 旧サーバー (`server`) | モダナイズ版 (`server-modernized`) | Jakarta EE 10 / WildFly 33 観点 | 課題・次アクション |
| --- | --- | --- | --- | --- |
| リクエストフィルタ（ヘッダ認証） | `server/src/main/java/open/dolphin/rest/LogFilter.java:20-99` は `javax.servlet.*` に依存し、`userName/password` ヘッダを読み取り `UserServiceBean` へ委譲。SysAdmin 固定パスワードを許容し、成功時は `UserCache` へ平文で保存。 | `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java:20-210` は `jakarta.servlet.*` と `jakarta.security.enterprise.SecurityContext` を併用し、Elytron から `Principal` を得られる場合はヘッダ認証をスキップ。ヘッダにフォールバックした場合は WARNING/TODO を出力し、`X-Trace-Id` を MDC (`traceId`) に格納して Micrometer と監査ログの相関 ID を統一。 | `security/ELYTRON_INTEGRATION_PLAN.md` に整理した通り、WildFly 33 Elytron の `http-authentication-factory` 設定が未適用な環境では依然としてヘッダ認証が継続する。`org.jboss.logmanager.MDC` 提供モジュールの整備が必要。 | Elytron 側のセキュリティドメイン設定を確定し、ヘッダベース認証を段階的に無効化。レスポンスにも `X-Trace-Id` を反映し AuditTrailService / SIEM を含むトレース連携を完結させる。 |
| ユーザ／ロール管理 | `server/src/main/java/open/dolphin/session/UserServiceBean.java:19-200` は `@Stateless` EJB。`javax.persistence` に依存し、パスワード照合は平文比較。ロール検査は `isAdmin`/`checkAuthority` に集約。 | `server-modernized/src/main/java/open/dolphin/session/UserServiceBean.java:19-200` は `@ApplicationScoped` + `@Transactional` + `@SessionOperation` へ変更。`jakarta.persistence` へ移行済み。| セッションコンテキストは `SessionOperationInterceptor`（`server-modernized/src/main/java/open/dolphin/session/framework/SessionOperationInterceptor.java:13-76`）でトレースを付与するが、`AuditTrailService` との連携は未整備。 | 認証成功時のロール情報を Elytron/SecurityContext と同期する仕組みを追加。平文パスワード比較が残るため、パスワードハッシュ化と再認証 API の導入を検討。 |
| 2 要素認証（SMS/TOTP/FIDO2） | `server/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java:566-686` と `server/src/main/java/open/dolphin/adm20/session/ADM20_EHTServiceBean.java:678-807` にて SMS OTP の発行と信頼デバイス登録のみ。`PlivoSender` はハードコードされた資格情報を使用（`server/src/main/java/open/dolphin/adm20/PlivoSender.java:10-102`）。 | `server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java:721-879` で TOTP 登録／検証・FIDO2 登録／認証 API を追加。`SecondFactorSecurityConfig`（`server-modernized/src/main/java/open/dolphin/security/SecondFactorSecurityConfig.java:17-59`）は `FACTOR2_AES_KEY_B64` が未設定の場合に起動時例外を投げて Secrets 未配備を検知し、`FACTOR2_AES_KEY` フォールバックを廃止。<br>2025-11-03 追記: `open.dolphin.security.totp.TotpHelper` を再実装し、SMS OTP／TOTP／バックアップキーの生成・検証処理を共通化。Yubico WebAuthn 2.6.0 の段階付きビルダー（`StartRegistrationOptions` / `StartAssertionOptions`）と `com.yubico.webauthn.CredentialRepository` へのパッケージ移動、`RegistrationResult#getAttestationType()` の非 Optional 化に追従。 | `common` モジュールの `Factor2*` エンティティは `javax.persistence` のまま（例: `common/src/main/java/open/dolphin/infomodel/Factor2Credential.java:5-120`）。Secrets 管理フロー（Vault / CI 変数配布）はドキュメント化途上で、検証環境でのキー配布が未整備。 | ① `common` のエンティティ／`persistence.xml` を `jakarta.persistence` へ置換（継続タスク）。② `FACTOR2_AES_KEY_B64` 配布とローテーション手順を Ops Runbook および本メモに反映し、環境変数未設定時はデプロイを中止。③ FIDO2 / TOTP の監査ログに MDC `traceId` を継承させる。④ Totp 秘密鍵と SMS 一時コードの監査ログを統合し、Secrets 差替え時の検証パスを追加。 |
| SMS ゲートウェイ | `server/src/main/java/open/dolphin/adm20/PlivoSender.java:15-102` は `com.plivo.helper` v3 系を利用し、OkHttp 依存なし。資格情報を定数として埋め込み。 | `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java:15-204` は `plivo-java` 5.46.0 と OkHttp 5.2.1 を利用し、`OkHttpClient.Builder` に `Duration` ベースのタイムアウト（接続 10 秒 / 読み・書き 30 秒 / 呼び出し全体 45 秒）と TLS1.2/1.3 の `ConnectionSpec` を設定。資格情報は `SmsGatewayConfig`（`server-modernized/src/main/java/open/dolphin/msg/gateway/SmsGatewayConfig.java:24-203`）経由で環境変数／`custom.properties` から取得。 | BOM で OkHttp 5.2.1 を統一したものの、WildFly 側 TLS ポリシーとの整合や Micrometer のメトリクステンプレートとの統合は未整理。 | `DEPENDENCY_UPDATE_PLAN.md` にタイムアウト・TLS 初期値を記載し、Plivo 接続の監視指標を定義。API キーの Secret 配布と TLS 証明書検証ポリシーを `operations` / `security` ドキュメントへ追記する。 |
| 監査ログ | 旧サーバーに `AuditTrailService` 相当の実装はなし。操作追跡はサーバーログ依存。 | `AuditTrailService`（`server-modernized/src/main/java/open/dolphin/security/audit/AuditTrailService.java:20-85`）が SHA-256 チェーン付き監査レコードを `AuditEvent` に永続化。REST 層から `recordAudit` を呼び出し（`server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java:743-878`）。 | `AuditEvent` エンティティは `javax.persistence`（`common/src/main/java/open/dolphin/infomodel/AuditEvent.java:5-65`）のまま。`persistence.xml` も `javax.persistence.schema-generation.*` プロパティを利用。Jakarta Persistence 3.x で破棄される設定となっている。 | `common` エンティティと `persistence.xml` の名前空間／プロパティを更新し、Hibernate 6 の Identity Strategy を検証。監査イベントの署名検証ポリシーをドキュメント化。 |
| 外部メッセージング（CLAIM 送信） | `MessageSender` MDB がコメントアウトされ、非同期送信は無効化（`server/src/main/java/open/dolphin/session/MessageSender.java:1-106`）。CLAIM 送信はクライアント主体。 | `MessagingGateway`（`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java:21-94`）が `ManagedExecutorService` を介して非同期送信し、`ExternalServiceAuditLogger` で連携ログを残す。 | WildFly 33 で `managed-executor-service` の JNDI 名を CLI で登録していないため、実行時に `ManagedExecutorService` が `null` となる可能性。Micrometer 移行未対応の `RequestMetricsFilter` を RESTEasy プロバイダとして登録済み。 | `configure-wildfly.cli` に EE Concurrency サブシステム設定を追加し、非同期プールのガバナンスと監査ログの永続化先を定義。Micrometer ベースのメトリクスへ移行するタスクと合わせて扱う。 |

## 2. API / 設定差分まとめ

- **2FA API 強化**  
  - 旧サーバーの `PUT /20/adm/factor2/code` 等は SMS OTP 発行に限定（`server/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java:565-686`）。  
  - モダナイズ版は TOTP / FIDO2 登録・検証エンドポイントを追加（`server-modernized/src/main/java/open/dolphin/adm20/rest/AdmissionResource.java:721-879`）。監査ログを `AuditTrailService` へ送信するよう変更。

- **RESTEasy 構成**  
  - `web.xml` は両環境とも `resteasy.resources` の静的列挙だが、モダナイズ版では `RequestMetricsFilter` をプロバイダに追加（`server-modernized/src/main/webapp/WEB-INF/web.xml:49-55`）。Servlet / CDI スキーマは旧 `java.sun.com` のままで、Servlet 6 / CDI 4 のスキーマに更新が必要。

- **beans.xml**  
  - `beans.xml` が `beans_1_0.xsd` のまま（`server-modernized/src/main/webapp/WEB-INF/beans.xml:1-4`）。Jakarta CDI 4.1 では `beans_4_0.xsd` への置換が推奨される。

- **WildFly CLI 設定**  
  - モダナイズ版 CLI は HTTPS リダイレクトやセキュリティヘッダを追加（`ops/modernized-server/docker/configure-wildfly.cli:40-77`）。ActiveMQ/JMS、EE Concurrency、Micrometer など Jakarta EE 10 で要求されるサブシステム設定は未整備。

- **Docker ビルド**  
  - 両 Dockerfile で Hibernate 5.0.10 の `StringClobType` 互換 JAR を生成し WAR へバンドルしている（`ops/modernized-server/docker/Dockerfile:18-61`）。Jakarta EE 10 では Hibernate ORM 6 系への移行と互換 JAR 撤廃が前提。

## 3. Jakarta 対応課題とブロッカー

1. **共通モジュールの Jakarta 化**  
   - `common` の `pom.xml` は Java 8 / Java EE 7 依存（`common/pom.xml:17-55`）。Jakarta EE 10 互換 API を利用するため、`jakarta.*` 依存と Java 17 のコンパイルターゲットへ更新する必要がある。
2. **Persistence 設定のアップグレード**  
   - `common/src/main/resources/META-INF/persistence.xml` と `server-modernized/src/main/resources/META-INF/persistence.xml` は `xmlns.jcp.org`／`persistence_2_2.xsd` を参照し、`javax.persistence.*` プロパティを使用。Jakarta Persistence 3.1 用スキーマと `jakarta.persistence.schema-generation.*` などのキーへ置換する。
3. **Elytron 連携と認証方式の刷新**  
   - `LogFilter` がヘッダベース認証に依存しているため、WildFly 33 の Elytron または Jakarta Security (JASPIC) を使ったモダンな認証フロー（JWT / OAuth2 / Mutual TLS 等）へ変更する設計が必要。現行の平文パスワード移送では監査要件を満たせない。
4. **非同期処理インフラの整備**  
   - `MessagingGateway` が `ManagedExecutorService` を利用するが、`configure-wildfly.cli` で EE Concurrency サブシステムを定義していない。WildFly の `ee-concurrency` 設定追加と、トレース ID 連携の検証が求められる。
5. **監査ログ基盤の統合**  
   - `AuditTrailService` は `AuditEvent` エンティティの `javax.persistence` 依存に引きずられる。Jakarta 化が完了するまでビルドが混在しており、ランタイムで `ClassCastException` が発生する恐れがあるため、共通モジュールの先行移行がブロッカー。
6. **Micrometer への移行**  
   - `RequestMetricsFilter` が MicroProfile Metrics API 3.0 を提供（`server-modernized/src/main/java/open/dolphin/metrics/RequestMetricsFilter.java`）しているが、WildFly 33 では Micrometer が標準。Elytron でのメトリクス露出や認証連携に影響するため早期対応が必要。

## 4. リスクと推奨アクション

1. **Elytron 未統合のまま Jakarta EE 10 へ移行すると、WildFly 33 のセキュリティドメインとの一貫性が保てず、ヘッダ改ざんで認証を突破されるリスクが高い。**  
   → 認証方式（Bearer Token / Form / ClientCert）の要件を決め、`LogFilter` を廃止して Elytron セキュリティドメインと Jakarta Security を採用する設計レビューを実施。

2. **MFA シークレットの開発用フォールバックキーが有効なままだと、外部から TOTP シークレットが推測可能。**  
   → `SecondFactorSecurityConfig` 用の本番キー配布手順（Secrets Manager など）とバリデーションチェックを CI に追加し、デフォルトキーを削除する。

3. **外部依存の未登録によりビルド時例外が発生する可能性。**  
   → `okhttp3` の追加と Plivo SDK バージョン整合を `pom.server-modernized.xml` と BOM で確定し、`DEPENDENCY_UPDATE_PLAN.md` に沿って更新。`com.yubico:webauthn-server-*` も 2.6.0 へ引き上げる。

4. **監査ログの `javax.persistence` 残存により Jakarta Persistence 3.1 でデプロイ不可となる。**  
   → `common` の Jakarta 化を最優先タスクとして `JAKARTA_EE10_GAP_LIST.md` の優先度 High 項目に沿って実施し、Hibernate ORM 6 での動作検証を行う。

5. **非同期メッセージ送信が実行時に同期送信へフォールバックし、レスポンス遅延・例外が顧客操作へ伝播する。**  
   → WildFly 33 の `ee-concurrency` 設定と回線断時のリトライ／サーキットブレーカを `MessagingGateway` に実装し、監査ログと連動させる。

## 付録: 外部依存の確認メモ

- `plivo-java` 5.46.3 は Maven Central にないため、`DEPENDENCY_UPDATE_PLAN.md` で示された通り 5.46.0 への後退または社内リポジトリ登録が必要。
- `com.squareup.okhttp3:okhttp` は `PlivoSender` が直接利用しているが依存未宣言。BOM に登録し、WildFly 33 の TLS ポリシーと整合を取る。
- `com.yubico:webauthn-server-*` は 2.6.0 へ更新済み。段階付きビルダー導入に伴うコード追従と登録／認証フローの回帰テストを継続する。

---

本メモで整理したギャップは `JAKARTA_EE10_GAP_LIST.md` のビルド／設定カテゴリ（特に共通モジュールの Jakarta 化、Jakarta Persistence 3.1 対応）と整合している。追加で判明した Elytron 連携・MFA キー管理・非同期処理設定については次回レビュー時に同リストへ登録する。
