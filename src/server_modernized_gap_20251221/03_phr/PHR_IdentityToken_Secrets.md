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
  - `POST /20/adm/phr/identityToken` は失敗パターン全体で 503 + `error.phr.identityTokenUnavailable` を返却（失敗系のレスポンス統一）。
- Secrets 注入チェック
  - `ops/check-secrets.sh` に `PHR_LAYER_PRIVATE_KEY_BASE64` / `PHR_LAYER_PRIVATE_KEY_PATH` の検証を追加。
  - base64 が設定されている場合はデコード検証、path 指定時は存在/空ファイルを確認。
- 監査理由の一貫性
  - 未設定/読込失敗/形式不正は `IdentityTokenSecretsException` の reason/source を監査へ記録。
  - その他の失敗は 503 + `error.phr.identityTokenUnavailable` に統一し、監査 reason は `identity_token_unavailable`。
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

## 最低限の検証手順（手動）
- `PHR_LAYER_PRIVATE_KEY_BASE64` を未設定にして `PHR_LAYER_PRIVATE_KEY_PATH` を空/不存在にする。
  - `POST /20/adm/phr/identityToken` で 503 + `error.phr.identityTokenUnavailable` を確認。
  - 監査ログの reason/source が `identity_token_key_missing` / `path` になることを確認。
- `PHR_LAYER_PRIVATE_KEY_BASE64` に不正な Base64 を設定。
  - 監査ログの reason が `identity_token_key_invalid`、source が `base64` になることを確認。
- `PHR_LAYER_PRIVATE_KEY_PATH` に空ファイルを指定。
  - 監査ログの reason が `identity_token_key_empty`、source が `path` になることを確認。
- リクエストボディを空/不正 JSON にする。
  - 503 + `error.phr.identityTokenUnavailable` が返ることを確認。
  - 監査ログの reason が `invalid_payload` になることを確認。

## 作業履歴（2025-12-23）
- IdentityToken の失敗系を 503 + `error.phr.identityTokenUnavailable` へ統一し、監査 reason の整理を実施。
- `IdentityTokenSecretsException` の原因切り分け（未設定/空/読込失敗/形式不正）と source（base64/path）を監査に残す実装を確認。
- `LayerConfig` の secrets 取得優先順を明確化し、ドキュメントへ反映。
- `ops/check-secrets.sh` の base64/path 検証内容は要件充足を確認（未設定/不正/不存在/空ファイルを検知）。
- Docker 起動で `io.agroal.api` の ModuleNotFound が発生したため、Dockerfile で module alias を追加して復旧。
- `PHRResource` の監査で actorId 欠落により 500 となる事象を解消し、actorId を details から設定できるよう補強。
- 手動疎通: `POST /openDolphin/resources/20/adm/phr/identityToken` が 503 を返すことを確認（署名鍵未設定のため）。

## 参照
- `src/server_modernized_gap_20251221/03_phr/PHR_ヘッダー_監査ID整備.md`
- `docs/DEVELOPMENT_STATUS.md`
