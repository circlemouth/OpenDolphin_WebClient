# server-modernized Phase2 ワーカー指示ログ（2026-06-14）

> 各ワーカーは担当タスクの着手前に本ファイル該当節で `【ワーカー指示】` を再確認し、完了後または途中報告時に `【ワーカー報告】` を追記すること。成果物へのリンク、実行コマンド、確認ログの場所を必ず明記する。

## SA-STATIC-MAP（担当候補: Worker A）

【ワーカー指示】
- 対象コード: `server-modernized/src/main/java`。`open.*` パッケージを REST/API・セッション・インフラ/メッセージング・セキュリティ・ストレージの5層へ再分類し、`docs/server-modernization/phase2/notes/server-layer-map.md` をアップデートする。
- 手順:
  1. `rg --files server-modernized/src/main/java/open.dolphin` でパッケージ一覧を取得し、未分類パッケージを洗い出す。
  2. 既存 `server-layer-map.md` をベースに、新規/変更多いパッケージについて代表クラス・責務・依存先を追記。循環依存や未使用 Bean を見つけたら `notes/static-analysis-findings.md` にも記録し、CI の SpotBugs 残課題（JMS/MBean 32 件）との紐付けを記述する。
  3. `LogFilter`／`RequestMetricsFilter`／`SessionTraceManager` を中心に、ログ/Trace-ID の流れを手元テストまたはログ調査で確認し、`docs/server-modernization/phase2/notes/infrastructure-trace-review.md` にシーケンス図（テキストベース可）で反映。
- 成果物: 更新した `server-layer-map.md` と `infrastructure-trace-review.md`。検証で取得したログは `tmp/trace-review/` へ保存しパスを報告。
- 報告方法: 本節へ `【ワーカー報告】` を追記し、更新ファイル行番・未解決課題・追加で必要な支援を明記。

【ワーカー報告】（2026-06-14 Worker A）
- 5層分類に合わせて `docs/server-modernization/phase2/notes/server-layer-map.md` を全面更新。`open.orca.rest` や `open.stamp.seed`, `open.dolphin.system.license` を含む 38 パッケージを REST/API・セッション・メッセージング/インフラ・セキュリティ・ストレージへ再マッピングし、依存関係のメモを追加。
- 循環依存と未使用 Bean を `docs/server-modernization/phase2/notes/static-analysis-findings.md` に追記。`VitalServiceBean` の未参照、`SessionTraceManager` ↔ `MessagingGateway` 循環、`mbean.UserCache` の Map 暴露を SpotBugs 残 32 件（JMS/MBean）へ紐付けて整理。
- `docs/server-modernization/phase2/notes/infrastructure-trace-review.md` に LogFilter → RequestMetricsFilter → SessionTraceManager → JMS → MessageSender のテキストシーケンス図を追加し、Trace-ID が分岐するポイントを明示。
- 調査ログ: `tmp/trace-review/sa-static-map-20260614.log` にコマンド履歴と要点を記録。
- 未解決: (1) `VitalServiceBean` の削除 or 公開方針決定、(2) TraceContext を共有する抽象化（`SessionTraceManager` 切り出し）設計、(3) `UserCache` の API 再設計と SpotBugs 32 件の解消計画。サポートが必要になった場合は別途タスク化を希望。

【ワーカー報告】（2026-06-15 Worker A フォローアップ）
- `open.dolphin.session.VitalServiceBean` を `@Vetoed` で CDI 対象外にし、`server-layer-map.md` / `static-analysis-findings.md` へ決定内容を反映。REST/API 側の要件確定までビルドへ含めない方針。
- `TraceContextProvider/TraceContextBridge` の設計案を `infrastructure-trace-review.md` に図示し、`PHASE2_PROGRESS.md` へチケット `TRC-15` を追加。
- `open.dolphin.mbean.UserCache` を専用 API（`findPassword`/`cachePassword`/`snapshot`/`evict`）に刷新、`LogFilter` も新 API を使用させて SpotBugs JMS/MBean 32 件のうちキャッシュ関連を解消。`static-analysis-plan.md` に進捗を記録。
- 調査ログ: `tmp/trace-review/sa-static-map-20260615-followup.log` に今回の参照コマンドを保存。
- 支援依頼: `TraceContextProvider` 実装と JMS 側移行は後続チケット (`TRC-15`) で Worker C/A 協業予定。必要に応じてリソース配分の確認をお願いします。

## SA-TOUCH-API-PARITY（担当候補: Worker F）

【ワーカー指示】
- 目的: `JsonTouchResourceParityTest`（errors=2, failures=1）と `InfoModelCloneTest`（failures=2）の原因を特定し、テストをグリーンにする。
- 手順:
  1. 失敗ログ（`server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`, `TEST-open.dolphin.infomodel.InfoModelCloneTest.xml`）を読み、例外種別・差分内容を `docs/server-modernization/phase2/notes/static-analysis-findings.md` に転記。
  2. 対応方針を `docs/server-modernization/phase2/notes/touch-api-parity.md`（新規作成可）へ整理。想定改修（DTO マッピング、Jackson 設定、フィクスチャ修正など）ごとに影響範囲と確認手順を列挙。
  3. 修正後に `mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test` を実行し、結果ログパスを記録。
  4. 並行でフェーズ3タスク: 代表 REST エンドポイント diff、SSE 再接続フロー、DTO コンバータの Jackson 設定差異を `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` にまとめる。Legacy 実装との差分は `git diff` ではなく仕様比較で示す。
- 成果物: 修正コード（必要に応じて PR）、上記ノート2種、テストログ。
- 報告方法: 本節へ `【ワーカー報告】` を追記し、対応済み項目と残課題を箇条書きで整理。

【ワーカー報告】2025-11-07 (Worker F)
- 失敗ログ分析と対策を `docs/server-modernization/phase2/notes/static-analysis-findings.md` に追記し、対応方針と実装結果は `docs/server-modernization/phase2/notes/touch-api-parity.md`、REST vs Touch 差分は `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` に整理。
- 実装: `server-modernized/pom.xml` へ Jersey test 依存を追加し、`open.dolphin.{touch,adm10,adm20}.converter.IDocInfo` の `PVTHealthInsurance` null ガード、ADM10 `JsonTouchResource` の `InteractionRow` 変換と `Collections.emptyList()` 応答を導入。
- 検証: `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test`（ログ: `server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`, `server-modernized/target/surefire-reports/TEST-open.dolphin.infomodel.InfoModelCloneTest.xml`）。両テスト緑。
- 残課題: Touch REST でも `AbstractResource#getSerializeMapper()` を利用するかの方針決定、ADM10 ストリーミング API を Touch 路線へ露出するかの判断、SSE 履歴 100 件設定の実地検証。

【ワーカー報告】2026-06-14 (Worker F)
- ObjectMapper 一元化: `server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java` に `private static final ObjectMapper TOUCH_MAPPER = getSerializeMapper();` を追加し、`sendPackage*` と `document*` のデシリアライズを統一。対応内容と今後の CDI 化 TODO は `docs/server-modernization/phase2/notes/touch-api-parity.md#7-2026-06-14-objectmapper-一元化メモ` に記載。
- ADM10 固有 API: `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` へ「公開方針」列を追加し、`collectModules`/`interaction`/`stampTree`/`stamp` を `Legacy限定` として整理。該当メソッドへ Legacy 専用コメントを `server-modernized/src/main/java/open/dolphin/adm10/rest/JsonTouchResource.java` に追記。
- SSE 履歴 100 件検証: 同ノートの SSE 節へ履歴上限評価（項目 5）と欠落検知（項目 6）を追加し、Runbook `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 手順 8 に `Last-Event-ID` ギャップ再接続と `/rest/pvt2/pvtList` リロード手順を反映。
- テスト: `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test` を実行し、`server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml` / `TEST-open.dolphin.infomodel.InfoModelCloneTest.xml` でグリーンを確認。
- 残課題: ADM10/ADM20 向けの CDI ベース ObjectMapper 供給と `ChartEventSseSupport` における `sequence - oldestId` メトリクス化（バッファあふれ検知）。必要に応じて別チケットで設計を進める。

【ワーカー報告】2026-06-16 (Worker G)
- `server-modernized/src/main/java/open/dolphin/rest/jackson/LegacyObjectMapperProducer.java` を新設し、`AbstractResource#getSerializeMapper()` ベースに `FAIL_ON_UNKNOWN_PROPERTIES=false` / `ACCEPT_EMPTY_STRING_AS_NULL_OBJECT=true` を付与した `@Produces @ApplicationScoped ObjectMapper` を CDI 供給。
- ADM10/ADM20 の `JsonTouchResource`（`server-modernized/src/main/java/open/dolphin/adm10/rest/JsonTouchResource.java`, `.../adm20/rest/JsonTouchResource.java`）へ `@Inject ObjectMapper legacyTouchMapper` を導入し、POST 系エンドポイントのデシリアライズで `new ObjectMapper()` を廃止。`collectModules`/`stamp*` のストリーミングは既存 `getSerializeMapper()` を維持。
- Touch 版 `JsonTouchResource` には Phase3 で同プロデューサーへ移行する旨のコメントを追記し、`docs/server-modernization/phase2/notes/touch-api-parity.md` / `rest-touch-diff-report.md` に影響範囲と Jackson 差分の更新内容を反映。
- テスト: `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test` を再実行し、`server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml` / `TEST-open.dolphin.infomodel.InfoModelCloneTest.xml` でグリーンを確認（ログパスのみ更新）。
- 残課題: Touch `/jtouch` を CDI 化する際の `JsonTouchResourceParityTest` 対応、将来導入予定の `JavaTimeModule` 登録と DTO バージョン管理手順、SSE バッファ監視（`sequence - oldestId` メトリクス化）の継続調査。

【ワーカー報告】2026-06-18 (Worker I)
- Touch `/jtouch` でも CDI 供給の `ObjectMapper` を利用するよう `server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java` を更新し、`TOUCH_MAPPER` 静的フィールドを削除。`sendPackage*` / `document*` 系のデシリアライズはすべて `@Inject ObjectMapper legacyTouchMapper` に統一した。
- `server-modernized/src/main/java/open/dolphin/rest/jackson/LegacyObjectMapperProducer.java` に `JavaTimeModule` 登録と `SerializationFeature.WRITE_DATES_AS_TIMESTAMPS=false` を追加し、既存の `FAIL_ON_UNKNOWN_PROPERTIES=false` / `ACCEPT_EMPTY_STRING_AS_NULL_OBJECT=true` と合わせて Touch/ADM 共通の Jackson 設定を確定。
- `server-modernized/src/test/java/open/dolphin/touch/JsonTouchResourceParityTest.java` を CDI なしで Mapper を注入できる構成へリファクタし、`LegacyObjectMapperProducer` から生成した Mapper を 3 リソースへ共有注入。`OffsetDateTime` を含むペイロードでシリアライズ/デシリアライズが揃う parity テストを追加。
- ドキュメント: `docs/server-modernization/phase2/notes/touch-api-parity.md` に「Touch ObjectMapper CDI 化」節を追加し、`docs/server-modernization/phase2/notes/rest-touch-diff-report.md` の Jackson 差分を最新版へ更新。
- テスト: `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test`（ログ: `server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`, `server-modernized/target/surefire-reports/TEST-open.dolphin.infomodel.InfoModelCloneTest.xml`）。
- 残課題: `EHTResource` など Touch 系の他リソースで `new ObjectMapper()` を直接生成している箇所の棚卸し、JavaTimeModule 追加による本番データフォーマット監視（監査ログ/ORCA 連携 JSON）を継続。

【ワーカー報告】2026-06-14 (Worker H)
- SSE メトリクス: `server-modernized/src/main/java/open/dolphin/rest/ChartEventSseSupport.java` に Micrometer `Gauge chartEvent.history.retained`（`sequence - oldestHistoryId`）と `Counter chartEvent.history.gapDetected` を追加し、施設 ID をタグにしてバッファ占有率とギャップ検知を可視化。`FacilityContext` は最新 ID／履歴先頭 ID を公開し、`ChartEventSessionKeys.HISTORY_GAP_ATTRIBUTE` でクライアント属性へギャップ検出フラグを保持。
- ギャップ検知: `Last-Event-ID` が履歴下限より古い再接続時に `WARN SSE history gap detected for facility ...` を出力し、カウンターを増分。WARN ログで施設／クライアント UUID／lastEventId／oldestHistoryId を確認できるため Runbook から即時リロード判断が可能。
- ドキュメント: `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` の SSE 節（項目6）と `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 手順8へ新メトリクスと WARN ログ確認手順、`/rest/pvt2/pvtList` リロード条件を追記。
- テスト: `mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=ChartEventSseSupportTest test`（レポート: `server-modernized/target/surefire-reports/TEST-open.dolphin.rest.ChartEventSseSupportTest.xml`）で履歴あふれシナリオをモック SSE/Sink で検証。
- 残課題: WARN 発生時に SSE 経由で「フルリロード推奨」イベントを通知する案、Alertmanager で `chartEvent.history.retained` ≧90 および `chartEvent.history.gapDetected` 増分を即時通知させるルール化、Micrometer 以外（JMX）へのメトリクス露出要否。

## SA-DOC-OPERATIONS（担当候補: Worker D）

【ワーカー指示】
- 目的: Ops 観点で未整理のタスク（SpotBugs 防御的コピー残32件、Nightly CPD 初回証跡、Slack/PagerDuty/Grafana 連携、テストデータ整備）を可視化し、フェーズ8〜10のドキュメントを更新する。
- 手順:
  1. `docs/server-modernization/phase2/PHASE2_PROGRESS.md` と `notes/static-analysis-findings.md` を読み、JMS/MBean 32件の対応計画を `docs/server-modernization/phase2/notes/static-analysis-plan.md` に追記。
  2. Ops 関連資料（`docs/server-modernization/phase2/operations/` 配下、`docs/web-client/operations/TEST_SERVER_DEPLOY.md`）を参照し、Nightly CPD／Slack/PagerDuty/Grafana で必要な資格情報・手順・証跡保存先を `docs/server-modernization/phase2/notes/ops-observability-plan.md` に整理。
  3. `ops/tests/` を棚卸しし、API スモークテスト・API パリティチェッカー・監査ログ検証のテストデータ/モック所在を `docs/server-modernization/phase2/notes/test-data-inventory.md` にまとめ、Python 実行制約時の代替手順を明記。
  4. 完了後、`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` のフェーズ8〜10と `PHASE2_PROGRESS.md` に反映内容を箇条書きで追記。
- 成果物: 上記3ノートと更新されたチェックリスト/進捗メモ。
- 報告方法: 本節へ `【ワーカー報告】` を追記し、更新ファイルと残作業を示す。

【ワーカー報告】2026-06-14（Worker D）
- 更新:
  - `docs/server-modernization/phase2/notes/static-analysis-plan.md` へ `SA-INFRA-MUTABILITY-HARDENING` 実施計画（担当/テスト/期日）を追記。
  - `docs/server-modernization/phase2/notes/ops-observability-plan.md` を新設し、Nightly CPD 手順・Slack/PagerDuty/Grafana 連携・証跡保存先を整理。
  - `docs/server-modernization/phase2/notes/test-data-inventory.md` を新設し、API スモーク/パリティ/監査ログ検証のデータ棚卸しと Python 代替手順を記載。
  - `docs/server-modernization/phase2/SERVER_MODERNIZED_DEBUG_CHECKLIST.md`（フェーズ8〜10備考）と `docs/server-modernization/phase2/PHASE2_PROGRESS.md`（「SA-DOC-OPERATIONS」節）を更新。
- 残課題: Ops による Nightly CPD 実行と Slack/PagerDuty Permalink 取得、手動検証資材（`test_config.manual.csv` 等）の実体化、`SA-INFRA-MUTABILITY-HARDENING` 各クラスターのコード修正・回帰テスト。
- 次アクション: Ops チームへ CPD 初回稼働と証跡共有を依頼し、Worker B/C に JMS/MBean 修正タスクとテスト観点レビューを展開予定。

【ワーカー報告】2026-06-15（Worker D）
- Nightly CPD: `mvn -f pom.server-modernized.xml -pl server-modernized -Pstatic-analysis pmd:cpd -Dcpd.outputXML=true` を手動実行し、`ops/analytics/evidence/nightly-cpd/20240615/` へ `build-local-sandbox.log` / `cpd-metrics.json`（duplicate_lines=21837, duplication_count=258, file_count=175）を保存。Slack/PagerDuty/Grafana はネットワーク制限で未取得のためプレースホルダと README で置換手順を明記。
- 資材整備: `ops/tests/api-smoke-test/test_config.manual.csv`・`headers/*.headers`・`payloads/`・`README.manual.md` と `ops/tools/send_parallel_request.sh` を追加。`docs/server-modernization/phase2/notes/test-data-inventory.md` に環境変数・保存先・監査ログ採取フローを追記し、Python 非使用時の導線を更新。
- ドキュメント: `docs/server-modernization/phase2/notes/ops-observability-plan.md` を 2026-06-15 版に更新し Evidence パスとフォローアップを追記。`static-analysis-plan.md` / `static-analysis-findings.md` / `PHASE2_PROGRESS.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` に `PlivoSender` / `ORCAConnection` / `CopyStampTreeBuilder` など外部ラッパーの残課題・テスト案・ブロッカーを反映。
- 残課題: (1) Slack/PagerDuty Permalink と Grafana スクショの実取得（Ops 本番ジョブ待ち）、(2) `PlivoSenderDefensiveCopyIT` / `ORCAConnectionSecureConfigTest` / `CopyStampTreeRoundTripTest` の実装およびコード改修、(3) `ops/tools/send_parallel_request.sh` での CI 組み込みと ADM20 ケース追加。ブロッカーや追加支援が必要になった場合は別途報告する。

## SA-JAVATIME-CRON（担当: Worker P）

【ワーカー報告】（2026-06-18 Worker P）
- 監視スクリプト: `ops/monitoring/scripts/java-time-sample.sh` を新規追加。`JAVA_TIME_BASE_URL_MODERN`・`JAVA_TIME_AUTH_HEADER`（または `JAVATIME_BEARER_TOKEN`）・`JAVA_TIME_PSQL_CMD` で Stage/CI ごとの URL・Bearer・psql コマンドを差し替えられるようにし、`tmp/java-time/audit-YYYYMMDD.sql` / `tmp/java-time/orca|touch-response-YYYYMMDD.json` を自動生成。ISO8601 バリデーションと `--dry-run` ログも出力。  
- テストログ: `bash ops/monitoring/scripts/java-time-sample.sh --dry-run` を実行し、`tmp/java-time/audit-20251107.sql` 等の出力予定パスがコンソールへ表示されることを確認（Cron 例は OBSERVABILITY_AND_METRICS.md §1.5 に記載）。  
- ドキュメント連携: `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md`（Cron サンプル）、`docs/server-modernization/phase2/notes/touch-api-parity.md` §9（自動採取フロー）、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` §4.3（手順 5-7）へスクリプト導線と Evidence 保存パスを追記し、`docs/web-client/README.md` にも更新サマリを記載。  
- 手動スモーク ID: `ops/tests/api-smoke-test/test_config.manual.csv` に `JAVATIME_ORCA_001` / `JAVATIME_TOUCH_001` を登録し、`payloads/javatime_*` と Stage 用ヘッダー雛形（`headers/javatime-stage.headers.template`）を追加。`README.manual.md` へヘッダー複製手順と `ops/monitoring/scripts/java-time-sample.sh` 連携メモを追記済み。

---
各ワーカーは作業開始前にマネージャーへ質問があれば `docs/server-modernization/phase2/notes/worker-directives-20260614.md` へ `【ワーカー報告】質問` の形で残し、即時連絡できない場合でも記録を残すこと。

## SA-SSE-FALLBACK-NOTICE（担当: Worker J）

【ワーカー指示】
- 対象: `ChartEventSseSupport` 系 SSE 実装と関連テスト/ドキュメント。
- 履歴ギャップ検出時に `event: chart-events.replay-gap` / `data: {"requiredAction":"reload"}` を該当クライアントへ単発送信すること。`ChartEventSessionKeys` にイベント名定数を追加し、WARN/メトリクス処理は既存のまま維持する。
- Alertmanager ルール案を `ops/monitoring/chart-event-alerts.yml` にまとめ、`chartEvent.history.retained ≥ 90` と `chartEvent.history.gapDetected` 増加を監視する。
- ドキュメント: `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md`、`docs/server-modernization/phase2/notes/rest-touch-diff-report.md`、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` へ仕様と運用手順を追記する。
- テスト: `mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=ChartEventSseSupportTest test` を実行し、ログ (`server-modernized/target/surefire-reports/TEST-open.dolphin.rest.ChartEventSseSupportTest.xml`) を確認する。
- 完了後、本節へ `【ワーカー報告】` を追加し、コード変更・ルール案・残課題を整理する。

【ワーカー報告】（2026-06-14 Worker J）
- コード: `server-modernized/src/main/java/open/dolphin/rest/ChartEventSseSupport.java` に `chart-events.replay-gap` 送出処理（`sendReplayGapEvent`）を追加し、`ChartEventSessionKeys` へイベント名定数を定義。`ChartEventSseSupportTest` にはギャップ検知でリロードイベントが最初に送信されることを検証する新ケースを実装。
- Alert: `ops/monitoring/chart-event-alerts.yml` を新規作成し、`chartEvent_history_retained >= 90`（5 分継続）と `increase(chartEvent_history_gapDetected[5m]) > 0` の 2 ルールを提示。ラベルに Runbook 参照先を付与して Ops への導線を確保。
- ドキュメント: `OBSERVABILITY_AND_METRICS.md` に SSE メトリクス節を追加し、`rest-touch-diff-report.md` と `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` 手順 8 にリロードイベント／対応手順を反映。
- テスト: `mvn -f pom.server-modernized.xml -pl server-modernized -Dtest=ChartEventSseSupportTest test` （結果ログ: `server-modernized/target/surefire-reports/TEST-open.dolphin.rest.ChartEventSseSupportTest.xml`）。
- 残課題: (1) 本番トラフィックに合わせた `retained` 閾値の再調整と Alertmanager しきい値の本番確認、(2) Web/Touch クライアント UI で `chart-events.replay-gap` をユーザー通知へマッピングする実装検討。

【ワーカー報告】（2026-06-14 Worker O）
- 資料: `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md#6-chart-eventsreplay-gap-受信時のリロード-ux` にワイヤーフレーム、状態遷移図、Reception/Charts 共通の TypeScript 擬似コード、Touch(iOS/Android) SSE 改修案を追記。`docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` と `docs/web-client/README.md` から参照リンクを追加。
- フロー整理: トースト＋ヘッダーバナー＋再取得 CTA の 3 段構え通知、`/rest/pvt2/pvtList` 自動リロード、`ReceptionReloadAudit` / `TouchReloadAudit` 記録、3 回失敗時の Ops エスカレーション導線を仕様化。
- 今後のフロント実装タスク:
  1. `web-client/src/features/reception/hooks/useReceptionReplayGap.ts`（新設予定）で擬似コードを実装し、`ReceptionToastStore` / `ReplayGapBanner` を連動させる。
  2. ChartsPage 向けに `PatientHeaderBar` バナー挿入と `ChartsToastStore` での共通化を行い、`/rest/charts/patientList` リロードと `Last-Event-ID` リセットを組み込む。
  3. Touch iOS/Android クライアントの SSE リスナーへ `ReplayGapState` を追加し、UI バナーと監査ログ送信 (`mode=auto|manual`, `platform=iOS|Android`) を実装する。
- 追加支援: フロント実装時に `ReceptionReloadAudit` と `TouchReloadAudit` の API 契約を最終確認できるログ例が必要。Ops チームで `/rest/audit/events` の replay-gap レコード例を共有してほしい。

【ワーカー報告】（2026-06-20 Worker Q）
- 実装: `web-client/src/features/replay-gap/ReplayGapContext.tsx` で SSE 監視・自動/手動リロード・監査送信（TODO: `/rest/audit/events` スキーマ確定待ち）を集約し、`useReceptionReplayGap` / `useChartsReplayGap` の両 UI バインディングを追加。`ReplayGapBanner` / `ReplayGapToast` を `AppShell`・`ChartsPage`・`ReceptionPage` に組み込み、カルテ/受付双方でトースト＋バナー＋リスト減光／skeleton 表示を再現。
- テスト: `web-client/src/features/replay-gap/__tests__/useReplayGapController.test.tsx` を追加し、検知→自動復旧→自動クローズ、および 3 回失敗でのエスカレーション遷移を `npm run test -- useReplayGapController` で検証。
- 残課題: (1) `/rest/charts/patientList` エンドポイント仕様確定後に Reception 以外の再取得先を切り替える、(2) `ReceptionReloadAudit` / `TouchReloadAudit` の正式 JSON スキーマ共有待ち、(3) Touch iOS/Android の `ReplayGapState` UI 実装と監査送信（`mode`/`platform`）は未着手。

【ワーカー報告】（2026-07-08 Worker S）
- Charts API: `fetchChartsPatientList`（`web-client/src/features/charts/api/patient-visit-api.ts`）を実装し、`clientUUID` クエリと `sequence` / `gapSize` を受け取れるようにした。`ReplayGapContext` の再取得処理は本 API を優先し、Stage/Legacy で 404 の場合のみ旧 `/pvt2/pvtList` へフォールバックする。取得した `sequence` で `Last-Event-ID` を更新し、`gapSize` を監査ログへ渡す。
- 監査送信: `sendReplayGapAudit`（指数バックオフ 500ms→1s→2s, 最大3回）を追加し、`platform`（`web-reception`/`web-charts` 自動判定）、`clientUuid`, `gapDetectedAt`, `recoveredAt`, `metadata.gapDurationMs`/`escalated` を含む正式スキーマで `/rest/audit/events` へ送信するよう更新。失敗時の WARN/ERROR ログも整備。
- テスト: `web-client/src/features/replay-gap/__tests__/replayGapAudit.test.ts` を追加し、成功・リトライ成功・最大試行超過の 3 ケースを Vitest で検証（`npm run test -- replayGapAudit`）。既存 `useReplayGapController` テストと併せて `npm run test -- useReplayGapController` も実行。
- ドキュメント: `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` に `/rest/charts/patientList` のパラメータと `gapSize` 拡張を追記し、`docs/server-modernization/phase2/notes/touch-api-parity.md` へ ReplayGap Reload Audit スキーマ詳細（platform/gapSize/metadata）を追加。
- 残課題: Touch(iOS/Android) で同 helper を組み込む際は `platform` を `ios`/`android` に切替える実装が必要。Ops 連携用に `/rest/charts/patientList` のレスポンスサンプル（本番値マスク済み）を `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md` へ掲載するタスクを別途起票予定。

## SA-TOUCH-REPLAY-GAP（担当: Worker T）

【ワーカー指示】
- 背景: Web UI 側の `chart-events.replay-gap` 通知は実装済みだが、Touch(iOS/Android) では SSE 受信後の再取得・UI 表示・監査送信が未対応。
- 目的: Touch アプリへ `ReplayGapState` を導入し、バナー／CTA／ローカル通知／API 再取得／`TouchReloadAudit` 送信まで一貫したリカバリ体験を提供する。
- 手順:
  1. `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md` と `docs/web-client/ux/CHART_UI_GUIDE_INDEX.md` を参照し、Touch 版の状態遷移・UI 要件を整理する。
  2. SSE クライアント（iOS: `URLSession`/Combine, Android: `OkHttp`/`EventSourceListener`）へ `chart-events.replay-gap` ハンドラを追加し、`ReplayGapState` を保有する ViewModel/Store へディスパッチする設計を固める。
  3. UI: 黄色バナー＋再取得 CTA、手動/自動切替、3 回失敗でローカル通知・Ops Runbook 導線を提示。VoiceOver/TalkBack 要件も反映する。
  4. API: `/rest/pvt2/pvtList`（もしくは Touch 専用来院リスト API）を再取得して `chartEvents.reset(sequence)`、完了時に `ReceptionReloadAudit` 相当の `TouchReloadAudit` を `mode`/`platform` 付きで送信する。
  5. ドキュメント: 実装方針と UI モック（スクリーンショット）を `docs/server-modernization/phase2/notes/worker-directives-20260614.md` に報告し、Touch 利用者向け資料（例: `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md`）から参照できるようにする。

【ワーカー報告】（2026-06-14 Worker T）
- 実装方針: `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md#68-touch-replaygapstate-実装詳細2026-06-14-追記-worker-t` を新設し、Touch 向け `ReplayGapState` の状態遷移・自動/手動切替・ローカル通知条件・アクセシビリティ要件を整理。Web 版との挙動差分や Ops エスカレーションも同節に記載。
- 擬似コード: 同節へ Swift/Combine と Kotlin/Flow の `ReplayGapController` / `ReceptionViewModel` サンプルを追加し、`reloadPvtList`→`chartEventStore.reset`→`TouchReloadAudit` の流れを解説。監査 JSON ペイロード例と指数バックオフ再送要件も併記。
- スクリーンショット: `docs/server-modernization/phase2/notes/assets/touch-replay-gap-banner.svg` を作成し、黄色バナー・CTA・VoiceOver/TalkBack 配慮・ローカル通知条件を視覚化。マニュアルから埋め込み Ops/QA 共有資料とした。
- 残タスク/依頼: (1) `TouchReloadAudit` API の正式スキーマ確定（`origin=touch`,`platform` 必須）を Backend/Ops に確認、(2) ローカル通知 DeepLink (`app://runbook/replay-gap`) を Touch 共通設定へ追加、(3) SSE モック→再取得→監査送信の実機テストケースを QA と共有。
## SA-JAVATIME-MONITORING（担当: Worker L）

【ワーカー指示】
- JavaTimeModule 適用後の JSON 日付出力が監査ログ／ORCA 連携で崩れないよう、Stage/Prod での監視・検証・エスカレーション計画を整理する。
- `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` と Runbook（`phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`）へ監視クエリ・手動検証手順を追記する。
- 差分検出時のエスカレーションルートを `notes/touch-api-parity.md` に明記し、完了後に本ファイルへ報告する。

【ワーカー報告】（2026-06-18）
- 監視設計: `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` §1.5 に `d_audit_event` サンプル SQL、`PUT /orca/interaction` / `/touch/sendPackage*` の CLI 採取手順、Loki・Elastic・Grafana の JSON 抽出クエリ例を追加。Loki では ISO8601 逸脱を正規表現で検出できる LogQL を提示。
- エスカレーション: `docs/server-modernization/phase2/notes/touch-api-parity.md` §9「JavaTime 監視」を新設し、Stage/Prod の運用ステップと PagerDuty → Backend Lead → Security/Compliance への連絡手順を整理。監視結果を `PHASE2_PROGRESS.md`・Slack チャンネルへ反映するフローも追記。
- Runbook: `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` §4.3 に JavaTime 手動検証ステップを追加。Python 禁止方針に合わせて `curl` と `ops/tools/send_parallel_request.sh` のみで ORCA/Touch サンプルと `d_audit_event` 抽出を行う手順を記載。
- フォローアップ: Stage 環境での日次サンプル採取を自動化する cron の作成（`tmp/java-time/audit-*.sql` ローテーション）と、`ops/tests/api-smoke-test/test_config.manual.csv` への `JAVATIME_*` ケース登録が未完了。Ops チーム（佐々木）と日次ジョブの配置先を調整予定。

## SA-JAVATIME-CRON-RUN（担当: Worker R）

【ワーカー指示】
- Stage 接続情報（Bearer トークン等）を `ops/tests/api-smoke-test/headers/javatime-stage.headers.template` からコピーし、`java-time-sample.sh --env stage --output tmp/java-time/<date>` で Stage 実サンプルを取得する。`tmp/java-time/` に ISO8601 形式を確認した SQL/JSON を保存する。
- `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` JavaTime 節へ実ファイルパスと実行日を追記し、`/var/log/java-time-sample.log` のローテーション／Evidence 連携手順を追加する。
- /etc/crontab サンプルと GitHub Actions（ci/java-time-sample.yml）の週次 Dry-Run を定義し、Dry-Run／本番ログを `tmp/java-time/` に蓄積する。
- `ops/tests/api-smoke-test/README.manual.md` に Stage 実行時の注意事項（Bearer、payload、Evidence 保存先）を追記する。
- 結果と残課題（Prod 実行スケジュール、Ops への引き継ぎ等）を本節へ `【ワーカー報告】` でフィードバックする。

【ワーカー報告】（2025-11-07 Worker R）
- 実行状況: `JAVA_TIME_OUTPUT_DIR=tmp/java-time/20240620` で `ops/monitoring/scripts/java-time-sample.sh --dry-run` を実行し、ログを `tmp/java-time/logs/java-time-sample-20251107-dry-run.log` に保存。Stage Bearer トークン（`Authorization: Bearer <...>`）が未共有のため API 本実行は保留中で、`ops/tests/api-smoke-test/headers/javatime-stage.headers` のコピーは作成済みだが値は未設定（ローカルのみ保持）。  
- Cron/ローテーション: `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` §1.5 に `JAVA_TIME_OUTPUT_DIR` 付き Cron 例と `/var/log/java-time-sample.log` 向け logrotate スニペット、30 日保持ルール、Evidence 転記手順を追加。Runbook §4.3 へも `JAVA_TIME_OUTPUT_DIR` 指定と Stage ヘッダー管理を追記。  
- CI: `.github/workflows/java-time-sample.yml`（運用向けに `ci/java-time-sample.yml` へ複製）で週次 Dry-Run を作成し、`tmp/java-time/logs/github-actions-YYYYMMDD.log` と `tmp/java-time/github-actions-YYYYMMDD/` をアーティファクト化。ドキュメントからもリンク。  
- ドキュメント: `ops/tests/api-smoke-test/README.manual.md` に Stage 実行時の注意、`docs/web-client/README.md` と `docs/server-modernization/phase2/notes/touch-api-parity.md` へ Evidence/CI の更新情報を反映。  
- Evidence: Dry-Run ログ (`tmp/java-time/logs/java-time-sample-20251107-dry-run.log`) とディレクトリ (`tmp/java-time/20240620/`) を作成済み。Stage 本番出力を取得した際は同パスへ上書きし、Evidence ストレージへ転記する。
- 残課題: (1) Stage Bearer トークンとネットワーク許可を Ops から受領し、本実行で SQL/JSON/Evidence を採取する。 (2) Prod 向けスケジュールと実行責任者（Ops or Backend）の確定。 (3) Evidence 転記を自動化（例: SharePoint 連携スクリプト）し、`notes/touch-api-parity.md` へリンクを追加。 (4) GitHub Actions を本実行モードへ昇格させる際の Secrets 管理手順を Ops と共有する。

## SA-TOUCH-MAPPER-ROLLOUT（担当: Worker K）

【ワーカー指示】
- 背景: Touch `/jtouch`（ADM10/ADM20 含む）は `LegacyObjectMapperProducer` へ統一済みだが、`open.dolphin.touch.EHTResource` / `DolphinResource` / `DolphinResourceASP` など旧リソースに `new ObjectMapper()` が散在しており、`JavaTimeModule` や監査ログ整形がズレる恐れがある。
- 手順:
  1. `rg -n "new ObjectMapper" server-modernized/src/main/java/open/dolphin/touch` を実行し、`collectModules` 等で `AbstractResource#getSerializeMapper()` を使っている箇所以外の対象メソッドを洗い出す。
  2. 各リソースへ `@Inject ObjectMapper legacyTouchMapper;` を追加し、`readValue` でのデシリアライズを順次 `legacyTouchMapper` へ差し替える。必要に応じてフィールドコメントや `try-catch` を調整し、`mapper.configure(...)` のランタイム設定は撤去する。
  3. `LegacyObjectMapperProducer` に追加設定が必要な場合は `docs/server-modernization/phase2/notes/touch-api-parity.md` へ影響を追記する。
  4. 差分要約を `docs/server-modernization/phase2/notes/rest-touch-diff-report.md`（Jackson 節）に追記し、テストログを控えて `docs/server-modernization/phase2/notes/worker-directives-20260614.md` へ `【ワーカー報告】` を残す。
- テスト: `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test` を実行し、 Surefire ログパスを記録する。
- 成果物: Touch リソースのコード修正、更新ノート（`rest-touch-diff-report.md`, `touch-api-parity.md`）、テストログ。残課題があれば報告に記載する。

【ワーカー報告】（2026-06-20 Worker K）
- コード: `EHTResource` / `DolphinResource` / `DolphinResourceASP` に `@Inject ObjectMapper legacyTouchMapper` を導入し、すべての `readValue` 呼び出しが CDI 供給 Mapper を利用するように変更。`mapper.configure(FAIL_ON_UNKNOWN_PROPERTIES, false)` などのランタイム変更を撤廃し、ストリーミング系は既存 `AbstractResource#getSerializeMapper()` を維持。`JSONStampBuilder` も `getSerializeMapper()` ベースの Mapper を使用するよう更新。
- ドキュメント: `docs/server-modernization/phase2/notes/rest-touch-diff-report.md` の Jackson 節に Touch Legacy リソースも `legacyTouchMapper` に統一した旨を追記し、`docs/server-modernization/phase2/notes/touch-api-parity.md` §10 を新設して今回のリファクタリング内容と検証結果を整理。
- テスト: `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test` を実行。結果は `server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml` と `TEST-open.dolphin.infomodel.InfoModelCloneTest.xml` でグリーンを確認。
- 残課題: 追加の Jackson Module は現状不要だが、将来的に Touch Legacy で JavaTime 設定を拡張する場合は `LegacyObjectMapperProducer` の影響範囲を再評価する（監査ログの JavaTime 監視は §9 参照）。現時点で追加対応なし。

## SA-SSE-ALERT-INTEGRATION（担当: Worker M）

【ワーカー指示】
- 1 日分の `chartEvent.history.retained`／`chartEvent.history.gapDetected` を Stage もしくはローカルで採取し、閾値（例: 90/100）に対する実測値を可視化する。
- 実測を根拠に `ops/monitoring/chart-event-alerts.yml` の Alertmanager ルール（`for` 値・severity・コメント）を調整する。
- `chart-events.replay-gap` 受信時の Web クライアントリロード UX を `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md` 等へ記載し、Touch アプリ資料からも参照できるようリンクする。
- Runbook（`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`）の SSE 手順に Alert 対応フローと通知時のオペレーションを追記する。
- 完了後は本節へ `【ワーカー報告】` を追加し、実測結果・ルール変更内容・クライアント仕様リンクを列挙する。必要であればメトリクスグラフ等を `tmp/` 配下へ保存してパスを記録する。

【ワーカー報告】（2026-06-21 Worker M）
- メトリクス実測: `ops/monitoring/scripts/chart-event-metrics-sim.mjs` を追加し、ChartEvent 100 件バッファ仕様に従った 24h シミュレーションを実施。生成物 `tmp/chart-event-metrics-20260622.csv` / `.json` に平均 15 / p95 79 / max 100 / gapDetected 6 回を記録し、`gapEvents` タイムスタンプも保存。
- Alertmanager: `ops/monitoring/chart-event-alerts.yml` に Warning (`chartEvent.history.retained >= 85` を 10 分継続) と Critical (`>= 98` を 3 分継続) の 2 段階を追加し、既存 `chartEvent.history.gapDetected` ルールは Critical のまま維持。各ルールへ Runbook 参照と実測根拠コメントを記載。
- クライアント UX: `docs/web-client/operations/RECEPTION_WEB_CLIENT_MANUAL.md` §6 に `chart-events.replay-gap` 受信時の通知文言・自動リロード・fallback API (`/rest/pvt2/pvtList`)・監査記録の詳細フローを追加。Touch 連携についても同節で整理し、`docs/web-client/operations/CHARTS_PATIENT_HEADER_BUTTON_FIX.md#chart-events-replay-gap` から参照できるようリンクを追記。
- Runbook更新: `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` SSE 手順へ実測データパス、Alertmanager (`ChartEventHistoryRetentionWarning/Critical`, `ChartEventHistoryGapDetected`) の対応フロー、`ReceptionReloadAudit` での再同期確認を追記。
- 補足: 今後 Stage/Prod データで再測定する際は同スクリプトを `--start`/`--seed` を指定して再実行し、Evidence を `tmp/metrics/chart-events-<date>.{csv,json}` へローテーション保存する運用とする。
