# CLAIM_DIAGNOSIS_FIX 証跡サマリ

## 2025-11-09T201846Z 証跡（CLAIM/DIAGNOSIS/MML 再送）

### 再現条件
- `docker compose -f docker-compose.yml -f docker-compose.modernized.dev.yml up -d` で Legacy/Modernized/Postgres/MinIO/WebORCA を全起動（`docker ps` で全コンテナ healthy を確認）。
- ホストから `localhost:9080` へアクセスすると無応答となるため、`legacy-vs-modern_default` ネットワークに参加させたヘルパーコンテナから CLI を実行：
  ```bash
  docker run --rm \
    --network legacy-vs-modern_default \
    -v $PWD:/workspace -w /workspace \
    --entrypoint /bin/bash \
    opendolphin_webclient-server-modernized-dev:latest -lc '
      set -euo pipefail
      export BASE_URL_LEGACY=http://opendolphin-server:8080/openDolphin/resources
      export BASE_URL_MODERN=http://opendolphin-server-modernized-dev:8080/openDolphin/resources
      export PARITY_OUTPUT_DIR=artifacts/parity-manual
      PARITY_HEADER_FILE=tmp/claim-tests/claim.headers \
      PARITY_BODY_FILE=tmp/claim-tests/send_claim_success.json \
      ./ops/tools/send_parallel_request.sh PUT /20/adm/eht/sendClaim 20251109T201826Z_CLAIM
      PARITY_HEADER_FILE=tmp/claim-tests/diagnosis.headers \
      PARITY_BODY_FILE=tmp/claim-tests/send_diagnosis_success.json \
      ./ops/tools/send_parallel_request.sh POST /karte/diagnosis/claim 20251109T201827Z_DIAGNOSIS
      PARITY_HEADER_FILE=tmp/mml-tests/mml.headers \
      PARITY_BODY_FILE=tmp/mml-tests/send_mml_success.json \
      ./ops/tools/send_parallel_request.sh PUT /mml/send 20251109T201827Z_MML
    '
  ```
- 送信ヘッダー／ボディは `tmp/claim-tests/*.headers|*.json`, `tmp/mml-tests/*.headers|*.json` を使用。証跡を `artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/20251109T201846Z/` に集約。

### 期待応答
1. `PUT /20/adm/eht/sendClaim` : Legacy=403（従来動作）、Modernized=200 + JMS `dolphinQueue` enqueue, `MessageSender` が ORCA HTTP を同期実行、DLQ へ落ちないこと。
2. `POST /karte/diagnosis/claim` : Legacy=403、Modernized=200、`d_diagnosis` に追記、JMS 送信時も Velocity テンプレートが解決されること。
3. `PUT /mml/send` : Legacy=403、Modernized=200、`MmlSenderBean` が SHIFT_JIS で XML を生成し、preview/payload 情報をレスポンスへ返すこと。
4. 監査・JMS・DB 証跡を README から辿れる位置に保存し、DLQ が 0 件であることを CLI で確認。

### 実測応答
| シナリオ | Legacy HTTP | Modern HTTP | JMS/ログ | 備考 |
| --- | --- | --- | --- | --- |
| Claim (`20251109T201826Z_CLAIM`) | 403（認証ミスマッチ） | 200（0.81s） | `Claim message enqueued... traceId=6be55d49...` → `MessageSender` が処理完了、DLQ 0 件（`logs/jms_dolphinQueue_read-resource.txt`） | レスポンスボディは NUL（`claim_send/modern/response.json`）。WildFly ログ: `logs/docker_logs_opendolphin-server-modernized-dev.txt:245-255` |
| Diagnosis (`20251109T201827Z_DIAGNOSIS`) | 403 | 200（0.05s） | `MessageSender` が `diseaseHelper.vm` を探せず `ResourceNotFoundException`。DLQ に 1 件滞留（`logs/jms_DLQ_list-messages.txt` traceId=62f8aa37...）。DB は ID=1 のみ（`db/d_diagnosis_tail.txt`） | 今回新規行は作成されず、HTTP 200 でもバックグラウンド送信が失敗。|
| MML (`20251109T201827Z_MML`) | 403 | 200（0.12s） | レスポンスに `payload` / `sha256` / `byteLength=10040` を返却し、WildFly ログにも MML XML を出力（`logs/docker_logs_opendolphin-server-modernized-dev.txt:258-394`）。DLQ 影響なし。|

取得ログ類:
- `logs/docker_logs_opendolphin-server-modernized-dev.txt`（直近 10 分分、Micrometer OTLP WARN 含む）
- `logs/docker_logs_opendolphin-server.txt`（Legacy 側 403 のみ）
- JMS ランタイム: `logs/jms_dolphinQueue_read-resource.txt`, `logs/jms_DLQ_read-resource.txt`, `logs/jms_DLQ_list-messages.txt`
- DB スナップショット: `db/d_diagnosis_tail.txt`

### 残課題（2025-11-09T231845Z 時点）
1. **`d_diagnosis_seq` の補正**: 23:18Z リトライでは ID=-47 が追加されており、シーケンス初期値が負方向にずれている。`d_diagnosis_seq` の `setval` と既存データの整合確認が必要。
2. **レスポンス仕様の明文化**: `/karte/diagnosis/claim` は空 JSON を返すため、フロントエンドが成功可否を判別できる項目（traceId/登録件数/queued flag 等）を定義する。
3. **Legacy 403 の原因解消**: 403 (Basic 認証 or ヘッダー不一致) の切り分けを進め、成功パターンのヘッダーセットを README に追記する。
4. **host→9080 フォールバック**: 今回はホスト直接で通信できたが、疎通断が再発した場合に備えてヘルパーコンテナ経路（`docker run --network legacy-vs-modern_default ...`）と `socat` などのポート再公開案を Runbook/README 双方へ残す。

## 2025-11-09T231845Z 証跡（Diagnosis テンプレ復旧）

### 再現条件
- `client/src/main/java/open/dolphin/resources/templates/diseaseHelper.vm` → `server-modernized/src/main/resources/diseaseHelper.vm` をコピーし、`mvn -f pom.server-modernized.xml -pl server-modernized -am package -DskipTests` を再実行（ログ: `maven/mvn_server-modernized_package.log`）。
- `COMPOSE_FILE=docker-compose.yml:ops/base/docker-compose.yml:docker-compose.modernized.dev.yml docker compose build server-modernized-dev` → `./scripts/start_legacy_modernized.sh start` で Legacy/Modernized を再デプロイ。
- `PARITY_HEADER_FILE=tmp/claim-tests/diagnosis.headers`、`PARITY_BODY_FILE=tmp/claim-tests/send_diagnosis_success.json`、`PARITY_OUTPUT_DIR=.../diagnosis_claim` を設定し、`./ops/tools/send_parallel_request.sh --profile compose POST /karte/diagnosis/claim 20251109T231900Z_DIAGNOSIS` をホストから実行（ヘルパー経路は fallback として残す）。

### 実測要点
- Legacy=403 / Modernized=200（0.238s）。レスポンスボディは空 JSON（従来どおり）。
- `logs/jms_dolphinQueue_read-resource.txt`: `messages-added=1L`, `message-count=0L`, `delivering-count=0`。`logs/jms_DLQ_list-messages.txt`: `[]`（DLQ 0 件）。
- `db/d_diagnosis_tail.txt`: 既存 ID=1 に加えて ID=-47 を INSERT（`karte_id=2001`、`diagnosiscode=J00`）。
- `logs/docker_logs_opendolphin-server-modernized-dev.txt:349`: `MessageSender Processing Diagnosis JMS message [traceId=...]` を確認。例外ログなし。

### DLQ / DB ステータス表
| タイムスタンプ | JMS `dolphinQueue` | DLQ | `d_diagnosis` tail | 証跡パス |
| --- | --- | --- | --- | --- |
| 2025-11-09T20:18:46Z | `messages-added=2`, `message-count=0` | `list-messages` に traceId=62f8aa37… 1 件 | ID=1 のみ | `artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/20251109T201846Z/{logs,db}/` |
| 2025-11-09T23:18:45Z | `messages-added=1`, `message-count=0` | 空配列（0 件） | ID=1, -47 | `artifacts/parity-manual/CLAIM_DIAGNOSIS_FIX/20251109T231845Z/{logs,db}/` |
