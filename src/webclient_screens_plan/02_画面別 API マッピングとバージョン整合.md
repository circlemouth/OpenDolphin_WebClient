# 02_画面別 API マッピングとバージョン整合 (RUN_ID=20251202T083708Z)

参照元: `docs/server-modernization/MODERNIZED_REST_API_INVENTORY.md`, `artifacts/ci-dryrun/20251124T153000Z/openapi.diff`, `artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca{05,06,08}.json`, `artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/*`

## Reception
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|受付一覧|`POST /orca/visits/list`|`/api01rv2/visitptlstv2`|差分ファイルなし（Trial 405 で ORCA 実測不可）|MODERNIZED_REST_API_INVENTORY No.18、TrialLocalOnly スタブ。|
|受付登録/状態更新|`POST /orca/visits/mutation`|`/orca11/acceptmodv2`|差分ファイルなし（ORCA 側 Allow: GET/OPTIONS のため実測未完了）|405 解消待ち。Api_Result 監査は ORCA ルート依存。|
|予約一覧|`POST /orca/appointments/list`|`/api01rv2/appointlstv2`|差分ファイルなし（Trial 405 で未検証）|Api_Result=12 を ORMaster で確認済み。|
|患者別予約一覧|`POST /orca/appointments/patient`|`/api01rv2/appointlst2v2`|差分ファイルなし|TrialLocalOnly スタブ。|
|予約作成/変更|`POST /orca/appointments/mutation`|`/orca14/appointmodv2`|差分ファイルなし（ORCA 405）|Route 開放待ち。|
|来院ステータス更新|`PUT /pvt/{pvtPK,state}`|`/api01rv2/acceptlstv2`(参照のみ)/PVT ローカル更新|差分ファイルなし|PVT は modernized DB、ORCA 連携なし。|

## Schedule
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|スケジュール取得|`GET /schedule/pvt/{params}`|なし（Web クライアント DB）|差分ファイルなし|PVT キャッシュ経由。|
|予約付き文書登録|`POST /schedule/document`|`/orca21/medicalmodv2`|差分ファイルなし（ORCA POST 閉鎖）|medicalmodv2 は spec-based。|
|スケジュール削除|`DELETE /schedule/pvt/{pvtPK,ptPK,yyyy-MM-dd}`|なし|差分ファイルなし|DB トランザクションのみ。|

## Charts
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|カルテ取得|`POST /orca/medical/records`|`/api01rv2/medicalgetv2`|差分ファイルなし（spec-based）|ORCA POST 未開放、DB のみ。|
|病名インポート|`GET /orca/disease/import/{pid}`|`/api01rv2/diseasegetv2`|差分ファイルなし|Trial GET 未検証。|
|診療行為登録|`POST /orca/medical-sets`|`/orca21/medicalsetv2`|差分ファイルなし（spec-based）|Api_Result=79 スタブ。|
|患者更新|`POST /orca/patient/mutation`|`/orca12/patientmodv2`|差分ファイルなし（spec-based）|編集系は未実測。|
|マスター参照（generic/price/youhou/material/kensa-sort/hokenja/address/etensu/tensu-range）|`GET /resources/orca/master/*`|`/20/adm/phr/*` 相当の ORCA マスタ|`artifacts/api-stability/20251124T000000Z/master-sync/20251124/diffs/server-vs-msw-orca{05,06,08}.json` / `artifacts/api-stability/20251124T151500Z/ab-compare/20251124T153000Z/raw/B/*.json`|dataSource=snapshot, cacheHit=false, missingMaster=false, fallbackUsed=false（raw/B）。MSW との差分は hashMatchComputed=false で再検証待ち。|
|カルテ CRUD|`/karte/*` 一式|Legacy Swing API|差分ファイルなし|Modernized DB 主体。|

## Patients
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|患者 ID リスト|`POST /orca/patients/id-list`|`/api01rv2/patientlst1v2`|差分ファイルなし|TrialLocalOnly スタブ。|
|患者基本情報バッチ|`POST /orca/patients/batch`|`/api01rv2/patientlst2v2`|差分ファイルなし|TrialLocalOnly。|
|氏名検索|`POST /orca/patients/name-search`|`/api01rv2/patientlst3v2`|差分ファイルなし|TrialLocalOnly。|
|保険組合せ一覧|`POST /orca/insurance/combinations`|`/api01rv2/patientlst6v2`|差分ファイルなし|TrialLocalOnly。|
|旧姓履歴|`POST /orca/patients/former-names`|`/api01rv2/patientlst8v2`|差分ファイルなし|TrialLocalOnly。|
|患者作成/更新|`POST /orca/patient/mutation`|`/orca12/patientmodv2`|差分ファイルなし（spec-based）|未実測、Audit 未整合。|

## Administration
|用途|Modernized Server|ORCA/Legacy ルート|差分・MSW|備考|
|---|---|---|---|---|
|職員/診療科マスタ|`POST /orca/system/management`|`/api01rv2/system01lstv2`|差分ファイルなし|TrialLocalOnly。|
|ユーザー管理|`POST /orca/system/users`|`/orca101/manageusersv2`|差分ファイルなし（Trial 未検証）|Role/permission 反映は DB。|
|PHR 連携設定|未実装|`/20/adm/phr/*`|差分ファイルなし|モダナイズ REST に対応エンドポイントなし。|
|認証/施設設定|`/user/*`, `/dolphin/*`, `/serverinfo/*`|Legacy Swing|差分ファイルなし|Modernized 独自。|

## 監査・データソース整合性
- ORCA マスター (charts/admin 依存): raw/B スナップショットでは `dataSource=snapshot`, `cacheHit=false`, `missingMaster=false`, `fallbackUsed=false`, `version=20251123` を確認。MSW 比較は `hashMatchComputed=false`（server-vs-msw-orca{05,06,08}.json）で再取得が必要。
- ORCA CRUD 系 (acceptmodv2/appointmodv2/patientmodv2/medicalmodv2) は ORCA 405/TrialLocalOnly のため監査フィールド未記録。Api_Result 監査は ORCA route 開放後に要取得。
- PVT/Schedule/karte 系は modernized DB 主体で `dataSource` は未付与。ORCA audit (dataSource/cacheHit/fallbackUsed) が必要なのは `/resources/orca/master/*` 系のみ。
