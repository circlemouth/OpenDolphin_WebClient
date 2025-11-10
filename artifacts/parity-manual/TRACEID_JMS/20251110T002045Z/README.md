# 2025-11-10 Trace HTTP / JPQL 監査 (RUN_ID=20251110T002045Z)

## 実行概要
- コマンド例: `RUN_ID=20251110T002045Z PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/${RUN_ID} PARITY_HEADER_FILE=tmp/trace-headers/<case>.headers ops/tools/send_parallel_request.sh --profile compose --loop 1 <METHOD> <PATH> <ID>`
- `test_config.manual.csv` と `rest_error_scenarios.manual.csv` から `trace_http_{200,400,401,500}` / `trace-schedule-jpql` / `trace-appo-jpql` を選択し、`X-Trace-Id` を固定して Legacy / Modernized に同一リクエストを送信。
- `logs/modern_*.log` には WildFly 33 の `traceId=` 行とスタックトレースを保存。Legacy 側は `LogFilter` に traceId 出力が無いため HTTP/AP サマリのみ (`logs/legacy_*.log`)。
- JMS 発行系 API は対象外のため JMS ログは未発生。Trace Harness として HTTP→SessionOperation の伝搬状況のみ確認。

## ケース別サマリ
| Case | Legacy | Modernized | 主なログ / 課題 |
| --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 200 | 200 | Legacy は Trace ID 未出力。Modernized は `open.dolphin` ログ 2 行に `trace-http-200` が記録される（`logs/modern_trace_http_200.log`）。匿名ヘッダーでは応答待ちになるため、`trace-session` 相当の認証ヘッダーで実行。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | **500** (`ArrayIndexOutOfBoundsException`) | **400** (`BadRequestException: param must contain year, month, count`) | Modernized は `d_audit_event` へ insert した直後に 400 応答。Legacy は `SystemResource#getActivities` の配列参照バグで 500 HTML。|
| `trace_http_401` (`GET /touch/user/doctor1,...,dolphin` パスワード欠落) | **500** | **500** | いずれも `TouchRequestContextExtractor` が `Remote user does not contain facility separator` で落ち、`TouchUserServiceBean` に到達せず。401 想定経路まで進められない。|
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | **200** (空 JSON) | **400** (`Not able to deserialize data provided`) | 両環境とも `AbstractResource#parseDate` で ParseException。Legacy は 200+空 JSON、Modernized は 400 + Warning ログ。`SessionTraceManager` ログは未出力。|
| `trace-schedule-jpql` (`GET /schedule/pvt/2025-11-09`) | 200 (`list` に患者1件) | 200 (`{"list":null}`) | Modernized でも `PatientVisitModel` JPQL が実行されるが DTO 変換で null が返る。Legacy との差分は `logs/legacy_trace-schedule-jpql.log` / `logs/modern_trace-schedule-jpql.log` に JPQL を保存。|
| `trace-appo-jpql` (`PUT /appo`) | **500** (`IllegalArgumentException: delete event with null entity`) | **500** (`SessionServiceException` → `IllegalArgumentException`) | Modernized では `SessionOperationInterceptor` が `trace-appo-jpql` を含む ERROR を出力し、`AppointmentModel` 未解決が原因。Legacy も同例外だが traceId 出力なし。|

## 取得ファイル
- `<case>/<legacy|modern>/{meta.json,headers.txt,response.json}` … HTTP 証跡。
- `logs/modern_trace_http_*.log` … `traceId=` を含む WildFly ログ抜粋。`logs/modern_trace-appo-jpql.log` には `SessionOperationInterceptor` の stacktrace を全文格納。
- `logs/legacy_trace_*.log` … Legacy WildFly10 ログ抜粋（traceId 未出力）。

## 既知ブロッカー / TODO
1. `trace_http_401` は `TouchRequestContextExtractor` による入力検証で 500 になり、401 想定経路まで進めない。`TouchUserServiceBean` に渡す前段 (`LogFilter`→`TouchRequestContextExtractor`) のヘッダー仕様を整理し、パスワード欠落時の 401 へ誘導する修正が必要。
2. `trace_http_500` では `SessionOperationInterceptor`/`SessionTraceManager` のログが INFO レベルに出ず、HTTP ログのみで伝搬を追う必要がある。`logging.properties` で DEBUG を一時的に上げるか、`SessionTraceManager` に INFO フックを追加する改善が必要。
3. `trace-schedule-jpql` は Modernized で 200 応答だが `list=null` のまま。`ScheduleServiceBean#getPvt` の DTO 変換／`PvtServiceBean` 周辺を調査し、Legacy (`list` あり) との乖離を `domain-transaction-parity.md` に反映する。
4. `trace-appo-jpql` では Legacy/Modernized ともに `AppointmentModel` 解決に失敗し 500。Modernized 側のみ `SessionOperationInterceptor` が traceId を保持しているが、实体未登録 (`persistence.xml` / Flyway seed) を解消するまで 200 にはできない。
5. JMS 系 API は未実施。`/20/adm/factor2/*` など JMS を伴うケースを追加し、`TRACE_PROPAGATION_CHECK.md` から参照する Evidence を拡充する。
