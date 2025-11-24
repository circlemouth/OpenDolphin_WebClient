# ORCA-05/06/08 コード体系レビュー（RUN_ID=20251124T163000Z, 親=20251124T000000Z）

参照チェーン: `AGENTS.md` → `docs/web-client/README.md` → `docs/server-modernization/phase2/INDEX.md` → `docs/managerdocs/PHASE2_MANAGER_ASSIGNMENT_OVERVIEW.md` → `docs/server-modernization/phase2/operations/assets/orca-db-schema/README.md` → `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`  
出典: ORCA DB 定義書 2024-04-26 正式版（速報 2024-09-25 は桁長補強確認のみ）、`field-mapping/orca-master-field-matrix.md`、OpenAPI 正式版 YAML。

## 1. コード体系一覧と桁・制約

| 対象マスタ | 外部コード体系 | ORCA DB 列 (型) | 桁・制約 | 備考 |
| --- | --- | --- | --- | --- |
| 薬効分類 (generic-class) | 厚労省薬効分類コード | `class_code` (char) | 3–5 桁数字（例: 211 / 21101） | 階層化（3 桁大分類 + 2 桁細分類）。 |
| 薬価・最低薬価 (generic-price) | 診療行為コード SRYCD | `srycd` (char9) | 9 桁数字固定 | 先頭 2 桁は診療行為区分。 |
| 用法 | ORCA 用法コード | `youhoucode` (char4) | 数字 2–4 桁想定（DB 定義 char4） | OpenAPI では長さ制約未定義。 |
| 特定器材 | 保険医療材料コード | `material_code` (char7) | 7 桁数字固定 | `material_category` は英数2桁（例: A1）。 |
| 検査分類 | ORCA 検査分類コード | `kensa_code` (char4) / `kensa_sort`(char2) | 大分類2桁 + 小分類4桁（例: 11 / 1101） | UI は小分類 4 桁で検索。 |
| 保険者 | JIS X0401/0402 先頭付与の保険者番号 | `hknjanum` (char8) | 8 桁数字固定。先頭2桁=都道府県(JIS X0401) | `payerType` は列挙 (national_health 等)。 |
| 住所 | 郵便番号/JIS X0401/0402 | `zip`(char7), `pref_code`(char2), `city_code`(char5) | zip は 7 桁数字固定。pref 2 桁 / city 5 桁数字 | 空ヒット時は `{}` または 404。 |
| 電子点数表 | 診療行為コード SRYCD | `srycd` (char9) | 9 桁数字固定 | `kubun` 2 桁数字（11/21/31 等）。`tensuVersion` 6 桁 (YYYYMM)。 |

## 2. 外部コード → システム内コードの突合ポイント

- **JIS X0401/0402 → prefCode/cityCode**: 保険者・住所両方で必須。先頭 2 桁が不一致の場合は 422 にすべき。UI では pref 選択後に city の先頭 2 桁一致を強制。
- **薬効分類 (3/5 桁) → SRYCD (9 桁)**: 最低薬価検索時に親分類コード入力を許可する場合、SRYCD 先頭 3–5 桁で前方一致フィルタをかけ、ヒット 0 件は `missingMaster=true` とする。
- **用法コード → youhouCode**: 既存オーダ入力の用法コード（2–4 桁）を ORCA 用法マスタへマッピング。未知コードは UI 側で手入力許可＋ `fallbackUsed=true`。
- **特定器材カテゴリー (A1 等) → material_category**: 別紙区分コードをそのまま収容。英数字以外は保存前にエラー。区分から償還/自費を導出するマッピング表は別途 seeds で管理。
- **検査分類 (11 / 1101)**: UI は 4 桁小分類で検索し、返却の `kensaSort` 2 桁をカテゴリフィルタに使用。2 桁のみ入力時は小分類先頭一致で補完。
- **保険者番号 → payerType**: 先頭 2 桁が社保（01–09 以外）でも `payerType` と整合するかチェック。例: 後期高齢の payerRatio=0.1 以外は 422。
- **SRYCD → tensuCode**: 電子点数表・最低薬価で共通。9 桁未満/超過は 400/422。オーダ計算では `kubun` 2 桁との組み合わせで重複防止。

## 3. バリデーション草案（OpenAPI schema への反映候補）

| フィールド | 候補パターン/制約 | サーバー応答 | UI 入力/フィルタ |
| --- | --- | --- | --- |
| generic-class `code` | `^\\d{3}(\\d{2})?$` | 400 (pattern mismatch) | 3桁/5桁以外は即時エラー。 |
| generic-price/material/etensu `code`/`tensuCode` | `^\\d{9}$` | 400 | 9 桁固定マスク。 |
| youhouCode | `^\\d{2,4}$` | 422 (unknown code) | 2–4 桁で入力。候補なしはワーニングで保存ブロック可。 |
| materialCategory | `^[A-Z0-9]{2}$` | 400 | 全角/記号は入力不可。 |
| kensaSort | `^\\d{2}$` / 小分類 `^\\d{4}$` | 400 | 2 桁指定時は階層検索、4 桁指定時は完全一致。 |
| payerCode | `^\\d{8}$` + 先頭2桁=JIS X0401 | 422 | 8 桁固定。pref 選択と連動して prefix を自動入力。 |
| prefCode | `^(0[1-9]|[1-3][0-9]|4[0-7])$` | 400 | プルダウンのみ。 |
| cityCode | `^\\d{5}$` かつ `prefCode` 先頭一致 | 422 | pref 変更時に city をクリア。 |
| zip | `^\\d{7}$` | 404/200 `{}` | ハイフンを除去し 7 桁必須。 |
| kubun | `^\\d{2}$` | 400 | 2 桁固定。 |
| tensuVersion | `^\\d{6}$` (YYYYMM) | 400 | カレンダーから選択。 |

- チェックディジットは対象外（ORCA 定義書に明示なし）。
- null/空配列は 200 で返却し `missingMaster=true` を監査メタで通知（OpenAPI 例に準拠）。

## 4. UI / サーバー判定のラフ

- **入力側 (UI)**: 上記パターンを入力マスクまたは前処理で強制。`/` や全角を含む場合は送信前にブロックし、`warning` トーンでフィードバック。
- **サーバー側 (400/422)**: パターン不一致は 400、体系上存在しないコード（例: JIS 県コードと不整合、市区町村コード未登録、payerType と番号が矛盾）は 422。`missingMaster` は 200 で返す。
- **E2E テスト観点**: 3 境界（最小桁/最大桁/不正桁） + 空配列/`{}` + 404 を用意し、`dataSource`/`missingMaster`/`fallbackUsed` の値を契約テストで確認。

## 5. 追記予定の OpenAPI/実装タスク

- OpenAPI `DrugMasterEntry.code`: `pattern: "^\\d{3}(\\d{2})?$"` を追加し、`youhouCode`/`materialCategory`/`kensaSort`/`tensuCode`/`payerCode`/`tensuVersion` に上記パターンを付与する。
- `/orca/master/hokenja` パラメータ `pref`: pattern `^(0[1-9]|[1-3][0-9]|4[0-7])$` を追加。`cityCode` はレスポンスのみだが、サーバー実装で整合チェックを入れる。
- `/orca/master/address` の 404 例は維持しつつ、200 `{}` 返却時の `missingMaster=true` を監査メタに明文化（YAML description 追記）。
- UI 側: `src/webclient_modernized_bridge` で入力マスクと 422/400 のメッセージマップを共通化し、Charts/受付/点数検索で共有する。

## 6. 証跡
- RUN_ID: 20251124T163000Z（親 20251124T000000Z）
- 参照: `docs/server-modernization/phase2/operations/assets/openapi/orca-master-orca05-06-08.yaml`, `docs/server-modernization/phase2/operations/assets/orca-db-schema/field-mapping/orca-master-field-matrix.md`

