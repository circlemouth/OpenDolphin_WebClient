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
| #49 | `GET /dolphin/activity/{year,month,count}` | `SystemServiceBean` (`@SessionOperation`) | `trace_http_400` | ⚠️ Legacy=500 / Modern=400 | RUN_ID=`20251110T133000Z` の採取結果: Legacy (`LogFilter#password.equals` NPE) は 500、Modernized は 400 で `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_400/` に HTTP/trace/JMS を保存。`d_audit_event` には `SYSTEM_ACTIVITY_SUMMARY` のみ記録され TraceId が欠落、さらに `d_audit_event_id_seq` を再採番すると AuditTrail ID 衝突で Modernized も 500 になる既知バグのため README/Runbook へ注意事項を追加。 |
| #73 | `GET /touch/user/{userId,facilityId,password}` | `TouchUserServiceBean` (`IPhoneServiceBean` 経由) | `trace_http_401` | ⚠️ 両環境とも 500 | パスワード欠落時に `TouchRequestContextExtractor` が `Remote user does not contain facility separator` を投げ、401 まで到達しない。証跡: `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_401/`。ヘッダー仕様を見直して再実施が必要。 |
| #74 | `GET /karte/pid/{patientPk,date}` | `KarteServiceBean` | `trace_http_500` | ⚠️ Legacy=200 / Modern=400 | RUN_ID=`20251110T133000Z` で再取得（`artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_500/`）。Legacy は無効 PID を `{}` に握り潰し 200、Modernized は `KarteBeanConverter` の null 非対応で 400 (`Not able to deserialize...`)。`d_audit_event_id_seq` の再採番タイミングで AuditTrail ID 衝突が発生し Modernized も 500 になる既知バグとして README/TRACE_PROPAGATION_CHECK に注記。 |
| Baseline | `GET /serverinfo/jamri` | なし（REST フィルタのみ） | `trace_http_200` | ✅ `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_200/` に更新（DocumentModel persistence 追加 + `d_audit_event` 抜粋）。Legacy は traceId を出力しないまま、Modernized は `traceId=trace-http-200` を INFO に記録。 |

- 400/401/500 ケースは `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` に期待ステータスと操作ノートを追加し、CLI で再現できるようにした。  
- Trace ID は `test_config.manual.csv` の `trace-id` 列に記載しており、`trace-session.headers` を複製して `X-Trace-Id` を上書きする運用とした。  
- Legacy サーバーは `ops/legacy-server/docker/configure-wildfly.cli` が `org.wildfly.extension.micrometer` を要求するためビルド不可。`artifacts/parity-manual/TRACEID_JMS/20251108T0526Z/legacy_build.log` に詳細を残した上で、Modernized 側のみ CLI 検証を進める。

### 2.1 2025-11-10 07:06Z 追記（RUN_ID=20251110T070638Z）
- `trace_http_{200,400,401,500}`, `trace-schedule-jpql`, `trace-appo-jpql` を再取得しようとしたが、`ops/tools/send_parallel_request.sh --profile compose` がすべて `curl: (7) Failed to connect to localhost port {8080,9080}` で停止し HTTP ログは取得できなかった。
- 証跡: `artifacts/parity-manual/TRACEID_JMS/20251110T070638Z/README.md`（実行手順と失敗サマリ）、`logs/send_parallel_request.log`（各ケースの `status=000 / exit=7`）を参照。
- `docker ps` が `The command 'docker' could not be found in this WSL 2 distro.` を返し、Legacy/Modernized コンテナが不在。これにより `trace_http_401` の Touch 経路や `trace-appo-jpql` の SessionOperation ERROR を再現できていない。
- 次アクション: Docker Desktop ↔ WSL 統合を有効化した環境へ切り替えてコンテナを起動した後、本 RUN_ID と同じヘッダー／payload で再実行し、§2 の表を更新する。Touch 系 API では `open.dolphin.touch.session.{EHTServiceBean,IPhoneServiceBean}` にも `@SessionOperation` を付与する改修チケットが必要（詳細は `TRACE_PROPAGATION_CHECK.md` §7.2）。

### 2.2 2025-11-10 追記: DocumentModel/persistence + Trace Harness RUN_ID=20251110T133000Z
- DocumentModel の関連エンティティ (`ModuleModel`, `SchemaModel`, `AttachmentModel`) を `server-modernized/src/main/resources/META-INF/persistence.xml` に列挙し、`server-modernized/tools/flyway/sql/V0224__document_module_tables.sql` で Modernized DB に `d_document`/`d_module`/`d_image`/`d_attachment` を投入した。DocumentModel が参照していたテーブルが存在しないことで発生していた `UnknownEntityException` を回避するための基盤が整った。
- RUN_ID=`20251110T133000Z` は次に割り当てる trace harness で、`tmp/trace_http_200.headers` を使って `trace_http_200` を再取得し、HTTP/trace/JMS/`d_audit_event` を `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_200/` に記録する予定。`trace_http_{400,500}` は AuditTrail ID 衝突バグで Modernized が 500 を返す既存 issue として README に記載しており、同様の結果を想定している。
- Modernized AuditTrailService が `eventHash` 想定の軽量クエリへ移行済みな点を踏まえ、RUN_ID=`20251110T133000Z` では `d_audit_event_id_seq` の再採番変動を追跡できるよう `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/d_audit_event.log` を収集予定。現状では `d_audit_event` に TraceId が残らず `SYSTEM_ACTIVITY` のみとなっているため、DocumentModel/persistence + JMS/Audit の連携強化をブロッカーとして継続している。
- 次アクション: Modern WildFly を再ビルドし `docker compose -f docker-compose.modernized.dev.yml up -d db-modernized server-modernized-dev` を起動したうえで `GET /schedule/pvt/2025-11-09` を trace ヘッダー付きで実行し、HTTP 200 および `d_audit_event`/JMS TraceId を確認する。検証結果は `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_200/` に保管し、`LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md`／`PHASE2_PROGRESS.md`／`docs/web-client/planning/phase2/DOC_STATUS.md` に RUN_ID・ブロッカー・次アクションとして整理したうえで次 RUN を採番する。

## 3. 2025-11-09〜10: Karte / Patient / Appo / Schedule

| Service / Endpoint | Legacy TX境界 | Modernized TX境界 | JPQL差分メモ | リスク / 対応方針 | 参照証跡 |
| --- | --- | --- | --- | --- | --- |
| `PatientServiceBean#getPatientById` (`GET /patient/id/0000001`) | `@Stateless`（CMT、`@SessionOperation` なし） | `@ApplicationScoped @Transactional @SessionOperation` | Legacy/Modern とも `from PatientModel p where p.facilityId=? and p.patientId like ?`。Modern 側のみ `ESCAPE ''`。 | Legacy=200（DTO/保険を返却）、Modern=500（`SessionServiceException` → `NoResultException`）。`remoteUser=anonymous` が解決できず facilityId が未確定のまま。 | `artifacts/parity-manual/JPQL/20251110T122417Z/PatientServiceBean/`（TraceId=`jpql-patient-20251110T122417Z`。`d_audit_event` は空）。 |
| `KarteServiceBean#getKarte(fid,pid,fromDate)` (`GET /karte/pid/0000001,2024-01-01`) | `@Stateless` | `@ApplicationScoped @Transactional @SessionOperation` | JPQL は `d_patient` 参照のみで 0 件。Legacy は `{}` を返し、Modern は `KarteBeanConverter` が `null` を扱えず 400。 | `WEB1001` seed 投入後も Modern は `Not able to deserialize data provided`。`KarteBeanConverter` の null-safe 化 + `chart_summary` リトライが必要。 | `artifacts/parity-manual/JPQL/20251110T122417Z/KarteServiceBean/`（TraceId=`jpql-karte-20251110T122417Z`）。 |
| `ScheduleServiceBean#getPvt` (`GET /schedule/pvt/2025-11-09`) | `@Stateless` | `@ApplicationScoped @Transactional @SessionOperation` | Legacy: 5 クエリ（`d_patient_visit`→`d_patient`→`d_health_insurance`→`d_karte`→`d_document`）。Modern: `d_patient_visit` 単独（`like ? escape ''`）。 | HTTP は両環境 200。ただし Modern は `{"list":null}`。`remoteUser=anonymous` のまま DTO 変換が abort するため facility 認証を修正する。監査テーブルは TraceId を記録していない。 | `artifacts/parity-manual/JPQL/20251110T122417Z/ScheduleServiceBean/`（TraceId=`jpql-schedule-20251110T122417Z`）。 |
| `AppoServiceBean#putAppointments` (`PUT /appo`) | `@Stateless` | `@ApplicationScoped @Transactional @SessionOperation` | Legacy/Modern とも `SELECT d_appo ...` → `DELETE d_appo`。今回の `jpql.diff` は alias 差分のみ。 | シード（`id=8001`）を再投入すれば Legacy/Modern とも 200 (`response=1`)。`remoteUser=anonymous` と監査未記録は継続。 | `artifacts/parity-manual/JPQL/20251110T122417Z/AppoServiceBean/`（TraceId=`jpql-appo-20251110T122417Z`、README に reseed/CLI 条件を追記）。 |

- RUN_ID=`20251110T122417Z` で 4 サービスの HTTP/JPQL/ログを採取し、`README.md` に CLI 条件・`docker compose exec db-{legacy,modern}` を使った監査取得手順・reseeding の前提を記載した。`d_audit_event` は Legacy=空、Modern=SYSTEM_ACTIVITY のみ（TraceId 未記録）であることを log として残している。
- `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` の `rest_error_schedule_unknown_entity` / `rest_error_appo_missing_entity` / `rest_error_chart_summary_seed_gap` は最新 RUN_ID に揃えた。Schedule/Appo は `expected_status=200` を維持しつつ、`TODO(remoteUser=anonymous)` と `TODO(WEB1001 seed gap)` に観測結果と再取得条件を追記した。

### 3.1 2025-11-10: 取得リトライ状況
- `RUN_ID=20251110T122417Z (macOS Docker Desktop)`: Patient/Karte/Schedule/Appo を再取得。Legacy/Modern それぞれの HTTP/JPQL/`docker compose logs` を `artifacts/parity-manual/JPQL/20251110T122417Z/<Service>/` に保存し、Appo については実行毎に `/tmp/reseed_appo.sql` を流し込んで `id=8001` を復元した。`d_audit_event` は Legacy=空、Modern=SYSTEM_ACTIVITY のみで TraceId が記録されないことをログ化済み。監査テーブル改善が完了するまでは `d_audit_event_{legacy,modern}.log` が空でも本 RUN_ID を正とする。
- `RUN_ID=20251110T034844Z`: `ops/tools/send_parallel_request.sh --profile compose` を Patient/Karte/Schedule/Appo 4 ケースで再実行したが、ホストに Docker Desktop/compose が無く `curl: (7) Failed to connect to localhost port {8080,9080}` で失敗。詳細は `artifacts/parity-manual/JPQL/20251110T034844Z/README.md` と `*_request.log` を参照。HTTP リクエスト痕跡のみ生成できたため、`legacy.raw.log`／`modern.raw.log`、`d_audit_event` は未更新。

### 3.2 TX/JPQL/Persistence 差分メモ
- `server-modernized/src/main/resources/META-INF/persistence.xml` に `open.dolphin.infomodel.PatientVisitModel` / `AppointmentModel` / `AuditEvent` を列挙済みであり、Legacy と同じエンティティが JPA 管理対象になっていることを確認した。
- `ops/db/local-baseline/local_synthetic_seed.sql` で `appointment_model` / `patient_visit_model` テーブルとシードを定義しているため、`opendolphin_modern` へ流し込めば `trace-appo-jpql` / `trace-schedule-jpql` の ID（例: `id=8001`, `F001` facility）を復元できる。Flyway V0223 に続けて同スクリプトを再投入する。
- `d_audit_event` 抜粋は未保存のため、compose 環境で `docker compose exec db-{legacy,modern} psql ... "select event_time,user_id,operation,resource,trace_id from d_audit_event where trace_id like 'trace-%' order by event_time desc limit 50"` を実行し、各サービス配下に `d_audit_event.{legacy,modern}.log` を置く。完了したら `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #65 を更新する。
- `ScheduleResource` / `AppoResource` は `HttpServletRequest#getRemoteUser()` に依存するが、Modernized 側では WildFly Elytron が匿名レスポンスを返しており `remoteUser=anonymous` のまま。`TraceFilter` or `LogFilter` で `trace-session.headers` の `Authorization` を JACC Principal に伝播させる修正を GitHub Issue #ScheduleRemoteUser でトラッキングする。
- `ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` をシナリオ管理の単一ソースとし、Trace Harness（§2）と本表（§3）の差分が発生した場合は同 CSV を起点に Runbook を更新する。
- **UDPATE（RUN_ID=`20251110TnewZ`）**: `rest_error_letter_fk` / `rest_error_lab_empty` / `rest_error_stamp_data_exception` 向けに `tmp/parity-headers/<case>_<RUN_ID>.headers`（MD5 password=`632080fabdb968f9ac4f31fb55104648`, `X-Trace-Id: parity-<case>-<RUN_ID>`, PUT 系は `Content-Type: application/json`）と `tmp/parity-letter/*.json` をテンプレ化し、README.manual.md にヘッダー・証跡配置・期待レスポンスを追記済み。次回 RUN では `<new RUN_ID>` を付与したヘッダーファイルを複製し `PARITY_OUTPUT_DIR=artifacts/parity-manual/<case>/<new RUN_ID>` へ保存するだけで `ops/tools/send_parallel_request.sh` を再実行できる。

### 3.3 Docker 復旧後チェックリスト
- [ ] **Docker Desktop と compose の健全性確認**: `docker info`, `docker compose version`, `docker context ls` がエラーなく実行でき、`docker ps` に `opendolphin-*` コンテナが表示される。macOS では Docker Desktop > Settings > Resources を 6 CPU / 8 GB RAM 以上に設定し、`/Users/<user>/Documents/OpenDolphin_WebClient` を File Sharing に追加する。
- [ ] **`scripts/start_legacy_modernized.sh start --build` 実行**: `PROJECT_NAME=legacy-vs-modern`（既定値）を維持したまま起動し、`docker compose -p legacy-vs-modern ps` が `db`, `db-modernized`, `server`, `server-modernized-dev` すべて `Up` であることを確認。失敗時は `./scripts/start_legacy_modernized.sh logs server-modernized-dev` を採取し `artifacts/parity-manual/logfilter/<UTC>/` へ保存する。
- [ ] **JPQL ケース再取得**: `PARITY_OUTPUT_DIR=artifacts/parity-manual/JPQL/$RUN_ID` を指定し、`ops/tools/send_parallel_request.sh --profile compose` で `PatientServiceBean`, `KarteServiceBean`, `ScheduleServiceBean`, `AppoServiceBean` を順番に実行。`PARITY_HEADER_FILE=tmp/trace/jpql-<service>-$RUN_ID.headers`、必要に応じて `PARITY_BODY_FILE` を渡す。取得後は `scripts/jpql_trace_compare.sh` を実行し `legacy.normalized.sql` / `modern.normalized.sql` / `jpql.diff` を更新する。
- [ ] **Trace Harness 再実行**: `PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/$RUN_ID` と `PARITY_HEADER_FILE=tmp/trace-headers/trace_*.headers` を組み合わせ、`trace_http_{200,400,401,500}`／`trace-{schedule,appo}-jpql` を全件送信。`ops/tools/send_parallel_request.sh --profile compose --loop 1` を推奨。Appo 用には `PARITY_BODY_FILE=ops/tests/api-smoke-test/payloads/appo_cancel_sample.json` を指定する。
- [ ] **`d_audit_event` 差分取得**: Legacy/Modernized 両 DB で `docker compose -p legacy-vs-modern exec db psql -U opendolphin -d opendolphin_modern -c "select * from d_audit_event order by event_time desc limit 200"` と `... exec db-modernized ...` を実行し、サービス配下に `d_audit_event.{legacy,modern}.log` を保存。Trace Harness 側も同じ RUN_ID 名義で `TRACEID_JMS/<RUN_ID>/d_audit_event/` に複製する。
- [ ] **JMS ヘッダー/ログ採取**: `TRACEID_JMS/<RUN_ID>/<case>/<env>/headers.txt` に `X-Trace-Id` を含むヘッダーを保存し、`logs/{legacy,modern}_trace-*.log` へ WildFly の `traceId=` ログと JMS publish ログをコピーする。`ops/tools/send_parallel_request.sh` 実行時の `send_parallel_request.log` もディレクトリ直下に必ず残す。
- [ ] **`persistence.xml` / seed 確認**: `server-modernized/src/main/resources/META-INF/persistence.xml`（Jakarta 版）に `PatientVisitModel`, `AppointmentModel`, `LetterModule`, `NLabModule`, `StampTreeModel` が列挙されているか `rg '<class>.*(PatientVisitModel|AppointmentModel|Letter|NLab|Stamp)'` で確認し、結果を `artifacts/parity-manual/persistence-check/$RUN_ID/` にメモ。抜けがあれば WAR を再ビルドして再取得する。併せて `ops/db/local-baseline/local_synthetic_seed.sql` を `docker compose exec db-modernized psql ... -f -` で再投入し、`WEB1001` シードを復元する。
- [ ] **成果物整理とドキュメント更新**: 取得物を `artifacts/parity-manual/{JPQL,TRACEID_JMS,appo,schedule,...}/$RUN_ID/` へ格納し、`付録A` の RUN_ID 一覧に追記。更新内容を `docs/server-modernization/phase2/planning/phase2/DOC_STATUS.md` と `PHASE2_PROGRESS.md` へ反映させる。

## 4. 予約/予定カルテ/紹介状/ラボ/スタンプ REST parity（RUN_ID=`20251110TnewZ`）

- `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace buildpack-deps:curl bash -lc 'BASE_URL_LEGACY=\"http://server:8080/openDolphin/resources\" BASE_URL_MODERN=\"http://server-modernized-dev:8080/openDolphin/resources\" … ops/tools/send_parallel_request.sh …'` で CLI を実行。作業ホストから `localhost:{8080,9080}` へ直接アクセスできないため、Compose ネットワーク上の `server` / `server-modernized-dev` を参照する手順を `LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` §3.1 に再確認した。
- Legacy `LogFilter` は MD5 パスワードでキャッシュ照合するため、`password: 632080fabdb968f9ac4f31fb55104648` をヘッダーに設定。`tmp/parity-headers/<case>_<RUN_ID>.headers` で `X-Trace-Id: parity-<case>-<RUN_ID>` を発行し、`PUT` 系 API（appo/letter/stamp）は `Content-Type: application/json` を明示した。
- 取得物は `artifacts/parity-manual/{appo|schedule|letter|lab|stamp}/20251110TnewZ/` に集約し、`logs/{legacy,modern}_trace.log`・`logs/modern_trace_context.log`（500 stack trace）・`d_audit_event_{legacy,modern}.txt`・`jms_note.txt` を同梱した。前 RUN（`20251110T234440Z`）の証跡も比較用に保持している。

| API / ServiceBean | Legacy | Modernized | 監査 / JMS | 次アクション |
| --- | --- | --- | --- | --- |
| `PUT /appo` (`AppoServiceBean#putAppointments`) | 200（`response=1`） | 200（`response=1`） | `d_audit_event` は両環境とも空、JMS 発火なし。 | `tmp/reseed_appo.sql` を Runbook に常設したので、TraceId 付き監査/JMS を SessionOperation から送出できるよう実装を継続。 |
| `GET /schedule/pvt/2025-11-09` (`ScheduleServiceBean`) | 200（`list` に `架空 花子` 1 件） | 200（同 `架空 花子` 1 件） | Legacy/Modern 共に `SYSTEM_ACTIVITY_SUMMARY` のみ。 | Elytron/JACC で `remoteUser` は復旧したが AuditTrail がゼロのまま。`d_audit_event` 記録を優先度高で対応。 |
| `PUT /odletter/letter` (`LetterServiceBean`) | 200 | 500（`fk_d_letter_module_karte` で FK 違反） | Audit/JMS なし。 | `karteBean.id=4` が両 DB で一致しておらず、Modernized 側では `WEB1001` の `d_karte.id=6` を参照している。`d_karte` の PK を揃える or payload をモード別に切り替える運用を検討。証跡: `artifacts/parity-manual/letter/20251110TnewZ/`。 |
| `GET /lab/module/WEB1001,0,5` (`NLabServiceBean`) | 200（`{"list":null}`） | 200（`{"list":null}`） | Legacy/Modern 共に `SYSTEM_ACTIVITY_SUMMARY` のみ。 | `NLabResource` は `fidPid=getFidPid(remoteUser,pid)` を組み立てて `NLabServiceBean#getLaboTest` に渡し（`server-modernized/src/main/java/open/dolphin/rest/NLabResource.java:33-69`, `server-modernized/src/main/java/open/dolphin/session/NLabServiceBean.java:168-214`）、`patientId='1.3.6.1.4.1.9414.72.103:WEB1001'` を条件に検索しているが、`ops/db/local-baseline/local_synthetic_seed.sql` のシード（行 836 以降）が `patientId='WEB1001'` のままなので 0 件ヒットになる。`fid:pid` 形式へ再シードしつつ、空リスト時に `null` を返してしまう `NLaboModuleListConverter#getList`（`common/src/main/java/open/dolphin/converter/NLaboModuleListConverter.java:17-30`）を `[]` 返却に直し、Audit/JMS を含めて再採取する。**2025-11-11 仕様追記:** `/lab/module` の REST DTO は空結果時でも `{"list":[]}` を返すことを必須とし、実装は後続タスク（Converter を `Collections.emptyList()` 返却へ修正）で対応。証跡: `artifacts/parity-manual/lab/20251110TnewZ/`。 |
| `PUT /stamp/tree` (`StampServiceBean`) | 500（`First Commit Win Exception`） | 500（`Bad value for type long … treeBytes`） | Audit/JMS なし。 | Legacy 500 は `StampServiceBean#getNextVersion`（`server/src/main/java/open/dolphin/session/StampServiceBean.java:42-96`）が保持版と DB 版の `versionNumber` 一致を要求するため、`tmp/parity-letter/stamp_tree_payload.json` 固定値（`id=9, versionNumber=0`）が既存 `d_stamp_tree.versionNumber` と乖離している限り再現する。Modernized 500 は `StampTreeModel` が `@Lob byte[] treeBytes`（`common/src/main/java/open/dolphin/infomodel/StampTreeModel.java:57-86`）で Hibernate 6 により OID(Long) マッピングされる一方、Flyway DDL は `treeBytes BYTEA NOT NULL`（`server-modernized/tools/flyway/sql/V0225__letter_lab_stamp_tables.sql:135-149`）のままなので `byte[]` → `long` 変換に失敗することが原因。`StampTreeModelConverter`/`StampTreeModel` 側に `@JdbcTypeCode(SqlTypes.BINARY)` 等を付与して bytea を読む or DDL を OID へ揃えるスキーマ修正と、PUT 前に `/stamp/tree` で最新 `versionNumber` を取得して payload へ反映する運用/テスト手順を次タスク化する。証跡: `artifacts/parity-manual/stamp/20251110TnewZ/`。 |

#### Stamp PUT 500 是正案（2025-11-11）

- **型ミスマッチの整理**: Hibernate 6 では `@Lob byte[]` が PostgreSQL `oid` 型にマップされ、JDBC からは `long` の Large Object ハンドルを渡す前提となる。一方、Legacy DB／Flyway V0225／`ops/db/local-baseline/local_synthetic_seed.sql` は `treeBytes BYTEA` を定義しており、`StampTreeModelConverter` がシリアライズした Base64 → `byte[]` をそのまま INSERT しようとすると `Bad value for type long ... treeBytes` が発生する。`web-client/src/features/administration/pages/StampManagementPage.tsx` でも Base64 文字列（`encodeStampTreeXml`）を `treeBytes` に積んで PUT しているため、Modernized 側を BYTEA 対応に寄せる方がクライアント互換性を保ちやすい。
- **案A（推奨）: ORM 側で bytea 宣言を明示**  
  - `StampTreeModel` と `PublishedTreeModel` の `treeBytes` フィールドへ `@JdbcTypeCode(SqlTypes.BINARY)` と `@Column(name="treeBytes", columnDefinition="bytea")` を追加し、`@Lob` を除去または `@Lob` 併用に切り替える。Jakarta Persistence では `byte[]` + `@JdbcTypeCode(SqlTypes.BINARY)` を指定すると Hibernate が `bytea` に最適化された `BinaryJdbcType` を利用するため、既存 DDL を変更せずに `Bad value for type long` を解消できる。  
  - 既存データの再投入は不要だが、`common` モジュールの shaded jar を Legacy サーバーにもデプロイする必要がある点を `PHASE2_PROGRESS.md` / `DOC_STATUS.md` に記録する。JUnit では `JsonTouchResourceParityTest#putStampTree`（追記予定）を追加し、`treeBytes` round-trip を regression する。  
  - `StampTreeModelConverter` は JSON 化する際に `byte[]` を Base64 へエンコードするだけなので、追加アクションとして `setModel` 時に `model.getTreeXml()` が存在する場合 `model.setTreeBytes(model.getTreeXml().getBytes(StandardCharsets.UTF_8))` を共通化するヘルパを実装し、新 UI / Swing 双方で同じロジックを共有する。`client/src/main/java/open/dolphin/delegater/StampDelegater.java` や Web クライアントの `encodeStampTreeXml` は同振る舞いで揃える。
- **案B: DDL を OID へ揃える場合**  
  - 新しい Flyway（例: V0226）で `ALTER TABLE d_stamp_tree ALTER COLUMN treeBytes TYPE OID USING lo_from_bytea(0, treeBytes);` を実行し、`d_stamp_tree_seq` / seed も `lo_from_bytea` を用いる。`PublishedTreeModel` / `StampTreeModel` の `treeBytes` へ `@Lob @JdbcTypeCode(SqlTypes.BLOB)` を指定し、`stamp_tree_payload.json` などのテストデータは変換不要。  
  - ただし OID は Large Object カタログにガーベジを残すため `vacuumlo` 運用やバックアップ手順の更新が必要となり、`ops/tests/api-smoke-test/rest_error_scenarios.manual.csv` の期待結果も `oid` 前提へ書き換えるコストが発生する。
- **決定・フォローアップ**: 本タスクでは案A（ORM 側アノテーション修正）を第一候補とし、`common` モジュールで bytea 対応を実装 → `server` / `server-modernized` へ依存を取り込むフローを次チケットに切り出す。案B は Long LOB を使う必要が出た場合のバックアップ案として `docs/server-modernization/phase2/domains/STAMP_LETTER_MML_ORCA_ALIGNMENT_PLAN.md` に記載する。`StampServiceBean#getNextVersion` による versionNumber 完全一致制約は引き続き有効なため、PUT 前に GET で最新 version を反映する運用を Runbook 化し、API テストもそれに沿って更新する。


- JMS は今回いずれも enqueue されなかったため `logs/jms_note.txt` にメモを残した。`/20/adm/eht/sendClaim` 等での JMS 証跡取得は別 RUN_ID で継続する。
- Flyway/seed 実行ログは `artifacts/parity-manual/db/20251110TnewZ/{flyway_{legacy,modern},seed_{legacy,modern}}.log` に保存し、`flyway_schema_history` が Legacy/Modernized とも 0225 まで到達したことを `psql` で確認済み。

## 付録A. RUN_ID トラッキング（取得済み / 再取得予定 / 未取得）

### A.1 取得済みケース

| シナリオ | 最新 RUN_ID | 証跡 | 備考 |
| --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 20251110T002045Z | `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_200/` | Legacy/Modernized とも 200 応答。Modernized は `traceId=trace-http-200` が INFO ログへ出力される。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | 20251110T002045Z | `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_400/` | Legacy=500 / Modern=400 だが HTTP/headers/meta を採取済み。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 20251110T002045Z | `artifacts/parity-manual/TRACEID_JMS/20251110T002045Z/trace_http_500/` | Legacy=200 / Modern=400。`TRACE_PROPAGATION_CHECK.md` §7 に差分理由を記録済み。 |
| `PatientServiceBean` JPQL | 20251110T122417Z | `artifacts/parity-manual/JPQL/20251110T122417Z/PatientServiceBean/` | Legacy=200 / Modern=500。JPQL は一致するが `remoteUser=anonymous` で SessionOperation が 500。監査ログは空。 |
| `KarteServiceBean` JPQL | 20251110T122417Z | `artifacts/parity-manual/JPQL/20251110T122417Z/KarteServiceBean/` | Legacy=200（空 JSON） / Modern=400。`KarteBeanConverter` が null を処理できない。 |
| `ScheduleServiceBean` JPQL | 20251110T122417Z | `artifacts/parity-manual/JPQL/20251110T122417Z/ScheduleServiceBean/` | Legacy=200 / Modern=200 だが `{\"list\":null}`。`remoteUser` 未解決の証跡と Hibernate SQL を保存。 |
| `AppoServiceBean` JPQL | 20251110T122417Z | `artifacts/parity-manual/JPQL/20251110T122417Z/AppoServiceBean/` | Legacy/Modern とも 200 (`response=1`)。毎回 reseed して削除件数を合わせた。監査ログは未取得。 |

### A.2 再取得予定ケース

| シナリオ | 既存 RUN_ID | 不足内容 | 次アクション |
| --- | --- | --- | --- |
| `trace_http_401` (`GET /touch/user/...` パスワード欠落) | 20251109T060930Z, 20251110T002045Z | `TouchRequestContextExtractor` が 500 を返し 401 にならない。 | Touch 用ヘッダーを `TRACE_PROPAGATION_CHECK.md` に沿って修正し、`@SessionOperation` 付与後に再取得。 |
| `trace-schedule-jpql` (`GET /schedule/pvt/2025-11-09`) | 20251110T122417Z, 20251110T123655Z, **20251110T234440Z** | 最新 RUN では Legacy/Modern とも 200 で `list` に `架空 花子` 1 件。`artifacts/parity-manual/schedule/20251110T234440Z/` に HTTP/メタ/ログを保存済みだが、`d_audit_event` は `SYSTEM_ACTIVITY_SUMMARY` のみで TraceId 未記録。 | `TRACEID_JMS/<next RUN>/trace-schedule-jpql/` へ Audit/JMS 証跡を追加し、`d_audit_event` へ TraceId を残す修正を優先。 |
| `trace-appo-jpql` (`PUT /appo`) | 20251110T122417Z, 20251110T123655Z, **20251110T234440Z** | reseed（`tmp/reseed_appo.sql`）後に Legacy/Modern とも 200 (`response=1`) を取得できたが、`d_audit_event`・JMS が空のまま。 | `artifacts/parity-manual/appo/20251110T234440Z/` の HTTP/ログ形式を維持しつつ、SessionOperation から Audit/JMS を発火させて再取得する。 |
| `PatientServiceBean` JPQL | 20251110T122417Z | Modern が 500 (`SessionServiceException`) のまま / 監査ログ無し。 | `remoteUser` を Elytron/JACC で復元し、`d_audit_event` に TraceId が残る状態で再取得。 |
| `KarteServiceBean` JPQL | 20251110T122417Z | Modern 400（`KarteBeanConverter` が null 非対応）、監査ログ無し。 | `KarteBeanConverter` null-safe 化 + `chart_summary` seed 追加後に再取得し、`d_audit_event` を同梱。 |
| `ScheduleServiceBean` JPQL | 20251110T122417Z | 監査ログなし・`remoteUser=anonymous`。 | 認証ヘッダー復元＆ `docker compose exec db* psql` で `d_audit_event` を保存。 |
| `AppoServiceBean` JPQL | 20251110T122417Z | reseed 前提が必要、監査未採取。 | reseed 手順を自動化し、`d_audit_event` / JMS を同梱する。 |
| `LetterServiceBean` (`PUT /odletter/letter`) | 20251110T123655Z, 20251110T234440Z, **20251110TnewZ** | Legacy=200（PK=8）/ Modern=500（`fk_d_letter_module_karte` で FK 違反）。Audit/JMS なし。 | `WEB1001` の `d_karte.id` が Legacy=10 / Modern=6 とずれている。`karteBean.id` を実データに合わせて送る or シードで PK を揃える。揃ったら `d_audit_event` の取得も再実施。 |
| `NLabServiceBean` (`GET /lab/module/{pid}`) | 20251110T123655Z, 20251110T234440Z, **20251110TnewZ** | Legacy=200 / Modern=200 だが JSON は両環境とも `{"list":null}`。監査/JMS なし。 | `d_nlabo_module` + `d_nlabo_item` シード（id=9101/920{1,2}）が投入されているのに `getLaboTest` が `null` を戻す。DTO マッピングと Audit/JMS を確認し直す。 |
| `StampServiceBean` (`PUT /stamp/tree`) | 20251110T123655Z, 20251110T234440Z, **20251110TnewZ** | Legacy=500（`First Commit Win Exception`）/ Modern=500（`Bad value for type long … treeBytes`）。Audit/JMS とも空。 | DDL/seed で `d_stamp_tree` + seq は復旧済み。Legacy 側は楽観ロック例外、Modern 側は `treeBytes` の `bytea` 変換が壊れているため、`StampServiceBean` の排他制御と `StampTreeModelConverter` の変換処理を修正して再取得。 |
| `JPQL リトライ一式` | 20251110T034844Z | `curl: (7)` で全ケース失敗。HTTP/SQL 未生成。 | Docker Desktop 復旧後に同 4 ケースを再実行し、`artifacts/parity-manual/JPQL/<new RUN_ID>/` へ差し替え。 |
| Trace Harness 再試行 | 20251110T035118Z, 20251110T070638Z | `status_code=000`（`curl (6/7)`）。Docker 不在。 | Mac で Docker を起動し、`trace_http_{200,400,401,500}`, `trace-{schedule,appo}-jpql` を撮り直す。 |

- **PK 揃え済み→再取得待ち**: 2025-11-11 06:23Z (`artifacts/parity-manual/db/20251111T062323Z/karte_id_check.txt`) で Legacy/Modernized 双方の `d_karte` を採取し、`ops/db/local-baseline/local_synthetic_seed.sql` へ `WEB1001` の `d_karte.id=10` 強制ロジックを追加。Modern DB は `docker exec opendolphin-postgres-modernized psql -c "INSERT id=10"`→`DELETE id=6` で入れ替え、`SELECT setval('opendolphin.hibernate_sequence',10,true);` を実行済み。Letter/Lab/Stamp parity は PK ブロッカーが解消されたため、Docker 再デプロイと RUN_ID `20251110TnewZ` の再取得を待つ。

### A.3 未取得ケース

| シナリオ | 期待証跡 | 次アクション |
| --- | --- | --- |
| _該当なし_ | - | - |
