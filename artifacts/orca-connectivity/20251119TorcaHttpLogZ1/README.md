# RUN_ID=20251119TorcaHttpLogZ1

- 取得日: 2025-11-13 14:55 JST
- 目的: `curl --cert-type P12`／`openssl s_client`／`ServerInfoResource`／WildFly ログの 4 点セットを実際のクラウド接続で取得し、404/405 調査テンプレに沿った提出物を整備する。
- 実施内容:
  - `openssl s_client -connect weborca.cloud.orcamo.jp:443 -servername weborca.cloud.orcamo.jp` を実行し、`tls/openssl_s_client_20251113T145500Z.log` に保存。
  - `curl --verbose --cert-type P12 --cert <MASKED> -u <MASKED> -X POST 'https://weborca.cloud.orcamo.jp/api/api01rv2/patientgetv2?class=00'` を実行して 404 応答を取得。`httpdump/api01rv2_patientgetv2/{request,response}.http` に head/body/Allow を保存。
  - `curl -s -u sysad:****** http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn` で `claim.conn=server` を確認し、`logs/serverinfo_claim_conn_20251113T145500Z.json` へ保存。
  - `docker compose -p legacy-vs-modern logs --since 20m server-modernized-dev` で WildFly 側の `claim.logger` 出力を `logs/server-modernized-dev_20251113T145500Z.log` に保存。
  - `rg -n '404|405|Method Not Allowed' httpdump/api01rv2_patientgetv2/response.http` を `logs/http_404405_extract_20251113T145500Z.log` に保存。
- 関連ドキュメント更新対象: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.5（HTTP 401/403/404/405）、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md`、`docs/web-client/planning/phase2/DOC_STATUS.md`。

## Slack / 共有ノート提出テンプレ
```
[RUN_ID=20251119TorcaHttpLogZ1 / UTC=20251113T145500Z]
openssl: artifacts/orca-connectivity/20251119TorcaHttpLogZ1/tls/openssl_s_client_20251113T145500Z.log
curl-v: artifacts/orca-connectivity/20251119TorcaHttpLogZ1/httpdump/api01rv2_patientgetv2/{request,response}.http
serverinfo: artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/serverinfo_claim_conn_20251113T145500Z.json
wildfly: artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/server-modernized-dev_20251113T145500Z.log
extract: artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/http_404405_extract_20251113T145500Z.log
Doc update: Runbook §4.5, logs/2025-11-13, DOC_STATUS, PHASE2_PROGRESS
所見: patientgetv2 は WebORCA 側で 404、Allow ヘッダーなし。ルーティング公開待ち。
```
