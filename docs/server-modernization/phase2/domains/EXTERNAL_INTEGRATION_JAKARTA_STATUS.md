# 外部連携 Jakarta EE 10 対応状況（更新日: 2025-11-02）

本資料は、外部連携モジュール（ORCA/Lab/HL7、二要素認証、SMS、PDF 署名など）における Jakarta EE 10 への移行状況を整理し、旧 `javax.*` API からの置換や依存ライブラリ更新・設定差分を俯瞰することを目的とする。静的解析ベースの確認結果であり、実行検証は行っていない。

## 1. 連携先別差分マトリクス

| 連携対象 | 主な実装/参照ファイル | 現状 (`javax.*` 利用を含む) | 差分・懸念点 | 優先度 |
| --- | --- | --- | --- | --- |
| ORCA レセ電／保険請求／JMS | `server-modernized/src/main/java/open/dolphin/msg/*`<br>`server-modernized/src/main/java/open/dolphin/session/ScheduleServiceBean.java`<br>`common/src/main/java/open/dolphin/converter/PlistParser.java` / `PlistConverter.java`<br>`docker/server-modernized/configure-wildfly.cli` | `ScheduleServiceBean` などは `jakarta.jms` へ移行済み。`common` の plist 変換も `jakarta.mail.*`／Jakarta Persistence へ置換済みで、`common/pom.xml` は Jakarta API を参照。 | ActiveMQ Artemis 用の JMS リソースが CLI に未定義のため、サーバー起動後に `ObjectMessage` を送る経路が成立しない。WildFly CLI にキュー定義を追加し、App サーバー再起動時の `java:/queue/dolphin` バインドを確認する必要がある。保険請求メッセージは Velocity 生成のままなので Jakarta 化によるフォーマット差は無し。 | High |
| 検査機器／HL7（Falco、ORCA 取込） | `client/src/main/java/open/dolphin/impl/falco/HL7Falco.java`<br>`common/src/main/java/open/dolphin/common/OrcaAnalyze.java`<br>`common/src/main/java/open/dolphin/infomodel/*` | 解析・生成処理は JDK 標準の `javax.xml.parsers` / `javax.xml.transform` を使用。モデル層は `javax.persistence.*` アノテーション（`common/src/main/java/open/dolphin/infomodel`）に依存。 | XML API は Java SE で引き続き `javax` 名称のため大きな変化は無いが、JPA アノテーション移行のため `jakarta.persistence.*` へ全置換が必要。Swing 資産と共有しているため、一括変換時の互換テストが必須。 | High |
| FIDO2 / WebAuthn（二要素認証） | `server-modernized/src/main/java/open/dolphin/adm20/session/ADM20_EHTServiceBean.java`<br>`server-modernized/src/main/java/open/dolphin/security/fido/Fido2Config.java` | `com.yubico:webauthn-server-*` 2.6.0 を採用。`RelyingParty.builder()` に `Set<String>` の `origins` を渡し、Jackson でシリアライズ。 | 2.6.x で `StartRegistrationOptions`／`FinishRegistrationOptions` の段階付きビルダーが導入され、除外クレデンシャルは `CredentialRepository` 側で自動処理となった。 | Medium |
| Plivo SMS／外部通知 | `server-modernized/src/main/java/open/dolphin/adm20/PlivoSender.java`<br>`server-modernized/src/main/java/open/dolphin/msg/gateway/SmsGatewayConfig.java`<br>`server-modernized/pom.xml` | POM で `com.plivo:plivo-java:5.46.3`（未公開版）を指定。SDK 内部は Retrofit 2.2.0 と OkHttp 4.12.0 を利用。`PlivoSender` では `OkHttpClient.Builder` と TLS 設定を直接制御。 | 公開されている最新版は 5.46.0。OkHttp 5.2.1 へ上げる場合、`logging-interceptor` も 5 系へ揃えないと `NoSuchMethodError` が発生する。`connectionSpecs(Arrays.asList(...))` は 5 系でも動作するが、HTTP/2 既定化に伴いタイムアウト初期値が異なるため再検証が必要。MIT ライセンス継続。 | High |
| PDF 署名／帳票 | `server-modernized/src/main/java/open/dolphin/reporting/PdfSigningService.java`<br>`server-modernized/src/main/java/open/dolphin/reporting/SigningConfig.java`<br>`server-modernized/pom.xml` | OpenPDF 3.0.0 と BouncyCastle 1.82 を BOM 管理。`PdfSigningService` は `PdfPKCS7` + `Signature(SHA256withRSA)` による独自実装へ置換済み。 | OpenPDF 3.x は `org.openpdf.*` パッケージへ移行し、旧 `MakeSignature` ヘルパーが削除されたため署名処理を内製化した。LGPL/MPL 告知を ops 手順に追加し、将来のメジャー更新時はデジタル署名の互換テスト必須。 | Medium |
| FHIR API | （実装無し。`docs/web-client/architecture/REST_API_INVENTORY.md` の将来計画のみ） | FHIR 連携コードは未着手。既存 REST リソースは MML/ORCA 用のみ。 | ORCA 由来のモデルを転用する場合は JPA 変換と JSON シリアライザの再設計が必要。FHIR 実装を開始する前に `jakarta.ws.rs` ベースのエンドポイント雛形を用意する。 | Low |

## 2. 依存更新必要性（差分と影響）

| ライブラリ | 定義箇所 | 現行 | 指摘事項と影響 | 推奨対応 |
| --- | --- | --- | --- | --- |
| OkHttp | `server-modernized/pom.xml`（未定義） / `PlivoSender` で直接使用 | 未固定（Plivo SDK 内で 4.12.0 を transitively 取得） | SDK 付属の OkHttp 4 系とアプリで想定する 5 系が混在するとクラスロード失敗が発生。TLS 1.3 強制、`HandshakeCertificates` 等 5 系 API を利用する予定なら明示依存が必須。 | BOM に `com.squareup.okhttp3:okhttp-bom:5.2.1` を追加し、`okhttp` / `logging-interceptor` を 5.2.1 で明示。Plivo SDK 側の依存を `dependencyManagement` で上書き。 |
| Plivo Java SDK | `server-modernized/pom.xml` | 5.46.3（未公開版指定） | Maven Central の最新版は 5.46.0。5.46.3 はビルド失敗につながる。SDK は MIT License。 | 公開済みバージョン 5.46.0 へ後退するか、社内リポジトリに 5.46.3 を登録する手続きを Worker 0 へ依頼。 |
| Yubico WebAuthn | `server-modernized/pom.xml` | 2.6.0 | 2.6.x で `cose-java` 除去・`yubico-util` 更新が継続。段階付きビルダー対応と AppID 廃止方針を追跡する必要あり。 | コードを 2.6.0 API に追従済み。今後の更新では登録・認証・タイムアウトシナリオの自動テストを整備する。 |
| OpenPDF | `server-modernized/pom.xml` | 3.0.0 | 3.x 系で `org.openpdf.*` へ移行し、`MakeSignature` が削除されたため独自署名ロジックの保守が必要。 | 3.0.0 を基準に署名フローの回帰テストを整備し、後続のマイナー更新は `PdfSigningService` の互換確認後に反映する。 |
| BouncyCastle (bcprov/bcpkix) | `server-modernized/pom.xml` | 1.82 | 1.8x 系で TLS1.3 / OCSP の脆弱性修正が継続。FIPS ビルドは別アーティファクト。 | 1.82 を基準に四半期レビューを継続し、FIPS 要件が発生したら `bctls-fips` への切替案を提示する。 |
| commons-codec | `common/pom.xml` | 1.10 | Java 17 対応が不十分で CVE-2021-37533 などが未修正。`HL7Falco` などで Base64 利用。 | 1.17.x へ更新し、Swing 側も含めて回帰テスト。 |
| Jakarta Mail API | 未定義（`common` は `javax.mail` へ依存） | なし | `PlistParser`/`PlistConverter` で MIME エンコードを使用。Jakarta Mail 2.1 以降へ移行しないと Jakarta EE 10 環境で互換層が必要になる。 | `jakarta.mail:jakarta.mail-api:2.1.3` を `provided` 追加し、`MimeUtility` 呼び出しを検証。 |

## 3. 未移植項目と優先度

- **High**
  - `common/pom.xml` を Jakarta BOM 化し、`javax:javaee-api` を撤廃。JPA/JMail 名前空間置換を段階的に実施する。
  - ActiveMQ Artemis 用 JMS リソースを CLI へ追加し、`MessagingGateway`／`ScheduleServiceBean` の `@Resource` を復活させる。
  - Plivo SDK バージョン齟齬を是正し、OkHttp 5.2.1 + TLS 検証を本番相当で確認する。

- **Medium**
  - Yubico 2.6.0 への更新後、`ADM20_EHTServiceBean` の登録／認証フローで `AssertionFailedException` の扱いが変わらないか検証する。
  - OpenPDF 3.0.0 反映と同時に `docs/server-modernization/reporting/LICENSE_COMPATIBILITY.md` のバージョン表を更新する。
  - `HL7Falco` 等で参照する `commons-codec` 更新に伴い、Swing クライアント側のビルド互換性を調査する。

- **Low**
  - FHIR 連携の実装計画を `REST_API_INVENTORY.md` に追記し、新規エンドポイントが `jakarta.ws.rs` ベースで設計されるよう雛形を提示する。
  - `client` 側の JAX-RS デリゲータ（`client/src/main/java/open/dolphin/delegater/*`）の `javax.ws.rs.*` 置換は Swing 資産再構築時に一括対応する。

### JMS 設定ドラフト（WildFly 33）

以下は `docker/server-modernized/configure-wildfly.cli` に追記する想定のサンプル。`queue/dolphin` の JNDI 名と `java:/JmsXA` の統合リソースを定義し、MDB 復旧に備える。

```cli
if (outcome != success) of /subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:read-resource()
    /subsystem=messaging-activemq/server=default/jms-queue=dolphinQueue:add(entries=["java:/queue/dolphin","java:jboss/exported/jms/queue/dolphin"], durable=true)
end-if
if (outcome != success) of /subsystem=messaging-activemq/server=default/pooled-connection-factory=JmsXA:read-resource()
    /subsystem=messaging-activemq/server=default/pooled-connection-factory=JmsXA:add(entries=["java:/JmsXA"], connectors=["in-vm"], transaction="xa")
end-if
```

## 4. ライセンス対応メモ

- **OpenPDF 3.0.0**（LGPL 2.1 / MPL 1.1 デュアルライセンス）: WAR 配布時にソース入手方法の告知が必要。`docs/server-modernization/reporting/LICENSE_COMPATIBILITY.md` と `NOTICE` の整合を保つ。
- **BouncyCastle 1.82**（Bouncy Castle License）: 追加義務はないが、定期更新ポリシーを SRE/セキュリティチームと共有。
- **Plivo Java SDK 5.46.x**（MIT）: NOTICE 追記不要。バージョン差異がある場合は社内配布の根拠を必ず明示。
- **Yubico WebAuthn 2.5.x**（Revised BSD 2-clause）: バイナリ再配布時はライセンス文面を同梱。`LICENSE` に追加済みか要確認。
- **OkHttp 5.x**（Apache-2.0）: NOTICE に依存先のクレジットを残す。BOM へ組み込む際は `LICENSE` の更新が必要。

## 5. フォローアップ

- 依存ギャップの指摘内容は Worker 0 ドキュメント（依存/BOM 管理担当）へ伝達し、Plivo SDK の取得方針と JMS 設定タスクのアサインを依頼する。
- 本資料の更新は `PHASE2_PROGRESS.md` の週次レビューで共有し、対応完了時に各行へ ✅ を付与する運用とする。
