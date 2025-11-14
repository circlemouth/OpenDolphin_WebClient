# ORCA HTTP 404/405 トリアージ ワーカーハンドブック

> 2025-11-14 更新: ローカル WebORCA コンテナではなく WebORCA クラウド本番（`https://weborca.cloud.orcamo.jp:443`）を対象とする。旧ローカル手順はアーカイブ済み。

## 0. 参照資料とプレースホルダ
- 公式仕様は `docs/server-modernization/phase2/operations/assets/orca-api-spec/manifest.json` および `raw/*.md`（例: [`patientget`](../assets/orca-api-spec/raw/patientget.md)、[`appointmod`](../assets/orca-api-spec/raw/appointmod.md)、[`medicalmod`](../assets/orca-api-spec/raw/medicalmod.md)、[`acceptmod`](../assets/orca-api-spec/raw/acceptmod.md)）を根拠とする。
- リクエスト雛形は `../assets/orca-api-requests/` 配下（`01_patientgetv2_request.json` など）を用いる。
- 認証情報は `ORCAcertification/` に平文で集約している。`103867__JP_u00001294_client3948.p12`（PKCS#12）と `新規 テキスト ドキュメント.txt`（接続 URL / port / Basic 認証 / API キー / PKCS#12 パスフレーズ）を参照し、値をそのまま `ORCA_PROD_*` へ export する。再暗号化やサポート問い合わせは不要。
  - `ORCAcertification/README_PASSPHRASE.md` にファイル構成と読み取り手順を整理した。特に PKCS#12 のパスフレーズは `sed -n '5p' ... | tr -d '\r\n'` で取得し、`curl --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}"` 形式で渡す。
- `RUN_ID` や証跡ルートは以下のプレースホルダで宣言してから操作を開始する。`{{RUN_ID}}` は実行時の ID へ差し替える。
  ```bash
  export RUN_ID={{RUN_ID}}
  export UTC_TAG=$(date -u +%Y%m%dT%H%M%SZ)
  export EVIDENCE_ROOT="artifacts/orca-connectivity/${RUN_ID}"
  mkdir -p "${EVIDENCE_ROOT}"/{httpdump,logs,tls,trace}
  ```

## 1. RUN_ID / UTC_TAG 命名
- RUN_ID: `YYYYMMDDTorcaHttpLogZ#`（例: `20251120TorcaHttpLogZ2`）。本番疎通ログは `TorcaProdCertZ#` としてもよいが、404/405 調査は `TorcaHttpLogZ#` で統一。
- UTC_TAG: `date -u +%Y%m%dT%H%M%SZ` で取得（例: `UTC_TAG=20251120T031500Z`）。
- Evidence ルート: `artifacts/orca-connectivity/${RUN_ID}/`。`logs/`, `httpdump/`, `trace/`, `tls/` を配下に作成する。

### 1.1 再疎通前提（RUN_ID 引用）
logs/2025-11-13-orca-connectivity.md（RUN_ID=`20251113TorcaProdCertZ1`）と `PHASE2_PROGRESS.md` W18/W21 記述を根拠に、再疎通前の必須条件を整理した。

| 前提 | 内容 | RUN_ID / 証跡 |
| --- | --- | --- |
| TLS / Basic 認証と証跡 | `ORCAcertification/103867__JP_u00001294_client3948.p12` と同ディレクトリの Basic 情報を `ORCA_PROD_CERT*` / `ORCA_PROD_BASIC_*` へ取り込み、`curl --cert-type P12` を使う（`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` §1-2, RUN_ID=`20251113TorcaProdCertZ1`）。取得物は `artifacts/orca-connectivity/20251113TorcaProdCertZ1/weborca-prod/` に保存済み。以後も 600 権限と `unset ORCA_PROD_*` を徹底する。 | `RUN_ID=20251113TorcaProdCertZ1`（logs/2025-11-13-orca-connectivity.md） |
| 医師 / 受付 seed | `PHASE2_PROGRESS.md` W18（RUN_ID=`20251113TorcaP0OpsZ1`）で `acceptlstv2` が `Api_Result=13`（ドクタ未登録）になったため、W21（RUN_ID=`20251113TorcaP0OpsZ2`）で `Physician_Code=00001` を投入済み。医師・受付ダミーを維持し、`system01lstv2`/`acceptlstv2` の JSON を `artifacts/orca-connectivity/20251113T012013Z/P0_retry/` へ保存した流れを再現する。必要に応じて `RUN_ID=20251113TorcaDoctorManualW60` の seed 手順を参照する。 | `PHASE2_PROGRESS.md` W18/W21（RUN_ID=`20251113TorcaP0OpsZ1/Z2`） |
| 接続先（WebORCA 本番） | ルート開放は WebORCA 本番環境ですでに完了している。以降は `https://weborca.cloud.orcamo.jp:443` を唯一の接続先とし、`curl --cert-type P12` で直接検証する。追加のサポート問い合わせは不要。差異を確認したら `artifacts/orca-connectivity/<RUN_ID>/httpdump/` に証跡を保存する。 | `RUN_ID=20251113TorcaProdCertZ1` 以降の httpdump |
| DNS 可用性 | 事前にホスト OS から `Resolve-DnsName weborca.cloud.orcamo.jp`（または `nslookup`）を実行し、外部 DNS で名前解決できるネットワークであることを確認する。特に WSL2 では Windows 側 `.wslconfig` に `generateResolvConf=false` を設定したうえで `/etc/resolv.conf` を手動管理（例: `nameserver 8.8.8.8` / `1.1.1.1`）しないと再起動時に DNS が社内トンネルへ戻り `curl: (6)` を誘発する。設定後は `nslookup`/`dig`/`ping` のログを `artifacts/orca-connectivity/<RUN_ID>/dns/` へ保存し、必要に応じて `httpdump/system01dailyv2/` に `curl -I` の結果も残す。 | 例: `artifacts/orca-connectivity/20251114TorcaHttpLogZ1/dns/{nslookup_after_fix,dig_after_fix}.log`（WSL）＋ `ping_after_fix.log`（ICMP 応答なしだが DNS 解決成功） |

## 2. 標準取得コマンド
`manifest.json` と `raw/*.md` に従い、JSON 系 API では `Content-Type: application/json; charset=Shift_JIS`／`Accept: application/json`、XML 系では `Content-Type: application/xml; charset=UTF-8`／`Accept: application/xml` を必ず送る。全リクエストは HTTP Basic（`-u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}"`）とクライアント証明書で認証する。
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
        -H 'Accept: application/json' \
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

## 8. ORCA サポート問い合わせ（任意）
- 404/405 は WebORCA 本番で再現しながら自己閉ループで解析する。ルート開放依頼は不要であり、`questions/RECEIPT_ROUTE_REQUEST.md` は過去の記録としてのみ保管する。
- どうしてもベンダー確認が必要になった場合のみテンプレを参照し、Slack には「Support escalation (任意)」として記録する。その際も `artifacts/orca-connectivity/<RUN_ID>/httpdump/` の証跡を必ず添付する。
