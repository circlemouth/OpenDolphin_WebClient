# ORCA API フィールド検証メモ（W13）

## 0. 運用前提（2025-11-14 更新）
- ORCA 連携検証は WebORCA 本番（`https://weborca.cloud.orcamo.jp:443`）のみを対象とし、ローカル WebORCA コンテナやデータ挿入は実施しない。
- `assets/seeds/*.sql` や本メモで言及する「seed」は **過去に想定したデータ条件の記録** であり、現在は参照専用。データが欠落している場合は Runbook `ORCA_CONNECTIVITY_VALIDATION.md` §4.3 の手順で欠落報告を残し、Ops/マネージャーへ共有する。
- API 別のテンプレやコード表は現状のレスポンスを理解するために保持し、既存データで再現できない項目は Evidence として記録するだけに留める。

## 1. 背景
- 指示 W13「不確定フィールド API の仕様突合」に基づき、推測ベースで作成していたテンプレート（`docs/server-modernization/phase2/operations/assets/orca-api-requests/*.json`）を公式仕様で裏付ける。
- 対象 API: `/orca31/hspmmv2`, `/api01rv2/system01dailyv2`, `/api21/medicalmodv23`, `/orca06/patientmemomodv2`。
- 根拠資料は ORCA Project 公式 API ページのみを使用し、各項目の Content-Type / ルート要素 / 必須フィールド / class または Request_Number の定義を確認した。

## 2. 差分一覧
| API | 公式仕様（要素/Content-Type/class） | 既存テンプレ状況 | 差分・TODO |
| --- | --- | --- | --- |
| `/orca31/hspmmv2` 入院会計未作成チェック | POST `Content-Type: application/xml`、ルート `<hspmmv2req>`、要素は `Patient_ID`（任意）と `Perform_Month`（YYYY-MM 指定月）。参照: [ORCA Project: hspmmv2](https://www.orca.med.or.jp/receipt/tec/api/hspmm.html) | `39_hspmmv2_request.json` は `Content-Type: application/json; charset=Shift_JIS` とし、JSON ルート `hspmmreq` に `Request_Number`/`Base_Date`/`Ward_Number` を送信している | **W19 2025-11-13 実機:** ORCA 20251024-1 では `/orca31/hspmmv2` が `Allow: OPTIONS, GET` しか返さず、POST は常に 405（GET でも 404）。`Perform_Month` 付き XML を送信してもルーター層で拒否されるため、環境設定の見直しが必要。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/39_hspmmv2_response.txt`。テンプレは XML 構造（`hspmmv2req` + `Perform_Month`/`Patient_ID`）へ更新済みだが、通信テストは保留。 |
| `/api01rv2/system01dailyv2` 基本情報取得 | POST `Content-Type: application/xml`、ルート `<system01_dailyreq>` の `Request_Number`（01 固定）と `Base_Date`（取得対象日）。参照: [system01dailyv2](https://www.orca.med.or.jp/receipt/tec/api/system01dailyv2.html) | `44_system01dailyv2_request.json` は JSON ルート `system01dailyreq`（アンダースコア欠落）、`Target_Date` を送信している | **W19 実機:** UTF-8 XML (`<data><system01_dailyreq>...`) で POST すると `Api_Result=00` で成功。Shift_JIS 送信は `Request_Number` 欠落扱いになるため UTF-8 固定とする。レスポンスには `Patient_Information`, `Medical_Set0x` 等が含まれる。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/44_system01dailyv2_response.txt`。テンプレとコメントを XML/UTF-8 前提へ更新済み。 |
| `/api21/medicalmodv23` 初診算定日登録 | POST `Content-Type: application/xml`、ルート `<medicalv2req3>`（ORCA OQS bean）。`Request_Number`、`Patient_ID`、`Department_Code`、`First_Calculation_Date`、`LastVisit_Date` が必須。参照: [medicalmodv23](https://www.orca.med.or.jp/receipt/tec/api/medicalmodv23.html) | `46_medicalmodv23_request.json` は JSON Body で `Request_Number` が欠落し、`Medical_Class_Code` を `Medical_Class` と誤記。Content-Type も JSON 指定 | **W19 実機:** `/api21/medicalmodv23` も `Allow: OPTIONS, GET` となり、POST すると 405。`class=01` 付きでも同様。現状モジュール側で POST が無効化されているため、WebORCA 設定 or ルーティングの復旧が必要。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/46_medicalmodv23_response.txt`。テンプレは XML（`medicalv2req3`）へ揃えたうえで TODO 継続。 |
| `/orca06/patientmemomodv2` 患者メモ登録/更新/削除 | POST `Content-Type: application/xml`、ルート `<patientmemomodv2req>`。`Request_Number`、`Patient_ID`、`Department_Code`、`Memo_Mode`、`Memo_Title`、`Memo_Text` が定義済み。参照: [patientmemomodv2](https://www.orca.med.or.jp/receipt/tec/api/patientmemomodv2.html) | `53_patientmemomodv2_request.json` は JSON Body で `Request_Number` が無く、Content-Type も JSON を指定 | **W19 実機:** `/orca06/patientmemomodv2` も 405（Allow: GET）。XML/JSON いずれの POST も拒否されるため、ORCA 側の API 有効化が必要。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/53_patientmemomodv2_response.txt`。テンプレは `patientmemomodv2req` ベースへ修正し TODO 継続。 |
| `/api/orca12/patientmodv2` 患者登録 | POST `Content-Type: application/xml; charset=UTF-8`、ルート `<data><patientmodreq>`。`Request_Number` と `Perform_Mode`（ともに `01`）を先頭に置き、`Mod_Key=patient-create`、`Patient_ID`（空で自動採番／数値指定で直接採番）、住所・保険情報をネストした公式サンプルを使用する。 | `14_patientmodv2_request.xml` は UTF-8 `<data><patientmodreq>` で必須 3 項目を冒頭に配置し、`Patient_ID` コメントに ORCBPTNUMCHG=1（7桁固定）の桁数ルールを明記。先頭の `orca-meta` で `path=/orca12/patientmodv2` / `query=class=01` / `Content-Type: application/xml; charset=UTF-8` を宣言し、`orca-curl-snippets` から `--data-binary` で呼び出せる。 | **2025-11-14 WebORCA クラウド:** 本番データ保護の観点から書き込み API は実行前にマネージャー承認が必要。手順上は `curl --cert-type P12 --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" -H 'Content-Type: application/xml; charset=UTF-8' --data-binary @14_patientmodv2_request.xml 'https://weborca.cloud.orcamo.jp/api/orca12/patientmodv2?class=01'` を用いる。患者番号桁数は `RUN_ID=20251113TorcaPatientDigitsZ1` の `tbl_syskanri (kbncd=1065)` ダンプより **7桁 + 追加1桁 = 8桁** が現行条件と確定（Evidence: `artifacts/orca-connectivity/20251113T054336Z/patient_id_rules/tbl_syskanri.txt`）。 |

## 3. 次アクション
1. 4 つのテンプレート JSON を XML 実リクエストへ差し替える（`ops/tools/send_parallel_request.sh` 等の送信ロジックが JSON 前提になっていないか要確認）。
2. `/server-modernized` 側でこれら API を呼び出す DTO / Serializer のフィールド名を照合し、`Perform_Month` や `Medical_Class_Code` など不足フィールドを追加する。
3. Runbook・テスト資産: `ORCA_CONNECTIVITY_VALIDATION.md` の該当行に「暫定テンプレ」の注記を残し、本 TODO が解消されたら備考から当メモへのリンクを削除する。

## 4. W19（2025-11-13 UTC 00:28Z）実機キャプチャ結果

- 共通: `curl --cert-type P12 --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" -H 'Content-Type: application/xml; charset=UTF-8' -X POST --data-binary @docs/server-modernization/phase2/operations/assets/orca-api-requests/44_system01dailyv2_request.xml 'https://weborca.cloud.orcamo.jp/api/api01rv2/system01dailyv2?class=00'` を実行した場合のみ HTTP 200 (`Api_Result=00`) となる。Shift_JIS 送信では `Api_Result=91`。Evidence: `artifacts/orca-connectivity/20251113TorcaProdCertZ1/weborca-prod/system01dailyv2.json`。
- `/orca31/hspmmv2`: POST は 405 `Allow: OPTIONS, GET`、GET は 404。WebORCA 20251024-1 側で POST ルートが無効化されており、`Perform_Month` 指定の XML でもルーターで拒否される。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/39_hspmmv2_response.txt`。
- `/api21/medicalmodv23`: `?class=01` 付き POST でも 405。JSON・XML すべて同結果。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/46_medicalmodv23_response.txt`。`OpenDolphin-ORCA-OQS` の `Xml_medicalv2req3` と実装が乖離している可能性あり。
- `/orca06/patientmemomodv2`: POST 405（Allow: GET）。JSON／XML いずれも同じ。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/53_patientmemomodv2_response.txt`。

→ `/orca31` / `/api21` / `/orca06` 系の POST が全滅しているため、WebORCA コンテナの API 設定（`weborca.ini` / `go-echo` ルーティング）見直し or 既知不具合確認が必要。少なくとも `/api01rv2/*` は POST を受け付けることを確認済み。

## 5. `/api01rv2/system01dailyv2` シフトJIS/UTF-8 切替 Runbook（W27）

W19（2025-11-13 UTC 00:28Z）で `Api_Result=00`（UTF-8）と `Api_Result=91`（Shift_JIS）を再現した結果を Runbook 化し、次回以降は下表の手順で再検証する。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/44_system01dailyv2_response.txt`。

| モード | 切り替え手順 | リクエスト例 | 結果 / 備考 |
| --- | --- | --- | --- |
| UTF-8 正常系 | 1. `node scripts/tools/orca-curl-snippets.js --dry-run | rg 44_system01dailyv2` でテンプレ確認<br>2. `curl --cert-type P12 --cert "${ORCA_PROD_CERT}:${ORCA_PROD_CERT_PASS}" -u "${ORCA_PROD_BASIC_USER}:${ORCA_PROD_BASIC_KEY}" -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' --data-binary @docs/server-modernization/phase2/operations/assets/orca-api-requests/44_system01dailyv2_request.xml 'https://weborca.cloud.orcamo.jp/api/api01rv2/system01dailyv2?class=00'` を実行 | ボディ例: `<data><system01_dailyreq><Request_Number>01</Request_Number><Base_Date>2025-11-12</Base_Date></system01_dailyreq></data>` | `Api_Result=00` / `Reskey=/api01rv2/system01dailyv2`。`Request_Number` と `Base_Date` がそのまま反映され、`Patient_Information` 等が返る。Evidence: `artifacts/orca-connectivity/20251113TorcaProdCertZ1/weborca-prod/system01dailyv2.json` |
| Shift_JIS 異常系（再現用） | 1. 上記テンプレファイルを `tmp/system01dailyv2_request_shiftjis.xml` へコピー<br>2. `iconv -f UTF-8 -t SHIFT_JIS tmp/system01dailyv2_request_shiftjis.xml > tmp/system01dailyv2_request_shiftjis_sjis.xml` で変換<br>3. `curl ... -H 'Content-Type: application/xml; charset=Shift_JIS' --data-binary @tmp/system01dailyv2_request_shiftjis_sjis.xml` を実行 | 同一の XML 構造だが Shift_JIS 化されたファイルを送信。`curl` の HTTP Header も `charset=Shift_JIS` へ変更する。 | `Api_Result=91`（`Error_Message=Request_Number` 欠落扱い）となり、ORCA 側が XML のラベルを解釈できない。Evidence: `.../44_system01dailyv2_response.txt` の NG ログ。|

> 注意: `orca-curl-snippets` は `headers.Content-Type` が未設定の場合 `application/json; charset=Shift_JIS` を補完するため、本 API のテンプレートでは必ず `application/xml; charset=UTF-8` を明示する。Runbook §5（ORCA_CONNECTIVITY_VALIDATION.md）でも「UTF-8 XML 必須／Shift_JIS→Api_Result=91」と記載し、テンプレとの差分が出ないよう同期する。

## 6. API 有効化調査（W29）

- **システム管理サイトでの API 資格情報再発行**
  - 設定キー: API キー、ベンダー証明書（`clientXXXX.crt`/`clientXXXX.pem`）、接続 URL（`app.weborca.orcamo.jp` / `app.demo.weborca.orcamo.jp`）
  - 想定ファイル: システム管理サイト「API キーの確認」画面、および同サイトからダウンロードする `root.crt`・クライアント証明書 ZIP
  - 出典: [別紙-システム管理サイトアクセス手順書（2023-10-27）](https://ftp.orca.med.or.jp/pub/data/weborca/systemkanrisiteaccess-20231027.pdf)
  - メモ: API キーはここでしか確認・再発行できず、鍵を更新すると旧キーは即時失効。405 エラーが続く場合はテナント証明書の期限と API キーの再発行履歴を照合する。

- **push-exchanger（PUSH/帳票 API）設定**
  - 設定キー: `:ws_server`, `:api_user`, `:api_key`, `:api_server`, `:api_port`, `:use_ssl`, `:ca_cert`, `:cert`, `:cert_key`, `:passphrase`, `:use_weborca`, `:plugin_load_path`
  - 想定ファイル: `C:/Program Files (x86)/push-exchanger/config.yml`
  - 出典: [WebORCA push-exchanger設定サンプル（2022-03-10）](https://ftp.orca.med.or.jp/pub/data/weborca/weborca-pushexchangersettingsample-20220309.pdf)
  - メモ: `:use_weborca: true` と `:api_server=weborca.cloud.orcamo.jp` をセットしないと WebORCA 側ルートが閉じたままになる。証明書パス／パスフレーズを誤ると 405/401 の切替点がわからなくなるため、最初に `root.crt` の再取得と TLS ハンドシェイク確認を行う。

- **オンライン資格関連（onshi-shell / receiver）設定**
  - 設定キー: `:api_user`, `:api_key`（空欄可）, `:api_server`, `:api_port`, `:use_ssl`, `:ca_cert`, `:cert`, `:cert_key`, `:passphrase`, `:log_file`, `:req_dir`, `:ref_dir`, `:xml_log_dir`, `:use_weborca`
  - 想定ファイル: `C:/Program Files (x86)/Onshi/` 配下の `push-exchanger config.yml`, `onshi-shell.yml`, `onshi-receiver.yml`
  - 出典: [WebORCA オンライン資格関連設定ファイルサンプル（2022-09-08）](https://ftp.orca.med.or.jp/pub/data/weborca/weborca-onshisettingsample-20220908.pdf)
  - メモ: API キー空欄でも接続できる点・UNC パスを `req_dir`/`res_dir` に指定する点が記載されている。`use_weborca` を `true` にし忘れると ORCA 本番 API（ginbee）へ誤接続し、`Allow: GET` しか返さないケースがある。

- **CLAIM Receiver（`/api/api21/claimreceivev2`）設定**
  - 設定キー: `:api_path=/api/api21/claimreceivev2`, `:api_user`, `:api_key`, `:api_server`, `:api_port`, `:use_ssl`, `:ca_cert`, `:cert`, `:cert_key`, `:passphrase`
  - 想定ファイル: `C:/Program Files (x86)/claim-receiver/config.yml`
  - 出典: [WebORCA CLAIM Receiver利用手順（2022-01-14 更新）](https://ftp.orca.med.or.jp/pub/data/weborca/weborca-claimreciver-20220115.pdf)
  - メモ: ドキュメントでは `:api_path` に `/api/api21/...` と `/api` プレフィックスを明示しており、ルータ側で `/api21` にリバースプロキシすると 405 になる可能性がある。405 調査時は POST 先 URL の正規化も確認する。

- **ハイブリッド運用時のモード確認**
  - 設定キー: レスポンスヘッダー `X-Hybridmode`（`normal`/`emergency`/`recovery` 系列）
  - 想定ファイル: Hybird クライアント `hybridweborca`（`hybridweborca_operationmanual` 手順書）、API 呼び出しレスポンス
  - 出典: [ハイブリッドサービスWebORCA運用手順書（2024-06-26）](https://ftp.orca.med.or.jp/pub/data/hybrid/hybridserviceweborca-operationmanual-20240626-1.pdf)
  - メモ: API の返却ヘッダーで動作モードを確認できるため、405 時は Hybrid 応急措置モードに落ちていないか `X-Hybridmode` を必ず記録する。

#### W39 公式資料レビュー結果（2025-11-13 追加）

| 資料 (発行日) | ページ | 記載内容の抜粋・要約 | `API_ENABLE_*` / `receipt_route.ini` 言及 |
| --- | --- | --- | --- |
| 別紙: システム管理サイトアクセス手順書 (2023-10-27) | p.1 | WebORCA 管理画面の機能として「API キーの確認」「カスタムクラウド」等のみが列挙され、証明書ログインや DB インポート手順を説明。citeturn1view0 | なし（API キー再発行手順のみで `API_ENABLE_*`・`receipt_route.ini` には触れない） |
| WebORCA push-exchanger設定サンプル (2022-03-10) | p.1 | `config.yml` の `:api_server`, `:api_port`, `:use_ssl`, `:use_weborca` を具体値で示し、証明書パス指定と API キー設定のみを案内。citeturn2view0 | なし（記載されているのは push-exchanger の YAML キーに限られる） |
| WebORCA オンライン資格関連設定ファイルサンプル (2022-09-08) | p.1 | push-exchanger / onshi-shell 設定例として `:api_user`, `:api_server`, `:use_weborca` を提示し、API キー空欄でも動作する旨を説明。citeturn4view0 | なし（オンライン資格モジュールの YAML のみが対象） |
| WebORCA CLAIM Receiver 利用手順 (2022-01-14 更新) | p.5 | `config.yml` に `:api_path: /api/api21/claimreceivev2` を含める必要性と `/api` プレフィックス追加を明記し、証明書パスを列挙。citeturn5view0 | なし（`api_path` の構成のみで ENABLE 系設定は未掲載） |
| ハイブリッドサービス WebORCA 運用手順書 (2024-06-26) | p.17 | 応急・復旧モード判定のためレスポンスヘッダー `X-Hybridmode` を記録する手順を案内。citeturn6find0 | なし（動作モード監視のみで `receipt_route.ini` 編集は触れられず） |

→ 公開 PDF / リリースノートでは API キー・証明書・`config.yml` の再設定や `X-Hybridmode` 監視までしか触れておらず、`API_ENABLE_*` や `receipt_route.ini` の有効化フローは掲載されていない。405 解消時は本表で参照した資料名・ページを Evidence に貼り、未掲載である旨を明記したうえで WebORCA サポート（`weborca-support@orcamo.jp` / 050-5491-7453）へ仕様公開可否を問い合わせる。citeturn7view0

> 補足: 上記いずれの公式資料にも `API_ENABLE_*` や `receipt_route.ini` の直接編集手順は記載されていない。現状は API キー／証明書／接続先 URL の整合性のみが公開情報であり、405 解消には ORCA 開発ラインから WebORCA ルータ再ビルド手順を取り寄せる必要がある。

## 3. 入院・保険・会計 API（No.19-38）

以下は `orca-api-matrix` No.19-38（および `hspmmv2`）に対応する公式仕様の必須項目・class 条件と、`assets/orca-api-requests/*.json` の現状差分、RUN_ID 追跡状況である。`/orcaXX/` 系エンドポイントは既存 405 事象と同様に POST ルートが封鎖されているため、`logs/ORCA_HTTP_404405_HANDBOOK.md` に沿った証跡取得を次アクションに設定した。

> **2025-11-14（RUN_ID=`20251114TorcaInpatientMatrixZ1`）:** `assets/seeds/api21_medical_seed.sql` に加え、病棟/食事/ADL/ユーザー権限の seed 候補を `operations/assets/seeds/inpatient_master_seed_20251114.md` へ整理し、`artifacts/orca-connectivity/20251114TorcaInpatientMatrixZ1/README.md` に実行メモを残した。`ORCAcertification/103867__JP_u00001294_client3948.p12` のパスフレーズが不明なため `curl --cert-type P12` を開始できず、19-38 全 API は未送信。パス受領後に本 RUN_ID で再開し、`request/response/headers` を個別 API のディレクトリへ保存する。
>
> **2025-11-22（RUN 試行）:** `ORCAcertification/新規 テキスト ドキュメント.txt` に記載された `APIキー:1acdf9...a9ab` を PKCS#12 パスとみなして `openssl pkcs12 -passin pass:1acdf9...a9ab` および `curl --cert-type P12 --cert "...:1acdf9...a9ab"` を実行したが、すべて `Mac verify error: invalid password?` で TLS 事前検証時に失敗。HTTP リクエスト自体が送出されないため、`artifacts/orca-connectivity/20251122TorcaInpatient19-38...` ディレクトリには `response.headers`/`response.xml` を生成できなかった。実行を継続するには正式な PKCS#12 パスの取得が必要。

### No.19 `/api01rv2/hsconfbasev2`（入院基本情報）
- **公式仕様:** `raw/hospbase.md`。UTF-8 XML2 `<data><private_objects>` に `Base_Date`（YYYY-MM-DD）を 1 項目だけ送信し、未指定ならシステム日付で 5000 医療機関情報ー入院基本を返す。
- **テンプレ現状:** `19_hsconfbasev2_request.json` は JSON + Shift_JIS で `Content-Type: application/json` を維持したまま。XML2 ルートと `orca-meta` が無く、Base_Date の日付型検証も未実装。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。`Base_Date` を facility seed 日に合わせた UTF-8 XML（`<data><private_objects>`）へ置き換え、`/tmp/hsconfbasev2.xml` を `curl --cert-type P12` で送信して RUN_ID を採番する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/19_hsconfbasev2_request.xml`（UTF-8）を使用。`Base_Date` は `tbl_syskanri` の施設開始日と一致させ、証跡は `artifacts/orca-connectivity/<RUN_ID>/inpatient/19_hsconfbasev2/` へ保存する。Base 情報そのものは `assets/orca-tec-index/raw/index.md` でリンクされる「入院基本設計書（orca_hsp_spc_010.pdf）」に従い ORCA UI／SQL で登録する。

### No.20 `/api01rv2/hsconfwardv2`（病棟・病室マスタ）
- **公式仕様:** `raw/wardinfo.md`。`Request_Number`（1:病棟情報 / 2:病室情報）と `Base_Date` が必須。`Ward_Number`/`Room_Number` を指定しない場合は全件返却。
- **テンプレ現状:** `20_hsconfwardv2_request.json` は JSON で `Request_Number:"0001"` など独自値を使用し、病棟/病室条件が文字列のまま。XML2 と `Request_Number=1|2` の遵守が必要。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。`Request_Number=1`（病棟）/`2`（病室）の 2 パターンを XML UTF-8 で整備し、病棟 seed を投入後にレスポンス整合を記録する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/20_hsconfwardv2_request.xml` で `Request_Number=1`（病棟一覧）を再現。`Ward_Number=03A` / `Room_Number=0311` は `assets/orca-tec-index/raw/index.md` 内リンクの「入院画面レイアウト（orca_hsp_scr_030.pdf）」手順、または ORCA UI の病棟マスタ画面で投入し、登録済みコードを `artifacts/orca-connectivity/<RUN_ID>/inpatient/20_hsconfwardv2/` に記録する。

### No.21 `/api01rv2/tmedicalgetv2`（中途終了患者一覧）
- **公式仕様:** `raw/medicaltemp.md`。ルート `<tmedicalgetreq>` に `Perform_Date`（未設定はシステム日）と `InOut`（1:入院、2:入院外）が必須。`Department_Code` と `Patient_ID` は任意で最大 500 件返却。
- **テンプレ現状:** `21_tmedicalgetv2_request.json` は JSON で `InOut:"I"` のアルファベットを送っており、値域（1/2）・XML2 形式・`Content-Type: application/xml` が満たされていない。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。`InOut=1/2` の 2 ケースを XML に直し、カルテ一覧比較手順（`docs/web-client/ux/ONE_SCREEN_LAYOUT_GUIDE.md`）と連動させてレスポンス検証を行う。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/21_tmedicalgetv2_request.xml` は `InOut=1`（入院）のテンプレ。`Patient_ID=000019` / `Department_Code=03` は `assets/seeds/api21_medical_seed.sql` の患者 seed を適用したうえで使用し、HTTP/レスポンスは `artifacts/orca-connectivity/<RUN_ID>/inpatient/21_tmedicalgetv2/` へ格納する。

### No.22 `/api01rv2/insprogetv2`（保険者一覧）
- **公式仕様:** `raw/insuranceinfo.md`。`<insprogetreq>` に `InsuranceProvider_Number` か `Insurance_Number` のどちらかを必須入力（両方指定時は保険者番号優先）。最大 2500 件返却。
- **テンプレ現状:** `22_insprogetv2_request.json` は JSON で両フィールドを常時指定し、XML2 ではない。値域チェックや 2500 件オーバー時のメッセージ確認が未整理。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。保険者番号のみ／保険番号のみの 2 パターンを XML UTF-8 で送信し、`InsuranceProvider_Number` が退避できることを RUN_ID 付きで記録する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/22_insprogetv2_request.xml` で `InsuranceProvider_Number=06123456` を照会。保険 seed は `assets/seeds/api21_medical_seed.sql` の `tbl_pthkninf` / `tbl_ptkohinf` へ合わせ、応答は `artifacts/orca-connectivity/<RUN_ID>/inpatient/22_insprogetv2/` へ保存する。

### No.23 `/api01rv2/hsmealv2`（入院食事情報）
- **公式仕様:** `raw/hospfood.md`。`Patient_ID`（必須）と `Perform_Month`（未設定はシステム月）を送信し、日毎の食事/室料差額/保険組合せを 1 ヶ月分返却。
- **テンプレ現状:** `23_hsmealv2_request.json` は JSON のまま。疾病や保険組合せの seed が無いためレスポンス検証が止まっている。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。入院患者番号と `Perform_Month` を合わせた XML を作成し、ベッド画面との突合観点を Runbook に追記する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/23_hsmealv2_request.xml` を `Perform_Month=YYYY-MM` で送信。患者/保険 seed は `assets/seeds/api21_medical_seed.sql` を流用し、食事区分は `raw/hospshokuji.md`（or [ORCA Project: hospshokuji](https://www.orca.med.or.jp/receipt/tec/api/hospshokuji.html)）のコード表で登録したものを指定する。レスポンス証跡は `artifacts/orca-connectivity/<RUN_ID>/inpatient/23_hsmealv2/`。

### No.24 `/api01rv2/hsptevalv2`（医療区分・ADL 点数取得）
- **公式仕様:** `raw/hospadlinfo.md`。`Patient_ID` 必須、`Perform_Month` 任意。入退院履歴・医療区分・ADL の日別配列が返る。
- **テンプレ現状:** `24_hsptevalv2_request.json` は JSON で `Perform_Month` のフォーマットチェックが無い。Runbook に ADL seed の想定値を記していない。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。ADL 登録が済んだ患者で XML を送信し、`hsptevalmodv2` との往復試験を計画する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/24_hsptevalv2_request.xml` を `Perform_Month=2025-11` で使用。ADL/医療区分 seed は `assets/orca-tec-index/raw/index.md` に記載された「入院基本設計書」 Appendix のコード表を参照し ORCA UI で投入し、結果は `artifacts/orca-connectivity/<RUN_ID>/inpatient/24_hsptevalv2/` へまとめる。

### No.25 `/api01rv2/hsptinfv2`（入院患者基本情報取得）
- **公式仕様:** `raw/hosppatientinfo.md`。`Patient_ID` 必須、`Admission_Date` 未設定時はシステム日。最大 100 件の入院歴を新しい順で返す。
- **テンプレ現状:** `25_hsptinfv2_request.json` は JSON のみで入院日フォーマット検証も無し。室料差額や担当医コードの突合観点が未記載。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。転棟や他院歴を含む患者で XML 取得を行い、`Ward_Number`/`Room_Number` が `hsconfwardv2` と一致するかを Runbook に残す。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/25_hsptinfv2_request.xml` に患者 `000019` と `Admission_Date=2025-10-20` を設定。患者/保険 seed は `assets/seeds/api21_medical_seed.sql` の `tbl_ptinf`/`tbl_ptnum` を利用し、病棟コードは `hsconfwardv2` で投入した値に合わせる。応答ログは `artifacts/orca-connectivity/<RUN_ID>/inpatient/25_hsptinfv2/` へ。

### No.26 `/api01rv2/hsacsimulatev2`（退院時仮計算）
- **公式仕様:** `raw/hsacsimulate.md`。`Patient_ID` 必須、`Discharge_Date` 未設定ならシステム日。請求期間ごとの点数・負担額・食事・自費額を返す。
- **テンプレ現状:** `26_hsacsimulatev2_request.json` は JSON。退院日前後 2 ヶ月制限や保険組合せ別の結果確認を Runbook に書けていない。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。`Discharge_Date` を入院実績に合わせた XML で送信し、`hsacctmodv2` の会計作成結果と比較する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/26_hsacsimulatev2_request.xml` は `Discharge_Date=2025-11-15` の仮計算。患者/保険 seed は `assets/seeds/api21_medical_seed.sql` を使用し、点数・食事設定は `raw/hsacsimulate.md` のコード表を ORCA UI へ登録してから `artifacts/orca-connectivity/<RUN_ID>/inpatient/26_hsacsimulatev2/` に証跡化する。

### No.27 `/api01rv2/incomeinfv2`（収納情報）
- **公式仕様:** `raw/shunou.md`。`Patient_ID` と基準指定（`Perform_Month` または `Perform_Year`）を送る。日次・月次・年次単位で収納履歴および未収明細を返却。
- **テンプレ現状:** `27_incomeinfv2_request.json` は `Perform_Date`/`Perform_Month`/`Perform_Year` を全部送っており仕様と齟齬。XML化も未対応。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。月次パターン（`Perform_Month`）と年次パターン（`Perform_Year`）を切り替えて XML 投稿し、会計 UI と金額突合を行う。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/27_incomeinfv2_request.xml` は月次指定のみを送るテンプレ。収納 seed は `assets/orca-tec-index/raw/index.md` にリンクされる「収納登録（orca_bd_rct_060.pdf）」のコード表、または ORCA UI で現金収納を登録してから `artifacts/orca-connectivity/<RUN_ID>/inpatient/27_incomeinfv2/` へ保存する。

### No.28 `/api01rv2/systeminfv2`（システム情報）
- **公式仕様:** `raw/systemstate.md`。`Request_Date` と `Request_Time` で基準時刻を指定し、30 分以上ずれるとエラー。戻り値は DB/マスタ/プログラム更新情報。
- **テンプレ現状:** `28_systeminfv2_request.json` は JSON。`Request_Time` の 30 分ルールを Runbook で共有できていない。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。`ServerInfoResource` の時刻と合わせた XML を送信し、Legacy/Modernized 間の差分を記録する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/28_systeminfv2_request.xml` を `ServerInfoResource` 取得直後（±30 分以内の `Request_Date/Time`）で送信。結果は `artifacts/orca-connectivity/<RUN_ID>/inpatient/28_systeminfv2/` に保存し、`ServerInfoResource` ログと突合する。

### No.29 `/orca31/hsptinfmodv2`（入退院登録）
- **公式仕様:** `raw/hospido.md`。`Request_Number=08`（転科転棟転室）または `09`（異動取消）を必須にし、`Patient_ID`、`Admission_Date`、`Update_Date`、`Ward_Number`、`Room_Number`、`Department_Code` などを XML で送る。
- **テンプレ現状:** `29_hsptinfmodv2_request.json` は JSON で `Request_Number:"ADM-0001"` や `Room_Number:"0311"` のように仕様外の値を使用し、`Additional_Hospital_Charge` もコードではなく任意文字列。POST 405 の証跡も未取得。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。公式コードに合わせた XML を作成し、`logs/ORCA_HTTP_404405_HANDBOOK.md` 手順で 405 証跡→サポート問い合わせ用のテンプレを整備する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/29_hsptinfmodv2_request.xml` は入院登録（仮）を想定。`Doctor_Code` や保険 seed は `assets/seeds/api21_medical_seed.sql` と同一患者を流用し、病棟/室料コードは `hsconfwardv2` で登録した ID を使う。405 取得時も `artifacts/orca-connectivity/<RUN_ID>/inpatient/29_hsptinfmodv2/` に `request.http`/`response.http` を残す。

### No.30・38・40 `/orca31/hsacctmodv2`（外泊/食事/室料差額/入院会計作成）
- **公式仕様:** `raw/hospgaihaku.md`（Request_Number=2 外泊）、`raw/hospshokuji.md`（Request_Number=4 食事）、`raw/hospsagaku.md`（Request_Number=3 室料差額）、`raw/hosp_kaikeimod.md`（Request_Number=9 入院会計作成）。`Patient_Status` や `Meal_Time/Meal_Type`、`Room_Charge` はコードで指定する。
- **テンプレ現状:** `30_*`/`38_*`/`40_*` JSON テンプレは `Request_Number:"MEAL-..."` 等の独自値を入れており、`Meal_Time`/`Patient_Status` も文字列（"dinner","外泊"）で仕様を外れている。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。用途毎に XML へ変換し、`/orca31` POST 405 を `ORCA_HTTP_404405` テンプレで採取する。用途の違いは `orca-api-matrix` の備考で整理する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/30_hsacctmodv2_meal_request.xml`（Request_Number=食事）と `xml/38_hsacctmodv2_create_request.xml`（会計作成）を維持。食事/外泊区分コードは `raw/hospshokuji.md` の `Meal_Time`/`Meal_Type` 一覧を参照し、患者 seed は `api21_medical_seed.sql` を使う。405 証跡・エラー応答を `artifacts/orca-connectivity/<RUN_ID>/inpatient/30_hsacctmodv2/` / `38_hsacctmodv2/` に格納する。

### No.31 `/orca32/hsptevalmodv2`（医療区分登録）
- **公式仕様:** `raw/hospadlentry.md`。`Save_Request`、`Patient_ID`、`Admission_Date`、`Perform_Date` と医療区分 (`Medical_Condition`)／ADL (`ADL_Score`) 配列が必須。日別評価は 31 日分の CSV 形式。
- **テンプレ現状:** `31_hsptevalmodv2_request.json` は JSON で Evaluation 値のみ。`Evaluation_Daily` の日別 CSV も未記載。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。`hsptevalv2` で取得した最新値を XML に落とし込み、`/orca32` POST 405 の証跡と併せて ORCA へルート公開を依頼する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/31_hsptevalmodv2_request.xml` を `Medical_Condition`/`ADL_Score` CSV 付きで利用。値は `hsptevalv2` 応答に合わせ、患者 seed は `api21_medical_seed.sql` の `Patient_ID=000019` を流用。405 応答は `artifacts/orca-connectivity/<RUN_ID>/inpatient/31_hsptevalmodv2/` で保管する。

### No.32 `/orca101/manageusersv2`（ユーザー管理）
- **公式仕様:** `raw/userkanri.md`。`Request_Number` は 01:一覧、02:登録、03:変更、04:削除。登録/変更時はユーザー情報（`User_Id`、`Full_Name`、権限など）を XML で定義する。
- **テンプレ現状:** `32_manageusersv2_request.json` は JSON かつ `Request_Number:"USR-0007"` と仕様外。`Menu_Item_Information` も文字列権限（"read"/"write"）で code 体系に合わない。405 証跡も未取得。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。ユーザー一覧（01）と登録（02）の XML テンプレを作り、`/orca101` POST 405 をログ化→管理者 seed 状況を `DOC_STATUS.md` で追跡する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/32_manageusersv2_request.xml`（Request_Number=02）を利用し、`Menu_Item_Number` などは `raw/userkanri.md` のコード表で補完する。証跡は `artifacts/orca-connectivity/<RUN_ID>/inpatient/32_manageusersv2/` へ保存し、ユーザー seed は `assets/orca-tec-index/raw/index.md` でリンクされる「患者登録」/「ユーザー管理」資料に従い ORCA UI で投入する。

### No.33 `/orca21/medicalsetv2`（診療セット登録）
- **公式仕様:** `raw/setcode.md`。`Request_Number` 01:新規, 02:削除, 03:終了日更新, 04:セット内容取得。`Set_Code`/`Set_Code_Name`/`Start_Date`/`Ende_Date`/`Medical_Info` を送る。
- **テンプレ現状:** `33_medicalsetv2_request.json` は JSON で `Request_Number:"SET-CLINIC-01"` 等の独自値。`Medication_Info` も JSON のまま。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。`ModuleListConverter` と突合できるよう XML に変換し、`/orca21` POST 405 を採取する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/33_medicalsetv2_request.xml`（Request_Number=01）を使用。`Medical_Class`・`Medication_Code` は `raw/setcode.md` / `assets/orca-tec-index/raw/index.md` の診療行為資料を参照し、405 応答を `artifacts/orca-connectivity/<RUN_ID>/inpatient/33_medicalsetv2/` に残す。

### No.34 `/orca31/birthdeliveryv2`（出産育児一時金）
- **公式仕様:** `raw/childbirth.md`。`Request_Number=01` は照会、`02` は登録。`Direct_Payment`、`Submission_Provider`（1/2）、`Delivery`（1/2）、`Gestation_Period_Passed` などコードを指定する。
- **テンプレ現状:** `34_birthdeliveryv2_request.json` は JSON で `Request_Number:"DELIV-0001"`、`Delivery:"正常分娩"` 等を送っており仕様値と乖離。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。照会/登録の 2 ステップを XML に起こし、`/orca31` POST 405 を `ORCA_HTTP_404405` 手順で取得する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/34_birthdeliveryv2_request.xml`（Request_Number=02）を使い、患者/保険 seed は `assets/seeds/api21_medical_seed.sql` の `Patient_ID=000020` を流用。入院費用・出産区分は `raw/childbirth.md` のコードで整備し、405 証跡を `artifacts/orca-connectivity/<RUN_ID>/inpatient/34_birthdeliveryv2/` に保管する。

### No.35 `/api01rv2/patientlst6v2`（全保険組合せ一覧）
- **公式仕様:** `raw/insurancecombi.md`。`Reqest_Number`（表記ゆれだが値は `01`）、`Patient_ID` が必須。`Base_Date`/`Start_Date`/`End_Date` は任意で 200 件まで返却。
- **テンプレ現状:** `35_patientlst6v2_request.json` は JSON で `Reqest_Number:"P6-0001"` と独自値を使用。200 件オーバー時の制御も未実装。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。XML 化と 200 件超えテストを行い、患者登録画面の保険タブとレスポンスを突合させる。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/35_patientlst6v2_request.xml` を `Reqest_Number=01` で利用し、患者/保険 seed は `api21_medical_seed.sql` の `tbl_ptnum` / `tbl_pthkninf` を適用。応答は `artifacts/orca-connectivity/<RUN_ID>/inpatient/35_patientlst6v2/` で保管する。

### No.36 `/orca22/diseasev2`（患者病名登録）
- **公式仕様:** `raw/diseasemod.md`。`Patient_ID`、`Perform_Date`、`Perform_Time`、`Diagnosis_Information/Department_Code` が必須。`Disease_Information` は `Disease_Single`/`Disease_Supplement`/`InOut`/`StartDate` 等をネストする。
- **テンプレ現状:** `36_diseasev2_request.json` は JSON で `Disease_Supplement` が `Label/Data` のみ、`Disease_Single` のコード/名称セットも欠落。405 証跡なし。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。ORCA 側 405 ルートのため XML へ直したうえで `ORCA_HTTP_404405` テンプレに沿った証跡を残し、スタンプ連携と整合させる。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/36_diseasev2_request.xml` で `Disease_Code=8830040` を送信。病名コード seed は `assets/orca-tec-index/raw/index.md` の「病名登録（orca_bd_nds_050.pdf）」や `raw/diseasemod.md` を参照し、405 証跡を `artifacts/orca-connectivity/<RUN_ID>/inpatient/36_diseasev2/` へ保存する。

### No.37 `/orca22/diseasev3`（患者病名登録2）
- **公式仕様:** `raw/diseasemod2.md`。`Base_Month` を追加要求し、補足コメント配列（`Disease_Supplement_Single`）や `Disease_AcuteFlag` など v3 特有の要素を扱う。
- **テンプレ現状:** `37_diseasev3_request.json` も JSON。`Disease_Supplement_Single` のコードや `Disease_Category` が仕様のコード体系と合っていない。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。`diseasev2` と同様 XML 化＋405 証跡→サポートエスカレーションを行い、v2/v3 の差分を Runbook に追記する。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/37_diseasev3_request.xml` で `Disease_Supplement_Name` など v3 専用項目を埋める。コード表は `raw/diseasemod2.md`、患者 seed は `api21_medical_seed.sql` を参照し、405 応答を `artifacts/orca-connectivity/<RUN_ID>/inpatient/37_diseasev3/` へ。

### No.38 `/orca31/hsacctmodv2`（入院会計作成）
- **公式仕様:** `raw/hosp_kaikeimod.md`。`Request_Number=9`、`Save_Request`、`Patient_ID`、`Admission_Date` を送るだけで診療年月の入院会計を生成。
- **テンプレ現状:** `38_hsacctmodv2_create_request.json` は JSON で `Request_Number:"ACCT-..."`、`End_Date/End_Month` 等仕様外の項目を追加している。
- **RUN_ID / 次アクション:** 未実測（`RUN_ID=20251114TorcaInpatientMatrixZ1` は証明書パス不明で `curl --cert-type P12` を開始できず未送信）。`Request_Number=9` の XML を用意し、`/orca31` POST 405 のログを取得→既存会計と突合する準備を進める。
- **XML/Seed:** `operations/assets/orca-api-requests/xml/38_hsacctmodv2_create_request.xml` を `Request_Number=9` 想定のテンプレとして使用。食事/室料 seed は `raw/hosp_kaikeimod.md` のコード、患者/保険 seed は `api21_medical_seed.sql` を参照し、405 証跡を `artifacts/orca-connectivity/<RUN_ID>/inpatient/38_hsacctmodv2/` に保存する。

### No.39 `/orca31/hspmmv2`（入院会計未作成チェック）
- **備考:** §2 の表にある通り `RUN_ID=20251113TorcaHttpLogZ1` で 405 を取得済み。ここでは再掲のみ。

## 3. Matrix No.39-53 RUN_ID 整理

`logs/2025-11-13-orca-connectivity.md`・`PHASE2_PROGRESS.md` を棚卸ししたところ、No.39-53 の多くが「Run 未実行」か 405 記録のみだったため、以下の通り差分と TODO を整理した。

### 3.1 No.39-40（入院会計派生）
- **`/orca31/hspmmv2`**: XML `<hspmmv2req>`（`Perform_Month` YYYY-MM 必須, `Patient_ID` 任意）。RUN_ID=`20251113T002806Z`（「uncertain-api」証跡）で `Allow: OPTIONS, GET` → `HTTP 405`。system daily とは別に ORCA route の公開が必要。`orca-api-matrix` 備考を「POST 復旧待ち」に更新済み。
- **`/orca31/hsacctmodv2`（Request_Number=3 室料差額）**: 公式仕様は XML `<private_objects>` に `Save_Request`、`Admission_Date`、`Perform_Date`、`Room_Charge` を含める（[hospsagaku](https://www.orca.med.or.jp/receipt/tec/api/hospsagaku.html)）。`logs/2025-11-13-orca-connectivity.md` と `PHASE2_PROGRESS.md` の ORCA 節を確認したが RUN_ID は存在せず、入院会計 seed も未整備。No.38（会計作成）と No.39（未作成チェック）がふさがらない限り動作確認ができないため、W22 で seed SQL を用意するタスクを追加した。

### 3.2 No.41-42（Push / 帳票）
- **`/api01rv2/pusheventgetv2`**: JSON Body `pusheventgetv2req → {event, user, start_time, end_time}`。`manifest.json` slug=`pusheventget`。`logs/2025-11-13-orca-connectivity.md` にも実行ログが無く、`PHASE2_PROGRESS.md` でも RUN_ID 不在。push-exchanger と ORCA 側イベント seed を整えないと検証できないため、`ORCA_CONNECTIVITY_VALIDATION.md` §3 に push-exchanger の事前確認を追記する。
- **`/orca42/receiptprintv3`**: XML リクエストで帳票編集 → JSON `Data_Id` + `print002` PUSH 通知 → `/blobapi/<Data_Id>` 取得という 3 段フロー。`artifacts/orca-connectivity` にも帳票 RUN_ID が無いため、`PHASE2_PROGRESS.md` へ「Push/帳票 RUN 未実施」と追記予定。`notes/orca-api-field-validation.md` 本節にプレビューを残し、次回 RUN で `print002` PUSH と `pusheventgetv2` をセットで収集する。

### 3.3 No.45/53（患者メモ + 取得）
- **`/api01rv2/patientlst7v2`**: XML `<patientlst7req>`（`Request_Number`, `Patient_ID`, `Base_Date`, `Memo_Class`, `Department_Code`）で最大 10 件の患者メモ＋受付保険を返却。`PHASE2_PROGRESS.md`・`logs/2025-11-13-orca-connectivity.md` に RUN_ID は無く、`/orca06/patientmemomodv2`（同日 405）に依存するため内容確認ができていない。`orca-api-matrix` 備考に「memomodv2 復旧後に再試行」と記載した。
- **`/orca06/patientmemomodv2`**: §2 の通り XML 化済みでも 405。memo 取得/登録ともに ORCA route 開放待ちで、`notes/orca-api-field-validation.md` では Content-Type を `application/xml; charset=UTF-8` に固定したテンプレのみ維持する。

### 3.4 その他（No.43, 47-52）
- **`/orca51/masterlastupdatev3`**: XML `<masterlastupdatev3req>` で master 更新日一覧を取得。Run 未実施。`system01dailyv2` 後に 1 回だけ叩いてキャッシュ TTL を Runbook に残す。
- **`/orca36/hsfindv3`**: XML `<hsfindv3req>` で入院患者を Admission_Date/病棟で範囲検索。入院患者 seed が無く RUN_ID 不在。No.38/39 を復旧させた後で検証する。
- **`/api01rv2/contraindicationcheckv2`**: XML `<contraindication_checkreq>`（`Perform_Month`, `Check_Term`, `Medical_Information[]`）。薬剤履歴 seed が無いため RUN 未実施。薬剤検索実装と合わせて 1 API として扱う。
- **`/api01rv2/insuranceinf1v2`**: XML `<insuranceinfreq>`（`Base_Date`）。Web クライアントの保険タブ初期化に必須だが RUN なし。`ORCA_CONNECTIVITY_VALIDATION.md` §3.1 に「起動時 1 度取得」を追記。
- **`/api01rv2/subjectiveslstv2`**: XML `<subjectiveslstreq>`（`Request_Number=01-03`）。症状詳記 UI 未着手につき RUN なし。カルテ UI を W22 で再開した際にテストする。
- **`/api01rv2/patientlst8v2`**: XML `<patientlst8req>`（`Patient_ID`）。旧姓履歴 seed 不足で RUN なし。`orca-api-matrix` 備考に seed TODO を追加。
- **`/api01rv2/medicationgetv2`**: XML `<medicationgetreq>`（`Request_Code`, `Base_Date`）。2024-11 掲載の新 API で Run なし。診療コード検索機能の要件定義と同時に試行する。

以上の整理を `ORCA_API_STATUS.md` §2.4 と `orca-api-matrix.csv` の差異欄へ反映し、次回 RUN_ID 着手時に参照できるようにした。
