# ORCA 接続検証ログ (RUN_ID=20251113TorcaProdCertZ1)

- 実施日: 2025-11-13 18:27 JST（UTC `20251113T092700Z`）
- 参照ドキュメント: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md#44-weborca-クラウド接続2025-11-14-更新`
- 接続先: `https://weborca.cloud.orcamo.jp:443`
- 使用証明書: `ORCAcertification/103867__JP_u00001294_client3948.p12`（パスフレーズ・Basic 情報は同ディレクトリ）
- 証跡: `artifacts/orca-connectivity/20251113TorcaProdCertZ1/weborca-prod/`

## 1. 実施サマリ

| 項目 | 結果 |
| --- | --- |
| TLS ハンドシェイク | `openssl s_client` で CN=`*.cloud.orcamo.jp` / TLSv1.2 を確認。クライアント証明書提示後に `Verify return code: 0 (ok)` を取得。 |
| API 実行 | `curl --cert-type P12 ... -X POST https://weborca.cloud.orcamo.jp/api/api01rv2/acceptlstv2?class=01` → HTTP 200 / `Api_Result=21 (対象の受付はありませんでした。)`。レスポンスは `acceptlstv2.{headers,json}` に保存。 |
| ServerInfoResource | `server-modernized-dev` から `GET /openDolphin/resources/serverinfo/claim/conn` を実施し、`{"claim.conn":"server"}` を取得。Legacy も同値。 |
| 証跡 | `artifacts/orca-connectivity/20251113TorcaProdCertZ1/` に `tls/openssl_s_client.log`, `weborca-prod/acceptlstv2.{headers,json}`, `logs/serverinfo_claim_conn.json` を保存。 |

## 2. 詳細手順

1. `ORCA_PROD_CERT*` 環境変数へ `ORCAcertification/` から値を読み込み、端末履歴へ残らないよう `set +o history` を有効化。`chmod 600 ORCAcertification/*.p12` / `chmod 600 ORCAcertification/*パスワード*.txt` で権限を是正。
2. `openssl s_client -connect weborca.cloud.orcamo.jp:443 -servername weborca.cloud.orcamo.jp` でサーバー証明書を確認し `artifacts/.../tls/openssl_s_client.log` に保存。
3. `/tmp/acceptlstv2_request.json`（診療科=01, Physician_Code=0001, Acceptance_Date=today）を作成し、以下を実行。
   ```bash
   curl --silent --show-error --cert-type P12 \
        --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
        -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
        -H 'Content-Type: application/json; charset=Shift_JIS' \
        -X POST --data-binary '@/tmp/acceptlstv2_request.json' \
        'https://weborca.cloud.orcamo.jp/api/api01rv2/acceptlstv2?class=01' \
        -D artifacts/orca-connectivity/20251113TorcaProdCertZ1/weborca-prod/acceptlstv2.headers \
        -o artifacts/orca-connectivity/20251113TorcaProdCertZ1/weborca-prod/acceptlstv2.json
   ```
4. `ServerInfoResource` (`/serverinfo/{claim/conn,jamri,cloud/zero}`) を Modernized/Legacy 双方で取得し、`claim.conn=server`, `jamri=''`, `cloud.zero=false` を再確認。
5. `docs/web-client/planning/phase2/DOC_STATUS.md` と `PHASE2_PROGRESS.md` の ORCA 欄へ RUN_ID・HTTP・Api_Result・証跡パスを追記。

## 3. 課題・フォローアップ

1. **資格情報の保護**: `ORCAcertification/` 配下の PKCS#12 とパスフレーズファイルが 700/700 で配置されていたため、`chmod 600` を適用済み。以後は 600 を遵守し、共有端末では Keychain/Vault などへ退避する運用を決定する。
2. **Basic 情報の記録方法**: `新規 テキスト ドキュメント.txt` に ORCAMO ID / API キーが平文で残っている。今後はファイル自体を暗号化ストアへ移し、リポジトリには参照先メモのみを残すタスク（WIP: RUN_ID=`20251114TorcaSecretHygieneZ1`）。
3. **モダナイズ側パラメータ**: `ops/shared/docker/custom.properties` は依然 `claim.host=orca` のままなので、`weborca.cloud.orcamo.jp` / port 443 / `claim.scheme=https` へ更新し、`ServerInfoResource` で `server` を維持できることを確認する必要がある。
4. **API 拡張テスト**: 参照系 API（patient/accept/appoint）以外は未実施。`node scripts/tools/orca-curl-snippets.js --scenario p0` を WebORCA クラウドベースで再生成し、`artifacts/orca-connectivity/20251113TorcaProdCertZ1/P0_*` ディレクトリを整備する。
5. **HTTP 405 調査テンプレ**: 今後 404/405 が発生した際は `ORCA_HTTP_404405_HANDBOOK.md` の新手順（curl -v / openssl / ServerInfo 抜粋）を用いること。従来の `docker logs` 参照は廃止済み。

## 4. 再現手順の共有

- RUN_ID を増分（`20251113TorcaProdCertZ2` など）で採番し、`scripts/orca_prepare_next_run.sh <RUN_ID>` を実行してテンプレフォルダを複製。
- `ORCA_PROD_*` をセット → `openssl s_client` → `curl --cert-type P12` → `rg -n 'Api_Result' response.http` → `ServerInfoResource` の順で 30 分以内に収集できる。Slack 報告テンプレは `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` §5 を参照。
