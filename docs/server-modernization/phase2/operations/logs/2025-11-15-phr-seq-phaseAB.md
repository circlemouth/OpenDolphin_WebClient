# 2025-11-15 PHR Phase-A/B 実測ログ（RUN_ID=20251115TorcaPHRSeqZ1）
- 対応タスク: 【ワーカー指示】Task-D「PHR Phase-A/B 実測証跡取得」
- 参照: `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md`（Phase-A/B）、`docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2、`artifacts/orca-connectivity/TEMPLATE/phr-seq/README.md`
- 実施者: Codex（環境: WSL, `ORCA_PROD_CERT`=103867__JP_u00001294_client3948.p12）

## 1. 実施サマリ
| 項目 | 内容 |
| --- | --- |
| RUN_ID | `20251115TorcaPHRSeqZ1`
| 対象 API | Phase-A: PHR-02/03/10、Phase-B: PHR-01/04/05/08/09
| 実行方法 | `scripts/orca_prepare_next_run.sh` → テンプレ展開 → PHR-xx request ファイルを設置 → curl（`--cert-type P12`）を順次実行し `httpdump/`, `trace/`, `logs/` へ保存
| 結果 | 1回目: 8 API すべて `curl exit=58 (PKCS12)`。2回目（Pass=`FJjmq/d7EP`）: TLS 相互認証は成功したが `/20/adm/phr/*` が WebORCA には存在しないため全 API HTTP 404（JSON/HTML）。`trace/` には両試行のログを保存。
| ServerInfoResource | `curl http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn -u LOCAL.FACILITY.0001:dolphin` が `Could not resolve host`。`serverinfo/claim_conn.error` に記録。
| WildFly log | `server/standalone/log/server.log` が存在せず、`wildfly/phr_20251115TorcaPHRSeqZ1.log` に未取得である旨を記録。

## 2. API 別結果
| API | Phase | 期待（PHR_RESTEASY_PLAN） | 実測 | 証跡 |
| --- | --- | --- | --- | --- |
| PHR-02 `PUT /20/adm/phr/accessKey` | Phase-A | Flyway 済み accessKey upsert, `PHR_ACCESS_KEY_UPSERT` 監査 | (A) curl exit=58 → (B) HTTP 404 HTML (“The specified URL cannot be found.”)。 | `artifacts/orca-connectivity/20251115TorcaPHRSeqZ1/httpdump/phr02_accessKey/`, `phr-seq/10_key-management/PHR-02_{request,response}.http` |
| PHR-03 `GET /.../accessKey/{key}` | Phase-A | suffix マスク＋Facility 403 | (A) exit=58 → (B) HTTP 404 JSON `{"Code":404,...}`。 | `.../httpdump/phr03_accessKey_lookup/`, `trace/phr03_accessKey_lookup_trace.log` |
| PHR-10 `GET /.../patient/{patientId}` | Phase-A | 患者→鍵逆引き 200/404 | (A) exit=58 → (B) HTTP 404 JSON。 | `.../httpdump/phr10_patient/`, `trace/phr10_patient_trace.log` |
| PHR-01 `GET /abnormal/{patientId}` | Phase-B | UTF-8 テキスト＋`docSince` フィルタ | (A) exit=58 → (B) HTTP 404 JSON。 | `.../httpdump/phr01_abnormal/`, `trace/phr01_abnormal_trace.log` |
| PHR-04 `GET /allergy/{patientId}` | Phase-B | `PHR_ALLERGY_TEXT` 監査 | (A) exit=58 → (B) HTTP 404 JSON。 | `.../httpdump/phr04_allergy/`, `trace/phr04_allergy_trace.log` |
| PHR-05 `GET /disease/{patientId}` | Phase-B | 傷病テキスト | (A) exit=58 → (B) HTTP 404 JSON。 | `.../httpdump/phr05_disease/`, `trace/phr05_disease_trace.log` |
| PHR-08 `GET /labtest/{patientId}` | Phase-B | `labSince` Query 検証、`logs/phr_labtest_summary.md` で件数記録 | (A) exit=58 → (B) HTTP 404 JSON。 | `.../httpdump/phr08_labtest/`, `trace/phr08_labtest_trace.log` |
| PHR-09 `GET /medication/{patientId}` | Phase-B | `TouchMedicationFormatter` 置換結果をテキストで確認 | (A) exit=58 → (B) HTTP 404 JSON。 | `.../httpdump/phr09_medication/`, `trace/phr09_medication_trace.log` |

> 補足: `trace/*.log` には `Host resolved → Connected → could not parse PKCS12 file` までの LibreSSL ログが記録されており、DNS/443 までは疎通できていることが確認できる。
> `httpdump/<api>/status.txt` / `error.log` を残し、Attempt A (exit=58) と Attempt B (HTTP 404) の差分を記録。`screenshots/phr-0X_*_placeholder.png` は 1x1 PNG のまま（ORCA 直叩きでは UI なしのため）。Modernized REST 経由での実応答取得後に置き換える。

## 3. Blockers / TODO
1. **PKCS#12 パスフレーズ**: `FJjmq/d7EP` を Ops から受領し、`openssl pkcs12 ... -provider legacy` で復号できることを確認済。以後は同 pass を使用。
2. **Modernized Server 未起動**: `server-modernized-dev` が解決できず `serverinfo/claim_conn.json` が空。Compose 起動後に再取得する。
3. **スクリーンショット欠落 / HTTP 404**: WebORCA には `/20/adm/phr/*` が存在しないため、Phase-A/B の期待応答を得るには Modernized REST (WildFly) への接続が必要。`screenshots/` は placeholder のまま。

## 4. 次アクション
1. Modernized サーバーを compose で起動し、`curl http://server-modernized-dev:8080/openDolphin/resources/20/adm/phr/...` で Phase-A/B を再実測。必要に応じて VPN/localhost で 9080 ポートを確保。
2. `serverinfo/claim_conn.json` と `wildfly/phr_RUN.log` を取得して Evidence を更新、`docs/.../2025-11-13-orca-connectivity.md` の表を Modernized 経路向けの結果に差し替える。
3. `logs/phr_access_key.log` / `logs/phr_labtest_summary.md` / `screenshots/phr-0X_response.png` を Modernized 応答に基づき更新し、監査 SQL (`audit/phr_audit_extract.sql`) を実行して `PHR_ACCESS_KEY_*` / `PHR_*_TEXT` を確認する。

## 5. 参照リンク
- Evidence root: `artifacts/orca-connectivity/20251115TorcaPHRSeqZ1/`
- Runbook: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md#4.3.2`
- 実装計画: `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md`
