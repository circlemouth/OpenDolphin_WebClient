# Secrets 運用ハンドリング計画（Phase 2）

ライセンスや 2FA などの高秘匿情報を `tmp/` から Vault 管理へ移行するためのプレイブック。Phase 2 では License Secrets を最優先で整備し、以降は本ファイルに各種 Secrets の取り扱いを段階的に追加する。Modernized サーバーと新 Web クライアントの安定稼働が唯一の必須スコープであり、Legacy サーバー／旧クライアント向けデプロイは参考手順とする。

## 1. 基本方針
- ハンドリング対象のシークレットは **生成 → 暗号化/保管 → デプロイ → ローテーション** の 4 段階で管理し、各段階の責務をドキュメント化する。
- Git リポジトリ上に平文を残さない。テンプレートや一時ファイルは `tmp/<category>/` に限定し、作業完了後は削除するか `.gitignore` で保護する。
- Vault（HashiCorp）を正とし、ステージング以下は AWS Secrets Manager でミラーする。`OPS_SECRET_FETCH` ワークフローと手動作業の双方から参照できるディレクトリ構造を統一する。
- Secrets 取り扱いログ（Vault Audit、Jenkins/GitHub Actions の `TRACE_RUN_ID`、`artifacts/parity-manual/<category>/`）をセットで残し、`docs/web-client/planning/phase2/DOC_STATUS.md` の該当行を更新する。

## 2. License Secrets
`license.properties` と `POST /dolphin/license` のテンプレート（`tmp/license/*`）を Vault 管理へ移行する計画。対象キーは `license.key`, `license.secret`, `license.uid_seed`（`system_license_post_body.txt` で利用）とする。

### 2.1 標準フロー概要
| フェーズ | 実施内容 | 記録すべき証跡 |
| --- | --- | --- |
| 生成 | オフライン端末で `license.key` / `license.secret` / `license.uid_seed` を作成 | 生成ログ（ローカルのみ）、RUN_ID（例: `20251118TlicenseDeployZ1`） |
| 暗号化/保管 | Vault `kv/modernized-server/license/<env>` と Transit を併用して格納 | `vault kv put`/`transit encrypt` の CLI ログ、Vault 审査ログ ID |
| デプロイ | `OPS_SECRET_FETCH` または手動 `vault kv get` で取得し、対象環境の `/etc/opendolphin/license/license.properties` へ配備 | `ops/tests/api-smoke-test/configs/system_license_post.config` の実行結果、`artifacts/parity-manual/license/<RUN_ID>/` |
| ローテーション | 四半期（1・4・7・10 月）に新値へ切替、旧値は 7 日保持 | `PHASE2_PROGRESS.md` への記録、`docs/server-modernization/phase2/notes/license-config-check.md` との差分 |

### 2.2 生成プロセス
1. オフライン端末で以下を実行し、乱数を生成して一時ファイルに保存する。
   ```bash
   openssl rand -out license.key.bin 32
   openssl rand -out license.secret.bin 32
   base64 -w 0 license.key.bin > license.key.b64
   base64 -w 0 license.secret.bin > license.secret.b64
   uuidgen | tr 'A-Z' 'a-z' > license.uid_seed
   ```
2. `license.key.b64` / `license.secret.b64` はコピー時の事故を避けるため、一度だけ画面表示して速やかに Vault 登録へ進む。`license.uid_seed` は `tmp/license/system_license_post_body.txt` のテンプレに転記する。
3. 生成ログはローカルストレージに残さず、RUN_ID と担当者を `docs/server-modernization/phase2/notes/license-config-check.md` へ追記する。
4. 平文ファイル（`.bin`, `.b64`）は `shred -u` で破棄し、`tmp/license/README.md` の注意事項に従ってテンプレのみ残す。

### 2.3 暗号化・保管
1. Vault の kv パス構成:
   - Dev: `kv/modernized-server/license/dev`
   - QA: `kv/modernized-server/license/qa`
   - Prod: `kv/modernized-server/license/prod`
2. 保存手順:
   ```bash
   vault kv put kv/modernized-server/license/prod \
     license.key=@license.key.b64 \
     license.secret=@license.secret.b64 \
     license.uid_seed=$(cat license.uid_seed) \
     rotated_at=2025-11-13
   ```
3. CI/CD で静的ファイルへ落とす場合は Transit エンジンを併用し、`vault write transit/encrypt/opd-license plaintext=$(base64 <<<"license.key=<value>&license.secret=<value>")` で暗号化した文字列を生成する。復号はデプロイジョブのみ許可する。
4. `OPS_SECRET_FETCH` は `kv/modernized-server/license/<env>` を読み出し、`tmp/license/license.properties.tpl`（コミット対象外）へ埋め込む。テンプレは以下形式。
   ```
   license.key={{VAULT_LICENSE_KEY}}
   license.secret={{VAULT_LICENSE_SECRET}}
   ```
5. `tmp/license/system_license_post_body.txt` には `{{VAULT_LICENSE_UID_SEED}}` を流し込み、実際のリクエスト発行前に RUN_ID をサフィックス（`-device` など）として追記する。

### 2.4 デプロイ
1. Dev/QA: `OPS_SECRET_FETCH` が生成した `server-modernized.env` を `docker-compose.modernized.dev.yml` の `env_file` に渡すと同時に、`tmp/license/license.properties` を作成。
2. 本番: 手動で以下を実施。
   ```bash
   vault kv get -format=json kv/modernized-server/license/prod \
     | jq -r '.data.data | "license.key=" + ."license.key" + "\nlicense.secret=" + ."license.secret"' \
     > tmp/license/license.properties
   docker cp tmp/license/license.properties opendolphin-server:/opt/jboss/wildfly/license.properties
   docker exec -u 0 opendolphin-server sh -c 'chown jboss:jboss /opt/jboss/wildfly/license.properties && ln -sf /opt/jboss/wildfly/license.properties /etc/opendolphin/license/license.properties'
   ```
3. Modernized/Legacy 双方へ単一手順で配布する場合は helper コンテナから `docker cp` を 2 回実行し、`PARITY_OUTPUT_DIR=artifacts/parity-manual/license/<RUN_ID>/post` で `POST /dolphin/license` を検証する。
4. デプロイ後は `ops/tests/api-smoke-test/configs/system_license_post.config` + `tmp/license/system_license_post_body.txt` で `POST /dolphin/license`、`GET /dolphin/license`（405 確認）、`GET /system/license`（404 確認）を連続実行し、結果を `artifacts/parity-manual/license/<RUN_ID>/` に保存する。
5. `tmp/license/README.md` に従い、`license.properties` は配布後 24 時間以内に削除し再生成を強制する。

#### 2.4.1 fetch_license_secrets.sh（Vault フロー自動化）
1. 事前に `VAULT_ADDR` / `VAULT_TOKEN` と docker daemon、`opendolphin-server{,-modernized-dev}` が起動していることを確認する。
2. 以下コマンドを実行して Vault からシークレットを取得し、`license.properties` と `system_license_post_body.txt` を生成する。`RUN_ID` は `TRACE_RUN_ID` と揃える。
   ```bash
   RUN_ID=20251119TlicenseVaultAutoZ1 \
   ops/tools/fetch_license_secrets.sh \
     --vault-path kv/modernized-server/license/dev \
     --work-dir tmp/license \
     --artifact-dir artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1
   ```
3. スクリプトは `vault kv get -format=json` → `jq` → `license.properties` 作成 → `docker cp` → `docker exec -u 0 chown && ln -sf` を順に実行し、Legacy/Modernized 双方の WildFly へ同一ファイルを配置する。`system_license_post_body.txt` の 1 行目は `<license.uid_seed>-<RUN_ID>` に更新される。
4. `--dry-run` を付けると Vault 出力の整形のみ行い、コンテナ操作を省略できる。`--skip-legacy` `--skip-modern` で片側を除外できる。
5. `--artifact-dir` を指定すると生成ファイルと `license_fetch_meta.json` を指定先（例: `artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1/`）へコピーする。実行ログ・`ops/tools/send_parallel_request.sh` の結果を同 RUN_ID で保存し、`PHASE2_PROGRESS.md` とライセンス検証メモへ反映する。
6. 2025-11-13（RUN_ID=`20251119TlicenseVaultAutoZ1`）は Vault へ接続できないワークステーションで dry-run を実施し、`tmp/fakebin/vault` スタブを PATH 先頭へ追加して `vault kv get -format=json ...` のレスポンスを模擬した。生成された `license.properties` / `system_license_post_body.txt` は `artifacts/parity-manual/license/20251119TlicenseVaultAutoZ1/dry-run/` に保存し、ファイル形式のみを共有している（実値は含まない）。

### 2.5 ローテーション
1. 実施タイミング: 1・4・7・10 月の第 2 週（水曜 10:00 JST）。インシデントが発生した場合は臨時ローテーションを追加。
2. 手順:
   - 生成（2.2）→暗号化（2.3）を再実行し、Vault に `rotated_at` / `previous_version` を追記。
   - `OPS_SECRET_FETCH` ジョブを手動トリガーして新値を配布。
   - WildFly を rolling restart し、`/dolphin/license` の POST が `body=0` を返すことを確認。
   - `docs/server-modernization/phase2/notes/license-config-check.md` に RUN_ID と変更点を追記。
3. ロールバック: Vault 上で `vault kv rollback`（前バージョンへ）→ `OPS_SECRET_FETCH` 再実行 → WildFly 再起動。ロールバック理由は `PHASE2_PROGRESS.md` に記載。
4. 監査ログ: Vault Audit の Request ID、`ops/tests/api-smoke-test` の `TRACE_RUN_ID`、`artifacts/parity-manual/license/<RUN_ID>/` をセットで残す。

### 2.6 チェックリスト
- [ ] Vault `kv/modernized-server/license/<env>` に `license.key` / `license.secret` / `license.uid_seed` が存在し、最終更新日が 90 日以内か。
- [ ] `tmp/license/README.md` の注意に従って平文をコミットしていないか（`git status -- tmp/license`）。
- [ ] `ops/tests/api-smoke-test/configs/system_license_post.config` の `header_file` / `body_file` が最新テンプレを参照しているか。
- [ ] `docs/web-client/planning/phase2/DOC_STATUS.md` の「License secrets plan documented」行を更新したか。

### 2.7 実投入ログ（2025-11-13 / RUN_ID=`20251119TlicenseVaultZ1`）

- `hashicorp/vault:1.15.5` の dev モードを `VAULT_DEV_ROOT_TOKEN_ID=root` で起動し、`vault secrets enable -path=kv kv-v2` → `vault kv put kv/modernized-server/license/dev license.key=<rand32> license.secret=<rand32> license.uid_seed=<uuid> rotated_at=2025-11-13` を実行。Vault 側のメタデータ（version=1）とアクセスログを `docker logs opd-vault` で確認後、コンテナを停止。実値は Git/Artifacts に保存していない。
- `vault kv get -format=json .../dev | jq '.data.data'` を `OPS_SECRET_FETCH` 相当のシェルで処理し、`tmp/license/license.properties` と `tmp/license/system_license_post_body.txt`（`<uid_seed>-20251119TlicenseVaultZ1`）を生成。ファイルは `chmod 600` → `docker cp` → `/etc/opendolphin/license/license.properties` へシンボリックリンクを張り直した後、`rm` で破棄。
- helper コンテナ（`mcr.microsoft.com/devcontainers/base:jammy`）から `TRACE_RUN_ID=20251119TlicenseVaultZ1 PARITY_HEADER_FILE=ops/tests/api-smoke-test/headers/sysad-license.headers PARITY_BODY_FILE=tmp/license/system_license_post_body.txt ops/tools/send_parallel_request.sh --profile modernized-dev POST /dolphin/license` を実行。Modernized=200（body=0）/Legacy=404 を取得し、続けて `GET /dolphin/license`（Modernized=405, Legacy=404）と `GET /system/license`（双方 404）を `artifacts/parity-manual/license/20251119TlicenseVaultZ1/{post,get,get-system}/` に保存。`logs/opendolphin-server*.log` は `--since 5m` で採取。
- 既知課題: Legacy WildFly10 では `/dolphin/license` が REST 公開されておらず 404 のまま。`docs/server-modernization/phase2/notes/license-config-check.md` にフォローアップを追記し、Legacy 側 API 実装を追跡する。

### 2.8 実投入ログ（2025-11-13 / RUN_ID=`20251119TlicenseVaultAutoZ2`）

- Dev Vault コンテナ `opd-vault`（`hashicorp/vault:1.15.5`, `VAULT_DEV_ROOT_TOKEN_ID=root`）を再起動し、`vault secrets enable -path=kv kv-v2` を維持したまま version=2 の `kv/modernized-server/license/dev` を登録。`license.key`/`license.secret` は 32 文字 HEX、`license.uid_seed` は UUIDv4、`rotated_at=2025-11-13T05:08:33Z` を投入し、実値は Vault のみに保持。
- ホスト側では `tmp/local-bin/vault` ラッパーを PATH へ追加し、`docker run --network container:opd-vault hashicorp/vault:1.15.5 vault ...` 形式で CLI を実行。`VAULT_ADDR=http://127.0.0.1:8200` / `VAULT_TOKEN=root` を export して `ops/tools/fetch_license_secrets.sh --run-id 20251119TlicenseVaultAutoZ2 --vault-path kv/modernized-server/license/dev --artifact-dir artifacts/parity-manual/license/20251119TlicenseVaultAutoZ2 --log-json` を実価で実行した。
- シンボリックリンク先 `/etc/opendolphin/license/license.properties` が無かったため、`docker exec -u 0 opendolphin-server{,-modernized-dev} mkdir -p /etc/opendolphin/license` → `docker cp tmp/license/license.properties ...:/opt/jboss/wildfly/license.properties` → `ln -sf /opt/jboss/wildfly/license.properties /etc/opendolphin/license/license.properties` を双方に適用。
- 実ファイルは `tmp/license/` にのみ一時配置し、Artifacts には `license.properties.sanitized` / `system_license_post_body.sanitized.txt` / `license_fetch_meta.sanitized.json` を保存（RUN_ID ディレクトリ: `artifacts/parity-manual/license/20251119TlicenseVaultAutoZ2/`）。`secrets_omitted` に記載のフィールドは Vault 再取得が前提。
- 後続で `TRACE_RUN_ID=20251119TlicenseMonitorZ2 ops/tests/api-smoke-test/run.sh --scenario license --profile modernized-dev` を実行し、Legacy=200/405、Modernized=500（POST/GET/GET-system）を `artifacts/parity-manual/license/20251119TlicenseMonitorZ2/` に保存。500 応答は `logs/opendolphin-server-modernized-dev.log` で切り分ける。

---
- 担当: SRE（一次）、セキュリティチーム（レビュー）。
- 最新更新日: 2025-11-13。
