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

### 残課題
1. **Diagnosis テンプレート不足**: `MessageSender` が `diseaseHelper.vm` を見つけられず DLQ 行き。`logs/docker_logs_opendolphin-server-modernized-dev.txt:504` 参照。テンプレ配置と Velocity path の再確認が必要。
2. **Legacy ベースライン**: 403 の理由（ヘッダー照合 or Basic 認証）を `CLAIM_DIAGNOSIS_FIX` から切り出して別タスクで調査する必要あり。
3. **DB 反映**: `d_diagnosis` に新規行が作成されていないため、API 実装かテストデータの不備を追う（`db/d_diagnosis_tail.txt` に変化無し）。
4. **host→9080 の疎通不可**: 今回はネットワーク内ヘルパーで迂回。恒久的にアクセスできるよう `docker run --rm -p 19080:9080 ...` 等のプロキシを検討。
