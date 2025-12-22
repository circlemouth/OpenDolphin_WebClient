# PHR_コンテナ_画像_薬剤変換
- 期間: 2025-12-28 09:00 - 2025-12-31 09:00 / 優先度: high / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/03_phr/PHR_コンテナ_画像_薬剤変換.md`

## 目的
- PHRContainer の JSON 返却と画像ストリームのレスポンス仕様を確定する。
- 薬剤情報の変換（禁忌語・用法を含むフィールド）を JSON に統一する。

## 対応内容
- PHRContainer
  - `/20/adm/phr/{facilityId,patientId,...}` を `application/json` で返却。
  - 既存の `PHRContainer` DTO は `docList`/`labList` を空配列で返す前提を維持。
- 画像ストリーム
  - `/20/adm/phr/image/{patientId}` を `image/jpeg` で返却し、`Cache-Control: no-store` と `Content-Length` を付与。
  - 画像データが空の場合は 404 を返却。
- 薬剤 JSON
  - `/20/adm/phr/medication/{patientId}` を JSON 返却へ統一。
  - `PHRBundle`/`PHRClaimItem` へ ClaimBundle/ClaimItem を変換し、
    `admin`/`adminMemo`/`memo`/`frequency*`/`dose*` など用法・禁忌語に相当する情報を JSON で返却。

## 変更ファイル
- `server-modernized/src/main/java/open/dolphin/adm20/rest/PHRResource.java`
- `server-modernized/src/main/java/open/dolphin/adm20/support/PhrDataAssembler.java`
- `server-modernized/src/main/java/open/dolphin/adm20/dto/PhrMedicationResponse.java`

## 留意点
- Phase2/Legacy 文書は参照のみで更新対象外。
- ORCA 実環境接続や Stage/Preview 実測は本タスクで未実施。
