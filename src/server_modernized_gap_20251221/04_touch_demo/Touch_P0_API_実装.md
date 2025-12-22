# Touch P0 API 実装
- 期間: 2025-12-29 15:00 - 2026-01-01 15:00 / 優先度: high / 緊急度: high
- YAML ID: `src/server_modernized_gap_20251221/04_touch_demo/Touch_P0_API_実装.md`

## 目的
- P0 優先度の Touch API を実装し、必須フローを成立させる。

## 実装状況
- 実装済み（Touch P0 エンドポイント）
  - `GET /touch/user/{param}`: `server-modernized/src/main/java/open/dolphin/touch/user/TouchUserResource.java`
  - `GET /touch/patient/{pk}`: `server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientResource.java`
  - `GET /touch/patientPackage/{pk}`: `server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientResource.java`
  - `GET /touch/patients/name/{param}`: `server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientResource.java`
  - `GET /touch/patient/visit`: `server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientResource.java`
  - `GET /touch/stamp/{stampId}`: `server-modernized/src/main/java/open/dolphin/touch/stamp/TouchStampResource.java`
  - `GET /touch/stampTree/{userPk}`: `server-modernized/src/main/java/open/dolphin/touch/stamp/TouchStampResource.java`
- 関連サービス/監査（実装済み）
  - `TouchUserService` / `TouchPatientService` / `TouchStampService` に監査・認可・ヘッダー検証を実装済み。

## 変更ファイル
- `server-modernized/src/main/java/open/dolphin/touch/user/TouchUserResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/user/TouchUserService.java`
- `server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/patient/TouchPatientService.java`
- `server-modernized/src/main/java/open/dolphin/touch/stamp/TouchStampResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/stamp/TouchStampService.java`

## 参照
- `src/server_modernized_gap_20251221/04_touch_demo/Touch_共通JSON変換基盤.md`
- `src/server_modernized_gap_20251221/04_touch_demo/Touch_監査_認証ヘッダー.md`
- `docs/DEVELOPMENT_STATUS.md`
