# RUN_ID `20251114TorcaInpatientMatrixZ1`

- **目的:** `orca-api-matrix` No.19-38 の XML テンプレ（`docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/19-38_*.xml`）を WebORCA 本番（`https://weborca.cloud.orcamo.jp:443`）へ送信し、病棟/食事/ADL/会計系 API の HTTP 証跡を収集する。
- **状態:** 実行前にクライアント証明書 `ORCAcertification/103867__JP_u00001294_client3948.p12` のパスフレーズが取得できず、`openssl pkcs12 -in ... -passin pass:` で `Mac verify error: invalid password?` となったため、`curl --cert-type P12` を開始できなかった。
- **影響:** request/response/headers/trace のいずれも未取得。`artifacts/orca-connectivity/20251114TorcaInpatientMatrixZ1/inpatient/` 以下に保存する予定の `19_hsconfbasev2/` 〜 `38_hsacctmodv2/` ディレクトリは未作成。
- **次アクション:** ORCA サポートまたは管理担当から PKCS#12 パスフレーズを受領し、`export ORCA_PROD_CERT_PASS=<passphrase>` を設定してから §4.4 の `curl --cert-type P12` フローを再開する。再開時は `notes/orca-api-field-validation.md` §3 と `ORCA_API_STATUS.md` §2.3 に `Api_Result=00` の結果を反映する。
