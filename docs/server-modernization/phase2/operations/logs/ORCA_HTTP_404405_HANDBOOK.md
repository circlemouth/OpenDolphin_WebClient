# ORCA HTTP 404/405 トリアージ ワーカーハンドブック

> 2025-11-14 更新: ローカル WebORCA コンテナではなく WebORCA クラウド本番（`https://weborca.cloud.orcamo.jp:443`）を対象とする。旧ローカル手順はアーカイブ済み。

## 1. RUN_ID / UTC_TAG 命名
- RUN_ID: `YYYYMMDDTorcaHttpLogZ#`（例: `20251120TorcaHttpLogZ2`）。本番疎通ログは `TorcaProdCertZ#` としてもよいが、404/405 調査は `TorcaHttpLogZ#` で統一。
- UTC_TAG: `date -u +%Y%m%dT%H%M%SZ` で取得（例: `UTC_TAG=20251120T031500Z`）。
- Evidence ルート: `artifacts/orca-connectivity/${RUN_ID}/`。`logs/`, `httpdump/`, `trace/`, `tls/` を配下に作成する。

## 2. 標準取得コマンド
1. **TLS/証明書**  
   ```bash
   openssl s_client -connect weborca.cloud.orcamo.jp:443 -servername weborca.cloud.orcamo.jp \
     > "artifacts/orca-connectivity/${RUN_ID}/tls/openssl_s_client_${UTC_TAG}.log" 2>&1
   ```
2. **curl -v (リクエスト/レスポンス)**  
   ```bash
   curl --verbose --show-error --cert-type P12 \
        --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
        -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
        -H 'Content-Type: application/json; charset=Shift_JIS' \
        -X POST --data-binary '@/tmp/orca_request.json' \
        "https://weborca.cloud.orcamo.jp${API_PATH}" \
        > "artifacts/orca-connectivity/${RUN_ID}/httpdump/${API_SLUG}/response.http" 2> \
        "artifacts/orca-connectivity/${RUN_ID}/httpdump/${API_SLUG}/request.http"
   ```
3. **ServerInfoResource**  
   ```bash
   curl -s -u sysad:****** http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn \
     > "artifacts/orca-connectivity/${RUN_ID}/logs/serverinfo_claim_conn_${UTC_TAG}.json"
   ```
4. **WildFly ログ抜粋**  
   ```bash
   docker compose -p legacy-vs-modern logs --since 20m server-modernized-dev \
     > "artifacts/orca-connectivity/${RUN_ID}/logs/server-modernized-dev_${UTC_TAG}.log"
   ```
5. **ヘッダー抜粋**  
   ```bash
   rg -n 'HTTP/|Allow:|WWW-Authenticate|Api_Result' \
     "artifacts/orca-connectivity/${RUN_ID}/httpdump/${API_SLUG}/response.http" \
     > "artifacts/orca-connectivity/${RUN_ID}/logs/http_404405_extract_${UTC_TAG}.log"
   ```

## 3. httpdump ディレクトリ
- API ごとに `httpdump/<api>/` を作成し、`request.http`（stderr に出力される curl -v ログ）と `response.http`（stdout）を保存。
- `trace/<api>.log` に `curl --trace-ascii` の出力を残して TLS ハンドシェイク／リトライを追跡。
- `tls/openssl_s_client_*.log` を参照して証明書エラー有無を確認する。

## 4. ドキュメント更新ポイント
1. **ログ台帳** `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へ RUN_ID、API、HTTP、`Allow`、`Api_Result`、証跡パスを追記。  
2. **Runbook** `operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.5（HTTP 401/403/404/405）へリンクし、原因と解決策をコメント。  
3. **DOC_STATUS** `docs/web-client/planning/phase2/DOC_STATUS.md` の ORCA 連携欄に RUN_ID と完了状態を記載。  
4. **PHASE2_PROGRESS** ORCA 課題欄へ RUN_ID、担当者、結果（例: `TorcaHttpLogZ2 405 継続, route 未公開`）を記載。

## 5. 報告テンプレ（Slack / メモ）
```
RUN_ID=<ID> / UTC=<UTC_TAG>
openssl: artifacts/.../tls/openssl_s_client_<UTC>.log
curl-v: artifacts/.../httpdump/<api>/{request,response}.http
serverinfo: artifacts/.../logs/serverinfo_claim_conn_<UTC>.json
wildfly: artifacts/.../logs/server-modernized-dev_<UTC>.log
extract: artifacts/.../logs/http_404405_extract_<UTC>.log
所見: <HTTP/Allow/Api_Result 要約>
Doc update: Runbook §4.5, logs/<date>, DOC_STATUS, PHASE2_PROGRESS
```

## 6. ドライラン実施テンプレ
1. **変数初期化**  
   ```bash
   export RUN_ID=20251120TorcaHttpLogZ9
   export UTC_TAG=DRYRUN000000Z
   mkdir -p artifacts/orca-connectivity/${RUN_ID}/{httpdump/sample,logs,tls}
   ```
2. **ダミー curl ログ**  
   - `tee artifacts/.../httpdump/sample/request.http <<'EOF'` で擬似的な `curl -v` ログを保存。
   - `cat <<'EOF' > artifacts/.../httpdump/sample/response.http` で 405 応答例を配置。
3. **抽出ログ**  
   ```bash
   rg -n '405|Method Not Allowed' artifacts/.../httpdump/sample/response.http \
     > artifacts/.../logs/http_404405_extract_${UTC_TAG}.log
   ```
4. **テンプレ README**  
   - `artifacts/orca-connectivity/handbook-dryrun/README.md` に RUN_ID, UTC, 取得ファイルを追記し、Slack テンプレと整合を確認。

## 7. 実運用チェックリスト（404/405 即応セット）
0. **RUN_ID 宣言** — Slack で `RUN_ID` と `UTC_TAG` を共有し、`artifacts/orca-connectivity/${RUN_ID}/` を初期化。
1. **openssl** — サーバー証明書やクライアント証明書エラーを先に確認。SNI や TLS バージョン不一致を特定する。
2. **curl -v** — `request.http`/`response.http` を保存し、`Allow` や `WWW-Authenticate` を確認。405 の場合は `Allow` に POST が含まれているかを即チェック。
3. **ServerInfoResource** — `claim.conn` が `server` 以外の場合はモダナイズ設定を先に修正。
4. **WildFly ログ** — `claim.logger` で HTTP レスポンスヘッダーと例外スタックを収集。
5. **抽出ログ** — `http_404405_extract_*.log` に抜粋をまとめ、Slack 報告へ貼付。
6. **報告** — §5 テンプレを用い、Runbook／PHASE2_PROGRESS／DOC_STATUS の更新状況を明記。

> 参考: `artifacts/orca-connectivity/20251119TorcaHttpLogZ1/`（本番接続で 405 を再現したログ一式）。
