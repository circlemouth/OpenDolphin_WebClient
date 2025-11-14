# ORCA HTTP 404/405 トリアージ ワーカーハンドブック

> 2025-11-19 更新: 404/405 調査と CRUD 実測は **WebORCA トライアルサーバー**（`https://weborca-trial.orca.med.or.jp/`）＋ Basic 認証 `trial/weborcatrial` を前提とする。旧ローカル／weborca.cloud.orcamo.jp／`curl --cert-type P12` の手順はアーカイブ済み。

## 0. 参照資料とプレースホルダ
- 公式仕様: `docs/server-modernization/phase2/operations/assets/orca-api-spec/manifest.json` および `raw/*.md`（例: [`patientget`](../assets/orca-api-spec/raw/patientget.md)、[`appointmod`](../assets/orca-api-spec/raw/appointmod.md)、[`medicalmod`](../assets/orca-api-spec/raw/medicalmod.md)、[`acceptmod`](../assets/orca-api-spec/raw/acceptmod.md)）。
- Trial サーバーの資格情報・利用不可機能は `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` を参照する。Chrome（1024×768 以上）でアクセスし、「ユーザー trial / パスワード weborcatrial」のみを使用する。
- `RUN_ID` や証跡ディレクトリは以下で初期化する。Trial CRUD の場合は `trial/` サブフォルダを併設する。
  ```bash
  export RUN_ID={{RUN_ID}}
  export UTC_TAG=$(date -u +%Y%m%dT%H%M%SZ)
  export EVIDENCE_ROOT="artifacts/orca-connectivity/${RUN_ID}"
  mkdir -p "${EVIDENCE_ROOT}"/{httpdump,logs,tls,trace,trial}
  ```

## 1. RUN_ID / UTC_TAG 命名
- RUN_ID: `YYYYMMDDTorcaHttpLogZ#`（HTTP 404/405 調査）／`YYYYMMDDTorcaTrialCrudZ#`（Trial CRUD 実測）。
- UTC_TAG: `date -u +%Y%m%dT%H%M%SZ`（例: `20251119T150102Z`）。
- Evidence ルート: `artifacts/orca-connectivity/${RUN_ID}/`。Trial CRUD 証跡は `trial/<api>/` に保存する。

### 1.1 再疎通前提（RUN_ID 引用）
| 前提 | 内容 | RUN_ID / 証跡 |
| --- | --- | --- |
| Basic 認証と TLS | `curl -u trial:weborcatrial` の単独認証で疎通する。`openssl s_client -connect weborca-trial.orca.med.or.jp:443 -servername weborca-trial.orca.med.or.jp` と `curl -u trial:weborcatrial 'https://weborca-trial.orca.med.or.jp/api/system01dailyv2?class=01'` を実行し、`artifacts/orca-connectivity/<RUN_ID>/tls/openssl_s_client_<UTC>.log` と `httpdump/system01dailyv2/` を保存する。 | `RUN_ID=20251119TorcaHttpLogZ1`（予定） |
| Trial CRUD データ管理 | 追加した患者/受付/予約/入院情報は Trial UI で確認し、`docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` へ「新規登録／更新／削除 OK（Trial 限定）」のログを残す。`assets/seeds/*.sql` は参考アーカイブであり、実データ投入は行わない。 | `RUN_ID=20251119TorcaTrialCrudZ#`（所在: `artifacts/.../trial/`） |
| 接続先 | 404/405 調査も CRUD も `https://weborca-trial.orca.med.or.jp` を唯一の接続先とする。`API_PATH` の前に `/api` or `/orcaXX` を付け忘れない。Evidence は `artifacts/orca-connectivity/<RUN_ID>/httpdump/` に集約する。 | Trial 切替メモ: `docs/web-client/planning/phase2/DOC_STATUS.md` ORCA 行 |
| DNS 可用性 | `nslookup weborca-trial.orca.med.or.jp` で名前解決できることを確認し、WSL2 などでは `/etc/resolv.conf` を固定する。ログは `artifacts/.../dns/` へ保存し、`curl: (6)` の際は DNS 設定を報告する。 | 例: `artifacts/orca-connectivity/20251119TorcaHttpLogZ1/dns/nslookup.log` |
| CRUD ログ連携 | Trial CRUD を実施した RUN_ID は `ORCA_API_STATUS.md`、`PHASE2_PROGRESS.md`、`docs/web-client/planning/phase2/DOC_STATUS.md` の ORCA 節にも反映する。Evidence パスは `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` から辿れるようにする。 | `RUN_ID=20251119TorcaTrialCrudZ#` |

## 2. 標準取得コマンド
1. **openssl s_client**  
   ```bash
   openssl s_client -connect weborca-trial.orca.med.or.jp:443 \
     -servername weborca-trial.orca.med.or.jp \
     > "${EVIDENCE_ROOT}/tls/openssl_s_client_${UTC_TAG}.log" 2>&1
   ```
2. **curl -v (リクエスト/レスポンス)**  
   ```bash
   curl --verbose --show-error \
        -u trial:weborcatrial \
        -H 'Accept: application/json' \
        -H 'Content-Type: application/json; charset=Shift_JIS' \
        -X POST --data-binary '@/tmp/orca_request.json' \
        "https://weborca-trial.orca.med.or.jp${API_PATH}" \
        > "${EVIDENCE_ROOT}/httpdump/${API_SLUG}/response.http" 2> \
        "${EVIDENCE_ROOT}/httpdump/${API_SLUG}/request.http"
   ```
3. **ServerInfoResource**  
   ```bash
   curl -s -u sysad:****** \
     http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn \
     > "${EVIDENCE_ROOT}/logs/serverinfo_claim_conn_${UTC_TAG}.json"
   ```
4. **WildFly ログ抜粋**  
   ```bash
   docker compose -p legacy-vs-modern logs --since 20m server-modernized-dev \
     > "${EVIDENCE_ROOT}/logs/server-modernized-dev_${UTC_TAG}.log"
   ```
5. **ヘッダー抜粋**  
   ```bash
   rg -n 'HTTP/|Allow:|WWW-Authenticate|Api_Result' \
     "${EVIDENCE_ROOT}/httpdump/${API_SLUG}/response.http" \
     > "${EVIDENCE_ROOT}/logs/http_404405_extract_${UTC_TAG}.log"
   ```

## 3. httpdump ディレクトリ
- API ごとに `httpdump/<api>/` を作成し、`request.http`（stderr に出力される `curl -v` ログ）と `response.http`（stdout）を保存する。
- `trace/<api>.log` に `curl --trace-ascii` の出力を残し、TLS ハンドシェイクやリトライを追跡する。
- Trial CRUD の場合は `trial/<api>/` に実際の POST/PUT/DELETE リクエストと UI スクリーンショットリンクを書いた `README.md` を配置する。

## 4. ドキュメント更新ポイント
1. **ログ台帳** `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へ RUN_ID、API、HTTP、`Allow`、`Api_Result`、証跡パスを追記。
2. **Runbook** `operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.5（HTTP 401/403/404/405）へリンクし、原因と解決策をコメント。
3. **DOC_STATUS** `docs/web-client/planning/phase2/DOC_STATUS.md` ORCA 行へ `Trial 切替＋CRUD 許可 (2025-11-19)` を記載し、各 RUN_ID を同期。
4. **PHASE2_PROGRESS** ORCA 課題欄へ RUN_ID、担当者、結果（例: `TorcaTrialCrudZ1 予約 POST 200`）を記載。
5. **ORCA_API_STATUS** で API ごとの Trial 実測／CRUD 手順を更新し、旧 `Allow: GET` 記述を排除する。

## 5. 報告テンプレ（Slack / メモ）
```
RUN_ID=<ID> / UTC=<UTC_TAG>
openssl: artifacts/.../tls/openssl_s_client_<UTC>.log
curl-v: artifacts/.../httpdump/<api>/{request,response}.http
serverinfo: artifacts/.../logs/serverinfo_claim_conn_<UTC>.json
wildfly: artifacts/.../logs/server-modernized-dev_<UTC>.log
extract: artifacts/.../logs/http_404405_extract_<UTC>.log
trial (if CRUD): artifacts/.../trial/<api>/README.md
所見: <HTTP/Allow/Api_Result or CRUD 結果>
Doc update: Runbook §4.5, logs/<date>, DOC_STATUS, PHASE2_PROGRESS, ORCA_API_STATUS
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
1. **openssl** — Trial ホストのサーバー証明書と TLS ハンドシェイクを確認。SNI ずれや TLS バージョン不一致を特定。
2. **curl -v** — `request.http`/`response.http` を保存し、`Allow` や `WWW-Authenticate` を確認。405 の場合は `Allow` に POST が含まれているか即チェック。
3. **ServerInfoResource** — `claim.conn` が `server` 以外の場合はモダナイズ設定を先に修正。
4. **WildFly ログ** — `claim.logger` で HTTP レスポンスヘッダーと例外スタックを収集。
5. **抽出ログ** — `http_404405_extract_*.log` に抜粋をまとめ、Slack 報告へ貼付。
6. **Trial CRUD (必要時)** — §8 のログテンプレに沿って書き込み操作を行い、UI で確認して Evidence を保存。
7. **報告** — §5 テンプレを用い、Runbook／PHASE2_PROGRESS／DOC_STATUS／ORCA_API_STATUS の更新状況を明記。

<a id="trial-crud-logging"></a>
## 8. Trial CRUD logging
1. **操作粒度** — API 名、`Request_Number`/`class`、実行目的（新規・更新・削除）を明記する。
2. **証跡** — `artifacts/orca-connectivity/${RUN_ID}/trial/<api>/` に `request.http`、`response.http`、`ui.md`（スクリーンショットリンク）を配置。
3. **ログファイル** — `docs/server-modernization/phase2/operations/logs/2025-11-19-orca-trial-crud.md` へ以下テンプレで追記。
   ```markdown
   - RUN_ID: 20251119TorcaTrialCrudZ1 / API: /orca14/appointmodv2 (class=01)
     - 操作: 予約新規登録 → UI で確認後 DELETE 実施
     - Evidence: artifacts/orca-connectivity/20251119TorcaTrialCrudZ1/trial/orca14_appointmodv2/
     - 後片付け: UI から該当予約を削除済み（UTC=...）
   ```
4. **反映先** — CRUD を実行したら `ORCA_API_STATUS.md` の該当行に RUN_ID を追記し、`PHASE2_PROGRESS.md` と `DOC_STATUS.md` の週次テーブルへ同じ RUN_ID を記録する。

## 9. ORCA サポート問い合わせ（任意）
- 404/405 調査と CRUD 実測は Trial 環境で自己完結させる。ルート開放依頼や WebORCA 本番環境への接続申請は行わない。
- どうしてもベンダー確認が必要な場合のみ過去のテンプレ（`questions/RECEIPT_ROUTE_REQUEST.md`）を参照し、`artifacts/orca-connectivity/<RUN_ID>/httpdump/` の証跡を添付して報告する。その際も Trial での再現結果とログをセットで共有する。
