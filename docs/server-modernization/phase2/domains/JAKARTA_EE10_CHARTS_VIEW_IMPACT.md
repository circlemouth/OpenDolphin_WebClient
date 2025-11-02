# 患者閲覧機能における Jakarta EE 10 影響整理（2025-11-02）

本メモは、患者基本情報およびカルテ閲覧機能に関連するサーバー/クライアント資産を精査し、Jakarta EE 10 への移行と依存更新が及ぼす影響を整理したものです。対象は `server/` 旧実装、`server-modernized/` 現行移行版、共有 DTO を提供する `common/`、および Web クライアント（`web-client/`）。本結果は `../foundation/JAKARTA_EE10_GAP_LIST.md`・`../foundation/DEPENDENCY_UPDATE_PLAN.md` と相互参照してください。

## 1. `javax.*` インポートとアノテーション残存箇所

| カテゴリ | ファイル | 現状 | 移行影響 | Jakarta 置換案 |
| --- | --- | --- | --- | --- |
| REST コントローラ（レガシー） | `server/src/main/java/open/dolphin/rest/*.java` | `javax.inject.*` / `javax.servlet.*` / `javax.ws.rs.*` を使用（例: `KarteResource.java:8-12`, `PatientResource.java:5-9`） | Jakarta EE 10 ランタイムではクラスローダが別ネームスペースを提供しないためビルド不可。 | 旧モジュールを維持する場合は `jakarta.*` へ機械的置換。`server-modernized/` 側では既に置換済みであるため、旧 WAR の廃止を前提にするのが安全。 |
| EJB/サービス層（レガシー） | `server/src/main/java/open/dolphin/session/*.java` | `javax.ejb.*` / `javax.persistence.*` / `javax.jms.*` 等（例: `KarteServiceBean.java:9-13`, `ScheduleServiceBean.java:20-31`） | Jakarta 版 API とは互換性無し。現行 WildFly 33 の `jakarta.*` 実装と別バイトコードになる。 | `server-modernized/` 側の `jakarta.*` 実装を単一ソースに統合し、旧実装は移行フェーズ終了後に削除する。 |
| DTO / JPA エンティティ | `common/src/main/java/open/dolphin/infomodel/**/*` | 包括 `import javax.persistence.*;`。`@Temporal(javax.persistence.TemporalType...)` の FQCN も多数（例: `PatientModel.java:7`, `KarteEntryBean.java:8-32`, `CarePlanModel.java:31-40`）。 | Jakarta Persistence 3.1 へ移行しない限り `jakarta.persistence` API を利用できず、`server-modernized` から再利用した際にクラスが二重定義となる。 | `import jakarta.persistence.*;` へ置換し、`@Temporal` 等の FQCN も `jakarta.persistence` に更新。併せて `common` モジュールのバイトコードを Java 17 へ再ビルドする必要がある。 |
| メール変換ユーティリティ | `common/src/main/java/open/dolphin/converter/PlistParser.java:9-13`, `PlistConverter.java:12-13` | `jakarta.mail.*` を利用し Mime デコードを実装。 | Jakarta Mail API 3.x での動作を前提とし、WildFly バンドルとの差異がある場合はプラットフォーム側で調整する。 | Jakarta BOM が提供する Mail API を利用し、マルチバイト添付などの回帰テストを継続。 |
| JPA 設定ファイル（共有） | `common/src/main/resources/META-INF/persistence.xml:1-16` | `xmlns="http://java.sun.com/xml/ns/persistence"`、`version="1.0"`、`provider` に `org.hibernate.ejb.HibernatePersistence`。 | Jakarta Persistence 3.1 では `https://jakarta.ee/xml/ns/persistence` と `version="3.1"` が必須。旧スキーマは WildFly 33 で警告／将来削除対象。 | スキーマを `https://jakarta.ee/xml/ns/persistence` / `persistence_3_1.xsd` へ更新し、`provider` を除去（WildFly付属 Hibernate 6 を利用）もしくは `org.hibernate.jpa.HibernatePersistenceProvider` へ更新。プロパティ名も `jakarta.persistence.*` に変更。 |
| JPA 設定ファイル（サーバー） | `server-modernized/src/main/resources/META-INF/persistence.xml:1-18` | `xmlns.jcp.org` + `version="2.2"`、プロパティで `javax.persistence.*` キー。 | Jakarta Persistence 3.1 互換ではない。Hibernate 6 同梱環境で `javax` プロパティは無視される。 | `https://jakarta.ee/xml/ns/persistence` / `persistence_3_1.xsd` へ更新し、設定キーを `jakarta.persistence.schema-generation.database.action` 等へ改名。 |
| Servlet 設定 | `server-modernized/src/main/webapp/WEB-INF/web.xml:1-43`, `beans.xml:1-4` | `http://java.sun.com/xml/ns/javaee` スキーマ、`web-app version="3.0"`。 | Jakarta Servlet 6 / CDI 4.1 では新スキーマ必須。旧スキーマはワーニング＋機能制限を引き起こす。 | `xmlns="https://jakarta.ee/xml/ns/jakartaee"`、`xsi:schemaLocation` を `https://jakarta.ee/xml/ns/jakartaee https://jakarta.ee/xml/ns/jakartaee/web-app_6_0.xsd` 等へ置換。`beans.xml` も `beans_4_0.xsd` へ更新。 |
| 依存管理 | `common/pom.xml:17-55` | `org.hibernate:hibernate-core:4.3.8.Final`（provided）、`javax:javaee-api:7.0` を指定。`maven-compiler-plugin` が `source/target 1.8`。 | Jakarta API へ切替済みの `server-modernized` から再利用すると `javax.persistence` を要求しビルドエラー。Hibernate 4 は `jakarta` 名前空間非対応。 | `jakarta.persistence:jakarta.persistence-api:3.1.0`、`jakarta.validation-api` 等へ差し替え。Hibernate 依存は削除しランタイム（WildFly）へ委譲。`release 17` を有効化。 |

### 2025-11-02 更新メモ（担当: Codex）

- `common/src/main/java/open/dolphin/infomodel/**` の JPA アノテーション import を `jakarta.persistence.*` へ置換し、Charts 関連 DTO が `server-modernized` から再利用できるよう整合。`TemporalType` などの FQCN も Jakarta namespace へ揃えた。
- `PlistParser` / `PlistConverter` で使用していた `javax.mail.*` を `jakarta.mail.*` へ更新。カルテ文書のメール変換に関わる MIME デコードが Jakarta Mail 3.x で動作する前提を整備。
- 共通／サーバー双方の `META-INF/persistence.xml` を Jakarta Persistence 3.1 スキーマへ更新し、`org.hibernate.jpa.HibernatePersistenceProvider` と `jakarta.persistence.schema-generation.database.action` を採用。Charts View が参照する永続化設定も Jakarta 仕様で統一。
- `mvn -pl common -DskipTests package` はローカル環境に Maven CLI が無く失敗。進捗は `docs/server-modernization/phase2/PHASE2_PROGRESS.md` に記録済み。環境整備完了後にビルド検証を再実施予定。
> **補足**: `javax.sql` や `javax.crypto` のように Java SE に残存するパッケージについては Jakarta 移行の対象外と判断し、本表から除外した。

## 2. レスポンスモデル／テンプレート整合性チェック

### 2.1 REST レイヤーと TypeScript モデルの一致

- `KarteResource`・`PatientResource` 等（`server-modernized/src/main/java/open/dolphin/rest/*.java`）は Jackson 2 (`com.fasterxml.jackson.databind`) を使用し、`DocumentModel` や `DocInfoModel` を JSON 化します。Web クライアント側の変換処理（`web-client/src/features/charts/types/doc.ts:1-140`、`doc-info-api.ts:1-48`）は `docInfoModel`, `modules`, `schema` など旧 REST 仕様のプロパティ名に依存しており、現行ジャクソンでも getter 名（例: `getDocInfoModel`）により同名キーが出力されることを確認しました。
- 旧サーバーは `org.codehaus.jackson` を利用していたため日付フォーマットや null 連携で差異が発生する懸念がありましたが、現行コードは `mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)`（`KarteResource.java:63-68` など）で後方互換を確保しています。とはいえ Jakarta JSON-B への移行を検討する場合は `DocInfoModel` のフィールド別命名を明示するアノテーション追加が必要です。
- `AttachmentModel` の `byte[]` は REST レベルで null マスクが施されます（`server-modernized/src/main/java/open/dolphin/rest/KarteResource.java:101-118`）。Web クライアントは `AttachmentSummary` を期待し `bytes` が null である前提（`web-client/src/features/charts/types/attachment.ts`）なので、Jakarta 変換後もこの制約を維持する必要があります。

### 2.2 Facelets / Velocity テンプレート

- 勘案対象のビューは主に JSON API だが、帳票テンプレート（Velocity、`server-modernized/reporting/templates/*.vm`）は Jakarta 影響を直接受けません。ただし `jakarta.servlet.ServletContext` からのリソース解決を利用する箇所があるため、`web.xml` スキーマ更新後も `RequestMetricsFilter` 等の `@Provider` が正しく登録されることを確認する必要があります。

### 2.3 アクセシビリティ・監査要件

- Web クライアントは `httpClient` でリクエスト／レスポンス監査ログを送出（`web-client/src/libs/http/httpClient.ts:1-160`）し、`userName`・`password` ヘッダは `createAuthHeaders` で組み立てています（`auth-headers.ts:33-61`）。Jakarta Servlet 6 でもヘッダ名の取り扱いは不変ですが、`LogFilter`（`server-modernized/src/main/java/open/dolphin/rest/LogFilter.java:24-90`）が `HttpServletRequestWrapper` を使って `remoteUser` を設定しているため、Jakarta 版 API でのセキュリティ・リスナー干渉を検証する必要があります。
- 監査ログ出力は MicroProfile Metrics 連携（`RequestMetricsFilter.java:19-76`）に依存しており、WildFly 33 では非推奨。Micrometer への移行を行わない場合、アクセス監査メトリクスが欠落しアクセシビリティ改善計画（`docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` の監査要件）に抵触します。

## 3. 境界シナリオとリスク分析

| シナリオ | 観測コード | リスク | Jakarta 移行観点での懸念 |
| --- | --- | --- | --- |
| 大量ドキュメント取得 (`GET /karte/documents`) | `server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java:426-476` | 指定 ID ごとに `DocumentModel` を `em.find` → 追加クエリで `modules` / `schema` / `attachment` をロード。大量 ID 指定時に N+1 クエリ＋全件メモリ常駐。 | Hibernate 6 ではデフォルトで bytecode enhancement 前提。`List modules = ...` の raw 型利用や `document.setModules(modules);` による強制初期化は `jakarta.persistence` 移行後も動作するが、`FetchType.LAZY` のまま大容量 BLOB を全件読み込むため OutOfMemory の危険が増す。`Stream` or pagination + REST レイヤーのチャンク化を検討。 |
| 参照系タイムラインの権限判定 | `LogFilter.java:36-88`, `BlockWrapper.java:18-43` | `userName` ヘッダから施設 ID を抽出しアクセス制御を実施。誤ったヘッダ長で `substring(17)` が `StringIndexOutOfBounds` を発生させる。 | Jakarta Servlet 6 では同処理は可能だが、`getRemoteUser` の標準的なセキュリティコンテキストと干渉。ヘッダ検証と例外ハンドリング強化が必要。 |
| SSE/Long-Poll (`/chartEvent/subscribe`) | `ChartEventResource.java:34-128` | AsyncContext タイムアウトを 24 時間に設定し、`ServletContextHolder` の同期ブロックで管理。ワーカー数が多い場合にサーブレットスレッド枯渇。 | Jakarta Servlet 6 では非ブロッキング API が推奨。Micrometer 連携欠如で接続数監視が困難。`Reactive Streams` か SSE API へのリファクタを検討。 |
| Micrometer メトリクス不足 | `server-modernized/pom.xml:66-123`（MicroProfile Metrics 依存のみ） | WildFly 33 は MicroProfile Metrics サブシステムを非推奨と告知。Prometheus 等の収集基盤で互換性低下。 | `io.micrometer:micrometer-registry-prometheus` などを `provided` 追加し、`RequestMetricsFilter`/`DatasourceMetricsRegistrar` を Micrometer API へ移植する必要がある。 |
| `jakarta.mail` 依存未登録 | `common/converter/PlistParser.java` | `MimeUtility` などを利用するが `server-modernized/pom.xml` で `jakarta.mail-api` は provided。`common` 側でビルドに失敗。 | `common` を Jakarta Mail API へ切替し、必要なら `jakarta.mail:jakarta.mail-api` を親 POM の BOM に追加。 |

## 4. 推奨アクション

1. **共有 DTO/エンティティの Jakarta 対応**: `common` モジュールを Java 17 + `jakarta.persistence` へ再ビルドし、`javax.persistence` に依存する箇所（`PatientModel`, `KarteEntryBean`, `DocumentModel` など）を全面置換。`@Temporal(javax.persistence...)` の FQCN も同時に修正。
2. **設定ファイルのスキーマ刷新**: `common` / `server-modernized` 両方の `persistence.xml`、および `web.xml` / `beans.xml` を Jakarta EE 10 スキーマへ更新し、`jakarta.persistence.*` プロパティ名へ揃える。`
3. **BOM/依存管理の統合**: `pom.server-modernized.xml` の BOM に `jakarta.mail`, `jakarta.json`, `Micrometer` を明示し、`common/pom.xml` から `javax:*` 依存と `hibernate-core` を排除。`DEPENDENCY_UPDATE_PLAN.md` に従い `okhttp3`, `plivo-java` なども再評価。
4. **メトリクス基盤の Micrometer 化**: `RequestMetricsFilter` / `DatasourceMetricsRegistrar` を Micrometer API へ書き換え、`docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` を更新。`IMPACT_MATRIX.md` の「オブザーバビリティ」行で Micrometer 置換タスクを明示する提案を関係者へ共有。
5. **大量データ API の段階的改善**: `KarteServiceBean.getDocuments` へページング or ストリーミングを導入し、`AttachmentModel` BLOB を遅延ロード可能な DTO に変換。`web-client` 側には仮想スクロールがあるため（`DocumentTimelinePanel.tsx`）、サーバー側もページング応答を追加する計画を立案。
6. **認可・監査強化**: ヘッダ長検証とエラーハンドリングを `LogFilter`／`BlockWrapper` に追加し、`httpClient` 側の監査ログ送出内容をサーバー監査メトリクスと突合できるよう ID を揃える。Jakarta Security を併用する場合のフローを `SECURITY_AND_QUALITY_IMPROVEMENTS.md` に追記する。

## 5. ドキュメント連携メモ

- 本メモで新たに顕在化した課題（Micrometer 化、`common` モジュールの Java 17 化）は `JAKARTA_EE10_GAP_LIST.md`・`IMPACT_MATRIX.md` の既存項目と重複するため、優先度や担当者の更新は Worker 0 と調整のうえ実施する。
- 実装着手時には `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` で定義された監査・レイアウト要件を再確認し、UI 側への影響（例: ドキュメントページング時の空状態表示）を同ガイドへ追記すること。
