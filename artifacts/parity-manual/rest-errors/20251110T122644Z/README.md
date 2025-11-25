# 2025-11-10 REST 4xx/5xx 例外再取得 (RUN_ID=20251110T122644Z)

## 実行条件
- `TRACEID_JMS` と同じヘッダーを利用しつつ、`PARITY_OUTPUT_DIR=artifacts/parity-manual/rest-errors/${RUN_ID}` へ保存。実行ホストは helper コンテナ（`docker run --rm --network legacy-vs-modern_default ... --profile modernized-dev`）。
- `logs/legacy_server.log` / `logs/modern_server.log` に WildFly 全ログを採取し、`logs/send_parallel_request.log` へ HTTP ステータスを集約。

## ケース別結果
| Case | 期待コード | Legacy | Modernized | 所見 |
| --- | --- | --- | --- | --- |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | 400 | **500** (HTML 500) | 400 (ヘッダーのみ) | Legacy `LogFilter` が匿名アクセスを許容せず 500。Modern は 400 を返すが `AbstractResource` 層ではレスポンス整形を行わず、ボディ空/監査ログ未記録。|
| `trace_http_401` (`GET /touch/user/...` password 無し) | 401 | **500** | **500** (`Remote user does not contain facility separator`) | `TouchRequestContextExtractor#from`（`server-modernized/src/main/java/open/dolphin/touch/support/TouchRequestContextExtractor.java:17-40`）が `remoteUser` に区切りが無いと `IllegalStateException` を即 throw。`AbstractResource#getRemoteFacility`（`server-modernized/src/main/java/open/dolphin/rest/AbstractResource.java:24-40`）は欠損を許容する実装だが Touch 側では利用していないため、例外共通化ができていない。Legacy も同じく `LogFilter` フェーズで 500。|
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | 500 | 200 (`{}`) | **400** (`Not able to deserialize data provided`) | Legacy は `KarteServiceBean` 例外を飲み込んで 200 + 空 JSON。Modern は `RESTEASY-JACKSON000100`（`logs/modern_server.log:808,1536,...`）が出て 400。`KarteBeanConverter` が null モデルを扱えず、`AbstractResource` 由来の共通シリアライザでも 500 へ落とし込めていない。|

## ログ観測メモ
1. **Legacy LogFilter NullPointer** — `server/src/main/java/open/dolphin/rest/LogFilter.java:37-60` で `password.equals(userCache.getMap().get(userName))` を無条件に呼び、匿名 or 欠落ヘッダー時に NPE → Undertow 500 (`logs/legacy_server.log:608-645`)。`AbstractResource` の `getRemoteFacility` へ進む前に 500 となるため、Legacy で 4xx/5xx ワークフローを検証できない。
2. **TouchRequestContextExtractor と AbstractResource の乖離** — Modernized 側 `TouchRequestContextExtractor` は `remoteUser` 構造を厳格に要求し、401 想定ケースが 500 で停止。一方 `AbstractResource#getRemoteFacility` は `:` 不在時はそのまま文字列を返す防御を入れており、レスポンス共通化が徹底されていない。`LogFilter` による `remoteUser` 注入/匿名ヘッダー判定を整理する必要あり。
3. **Jackson 400 (`trace_http_500`)** — `RESTEASY-JACKSON000100` が `KarteBeanConverter["id"]` で null アクセスと指摘。`docs/server-modernization/phase2/notes/domain-transaction-parity.md` の KarteEntry TODO と一致し、`KarteBeanConverter` の null-safe 化または `persistence.xml` への `PatientVisitModel` 追加が必要。
4. **監査ログ未連携** — `d_audit_event` 抽出は 0 行 (`TRACEID_JMS/logs/d_audit_event_trace-http-*.sql`)。`AbstractResource` に例外レスポンスのフォーマッタが無く、`SessionOperationInterceptor` も INFO ログ以上を出さないため、`trace-http-*` を監査/Audit に紐付けられない。

## 次アクション
1. Legacy `LogFilter` を Null safe に修正し、401/400 ケースでもフィルターを通過できるよう `userCache` 初期化と `Optional.ofNullable(password)` 防御を追加。併せて Trace ID をログへ出力する。
2. Touch 系 REST では `AbstractResource#getRemoteFacility` もしくは共通ユーティリティを使用し、`remoteUser` 欠落時は 401 を返すよう `TouchRequestContextExtractor` / `TouchAuthHandler` を改修。
3. `KarteBeanConverter` の null-safe 化と `persistence.xml` 追記により、`trace_http_500` を本来の 500 応答（`SessionServiceException`）に統一。レスポンス本文の JSON 形式（`{"errorCode":...}` 等）を `AbstractResource` で統一する。
4. `d_audit_event` に Trace ID を格納する列 or JSON を追加し、`TRACE_PROPAGATION_CHECK.md` の CLI 手順から参照できるよう Runbook を更新。今回の RUN_ID は `PHASE2_PROGRESS.md` / `DOC_STATUS.md` / `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` へ反映済み。
