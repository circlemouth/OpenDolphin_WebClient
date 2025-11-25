# RUN_ID=20251120TorcaHttpLogZprep

- 取得日時: 2025-11-13 21:22 JST（UTC_TAG=20251113T122203Z）
- 目的: `ORCA_HTTP_404405_HANDBOOK.md` §7（クラウド接続版）の本番テンプレを適用し、`curl --cert-type P12` / `openssl s_client` / `ServerInfoResource` / WildFly ログの4点セットを `template-next-run` から複製したディレクトリにそろえる。
- dummy リクエスト: `curl --max-time 10 -sv --cert-type P12 --cert <MASKED> -u <MASKED> https://weborca.cloud.orcamo.jp/api/api01rv2/patientgetv2?id=000001`（資格情報はダミーに置換）。レスポンスは 401 を想定し、`httpdump/api01rv2_patientgetv2_{request,response}.http` に保存した。

## 実施内容（§7 対応状況）
1. **RUN_ID 初期化**: `scripts/orca_prepare_next_run.sh 20251120TorcaHttpLogZprep` で `artifacts/orca-connectivity/template-next-run/` を複製し、`logs/` と `httpdump/` を作成。
2. **openssl**: `openssl s_client -connect weborca.cloud.orcamo.jp:443 -servername weborca.cloud.orcamo.jp` を実行し、`tls/openssl_s_client_20251113T122203Z.log` に保存。
3. **curl -v**: `curl --verbose --cert-type P12 --cert ${ORCA_PROD_CERT}:${MASKED} -u ${MASKED} --data-binary '@/tmp/patientgetv2.json' 'https://weborca.cloud.orcamo.jp/api/api01rv2/patientgetv2?class=00'` を `httpdump/api01rv2_patientgetv2/{request,response}.http` に保存。401 応答を想定し、`Allow` ヘッダー欄を確認。
4. **ServerInfoResource**: `curl -s -u sysad:****** http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn` で `logs/serverinfo_claim_conn_20251113T122203Z.json` を取得。
5. **WildFly ログ**: `docker compose -p legacy-vs-modern logs --since 20m server-modernized-dev` を `logs/server-modernized-dev_20251113T122203Z.log` に保存（モダナイズ側 HTTP スタックを把握）。
6. **抽出ログ**: `rg -n '404|405|Method Not Allowed' httpdump/api01rv2_patientgetv2/response.http` を `logs/http_404405_extract_20251113T122203Z.log` へ保存。
7. **メタ情報**: `logs/meta_20251113T122203Z.txt` に RUN_ID / UTC_TAG / 使用テンプレ / 参照ドキュメントを記載。

> 補足: 09:12Z, 11:29Z のウォームアップ結果（`openssl_s_client_20251113T091235Z.log` 等）も残しているが提出対象は UTC_TAG=20251113T122203Z。Slack テンプレは `handbook-dryrun/README.md` のクラウド版を参照。
