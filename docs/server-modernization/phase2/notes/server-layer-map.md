# server-modernized レイヤー別パッケージマップ（2026-06-14 更新）

## 作業範囲
- 対象: `server-modernized/src/main/java/open.*`。`rg --files server-modernized/src/main/java/open | sed 's@/[^/]*$@@' | sort -u` で 38 パッケージ（`open.dolphin.*`, `open.orca.rest`, `open.stamp.seed` など）を棚卸し。
- `jakarta/` および `META-INF/` 配下は Jakarta EE 設定のみのため除外。
- 表の「主な依存先 / 備考」列に、直接 import している層や循環依存の気づきを追記した。

## 5層分類サマリー

### REST / API レイヤー

| パッケージ | 代表クラス | 主な責務 | 主な依存先 / 備考 |
| --- | --- | --- | --- |
| `open.dolphin.rest`, `open.dolphin.rest.dto` | `KarteResource`, `PatientResource`, `LogFilter`, `RequestMetricsFilter`, `DemoAspResponses` | Web クライアント／外部連携向け JAX-RS エンドポイントと DTO。フィルタで Trace-ID・Micrometer タグを設定し、`session` Bean へ委譲。 | `open.dolphin.session.*`, `session.support`, `metrics`, `security.audit`。`LogFilter` が `mbean.UserCache` を参照するためインフラ層にも依存。 |
| `open.dolphin.touch`（`converter/`, `dto/`, `module/`, `patient/`, `patient.dto/`, `stamp/`, `support/`, `user/`） | `DolphinResource`, `JsonTouchResource`, `TouchRequestContextExtractor`, `TouchAuthHandler` | Touch/タブレット向け REST。Touch 専用 DTO/ビルダーが API 応答を構成。`TouchRequestContextExtractor` が `LogFilter` のリクエスト属性から Trace-ID を取得。 | `open.dolphin.session`, `touch.session`, `open.dolphin.rest.LogFilter`。`touch.converter` を `session` が import しており層間逆依存が継続。 |
| `open.dolphin.adm10.rest`, `open.dolphin.adm10.converter` | `JsonTouchResource`, `AbstractStampTreeBuilder`, `JSONStampBuilder` | ADM10（旧 iOS/EHT）向け REST と DTO。レガシースタンプの JSON 生成。 | `open.dolphin.adm10.session`, `open.dolphin.touch.converter`。ADM10/Touch の仕様差分がセッション層へ漏れている。 |
| `open.dolphin.adm20.rest`, `open.dolphin.adm20.rest.support`, `open.dolphin.adm20.converter`, `open.dolphin.adm20.dto` | `AdmissionResource`, `PHRResource`, `PhrRequestContextExtractor`, `IOSHelper`, `Phr*Dto` | ADM20/PHR 向け REST と DTO。`PhrRequestContextExtractor` が HTTP Trace を監査用 `PhrRequestContext` へ変換。 | `open.dolphin.adm20.session`, `adm20.support`, `open.dolphin.session`, `security.audit`。`LogFilter` の属性と `X-Trace-Id` ヘッダに依存。 |
| `open.dolphin.touch.session` | `EHTServiceBean`, `IPhoneServiceBean` | Touch API 専用のアプリケーションサービス。REST から直接 CDI される。 | `open.dolphin.session`, `touch.converter`。REST ↔ セッションを跨いだ密結合の温床。 |
| `open.orca.rest` | `OrcaResource`, `ORCAConnection`, `StringTool` | ORCA レセプト HTTP 連携。REST API から外部システムへ送信するブリッジ。 | `open.dolphin.msg`, `okhttp3`。ADM/PHR 系サポートクラスから直接呼ばれる。 |

### セッション / アプリケーションレイヤー

| パッケージ | 代表クラス | 主な責務 | 主な依存先 / 備考 |
| --- | --- | --- | --- |
| `open.dolphin.session`, `open.dolphin.session.support` | `KarteServiceBean`, `ChartEventServiceBean`, `MessageSender`, `ChartEventStreamPublisher` | JPA/EJB による業務処理、SSE 配信、JMS 受信。`session.support` が SSE の属性キーやブロードキャスト抽象を提供。 | `open.dolphin.infomodel`, `open.dolphin.msg`, `open.dolphin.touch.converter`, `session.framework`。`touch.converter` への依存が REST 層との循環原因。 |
| `open.dolphin.session.framework` | `SessionOperationInterceptor`, `SessionTraceManager`, `SessionServiceException` | セッション呼び出しのトレース文脈開始/終了と例外ラップ。HTTP Trace-ID が無い場合は独自 ID を生成。 | `org.jboss.logmanager.MDC`, `org.slf4j.MDC`。`msg.gateway` からも呼ばれ層間循環を生む。 |
| `open.dolphin.adm10.session` | `ADM10_EHTServiceBean`, `ADM10_IPhoneServiceBean` | ADM10 (Legacy) 用サービス。Touch 互換 DTO に変換して返却。 | `open.dolphin.adm10.converter`, `open.dolphin.session`。 |
| `open.dolphin.adm20.session` | `ADM20_AdmissionServiceBean`, `PHRAsyncJobServiceBean` | ADM20/PHR 用業務ロジック。PHR エクスポート・SMS 送信など Async 指示をまとめる。 | `open.dolphin.adm20.support`, `open.dolphin.adm20.export`, `open.dolphin.msg.gateway`. |
| `open.dolphin.adm20.support` | `PhrDataAssembler` | PHR 向けデータ組立。ORCA や `ADM20_PHRServiceBean` を束ねて JSON/ハッシュを生成。 | `open.dolphin.adm20.session`, `open.orca.rest.ORCAConnection`, `open.dolphin.adm20.converter`. |
| `open.dolphin.session.VitalServiceBean` | `VitalServiceBean` | バイタル CRUD を担当する予定だった Bean。 | `@Vetoed` を付与し CDI から除外（2026-06-15）。REST/Touch での利用予定が固まるまではソースのみ保持。 |

### メッセージング / インフラレイヤー

| パッケージ | 代表クラス | 主な責務 | 主な依存先 / 備考 |
| --- | --- | --- | --- |
| `open.dolphin.msg`, `open.dolphin.msg.dto` | `ClaimSender`, `DiagnosisSender`, `OidSender`, `AccountSummaryMessage` | CLAIM/MML 電文生成と送信。DTO インタフェースでセッション層の `AccountSummary` 実装に橋を架ける。 | `open.dolphin.infomodel`, `Velocity`。`AccountSummary` が `msg.dto` を実装し、依存方向を一部逆転させている。 |
| `open.dolphin.msg.gateway` | `MessagingGateway`, `MessagingConfig`, `ExternalServiceAuditLogger`, `SmsGatewayConfig` | JMS エンキュー、外部送信フォールバック、監査ログ出力、SMS ゲートウェイ設定。 | `jakarta.jms`, `open.dolphin.session.framework.SessionTraceManager`。Trace 取得のためセッション層への逆参照が発生し循環に。 |
| `open.dolphin.metrics` | `RequestMetricsFilter`, `MeterRegistryProducer`, `DatasourceMetricsRegistrar` | Micrometer ベースのリクエスト／DB メトリクス。JAX-RS フィルタとして API 層に差し込む。 | `io.micrometer.core.instrument`, `jakarta.ws.rs`. Trace-ID タグは HTTP レイヤー依存。 |
| `open.dolphin.infrastructure.concurrent` | `ConcurrencyResourceNames` | Jakarta Concurrency リソース名を集中管理するユーティリティ。 | `jakarta.enterprise.concurrent`。設定値を共有するのみで他層からの依存は無い。 |
| `open.dolphin.mbean` | `ServletStartup`, `ServletContextHolder`, `UserCache`, `PVTBuilder`, `PvtService`, `InitialAccountMaker` | WildFly MBean/サービス。ServletContext やユーザーキャッシュ、PVT 生成ツールをグローバル公開。 | `open.dolphin.rest.LogFilter` が `UserCache` にアクセス。`ServletContextHolder` は AsyncContext を直接晒し、SpotBugs 未解決 32 件（EI_EXPOSE）に含まれる。 |
| `open.dolphin.adm20.export` | `PHRExportJob`, `PHRExportConfig` | PHR データの抽出・ファイル出力ジョブ。 | `open.dolphin.adm20.session`, `open.dolphin.msg`. 永続レイヤーとの境界上にあるため重複記載。 |
| `open.dolphin.adm20`（root） | `PlivoSender`, `SMSException` | Plivo SMS を用いた外部通知ラッパー。Trace を監査ログへ転記。 | `open.dolphin.msg.gateway.SmsGatewayConfig`, `open.dolphin.session.framework.SessionTraceManager`. |
| `open.orca.rest` | `ORCAConnection` | ORCA 連携 HTTP クライアント（API 列にも記載）。 | `okhttp3`, `net.sf.json`. ADM/PHR サポートから直接呼ばれる。 |
| `open.stamp.seed` | `CopyStampTreeBuilder`, `CopyStampTreeDirector` | レガシースタンプ XML の組立と JMS 配信用 DTO 生成。 | `open.dolphin.msg`, `open.dolphin.session`. Mutable コレクションを公開しており SpotBugs 32 件に含まれる。 |

### セキュリティ / 監査レイヤー

| パッケージ | 代表クラス | 主な責務 | 主な依存先 / 備考 |
| --- | --- | --- | --- |
| `open.dolphin.security` | `SecondFactorSecurityConfig`, `HashUtil` | TOTP/FIDO2 の設定／秘密情報ユーティリティ。 | `jakarta.enterprise`, `java.security`. DTO の防御的コピーが進行中。 |
| `open.dolphin.security.audit` | `AuditTrailService`, `AuditEventPayload` | 監査イベント永続化とチェーンハッシュ。 | `jakarta.persistence`, `open.dolphin.session.framework.SessionTraceManager`. |
| `open.dolphin.security.fido` | `Fido2Config` | FIDO2 サーバー設定ローダ。 | `open.dolphin.security.SecondFactorSecurityConfig`. |
| `open.dolphin.security.totp` | `TotpSecretProtector`, `BackupCodeGenerator` | TOTP シークレットとバックアップコード生成/保管。 | `javax.crypto`, `open.dolphin.security`. |
| `open.dolphin.adm20.mbean` | `IdentityService`, `LayerConfig` | Layer Identity Token 発行。REST フィルタを通らないエンドポイントの認証責務を担う。 | `open.dolphin.adm20.rest`. Trace-ID は HTTP 層から受け取らない。 |

### ストレージ / 永続レイヤー

| パッケージ | 代表クラス | 主な責務 | 主な依存先 / 備考 |
| --- | --- | --- | --- |
| `open.dolphin.reporting` | `PdfRenderer`, `PdfDocumentWriter`, `SigningConfig`, `PdfSigningService` | 帳票テンプレートのレンダリング、PDF 生成、署名。 | `OpenPDF`, `BouncyCastle`, `open.dolphin.msg`. `SigningConfig` などが SpotBugs mutability 対象。 |
| `open.dolphin.system.license` | `FileLicenseRepository`, `LicenseRepository` | `license.properties` の読み書き。 | `java.io`, `java.util.Properties`. REST `SystemResource` が直接呼び出し API 層から FS へアクセスしている。 |
| `open.dolphin.adm20.export` | `PHRExportJob`, `PHRExportConfig` | PHR エクスポートのファイル生成と配置。 | `java.nio.file`, `open.dolphin.adm20.session`. Messaging 表にも記載済み。 |
| `open.stamp.seed` | `CopyStampTreeBuilder`, `CopyStampTreeDirector` | スタンプ XML 永続化および配信準備。 | `open.dolphin.msg`. インフラ／ストレージ両観点で監視対象。 |

### 相互依存と既知課題
- `touch.converter` を `session`/`adm10.session`/`adm20.session` が import しており、REST/API ↔ セッションの循環が解消されていない。共通 DTO 抽出または REST core モジュール化が必要。
- `msg.gateway.MessagingGateway` が `SessionTraceManager` を注入し、逆に `session.MessageSender` が `msg.*` を呼び出すことで Messaging ↔ セッション間に循環が残る。Trace API を独立レイヤー化するか、イベントバス経由で相互依存を断つ必要がある。
- `mbean.UserCache#getMap()` が `ConcurrentHashMap` を生公開し、`rest.LogFilter` が直接書き換える。SpotBugs 残 32 件（JMS/MBean）に該当。キャッシュ API の抽象化と防御的コピーが必須。
- `system.license.FileLicenseRepository` を REST `SystemResource` が直呼びしており、API 層からファイルシステムへのアクセス責務が漏れている。ライセンス管理サービス層の新設を要検討。
- `open.dolphin.session.VitalServiceBean` は `@Vetoed` 化し CDI ビルド対象から除外済み。利用再開時は REST/API 側の要求仕様を確定させた上で注入対象へ戻す。
- `identityToken` エンドポイントは `LogFilter`／`RequestMetricsFilter` を通らず、`adm20.mbean.IdentityService` から直接 JWT を発行するため Trace-ID／監査情報が欠落。フィルタ適用または `SessionTraceManager` 連携の導線が求められる。
