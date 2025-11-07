# REST / Touch API 差分レポート（SA-TOUCH-API-PARITY, Worker F）

## 1. 代表エンドポイント比較
| 機能 | Touch `/jtouch`（`server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java`） | ADM10 `/10/adm/jtouch`（`.../adm10/rest/JsonTouchResource.java`） | 公開方針 | 備考 |
| --- | --- | --- | --- | --- |
| ユーザ/患者取得 (`GET /user/{uid}`, `/patient/{pid}`) | 実装あり。`JsonTouchSharedService` からスナップショットを返却。 | 実装あり。`JsonTouchSharedService` を共有し ADM10 DTO へラップ。 | 共通提供 | 両者とも `HttpServletRequest#getRemoteUser()` を施設判定に使用。|
| 患者検索 (`GET /patients/name/{param}`) / 件数 (`/patients/count`) / カナダンプ (`/patients/dump/kana/{param}`) | すべて実装済み。 | すべて実装済み。 | 共通提供 | パラメータ分割ロジックは共通だが ADM10 版はログコメントや一部 `System.err` が残存。|
| 来院情報 (`GET /visitpackage/{param}`) | 実装あり。 | 実装あり。 | 共通提供 | DTO クラスのみ異なる。|
| パッケージ送信 (`POST /sendPackage(2)`) | `ISendPackage` 系 DTO を Touch 版でデシリアライズし、`JsonTouchSharedService#processSendPackage*` へ委譲。 | ADM10 版は個別要素を取り出して `processSendPackageElements` に直接渡す。 | 共通提供 | Touch 版は `TOUCH_MAPPER = AbstractResource#getSerializeMapper()` でデシリアライズ設定を統一済み。|
| 文書登録 (`POST /document(2)` / `/mkdocument(2)`) | `IDocument`/`IMKDocument` で JSON をデシリアライズ。`IDocInfo.toModel()` で `IPVTHealthInsurance` を必須としていたため今回 `null` 許容に修正。 | 同等エンドポイント。ADM10 DTO も `IPVTHealthInsurance` を含むため同じ null ガードを追加。 | 共通提供 | エラーハンドリングは `JsonTouchAuditLogger` で統一。|
| モジュール収集 (`GET /order/{param}`) | 未実装。 | 実装あり。`StreamingOutput` で JSON をストリーム返却。 | Legacy限定 | VisitTouch/EHT の XML→JSON 変換専用。Web クライアントは `/rest/karte/*` 経由で同等データを取得するため `/jtouch` へ露出しない。|
| 相互作用チェック (`PUT /interaction`) | 未実装。 | 実装あり（SQL → `DrugInteractionModel`）。今回、レスポンスを `drugcd`/`drugcd2`/`syojyoucd`/`syojyou` キーへ変換する `InteractionRow` DTO を追加し、Legacy iOS/Touch と同一 JSON を返すよう修正。 | Legacy限定 | Web クライアントは ORCA 連携 API（`PUT /orca/interaction`, `GET /mml/interaction`）で同機能を提供予定のため `/jtouch` 追加なし。|
| スタンプツリー／スタンプ取得 (`GET /stampTree/{userPk}`, `/stamp/{stampId}`) | 未実装。 | 実装あり。`ehtService` から XML を取得し JSON/XML に変換してストリーム返却。 | Legacy限定 | VisitTouch 固有の JSON builder。Web クライアントは `StampResource`（`/rest/stamp*`）を利用し、ADM10 実装には Legacy 限定コメントを追記済み。|

## 1.1 Charts PatientList API（新規比較ポイント）

- `GET /rest/charts/patientList` は Charts/Web カルテ専用の受付一覧 API。`clientUUID` をクエリパラメータとして受け取る（ヘッダと同値）ことで、SSE `Last-Event-ID` のリセット可否や監査用の端末識別を行う。
- レスポンスは既存の `PatientVisitListConverter` に `sequence`（最新チャートイベント ID）と `gapSize`（履歴ギャップで欠落したイベント件数）を拡張した JSON。Web クライアントは `sequence` を `ReplayGapContext` で保持し、再接続時に `Last-Event-ID` ヘッダーへ反映する。
- 受付画面（`/rest/pvt2/pvtList`）とは別系統の API だが、戻り値の `list` は同じ `PatientVisitModel` 配列であり、互換表示が可能。Charts 再取得処理では本 API を優先し、Stage/Legacy 環境で 404 の場合のみ従来エンドポイントへフォールバックする。
- `gapSize` は `ChartEventSseSupport` の `sequence - oldestHistoryId` をもとに計算され、`ReceptionReloadAudit` / `TouchReloadAudit` の `gapSize` フィールドとして監査ログに保存することで Ops が欠落規模を把握できる。

## 2. SSE 再接続／認証フロー
1. **エンドポイント**: `GET /chart-events`（`server-modernized/src/main/java/open/dolphin/rest/ChartEventStreamResource.java`）が Jakarta REST SSE を公開。`clientUUID`（`ChartEventSessionKeys.CLIENT_UUID`）と `Last-Event-ID` ヘッダを必須で受け取り、`HttpServletRequest#getRemoteUser()` から施設 ID を復元して `ChartEventSseSupport#register` へ委譲する。認証情報が無い場合は `BadRequestException` を送出し `SseEventSink` を即時 close。
2. **履歴と再送**: `ChartEventSseSupport`（`.../rest/ChartEventSseSupport.java`）は施設単位の `FacilityContext` を `ConcurrentHashMap` に保持し、`CopyOnWriteArrayList` で購読者、`ConcurrentLinkedDeque` で最新 100 件（`HISTORY_LIMIT`）のイベント履歴を保持。再接続時は `Last-Event-ID` より大きいイベントのみを `replayHistory` で送信し、`issuerUuid` が一致するクライアントには再配信しない。
3. **ブロードキャスト**: `ChartEventServiceBean` から `ChartEventStreamPublisher` 経由で `ChartEventSseSupport#broadcast` が呼ばれ、`sequence` で採番した ID を `OutboundSseEvent` にセットして `MediaType.APPLICATION_JSON` で送信。送信失敗時は該当 sink を `removeClient` で破棄し、`CompletionStage` の `whenComplete` でクリーンアップする。
4. **Legacy との差**: 旧 `ServletContextHolder`/`AsyncContext` ベースのロングポーリングは `ChartEventSseSupport` のコメントにもある通り併存させつつ、SSE 側はヘッダ駆動で再接続制御・履歴再送を行う構成に刷新済み。今後 Phase3 で Web クライアントの `Last-Event-ID` 実装確認と 100 件履歴の閾値調整が課題。
5. **履歴上限評価**: `ChartEventServiceBean#processChartEvent`（`server-modernized/src/main/java/open/dolphin/session/ChartEventServiceBean.java:48-173`）が送信するイベントは `PVT_STATE` / `PVT_DELETE` / `PVT_MEMO` など来院ステータス更新に限定されるため、1 来院あたりのイベントは多くても 4〜5 件に収まる。仮に 1 施設で 30 件/時の来院状態更新が連続しても 1 時間あたり 150 件程度であり、100 件バッファは約 40 分の再送に相当する。診療時間をまたぐ長時間切断ではカバーしきれない一方、ネットワーク瞬断（〜10 分）やクライアント再読み込みには十分であると判断した。
6. **再接続時の欠落検知**: `FacilityContext` が最新 ID（`sequence`）と履歴先頭 ID（`oldestHistoryId`）を公開し、Micrometer `Gauge chartEvent.history.retained{facility=<fid>}` として `sequence - oldestHistoryId` を常時露出するようにした（100 件に近づいたら Ops で閾値監視）。`Last-Event-ID < oldestHistoryId` で再接続した場合は `ChartEventSseSupport#register` が `WARN SSE history gap detected for facility ...` を出力し、`Counter chartEvent.history.gapDetected{facility=<fid>}` をインクリメント、さらに `ChartEventSessionKeys.HISTORY_GAP_ATTRIBUTE` でクライアント属性へギャップ検出フラグを付与する。ギャップ検知時はクライアントへ `event: chart-events.replay-gap` / `data: {"requiredAction":"reload"}` の SSE を単発送信し、Touch/Web クライアントでフルリロードを促せるようにした。監視ルール案は `ops/monitoring/chart-event-alerts.yml`（retained ≥ 90, gapDetected 増加検知）へ格納し、Runbook 手順 8 にメトリクス／ログ確認とリロード手順を追記済み。

## 3. DTO / Jackson 設定差異
- **DocInfo コンバータ**: Touch/ADM10/ADM20 すべての `IDocInfo.toModel()` で `PVTHealthInsurance` を必須扱いしていたため、Phase2 テストでは簡易ペイロードで `NullPointerException` が発生していた。今回 `IPVTHealthInsurance` が `null` の場合は `setPVTHealthInsuranceModel` をスキップするよう統一し、存在する場合のみ `toModel()` を実行する。
- **相互作用 DTO**: ADM10 の `checkInteraction` では `DrugInteractionModel` をそのまま JSON 化していたが、フィールド名が `srycd*`/`sskijo` のままになり Touch/Legacy の `drugcd` 系フィールドと乖離していたため、レスポンスを `InteractionRow` DTO へ変換してフィールド名をそろえた。`AbstractResource#getSerializeMapper()` で `JsonInclude.NON_NULL` を適用しており、空リスト応答時は `Collections.emptyList()` を返す。
- **Jackson 構成の違い**: `LegacyObjectMapperProducer`（`open.dolphin.rest.jackson.LegacyObjectMapperProducer`）が供給する `@Inject ObjectMapper legacyTouchMapper` を `/jtouch` の `JsonTouchResource` だけでなく、Touch Legacy エンドポイントである `EHTResource`（`/10/eht`）、`DolphinResource`（`/touch`）、`DolphinResourceASP` にも適用した。これにより `new ObjectMapper()`+逐次設定を廃止し、POST/PUT 系デシリアライズで `FAIL_ON_UNKNOWN_PROPERTIES=false`・`ACCEPT_EMPTY_STRING_AS_NULL_OBJECT=true`・`JavaTimeModule`・`SerializationFeature.WRITE_DATES_AS_TIMESTAMPS=false` を一貫適用できる。ストリーミング系（`collectModules`/`interaction`/`stamp*` など書き出し専用）は引き続き `AbstractResource#getSerializeMapper()` を使用し、`JSONStampBuilder` も同メソッド経由の Mapper を採用した。`JsonTouchResourceParityTest` で JavaTime ペイロード差異を回帰確認済み。

## 4. 検証とフォローアップ
- 実行コマンド: `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test`
- ログ: `server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`, `TEST-open.dolphin.infomodel.InfoModelCloneTest.xml`
- 残課題:
  1. Touch `/jtouch` もテスト体制が整い次第、`LegacyObjectMapperProducer` から CDI 注入する構成へ移行し、`JsonTouchResourceParityTest` が直接インスタンス化している制約を解消する。
  2. SSE 100 件の履歴上限が Web クライアント要件を満たすか、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` へ試験記録を追加。 
  3. Legacy 限定とした API（`collectModules`, `interaction`, `stampTree`, `stamp`）について、API インベントリと Runbook の公開ステータスを `LegacyOnly` へ切り替え、周知を徹底する。
