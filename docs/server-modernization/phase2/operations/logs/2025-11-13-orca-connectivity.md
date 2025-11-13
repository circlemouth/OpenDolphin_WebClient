# ORCA 接続検証ログ (RUN_ID=20251113TorcaP0OpsZ1)

- 実施日: 2025-11-13 09:15-09:45 JST
- UTC_RUN: `20251113T002140Z`
- 参照ドキュメント: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md`
- 使用コンテナ: `jma-receipt-docker-for-ubuntu-2204-orca-1 (jma-receipt-weborca:22.04)`, `opendolphin-server-modernized-dev (legacy-vs-modern-server-modernized-dev)`
- 証跡: `artifacts/orca-connectivity/20251113T002140Z/P0_smoke/`
- 実施コマンド: `node scripts/tools/orca-curl-snippets.js` → `docker compose -p legacy-vs-modern -f docker-compose.modernized.dev.yml exec server-modernized-dev bash -lc "curl ..."`

## API 実行結果 (P0 #1-5)

| # | エンドポイント | リトライ | HTTP | 所見 |
|---|---|---|---|---|
| 1 | `GET /api01rv2/patientgetv2?id=000001` | 1回目のみ | 404 | ORCA 側が `code=404, message=Not Found` を返却。GET を受け付けておらず、POST への置き換え案は未検証。|
| 2 | `POST /orca14/appointmodv2?class=01` | リトライ1回 (`/api01rv2/appointmodv2?class=01`) | 405 / 404 | 初回は `Method Not Allowed`、エンドポイントを `api01rv2` に変えても `APIが存在しません` を返却。POST 自体が無効化されている可能性。|
| 3 | `POST /api21/medicalmodv2?class=01` | リトライ1回 (クエリ無し) | 405 / 405 | いずれも `code=405, message=Method Not Allowed`。medicalmodv2 シリーズの REST が未公開。|
| 4 | `POST /orca11/acceptmodv2` | リトライ1回 (`?class=01` 付与) | 405 / 405 | 受付登録 API も 405 応答で停止。`Request_Number=01` を送信済みだが ORCA 側で POST が拒否される状態。|
| 5 | `POST /api01rv2/acceptlstv2?class=01` | 1回目のみ | 200 | HTTP は成功したが `Api_Result=13`（ドクター未登録）で受付一覧を返却できず。マスタ seed（Physician_Code=1001）を ORCA に投入する必要あり。|

## ServerInfo `claim.conn`
- `userName=1.3.6.1.4.1.9414.10.1:dolphin` では `/serverinfo/claim/conn` も 401 (`authentication_failed`) となり、sysad ヘッダは `/dolphin` のみ許可されていることを確認。
- `userName=LOCAL.FACILITY.0001:dolphin`, `password=36cdf8b887a5cffc78dcd5c08991b993`, `clientUUID=00000000-0000-0000-0000-000000000000` で再実行し 200 (`server`) を取得。結果は `serverinfo_claim_conn_local.json` に保存。

## 課題・フォローアップ
1. ORCA 側の API enable 状態が 405/404 を返しており、`/orca14` / `/orca11` 等の SOAP-API が HTTP レイヤーで無効化されている。`docker/orca/jma-receipt-docker` の初期化時に API オプションを確認し、`/opt/jma/weborca/app/etc/online.env` などで REST 有効化が必要。
2. `acceptlstv2` は W36 受付 seed（RUN_ID=`20251113TorcaP0OpsZ3`, `artifacts/orca-connectivity/20251113T015810Z/seed/`）により `Api_Result=00` まで前進。`Medical_Information` パラメータは `01`（診察）コードで指定し、`tbl_uketuke.srynaiyo='01'` と合わせる必要がある。診療登録 API 自体は 405 のままなので、将来 2025-11-12 以前の日付で再現が必要になった場合は同手順で seed を追加する。
3. ServerInfo 取得には `LOCAL.FACILITY.0001:dolphin` 等 DB 登録済みユーザーを使用する運用を Runbook に明記する（sysad ユーザーは `/dolphin` のみ想定）。
4. Runbook §4.4（P0 API）に「405/404 で停止した際は ORCA weborca 側の API 有効化と医師マスタ seed を再投入する」旨を追記する。対応完了まで本 RUN_ID を `NG` として `PHASE2_PROGRESS.md` に記録。

## 2025-11-13 追記: RUN_ID=`20251113TorcaP0OpsZ2`（W28 P0 API 再実行）

- W28 指示（Physician_Code=00001 テンプレ適用）に従い、`node scripts/tools/orca-curl-snippets.js` でスニペットを再生成し、`docker compose -f docker-compose.modernized.dev.yml -p legacy-vs-modern exec -T server-modernized-dev bash -lc "curl ..."` で P0 API #1-#5 を各1回ずつ送信（コンテナ再起動と curl リトライは禁止）。UTC_RUN=`20251113T011831Z`、RUN_ID=`20251113TorcaP0OpsZ2`。
- レスポンス本文とヘッダーは `artifacts/orca-connectivity/20251113T011831Z/P0_retry/` に `0n_<api>_response.{json,headers}` として保存。405/404 ケースは `Allow: OPTIONS, GET` を取得済みで、404/405 が継続する場合に備え Runbook §4.5 の HTTP 405 節へリンク予定。
- 目標の `Api_Result=00` には未到達。Physician code の更新により `acceptlstv2` 応答は `Api_Result=13`（医師未登録）から `14`（診療内容情報欠落）へ変化し、診療行為 seed または診療系 API の POST 開放が次タスクとなる。

### API 実行結果 (P0 #1-5 再実行)

| # | エンドポイント | HTTP | Allow/備考 | Api_Result / メッセージ |
|---|---|---|---|---|
| 1 | `GET /api01rv2/patientgetv2?id=000001` | 404 | Allow なし、本文 `{"Code":404,"Message":"..."}` | －（API 未公開） |

## 2025-11-13 追記: RUN_ID=`20251113TorcaApiPrefixW41`（W41 `/api/api21` 再検証）

- 目的: `/api/api21/medicalmodv2?class=01` で `Api_Result=00` を取得すること。W36 seed を踏まえつつ、医師マスタ・診療行為・診療科履歴を `tmp/sql/api21_medical_seed.sql` で再投入し、`tmp/orca-api-payloads/medicalmodv2_payload.json` を WebORCA コンテナへコピーして実行。
- 手順:
  - `docker exec jma-receipt-docker-for-ubuntu-2204-db-1 psql -U orca -d orca < artifacts/orca-connectivity/20251113T015810Z/seed/seed_insert.sql` で患者 ID `000001`・受付 seed を再作成。
  - `docker exec ... psql -U orca -d orca < tmp/sql/api21_medical_seed.sql` で `tbl_list_doctor` / `tbl_srykarrk` / `tbl_sryact` / `tbl_ptnum_public` を初期化。
  - `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 curl -s -u ormaster:change_me --data-binary @/tmp/orca-api-payloads/medicalmodv2_payload.json -D /tmp/api21_test_headers.txt -o /tmp/api21_test_body.json http://localhost:8000/api/api21/medicalmodv2?class=01` を実行。
- 結果: HTTP 200 / `Api_Result=10` / `Api_Result_Message="患者番号に該当する患者が存在しません"`。同一 payload を複数回送信しても `Medical_Uid` 有無に関わらず結果は変わらず。証跡は `artifacts/orca-connectivity/20251113T030214Z/api-prefix-test/api21_success/`（headers/response/ORCA log）に保存。
- ORCA ログ (`docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --tail 200`) では `patientgetv2` / `patientmodv2` / `medicalmodv2` が呼び出されているが、`medicalmodv2` は毎回 `ORAPI021S1V2 false` で終了。PostgreSQL ログを見ると、`patientgetv2` 実行時は `tbl_ptinf` 参照が発生しておらず、患者番号の桁数チェックで弾かれている可能性がある。
- Follow-up:
  1. WebORCA 側で患者番号桁数 (`ORCBPTNUMCHG`) 設定を確認し、`000001` を有効番号として扱えるか調査する。
  2. `patientmodv2`（class=01/02）経由で患者登録を行い、DB に自動投入されるテーブルセットを洗い出す。自動登録された Patient_ID が `medicalmodv2` で利用できるかを検証。
  3. 追加 seed（`tbl_ptkohinf`/`tbl_pthkninf` 等の保険テーブル）を入れたうえで再実行し、`Api_Result` の変化を確認する。
| 2 | `POST /orca14/appointmodv2?class=01` | 405 | `Allow: OPTIONS, GET` を採取 | －（HTTP 層で拒否） |
| 3 | `POST /api21/medicalmodv2?class=01` | 405 | `Allow: OPTIONS, GET` を採取 | －（HTTP 層で拒否） |
| 4 | `POST /orca11/acceptmodv2` | 405 | `Allow: OPTIONS, GET` を採取 | －（HTTP 層で拒否） |
| 5 | `POST /api01rv2/acceptlstv2?class=01` | 200 | Header charset=UTF-8, `X-Hybridmode: normal` | `Api_Result=14`（診療内容情報が存在しません） |

### 差分メモ

1. API #2-#4 は継続して 405。`02-04_*_response.headers` に `Allow: OPTIONS, GET` を保存済みで、405 調査 E2E 証跡として DOC_STATUS 更新時に参照可能。
2. `acceptlstv2` は Physician `00001` 指定で `Api_Result=14` まで進んだが、診療明細が存在しないため会計待ち一覧が空。`acceptmodv2`/`medicalmodv2` の POST を開けるか、ORCA DB へダミー診療を流し込む runbook が必要。`PHASE2_PROGRESS.md` でも NG 継続として反映（→ W36 seed: RUN_ID=`20251113TorcaP0OpsZ3` で `Api_Result=00` まで前進、後述）。

## 2025-11-13 追加: RUN_ID=`20251113TorcaP0OpsZ3`（W36 受付 seed）

- UTC_RUN=`20251113T015810Z`。`docker ps --filter name=orca` で `jma-receipt-docker-for-ubuntu-2204-db-1` を特定し、`docker exec <db> psql -U orca orca` から `tbl_ptinf` / `tbl_ptnum` / `tbl_uketuke` / `tbl_ptmemoinf` へ患者 ID `000001` のダミーデータを挿入。実行 SQL と `SELECT` 結果は `artifacts/orca-connectivity/20251113T015810Z/seed/seed_insert.sql` および `.../seed_verification.txt` に保存。
- `Medical_Information` はコード値 `01` を送る必要があり、`tbl_uketuke.srynaiyo` も `01`（診察）に統一。`curl -s -u ormaster:change_me -H 'Content-Type: application/json; charset=Shift_JIS' --data '{"acceptlstreq":{"Acceptance_Date":"2025-11-13","Department_Code":"01","Physician_Code":"00001","Medical_Information":"01","Display_Order_Sort":"1","Sel_Offset":"0"}}' 'http://localhost:8000/api01rv2/acceptlstv2?class=01'` で再実行。
- 応答は `artifacts/orca-connectivity/20251113T015810Z/seed/acceptlstv2_response.http` に記録。`Api_Result=00` / `Reskey=Patient Info` を取得し、`Patient_Information.Patient_ID=000001` が出力される状態を確認。

### API 実行結果 (W36 seed)

| # | エンドポイント | HTTP | Api_Result / メッセージ | 備考 |
|---|---|---|---|---|
| 5 | `POST /api01rv2/acceptlstv2?class=01` | 200 | `Api_Result=00`（処理終了） | `Medical_Information=01`, `Acceptance_Date=2025-11-13`。Seed 実行証跡: `RUN_ID=20251113TorcaP0OpsZ3`, `artifacts/orca-connectivity/20251113T015810Z/seed/`. |

## 2025-11-13 追加: RUN_ID=`20251113TorcaApiPrefixW37`（W37 / `/api/apiXX` プレフィックス挙動）

- 実施時間: 2025-11-13 10:55-11:05 JST、UTC_RUN=`20251113T015626Z`。
- コマンド: `docker run --rm --network jma-receipt-docker-for-ubuntu-2204_default -v $PWD:/workspace curlimages/curl:8.7.1 -sS -u ormaster:change_me -X POST -H "Content-Type: application/json; charset=Shift_JIS" -H "Expect:" --data-binary @/workspace/tmp/orca-api-payloads/<payload>.json ...`。`assets/..._request.json` を直接送ると WebORCA 側 `session.XML2Map` が panic し HTTP 応答が欠落したため、`tmp/orca-api-payloads/*_payload.json` に含まれる純粋な API ボディのみ送信した。
- 証跡: `artifacts/orca-connectivity/20251113T015626Z/api-prefix-test/` に各 API の `*_headers.txt` / `*_body.json` を保存。Runbook §4.5 へ「/api/apiXX プレフィックス結果」小節を追加済み。
- PHASE2_PROGRESS: **W37 (RUN_ID=`20251113TorcaApiPrefixW37`)** を追記し、`/api/api21` の 200 応答と `/api/api11` `/api/api14` の 404 応答を backlog 化。

| エンドポイント | HTTP | Allow | Body 抜粋 | 備考 |
|---|---|---|---|---|
| `POST /api/api21/medicalmodv2?class=01` | 200 | なし | `Api_Result=10`, `Api_Result_Message=患者番号に該当する患者が存在しません`, `X-Hybridmode: normal` | `/api/api21` ルートは REST ハンドラ到達。患者 seed が無く 10 エラーだが HTTP は成功。 |
| `POST /api/api11/acceptmodv2?class=01` | 404 | なし | `{"message":"APIが存在しません"}` | `/api/api11` ルートは未公開、Allow ヘッダーも出力されず有効メソッド不明。 |
| `POST /api/api14/appointmodv2?class=01` | 404 | なし | `{"message":"APIが存在しません"}` | `/api/api14` も同挙動。`X-Hybridmode: normal` のまま。 |

- 判定: `/api/api21` 系は `/api/` プレフィックス付きでのみ POST 受付があるが、`/api/api11` と `/api/api14` は 404 でハンドラが登録されていない。Allow が返らないため HTTP レイヤーからは追加情報を取得できず、ORCA 管理画面で API 有効化フラグを再確認する必要がある。

## 追加調査: W23 ORCA ルーティング設定（2025-11-13 10:05 JST）

- `docker ps` より対象コンテナは `jma-receipt-docker-for-ubuntu-2204-orca-1 (jma-receipt-weborca:22.04)`。稼働中の `weborca` プロセスは `/opt/jma/weborca/mw/bin/weborca` を Rosetta 経由で起動しており、アプリケーションパス `/app/weborca-main` は存在しなかった。
- ルーティング定義調査:
  - `docker exec ... find /opt/jma -name 'weborca-main'` および `find ... 'router.go'` はいずれもヒットせず、実行バイナリに Go ソースが同梱されていないことを確認。
  - `strings /opt/jma/weborca/mw/bin/weborca | grep "orca31"` でもパス文字列は確認できず、ランタイムはコンパイル済みルータのみを保持している。
- HTTP メソッド検証（ホスト→`http://127.0.0.1:8000`）:
  - `curl -s -D - -o /dev/null -X POST /api21/medicalmodv2` → `405 Method Not Allowed`, `Allow: OPTIONS, GET`
  - `curl -s -D - -o /dev/null -X POST /orca31/medicalmod` → `405 Method Not Allowed`, `Allow: OPTIONS, GET`
  - `curl -s -D - -o /dev/null -X POST /orca06/orderapi` → `405 Method Not Allowed`, `Allow: OPTIONS, GET`
  - レスポンス本文はいずれも `{"Code":405,"Message":"code=405, message=Method Not Allowed"}` で統一されており、サーバー側ルータが POST を未定義にしている状態。
- 環境変数・設定確認:
  - `/opt/jma/weborca/releases/receipt/20251028-1/etc/online.env` には `HTTP_PORT=8000` や DB 接続設定のみで、`API_ENABLE_*` のような REST 有効化フラグは存在しない。
  - `/opt/jma/weborca/releases/receipt/20251028-1/etc/jma-receipt.env` も COBOL/DB パスや `FORCE_CLEAR_SPA=1` 等のみで API 関連フラグなし。
  - `/opt/jma/weborca/conf/jma-receipt.conf` はコメントのみ、`/opt/jma/weborca/conf/db.conf` も未定義。
- 結論: Runtime イメージにはルーティング定義ソースが含まれておらず、デフォルト状態の `weborca` バイナリは `/api21/*` `/orca31/*` `/orca06/*` を GET/OPTIONS のみに制限している。POST を許可するにはビルド済みバイナリの設定変更または API 有効化オプション投入が必要。開発ラインへ「weborca-main ソースの取得方法」と「POST 受付を開くためのビルド/設定手順」の確認が必要。

## §4.2 ログ相関チェック (W26 追試)

- `UTC_TAG=20251113T005954Z` を採番し、`docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 2h > artifacts/orca-connectivity/validation/20251113T005954Z/logs/orca_since.log 2>&1` を実行。695 行分の STDOUT/STDERR を一括で取得し、従来の `--tail 200` 制限で欠落していた 09:23-09:30 JST のリクエスト／例外を保存した。
- RUN_ID=`20251113TorcaP0OpsZ1`（09:15-09:45 JST）に該当するタイムスタンプを `rg "2025/11/13 09:2" artifacts/.../orca_since.log` で確認済み。最初のエントリは `2025/11/13 09:23:23 Auth Error:401`、末尾は `2025/11/13 09:30:06 System Error:405 code=405, message=Method Not Allowed`。
- 代表的なログ抜粋

| JST | 区分 | 内容 |
| --- | --- | --- |
| 09:23:23 | Auth Error 401 | `GET /api01rv2/patientgetv2?id=000001` を Basic 認証なしで叩いた際に 401。`User-Agent=curl/7.76.1`。 |
| 09:26:27 | System Error 404 | `web.ErrorHandler` が `/api01rv2/patientgetv2` を `code=404` で拒否。Echo フレームワークの stacktrace を含むため `2>&1` で保存必須。 |
| 09:28:33 | System Error 405 | `POST /orca31/hspmmv2` 系が `Method Not Allowed` を返却。`ORAPI012R1V2` 呼び出しの `API-:orca ormaster patientgetv2 ...` も同ウィンドウで観測。 |
| 09:30:06 | System Error 405 | `POST /api21/medicalmodv2?class=01` が 405。`DestroyContext: false` の直後に出力され、セッションは維持されているが API 側が無効化されている。 |

- 追加確認として `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 tail -n 200 /opt/jma/weborca/log/orca-db-patch.log` を実行したところ、同ファイルは 2025-11-09 の schema patch ログのみで RUN_ID 対応の HTTP ログは出力されていないことを確認。今後ファイルログを参照する場合は適切なログファイルを別途指定する。

## W24 追加入力: Physician マスタ取得 (2025-11-13 10:07 JST)

- `docker run --rm --network jma-receipt-docker-for-ubuntu-2204_default curlimages/curl:8.7.1 -u ormaster:change_me -X POST 'http://orca:8000/api01rv2/system01lstv2?class=02' -H 'Content-Type: application/json; charset=Shift_JIS' --data '{"system01_managereq":{"Request_Number":"03","Base_Date":"2025-11-13"}}' | tee artifacts/orca-connectivity/20251113T010657Z/master/system01lstv2_class02.json` を実行し、`Api_Result=00` を確認。
- 応答には `Physician_Information[0].Code=00001`, `WholeName=オルカマスター`, `WholeName_inKana=オルカマスター` が含まれており、P0 テンプレ（`docs/server-modernization/phase2/operations/assets/orca-api-requests/05_acceptlstv2_request.json` / `.../05_acceptlstv2_response.sample.json`）へコメントおよび値を反映済み。
- これにより `acceptlstv2` 実行時の `Api_Result=13`（ドクター未登録）再現条件を解消し、次回の P0 接続テストでは `Physician_Code=00001` を使用できる状態になった。取得ログは `artifacts/orca-connectivity/20251113T010657Z/master/system01lstv2_class02.json` で参照可。

## W31: P0 API 再実行 (RUN_ID=20251113TorcaP0OpsZ2)

- 実施日: 2025-11-13 10:20-10:27 JST（UTC_TAG=`20251113T012013Z`）
- 証跡: `artifacts/orca-connectivity/20251113T012013Z/P0_retry/`
- 使用コマンド: `npm run orca-snippets:dry` で最新版テンプレートを確認後、`docker compose -p legacy-vs-modern -f docker-compose.modernized.dev.yml exec server-modernized-dev bash -lc "curl ..."` を API #1-5 へ順番に実行。`acceptlstv2` は `tmp/orca-api-effective/05_acceptlstv2_payload.json` を `/tmp/` へ複写し、`Physician_Code=00001` と `class=01` の組み合わせで送信。

| # | エンドポイント | HTTP | Api_Result | 所見 |
| --- | --- | --- | --- | --- |
| 1 | `GET /api01rv2/patientgetv2?id=000001` | 404 | ― | weborca バイナリが GET を拒否する状態は継続。`Code=404, Message=Not Found` のみ返却（Evidence: `.../API01_patientgetv2/response.http`）。|
| 2 | `POST /orca14/appointmodv2` | 405 | ― | `Allow: OPTIONS, GET` ヘッダーで POST 無効化を確認。Legacy/SOAP API も同様に遮断されているため Runbook §4.4 ブロッカーは未解消。|
| 3 | `POST /api21/medicalmodv2` | 405 | ― | 405 応答。`Api_Result` 返却前に HTTP レイヤーで拒否されるため Modernized からの診療行為更新は引き続き不可。|
| 4 | `POST /orca11/acceptmodv2` | 405 | ― | 受付登録 API も POST 拒否。`Request_Number=01` seed を送っても `Method Not Allowed` で停止。|
| 5 | `POST /api01rv2/acceptlstv2?class=01` | 200 | 21 | HTTP 200 で `Physician_Code=00001` がレスポンスに反映されたが、ORCA 側に受付データが無く `Api_Result=21（対象の受付はありませんでした）`。前回 RUN_ID=`20251113TorcaP0OpsZ1` の `Api_Result=13`（ドクター未登録）から原因が切り替わったことを確認。|

- 405/404 が継続する API はいずれも HTTP レイヤーで遮断されているため、`docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.4 のブロッカー一覧を維持。
- `acceptlstv2` はドクターマスタ認識が取れたため、受付データ seed 手順を Ops に確認し `Api_Result=00` を再取得する。結果が得られ次第、Runbook §5 マトリクス備考へ「2025-11-13 再実行で 200/00」を追記予定。

## ログ永続化候補 (W30)

### 現状把握

- `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 ls /etc/supervisor/conf.d` は「No such file or directory」で、プロセス管理は `PID 1` の `su -s /bin/bash orca -c .../weborca` のみ。STDOUT/STDERR がすべて Docker `json-file` ログ（`docker inspect ... HostConfig.LogConfig.Type=json-file`）へ直書きされており、コンテナ再作成時に `/var/lib/docker/containers/<id>/<id>-json.log` ごと入れ替わる。
- `/opt/jma/weborca/app/etc/jma-receipt.env` では `LOGDIR=/opt/jma/weborca/log` が定義され、`/etc/logrotate.d/jma-receipt-weborca` にも `jma-receipt-weborca.log` / `claim*.log` / `L00*.log` の日次ローテ設定が存在するが、実体は `orca-db-patch.log` のみ（`ls -l /opt/jma/weborca/log`）。HTTP アクセスやエラーはファイルログに残らず `docker logs` 経由でしか追跡できない。
- `/var/log` 直下は OS 標準ログのみで ORCA 用ファイルが無い。つまり `docker logs --since` で遡れなかった期間は恒久的に消失し、`--tail` で取得できる行数にも制限がある。

### 想定ファイル配置と取得フロー

1. **ログ専用ボリュームの追加**: `docker/orca/jma-receipt-docker/docker-compose.yml` に `orca_logs:/var/log/orca`（またはホストディレクトリ `./docker/orca/logs:/var/log/orca`）を追加し、`/var/log/orca` を `orca` ユーザー所有 (0700) に設定する。`LOGDIR` とは別に HTTP 向けファイル (`/var/log/orca/http.log`) と Claim 送受信用 (`/var/log/orca/claim_sender.log`) を分け、以下のように整理する。

   ```text
   /var/log/orca/
     ├─ http.log          # weborca STDOUT/STDERR を tee で集約
     ├─ http.err.log      # 将来 Go Echo のスタックトレースだけを振り分ける場合用
     ├─ claim_sender.log  # ClaimSender ジョブの専用ログ
     └─ legacy/
         └─ *.log         # 既存 LOGDIR からシンボリックリンクで再利用
   ```

2. **エントリポイントでリダイレクト**: 既存エントリポイントの `exec /opt/jma/weborca/mw/bin/weborca` を `exec /opt/jma/weborca/mw/bin/weborca 2>&1 | tee -a /var/log/orca/http.log` に差し替えるか、`jma-receipt.env` の `REDIRECTLOG=/var/log/orca/http.log` を有効化して `su -s /bin/bash orca ...` 実行前に `export REDIRECTLOG` する。これにより `docker logs` へ依存せず `tail -F /var/log/orca/http.log` でリアルタイム参照が可能になる。

3. **ログ参照パスの統一**: Runbook §4.2 へ `/var/log/orca/http.log` の常設 tail コマンドと、Artifacts へ `./artifacts/orca-connectivity/<UTC>/logs/orca_http.log` をコピーする手順を追記する（本 W30 で反映予定）。

### ローテ設定案

- `/etc/logrotate.d/jma-receipt-weborca` をベースに HTTP/Claim ログも同じ日次ローテへ含める。例:

  ```conf
  /var/log/orca/http*.log /var/log/orca/claim*.log {
      daily
      rotate 14
      size 200M
      compress
      delaycompress
      missingok
      copytruncate        # weborca は SIGHUP 未対応のため安全側に倒す
      create 0640 orca orca
      sharedscripts
  }
  ```

- ローテ後は `docker exec ... stat /var/log/orca/http.log` でパーミッションを確認し、`artifacts/orca-connectivity/<UTC>/logs/logrotate_<UTC>.txt` に記録する。容量超過時のフェイルセーフとして Docker 側にも `logging.options.max-size=100m` / `max-file=3` を与え、`json-file` とファイルログの二段構えで欠損を防ぐ。

- 永続化後の標準参照コマンドは `docker exec -it jma-receipt-docker-for-ubuntu-2204-orca-1 tail -F /var/log/orca/http.log` を基本とし、`docker logs` は再起動直後の暫定確認に限定する。Runbook §4.2 にも同 tail 手順を追記して利用者ガイドと整合させる（本作業で反映）。

## 2025-11-13 追記: RUN_ID=`20251113TorcaConfigW40`（W40 WebORCA 設定ファイル棚卸し）

- 取得目的: `/api/api11` `/api/api14` が 404 のままな理由を切り分けるため、WebORCA コンテナ内で API 有効化に関わる設定値を棚卸し。設定変更やサービス再起動は未実施。Evidence は `artifacts/orca-connectivity/20251113T022010Z/config_dumps/` に集約。
- 実行コマンド:
  1. `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 env | grep -E 'API|ROUTE|HYBRID'` → 該当環境変数なし（ファイル: `env_API_ROUTE_HYBRID.txt`）。
  2. `docker exec ... cat /opt/jma/weborca/releases/receipt/20251028-1/etc/online.env` → HTTP ポート=8000、`SKIP_CERT_CHECK=1` 以外に REST 有効化設定は見当たらず（`online.env` 保存）。
  3. `docker exec ... cat /opt/jma/weborca/releases/receipt/20251028-1/etc/jma-receipt.env` → `LOGDIR`/`HTTP_HOST` 等の既定値のみ（`jma-receipt.env` 保存）。
  4. `docker exec ... find /opt/jma/weborca -name '*route*.yml'` および `*route*.yaml` → 該当ファイルなし（`route_yml_search.txt`, `route_yaml_search.txt` 保存）。
- 所見: 環境変数や `online.env` に `API_ENABLE_*` / `api_path` / `use_weborca` 等のキーは存在せず、`receipt_route.ini` 相当のファイルも見つからなかった。Step2/Step3 の設定確認では `artifacts/.../config_dumps/` を参照し、過去 RUN_ID（W23）の差分と突き合わせてエスカレーション判断を行う。

## 2025-11-13 14:55 JST 追記: RUN_ID=`20251119TorcaHttpLogZ1`（REDIRECTLOG / HTTP ログファイル採取）

- 目的: `start-weborca.sh` の `prepare_redirect_log`→`start_weborca` で `REDIRECTLOG=/var/log/orca/http.log` が強制され、STDOUT/STDERR が `tee -a` でファイル&`docker logs` 両方に流れる挙動を Runbook §4.2/§4.5 へ反映させる。再現時は bind mount (`docker/orca/jma-receipt-docker/logs/orca`) を直接参照し、追加コマンドを実行するだけでコンテナ再起動や `docker cp` は不要。
- 設定差分: `docker/orca/jma-receipt-docker/jma-receipt.env` では `REDIRECTLOG="/var/log/orca/http.log"` を明示（ベンダーデフォルト `#REDIRECTLOG="/var/lib/jma-receipt/dbredirector/orca.log"` との差分）。`start-weborca.sh` 抜粋と合わせて `artifacts/orca-connectivity/20251119TorcaHttpLogZ1/config/` へ保存。
- ログ出力確認: `ls -l docker/orca/jma-receipt-docker/logs/orca` を `logs/host_orca_log_dir.txt` に、`readlink .../orca_http.log` を `logs/orca_http_symlink.txt` に保存し、`orca_http.log -> http.log`／`http.log` 実体の有無を証跡化。`tail -n 200 docker/orca/jma-receipt-docker/logs/orca/http.log > logs/http.log` でサンプルを採取。
- 推奨運用: Evidence 取得時は以下 2 コマンドを並走させ、`tail -F`（ファイル）と `docker logs --since`（再起動直後保険）をそれぞれ `artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/` に保存する。  
  ```bash
  UTC_TAG=$(date -u +%Y%m%dT%H%M%SZ)
  tail -F docker/orca/jma-receipt-docker/logs/orca/http.log \
    | ts '%Y-%m-%dT%H:%M:%SZ' \
    | tee artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/http_live_${UTC_TAG}.log
  docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 15m --timestamps \
    > artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/docker_orca_since_${UTC_TAG}.log 2>&1
  ```  
  `ts`（moreutils）が無い場合は `while read line; do printf "%s %s\n" "$(date -u +%FT%TZ)" "$line"; done` で代替。
- 404/405 調査手順は `docs/server-modernization/phase2/operations/logs/ORCA_HTTP_404405_HANDBOOK.md` を参照。RUN_ID=`20251119TorcaHttpLogZ1` の成果物がテンプレ通り揃っているため、次回はこのハンドブック＋Runbook §4.5「HTTP 404/405 調査テンプレ」に沿って運用する。
- ドキュメント反映: `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.2/§4.5 と `docs/web-client/planning/phase2/DOC_STATUS.md` ORCA 行へ RUN_ID を追記済み。

## Support Inquiry Draft

### Config Dumps
- RUN_ID=`20251113TorcaConfigW40` の証跡（`artifacts/orca-connectivity/20251113T022010Z/config_dumps/`）には `env_API_ROUTE_HYBRID.txt`・`online.env`・`jma-receipt.env` を保存済みで、いずれにも `API_ENABLE_*` や `api_path`、`use_weborca` など POST 有効化に関するキーが存在しないことを確認済み。
- `/opt/jma/weborca/releases/receipt/20251028-1/` 配下で `*route*.yml` / `*route*.yaml` を検索したがヒットせず、ソース管理外のルーティング設定ファイルが導入されていない可能性が高い。API ルーティングを外部設定で切り替えられるかどうかの公式見解が必要。
- `online.env` には `HTTP_PORT=8000` と DB/SSL 設定のみ、`jma-receipt.env` も `LOGDIR`・`FORCE_CLEAR_SPA=1` など標準値のみで、REST/SOAP API の ON/OFF を操作する手段が見つかっていない。

### コンテナ整理 TODO

- 証跡: `artifacts/orca-connectivity/20251113T054341Z/container_inventory.txt` に `docker ps -a --format '{{.Names}} {{.Status}}' | grep jma-receipt` の結果を保存済み。現時点では `jma-receipt-docker-for-ubuntu-2204-*` 系のみ稼働中で、旧 `jma-receipt-docker-*` 系は残骸を起動させていない。
- 正式なプロジェクト名（compose プロジェクト）は `jma-receipt-docker-for-ubuntu-2204` を採用し、cleanup 時もこの系列を基準に状態を判断する。`jma-receipt-docker` プレフィックスで作られた旧スタックは **テスト用途の停止済みコンテナとして扱い、再構築せず削除候補リストに留める**。
- 次回 cleanup 方針: 稼働中の `-for-ubuntu-2204` 系を停止せずに `docker ps -a | grep jma-receipt-docker[^-for-ubuntu-2204]` で既存停止コンテナを抽出し、Compose プロジェクトごとに `docker container rm` / `docker volume ls | grep jma-receipt-docker` の順で整理する。誤削除防止のため、削除前に各コンテナの `Created` タイムスタンプをログへ記録する。

### プロセス / `ps` 出力
- `docker ps --filter name=orca` 結果より、WebORCA は `jma-receipt-docker-for-ubuntu-2204-orca-1 (image: jma-receipt-weborca:22.04)`、DB は `jma-receipt-docker-for-ubuntu-2204-db-1` が稼働中。サポート依頼時はこの組み合わせで再現していることを明示予定。
- コンテナ内の `ps` で PID 1 が `su -s /bin/bash orca -c /opt/jma/weborca/mw/bin/weborca` を直接起動しており、Supervisor などのプロセス管理層は介在していない。`/app/weborca-main` などのビルド済みアプリパスも存在せず、ランタイム構成を変更する術がなくなっている状況を共有したい。
- `psql` seed 作業時の `docker ps` で DB コンテナ名を再確認し、`artifacts/orca-connectivity/20251113T015810Z/seed/` に `seed_insert.sql` / `seed_verification.txt` を保存済み。受付ダミーデータの再投入手順も添付する想定。

### ログ状況
- 09:30 JST 時点（RUN_ID=`20251113TorcaP0OpsZ1`）では `docker logs jma-receipt-docker-for-ubuntu-2204-orca-1` の `json-file` のみが頼りで、ファイルログ（`/var/log/orca/*.log`）は未整備だった。14:55 JST の RUN_ID=`20251119TorcaHttpLogZ1` で `tail -n 200 docker/orca/jma-receipt-docker/logs/orca/http.log` を採取し、`start-weborca.sh` の `REDIRECTLOG` 処理により STDOUT/STDERR が `http.log` へも同時出力されていることを確認。以降は `tail -F` + `docker logs --since` を標準手順とする。
- `LOGDIR=/opt/jma/weborca/log`（bind mount: `docker/orca/jma-receipt-docker/logs/orca`）には `orca-db-*.log` に加え `http.log`（`orca_http.log -> http.log`）が生成される。`artifacts/orca-connectivity/20251119TorcaHttpLogZ1/logs/host_orca_log_dir.txt` / `.../orca_http_symlink.txt` へ証跡を残したうえで、`REDIRECTLOG="/var/log/orca/http.log"` を `jma-receipt.env` に固定した差分を記録済み。
- ログ永続化設計（`docker/orca/jma-receipt-docker/docker-compose.override.yml` で `./logs/orca:/opt/jma/weborca/log`）は従来どおり維持し、`weborca` の STDOUT/STDERR を `tee -a /var/log/orca/http.log` へ流す。サポート問い合わせ時は RUN_ID=`20251119TorcaHttpLogZ1` の成果物を根拠として提示する。

### Pending Questions
1. REST/SOAP API（`/orca11/*`, `/orca14/*`, `/api21/*`）で POST が常時 405/404 になる現象について、バイナリのみで POST を許可する手順（設定ファイルやビルドオプション）の有無を確認したい。
2. `online.env` / `jma-receipt.env` に存在しない API 有効化フラグを別ファイルで管理しているのか、あるいは weborca バージョン `20251028-1` 自体が POST 未対応なのか、公式位置付けを明示してもらいたい。
3. HTTP アクセスログを永続化する推奨パス（例: `/var/log/orca/http.log`）や `REDIRECTLOG` の正しい設定方法が不明のため、ベストプラクティスを確認したい。
4. `Api_Result=13/14/21` の推移から受付データ seed を用意しているが、正式なテスト用マスタ投入手順（Physician/Medical seed）の提供が可能かどうかを問い合わせたい。

## 2025-11-13 19:45 JST 追記: W59 `/orca11/acceptmodv2` POST 有効化調査（RUN_ID=`20251113TorcaAcceptEnableZ1`）

- 指示: W59「/orca11/acceptmodv2 の POST 有効化調査」。Runbook §4.5（firecrawl 版 `ORCA_CONNECTIVITY_VALIDATION.md` §4.5 HTTP 404/405 対応フロー）に沿って `receipt_route.*` と `online.env` の REST 開放設定を確認し、405 継続時は不足情報を `artifacts/orca-connectivity/<RUN_ID>/acceptmodv2_enable/NOT_FIXED.txt` に整理すること。
- 作業時間: 2025-11-13 19:05-19:45 JST。Evidence: `artifacts/orca-connectivity/20251113TorcaAcceptEnableZ1/`（`config/`, `httpdump/orca11_acceptmodv2/`, `logs/`, `acceptmodv2_enable/`）。
- コンテナ再起動は禁止のため、`docker exec`/`docker cp` での設定採取と HTTP 直打ちのみ実施。

### 1. 設定確認
- `/opt/jma/weborca/app/etc/receipt_route.ini` は既に存在し、`[orca11]` ブロックに `ENABLE=1` / `ALLOW_METHODS=OPTIONS,GET,POST` / `UPSTREAM_PATH=/orca11` を保持していた。コンテナから `docker cp` した現物を `artifacts/.../config/receipt_route.ini` に保存し、テンプレ（`artifacts/orca-connectivity/templates/receipt_route.template.ini`）との diff `receipt_route.diff` でコメント行のみの差分であることを確認。
- `online.env` を取得したが、HTTP/DB 接続設定のみで `API_ENABLE_*` が存在しない。Runbook §4.5 が要求する API_ENABLE フラグ未定義の証跡として以下を記録。

```ini
HTTP_PORT=8000
HTTP_HOST=http://localhost
DBNAME=orca
DBUSER=orca
# ...
# （API_ENABLE_* に相当するキーは 0 行）
```

- `docker exec ... env | grep -E 'API|ROUTE|HYBRID'` の出力も空（`config/env_API_ROUTE_HYBRID.txt`）。`jma-receipt.env` にも `API_ENABLE_*` は存在せず、環境変数／設定ファイルいずれも POST 有効化のエントリがないことを `acceptmodv2_enable/NOT_FIXED.txt` へ記載した。

### 2. `/orca11/acceptmodv2` HTTP 405 再現
- 既存設定のまま `curl -sv -X POST 'http://localhost:8000/orca11/acceptmodv2?class=01' -H 'Content-Type: application/x-www-form-urlencoded' --data 'dummy=1'` を実行。レスポンスは `HTTP/1.1 405 Method Not Allowed`、`Allow: OPTIONS, GET`。リクエスト/レスポンス/verbose ログは `httpdump/orca11_acceptmodv2/{request.http,response.http,curl.verbose}` に保存。
- `docker logs jma-receipt-docker-for-ubuntu-2204-orca-1 --since 30m | rg '405'` にも `2025/11/13 19:38:04 System Error:405 code=405, message=Method Not Allowed` を取得し、`logs/orca_405_extract.log` へ記録。WebORCA 側で POST が拒否されていることを再確認した。

### 3. 所見・次アクション
- receipt_route テンプレは適用済みで POST を許可しているため、欠落しているのは Runbook §4.5「API enable 手順」で想定される `API_ENABLE_ACCEPT=1` など online.env／環境変数側のフラグ。
- 指示通り `artifacts/.../acceptmodv2_enable/NOT_FIXED.txt` に未解決状況と不足設定（API_ENABLE_*）を整理。Route 再配置のみでは 405 が解消しない Evidence を追加し、PHASE2_PROGRESS および Evidence Index にリンク済み。
- 次ステップとして、W23/W45 から継続している API enable 手順の入手（WebORCA サポート問い合わせ）を Blocker として維持する。

## 2025-11-13 13:25 JST 追記: W47/W48 患者番号桁数と patientmodv2 再試行

- `jma-receipt-docker-for-ubuntu-2204-db-1` に `docker exec ... psql -c "select kanricd,kbncd,kanritbl from tbl_syskanri where kanricd in ('0044','1065');"` を実行し、`kbncd=1065` が `ORCBPTNUMCHG`（患者番号桁数変更）で `追加桁数 KBN=1` を保持していることを確認。`tbl_ptnum` 先頭レコードは `000001`（6 桁）だが、新規登録は追加桁数ルールに従う必要があるため、既存 seed とは桁数要件が異なる。
- 公式手順に合わせ `tmp/patientmodv2_official_request.xml` を XML/UTF-8 で作成し、`docker run --rm --network jma-receipt-docker-for-ubuntu-2204_default -v "$PWD/tmp/patientmodv2_official_request.xml":/payload.xml curlimages/curl:8.7.1 -u ormaster:change_me -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' --data-binary @/payload.xml http://orca:8000/api/orca12/patientmodv2?class=01` を送信。`Patient_ID` を空にした場合は `HTTP 200 / Api_Result=01 (患者番号未設定)`、`Patient_ID=000001` など 6-8 桁で指定した場合は `Api_Result=P1 (患者番号の桁数が違います。)` を取得し、P1 が桁数チェック（ORCBPTNUMCHG 追加桁数未満）で発生することを証跡化した。レスポンスと ORCA ログは `artifacts/orca-connectivity/20251113T042053Z/patientmodv2_official/` に保存済み。
- WebORCA コンテナ内で `find /opt/jma/weborca -maxdepth 5 -name '*patientmodv2*'` を実行したが、`/opt/jma/weborca/samples/patientmodv2` は存在せず、公式 XML サンプルは同梱されていない。Runbook §5 から参照するテンプレートを当リポジトリ側で維持する必要がある。

## 2025-11-13 15:58 JST 追記: W46 患者公式採番 + /api/api21 CLI 再実行準備 (RUN_ID=`20251113TorcaPatientmodCliW46`)

- UTC_RUN=`20251113T065012Z`。Evidence: `artifacts/orca-connectivity/20251113T065012Z/patientmodv2_official_cli/`（patientmodv2）と `.../api21_patientmod_cli/`（API21 再実行手順メモ）、ログは `.../logs/` に格納。`curl_command.sh`／`headers.txt`／`response.json`／`http_log_tail.txt`／`orca_http_log_tail.txt`／`table_checks.txt` を一式保存した。
- patientmodv2 実行は WebORCA コンテナ内から `docker exec ... curl ... --data-binary @/tmp/14_patientmodv2_request.xml` を発行。初回はテンプレファイルをコンテナにコピーしないまま相対パス（`docs/.../14_patientmodv2_request.xml`）を参照したため `Content-Length: 0` となり、`http.log` に Go ランタイムの nil pointer stack trace（`internal/web/api.go:282`）が記録された。`docker cp ... /tmp/14_patientmodv2_request.xml` で配置後は 500 を解消。
- 最終応答は `HTTP 200 / Api_Result=01 (患者番号未設定)` のままで、公式テンプレ（`Patient_ID` 空／7桁直指定）どちらでも新規 `Patient_ID` は払い出されず。DB チェック (`table_checks.txt`) でも `tbl_ptinf`・`tbl_ptnum`・`tbl_ptkohinf`・`tbl_pthkninf` の最新レコードが既存 `ptid=1 / ptnum=00000001` のまま変化なし、`tbl_ptidlink` はテーブル自体が存在しない（エラーログを追記）。
- `Api_Result=01` で採番前に弾かれたため `/api/api21/medicalmodv2` 再実行は行わず、`api21_patientmod_cli/NOT_EXECUTED.txt` に理由と想定 cURL を記載。`http.log`/`orca_http.log` tail も取得し、「未実行」のコメントと共に保存した。
- PostgreSQL コンテナには `/var/log/postgresql/postgresql*.log` が存在せず、`postgresql_tail.txt` へ「ファイル未生成」の旨を出力。次段階は `tbl_syskanri (kbncd=1065)` の 7桁+追加1桁ルールに合う seed（`ptnum >= 00000002`）を投入するか、ORCA サポートへ patientmodv2 の自動採番有効化手順を確認する必要がある。

## 2025-11-13 13:40 JST 追記: W52 患者番号桁数と /api/api21 バリデーション調査 (RUN_ID=20251113TorcaApi21LenW52)

- UTC_RUN=`20251113T043340Z`。`artifacts/orca-connectivity/20251113T043340Z/api21_length-test/` に cURL 応答・ヘッダーと集計 README を保存。目的は `/api/api21/medicalmodv2?class=01` で `Api_Result=10` が続く原因を患者番号桁数・route 設定・ptid 指定のどこに切り分けられるか確認すること。
- ORCA DB: `docker exec jma-receipt-docker-for-ubuntu-2204-db-1 psql -U orca -d orca -c "select * from tbl_syskanri where kanricd in ('0044','1065');"` → `kbncd=1065` が `ORCBPTNUMCHG`（患者番号桁数変更）で「追加桁数 KBN=1」を保持していることを `tbl_syskanri_0044_1065.txt` に記録。6 桁 seed（`000001`）と 7 桁採番ルールが混在している点を再確認した。
- API 実行: `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 curl -s -u ormaster:change_me -H 'Content-Type: application/json; charset=UTF-8' --data-binary @/tmp/orca-api-payloads/<payload>.json http://localhost:8000/api/api21/medicalmodv2?class=01 -D headers -o body` を 4 パターンで実施。HTTP は常に `200 OK`（`X-Hybridmode: normal`）だが、患者番号を 6 桁/7 桁/ptid/ptid10 に変えても `Api_Result=10 (患者番号に該当する患者が存在しません)` が継続した。

### `/api/api21` 患者番号バリエーション結果（W52）

| ケース | Patient_ID | ペイロード | HTTP | Api_Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| pid6 | `000001` (6 桁 seed) | `medicalmodv2_payload.json` | 200 | 10 (`患者番号に該当する患者が存在しません`) | `api21_pid6_response.{json,headers}` |
| pid7 | `0000001` (ORCBPTNUMCHG 7 桁想定) | `medicalmodv2_payload_7d.json` | 200 | 10 | `api21_pid7_response.{json,headers}` |
| ptid | `1` (tbl_ptinf.ptid) | `medicalmodv2_payload_ptid.json` | 200 | 10 | `api21_ptid_response.{json,headers}` |
| ptid10 | `0000000001` (内部 ID 10 桁) | `medicalmodv2_payload_ptid10.json` | 200 | 10 | `api21_ptid10_response.{json,headers}` |

- 考察: `/api/api21` ルートまでは問題なく到達しており route/Basic 認証起因ではない。`ORCBPTNUMCHG` 追加桁数=1 により新規採番は 7 桁へ拡張されている一方、DB には該当桁数の患者レコードが存在しないため、どの入力でも `Api_Result=10` になると推測できる。`patientmodv2` 側で 7 桁 ID を登録するか、`tbl_ptinf`/`tbl_ptnum` seed を桁数ルールへ合わせて再投入する必要がある。

## 2025-11-13 18:05 JST 追記: W54 患者番号桁数ドキュメント化（RUN_ID=20251113TorcaPatientDigitsZ1）

- 目的: `/api/api21` 系および `patientmodv2` が参照する患者番号桁数とチェックルールを明文化するため、`tbl_syskanri` から `kanricd in ('0044','1065')` を抽出。  
  コマンド: `docker exec jma-receipt-docker-for-ubuntu-2204-db-1 psql -U orca -d orca -c "select * from tbl_syskanri where kanricd in ('0044','1065') order by kanricd,kbncd;"`  
  結果ファイル: `artifacts/orca-connectivity/20251113T054336Z/patient_id_rules/tbl_syskanri.txt`
- 所見: `kanricd=0044` 側は患者帳票系が参照する `PTNUM`（デフォルト 7 桁固定）のままだが、`kanricd=1065` / `kbncd=1065` に `ORCBPTNUMCHG`（患者番号桁数変更）が登録されており、`追加桁数 KBN=1` が 2020-07-01 適用で有効化されている。つまり **「7桁 + 追加1桁 = 8桁」** が現行ルールであり、6 桁 seed とは不整合。
- 判断: `/api/orca12/patientmodv2` で `Patient_ID` を明示指定する場合も `/api/api21` で `Patient_ID`（または `ptid` 変換）を渡す場合も 8 桁ゼロ埋め（`00000001` など）で送らない限り `Api_Result=P1`（桁数エラー）もしくは `Api_Result=10`（患者未検出）に留まる。Runbook §5 の `patientmodv2`／`/api/api21` 行備考へ桁数メモを追加し、`notes/orca-api-field-validation.md` へ同 RUN_ID で証跡を追記した。

## 2025-11-13 18:25 JST 追記: W55 `/api/api21` 8桁患者 Seed 再検証（RUN_ID=20251113TorcaApi21SeedZ1）

- 目的: W54 で整理した 8 桁患者番号ルールに合わせ、`docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql` を 8 桁 (`00000001`) 版へ更新し、ORCA DB へ再投入したうえで `/api/api21/medicalmodv2?class=01` を 200/`Api_Result=00` まで進める。コンテナ停止は禁止のため `docker exec` のみ使用。
- Seed 適用: `docker exec -i jma-receipt-docker-for-ubuntu-2204-db-1 psql -U orca -d orca < docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql | tee artifacts/orca-connectivity/20251113T061111Z/seed_psql.log`。`tbl_ptinf`/`tbl_ptnum`/`tbl_ptnum_public`/`tbl_pthkninf`/`tbl_ptkohinf`/`tbl_srykarrk`/`tbl_sryact`/`tbl_uketuke` を hospnum=1, ptid=1 で再挿入し、`seed_verification.txt` で `ptnum=00000001 (length=8)` と `patient_id_1=00000001` を確認。
- API 実行: `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 sh -c "cd / && curl -sS -D /tmp/api21_headers.txt -o /tmp/api21_body.json -u ormaster:change_me -H 'Content-Type: application/xml; charset=UTF-8' --data-binary @/tmp/orca-api-payloads/03_medicalmodv2_payload.xml 'http://localhost:8000/api/api21/medicalmodv2?class=01'"` を実行（payload の `Patient_ID` も `00000001`）。HTTP 200 / `X-Hybridmode: normal` だが `Api_Result=10 (患者番号に該当する患者が存在しません)` が継続。Evidence: `artifacts/orca-connectivity/20251113T061159Z/api21_seed_retry/{response.log,response_headers.txt,response_body.xml,run_metadata.txt}`。
- ログ採取: ホスト側 `docker/orca/jma-receipt-docker/logs/orca/{http.log,orca_http.log}` を tail し `http_log_tail.txt`, `orca_http_log_tail.txt` として保存。PostgreSQL はファイルログが生成されていなかったため、`docker logs --since 5m jma-receipt-docker-for-ubuntu-2204-db-1` を `postgres_log_tail.txt` へ退避し「log file not found」を追記。
- 所見: 8 桁 seed でも `Api_Result=10` が変わらず、患者番号桁数よりも `patient_id` 解決処理（例: `tbl_ptnum_public` から `ptid` へ変換するステップや `MDCRES-OBJECT not low_value` エラー）側がボトルネックと推測される。`http.log` には `API-:orca ormaster medicalmodv2 ORAPI021S1V2` が 28-94ms で完了しており、アプリ層で lookup が失敗している。次ステップとして (1) `patientmodv2` で実際に 8 桁 ID を発番したケースとの比較、(2) `tbl_ptnum_public` 以外に `patient_id_1` を保持するテーブル（例: `tbl_patientid`）の不足を洗い出す必要がある。

## 2025-11-13 21:10 JST 追記: 技術情報ハブ firecrawl 補完（RUN_ID=20251113TorcaTecIndexZ1）

- 目的: `https://www.orca.med.or.jp/receipt/tec/index.html` から辿れる帳票・CLAIM・カスタマイズ関連資料を firecrawl コンテナ経由で Markdown 化し、API 以外の仕様もオフライン参照できる状態にする。
- 事前確認: `docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | grep firecrawl` で `firecrawl-api-1` ほか 4 サービスが `Up`。`curl -s -X POST http://localhost:3002/v0/scrape -d '{"url":"https://example.com"}'` で 200 レスポンスを確認済み。
- 収集手順:
  1. `xmllint --xpath '//div[@id="mainContent"]//a/@href'` で技術情報トップのリンクを抽出し、HTML ページのみを `tmp/orca_tec_pages.txt` に列挙（15 URL）。
  2. `while read url; do curl http://localhost:3002/v0/scrape ...; done` で `docs/server-modernization/phase2/operations/assets/orca-tec-index/raw/<slug>.{md,md.source,md.status}` を生成。レスポンスの `title/pageStatusCode` を `jq -s` で `manifest.json` にまとめた。
  3. 取得内容を `docs/server-modernization/phase2/operations/assets/orca-tec-index/README.md` に整理し、収録ページ概要／ダウンロードリンクの扱い／再実行手順を記述。`operations/ORCA_CONNECTIVITY_VALIDATION.md` と `docs/server-modernization/phase2/INDEX.md` からリンク、`DOC_STATUS.md` へ Active 資料として登録。
- 所見: 技術情報トップ (`raw/index.md`) には 5.2.0 系ソース zip、基本設計書 (`orca_bd_*.pdf`)、ユーザカスタマイズ留意事項 (2025-04-15 最新) など API 外の一次情報がまとまっている。CLAIM ページには「2026年3月末でCLAIM通信廃止」の公式告知、PushAPI ページには WebSocket エンドポイント/TLS 要件、MONPE/MONTSUQI ページには帳票テンプレート→COPY句自動生成フローが記載されており、今後の Runbook で引用可能になった。
- 注意: `ftp://` / `https://ftp.orca.med.or.jp/` 配下の PDF/TAR はファイルサイズが大きいため未コミット。必要になったら個別にダウンロードし `artifacts/orca-connectivity/<RUN_ID>/downloads/` へ保存し、リンク元を README に追記すること。

## 2025-11-13 22:00 JST 追記: 技術情報ハブ 2nd wave（RUN_ID=20251113TorcaTecIndexZ2）

- 目的: API ページ内からリンクされている個別仕様（コメントコード、COVID-19 入院料、MONTSUQI モジュール解説等）が初回クロール対象外だったため、残タスクを firecrawl で補完する。
- 追加取得 URL（計 10 件）: `api_overview`, `api_syoho-period-api`, `api_comment85-831-api`, `api_comment842-830-bui-api`, `api_covid19-api`, `comment85-831-claim`, `comment842-830-bui-claim`, `montsuqi/overview`, `montsuqi/description`, `push-api/`。
- 手順: `tmp/orca_tec_pages_extra.txt` に `slug url` 形式で列挙 → ループで firecrawl API を叩き、`raw/<slug>.md` へ保存。`manifest.json` は `jq -s '.[0]+.[1]'` で追記し、総エントリ数を 25 件へ拡張。
- 所見: コメントコード系ページは API/CLAIM 両方で `85xx/83xx/84xx` の入力書式と返却例を保持しており、`medicalgetv2` や `CLAIM` テストでの相互参照が容易になった。`api_covid19` には公費 028 の組合せや 35 日制限、3倍算定時の転科処理が整理されている。`montsuqi_overview/description` では glclient/glserver/WFC など既存 UI のアーキ情報を取得できたほか、`push-api` ページには `push-exchanger` のバージョン（Ubuntu 22.04=0.0.33+p1-u8jma1 等）と帳票系 PUSH 資料リンクがまとまっている。
- ドキュメント更新: `assets/orca-tec-index/README.md` の表へ新規スラッグを追記し、それぞれの主題と利用シナリオを記述。Runbook からのリンクは既存のハブ README 参照でカバー。

## 2025-11-13 22:20 JST 追記: ユーザ管理 API 追加クロール（RUN_ID=20251113TorcaTecIndexZ3）

- 目的: `manageusersv2`（ユーザ一覧/登録/変更/削除）が API 優先度 P2 に含まれているため、技術情報ハブでも参照できるよう `https://www.orca.med.or.jp/receipt/tec/api/userkanri.html` を firecrawl で取得し、既存の ORCA API Spec 以外でもアクセスできるようにする。
- 手順: `slug=api_userkanri` で `docs/server-modernization/phase2/operations/assets/orca-tec-index/raw/api_userkanri.{md,md.source,md.status}` を保存。`manifest.json` に 1 件追加し、README の表へ概要を追記した。
- 参照更新: `operations/ORCA_CONNECTIVITY_VALIDATION.md` の API 優先度表（#32 `/orca101/manageusersv2`）にローカル資料パス `assets/orca-tec-index/raw/api_userkanri.md` を明記。これでエージェントは Runbook から直接オフライン仕様へ遷移できる。

## 2025-11-13 17:40 JST 追記: Route / LOGDIR 対応案

### receipt_route.ini 再配置
1. `docker/orca/jma-receipt-docker/example/receipt_route.ini` を Runbook §4.5 のテンプレ基準として追加（`git show HEAD docker/orca/jma-receipt-docker/example/receipt_route.ini` で diff 参照可）。
2. `docker cp docker/orca/jma-receipt-docker/example/receipt_route.ini jma-receipt-docker-for-ubuntu-2204-orca-1:/opt/jma/weborca/app/etc/receipt_route.ini` を実行し、`docker exec ... chown orca:orca /opt/jma/weborca/app/etc/receipt_route.ini` → `chmod 640 ...` を付与。
3. `docker exec ... grep -n "\[api01rv2\]" /opt/jma/weborca/app/etc/receipt_route.ini` で有効化を確認し、`ops/tests/orca/api-smoke.sh --prefixes route,direct --run-id $RUN_ID` を再実行して 404/405 の変化を採取する。
4. config dump は `artifacts/orca-connectivity/<RUN_ID>/config_dump/receipt_route.ini` として保存し、本ログ §4.5 および Runbook §4.5 の証跡リンクへ追記。

### LOGDIR 永続化
1. `cp docker/orca/jma-receipt-docker/docker-compose.override.yml.example docker/orca/jma-receipt-docker/docker-compose.override.yml`。
2. `mkdir -p docker/orca/jma-receipt-docker/orca-logs` を作成し、`docker compose -f docker/orca/jma-receipt-docker/docker-compose.yml -p jma-receipt-docker-for-ubuntu-2204 up -d --force-recreate orca` で `/opt/jma/weborca/log` をホストへバインド。
3. `ls -l docker/orca/jma-receipt-docker/orca-logs` の結果を `artifacts/orca-connectivity/<RUN_ID>/log-persistence/host_dir_listing.txt` へ保存し、`docker exec ... ls -l /opt/jma/weborca/log` との差異を比較。`LOGDIR=/opt/jma/weborca/log` は `docker compose logs orca | rg LOGDIR` で証跡化。
4. 永続化後は `tail -F docker/orca/jma-receipt-docker/orca-logs/weborca-http.log` 等で HTTP 405 発生時刻を即時追跡できるようにし、Runbook §4.5 のログ採取フローへリンク（本ログの該当節から README 追記を参照）。

### 追加証跡
- `docker/orca/jma-receipt-docker/README.md` へ Runbook §4.5 の参照手順とテンプレ/ログ案を追記済み。
- `docker/orca/jma-receipt-docker/docker-compose.override.yml.example` に `./orca-logs:/opt/jma/weborca/log` を明示し、`PHASE2_PROGRESS.md` へ “ORCA route/log plan drafted” を登録予定。

## 2025-11-13 追記: RUN_ID=`20251113TorcaSeed7DigitZ1`（7桁患者 Seed 手順）

- 目的: `/api21/medicalmodv2` で `Api_Result=10` を解消するため、`ORCBPTNUMCHG (kbncd=1065)` で 7 桁化された患者番号サンプルを再現できる Seed SQL を Runbook へ格納した。
- 手順サマリ:
  1. `docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql` を `RUN_ID` 単位で参照し、適用前に `SELECT * FROM tbl_syskanri WHERE kbncd=1065;` で桁数設定を確認。
  2. `docker exec -i jma-receipt-docker-for-ubuntu-2204-orca-1 psql -U orca -d orca < docs/server-modernization/phase2/operations/assets/seeds/api21_medical_seed.sql` を実行し、標準出力を `tee artifacts/orca-connectivity/20251113T031200Z/seed_psql.log` で採取する。
  3. `tbl_ptinf / tbl_ptnum / tbl_pthkninf / tbl_ptkohinf` の hospnum=1, ptid=1 が削除→再挿入されるため、投入前に ORCA 管理画面や `COPY ... TO STDOUT` でバックアップを取得しておく。
- Evidence: `artifacts/orca-connectivity/20251113T031200Z/seed_psql.log`（`RUN_ID=20251113TorcaSeed7DigitZ1` を 1 行目に追記予定）。Runbook へは §5 Appendix「Seed SQL 手順（API21 7 桁患者）」としてリンク済み。
- ステータス: 2025-11-13 時点では Runbook/ログ整備のみで SQL 実行は未実施（`artifacts/orca-connectivity/20251113T031200Z/` は空で `seed_psql.log` 未作成）。投入後は本節を更新し、`PHASE2_PROGRESS.md` の ORCA 接続検証レポートにも記入する。

## 2025-11-13 23:48 JST 追記: RUN_ID=`20251113TorcaApi21LogW55`（W55 `/api/api21` ログトレース）

- 目的: `/api/api21/medicalmodv2?class=01` 送信時に WebORCA 側でどのフィールドが不足扱いになっているか、`/opt/jma/weborca/log/{http.log,orca_http.log}` の API 実行ログから切り分ける。
- 実行条件: `UTC_RUN=20251113T054823Z`。ホストで `export PATIENT_ID_TEST=0000001` → `curl -sS -u ormaster:change_me -H 'Content-Type: application/xml; charset=UTF-8' -H 'Expect:' --data-binary @tmp/orca-api-payloads/03_medicalmodv2_payload.xml -D api21_response_headers.txt -o api21_response_body.json http://localhost:8000/api/api21/medicalmodv2?class=01`。同時に `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 tail -n0 -F /opt/jma/weborca/log/{http.log,orca_http.log}` をバックグラウンド起動し、出力を `http_log_tail.txt` / `orca_http_log_tail.txt` へ保存。
- 結果: HTTP 200 / `Api_Result=10`（「患者番号に該当する患者が存在しません」）。ログは `libcob:cancel_context`→`MDCRES-OBJECT not low_value`→`API-:orca  ormaster medicalmodv2 ORAPI021S1V2 false api:49ms tot:60ms`→`DestroyContext: false` のみで、`tbl_ptinf` や `SELECT ... Patient_ID` など患者検索 SQL は出力されず。WebORCA が患者レコードへ到達する前にバリデーションで弾いていることを Runbook §4.5 に明記済み。
- 証跡: `artifacts/orca-connectivity/20251113T054823Z/api21_logtrace/`（`run_metadata.txt`、`curl_command.sh`、レスポンス XML、各ログ tail）。禁止事項どおりコンテナ再起動・設定変更は未実施。

## 2025-11-13 追記: RUN_ID=`20251113TorcaSpecZ1`（firecrawl 仕様収集）

- `docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | grep firecrawl` で `firecrawl-api-1 / firecrawl-redis-1 / firecrawl-nuq-postgres-1 / firecrawl-playwright-service-1` がすべて `Up` であることを確認し、`curl -s -X POST http://localhost:3002/v0/scrape ... example.com` で API が応答することを事前検証。
- `curl -s -X POST http://localhost:3002/v0/scrape -H 'Content-Type: application/json' -d '{"url":"https://www.orca.med.or.jp/receipt/tec/api/overview.html"}'` の応答から `linksOnPage` を `jq` で抽出し、`/receipt/tec/api/` 配下 60 本の URL リストを作成（`tmp/orca_api_urls.txt`）。
- firecrawl のスクレイピング結果を `docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/<slug>.md`（および `.source/.status`）へ保存。`report_print/` は `index.html` を明示指定して再取得し、欠落ページを補完。
- `scripts/tools/orca-spec-manifest.js` を追加し、`node scripts/tools/orca-spec-manifest.js` で `manifest.json` と `orca-api-matrix.with-spec.csv`（API No ↔ 仕様ファイルの対応表）を生成できるようにした。
- ハブドキュメント `docs/server-modernization/phase2/operations/assets/orca-api-spec/README.md` を作成し、`ORCA_CONNECTIVITY_VALIDATION.md`／`docs/server-modernization/phase2/INDEX.md`／`DOC_STATUS.md` からリンク。firecrawl を用いた更新手順と利用方法を整理。
- `manifest.json` の `statusCode` で全ページが 200 応答であること、および `orca-api-matrix.with-spec.csv` に 53 API がすべて対応付けられていることを確認済み。

## 2025-11-13 18:45 JST 追記: W56 患者番号標準化 + patientmodv2→api21 検証（RUN_ID=20251113TorcaPatientAutoStdZ1）

- UTC タグ=`20251113T084607Z`。Evidence ルート: `artifacts/orca-connectivity/20251113T084607Z/`（`patient_id_rules/`, `patientmodv2_auto/`, `api21_patientmod_auto/`）。
- `tbl_syskanri (kanricd='1009', kbncd='*')` を `2 0041107 ... → 2 0041108 ...` へ更新し、標準構成 + 8 桁連番（7 桁 + 検証）を明示。更新 SQL は `patient_id_rules/kanritbl_update.sql` に記録。`tbl_hknjainf_user/_plus` へ `InsuranceProvider_Number=06123456 / hknnum=006` を挿入し、`patientmodv2` の保険者番号チェック（`Api_Result=H1`）を解消した。
- `docs/.../14_patientmodv2_request.xml` を `Patient_ID=*` / `Relationship=全角` / `InsuranceProvider_Class=006` 等へ整え、`docker cp` → `curl -sS ... patientmodv2` を再実行。Run15 で `Api_Result=00` と `Patient_ID=00002` を取得し、`patientmod_body_success.xml` / `http_log_tail_success.txt` に保存。直後に `tbl_ptinf/tbl_ptnum/tbl_pthkninf` を `table_checks.txt` として採取し、`tbl_ptnum_public`・`tbl_ptnum` を 8 桁ゼロ埋めへ補正（SQL は `patient_id_rules/ptnum_public_upsert.sql`）。
- `/api/api21/medicalmodv2?class=01` は患者番号未検出（`Api_Result=10`）を解消できたが、`Physician_Code` の解決に失敗し **`Api_Result=14 (ドクターが存在しません)`** が継続。`Physician_Code=00001/1001/1`、`tbl_list_doctor` への dummy 追加、`tbl_uketuke` / `tbl_srykarrk` / `tbl_sryact` seed、`system01lstv2 class=02` の doctor 取得（`Code=00001`）を実施しても状況は変わらず。最新失敗レスポンス: `api21_body_retry9.xml` / `http_log_tail_retry7.txt`。
- 所感 / 次アクション:
  1. `ORCBPTNUMCHG` で 8 桁化された環境では `tbl_ptnum_public.patient_id_1`・`tbl_ptnum.ptnum` を 8 桁へ合わせないと `/api/api21` が常に `Api_Result=10` になる。今回の補正 SQL は `patient_id_rules/*.sql` へ保存済み。
  2. doctor 未検出は ORCA 側 doctor マスタと REST ルートの紐付け不足の可能性が高い。`system01lstv2` は `Code=00001` を返しているため、当該コードを診療科へ割り当てる公式手順（UI or SQL）を確認する必要がある。Runbook §4.5 / マトリクス #3,#14 に「doctor 未登録がボトルネック」の旨を追記する。
  3. `/orca11/acceptmodv2` は依然 405 のため、受付 seed は DB 直書き（`api21_patientmod_auto/uketuke_insert.sql`）で代替。REST 100% 成功には doctor マスタ投入と受付 API 開放が前提となる。

## 2025-11-13 追記: RUN_ID=`20251113TorcaDocLinkZ1`（WebORCA 参照先の明文化）

- WebORCA 作業開始時に参照すべきドキュメントとして `docs/server-modernization/phase2/operations/assets/orca-api-spec/README.md` を `SERVER_MODERNIZED_DEBUG_CHECKLIST.md`、`EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md`、`PHASE2_PROGRESS.md` へ追記し、エージェントがオフライン API 仕様へ即座に到達できるようにした。
- 参照手順: チケットで対象 API 番号を指定 → `orca-api-matrix.with-spec.csv` から `SpecSlug` を確認 → `raw/<slug>.md` の Markdown を添付 or 引用。Evidence は `scripts/tools/orca-spec-manifest.js` で再生成できる。

## 2025-11-13 21:41 JST 追記: W60 system01 class02 & medicalmodv2 ドクター照合 (RUN_ID=`20251113TorcaDoctorManualW60`)

- UTC_RUN=`20251113T123843Z`
- 使用コンテナ: `jma-receipt-docker-for-ubuntu-2204-orca-1`
- 証跡: `artifacts/orca-connectivity/20251113T123843Z/doctor_manual/`（system01lstv2）および `.../api21_doctor_manual/`（medicalmodv2 応答／ヘッダー／`orca/http.log` tail）
- 送信ペイロード: `tmp/orca-api-payloads/03_medicalmodv2_payload.xml`（`Physician_Code=00001` 設定済み、追加修正なし）

### system01lstv2 (class=02)
- 実行コマンド: `curl -u ormaster:change_me -H 'Content-Type: application/xml' --data '<data><system01_managereq ...' http://localhost:8000/api01rv2/system01lstv2?class=02` をそのまま Evidence へ保存。
- HTTP 200 応答だが `Api_Result=11 (対象がありません。)` のままで Physician マスタ 0 件。前回 seed（`RUN_ID=20251113TorcaPatientAutoStdZ1`）で登録済みの `Code=00001` 医師を再取得できず、`tbl_list_doctor` か `tbl_physician` サイドの永続化に食い違いが残っている。
- `orca/http.log`（21:39:44／21:39:49）の `PHYSRES-OBJECT not low_value` 行も取得済みで、ORCA 受信→レスポンス生成までは成功しているがレコード抽出時にヒットしない状態。

### `/api/api21/medicalmodv2?class=01`
- `docker cp tmp/.../03_medicalmodv2_payload.xml /tmp/medicalmodv2_payload.xml` → `docker exec jma-receipt-docker-for-ubuntu-2204-orca-1 curl -sS -u ormaster:change_me -H 'Content-Type: application/xml' --data @/tmp/medicalmodv2_payload.xml -D /tmp/api21_headers.txt -o /tmp/api21_response.xml 'http://localhost:8000/api/api21/medicalmodv2?class=01'` を実行。
- HTTP ヘッダー: `HTTP/1.1 200 OK`, `Content-Type: application/xml; charset=UTF-8`, `X-Hybridmode: normal`, `Date: Thu, 13 Nov 2025 12:40:50 GMT`, `Content-Length: 821`。
- 応答本文は `Api_Result=14 (ドクターが存在しません)`、`Physician_Code` エコーバック値も `00001`。患者 ID `00000002`・`Medical_Uid=MED-20251113-001` などは返っているため患者 seed と perform 情報は認識されているが、doctor マスタ解決が未整備で次段階に進めない。
- `artifacts/.../api21_doctor_manual/http.log.tail` に system01/medicalmodv2 双方のウォークスルー行（`API-:orca  ormaster medicalmodv2 ... api:36ms tot:39ms`）を保存し、Runbook §4.5 で参照する HTTP トリアージログとして登録。

### 所見 / TODO
1. `system01lstv2` で `Code=00001` が取得できない限り `medicalmodv2` も `Api_Result=14` で停止するため、doctor マスタ seed（`tbl_list_doctor`, `tbl_doctor`, `tbl_srykarrk` など）を再確認して Evidence を更新する。
2. `/api/api21` 側は HTTP 200 まで進むためルーティングや Basic 認証は解決済み。doctor マスタ復旧後に同 payload を再実行し、`Api_Result=00` が得られたらマトリクス #3 と Evidence Index を更新する。

## 2025-11-13 22:32 JST 追記: W62 manageusersv2 doctor seed 検証 (RUN_ID=`20251113TorcaManageUsersZ1`)

- UTC_RUN=`20251113T150730Z`
- 使用コンテナ: `jma-receipt-docker-for-ubuntu-2204-orca-1`, `jma-receipt-docker-for-ubuntu-2204-db-1`
- 証跡: `artifacts/orca-connectivity/20251113T150730Z/manageusers/{register,update,delete}/`, `.../manageusers/table_checks.txt`, `.../api21_manageusers/`
- リクエスト XML は `docs/server-modernization/phase2/operations/assets/orca-api-requests/manageusers_{register,update,delete}.xml` に保存し、`docker cp` で `/tmp/` に配置してから `curl --data-binary @/tmp/...` を実行（Request_Number=02/03/04）。

### `/orca101/manageusersv2`

| Request_Number | 操作 | HTTP/Allow | Api_Result | Evidence / 備考 |
| --- | --- | --- | --- | --- |
| 02 | 登録（User_Id=`taro`, Group_Number=1 doctor） | `HTTP/1.1 405 Method Not Allowed`, `Allow: OPTIONS, GET` | ―（`{"Code":405,...}`） | `manageusers/register/response.{headers,xml}`。`weborca.log` に `System Error:405`＋Echo stacktrace、`postgres.log` は該当行なし。 |
| 03 | 変更（`User_Id=taro` → `jiro`、New\_* 指定） | `HTTP/1.1 405`（Allow 変化なし） | ― | `manageusers/update/*`。登録失敗のままでも HTTP レイヤーで遮断されることを確認。 |
| 04 | 削除（`User_Id=jiro`） | `HTTP/1.1 405`（Allow 変化なし） | ― | `manageusers/delete/*`。DELETE でもなく POST 受付自体が無効なため、ドクター削除検証も不可。 |

- 各ディレクトリには `docker logs --since 1m` で取得した `weborca.log` / `postgres.log` を保存した。ORCA 側では `web.ErrorHandler` から 405 応答後にスタックトレースが残るのみで、DB には INSERT/UPDATE が一切流れていない。

### `/api/api21/medicalmodv2?class=01` 再実行

- `tmp/orca-api-payloads/03_medicalmodv2_payload.xml`（`Physician_Code=00001`）を流用し、`docker exec ... curl -sS -H 'Content-Type: application/xml; charset=UTF-8' --data-binary @/tmp/03_medicalmodv2_payload.xml 'http://localhost:8000/api/api21/medicalmodv2?class=01'` を実行。
- HTTP 200 (`Content-Length: 821`, `X-Hybridmode: normal`) で応答したが、`response.xml` は `Api_Result=14 / ドクターが存在しません` のまま。`weborca.log` と `postgres.log` も `artifacts/.../api21_manageusers/` に保存し、doctor マスタ解決待ちであることを再確認。

### DB チェック

- `manageusers/table_checks.txt` に `tbl_list_doctor`, `tbl_syskanri (kbncd in 1010/1050)`, `tbl_srykarrk`, `tbl_sryact` へ `taro`/`jiro` が挿入されていないことを示すクエリ結果を記録。いずれも 0 行で、API 405 の通り DB 側も未更新である。

### 所見 / TODO
1. `/orca101/manageusersv2` は GET/OPTIONS しか許可されていないため、`receipt_route.ini` か `online.env` で API #32 の POST を明示的に有効化するタスクが必要。ルート復旧まで doctor マスタ seed を API ベースで実施できない。
2. doctor マスタ未登録が続く限り `/api/api21/medicalmodv2` も `Api_Result=14` で停止する。暫定として DB seed 方式（`tbl_list_doctor` + `tbl_srykarrk` など）を Runbook §5 へリンクし、API が復旧次第 `Physician_Code` を manageusersv2 経由で作成する。
3. 本 RUN_ID を Evidence Index と PHASE2_PROGRESS、Runbook #32（ユーザー管理）の備考へ追記し、`manageusers_{register,update,delete}.xml` を公式テンプレとして参照できるようにした。

### Legacy 参照: manageusersv2 実装調査 (RUN_ID=`20251113TorcaLegacyStaffZ1`)

- Swing クライアントの職員管理 UI は `AddUserImpl`/`ChangePasswordImpl` など（`client/src/main/java/open/dolphin/impl/profile/ChangePasswordImpl.java:188-343`）でユーザー属性と ORCA ID を入力させ、`UserDelegater` が `/user` REST に POST/PUT を投げるだけの構造（`client/src/main/java/open/dolphin/delegater/UserDelegater.java:20-133`）。ORCA API を直接呼ぶコードは存在しない。
- サーバー側 `/user` 実装は `UserResource`→`UserServiceBean` で完結し、JPA で `UserModel` を永続化するのみ（`server/src/main/java/open/dolphin/rest/UserResource.java:26-157`, `server/src/main/java/open/dolphin/session/UserServiceBean.java:62-192`）。ORCA DB 更新や `/orca101/manageusersv2` 呼び出しは一切行われない。
- ORCA ID は `UserModel#orcaId` に文字列で保持され（`common/src/main/java/open/dolphin/infomodel/UserModel.java:60-75`）、カルテ作成時は `ScheduleServiceBean` が `pvt.getDoctorId()` が空ならこの値を Claim 電文へ流用するだけ（`server/src/main/java/open/dolphin/session/ScheduleServiceBean.java:300-335`）。Legacy でも doctor コードは手入力・同期なしで運用されている。
- ORCA 連携クラスは `open.dolphin.common.OrcaApi`（`common/src/main/java/open/dolphin/common/OrcaApi.java:392-454`）と `open.orca.rest.ORCAConnection`（`server/src/main/java/open/orca/rest/ORCAConnection.java:33-96`）で受付・診療科などを取得する用途に限られ、HTTP 送信は単発実行＋例外ログのみ。`manageusersv2` の Java ラッパーは OQS モジュール内に定義されているものの（`ext_lib/OpenDolphin-ORCA-OQS/src/main/java/open/dolphin/orca/orcaapi/OrcaApi.java:485-496`）、`server/` と `client/` のどのクラスからも `open.dolphin.orca.orcaapi.*` を import しておらず未配線。
- firecrawl で取得した公式仕様 `docs/server-modernization/phase2/operations/assets/orca-tec-index/raw/api_userkanri.md:118-319` とサンプル電文 (`docs/server-modernization/phase2/operations/assets/orca-api-requests/manageusers_{register,update,delete}.xml`, `docs/server-modernization/phase2/operations/assets/orca-api-requests/32_manageusersv2_request.json`, `tmp/orca-curl-snippets.txt:94-100`) を突き合わせ、Request_Number／Group_Number／Menu 権限などの入力要件を整理。Legacy 実装はこれらの仕様を利用していないため、Modernized で manageusersv2 を開放する際は新規実装が必要。
- `ext_lib/OpenDolphin-ORCA-OQS` に存在する manageusersv2 関連コード・サンプルは削除せず現状維持とし、`API_ENABLE_*` が公開され次第に備える。フェーズ2では UI 経由の doctor 登録＋証跡化で要件を満たしつつ、将来の自動同期再開に備えて Runbook §5 と本節へ Deferred 方針を明記した。
- 405 を解消するための設定依存は WebORCA 側のルーティングと環境変数にある。`ops/shared/docker/custom.properties:1-24` で `claim.conn` や `orca.orcaapi.*` を指定しても `/orca101` を POST 許可にはできず、`questions/RECEIPT_ROUTE_REQUEST.md:4-56` が示すとおり `online.env` に `API_ENABLE_*` が無い状態。`docker/orca/jma-receipt-docker/example/receipt_route.ini:1-33` にあるテンプレへ `/orca101` ブロックを追加し、AllowMethods に POST を含めて再起動する手順を Runbook §4.5 に紐付けた。

## 2025-11-13 21:55 JST 追記: ORCA 404/405 実トリアージ（RUN_ID=`20251121TorcaHttpLogZ1`）

- UTC_TAG（tail 開始時刻）: `20251113T123055Z` / `20251113T123218Z` / `20251113T124324Z`
- 証跡: `artifacts/orca-connectivity/20251121TorcaHttpLogZ1/`
  - `logs/http_live_<UTC>.log`, `docker_orca_since_20251113T123218Z.log`, `http_404405_extract_20251113T123218Z.log`
  - `logs/host_orca_log_dir_20251113T123218Z.txt`, `logs/orca_http_symlink_20251113T123218Z.txt`
  - `httpdump/api01rv2_patientgetv2/`, `api01rv2_patientgetv2_basic/`, `api11_invalid/`
  - Slack 用サマリ: `RUN_ID_slack_report.txt`

### 1. tail -F / 抜粋結果
- `http_live_20251113T123218Z.log` で `2025/11/13 19:38:04 System Error:405 code=405, message=Method Not Allowed` と直後の `/api01rv2/patientgetv2?id=000001` 呼び出し（curl/8.7.1）を取得。`http_404405_extract_20251113T123218Z.log:133/210/357` をログ台帳に貼り付け済み。
- `http_live_20251113T124324Z.log` には `web.ErrorHandler` → `github.com/labstack/echo/v4.(*Echo).ServeHTTP` → `runtime.goexit` のスタックトレースが残り、HTTP ハンドラ自体が panic して 500 を返している兆候を捕捉。

### 2. docker logs --since
- `docker_orca_since_20251113T123218Z.log` で `Auth Error:401` が 2 回連続発生（12:21:49Z / 12:22:05Z）。Basic 認証付き `patientgetv2` でも 401 のままであり、`receipt_route.ini` 側に GET 許可がない可能性が高い。
- 同ログの 12:33Z 以降には `RPC-:orca ... send_event` 系イベントだけが並び、ORCA UI 側の操作に紐づく通常ログと突合できた。404/405 以外の異常はなし。

### 3. httpdump
- `api01rv2_patientgetv2`: 認証なし/ありの両方を保存。ともに `HTTP/1.1 401 Unauthorized`、`WWW-Authenticate: basic realm=Restricted` で停止。
- `api11/unknown`: `HTTP/1.1 404 Not Found`、`Allow` ヘッダーなし。route テーブル未登録 API では確実に 404/Allow 無しとなることを証跡化。

### 4. 所見 / 次対応
1. `patientgetv2` が 401 のまま → `route/api_enable` 側で GET 許可が落ちている疑い。`receipt_route.ini` の `api01rv2.patientgetv2` エントリを確認し、Basic 認証クレデンシャル（`ormaster:ormaster`）を許可リストに追加する作業を準備する。
2. `System Error:405` と Go Echo stacktrace の同時発生から、ORCA HTTP リスナーが MethodNotAllowed を返した後に panic するケースがある。`/opt/jma/weborca/app/log/error.log`（未取得）との突合や `weborca-main` Go 実装の `ErrorHandler` を追う必要あり。
3. Slack 報告テンプレ（§5）に従い、`RUN_ID_slack_report.txt` を担当チャンネルへ貼り付けるだけで報告可能な状態にした。PHASE2_PROGRESS.md の ORCA 節にも本 RUN_ID を記載して 404/405 対応タスクの進捗として扱う。

## 2025-11-13 22:20 JST 追記: patientgetv2 Basic 認証実測と設定案（RUN_ID=`20251122TorcaHttpLogZ1`）

### Basic 認証の確認結果
- **未認証アクセス** — `curl http://localhost:8000/api01rv2/patientgetv2?id=000001` は引き続き `HTTP 401`（`WWW-Authenticate: basic realm=Restricted`）。証跡: `artifacts/orca-connectivity/20251122TorcaHttpLogZ1/httpdump/api01rv2_patientgetv2/response.http`。`http_live_20251113T131848Z.log` / `http_404405_extract_20251113T131848Z.log` にも `Auth Error:401` が残り、Basic ヘッダー無しの挙動は再現済み。
- **正しいクレデンシャル付き** — `docker/orca/jma-receipt-docker/docker-compose.yml` で `ORMASTER_PASS=change_me` を指定しているため、`curl -u ormaster:change_me ...` では `HTTP 404 Not Found`（route 未定義だが Basic 認証は突破）となる。証跡: `httpdump/api01rv2_patientgetv2_basic/response.http` と `http_live_20251113T131848Z.log:390`。従来 401 だった原因は `ormaster:ormaster` を使っていた誤設定であることを確認した。

### 設定案（receipt_route.ini / online.env / jma-receipt.env）

| ファイル | 現状確認 | 対応案 / 運用方針 |
| --- | --- | --- |
| `/opt/jma/weborca/app/etc/receipt_route.ini` | コンテナ現物はテンプレ（`docker/orca/jma-receipt-docker/example/receipt_route.ini`）と diff 0。`[api01rv2]` には `ENABLE=1` / `ALLOW_METHODS=OPTIONS,GET,POST` / `UPSTREAM_PATH=/api01rv2` を保持。 | 追加変更は不要。Basic ヘッダーは既に透過するため、IP 制限が必要になった場合のみ `ALLOW_IP` を追記し、`docker cp`→`chmod 640`→`docker restart jma-receipt-docker-for-ubuntu-2204-orca-1` で再読み込みする。コンテナ再作成（`docker compose down/up`）は不要。 |
| `/opt/jma/weborca/releases/receipt/20251028-1/etc/online.env` | HTTP/DB 設定のみで Basic 用のメモが無く、運用手順書だけを頼りにすると `ormaster:ormaster` を使ってしまう。証跡: `artifacts/orca-connectivity/20251113T022010Z/config_dumps/online.env`。 | API 有効化フラグは依然不明なため、まずは `API_BASIC_USER=ormaster` / `API_BASIC_PASS=change_me` をコメントとして追記し、Handbook からも参照できるようにする（Runbook §4.5 にもリンク）。ORCA サポートから `API_ENABLE_*` 情報が降りたら、本ファイルに正式キーを追記して `docker restart orca` で反映する。 |
| `/opt/jma/weborca/app/etc/jma-receipt.env` | `LOGDIR=/opt/jma/weborca/log` のみが HTTP 解析に関係。`error.log` というファイル自体は存在しない。証跡: `config_dumps/jma-receipt.env`。 | `LOGDIR` を維持しつつ、`orca_http.log` から panic stack を採取する運用に切り替える。必要に応じ `export API_BASIC_USER`/`API_BASIC_PASS_FILE` をここにもコメントで残し、`env | grep 'API'` で未定義なら即座に気付けるようにする。こちらも再起動は `docker restart orca` で完了。 |

> **補足**: `online.env`/`jma-receipt.env` に追記する `API_BASIC_*` は現時点ではメモ扱い。公式の `API_ENABLE_*` / `receipt_route.*` 手順が開示されたら、Runbook §4.5 Step3（サポート問い合わせ）から本表を更新する。

### RUN_ID=`20251122TorcaHttpLogZ1` 証跡セット
- `logs/http_live_20251113T131848Z.log` — tail 400 行に UTC タイムスタンプを付与。`Auth Error:401`（Basic 無し）と `System Error:404`（Basic あり）の両方を一つのファイルで比較できる。  
- `logs/http_404405_extract_20251113T131848Z.log` — 上記から `401/404/405` 該当行のみ抽出。  
- `logs/docker_orca_since_20251113T131848Z.log` — `docker logs --since 20m`。`System Error:404` と `panics` のタイムラインを host 側と突き合わせ可。  
- `logs/host_orca_log_dir_20251113T131848Z.txt` / `logs/orca_http_symlink_20251113T131848Z.txt` — tail 元ディレクトリとシンボリック構成を再取得。  
- `httpdump/api01rv2_patientgetv2{,_basic}/` — 401 と 404 の HTTP ヘッダー／本文を保存。  
- `logs/app_log_dir_listing.txt` / `logs/error_log_search.txt` — `/opt/jma/weborca/app/log` が存在しないこと、および `error.log` というファイルがツリー内に見当たらないことの証跡。

### Echo panic エラー詳細
- `orca_http.log` から Go Echo の panic を切り出し `logs/echo_panic_stacktrace.txt` として保存。`session.XML2Map` → `web.apiFunc` → `web.API01rv2Post` → `Echo.BasicAuthWithConfig` というスタックで `runtime error: index out of range [-1]` が発生している。  
- `/opt/jma/weborca/app/log/error.log` というファイルは存在せず、`logdir` 配下の `orca_http.log` にしかスタックが残らない。次回も `LOGDIR` を基準に panic 解析する。  
- `PHASE2_PROGRESS.md` の ORCA 節にも本 panic 解析結果と RUN_ID を追記済み（参照: 同ファイルの 2025-11-13 セクション）。
