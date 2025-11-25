# ORCA-05/06/08 フィールド対応マトリクス（DB 列 → API DTO → Web クライアント型）
- RUN_ID: 20251124T121500Z（親: 20251124T000000Z）
- 参照: `orca-master-orca05-06-08.yaml` / `artifacts/api-stability/20251123T130134Z/schemas/orca-master-*.json` / ORCA DB 定義書（2024-04-26 正式版優先、速報版 2024-09-25 は長期収載品カラム確認時のみ）。
- 対象: 薬剤分類・最低薬価・用法・特材・検査分類・保険者・住所・電子点数表。
- 表記方針: DB 列は論理名ベース（物理名が明確な箇所は併記）。OpenAPI DTO は必須/nullable/型を、UI 側は `web-client/src/types/orca.ts` 予定拡張を示す。

## 1. ORCA-05（薬剤分類/最低薬価/用法/特定器材/検査分類）
| フィールド | DB（テーブル/列・型） | OpenAPI DTO `DrugMasterEntry` | Web クライアント型 | 備考 |
| --- | --- | --- | --- | --- |
| コード | TBL_GENERIC_CLASS.`class_code` / TBL_GENERIC_PRICE.`srycd` / TBL_YOUHOU.`youhoucode` / TBL_MATERIAL*.`material_code` / TBL_KENSASORT.`kensa_code` (char 4–9) | `code` (string, required) | `Orca05MasterRecord.code` (string) | マスタ種別により桁数異なる。ソートキー。 |
| 名称 | 各テーブル `*_name` / `kana_name` (varchar 60) | `name` (string, required) | `Orca05MasterRecord.name` (string) | UI 検索は名称・カナに対する部分一致。 |
| 区分/種別 | CLASS.`category_code` / MATERIAL.`category` / KENSA.`classification` (char 2–4) | `category` (enum: generic/generic-price/youhou/material/kensa-sort, required) | `category?: string` | DTO では列挙で表現。 |
| 単位 | PRICE.`unit` / MATERIAL.`unit` (varchar 12) | `unit` (string, nullable) | `unit?: string` | 価格計算・数量表示に使用。 |
| 最低薬価 | PRICE.`price` (numeric) | `minPrice` (number, nullable) | `minPrice?: number|null` | 欠損時は null 応答。 |
| 用法コード | YOUHOU.`youhoucode` (char 4) | `youhouCode` (string, nullable) | `youhouCode?: string` | REST `/youhou` は `code/name` のペアを返却。 |
| 特材区分 | MATERIAL.`material_category` (char 2) | `materialCategory` (string, nullable) | `materialCategory?: string` | 償還/自費区分など。 |
| 検査分類コード | KENSA.`kensa_sort` (char 2) | `kensaSort` (string, nullable) | `kensaSort?: string` | 階層フィルタ。 |
| 有効開始/終了 | 各テーブル `start_date` / `end_date` (char 8, YYYYMMDD) | `validFrom` / `validTo` (string, required) | `validFrom?` / `validTo?` | 終端未設定は 99991231/99999999 を採用。 |
| 版/スナップショット | — | `meta.version` (string) | `version?: string` | 監査メタ経由。 |
| 監査メタ | 作成年月日/更新年月日 等 | `meta.*` (runId, dataSource, cacheHit, missingMaster, fetchedAt…) | `OrcaMasterAuditMeta` | UI 監査・バナー表示に利用。 |

### ORCA-05 ペイロード例・挙動メモ
- `/orca/master/generic-class` 例: code "211"/"21101"、`category=generic`、`validFrom=20240401`、`validTo=99991231`。
- `/orca/master/generic-price` 例: ヒット時 `minPrice=12.5`、未収載は `minPrice=null`＋`missingMaster=true` で返却。
- `/orca/master/youhou` 例: `code=10` 「1日1回 朝食後」。空配列可。
- `/orca/master/material` 例: `materialCategory="A1"`、`validTo=20250331`（期日切替を UI で警告）。
- `/orca/master/kensa-sort` 例: `kensaSort="11"` 血液検査大分類。検索キーは `keyword`（名称/カナ前方一致）+ `effective`。
- ソート/フィルタ: ORCA-05 共通で `code` 昇順、`keyword` は名称/カナの部分一致。null/空配列は 200 で返し、`missingMaster` で判定。

## 2. ORCA-06（保険者・住所）
| フィールド | DB（テーブル/列・型） | OpenAPI DTO | Web クライアント型 | 備考 |
| --- | --- | --- | --- | --- |
| 保険者番号 | TBL_HKNJAINF.`hknjanum` (char 8) | `InsurerEntry.payerCode` (required) | `insurerNumber` / `payerCode` | JIS X0401/0402 先頭 2 桁で都道府県を判別。 |
| 保険者名称/カナ | `hknjaname` / `hknjakana` (varchar) | `payerName` (req) | `insurerName` / `insurerKana?` | 部分一致検索対象。 |
| 区分 | `hknjakbn` (smallint) | `payerType` (enum) | `payerType?` | national_health/social_insurance/late_elderly 等。 |
| 負担率 | `hknjafutankeiritsu` (numeric3,1) | `payerRatio` (number, req) | `payerRatio?` | 例: 0.7。 |
| 住所系 | `pref_code` `city_code` `zip` `address` (char) | `prefCode` `cityCode` `zip` `addressLine` (req) | 同名フィールド | JIS X0401（都道府県2桁）/X0402（市区町村5桁）。 |
| 電話 | `tel` (varchar) | `phone` (nullable) | `phone?` | 任意。 |
| 有効期間 | `start_date` / `end_date` | `effectiveDate` パラメータで切替 | `validFrom?/validTo?` | DTO 必須ではないが UI では監査用に保持。 |

| フィールド | DB（テーブル/列・型） | OpenAPI DTO | Web クライアント型 | 備考 |
| --- | --- | --- | --- | --- |
| 郵便番号 | TBL_ADRS.`zip` (char7) | `AddressEntry.zip` (pattern ^\d{7}$, req) | `zip` / `zipCode` | 前方一致不可。完全一致のみ。 |
| 都道府県/市区町村コード | `pref_code` `city_code` (char2/5) | `prefCode` `cityCode` (req) | `prefCode?` `cityCode?` | JIS X0401/0402。 |
| 市区町村/町域 | `city` `town` (varchar) | `city` `town` (req) | 同名 | 空文字なし。 |
| カナ/ローマ字 | `kana` `roman` (varchar) | `kana` (req) `roman` (nullable) | 同名 | UI オートコンプリートに使用。 |
| 完全住所 | `full_address` (varchar) | `fullAddress` (req) | `fullAddress?` | 住所入力のデフォルト値。 |
| メタ | 更新日 | `meta.*` | `OrcaMasterAuditMeta` | 該当なし時は `{}` を返す (200) または 404。 |

### ORCA-06 ペイロード例・挙動メモ
- `/orca/master/hokenja` 例: payerCode "06123456", prefCode "01", `payerRatio=0.7`。ページングあり。空配列でも 200。
- `/orca/master/address` 例: zip=1000001 → fullAddress="東京都千代田区千代田"。該当なしは `{}`（200）または 404 エラー例あり。
- ソート/フィルタ: 保険者は `pref` + `keyword`（名称/カナ）、住所は zip 完全一致。データ欠損時 `missingMaster`/`fallbackUsed` で UI 警告。

## 3. ORCA-08（電子点数表）
| フィールド | DB（テーブル/列・型） | OpenAPI DTO `TensuEntry` | Web クライアント型 | 備考 |
| --- | --- | --- | --- | --- |
| 点数コード | TBL_ETENSU_1〜5.`srycd` (char 9) | `tensuCode` (req) | `Orca08EtensuRecord.tensuCode` | `keyword` 検索・ソートキー。 |
| 名称 | `name` (varchar) | `name` (req) | `name` | UI 表示ラベル。 |
| 区分 | `kubun` (char2) | `kubun` (req, pattern ^\d{2}$) | `kubun?` | 例: 11=診療,21=薬剤,31=特定器材。 |
| 単価/点数 | `tanka` (numeric) | `tanka` (number, req) | `tanka?: number|null` | 0 も有効。 |
| 単位 | `tani` (varchar) | `unit` (string, req) | `unit?` | 例: visit, dose。 |
| カテゴリ | `category` (varchar) | `category` (string, req) | `category?` | UI フィルタ用。 |
| 適用開始/終了 | `ymd_start` / `ymd_end` (char8) | `startDate` / `endDate` (req) | `startDate?/endDate?` | 99991231 終端可。 |
| 版 | `tensu_version` (char6) | `tensuVersion` (string, req) | `tensuVersion?` | 例: 202404。 |
| 監査メタ | 更新日時 | `meta.*` | `OrcaMasterAuditMeta` | cacheHit/missingMaster/fallbackUsed を必須評価。 |

### ORCA-08 ペイロード例・挙動メモ
- `/orca/tensu/etensu` 例: tensuCode "110000001"（初診料）、`kubun=11`、`tanka=288`、`tensuVersion=202404`。
- フィルタ: `keyword`（名称/コード部分一致）、`category`、`asOf`（YYYYMMDD 適用日）、`tensuVersion`、ページング。
- null/空配列: ヒットなしは 404 例レスまたは `totalCount=0` 想定。`missingMaster` で UI バナー表示。

## 4. 期待値・バリデーション（UI 実装メモ）
- Null/空配列: ORCA-05/06 では 200 + `items: []` / `{}` を許容し、`missingMaster=true` で監査送出。ORCA-08 は 404 例レスと空配列両方を許容。
- 桁あふれ: コード/日付は固定桁 (code 4–9 桁, date 8 桁)。超過は DTO パースエラーとして 400/422 想定。UI 側は入力マスクで防止。
- ソートキー: ORCA-05=`code`、ORCA-06=`payerCode,prefCode,cityCode`、ORCA-08=`tensuCode`。
- フィルタキー: `keyword`（名称/カナ）、`effective`/`asOf`（日付）、`category`（点数/薬効/特材/検査区分）、`pref`（保険者）。
- 監査メタ: `runId/snapshotVersion/dataSource/cacheHit/missingMaster/fallbackUsed/fetchedAt` を UI ログに透過。スナップショット/Mock 切替時は `dataSourceTransition` を残す。

## 5. ソース参照
- OpenAPI: `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`
- MSW フィクスチャ: `artifacts/api-stability/20251123T130134Z/schemas/orca-master-*.json`
- DB 定義: `docs/server-modernization/phase2/operations/assets/orca-db-schema/raw/database-table-definition-{20240426,20240925-fast}.pdf`
