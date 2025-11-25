# RUN_ID=20251119TlicenseVaultAutoZ2 Vault ライセンス自動配備ログ

## 1. Vault/CLI セットアップ
- `docker run -d --name opd-vault -e VAULT_DEV_ROOT_TOKEN_ID=root -p 8200:8200 hashicorp/vault:1.15.5` で Dev Vault を起動。
- `tmp/local-bin/vault` を作成し、`docker run --rm --network container:opd-vault hashicorp/vault:1.15.5 vault ...` をラップしてホスト側で `vault` CLI を利用可能にした。
- `VAULT_ADDR=http://127.0.0.1:8200` / `VAULT_TOKEN=root` を指定し、`vault secrets enable -path=kv kv-v2` → `vault kv put kv/modernized-server/license/dev license.key=<rand32hex> license.secret=<rand32hex> license.uid_seed=<uuid> rotated_at=2025-11-13T05:08:33Z` を実行。実値は Vault のみで管理し、Artifacts には残していない。

## 2. fetch_license_secrets.sh 実行
```bash
PATH="$PWD/tmp/local-bin:$PATH" \
VAULT_ADDR=http://127.0.0.1:8200 \
VAULT_TOKEN=root \
ops/tools/fetch_license_secrets.sh \
  --run-id 20251119TlicenseVaultAutoZ2 \
  --vault-path kv/modernized-server/license/dev \
  --artifact-dir artifacts/parity-manual/license/20251119TlicenseVaultAutoZ2 \
  --log-json
```
- `/etc/opendolphin/license` が存在しなかったため、`docker exec -u 0 opendolphin-server{,-modernized-dev} mkdir -p /etc/opendolphin/license` で配置先を作成した後、`docker cp` と `ln -sf /opt/jboss/wildfly/license.properties /etc/opendolphin/license/license.properties` を再構築。
- `tmp/license/` には実ファイル (`license.properties`, `system_license_post_body.txt`, `vault_secret.json`) を一時生成し、テスト完了後に削除予定。

## 3. 成果物 (Artifacts)
| ファイル | 内容 |
| --- | --- |
| `license.properties.sanitized` | 本番と同じキー/シークレットフォーマット（実値は `REDACTED_HEX32`）。 |
| `system_license_post_body.sanitized.txt` | `<license.uid_seed>-20251119TlicenseVaultAutoZ2` の 1 行テンプレート。 |
| `license_fetch_meta.sanitized.json` | 取得メタ（Vault パス、生成時刻、シンボリックリンク先）。`license.uid_seed` などの実値は `secrets_omitted` に明記。 |

## 4. メモ
- RUN_ID=`20251119TlicenseVaultAutoZ2` を `docs/server-modernization/phase2/operations/SECURITY_SECRET_HANDLING.md` 等に追記済み（別途参照）。
- 実シークレットを artifacts に保存しない運用へ移行したため、必要に応じて本 README とサニタイズ済みファイルを参照しながら `VAULT_ADDR`/`VAULT_TOKEN` で再取得する。
