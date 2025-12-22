# Touch P1 API 実装
- 期間: 2026-01-03 09:00 - 2026-01-06 09:00 / 優先度: medium / 緊急度: medium
- YAML ID: `src/server_modernized_gap_20251221/04_touch_demo/Touch_P1_API_実装.md`

## 目的
- P1 優先度の Touch API を順次実装し、キャッシュ/監査の共通化を行う。

## 実装状況
- 実装済み（Touch P1 エンドポイント）
  - `GET /touch/module/rp/{param}`: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
  - `GET /touch/module/{param}`: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
  - `GET /touch/module/laboTest/{param}`: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
  - `GET /touch/item/laboItem/{param}`: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
  - `GET /touch/module/diagnosis/{param}`: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
  - `GET /touch/module/schema/{param}`: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
  - `GET /touch/document/progressCourse/{param}`: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
  - `POST /touch/idocument`: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
  - `POST /touch/idocument2`: `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
- キャッシュ/ページング/監査の共通化（実装済み）
  - `TouchModuleService` のキャッシュ/ページング整備
  - `TouchModuleAuditLogger` / `DolphinTouchAuditLogger` による監査記録

## 変更ファイル
- `server-modernized/src/main/java/open/dolphin/touch/DolphinResource.java`
- `server-modernized/src/main/java/open/dolphin/touch/module/TouchModuleService.java`
- `server-modernized/src/main/java/open/dolphin/touch/module/TouchModuleAuditLogger.java`
- `server-modernized/src/main/java/open/dolphin/touch/DolphinTouchAuditLogger.java`

## 参照
- `src/server_modernized_gap_20251221/04_touch_demo/Touch_P0_API_実装.md`
- `docs/DEVELOPMENT_STATUS.md`
