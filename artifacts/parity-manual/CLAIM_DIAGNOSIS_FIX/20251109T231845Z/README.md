# 2025-11-09T231845Z Diagnosis Template 再確認

## 条件
- `client/src/.../diseaseHelper.vm` を `server-modernized/src/main/resources/` へコピーし、`mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests` の生成物を WildFly 33 イメージへ再組み込み済み。
- `docker compose build`（`docker-compose.yml:ops/base/docker-compose.yml:docker-compose.modernized.dev.yml`）→ `./scripts/start_legacy_modernized.sh start` で Legacy/Modernized 併走環境をリビルド。
- `PARITY_HEADER_FILE=tmp/claim-tests/diagnosis.headers`, `PARITY_BODY_FILE=tmp/claim-tests/send_diagnosis_success.json`, `PARITY_OUTPUT_DIR=.../diagnosis_claim` として `./ops/tools/send_parallel_request.sh --profile compose POST /karte/diagnosis/claim 20251109T231900Z_DIAGNOSIS` を実行。

## 期待
1. Modernized 側が 2xx を返し、`MessageSender` が `diseaseHelper.vm` を解決したうえで JMS→ORCA 送信し、DLQ へ落ちないこと。
2. `d_diagnosis` に新規行が追加され、`logs/jms_dolphinQueue_read-resource.txt` で `messages-added` が増分すること。
3. HTTP/JMS/DB/コンテナログを `artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/20251109T231845Z/` 以下に保存すること。

## 実測
- Legacy=403、Modernized=200（0.238s、`diagnosis_claim/20251109T231900Z_DIAGNOSIS/modern/meta.json`）。HTTP 200 のままバックエンド処理も完遂。
- `logs/jms_dolphinQueue_read-resource.txt` : `messages-added=1L`, `message-count=0L`, `delivering-count=0`。`logs/jms_DLQ_list-messages.txt` は空配列で DLQ 流入なし。
- `db/d_diagnosis_tail.txt` : 既存 ID=1 に加えて ID=-47 が INSERT され、`karte_id=2001` 行が 2 件になった（シーケンス初期化の影響で負値だが、固定データ投入の副作用として許容範囲内）。
- `logs/docker_logs_opendolphin-server-modernized-dev.txt` 225-280 行付近に `MessageSender Processing DIAGNOSIS JMS message`→`Diagnosis XML generated (traceId=...)` の INFO を確認。例外ログなし。

## 残課題
1. `d_diagnosis.id` が負値のまま増分するため、`d_diagnosis_seq` の現在値を `db/d_diagnosis_tail.txt` を基準に見直す（DB マイグレーション側タスク）。
2. `/karte/diagnosis/claim` のレスポンスボディは依然空レスであり、呼び出し側で結果判定が困難。UI 実装に入る前に戻り値の仕様化が必要。
3. Host→9080 の疎通は回復しているが、恒常的に再現する場合に備えてヘルパーコンテナ経路の Runbook を README に維持する。
