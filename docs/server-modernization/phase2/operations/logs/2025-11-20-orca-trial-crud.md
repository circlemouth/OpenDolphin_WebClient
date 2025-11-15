# 2025-11-20 WebORCA Trial CRUD ログ

> WebORCA トライアルへの接続検証・CRUD 実測は本ファイルへ記録。RUN_ID は `20251120TrialConnectivityWSLZ1` で固定し、DNS/TLS/CRUD の証跡を `artifacts/orca-connectivity/20251120TrialConnectivityWSLZ1/` へ保存する。HTTP ステータス／`Api_Result`／エラーメッセージを併記し、DOC_STATUS 行 79-84 へリンク。

- RUN_ID: `20251120TrialConnectivityWSLZ1`
  - 操作: 2025-11-15 08:52 JST の WSL2 (Ubuntu 24.04.3 LTS) 上の `trial/weborcatrial` Basic 認証で `nslookup`（08:52:40） + `openssl s_client`（08:52:44）による事前チェックを完了後、`curl -vv`（stderr/stdout を tee へまとめて `crud/.../curl.log`）で `/api01rv2/acceptlstv2`（POST、`Api_Result=91`）と `/20/adm/phr/phaseA`（GET、404）を実行し、リクエスト/ステータス/ボディを含む証跡を収集。
  - 2025-11-15 14:37 JST に DNS/TLS を再取得し、`dns/nslookup_2025-11-15T14:37:34+09:00.txt`（`172.192.77.103` 応答）と `tls/openssl_s_client_2025-11-15T14:37:39+09:00.txt`（`*.orca.med.or.jp` 証明書・TLSv1.2 / ECDHE-RSA-AES256-GCM-SHA384）を追加。`trialsite` Snapshot (2025-11-19) の「トライアルサーバーのみ接続可」を引用し README/log へ周知済み。
  - HTTP 応答: `/api01rv2/acceptlstv2` は `HTTP/1.1 200 OK` & `{"Api_Result":"91"}`（処理区分未設定）。`/20/adm/phr/phaseA` は `HTTP/1.1 404 Not Found` & `{"Code":404,"Message":"code=404, message=Not Found"}`。
  - 証跡: `artifacts/orca-connectivity/20251120TrialConnectivityWSLZ1/dns/nslookup.txt`, `artifacts/orca-connectivity/20251120TrialConnectivityWSLZ1/tls/openssl_s_client.txt`, `artifacts/orca-connectivity/20251120TrialConnectivityWSLZ1/crud/acceptlstv2/curl.log`, `artifacts/orca-connectivity/20251120TrialConnectivityWSLZ1/crud/phr_phase_a/curl.log`, `artifacts/orca-connectivity/20251120TrialConnectivityWSLZ1/README.md`。
  - 結論: DNS/TLS には問題なし。`acceptlstv2` は `Api_Result=91` で書込みに必要な処理区分が不足しているため後続で payload を見直す。Phase-A API は未提供（404）であり、`trialsite.md` の制限箇所として Task-C へ残す。
- RUN_ID: `20251120TrialCrudPrepZ1`
  - 操作: 2025-11-20 13:00-13:10 JST、CLI サンドボックスから `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3（2025-11-19 更新）と `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md`（Snapshot 2025-11-19）を確認し、CRUD 方針（トライアル限定で「新規登録／更新／削除 OK」、`curl -u trial:weborcatrial ...` で統一）と禁則事項（同 trialsite.md「お使いいただけない機能等」）を RUN_ID README へ反映。
  - 環境: Codex CLI（ブラウザ/外部 HTTPS へのアクセス禁止）。`weborca-trial.orca.med.or.jp:443` へ到達できないため、DNS/TLS/CRUD/UI いずれも未取得。
  - 証跡: `artifacts/orca-connectivity/20251120TrialCrudPrepZ1/README.md`（方針メモ）、`data-check/2025-11-20-data-status.md`、`crud/README.md`、`ui/README.md`。全ファイルに「trial/weborcatrial」「新規登録／更新／削除 OK（トライアル環境でのみ）」を記載。
  - ドキュメント: 2025-11-20 15:05 JST に `docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md` 1章〜タスクBを XML 仕様へ更新。背景へ `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md`「Snapshot Summary (2025-11-19)」「注意事項」「お使いいただけない機能一覧」の再定義を追加し、API 参照根拠として `docs/server-modernization/phase2/operations/assets/orca-api-spec/raw/acceptancelst.md`「リクエスト(POSTリクエスト)サンプル（更新履歴: 2023-02-27）」の `POST /api01rv2/acceptlstv2?class=01` / `Content-Type: application/xml` を明記。タスクA/Bは「UIで seed 確認→不足は UI（WebORCA フロント）で追加」「API 送信は XML（`payloads/*.xml`）＋公開エンドポイントのみ」「ログとスクショへ『実データ禁止』『登録内容は誰でも閲覧可能』を再掲」とする差分に統一。
  - Blocker: CLI サンドボックスのネットワーク制約により WebORCA トライアルへ接続不可。GUI も無いため UI スクリーンショットが取得できない。解除にはネットワーク許可済み端末へタスクを引き継ぐ必要あり。
  - 次アクション: WSL2 / macOS 等で `nslookup`/`openssl s_client`/`curl -vv -u trial:weborcatrial ...` を実行し、`artifacts/orca-connectivity/20251120TrialCrudPrepZ1/{dns,tls,crud}` と本ログへタイムスタンプ＋`Api_Result` を追記。UI before/after を `ui/` へ格納し、禁則操作が必要な場合は `trialsite.md#limit` を引用して Blocker を更新。
- RUN_ID: `20251120TrialAppointCrudZ1`
  - 操作: 2025-11-15 13:11-13:19 JST。`trial/weborcatrial` + `curl -vv --data-binary @payloads/appointlst.json` で `/api01rv2/appointlstv2` を 3 パターン実行（class 無し → class=01+Physician_Code=00001 → class=01+Physician_Code=0001）。
  - 14:38 JST には XML ペイロード版（`payloads/appointlst_trial.xml`、`Accept/Content-Type: application/xml`）を追加実行し、HTTP 200 / `Api_Result=12「ドクターが存在しません」` を確認。証跡: `crud/appointlstv2/curl_class01_xml_2025-11-15T14:38:08+09:00.log`。
  - HTTP 応答: いずれも HTTP 200。順に `Api_Result=91「処理区分未設定」`、`Api_Result=13「診療内容情報が存在しません」`、`Api_Result=12「ドクターが存在しません」`。`trialsite`「登録されている初期データ（患者 00001〜／医師 0001 等）」と異なり doctor seed が欠落している。
  - 証跡: `artifacts/orca-connectivity/20251120TrialAppointCrudZ1/crud/appointlstv2/{curl_*,payload.appointlst.json}`。Trial の注意喚起（実データ禁止／定期リセット）は README と本ログに記載。
  - Blocker: `docs/server-modernization/phase2/PHASE2_PROGRESS.md#W60` で共有済みの doctor seed 欠落により `Api_Result=00` 不達。UI との突合は GUI 端末での再取得時に実施する。
- RUN_ID: `20251120TrialAppointWriteZ1`
  - 操作: 2025-11-15 13:16 JST。`/orca14/appointmodv2`（class 無し／`?class=01`）へ `payloads/appoint_insert.json` を POST。
  - HTTP 応答: いずれも HTTP 405 `Allow: OPTIONS, GET`。nginx 層で POST が拒否され、`ORCA_HTTP_404405_HANDBOOK.md` のケースと一致。
  - 証跡: `artifacts/orca-connectivity/20251120TrialAppointWriteZ1/crud/appointmodv2/curl_*.log`、`payload.appoint_insert.json`。
  - Blocker: `trialsite` Snapshot では「一部の管理業務を除き自由に使える」「新規登録／更新／削除 OK」とあるが、API レイヤーで POST が未開放。`ORCA_HTTP_404405_HANDBOOK.md` に従い httpdump/trace を追加し、開放依頼の可否を再確認する必要がある。UI before/after は GUI 端末での再取得が必要（現在は `ui/README.md` に不足理由を記載）。
- RUN_ID: `20251120TrialMedicalCrudZ1`
  - 操作: 2025-11-15 13:16-13:17 JST。`/api/api21/medicalmodv2?class=01` へ `payloads/medical_update.json` を投げ、患者/医師コードを trialsite に合わせて 3 パターン（患者00000001→00001、医師00001→0001）で再実行。
  - HTTP 応答: 全て HTTP 200 だが `Api_Result=10（患者無し）`→`14（ドクター無し）` のまま。`trialsite` の職員情報（医師 0001/0003/0005/0006/0010）と API 応答が矛盾しており、`PHASE2_PROGRESS.md#W60` の Blocker が再現した。
  - 証跡: `artifacts/orca-connectivity/20251120TrialMedicalCrudZ1/crud/medicalmodv2/curl_class01*.log`、`payload.medical_update.json`。
  - 次アクション: doctor seed が投入されるまで CRUD 実施不可。投入後は UI で診療行為一覧を採取し `crud/medicalmodv2/` + `ui/` に before/after を保存する。
- RUN_ID: `20251120TrialAcceptCrudZ1`
  - 操作: 2025-11-15 13:19 JST。`/api01rv2/acceptlstv2?class=01` を `payloads/acceptlst.json`（Department=01, Physician_Code=0001）で実行。
  - 14:37 JST には XML 版（`payloads/acceptlst_trial.xml`）を `Accept/Content-Type: application/xml` で送信し、HTTP 200 / `Api_Result=13「ドクターが存在しません」` を再現。証跡: `crud/acceptlstv2/curl_class01_xml_2025-11-15T14:37:59+09:00.log`。
  - `payloads/acceptmod_trial.xml` で `/api01rv2/acceptmodv2?class=01` へ POST したところ `HTTP 404 / {"message":"APIが存在しません"}`。`trialsite.md#limit`（お使いいただけない機能一覧）には当該 API の開放記述が無く、WRITE 系 API は TrialLocalOnly（ローカル ORCA / ORMaster 認証待ち）として扱う。証跡: `crud/acceptmodv2/curl_class01_xml_2025-11-15T14:38:14+09:00.log`。
  - 証跡: `artifacts/orca-connectivity/20251120TrialAcceptCrudZ1/crud/acceptlstv2/curl_class01_2025-11-15T131937+0900.log`, `artifacts/orca-connectivity/20251120TrialAcceptCrudZ1/crud/acceptlstv2/curl_class01_xml_2025-11-15T14:37:59+09:00.log`, `artifacts/orca-connectivity/20251120TrialAcceptCrudZ1/crud/acceptmodv2/curl_class01_xml_2025-11-15T14:38:14+09:00.log`, `payload.acceptlst.json`, `payloads/acceptlst_trial.xml`, `payloads/acceptmod_trial.xml`。
  - Blocker: doctor seed 復旧までは Task-A/B の UI 受付と突合できない。加えて `acceptmodv2` は HTTP 404 で遮断されており、`trialsite` でも公開されていない。GUI 端末での UI キャプチャは未取得（後続ワーカーへ引き継ぎ）。

## チェックリスト/Runbook 更新履歴（2025-11-21）
- 2025-11-21 14:30 JST（担当: Codex） — `docs/managerdocs/PHASE2_ORCA_CONNECTIVITY_MANAGER_CHECKLIST.md` タスクC 以降を改訂し、`curl -vv -u trial:weborcatrial -H 'Accept: application/xml' -H 'Content-Type: application/xml' --data-binary @payloads/<api>_trial.xml` を必須化。`firecrawl` 仕様 slug（`appointlst` / `appointmod` / `acceptancelst` / `medicalmod` / `acceptmod`）を RUN_ID ごとに明示し、Trial で POST が禁止されている `/orca14/appointmodv2` などは Blocker=`TrialLocalOnly` としてタスク分割。GUI before/after 取得必須・`trialsite.md#limit` 引用必須を Check/報告テンプレへ追記。
- 2025-11-21 14:30 JST — `docs/server-modernization/phase2/operations/ORCA_CONNECTIVITY_VALIDATION.md` §4.3 に Trial 制約（Basic 認証 + XML 前提、POST 可否、`payloads/*.xml` への紐付け、ローカル ORCA での再実測条件）を転記し、Runbook 表へ `TrialLocalOnly` 再開条件を追加。あわせて本ログの更新履歴節を作成。
