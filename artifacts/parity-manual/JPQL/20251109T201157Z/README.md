# RUN_ID=20251109T201157Z JPQL 採取概要

## 1. 取得目的 / 手順
- 目的: Legacy（WildFly10）と Modernized（WildFly33）で `KarteServiceBean` / `PatientServiceBean` / `ScheduleServiceBean` / `AppoServiceBean` の JPQL → SQL 変換とトランザクション境界を突合し、`domain-transaction-parity.md §3` のフェーズ4-1チェックリストを埋める。
- 実行手順: `scripts/start_legacy_modernized.sh start --build` → `ops/tools/send_parallel_request.sh --profile compose` をサービス毎に実行し、`PARITY_HEADER_FILE=tmp/trace/jpql-<service>-20251109T201157Z.headers`、`PARITY_OUTPUT_DIR=artifacts/parity-manual/JPQL/20251109T201157Z/<service>` で HTTP 応答と Hibernate SQL（`legacy.raw.log` / `modern.raw.log`）を保存。
- 付帯ファイル: `http/` ディレクトリ以下に `headers.txt` / `meta.json` / `response.json` を分離保存。正規化済み SQL はこの RUN_ID では未生成（差分確認は `jpql.diff` および Raw ログを参照）。

## 2. ケース一覧
| ServiceBean | API / Payload | TraceId (X-Trace-Id) | Legacy status | Modernized status | 備考 / エビデンス |
| --- | --- | --- | --- | --- | --- |
| PatientServiceBean | `GET /patient/id/0000001` | `jpql-patient-20251109T201157Z` | 500 (`NoResultException` → SessionServiceException)。HTTP: `http/patient_by_id/legacy/meta.json`. | `http/modern/response.json` に `Session layer failure ... getPatientById` を記録（`meta.json` 未生成のため 500 推定）。 | JPQL は両環境とも `from PatientModel ... like ?`。Modern 側で `ESCAPE ''` 追記あり。`legacy.raw.log`/`modern.raw.log` を参照。 |
| KarteServiceBean | `GET /karte/pid/0000001,2024-01-01` | `jpql-karte-20251109T201157Z` | 200 + `{}`（`http/legacy/response.json`）。 | 400（`Not able to deserialize...` を `http/modern/response.json` に記録）。 | `KarteBeanConverter` が null を扱えないため Modern 側のみ 400。JPQL 自体は `d_patient` のみ。 |
| ScheduleServiceBean | `GET /schedule/pvt/2025-11-09` | `trace-schedule-jpql` | `http/legacy/response.json` に `{"list":null}`、JPQL は `d_patient_visit` + `d_patient` 等 5 クエリ。 | `http/modern/response.json` が `Session layer failure ... getPvt`（500）。 | Modern 側は `remoteUser=null` のまま DTO 変換で例外。JPQL raw は 1 クエリのみ。 |
| AppoServiceBean | `PUT /appo` + `ops/tests/api-smoke-test/payloads/appo_cancel_sample.json` | `trace-appo-jpql` | 200 (`http/legacy/response.json` = `1`)。 | 500（`Session layer failure ... putAppointments`）。 | Modern 側は `AppointmentModel` 未認識で `UnknownEntityException`。 |

## 3. `d_audit_event` / Hibernate SQL
- Hibernate SQL: 各サービスの `legacy.raw.log` / `modern.raw.log` を ANSI 付きで保存済み。正規化済み差分は後続 RUN_ID (`20251110T002451Z`) で取得。
- `d_audit_event`: Docker Desktop を有効化できない WSL 環境のため `docker compose exec db-modernized psql ...` が実行できず、当 RUN_ID では採取できていない。`scripts/start_legacy_modernized.sh` を実行可能なホストで以下を再実施すること。  
  1. `docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml exec db-modernized psql -U docker -d opendolphin_modern -c "select * from d_audit_event order by event_time desc limit 200"` を `<service>/d_audit_event_<legacy|modern>.log` へ保存。  
  2. 生成したファイルを本 RUN_ID 配下へ追加し、`domain-transaction-parity.md §3.1` の TODO をクローズ。

## 4. フォローアップ
- `WEB1001` シードが Modernized DB に存在しないため、Patient/Karte は引き続き 400/500。`ops/db/local-baseline/local_synthetic_seed.sql` を `opendolphin_modern` へ再投入するまで `rest_error_chart_summary_seed_gap` は TODO のままとする。
- Remote user 解決 (`doctor1@F001`) は Legacy の `LogFilter` 依存のため、Modernized 側で `remoteUser=anonymous` となる。`security-domain` 設定または `ScheduleResource#getPvt` の facility 解決処理を修正するまで `ScheduleServiceBean` の DTO 変換差分は残課題扱い。
