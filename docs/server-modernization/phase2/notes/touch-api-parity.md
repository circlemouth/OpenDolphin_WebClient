
# SA-TOUCH-API-PARITY 対応メモ（Worker F）

## 1. テスト失敗サマリ
- `JsonTouchResourceParityTest` は 17 ケース中 7 件が `jakarta.ws.rs.ext.RuntimeDelegate` のプロバイダ未設定で失敗し、`JsonTouchAuditLogger.failure`（`server-modernized/src/main/java/open/dolphin/touch/JsonTouchAuditLogger.java`）内で `Response.serverError()` を構築できず `RuntimeDelegate.findDelegate` が `ClassNotFoundException` を投げている（ログ: `server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`）。
- `InfoModelCloneTest` は現状グリーンだが、`mvn -pl server-modernized ...` を単独で実行すると Maven が中央リポジトリから古い `opendolphin-common` を探しに行くため、`DocInfoModel.clone`（`common/src/main/java/open/dolphin/infomodel/DocInfoModel.java`）や `ModuleInfoBean.clone` の `admFlag`/`performFlag` 複製コードが取り込まれず再発する恐れがある。

## 2. 対応方針
1. **テスト専用 JAX-RS 実装の導入**  
   - `server-modernized/pom.xml` に `org.glassfish.jersey.core:jersey-common:3.1.5`（scope=`test`）を追加し、`RuntimeDelegate` を ServiceLoader で解決可能にする。WildFly 実行時はアプリサーバーがプロバイダを提供するため、本番バイナリへは影響しない。 
2. **ビルド順序の固定**  
   - 失敗再発防止として Phase2 のビルドガイドへ「`mvn -f pom.server-modernized.xml -pl server-modernized -am ...` で常に `common` を同時ビルドする」旨を追記する。必要なら `docs/server-modernization/phase2/PHASE2_PROGRESS.md` にもメモ化。 
3. **DTO / Jackson 設定の確認**  
   - `JsonTouchResource`（`server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java`）と `open.dolphin.adm10.rest.JsonTouchResource`/`adm20` で `new ObjectMapper()` を毎回生成しており、`Touch`/`ADM` どちらもデフォルト設定を利用していることを検証済み。今回の修正で DTO マッピングや Jackson 設定の変更は不要。今後差異が生じた場合に備え、`JsonTouchSharedService` で `ObjectMapper` を共有化する案を別タスクで検討する。  
   - **2026-06-16 追記**: ADM10/ADM20 は `open.dolphin.rest.jackson.LegacyObjectMapperProducer` から CDI 注入される共有 `ObjectMapper` へ移行し、`FAIL_ON_UNKNOWN_PROPERTIES=false`・`ACCEPT_EMPTY_STRING_AS_NULL_OBJECT=true` を既定化。Touch 側は `TOUCH_MAPPER` 維持だが、コメントで Phase3 の CDI 置き換え方針を周知した。 

## 3. 影響範囲とリスク
- **影響箇所**: `pom.server-modernized.xml`（依存追加）、`server-modernized/pom.xml`（test dependency 追加）のみ。アプリケーションコードや DTO へ変更は発生しない。 
- **リスク**: 
  - テストクラスパスに Jersey が入ることで、JAX-RS API が意図せず実装クラスへバインドされる可能性がある。ただし scope=`test` に限定し、`wildfly-maven-plugin` の実行パスとは分離されるため実運用バンドルへの混入はない想定。 
  - InfoModel clone テストが再度赤くなる場合、`opendolphin-common` のクラスパス探索順を追加で調査する。必要であれば `maven-surefire-plugin` に `dependenciesToScan` で `opendolphin` を強制指定する。 

## 4. 確認手順
1. `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test`
2. ログ格納先: `server-modernized/target/surefire-reports/`（`TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`, `TEST-open.dolphin.infomodel.InfoModelCloneTest.xml`）。
3. `JsonTouchResourceParityTest` が全緑であること、`InfoModelCloneTest` が 2/2 パスであることを確認し、`docs/server-modernization/phase2/notes/worker-directives-20260614.md` の該当節にログパスを記録する。 

## 5. 未決事項 / TODO
- WildFly（実サーバ）での監査ログ整形は `JsonTouchAuditLogger` へ Jersey 依存を追加せずとも機能するかの確認を Phase3 シナリオ（SSE 再接続含む）で実施予定。
- `rest-touch-diff-report.md` で整理する SSE 再接続・DTO 差分の分析結果を踏まえ、必要なら Touch/ADM/REST 共通の DTO コンバータへ Jackson Module を適用する。 

## 6. ReplayGap Reload Audit スキーマ（2026-07-xx 更新）

- `ReceptionReloadAudit` / `TouchReloadAudit` 共通で下記フィールドを送信する。
  - `action`: 固定で `replay-gap.reload`。
  - `reason`: 固定で `replay-gap`。
  - `origin`: `web-client` / `touch` などアプリ種別。
  - `platform`: Web では `web-reception` / `web-charts` を、Touch では `ios` / `android` を指定し、Ops が端末系統を特定できるようにする。
  - `mode`: `auto` or `manual`。SSE 受信直後の自動再取得か、ユーザーが CTA を押したかを区別。
  - `status`: `success` / `failure`。3 回失敗で Escalated になった場合でも `failure` を維持し、`metadata.escalated=true` で区別。
  - `attempts`: 直近のリロード試行回数。指数バックオフ（500ms,1s,2s）で最大 3 回リトライする。
  - `clientUuid`: ログイン時に発行した `clientUUID`。SSE/排他制御と突合するため必須。
  - `lastEventId`: SSE の `Last-Event-ID`。`/rest/charts/patientList` レスポンスの `sequence` で上書きする。
  - `gapSize`: `ChartEventSseSupport` が返す `sequence - oldestHistoryId`。欠落件数の推定に利用。
  - `gapDetectedAt` / `recoveredAt`: ギャップ検知と復旧の ISO8601 タイムスタンプ。
  - `metadata.gapDurationMs`: `gapDetectedAt` から `recoveredAt` までの経過時間。`metadata.escalated` は Ops Escalation ガイドのトリガー。
- Web 実装（`web-client/src/features/replay-gap/ReplayGapContext.tsx`）では上記スキーマを満たす JSON を `/rest/audit/events` へ送信し、HTTP 失敗時は 3 回まで指数バックオフで再送する。Touch 実装でも同じ helper（`sendReplayGapAudit`) を流用する予定。

## 7. base_readonly スモーク (2025-11-09)

- 実行コマンド: `BASE_URL_LEGACY=http://localhost:8080/openDolphin/resources BASE_URL_MODERN=http://localhost:9080/openDolphin/resources ./ops/tests/api-smoke-test/run.sh --dual --scenario base_readonly`
- 証跡: `artifacts/parity-manual/smoke/20251108T212422Z/{legacy,modernized}/`（`metadata.json` にシナリオ/ケース/実行時刻を記録）。
- 対象ヘッダー: `ops/tests/api-smoke-test/headers/legacy-default.headers`（`1.3.6.1.4.1.9414.72.103:doctor1` 認証）。
- 目的: 読取専用 API の最小セット（`/dolphin`, `/serverinfo/jamri`, `/mml/patient/list/<fid>`）で Legacy / Modernized のレスポンスシェイプを比較し、以降の POST 系シナリオに備えて CLI & DB シード手順を確立する。

| Endpoint | Legacy 結果 | Modernized 結果 | 差分/備考 |
| --- | --- | --- | --- |
| `GET /dolphin` | 200 / ボディ `"Hellow, Dolphin"`。ヘッダーは `X-Powered-By: Undertow/1`, `Server: WildFly/10`, `Content-Type: text/plain` のみ。 | 200 / ボディ同一。`Referrer-Policy`, `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Trace-Id` などセキュリティ系ヘッダーが追加。 | ペイロードは一致。Modernized 側の追加ヘッダーはセキュリティ要件と合致するため受け入れ済み。 |
| `GET /serverinfo/jamri` | 200 / ボディ長 0。`custom.properties` の `jamri.code` が未設定。 | 200 / 同じく空文字。 | 両系統とも設定欠如。インフラが `custom.properties` を同期するまで `docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` へフォローアップを記載。 |
| `GET /mml/patient/list/1.3.6.1.4.1.9414.72.103` | 200 / `7001,7002,7003,7004,7005,7006,7007,7008,7009,7010`。 | 200 / 同一。 | `api_smoke_seed.sql` で投入した 10 件の合成患者が双方で取得できることを確認。CSV 並び順・改行とも完全一致。 |

- 追加タスク: `/serverinfo/*` の値を `custom.properties` シードに含める、`base_readonly` に `/karte/docinfo`, `/orca/tensu/name` など業務代表 API を追加し、差分が発生した場合は本ノートへ追記する。

## 6. 2025-11-07 実装サマリ
- `server-modernized/pom.xml` へ `org.glassfish.jersey.core:jersey-common:3.1.5`（test scope）を追加し、`JsonTouchAuditLogger` が JAX-RS `RuntimeDelegate` を利用する単体テストでもプロバイダ解決できるようにした。
- `open.dolphin.{touch,adm10,adm20}.converter.IDocInfo` の `toModel()` で `IPVTHealthInsurance` が `null` の場合は `setPVTHealthInsuranceModel` をスキップするよう統一し、簡易ペイロードでの `NullPointerException` を解消。
- `open.dolphin.adm10.rest.JsonTouchResource#checkInteraction` に `InteractionRow` DTO を追加し、レスポンス JSON のキーを Legacy (`drugcd`, `drugcd2`, `syojyoucd`, `syojyou`) に合わせて整形。空配列応答時は `Collections.emptyList()` を返すようにして監査ログの `interactionCount` も正しく記録されるよう調整。
- `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test` を実行し、`server-modernized/target/surefire-reports/` の 2 つの XML ログでグリーンを確認（記録済み）。

## 7. 2026-06-14 ObjectMapper 一元化メモ
- Touch `/jtouch` の POST 系エンドポイントで `new ObjectMapper()` を逐次生成していたが、`AbstractResource#getSerializeMapper()` が適用している `JsonInclude.NON_NULL` 等の Jackson 設定と乖離していたため、`JsonTouchResource` に `private static final ObjectMapper TOUCH_MAPPER = getSerializeMapper();` を追加してすべてのデシリアライズ処理を集約した（`server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java`）。
- CDI で `ObjectMapper` をプロデュースする案も検討したが、`JsonTouchResourceParityTest` が直接インスタンスを生成しているため注入破綻リスクがあること、`adm20` 系では `FAIL_ON_UNKNOWN_PROPERTIES=false` など別設定が必要なため今回は `AbstractResource` ベースの共有に留めた。Phase3 で `TouchObjectMapperProvider`（CDI）を導入し、必要に応じて `JavaTimeModule` などの Module を一括登録できる構成へ移行する。
- 影響範囲は Touch リソースのみで、既存の監査ログや `JsonTouchResourceParityTest` への影響はなし。`adm10`/`adm20` の `ObjectMapper` も順次本方針へ寄せる際は、`DeserializationFeature` の追加設定とモジュール登録手順をここで追記する。
- **2026-06-16 追記**: ADM10/ADM20 向けに `LegacyObjectMapperProducer`（`server-modernized/src/main/java/open/dolphin/rest/jackson/LegacyObjectMapperProducer.java`）を追加し、`@Produces @ApplicationScoped ObjectMapper` を CDI 供給。`JsonTouchResource`（ADM10/ADM20）は `@Inject ObjectMapper legacyTouchMapper` で POST 系のデシリアライズを統一し、`collectModules`/`stamp*` などストリーミング系のみ従来通り `getSerializeMapper()` を使用する。Touch 版には「Phase3 で CDI へ寄せる」コメントを追記し、テストの準備が整い次第差し替え予定。

## 8. Touch ObjectMapper CDI 化（2026-06-18）
- Touch 版 `JsonTouchResource` を ADM10/20 と同様に CDI から `ObjectMapper` を注入する構成へ移行し、従来の `TOUCH_MAPPER` 静的フィールドを撤廃（`server-modernized/src/main/java/open/dolphin/touch/JsonTouchResource.java`）。コメントで Phase3 に `JavaTimeModule` など追加モジュールを集約する計画も追記した。
- `LegacyObjectMapperProducer`（`server-modernized/src/main/java/open/dolphin/rest/jackson/LegacyObjectMapperProducer.java`）へ `JavaTimeModule` 登録と `SerializationFeature.WRITE_DATES_AS_TIMESTAMPS=false` を加え、`FAIL_ON_UNKNOWN_PROPERTIES=false` / `ACCEPT_EMPTY_STRING_AS_NULL_OBJECT=true` と併せて Touch/ADM 共通の Jackson 設定を確定。ISO8601 文字列表現は従来通り維持されることを確認済み。
- `JsonTouchResourceParityTest` は `LegacyObjectMapperProducer` から生成した `ObjectMapper` を手動で各リソースへ注入するセットアップへ変更し、`OffsetDateTime` を含む JavaTime ペイロード (`{"issuedAt":"2026-06-18T09:15:30+09:00"}`) をパース／シリアライズする追加テストで `JavaTimeModule` が有効に機能することを検証した。
- 検証コマンド: `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test`。Surefire ログ: `server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`, `server-modernized/target/surefire-reports/TEST-open.dolphin.infomodel.InfoModelCloneTest.xml`。

## 9. JavaTime 監視（2026-06-18 追加）

### 9.1 目的と監視対象
- `d_audit_event.payload` に記録される `issuedAt` / `createdAt` / `timestamp` 系フィールドが JavaTimeModule 適用後も常に ISO8601（`WRITE_DATES_AS_TIMESTAMPS=false`）で出力されていることを Stage/Prod の両環境で確認する。
- ORCA 連携 (`PUT /orca/interaction`) と Touch カルテ送信 (`POST /touch/sendPackage`, `/touch/sendPackage2`) のレスポンスおよび監査イベントを対象とし、`X-Trace-Id` をキーフィールドにログ・DB・監査の突合を行う。

### 9.2 運用ステップ
1. **リリース前（Stage）**  
   - `docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` §1.5 の SQL / curl / `ops/tools/send_parallel_request.sh` を用いて 3 サンプル以上を取得。`artifacts/parity-manual/JAVATIME_*` と `tmp/audit-snapshots/java-time-stage.sql` に保存し、`PHASE2_PROGRESS.md` の当該スプリント欄へ記録する。  
   - Loki / Elastic / Grafana のクエリを即時実行し、新旧出力差分が無いことをスクリーンショットで残す。
2. **本番稼働監視**  
   - Grafana の PostgreSQL パネルに `issued_at_epoch = to_unix_timestamp(payload->>'issuedAt')` を追加し、`isnan(issued_at_epoch)` が 0 であることを 15 分間隔でチェック。アラートは PagerDuty サービス「Server-Modernized-API」に配信する。  
3. **エスカレーション**  
   - `chart-events.replay-gap` や JavaTime 逸脱を検知した場合は PagerDuty → Backend Lead → Security/Compliance の順に連絡し、`docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` §4.3 の手動検証ステップで再確認する。`ops/tests/api-smoke-test/test_config.manual.csv` に `JAVATIME_*` ケースを追加し、Python 禁止ポリシーに合わせ `curl` + `ops/tools/send_parallel_request.sh` のみで取得する。

### 9.3 Cron / 自動採取

- `ops/monitoring/scripts/java-time-sample.sh` を Stage / CI ホストに配置し、`JAVA_TIME_BASE_URL_MODERN`・`JAVA_TIME_AUTH_HEADER`（または `JAVATIME_BEARER_TOKEN`）を指定して実行する。`--dry-run` で手順のみ確認できる。  
- スクリプト実行結果は `tmp/java-time/audit-YYYYMMDD.sql`（`d_audit_event`）と `tmp/java-time/orca|touch-response-YYYYMMDD.json` に保存される。Cron で回す場合は `/var/log/java-time-sample.log` へ標準出力を転記し、当日の `notes/touch-api-parity.md` 更新箇所にログパスを記載する。  
- 手動スポットチェックは `ops/tests/api-smoke-test/test_config.manual.csv` の `JAVATIME_ORCA_001` / `JAVATIME_TOUCH_001` を `ops/tools/send_parallel_request.sh` で実行する（ヘッダーは `headers/javatime-stage.headers` を Stage トークンで作成）。取得した `artifacts/parity-manual/JAVATIME_*` を Runbook §4.3 のエビデンスとして添付し、`tmp/java-time/` のファイルと突合して ISO8601 逸脱を確認する。

### 9.4 Evidence / CI（2025-11-07 更新）

- Dry-Run ログ: `tmp/java-time/logs/java-time-sample-20251107-dry-run.log`（`JAVA_TIME_OUTPUT_DIR=tmp/java-time/20240620`）。Stage Bearer トークン待ちのため API 実行は未実施。トークン入手後は同ディレクトリに本番データを採取し、Dry-Run ログは `logs/` 配下で保管する。  
- Cron ログローテーション: `/etc/logrotate.d/java-time-sample` に `daily / rotate 8 / compress / create 0640 ops ops` を設定し、`/var/lib/opendolphin/java-time` 直下の 30 日超データを週間で削除する。削除前に Evidence へ転記し、記録先を本ノートに追記する。  
- GitHub Actions: `.github/workflows/java-time-sample.yml`（ミラー `ci/java-time-sample.yml`）で毎週月曜 00:30 JST に `ops/monitoring/scripts/java-time-sample.sh --dry-run` を実行し、成果物をアーティファクト `java-time-dry-run-log` として残す。実 API 実行へ切り替える際は `JAVATIME_STAGE_TOKEN` シークレットを追加し、`JAVA_TIME_AUTH_HEADER` へ注入する。

## 10. 2026-06-20 Touch Legacy ObjectMapper Rollout
- `/10/eht`（`EHTResource`）、`/touch`（`DolphinResource`）、`/touch` ASP 版（`DolphinResourceASP`）をすべて `@Inject ObjectMapper legacyTouchMapper` へ移行し、これまでメソッド内部で生成していた `new ObjectMapper()` と逐次 `FAIL_ON_UNKNOWN_PROPERTIES=false` 設定を廃止。CDI から供給される `LegacyObjectMapperProducer` の設定（JavaTimeModule、`SerializationFeature.WRITE_DATES_AS_TIMESTAMPS=false` 等）をデシリアライズでも適用できるようにした。
- ストリーミング系のレスポンス整形は従来通り `AbstractResource#getSerializeMapper()` の生成 Mapper を使用する。`JSONStampBuilder` も同メソッドから取得する Mapper に切り替え、`ObjectMapper` のローカル生成を廃止した。
- 監査ログ／例外ハンドリングは既存の `try-catch` を維持しつつ、`legacyTouchMapper` の共有化に伴いリソース内での `mapper.configure(...)` 呼び出しを完全撤去（ランタイム再設定リスク除去）。追加の Jackson Module は今回不要だったため `LegacyObjectMapperProducer` の設定は据え置き。
- 検証: `mvn -f pom.server-modernized.xml -pl server-modernized -am -DfailIfNoTests=false -Dtest=JsonTouchResourceParityTest,InfoModelCloneTest test`（ログ: `server-modernized/target/surefire-reports/TEST-open.dolphin.touch.JsonTouchResourceParityTest.xml`, `server-modernized/target/surefire-reports/TEST-open.dolphin.infomodel.InfoModelCloneTest.xml`）。`JsonTouchResourceParityTest` で Legacy/ADM/Touch すべての JSON 互換が維持されることを確認。

## 11. 2025-11-09 Claim/Diagnosis/MML Smoke（Worker F）
- **JMS プロパティ整備**: `MessagingGateway`／`MessageSender` で使用する JMS ヘッダーを `openDolphinTraceId` / `openDolphinPayloadType` に統一する `MessagingHeaders` を追加し、AMQ139012（Java identifier 以外を指定した場合の Artemis 例外）を解消。`AbstractResource#getRemoteFacility` も null / 区切り文字欠落時にそのまま返すよう防御した。
- **EHT フォールバック / 診断テーブル**: `EHTResource.sendPackage(1/2)` で `StringIndexOutOfBoundsException` を握り潰し、フォールバック時も 0/1 バイトレスポンスと監査ログを返す。`server-modernized/tools/flyway/sql/V0222__diagnosis_legacy_tables.sql` を追加し、`d_facility/d_users/d_patient/d_karte` を Legacy から schema dump → modernized DB へ適用のうえ `d_diagnosis` / `d_diagnosis_seq` を作成。`docker exec opendolphin-postgres-modernized psql ... "SELECT COUNT(*) FROM d_diagnosis;"` で 1 件挿入済みを確認。
- **CLI 実行結果**:  
  - `PUT /20/adm/eht/sendClaim 20251108T213043Z` → Legacy 403（従来通り）、Modernized は Velocity テンプレート `claimHelper.vm` 不在により `ResourceNotFoundException` で 500（JMS enqueue 自体は成功し AMQ139012 は再現せず）。  
  - `POST /karte/diagnosis/claim 20251108T213050Z` → Modernized 200 応答で `d_diagnosis.id=1` を採番。  
  - `PUT /mml/send 20251108T213129Z` → Modernized 200。  
  成果物・ログ・DB スナップショットは `artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/20251108T213140Z/` に保存。
- **テスト**: `cd server-modernized && mvn -Dtest=MmlSenderBeanSmokeTest test`（ログ: `tmp/mvn-mml.log`）。`MmlSenderBeanSmokeTest` は 1/1 パス。
- **残課題**: `claimHelper.vm` をどの WAR/モジュールでバンドルするか決め、`PUT /20/adm/eht/sendClaim` で 2xx 応答と ORCA ACK/NAK を採取する。Legacy 側 403（Basic 認証失敗）も別タスクで要確認。
