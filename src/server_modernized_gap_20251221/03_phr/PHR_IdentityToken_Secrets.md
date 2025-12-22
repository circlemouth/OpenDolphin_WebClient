# PHR IdentityToken / Secrets
- 期間: 2025-12-30 11:00 - 2026-01-01 11:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/03_phr/PHR_IdentityToken_Secrets.md`

## 目的
- PHR IdentityToken の発行フローと Secret 管理（Layer ID 鍵）の前提を整備し、監査の失敗系を補完する。

## スコープ
- `PHRResource` の IdentityToken 発行経路。
- IdentityToken 用鍵（`phrchat.pk8`）の配置・参照方法の明確化。

## 実装状況
- `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`
  - `POST /20/adm/phr/identityToken` を実装済み。
- `server-modernized/src/main/java/open/dolphin/adm20/mbean/IdentityService.java`
  - RSA 署名で IdentityToken を生成し、秘密鍵は base64/ファイルのどちらからでも取得できる。
- `server-modernized/src/main/java/open/dolphin/adm20/mbean/LayerConfig.java`
  - Layer ID と秘密鍵参照先は System Property / 環境変数で上書きできる。
    - `phr.layer.app.id` / `PHR_LAYER_APP_ID`
    - `phr.layer.key.id` / `PHR_LAYER_KEY_ID`
    - `phr.layer.provider.id` / `PHR_LAYER_PROVIDER_ID`
    - `phr.layer.private.key.path` / `PHR_LAYER_PRIVATE_KEY_PATH`
    - `phr.layer.private.key.base64` / `PHR_LAYER_PRIVATE_KEY_BASE64`

## 未実施
- Secrets の注入運用（Vault 連携）や鍵の保護ポリシー整備。
- IdentityToken 失敗時の実測証跡（監査ログ/HTTP 応答）の取得。

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_ヘッダー_監査ID整備.md`
- `docs/DEVELOPMENT_STATUS.md`
