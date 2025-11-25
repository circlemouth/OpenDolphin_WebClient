# Legacy vs Modern diagnosis audit (RUN_ID=20251118TdiagnosisAuditZ2)

## 手順
1. Legacy/Modern Postgres へ `tmp/diagnosis_seed.sql` を流し込み、`F001/doctor1` のシード患者・診断・シーケンスをリセット（`docs/server-modernization/phase2/operations/LEGACY_MODERNIZED_CAPTURE_RUNBOOK.md` Gate 2.5 参照）。
2. helper ラッパーで `/karte/diagnosis/claim` を送信。RUN_ID を固定する場合は事前に `TRACE_RUN_ID=20251118TdiagnosisAuditZ2` を指定する。
   ```bash
   PARITY_HEADER_FILE=tmp/parity-headers/diagnosis_TEMPLATE.headers \
   PARITY_BODY_FILE=tmp/claim-tests/send_diagnosis_success.json \
   TRACE_RUN_ID=20251118TdiagnosisAuditZ2 \
     ops/tools/helper_send_parallel_request.sh \
       --helper-case messaging -- \
       --profile compose POST /karte/diagnosis/claim messaging_diagnosis
   ```
   - `TRACE_RUN_ID` を省略した場合は helper が UTC タイムスタンプで自動採番し、`artifacts/parity-manual/messaging/<RUN_ID>/` へ保存する。
3. `docker exec opendolphin-postgres{,-modernized}` 経由で `d_audit_event` を TraceId=`parity-diagnosis-send-20251118TdiagnosisAuditZ2` で抽出し、`logs/d_audit_event_diagnosis_{legacy,modern}.tsv` へ保存。

## 結果サマリ
- Legacy/Modern とも HTTP 200 (`response=9002xxx`)、ヘッダーの `X-Trace-Id` は `parity-diagnosis-send-20251118TdiagnosisAuditZ2` を維持。
- Legacy `d_audit_event` には `EHT_DIAGNOSIS_CREATE` が 2 行（再実行分を含む）追加され、`actor_id=1.3.6.1.4.1.9414.72.103:doctor1`, `patient_id=0000001` を記録。
- Modern `d_audit_event` にも同一 TraceId の `EHT_DIAGNOSIS_CREATE` が 1 行追加され、Legacy と同じ actor/patient 情報で監査が揃った。
- 証跡: `messaging_diagnosis/{legacy,modern}/` 配下に HTTP/headers/meta、`logs/` に `d_audit_event_diagnosis_{legacy,modern}.tsv` を配置。
- 既知: JMS キュー差分はゼロ（Legacy=直送、Modern=enqueue 対象外）。必要時は別途 `jboss-cli` で採取。
