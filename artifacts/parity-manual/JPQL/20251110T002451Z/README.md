# RUN_ID=20251110T002451Z JPQL 追採取

## 1. 取得概要
- 2025-11-10 00:24:51Z に `ops/tools/send_parallel_request.sh --profile compose` を `ScheduleServiceBean#getPvt` / `AppoServiceBean#putAppointments` の 2 ケースで再実行し、2025-11-09 版 artifacts に不足していた正規化 SQL を補完。
- `PARITY_HEADER_FILE=tmp/trace/jpql-<service>-20251110T002451Z.headers`、`PARITY_BODY_FILE=ops/tests/api-smoke-test/payloads/appo_cancel_sample.json`（Appo のみ）を渡し、`legacy.raw.log` / `modern.raw.log` を `ansi2txt` 未適用のまま保存。
- `legacy.normalized.sql` / `modern.normalized.sql` を `scripts/jpql_trace_compare.sh` で生成し、`jpql.diff` に差分を収録。

## 2. HTTP / 監査状況
- HTTP 応答: 2025-11-09 RUN と同じ `http/` ディレクトリを再利用しており、本 RUN_ID には `http` 直下の新規ファイルは無い（SQL ログのみ更新）。
- `d_audit_event`: Docker Desktop / compose が WSL へ未導入なため `docker compose exec db-modernized ...` が実行できず採取不可。`README.md`（本ファイル）にブロッカーを記録し、`domain-transaction-parity.md §3.1` で TODO を追記済み。

## 3. JPQL 差分ハイライト
| ServiceBean | Legacy SQL | Modern SQL | 差分メモ |
| --- | --- | --- | --- |
| ScheduleServiceBean (`trace-schedule-jpql`) | 5 クエリ（`d_patient_visit` → `d_patient` → `d_health_insurance` → `d_karte` → `d_document`）。 | 1 クエリ（`d_patient_visit` のみ。`like ? escape ''` に変換）。 | Legacy は SessionBean 内の DTO 変換で患者情報を eager 取得、Modern は `remoteUser=anonymous` のため facilityId 解決前に変換が打ち切られ `{"list":null}` となる。 |
| AppoServiceBean (`trace-appo-jpql`) | `SELECT ... FROM d_appo`（JOIN 付き）→ `DELETE FROM d_appo`. | 同構造（JOIN alias のみ短縮）。 | Flyway V0223 + `persistence.xml` 更新で UnknownEntityException を解消し、削除 1 件が 200 で完了。Modern でも `trace-appo-jpql` が Hibernate SQL に残る。 |

## 4. フォローアップ
1. `d_audit_event` の採取が完了していないため、`docker compose exec db-modernized psql ...` / `db-legacy` の 2 つを `ScheduleServiceBean/d_audit_event.{legacy,modern}.log` として追記する。
2. `remoteUser=anonymous` のまま `ScheduleServiceBean` の DTO 変換が facilityId を得られない問題を `rest_error_scenarios.manual.csv` および `domain-transaction-parity.md §3` へ TODO として残している。`security-domain` 設定更新後に本 RUN_ID を更新して差分を取り直す。
