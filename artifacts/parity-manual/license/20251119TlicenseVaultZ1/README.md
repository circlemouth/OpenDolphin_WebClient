# RUN_ID=20251119TlicenseVaultZ1 ライセンスシークレット実投入ログ

## 1. Vault 反映
- ローカル dev Vault (`hashicorp/vault:1.15.5`, `VAULT_DEV_ROOT_TOKEN_ID=root`) を起動し、`kv/modernized-server/license/dev` に `license.key` / `license.secret` / `license.uid_seed` / `rotated_at=2025-11-13` を登録。
- `vault kv get -format=json kv/modernized-server/license/dev` の出力を `OPS_SECRET_FETCH` 相当の手順で加工し、`tmp/license/license.properties` と `tmp/license/system_license_post_body.txt` を生成（いずれも作業終了時に削除済み）。
- `docker cp` で Legacy/Modernized 双方の WildFly (`/opt/jboss/wildfly/license.properties`) へ配布し、`/etc/opendolphin/license/license.properties` へシンボリックリンクを貼り直した。

## 2. HTTP 証跡
| Case | Legacy (8080) | Modernized (8080) | 保存先 |
| --- | --- | --- | --- |
| `POST /dolphin/license` | 404 (リソース未公開、Legacy REST 未整備) | **200 / body=0** | `post/license_post/{legacy,modern}/` |
| `GET /dolphin/license` | 404 | 405 | `get/license_get/{legacy,modern}/` |
| `GET /system/license` | 404 | 404 | `get-system/license_get_system/{legacy,modern}/` |

- 送信ヘッダー: `ops/tests/api-smoke-test/headers/sysad-license.headers`（`X-Trace-Id=license-20251119TlicenseVaultZ1`）。
- 実行コマンド（helper コンテナ, `--network legacy-vs-modern_default`）例:
  ```bash
  TRACE_RUN_ID=20251119TlicenseVaultZ1 \
  PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-license.headers \
  PARITY_BODY_FILE=tmp/license/system_license_post_body.txt \
  PARITY_OUTPUT_DIR=tmp/license/manual \
  ops/tools/send_parallel_request.sh --profile modernized-dev POST /dolphin/license license_post_manual
  ```
- ログ: `logs/opendolphin-server.log`, `logs/opendolphin-server-modernized-dev.log`（`--since 5m` 取得）。Modernized 側に `ライセンス新規登録: f7ee7a94-…-20251119TlicenseVaultZ1` を記録。

## 3. フォローアップ
- Legacy WildFly 側の REST `/dolphin/license` が 404 応答のままのため、`docs/server-modernization/phase2/notes/license-config-check.md` の Legacy 列へ既知事象として追記。
- Vault Dev インスタンス停止後は `tmp/license/*` を空に戻し、CI/CD から本番 Vault へ同手順を適用できるよう `SECURITY_SECRET_HANDLING.md` と `PHASE2_PROGRESS.md` に更新履歴を残した。
