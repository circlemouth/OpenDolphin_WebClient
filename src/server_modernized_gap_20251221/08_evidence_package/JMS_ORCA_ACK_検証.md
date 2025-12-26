# JMS ORCA ACK 検証（WildFly 33）

RUN_ID: 20251226T121342Z

## 1. 実行環境
- WildFly: `opendolphin-server-modernized-dev`（起動済みのため再起動なし）
- DB: `opendolphin-postgres-modernized`
- 対象 API: `PUT /20/adm/eht/sendClaim`

## 2. 実行概要
1. `sendClaim` を実行し、JMS enqueue → MDB（MessageSender）処理を確認。
2. JMS メトリクス（`dolphinQueue`）の `messages-added` と `message-count` を前後で取得。
3. 監査イベント `EHT_CLAIM_SEND` を `d_audit_event` から取得。
4. ORCA ACK 受信はローカル ACK スタブ（TCP 18080）で代替し、`dolphin.claim` ロガーの `ACK:` を確認。

## 3. 結果サマリ
- JMS:
  - `messages-added` が 719 → 720 → 721 に増加（2回送信）。
  - `message-count` は 0L 維持（即時ドレイン）。
- 監査イベント:
  - `EHT_CLAIM_SEND` が `trace_id=trace-jms-20251226T121342Z-ack` で記録。
- ORCA ACK:
  - `dolphin.claim` ログに `ACK:` を確認。
  - ACK は **ローカル ACK スタブ**による受信（実 ORCA ではない）。

## 4. 証跡
- HTTP
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/http/sendClaim_ack_headers.txt`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/http/sendClaim_ack_request.headers`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/http/sendClaim_ack_request.json`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/http/sendClaim_ack_response.bin`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/http/sendClaim_ack_response.hex`
- JMS メトリクス
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/logs/jms_dolphinQueue_before.txt`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/logs/jms_dolphinQueue_after.txt`
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/logs/jms_dolphinQueue_after_ack.txt`
- 監査ログ
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/logs/d_audit_event_trace_20251226T121342Z_ack.csv`
- サーバーログ（ACK 受信）
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/logs/server_modernized_dev_ack.log`
- ACK スタブログ
  - `artifacts/parity-manual/JMS_ORCA_ACK/20251226T121342Z/logs/orca_ack_stub.log`

## 5. 補足（実 ORCA との差分）
- 本 RUN は **ローカル ACK スタブ**で ACK を返却。
- 実 ORCA での ACK 実測を行う場合は、`claim.host` / `claim.send.port` が実 ORCA に到達する構成で再実行すること。
