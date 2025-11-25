# Legacy diagnosis parity (RUN_ID=20251118TdiagnosisLegacyZ1)

## 手順
1. `docker exec opendolphin-postgres psql -U opendolphin -d opendolphin < tmp/diagnosis_seed.sql`
   - 監査採取や再実行のたびに必ず流し直し、`d_patient` / `d_karte` / `d_diagnosis` のシード状態を最新にしてから CLI を叩く（TraceId ごとの `d_audit_event` 比較を安定化させるため）。
2. `docker exec opendolphin-server /opt/jboss/wildfly/bin/jboss-cli.sh --connect --commands="/subsystem=logging/logger=dolphin.claim:add(level=INFO)"`
3. `docker run --rm --network legacy-vs-modern_default -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/base:jammy bash -lc 'set -euo pipefail; export TRACE_RUN_ID=20251118TdiagnosisLegacyZ1; export PARITY_HEADER_FILE=tmp/parity-headers/diagnosis_TEMPLATE.headers; export PARITY_BODY_FILE=tmp/claim-tests/send_diagnosis_success.json; export PARITY_OUTPUT_DIR=artifacts/parity-manual/messaging/20251118TdiagnosisLegacyZ1; ops/tools/send_parallel_request.sh --profile modernized-dev POST /karte/diagnosis/claim messaging_diagnosis'`
4. JMS before/after と `d_audit_event` CSV を取得（`logs/jms_dolphinQueue_read-resource*.txt`, `logs/d_audit_event_diagnosis_{legacy,modern}.tsv`）。

## 結果サマリ
- Legacy HTTP 200, レスポンス `9002004`; Modern HTTP 200。
- Legacy JMS `messages-added=0L→0L` (server direct send)、Modern JMS `5L→6L`。
- `opendolphin.d_diagnosis` に `id=9002004` が追加（seed `9001001` + API `9002004`）。
- `d_audit_event` は traceId=`parity-diagnosis-send-20251118TdiagnosisLegacyZ1` で両環境とも 0 行（TODO）。
- ログ: `logs/legacy_server.log` / `logs/modern_server.log`、`logs/send_parallel_request.log` に概要を記載。

## 既知のギャップ
- Legacy 診断監査 (`EHT_DIAGNOSIS_*`) 未実装 → TSV がヘッダーのみ。
- Legacy JMS を利用しない API 仕様のため `messages-added` は常に 0。必要であれば future work として監視対象外とする。EOF
