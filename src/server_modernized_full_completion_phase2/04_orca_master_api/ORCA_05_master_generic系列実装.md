# ORCA-05 薬剤/器材/検査分類マスタ実装 (RUN_ID=20251219T140028Z)

## 目的
ORCA-05 のマスタ系 API（薬剤分類/最低薬価/用法/特定器材/検査分類）を OpenAPI 仕様と整合させ、DTO/監査メタ/ページング/契約テストを揃える。

## 実装概要
- 対象エンドポイント
  - `GET /orca/master/generic-class`（`page`/`size` 対応）
  - `GET /orca/master/generic-price`（SRYCD 9桁バリデーション、未収載は `minPrice=null`）
  - `GET /orca/master/youhou`
  - `GET /orca/master/material`
  - `GET /orca/master/kensa-sort`
- DTO
  - `OrcaDrugMasterEntry`（OpenAPI `DrugMasterEntry` 相当）
  - `OrcaMasterMeta`（監査メタ）
  - `OrcaMasterListResponse<T>`（`totalCount` + `items`）
  - `OrcaMasterErrorResponse`（422/401 のエラー表現）

## 監査メタ（meta）
- `version` / `runId` / `snapshotVersion`
- `dataSource`（snapshot/fallback）
- `cacheHit` / `missingMaster` / `fallbackUsed`
- `fetchedAt`（ISO 8601）

## ページング
- `page` は 1 始まり、`size` は 1〜2000。
- `totalCount` はフィルタ後全件、`items` はページング済みの件数。

## 契約テスト
- `server-modernized/src/test/java/open/orca/rest/OrcaMasterResourceTest.java`
  - DTO と `meta` 必須フィールドの存在確認
  - `generic-price` SRYCD バリデーション (422)
  - `missingMaster`/`fallbackUsed` の扱い

## 実装ファイル
- `server-modernized/src/main/java/open/orca/rest/OrcaMasterResource.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaMasterMeta.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaDrugMasterEntry.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaMasterListResponse.java`
- `server-modernized/src/main/java/open/dolphin/rest/dto/orca/OrcaMasterErrorResponse.java`

## 未実施
- ORCA 実環境接続の検証（ORCA_CERTIFICATION_ONLY 運用）
- Stage/Preview での実 API 再検証
