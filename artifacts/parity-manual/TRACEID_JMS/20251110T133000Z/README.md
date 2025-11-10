# 2025-11-10 Trace Harness（RUN_ID=20251110T133000Z / `--profile compose`）

## 実行概要
- `tmp/trace_http_{200,400,500}.headers` を `PARITY_HEADER_FILE` に指定し、`ops/tools/send_parallel_request.sh --profile compose` で `GET /serverinfo/jamri`, `/dolphin/activity/2025,04`, `/karte/pid/INVALID,%5Bdate%5D` を再取得。出力は `artifacts/parity-manual/TRACEID_JMS/20251110T133000Z/trace_http_*/{legacy,modern}/` と `logs/send_parallel_request.log` に保存。
- Modernized 側 WildFly (`opendolphin-server-modernized-dev`) から `trace-http-*` ログを抽出して `logs/modern_trace_http.log` を作成し、Legacy 側は `LogFilter` の `traceId` 欠落で空のまま。
- `docker exec opendolphin-postgres-modernized psql ...` で `d_audit_event` の最新行と TraceId 別 SQL を採取 (`d_audit_event.log`, `logs/d_audit_event_trace-http-*.sql`)。さらに `jboss-cli.sh` で `dolphinQueue` / `DLQ` の JMS 状態を `logs/jms_*.txt` に保存。

## ケース別ステータス
| Case | 期待ステータス | Legacy (`localhost:8080`) | Modernized (`localhost:9080`) | 備考 |
| --- | --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 200 / 200 | 200（空ボディ、`LogFilter` で Trace ID 未出力） | 200（空ボディ、`traceId=trace-http-200` が INFO 2 行） | HTTP 応答は空 JSON。監査ログにも Trace ID は未記録。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | 400 / 400 | **500** (`LogFilter` NullPointer, HTML 500) | 400（ボディ空） | `d_audit_event` には `SYSTEM_ACTIVITY_SUMMARY` として `id=-41,-42,-43` が記録されるが Trace ID 列が無く突合不可。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 500 / 500 | 200（`{}` を返却） | 400（`Not able to deserialize data provided`） | `KarteBeanConverter` の null 非対応で 400。Legacy は例外を握り潰し 200。監査ログには追加レコードなし。 |

> **既知事象（AuditTrail ID 衝突）**: `d_audit_event_id_seq` が手動で負値 (-41〜) に振られているため、次回 `ALTER SEQUENCE ... RESTART` を行うと既存 ID と衝突して Modernized 側の `trace_http_{400,500}` が 500（`duplicate key value violates unique constraint "d_audit_event_pkey"`）で落ちることが分かっている。今 RUN では衝突前の状態を `d_audit_event.log` に保存し、README・Runbook に注意書きを追加した。

## JMS / Audit / Trace
- `logs/jms_dolphinQueue_read-resource.txt`: `messages-added=1L`, `message-count=0L`, `DLQ` 空。Trace Harness の GET 3 ケースでは JMS キューに流入していないことを再確認。
- `logs/d_audit_event_trace-http-400.sql`: `request_id='trace-http-400'` の行が 3 件（ID=-43〜-41）で `SYSTEM_ACTIVITY_SUMMARY` のみ記録。`trace-http-200` / `trace-http-500` は 0 行だったため、監査ログに Trace ID が残らない既知ブロッカーを維持。
- `modern_trace_http.log`: 3 ケースすべてで `traceId=trace-http-*` が 2 行ずつ INFO 出力され SessionOperation → SessionTraceManager の付与を確認。Legacy 側ログは空（`LogFilter` が `traceId` を書かないため）。

## 次アクション / TODO
1. **AuditTrail**: `d_audit_event_id_seq` の再採番を DB タスクと調整し、再実行時に発生する 500（AuditTrail ID 衝突）を採取したうえで `TRACE_PROPAGATION_CHECK.md` / `domain-transaction-parity.md` に再発条件と復旧手順を記録する。
2. **Karte 400 vs 500**: `server-modernized/src/main/java/open/dolphin/helper/KarteBeanConverter.java` を null-safe 化し、Invalid PID の場合でも 500 (`NumberFormatException` → `SessionServiceException`) に揃える。
3. **Legacy LogFilter**: 匿名アクセス時に `password.equals(...)` で NPE になる実装を修正し、`trace_http_400` で 400 を返せるようにする。修正後に Legacy 側の trace ログ採取を再試行する。
4. **監査ログ拡張**: `TRACEID_JMS_RUNBOOK.md` / `TRACE_PROPAGATION_CHECK.md` の TODO に従い、AuditTrailService で `traceId` を payload JSON へ埋める or 別カラムを追加し、`d_audit_event_trace-http-*.sql` で突合できるようにする。
