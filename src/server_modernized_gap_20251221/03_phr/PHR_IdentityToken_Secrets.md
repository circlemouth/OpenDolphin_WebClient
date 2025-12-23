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
  - 鍵未設定・不正時は `IdentityTokenSecretsException` を送出する。
- `server-modernized/src/main/java/open/dolphin/adm20/mbean/LayerConfig.java`
  - Layer ID と秘密鍵参照先は System Property / 環境変数で上書きできる。
    - `phr.layer.app.id` / `PHR_LAYER_APP_ID`
    - `phr.layer.key.id` / `PHR_LAYER_KEY_ID`
    - `phr.layer.provider.id` / `PHR_LAYER_PROVIDER_ID`
    - `phr.layer.private.key.path` / `PHR_LAYER_PRIVATE_KEY_PATH`
    - `phr.layer.private.key.base64` / `PHR_LAYER_PRIVATE_KEY_BASE64`

## 対応内容
- IdentityToken 失敗監査の補完
  - 鍵未設定/読込失敗/形式不正を `IdentityTokenSecretsException` で判定し、監査へ reason/source を記録。
  - `POST /20/adm/phr/identityToken` は鍵不備時に 503 + `error.phr.identityTokenUnavailable` を返却。
- Secrets 注入チェック
  - `ops/check-secrets.sh` に `PHR_LAYER_PRIVATE_KEY_BASE64` / `PHR_LAYER_PRIVATE_KEY_PATH` の検証を追加。
  - base64 が設定されている場合はデコード検証、path 指定時は存在/空ファイルを確認。
- LayerConfig の優先順明確化
  - system property → env の優先順で取得し、未設定時は `jboss.home.dir/phrchat.pk8`（未設定ならカレントディレクトリ）へフォールバック。
  - base64 未設定時は path 設定へフォールバック。

## 変更ファイル
- `server-modernized/src/main/java/open/dolphin/adm20/mbean/IdentityService.java`
- `server-modernized/src/main/java/open/dolphin/adm20/mbean/IdentityTokenSecretsException.java`
- `server-modernized/src/main/java/open/dolphin/adm20/mbean/LayerConfig.java`
- `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`
- `ops/check-secrets.sh`

## 未実施
- Secrets の注入運用（Vault 連携）や鍵の保護ポリシー整備。
- IdentityToken 失敗時の実測証跡（監査ログ/HTTP 応答）の取得。

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_ヘッダー_監査ID整備.md`
- `docs/DEVELOPMENT_STATUS.md`
