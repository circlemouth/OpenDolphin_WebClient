# 2025-11-10 JPQL リトライ（Blocked）

## 実行概要
- 目的: `/patient/id/0000001`, `/karte/pid/0000001,2024-01-01`, `/schedule/pvt/2025-11-09`, `PUT /appo` を Legacy／Modernized 並列で再取得し、`d_audit_event` と Hibernate SQL ログを `artifacts/parity-manual/JPQL/<ts>/<service>/` へ保存する。
- 実施コマンド: `ops/tools/send_parallel_request.sh --profile compose` を 4 ケース（GET×3, PUT×1）で実行。`PARITY_HEADER_FILE=tmp/trace/jpql-<service>-20251110T034844Z.headers`、`PARITY_OUTPUT_DIR=artifacts/parity-manual/JPQL/20251110T034844Z` を指定。`PUT /appo` のみ `PARITY_BODY_FILE=ops/tests/api-smoke-test/payloads/appo_cancel_sample.json` を追加。
- 結果: Docker Desktop / compose 環境が未インストールのため `curl: (7) Failed to connect to localhost port {8080,9080}` で全ケース失敗。`*_request.log` に失敗ログを保存し、`meta.json` には `status_code=000` / `exit_code=7` が記録された。`d_audit_event`／Hibernate SQL ログは生成されていない。

## コマンド・ログハッシュ
| # | コマンド | ログファイル | SHA-256 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `PARITY_OUTPUT_DIR=... PARITY_HEADER_FILE=tmp/trace/jpql-patient-20251110T034844Z.headers ops/tools/send_parallel_request.sh --profile compose GET /patient/id/0000001 PatientServiceBean` | `patient_request.log` | `cc85f770f9c8b01a714203766055cb4fe0e4f84eb4a71fa38230107f5360977d` | Legacy/Modern とも `curl (7)` で失敗。 |
| 2 | `PARITY_OUTPUT_DIR=... PARITY_HEADER_FILE=tmp/trace/jpql-karte-20251110T034844Z.headers ops/tools/send_parallel_request.sh --profile compose GET /karte/pid/0000001,2024-01-01 KarteServiceBean` | `karte_request.log` | `a015b381b8219389f40ab1ebc0c5a172e6f598d5adffa6f45f58f4d540e7e86a` | 同上。 |
| 3 | `PARITY_OUTPUT_DIR=... PARITY_HEADER_FILE=tmp/trace/jpql-schedule-20251110T034844Z.headers ops/tools/send_parallel_request.sh --profile compose GET /schedule/pvt/2025-11-09 ScheduleServiceBean` | `schedule_request.log` | `b22dbbb8a8aec6db7ae960a45d45cdae0b55ee4069eb2881f2a86a5668dcc433` | 同上。 |
| 4 | `PARITY_OUTPUT_DIR=... PARITY_HEADER_FILE=tmp/trace/jpql-appo-20251110T034844Z.headers PARITY_BODY_FILE=ops/tests/api-smoke-test/payloads/appo_cancel_sample.json ops/tools/send_parallel_request.sh --profile compose PUT /appo AppoServiceBean` | `appo_request.log` | `95c6b027af8867395b992b9d404c7eeeeda5da7396ec9bcc91764439d2f4cfcc` | 同上。 |

## 今後のアクション
1. `scripts/start_legacy_modernized.sh start --build`（Docker Desktop + compose）で Legacy/Modernized を同時起動し、Postgres に `WEB1001` シードを投入。
2. 上記 4 コマンドを再実行し、`docker compose logs` から `hibernate.SQL` と `d_audit_event` を抽出して `<service>/legacy.raw.log` / `<service>/modern.raw.log` を作成。
3. `domain-transaction-parity.md §3` の最新ログ列に 20251110T034844Z の差分を追記し、`rest_error_scenarios.manual.csv` に採取結果を反映。
