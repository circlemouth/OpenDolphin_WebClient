# ORCA 接続 Single Playbook

> ⚠️ **【重要】2026-01-04 更新**
>
> **標準の接続先**は WebORCA Trial（`https://weborca-trial.orca.med.or.jp`）とする。
> Basic 認証 + **XML(UTF-8)** を標準とし、JSON/Shift_JIS 前提は廃止する。
>
> - 接続先・認証情報は `ORCA_CERTIFICATION_ONLY.md` を正として運用する
> - 証明書（PKCS#12）は不要
> - 過去ログの本番/証明書前提は歴史的経緯として扱う

- 2025-11-21 エラー採取 RUN（RUN_ID=`20251121T153300Z`, 親=`20251120T193040Z`）で下記を確認: 成功=HTTP200/`Api_Result=00`（**当時は `POST /api01rv2/system01dailyv2?class=00`、現行は `?class=00` を付与しない**）、誤パスワード=HTTP401 JSON、未登録患者=HTTP404 JSON（`GET /api01rv2/patientgetv2?id=999999`）、`/actuator/health`=HTTP404。Authorization はすべて `<MASKED>`。証跡: `artifacts/error-audit/20251121T153300Z/README.md`、ログ: `docs/server-modernization/phase2/operations/logs/20251120T193040Z-error-audit.md#5-子-run-20251121t153300z-実測ログ親20251120t193040z`。
- 2025-11-21 業務系エラー採取 RUN（RUN_ID=`20251121ErrorMatrixZ1`, 親=`20251120T193040Z`）で下記を確認: `system01dailyv2` Request_Number=99 → HTTP200/`Api_Result=91`、`acceptlstv2` Acceptance_Date=2000-01-01 & Physician_Code=99999 → HTTP200/`Api_Result=13`、`/api/api21/medicalmodv2` Patient_ID=999999 → HTTP200/`Api_Result=10`。Authorization は `<MASKED>` 済み。証跡: `artifacts/error-audit/20251121ErrorMatrixZ1/README.md`、ログ: `docs/server-modernization/phase2/operations/logs/20251120T193040Z-error-audit.md#6-子-run-20251121errormatrixz1-実測ログ親20251120t193040z`。
- 作成日: 2025-11-19
- 対象: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に記載された WebORCA Trial サーバー（モダナイズ版 OpenDolphin サーバーと連携）。
- 目的: Trial 環境での疎通・API 呼び出し・CRUD 検証知見を単一 Runbook に集約し、RUN_ID 発行／ログ保存／週次棚卸しのやり方を一本化する。
- 参照: [ORCA API 公式仕様](https://www.orca.med.or.jp/receipt/tec/api/overview.html) / [オフラインコピー](assets/orca-api-spec/README.md) / [技術情報ハブ（帳票・CLAIM・MONTSUQI 等）](assets/orca-tec-index/README.md)

> **Single Playbook の目的**: ORCA 接続に関する知見を本ドキュメントに一本化する。関連ドキュメント（`ORCA_API_STATUS.md`, `MODERNIZED_API_DOCUMENTATION_GUIDE.md` など）は本 Playbook へのリンクと参照情報のみを記載する。
>
> **接続先ポリシー**: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` 記載の Trial サーバーを接続先とする。認証は同ファイル記載の Basic 情報を使用する。
>
> **結果物**
> 1. `docs/server-modernization/phase2/operations/logs/<YYYYMMDD>-orca-connectivity.md` に RUN_ID と証跡パスを追記。
> 2. `artifacts/orca-connectivity/<RUN_ID>/` に接続先 `curl` リクエスト・レスポンス、`ServerInfoResource` 結果、DNS/TLS ログ、`tmp/orca-weekly-summary.*` 実行ログを保存。
> 3. `docs/web-client/planning/phase2/DOC_STATUS.md` の ORCA 接続項目と週次棚卸し項目を Active に更新し、接続確認が不要な項目を削除。
## 0. Single Playbook 運用ルール

- 本項目に RUN_ID 発行、ログ保存、週次棚卸しの手順を記載する。`ORCA_API_STATUS.md`/`MODERNIZED_API_DOCUMENTATION_GUIDE.md` は本項目での参照はせず、別途最新化を行う。
- 接続先は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に記載された Trial 環境を使用する。
### 0.1 RUN_ID 発行テンプレート

1. RUN_ID は `YYYYMMDD` + 目的 + `Z#` で命名する。例: `RUN_ID=20251120TrialCrudPrepZ1`（Trial CRUD 準備 1回目）。
2. 目的は `TrialCrud`, `TrialAppoint`, `TrialAccept`, `TrialMedical`, `TrialHttpLog`, `TrialWeekly` などタスク種別が分かる略語を使用する。
3. 発行手順
   ```bash
   export RUN_ID=20251120TrialCrudPrepZ1
   export EVIDENCE_ROOT="artifacts/orca-connectivity/${RUN_ID}"
   mkdir -p "${EVIDENCE_ROOT}/"{dns,tls,trial,trace,data-check}
   rsync -a artifacts/orca-connectivity/TEMPLATE/ "${EVIDENCE_ROOT}/"
   ```
4. `artifacts/orca-connectivity/TEMPLATE/00_README.md` の命名ルールが順守されているか `node scripts/tools/orca-artifacts-namer.js artifacts/orca-connectivity` で確認する。
### 0.2 ログ保存とリンク集

1. 実施日付ごとのサマリは `docs/server-modernization/phase2/operations/logs/<YYYYMMDD>-orca-connectivity.md` に記載し、過去 RUN_ID を最新順で記述する。例: `logs/2025-11-15-orca-connectivity.md`。
2. 実施ログの保存先は `artifacts/orca-connectivity/<RUN_ID>/` ディレクトリとし、`dns/`, `tls/`, `trial/<api>/`, `trace/`, `data-check/`, `screenshots/` を RUN_ID 単位で管理する。
3. 関連ドキュメントをサマリドキュメントへ記載する際は、`ORCA_CONNECTIVITY_VALIDATION.md` §0 を順守し、別途最新化を行う。特に `ORCA_API_STATUS.md` は最新のステータスとタスク進捗のみを扱い、過去の実施ログは本 Playbook へリンクする。
4. `artifacts/orca-connectivity/<RUN_ID>/README.md` を Evidence 目的として更新し、DNS/TLS ログと CRUD 実行結果を記載する。
### 0.3 `tmp/orca-weekly-summary.*` の週次棚卸し

1. `npm run orca-weekly` 実行後、`tmp/orca-weekly-summary.json` と `tmp/orca-weekly-summary.md` が生成される。
2. Markdown 版を下記 3 箇所に手動で棚卸しして反映する。
   - `docs/web-client/planning/phase2/DOC_STATUS.md` の「モダナイズ/外部接続 ORCA」項目の RUN_ID と Evidence パス。
   - `docs/web-client/README.md` ORCA セクションの「最終確認」。
   - `docs/server-modernization/phase2/PHASE2_PROGRESS.md` ORCA 欄の週次棚卸し。
3. XML 版と CLI 実行結果は `artifacts/orca-connectivity/validation/<RUN_ID>/weekly_summary.log` へ棚卸しする。`RUN_ID` は `YYYYMMDDTrialWeeklyZ#` を付与して記録する。
### 0.4 curl テンプレート（Basic 認証）
`MODERNIZED_API_DOCUMENTATION_GUIDE.md` §3.2 から引用する cURL 実行例を本項目で統一する。Basic 認証・**XML(UTF-8)**・Evidence 保存ルールを厳守する。
```bash
export ORCA_TRIAL_USER=<参照: docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md>
export ORCA_TRIAL_PASS=<参照: docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md>
export RUN_ID=20251120TrialCrudPrepZ1
EVIDENCE_ROOT="artifacts/orca-connectivity/${RUN_ID}"
mkdir -p "${EVIDENCE_ROOT}/trial/system01dailyv2" \
         "${EVIDENCE_ROOT}/trace" \
         "${EVIDENCE_ROOT}/data-check"
curl --silent --show-error \
     -u "${ORCA_TRIAL_USER}:${ORCA_TRIAL_PASS}" \
     -H 'Content-Type: application/xml; charset=UTF-8' \
     -H 'Accept: application/xml' \
     -X POST --data-binary \
       '@docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/44_system01dailyv2_request.xml' \
     '<参照: docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md>/api/api01rv2/system01dailyv2' \
     -D "${EVIDENCE_ROOT}/trial/system01dailyv2/response.headers" \
     -o "${EVIDENCE_ROOT}/trial/system01dailyv2/response.xml" \
     --trace-ascii "${EVIDENCE_ROOT}/trace/system01dailyv2.trace"
```

- 関連 API（`acceptlstv2`, `appointlstv2`, etc.）も同様に RUN_ID/ディレクトリ単位で保存する。
- CRUD 操作を伴う場合は `data-check/<api>.md` に before/after と比較結果を必ず記録する。
- 記載の `curl` テンプレートが利用できない場合は本項目を更新し、関連ファイルは本項目へのリンクだけを記載する。
## 1. スコープと前提条件

| 項目 | 内容 |
| --- | --- |
| WebORCA 接続先 | `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を参照。Trial 環境を標準検証先として使用。 |
| 認証情報 | ユーザー / パスワードは `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` を参照。 |
| CRUD 方針 | 仮想データに対する全 CRUD 操作を許可。`receipt_route.ini` で POST が許可されていることが前提 (現状 405 のため要設定変更)。 |
| 利用不可機能 | 特になし (構成による)。 |
| モダナイズ版サーバー | `opendolphin-server-modernized-dev` (WildFly 27)。`ops/shared/docker/custom.properties` および `ops/modernized-server/docker/custom.properties` に `claim.host` / `claim.send.port` / `claim.conn=server` / `claim.send.encoding=MS932` / `claim.scheme` を設定してから再ビルドする（値は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` 参照）。 |
| ネットワーク | 作業端末から対象 ORCA サーバーへの HTTP 通信が許可されていること。 |
| DNS | IP 指定のため名前解決は不要。 |
| データ | 開発用データ。CRUD 操作はログに残すが、トライアルのような週次リセットはないため、テスト後のデータクリーンアップを推奨。 |

> Snapshot Summary との比較: `assets/orca-trialsite/raw/trialsite.md#snapshot-summary-2025-11-19` を更新した上で本項目も更新する。もし本項目に追加したい項目が新しく出た場合は Snapshot を先に更新してから本 Playbook へ反映する。
## 2. 実施フロー
1. **トライアル情報・接続情報の確認**: `assets/orca-trialsite/README.md` を参照し、利用制限・初期データ・ログイン情報を把握する。実際の接続先は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に従う。
2. **モダナイズ版サーバー設定**: `claim.*` 系プロパティを開発用 ORCA 環境向けに更新し、`ServerInfoResource` で `claim.conn=server` を取得できるようにする。
3. **接続確認**: `curl` で `/api/api01rv2/system01dailyv2` など read-only API を実行し、HTTP 200 / `Api_Result=00` を証跡化。
4. **API 検証**: P0（patient, accept, appoint）から順に `node scripts/tools/orca-curl-snippets.js` の出力を使い実行し、`artifacts/orca-connectivity/<UTC>/P0_*` へ保存。必要に応じて P1 以降も追加。
5. **結果整理**: `PHASE2_PROGRESS.md` の ORCA 欠と `docs/web-client/planning/phase2/DOC_STATUS.md` を更新し、失敗時は `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` のエスカレーション手順に従う。
## 3. 準備チェックリスト
### 3.1 Trial サーバー事前情報

| 項目 | 値 | 参照先 |
| --- | --- | --- |
| ベース URL | `https://weborca-trial.orca.med.or.jp` | `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` |
| API 認証 | Basic 認証（証明書不要） | 同上 §2 参照 |
| 初期データ | Trial 環境依存 | - |
| 利用不可機能 | Trial 環境の制限に従う | - |

> Trial 環境で CRUD 操作を実施した場合は必ず `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に実施記録を記録し、操作内容・対象 ID・結果を明記すること。
### 3.2 モダナイズ版サーバー設定
- `ops/shared/docker/custom.properties` / `ops/modernized-server/docker/custom.properties` / `ops/shared/docker/custom-secret.properties` の各 `claim.*` を以下へ書き換える。差分は Evidence に保存し、`ServerInfoResource` の結果と一列に掲載する。
  - `claim.conn=server`
  - `claim.host=<参照: docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md>`
  - `claim.send.port=<参照: docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md>`
  - `claim.scheme=<参照: docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md>`
  - `claim.send.encoding=MS932`
- `docker compose` または `scripts/start_legacy_modernized.sh` でモダナイズ版を起動し、`/serverinfo/claim/conn` が `server` を返すことを確認する。Legacy サーバーは read-only 目的のみで起動してもよい。
### 3.3 ネットワークとクライアント設定

- `dig <HOST>` / `nslookup <HOST>` / `openssl s_client -connect <HOST>:<PORT> -servername <HOST>` を実行し、アウトバウンド HTTPS と SNI が問題ないことを確認する。証跡は `artifacts/orca-connectivity/<RUN_ID>/dns/` `.../tls/` へ保存する。
- プロキシ越しの場合は `HTTPS_PROXY` / `NO_PROXY` を環境変数で定義し、`curl --verbose -u user:pass --head <URL>` で Basic 認証が通過できるか確認する。
- 作業端末の `~/.curlrc` に `insecure` や `proxy` が残っていないかチェックし、必要なら一時的な `CURL_HOME` を用意して実行する。
### 3.4 CLI ツールとテンプレート

| ツール | 目的 | コマンド例 |
| --- | --- | --- |
| `node scripts/tools/orca-curl-snippets.js` | API ごとの curl コマンド生成 | `ORCA_BASE_URL=<URL> ORCA_BASIC_USER=<USER> ORCA_BASIC_PASS=<PASS> node scripts/tools/orca-curl-snippets.js --scenario p0` |
| `ops/tools/send_parallel_request.sh` | Modernized サーバー負荷の API 呼び出しを並列実行 | `ORCA_TRIAL_USER=<MASKED> ORCA_TRIAL_PASS=<MASKED> PARITY_OUTPUT_DIR=artifacts/orca-connectivity/<RUN_ID>/parallel ./ops/tools/send_parallel_request.sh --profile modernized-orca` |
| `curl`（Basic 認証） | 疎通 API 実行・文字コード指定 | `curl -u "<MASKED>:<MASKED>" -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' ...` |

テンプレート Evidence は `artifacts/orca-connectivity/TEMPLATE/` を `cp -R` してから実行し、`README.md` に実行詳細・利用 API・ログ出力・CRUD 実行有無を追記する。
`docs/server-modernization/phase2/operations/assets/orca-api-requests/xml/` ディレクトリのリクエスト雛形は「開発用テンプレート」として保存している。もし利用して `ORCA_TRIAL_USER`・`ORCA_TRIAL_PASS` を利用した Basic 認証で再実行できるが、初期データを変更した場合は、「トライアルサーバーで実行」、「before/after ログ保存」と明記し `data-check/*.md` を記載する。
### 3.5 機密情報・個人情報の取り扱い

- Basic 認証情報は作業者ローカルのみで保管し、リポジトリやログへ貼り付け禁止。
- `history` に資格情報が残った場合は `history -d <line>` で削除し、必要なら `unset ORCA_TRIAL_PASS` を実行。
- `artifacts/` へ保存する際はキー・パスフレーズをマスクし、必要に応じて `<SECRET>` プレースホルダを記載。
- 入院 API のリクエスト・レスポンスは `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` へ集約し、患者 ID・被保険者番号など PHI は `mask.txt` に置換ルールを添えてから共有する（`git add` 禁止で artifacts のまま保存）。
> **運用メモ（2026-01-04 更新）**
> 接続先は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` に記載された Trial 環境を使用する。CRUD を実施した場合は必ず Runbook §4.3 と `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` に記載する。
### 3.6 Push・帳票・患者メモの追加項目・事前確認と課題

| 項目 API | 追加で利用するもの | 補足 |
| --- | --- | --- |
| `/api01rv2/pusheventgetv2` / `/orca42/receiptprintv3` | push-exchanger・帳票連携設定（`/blobapi` 関連機能）。特に `print002` 連携確認 | `manifest.json` No.41/42。連携がうまくいかない場合は seed を追加してみる。Ops に運用情報を共有する。成功したイベントのみ `artifacts/orca-connectivity/<RUN_ID>/push/` に保存。 |
| `/orca51/masterlastupdatev3` / `/api01rv2/insuranceinf1v2` | `system01dailyv2` 確認テンプレートと連携。特に `claim.host` 設定確認 | TTL 変更のため `system01dailyv2` → `masterlastupdatev3` → `insuranceinf1v2` の順で 1 秒おきに実行する。最終的なマトリクスは seed ではできない。Ops 接続で運用機能を確認。 |
| `/api01rv2/patientlst7v2` / `/orca06/patientmemomodv2` | ORCA UI で事前に登録されている患者メモ。`Memo_Mode` / `Memo_Class` の選択肢確認 | `patientmemomodv2` は POST 実行後（405）のため参照のみ許可。メモがうまくいかなくても seed で対応可能。`notes/orca-api-field-validation.md` §3.3 とログに連携情報を記録する。 |
| `/orca31/hspmmv2` / `/orca31/hsacctmodv2` | 事前に登録済みの入院診療行為データと `Perform_Month` の関連結果 | 事前に登録済みの入院患者がいないと確認が難しい。入院患者が純粋に確認し、それまでは連携結果をログに追加する。 |

No.19-38 で作成した XML テンプレートの確認は `artifacts/orca-connectivity/<RUN_ID>/inpatient/<API_ID>/` 配下にまとめる。Push/帳票/患者メモ系は `push/` と `memo/` シナリオディレクトリと同様の構造で管理する。`notes/orca-api-field-validation.md` §3 の seed 後の「正常に登録された項目情報」の確認として扱い、開発環境では連携結果と確認テンプレートのみを追記する。
## 4. 検証シナリオ

### 4.1 TLS/BASIC 疎通チェック

1. `RUN_ID={{YYYYMMDD}}TorcaTrialCrudZ#` を採番し、`artifacts/orca-connectivity/${RUN_ID}/{dns,tls,trial,trace,data-check}` を作成する。
2. `dig <HOST>` (macOS/Linux) または `Resolve-DnsName <HOST>` (Windows) で A レコードを取得し、出力を `dns/resolve.log` に保存する。併せて `openssl s_client -connect <HOST>:<PORT> -servername <HOST>` を実行し、TLS 交換結果を `tls/openssl_s_client.log` へ記録する。
3. Basic 認証で `system01dailyv2` を 1 回実行し、HTTP/TLS の成功を確認する（`curl` 雛形は §0.4 を参照）。
4. `Api_Result=00` を確認し、`docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` へ `RUN_ID`・HTTP・`Api_Result`・証跡パスを追記する。
### 4.2 ServerInfoResource による `claim.conn` 確認
- `curl http://server-modernized-dev:8080/openDolphin/resources/serverinfo/claim/conn -u <admin>` を実行し、レスポンスを `artifacts/<RUN_ID>/serverinfo/claim_conn.json` に保存する。
- `claim.conn=server` 以外が返った場合は `ops/shared/docker/custom.properties` などの `claim.*` を修正し、その変更内容を Evidence に残す。
### 4.3 P0 + CRUD API シナリオ

> RUN_ID=`20251116T173000Z`: Trial サーバーで POST/PHR API が利用されている間は Spec-based 実行として扱い、別途 ORMaster・本番相当サーバー接続に切り替えて再検証を行う。再検証後に DOC_STATUS・Runbook・API_STATUS を随時更新する。
- 参照系（system/accept/patient/appointment）と CRUD 系（予約登録・受付登録・診療明細操作）を全て対象 ORCA サーバーで実行する。`assets/orca-trialsite/raw/trialsite.md` を参照し、使用不可機能を事前確認する。
- CRUD 操作は「トライアル環境限定で新規登録・更新・削除 OK」。実施した内容は `artifacts/orca-connectivity/<RUN_ID>/data-check/<api>.md` と `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` の Checklist へ記録し、対象 ID・操作内容・戻し方を明示する。
- `ORCAcertification/` 配下の PKCS#12 はアーカイブ扱い。接続は `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` の Basic 認証のみを使用する。
- Trial HTTP 要件: `curl -vv -u user:pass -H 'Accept: application/xml' -H 'Content-Type: application/xml' --data-binary @payloads/<api>_trial.xml <URL>/<path>` を共通フォーマットとし、`payloads/*.xml` は firecrawl 取得済み仕様（slug=`appointlst`,`appointmod`,`acceptancelst`,`acceptmod`,`medicalmod` 等）と整合させた XML を送信する。証跡にはリクエスト XML とレスポンス XML を `crud/<api>/` に保存する。- `trialsite.md` の「利用できない API」に記載の API（例: `/20/adm/phr/*`）と POST 予約登録イベント（例: `/orca14/appointmodv2` 等）は Blocker=`TrialLocalOnly` として Runbook / Checklist / ログに記載で確認し、ORCA（ORMaster 相当）接続に切り替えて実施可能条件（doctor seed 整備・POST 予約登録）を提示する。- Blocker を解消した API については RUN_ID=`20251116T173000Z` の `docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` に従う。Final validation は Production/ORMaster 接続（例: `curl -vv -u ormaster:ormaster --data-binary @payloads/<api>_prod.xml https://ormaster.orca.med.or.jp/<path>`）で実行する。DNS/TLS（`nslookup`, `openssl s_client`）確認と Basic 認証ログをセットで取得し、`operations/logs/<RUN_ID>-prod-validation.md` にリンクするまで Blocker を解消しない。- Doctor seed / データ不足: Trial で HTTP200 かつ `Api_Result=12/13/14` が返る場合は `data-check/` と `crud/<api>/` にレスポンス XML を保存し、`assets/orca-trialsite/raw/trialsite.md#sample` に記載の seed（例: 患者 5 桁 `00001`, 医師 `0001` など）との重複を `blocked/README.md` の「データ不足」欄に記載。UI 側がなくても CLI 実行時の実施可能条件を `data-check/README.md` に必ず記載する。- カバレッジ更新: CRUD 実行後に `coverage/coverage_matrix.md` を随時更新し、Firecrawl 取得シナリオを「Trial 実行/未実行)」、「Trial 制限（trialsite#limit または HTTP404/405）」へ振り分ける。その実施結果を `docs/server-modernization/phase2/operations/logs/<date>-orca-trial-crud.md` と `DOC_STATUS` 該当欄に棚卸しし、`blocked/README.md` と確認テンプレートを随時更新する。- ORMaster 関連 API（例: `/api/api21/medicalmodv2`, `/orca11/acceptmodv2` など）がトライアルサーバーで `Api_Result=10/13/14` となるため、`curl -vv -u ormaster:ormaster ... --data-binary @payloads/<api>_trial.xml http://localhost:8000/...` でローカル ORCA 実行を行う。トライアル結果は Blocker として扱う。- 2025-11-15 実行（RUN_ID=`20251115T134513Z`）：Codex CLI から DNS/TLS（`nslookup_2025-11-15T22:50:38+09:00.txt`, `openssl_s_client_2025-11-15T22:50:42+09:00.txt`）と `/api01rv2/acceptlstv2`（HTTP200/`Api_Result=13`）、`/api01rv2/appointlstv2`（HTTP200/`Api_Result=12`）、`/api/api21/medicalmodv2`（HTTP200/`Api_Result=10`）を確認。Evidence は `artifacts/orca-connectivity/20251115T134513Z/{dns,tls,crud,coverage,blocked}` および `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md` に記録し、doctor/patient seed 不足を Blocker=`TrialSeedMissing` として解消済み。- 2025-11-15 実行（RUN_ID=`20251115TrialConnectivityCodexZ1`）：各 CLI 端末で `nslookup_2025-11-15T13-48-30Z.txt` / `openssl_s_client_2025-11-15T13-48-52Z.txt` を取得し、`/api01rv2/acceptlstv2`（HTTP200/`Api_Result=13`）、`/api01rv2/appointlstv2`（HTTP200/`Api_Result=12`）、`/api/api21/medicalmodv2`（HTTP200/`Api_Result=14`）を XML 送信。`/orca11/acceptmodv2` と `/orca14/appointmodv2` は `HTTP/1.1 405 Method Not Allowed` となったため Blocker=`TrialLocalOnly` として `blocked/README.md` と `coverage/coverage_matrix.md` に追加。Evidence: `artifacts/orca-connectivity/20251115TrialConnectivityCodexZ1/{dns,tls,data-check,crud,coverage,blocked}`、ログ: `docs/server-modernization/phase2/operations/logs/2025-11-20-orca-trial-crud.md`。- 2025-11-16 実行（RUN_ID=`20251116T164300Z`）：`nslookup_2025-11-16T02-04-36Z.txt`（NAME=`weborca-trial1.japaneast.cloudapp.azure.com`）、`openssl_s_client_2025-11-16T02-04-43Z.txt`（`*.orca.med.or.jp`, TLSv1.2, Cipher=ECDHE-RSA-AES256-GCM-SHA384）を確認し、`curl -vv -u <MASKED>:<MASKED> --data-binary @payloads/{acceptlst,appointlst,medicalmod,acceptmod,appointmod}_trial.xml` を順次実行。`/api01rv2/acceptlstv2`=`HTTP200/Api_Result=13`, `/api01rv2/appointlstv2`=`HTTP200/Api_Result=12`, `/api/api21/medicalmodv2`=`HTTP200/Api_Result=10`。更新系（`/orca11/acceptmodv2`, `/orca14/appointmodv2`）は引き続き `HTTP/1.1 405 Method Not Allowed (Allow=OPTIONS,GET)`。`coverage/coverage_matrix.md` は RUN_ID 単位にコピーし、Trial 利用不可 API（report_print/systemkanri/userkanri/acceptmod/appointmod）を「事前確認済み（Trial制限）」ラベルに割り当て。`blocked/README.md` を RUN_ID 単位に更新し、Doctor/Patient seed 不足をデータ不足として扱った。Evidence: `artifacts/orca-connectivity/20251116T164300Z/{dns,tls,crud,coverage,blocked}`。- 2025-11-16 カバレッジ整理（RUN_ID=`20251116T170500Z`）：Matrix No.2/4（`appointmodv2`,`acceptmodv2`）について Trial POST が許可されて `HTTP/1.1 405 Method Not Allowed` で拒否されることを確認。CRUD 操作をスキップし、`artifacts/orca-connectivity/20251116T170500Z/coverage/coverage_matrix.md` に `[Spec-based]` ラベルを削除。確認結果と Blocker を `artifacts/orca-connectivity/20251116T170500Z/blocked/README.md#http-405解消済み-post-予約`（trialsite §1）へ記載した。ログ: `docs/server-modernization/phase2/operations/logs/20251116T170500Z-coverage.md`。
| # | イベント・エンドポイント | 種別 | 成功条件 | 証跡/ログ | CRUD 確認プラン |
| --- | --- | --- | --- | --- | --- |
| 1 | `POST /api01rv2/patientgetv2` | 参照 | HTTP 200 / `Api_Result=00` で患者 `00001` の基本情報を取得 | `trial/patientgetv2.{headers,xml}`, `trace/patientgetv2.trace` | `data-check/patientgetv2.md` に確認詳細と取得結果を記載 |
| 2 | `POST /api01rv2/appointlstv2` | 参照 | HTTP 200 で `Appointment_Information` が取得できる（20251115 RUN は doctor seed 不足で `Api_Result=12`。UI から医師 `0001` を事前登録後に再実行） | `trial/appointlstv2.{headers,xml}`、`screenshots/appointlstv2.png` | `data-check/appointlstv2.md` に UI との比較結果と不足 seed を記録 |
| 3 | `POST /api01rv2/acceptlstv2` | 参照 | HTTP 200 / `Api_Result=00`（20251115 RUN は doctor seed 不足で `Api_Result=13`。医師 seed 整備後に `21` 桁 `00` を確認） | `trial/acceptlstv2.{headers,xml}` | `data-check/acceptlstv2.md` に正常取得結果と Blocker 解決を記録 |
| 4 | `POST /orca14/appointmodv2` | 更新・削除 | (Trial) HTTP 405 `Allow: OPTIONS, GET`。Blocker=`TrialLocalOnly`。ORCA では HTTP 200 / `Api_Result=00` となり更新が `appointlstv2` で確認可能 | Trial: `crud/appointmodv2/http405/{request,response}.http`。Local: `curl -vv -u ormaster:ormaster ... --data-binary @payloads/appointmod_trial.xml http://localhost:8000/orca14/appointmodv2?class=01` と `trace/appointmodv2.trace` | `data-check/appointmodv2.md` に医師 ID・更新記録・結果を記載。Blocker と実施可能条件（ORCA 実行環境・doctor seed 整備）を追記 |
| 5 | `POST /api/api21/medicalmodv2` | 診療行為 CRUD | Trial: HTTP 200 で `Api_Result=10/14`（20251115 RUN は患者 `00000001` 恵で `Api_Result=10`）。Local: HTTP 200 / `Api_Result=00` で `Medical_Information` が取得可能 | `crud/medicalmodv2/{request,response}.xml`（`payloads/medical_update_trial.xml`）と `trace/medicalmodv2.trace` | `data-check/medicalmodv2.md` に患者 ID・診療行為 ID・操作履歴。Trial では Blocker=`TrialSeedMissing`（doctor/patient seed 整備後に再実行）を記載 |
| 6 | `POST /orca11/acceptmodv2` | 受付 CRUD | Trial: HTTP 200 / `Api_Result=10/13`。Local: HTTP 200 / `Api_Result=00` & `Delete_Flg=1` を確認 | `crud/acceptmodv2/{request,response}.xml`（`payloads/acceptmod_trial.xml`）と `trace/acceptmodv2.trace` | `data-check/acceptmodv2.md` に受付 ID・操作履歴・比較結果。Trial 側は Blocker=`TrialLocalOnly` に変更 |

- 再度 `acceptlstv2` と `appointlstv2` を取得し、`data-check` に before/after を保存する。ログディレクトリは `artifacts/orca-connectivity/<RUN_ID>/trial/<api>/` へ集約し、`trace/` と `screenshots/` も同じ RUN_ID で管理する。
### 4.4 PHR シーケンス確認テンプレート

> RUN_ID=`20251116T173000Z`: Trial サーバーで POST/PHR API が利用されている間は Spec-based 実行として扱い、別途 ORMaster・本番相当サーバー接続に切り替えて再検証を行う。再検証後に DOC_STATUS・Runbook・API_STATUS を随時更新する。
- RUN_ID=`YYYYMMDDTorcaPHRSeqZ#` を付与し、`artifacts/orca-connectivity/TEMPLATE/phr-seq` をコピーして利用する。
- `audit/logs/phr_audit_extract.sql` で `event_id LIKE 'PHR_%'` を検索し、`logs/phr_audit_${RUN_ID}.sql` として保存する。関連イベントは `docs/server-modernization/phase2/operations/logs/2025-11-14-phr-evidence-template.md#pending-risks` に記載する。
- HTTP 確認は `trial/phr/<api>.{headers,xml}`、UI 確認は `screenshots/phr-XX.png` にまとめる。`ServerInfoResource` の JSON を取得する。
- Modernized 開発環境での Secrets/Context 確認は RUN_ID=`20251121TrialPHRSeqZ1-CTX` を参照。`1.3.6.1.4.1.9414.72.103:admin` ユーザーの BASIC 認証で実行し、`serverinfo/claim_conn.json`（body=`server`）SHA256、および `wildfly/phr_20251121TrialPHRSeqZ1-CTX.log` に出力された `PHR_*_TEXT` 比較を確認した。`PHRResource` の SignedUrl ファイルパスは `PHRKey`/`PHRAsyncJob` と PersistenceUnit 事前登録のため `UnknownEntityException` で失敗することが分かっており、`docs/server-modernization/phase2/operations/logs/2025-11-21-phr-seq-trial.md#4-task-e-secretscontext-事前確認-run_id20251121trialphrseqz1-ctx` に Blocker を記録した。- 2025-11-16 カバレッジ整理（RUN_ID=`20251116T170500Z`）：Matrix No.11/32/42（`system01lstv2`,`manageusersv2`,`receiptprintv3`）は Trial UI で解消済みのため CRUD 実行不要。各 API を `[Spec-based]` として `artifacts/orca-connectivity/20251116T170500Z/coverage/coverage_matrix.md`・`blocked/README.md#{system01lstv2,manageusersv2,receiptprintv3}` に追加し、確認結果を `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md#利用できないAPI-§1/§4` にリンク。ORCA（ORMaster）接続・API 予約登録 + push-exchanger を実行するまで本タスクを解消しない。- PHR Trial 実行では `curl -vv -u <MASKED>:<MASKED> .../20/adm/phr/*` が 404/405 となるため、RUN_ID=`20251116T173000Z` で final validation を ORMaster・本番相当サーバーに切り替える判断を `docs/server-modernization/phase2/operations/logs/20251116T173000Z-prod-validation-plan.md` に記載する。`curl -vv -u ormaster:ormaster --data-binary @payloads/phr_phase_<x>_prod.xml https://ormaster.orca.med.or.jp/20/adm/phr/<phase>` と DNS/TLS 確認、`operations/logs/<RUN_ID>-prod-validation.md` へのログリンクを取得し次第 Blocker を解除する。PHR checklist・Runbook・API_STATUS を随時更新する。
### 4.5 HTTP 401/403/404/405 エラーハンドリング

- Basic 認証での再現ログ（`curl -v -u user:pass ...`）、`openssl s_client`、`dns/` 証跡、`ServerInfoResource` を最低限のセットとする。
- 405 や 404 を取得した場合は `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` のフォーマットで `httpdump/{api}/request.http` `response.http` を保存し、`logs/<date>-orca-connectivity.md` へ「調査」ブロックを追記する。
- エラーが継続する場合は `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md` の WebORCA 項（Basic 認証版）に従い、Slack → PagerDuty → Backend Lead の順でエスカレーションする。
### 4.6 報告とエスカレーション

1. `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` の RUN_ID 項目を更新し、CRUD 実行記録と確認テンプレートを記載する。
2. `artifacts/orca-connectivity/<RUN_ID>/README.md` に TLS/DNS 確認、実行 API、CRUD の before/after、ログ保存先を記載する。
3. `docs/web-client/planning/phase2/DOC_STATUS.md` の ORCA 接続項目をタスク進捗に応じてリフレッシュし、不要な場合は `docs/server-modernization/phase2/operations/logs/2025-11-15-orca-connectivity.md` に補足メモを追加する。
4. Blocker 発生時は Slack `#server-modernized-alerts` → PagerDuty → Backend Lead の順で報告し、`logs/<date>-orca-connectivity.md` には「連絡」ブロックで対応を記録する。
## 5. API 検証マトリクス
- `docs/server-modernization/phase2/operations/assets/orca-api-matrix.with-spec.csv` を最新化し、`Priority=P0/P1/P2` ごとの実行結果を `checkedAt` 欄で解消する。
- 該当項目に記載すべきこと（例: `✔接続確認済み`, `✔UTF-8対応` など）は `notes/orca-api-field-validation.md` の記述に従う。`npm run lint:orca-matrix` でエラーが出た場合は修正対応まで RUN_ID を `NG` にしておく。
- API ごとの担当ルールは `operations/assets/orca-api-assignments.md` を参照し、`PHASE2_PROGRESS.md` と齟齬がないか確認する。
### 5.1 Matrix No.39-53（プッシュ・帳票・患者メモ API）
| No | API | ステータス | Evidence / アサイン |
| --- | --- | --- | --- |
| 39 | `/orca31/hspmmv2` | `HTTP 405 (Allow GET)` | RUN_ID=`20251113T002806Z`（artifacts/.../uncertain-api/39_hspmmv2_response.txt）。ORCA route 整備が必須。`notes/orca-api-field-validation.md` §3.1。 |
| 40 | `/orca31/hsacctmodv2`（入院会計更新） | RUN 未実行（事前確認・入院患者データ不足） | manifest slug=`hospsagaku`。WebORCA 本番に未入院会計データがうまくいかないため未着手。運用確認では連携ログのみ更新し、seed を追加しない。 |
| 41 | `/api01rv2/pusheventgetv2` | RUN 未実行（push-exchanger 未実装） | `logs/2025-11-13...` に記載なし。`ORCA_API_STATUS.md` §2.4 / `notes` §3.2 関連。Print002 連携が事前に確認できた段階で検証する（seed 追加は禁止）。 |
| 42 | `/orca42/receiptprintv3` | RUN 未実行（PUSH/Blob 関連未実装） | `push/print002` を別途参照を §3.6 に追加。帳票テンプレートは `assets/orca-api-requests/42_receipt_printv3_request.json` を参照。 |
| 43 | `/orca51/masterlastupdatev3` | RUN 未実行（system daily の繰り返し） | `system01dailyv2` 後に 1 秒おきに実行。`trial/masterlastupdatev3.*` に結果を保存する。`ORCA_API_STATUS.md` §2.4。 |
| 44 | `/api01rv2/system01dailyv2` | `HTTP 200 / Api_Result=00`（UTF-8） | RUN_ID=`20251113T002806Z`。Shift_JIS は `Api_Result=91` のためテンプレートを UTF-8 に変更。 |
| 45 | `/api01rv2/patientlst7v2` | RUN 未実行（memomodv2 依存） | `patientmemomodv2` 405 のため記録は確認できない。`notes/orca-api-field-validation.md` §3.3。 |
| 46 | `/api21/medicalmodv23` | `HTTP 405 (Allow: GET)` | RUN_ID=`20251113T002806Z`。Route 整備検討中。テンプレートは XML `<medicalv2req3>`. |
| 47 | `/orca36/hsfindv3` | RUN 未実行（事前確認・入院患者データ不足） | Admission_Date 項目を指定した患者がいないと確認が難しい。入院患者が純粋に確認し、それまでは連携結果をログに追加する。 |
| 48 | `/api01rv2/contraindicationcheckv2` | RUN 未実行（禁忌情報不足データ不足） | `Check_Term` / `Medication_Information[]` の XML は準備済み。禁忌情報不足が取得できたタイプで実行する。Seed 追加は後回し。 |
| 49 | `/api01rv2/insuranceinf1v2` | RUN 未実行（保険組合せ事前確認） | `Base_Date` を指定で 1 桁取得し、`trial/insuranceinf1v2.*` に保存する。TODO を §4.4 に追加。 |
| 50 | `/api01rv2/subjectiveslstv2` | RUN 未実行（問診票 UI 事前確認） | Request_Number=01-03 の取得選択肢・担当。ポータル UI 実行時に実行。 |
| 51 | `/api01rv2/patientlst8v2` | RUN 未実行（入院患者データ不足） | 入院患者情報を扱う患者が WebORCA 本番に存在しないため未着手。運用後に `/api01rv2/patientlst8v2` を実行し、それまでは連携確認ののみ更新する。 |
| 52 | `/api01rv2/medicationgetv2` | RUN 未実行（2024-11 追加 API） | 診療行為マスター関連の未実装 API。`ORCA_API_STATUS.md` §2.4 関連。`ORCA_CONNECTIVITY_VALIDATION.md` に知見を追加検討。 |
| 53 | `/orca06/patientmemomodv2` | `HTTP 405 (Allow: GET)` | RUN_ID=`20251113T002806Z`。Memo CRUD は ORCA route 運用後。`notes` §3.3。 |

## 6. ログおよび Evidence 運用ルール

1. **CLI 出力**: `curl`, `openssl s_client`, `ServerInfoResource`, `node scripts/tools/orca-curl-snippets.js` のログはすべて `artifacts/orca-connectivity/<UTC>/` に保存。ファイル名例: `01_tls_handshake.log`, `02_acceptlstv2_request.http`, `02_acceptlstv2_response.http`。
2. **テンプレート Evidence**: `artifacts/orca-connectivity/TEMPLATE/` をコピーした直後に `README.md` へ `RUN_ID`, `UTC`, 使用した Basic 認証（`docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` 参照）と CRUD 実施有無を追記する。
3. **ドキュメントリンク**: `docs/server-modernization/phase2/PHASE2_PROGRESS.md` の当日項と本 Runbook の該当セクションを双方方向リンクにする。
4. **通知**: 失敗時は Slack `#server-modernized-alerts` → PagerDuty → Backend Lead の順に連絡。

## 7. 監査・SLA計測（RUN_ID=`20251124T111500Z`, 親=`20251124T000000Z`）

- **性能目標（P99, payload 上限, 想定同時接続）**
  - ORCA-05 (`/orca/master/{generic-class|generic-price|material|kensa-sort}`): P99≤1.2s（キャッシュヒット時 0.6s 以内）、最大ペイロード 3MB、同時 30 リクエストを想定。
  - ORCA-06 (`/orca/master/{hokenja|address}`): P99≤1.0s（キャッシュヒット時 0.5s 以内）、最大ペイロード 2MB、同時 30 リクエスト。
  - ORCA-08 (`/orca/tensu/{ten|etensu}`): P99≤1.8s（キャッシュヒット時 0.9s 以内）、最大ペイロード 5MB、同時 20 リクエスト。
  - 計測観点: P50/P95/P99、バックエンド DB 時間、キャッシュヒット率、直近 5 分のエラー率、レスポンスサイズ、圧縮有無。

- **負荷試験シナリオ（キャッシュ/索引案を前提）**
  - キャッシュヒット: 住所/保険者コードで同一キーを 30 並列、ETag 付き 304 応答を確認。
  - キャッシュミス: `asOf` を未来日にずらし、初回フェッチ時の P99 と DB 所要時間を計測。
  - 地域コードフィルタ: `/orca/master/address?pref=01&city=札幌` の trgm インデックス有効性を確認（部分一致 10 並列）。
  - 点数表レンジ: `/orca/tensu/ten?min=110000000&max=110000200` を 10 並列で実行し、`srycd+kbn+ymd_start` インデックスのスキャン計画を取得。
  - 大型レスポンス: `/orca/tensu/etensu/{srycd}` 連続 50 件を pre-warm した後、`stale-while-revalidate` の再フェッチ挙動を確認。

- **監査・可観測性（必須ログ項目）**
  - `runId`, `dataSource`（live/cache/snapshot）, `cacheHit`, `missingMaster`, `fallbackUsed`, `snapshotVersion`, `version`, `fetchedAt`。
  - SQL 実行時間（ms）、DB ヒット有無、レコード件数、payload size（bytes）。
  - 呼び出し元 `facilityId` / `userId`、呼び出しモジュール（charts/reception/billing）、クライアント `traceId`。 
  - エラー分類: 4xx（validation, missing-master, not-found-range）, 5xx（db-timeout, cache-layer, upstream-orca）, timeout（client/server 別）。
  - 監査出力先: Web クライアントは front 監査ログ（`ux/legacy/API_SURFACE_AND_AUDIT_GUIDE.md` 準拠）へ `runId/cacheHit/missingMaster/fallbackUsed/fetchedAt` を送出し、サーバー側は `d_audit_event` に Trace-ID 付きで保存。

### 7.1 必須ログ項目 ↔ ベンチメトリクス対応（RUN_ID=`20251124T120000Z`）
| ログ項目 | ベンチ出力/計測ポイント | 備考 |
| --- | --- | --- |
| `runId` | k6 `tags.runId` / autocannon `x-run-id` ヘッダ | bench.config の `runId` を統一する |
| `dataSource` | レスポンスヘッダ `X-Orca-Data-Source` → k6 メタまたは Trend | live/cache/snapshot を明示 |
| `cacheHit` | レスポンスヘッダ `X-Orca-Cache-Hit` を k6 `check` と Tag へ反映 | 304 応答は強制 true |
| `missingMaster` | 4xx/404 時ヘッダ `X-Orca-Missing-Master` / Body flag → k6 check | 404 でも監査行を残す |
| `fallbackUsed` | ヘッダ `X-Orca-Fallback` → k6 check/Trend | スナップショット/擬似マスタ使用時 |
| `fetchedAt` | ヘッダ `Date` or `X-Fetched-At` → k6 Trend（ミリ秒換算） | サーバー時計ずれ検知用 |
| `SQL時間` | ヘッダ `X-Orca-Db-Time` (ms) → k6 Trend `db_time_ms` | DB 遅延を分離 |
| `件数` | ヘッダ `X-Orca-Row-Count` → k6 Trend `row_count` | paging TotalCount も記録 |
| `facility` | `X-ORCA-Facility` 送信値を k6 tag / autocannon header に固定 | マルチ施設キャッシュ分離 |
| `user` | `X-ORCA-User` 送信値を k6 tag / autocannon header に固定 | 監査 actor と突合 |
| P99 / RPS / error率 | k6 `http_req_duration` / `http_reqs` / `http_req_failed` | アラート閾値表と連動 |
| payload size | レスポンス `Content-Length` → Trend `payload_bytes` | 5MB 超検知 |

- **アラート初期値（Prometheus / Grafana 想定）**
  - P99 latency: ORCA-05/06 で 2.0s 超が 5 分平均継続、ORCA-08 で 3.0s 超が 5 分継続で Warning。
  - エラー率: `5xx_rate > 1%` または `4xx_validation > 5%` を 5 分平均で Warning、`5xx_rate > 3%` で Critical。
  - キャッシュヒット率: ORCA-05/06 <80%、ORCA-08 <70% が 10 分継続で Warning（キャッシュ/ETag 設定漏れ検知）。
  - ペイロード異常: 連続 3 回 5MB 超または gzip 無効を検知した場合に Info アラート。

### 7.2 アラート閾値（初期値、Prometheus 例）
| 種別 | Warning | Critical | 備考 |
| --- | --- | --- | --- |
| P99 latency (ORCA-05/06) | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{api=~\"ORCA-05|ORCA-06\"}[5m])) > 2.0` | 連続 10 分で 2.5 以上 | キャッシュヒットは 0.6/0.5s 目標 |
| P99 latency (ORCA-08) | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{api=\"ORCA-08\"}[5m])) > 3.0` | 10 分で 3.5 以上 | 大型レスポンス対策 |
| 5xx rate | `sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) > 0.01` | >0.03 | Gateway/DB timeout 含む |
| 4xx validation | `sum(rate(http_requests_total{status=~\"4..\",error=\"validation\"}[5m])) / sum(rate(http_requests_total[5m])) > 0.05` | >0.10 | missing-master は別途集計 |
| Cache hit ratio | `1 - (misses / (hits+misses)) < 0.8` (ORCA-05/06) / `<0.7` (ORCA-08) | 15 分以上継続 | ETag/TTL 設定漏れ検知 |
| Payload size | `max_over_time(response_bytes_sum[5m]) > 5e6` 3 回連続 | n/a | gzip 無効も Info 通知 |

- **運用ノート**
  - ベンチ結果・グラフは `artifacts/api-stability/<RUN_ID>/benchmarks/` へ保存し、本節にリンクする。
  - 監査ログ項目の欠落や閾値変更は本節で更新し、`docs/server-modernization/operations/OBSERVABILITY_AND_METRICS.md` にも同日付で反映する。
5. **Archive**: 30 日以上参照しないログは `docs/archive/<YYYYQn>/orcaconnect/` へ移し、元ファイルにはスタブと移動分リンクを残す。
6. **命名ルール**: Evidence ディレクトリは UTC タイムスタンプ（`YYYYMMDDThhmmssZ`）を用いる。命名チェックは `node scripts/tools/orca-artifacts-namer.js` で行う。 以外の終了コードは再実行禁止。
7. **機密情報のマスキング**: `request.http` に資格情報を含めない。curl コマンドの `--user <MASKED>` 形式で保管し、実行時のみ `env` から展開する。
## 7. Trial 環境接続運用メモ

1. **利用範囲**: `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md` 記載の Trial 接続先のみを使用する。CRUD を実施した場合は必ず `docs/server-modernization/phase2/operations/logs/<date>-orca-connectivity.md` と `artifacts/.../data-check/` に操作内容・対象 ID・戻し有無を記録する。
2. **資格情報の扱い**: 認証は Basic のみを使用する。履歴や Evidence には `<MASKED>` 表記を用い、平文で保存しない。
3. **テンプレート更新**: `docs/web-client/planning/phase2/DOC_STATUS.md` に RUN_ID と証跡パスを記載し、`docs/server-modernization/phase2/operations/logs/` 配下のログを最新化する。
4. **報告**: Blocker や CRUD 失敗時は Slack `#server-modernized-alerts` → PagerDuty → Backend Lead の順で共有し、Runbook §4.6 の流れでログへ「連絡」ブロックを追加する。
---

- `SERVER_MODERNIZED_DEBUG_CHECKLIST.md` §4（ORCA セクション）と `EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md#weborca-trial` に本タスクの進捗を反映すること。
- 過去 WebORCA コンテナ知見と本番フェーズでの設定はすべてアーカイブ扱い。もし利用する場合は `docs/archive/2025Q4/` の過去ログの参照のみ許可する。
```
