# WebORCA Reception Checklist

## 目的
- Reception/Charts の受付フローが WebORCA 連携で成立していることを確認する。
- CLAIM 廃止検証（`docs/verification-plan.md`）の実行チェックとして使う。

## 参照
- `docs/verification-plan.md`
- `docs/server-modernization/phase2/operations/ORCA_CERTIFICATION_ONLY.md`

## 現状サマリ（既存証跡の反映）
- MSW OFF / ORCA 実接続: **実施済 (RUN_ID=20260205T071019Z)**
  - Vite 5173 / `VITE_DISABLE_MSW=1` / server-modernized → WebORCA Trial。
  - `/orca/appointments/list`・`/orca/visits/list`・`/orca/visits/mutation`・`/api/orca/queue` が 200。
  - `/orca/claim/outpatient` 不発、Reception の CLAIM 文言 0 件。
  - 受付送信は Api_Result=14（ドクター不存在）で論理成功は未達。
  - 追加実測: RUN_ID=`20260205T070802Z`（Api_Result=90: 他端末使用中、受付行未生成、`/orca21/medicalmodv2/outpatient` 200）
  - 追加実測: RUN_ID=`20260205T085918Z-accept-guest-0001`（職員コード 0001/0003/0005/0006/0010 を試行 → Api_Result=14/13）
  - 追加実測: RUN_ID=`20260205T090121Z-accept-doctor1-10001`（system01lstv2 Code=10001/10003/10005/10006/10010 で再試行 → ORCA 502 により Api_Result 未取得）
  - 追加実測: RUN_ID=`20260205T095826Z-accept-doctor1-0001`（登録済み医師コード 0001/0003/0005/0006/0010＋dept=01/02/11/10/26 → ORCA 502 により Api_Result 未取得）
  - 追加実測: RUN_ID=`20260205T110841Z-accept-00001-11-0005`（初期患者00001〜00011＋保険組み合わせ／医師コード0001/0003/0005/0006/0010 → ORCA 502 により Api_Result 未取得）
- MSW ON / ORCA 未接続: **実施済 (RUN_ID=20260205T070641Z)**
  - Vite 4173 / `msw=1` / cache-hit シナリオで Reception/Charts を実測。
- 既存の関連証跡:
  - RUN_ID=`20260205T070641Z` MSW ON（ORCA 未接続 / Vite 4173）
    - `/orca/claim/outpatient` 不発、Reception/Charts の CLAIM 文言なし
    - `/orca/appointments/list/mock` と `/orca/visits/list/mock` が HTTP 200
    - `/orca21/medicalmodv2/outpatient` が HTTP 200
    - HAR/スクショ/ログ: `artifacts/webclient/e2e/20260205T070641Z/msw-on/`
  - RUN_ID=`20260205T071019Z` MSW OFF（Vite 5173 → server-modernized → WebORCA Trial）
    - `/orca/appointments/list` 200 / `/orca/visits/list` 200 / `/orca/visits/mutation` 200 / `/api/orca/queue` 200
    - `/orca/claim/outpatient` 不発、CLAIM 文言 0 件
    - 受付送信 Api_Result=14（ドクター不存在）
    - HAR/スクショ/ログ: `artifacts/webclient/e2e/20260205T071019Z/reception-msw-off/`
  - RUN_ID=`20260205T070802Z` MSW OFF（Vite 5173 → server-modernized → WebORCA Trial）
    - `/orca/visits/mutation` Api_Result=90（他端末使用中）で受付行が生成されず
    - `/orca/appointments/list` Api_Result=21 / `/orca/visits/list` Api_Result=13（recordsReturned=0）
    - `/orca21/medicalmodv2/outpatient` 200（recordsReturned=1）
    - `/orca/claim/outpatient` 不発
    - HAR/スクショ/ログ: `artifacts/webclient/e2e/20260205T070802Z/fullflow/`
  - RUN_ID=`20260205T085918Z-accept-guest-0001` MSW OFF（Vite 5173 → server-modernized → WebORCA Trial）
    - 職員コード 0001/0003/0005/0006/0010 を順に試行
    - Api_Result=14（ドクターが存在しません）: 0001/0010
    - Api_Result=13（診療科が存在しません）: 0003/0005/0006（dept=13/07/05）
    - HAR/スクショ/ログ: `artifacts/webclient/e2e/20260205T085918Z-accept-guest-0001/reception-send/` ほか
  - RUN_ID=`20260205T090121Z-accept-doctor1-10001` MSW OFF（Vite 5173 → server-modernized → WebORCA Trial）
    - system01lstv2 Code（10001/10003/10005/10006/10010）＋ dept=01/02/11/10/26 を試行
    - ORCA Trial が `/orca11/acceptmodv2` などで HTTP 502 → Session layer failure（Api_Result 未取得）
    - HAR/スクショ/ログ: `artifacts/webclient/e2e/20260205T090121Z-accept-doctor1-10001/reception-send/` ほか
  - RUN_ID=`20260205T095826Z-accept-doctor1-0001` MSW OFF（Vite 5173 → server-modernized → WebORCA Trial）
    - 登録済み医師コード 0001/0003/0005/0006/0010 ＋ dept=01/02/11/10/26 を試行
    - ORCA Trial が `/orca11/acceptmodv2` と `/api01rv2/{visitptlstv2,appointlstv2}` で HTTP 502 → Session layer failure（Api_Result 未取得）
    - HAR/スクショ/ログ: `artifacts/webclient/e2e/20260205T095826Z-accept-doctor1-0001/reception-send/` ほか
  - RUN_ID=`20260205T110841Z-accept-00001-11-0005` MSW OFF（Vite 5173 → server-modernized → WebORCA Trial）
    - ORCA Trial 初期患者 00001〜00011 の保険組み合わせで受付送信を再検証（国保/社保/後期高齢者/生活保護/自賠責/労災/自費）
    - 医師コード 0001/0003/0005/0006/0010 を診療科に合わせて選択（内科/精神科/整形外科/外科/眼科）
    - `/orca/visits/mutation` は 500（Session layer failure）、ORCA Trial が `/orca11/acceptmodv2` と `/api01rv2/{visitptlstv2,appointlstv2}` で HTTP 502
    - HAR/スクショ/ログ: `artifacts/webclient/e2e/20260205T110841Z-accept-00001-11-0005/reception-send/` ほか同系列（`20260205T110841Z-accept-00002-01-0001` / `20260205T110841Z-accept-00003-01-0001` / `20260205T110841Z-accept-00004-01-0001` / `20260205T110841Z-accept-00005-11-0005` / `20260205T110841Z-accept-00006-01-0001` / `20260205T110841Z-accept-00007-02-0003` / `20260205T110841Z-accept-00007-26-0010` / `20260205T110841Z-accept-00008-11-0005` / `20260205T110841Z-accept-00009-11-0005` / `20260205T110841Z-accept-00010-10-0006` / `20260205T110841Z-accept-00011-01-0001`）
    - server-modernized ログ: `artifacts/webclient/e2e/20260205T110841Z-accept-trial-physicians/server-log-snippet.txt`
  - RUN_ID=`20251205T200000Z` 受付 QA（Stage DNS 解決失敗で未達）
    - `docs/server-modernization/phase2/operations/logs/20251205T200000Z-reception-qa.md`
    - `artifacts/webclient/e2e/20251205T200000Z-reception/reception-stage.png`
    - `artifacts/webclient/e2e/20251205T200000Z-reception/reception-stage.log`
  - RUN_ID=`20260103T224421Z` WebORCA 実接続（CLAIM系 500 で fallback）
    - `docs/server-modernization/phase2/operations/logs/20260103T224421Z-orca-real-webclient.md`
    - `artifacts/.../screenshots/{reception.png,charts.png,patients.png}`
  - RUN_ID=`20260204T052600Z-acceptmodv2-webclient` Web-client 受付送信（MSW OFF / Vite 5173 → server-modernized → WebORCA Trial）
    - `/orca/visits/mutation` が HTTP 500（Session layer failure）
    - server-modernized ログで ORCA HTTP 405 (`/orca11/acceptmodv2`) を確認
    - `artifacts/webclient/e2e/20260204T052600Z-acceptmodv2-webclient/reception-send/`
  - RUN_ID=`20260204T054200Z-acceptmodv2-webclient` ORCA_API_PATH_PREFIX=/api 設定後の再検証
    - `/orca/visits/mutation` が HTTP 200 だが Api_Result=30（PUSH通知区分エラー）
    - 405 は解消、Acceptance_Push 送信がブロッカー
    - `artifacts/webclient/e2e/20260204T054200Z-acceptmodv2-webclient/reception-send/`
  - RUN_ID=`20260204T055600Z-acceptmodv2-webclient` Acceptance_Push 抑止後の再検証
    - `/orca/visits/mutation` が HTTP 200 / Api_Result=00（受付登録成功）
    - UI バナーも成功表示
    - `artifacts/webclient/e2e/20260204T055600Z-acceptmodv2-webclient/reception-send/`

## acceptmodv2 実測（Trial/Dev）
- Trial 実測: RUN_ID=`20260111T001750Z` で `/api/orca11/acceptmodv2` が HTTP 200 / `Api_Result=10`（データなし）を返却。証跡: `docs/DEVELOPMENT_STATUS.md`。
- Trial seed check: RUN_ID=`20260204T042010Z-acceptmodv2-seedcheck` で `system01lstv2` が HTTP 200 / `Api_Result=00`（Dr=10001/10003/10005/10006/10010 を確認）、`patientmodv2` は初回 H1（保険者番号検証エラー）→再送で Api_Result=00 / Patient_ID=01414 を取得。証跡: `artifacts/verification/20260204T042010Z-acceptmodv2-seedcheck/`。
- Dev proxy（Stage/Preview）: RUN_ID=`20251209T150000Z` の dev proxy 先 `100.102.17.40:8000/443/8443` が TCP timeout（curl exit 28）。証跡: `docs/web-client/operations/debugging-outpatient-bugs.md`, `artifacts/webclient/e2e/20251209T150000Z-integration-gap-fix/`。
- acceptmodv2 は必須機能のため、最終確認は本番想定環境で実施する（Trial 実測は参考扱い）。

## 前提
- MSW 有効 (`VITE_DISABLE_MSW=0`) と無効 (`VITE_DISABLE_MSW=1`) の両方で実施する。
- 接続先（Trial/Stage/Prod）と RUN_ID を固定し、証跡保存先を決めてから開始する。

## 事前チェック
- DNS/疎通: 接続先のドメインが解決できること。
- 認証: userName/password、facilityId、Basic のいずれかが有効であること。
- Vite proxy: `VITE_DEV_PROXY_TARGET` などの接続先が意図した環境に向いていること。

## seed/権限/データ準備（acceptmodv2 前提）
- 参照: `src/orca_preprod_issue_catalog_resolution_20260123/09_test_data_validation/02_ORCAデータ準備手順.md`
- UI 施設/ユーザーの前提: `ops/db/local-baseline/local_synthetic_seed.sql` で facility=`1.3.6.1.4.1.9414.72.103` と user=`1.3.6.1.4.1.9414.72.103:doctor1`（roles=admin/doctor/user）を投入する。
- 受付一覧の再現 seed: `scripts/seed-e2e-repro.sh`（`ops/db/local-baseline/e2e_repro_seed.sql`）で patientId=10010/10011/10012/10013 を当日分で作成する。
- ORCA 側の実データ準備: Local WebORCA で `patientmodv2` / `/orca/visits/mutation` / `/orca/visits/list` を順に実施し、受診データが生成されることを確認する。
- ORCA Trial の職員コード（1010）: guest(0001/事務職), doctor1(0001/内科), doctor3(0003/精神科), doctor5(0005/整形外科), doctor6(0006/外科), doctor10(0010/眼科)。受付送信の担当医コードは **system01lstv2 の physician Code（10001/10003/10005/10006/10010）** を使用する（0001 等の職員コードは Api_Result=14 になりやすい。詳細は `docs/verification-plan.md` を参照）。

### ORCA Trial 患者/保険組み合わせ（00001〜00011）
- 出典: `docs/server-modernization/phase2/operations/assets/orca-trialsite/raw/trialsite.md` の「登録されている初期データ」。
- ここに記載されているのは **保険種別・診療科の組み合わせ**。`insuranceCombinationNumber` は公開情報に含まれないため、**検証前に ORCA 側で実番号を確認** してから送信すること（推測で埋めない）。
- 直叩き実測（RUN_ID=`20260205T114847Z-insurance-combinations`）: `POST /api01rv2/patientlst6v2`（Reqest_Number=01）で患者ごとの保険組み合わせ番号を取得。
  - 証跡: `artifacts/verification/20260205T114847Z-insurance-combinations/insurance-combination.tsv`
  - Reqest_Number は処理区分のため `01` 固定。任意文字列だと Api_Result=E91（処理区分未設定）。

| 患者ID | 事例 | 保険種別 | 診療科 | insuranceCombinationNumber（実測） |
| --- | --- | --- | --- | --- |
| 00001 | 事例一 | 国保 | 整形外科 | 0005（国保/060）、0009（自費/980） |
| 00002 | 事例二 | 社保→国保 | 内科 | 0003（協会/009）、0004（国保/060）、0005（公害保険/975） |
| 00003 | 事例三 | 社保 | 内科 | 0001（地公/032） |
| 00004 | 事例四 | 社保 | 内科 | 0001（学校/034） |
| 00005 | 事例五 | 国保 | 整形外科 | 0001（国保/060） |
| 00006 | 事例六 | 後期高齢者 | 内科 | 0001（後期高齢者/039） |
| 00007 | 事例七 | 生活保護 | 精神科 / 眼科 | 0001（公費=012:生活保護） |
| 00008 | 事例八 | 自賠責 | 整形外科 | 0001（自賠責保険/973） |
| 00009 | 事例九 | 労災 | 整形外科 | 0001（労災保険/971） |
| 00010 | 事例十 | 自費 | 外科 | 0001（自費/980） |
| 00011 | 事例十一 | 後期高齢者 | 内科 | 0001（後期高齢者/039） |

## WEBORCA 実データ送信（web-client経由）チェックリスト【必須】
### 前提
- MSW 無効（`VITE_DISABLE_MSW=1`）。
- ORCA 接続先/認証は `ORCA_CERTIFICATION_ONLY.md` と `02_ORCAデータ準備手順.md` に従い、実データ送信が可能な環境であること。
- 施設/ユーザー権限が有効（例: facility=`1.3.6.1.4.1.9414.72.103`, user=`...:doctor1`, roles=admin/doctor/user）。
- 受付対象の患者/医師データが ORCA 側に存在すること（patient/physician seed 済み）。
- dev proxy を使う場合は `VITE_DEV_PROXY_TARGET` が実接続先を指していること。

### 最小手順（Reception→受付送信）
1. RUN_ID を確定し、接続先・環境変数を記録する。
2. Web クライアントにログインし Reception 画面を開く（当日の日付で一覧が表示されること）。
3. Reception の受付登録/取消フォームで患者ID・保険区分・来院区分・操作種別を入力し「受付送信」が有効化されることを確認する。
4. 「受付送信」を実行し、ToneBanner に成功/警告/失敗が表示されることを確認する。
5. Network で受付送信 API（`/orca/visits/mutation`）のリクエスト/レスポンスを確認する（HTTP 200 + Api_Result=00/警告）。
6. `/api/orca/queue` に送信状態が反映されることを確認する。

### 証跡フォーマット
- RUN_ID: `<RUN_ID>`
- 接続先: `<ORCA_BASE_URL>` / `<VITE_DEV_PROXY_TARGET>`
- 認証: `<Basic/userName/password/facilityId の種別>`
- 画面キャプチャ: Reception 画面（送信前/後）と ToneBanner
- Network/HAR: 受付送信 API と `/api/orca/queue` のレスポンス
- ログ: server-modernized の runId/traceId 抽出ログ
- 保存先: `artifacts/webclient/e2e/<RUN_ID>/reception-send/`

## Reception チェック
- `/orca/appointments/list` が 200 応答すること。
- `/orca/visits/list` が 200 応答すること。
- `/orca/visits/mutation`（受付送信）が 200 応答すること。
- `/api/orca/queue` が 200 応答し、送信キュー状態が表示されること。
- `/orca/claim/outpatient` が **発火しない**こと。
- 受付画面の CLAIM 依存文言が残っていないこと。

### 既存証跡の反映
- MSW ON / ORCA 未接続（RUN_ID=`20260205T070641Z`）:
  - `/orca/appointments/list/mock` 200、`/orca/visits/list/mock` 200
  - `/orca/claim/outpatient` 不発、CLAIM 文言なし
  - `/orca/visits/mutation` と `/api/orca/queue` は未実施（MSW ON 画面確認のみ）
  - 証跡: `artifacts/webclient/e2e/20260205T070641Z/msw-on/`
- MSW OFF / ORCA 実接続: **HTTP 200 実測済み (RUN_ID=`20260205T071019Z`)**
  - `/orca/appointments/list` 200
  - `/orca/visits/list` 200
  - `/orca/visits/mutation` 200（Api_Result=14: ドクター不存在）
  - `/api/orca/queue` 200
  - `/orca/claim/outpatient` 不発、Reception の CLAIM 文言 0 件
  - 証跡: `artifacts/webclient/e2e/20260205T071019Z/reception-msw-off/`
  - 未達: 受付送信の Api_Result=00 は未確認（担当医コード 0001 のみで ORCA 側未登録）
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T070802Z`）:
  - `/orca/appointments/list` 200（Api_Result=21 / recordsReturned=0）
  - `/orca/visits/list` 200（Api_Result=13 / recordsReturned=0）
  - `/orca/visits/mutation` 200 だが Api_Result=90（他端末使用中）で受付行が生成されず
  - `/api/orca/queue` 200
  - `/orca/claim/outpatient` 不発
  - 証跡: `artifacts/webclient/e2e/20260205T070802Z/fullflow/`
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T085918Z-accept-guest-0001`）:
  - 職員コード 0001/0003/0005/0006/0010 を順に試行
  - Api_Result=14（ドクターが存在しません）: 0001/0010
  - Api_Result=13（診療科が存在しません）: 0003/0005/0006（dept=13/07/05）
  - `/orca/claim/outpatient` 不発
  - 証跡: `artifacts/webclient/e2e/20260205T085918Z-accept-guest-0001/reception-send/` ほか
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T090121Z-accept-doctor1-10001`）:
  - system01lstv2 Code（10001/10003/10005/10006/10010）＋ dept=01/02/11/10/26 を試行
  - ORCA Trial が `/orca11/acceptmodv2` で HTTP 502 → Session layer failure（Api_Result 未取得）
  - `/orca/claim/outpatient` 不発
  - 証跡: `artifacts/webclient/e2e/20260205T090121Z-accept-doctor1-10001/reception-send/` ほか
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T095826Z-accept-doctor1-0001`）:
  - 登録済み医師コード 0001/0003/0005/0006/0010 ＋ dept=01/02/11/10/26 を試行
  - ORCA Trial が `/orca11/acceptmodv2` と `/api01rv2/{visitptlstv2,appointlstv2}` で HTTP 502 → Session layer failure（Api_Result 未取得）
  - `/orca/claim/outpatient` 不発
  - 証跡: `artifacts/webclient/e2e/20260205T095826Z-accept-doctor1-0001/reception-send/` ほか
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T110841Z-accept-00001-11-0005`）:
  - ORCA Trial 初期患者 00001〜00011 の保険組み合わせで受付送信を再検証（国保/社保/後期高齢者/生活保護/自賠責/労災/自費）
  - 医師コード 0001/0003/0005/0006/0010 を診療科に合わせて選択（内科/精神科/整形外科/外科/眼科）
  - `/orca/visits/mutation` は 500（Session layer failure）、ORCA Trial が `/orca11/acceptmodv2` と `/api01rv2/{visitptlstv2,appointlstv2}` で HTTP 502
  - `/orca/claim/outpatient` 不発
  - 証跡: `artifacts/webclient/e2e/20260205T110841Z-accept-00001-11-0005/reception-send/` ほか同系列（`20260205T110841Z-accept-00002-01-0001` / `20260205T110841Z-accept-00003-01-0001` / `20260205T110841Z-accept-00004-01-0001` / `20260205T110841Z-accept-00005-11-0005` / `20260205T110841Z-accept-00006-01-0001` / `20260205T110841Z-accept-00007-02-0003` / `20260205T110841Z-accept-00007-26-0010` / `20260205T110841Z-accept-00008-11-0005` / `20260205T110841Z-accept-00009-11-0005` / `20260205T110841Z-accept-00010-10-0006` / `20260205T110841Z-accept-00011-01-0001`）
  - server-modernized ログ: `artifacts/webclient/e2e/20260205T110841Z-accept-trial-physicians/server-log-snippet.txt`

## Charts チェック
- `/orca21/medicalmodv2/outpatient` が 200 応答すること。
- `/orca/appointments/list`・`/orca/visits/list` の応答が Charts 側に反映されること。
- Charts 画面の CLAIM 依存文言が残っていないこと。

### 既存証跡の反映
- MSW ON / ORCA 未接続（RUN_ID=`20260205T070641Z`）:
  - `/orca21/medicalmodv2/outpatient` 200（MSW）
  - `/orca/appointments/list/mock` / `/orca/visits/list/mock` が Charts 側でも 200
  - CLAIM 文言なし
  - 証跡: `artifacts/webclient/e2e/20260205T070641Z/msw-on/`
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T070802Z`）:
  - `/orca21/medicalmodv2/outpatient` 200（recordsReturned=1）
  - `/orca/appointments/list` 200（Api_Result=21 / recordsReturned=0）
  - `/orca/visits/list` 200（Api_Result=13 / recordsReturned=0）
  - Charts 画面は患者未選択ガードが表示（Reception 行未生成のため）
  - CLAIM 文言はスクリーンショット上で明示的な表示なし
  - 証跡: `artifacts/webclient/e2e/20260205T070802Z/fullflow/`

## Console/Network チェック
- `/orca/claim/outpatient` 起因の 404/401 が出ないこと。
- その他の 404/401/503 が発生した場合は理由と回避策を記録すること。

### 既存証跡の反映
- MSW ON / ORCA 未接続（RUN_ID=`20260205T070641Z`）:
  - `/orca/claim/outpatient` 起因の 404/401 は発生なし
  - 401/404 は検出されず
  - Console:
    - Font CORS preflight（x-msw ヘッダ由来のフォント要求）警告
    - ChartsPage の `Maximum update depth exceeded` 警告
  - 証跡: `artifacts/webclient/e2e/20260205T070641Z/msw-on/`
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T070802Z`）:
  - `/orca/claim/outpatient` 起因の 404/401 は発生なし（呼び出し不発）
  - 404: `/orca/order/bundles` / `/orca/disease/import/00001`（console で確認）
  - Warning: telemetry schema warning（charts_action）
  - 証跡: `artifacts/webclient/e2e/20260205T070802Z/fullflow/`
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T085918Z-accept-guest-0001`）:
  - `/orca/claim/outpatient` 起因の 404/401 は発生なし（呼び出し不発）
  - Api_Result=14/13 により論理エラー（doctor/department 不在）
  - 証跡: `artifacts/webclient/e2e/20260205T085918Z-accept-guest-0001/reception-send/` ほか
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T090121Z-accept-doctor1-10001`）:
  - ORCA Trial が HTTP 502（/orca11/acceptmodv2, /api01rv2/visitptlstv2, /api01rv2/appointlstv2）
  - server-modernized は Session layer failure（/orca/visits/mutation 500）
  - 証跡: `artifacts/webclient/e2e/20260205T090121Z-accept-doctor1-10001/reception-send/` ほか
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T095826Z-accept-doctor1-0001`）:
  - ORCA Trial が HTTP 502（/orca11/acceptmodv2, /api01rv2/visitptlstv2, /api01rv2/appointlstv2）
  - server-modernized は Session layer failure（/orca/visits/mutation 500）
  - 証跡: `artifacts/webclient/e2e/20260205T095826Z-accept-doctor1-0001/reception-send/` ほか
- MSW OFF / ORCA 実接続（RUN_ID=`20260205T110841Z-accept-00001-11-0005`）:
  - ORCA Trial が HTTP 502（/orca11/acceptmodv2, /api01rv2/visitptlstv2, /api01rv2/appointlstv2）
  - server-modernized は Session layer failure（/orca/visits/mutation 500）
  - 証跡: `artifacts/webclient/e2e/20260205T110841Z-accept-00001-11-0005/reception-send/` ほか同系列
  - server-modernized ログ: `artifacts/webclient/e2e/20260205T110841Z-accept-trial-physicians/server-log-snippet.txt`

## 証跡
- Network の HAR もしくはスクリーンショットを保存。
- Reception/Charts の画面キャプチャを保存。
- RUN_ID、接続先、MSW の ON/OFF を必ず記録。

## 完了基準
- MSW ON/OFF 両方で Reception/Charts チェックが PASS。
- `/orca/claim/outpatient` が不発であることが証跡で確認できる。
- 受付送信（`/orca/visits/mutation`）の成功が証跡で確認できる。
- 404/401 が出ないことが証跡で確認できる。

## 未実施の理由と再検証条件
- MSW ON/OFF の両系統での Reception/Charts 実測が未完了。
- Stage 環境の DNS/接続性が復旧し、
  `VITE_DEV_PROXY_TARGET` が有効な接続先を指すことが必須条件。
- Trial/Prod での実接続を行う場合は、
  `ORCA_CERTIFICATION_ONLY.md` に沿った認証情報と証跡保存先を確定する。
- 再検証前提:
  - VPN/FW/ACL: Stage/Preview 向けの TCP timeout が解消（VPN/FW/ACL 開通）。
  - seed: ORCA Trial は職員コード `0001/0003/0005/0006/0010`（doctor1/doctor3/doctor5/doctor6/doctor10）。その他環境は Dr `10000/10001`, Patient `00005` などを準備。
  - POST 開放: `/orca11/acceptmodv2` の POST が許可されていること（Trial 405 の場合は Blocker）。
  - Trial が不可の場合は、本番想定環境（認証環境/ORMaster 等）で実施する。
