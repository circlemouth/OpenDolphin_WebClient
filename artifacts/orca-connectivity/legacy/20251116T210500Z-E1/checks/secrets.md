# Secrets / Layer ID チェック
- `.env.modernized` (RUN_ID=`20251121TrialPHRSeqZ1-CTX`) に `PHR_EXPORT_SIGNING_SECRET=dev-phr-signing-secret-20251121TrialPHRSeqZ1-CTX` を記録。`FACTOR2_AES_KEY_B64` / `FIDO2_*` も設定済。
- `ops/check-secrets.sh` の必須パラメータに基づき、以下の確認を実施（手動レビュー）。
  1. `PHR_EXPORT_SIGNING_SECRET`: 32 文字以上、dev 用固定プレースホルダー。→ 形式 OK。
  2. Layer ID (`PHR_LAYER_ID_*`) は Vault 管理のため `.env` には入っていない。Trial/ORMaster 実測前に `ops/check-secrets.sh --profile phr-export` 実行結果を `artifacts/orca-connectivity/20251116T210500Z-E1/checks/secrets.log` へ追記予定。
  3. `PHR_EXPORT_STORAGE_TYPE`: docker-compose のデフォルト `filesystem` を使用。S3 関連パラメータは空のため WARNING を記録し、Export Track で補完する。
- 監査 ID: `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java` で `PHR_ACCESS_KEY_*`, `PHR_LAYER_ID_TOKEN_ISSUE`, `PHR_SIGNED_URL_*` を `auditSuccess/auditFailure` 経由で出力することを確認。
- Blocker: Signed URL フェーズは `PHR_EXPORT_SIGNING_SECRET` 以外に S3 設定が必要。現 RUN では Filesystem backend（`/var/opendolphin/phr-export`）のエミュレーターがないため、`PHR_SIGNED_URL_ISSUE_FAILED` の 200 証跡は未取得。
