# インフラ層トレースレビュー（Infrastructure-Filter-Trace）

## 調査対象と前提
- `server-modernized/src/main/java/open/dolphin/rest/LogFilter.java`
- `server-modernized/src/main/java/open/dolphin/metrics/RequestMetricsFilter.java`
- `server-modernized/src/main/java/open/dolphin/session/framework/SessionTraceManager.java`
- `server-modernized/src/main/java/open/dolphin/session/framework/SessionOperationInterceptor.java`
- 監査ヘルパー／JMS 連携（`PhrRequestContextExtractor`、`PhrAuditHelper`、`TouchRequestContextExtractor`、`MessagingGateway` など）

## リクエスト処理シーケンス（時系列）
1. **Servlet フィルタ層**  
   - `LogFilter` が `/resources/*` をフックし、認証チェックとトレース ID 生成を担当する。`identityToken` 系はスキップされ、ログ出力もトレース ID 設定も行われない（`server-modernized/src/main/java/open/dolphin/rest/LogFilter.java:56`）。  
   - 認証成功時に `X-Trace-Id` ヘッダ or UUID を取得し、`HttpServletRequest` 属性と MDC (`traceId`) へ格納する（同:81-84）。
   - 認証失敗時は警告ログを出すが、トレース ID を生成する前に処理が終わるため MDC へ traceId が入らない（同:72-78）。

2. **JAX-RS / Micrometer フィルタ層**  
   - RESTEasy によって `RequestMetricsFilter` がリクエスト/レスポンスを計測する。開始時刻とパステンプレートをコンテキストに保持し（`server-modernized/src/main/java/open/dolphin/metrics/RequestMetricsFilter.java:39-56`）、レスポンス時に `opendolphin_api_*` メトリクスへ記録する（同:61-70）。
   - テンプレート解決に失敗すると実際のパス（ID 含む）をタグに使うため、高い識別子カーディナリティが発生し得る（同:56-59）。

3. **セッション層インターセプタ**  
   - `@SessionOperation` が付与されたセッション Bean 呼び出しは `SessionOperationInterceptor` で包まれ、トレースコンテキストを開始する（`server-modernized/src/main/java/open/dolphin/session/framework/SessionOperationInterceptor.java:23-44`）。  
   - `SessionTraceManager.start` は新しい UUID ベースの traceId を生成し（`server-modernized/src/main/java/open/dolphin/session/framework/SessionTraceManager.java:23-55`）、HTTP レベルの traceId とは別系列になる。

## 監査・外部連携への伝搬
- **PHR / Touch リクエスト**  
  - `PhrRequestContextExtractor`／`TouchRequestContextExtractor` が `LogFilter` の request 属性から HTTP traceId を取得し、監査ペイロードの `requestId` 等へ格納する（例: `server-modernized/src/main/java/open/dolphin/adm20/rest/support/PhrRequestContextExtractor.java:21-52`）。  
  - 監査ヘルパーは `SessionTraceManager.current()` からセッション層 traceId を詳細フィールドへ追加し、HTTP traceId と並存する形で記録する（`server-modernized/src/main/java/open/dolphin/adm20/rest/support/PhrAuditHelper.java:40-70`）。

- **外部サービス連携 / JMS**  
  - `MessagingGateway` がセッション層 traceId を JMS メッセージプロパティ `open.dolphin.traceId` やログへ付与し、非同期処理へ伝搬する（`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java:42-121`）。  
  - JMS コンシューマ（`MessageSender`）側は同じプロパティを読み込み、監査ログや例外ログへ埋め込む設計。

## 判明した課題と改善案
1. **HTTP traceId とセッション traceId が常に別系列**  
   - `SessionTraceManager.start` は毎回独自の UUID を生成し、`LogFilter` の MDC/リクエスト属性を参照していない（`server-modernized/src/main/java/open/dolphin/session/framework/SessionTraceManager.java:23-55`）。  
   - 監査ログには HTTP traceId（requestId）とセッション traceId の両方が混在し、相互関連付けが明示されない。  
   - **改善案**:  
     1. `SessionOperationInterceptor` から MDC (`org.jboss.logmanager.MDC`) の `traceId` を読み取り、既存値があれば `SessionTraceContext` に引き継ぐ。  
     2. 逆方向として、`SessionTraceManager` 開始時にセッション traceId を MDC (`org.slf4j.MDC`) へ投入する Hook を追加し、ログパターンで自動表示できるよう統一する。  
     3. 監査ペイロードに `httpTraceId`／`sessionTraceId` のような明確なフィールド名で両者を区別し、照合手順をドキュメント化する。

2. **未認証リクエストおよび `identityToken` 系呼び出しでトレース情報が欠落**  
   - 認証失敗ログは `traceId` を含まず、MDC も未設定のためログ／監査／メトリクスの突合ができない（`server-modernized/src/main/java/open/dolphin/rest/LogFilter.java:72-78`）。  
   - `identityToken` エンドポイントは LogFilter を素通りし、監査ヘルパーも `PhrRequestContext` を構築できないため `requestId` が空の監査レコードになる（`server-modernized/src/main/java/open/dolphin/rest/LogFilter.java:56-59`, `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java:439-470`）。  
   - **改善案**:  
     1. 認証可否に関わらず最初に traceId を生成して MDC とレスポンスヘッダへ設定し、拒否レスポンスでもトレーサビリティを確保する。  
     2. `identityToken` を LogFilter の対象に戻し、最小限の監査情報（呼出ユーザー、nonce 長など）を残す。難しければフィルタ側で別コードパスを用意し、traceId 生成と監査呼び出しのみ実行する。  
     3. `PhrAuditHelper.recordSuccess(null, …)` でも `requestId` を埋められるよう、ヘルパーに traceId パラメータを追加する。

3. **メトリクスタグのカーディナリティと可観測性ギャップ**  
   - `RequestMetricsFilter` がテンプレート解決に失敗した場合、動的 ID を含むパスを `path` タグに格納するため、Prometheus などでカードinality が膨らむリスクがある（`server-modernized/src/main/java/open/dolphin/metrics/RequestMetricsFilter.java:56-59`）。  
   - 正常応答時はステータスタグが付かず、成功／失敗を同一カウンタで判別しづらい。403（LogFilter が返す）といった「REST 層へ届かない」ケースは計測対象外。  
   - **改善案**:  
     1. `resourceInfo` が null の場合でも `UriInfo.getMatchedURIs().get(0)` などからテンプレートを抽出し、`{id}` 置換を行う。  
     2. `opendolphin_api_request_total` にも `status` タグを付与し、成功/失敗をダッシュボードで直接比較できるようにする。  
     3. 認証失敗など Servlet フィルタで遮断するケースについては、別途 `opendolphin_auth_reject_total` のようなカウンタを LogFilter から記録する。

4. **JMS／バッチ経路で traceId が欠落し得る**  
   - `MessagingGateway` は `SessionTraceManager.current()` に依存するため、`@SessionOperation` を通らない非同期トリガーでは `traceId` が null のままになる（`server-modernized/src/main/java/open/dolphin/msg/gateway/MessagingGateway.java:117-120`）。  
   - **改善案**:  
     - `SessionTraceManager` に「HTTP トレース ID を持たない場合は新規生成し JMS プロパティへ確実に設定する」フォールバックを追加する。  
     - JMS 受信側で traceId が null の場合は WARN を出して監視アラートに繋げる。

## 追加で必要な検証
- WildFly 環境で `org.jboss.logmanager.MDC` と `org.slf4j.MDC` が確実に同期されることの実機確認（ログフォーマッタ設定含む）。
- `RequestMetricsFilter` のテンプレート解決が実パスで失敗するケース（サブリソースロケータ、`@Path` 未指定リソース）を再現し、Prometheus 側の系列数を計測。
- `identityToken` 呼び出しにトレース付与を行った際、既存クライアント（Swing / 外部システム）が問題なく動作するかの互換性テスト。

---

## 2025-11-06 対応メモ（Trace-Propagation-Enhancement）

- `LogFilter`
  - 認証可否に関わらずリクエスト開始時に traceId を採番し、`X-Trace-Id` ヘッダーへエコー。`identityToken` もフィルタ対象とした。
  - 403 応答時にも traceId を MDC とレスポンスヘッダーへ残し、警告ログに `traceId=...` を含めるよう変更。
- `SessionTraceManager` / `SessionOperationInterceptor`
  - HTTP レイヤーの `traceId` を取得できた場合はセッション層へ引き継ぎ、欠損時は新規採番。
  - `org.jboss.logmanager.MDC` と `org.slf4j.MDC` を同期し、`clear()` 時に元の値へ復元するフックを追加。
- `MessagingGateway`
  - セッションコンテキストから traceId を取得できない場合は WARN を出しつつ新規採番し、JMS プロパティ `open.dolphin.traceId` へ常時設定。
- `RequestMetricsFilter`
  - `ResourceInfo` からテンプレートを引けない場合でも、動的 ID 部分を `{id}/{hex}` などに正規化したパスを生成。
  - すべてのメトリクスに `status` タグを追加し、401/403 は `opendolphin_auth_reject_total` でカウント。

### 検証コマンド

```
mvn -f pom.server-modernized.xml test -DskipTests
mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=LogFilterTest,RequestMetricsFilterTest test
```

### サンプルログ / メトリクス

```
Captured unauthorized log: WARNING Unauthorized user: null: /openDolphin/resources/protected traceId=6d3f566b-c58f-4358-80da-b607acea0ab4
METRIC opendolphin_api_request_total tags=[tag(method=GET), tag(path=/20/adm/phr/patient/{id}/{hex}), tag(status=403)] count=1
METRIC opendolphin_api_error_total tags=[tag(method=GET), tag(path=/20/adm/phr/patient/{id}/{hex}), tag(status=403)] count=1
METRIC opendolphin_auth_reject_total tags=[tag(method=GET), tag(path=/20/adm/phr/patient/{id}/{hex}), tag(status=403)] count=1
METRIC opendolphin_api_request_duration tags=[tag(method=GET), tag(path=/20/adm/phr/patient/{id}/{hex}), tag(status=403)] count=1
```

### 影響ポイント

- 監査・JMS 双方で HTTP traceId とセッション traceId を統一的に参照可能になったため、既存監査帳票のフィールド解釈を再確認する。
- `RequestMetricsFilter` の正規化により Grafana 側のダッシュボード（path タグ参照）を最新ルールへ合わせて更新する必要がある。
- JMS 側で WARN が観測された場合は、バックグラウンドジョブなど HTTP トレース外の経路が残っていないかを確認し、必要に応じて `SessionOperation` 付与を検討。
