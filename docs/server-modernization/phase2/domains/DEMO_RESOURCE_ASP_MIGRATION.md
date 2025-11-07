# DemoResourceASP モダナイズ移行メモ (2025-11-03)

> 更新日: 2025-11-03 / 担当: Worker B (Codex)

## 1. 背景とスコープ
- 目的: 旧 ASP サーバー (`server/src/main/java/open/dolphin/touch/DemoResourceASP.java`) に残存するデモ用 15 エンドポイントをモダナイズ版サーバーへ等価移植し、デモシナリオを維持する。
- 適用範囲: `/demo/*` 配下の読み取り系 API（患者リスト・来院情報・カルテ/オーダ・検査・スタンプ・スキーマ・ユーザー情報）。書き込み API は対象外。
- 準拠資料: `../../server-api-inventory.yaml`, `../../server-api-inventory.md`, `../../MODERNIZED_REST_API_INVENTORY.md`, `../../../web-client/ux/ONE_SCREEN_LAYOUT_GUIDE.md`。

## 2. 旧 ASP 実装のデータローディング仕様
### 2.1 共通仕様
- リクエストパスの `{param}` はカンマ区切り（例: `facilityId,firstResult,maxResult[,pad]`）。`pad` フラグで iPad デモ用固定データへ切り替え。
- DAO 層は `../../../../server/src/main/java/open/dolphin/touch/session/IPhoneServiceBean.java` のデモ系メソッド (`getFirstVisitorsDemo`, `getPatientVisitDemo` など) を使用。
- レスポンスは XML（`<?xml version="1.0" encoding="UTF-8"?>` + `<resource>`）。業務クライアントは XML 文字列をそのまま描画。
- 全件数が必要なエンドポイントでは `<pageInfo><numRecords/></pageInfo>` を冒頭に付与。

### 2.2 エンドポイント別一覧
| 区分 | エンドポイント | パラメータ形式 | 主要取得メソッド | 主なレスポンス要素 | 備考 |
| --- | --- | --- | --- | --- | --- |
| 認証 | `GET /demo/user/{param}` | `userId,facilityId,password[,pad]` | `IPhoneServiceBean.getUserDemo`（ID/パス一致のみ） | `<user>/<facility>` (`memberType`,`facilityId` 等) | 認証失敗時は空 `<resource/>`。 |
| 患者一覧 | `GET /demo/patient/firstVisitors/{param}` | `facilityId,first,max[,pad]` | `getFirstVisitorsDemo` | `<patient>` (`pk`,`patientId`,`name`,`firstVisit`) | `pad`=true で PK を固定配列に差し替え。 |
| 患者一覧 | `GET /demo/patient/visit/{param}` | `facilityId,first,max` | `getPatientVisitDemo` | `<patientVisit>` (`pvtDate`,`patient`) | 現行コードは直近 30 件・当日来院時刻を固定生成。 |
| 患者一覧 | `GET /demo/patient/visitRange/{param}` | `facilityId,start,end[,first,max,pad]` | `getPatientVisitRangeDemo` | `<patientVisit>` + `pvtStatus` | 30 件までステータス=1（診察完了）。 |
| 患者一覧 | `GET /demo/patient/visitLast/{param}` | `facilityId,start,end[,pad]` | `getPatientVisitRangeDemo` | 同上 | 既来院患者の再来受付デモ用。 |
| 患者照会 | `GET /demo/patient/{pk}` | `pk` | `getPatientDemo` | `<patient>` + 住所/連絡先 | ID に応じて `patientId` をゼロ埋め変換。 |
| 患者照会 | `GET /demo/patients/name/{param}` | `facilityId,keyword,first,max[,pad]` | `getPatientsByNameDemo` / `getPatientsByKanaDemo` | `<patient>` 列挙 | キーワード先頭がひらがななら `kana` 検索。 |
| カルテ概要 | `GET /demo/patientPackage/{pk}` | `pk` | `getPatientPackage` | `<patientPackage>`（患者+保険+アレルギー） | 保険は `HealthInsuranceModel.beanBytes` を `PVTHealthInsuranceModel` へデコード。 |
| オーダ | `GET /demo/module/{param}` | `kartePk,entity,first,max` | `getModules` | `<module>` + `<claimItem>` | `entity` に応じ RP 用法等を埋める。 |
| オーダ | `GET /demo/module/rp/{param}` | `kartePk,first,max` | `getRpDemo` | `<bundleMed>` + `<claimItem>` | 擬似処方 5 件をランダムに構成。 |
| カルテ本文 | `GET /demo/document/progressCourse/{param}` | `patientPk,first,max` | `getDocuments` | `<document>`（`progressCourse` テキスト + オーダ + スキーマ） | SOA/P テキストの入れ替え・Base64 スキーマ出力あり。 |
| 検査 | `GET /demo/module/laboTest/{param}` | `_facilityId,_patientId,first,max` | `getLaboTest` | `<module>` `<laboItem>` | リクエスト値は無視し内部固定 ID を使用。 |
| 検査 | `GET /demo/item/laboItem/{param}` | `_facilityId,_patientId,first,max,itemCode` | `getLaboTestItem` | `<testItem>` `<result>` | 直近データから項目単位トレンドを生成。 |
| 検査 | `GET /demo/module/diagnosis/{param}` | `kartePk,first,max` | `getDiagnosisDemo` | `<registeredDiagnosis>` | 先頭 2 件はアクティブ、以降は転帰・終了日あり。 |
| スキーマ | `GET /demo/module/schema/{param}` | `kartePk,first,max` | `getSchema` | `<schema><base64>` | JPEG を Base64 エンコード。 |

## 3. データモデリング差分（Legacy vs Modernized DemoResource）
| 項目 | Legacy (`DemoResourceASP`) | Modernized (`DemoResource`) | 影響 |
| --- | --- | --- | --- |
| `TEST_FACILITY_NAME` | "EHR クリニック" | "DolphinProクリニック" | バナー表示名をモダナイズ版に合わせる。 |
| `TEST_USER_ID` | `ehrTouch` | `dolphin` | 認証用デモ ID を入れ替え。QA は双方テスト要。 |
| `TEST_PATIENT_PK[1-5]` | `33809/33813/33817/33821/33826` | `26/29/18/312/71` | `pad` モードの固定配列差し替え。カルテ件数配分も新 ID で計算。 |
| `TEST_DEMO_FACILITY_ID` | `1.3.6.1.4.1.9414.2.1` | `1.3.6.1.4.1.9414.70.2` | ラボ API で返す施設 ID を更新。 |
| `TEST_DEMO_PATIENT_ID` | `00001` | `D_00002` | ラボ結果トレンドの患者識別子が変更。 |
| `patientId` フォーマット | 数値→ゼロ埋め5桁 | 数値→ゼロ埋め5桁 | 仕様は同じだが新 PK と突合する必要あり。 |
| ProgressCourse 件数 | `33809→9件` など | `26→9件` など | 件数テーブルは流用、参照 ID のみ置換。 |

## 4. データ変換・マッピング方針
1. **共通コンスタント統合**: `DemoResourceASP` を `DemoResource` と同じ定数群へ置換（facility 名称 / userId / patientPk / demo facilityId / demo patientId）。`pad` 分岐は配列差し替えのみでロジック共通化が可能。
2. **パラメータ取り扱い**: 既存コードは `facilityId` 等をほぼ無視し固定値を採用。モダナイズ版でも当面は互換優先とし、将来的に REST 化する際は JSON ボディで明示する（別タスク）。
3. **ラボ・診断・処方**: `getRpDemo` / `getDiagnosisDemo` / `getLaboTest` などのダミーデータ取得は共通 DAO から生成されるため、ID 置換のみで整合。Worker F が管理するスタンプ (`BundleDolphin`) と用法文言の整合をレビュー時に確認する。
4. **カルテ本文 (`getProgressCource`)**: SOA/P テキストとスタンプ展開を JSON 化する計画は未着手のため、XML 文字列を維持。ただし QA では新 PK に対する文書件数が更新されていることを検証する。
5. **エラーハンドリング強化**: レスポンスが `null` の場合がある（例: パラメータ不足）。モダナイズ実装では HTTP 400/404 を返却するよう Web 層でラップし、既存クライアント向けには空 `<resource/>` を返す互換モードを HTTP ヘッダーで制御予定（別チケット）。

## 4. JSON 応答フォーマット（モダナイズ版）
- **シリアライズポリシー**: `server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java` では Jackson/Jakarta REST のデフォルトを利用し、`open.dolphin.infomodel` の InfoModel もしくは `open.dolphin.touch.converter` のコンバータを JSON として返却する。`LegacyResponse` スキーマと同様、フィールド名は InfoModel のプロパティ名を踏襲。
- **pad フラグ**: `pad` 指定時は PK/患者 ID を固定配列 (`33809`〜`33826` / `00001`〜`00005`) に差し替え、facilityId は `/demo/user` と同じく `1.3.6.1.4.1.9414.2.100` を返却する。
- **pageInfo**: レガシーの `<pageInfo><numRecords>` に対応し、`{"pageInfo":{"numRecords": N}}` をレスポンス先頭に付与する（該当エンドポイント: `/demo/module/*`, `/demo/document/progressCourse`, `/demo/module/laboTest`）。
- **代表的なレスポンス例**:
  - `GET /demo/user/ehrTouch,2.100,098f6bcd4621d373cade4e832627b4f6`  
    ```json
    {
      "userId": "ehrTouch",
      "commonName": "EHR",
      "memberType": "touchTester",
      "facilityModel": {
        "facilityId": "2.100",
        "facilityName": "EHR クリニック"
      }
    }
    ```
  - `GET /demo/patientPackage/26`  
    ```json
    {
      "patient": {
        "patientId": "00026",
        "fullName": "デモ患者26",
        "gender": "M",
        "simpleAddressModel": {
          "zipCode": "1000001",
          "address": "東京都千代田区丸の内"
        },
        "telephone": "03-0000-0000"
      },
      "healthInsurances": [
        {
          "insuranceClass": "社保",
          "insuranceNumber": "A001",
          "publicInsurances": [
            {
              "priority": "1",
              "providerName": "自治体",
              "paymentRatio": "70"
            }
          ]
        }
      ],
      "allergies": [
        {
          "factor": "ペニシリン",
          "identifiedDate": "2020-01-01"
        }
      ]
    }
    ```
  - `GET /demo/module/medOrderPk,medOrder,0,3` → `{"pageInfo":{"numRecords":15},"modules":[{"entity":"medOrder","entityName":"RP","bundleNumber":"3","items":[{"name":"アセトアミノフェン","quantity":"3","unit":"錠"}]}]}`  
  - `GET /demo/document/progressCourse/26,0,1` → `{"pageInfo":{"numRecords":9},"documents":[{"started":"2024-05-01","responsibility":"担当 医師","soaTexts":["頭痛訴え"],"orders":[…],"schemas":[{"jpegByte":"AQID"}]}]}`
- **エラー処理**: パラメータ不足や数値変換失敗時は `400 Bad Request` を送出。レガシー互換で空配列を返したケースは `API_PARITY_MATRIX` のメモ欄に記録済み。

## 5. QA テストケース案 (2025-11-03)
| ID | シナリオ | 入力例 | 期待結果 | 備考 |
| --- | --- | --- | --- | --- |
| QA-DEM-01 | デモユーザー認証成功 | `GET /demo/user/dolphin,2.100,098f6bcd4621d373cade4e832627b4f6` | `<user>` 下に `memberType=touchTester`、`facilityName=DolphinProクリニック` | `pad` 付与時は `facilityId=1.3.6.1.4.1.9414.2.100` を確認。 |
| QA-DEM-02 | 認証失敗分岐 | `GET /demo/user/bad,2.100,xxxx` | `<resource/>` のみ | HTTP ステータス 200 互換だが、モダナイズ後は 401 へ移行予定。 |
| QA-DEM-03 | 新患リスト | `GET /demo/patient/firstVisitors/2.100,0,5,pad` | 5 件の `<patient>`。`pk` が `26/29/18/312/71` の順番ローテーション | `firstResult` を 150 固定に上書きする現仕様を記録。 |
| QA-DEM-04 | 当日受付リスト | `GET /demo/patient/visitRange/2.100,2025-11-01 09:00,2025-11-01 18:00,0,30,pad` | 30 件の `<patientVisit>`。先頭 30 件は `pvtStatus=1`、以降 0。時間が 5 分刻み。 | `pvtDate` の ISO8601 形式（`T` 区切り）を確認。 |
| QA-DEM-05 | 来院履歴（過去分） | `GET /demo/patient/visitLast/2.100,2025-10-01 09:00,2025-10-31 18:00` | 10 件以上の `<patientVisit>`。`pvtStatus` は 0/1 混在。 | `pad` 無し時は DB デモデータベースの患者 ID がゼロ埋めされる。 |
| QA-DEM-06 | カルテパッケージ | `GET /demo/patientPackage/26` | `<patientPackage>` に患者、`<healthInsurance>`、`<allergy>` が存在。保険の Base64 がデコード可能。 | 公費項目 (`<publicInsurance>`) が複数の場合も順に列挙されること。 |
| QA-DEM-07 | 処方履歴 | `GET /demo/module/rp/26,0,3` | 3 ブロックの `<bundleMed>`、各 3 件の `<claimItem>`。`administration` が指定パターンに一致。 | `Collections.shuffle` による順序差異を許容 (内容のみ確認)。 |
| QA-DEM-08 | ラボ一覧 | `GET /demo/module/laboTest/X,X,0,10` | `<module>` が 10 件、全て `patientId=D_00002`、`laboCode` が存在。 | 入力 facilityId/patientId を無視し固定値を使用する現仕様を明記。 |
| QA-DEM-09 | ラボトレンド | `GET /demo/item/laboItem/X,X,0,6,801000` | `<testItem>` 1 件 + `<result>` 6 件、サンプル日付が 14 日刻みで減少。 | `comment2` が `comment1` と同値になる既存仕様をそのまま移植。 |
| QA-DEM-10 | カルテ本文 | `GET /demo/document/progressCourse/26,0,5` | `<document>` 5 件。SOA テキストに `<module entity="progressCourse">` が含まれ、RP モジュールも展開。 | 添付スキーマ (Base64) が存在するか確認。 |
| QA-DEM-11 | スキーマ単体 | `GET /demo/module/schema/26,0,2` | `<schema><base64>` 2 件、`Base64` から JPEG 復元可能。 | 例外発生時は現在空 `<resource/>` のため、ログモニタリング必須。 |
| QA-DEM-12 | 診断履歴 | `GET /demo/module/diagnosis/26,0,4` | 4 件。先頭 2 件に `outcome` 無し、残りに `outcome` + `endDate`。 | 日付が 14 日単位で降順。 |

## 6. UX 影響とフロント連携
- `ONE_SCREEN_LAYOUT_GUIDE` の患者バナー/受付レーン/中央カルテ/右ペイン構成に合わせ、以下の表示要素を確実に供給する。
  - 患者バナー: `/demo/patient/{pk}` および `/demo/patientPackage/{pk}` で氏名・年齢・連絡先・アレルギーを提供。
  - 左レーン受付: `/demo/patient/visitRange` の `pvtDate` と `pvtStatus` がステータスバッジ（待機/診察済み）に紐付く。
  - 中央カルテ: `/demo/document/progressCourse` で SOAP テキスト + スキーマ画像、`/demo/module/{param}` で P オーダとのスプリット表示を実装。
  - 右ペイン結果: `/demo/module/laboTest` / `/demo/item/laboItem` の異常値フラグ (`outFlag`) をアラートトリガに使用。
- モダナイズ後のデモデータ名称（DolphinPro クリニック等）を UI コピーに反映する。フロント担当へ本メモとサンプル API レスポンスを共有し、スタイルガイドの文言更新を依頼。

## 7. 依存・フォローアップ
- **Worker F 連携**: スタンプ XML (`BundleDolphin`) の品目名称・用法文言を `docs/server-modernization/phase2/domains/API_PARITY_MATRIX.md` で参照し、スタンプ定義の変換差異を共有。`getModule`/`getProgressCource` の移植時に整合レビューが必要。
- **エラーハンドリング**: HTTP ステータス改善は `foundation/IMPACT_MATRIX` に追記予定 (別担当)。
- **ドキュメント更新タスク**: 実装完了時にデモ検証レポートを `docs/server-modernization/phase2/operations` 配下へ追加し、QA 手順を反映する。

## 8. 参考資料
- `../../server-api-inventory.yaml` / `../../server-api-inventory.md`: レガシー API 定義。
- `../../MODERNIZED_REST_API_INVENTORY.md`: モダナイズ版 REST 在庫。
- `../../../web-client/README.md`: Web クライアント側の導線。
- `../../../web-client/ux/ONE_SCREEN_LAYOUT_GUIDE.md`: レイアウトガイドライン。

## 9. 再点検で判明した課題 (2025-11-03)
- **ビルドエラー**: `DemoResourceAsp` が `ModuleModel` を import しておらずクラス全体がコンパイル不能（server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java:20-65,398-400）。`server-modernized/pom.server-modernized.xml` のビルドフェーズではこの時点で失敗するため、他エンドポイントの検証へ到達できない。
- **entity/name 欠落**: `/demo/module/*` と `/demo/document/progressCourse` では `BundleDolphin` の `orderName` を `ModuleInfoBean` から補完しておらず、JSON の `entity`／`entityName` が null になる（server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java:398-415,588-604 vs. server/src/main/java/open/dolphin/touch/DemoResourceASP.java:1457-1489,1659-1671）。
- **ラボトレンド差分**: 旧実装は `comment2` に常に `comment1` を複写していたが、現行コードは `item.getComment2()` を返却しており互換性が崩れている（server-modernized/src/main/java/open/dolphin/rest/DemoResourceAsp.java:552-553／server/src/main/java/open/dolphin/touch/DemoResourceASP.java:1140-1144）。
- **テスト未整備・未実行**: `DemoResourceAspTest` では `getPatientVisit` / `getPatientVisitLast` / `getPatientById` / `getPatientsByName` / `getModuleSchema` / `getRp` のケースが未実装で、Maven 不在のため既存テストも未実行（server-modernized/src/test/java/open/dolphin/rest/DemoResourceAspTest.java:64-210／docs/server-modernization/phase2/operations/EXTERNAL_INTERFACE_COMPATIBILITY_RUNBOOK.md:106-116）。
- **今後の対応**: 上記修正を実装後、`mvn -f pom.server-modernized.xml test -Dtest=DemoResourceAspTest` の実行ログとレスポンスサンプル（pad フラグ含む）を取得し、本メモ・マトリクス・ランブックを再更新する。
