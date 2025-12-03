# 02_画面別 API マッピングとバージョン整合 (RUN_ID=20251202T083708Z)

参照元: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`, `artifacts/ci-dryrun/20251124T153000Z/openapi.diff`, `artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca{05,06,08}.json`, `artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/*`
- `openapi.diff` (20251124T153000Z) は 0 byte のため差分検知なし。API インベントリの Blocker/実測結果を優先。

## Reception
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|受付一覧|`POST /orca/visits/list`|`/api01rv2/visitptlstv2`|差分ファイルなし（openapi.diff=0B）|インベントリ No.18 Blocker=TrialLocalOnly（RUN_ID=20251116T170500Z）。ORCA 実測は未接続。|
|受付登録/状態更新|`POST /orca/visits/mutation`|`/orca11/acceptmodv2`|差分ファイルなし（openapi.diff=0B）|インベントリ No.4 で 2025-11-21 ORMaster が HTTP 405 (Allow: GET/OPTIONS) のまま。Route 開放後に Api_Result 監査要。<br/>- 開放時に `Api_Result/Api_Result_Message` と audit（`dataSource/cacheHit/fallbackUsed/version/runId`）を取得し、レスポンスヘッダー `Allow` が POST/OPTIONS に変化することと `Content-Type=application/xml; charset=Shift_JIS`・`X-Trace-Id`/`X-Request-Id`/`X-Facility-Id` の付与を確認する。|
|予約一覧|`POST /orca/appointments/list`|`/api01rv2/appointlstv2`|差分ファイルなし（openapi.diff=0B）|インベントリ No.6 Blocker=TrialLocalOnly。ORMaster 実測は Api_Result=12（ドクター未登録）で 405 は未解消。|
|患者別予約一覧|`POST /orca/appointments/patient`|`/api01rv2/appointlst2v2`|差分ファイルなし（openapi.diff=0B）|インベントリ No.15 Blocker=TrialLocalOnly。ORCA 実測未実施。|
|予約作成/変更|`POST /orca/appointments/mutation`|`/orca14/appointmodv2`|差分ファイルなし（openapi.diff=0B）|インベントリ No.2 で HTTP 405 (Allow: GET/OPTIONS) を確認済み。開放待ち。<br/>- Route 開放後に `Api_Result/Api_Result_Message`、`dataSource/cacheHit/fallbackUsed/version/runId`、ヘッダー `Allow=POST/OPTIONS`・`Content-Type=application/xml; charset=Shift_JIS`・`X-Trace-Id`/`X-Request-Id`/`X-Facility-Id` を採取してスタブへ反映する。|
|来院ステータス更新|`PUT /pvt/{pvtPK,state}`|`/api01rv2/acceptlstv2`(参照のみ)/PVT ローカル更新|差分ファイルなし|PVT は modernized DB。ORCA 接続なし（openapi.diff=0B で差分無し）。|

## Schedule
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|スケジュール取得|`GET /schedule/pvt/{params}`|なし（Web クライアント DB）|差分ファイルなし|PVT キャッシュ経由（openapi.diff=0B）。|
|予約付き文書登録|`POST /schedule/document`|`/orca21/medicalmodv2`|差分ファイルなし（openapi.diff=0B）|ORCA 側 POST 閉鎖のため spec-based/stub 前提。|
|スケジュール削除|`DELETE /schedule/pvt/{pvtPK,ptPK,yyyy-MM-dd}`|なし|差分ファイルなし|DB トランザクションのみ。|

## Charts
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|カルテ取得|`POST /orca/medical/records`|`/api01rv2/medicalgetv2`|差分ファイルなし（openapi.diff=0B）|インベントリ No.12: ORCA POST 未開放のため DB/spec-based 参照のみ。|
|病名インポート|`GET /orca/disease/import/{pid}`|`/api01rv2/diseasegetv2`|差分ファイルなし（openapi.diff=0B）|インベントリ No.13: Trial GET 未検証、開放後に実測要。|
|診療行為登録|`POST /orca/medical-sets`|`/orca21/medicalsetv2`|差分ファイルなし（openapi.diff=0B）|インベントリ No.33: Trial POST 閉鎖。Api_Result=79 スタブのみ。|
|患者更新|`POST /orca/patient/mutation`|`/orca12/patientmodv2`|差分ファイルなし（openapi.diff=0B）|インベントリ No.14: Trial 禁止で delete 時は Api_Result=79。編集系は spec-based で未実測。<br/>- Route 開放後は `Api_Result/Api_Result_Message`＋audit（`dataSource/cacheHit/fallbackUsed/version/runId`）と `Allow=POST/OPTIONS`・`Content-Type=application/xml; charset=Shift_JIS`・`X-Trace-Id`/`X-Request-Id`/`X-Facility-Id` を採取し、spec-based stub を置き換える。|
|マスター参照（generic/price/youhou/material/kensa-sort/hokenja/address/etensu/tensu-range）|`GET /resources/orca/master/*`|`/20/adm/phr/*` 相当の ORCA マスタ|`artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca{05,06,08}.json` / `artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/*.json`|dataSource=snapshot, cacheHit=false, missingMaster=false, fallbackUsed=false（raw/B）。server-vs-msw-orca05.json も hashMatchComputed=true（counts delta=0 server=5, msw=5）に復旧。orca06/08 も hashMatchComputed=true。再取得手順まとめ済み（docs/server-modernization/phase2/operations/logs/20251202T083708Z-api-mapping.md）。orca05 hash/diff 再取得済み（RUN_ID=20251202T083708Z）。|
|カルテ CRUD|`/karte/*` 一式|Legacy Swing API|差分ファイルなし|Modernized DB 主体。|

## Patients
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|患者 ID リスト|`POST /orca/patients/id-list`|`/api01rv2/patientlst1v2`|差分ファイルなし|TrialLocalOnly スタブ。ORCA route 未開放で Api_Result 監査を未取得（dataSource/cacheHit/fallbackUsed/version/api_result なし、開放後に実測）。|
|患者基本情報バッチ|`POST /orca/patients/batch`|`/api01rv2/patientlst2v2`|差分ファイルなし|TrialLocalOnly。ORCA 実測なしで監査フィールド未採取。|
|氏名検索|`POST /orca/patients/name-search`|`/api01rv2/patientlst3v2`|差分ファイルなし|TrialLocalOnly。Api_Result 未取得、監査メタ未送信。|
|保険組合せ一覧|`POST /orca/insurance/combinations`|`/api01rv2/patientlst6v2`|差分ファイルなし|TrialLocalOnly。Api_Result / dataSource 系は空（実測待ち）。|
|旧姓履歴|`POST /orca/patients/former-names`|`/api01rv2/patientlst8v2`|差分ファイルなし|TrialLocalOnly。Api_Result 未採取。|
|患者作成/更新|`POST /orca/patient/mutation`|`/orca12/patientmodv2`|差分ファイルなし（spec-based）|Spec-based stub。ORCA POST 未開放につき Api_Result・dataSource/cacheHit/fallbackUsed/version 未取得。<br/>- 開放後に `Api_Result/Api_Result_Message` と audit（`dataSource/cacheHit/fallbackUsed/version/runId`）、`Allow=POST/OPTIONS`・`Content-Type=application/xml; charset=Shift_JIS`・`X-Trace-Id`/`X-Request-Id`/`X-Facility-Id` を収集しスタブへ転記する。|

## Administration
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|職員/診療科マスタ|`POST /orca/system/management`|`/api01rv2/system01lstv2`|差分ファイルなし|TrialLocalOnly。Api_Result/監査フィールド未取得（route 開放後に採取）。<br/>- ORMaster で開放された際に `Api_Result/Api_Result_Message` と audit（`dataSource/cacheHit/fallbackUsed/version/runId`）、`Allow=POST/OPTIONS`・`Content-Type=application/xml; charset=Shift_JIS`・`X-Trace-Id`/`X-Request-Id`/`X-Facility-Id` を取得してモダナイズ側の監査に紐づける。|
|ユーザー管理|`POST /orca/system/users`|`/orca101/manageusersv2`|差分ファイルなし（Trial 未検証）|TrialLocalOnly で実測未完了。Role/permission 反映は modernized DB、Api_Result・dataSource も空。<br/>- ORMaster 開放後に `Api_Result/Api_Result_Message`、audit（`dataSource/cacheHit/fallbackUsed/version/runId`）、`Allow=POST/OPTIONS`・`Content-Type=application/xml; charset=Shift_JIS`・`X-Trace-Id`/`X-Request-Id`/`X-Facility-Id` を採取し、modernized 側ログと突合する。|
|PHR 連携設定|未実装|`/20/adm/phr/*`|差分ファイルなし|modernized REST に対応エンドポイントなし。Api_Result/監査メタは取得不可。|
|認証/施設設定|`/user/*`, `/dolphin/*`, `/serverinfo/*`|Legacy Swing|差分ファイルなし|Modernized 独自（DB 主体）。dataSource 付与なし、Api_Result 監査対象外。|

## 監査・データソース整合性
- dataSource 付き取得済: `/resources/orca/master/*` の raw/B スナップショットは `dataSource=snapshot`, `cacheHit=false`, `missingMaster=false`, `fallbackUsed=false`, `version=20251123`。`server-vs-msw-orca05.json` も `hashMatchComputed=true`（counts delta=0 server=5, msw=5）。`server-vs-msw-orca06/08.json` も `hashMatchComputed=true`。
- TrialLocalOnly/未実測: `/orca/patients/*` 系、`/orca/insurance/combinations`, `/orca/system/management`, `/orca/system/users` は ORCA route 未開放のため `dataSource/cacheHit/fallbackUsed/version/api_result` が空。開放後に実測して監査メタを採取する。
- Spec-based stub: `/orca/patient/mutation`, `/orca/medical-sets`, `/orca/medical/records` は Api_Result を含め実 ORCA レスポンス未取得。ORCA POST 開放後に audit フィールドを取得し、スタブに埋め込む。
- ORCA route 開放後に `/orca/visits/mutation` `/orca/appointments/mutation` `/orca/patient/mutation` `/orca/system/*` を再計測し、HTTP ヘッダー（`Allow=POST/OPTIONS`, `Content-Type=application/xml; charset=Shift_JIS`, `X-Trace-Id`/`X-Request-Id`/`X-Facility-Id`）と `Api_Result/Api_Result_Message`、audit（`dataSource/cacheHit/fallbackUsed/version/runId`）をセットで取得してスタブ・監査ログへ反映する。
- PHR 連携: `/20/adm/phr/*` に modernized REST 対応がなく、Api_Result/監査フィールドも取得不可。経路決定後に監査設計を追加。
- modernized DB 主体: PVT/Schedule/karte/認証・施設設定 (`/user/*`, `/dolphin/*`, `/serverinfo/*`) は DB 直結で dataSource 付与なし。ORCA audit フィールドの適用対象は `/resources/orca/master/*` を中心に限定。
- A/B反映済み・ハブ同期済み（RUN_ID=20251202T083708Z）。
