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

### 2.1 2025-11-10 07:06Z 追記（RUN_ID=20251110T070638Z）
- `trace_http_{200,400,401,500}`, `trace-schedule-jpql`, `trace-appo-jpql` を再取得しようとしたが、`ops/tools/send_parallel_request.sh --profile compose` がすべて `curl: (7) Failed to connect to localhost port {8080,9080}` で停止し HTTP ログは取得できなかった。
- 証跡: `artifacts/parity-manual/TRACEID_JMS/20251110T070638Z/README.md`（実行手順と失敗サマリ）、`logs/send_parallel_request.log`（各ケースの `status=000 / exit=7`）を参照。
- `docker ps` が `The command 'docker' could not be found in this WSL 2 distro.` を返し、Legacy/Modernized コンテナが不在。これにより `trace_http_401` の Touch 経路や `trace-appo-jpql` の SessionOperation ERROR を再現できていない。
- 次アクション: Docker Desktop ↔ WSL 統合を有効化した環境へ切り替えてコンテナを起動した後、本 RUN_ID と同じヘッダー／payload で再実行し、§2 の表を更新する。Touch 系 API では `open.dolphin.touch.session.{EHTServiceBean,IPhoneServiceBean}` にも `@SessionOperation` を付与する改修チケットが必要（詳細は `TRACE_PROPAGATION_CHECK.md` §7.2）。

## 3. 2025-11-09〜10: Karte / Patient / Appo / Schedule

| Service / Endpoint | Legacy TX境界 | Modernized TX境界 | JPQL差分メモ | リスク / 対応方針 | 参照証跡 |
| --- | --- | --- | --- | --- | --- |
| `PatientServiceBean#getPatientById` (`GET /patient/id/0000001`) | `@Stateless`（CMT、`@SessionOperation` なし） | `@ApplicationScoped @Transactional @SessionOperation` | Legacy/Modern とも `from PatientModel p where p.facilityId=? and p.patientId like ?`。Modern 側のみ `ESCAPE ''` が追加され `legacy.raw.log` と `modern.raw.log` の alias 以外差異なし。 | `WEB1001` の患者データが modern DB に存在せず `NoResultException` → 500。`ops/db/local-baseline/local_synthetic_seed.sql` を `opendolphin_modern` へ再投入するまで `rest_error_chart_summary_seed_gap` を TODO として維持。 | `artifacts/parity-manual/JPQL/20251109T201157Z/PatientServiceBean/`（TraceId=`jpql-patient-20251109T201157Z`、README 参照）。 |
| `KarteServiceBean#getKarte(fid,pid,fromDate)` (`GET /karte/pid/0000001,2024-01-01`) | `@Stateless` | `@ApplicationScoped @Transactional @SessionOperation` | JPQL は `d_patient` 参照のみで 0 件。Legacy は `{}` を返し、Modern は `KarteBeanConverter` が `null` を扱えず 400（`Not able to deserialize ...`）。 | `KarteBeanConverter` の null-safe 化と `WEB1001` seed 再投入が必須。`rest_error_chart_summary_seed_gap` と `artifacts/parity-manual/JPQL/20251110T034844Z/README.md` で TODO を明示。 | `artifacts/parity-manual/JPQL/20251109T201157Z/KarteServiceBean/`（TraceId=`jpql-karte-20251109T201157Z`）。 |
| `ScheduleServiceBean#getPvt` (`GET /schedule/pvt/2025-11-09`) | `@Stateless` | `@ApplicationScoped @Transactional @SessionOperation` | RUN_ID=`20251110T002451Z` では Legacy が 5 クエリ（`d_patient_visit`→`d_patient`→`d_health_insurance`→`d_karte`→`d_document`）、Modern は `d_patient_visit` 1 クエリのみ（`like ? escape ''`）。Modern raw ログに `remoteUser=anonymous` が記録され facilityId 解決前に DTO が打ち切られる。 | HTTP は両環境 200 だが Modern は `{"list":null}`。`LogFilter` が `HttpServletRequest#getRemoteUser()` を設定できないため、Basic 認証情報を REST レイヤーで復元する修正が必要。`d_audit_event` 未採取につき README に TODO を追記。 | `artifacts/parity-manual/JPQL/20251110T002451Z/ScheduleServiceBean/`（TraceId=`trace-schedule-jpql`、README 内に取得条件を記録）。 |
| `AppoServiceBean#putAppointments` (`PUT /appo`) | `@Stateless` | `@ApplicationScoped @Transactional @SessionOperation` | Legacy/Modern とも `SELECT d_appo ...` → `DELETE d_appo`。RUN_ID=`20251110T002451Z` の `jpql.diff` は alias 差分のみ。 | Flyway V0223 + `persistence.xml` で `AppointmentModel` を登録済みだが、`remoteUser=anonymous` と `d_audit_event` 未採取が残課題。`ops/tests/api-smoke-test/payloads/appo_cancel_sample.json` を id=8001 で再利用する際は seed を戻す。 | `artifacts/parity-manual/JPQL/20251110T002451Z/AppoServiceBean/`（TraceId=`trace-appo-jpql`、README 内に SQL/差分/再取得条件を記載）。 |

- RUN_ID=`20251109T201157Z` / `20251110T002451Z` それぞれに README を追加し、HTTP/SQL/Trace 条件と `d_audit_event` 未採取の理由（WSL 上で Docker Desktop が未導入）を明文化した。
- `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` の `rest_error_schedule_unknown_entity` / `rest_error_appo_missing_entity` / `rest_error_chart_summary_seed_gap` 行を 200/200/500 で更新し、`TODO(remoteUser=anonymous)` と `TODO(WEB1001 seed gap)` を残した。

### 3.1 2025-11-10: 取得リトライ状況
- `RUN_ID=20251110T002451Z`: Schedule/Appo の Hibernate SQL 正規化と差分抽出に成功。HTTP レスポンスは 2025-11-09 RUN の `http/` を再利用したためメタ情報は更新していない。`d_audit_event` は Docker 不在で取得不可のため、README に採取手順 (`docker compose exec db-{legacy,modern} psql ...`) を追記し、次回 compose 環境で再実施する。
- `RUN_ID=20251110T034844Z`: `ops/tools/send_parallel_request.sh --profile compose` を Patient/Karte/Schedule/Appo 4 ケースで再実行したが、ホストに Docker Desktop/compose が無く `curl: (7) Failed to connect to localhost port {8080,9080}` で失敗。詳細は `artifacts/parity-manual/JPQL/20251110T034844Z/README.md` と `*_request.log` を参照。HTTP リクエスト痕跡のみ生成できたため、`legacy.raw.log`／`modern.raw.log`、`d_audit_event` は未更新。

### 3.2 TX/JPQL/Persistence 差分メモ
- `server-modernized/src/main/resources/META-INF/persistence.xml` に `open.dolphin.infomodel.PatientVisitModel` / `AppointmentModel` / `AuditEvent` を列挙済みであり、Legacy と同じエンティティが JPA 管理対象になっていることを確認した。
- `ops/db/local-baseline/local_synthetic_seed.sql` で `appointment_model` / `patient_visit_model` テーブルとシードを定義しているため、`opendolphin_modern` へ流し込めば `trace-appo-jpql` / `trace-schedule-jpql` の ID（例: `id=8001`, `F001` facility）を復元できる。Flyway V0223 に続けて同スクリプトを再投入する。
- `d_audit_event` 抜粋は未保存のため、compose 環境で `docker compose exec db-{legacy,modern} psql ... "select event_time,user_id,operation,resource,trace_id from d_audit_event where trace_id like 'trace-%' order by event_time desc limit 50"` を実行し、各サービス配下に `d_audit_event.{legacy,modern}.log` を置く。完了したら `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #65 を更新する。
- `ScheduleResource` / `AppoResource` は `HttpServletRequest#getRemoteUser()` に依存するが、Modernized 側では WildFly Elytron が匿名レスポンスを返しており `remoteUser=anonymous` のまま。`TraceFilter` or `LogFilter` で `trace-session.headers` の `Authorization` を JACC Principal に伝播させる修正を GitHub Issue #ScheduleRemoteUser でトラッキングする。
- `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` をシナリオ管理の単一ソースとし、Trace Harness（§2）と本表（§3）の差分が発生した場合は同 CSV を起点に Runbook を更新する。

### 3.3 Docker 復旧後チェックリスト
- [ ] **Docker Desktop と compose の健全性確認**: `docker info`, `docker compose version`, `docker context ls` がエラーなく実行でき、`docker ps` に `opendolphin-*` コンテナが表示される。macOS では Docker Desktop > Settings > Resources を 6 CPU / 8 GB RAM 以上に設定し、`/Users/<user>/Documents/OpenDolphin_WebClient` を File Sharing に追加する。
- [ ] **`scripts/start_legacy_modernized.sh start --build` 実行**: `PROJECT_NAME=legacy-vs-modern`（既定値）を維持したまま起動し、`docker compose -p legacy-vs-modern ps` が `db`, `db-modernized`, `server`, `server-modernized-dev` すべて `Up` であることを確認。失敗時は `./scripts/start_legacy_modernized.sh logs server-modernized-dev` を採取し `artifacts/parity-manual/logfilter/<UTC>/` へ保存する。
- [ ] **JPQL ケース再取得**: `PARITY_OUTPUT_DIR=artifacts/parity-manual/JPQL/$RUN_ID` を指定し、`ops/tools/send_parallel_request.sh --profile compose` で `PatientServiceBean`, `KarteServiceBean`, `ScheduleServiceBean`, `AppoServiceBean` を順番に実行。`PARITY_HEADER_FILE=tmp/trace/jpql-<service>-$RUN_ID.headers`、必要に応じて `PARITY_BODY_FILE` を渡す。取得後は `scripts/jpql_trace_compare.sh` を実行し `legacy.normalized.sql` / `modern.normalized.sql` / `jpql.diff` を更新する。
- [ ] **Trace Harness 再実行**: `PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/$RUN_ID` と `PARITY_HEADER_FILE=tmp/trace-headers/trace_*.headers` を組み合わせ、`trace_http_{200,400,401,500}`／`trace-{schedule,appo}-jpql` を全件送信。`ops/tools/send_parallel_request.sh --profile compose --loop 1` を推奨。Appo 用には `PARITY_BODY_FILE=ops/tests/api-smoke-test/payloads/appo_cancel_sample.json` を指定する。
- [ ] **`d_audit_event` 差分取得**: Legacy/Modernized 両 DB で `docker compose -p legacy-vs-modern exec db psql -U opendolphin -d opendolphin_modern -c "select * from d_audit_event order by event_time desc limit 200"` と `... exec db-modernized ...` を実行し、サービス配下に `d_audit_event.{legacy,modern}.log` を保存。Trace Harness 側も同じ RUN_ID 名義で `TRACEID_JMS/<RUN_ID>/d_audit_event/` に複製する。
- [ ] **JMS ヘッダー/ログ採取**: `TRACEID_JMS/<RUN_ID>/<case>/<env>/headers.txt` に `X-Trace-Id` を含むヘッダーを保存し、`logs/{legacy,modern}_trace-*.log` へ WildFly の `traceId=` ログと JMS publish ログをコピーする。`ops/tools/send_parallel_request.sh` 実行時の `send_parallel_request.log` もディレクトリ直下に必ず残す。
- [ ] **`persistence.xml` / seed 確認**: `server-modernized/src/main/resources/META-INF/persistence.xml`（Jakarta 版）に `PatientVisitModel`, `AppointmentModel`, `LetterModule`, `NLabModule`, `StampTreeModel` が列挙されているか `rg '<class>.*(PatientVisitModel|AppointmentModel|Letter|NLab|Stamp)'` で確認し、結果を `artifacts/parity-manual/persistence-check/$RUN_ID/` にメモ。抜けがあれば WAR を再ビルドして再取得する。併せて `ops/db/local-baseline/local_synthetic_seed.sql` を `docker compose exec db-modernized psql ... -f -` で再投入し、`WEB1001` シードを復元する。
- [ ] **成果物整理とドキュメント更新**: 取得物を `artifacts/parity-manual/{JPQL,TRACEID_JMS,appo,schedule,...}/$RUN_ID/` へ格納し、`付録A` の RUN_ID 一覧に追記。更新内容を `docs/server-modernization/phase2/planning/phase2/DOC_STATUS.md` と `PHASE2_PROGRESS.md` へ反映させる。

## 付録A. RUN_ID トラッキング（取得済み / 再取得予定 / 未取得）

### A.1 取得済みケース

| シナリオ | 最新 RUN_ID | 証跡 | 備考 |
| --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 20251110T002045Z | `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_200/` | Legacy/Modernized とも 200 応答。Modernized は `traceId=trace-http-200` が INFO ログへ出力される。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | 20251110T002045Z | `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_400/` | Legacy=500 / Modern=400 だが HTTP/headers/meta を採取済み。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 20251110T002045Z | `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_500/` | Legacy=200 / Modern=400。`TRACE_PROPAGATION_CHECK.md` §7 に差分理由を記録済み。 |

### A.2 再取得予定ケース

| シナリオ | 既存 RUN_ID | 不足内容 | 次アクション |
| --- | --- | --- | --- |
| `trace_http_401` (`GET /touch/user/...` パスワード欠落) | 20251109T060930Z, 20251110T002045Z | `TouchRequestContextExtractor` が 500 を返し 401 にならない。 | Touch 用ヘッダーを `TRACE_PROPAGATION_CHECK.md` に沿って修正し、`@SessionOperation` 付与後に再取得。 |
| `trace-schedule-jpql` (`GET /schedule/pvt/2025-11-09`) | 20251110T002045Z | `{"list":null}` 応答、`d_audit_event` 未取得。 | `remoteUser` 復元と監査ログ採取後に `TRACEID_JMS/<new RUN_ID>/trace-schedule-jpql/` を更新。 |
| `trace-appo-jpql` (`PUT /appo`) | 20251110T002045Z | `AppointmentModel` 未登録により 500、監査/JMS ログ欠落。 | `persistence.xml` を更新し、Appo seed を投入して 200 応答になるまで再送。 |
| `PatientServiceBean` JPQL | 20251109T201157Z | Legacy 500 / Modern 500（`NoResultException`）、`d_audit_event` 無し。 | `WEB1001` シード投入後に `legacy.raw.log` / `modern.raw.log` / 監査ログを保存。 |
| `KarteServiceBean` JPQL | 20251109T201157Z | Legacy 200 (空 JSON) / Modern 400。seed 不足。 | `ops/db/local-baseline/local_synthetic_seed.sql` でチャートデータを復元して再取得。 |
| `ScheduleServiceBean` JPQL | 20251110T002451Z | SQL は取得済みだが監査ログなし。 | `docker compose exec db* psql` で `d_audit_event` を保存し、`remoteUser` 問題を解消したビルドで再収集。 |
| `AppoServiceBean` JPQL | 20251110T002451Z | Hibernate SQL のみ。`artifacts/parity-manual/appo/` 相当の HTTP/JMS が未作成。 | `ops/tests/api-smoke-test/payloads/appo_cancel_sample.json` を用いて HTTP/JMS を記録し、`d_audit_event` も同梱する。 |
| `JPQL リトライ一式` | 20251110T034844Z | `curl: (7)` で全ケース失敗。HTTP/SQL 未生成。 | Docker Desktop 復旧後に同 4 ケースを再実行し、`artifacts/parity-manual/JPQL/<new RUN_ID>/` へ差し替え。 |
| Trace Harness 再試行 | 20251110T035118Z, 20251110T070638Z | `status_code=000`（`curl (6/7)`）。Docker 不在。 | Mac で Docker を起動し、`trace_http_{200,400,401,500}`, `trace-{schedule,appo}-jpql` を撮り直す。 |

### A.3 未取得ケース

| シナリオ | 期待証跡 | 次アクション |
| --- | --- | --- |
| `LetterServiceBean` (`/odletter/*`) | `artifacts/parity-manual/letter/<RUN_ID>/` + `TRACEID_JMS/trace-letter-jpql/`（HTTP/JPQL/JMS）。 | `ops/tools/send_parallel_request.sh --profile compose PUT /odletter/letter <id=trace-letter-jpql>` を実行し、`d_audit_event` と JMS publish ログを保存。 |
| `NLabServiceBean` (`/lab/module/*`) | `artifacts/parity-manual/lab/<RUN_ID>/`。 | `GET /lab/module/{facilityId}` を Legacy/Modernized へ送り、Lab モジュールの JPQL・JMS・監査ログを採取。 |
| `StampServiceBean` (`/stamp/tree`) | `artifacts/parity-manual/stamp/<RUN_ID>/`。 | `PUT /stamp/tree`（`stamp_tree_sample.json` 想定）を実行し、`TRACEID_JMS/trace-stamp-jpql/` と `d_audit_event` を生成。 |
