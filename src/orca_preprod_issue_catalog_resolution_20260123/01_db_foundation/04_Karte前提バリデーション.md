# 04 Karte 前提バリデーション

- RUN_ID: 20260124T235417Z
- 対象: /orca/disease, /orca/medical/records
- 目的: Karte 未生成時の 500 を 400/404 へ変換し、失敗理由を明示する。

## バリデーション方針
- 共通
  - `patientId` 未指定/空は 400（`invalid_request`）。
  - 患者未存在は 404（`patient_not_found` / `apiResult=10`）。
  - Karte 未生成は 404（`karte_not_found` / `apiResult=10`）。
- /orca/disease
  - `operations` 未指定/空は 400。
  - `operation=create|update` で `diagnosisName` 空は 400。
- /orca/medical/records
  - `fromDate > toDate` は 400。

## 例外変換（Karte 未生成）
- Karte 取得が null の場合は 404 へ変換。
- レスポンス/監査に `precondition=karte` と `preconditionStatus=missing` を追加し、
  失敗理由を明示。

## レスポンス例（抜粋）
- /orca/medical/records（Karte 未生成）
  - HTTP 404
  - error=karte_not_found
  - apiResult=10 / apiResultMessage=該当データなし
  - precondition=karte / preconditionStatus=missing
- /orca/disease（Karte 未生成）
  - HTTP 404
  - error=karte_not_found
  - apiResult=10 / apiResultMessage=該当データなし
  - precondition=karte / preconditionStatus=missing
- /orca/medical/records（fromDate > toDate）
  - HTTP 400
  - error=invalid_request / field=fromDate

### 実装
- `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaDiseaseResource.java`
  - Karte 未生成時の監査詳細を `buildKarteNotFoundAudit` で補強。
- `server-modernized/src/main/java/open/dolphin/rest/orca/OrcaMedicalResource.java`
  - Karte 未生成時の監査詳細を `buildKarteNotFoundAudit` で補強。

## テスト
- `mvn -pl server-modernized -Dtest=OrcaDiseaseResourceTest,OrcaMedicalResourceTest test`

### 追加テスト結果
- OrcaMedicalResourceTest
  - Karte 未生成: 404 + error/apiResult/apiResultMessage + precondition を検証
  - 患者未存在: 404 + patient_not_found を検証
  - fromDate > toDate: 400 + invalid_request を検証
- OrcaDiseaseResourceTest
  - Karte 未生成: 404 + error/apiResult/apiResultMessage + precondition を検証

### テスト実行ログ（要約）
- Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
