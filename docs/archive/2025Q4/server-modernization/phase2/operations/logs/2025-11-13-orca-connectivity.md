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

## 5. RUN_ID=`20251114TorcaHttpLogZ1`（P0 API 404/405 証跡再取得）

- 実施日時: 2025-11-14 20:11 JST（UTC `20251114T111158Z`）
- 対象: `/api01rv2/patientgetv2`, `/orca14/appointmodv2`, `/api21/medicalmodv2`, `/orca11/acceptmodv2`
- 証跡: `artifacts/orca-connectivity/20251114TorcaHttpLogZ1/{tls,httpdump,trace,logs}/`
- 手順: `ORCAcertification/` から `ORCA_PROD_*` を export → `openssl s_client` → `curl --cert-type P12 --trace-ascii`（API ごとにテンプレ JSON を送信）→ `rg` で `Allow` 等を抽出。`ORCA_HTTP_404405_HANDBOOK.md` §0-§3 のチェックリストに従い `request.http` / `response.http` / `trace/*.log` を初期化した。
- 端末側ネットワークポリシー（approval policy=never × network access restricted）のため `weborca.cloud.orcamo.jp` が名前解決できず、HTTP 404/405 応答は未取得。DNS エラーも証跡として保存し、次回オンライン環境での再試行が必要。

### 5.1 取得結果

| 対象 | 期待状態 | 実測値 / 所見 |
| --- | --- | --- |
| TLS (`openssl s_client`) | CN=`*.cloud.orcamo.jp` の証明書鎖と TLSv1.2 を再確認し、`tls/openssl_s_client_<UTC>.log` へ保存。 | `openssl s_client -connect weborca.cloud.orcamo.jp:443` → `BIO_lookup_ex: system lib ... Name or service not known (errno=90)`。DNS 段階で失敗したためサーバー証明書の取得に至らず。一方でホスト OS（Windows PowerShell）から `Resolve-DnsName weborca.cloud.orcamo.jp` を実行すると `35.76.144.148` / `54.178.230.126` が即時に返ることを `artifacts/orca-connectivity/20251114TorcaHttpLogZ1/dns/resolve_dnsname_20251114T112555Z.log` へ採取済みであり、DNS 失敗は WSL 等ネットワーク制限端末に限定されることを確認。 |
| `/api01rv2/patientgetv2` | HTTP 404（Allow: GET）再現と `Allow` 抜粋。 | `curl: (6) Could not resolve host: weborca.cloud.orcamo.jp`。`httpdump/patientgetv2/request.http` に `curl --verbose` の DNS エラーを保存。Response/Allow ヘッダーは未取得。 |
| `/orca14/appointmodv2` | HTTP 405（Allow: OPTIONS, GET）再現。 | 同上 (`curl: (6)`), `httpdump/appointmodv2/` に DNS エラーを保存。 |
| `/api21/medicalmodv2` | HTTP 405 + `Api_Result` 抽出。 | 同上 (`curl: (6)`), `Allow` / `Api_Result` は得られず。`trace/medicalmodv2_<UTC>.log` に DNS 失敗ログのみ記録。 |
| `/orca11/acceptmodv2` | HTTP 405（Allow: OPTIONS, GET）再現。 | 同上 (`curl: (6)`), `httpdump/acceptmodv2/` に DNS 失敗を保存。 |

> メモ: `http_404405_extract_<api>_<UTC>.log` は空ファイルで作成済み。オンライン環境で再実行する際は同 RUN_ID を用いず、新規 RUN_ID を採番すること。

### 5.2 WSL DNS 恒久設定と疎通確認（2025-11-14 追記、RUN_ID=`20251114TorcaHttpLogZ1`）

1. Windows 側 `C:\\Users\\marug\\.wslconfig` に `[network] generateResolvConf = false` が定義されていることを確認し、WSL 再起動後も `/etc/resolv.conf` が自動再生成されない状態に維持した。
2. `cat /etc/resolv.conf` で自動生成コメントのみが残っていたため、`/mnt/c/Windows/System32/wsl.exe -u root` で `rm -f /etc/resolv.conf` → `printf 'nameserver 8.8.8.8\nnameserver 1.1.1.1\n' > /etc/resolv.conf` を実施し、手動で Google / Cloudflare DNS を設定した。`chattr +i /etc/resolv.conf` は `Operation not supported while reading flags`（WSL2 ext4.vhdx では不可）だったため、`.wslconfig` による自動生成停止と手動ファイル管理の組み合わせを必須手順として運用する。
3. DNS 解決ログは `artifacts/orca-connectivity/20251114TorcaHttpLogZ1/dns/` に保存した。
   - `nslookup_after_fix.log`: `Server: 8.8.8.8` / `Address: 8.8.8.8#53` を経由して `weborca.cloud.orcamo.jp → 35.76.144.148 / 54.178.230.126` を取得。
   - `dig_after_fix.log`: TTL=57 秒の A レコード 2 件を取得し、`SERVER: 8.8.8.8#53` と一致することを確認。
   - `ping_after_fix.log`: `ping -c 1 35.76.144.148` は ICMP 応答なし（100% packet loss）だったが、外部到達を判定する目的では `nslookup` / `dig` の応答を根拠とする。ICMP を遮断している可能性があるため、今後も ping 結果のみで到達可否を判断しない。
4. DNS 設定後に `curl --cert-type P12 --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" -u ... -I https://weborca.cloud.orcamo.jp/api/api01rv2/system01dailyv2` を再試行したが、`curl: (58) could not parse PKCS12 file ... mac verify failure`（`artifacts/.../httpdump/system01dailyv2/curl_head_after_fix.log`）で TLS 以前に失敗した。エラーは未解決の PKCS#12 パスフレーズ問題に起因しており、DNS 解決は `curl` 起動前の証明書読み込み段階とは切り離される。証跡には `curl` の進行バーと OpenSSL エラーを保存した。
5. 後続タスク: (a) PKCS#12 パス再収集、(b) `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §1 へ WSL `.wslconfig + /etc/resolv.conf` 前提の記載を追加済み、(c) `ORCA_HTTP_404405_HANDBOOK.md` §1.1 の DNS 前提にも同内容を追記済み。

<a id="task-c-phr-template"></a>

## 6. Task-C: PHR シーケンス証跡テンプレ（2025-11-14 追記）

- 参照: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md#431-phr-シーケンス証跡テンプレ` と `artifacts/orca-connectivity/TEMPLATE/phr-seq/README.md` を新規作成し、PHR-01〜11 のテスト観点（鍵管理→閲覧→Layer ID→画像→PHRContainer）と証跡保存ルールを整理した。
- RUN_ID: `RUN_ID=20251115TorcaPHRSeqZ1` を PHR シーケンス専用に確保。`scripts/orca_prepare_next_run.sh` 実行後に `artifacts/orca-connectivity/20251115TorcaPHRSeqZ1/phr-seq/` を展開し、`docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md` で進行状況と監査結果をまとめる。
- スケジュール: 2025-11-15 (土) 10:00 JST までに Phase-A/B（PHR-02/03/10 + PHR-01/04/05/08/09）の curl 証跡を採取し、Layer ID (PHR-06) は Layer Secrets チェック完了後の 2025-11-16 午後に移行。画像 (PHR-07) と Container (PHR-11) は Signed URL の依存確認待ちで、Pending 状態をテンプレ README の Checklist へ記載した。
- 週次レビュー: 2025-11-18 (火) 09:30 JST の ORCA 週次でテンプレ／監査チェックリストの承認を依頼予定。承認結果は本ログと `docs/web-client/planning/phase2/DOC_STATUS.md` W22 行「次回アクション」欄へ反映する。

### 6.1 PHR 連携テンプレ進捗

- 目的: 2025-11-14 ORCA 週次から PHR 系 API を即レビューできるよう、Runbook §4.3/§4.4・テンプレ・DOC_STATUS を同期させる。
- RUN_ID: `20251114TphrEvidenceZ1`（テンプレ専用）。`scripts/orca_prepare_next_run.sh 20251114TphrEvidenceZ1` → `cp -R artifacts/orca-connectivity/TEMPLATE/phr-seq artifacts/orca-connectivity/20251114TphrEvidenceZ1/` → `touch artifacts/orca-connectivity/20251114TphrEvidenceZ1/README.md` を実施。
- 参照: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md#431-phr-シーケンス証跡テンプレ` / `#44-weborca-クラウド接続2025-11-14-更新` (5)-(7)。

| RUN_ID | 手順 | 証跡パス | 備考 |
| --- | --- | --- | --- |
| `20251114TphrEvidenceZ1` | (1) `system01dailyv2/masterlastupdatev3/insuranceinf1v2` で serverinfo を取得 → (2) `phr-seq/10_key-management` に AccessKey API テンプレを配置 → (3) `phr-seq/20_view-text` 以下に PHR-01/04/05/08/09 の request/response を配置 → (4) `screenshots/phr-0X_response.png` を保存 → (5) `todo/PHR_OPEN_ITEMS.md` へ残課題を追記 | `artifacts/orca-connectivity/20251114TphrEvidenceZ1/phr-seq/`, `serverinfo/claim_conn.json`, `logs/phr_access_key.log`, `screenshots/` | 実測は未実行（テンプレ整備のみ）。証跡取得後は RUN_ID=`2025...TorcaPHRSeqZ#` へコピーし差し替える。 |

TODO（次の週次で実施）
1. `curl --cert-type P12` で PHR-02/03/10 を dry-run し、`httpdump/` に 401/403 を含む証跡を保存。
2. PHR-01/04/05/08/09 の `docSince/labSince` seed（`artifacts/orca-connectivity/seed/phr_sample_patient.sql`）を更新し、`logs/phr_labtest_summary.md` に想定件数を記載。
3. Layer ID（PHR-06）用の `X-Consent-Token` を `ORCAcertification/` から取り込み、Secrets 未設定時の fail-fast 例外を `wildfly/identityToken.log` に記録。
4. DOC_STATUS W22 行「主な変更」に `Task-C: PHR 証跡テンプレ整備 (RUN_ID=20251114TphrEvidenceZ1)` を追記し、`docs/managerdocs/PHASE2_ORCA_PHR_GAP_MANAGER_CHECKLIST.md` の Task-C チェックをオンにする。

### 6.2 Task-E Pending（Layer ID / 画像 / Container）

- **Layer ID (PHR-06)**: Vault `kv/modernized-server/phr/layer-id` へ `PHR_LAYER_ID_CLIENT_ID/SECRET/CERT_B64` を投入し、`ops/check-secrets.sh --profile phr-layer-id` が CI/Sandbox で 0 を返すことを 2025-11-17 18:00 JST までに確認。Ops 窓口: @OpsLead。未完なら RUN_ID=`20251115TorcaPHRSeqZ1` では 401 証跡のみ提出。
- **画像 (PHR-07)**: `ops/shared/docker/bandwidth-policy.properties` に `X-Image-Burst-Limit=200MB/5min`, `X-Image-Max-Size=5MB` を追加し、`Cache-Control: no-store` を Payara フィルタで強制する PR を 2025-11-17 15:00 JST までに OpsNetwork (@OpsNetwork) がレビュー。Evidence: `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md#5`。
- **Container (PHR-11)**: `kv/modernized-server/phr/container` の `PHR_SIGNING_KEY_ID/SECRET` / `PHR_SIGNING_KEY_TTL=300s` を OpsSec (@OpsSec) が登録し、`PHR_EXPORT_CONFIG` に `signedUrlIssuer=RESTEASY`, `allowedSchemes=https` を追記、`ops/check-secrets.sh --profile phr-export` が green になること。締切: 2025-11-18 09:30 JST（ORCA 週次）。
- **共有先**: Pending 状態・連絡先・証跡パスを ORCA 週次（2025-11-18）で配布する資料（Runbook §4.3.2 / DOC_STATUS / マネージャーチェックリスト）に展開。

## 7. Task-D: PHR Phase-A/B 実測証跡取得（2025-11-15 実施）

- RUN_ID: `20251115TorcaPHRSeqZ1`。テンプ レート初期化後に Phase-A/B（PHR-02/03/10 + PHR-01/04/05/08/09）を `curl --cert-type P12` で実行（期待値は `PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-key-management` / `#phase-view-apis` を参照）。
- 実測結果: 1回目（09:10 JST）は PKCS#12 パス不明で `curl exit=58`。Ops から `FJjmq/d7EP` を受領後、2回目（23:24 JST）は TLS 相互認証まで成功したが `/20/adm/phr/*` が WebORCA 側に存在せず全 API が HTTP 404（JSON or HTML）。`trace/` には両試行分のログを保存。
- ServerInfoResource: `curl http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn -u LOCAL.FACILITY.0001:dolphin` が `curl: (6) Could not resolve host`。`serverinfo/claim_conn.error` に証跡を保存。
- WildFly: `server/standalone/log/server.log` が存在せず `wildfly/phr_20251115TorcaPHRSeqZ1.log` に未取得の旨を記載。
- 証跡配置: `httpdump/<api>/request.http` へテンプレをコピーし、`response.http`/`status.txt`/`error.log` で `curl exit=58` を記録。`screenshots/phr-0X_*_placeholder.png` には 1x1 PNG を置き、pass 受領後に実測スクリーンショットへ差し替える運用とした。
- 詳細ログは `docs/server-modernization/phase2/operations/logs/2025-11-15-phr-seq-phaseAB.md` と `artifacts/orca-connectivity/20251115TorcaPHRSeqZ1/` を参照。

| API | Phase | 期待（PHR RE Plan） | 実測 | 証跡 |
| --- | --- | --- | --- | --- |
| PHR-02 `PUT /20/adm/phr/accessKey` | Phase-A | Key upsert 200/`PHR_ACCESS_KEY_UPSERT` | HTTP 404（HTML “The specified URL cannot be found.”）。 | `httpdump/phr02_accessKey/`, `trace/phr02_accessKey_trace.log` |
| PHR-03 `GET /.../accessKey/{key}` | Phase-A | suffix mask / Facility 403 | HTTP 404 JSON `{"Code":404,...}`。 | `httpdump/phr03_accessKey_lookup/` |
| PHR-10 `GET /.../patient/{patientId}` | Phase-A | 200/404 + `PHR_ACCESS_KEY_FETCH_BY_PATIENT` | HTTP 404 JSON。 | `httpdump/phr10_patient/` |
| PHR-01 `GET /abnormal/{patientId}` | Phase-B | UTF-8 / `docSince` / `PHR_ABNORMAL_TEXT` | HTTP 404 JSON。 | `httpdump/phr01_abnormal/` |
| PHR-04 `GET /allergy/{patientId}` | Phase-B | `PHR_ALLERGY_TEXT` | HTTP 404 JSON。 | `httpdump/phr04_allergy/` |
| PHR-05 `GET /disease/{patientId}` | Phase-B | `PHR_DISEASE_TEXT` | HTTP 404 JSON。 | `httpdump/phr05_disease/` |
| PHR-08 `GET /labtest/{patientId}` | Phase-B | `labSince` 判定 + `logs/phr_labtest_summary.md` | HTTP 404 JSON。 | `httpdump/phr08_labtest/` |
| PHR-09 `GET /medication/{patientId}` | Phase-B | `TouchMedicationFormatter` 置換 + `PHR_MEDICATION_TEXT` | HTTP 404 JSON。 | `httpdump/phr09_medication/` |

### 7.1 Blockers / Follow-up
1. **PKCS#12 パスフレーズ**: `ORCAcertification/新規 テキスト ドキュメント.txt` に pass 情報がない。Ops から共有されるまで Phase-A/B は 401/403 以前に停止。`todo/PHR_OPEN_ITEMS.md` に登録済み。
2. **Modernized Server 未起動**: `server-modernized-dev` が解決できず ServerInfoResource 不取得。Compose 起動後に `serverinfo/claim_conn.json` / `wildfly/phr_*.log` を採取し、`PHR_RESTEASY_IMPLEMENTATION_PLAN.md#phase-key-management` / `#phase-view-apis` に紐付く監査ログを更新する。
3. **スクリーンショット未取得**: 応答が無いため `screenshots/phr-0X_response.png` を空のまま保存。PKCS#12 pass 受領後に Phase-A/B の応答をキャプチャ。

### 7.2 次アクション（Task-D 継続分）
- Ops へ PKCS#12 pass をエスカレーションし、受領次第 `curl --cert-type P12` を再実行。新締切を Task-D 管理者に共有（提案: 2025-11-16 12:00 JST）。
- Modernized Compose を `docker compose -f docker-compose.modernized.dev.yml up` で起動 → `curl http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn` 取得 → `artifacts/.../serverinfo/claim_conn.json` へ保存。
- Pass 取得後は `logs/phr_access_key.log`, `logs/phr_labtest_summary.md` に Api_Result／件数を追記し、`docs/server-modernization/phase2/operations/logs/2025-11-15-phr-seq-phaseAB.md` をアップデート。

### 7.3 Task-F: PHR Phase-C/D/E 実測証跡取得（RUN_ID=`20251119TorcaPHRSeqZ1`, 締切 2025-11-19 10:00 JST）

- 実施日時: 2025-11-15 00:17 JST（環境: Codex WSL, `RUN_ID=20251119TorcaPHRSeqZ1`）。Phase-C: PHR-06 `POST /identityToken` → Phase-D: PHR-07 `GET /image/{patientId}` → Phase-E: PHR-11 `GET /{facilityId,patientId,docSince,labSince}` を `curl --cert-type P12` で再実施。
- 結果: PKCS#12 pass (`FJjmq/d7EP`) を再設定したため TLS/Basic 認証までは成功。ORCA 本番に `/20/adm/phr/*` が未開放のため PHR-06=HTTP 405、PHR-07=HTTP 404、PHR-11=HTTP 404。`httpdump/phr0{6,7,11}_*/{response.body,response.headers,status.txt}`、`trace/phr-0{6,7,11}_*.log`、`screenshots/phr-0X_*_response.png` を差し替えた。
- ServerInfoResource: Modernized Compose を起動し、`curl -H userName/password/facilityId` で `http://localhost:9080/openDolphin/resources/serverinfo/claim/conn` を取得（HTTP 200, body=`server`, traceId=`serverinfo-20251119TorcaPHRSeqZ1`）。`serverinfo/claim_conn.{headers,json,status}` と `wildfly/phr_20251119TorcaPHRSeqZ1.log` へ保存。
- スクリーンショット: `scripts/render_png_text.js` で HTTP ステータスと RUN_ID を描画した PNG を `screenshots/phr-06_identity_response.png` などに配置し、placeholder を廃止。

| API | Phase | 期待（PHR_RESTEASY_IMPLEMENTATION_PLAN） | 実測 | 証跡 |
| --- | --- | --- | --- | --- |
| PHR-06 `POST /20/adm/phr/identityToken` | Phase-C | Layer ID Secrets 連携・`PHR_LAYER_ID_TOKEN_ISSUE` 監査 | HTTP 405 (Method Not Allowed)。mTLS → ORCA まで到達。 | `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/httpdump/phr06_identityToken/`, `trace/phr-06_identityToken_trace.log`, `phr-seq/30_layer-id/identityToken/PHR-06_*` |
| PHR-07 `GET /20/adm/phr/image/{patientId}` | Phase-D | `Cache-Control: no-store` / 画像ストリーム + 帯域ログ | HTTP 404 (Not Found)。Schema 画像 API 未提供。 | `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/httpdump/phr07_image/`, `trace/phr-07_image_trace.log`, `phr-seq/40_image/image/PHR-07_*` |
| PHR-11 `GET /20/adm/phr/{facility,patient,docSince,labSince}` | Phase-E | Signed URL + `PHR_CONTAINER_FETCH` 監査 / Secrets Ready | HTTP 404 (Not Found)。Signed URL 生成未実装。 | `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/httpdump/phr11_container/`, `trace/phr-11_container_trace.log`, `phr-seq/50_container/container/PHR-11_*` |

**Pending / 改善点**
1. **Modernized REST への切替**: ORCA 直叩きでは 405/404 止まり。WildFly 側に PHR-06/07/11 を実装し、`d_audit_event` に `PHR_LAYER_ID_TOKEN_ISSUE`, `PHR_IMAGE_STREAM`, `PHR_CONTAINER_FETCH` を残す。
2. **監査テンプレ更新**: `audit/sql/PHR_*.sql` は 0 rows（ORCA 側イベントなし）。Modernized 実装後に traceId=`20251119TorcaPHRSeqZ1` で再採取し、`logs/phr_container_summary.md` へ TTL/Issuer/StorageType を記録。
3. **Runbook リンク**: §4.3.2 に「PKCS#12 成功 / HTTP 405/404 まで取得済 / Modernized で 200/403 を採取する」旨を追記済みか確認し、必要に応じて更新。

> Evidence: `artifacts/orca-connectivity/20251119TorcaPHRSeqZ1/`（httpdump/trace/serverinfo/wildfly/screenshots/audit/logs）。Runbook / DOC_STATUS / PHASE2_PROGRESS は本ログを参照して更新する。
