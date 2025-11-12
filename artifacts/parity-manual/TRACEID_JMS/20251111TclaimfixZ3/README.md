# RUN_ID=20251111TclaimfixZ3 Claim/JMS 完了サマリ

## TL;DR
- Legacy 側にも `/20/adm/eht/sendClaim` を移植し（`server/src/main/java/open/dolphin/adm20/rest/EHTResource.java`）、Modernized と同じ JMS ルートで 200/200 を取得。
- `ops/db/local-baseline/reset_d_audit_event_seq_batch.sql`（公式保存先は `ops/db/local-baseline/`）を両 DB に流し、`audit_event_{backup.csv,status_log.txt,validation_log.txt}` を本ディレクトリの `../db/20251111TclaimfixZ3/` へ保管。
- HTTP 実行は helper コンテナ（`mcr.microsoft.com/devcontainers/base:jammy`）から `--network legacy-vs-modern_default` で実行し、ホスト↔9080 が復旧するまでは helper 運用を継続。
- ヘッダー／BODY テンプレは `tmp/claim-tests/claim_20251111TclaimfixZ3.headers` と `tmp/claim-tests/send_claim_success_20251111TclaimfixZ3.json` を固定化。RUN 差し替え時は `claim_TEMPLATE.headers` & `send_claim_success.json` を複製して `X-Trace-Id: trace-jms-<RUN_ID>` を入れ替える。

## 実行コマンド（helper コンテナ内）
```bash
PARITY_HEADER_FILE=tmp/claim-tests/claim_20251111TclaimfixZ3.headers \
PARITY_BODY_FILE=tmp/claim-tests/send_claim_success_20251111TclaimfixZ3.json \
PARITY_OUTPUT_DIR=artifacts/parity-manual/TRACEID_JMS/20251111TclaimfixZ3/claim_send \
TRACE_RUN_ID=20251111TclaimfixZ3 \
BASE_URL_LEGACY=http://opendolphin-server:8080/openDolphin/resources \
BASE_URL_MODERN=http://opendolphin-server-modernized-dev:8080/openDolphin/resources \
ops/tools/send_parallel_request.sh --profile modernized-dev PUT /20/adm/eht/sendClaim claim_send
```
`claim_send/http/{legacy,modern}/` に HTTP／ヘッダー／meta を保存し、`logs/` には CLI ログと `d_audit_event_claim.tsv`・`jms_dolphinQueue_read-resource*.txt` を配置済み。

## d_audit_event_claim TraceId 差分
`RUN_ID=20251111TclaimfixZ3` を基準に `scripts/diff_d_audit_event_claim.sh` で差分を確認できる。
```bash
scripts/diff_d_audit_event_claim.sh 20251111TclaimfixZ3 20251111TclaimfixZ2
```
抜粋:
- `20251111TclaimfixZ3` のみ: `27820f29-af7c-4083-9130-29e102ebcd97`, `2fcfe584-77b4-4ae3-8da4-cd06a7022c8d`, `a8ccd2d4-1467-4a52-9686-e4e58a435e6e`, `cf82f816-c25d-46e7-93d8-9d40419463fc`, `f0cc8ab4-a172-40a7-871a-5493b65e9888`（すべて `EHT_CLAIM_SEND`）。
- 共通: `8c93e452-918d-407b-8216-cc7ca67b9d80`, `c8f23d04-7401-4a56-bb99-9b8485de4845`。
- `20251111TclaimfixZ2` のみ: なし。

差分無しであれば Claim JMS の再発なしと判断し、差分があれば `tmp/claim-tests/` のヘッダー／BODY を再生成して RUN をやり直す。
