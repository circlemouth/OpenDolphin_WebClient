# ドメイン JPQL トランザクション網羅表（2026-06-16）

## 1. 対象ケース
- **Case ID**: `user_profile`（Checklist #48 相当）
- **API**: `GET /user/doctor1`
- **ヘッダープロファイル**: `tmp/trace/user_profile.headers`（`X-Trace-Id: trace-user-profile-manual` を付与）
- **証跡**:
  - HTTP レスポンス: `artifacts/parity-manual/user_profile_trace/{legacy,modern}/response.json`
  - SQL ログ: `artifacts/parity-manual/JPQL/legacy.log`, `artifacts/parity-manual/JPQL/modernized.log`
  - 差分: `artifacts/parity-manual/JPQL/jpql.diff`

| レイヤー | Legacy JPQL/SQL | Modernized JPQL/SQL | 備考 |
| --- | --- | --- | --- |
| UserServiceBean#getUser | `select ... from d_users usermodel0_ where usermodel0_.userId=?` | `select ... from d_users um1_0 where um1_0.userId=?` | 両サーバーとも同一の WHERE 句。モダナイズ側は短い別名 (`um1_0`) を使用。 |
| FacilityModel リレーション | `select ... from d_facility ... where id=?` | 同左 | 施設情報の遅延ロードが両環境とも eager のため追加クエリが発生。 |
| RoleModel リレーション | `select ... from d_roles ... where c_user=?` | 同左 | 監査用途のロール参照。モダナイズ側は `roles` → `r1_0` へ alias が変わるのみ。 |

### 観測結果
- JPQL → SQL 変換結果は alias 文字列以外に差異なし。`hibernate.show_sql` を双方で有効化したことで `scripts/jpql_trace_compare.sh` による差分確認が可能になった。
- Legacy 側の `LogFilter` には traceId の埋め込みが無く、HTTP ログと SQL ログの突合には `X-Trace-Id` ヘッダーを別途控えておく必要がある。モダナイズ側は `traceId=<value>` が自動ログ出力される。

### 残課題 / 次アクション
1. Checklist #49〜#50, #73〜#74 に対応する `KarteServiceBean`, `PatientServiceBean`, `PVTServiceBean` 等の JPQL を同手順で採取する。少なくとも `/chart/WEB1001/summary`, `/chart-events`, `/pvt/*` 系を追加で叩くため、サンプルデータ投入が必要。
2. `scripts/jpql_trace_compare.sh` の結果を CI からも実行できるよう、対象ケース一覧（JSON or CSV）を整備する。
3. 現状のログは ANSI エスケープ文字を含むため、将来的には `docker logs` から取得する際に `ansi2txt` 等で除去するラッパーを追加する。

## 2. Trace Harness（Checklist #49/#73/#74）

| Checklist | API | Session Bean | Trace Case | 状態 | 備考 |
| --- | --- | --- | --- | --- | --- |
| #49 | `GET /dolphin/activity/{year,month,count}` | `SystemServiceBean` (`@SessionOperation`) | `trace_http_400` | ⚠️ Legacy=500 / Modern=400 | RUN_ID=`20251110T002045Z` で採取。Modernized は `BadRequestException` に落ちる一方、Legacy (`artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_400/`) は `ArrayIndexOutOfBoundsException`→500。Checklist #49 は Legacy 実装バグの修正待ち。 |
| #73 | `GET /touch/user/{userId,facilityId,password}` | `TouchUserServiceBean` (`IPhoneServiceBean` 経由) | `trace_http_401` | ⚠️ 両環境とも 500 | パスワード欠落時に `TouchRequestContextExtractor` が `Remote user does not contain facility separator` を投げ、401 まで到達しない。証跡: `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_401/`。ヘッダー仕様を見直して再実施が必要。 |
| #74 | `GET /karte/pid/{patientPk,date}` | `KarteServiceBean` | `trace_http_500` | ⚠️ Legacy=200 / Modern=400 | 同 RUN_ID を保存。Legacy は ParseException 後に 200 + `{}` を返し、Modernized は 400 + `Not able to deserialize...`。`TRACE_PROPAGATION_CHECK.md` §6 参照。 |
| Baseline | `GET /serverinfo/jamri` | なし（REST フィルタのみ） | `trace_http_200` | ✅ `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_200/` に更新。Legacy は traceId を出力しないまま、Modernized は `traceId=trace-http-200` を INFO に記録。 |

- 400/401/500 ケースは `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` に期待ステータスと操作ノートを追加し、CLI で再現できるようにした。  
- Trace ID は `test_config.manual.csv` の `trace-id` 列に記載しており、`trace-session.headers` を複製して `X-Trace-Id` を上書きする運用とした。  
- Legacy サーバーは `ops/legacy-server/docker/configure-wildfly.cli` が `org.wildfly.extension.micrometer` を要求するためビルド不可。`artifacts/parity-manual/TRACEID_JMS/20251108T0526Z/legacy_build.log` に詳細を残した上で、Modernized 側のみ CLI 検証を進める。

## 3. 2025-11-09: Karte / Patient / Appo / Schedule

| Service / Endpoint | Legacy TX境界 | Modernized TX境界 | JPQL差分メモ | リスク / 対応方針 | 参照証跡 |
| --- | --- | --- | --- | --- | --- |
| `PatientServiceBean#getPatientById` (`GET /patient/id/0000001`) | `@Stateless`（CMT、`@SessionOperation` なし） | `@ApplicationScoped @Transactional @SessionOperation` | 両環境とも `from PatientModel p where p.facilityId=? and p.patientId like ?`。Modern 側のみ `ESCAPE ''` が付与。 | facility `1.3.6.1.4.1.9414.72.103` に対する患者レコードが存在せず `NoResultException` → 500。`docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` の `WEB1001` シードを `opendolphin_modern` に再投入 or Header を `F001` 系へ切替する TODO。 | `artifacts/parity-manual/JPQL/20251109T201157Z/PatientServiceBean/`（TraceId=`jpql-patient-20251109T201157Z`） |
| `KarteServiceBean#getKarte(fid,pid,fromDate)` (`GET /karte/pid/0000001,2024-01-01`) | `@Stateless` | `@ApplicationScoped @Transactional @SessionOperation` | Legacy/Modern とも `d_patient` 参照クエリのみ（結果ゼロ）。 | Modern 側は `KarteBeanConverter` が `null` を扱えず 400（`Not able to deserialize data provided`）。`WEB1001` など 1.3 系のカルテ投入と `Converter` の null-safe 化を TODO に追記。 | `artifacts/parity-manual/JPQL/20251109T201157Z/KarteServiceBean/`（TraceId=`jpql-karte-20251109T201157Z`） |
| `ScheduleServiceBean#getPvt` (`GET /schedule/pvt/2025-11-09`) | `@Stateless` | `@ApplicationScoped @Transactional @SessionOperation` | Legacy / Modern とも `select ... from d_patient_visit ... order by pvtDate` を発行。Modern 側でも 2025-11-10 Trace Harness で同じ JPQL が確認できた。 | Modern は SQL まで到達するが DTO 変換結果が `list=null` のまま返却（Legacy は患者 1 件を返す）。`ScheduleResource#getPvt` が facilityId を解決できるよう DTO 変換ロジックを修正する。 | `artifacts/parity-manual/JPQL/20251110T002451Z/ScheduleServiceBean/`（TraceId=`trace-schedule-jpql`） |
| `AppoServiceBean#putAppointments` (`PUT /appo`) | `@Stateless` | `@ApplicationScoped @Transactional @SessionOperation` | Legacy / Modern とも `SELECT d_appo ...` → `DELETE d_appo` の 2 クエリを実行（Trace Harness でも同一 SQL を確認）。 | ✅ Flyway V0223 + seed + persistence.xml 更新で UnknownEntityException を解消。`ops/tests/api-smoke-test/payloads/appo_cancel_sample.json` + `Content-Type: application/json` で 200（削除件数 1）となるため、再実行時は seed を流して id=8001 を復旧する。 | `artifacts/parity-manual/JPQL/20251110T002451Z/AppoServiceBean/`（TraceId=`trace-appo-jpql`） |

- 既存の Patient/Karte ケースは `artifacts/parity-manual/JPQL/20251109T201157Z/<service>/` に保存済み。Schedule/Appo については 2025-11-10(JST) に再採取し、`artifacts/parity-manual/JPQL/20251110T002451Z/<service>/` に raw / normalized / diff / HTTP 応答を格納した。いずれも `scripts/jpql_trace_compare.sh` の正規化結果を添付済み。
- `WEB1001` 系のカルテ／患者データが modernized DB に存在しないため、`/chart/WEB1001/summary` などカルテ画面 API は引き続き未採取。シード投入完了までは本節に TODO を記録し、`docs/web-client/operations/LOCAL_BACKEND_DOCKER.md#テスト患者データ投入` の手順で `opendolphin_modern` 側へ再流し込みを行う。

### 3.1 2025-11-10: 取得リトライ状況

- `ops/tools/send_parallel_request.sh --profile compose` を `PARITY_OUTPUT_DIR=artifacts/parity-manual/JPQL/20251110T034844Z` で 4 ケース（Patient/Karte/Schedule/Appo）再実行したが、ホストに Docker Desktop／compose が存在せず `curl: (7) Failed to connect to localhost port {8080,9080}`。詳細は `artifacts/parity-manual/JPQL/20251110T034844Z/README.md` と `*_request.log` を参照。
- HTTP リクエスト痕跡のみ生成できたため `legacy.raw.log`／`modern.raw.log`、`d_audit_event` 抜粋、Hibernate SQL ログは未更新。サーバーを `scripts/start_legacy_modernized.sh start --build` で起動できる環境を確保したうえで本節の trace を再取得する。
- カルテ系 API の失敗ケースは `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` の `rest_error_chart_summary_seed_gap` に記録し、`chart_summary` ケース（`trace-chart-summary-manual`）から実行・再検証する。

### 3.2 トランザクション／JPQL 差分マトリクス

`server-modernized/src/main/resources/META-INF/persistence.xml` は `exclude-unlisted-classes=false` にしているものの `<class>` 要素を 8 件のみ列挙し、WildFly 展開時に `infomodel` JAR を自動検出できていない。結果として `PatientVisitModel` と `AppointmentModel` が `UnknownEntityException` となり、Legacy では成功していた JPQL が Modernized 側で解釈できない。さらに `@SessionOperation` で `SessionOperationInterceptor`（`SessionTraceManager` 経由で `d_audit_event` を吐き出す）が追加されたことで、例外は `SessionServiceException` としてラップされ HTTP 500 となる。主要サービスのコード差分を以下に整理した。

| サービス / API | Legacy TX境界 / Propagation | Modernized TX境界 / Propagation | JPQL / Fetch 差分 | persistence / データギャップ・TODO |
| --- | --- | --- | --- | --- |
| `PatientServiceBean#getPatientById`<br>`GET /patient/id/{pid}` | `@Named @Stateless`（`server/src/main/java/open/dolphin/session/PatientServiceBean.java`）で CMT `REQUIRED`。`SessionOperation` 未使用のため `LogFilter` ログのみ。 | `@ApplicationScoped @Transactional @SessionOperation`（`server-modernized/src/main/java/open/dolphin/session/PatientServiceBean.java`）。`SessionOperationInterceptor` が `SessionTraceManager` を起動し、例外を `SessionServiceException` に包む。 | `QUERY_PATIENT_BY_FID_PID` など JPQL は Legacy と同一だが、Modernized は `ChartEventServiceBean` 連携と `setPvtDate` で `PatientVisitModel` をロードするまで 1 トランザクションで保持する設計。`facilityId=1.3.6.1.4.1.9414.72.103` のシード欠落により `NoResultException` が 500 として表面化する。 | `WEB1001`〜`WEB1010` の患者を `docs/web-client/operations/LOCAL_BACKEND_DOCKER.md` 手順で `opendolphin_modern` へ再投入し、`rest_error_chart_summary_seed_gap` / `patient` parity ケースで `SessionTrace` を採取する。 |
| `KarteServiceBean#getKarte(fid,pid,fromDate)`<br>`GET /karte/pid/{pid,date}` | `@Stateless`（`server/src/main/java/open/dolphin/session/KarteServiceBean.java`） + CMT。JPQL 失敗時は `NoResultException` がそのまま 500/404 になる。 | `@ApplicationScoped @Transactional @SessionOperation`（`server-modernized/src/main/java/open/dolphin/session/KarteServiceBean.java`）で `MessagingGateway`／`AttachmentStorageManager` を追加。例外は `SessionServiceException` へ集約され `traceId` と紐付く。 | JPQL 文字列は共通だが、Modernized 側は `KarteBeanConverter` が `null` を許容しないため患者未登録のケースで 400 (`Not able to deserialize data provided`) が返る。`QUERY_PATIENT_VISIT` が `PatientVisitModel` を参照するため persistence 未登録だと `UnknownEntityException`（現状は患者データ欠落で到達せず）。 | `persistence.xml` に `PatientVisitModel` を追加し、`KarteBeanConverter` を null-safe にする。`/chart/WEB1001/summary` は `chart_summary` テスト + `rest_error_chart_summary_seed_gap` を参照して再実行。 |
| `ScheduleServiceBean#getPvt`<br>`GET /schedule/pvt/{date}` | `@Stateless`（`server/src/main/java/open/dolphin/session/ScheduleServiceBean.java`）。CMT `REQUIRED` で `PatientVisitModel` を eager ロードしつつ JMS 連携 (`ClaimSender`) を制御。 | `@ApplicationScoped @Transactional @SessionOperation`（`server-modernized/src/main/java/open/dolphin/session/ScheduleServiceBean.java`） + `MessagingGateway` / `ManagedScheduledExecutorService`。 | JPQL（`QUERY_PVT_BY_FID_DATE`, `QUERY_DOCUMENT_BY_KARTEID_STARTDATE`）は同じだが、Modernized では Hibernate が `PatientVisitModel` を解決できず `org.hibernate.query.sqm.UnknownEntityException` が即発生し、監査ログにも残らない。 | `persistence.xml` に `PatientVisitModel` を追加し、Flyway で `d_patient_visit` シードを用意。`rest_error_schedule_unknown_entity` の再現手順を `TRACE_PROPAGATION_CHECK.md` にリンクし、Hibernate SQL が発火することを確認する。 |
| `PVTServiceBean#getPvt` / `addPvt`<br>`GET /pvt/{did,...}` | `@Stateless`（`server/src/main/java/open/dolphin/session/PVTServiceBean.java`）で ORCA キュー (`ClaimSender`) と同期。`AppointmentModel` も同一トランザクション内で読み書きする。 | `@ApplicationScoped @Transactional @SessionOperation`（`server-modernized/src/main/java/open/dolphin/session/PVTServiceBean.java`）に変更し、`ChartEventServiceBean`／`ServletContextHolder` へ依存。 | 受付登録時に `AppointmentModel`／`PatientVisitModel` を JPQL で読み込んで chart-event を組み立てる。Modernized では両エンティティが persistence から欠落しているため `UnknownEntityException` が多発し SSE push まで到達しない。 | `PatientVisitModel` と `AppointmentModel` の両方を persistence unit に追加し、`d_appo` / `d_patient_visit` シードを整備。`rest_error_chart_summary_seed_gap` からカルテ/PVT 系 API をまとめて再検証する。 |
| `AppoServiceBean#putAppointments`<br>`PUT /appo` | `@Stateless`（`server/src/main/java/open/dolphin/session/AppoServiceBean.java`）。CMT で `AppointmentModel` を `em.persist`/`merge`/`remove`。 | `@ApplicationScoped @Transactional @SessionOperation`（`server-modernized/src/main/java/open/dolphin/session/AppoServiceBean.java`）。 | JPQL は同一だが、Modernized では `AppointmentModel` が persistence unit に登録されておらず `Unable to locate entity descriptor: AppointmentModel` で終了。 | `persistence.xml` に `AppointmentModel` を追加し、`rest_error_appo_missing_entity`（`ops/tests/api-smoke-test/payloads/appo_cancel_sample.json`）で再取得。 |
