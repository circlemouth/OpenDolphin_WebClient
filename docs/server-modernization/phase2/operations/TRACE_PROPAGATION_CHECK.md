# Trace Propagation Check（2026-06-16）

## 1. 手順サマリ
1. `test_config.manual.csv` の `trace-id` 列を使用し、`headers/*.headers` のコピーに `X-Trace-Id` を追記する（例: `tmp/trace/user_profile.headers`）。
2. `BASE_URL_LEGACY` / `BASE_URL_MODERN` と `PARITY_HEADER_FILE` を指定して `ops/tools/send_parallel_request.sh` を実行し、HTTP レスポンスを `artifacts/parity-manual/<CASE>/...` に保存する。
3. `docker logs <container> | perl -pe 's/\e\[[0-9;]*[A-Za-z]//g'` で ANSI コードを除去し、`trace-id` を含む行を `artifacts/parity-manual/TRACEID_JMS/trace/` に退避する。

> **詳細手順:** `docs/server-modernization/phase2/operations/TRACEID_JMS_RUNBOOK.md` に CLI 前提、プロファイル選定、ログ保管パスを統一化した。
## 2. ケース: user_profile (`trace-id=trace-user-profile-manual`)
- **HTTP ログ**: `artifacts/parity-manual/TRACEID_JMS/trace/modern_http.log`
- **SQL ログ**: `artifacts/parity-manual/JPQL/{legacy.log,modernized.log}`
- **観測:**
  - モダナイズ版 `LogFilter` は `traceId=<value>` を INFO 出力しており、`SessionTraceManager` がヘッダー値を継承することを確認した（2 本のログ行が生成されるのは RESTEasy が同一リクエストを 2 回ログする既知挙動）。
  - Legacy `LogFilter` は traceId をログに出力しないため、HTTP ログ単体では `X-Trace-Id` を追跡できない。`SessionTraceManager` も未実装なため、JMS/監査ログへは伝搬しない。
  - user_profile では JMS 連携が発生しない。`artifacts/parity-manual/TRACEID_JMS/trace/README.txt` に対象外である旨を記録した。

## 3. TODO
- JMS 連携が発生するケース（例: `/20/adm/factor2/fido2/enroll` や Touch 送信系）を再現し、`MessagingGateway` → `MessageSender` の traceId 伝搬をログ採取する。
- Legacy `LogFilter` に traceId ログ出力を追加する差分を設計し、SessionTraceManager 相当を導入するか検討する。
- `SessionTraceManager` の DEBUG ログを有効化した状態で例外発生パス（401/500）を採取し、`TRACE_PROPAGATION_CHECK.md` に比較表を追加する。
- `server-modernized/src/main/java/open/dolphin/session/framework/SessionTraceManager.java` は `SessionOperationInterceptor` から渡された `preferredTraceId` と ThreadLocal MDC を同期させるだけで、REST リソース側で `sessionTraceManager.current()` が null のままでも処理を進める。`SystemResource#getActivities` のように REST 層で 400 を返す経路ではセッション層が介在しないため、`LogFilter` が先に `MDC.put("traceId", header)` を完了しているか、もしくは REST 層で明示的に `sessionTraceManager.start(...)` を呼び出して監査ログへ traceId を載せる案を検討する。

## 4. CLI シナリオ（2025-11-08 更新）

| Case ID | API | 期待ステータス | ヘッダープロファイル | `trace-id` | 状態 |
| --- | --- | --- | --- | --- | --- |
| `trace_http_200` | `GET /serverinfo/jamri` | 200 (Jamri コード) | `ops/tests/api-smoke-test/headers/trace-anonymous.headers` | `trace-http-200` | ✅ `ops/tools/send_parallel_request.sh` で実行。証跡: `artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/trace_serverinfo_jamri/` |
| `trace_http_400` | `GET /dolphin/activity/2025,04` | 400 (BadRequest) | `ops/tests/api-smoke-test/headers/trace-session.headers` | `trace-http-400` | ⏳ `d_users` テーブル未整備のため `LogFilter` 認証時に `relation "d_users" does not exist`。DB シード後に再実行。 |
| `trace_http_401` | `GET /touch/user/<param>` | 401 (Credential 欠落) | `trace-session.headers` から `password` 行を除去して送信 | `trace-http-401` | ⏳ 同上。`TouchUserService` へ到達する前に `UserServiceBean#authenticate` が失敗。 |
| `trace_http_500` | `GET /karte/pid/INVALID,%5Bdate%5D` | 500 (NumberFormatException) | `trace-session.headers` | `trace-http-500` | ⏳ `KarteServiceBean` へ到達する前に `LogFilter` 認証が失敗。 |

- `ops/tests/api-smoke-test/test_config.manual.csv` と `rest_error_scenarios.manual.csv` に同シナリオを追記済み。400/401/500 ケースは `Checklist #49/#73/#74` のカバレッジと紐付け、再実行手順を `expected_status` / `notes` に明文化した。
- `ops/tools/send_parallel_request.sh` は `--profile <compose|modernized-dev|legacy-only|remote-dev|custom>` で `send_parallel_request.profile.env.sample` を読み込めるようになった。`modernized-dev` は helper コンテナなど Docker ネットワーク上で `opendolphin-server(-modernized-dev)` へ直アクセスする用途。ホストから直接叩く場合は `compose` を使用し、どうしても `modernized-dev` を使う場合は `/etc/hosts` へ名前解決を追記する。

### 4.1 実行ログとブロッカー

- `artifacts/parity-manual/TRACEID_JMS/20251108T060500Z/trace_serverinfo_jamri/legacy|modern/`  
  - `meta.json` / `headers.txt` / `response.json` を保存済み。`legacy` 側は Modernized URL へフォールバックさせて出力フォーマットを共通化した。
- `artifacts/parity-manual/TRACEID_JMS/20251108T0526Z/legacy_build.log`  
  - `docker compose -f docker-compose.yml up -d db server` で Legacy イメージを再構築した際の失敗ログ。`org.wildfly.extension.micrometer` が WildFly 10.1 には存在せず、`configure-wildfly.cli` が適用できないことを記録。
- `artifacts/parity-manual/TRACEID_JMS/20251108T0526Z/modern_server_full.log`  
  - Modernized 側 `/user/doctor1` 実行時に `relation "d_users" does not exist` で `SessionOperation` が 500 になったスタックトレースを保存。`d_users` / `d_facility` 等の初期データ投入が無いと 200/400/401 ケースは実行できない旨を記載。

> **次ステップ:** `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` を参照して `d_users` ほかテストデータを `db-modernized` と `db` の双方に投入し、`trace_http_400`〜`trace_http_500` を再実行。完了後は本ファイルと `domain-transaction-parity.md` を更新し、Checklist #49/#73/#74 をクローズする。

## 5. 2025-11-09 実行ログ（Compose=local, RUN_ID=20251109T060930Z）
- HTTP 証跡: `artifacts/parity-manual/TRACEID_JMS/20251109T060930Z/trace_http_{200,400,401,500}/`
- WildFly ログ: `artifacts/parity-manual/TRACEID_JMS/20251109T060930Z/logs/modern_trace_http_*.log`

| ケース | 期待 | Legacy | Modernized | 備考 |
| --- | --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 200 | 200 | 200 | Trace ID は modernized のみ INFO 出力（Legacy LogFilter には未実装）。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | 400 | **500** | **500** | Modernized が `UnknownEntityException: AuditEvent`。Legacy も 500 HTML。 |
| `trace_http_401` (`GET /touch/user/...`) | 401 | **500** | **500** | Modernized ログに `Remote user does not contain facility separator`。Legacy は 500 HTML。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 500 | 200 | 400 | Legacy が例外を握り潰し 200。Modernized は JSON デコードエラーを 400 で返却。 |

### 5.1 追加メモ / TODO
1. JMS ログは今回のケースでは発生せず。`/20/adm/factor2/*` や Touch 送信系の Trace 採取が必要。
2. Legacy 側の Trace ID 表示を `LogFilter` へ追加するまで、Legacy HTTP での可視化は未達。
3. `dolphin/activity` と `touch/user` の 500 化により `rest_error_scenarios.manual.csv` も 400/401 を記録できていない。アプリ修正後、同 RUN_ID フォルダへ差分を上書きする。

## 5.2 2025-11-10 追記: RUN_ID=20251110T035118Z（`--profile modernized-dev`）
- HTTP 証跡: `artifacts/parity-manual/TRACEID_JMS/20251110T035118Z/trace_http_{200,400,401,500}/`
- CLI ログ: `artifacts/parity-manual/TRACEID_JMS/20251110T035118Z/logs/send_parallel_request.log`

観測:
- `send_parallel_request.sh --profile modernized-dev` をローカルホスト上で実行すると、Docker Desktop / WSL2 連携が無効なため `opendolphin-server` / `opendolphin-server-modernized-dev` の名前解決に失敗し、全ケースが `curl: (6) Could not resolve host`（`status=000`, `exit=6`）で終了した。
- 同環境では `docker ps` すら実行できず、WSL から Docker Engine へ接続できない (`The command 'docker' could not be found in this WSL 2 distro.`)。よって `server-modernized-dev` コンテナの WildFly ログ取得や `d_audit_event` 連携確認も行えない。

TODO / 対応案:
1. Windows 側の Docker Desktop で当該 WSL ディストリビューションとの統合を有効化し、`docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml up -d` で `opendolphin-server(-modernized-dev)` 名前解決が成立する状態を作る。
2. もしくはホスト側で `compose` プロファイルを利用し `BASE_URL_{LEGACY,MODERN}=http://localhost:{8080,9080}/openDolphin/resources` に切り替える（`TRACEID_JMS_RUNBOOK.md` §3.2 参照）。`modernized-dev` を引き続き使う場合は `/etc/hosts` や VPN ルータで `opendolphin-server*` を名前解決させる。
3. 環境復旧後に `docker logs opendolphin-server-modernized-dev | rg traceId=` を再取得し、`TRACE_PROPAGATION_CHECK.md` の 5.1 表に 4xx/5xx の最新ステータスを反映する。

## 6. 2025-11-10: SessionOperation Trace Harness（RUN_ID=20251110T002045Z）

- 証跡ディレクトリ: `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/`（HTTP レスポンス・ヘッダー・`logs/{legacy,modern}_*.log`）。
- `ops/tests/api-smoke-test/test_config.manual.csv` / `rest_error_scenarios.manual.csv` の `trace_http_{200,400,401,500}` / `trace-schedule-jpql` / `trace-appo-jpql` を `ops/tools/send_parallel_request.sh --profile compose --loop 1` で実行。すべて `X-Trace-Id` を CSV 記載値へ合わせたヘッダーファイル（`tmp/trace-headers/*.headers`）から送信した。
- 詳細なドメイン／JPQL の差分メモは `docs/server-modernization/phase2/notes/domain-transaction-parity.md` の Trace Harness 節へリンク済み。

| Case / Trace ID | Legacy (status) | Modernized (status) | SessionOperation / ログ観測 | メモ |
| --- | --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 200 | 200 | Modernized のみ `open.dolphin` INFO に `trace-http-200` が 2 行出力。Legacy は traceId なし。 | 認証ヘッダー（userName/password/clientUUID/facilityId）を付与しないとモダナイズ側が応答待ちになるため、anonymous プロファイルは使用不可。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | **500** (`ArrayIndexOutOfBoundsException`) | **400** (`BadRequestException: param must contain year, month, count`) | SessionOperation ログなし。`d_audit_event` への insert は成功。 | Legacy のバグ（`SystemResource#getActivities`）で 500 HTML を返却。Modernized 側は checklist #49 を満たす 400 応答になったが、Legacy/Modern でレスポンス体系が不一致。 |
| `trace_http_401` (`GET /touch/user/doctor1,...,dolphin`) | **500** | **500** (`IllegalStateException: Remote user does not contain facility separator`) | SessionOperation ログなし。Trace ID は `LogFilter` のみ。 | パスワード欠落で 401 に落とし込む前に `TouchRequestContextExtractor` が例外を投げる。Checklist #73 は引き続き未達。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | **200** (空 JSON) | **400** (`Not able to deserialize data provided`) | SessionOperation/SessionTraceManager のログ出力なし（INFO では確認不可）。 | 両環境とも ParseException 発生。Legacy は 200 + `{}`、Modernized は 400 + エラーメッセージ。`KarteBeanConverter` NullPointer（legacy ログ末尾）も再現。 |
| `trace-schedule-jpql` (`GET /schedule/pvt/2025-11-09`) | 200 (`list` に患者 1 件) | 200 (`{"list":null}`) | Modernized ログには `d_patient_visit` の JPQL が記録されるのみで SessionOperation ログなし。 | モダナイズ側で JPQL は走るが DTO 変換で null が挿入。Legacy との差分を JPQL 表（`domain-transaction-parity.md`）に追記。 |
| `trace-appo-jpql` (`PUT /appo`) | **500** (`IllegalArgumentException: delete event with null entity`) | **500** (`SessionServiceException` → `IllegalArgumentException`) | `SessionOperationInterceptor` が `trace-appo-jpql` を含む ERROR を出力。Trace 付きの stacktrace が `logs/modern_trace-appo-jpql.log` に保存済み。 | `AppointmentModel` が persistence unit に存在しないため `SessionOperation` で握り潰され 500。Legacy も同様の例外だが traceId ログ無し。 |

### 6.1 SessionOperationInterceptor / SessionTraceManager の観測
- `trace-appo-jpql` のみ `SessionOperationInterceptor` が ERROR ログを出力し、`trace-appo-jpql` を保持したまま CDI/Weld → JTA → Hibernate の stacktrace へ伝搬することを確認。
- `trace_http_{400,401,500}` では INFO レベルに `SessionOperation`/`SessionTraceManager` の痕跡が残らず、`LogFilter` 由来の 2 行のみ。DEBUG へ引き上げる or 例外経路で INFO を差し込む改善が必要。
- Legacy 側は依然として traceId を HTTP ログに出さないため、`server/` 側 `LogFilter` の改修（または `org.wildfly.extension.micrometer` 非対応問題をクリアした 10.1 ビルド）を行わない限り Legacy→JMS の突合が難しい。

### 6.2 既知ブロッカー / 次アクション
1. `TouchRequestContextExtractor` が `Remote user does not contain facility separator` を投げるため、401 想定ケースを正しく検証できない。ヘッダー仕様とバリデーションを整理し、`password` 欠落時に `SessionOperationInterceptor` まで進むよう修正する。
2. `ScheduleServiceBean#getPvt` は Modernized で 200 になるが `list=null`。`PatientVisitModel` が persistence.xml に登録されているか、DTO 変換で null が挿入されていないかを確認する。詳細は `domain-transaction-parity.md` §3 を参照。
3. `AppointmentModel` / `PatientVisitModel` などのエンティティ不足により `IllegalArgumentException` が継続発生。`server-modernized/src/main/resources/META-INF/persistence.xml` と Flyway seed (`server-modernized/tools/flyway/sql/V0223__schedule_appo_tables.sql` 相当) を更新し、JPQL パリティを回復する。
4. JMS 連携を含む case（Touch sendPackage、Factor2 など）は未採取。`TRACEID_JMS/trace/` ディレクトリに JMS ログセットを追加し、`SessionTraceManager` → JMS ブリッジの確認まで拡張する。
5. Legacy `LogFilter` の traceId ログ出力と `org.wildfly.extension.micrometer` モジュール欠如によるビルドブロックは未解消。Legacy 側へのパッチを適用し、`docker logs opendolphin-server` でも traceId を可視化する。

## 7. 2025-11-10 07:06Z: Trace Harness 再取得（RUN_ID=20251110T070638Z）

- `PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/${RUN_ID}` を設定し、`tmp/trace-headers/trace_*.headers` / `ops/tests/api-smoke-test/payloads/appo_cancel_sample.json` を用意した上で各ケースを `ops/tools/send_parallel_request.sh --profile compose` で再実行。
- HTTP 証跡は `artifacts/parity-manual/TRACEID_JMS/20251110T070638Z/trace_*/{legacy,modern}/` に保存されたが、いずれも `curl: (7) Failed to connect to localhost port {8080,9080}` で失敗し `meta.json` は `status_code=000`, `exit_code=7` を記録。
- 実行ログは `artifacts/parity-manual/TRACEID_JMS/20251110T070638Z/logs/send_parallel_request.log` を参照。WildFly / SessionOperation ログは生成されていない。

| Case / Trace ID | Legacy (status / exit) | Modernized (status / exit) | 備考 |
| --- | --- | --- | --- |
| `trace_http_200` | 000 / 7 | 000 / 7 | `curl` が 8080/9080 の TCP 接続を確立できず、認証ヘッダー送信前に失敗。 |
| `trace_http_400` | 000 / 7 | 000 / 7 | `dolphin/activity` への BadRequest 再現は未到達。 |
| `trace_http_401` | 000 / 7 | 000 / 7 | `TouchRequestContextExtractor` 以前に接続が切断され、Checklist #73 継続。 |
| `trace_http_500` | 000 / 7 | 000 / 7 | `KarteServiceBean` のエラーパスは再検証できず。 |
| `trace-schedule-jpql` | 000 / 7 | 000 / 7 | JPQL / DTO 差分を再取得できず、`{"list":null}` 問題は据え置き。 |
| `trace-appo-jpql` | 000 / 7 | 000 / 7 | `SessionOperationInterceptor` ERROR ログは今回生成されず。 |

### 7.1 ブロッカー / TODO
1. `docker ps` が `The command 'docker' could not be found in this WSL 2 distro.` を返し、Docker Desktop↔WSL の統合が無効。Legacy/Modernized コンテナが起動していないため `localhost:{8080,9080}` も LISTEN していない。
2. `compose` プロファイル用の `BASE_URL_{LEGACY,MODERN}` は有効だが、サーバープロセスが存在しないため `curl` は常に `status=000`。`docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml up -d` で両サーバーを起動した上で同コマンドを再実行する必要がある。
3. 環境復旧後は `docker logs opendolphin-server(-modernized-dev) | rg traceId=` と `SessionOperationInterceptor` ERROR ログを再取得し、§6 の表を上書き更新する。

### 7.2 @SessionOperation 静的解析（2025-11-10）
 - `rg --files -g '*ServiceBean.java' server-modernized/src/main/java/open/dolphin` と `rg '@SessionOperation' server-modernized/src/main/java/open/dolphin -n` の結果からサービス層 22 クラスの付与状況を棚卸し。
 - Legacy (`server/src/...`) には `@SessionOperation` が存在せず、Modernized 側での付与状況が唯一のソース。2025-11-10 22:16Z 時点で `touch/session` 系 2 クラスにも付与が完了し、Touch API 由来の `trace_http_401` でも SessionOperationInterceptor が起動する状態になった。

| ServiceBean | パッケージ | `@SessionOperation` | 備考 |
| --- | --- | --- | --- |
| `SystemServiceBean` | `open.dolphin.session` | ✅ クラス付与 | `trace_http_400` で BadRequest を返す核心。`server-modernized/src/main/java/open/dolphin/session/SystemServiceBean.java:39`。 |
| `UserServiceBean` | `open.dolphin.session` | ✅ | `LogFilter` header 認証の委譲先。 |
| `PatientServiceBean` | `open.dolphin.session` | ✅ | `/patient/id/*` 系 JPQL。 |
| `KarteServiceBean` | `open.dolphin.session` | ✅ | `trace_http_500`。 |
| `ScheduleServiceBean` | `open.dolphin.session` | ✅ | `trace-schedule-jpql`。 |
| `AppoServiceBean` | `open.dolphin.session` | ✅ | `trace-appo-jpql`（SessionOperationInterceptor ERROR 生成）。 |
| `LetterServiceBean` | `open.dolphin.session` | ✅ | 文書/書簡 API。 |
| `ChartEventServiceBean` | `open.dolphin.session` | ✅ | `ChartsPage` 連携イベント。 |
| `StampServiceBean` | `open.dolphin.session` | ✅ | スタンプ管理。 |
| `NLabServiceBean` | `open.dolphin.session` | ✅ | NLabo 連携。 |
| `MmlServiceBean` | `open.dolphin.session` | ✅ | MML import/export。 |
| `PVTServiceBean` | `open.dolphin.session` | ✅ | 患者来院情報。 |
| `VitalServiceBean` | `open.dolphin.session` | ✅ | Vital measurement API。 |
| `ADM10_EHTServiceBean` / `ADM10_IPhoneServiceBean` | `open.dolphin.adm10.session` | ✅ | ADM10 デバイス向け管理系。 |
| `ADM20_AdmissionServiceBean` / `ADM20_EHTServiceBean` / `ADM20_IPhoneServiceBean` | `open.dolphin.adm20.session` | ✅ | ADM20 FIDO2 / Admission。 |
| `AMD20_PHRServiceBean` / `PHRAsyncJobServiceBean` | `open.dolphin.adm20.session` | ✅ | PHR 連携と非同期処理。 |
| `EHTServiceBean` | `open.dolphin.touch.session` | ✅ | 2025-11-10 22:16Z（RUN_ID=20251110T221659Z）で `@SessionOperation` 付与済みクラスが正しく AOP 適用され、`touch/user` リクエスト時に `traceId=trace-http-*` の WARNING ログが `artifacts/parity-manual/TRACEID_JMS/20251110T221659Z/logs/modern_trace_http.log` へ出力されることを確認。 |
| `IPhoneServiceBean` | `open.dolphin.touch.session` | ✅ | 同 RUN で Touch user 認証エラー経路でも `SessionTraceManager` が Trace ID を保持することを確認。Unauthorized 403 が返るものの、MDC には `trace-http-401/500` が載り `TRACE_PROPAGATION_CHECK.md` §8 の未解決課題は認証層に限定された。 |

> 2025-11-10 22:16Z（RUN_ID=20251110T221659Z）では `ops/tools/send_parallel_request.sh --profile compose` を用い、Touch/EHT 系エンドポイントを含む 4 ケースを再取得。Modernized 側 WildFly は `Unauthorized user: {null|doctor1}` WARN とともに `traceId=trace-http-*` を出力し、Touch セッション 2 クラスにも `@SessionOperation` が届いていることを実機で確認できた。Legacy には依然 trace ログが無く、本節の残タスクは (1) Legacy `LogFilter` の null-safe 化、(2) 認証 403 の解消、(3) Audit/JMS 背景への Trace ID 伝搬に絞られた。

- 追加で `MmlSenderBean` や `SessionOperationInterceptor` 自体も `@SessionOperation` を持つが、サービス層 API の網羅率は **22/22 クラス (100%)** に到達した。今後は `touch/user` 系で得られた `traceId` を JMS／Audit へ届けるべく、認証 403 と Legacy 側の trace ログ欠如を解消するタスクにスコープを絞る。

### 7.3 2025-11-10 22:16Z: Compose Trace Harness（RUN_ID=20251110T221659Z）
- 証跡: `artifacts/parity-manual/TRACEID_JMS/20251110T221659Z/trace_http_*/{legacy,modern}/` と `logs/{send_parallel_request,modern_trace_http,d_audit_event_*.sql}`。
- 4 ケースとも `ops/tools/send_parallel_request.sh --profile compose` で 2 回連続実行。`modern_trace_http.log` には Touch/EHT 系も含め `traceId=trace-http-*` の WARN が 2 行ずつ出力された。

| Case | Legacy (`localhost:8080`) | Modernized (`localhost:9080`) | メモ |
| --- | --- | --- | --- |
| `trace_http_200` | 500（`LogFilter#password.equals` NPE） | 403（`Unauthorized user: null`） | Legacy は従来どおり 500。Modern は匿名 Jamri でも `SessionOperation` が起動し Trace ID を保持するが、認証層が 403 を返す。 |
| `trace_http_400` | 403 | 403 | Basic 認証拒否で BadRequest まで到達せず。`d_audit_event` は 2025-11-10 の -41〜-43 から更新なし。 |
| `trace_http_401` | 500（LogFilter NPE） | 403（Unauthorized doctor1） | Touch password 欠落ケース。`SessionOperation` は実行され `trace-http-401` が WARN 出力された。 |
| `trace_http_500` | 403 | 403 | `KarteBeanConverter` の NullPointer を再現する前に認証層で 403。`trace_http_500` の監査・JMS は 0 行。 |

観測と課題:
1. **認証レイヤがボトルネック** — `UserServiceBean#authenticate` および `LogFilter` が `password` null を許容せず、400/401/500 ケースへ進めない。Modernized 側は 403 でも `trace_http_*/modern/headers.txt` に `X-Trace-Id` が残り `logs/modern_trace_http.log` に `Unauthorized user ... traceId=trace-http-*` が並ぶ一方、Legacy 側は `headers.txt` に Trace ID が無く `logs/legacy_trace_http.log` も 0 バイトのため差異が顕著。Legacy 側の null-safe 化と Modern 側の facility 判定緩和が必要。
2. **Audit/JMS は依然空** — `logs/d_audit_event_trace-http-{200,401,500}.sql` は 0 行、`trace_http_400` も負 ID (-41〜-43) から変化なし。`jms_dolphinQueue_read-resource.txt` は `messages-added=0L`, `message-count=0L`。Trace ID が HTTP → Session までは届くものの、その先に進んでいない。
3. **Touch セッションの AOP は確認済み** — `open.dolphin.touch.session.{EHT,IPhone}ServiceBean` への `@SessionOperation` 追加により、Touch API（401/500 ケース）でも `SessionTraceManager` が WARN ログを出した。今後は Unauthorized 403 を解消して JMS/Audit への伝搬を再検証する。
4. **AuditTrail ID 衝突リスク** — `artifacts/parity-manual/TRACEID_JMS/20251110T221659Z/d_audit_event.log` では ID=-41〜-47 の負値が積み上がったまま新規レコードが追加されず、`d_audit_event_id_seq` も進んでいない。`ALTER SEQUENCE ... RESTART` を実行すると既存レコードと衝突するため、Runbook どおり `logs/d_audit_event_seq_status.txt` にシーケンスの `last_value` を記録し、補正値とバックアップ手順を決めてから再採番する。


## 8. 2025-11-10 12:26Z: Trace Harness RUN_ID=20251110T122644Z（`--profile modernized-dev`）

- 実行は helper コンテナ (`docker run --rm --network legacy-vs-modern_default -v $PWD:/workspace mcr.microsoft.com/devcontainers/base:jammy`) から行い、`send_parallel_request.sh --profile modernized-dev` で Docker ネットワーク内ホスト名 (`opendolphin-server(-modernized-dev)`) を直接解決。証跡は `artifacts/parity-manual/TRACEID_JMS/20251110T122644Z/`。
- 400/401/500 は `artifacts/parity-manual/rest-errors/20251110T122644Z/` にも同期させ、`logs/{legacy,modern}_server.log` を同 RUN_ID で共用。

| Case / Trace ID | Legacy (status / body) | Modernized (status / body) | 主なイベント |
| --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | **500** / HTML 500 | 200 / 空ボディ | Legacy `LogFilter` が `password.equals(userCache.getMap().get(userName))`（`server/src/main/java/open/dolphin/rest/LogFilter.java:37-60`）で NPE → Undertow 500 (`rest-errors/.../legacy_server.log:608-645`)。Modern 側は `modern_trace_http.log` に `trace-http-200` を記録。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | **500** / HTML 500 | 400 / ヘッダーのみ | Legacy は上記 NPE のまま。Modern は 400 を返すが `SessionOperation`/`d_audit_event` ログは空（`logs/d_audit_event_trace-http-400.sql` 0 行）。 |
| `trace_http_401` (`GET /touch/user/...` password 無し) | **500** / HTML 500 | **500** / `Remote user does not contain facility separator.` | `TouchRequestContextExtractor#from`（`server-modernized/src/main/java/open/dolphin/touch/support/TouchRequestContextExtractor.java:17-40`）が `remoteUser` に区切りが無いと `IllegalStateException` を投げ、RESTEasy が 500 を返却 (`rest-errors/.../modern_server.log:640,1368,14015,14855`)。`AbstractResource#getRemoteFacility` は null/区切り欠落を許容する実装 (`server-modernized/src/main/java/open/dolphin/rest/AbstractResource.java:24-40`) だが Touch 系が未利用。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 200 / `{}` | **400** / `Not able to deserialize data provided.` | Legacy は例外握り潰し + 空 JSON。Modern は `RESTEASY-JACKSON000100`（`rest-errors/.../modern_server.log:808,1536,14183,15023`）が `KarteBeanConverter["id"]` null 参照を示し 400 で終了。 |

### 8.1 JMS / Audit / Trace
- `logs/jms_dolphinQueue_read-resource.txt`：`messages-added=1L`, `message-count=0L`, `delivering-count=0`。Trace Harness 4 ケースでは JMS 送信が発生せず Queue 指標は初期値。
- `logs/jms_DLQ_list-messages.txt`：空配列。DLQ 流入なし。
- `logs/d_audit_event_trace-http-*.sql`：全て 0 行。`information_schema.columns` にも `trace_id` 列が存在しないため、監査ログから Trace ID を突合できない現状を明文化。
- `logs/modern_trace_http.log`：helper コンテナ経由のアクセス (`172.23.0.7`) とホスト (`192.168.65.1`) の両方で `traceId=trace-http-*` を確認。Legacy 側は未実装。

### 8.2 課題とフォローアップ
1. **Legacy LogFilter 防御不足** — `LogFilter` で `password` が null の場合に 500 へ落ちるため、匿名や 401 ケースを再現できない。`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #94 にブロッカーとして追記。
2. **Touch 系の例外共通化不足** — `TouchRequestContextExtractor` による `IllegalStateException` / `Unauthorized user` が 403/500 を引き起こし、401 ハーネスが成立しない。`AbstractResource#getRemoteFacility` との乖離を解消しつつ、`UserServiceBean#authenticate` の facility 判定と `LogFilter` null チェックを緩和して `@SessionOperation` が確実に JMS/Audit まで届く経路を確保する。
3. **KarteBeanConverter null-safe 化** — `trace_http_500` が 400 で終了する要因。`domain-transaction-parity.md §3` に記載済みの `PatientVisitModel` 追加 / `KarteBeanConverter` 修正を優先度高で対応。
4. **監査ログ拡張** — Trace Harness で収集した `d_audit_event` が空のため、`TRACEID_JMS_RUNBOOK.md` §4.2 に `trace_id` カラム追加案と `psql` 検証結果（0 行）を追記する。
5. **Docs 反映** — 本 RUN_ID を `PHASE2_PROGRESS.md`・`DOC_STATUS.md`（`TRACE_PROPAGATION_CHECK.md` 行）・`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ8-1/8-2 備考へリンク済み。以後の再取得では本節の表を更新し、Legacy/Modern 両系統で 200/400/401/500 の想定値に到達するまで差分管理を続ける。

### 8.3 2025-11-10 22:16Z 追記（RUN_ID=20251110T221659Z / `--profile compose`）
- `artifacts/parity-manual/TRACEID_JMS/20251110T221659Z/logs/d_audit_event_trace-http-{200,401,500}.sql` はいずれも 0 行、`trace_http_400` も -41〜-43 の既存レコードのみで「AuditTrail が Trace ID を保持しない」既知課題を再確認。`d_audit_event.log` も 8 行のまま更新されていない。
- `logs/jms_dolphinQueue_read-resource.txt` は `messages-added=0L`, `message-count=0L`, `delivering-count=0` を維持し、`logs/jms_DLQ_list-messages.txt` も空配列。GET ベースの Trace Harness では JMS へ進まないため、次回は Claim/Touch 送信系でモニタを更新する必要がある。
- `logs/modern_trace_http.log` に `Unauthorized user: {null|doctor1} ... traceId=trace-http-*` の WARN が並び、Touch/EHT サービスでも `SessionOperation` が動作していることを実証。Legacy 側 `logs/legacy_trace_http.log` は空で、auth 層に `traceId` を残す改修が未着手。
- 403 化により `trace_http_{400,401,500}` が想定ステータスへ到達していない点、`LogFilter#password.equals` NPE が残っている点を `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #72 と `PHASE2_PROGRESS.md` 2025-11-10 節へ追記事項として共有した。

=======
## 6. 2025-11-10: SessionOperation Trace Harness（RUN_ID=20251110T002045Z）

- 証跡ディレクトリ: `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/`（HTTP レスポンス・ヘッダー・`logs/{legacy,modern}_*.log`）。
- `ops/tests/api-smoke-test/test_config.manual.csv` / `rest_error_scenarios.manual.csv` の `trace_http_{200,400,401,500}` / `trace-schedule-jpql` / `trace-appo-jpql` を `ops/tools/send_parallel_request.sh --profile compose --loop 1` で実行。すべて `X-Trace-Id` を CSV 記載値へ合わせたヘッダーファイル（`tmp/trace-headers/*.headers`）から送信した。
- 詳細なドメイン／JPQL の差分メモは `docs/server-modernization/phase2/notes/domain-transaction-parity.md` の Trace Harness 節へリンク済み。

| Case / Trace ID | Legacy (status) | Modernized (status) | SessionOperation / ログ観測 | メモ |
| --- | --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 200 | 200 | Modernized のみ `open.dolphin` INFO に `trace-http-200` が 2 行出力。Legacy は traceId なし。 | 認証ヘッダー（userName/password/clientUUID/facilityId）を付与しないとモダナイズ側が応答待ちになるため、anonymous プロファイルは使用不可。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | **500** (`ArrayIndexOutOfBoundsException`) | **400** (`BadRequestException: param must contain year, month, count`) | SessionOperation ログなし。`d_audit_event` への insert は成功。 | Legacy のバグ（`SystemResource#getActivities`）で 500 HTML を返却。Modernized 側は checklist #49 を満たす 400 応答になったが、Legacy/Modern でレスポンス体系が不一致。 |
| `trace_http_401` (`GET /touch/user/doctor1,...,dolphin`) | **500** | **500** (`IllegalStateException: Remote user does not contain facility separator`) | SessionOperation ログなし。Trace ID は `LogFilter` のみ。 | パスワード欠落で 401 に落とし込む前に `TouchRequestContextExtractor` が例外を投げる。Checklist #73 は引き続き未達。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | **200** (空 JSON) | **400** (`Not able to deserialize data provided`) | SessionOperation/SessionTraceManager のログ出力なし（INFO では確認不可）。 | 両環境とも ParseException 発生。Legacy は 200 + `{}`、Modernized は 400 + エラーメッセージ。`KarteBeanConverter` NullPointer（legacy ログ末尾）も再現。 |
| `trace-schedule-jpql` (`GET /schedule/pvt/2025-11-09`) | 200 (`list` に患者 1 件) | 200 (`{"list":null}`) | Modernized ログには `d_patient_visit` の JPQL が記録されるのみで SessionOperation ログなし。 | モダナイズ側で JPQL は走るが DTO 変換で null のまま返却。Legacy との差分を JPQL 表（`domain-transaction-parity.md`）に追記。 |
| `trace-appo-jpql` (`PUT /appo`) | **500** (`IllegalArgumentException: delete event with null entity`) | **500** (`SessionServiceException` → `IllegalArgumentException`) | `SessionOperationInterceptor` が `trace-appo-jpql` を含む ERROR を出力。Trace 付きの stacktrace が `logs/modern_trace-appo-jpql.log` に保存済み。 | `AppointmentModel` が persistence unit に存在しないため `SessionOperation` で握り潰され 500。Legacy も同様の例外だが traceId ログ無し。 |

### 6.1 SessionOperationInterceptor / SessionTraceManager の観測
- `trace-appo-jpql` のみ `SessionOperationInterceptor` が ERROR ログを出力し、`trace-appo-jpql` を保持したまま CDI/Weld → JTA → Hibernate の stacktrace へ伝搬することを確認。
- `trace_http_{400,401,500}` では INFO レベルに `SessionOperation`/`SessionTraceManager` の痕跡が残らず、`LogFilter` 由来の 2 行のみ。DEBUG へ引き上げる or 例外経路で INFO を差し込む改善が必要。
- Legacy 側は依然として traceId を HTTP ログに出さないため、`server/` 側 `LogFilter` の改修（または `org.wildfly.extension.micrometer` 非対応問題をクリアした 10.1 ビルド）を行わない限り Legacy→JMS の突合が難しい。

### 6.2 既知ブロッカー / 次アクション
1. `TouchRequestContextExtractor` が `Remote user does not contain facility separator` を投げるため、401 想定ケースを正しく検証できない。ヘッダー仕様とバリデーションを整理し、`password` 欠落時に `SessionOperationInterceptor` まで進むよう修正する。
2. `ScheduleServiceBean#getPvt` は Modernized で 200 になるが `list=null`。`PatientVisitModel` が persistence.xml に登録されているか、DTO 変換で null が挿入されていないかを確認する。詳細は `domain-transaction-parity.md` §3 を参照。
3. `AppointmentModel` / `PatientVisitModel` などのエンティティ不足により `IllegalArgumentException` が継続発生。`server-modernized/src/main/resources/META-INF/persistence.xml` と Flyway seed (`server-modernized/tools/flyway/sql/V0223__schedule_appo_tables.sql` 相当) を更新し、JPQL パリティを回復する。
4. JMS 連携を含む case（Touch sendPackage、Factor2 など）は未採取。`TRACEID_JMS/trace/` ディレクトリに JMS ログセットを追加し、`SessionTraceManager` → JMS ブリッジの確認まで拡張する。
5. Legacy `LogFilter` の traceId ログ出力と `org.wildfly.extension.micrometer` モジュール欠如によるビルドブロックは未解消。Legacy 側へのパッチを適用し、`docker logs opendolphin-server` でも traceId を可視化する。
