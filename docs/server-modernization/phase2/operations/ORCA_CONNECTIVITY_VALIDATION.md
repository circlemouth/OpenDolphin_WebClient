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

`artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` には `request.xml` / `response.xml` / `trace.log` を揃え、`notes/orca-api-field-validation.md` §3 の seed 記録とリンクさせる。

### 3.5 監査・権限チェック

- PKCS#12 と Basic 情報は作業者ローカルのみで保持し、リポジトリやログへ貼り付け禁止。
- `history` に資格情報が残った場合は `history -d <line>` で削除し、シェル終了時に `unset ORCA_PROD_*` を実行。
- `artifacts/` へ保存する際はキー・パスフレーズをマスクし、必要に応じて `<SECRET>` プレースホルダを記載。
- 入院 API のリクエスト/レスポンスは `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` へ集約し、患者 ID・保険者番号など PHI は `mask.txt` に置換ルールを添えてから共有する（`git add` 禁止で artifacts のまま保存）。

### 3.6 Push／帳票／患者メモの追加準備

| 対象 API | 追加で必要なもの | 補足 |
| --- | --- | --- |
| `/api01rv2/pusheventgetv2` / `/orca42/receiptprintv3` | push-exchanger（帳票通知受信）、`/blobapi` へアクセスできるホスト、`print002` イベント用のサンプルデータ | `manifest.json` No.41/42。`artifacts/orca-connectivity/<RUN_ID>/push/` に `pusheventgetv2_request.json` / `pusheventgetv2_response.json` を保存し、PUSH 通知ペイロードも `push/print002_*.json` として残す。 |
| `/orca51/masterlastupdatev3` / `/api01rv2/insuranceinf1v2` | `system01dailyv2` と同じ証跡テンプレ (`Content-Type: application/xml; charset=UTF-8`) | キャッシュの TTL を測るため `system01dailyv2` → `masterlastupdatev3` → `insuranceinf1v2` の順で 1 回ずつ実行。レスポンスは `weborca-prod/masterlastupdatev3.*` などへ保存。 |
| `/api01rv2/patientlst7v2` / `/orca06/patientmemomodv2` | 患者メモ seed（ORCA UI で作成）と `Memo_Mode`・`Memo_Class` の制約整理 | `patientmemomodv2` が 405 のため取得のみ先行する。`notes/orca-api-field-validation.md` §3.3 に依存関係とテンプレをまとめた。 |
| `/orca31/hspmmv2` / `/orca31/hsacctmodv2` | 入院会計 seed（No.38）と `Perform_Month`（YYYY-MM）入力値 | `logs/2025-11-13-orca-connectivity.md` の `uncertain-api/` に 405 証跡のみ存在。seed SQL を `artifacts/orca-connectivity/templates/` に準備してから再検証する。 |

> これらの API は `orca-api-matrix` No.39-53 に含まれている。RUN_ID を採番したら `notes/orca-api-field-validation.md` §3 と `ORCA_API_STATUS.md` §2.4 に反映すること。

No.19-38 で作成した XML テンプレの証跡は `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` 以下にまとめ、Push/帳票/患者メモ系は `push/` や `memo/` サブディレクトリと同じ粒度で保持する。`notes/orca-api-field-validation.md` §3 の seed 行に成果物パスを追記すること。

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

### 4.3 P0 API セット

| # | エンドポイント | 目的 | 成功条件 | 保存ファイル |
|---|---|---|---|---|
| 1 | `POST /api01rv2/patientgetv2` | 患者基本情報参照 | HTTP 200 / `Api_Result=00` / Patient_ID が返る | `P0_patientgetv2/request.http` / `response.http` |
| 2 | `POST /api01rv2/appointlstv2` | 予約一覧参照 | HTTP 200 / `Api_Result=00` / 受付有無が判る | `P0_appointlstv2/...` |
| 3 | `POST /api01rv2/acceptlstv2` | 当日受付参照 | HTTP 200 / `Api_Result=00`（受付なしは `Api_Result=21`） | `P0_acceptlstv2/...` |
| 4 | `POST /orca14/appointmodv2` | 予約登録（※実行禁止） | シミュレーションのみ。curl テンプレ生成までで止める | `P0_appointmodv2/template.md` |
| 5 | `GET /api21/medicalmodv2` | 診療明細参照 | HTTP 200 / `Api_Result=00` | `P0_medicalmodv2/...` |

- `node scripts/tools/orca-curl-snippets.js` を `ORCA_BASE_URL=https://weborca.cloud.orcamo.jp` として実行し、生成されたスニペットを `artifacts/.../snippets/` に保存。
- 実行後は `httpdump/<api>/request.http`／`response.http` を残し、`Allow` や `WWW-Authenticate` をヘッダーごと証跡に含める。

### 4.4 WebORCA クラウド接続（2025-11-14 更新）

1. `RUN_ID` を `{{YYYYMMDD}}TorcaProdCertZ#` 形式で採番し、`artifacts/orca-connectivity/${RUN_ID}/` を作成。
2. `scripts/orca_prepare_next_run.sh ${RUN_ID}` を実行してテンプレフォルダを初期化。
3. `curl --cert-type P12` 実行時は `--trace-ascii` を併用し、TLS ハンドシェイクを `trace_${api}.log` として保存。
4. `ServerInfoResource` と同じターミナルで `ORCA_PROD_*` を `env` 表示しないよう `set +o history` / `set +o histexpand` を利用。共有する必要がある場合は `<MASKED>` 表記で置き換える。
5. `system01dailyv2` → `masterlastupdatev3` → `insuranceinf1v2` の順で 1 回ずつ実行し、`weborca-prod/<api>.{headers,json}` に保存（いずれも XML/UTF-8 で送信）。
6. Push/帳票/患者メモ系（No.41/42/45/53）を実施する場合は §3.6 のテンプレを使い、`push/` や `memo/` ディレクトリにリクエスト・PUSH ペイロード・`blobapi` 取得ログをまとめる。
7. 成功時は `PHASE2_PROGRESS.md` に `RUN_ID`, `HTTP`, `Api_Result`, `証跡パス`, `実施 API` を追記。失敗時は原因（証明書期限, ネットワーク, 認証失敗等）と次アクションを明記。

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
| 40 | `/orca31/hsacctmodv2`（室料差額） | RUN 未実施（seed 未整備） | manifest slug=`hospsagaku`。入院会計 seed と No.38/39 復旧後に `Request_Number=3` で再検証。 |
| 41 | `/api01rv2/pusheventgetv2` | RUN 未実施（push-exchanger 必須） | `logs/2025-11-13...` に履歴なし。`ORCA_API_STATUS.md` §2.4 / `notes` §3.2 参照。push-exchanger + print002 seed を準備。 |
| 42 | `/orca42/receiptprintv3` | RUN 未実施（PUSH/Blob 運用未整備） | `push/print002` を受け取る運用を §3.6 へ追加。帳票テンプレは `assets/orca-api-requests/42_receipt_printv3_request.json` を参照。 |
| 43 | `/orca51/masterlastupdatev3` | RUN 未実施（system daily の付帯チェック） | `system01dailyv2` 後に 1 回だけ呼び、`weborca-prod/masterlastupdatev3.*` に結果を保存する。`ORCA_API_STATUS.md` §2.4。 |
| 44 | `/api01rv2/system01dailyv2` | `HTTP 200 / Api_Result=00`（UTF-8） | RUN_ID=`20251113T002806Z`。Shift_JIS は `Api_Result=91` のためテンプレを UTF-8 に統一。 |
| 45 | `/api01rv2/patientlst7v2` | RUN 未実施（memomodv2 依存） | `patientmemomodv2` 405 のため内容を確認できない。`notes/orca-api-field-validation.md` §3.3。 |
| 46 | `/api21/medicalmodv23` | `HTTP 405 (Allow: GET)` | RUN_ID=`20251113T002806Z`。route 開放依頼中。テンプレは XML `<medicalv2req3>`. |
| 47 | `/orca36/hsfindv3` | RUN 未実施（入院 seed 不足） | Admission_Date 条件を満たす患者が居らず未着手。No.38/39 seed と合わせて再計画。 |
| 48 | `/api01rv2/contraindicationcheckv2` | RUN 未実施（薬剤履歴 seed 不足） | `Check_Term` / `Medication_Information[]` を送る XML テンプレのみ整備。薬剤検索機能着手時に実行。 |
| 49 | `/api01rv2/insuranceinf1v2` | RUN 未実施（初期キャッシュ未取得） | `Base_Date` を当日で 1 回取得し、`weborca-prod/insuranceinf1v2.*` に保存する TODO を §4.4 に追加。 |
| 50 | `/api01rv2/subjectiveslstv2` | RUN 未実施（症状詳記 UI 未定） | Request_Number=01-03 の仕様整理は完了。カルテ UI 実装時に実行。 |
| 51 | `/api01rv2/patientlst8v2` | RUN 未実施（旧姓 seed 無し） | サンプル患者を ORCA DB へ投入後に `/api01rv2/patientlst8v2` を実行する。`notes` §3.4。 |
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
