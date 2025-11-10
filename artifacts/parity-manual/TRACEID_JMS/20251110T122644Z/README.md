# 2025-11-10 Trace Harness (RUN_ID=20251110T122644Z / --profile modernized-dev)

## 実行概要
- `docker run --rm --network legacy-vs-modern_default -v $PWD:/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy bash -lc '...ops/tools/send_parallel_request.sh --profile modernized-dev ...'` の形で helper コンテナを Compose ネットワークへ参加させ、`opendolphin-server(-modernized-dev)` というホスト名を DNS 解決した上で CLI を実行。
- ヘッダーは `tmp/trace-headers/trace_http_{200,400,401,500}.headers` を使用し、`PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/${RUN_ID}` に HTTP 証跡を保存。集計ログは `logs/send_parallel_request.log`。
- WildFly / JMS / DB ログは `logs/` にまとめ、`jms_dolphinQueue_read-resource.txt`（messages-added=1, message-count=0, DLQ 空）・`d_audit_event_trace-http-*.sql`（全て 0 行）・`modern_trace_http.log`（全 Trace ID が INFO ログへ出力）を追加。

## ケース別ステータス
| Case | 期待ステータス | Legacy (opendolphin-server) | Modernized (opendolphin-server-modernized-dev) | 備考 |
| --- | --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | 200 / 200 | **500** (`UT005023` / `LogFilter` NPE) | 200 (空ボディ) | Legacy の `LogFilter` が `password.equals(userCache.getMap().get(userName))` で NPE → Undertow が 500 を返す。Modern 側は匿名 200 で Trace ID ログを確認。ログ: `artifacts/parity-manual/rest-errors/20251110T122644Z/logs/legacy_server.log:608-645`, コード: `server/src/main/java/open/dolphin/rest/LogFilter.java:37-60`. |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | 400 / 400 | **500** (HTML 500) | 400 (ヘッダーのみ, ボディ空) | Legacy は引き続き `LogFilter` で 500。Modern は 400 を返すものの `SessionOperation` / `d_audit_event` には記録されず、`traceId` は `LogFilter` INFO のみ。 |
| `trace_http_401` (`GET /touch/user/...` password 欠落) | 401 / 401 | **500** (HTML 500) | **500** (`Remote user does not contain facility separator`) | `TouchRequestContextExtractor#from` が remoteUser に `:` が無い状態で `IllegalStateException` を送出し、401 まで到達できない。証跡: `trace_http_401/modern/response.json`, `artifacts/parity-manual/rest-errors/20251110T122644Z/logs/modern_server.log:640,1368,14015,14855`, コード: `server-modernized/src/main/java/open/dolphin/touch/support/TouchRequestContextExtractor.java:17-40`. |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 500 / 500 | 200 (`{}`) | **400** (`Not able to deserialize data provided`) | Legacy は例外を握りつぶして 200+空 JSON。Modern は `KarteBeanConverter` が null モデルをデシリアライズできず `RESTEASY-JACKSON000100` → 400。ログ: `artifacts/parity-manual/rest-errors/20251110T122644Z/logs/modern_server.log:808,1536,14183,15023`。 |

> `trace_http_{400,401,500}` は `rest_error_scenarios.manual.csv` と同一シナリオのため、`artifacts/parity-manual/rest-errors/20251110T122644Z/` にも同じ証跡を複製済み。

## JMS / Audit / Trace
- `jms_dolphinQueue_read-resource.txt`: `messages-added=1L`, `message-count=0L`, `delivering-count=0`, `DLQ=list-messages=[]`。Trace Harness の GET 4 ケースでは JMS 送信が発生せず、Queue 指標はデフォルト値のまま。
- `d_audit_event_trace-http-*.sql`: いずれも 0 行。`d_audit_event` には `trace_id` カラムが存在せず (`information_schema.columns` で未検出)、`payload` にも `trace-http-*` が埋まっていなかった。監査ログへ Trace ID を載せる機構が未実装のため、Checklist #94 は継続対応とする。
- `modern_trace_http.log`: すべてのケースで `192.168.65.1`（ホスト）および helper コンテナ (`172.23.0.7`) からのアクセスに対し `traceId=trace-http-*` が 2 行ずつ出力され、`LogFilter` がヘッダーを正しく拾っていることを確認。

## 既知課題 / 次アクション
1. **Legacy LogFilter NullPointer**: `password` が欠落する匿名 API (serverinfo/jamri) や 401/400 ケースで `password.equals(...)` が即 NPE になるため、`Optional.ofNullable(password)` など防御を入れない限り 4xx 想定経路に到達できない。`SERVER_MODERNIZED_DEBUG_CHECKLIST.md` #94 へ「Legacy 側 LogFilter NPE で 500 応答」のブロッカーを追記。
2. **TouchRequestContextExtractor 401 未到達**: パスワード欠落時は `remoteUser` 自体が設定されず、`IllegalStateException` が RESTEasy で 500 として処理される。`TouchAuthHandler` の Credential 検証結果に応じて `Remote user does not contain facility separator` を INFO/WARN に留め、401 を返すよう修正が必要。
3. **KarteBeanConverter null-safe 化**: `trace_http_500` で `KarteBeanConverter["id"]` が null を参照し 400 になる。`persistence.xml` に `PatientVisitModel` を登録し `KarteBeanConverter` を null tolerant にすれば Legacy 500 と整合する想定。`domain-transaction-parity.md` の該当節へも反映。
4. **監査ログ未整備**: Trace Harness 用の Trace ID を `d_audit_event` に落とす機構が未実装のまま。`TRACE_PROPAGATION_CHECK.md` §7 を更新し、`d_audit_event` へ `trace_id` 列追加 or JSON payload へ `traceId` 埋め込みを TODO として明記。

## 参照ファイル
- `logs/send_parallel_request.log`
- `logs/{modern,legacy}_trace_http.log`
- `logs/jms_dolphinQueue_read-resource.txt`, `logs/jms_DLQ_list-messages.txt`
- `trace_http_{200,400,401,500}/{legacy,modern}/(meta.json|headers.txt|response.json)`
