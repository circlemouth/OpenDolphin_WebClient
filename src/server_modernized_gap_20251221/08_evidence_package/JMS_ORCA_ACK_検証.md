# JMS ORCA ACK 検証（WildFly 33）

RUN_ID: 20251227T063523Z

## 1. 実行環境
- WildFly: `opendolphin-server-modernized-dev`（実 ORCA 切替のため再起動あり / HTTP=localhost:9080）
- DB: `opendolphin-postgres-modernized`
- 対象 API: `PUT /20/adm/eht/sendClaim`

## 2. 実行概要
1. `sendClaim` を実行し、JMS enqueue → MDB（MessageSender）処理を確認。
2. JMS メトリクス（`dolphinQueue`）の `messages-added` と `message-count` を前後で取得。
3. 監査イベント `EHT_CLAIM_SEND` を `d_audit_event` から取得。
4. ORCA ACK 受信は実 ORCA（`claim.host=weborca.cloud.orcamo.jp`, `claim.send.port=443`, `claim.scheme=https`）で実測し、`CLAIM_SUCCESS` ログを確認。

## 3. 結果サマリ
- JMS:
  - `messages-added` が 0 → 1 に増加（+1）。
  - `message-count` は 0L 維持（即時ドレイン）。
- 監査イベント:
  - `EHT_CLAIM_SEND` が `trace_id=trace-jms-20251227T063523Z-ack1` で記録。
- ORCA ACK:
  - `open.dolphin.audit.external` の `CLAIM_SUCCESS` を確認。
  - ACK は **実 ORCA**での受信。

## 4. 証跡
- HTTP
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/http/sendClaim_ack_headers.txt`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/http/sendClaim_ack_request.headers`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/http/sendClaim_ack_request.json`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/http/sendClaim_ack_response.bin`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/http/sendClaim_ack_response.hex`
- JMS メトリクス
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/logs/jms_dolphinQueue_before.txt`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/logs/jms_dolphinQueue_after.txt`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/logs/jms_dolphinQueue_after_ack.txt`
- 監査ログ
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/logs/d_audit_event_trace_20251227T063523Z_ack.csv`
- サーバーログ（ACK 受信）
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251227T063523Z/logs/server_modernized_dev_ack.log`
  - `artifacts/orca-connectivity/20251227T063523Z/notes/claim_settings.txt`

## 5. 補足
- 実 ORCA 接続で ACK を実測済み。

## 6. 実 ORCA 実測の進捗
- `ORCAcertification/103867__JP_u00001294_client3948.p12` と `ORCAcertification/新規 テキスト ドキュメント.txt` の値を参照し、`claim.host` / `claim.send.port` / `claim.scheme` を実 ORCA に切替済み。
- ORCA 実測の設定証跡は `artifacts/orca-connectivity/20251227T063523Z/notes/claim_settings.txt` に保存。
