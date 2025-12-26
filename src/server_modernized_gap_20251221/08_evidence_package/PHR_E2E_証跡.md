# PHR E2E 証跡パッケージ
- 期間: 2026-01-09 09:00 - 2026-01-11 09:00 / 優先度: medium / 緊急度: medium
- RUN_ID: 20251226T060944Z
- YAML ID: `src/server_modernized_gap_20251221/08_evidence_package/PHR_E2E_証跡.md`

## 目的
- PHR-01〜11 と export 系 API の実測証跡を最終段階で一括取得する。
- ORCA certification 環境との差異（HTTP ステータス / 監査 / レスポンス差分）を記録する。

## 対象 API（PHR-01〜11）
- PHR-01: `GET /20/adm/phr/abnormal/{patientId}`
- PHR-02: `PUT /20/adm/phr/accessKey`
- PHR-03: `GET /20/adm/phr/accessKey/{accessKey}`
- PHR-04: `GET /20/adm/phr/allergy/{patientId}`
- PHR-05: `GET /20/adm/phr/disease/{patientId}`
- PHR-06: `POST /20/adm/phr/identityToken`
- PHR-07: `GET /20/adm/phr/image/{patientId}`
- PHR-08: `GET /20/adm/phr/labtest/{patientId}`
- PHR-09: `GET /20/adm/phr/medication/{patientId}`
- PHR-10: `GET /20/adm/phr/patient/{patientId}`
- PHR-11: `GET /20/adm/phr/{facilityId,patientId,docSince,labSince}`

## 対象 API（Export 系）
- `/20/adm/phr/export*` 系 API（ジョブ実行 / 署名 URL 発行 / 成果物取得）
- 詳細は `src/server_modernized_gap_20251221/03_phr/PHR_Export_ジョブ_署名URL.md` を参照。

## 実測ステータス
- **実施済み（2025-12-26）**: ORCA certification 環境と Modernized ローカル環境で実測を実施。

## 外部依存の証跡
- 参照元: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`
  - Legacy 文書だが ORCA certification 接続の現行ソースとして扱う。
  - 接続先 URL / Basic 認証 / クライアント証明書はマスク済みで記録する。

## 実施手順（E2E 実測）
1. 起動準備: `WEB_CLIENT_MODE=npm ./setup-modernized-env.sh`
2. PHR-01〜11 を順次実行し、HTTP ステータスとレスポンスを保存。
3. Export 系 API を順次実行し、ジョブ / 署名 URL / 取得の監査を保存。
4. ORCA certification 環境でも同一手順を実施し、差分を記録する。
5. 証跡テンプレートに追記し、マスク済みログを保存する。

## Evidence 記録（実測結果）
- 実施日時: `2025-12-26 15:23:00 JST`
- 実施者: `Codex`
- RUN_ID: `20251226T060944Z`
- 接続先: ORCA certification `https://weborca.cloud.orcamo.jp:443` / Modernized `http://localhost:9080/openDolphin/resources`
- 認証: `<MASKED_BASIC>` / `<MASKED_CLIENT_CERT>`
- DNS 証跡: `artifacts/orca-connectivity/20251226T060944Z/logs/dns_orca_20251226T060944Z.txt`
- TLS 証跡: `artifacts/orca-connectivity/20251226T060944Z/logs/tls_orca_20251226T060944Z.txt`
- Feature Flag / Env:
  - Modernized: `X-Trace-Id` / `X-Request-Id` / `X-Facility-Id` を付与
  - ORCA: `X-Touch-TraceId` / `X-Facility-Id` を付与
- Request/Response（マスク済み）:
  - ORCA:
    - PHR-01 `/20/adm/phr/abnormal/WEB1001?docSince=2025-05-01`: `404`（`artifacts/orca-connectivity/20251226T060944Z/httpdump/orca/phr01_abnormal/`）
    - PHR-02 `/20/adm/phr/accessKey`: `404`（`.../httpdump/orca/phr02_accessKey/`）
    - PHR-03 `/20/adm/phr/accessKey/PHR-WEB1001-20251226`: `404`（`.../httpdump/orca/phr03_accessKey_lookup/`）
    - PHR-04 `/20/adm/phr/allergy/WEB1001`: `404`（`.../httpdump/orca/phr04_allergy/`）
    - PHR-05 `/20/adm/phr/disease/WEB1001`: `404`（`.../httpdump/orca/phr05_disease/`）
    - PHR-06 `/20/adm/phr/identityToken`: `405`（`.../httpdump/orca/phr06_identityToken/`）
    - PHR-07 `/20/adm/phr/image/00000001`: `404`（`.../httpdump/orca/phr07_image/`）
    - PHR-08 `/20/adm/phr/labtest/WEB1001?labSince=2025-05-01`: `404`（`.../httpdump/orca/phr08_labtest/`）
    - PHR-09 `/20/adm/phr/medication/WEB1001?docSince=2025-05-01`: `404`（`.../httpdump/orca/phr09_medication/`）
    - PHR-10 `/20/adm/phr/patient/WEB1001`: `404`（`.../httpdump/orca/phr10_patient/`）
    - PHR-11 `/20/adm/phr/LOCAL.FACILITY.0001,00000001,20250101,20250101`: `404`（`.../httpdump/orca/phr11_container/`）
    - Export `/20/adm/phr/export`: `405`（`.../httpdump/orca/phr_export/`）
  - Modernized:
    - PHR-01 `/20/adm/phr/abnormal/0000001?docSince=2025-05-01`: `200`（`.../httpdump/modern/phr01_abnormal/`）
    - PHR-02 `/20/adm/phr/accessKey`: `500`（`.../httpdump/modern/phr02_accessKey/`）
    - PHR-03 `/20/adm/phr/accessKey/PHR-0000001-20251226`: `404`（`.../httpdump/modern/phr03_accessKey_lookup/`）
    - PHR-04 `/20/adm/phr/allergy/0000001`: `500`（`.../httpdump/modern/phr04_allergy/`）
    - PHR-05 `/20/adm/phr/disease/0000001`: `500`（`.../httpdump/modern/phr05_disease/`）
    - PHR-06 `/20/adm/phr/identityToken`: `503`（`.../httpdump/modern/phr06_identityToken/`）
    - PHR-07 `/20/adm/phr/image/0000001`: `500`（`.../httpdump/modern/phr07_image/`）
    - PHR-08 `/20/adm/phr/labtest/0000001?labSince=2025-05-01`: `200`（`.../httpdump/modern/phr08_labtest/`）
    - PHR-09 `/20/adm/phr/medication/0000001?docSince=2025-05-01`: `500`（`.../httpdump/modern/phr09_medication/`）
    - PHR-10 `/20/adm/phr/patient/0000001`: `404`（`.../httpdump/modern/phr10_patient/`）
    - PHR-11 `/20/adm/phr/LOCAL.FACILITY.0001,0000001,20250101,20250101`: `500`（`.../httpdump/modern/phr11_container/`）
    - Export `/20/adm/phr/export`: `500`（`.../httpdump/modern/phr_export/`）
- 監査ログ（マスク済み）:
  - Modernized `wildfly/phr_20251226T060944Z.log` に `PHR_LABTEST_ABNORMAL_TEXT` / `PHR_LABTEST_TEXT` の SUCCESS と、`PHR_ACCESS_KEY_*` / `PHR_ALLERGY_TEXT` / `PHR_DISEASE_TEXT` / `PHR_IMAGE_FETCH` / `PHR_MEDICATION_TEXT` / `PHR_CONTAINER_FETCH` / `PHR_EXPORT_REQUEST` の FAILURE を記録。

## ORCA certification 環境との差分記録
- PHR-01〜11 の HTTP ステータス差分:
  - ORCA は 404/405（未開放）で一律終了。Modernized は PHR-01/08 が 200、その他は 404/500/503。
- Export 系の署名 URL / 取得差分:
  - ORCA: `/export` は 405。
  - Modernized: `/export` は 500（Session layer failure、`wildfly/phr_20251226T060944Z.log`）。
- 監査イベント差分:
  - Modernized 側のみ `PHR_LABTEST_ABNORMAL_TEXT` / `PHR_LABTEST_TEXT` が SUCCESS で記録。
- レスポンス本文の差分（マスク済み）:
  - ORCA: Not Found / Method Not Allowed 応答。
  - Modernized: `error.phr.internal` / `error.phr.identityTokenUnavailable` の JSON エラー。

## 次アクション
1. Modernized 側の Session layer failure（`AMD20_PHRServiceBean#getKarte`）の原因調査と再実測。
2. PHR-02/03/10（AccessKey）と Export（`PHR_EXPORT_*`）の正常系証跡を取得。

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_E2E_証跡.md`
- `src/server_modernized_gap_20251221/03_phr/PHR_Export_ジョブ_署名URL.md`
- `docs/DEVELOPMENT_STATUS.md`
