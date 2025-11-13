# RUN_ID=20251119TlicenseVaultAutoZ1 Vault フロー自動化準備ログ

## 1. 目的
- `ops/tools/fetch_license_secrets.sh` を新規実装し、`vault kv get`→`jq`→`license.properties`/`system_license_post_body.txt` 生成→`docker cp` の流れを 1 コマンド化した。
- Dev Vault へアクセスできないローカル環境だったため、実シークレットの取得は行わず、出力ファイル形式をサニタイズしたうえで保存している。

## 2. 実行コマンド（想定）
```bash
RUN_ID=20251119TlicenseVaultAutoZ1 \
ops/tools/fetch_license_secrets.sh \
  --vault-path kv/modernized-server/license/dev \
  --work-dir tmp/license \
  --artifact-dir artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1
```
- `VAULT_ADDR`/`VAULT_TOKEN` を環境変数で指定する想定。Legacy/Modernized 双方へ `docker cp` を行い、`/etc/opendolphin/license/license.properties` のシンボリックリンクも更新する。

## 3. 出力ファイル
| ファイル | 内容 |
| --- | --- |
| `license.properties.sanitized` | Vault から取得したキー/シークレットの配置形式（実値は記載なし）。 |
| `system_license_post_body.sanitized.txt` | `license.uid_seed-RUN_ID` のテンプレート。 |
| `license_fetch_meta.sanitized.json` | スクリプトのメタデータ出力フォーマット。 |

## 4. 次ステップ
- Dev Vault へアクセス可能な環境で上記コマンドを実行し、実値を `tmp/license/` に一時生成してから `artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1/` に再保存する。
- 実行ログと `ops/tools/send_parallel_request.sh POST /dolphin/license` の証跡を同ディレクトリ配下に追記し、PHASE2_PROGRESS/ライセンスメモを更新済み（本ディレクトリに RUN_ID を登録）。

## 5. Dry-run 実行メモ（Vault 接続なし環境）
- Vault/コンテナに依存しないフォーマット検証のため、`tmp/fakebin/vault` を作成して `vault kv get -format=json ...` と同じ JSON（`license.key`, `license.secret`, `license.uid_seed`, `rotated_at`）を返すスタブを用意した。
- `PATH="$(pwd)/tmp/fakebin:$PATH" ./ops/tools/fetch_license_secrets.sh --dry-run ...` のように PATH を一時的に差し替えると、`vault`/`docker` コマンド検証を通過しつつ `DRY_RUN=1` でコンテナ操作がスキップされる。
- 生成物（`license.properties`, `system_license_post_body.txt`）は `artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1/dry-run/` へ保存し、実値が含まれないテンプレートを共有できるようにした。
- `license_fetch_meta.json` やサニタイズ済みファイルは従来通りディレクトリ直下へ配置し、dry-run フローで取得した RUN_ID=`20251119TlicenseVaultAutoZ1` を `PHASE2_PROGRESS.md` および `SECURITY_SECRET_HANDLING.md` に反映した。
