# ORCA API フィールド検証メモ（W13）

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
| `/api/orca12/patientmodv2` 患者登録 | POST `Content-Type: application/xml; charset=UTF-8`、ルート `<data><patientmodreq>`。`Request_Number` と `Perform_Mode`（ともに `01`）を先頭に置き、`Mod_Key=patient-create`、`Patient_ID`（空で自動採番／数値指定で直接採番）、住所・保険情報をネストした公式サンプルを使用する。 | `14_patientmodv2_request.xml` は UTF-8 `<data><patientmodreq>` で必須 3 項目を冒頭に配置し、`Patient_ID` コメントに ORCBPTNUMCHG=1（7桁固定）の桁数ルールを明記。先頭の `orca-meta` で `path=/orca12/patientmodv2` / `query=class=01` / `Content-Type: application/xml; charset=UTF-8` を宣言し、`orca-curl-snippets` から `--data-binary` で呼び出せる。 | **W47/W48 実機:** WebORCA 22.04 では `/opt/jma/weborca/samples/patientmodv2` が存在せず、手動で XML を用意して `docker run --rm --network jma-receipt-docker-for-ubuntu-2204_default curlimages/curl:8.7.1 ... http://orca:8000/api/orca12/patientmodv2?class=01` を送信したところ、`Patient_ID` 空は `Api_Result=01 (患者番号未設定)`、`Patient_ID=000001` など 6-8 桁指定は `Api_Result=P1 (患者番号の桁数が違います。)` になった。`tbl_syskanri (kbncd=1065)` で `ORCBPTNUMCHG` 追加桁数=1 が有効のため、桁数ルールと Request XML を Runbook §5 + テンプレへ反映済み（RUN_ID=`20251113TpatientmodXMLW51`）。Evidence: `artifacts/orca-connectivity/20251113T042053Z/patientmodv2_official/response_api.http` / `response_with_id.http`。**W54 追加調査（RUN_ID=`20251113TorcaPatientDigitsZ1`）:** `docker exec ... tbl_syskanri` で `kanricd=1065` の `ORCBPTNUMCHG` が `追加桁数=1 (適用開始 2020-07-01)` であることを再取得し、デフォルト 7 桁 `PTNUM` と合わせて **「7桁 + 追加1桁 = 8桁」** が現行チェック条件と確定。Evidence: `artifacts/orca-connectivity/20251113T054336Z/patient_id_rules/tbl_syskanri.txt`。 |

## 3. 次アクション
1. 4 つのテンプレート JSON を XML 実リクエストへ差し替える（`ops/tools/send_parallel_request.sh` 等の送信ロジックが JSON 前提になっていないか要確認）。
2. `/server-modernized` 側でこれら API を呼び出す DTO / Serializer のフィールド名を照合し、`Perform_Month` や `Medical_Class_Code` など不足フィールドを追加する。
3. Runbook・テスト資産: `ORCA_CONNECTIVITY_VALIDATION.md` の該当行に「暫定テンプレ」の注記を残し、本 TODO が解消されたら備考から当メモへのリンクを削除する。

## 4. W19（2025-11-13 UTC 00:28Z）実機キャプチャ結果

- 共通: `docker run --rm --network jma-receipt-docker-for-ubuntu-2204_default curlimages/curl:8.7.1` から Basic 認証（`ormaster/change_me`）で直接 ORCA を叩いた。`application/xml; charset=UTF-8` で送信した場合のみ `/api01rv2/system01dailyv2` が 200 (`Api_Result=00`) を返し、`Shift_JIS` では項目欠落扱い（`Api_Result=91`）。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/44_system01dailyv2_response.txt`。
- `/orca31/hspmmv2`: POST は 405 `Allow: OPTIONS, GET`、GET は 404。WebORCA 20251024-1 側で POST ルートが無効化されており、`Perform_Month` 指定の XML でもルーターで拒否される。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/39_hspmmv2_response.txt`。
- `/api21/medicalmodv23`: `?class=01` 付き POST でも 405。JSON・XML すべて同結果。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/46_medicalmodv23_response.txt`。`OpenDolphin-ORCA-OQS` の `Xml_medicalv2req3` と実装が乖離している可能性あり。
- `/orca06/patientmemomodv2`: POST 405（Allow: GET）。JSON／XML いずれも同じ。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/53_patientmemomodv2_response.txt`。

→ `/orca31` / `/api21` / `/orca06` 系の POST が全滅しているため、WebORCA コンテナの API 設定（`weborca.ini` / `go-echo` ルーティング）見直し or 既知不具合確認が必要。少なくとも `/api01rv2/*` は POST を受け付けることを確認済み。

## 5. `/api01rv2/system01dailyv2` シフトJIS/UTF-8 切替 Runbook（W27）

W19（2025-11-13 UTC 00:28Z）で `Api_Result=00`（UTF-8）と `Api_Result=91`（Shift_JIS）を再現した結果を Runbook 化し、次回以降は下表の手順で再検証する。Evidence: `artifacts/orca-connectivity/20251113T002806Z/uncertain-api/44_system01dailyv2_response.txt`。

| モード | 切り替え手順 | リクエスト例 | 結果 / 備考 |
| --- | --- | --- | --- |
| UTF-8 正常系 | 1. `node scripts/tools/orca-curl-snippets.js --dry-run | rg 44_system01dailyv2` でテンプレを確認<br>2. `docker run --rm --network jma-receipt-docker-for-ubuntu-2204_default curlimages/curl:8.7.1 \`<br>`  -u ormaster:change_me -X POST \`<br>`  -H 'Content-Type: application/xml; charset=UTF-8' -H 'Accept: application/xml' \`<br>`  --data-binary @docs/server-modernization/phase2/operations/assets/orca-api-requests/44_system01dailyv2_request.json \`<br>`  http://orca:8000/api01rv2/system01dailyv2` を実行 | ボディ例（`docs/server-modernization/phase2/operations/assets/orca-api-requests/44_system01dailyv2_request.json`）:<br>`<data><system01_dailyreq><Request_Number>01</Request_Number><Base_Date>2025-11-12</Base_Date></system01_dailyreq></data>` | `Api_Result=00` / `Reskey=/api01rv2/system01dailyv2`。`Request_Number`/`Base_Date` がそのまま反映され、`Patient_Information` 等の配列が返る。Evidence: `.../44_system01dailyv2_response.txt` |
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
