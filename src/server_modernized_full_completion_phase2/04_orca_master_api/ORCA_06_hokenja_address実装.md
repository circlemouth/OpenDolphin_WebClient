# ORCA-06 保険者・住所マスタ実装

- RUN_ID: 20251219T144408Z
- 対象: `/orca/master/hokenja` / `/orca/master/address`
- 証跡: `docs/server-modernization/phase2/operations/logs/20251219T144408Z-orca-06-hokenja-address.md`

## 実装概要
- `OrcaMasterResource` に ORCA-06 の 2 エンドポイントを追加し、MSW fixture / スナップショットからデータを返す。
- `OrcaInsurerEntry` / `OrcaAddressEntry` を新規追加し、`OrcaMasterMeta` を付与。
- 404 / 503 / 空レスポンスの差分を監査ログへ反映するため、`ORCA_MASTER_FETCH` 監査イベントを追加。

## エンドポイント仕様（実装）
- `GET /orca/master/hokenja`
  - query: `pref`, `keyword`, `effective`, `page`, `size`
  - response: `totalCount` と `items[]`（`OrcaInsurerEntry`）
  - 空ヒットは 200 + 空配列
- `GET /orca/master/address`
  - query: `zip`, `effective`
  - response: `OrcaAddressEntry` または空オブジェクト `{}`
  - 未登録 zip は 404 `MASTER_ADDRESS_NOT_FOUND`

## 監査ログ
- action: `ORCA_MASTER_FETCH`
- details:
  - `masterType`: `orca06-hokenja` / `orca06-address`
  - `httpStatus`, `emptyResult`, `resultCount`
  - `dataSource`, `snapshotVersion`, `version`, `missingMaster`, `fallbackUsed`
  - `queryPref`, `queryZip`, `keywordPresent`, `keywordLength`, `effective`

## テスト
- 単体テスト追加: `server-modernized/src/test/java/open/orca/rest/OrcaMasterResourceTest.java`
- 実行は別途（本 RUN では未実施）。
