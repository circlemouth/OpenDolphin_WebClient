# server-modernized レイヤー別パッケージマップ（2026-06-09 更新）

## 作業範囲
- 対象: `server-modernized/src/main/java` 配下の `open.*` パッケージ。
- `jakarta/` および `META-INF/` は Jakarta EE 設定リソースのみのため一覧から除外。
- 代表クラスは外形把握を目的に目視で抽出した。

## レイヤー別サマリー

### REST / API レイヤー

| パッケージ | 代表クラス | 主な責務 | 備考 |
| --- | --- | --- | --- |
| `open.dolphin.rest` | `KarteResource`, `PatientResource`, `LogFilter` | カルテ・患者・スタンプ等の JAX-RS API。セッション層 Bean を注入し、`open.dolphin.converter` 経由で DTO 化する。 | SSE (`ChartEventStreamResource`) や監査 (`AuditTrailService`) を利用。`LogFilter` がリクエストトレースを設定。 |
| `open.dolphin.touch` | `DolphinResource`, `JsonTouchResource`, `TouchAuthHandler` | タブレット／Touch クライアント向け REST API。タッチ専用 DTO/ビルダー群（`converter/`, `dto/`, `module/`, `patient/`, `stamp/`, `support/`）を束ねる。 | `open.dolphin.session` の Bean を直接呼び出し、`SessionTraceManager` 経由でトレース連携。 |
| `open.orca.rest` | `OrcaResource`, `ORCAConnection` | ORCA レセプトシステムへの HTTP/JSON 連携エンドポイント。 | `StringTool` で ORCA 固有の文字列整形。 |
| `open.dolphin.adm10.rest` | `JsonTouchResource`, `AbstractStampTreeBuilder` | ADM10 系（旧 iOS クライアント）向け REST。タッチ系と共通のスタンプ構築ヘルパーを提供。 | `adm10/converter` のインタフェースを使用。 |
| `open.dolphin.adm20.rest` | `DolphinResourceASP`, `TouchAuthHandler` | ADM20 系（新 Touch/ASP）向け REST。`support/` 経由で認証・監査補助を行う。 | `adm20/dto`・`support` と密結合。 |

### セッション / アプリケーションレイヤー

| パッケージ | 代表クラス | 主な責務 | 備考 |
| --- | --- | --- | --- |
| `open.dolphin.session` | `KarteServiceBean`, `UserServiceBean`, `ChartEventServiceBean` | JPA/EJB を利用した業務ロジック。カルテ取得、スタンプ保存、患者管理、イベント配信、メッセージング指示などを担当。 | `MessagingGateway` や `ServletContextHolder` を注入。`touch.converter` インタフェースを直接参照。 |
| `open.dolphin.session.framework` | `SessionOperationInterceptor`, `SessionTraceManager`, `SessionServiceException` | セッション層呼び出しのトレース文脈管理と共通例外ハンドリング。 | `@SessionOperation` アノテーションで各 Bean に適用。 |
| `open.dolphin.touch.session` | `EHTServiceBean`, `IPhoneServiceBean` | Touch クライアント固有のセッションサービス。`open.dolphin.session` をラップしつつ、タッチ DTO へ適合させる。 | `touch.support.TouchAuditHelper` と連携。 |
| `open.dolphin.adm10.session` | `ADM10_EHTServiceBean`, `ADM10_IPhoneServiceBean` | ADM10 向けレガシーサービス層。iOS/EHT 用のラッパーを提供。 | `adm10/converter` インタフェースへの依存が強い。 |
| `open.dolphin.adm20.session` | `ADM20_AdmissionServiceBean`, `PHRAsyncJobServiceBean` | ADM20/PHR 機能向けサービス。入院・PHR 非同期処理の集約。 | `adm20/export`, `adm20/support` と連携。 |

### メッセージング / 外部接続

| パッケージ | 代表クラス | 主な責務 | 備考 |
| --- | --- | --- | --- |
| `open.dolphin.msg` | `ClaimSender`, `DiagnosisSender`, `MMLHelper` | CLAIM/MML 生成と送信ロジック。Velocity テンプレートで電カルデータを HL7/MML 形式へ変換。 | `OidSender` は `session.AccountSummary` を参照し施設 OID を決定。 |
| `open.dolphin.msg.gateway` | `MessagingGateway`, `MessagingConfig`, `ExternalServiceAuditLogger` | JMS キュー投入・フォールバック送信・外部サービス監査ログ記録。 | `SessionTraceManager` から Trace-Id を取得し、監査ログと JMS メッセージに付与。 |
| `open.dolphin.adm20.export` | `PHRExportJob`, `PHRExportConfig` | PHR エクスポート向けジョブ／設定管理。 | PHR 非同期サービスの設定ハブ。 |

### セキュリティ / 監査

| パッケージ | 代表クラス | 主な責務 | 備考 |
| --- | --- | --- | --- |
| `open.dolphin.security` | `SecondFactorSecurityConfig`, `HashUtil` | 2FA（TOTP/FIDO2）設定とハッシュ関連ユーティリティの集約。 | Secrets（環境変数）から鍵を取得し `TotpSecretProtector` を初期化。 |
| `open.dolphin.security.audit` | `AuditTrailService`, `AuditEventPayload` | 監査イベントをチェーンハッシュ付きで永続化。 | JPA で `AuditEvent` をロックしながら追記。 |
| `open.dolphin.security.fido` | `Fido2Config` | FIDO2 サーバー設定の読込。 | `SecondFactorSecurityConfig` から利用。 |
| `open.dolphin.security.totp` | `TotpSecretProtector`, `BackupCodeGenerator` | TOTP 秘密鍵の暗号化・バックアップコード生成。 | AES 鍵の取得は Secrets 依存。 |

### メトリクス / クロスカッティング

| パッケージ | 代表クラス | 主な責務 | 備考 |
| --- | --- | --- | --- |
| `open.dolphin.metrics` | `RequestMetricsFilter`, `MeterRegistryProducer`, `DatasourceMetricsRegistrar` | Micrometer による REST リクエスト計測とデータソースメトリクス登録。 | `RequestMetricsFilter` は JAX-RS フィルタで API 応答時間／エラー数を記録。 |

### サポート / インフラ

| パッケージ | 代表クラス | 主な責務 | 備考 |
| --- | --- | --- | --- |
| `open.dolphin.mbean` | `ServletStartup`, `ServletContextHolder`, `UserCache` | WildFly 起動時の初期化、AsyncContext 管理、ユーザーキャッシュ。 | `ChartEventServiceBean` が AsyncContext リストへアクセス。 |
| `open.dolphin.infrastructure.concurrent` | `ConcurrencyResourceNames` | EJB の同時実行リソース命名を一元管理。 | `session` 層で使用。 |
| `open.dolphin.reporting` | `PdfRenderer`, `ReportTemplateEngine`, `SigningConfig` | PDF 帳票生成と署名。 | PHR/紹介状出力で利用。 |
| `open.dolphin.system.license` | `FileLicenseRepository`, `LicenseRepository` | ライセンスファイルの読み出し／検証。 | `SystemResource` から参照。 |
| `open.dolphin.adm10.converter` | `IAbstractModule`, `IPatientModel`, `ISendPackage` | ADM10 向けインタフェース群。XML/DTO をレガシークライアント仕様に整形。 | `rest`・`session` 双方が依存。 |
| `open.dolphin.adm20.converter` | `IAbstractModule30`, `IVisitPackage` | ADM20/PHR 向けモジュール定義インタフェース。 | ADM20 REST/Session で共通利用。 |
| `open.dolphin.adm20.dto` | `AdmissionDtos`, `PHRAsyncJobDto` | ADM20 エコシステム向け DTO。 | PHR 非同期処理で使用。 |
| `open.dolphin.adm20.support` | `AdmissionAuditLogger`, `TouchAuthSupport` | ADM20 認証・監査ヘルパー。 | REST/Session 両方から参照。 |
| `open.dolphin.touch.converter` | `IPatientModel`, `IRegisteredDiagnosis`, `ISendPackage2` | Touch 用データ抽象インタフェース。 | `session` 層が DTO 変換時に利用。 |
| `open.dolphin.touch.support` | `TouchAuditHelper`, `TouchRequestContextExtractor` | Touch リクエストの監査情報組み立てとトレース連携。 | REST/Session/TotP 連携時に利用。 |
| `open.stamp.seed` | `CopyStampTreeBuilder`, `CopyStampTreeDirector` | スタンプツリーの複製ユーティリティ。 | `session` 層がスタンプ複製時に利用。 |

## 依存関係の主な流れ
- **API → セッション → メッセージング**: `open.dolphin.rest` / `touch` / `adm10.rest` / `adm20.rest` が `open.dolphin.session`（各種 ServiceBean）を呼び出し、さらに JMS 経由の送信が必要な処理は `open.dolphin.msg.gateway.MessagingGateway` を経由する。
- **セッション → サポート層**: `session` Bean は `open.dolphin.mbean.ServletContextHolder` で SSE 用コンテキストを共有し、スタンプ複製時に `open.stamp.seed` を利用する。
- **セッション → Touch/ADM コンバータ**: レガシー API 互換のため、サービス層が `touch.converter` や `adm10.converter` のインタフェースへ変換を行う。
- **メッセージング → セッションフレームワーク**: JMS ゲートウェイは `SessionTraceManager` から Trace-Id を取得し、監査／メッセージの相関を維持する。
- **セキュリティ／メトリクスは横断的**: `SecondFactorSecurityConfig` が TOTP/FIDO 設定を提供し、`RequestMetricsFilter` が全 REST エンドポイントにメトリクスを付与する。

## 循環参照と改善メモ

| 循環 | 具体例 | 影響 | 改善アイデア |
| --- | --- | --- | --- |
| `rest ↔ session` | `rest` 側は各種 `ServiceBean` を注入。`open.dolphin.session.ChartEventServiceBean` が `open.dolphin.rest.ChartEventResource` / `ChartEventSseSupport` を import。 | セッション層がプレゼンテーション層に依存し、リファクタリングやテスト分離が困難。 | SSE 用定数とサポートクラスを `session` 直下または専用 `event` パッケージへ移動し、REST 層からのみ参照する構造へ整理。 |
| `session ↔ msg` | `KarteServiceBean` などが `MessagingGateway` を呼び出し、`open.dolphin.msg.OidSender` が `session.AccountSummary` を import。 | メッセージング実装と業務サービスが密結合。メッセージングテスト時にセッション層のビルドが必須。 | `AccountSummary` を `common` / `infomodel` へ移動し、`msg` パッケージからセッション層への参照を排除。 |
| `session ↔ touch.converter` | `session` Bean が Touch 変換インタフェースを直接参照し、`touch` REST が `session` Bean を注入。 | レガシー Touch 仕様がセッション層へ漏れ、API 拡張時に影響範囲が広がる。 | Touch 用インタフェースを `common`（共有 DTO）へ抽出し、セッション層から Touch 実装を切り離す。 |
| `rest ↔ touch` | `touch` パッケージの `AbstractResource` 等が `open.dolphin.rest.AbstractResource` を継承し、`rest` 側が `touch.converter`／`touch.support` を参照。 | Touch/REST の責務境界が曖昧になり API 差分の整理が難しい。 | 共通部分を `rest.core`（仮称）として切り出し、REST（一般）と Touch を個別モジュール化。 |

### Layer-Decoupling-POC (2026-06-10 更新)
- SSE 定数と SSE 向けブロードキャスト API を `open.dolphin.session.support` へ抽出し、`ChartEventServiceBean` から `open.dolphin.rest.*` への依存を解消。
- `open.dolphin.msg.OidSender` は `AccountSummaryMessage` インタフェース経由でアカウント情報を受け取るようになり、`open.dolphin.session.AccountSummary` への直接参照が不要になった。

```text
rest.ChartEventStreamResource
  └─> session.support.ChartEventSessionKeys

rest.ChartEventSseSupport
  └─> session.support.ChartEventStreamPublisher

session.ChartEventServiceBean
  ├─> session.support.ChartEventSessionKeys
  └─> session.support.ChartEventStreamPublisher

msg.OidSender
  └─> msg.dto.AccountSummaryMessage

session.AccountSummary
  └─> msg.dto.AccountSummaryMessage
```

### その他の気づき
- `open.dolphin.metrics` と `open.dolphin.security.*` は他レイヤーからの参照のみで逆参照はなく、循環なし。
- `open.dolphin.mbean.ServletContextHolder` は AsyncContext のリストを直接公開しているため、同期制御の見直しとイベント通知用 API 化が望ましい。
- `open.dolphin.adm10.converter`／`adm20.converter` のインタフェースが `common` 側に存在せず、モダナイズ済み API とコード共有しづらい。共通 DTO 化を検討したい。
