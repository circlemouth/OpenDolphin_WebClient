# ORCA 接続検証タスクリスト

- 作成日: 2025-11-14（2025-11-12 版から WebORCA クラウド本番への直接接続手順へ更新）
- 対象: `https://weborca.cloud.orcamo.jp:443` で提供される WebORCA クラウド本番と、`docker-compose.modernized.dev.yml`（または `scripts/start_legacy_modernized.sh`）で起動するモダナイズ版 OpenDolphin サーバー。
- 目的: ORCA の本番環境を用いた疎通・API 呼び出しを標準化し、証跡／資格情報の取り扱いを `ORCAcertification/` 配下に集約する。
- 参照: [ORCA API 公式仕様](https://www.orca.med.or.jp/receipt/tec/api/overview.html) / [オフラインコピー](assets/orca-api-spec/README.md) / [技術情報ハブ（帳票・CLAIM・MONTSUQI 等）](assets/orca-tec-index/README.md)

> **方針**: ORCA 連携は Modernized サーバー × 新 Web クライアントの業務フロー維持を唯一の目的とし、ローカル Docker コンテナでの WebORCA 再現は廃止した。Legacy サーバーは比較用の read-only 参照に限る。
>
> **成果物**
> 1. `docs/server-modernization/phase2/operations/logs/<YYYYMMDD>-orca-connectivity.md` に RUN_ID／所見／使用証跡を追記。
> 2. `artifacts/orca-connectivity/<UTC>/` に `curl --cert-type P12` のリクエスト・レスポンス（ヘッダー/本文）と `ServerInfoResource` 結果、`openssl s_client` ログを保存。
> 3. `docs/web-client/planning/phase2/DOC_STATUS.md` の ORCA 連携欄を Active に更新し、後続担当へ必要な証跡パスを共有。

## 1. スコープと前提条件

| 項目 | 内容 |
| --- | --- |
| WebORCA 接続先 | `https://weborca.cloud.orcamo.jp:443`（CN=`*.cloud.orcamo.jp`）。`ORCAcertification/` 配下の PKCS#12 をクライアント証明書として使用し、TLS 相互認証＋Basic 認証でアクセスする。 |
| 認証情報 | `ORCAcertification/103867__JP_u00001294_client3948.p12` と `ORCAcertification/新規 テキスト ドキュメント.txt`（ORCAMO ID, API キー, PKCS#12 パスフレーズを平文で格納）。ファイルの値をそのまま `ORCA_PROD_*` へ export し、作業後は必ず `unset ORCA_PROD_*`。 |
| モダナイズ版サーバー | `opendolphin-server-modernized-dev`（WildFly 27）。`ops/shared/docker/custom.properties` および `ops/modernized-server/docker/custom.properties` に `claim.host=weborca.cloud.orcamo.jp` / `claim.send.port=443` / `claim.conn=server` / `claim.send.encoding=MS932` を設定し、`claim.scheme=https`（または `claim.useSsl=true`）を有効化してから再ビルドする。 |
| ネットワーク | 作業端末から `weborca.cloud.orcamo.jp:443` への outbound HTTPS が許可されていること。社内ネットワークで制限されている場合は VPN または許可済みホストへ切り替える。|
| DNS | 作業開始前にホスト OS で `Resolve-DnsName weborca.cloud.orcamo.jp`（Windows）や `nslookup`/`dig` を実行し、A レコード（例: `35.76.144.148`, `54.178.230.126`）を取得できることを確認する。WSL2 を利用する場合は Windows 側 `.wslconfig` に `generateResolvConf=false` を追加し、WSL 内では `/etc/resolv.conf` を手動管理（例: `nameserver 8.8.8.8` と `1.1.1.1` を記述）する。`chattr +i` がサポートされない環境でも `.wslconfig` による自動生成停止で上書きを防ぎ、`artifacts/orca-connectivity/<RUN_ID>/dns/` へ `nslookup`/`dig`/`ping` 証跡を保存する。 |
| データ | WebORCA 本番の実データが返却されるため、参照系 API のみ実行し、登録/更新/削除 API は禁止。必要に応じて `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` の RUN_ID 証跡を参照する。 |

## 2. 実施フロー概要

1. **資格情報の読み込み**: `ORCAcertification/` の証明書・ID・API キーを確認し、端末ローカルで `chmod 700/600` を維持したまま `ORCA_PROD_*` 環境変数へ読み込む。
2. **モダナイズ版サーバー設定**: `claim.*` 系プロパティを WebORCA クラウド向けに更新し、`ServerInfoResource` で `claim.conn=server` を取得できるようにする。
3. **接続確認**: `curl --cert-type P12` で `/api/api01rv2/system01dailyv2` など read-only API を実行し、HTTP 200 / `Api_Result=00` を証跡化。
4. **API 検証**: P0（patient, accept, appoint）から順に `node scripts/tools/orca-curl-snippets.js` の出力を使って実行し、`artifacts/orca-connectivity/<UTC>/P0_*` へ保存。必要に応じて P1 以降も追加。
5. **結果整理**: `PHASE2_PROGRESS.md` の ORCA 欄と `docs/web-client/planning/phase2/DOC_STATUS.md` を更新し、失敗時は `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` のエスカレーション手順に従う。

## 3. 準備チェックリスト

### 3.1 ORCAcertification インベントリ

| ファイル | 目的 | 作業メモ |
| --- | --- | --- |
| `103867__JP_u00001294_client3948.p12` | WebORCA クラウド向けクライアント証明書 (PKCS#12) | `chmod 600` を維持し、作業端末以外へコピーしない。必要時のみ `security delete-certificate`（macOS）等で Keychain へ一時登録。 |
| `新規 テキスト ドキュメント.txt` | 接続 URL／ポート／ORCAMO ID／API キー／PKCS#12 パスフレーズ（平文） | 内容は秘匿扱い。暗号化せずに保管されているため、閲覧後は速やかに `export ORCA_PROD_CERT_PASS='<値>'` へ反映し、ファイル自体は閉じる。 |
| `使用目的不明：使用停止/ORCA 証明証パスワード.txt` など | PKCS#12 パスフレーズ | 一時的に `ORCA_PROD_CERT_PASS` へ読み込んだら `history -d` で痕跡を削除し、作業終了後に `unset`。 |

```bash
export ORCA_PROD_CERT=ORCAcertification/103867__JP_u00001294_client3948.p12
export ORCA_PROD_CERT_PASS="$(cat ORCAcertification/使用目的不明：使用停止/ORCA\ 証明証パスワード.txt)"
export ORCA_PROD_BASIC_USER="$(rg -o 'ORCAMO ID:(.*)' -r '$1' ORCAcertification/'新規 テキスト ドキュメント.txt' | tr -d ' ')"
export ORCA_PROD_BASIC_KEY="$(rg -o 'APIキー:(.*)' -r '$1' ORCAcertification/'新規 テキスト ドキュメント.txt' | tr -d ' ')"
```

> `rg` が利用できない環境では `awk -F ':' '/APIキー/{print $2}' ...` でも可。読み込んだ値は `set +o history` 状態で扱う。

### 3.2 モダナイズ版サーバー設定

- `ops/shared/docker/custom.properties` / `ops/modernized-server/docker/custom.properties` / `ops/shared/docker/custom-secret.properties` の各 `claim.*` を以下へ揃える。差分は Evidence に保存し、`ServerInfoResource` の結果と一緒に提出する。
  - `claim.conn=server`
  - `claim.host=weborca.cloud.orcamo.jp`
  - `claim.send.port=443`
  - `claim.scheme=https`（または `claim.useSsl=true`）
  - `claim.send.encoding=MS932`
- `docker compose`（または `scripts/start_legacy_modernized.sh`）でモダナイズ側を再起動し、`/serverinfo/claim/conn` が `server` へ戻ることを確認。Legacy サーバーは必要に応じて read-only で並行起動する。

### 3.3 ネットワークとクライアント端末

- `dig weborca.cloud.orcamo.jp` / `openssl s_client -connect weborca.cloud.orcamo.jp:443 -servername weborca.cloud.orcamo.jp` を実行し、アウトバウンド HTTPS が許可されていることを確認。証跡は `artifacts/orca-connectivity/<UTC>/tls/openssl_s_client.log` などへ保存。
- プロキシ越しの場合は `HTTPS_PROXY`／`NO_PROXY` を環境変数で定義し、`curl` が証明書を提示できるか `curl --verbose --cert ... --head` で検証する。
- 作業 PC 上の `~/.curlrc` に余計な `insecure` や `proxy` が残っていないかを確認。競合がある場合は一時的に別 `curlrc` を使用する。

### 3.4 CLI ツールとテンプレ

| ツール | 目的 | コマンド例 |
| --- | --- | --- |
| `node scripts/tools/orca-curl-snippets.js` | API ごとの curl コマンド生成 | `ORCA_BASE_URL=https://weborca.cloud.orcamo.jp ORCA_CERT=${ORCA_PROD_CERT} ORCA_CERT_PASS=${ORCA_PROD_CERT_PASS} node scripts/tools/orca-curl-snippets.js --scenario p0` |
| `ops/tools/send_parallel_request.sh` | Modernized サーバー経由の API 呼び出しを再現 | `PARITY_OUTPUT_DIR=artifacts/orca-connectivity/<UTC>/parallel ./ops/tools/send_parallel_request.sh --profile modernized-orca` |
| `curl --cert-type P12` | 直接 API 実行・ヘッダー採取 | `curl --cert-type P12 --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" ...` |

PKCS#12／Basic の読み取り手順は `ORCAcertification/README_PASSPHRASE.md` に集約した。特にパスフレーズは `sed -n '5p' ORCAcertification/'新規 テキスト ドキュメント.txt' | tr -d '\r\n'` で取得し、`--cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}"` に必ず埋め込む。

テンプレ Evidence は `artifacts/orca-connectivity/TEMPLATE/` を `cp -R` してから実施し、`README.md` に実行条件を追記する。

`docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/` には No.19-38（入院・保険・会計）の UTF-8 テンプレを配置した。`RUN_ID={{YYYYMMDD}}TorcaProdCertZ1` のように採番したうえで、例えば入院患者一覧（#21）は以下のように収集する。

```bash
API_ID=21_tmedicalgetv2
mkdir -p "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}"
curl --cert-type P12 \
     --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
     -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
     -H 'Content-Type: application/xml; charset=UTF-8' \
     -H 'Accept: application/xml' \
     --data-binary @docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/${API_ID}_request.xml \
     'https://weborca.cloud.orcamo.jp/api/api01rv2/tmedicalgetv2' \
     -D "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}/response.headers" \
     -o "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}/response.xml" \
     --trace-ascii "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}/trace.log"
```

`artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` には `request.xml` / `response.xml` / `trace.log` を揃え、`notes/orca-api-field-validation.md` §3 の seed 記録（現在は参照専用・追加投入禁止）とリンクさせる。

### 3.5 監査・権限チェック

- PKCS#12 と Basic 情報は作業者ローカルのみで保持し、リポジトリやログへ貼り付け禁止。
- `history` に資格情報が残った場合は `history -d <line>` で削除し、シェル終了時に `unset ORCA_PROD_*` を実行。
- `artifacts/` へ保存する際はキー・パスフレーズをマスクし、必要に応じて `<SECRET>` プレースホルダを記載。
- 入院 API のリクエスト/レスポンスは `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` へ集約し、患者 ID・保険者番号など PHI は `mask.txt` に置換ルールを添えてから共有する（`git add` 禁止で artifacts のまま保存）。

> **運用メモ（2025-11-14 更新）**  
> WebORCA 本番に対しては既存データの読み取り・照会のみを行い、新規患者・予約・会計データの seed 挿入やローカル WebORCA コンテナの再構築は実施しない。対象データが欠落している場合は Runbook §4.3 と `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へ「欠落記録」を残し、Ops/マネージャー報告に切り替える。

### 3.6 Push／帳票／患者メモの追加準備（参照専用）

| 対象 API | 追加で必要なもの | 補足 |
| --- | --- | --- |
| `/api01rv2/pusheventgetv2` / `/orca42/receiptprintv3` | push-exchanger（帳票通知受信）、`/blobapi` 参照権限、既存の `print002` 通知記録 | `manifest.json` No.41/42。通知が存在しない場合は seed を追加せず、Ops へ運用調整を依頼する。照会できたイベントのみ `artifacts/orca-connectivity/<RUN_ID>/push/` へ保存。 |
| `/orca51/masterlastupdatev3` / `/api01rv2/insuranceinf1v2` | `system01dailyv2` 証跡テンプレと同一。既存キャッシュで十分かを確認 | TTL 測定のため `system01dailyv2` → `masterlastupdatev3` → `insuranceinf1v2` の順番で 1 回ずつ実行する。欠落マスタは seed ではなく Ops 連携で復旧可否を判断。 |
| `/api01rv2/patientlst7v2` / `/orca06/patientmemomodv2` | ORCA UI で既に登録されている患者メモ、`Memo_Mode` / `Memo_Class` の制約整理 | `patientmemomodv2` は POST 禁止（405）のため取得のみ先行。メモが存在しなくても seed で補完せず、`notes/orca-api-field-validation.md` §3.3 とログへ欠落情報を記録する。 |
| `/orca31/hspmmv2` / `/orca31/hsacctmodv2` | 既存の入院会計データと `Perform_Month` の参照結果 | `logs/2025-11-13-orca-connectivity.md` の `uncertain-api/` に 405 証跡のみ存在。入院データが存在しない場合は `seed SQL` に頼らず「データ欠落」として報告し、Ops に復旧可否を確認する。 |

> これらの API は `orca-api-matrix` No.39-53 に含まれている。RUN_ID を採番したら `notes/orca-api-field-validation.md` §3 と `ORCA_API_STATUS.md` §2.4 に反映すること（seed 参照は履歴としてのみ扱う）。

No.19-38 で作成した XML テンプレの証跡は `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` 以下にまとめ、Push/帳票/患者メモ系は `push/` や `memo/` サブディレクトリと同じ粒度で保持する。`notes/orca-api-field-validation.md` §3 の seed 行は「過去に想定したデータ条件」の記録として残し、実運用では欠落状況と証跡パスのみを追記する。

## 4. 検証フェーズ

### 4.1 TLS/BASIC ハンドシェイク

1. `artifacts/orca-connectivity/<UTC>/weborca-prod/` を作成。
2. `curl` で `/api/api01rv2/system01dailyv2` を実行し、リクエスト・レスポンス双方を保存する。

```bash
mkdir -p "artifacts/orca-connectivity/${RUN_ID}/weborca-prod"
curl --silent --show-error --cert-type P12 \
     --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
     -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
     -H 'Content-Type: application/json; charset=Shift_JIS' \
     -X POST \
     --data-binary '@/tmp/system01dailyv2_request.json' \
     'https://weborca.cloud.orcamo.jp/api/api01rv2/system01dailyv2?class=00' \
     -D "artifacts/orca-connectivity/${RUN_ID}/weborca-prod/system01dailyv2.headers" \
     -o "artifacts/orca-connectivity/${RUN_ID}/weborca-prod/system01dailyv2.json"
```

3. `Api_Result=00` を確認し、`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に結果を記載。

### 4.2 ServerInfoResource による `claim.conn` 確認

- Modernized サーバーが WebORCA クラウドへリーチできる状態で `curl http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn -u <admin>` を実行し、レスポンス JSON を `artifacts/.../serverinfo_claim_conn.json` に保存。
- `claim.conn=server` 以外（例: `fail`）が返った場合は `ops/shared/docker/custom.properties` と `ops/modernized-server/docker/custom.properties` の `claim.*` 差分を `diff -u` で取得し Evidence へ添付。

### 4.3 P0/PHR API セット

`RUN_ID=20251113TorcaP0OpsZ1/Z2`（`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md`）では #1-#4 が 404/405、`RUN_ID=20251113TorcaProdCertZ1` で `acceptlstv2` が HTTP 200 (`Api_Result=21→00`) となった。一方 `RUN_ID=20251114TorcaHttpLogZ1` は WSL 側 DNS 制限で `curl: (6) Could not resolve host` → `Allow` ヘッダー未採取に終わっている。次回は `C:\Users\<user>\.wslconfig` の `generateResolvConf=false` 設定と `/etc/resolv.conf` の手動管理を前提に、Windows 側の PowerShell もしくは VPN 許可済み Linux ホストで再取得する。PHR 系 API（PHR-01〜11）は RUN_ID=`20251114TphrEvidenceZ1` をテンプレ RUN として扱い、P0 API と同じ成果物構造（`httpdump/`, `trace/`, `logs/`, `serverinfo/` 等）で保存する。

> **2025-11-15 運用更新**
> - WebORCA 本番は日常診療で常時稼働しているため、API もしくは UI から既存データを参照できれば RUN の前提条件を満たすとみなす。新たな seed 注入や UI 強制登録は行わない。
> - RUN 着手前に `psql`（読み取り専用）、ORCA UI、既存 API を用いて患者 00000001、医師 00001、保険 06123456、当日受付/直近予約/診療行為など対象データが存在するかを確認し、結果を `artifacts/orca-connectivity/<RUN_ID>/data-check/` へ保存する。
> - 必須データが欠落していた場合は seed 投入を諦め、欠落テーブルと確認日時を `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` と `DOC_STATUS.md` モダナイズ/外部連携行に追記して Ops/マネージャーへ報告する。

| # | エンドポイント | 目的 | 成功条件 | 保存ファイル | 次回 RUN_ID | データ確認ポイント | 証跡保存パス | 想定課題 |
|---|---|---|---|---|---|---|---|---|
| 1 | `POST /api01rv2/patientgetv2` | 患者基本情報参照 | HTTP 404 を再取得して `Allow: GET` を記録（ORCA 本番では GET 未公開のため NG 証跡がゴール） | `P0_patientgetv2/request.http` / `response.http` | `20251115TorcaPatient404Z1` | なし（GET 404 の再現のみ） | `artifacts/orca-connectivity/20251115TorcaPatient404Z1/httpdump/patientgetv2/` | DNS/PKCS#12 読み込みが途切れると 404 以前に `curl: (6)/(58)` で停止するため、WSL DNS fix と `ORCA_PROD_CERT_PASS` の再確認必須 |
| 2 | `POST /api01rv2/appointlstv2` | 予約一覧参照 | HTTP 200 / `Api_Result=00` / `Appointment_Information[]` に予約が並ぶ | `[RUN_ID=20251115TorcaAppointLstZ1] httpdump/appointlstv2/{request,response}.http`、`trace/appointlstv2_trace.log`、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#appointlstv2`（ServerInfoResource=claim.conn=server を同 RUN_ID で記録） | `20251115TorcaAppointLstZ1` | 予約照会 API もしくは ORCA UI で Department=01 / Physician=00001 の最新予約が存在することを確認し、スクリーンショットや `SELECT` 結果を `data-check/appointlstv2.*` として保存。欠落時は seed 投入を行わず報告して RUN を保留。 | `artifacts/orca-connectivity/20251115TorcaAppointLstZ1/httpdump/appointlstv2/` `artifacts/.../trace/appointlstv2_*.log` | `appointmodv2` が 405 のため API で新規予約は作れない。既存予約の日付・担当医がリクエストと一致するかを RUN 前に点検する |
| 3 | `POST /api01rv2/acceptlstv2` | 当日受付参照 | HTTP 200 / `Api_Result=00`（受付なしは `Api_Result=21`） | `[RUN_ID=20251115TorcaAcceptLstDataZ1] weborca-prod/acceptlstv2.{headers,json}`、`trace/acceptlstv2_trace.log`、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#acceptlstv2`＋`artifacts/.../serverinfo_claim_conn.json` | `20251115TorcaAcceptLstDataZ1` | `psql` で `tbl_uketuke` の直近日レコード（患者 00000001 / 医師 00001 / 保険 06123456）を確認し、取得できた SQL を `data-check/acceptlstv2.sql` に保存。該当レコードが無ければ欠落報告を記録して RUN を延期。 | `artifacts/orca-connectivity/20251115TorcaAcceptLstDataZ1/weborca-prod/acceptlstv2.*` | 受付レコードが空でも `Api_Result=21` で正常。`Api_Result=13` 等が出た場合は証跡と共に Ops へエスカレートする |
| 4 | `POST /orca14/appointmodv2` | 予約登録（※実行禁止、405 証跡収集のみ） | `Allow: OPTIONS, GET` を含む HTTP 405 を記録 | `[RUN_ID=20251115TorcaAppointMod405Z1] httpdump/orca14_appointmodv2/{request,response}.http`、`trace/appointmodv2_trace.log`、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#appointmodv2`（Allow ヘッダー全文と ServerInfoResource を追記） | `20251115TorcaAppointMod405Z1` | リクエストに含む患者/医師/保険コードが既存データに存在するかを `SELECT` で確認し、`data-check/appointmodv2.sql` に結果を保存。存在しない場合は seed ではなく「データ欠落」として報告。 | `artifacts/orca-connectivity/20251115TorcaAppointMod405Z1/httpdump/orca14_appointmodv2/` `.../trace/appointmodv2_*.log` | ORCA 本番が POST を拒否するため 405 継続想定。`Allow` を取得できたかで成功判定し、DNS/証明書で失敗した場合は RUN_ID を再採番 |
| 5 | `GET /api21/medicalmodv2` | 診療明細参照 | HTTP 405（`/orca21/...` 直打ち）+ `/api/api21/medicalmodv2` で 200/`Api_Result=14` を並行取得 | `[RUN_ID=20251115TorcaMedical405Z1] httpdump/api21_medicalmodv2/{request,response}.http`、`httpdump/api_api21_medicalmodv2/{request,response}.http`、`trace/medicalmodv2_trace.log`、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#medicalmodv2`（ServerInfoResource=claim.conn=server の確認と 405/200 両系統の `Allow` 記録） | `20251115TorcaMedical405Z1` | `tbl_sryact` や `tbl_receipt` から直近の診療行為が存在するかを `SELECT` し、照会結果を `data-check/medicalmodv2.sql` へ保存。医事データが欠落している場合は RUN を延期し Ops へ通知。 | `artifacts/orca-connectivity/20251115TorcaMedical405Z1/httpdump/api21_medicalmodv2/` `.../httpdump/api_api21_medicalmodv2/` | Route 405 が継続中。診療行為が無くても Api_Result=14 は想定内。HTTP 405/200 の Allow 差分と合わせて Evidence を整理する |
| 6 | `POST /orca11/acceptmodv2` | 受付登録（POST は 405 のままなので証跡取得） | `Allow: OPTIONS, GET` 付き HTTP 405 | `P0_acceptmodv2/request.http` / `response.http` | `20251115TorcaAcceptMod405Z1` | `acceptlstv2` と同じ患者/保険/受付データがあることを `SELECT` で確認し、欠落時は seed ではなく運用報告。確認結果は `data-check/acceptmodv2.sql` に保存する。 | `artifacts/orca-connectivity/20251115TorcaAcceptMod405Z1/httpdump/orca11_acceptmodv2/` `.../trace/acceptmodv2_*.log` | `/orca11` の POST が閉鎖されているため 405 継続。`curl` 失敗時は 405 以前の TLS/Basic 認証ログも保存し、`ORCA_HTTP_404405_HANDBOOK.md` §1-§3 を併用する |

- `node scripts/tools/orca-curl-snippets.js` を `ORCA_BASE_URL=https://weborca.cloud.orcamo.jp` として実行し、生成されたスニペットを `artifacts/.../snippets/` に保存。
- 実行後は `httpdump/<api>/request.http`／`response.http` を残し、`Allow` や `WWW-Authenticate` をヘッダーごと証跡に含める。

#### 4.3.2 RUN_ID 再取得計画（P0 appoint/medical/accept 系）

- **`RUN_ID=20251115TorcaAppointLstZ1`**（予約一覧）
  ```bash
  RUN_ID=20251115TorcaAppointLstZ1
  mkdir -p "artifacts/orca-connectivity/${RUN_ID}/httpdump/appointlstv2" "artifacts/orca-connectivity/${RUN_ID}/trace"
  curl --silent --show-error --cert-type P12 \
       --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
       -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
       -H 'Content-Type: application/json; charset=Shift_JIS' \
       -X POST --data-binary '@docs/server-modernization/phase2/operations/assets/orca-api-requests/06_appointlstv2_request.json' \
       'https://weborca.cloud.orcamo.jp/api/api01rv2/appointlstv2?class=01' \
       -D artifacts/orca-connectivity/${RUN_ID}/httpdump/appointlstv2/response.headers \
       -o artifacts/orca-connectivity/${RUN_ID}/httpdump/appointlstv2/response.json \
       --trace-ascii artifacts/orca-connectivity/${RUN_ID}/trace/appointlstv2_trace.log
  ```
- **`RUN_ID=20251115TorcaAppointMod405Z1`**（予約登録 405 Evidence）
  ```bash
  RUN_ID=20251115TorcaAppointMod405Z1
  mkdir -p "artifacts/orca-connectivity/${RUN_ID}/httpdump/orca14_appointmodv2" "artifacts/orca-connectivity/${RUN_ID}/trace"
  curl --silent --show-error --cert-type P12 \
       --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
       -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
       -H 'Content-Type: application/json; charset=Shift_JIS' \
       -X POST --data-binary '@docs/server-modernization/phase2/operations/assets/orca-api-requests/02_appointmodv2_request.json' \
       'https://weborca.cloud.orcamo.jp/orca14/appointmodv2?class=01' \
       -D artifacts/orca-connectivity/${RUN_ID}/httpdump/orca14_appointmodv2/response.headers \
       -o artifacts/orca-connectivity/${RUN_ID}/httpdump/orca14_appointmodv2/response.json \
       --trace-ascii artifacts/orca-connectivity/${RUN_ID}/trace/appointmodv2_trace.log
  ```
- **`RUN_ID=20251115TorcaMedical405Z1`**（診療登録 405 + `/api/api21` 200 取得）
  ```bash
  RUN_ID=20251115TorcaMedical405Z1
  mkdir -p "artifacts/orca-connectivity/${RUN_ID}/httpdump/api21_medicalmodv2" "artifacts/orca-connectivity/${RUN_ID}/trace"
  curl --silent --show-error --cert-type P12 \
       --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
       -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
       -H 'Content-Type: application/json; charset=Shift_JIS' \
       -X POST --data-binary '@docs/server-modernization/phase2/operations/assets/orca-api-requests/03_medicalmodv2_request.json' \
       'https://weborca.cloud.orcamo.jp/api21/medicalmodv2?class=01' \
       -D artifacts/orca-connectivity/${RUN_ID}/httpdump/api21_medicalmodv2/response.headers \
       -o artifacts/orca-connectivity/${RUN_ID}/httpdump/api21_medicalmodv2/response.json \
       --trace-ascii artifacts/orca-connectivity/${RUN_ID}/trace/medicalmodv2_trace.log
  # `/api/api21/medicalmodv2` でも同 RUN_ID で `httpdump/api_api21_medicalmodv2/` を作成し 200/Api_Result を取得する
  ```
- **`RUN_ID=20251115TorcaAcceptMod405Z1`**（受付登録 405 Evidence）
  ```bash
  RUN_ID=20251115TorcaAcceptMod405Z1
  mkdir -p "artifacts/orca-connectivity/${RUN_ID}/httpdump/orca11_acceptmodv2" "artifacts/orca-connectivity/${RUN_ID}/trace"
  curl --silent --show-error --cert-type P12 \
       --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
       -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
       -H 'Content-Type: application/json; charset=Shift_JIS' \
       -X POST --data-binary '@docs/server-modernization/phase2/operations/assets/orca-api-requests/04_acceptmodv2_request.json' \
       'https://weborca.cloud.orcamo.jp/orca11/acceptmodv2?class=01' \
       -D artifacts/orca-connectivity/${RUN_ID}/httpdump/orca11_acceptmodv2/response.headers \
       -o artifacts/orca-connectivity/${RUN_ID}/httpdump/orca11_acceptmodv2/response.json \
       --trace-ascii artifacts/orca-connectivity/${RUN_ID}/trace/acceptmodv2_trace.log
  ```

各 `curl` は `ORCA_HTTP_404405_HANDBOOK.md` §0-§3 のチェックリスト（`openssl s_client` / `dns/` 証跡）とセットで実行し、終了後に `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へ `RUN_ID`, `HTTP`, `Api_Result`, `Allow` を貼り付ける。

#### 4.3.2 PHR シーケンス証跡テンプレ

- 目的: `docs/server-modernization/phase2/domains/PHR_RESTEASY_IMPLEMENTATION_PLAN.md`（Phase-A〜F）と ORCA 週次レビューを直結させるため、PHR-01〜11 のテスト観点／ヘッダー要件／ServerInfoResource チェック／Evidence 保存場所を標準化する。
- RUN_ID: `RUN_ID=20251114TphrEvidenceZ1` を初期テンプレとして発行し、以後は `RUN_ID=YYYYMMDDTorcaPHRSeqZ#` で複製する。`scripts/orca_prepare_next_run.sh ${RUN_ID}` → `cp -R artifacts/orca-connectivity/TEMPLATE/phr-seq artifacts/orca-connectivity/${RUN_ID}/` → `touch artifacts/orca-connectivity/${RUN_ID}/README.md` で構成を作り、`docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#phr-連携テンプレ` に RUN_ID を記録する。
- ディレクトリ: `httpdump/`, `trace/`, `logs/`, `serverinfo/`, `screenshots/`, `wildfly/`, `todo/` を必須とし、`ServerInfoResource`（`serverinfo/claim_conn.json`）と `WildFly server.log` 抜粋を各 RUN_ID で保存する。PHR API のスクリーンショット（`screenshots/phr-XX_response.png`）は ORCA 週次の即席レビュー用に取得し、差戻し事項は `todo/PHR-XX.md` へ列記する。
- ヘッダー: すべての PHR リクエストで `X-Facility-Id`, `X-Touch-TraceId`（=RUN_ID）, `X-Access-Reason`, `X-Consent-Token`（必要時）を送信し、欠落時は 401/403 を Evidence に残す。`touch.phr.requiredHeaders` と Runbook の要件が矛盾しないよう `server-modernized/src/main/webapp/WEB-INF/web.xml` を参照。
- テンプレ: `artifacts/orca-connectivity/TEMPLATE/phr-seq/README.md` に CLI 雛形・命名規則・スクリーンショットルール・`curl --trace-ascii` 保存要件を記載（本タスクで整備）。Runbook 改訂時は README と本節を同時更新する。

| フェーズ | ID / API | 主な検証観点 | 必須ヘッダー / ServerInfo チェック | 保存先テンプレ（`artifacts/orca-connectivity/${RUN_ID}/...`） |
| --- | --- | --- | --- | --- |
| Phase-A: キー管理 | PHR-02 `PUT /20/adm/phr/accessKey` | `phr_access_key` Flyway 適用と upsert、`PHR_ACCESS_KEY_UPSERT` 監査 ID | `X-Facility-Id`, `X-Touch-TraceId`, `ServerInfoResource`=server, `logs/phr_access_key.log` に hash と Api_Result を追記 | `phr-seq/10_key-management/PHR-02_{request,response}.http`, `trace/phr-02_accesskey.log`, `serverinfo/claim_conn.json` |
|  | PHR-03 `GET /20/adm/phr/accessKey/{accessKey}` | 末尾4桁検索と mask、Facility mismatch 403 | 同上 + `X-Access-Reason`（key-lookup）を必須、`logs/phr_accesskey_lookup.md` で `PHR_ACCESS_KEY_FETCH` を記録 | `phr-seq/10_key-management/PHR-03_*` |
|  | PHR-10 `GET /20/adm/phr/patient/{patientId}` | 患者→鍵逆引き、404 ハンドリング | `X-Facility-Id`, `X-Touch-TraceId`, ServerInfo=server | `phr-seq/10_key-management/PHR-10_*` |
| Phase-B: 閲覧 | PHR-01 `GET /20/adm/phr/abnormal/{patientId}` | UTF-8 固定・`docSince` フィルタ・`PHR_ABNORMAL_TEXT` 監査 | `X-Facility-Id`, `X-Touch-TraceId`, `X-Access-Reason=abnormal-view`、ServerInfo=server | `phr-seq/20_view-text/abnormal/`（request/response/httpdump, `screenshots/phr-01_response.png`） |
|  | PHR-04 `GET /allergy/{patientId}` | 多言語テキスト崩れ、`PHR_ALLERGY_TEXT` | 同上 | `phr-seq/20_view-text/allergy/` |
|  | PHR-05 `GET /disease/{patientId}` | 既往症テキスト、`PHR_DISEASE_TEXT` | 同上 | `phr-seq/20_view-text/disease/` |
|  | PHR-08 `GET /labtest/{patientId}` | `docSince/labSince` の QueryParam / `PHR_LABTEST_TEXT` | 同上。`logs/phr_labtest_summary.md` に Api_Result と件数。 | `phr-seq/20_view-text/labtest/` |
|  | PHR-09 `GET /medication/{patientId}` | `TouchMedicationFormatter` 抽出、禁忌語置換、`PHR_MEDICATION_TEXT` | `X-Facility-Id`, `X-Touch-TraceId`, `X-Access-Reason=medication-view`、ServerInfo=server | `phr-seq/20_view-text/medication/` + `screenshots/phr-09_medication.png` |
| Phase-C: Layer ID | PHR-06 `POST /identityToken` | Layer ID Secrets, `PHR_LAYER_ID_TOKEN_ISSUE`, `X-Consent-Token` | `X-Facility-Id`, `X-Touch-TraceId`, `X-Access-Reason=layer-id`, `X-Consent-Token`, ServerInfo=server, `wildfly/identityToken.log` に Secrets チェック結果 | `phr-seq/30_layer-id/identityToken/{request,response}.http`, `trace/phr-06_identityToken_trace.log` |
| Phase-D: 画像 | PHR-07 `GET /image/{patientId}` | `Cache-Control: no-store`, 帯域スロットリング (`bandwidth-policy.properties: X-Image-Burst-Limit=200MB/5min, X-Image-Max-Size=5MB`), `PHR_SCHEMA_IMAGE_STREAM` | `X-Facility-Id`, `X-Touch-TraceId`, ServerInfo=server, `screenshots/phr-07_image.png` でプレビューを残す。`wildfly/phr_image_download.log` に `throttleDecision` を残す。 | `phr-seq/40_image/image/{headers,response}.http`, `trace/phr-07_image_trace.log`, `wildfly/phr_image_download.log` |
| Phase-E: PHRContainer | PHR-11 `GET /{facilityId,patientId,...}` | `docSince`/`labSince`、`PHR_CONTAINER_FETCH`, `SignedUrlService`（Vault `kv/.../phr/container`, TTL=300s, 1-download, `storageType=S3`） | `X-Facility-Id`, `X-Touch-TraceId`, `X-Access-Reason=container-export`, ServerInfo=server, `logs/phr_container_summary.md` へ Api_Result と `signedUrlIssuer`, `storageType`, `ttlSeconds` を残す | `phr-seq/50_container/container/{request,response}.json`, `screenshots/phr-11_container.png`, `trace/phr-11_container_trace.log`, `todo/phr-11_signedurl.md` |
| Phase-F: Export Track | `/20/adm/phr/export*` | `PHR-EXPORT-TRACK` 依存、Blocker/担当者メモのみ | `X-Facility-Id`, `X-Touch-TraceId`, ServerInfo=server, `todo/export-track.md` に Blocker 記録 | `phr-seq/60_export-track/README.md` |

> 備考（PHR-06/07/11 Ready 条件）
> - **RUN_ID**: `docs/server-modernization/phase2/operations/logs/2025-11-18-phr-layerid-ready.md` に RUN_ID=`20251118TphrLayerPrepZ1` を記録し、Layer ID cert import / 画像帯域 policy / Signed URL secrets の承認証跡を集約済み。今後の PHR 実測は当ログを参照して Pending→Ready へ更新済みであることを明示する。
> - **Layer ID (PHR-06)**: Vault `kv/modernized-server/phr/layer-id` の `PHR_LAYER_ID_CLIENT_ID/SECRET/CERT_P12_B64/ALIAS` は 2025-11-18 08:40 JST Ops 承認済。`ops/check-secrets.sh --profile phr-layer-id` がグリーンでない場合は RUN_ID を再採番し 401 証跡だけを保存する。Ready 条件: keystore import + `PHR_LAYER_ID_CERT_SHA256` 確認済。
> - **画像帯域 (PHR-07)**: `bandwidth-policy.properties` へ `X-Image-Burst-Limit=200MB/5min`, `X-Image-Max-Size=5MB` を投入し、Payara `mime-mapping` PR (#ops-network-20251118) が承認された。Ready 条件: ORCA 実測で `Cache-Control: no-store` と帯域ログが取得できること。Pending が発生した場合は `wildfly/phr_image_download.log` の throttle 行を Evidence に残す。
> - **Signed URL / Container (PHR-11)**: `kv/modernized-server/phr/container` に `PHR_SIGNING_KEY_ID=phr-container-20251118`, `PHR_SIGNING_KEY_SECRET`, `PHR_EXPORT_SIGNING_SECRET`, `PHR_EXPORT_STORAGE_TYPE=S3` を格納。`ops/check-secrets.sh --profile phr-export` で TTL=300s/1-download/https-only を検証済。Ready 条件: `SignedUrlService` e2e で `storageType=S3`, `kmsKey=alias/opd/phr-export` が監査ログに出力されること。Pending が残る場合は NULL フォールバック + 理由を `todo/phr-11_signedurl.md` に記載。
> - **Ops 連絡先**: Layer ID = @OpsLead（#ops-secrets）、画像帯域 = @OpsNetwork（#ops-infra）、Signed URL = @OpsSec（#ops-secrets）。進捗は `2025-11-18-phr-layerid-ready.md` で日別に更新し、次回 ORCA 週次（2025-11-18 09:30 JST）で報告。
> - **残タスク/Pending**: RUN_ID=`20251119TorcaPHRSeqZ1` で Phase-C/D/E の curl 実測を再設定（2025-11-19 10:00 JST 締切）。未完の場合は `ORCA_CONNECTIVITY_VALIDATION.md` §4.3.2 テンプレ TODO に遅延理由を記載する。

各 PHR 実行後は `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md#phr-連携テンプレ` へ `[RUN_ID=20251114TphrEvidenceZ1] PHR-0X ...` のサマリを貼り付け、`PHASE2_PROGRESS.md` の ORCA 週次欄／`docs/web-client/planning/phase2/DOC_STATUS.md` W22 行「主な変更」に RUN_ID と更新資料（Runbook/ログ/テンプレ）を反映する。

**curl --cert-type P12 雛形（PHR 共通）**

```bash
RUN_ID=20251115TorcaPHRSeqZ1
API_PATH="/20/adm/phr/identityToken"
curl --silent --show-error --cert-type P12 \
     --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" \
     -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" \
     -H "Content-Type: application/json; charset=UTF-8" \
     -H "Accept: application/json" \
     -H "X-Facility-Id: ${TOUCH_FACILITY_ID}" \
     -H "X-Touch-TraceId: ${RUN_ID}" \
     -H "X-Access-Reason: care-plan-review" \
     -H "X-Consent-Token: ${TOUCH_CONSENT_TOKEN:-na}" \
     --data-binary @payloads/phr_identityToken_request.json \
     "https://weborca.cloud.orcamo.jp${API_PATH}" \
     -D "artifacts/orca-connectivity/${RUN_ID}/phr-seq/httpdump$(echo ${API_PATH} | tr '/' '_')/response.headers" \
     -o "artifacts/orca-connectivity/${RUN_ID}/phr-seq/httpdump$(echo ${API_PATH} | tr '/' '_')/response.json" \
     --trace-ascii "artifacts/orca-connectivity/${RUN_ID}/phr-seq/trace$(echo ${API_PATH} | tr '/' '_')_${RUN_ID}.log"
```

- `X-Facility-Id` / `X-Touch-TraceId` は `touch.phr.requiredHeaders`（Task-A）で必須。`X-Access-Reason` と `X-Consent-Token` は Touch 共通監査で推奨。TraceId には RUN_ID を再利用し、`d_audit_event.trace_id` と突合させる。

**PHR_* 監査イベント チェックリスト**

1. `audit/logs/phr_audit_extract.sql` で `event_id LIKE 'PHR_%' AND trace_id=:RUN_ID` を抽出。
2. すべて取得できれば OK。欠けたイベントは `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md#pending-risks` に列挙し、レビューで要承認にする。

| カテゴリ | 期待イベント ID | 備考 |
| --- | --- | --- |
| キー管理 | `PHR_ACCESS_KEY_UPSERT`, `PHR_ACCESS_KEY_FETCH`, `PHR_ACCESS_KEY_FETCH_FAILED`, `PHR_ACCESS_KEY_FETCH_BY_PATIENT` | Flyway 適用前後で `_FAILED` が出るかを記録。 |
| 閲覧テキスト | `PHR_ABNORMAL_TEXT`, `PHR_ALLERGY_TEXT`, `PHR_DISEASE_TEXT`, `PHR_LABTEST_TEXT`, `PHR_MEDICATION_TEXT` | `docSince/labSince` の値と `payloads/*.json` を一致させる。 |
| Layer ID | `PHR_LAYER_ID_TOKEN_ISSUE`, `PHR_LAYER_ID_CERT_MISSING` | 証明書欠落再現時も RUN_ID を分けて採取。 |
| 画像・コンテナ | `PHR_SCHEMA_IMAGE_STREAM`, `PHR_SCHEMA_IMAGE_STREAM_FAILED`, `PHR_CONTAINER_FETCH`, `PHR_SIGNED_URL_ISSUED`, `PHR_SIGNED_URL_ACL_DENY` | 画像サイズ (`wc -c schema_image.bin`) と Signed URL TTL を README へ併記。 |

- 実施後は `docs/server-modernization/phase2/operations/logs/2025-11-13-orca-connectivity.md` にドラフトリンクを残し、ORCA 週次（次回 2025-11-18 09:30 JST）で優先度承認・実測報告を行う。

### 4.4 WebORCA クラウド接続（2025-11-14 更新）

1. `RUN_ID` を `{{YYYYMMDD}}TorcaProdCertZ#` 形式で採番し、`artifacts/orca-connectivity/${RUN_ID}/` を作成。
2. `scripts/orca_prepare_next_run.sh ${RUN_ID}` を実行してテンプレフォルダを初期化。
3. `curl --cert-type P12` 実行時は `--trace-ascii` を併用し、TLS ハンドシェイクを `trace_${api}.log` として保存。
4. `ServerInfoResource` と同じターミナルで `ORCA_PROD_*` を `env` 表示しないよう `set +o history` / `set +o histexpand` を利用。共有する必要がある場合は `<MASKED>` 表記で置き換える。
5. `system01dailyv2` → `masterlastupdatev3` → `insuranceinf1v2` の順で 1 回ずつ実行し、毎回 `[RUN_ID=<...>]` を `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md#<api>` へ追記する。レスポンスは `artifacts/orca-connectivity/${RUN_ID}/weborca-prod/<api>.{headers,json}` + `trace/<api>_trace.log` に保存し、`--trace-ascii` の出力で TLS/Allow/WWW-Authenticate を拾う（XML/UTF-8 で送信）。PHR 週次テンプレ（RUN_ID=`20251114TphrEvidenceZ1`）を展開する場合は、このステップ完了後に `phr-seq/10_key-management` の `ServerInfoResource`／`system01dailyv2` レポートをコピーして基礎証跡とする。
6. Push/帳票/患者メモ系（No.41/42/45/53）や PHR シーケンスを実施する場合は §3.6 / §4.3.2 のテンプレを使い、`artifacts/orca-connectivity/${RUN_ID}/httpdump/<api>/` `phr-seq/` `trace/` `screenshots/` へリクエスト・PUSH ペイロード・`blobapi` 取得ログ・`ServerInfoResource` を保存する。`Allow` や `WWW-Authenticate` が返った場合は headers ごと証跡へ残し、テンプレ README の TODO 欄へ転記する。
7. 成功時は `PHASE2_PROGRESS.md` に `RUN_ID`, `HTTP`, `Api_Result`, `証跡パス`, `実施 API`、`ServerInfoResource` の判定（`artifacts/.../serverinfo_claim_conn.json`）を追記し、`logs/<date>-orca-connectivity.md#serverinfo` にも同 RUN_ID で結果を残す。PHR 証跡を収集した場合は `logs/<date>-orca-connectivity.md#phr-連携テンプレ` へ `[RUN_ID=20251114TphrEvidenceZ1] PHR-0X ...` を追加し、失敗時は原因（証明書期限, ネットワーク, 認証失敗等）と次アクションを明記。

### 4.5 HTTP 401/403/404/405 トリアージ

1. `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` に従い、`curl -v` の `httpdump/`、`trace/`、`summary.md` を保存。
2. ログ取得対象は以下とする。
   - `curl -v` の全出力（`request.http` / `response.http`）
   - `openssl s_client`（証明書チェーン, Protocol）
   - `ServerInfoResource` の結果（Modernized サーバー視点）
   - `journalctl` や WildFly ログ（`server/standalone/log/server.log`）
3. `Allow` ヘッダーに `GET` のみが並ぶ場合は WebORCA 側で POST が閉じられているため、`notes/orca-api-field-validation.md` の該当節にリンク。
4. 401/403 の場合は Basic / クライアント証明書の組み合わせを再確認し、`ORCA_PROD_BASIC_USER` を誤って編集していないか evidence に追記。

### 4.6 報告とエスカレーション

- `PHASE2_PROGRESS.md` の「ORCA 接続検証レポートテンプレ」に `RUN_ID`, `HTTP`, `Api_Result`, `証跡` を貼り付け。
- Blocker（例: 405 持続, TLS ハンドシェイク失敗）が発生した場合は `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` の Slack/PagerDuty ルートに従い、`weborca-support@orcamo.jp` へ問い合わせる。問い合わせ内容は `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に `【連絡】` として記録。

## 5. API 検証マトリクス

- `docs/server-modernization/phase2/operations/assets/orca-api-matrix.with-spec.csv` を最新化し、`Priority=P0/P1/P2` ごとの実施状況を `checkedAt` 列で管理する。
- 備考欄に付与するタグ例（`※環境設定要確認`, `※UTF-8必須` など）は `notes/orca-api-field-validation.md` の指示に従う。`npm run lint:orca-matrix` で警告が出た場合は修正完了まで RUN_ID を `NG` にしておく。
- API ごとの担当ロールは `operations/assets/orca-api-assignments.md` を参照し、`PHASE2_PROGRESS.md` と突き合わせる。

### 5.1 Matrix No.39-53（システム／通知／特殊 API）

| No | API | ステータス | Evidence / 次アクション |
| --- | --- | --- | --- |
| 39 | `/orca31/hspmmv2` | `HTTP 405 (Allow GET)` | RUN_ID=`20251113T002806Z`（`artifacts/.../uncertain-api/39_hspmmv2_response.txt`）。ORCA route 開放が必要。`notes/orca-api-field-validation.md` §3.1。 |
| 40 | `/orca31/hsacctmodv2`（室料差額） | RUN 未実施（既存入院データ欠落） | manifest slug=`hospsagaku`。WebORCA 本番に室料差額データが存在しないため保留。復旧完了までは欠落ログのみ更新し、seed を投入しない。 |
| 41 | `/api01rv2/pusheventgetv2` | RUN 未実施（push-exchanger 必須） | `logs/2025-11-13...` に履歴なし。`ORCA_API_STATUS.md` §2.4 / `notes` §3.2 参照。print002 通知が既存環境で確認できた時点で検証する（seed 追加は禁止）。 |
| 42 | `/orca42/receiptprintv3` | RUN 未実施（PUSH/Blob 運用未整備） | `push/print002` を受け取る運用を §3.6 へ追加。帳票テンプレは `assets/orca-api-requests/42_receipt_printv3_request.json` を参照。 |
| 43 | `/orca51/masterlastupdatev3` | RUN 未実施（system daily の付帯チェック） | `system01dailyv2` 後に 1 回だけ呼び、`weborca-prod/masterlastupdatev3.*` に結果を保存する。`ORCA_API_STATUS.md` §2.4。 |
| 44 | `/api01rv2/system01dailyv2` | `HTTP 200 / Api_Result=00`（UTF-8） | RUN_ID=`20251113T002806Z`。Shift_JIS は `Api_Result=91` のためテンプレを UTF-8 に統一。 |
| 45 | `/api01rv2/patientlst7v2` | RUN 未実施（memomodv2 依存） | `patientmemomodv2` 405 のため内容を確認できない。`notes/orca-api-field-validation.md` §3.3。 |
| 46 | `/api21/medicalmodv23` | `HTTP 405 (Allow: GET)` | RUN_ID=`20251113T002806Z`。route 開放依頼中。テンプレは XML `<medicalv2req3>`. |
| 47 | `/orca36/hsfindv3` | RUN 未実施（既存入院データ欠落） | Admission_Date 条件を満たす患者が居らず未着手。入院データが揃い次第に再測し、それまでは欠落状況をログへ追記する。 |
| 48 | `/api01rv2/contraindicationcheckv2` | RUN 未実施（薬剤履歴データ欠落） | `Check_Term` / `Medication_Information[]` の XML は準備済み。薬剤履歴が取得できたタイミングで実行し、seed 追加は行わない。 |
| 49 | `/api01rv2/insuranceinf1v2` | RUN 未実施（初期キャッシュ未取得） | `Base_Date` を当日で 1 回取得し、`weborca-prod/insuranceinf1v2.*` に保存する TODO を §4.4 に追加。 |
| 50 | `/api01rv2/subjectiveslstv2` | RUN 未実施（症状詳記 UI 未定） | Request_Number=01-03 の仕様整理は完了。カルテ UI 実装時に実行。 |
| 51 | `/api01rv2/patientlst8v2` | RUN 未実施（旧姓データ欠落） | 旧姓履歴を持つ患者が WebORCA 本番に存在しないため保留。復旧後に `/api01rv2/patientlst8v2` を実行し、それまでは欠落記録のみ更新する。 |
| 52 | `/api01rv2/medicationgetv2` | RUN 未実施（2024-11 追加 API） | 診療コード検索の必須 API。`ORCA_API_STATUS.md` §2.4 参照。`ORCA_CONNECTIVITY_VALIDATION.md` に手順を追加済み。 |
| 53 | `/orca06/patientmemomodv2` | `HTTP 405 (Allow: GET)` | RUN_ID=`20251113T002806Z`。memo CRUD は ORCA route 復旧待ち。`notes` §3.3。 |

## 6. ログおよび Evidence ルール

1. **CLI 出力**: `curl`, `openssl s_client`, `ServerInfoResource`, `node scripts/tools/orca-curl-snippets.js` のログはすべて `artifacts/orca-connectivity/<UTC>/` に保存。ファイル名例: `01_tls_handshake.log`, `02_acceptlstv2_request.http`, `02_acceptlstv2_response.http`。
2. **テンプレ Evidence**: `artifacts/orca-connectivity/TEMPLATE/` をコピーした直後に `README.md` へ `RUN_ID`, `UTC`, `ORCA_PROD_CERT` のハッシュ（`shasum -a 256`）を追記。
3. **ドキュメントリンク**: `docs/server-modernization/phase2/PHASE2_PROGRESS.md` の当日欄と本 Runbook の該当セクションを双方向リンクにする。
4. **通知**: 失敗時は Slack `#server-modernized-alerts` → PagerDuty → Backend Lead の順に連絡。
5. **Archive**: 30 日以上参照しないログは `docs/archive/<YYYYQn>/orcaconnect/` へ移し、元ファイルにはスタブと移動先リンクを残す。
6. **命名ルール**: Evidence ディレクトリは UTC タイムスタンプ（`YYYYMMDDThhmmssZ`）を用いる。命名チェックは `node scripts/tools/orca-artifacts-namer.js` で行い、0 以外の終了コードは再実行禁止。
7. **秘匿情報のマスキング**: `request.http` に資格情報を含めない。curl コマンドは `--user <MASKED>` 形式で保管し、実行時のみ `env` から展開する。

## 7. WebORCA クラウド本番接続手順（再掲）

1. **利用範囲**: 参照系 API のみ。更新 API は緊急保守時のみに限定し、実行前後の状態復旧手順を Runbook へ追記するまで禁止。
2. **証明書管理**: PKCS#12＋パスフレーズは `ORCAcertification/` に集約し、作業後は `unset ORCA_PROD_*`。ファイル権限は 0700/0600 を維持する。
3. **curl 実行例**: §4.1 のコマンドを参照。`acceptlstv2` のような参照 API を 1 回だけ実行し、HTTP 200 / `Api_Result=21`（受付なし）など実際の結果を Evidence に保存する。
4. **安全ガード**:
   - Basic 情報や API キーをドキュメントへ貼らない。
   - `tmp/` や `/var/tmp/` に残したリクエストファイルを削除。
   - 端末の証明書ストアへ import した場合は作業後に削除。
5. **報告**: `PHASE2_PROGRESS.md` と `docs/web-client/planning/phase2/DOC_STATUS.md` を更新し、`RUN_ID`, `結果`, `証跡`, `次アクション` を記載。

---

- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ 4（ORCA セクション）と `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md#44-weborca-クラウド接続2025-11-14-更新` に本タスクリストの要約を反映すること。
- 旧 WebORCA コンテナ手順や route テンプレは 2025-11-14 をもって廃止。過去の証跡はリポジトリ履歴または `docs/archive/2025Q4/` を参照。
