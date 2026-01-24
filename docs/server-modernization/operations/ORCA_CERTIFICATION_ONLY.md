# ORCA 接続情報（Certification Only / 非Legacy）

- RUN_ID: 20260123T221843Z
- 更新日: 2026-01-23
- 目的: ORCA 実環境/検証環境の接続先・認証方式を **非Legacy の正本**として管理する。

> ⚠️ 重要: 接続情報・資格情報は機微情報のため、このリポジトリには **具体値を記載しない**。
> すべて `<MASKED>` とし、実値は社内の承認済み共有手段（Secrets 管理/安全な共有）から取得する。

## 1. 参照ルール
- 本ファイルが **非Legacy の正本**。
- Phase2 配下の `ORCA_CERTIFICATION_ONLY.md` は Legacy 参照。
- ログや証跡ではユーザー名・パスワード・証明書パスを **一切出力しない**。

## 2. 接続先テンプレート（値は `<MASKED>`）
| 環境 | ベースURL | 認証方式 | 備考 |
| --- | --- | --- | --- |
| Trial | `<MASKED>` | Basic | XML/UTF-8（証明書不要） |
| Stage | `<MASKED>` | Basic / mTLS | 接続先指定は承認後に設定 |
| Preprod | `<MASKED>` | Basic / mTLS | 接続先指定は承認後に設定 |
| Prod | `<MASKED>` | mTLS | 直接接続は承認必須 |

## 3. 設定手順（環境変数）
### server-modernized 向け
- `ORCA_TARGET_ENV=preprod`（または `prod`）を明示し、**必ずホスト/ベースURLを指定する**。
- `ORCA_API_HOST` / `ORCA_API_PORT` / `ORCA_API_SCHEME` または `ORCA_BASE_URL` を設定する。
- Basic 認証が必要な場合は `ORCA_API_USER` / `ORCA_API_PASSWORD` を設定する。

#### 優先順位（server-modernized）
1. `ORCA_BASE_URL`（指定時はこれを最優先）
2. `ORCA_API_HOST` / `ORCA_API_PORT` / `ORCA_API_SCHEME`
3. 未指定の場合は `setup-modernized-env` の既定値（local/Trial 想定）

### Web クライアント dev proxy 向け
- 接続先: `VITE_DEV_PROXY_TARGET=<MASKED>`
- 認証方式:
  - mTLS: `ORCA_CERT_PATH=<MASKED>` / `ORCA_CERT_PASS=<MASKED>`
  - Basic: `ORCA_BASIC_USER=<MASKED>` / `ORCA_BASIC_PASSWORD=<MASKED>`

## 4. ログ/証跡ポリシー
- `setup-modernized-env.sh` / `setup-modernized-env.ps1` の `ORCA_CONFIG` ログで **set/unset** のみ記録する。
- 機微情報は `<MASKED>` で保存し、必要であれば別途共有する。
- 実環境接続を行った場合は `docs/server-modernization/operations/logs/<RUN_ID>-orca-connectivity.md` へ証跡を残す。

## 5. 注意事項
- ORCA 本番への直接接続は承認必須。
- 接続/認証の切替を行う場合は `ORCA_TARGET_ENV` と環境変数セットを必ず記録する。
- 例外的な手順が必要な場合は `docs/DEVELOPMENT_STATUS.md` に指示を追記する。
