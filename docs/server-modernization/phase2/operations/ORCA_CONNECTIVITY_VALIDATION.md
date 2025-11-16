# ORCA 接続 Single Playbook（WebORCA Trial）

- 作成日: 2025-11-19（WebORCA トライアルサーバー運用へ切り替え）
- 対象: `https://weborca-trial.orca.med.or.jp/` で提供される WebORCA トライアルサーバーと、`docker-compose.modernized.dev.yml`（または `scripts/start_legacy_modernized.sh`）で起動するモダナイズ版 OpenDolphin サーバー。
- 目的: 公開トライアル環境での疎通・API 呼び出し・CRUD 証跡取得を単一 Runbook に集約し、RUN_ID 発行／ログ保存／週次棚卸しのやり方を一本化する。
- 参照: [ORCA API 公式仕様](https://www.orca.med.or.jp/receipt/tec/api/overview.html) / [オフラインコピー](assets/orca-api-spec/README.md) / [技術情報ハブ（帳票・CLAIM・MONTSUQI 等）](assets/orca-tec-index/README.md)

> **Single Playbook ルール**: ORCA 接続に関する手順は本ドキュメントに一本化する。他ドキュメント（`ORCA_API_STATUS.md`, `MODERNIZED_API_DOCUMENTATION_GUIDE.md` など）は本 Playbook へのリンクと差分サマリのみを掲載する。
>
> **2025-11-19 更新**: 本番資格情報および `ORCAcertification/` ディレクトリはアーカイブ扱いとし、WebORCA トライアルサーバーのみを接続先とする。Basic 認証は公開アカウント `trial/weborcatrial` を利用し、`curl --cert-type P12` や PKCS#12 証明書は使用しない。
>
> **成果物**
> 1. `docs/server-modernization/phase2/operations/logs/<YYYYMMDD>-orca-connectivity.md` に RUN_ID／所見／Evidence パスを追記。
> 2. `artifacts/orca-connectivity/<RUN_ID>/` にトライアルサーバーへの `curl` リクエスト・レスポンス（ヘッダー/本文）と `ServerInfoResource` 結果、DNS/TLS ログ、`tmp/orca-weekly-summary.*` 実行ログを保存。
> 3. `docs/web-client/planning/phase2/DOC_STATUS.md` の ORCA 連携欄と週次棚卸し欄を Active に更新し、後続担当へ必要な証跡パスを共有。

## 0. Single Playbook 運用ルール

- 本節を基点に RUN_ID 発行、ログ保存、週次棚卸し（`tmp/orca-weekly-summary.*`）の貼り付け位置を定義する。`ORCA_API_STATUS.md`/`MODERNIZED_API_DOCUMENTATION_GUIDE.md` は本節の参照だけを記載し、手順を複製しない。
- Trial サーバーの接続情報・CRUD 可否・利用不可機能は `assets/orca-trialsite/raw/trialsite.md#snapshot-summary-2025-11-19` を一次情報とし、本節と §1 の記述が乖離した場合は Snapshot を更新してから本 Playbook を修正する。

### 0.1 RUN_ID 発行テンプレ

1. RUN_ID は `YYYYMMDD` + 目的語 + `Z#` で命名する。例: `RUN_ID=20251120TrialCrudPrepZ1`（Trial CRUD 事前チェック 1 件目）。
2. 予約語: `TrialCrud`, `TrialAppoint`, `TrialAccept`, `TrialMedical`, `TrialHttpLog`, `TrialWeekly` などタスク種別が判別できる語を使用する。
3. 発行手順:
   ```bash
   export RUN_ID=20251120TrialCrudPrepZ1
   export EVIDENCE_ROOT="artifacts/orca-connectivity/${RUN_ID}"
   mkdir -p "${EVIDENCE_ROOT}/"{dns,tls,trial,trace,data-check}
   rsync -a artifacts/orca-connectivity/TEMPLATE/ "${EVIDENCE_ROOT}/"
   ```
4. `artifacts/orca-connectivity/TEMPLATE/00_README.md` の命名ルールも参照し、`node scripts/tools/orca-artifacts-namer.js artifacts/orca-connectivity` で違反がないことを確認する。

### 0.2 ログ保存とリンク統一

1. 実施日ごとのサマリは `docs/server-modernization/phase2/operations/logs/<YYYYMMDD>-orca-connectivity.md` に記載し、各 RUN_ID を表形式で整理する（例: `logs/2025-11-15-orca-connectivity.md`）。
2. 実測ログの保存先は必ず `artifacts/orca-connectivity/<RUN_ID>/` 配下とし、`dns/`, `tls/`, `trial/<api>/`, `trace/`, `data-check/`, `screenshots/` を RUN_ID 単位で揃える。
3. 差分サマリを他ドキュメントへ記載する場合は「`ORCA_CONNECTIVITY_VALIDATION.md` §0 を参照」と明記し、手順本文を複製しない。特に `ORCA_API_STATUS.md` は最新ステータス表のみを残し、実施手順は本 Playbook へ誘導する。
4. `artifacts/orca-connectivity/<RUN_ID>/README.md` を Evidence 目次として更新し、DNS/TLS ログや CRUD 実施結果を列挙する。

### 0.3 `tmp/orca-weekly-summary.*` の貼り付け位置

1. `npm run orca-weekly` 実行後、`tmp/orca-weekly-summary.json` と `tmp/orca-weekly-summary.md` が生成される。
2. Markdown 版を以下 3 か所へ貼り付けて同期する。
   - `docs/web-client/planning/phase2/DOC_STATUS.md` の「モダナイズ/外部連携（ORCA）」週次テーブル（備考欄に RUN_ID・Evidence パス）。
   - `docs/web-client/README.md` ORCA セクションの「直近週次」行。
   - `docs/server-modernization/phase2/PHASE2_PROGRESS.md` ORCA 行の週次欄。
3. JSON 版と CLI 標準出力は `artifacts/orca-connectivity/validation/<RUN_ID>/weekly_summary.log` へ貼り付け、`RUN_ID`＝`YYYYMMDDTrialWeeklyZ#` を合わせて記録する。

### 0.4 curl サンプル（Basic 認証）

`MODERNIZED_API_DOCUMENTATION_GUIDE.md` §3.2 から引用する cURL 雛形を本節で一元管理する。Basic 認証／UTF-8/Shift_JIS ヘッダー／Evidence 保存ルールを以下に示す。

```bash
export ORCA_TRIAL_USER=trial
export ORCA_TRIAL_PASS=weborcatrial
export RUN_ID=20251120TrialCrudPrepZ1
EVIDENCE_ROOT="artifacts/orca-connectivity/${RUN_ID}"
mkdir -p "${EVIDENCE_ROOT}/trial/system01dailyv2" \
         "${EVIDENCE_ROOT}/trace" \
         "${EVIDENCE_ROOT}/data-check"
curl --silent --show-error \
     -u "${ORCA_TRIAL_USER}:${ORCA_TRIAL_PASS}" \
     -H 'Content-Type: application/json; charset=Shift_JIS' \
     -X POST --data-binary \
       '@docs/server-modernization/phase2/operations/assets/orca-api-requests/01_system01dailyv2_request.json' \
     'https://weborca-trial.orca.med.or.jp/api/api01rv2/system01dailyv2?class=00' \
     -D "${EVIDENCE_ROOT}/trial/system01dailyv2/response.headers" \
     -o "${EVIDENCE_ROOT}/trial/system01dailyv2/response.json" \
     --trace-ascii "${EVIDENCE_ROOT}/trace/system01dailyv2.trace"
```

- 参照 API（`acceptlstv2`, `appointlstv2`, etc.）も同じ RUN_ID/ディレクトリ構成で保存する。
- CRUD 操作を伴う場合は `data-check/<api>.md` に before/after と戻し手順を必ず記録する。
- 追加の `curl` テンプレが必要になった場合も本節を更新し、他ファイルは本節へのリンクだけを残す。

## 1. スコープと前提条件

| 項目 | 内容 |
| --- | --- |
| WebORCA 接続先 | `https://weborca-trial.orca.med.or.jp/`（CN=`weborca-trial.orca.med.or.jp`）。公開トライアル環境のため TLS クライアント証明書は不要、HTTP Basic のみでアクセスする。 |
| 認証情報 | ユーザー `trial` / パスワード `weborcatrial`（公式トライアルサイトで公開済み）。追加の API キーや PKCS#12 証明書は不要。|
| CRUD 方針（Trial） | `assets/orca-trialsite/raw/trialsite.md#snapshot-summary-2025-11-19` で「一部の管理業務を除き自由にお使いいただけます」と明記。トライアル環境限定で新規登録／更新／削除 OK、操作内容は必ずログ化して戻し方を記録する。|
| 利用不可機能 | Snapshot Summary 記載の通り、プログラム/マスタ更新、CLAIM 通信、プリンタ直接出力、レセプト一括/電算/CSV などは無効化されている。検証対象から除外し、`tmp/orca-weekly-summary.md` の週次欄にも「利用不可機能変更なし」と明記する。|
| モダナイズ版サーバー | `opendolphin-server-modernized-dev`（WildFly 27）。`ops/shared/docker/custom.properties` および `ops/modernized-server/docker/custom.properties` に `claim.host=weborca-trial.orca.med.or.jp` / `claim.send.port=443` / `claim.conn=server` / `claim.send.encoding=MS932` / `claim.scheme=https` を設定してから再ビルドする。 |
| ネットワーク | 作業端末から `weborca-trial.orca.med.or.jp:443` への outbound HTTPS が許可されていること。社内ネットワークで制限されている場合は VPN または許可済みホストへ切り替える。|
| DNS | 作業開始前にホスト OS で `Resolve-DnsName weborca-trial.orca.med.or.jp`（Windows）や `nslookup`/`dig` を実行し、A レコードを取得できることを確認する。WSL2 を利用する場合は Windows 側 `.wslconfig` に `generateResolvConf=false` を追加し、WSL 内では `/etc/resolv.conf` を手動管理する。`artifacts/orca-connectivity/<RUN_ID>/dns/` へ `nslookup`/`dig`/`ping` 証跡を保存する。 |
| データ | トライアル環境は週次でリセットされ、公開初期データ（患者 00001〜、医療機関=オルカクリニック 等）が常に投入される。登録内容は誰でも参照できるため、個人情報の投入は禁止。参照系 API を主に実行し、書き込み系は UI 操作確認の範囲に留める。 |

> Snapshot Summary との同期: `assets/orca-trialsite/raw/trialsite.md#snapshot-summary-2025-11-19` を更新したら必ず本表も更新し、逆に本表へ追記したい事項が出た場合は Snapshot を先に更新してから本 Playbook へ反映する。

## 2. 実施フロー概要

1. **トライアル情報の確認**: `assets/orca-trialsite/README.md` を参照し、利用制限・初期データ・ログイン情報を把握する。
2. **モダナイズ版サーバー設定**: `claim.*` 系プロパティをトライアル環境向けに更新し、`ServerInfoResource` で `claim.conn=server` を取得できるようにする。
3. **接続確認**: `curl -u trial:weborcatrial` で `/api/api01rv2/system01dailyv2` など read-only API を実行し、HTTP 200 / `Api_Result=00` を証跡化。
4. **API 検証**: P0（patient, accept, appoint）から順に `node scripts/tools/orca-curl-snippets.js` の出力を使って実行し、`artifacts/orca-connectivity/<UTC>/P0_*` へ保存。必要に応じて P1 以降も追加。
5. **結果整理**: `PHASE2_PROGRESS.md` の ORCA 欄と `docs/web-client/planning/phase2/DOC_STATUS.md` を更新し、失敗時は `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` のエスカレーション手順に従う。

## 3. 準備チェックリスト

### 3.1 トライアルサーバー資格情報

| 項目 | 値 | 参照先 |
| --- | --- | --- |
| ベース URL | `https://weborca-trial.orca.med.or.jp/` | [日レセを体験](assets/orca-trialsite/raw/trialsite.md#お試しサーバの接続法) |
| UI ログイン | ユーザー `trial` / パスワード `weborcatrial` | 同上（公式公開値） |
| API 認証 | HTTP Basic `trial:weborcatrial` | `curl -u trial:weborcatrial ...` で利用 |
| 初期データ | 患者番号 `00001`〜`00011` など | [登録されている初期データ](assets/orca-trialsite/raw/trialsite.md#登録されている初期データ) |
| 利用不可機能 | CLAIM 送信 / CSV 出力 / プログラム更新 等 | [お使いいただけない機能等](assets/orca-trialsite/raw/trialsite.md#お使いいただけない機能等) |

> トライアル環境は週次でリセットされるため、検証目的での患者登録・予約作成・診療削除などの CRUD 操作が許可される。作業後は `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に実施内容を記録し、再現に必要な入力値を残すこと。

### 3.2 モダナイズ版サーバー設定

- `ops/shared/docker/custom.properties` / `ops/modernized-server/docker/custom.properties` / `ops/shared/docker/custom-secret.properties` の各 `claim.*` を以下へ揃える。差分は Evidence に保存し、`ServerInfoResource` の結果と一緒に提出する。
  - `claim.conn=server`
  - `claim.host=weborca-trial.orca.med.or.jp`
  - `claim.send.port=443`
  - `claim.scheme=https`（または `claim.useSsl=true`）
  - `claim.send.encoding=MS932`
- `docker compose`（または `scripts/start_legacy_modernized.sh`）でモダナイズ側を再起動し、`/serverinfo/claim/conn` が `server` へ戻ることを確認。Legacy サーバーは必要に応じて read-only で並行起動する。

### 3.3 ネットワークとクライアント端末

- `dig weborca-trial.orca.med.or.jp` / `openssl s_client -connect weborca-trial.orca.med.or.jp:443 -servername weborca-trial.orca.med.or.jp` を実行し、アウトバウンド HTTPS が許可されていることを確認。証跡は `artifacts/orca-connectivity/<UTC>/tls/openssl_s_client.log` などへ保存。
- プロキシ越しの場合は `HTTPS_PROXY`／`NO_PROXY` を環境変数で定義し、`curl` が Basic 認証を正しく送信できるか `curl --verbose -u trial:weborcatrial --head` で検証する。
- 作業 PC 上の `~/.curlrc` に余計な `insecure` や `proxy` が残っていないかを確認。競合がある場合は一時的に別 `curlrc` を使用する。

### 3.4 CLI ツールとテンプレ

| ツール | 目的 | コマンド例 |
| --- | --- | --- |
| `node scripts/tools/orca-curl-snippets.js` | API ごとの curl コマンド生成 | `ORCA_BASE_URL=https://weborca-trial.orca.med.or.jp node scripts/tools/orca-curl-snippets.js --scenario p0` |
| `ops/tools/send_parallel_request.sh` | Modernized サーバー経由の API 呼び出しを再現 | `ORCA_TRIAL_USER=trial ORCA_TRIAL_PASS=weborcatrial PARITY_OUTPUT_DIR=artifacts/orca-connectivity/<UTC>/parallel ./ops/tools/send_parallel_request.sh --profile modernized-orca` |
| `curl`（Basic 認証） | 直接 API 実行・ヘッダー採取 | `curl -u "trial:weborcatrial" -H 'Content-Type: application/json; charset=Shift_JIS' ...` |

テンプレ Evidence は `artifacts/orca-connectivity/TEMPLATE/` を `cp -R` してから実施し、`README.md` に実行条件を追記する。

`docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/` には No.19-38（入院・保険・会計）の UTF-8 テンプレを配置した。`RUN_ID={{YYYYMMDD}}TorcaTrialZ1` のように採番したうえで、例えば入院患者一覧（#21）は以下のように収集する。

```bash
API_ID=21_tmedicalgetv2
mkdir -p "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}"
curl -u "${ORCA_TRIAL_USER}:${ORCA_TRIAL_PASS}" \
     -H 'Content-Type: application/xml; charset=UTF-8' \
     -H 'Accept: application/xml' \
     --data-binary @docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/${API_ID}_request.xml \
     'https://weborca-trial.orca.med.or.jp/api/api01rv2/tmedicalgetv2' \
     -D "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}/response.headers" \
     -o "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}/response.xml" \
     --trace-ascii "artifacts/orca-connectivity/${RUN_ID}/inpatient/${API_ID}/trace.log"
```

新規データを登録する場合は、同ディレクトリに `insert.log`（実行コマンド／UI 操作メモ）や `before_after.sql` を保存し、削除時は対象患者番号・予約番号・診療 ID を明記する。週次リセットでデータは初期化されるが、作業内容は必ずログへ記録する。

### 3.2 モダナイズ版サーバー設定

- `ops/shared/docker/custom.properties` / `ops/modernized-server/docker/custom.properties` / `ops/shared/docker/custom-secret.properties` に定義する `claim.*` はすべて WebORCA トライアル向けの下記値に統一する。差分は Evidence に保存し、`ServerInfoResource` の JSON と並べて提出する。
  - `claim.conn=server`
  - `claim.host=weborca-trial.orca.med.or.jp`
  - `claim.send.port=443`
  - `claim.scheme=https`（`claim.useSsl=true` でも可）
  - `claim.send.encoding=MS932`
- `docker compose`（または `scripts/start_legacy_modernized.sh`）でモダナイズ側を再起動し、`/serverinfo/claim/conn` が `server` を返すことを確認する。Legacy サーバーは read-only 参照のみで並行起動してもよい。

### 3.3 ネットワークとクライアント端末

- `dig weborca-trial.orca.med.or.jp` / `nslookup weborca-trial.orca.med.or.jp` / `openssl s_client -connect weborca-trial.orca.med.or.jp:443 -servername weborca-trial.orca.med.or.jp` を実行し、アウトバウンド HTTPS と SNI が問題ないことを確認する。証跡は `artifacts/orca-connectivity/<RUN_ID>/dns/` `.../tls/` へ保存する。
- プロキシ越しの場合は `HTTPS_PROXY`／`NO_PROXY` を環境変数で定義し、`curl --verbose -u trial:weborcatrial --head https://weborca-trial.orca.med.or.jp/` で Basic 認証が透過できるか確認する。
- 作業端末の `~/.curlrc` に `insecure` や `proxy` が残っていないかチェックし、必要なら一時的な `CURL_HOME` を用意して実行する。

### 3.4 CLI ツールとテンプレ

| ツール | 目的 | コマンド例 |
| --- | --- | --- |
| `node scripts/tools/orca-curl-snippets.js` | API ごとの curl コマンド生成 | `ORCA_BASE_URL=https://weborca-trial.orca.med.or.jp ORCA_BASIC_USER=trial ORCA_BASIC_PASS=weborcatrial node scripts/tools/orca-curl-snippets.js --scenario p0` |
| `ops/tools/send_parallel_request.sh` | Modernized サーバー経由の API 呼び出しを再現 | `ORCA_TRIAL_USER=trial ORCA_TRIAL_PASS=weborcatrial PARITY_OUTPUT_DIR=artifacts/orca-connectivity/<RUN_ID>/parallel ./ops/tools/send_parallel_request.sh --profile modernized-orca` |
| `curl`（Basic 認証） | 直接 API 実行・ヘッダー採取 | `curl -u "trial:weborcatrial" -H 'Content-Type: application/json; charset=Shift_JIS' ...` |

テンプレ Evidence は `artifacts/orca-connectivity/TEMPLATE/` を `cp -R` してから実施し、`README.md` に実行条件（利用 API・ログ出力先・CRUD 実施有無）を追記する。

`docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/` 配下のリクエスト雛形は「参考アーカイブ」として保存している。必要に応じて `ORCA_TRIAL_USER`／`ORCA_TRIAL_PASS` を利用した Basic 認証で再利用できるが、投入データを変更した場合は「トライアル環境で実施」「before/after ログ保存済み」と明記した `data-check/*.md` を残す。

### 3.5 監査・権限チェック

- PKCS#12 と Basic 情報は作業者ローカルのみで保持し、リポジトリやログへ貼り付け禁止。
- `history` に `trial:weborcatrial` など資格情報が残った場合は `history -d <line>` で削除し、必要なら `unset ORCA_TRIAL_PASS` を実行。
- `artifacts/` へ保存する際はキー・パスフレーズをマスクし、必要に応じて `<SECRET>` プレースホルダを記載。
- 入院 API のリクエスト/レスポンスは `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` へ集約し、患者 ID・保険者番号など PHI は `mask.txt` に置換ルールを添えてから共有する（`git add` 禁止で artifacts のまま保存）。

> **運用メモ（2025-11-15 更新）**  
> 接続先は常に WebORCA トライアルサーバーとし、CRUD を実施する場合でも「トライアル環境である」「操作内容をログ化済み」であることを Runbook §4.3 と `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に必ず記載する。ローカル WebORCA コンテナやアーカイブ済み seed の再構築は禁止。

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

1. `RUN_ID={{YYYYMMDD}}TorcaTrialCrudZ#` を採番し、`artifacts/orca-connectivity/${RUN_ID}/{dns,tls,trial,trace,data-check}` を作成する。
2. `dig weborca-trial.orca.med.or.jp`（macOS/Linux）または `Resolve-DnsName weborca-trial.orca.med.or.jp`（Windows）で A レコードを取得し、出力を `dns/resolve.log` に保存する。併せて `openssl s_client -connect weborca-trial.orca.med.or.jp:443 -servername weborca-trial.orca.med.or.jp` を実行し、TLS 交渉結果を `tls/openssl_s_client.log` へ記録する。
3. Basic 認証で `system01dailyv2` を 1 回実行し、HTTP/TLS の成功を確認する（`curl` 雛形は §0.4 を参照）。
4. `Api_Result=00` を確認し、`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へ `RUN_ID`／HTTP／`Api_Result`／証跡パスを追記する。

### 4.2 ServerInfoResource による `claim.conn` 確認

- `curl http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn -u <admin>` を実行し、レスポンスを `artifacts/<RUN_ID>/serverinfo/claim_conn.json` へ保存する。
- `claim.conn=server` 以外が返った場合は `ops/shared/docker/custom.properties` などの `claim.*` を修正し、再取得した差分を Evidence に残す。

### 4.3 P0 + CRUD API セット

- 参照系（system/accept/patient/appointment）と CRUD 系（予約登録・受付登録・診療明細操作）を全て WebORCA トライアルサーバーで実行する。`assets/orca-trialsite/raw/trialsite.md` を参照し、利用不可機能を事前確認する。
- CRUD 操作は「トライアル環境限定で新規登録／更新／削除 OK」。実施した内容は `artifacts/orca-connectivity/<RUN_ID>/data-check/<api>.md` と `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` の Checklist へ記録し、対象 ID・操作内容・戻し方を明示する。
- `ORCAcertification/` 配下の PKCS#12 や非公開資格情報はアーカイブ扱い。接続は `trial/weborcatrial` の Basic 認証のみを利用する。
- Trial HTTP 要件: `curl -vv -u trial:weborcatrial -H 'Accept: application/xml' -H 'Content-Type: application/xml' --data-binary @payloads/<api>_trial.xml https://weborca-trial.orca.med.or.jp/<path>` を共通フォーマットとし、`payloads/*.xml` は firecrawl 取得済み仕様（slug=`appointlst`,`appointmod`,`acceptancelst`,`acceptmod`,`medicalmod` 等）と整合させた XML を送信する。証跡にはリクエスト XML とレスポンス XML を `crud/<api>/` に保存する。
- `trialsite.md`「お使いいただけない機能一覧」に記載の API（例: `/20/adm/phr/*`）や POST 未解放エンドポイント（`/orca14/appointmodv2` 等）は Blocker=`TrialLocalOnly` として Runbook / Checklist / ログへ引用付きで記載し、ローカル ORCA（ORMaster 認証）に切り替える再開条件（doctor seed 復旧＋POST 解放）を示す。
- Doctor seed / データギャップ: Trial で HTTP200 かつ `Api_Result=12/13/14` が返る場合は `data-check/` と `crud/<api>/` にレスポンス XML を保存し、`assets/orca-trialsite/raw/trialsite.md#sample` に記載の seed（患者 5 桁 `00001`, 医師 `0001` など）との差異を `blocked/README.md` の「データギャップ」欄へ転記。GUI 端末がない場合は CLI 実測日時・再開条件を `data-check/README.md` に必ず記録する。
- カバレッジ更新: CRUD 実測後に `coverage/coverage_matrix.md` を再生成し、firecrawl 仕様スラッグを「Trial 提供(実測/未実測)」「Trial 非提供(trialsite#limit または HTTP404/405)」へ分類する。同じ集計結果を `docs/server-modernization/phase2/operations/logs/<date>-orca-trial-crud.md` と `DOC_STATUS` 備考欄に貼り付け、`blocked/README.md` と証跡パスを同期させる。
- ORMaster 前提 API（`/api/api21/medicalmodv2`, `/orca11/acceptmodv2` など）はトライアルサーバーで `Api_Result=10/13/14` となるため、`curl -vv -u ormaster:ormaster ... --data-binary @payloads/<api>_trial.xml http://localhost:8000/...` でローカル ORCA 実測を行い、トライアル結果は Blocker として残す。
- 2025-11-15 実測（RUN_ID=`20251115T134513Z`）: Codex CLI から DNS/TLS（`nslookup_2025-11-15T22:50:38+09:00.txt`, `openssl_s_client_2025-11-15T22:50:42+09:00.txt`）と `/api01rv2/acceptlstv2`（HTTP200/`Api_Result=13`）、`/api01rv2/appointlstv2`（HTTP200/`Api_Result=12`）、`/api/api21/medicalmodv2`（HTTP200/`Api_Result=10`）を取得。Evidence は `artifacts/orca-connectivity/20251115T134513Z/{dns,tls,crud,coverage,blocked}` および `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` に記録し、doctor/patient seed 欠落を Blocker=`TrialSeedMissing` として管理中。
- 2025-11-15 実測（RUN_ID=`20251115TrialConnectivityCodexZ1`）: 同 CLI 環境で `nslookup_2025-11-15T13-48-30Z.txt` / `openssl_s_client_2025-11-15T13-48-52Z.txt` を取得し、`/api01rv2/acceptlstv2`（HTTP200/`Api_Result=13`）、`/api01rv2/appointlstv2`（HTTP200/`Api_Result=12`）、`/api/api21/medicalmodv2`（HTTP200/`Api_Result=14`）を XML 送信。`/orca11/acceptmodv2` と `/orca14/appointmodv2` は `HTTP/1.1 405 Method Not Allowed` だったため Blocker=`TrialLocalOnly` として `blocked/README.md` と `coverage/coverage_matrix.md` へ登録。Evidence: `artifacts/orca-connectivity/20251115TrialConnectivityCodexZ1/{dns,tls,data-check,crud,coverage,blocked}`、ログ: `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`。

| # | エンドポイント | 種別 | 成功条件 | 証跡/ログ | CRUD 記録ポイント |
| --- | --- | --- | --- | --- | --- |
| 1 | `POST /api01rv2/patientgetv2` | 参照 | HTTP 200 / `Api_Result=00` で患者 `00001` の基本情報を取得 | `trial/patientgetv2.{headers,json}`, `trace/patientgetv2.trace` | `data-check/patientgetv2.md` に照会条件と取得件数を記載 |
| 2 | `POST /api01rv2/appointlstv2` | 参照 | HTTP 200 で `Appointment_Information` が返る（20251115 RUN は doctor seed 欠落で `Api_Result=12`。GUI から医師 `0001` を再登録後に再測定） | `trial/appointlstv2.{headers,json}`、`screenshots/appointlstv2.png` | `data-check/appointlstv2.md` に UI との突合結果と不足 seed を記録 |
| 3 | `POST /api01rv2/acceptlstv2` | 参照 | HTTP 200 / `Api_Result=00`（20251115 RUN は doctor seed 欠落で `Api_Result=13`。受付 seed 復旧後に `21`→`00` を確認） | `trial/acceptlstv2.{headers,json}` | `data-check/acceptlstv2.md` に当日受付件数と Blocker 所見を記録 |
| 4 | `POST /orca14/appointmodv2` | 新規・更新・削除 | (Trial) HTTP 405 `Allow: OPTIONS, GET`。Blocker=`TrialLocalOnly`。ローカル ORCA では HTTP 200 / `Api_Result=00` となり予約が `appointlstv2` で確認できる | Trial: `crud/appointmodv2/http405/{request,response}.http`。Local: `curl -vv -u ormaster:ormaster ... --data-binary @payloads/appointmod_trial.xml http://localhost:8000/orca14/appointmodv2?class=01` と `trace/appointmodv2.trace` | `data-check/appointmodv2.md` に予約番号・変更内容・撤回操作を記載し、Blocker と再開条件（ローカル ORCA 起動許可＋doctor seed 復旧）を追記 |
| 5 | `POST /api/api21/medicalmodv2` | 診療明細 CRUD | Trial: HTTP 200 でも `Api_Result=10/14`（20251115 RUN は患者 `00000001` 不在で `Api_Result=10`）。Local: HTTP 200 / `Api_Result=00` で `Medical_Information` が取得できる | `crud/medicalmodv2/{request,response}.xml`（`payloads/medical_update_trial.xml`）と `trace/medicalmodv2.trace` | `data-check/medicalmodv2.md` に患者番号・診療 ID・操作目的。Trial では Blocker=`TrialSeedMissing`（doctor/patient seed 復旧後に再測定）を記載 |
| 6 | `POST /orca11/acceptmodv2` | 受付 CRUD | Trial: HTTP 200 / `Api_Result=10/13`。Local: HTTP 200 / `Api_Result=00` & `Delete_Flg=1` を確認 | `crud/acceptmodv2/{request,response}.xml`（`payloads/acceptmod_trial.xml`）、`trace/acceptmodv2.trace` | `data-check/acceptmodv2.md` に受付番号・操作種別・戻し要否。Trial 側は Blocker=`TrialLocalOnly` に分類 |

- 書き込み前後で `acceptlstv2` や `appointlstv2` を取得し、`data-check` に before/after を保存する。ログディレクトリは `artifacts/orca-connectivity/<RUN_ID>/trial/<api>/` へ統一し、`trace/` と `screenshots/` も同じ RUN_ID で揃える。

### 4.4 PHR シーケンス証跡テンプレ

- RUN_ID=`YYYYMMDDTorcaPHRSeqZ#` を払い出し、`artifacts/orca-connectivity/TEMPLATE/phr-seq` をコピーして使用する。
- `audit/logs/phr_audit_extract.sql` で `event_id LIKE 'PHR_%'` を抽出し、`logs/phr_audit_${RUN_ID}.sql` として保存する。欠落イベントは `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md#pending-risks` へ転記する。
- HTTP 証跡は `trial/phr/<api>.{headers,json}`、UI 証跡は `screenshots/phr-XX.png` にまとめ、`ServerInfoResource` の JSON を並記する。
- Modernized 開発環境での Secrets/Context チェックは RUN_ID=`20251121TrialPHRSeqZ1-CTX` を参照。`1.3.6.1.4.1.9414.72.103:admin` ユーザーを BASIC 認証で登録し、`serverinfo/claim_conn.json`（body=`server`）/SHA256、および `wildfly/phr_20251121TrialPHRSeqZ1-CTX.log` に出力された `PHR_*_TEXT` 監査を証跡化した。`PHRResource` の SignedUrl フォールバックは `PHRKey`/`PHRAsyncJob` が PersistenceUnit 未登録のため `UnknownEntityException` で停止することが判明しており、`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md#4-task-e-secretscontext-再検証-run_id20251121trialphrseqz1-ctx` に Blocker を記録した。

### 4.5 HTTP 401/403/404/405 トリアージ

- Basic 認証での再現ログ（`curl -v -u trial:weborcatrial ...`）、`openssl s_client`、`dns/` 証跡、`ServerInfoResource` を最低限のセットとする。
- 405 や 404 を取得した場合は `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` のフォーマットで `httpdump/{api}/request.http` `response.http` を保存し、`logs/<date>-orca-connectivity.md` へ `【調査】` ブロックを追記する。
- エラーが継続する場合は `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` の WebORCA 節（Basic 認証版）に従い、Slack → PagerDuty → Backend Lead の順でエスカレーションする。

### 4.6 報告とエスカレーション

1. `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` の RUN_ID 表を更新し、CRUD 実施内容と証跡パスを記載する。
2. `artifacts/orca-connectivity/<RUN_ID>/README.md` に TLS/DNS 証跡、実行 API、CRUD の before/after、ログ保存先を列挙する。
3. `docs/web-client/planning/phase2/DOC_STATUS.md` の ORCA 接続欄をタスク担当へリレーし、必要なら `docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md` へ補足メモを追加する。
4. Blocker 発生時は Slack `#server-modernized-alerts` → PagerDuty → Backend Lead の順で報告し、`logs/<date>-orca-connectivity.md` には `【連絡】` ブロックで経緯を残す。

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
| 43 | `/orca51/masterlastupdatev3` | RUN 未実施（system daily の付帯チェック） | `system01dailyv2` 後に 1 回だけ呼び、`trial/masterlastupdatev3.*` に結果を保存する。`ORCA_API_STATUS.md` §2.4。 |
| 44 | `/api01rv2/system01dailyv2` | `HTTP 200 / Api_Result=00`（UTF-8） | RUN_ID=`20251113T002806Z`。Shift_JIS は `Api_Result=91` のためテンプレを UTF-8 に統一。 |
| 45 | `/api01rv2/patientlst7v2` | RUN 未実施（memomodv2 依存） | `patientmemomodv2` 405 のため内容を確認できない。`notes/orca-api-field-validation.md` §3.3。 |
| 46 | `/api21/medicalmodv23` | `HTTP 405 (Allow: GET)` | RUN_ID=`20251113T002806Z`。route 開放依頼中。テンプレは XML `<medicalv2req3>`. |
| 47 | `/orca36/hsfindv3` | RUN 未実施（既存入院データ欠落） | Admission_Date 条件を満たす患者が居らず未着手。入院データが揃い次第に再測し、それまでは欠落状況をログへ追記する。 |
| 48 | `/api01rv2/contraindicationcheckv2` | RUN 未実施（薬剤履歴データ欠落） | `Check_Term` / `Medication_Information[]` の XML は準備済み。薬剤履歴が取得できたタイミングで実行し、seed 追加は行わない。 |
| 49 | `/api01rv2/insuranceinf1v2` | RUN 未実施（初期キャッシュ未取得） | `Base_Date` を当日で 1 回取得し、`trial/insuranceinf1v2.*` に保存する TODO を §4.4 に追加。 |
| 50 | `/api01rv2/subjectiveslstv2` | RUN 未実施（症状詳記 UI 未定） | Request_Number=01-03 の仕様整理は完了。カルテ UI 実装時に実行。 |
| 51 | `/api01rv2/patientlst8v2` | RUN 未実施（旧姓データ欠落） | 旧姓履歴を持つ患者が WebORCA 本番に存在しないため保留。復旧後に `/api01rv2/patientlst8v2` を実行し、それまでは欠落記録のみ更新する。 |
| 52 | `/api01rv2/medicationgetv2` | RUN 未実施（2024-11 追加 API） | 診療コード検索の必須 API。`ORCA_API_STATUS.md` §2.4 参照。`ORCA_CONNECTIVITY_VALIDATION.md` に手順を追加済み。 |
| 53 | `/orca06/patientmemomodv2` | `HTTP 405 (Allow: GET)` | RUN_ID=`20251113T002806Z`。memo CRUD は ORCA route 復旧待ち。`notes` §3.3。 |

## 6. ログおよび Evidence ルール

1. **CLI 出力**: `curl`, `openssl s_client`, `ServerInfoResource`, `node scripts/tools/orca-curl-snippets.js` のログはすべて `artifacts/orca-connectivity/<UTC>/` に保存。ファイル名例: `01_tls_handshake.log`, `02_acceptlstv2_request.http`, `02_acceptlstv2_response.http`。
2. **テンプレ Evidence**: `artifacts/orca-connectivity/TEMPLATE/` をコピーした直後に `README.md` へ `RUN_ID`, `UTC`, 使用した Basic 認証（`trial/weborcatrial`）と CRUD 実施有無を追記する。
3. **ドキュメントリンク**: `docs/server-modernization/phase2/PHASE2_PROGRESS.md` の当日欄と本 Runbook の該当セクションを双方向リンクにする。
4. **通知**: 失敗時は Slack `#server-modernized-alerts` → PagerDuty → Backend Lead の順に連絡。
5. **Archive**: 30 日以上参照しないログは `docs/archive/<YYYYQn>/orcaconnect/` へ移し、元ファイルにはスタブと移動先リンクを残す。
6. **命名ルール**: Evidence ディレクトリは UTC タイムスタンプ（`YYYYMMDDThhmmssZ`）を用いる。命名チェックは `node scripts/tools/orca-artifacts-namer.js` で行い、0 以外の終了コードは再実行禁止。
7. **秘匿情報のマスキング**: `request.http` に資格情報を含めない。curl コマンドは `--user <MASKED>` 形式で保管し、実行時のみ `env` から展開する。

## 7. WebORCA トライアル運用メモ

1. **利用範囲**: `https://weborca-trial.orca.med.or.jp/` のみを接続先とし、CRUD を実施した場合は必ず `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` と `artifacts/.../data-check/` に操作内容・対象 ID・戻し有無を記録する。
2. **資格情報の扱い**: Basic 認証は公開アカウント `trial/weborcatrial` を使用する。履歴や Evidence には `<MASKED>` 表記を用い、`curl -u "trial:weborcatrial"` のまま保存しない。
3. **テンプレ更新**: `docs/web-client/planning/phase2/DOC_STATUS.md` にトライアル方針へ切り替えた旨と証跡パスを記載し、`docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md` の RUN_ID 表を最新化する。
4. **安全ガード**: ローカル WebORCA コンテナの再構築や `ORCAcertification/` 配下の PKCS#12 はアーカイブ扱いとする。必要な資料は `assets/orca-trialsite/raw/trialsite.md` から辿り、利用不可機能を参照して作業範囲を決める。
5. **報告**: Blocker や CRUD 失敗時は Slack `#server-modernized-alerts` → PagerDuty → Backend Lead の順で共有し、Runbook §4.6 の流れでログへ `【連絡】` ブロックを追加する。

---

- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` フェーズ 4（ORCA セクション）と `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md#weborca-trial` に本タスクリストの要約を反映すること。
- 旧 WebORCA コンテナ手順や本番ホスト向け手順はすべてアーカイブ済み。必要に応じて `docs/archive/2025Q4/` の履歴のみ参照する。
