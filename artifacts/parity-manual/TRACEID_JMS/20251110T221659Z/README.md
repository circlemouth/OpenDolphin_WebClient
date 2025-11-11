# 2025-11-10 Trace Harness（RUN_ID=20251110T221659Z / `--profile compose`）

## 実行概要
- `tmp/trace-headers/trace_http_{200,400,401,500}.headers` を `PARITY_HEADER_FILE` に指定し、`ops/tools/send_parallel_request.sh --profile compose` で Jamri / Activity / Touch user / Karte の 4 ケースを 2 回連続実行。HTTP 応答は `trace_http_*/{legacy,modern}/`、CLI 出力は `logs/send_parallel_request.log` に保存済み。
- WildFly ログは `docker logs --since 15m opendolphin-server-modernized-dev | rg trace-http` で抽出し `logs/modern_trace_http.log` へ記録。Legacy 側は `traceId` を出さないため `logs/legacy_trace_http.log` は空。
- `docker exec opendolphin-postgres-modernized psql ...` で `d_audit_event` の最新 20 件と Trace ID 別クエリ (`logs/d_audit_event_trace-http-*.sql`) を採取。JMS Queue は `jboss-cli.sh` の `:read-resource(include-runtime=true)` / `DLQ:list-messages` を `logs/jms_*.txt` に保存した。

## ケース別ステータス
| Case | 期待 (Legacy/Modern) | Legacy (`localhost:8080`) | Modernized (`localhost:9080`) | 備考 |
| --- | --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 200 / 200 | **500** HTML (`LogFilter` が null `password` で落下) | **403** HTML (`Unauthorized user: null`) | Modernized では `SessionOperation` → `SessionTraceManager` が WARNING を出し Trace ID を保持。Legacy は依然 500。|
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | 400 / 400 | **403** HTML（Basic 認証 403 に変化） | **403** HTML（`Unauthorized user: doctor1`） | `UserServiceBean#authenticate` が Basic 認証ヘッダーを弾き、400 ケースへ進めず。`d_audit_event_trace-http-400.sql` は 2025-11-10 の -41〜-43 のまま更新なし。|
| `trace_http_401` (`GET /touch/user/...` password 欠落) | 401 / 401 | **500** HTML（`LogFilter#password.equals` NPE） | **403** HTML (`Unauthorized user: doctor1`) | `touch` 経路にも `@SessionOperation` が付与され WARNING ログが traceId 付きで出力。ただし 401 を返す前に認証層が 403 を返却。|
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 500 / 500 | **403** HTML（Basic 認証 403） | **403** HTML (`Unauthorized user: doctor1`) | `KarteBeanConverter` の NullPointer 以前に `SecurityContext` が拒否し 403。`trace_http_500` の監査ログ・JMS いずれも 0 行。|

> **Trace/AOP 観測:** `logs/modern_trace_http.log` には Touch/EHT 系を含むすべてのケースで `traceId=trace-http-*` が WARNING ログとして 2 行ずつ出力され、`EHTServiceBean` / `IPhoneServiceBean` への `@SessionOperation` 追加が有効化されていることを確認。Legacy 側ログは空のまま。

## JMS / Audit / Trace
- `logs/d_audit_event_trace-http-{200,401,500}.sql`: 0 行。`trace_http_400` も 2025-11-10 23:13JST までの負 ID (-41〜-43) から更新なし。`d_audit_event.log` にも新規レコードは出現せず、`AuditTrail` へ Trace ID が残らない課題が継続。
- `logs/jms_dolphinQueue_read-resource.txt`: `messages-added=0L`, `message-count=0L`, `delivering-count=0`。GET 系シナリオのため JMS は未発生。`logs/jms_DLQ_list-messages.txt` も空配列。
- `logs/send_parallel_request.log`: すべてのケースで Legacy=500/403、Modernized=403 を記録。`meta.json` にも `status_code=403` が保存されている。

## 既知課題 / 次アクション
1. **認証層が 403 へ先行** — `UserServiceBean#authenticate` の facility 判定と `LogFilter` の password null チェックが厳しく、400/401/500 ケースへ到達できない。`LogFilter#password.equals` の null-safe 化、`TouchRequestContextExtractor` との整合、`Anonymous` トレース用プロファイルの復活が必要。
2. **AuditTrail Trace ID 未記録** — `d_audit_event` に `trace_id` 列が無く、`request_id` での突合も 400 ケース以外は 0 行。`TRACE_PROPAGATION_CHECK.md` §7/§8 に再発条件（負 ID, `ALTER SEQUENCE` 衝突リスク）を明記し、DB スキーマ改修を継続課題として残す。
3. **JMS 伝搬未検証** — 今回も JMS に到達しなかったため、`TRACEID_JMS_RUNBOOK.md §4` の Touch/Claim シナリオを使ってメッセージ系 API で再取得する必要がある。
4. **ドキュメント更新** — `TRACEID_JMS_RUNBOOK.md`、`TRACE_PROPAGATION_CHECK.md`、`SERVER_MODERNIZED_DEBUG_CHECKLIST.md`、`PHASE2_PROGRESS.md` を本 RUN_ID に合わせて更新済み。残課題（AuditTrail ID 衝突, LogFilter null-safe 化, Touch unauthorized 403）は該当セクションへ追記。
