# 2025-11-10 Trace Harness 再実行 (RUN_ID=20251110T070638Z)

## 実行概要
- `PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/${RUN_ID}` を指定し、`tmp/trace-headers/trace_*.headers` と（Appo 用）`ops/tests/api-smoke-test/payloads/appo_cancel_sample.json` を読み込ませて `ops/tools/send_parallel_request.sh --profile compose` をケースごとに実行。
- 対象ケース: `trace_http_{200,400,401,500}`, `trace-schedule-jpql`, `trace-appo-jpql`。ログは `logs/send_parallel_request.log` に集約。
- いずれのリクエストも `curl: (7) Failed to connect to localhost port {8080,9080}` で終了し、`meta.json` には `status_code=000 / exit_code=7` が記録された。HTTP レイヤーへ到達できなかったため WildFly / SessionOperation ログは採取できていない。

## ケース別ステータス
| Case | Legacy | Modernized | 備考 |
| --- | --- | --- | --- |
| `trace_http_200` (`GET /serverinfo/jamri`) | status=000 / exit=7 | status=000 / exit=7 | ローカルポート 8080/9080 いずれも接続不能。匿名ヘッダーではなく `trace_http_200.headers` を使用。 |
| `trace_http_400` (`GET /dolphin/activity/2025,04`) | status=000 / exit=7 | status=000 / exit=7 | `trace_http_400.headers` を付与しても HTTP 層まで到達せず。 |
| `trace_http_401` (`GET /touch/user/...` パスワード欠落) | status=000 / exit=7 | status=000 / exit=7 | `trace_http_401.headers`（password 行削除）を適用したが同様に接続不可。 |
| `trace_http_500` (`GET /karte/pid/INVALID,%5Bdate%5D`) | status=000 / exit=7 | status=000 / exit=7 | `trace_http_500.headers`。SessionOperationInterceptor まで到達させる前に TCP 接続が失敗。 |
| `trace-schedule-jpql` (`GET /schedule/pvt/2025-11-09`) | status=000 / exit=7 | status=000 / exit=7 | JPQL / DTO 差分再取得は未実施。 |
| `trace-appo-jpql` (`PUT /appo`) | status=000 / exit=7 | status=000 / exit=7 | `trace_appo_jpql.headers` + `appo_cancel_sample.json` で送信したが `curl (7)`。 |

## 環境ブロッカーと証跡
1. `docker ps` を実行すると `The command 'docker' could not be found in this WSL 2 distro.` と表示され、Docker Desktop と当該 WSL ディストリビューションの統合が無効。`opendolphin-server` / `opendolphin-server-modernized-dev` コンテナを起動できず、`http://localhost:{8080,9080}` も LISTEN していない。
2. `logs/send_parallel_request.log` には各ケースの `curl: (7)` エラーと `status=000` が記録済み。
3. HTTP/SQL/JMS ログは未生成のため `trace-{case}/legacy|modern/response.json` には空ファイルのみが存在する。

## 次アクション
1. Windows 側 Docker Desktop で対象 WSL ディストリビューションの統合を ON にし、`docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml up -d` で Legacy/Modernized を同時起動。
2. もしくは Linux/Mac の別環境で `compose` プロファイルを再実行し、8080/9080 が LISTEN している状態で本 RUN_ID の手順をやり直す（Topic: `TRACE_PROPAGATION_CHECK.md` §7）。
3. サーバー起動後に `docker logs <container> | rg traceId=` および `SessionOperationInterceptor` ERROR ログを収集し、`TRACE_PROPAGATION_CHECK.md` と `domain-transaction-parity.md` の Trace Harness 表を更新する。
