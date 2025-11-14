# ORCA HTTP 404/405 ハンドブック ドライラン（クラウド接続版）

## 目的
- `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` §6 の手順を、WebORCA クラウド本番向け `curl --cert-type P12` で再現する前にフォルダ構成だけ確認する。
- 実 API へ送信しない。既存 Evidence からログを複製し、Slack テンプレに差し替えた際の見え方を共有する。

## ダミー環境パラメータ
```
RUN_ID=20251120TorcaHttpLogZ9
UTC_TAG=DRYRUN000000Z
BASE_EVIDENCE=artifacts/orca-connectivity/20251122TorcaHttpLogZ1
```

## 取得ファイル一覧
| 種別 | 保存先 | 取得方法 / 備考 |
| --- | --- | --- |
| TLS / openssl | `artifacts/.../tls/openssl_s_client_DRYRUN000000Z.log` | `BASE_EVIDENCE/tls/openssl_s_client_*.log` をコピーし、クラウド接続時のログ構造を確認。
| curl -v (request) | `.../httpdump/sample/request.http` | `curl --verbose` の stderr 形式をテンプレ化。Runbook に合わせ `<MASKED>` を記載。
| curl -v (response) | `.../httpdump/sample/response.http` | 405 応答例（`Allow: GET`）を記載。`Api_Result` 行を含める。
| ServerInfo | `.../logs/serverinfo_claim_conn_DRYRUN000000Z.json` | `{"claim.conn":"server"}` のダミー JSON を保存。
| WildFly ログ | `.../logs/server-modernized-dev_DRYRUN000000Z.log` | `BASE_EVIDENCE/logs/server-modernized-dev_*.log` をコピー。
| 抽出ログ | `.../logs/http_404405_extract_DRYRUN000000Z.log` | `rg -n '404|405|Method Not Allowed' httpdump/sample/response.http` の結果。

## Slack テンプレサンプル
```
[RUN_ID=20251120TorcaHttpLogZ9 / UTC=DRYRUN000000Z]
openssl: artifacts/orca-connectivity/20251120TorcaHttpLogZ9/tls/openssl_s_client_DRYRUN000000Z.log
curl-v: artifacts/orca-connectivity/20251120TorcaHttpLogZ9/httpdump/sample/{request,response}.http
serverinfo: artifacts/orca-connectivity/20251120TorcaHttpLogZ9/logs/serverinfo_claim_conn_DRYRUN000000Z.json
wildfly: artifacts/orca-connectivity/20251120TorcaHttpLogZ9/logs/server-modernized-dev_DRYRUN000000Z.log
extract: artifacts/orca-connectivity/20251120TorcaHttpLogZ9/logs/http_404405_extract_DRYRUN000000Z.log
所見: DRYRUN - 404/405 抽出対象なし、フォルダ構成のみ事前確認
Doc update: Runbook §4.5, logs/2025-11-13, DOC_STATUS, PHASE2_PROGRESS
```

## 検証メモ
- 旧 WebORCA コンテナ手順は 2025-11-14 で廃止。本 README はクラウド接続に必要なファイル構成のみを確認するためのテンプレ。
- Slack 投稿前に RUN_ID/UTC を差し替えるだけで提出できることを確認済み。Evidence は `BASE_EVIDENCE` を参照して更新。
