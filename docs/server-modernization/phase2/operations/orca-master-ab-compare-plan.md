# ORCA-05/06/08 マスタ A/B 比較計画（RUN_ID=`20251124T151500Z`, 親=`20251124T000000Z`）

## 目的とスコープ
- 対象: 薬剤分類・最低薬価・用法・特材・検査分類・住所・電子点数表（ORCA-05/06/08）。  
- 旧経路A: 旧 ORCA Resource / 現行 DB 直読（只読）を前提とした SQL 抜き取りまたは既存 REST（`/api/orca/master/*` が存在すれば利用）。  
- 新経路B: モダナイズ版 REST（OpenAPI `orca-master-orca05-06-08.yaml` 準拠）を `VITE_DEV_PROXY_TARGET` 経由または直接 cURL で呼び出す。  
- 目的: A/B 並行取得・件数/主要フィールド一致・並び順・null/空配列・監査メタ透過を評価し、SLA（P99・エラー率）とデータ整合性の判定基準を RUN_ID 一元で管理する。

## A/B 比較シナリオ一覧（検索キー 10〜20 件ずつ）
| マスタ | 旧経路A（例） | 新経路B（例） | キーセット（10〜20件・昇順で使用） | 差分観点 |
| --- | --- | --- | --- | --- |
| 薬剤分類/最低薬価/用法/特材/検査分類 (ORCA-05) | `psql "$LEGACY_ORCA_DSN" -c "SELECT * FROM tbl_generic_price WHERE srycd IN (...)"` または `/orca/master/generic-price` 等の既存エンドポイント | `curl -u "$BASIC_USER:$BASIC_PASS" "$NEW_BASE/orca/master/generic-price?srycd=XXXX"` ほか `generic-class` `youhou` `material` `kensa-sort` | srycd: `110000000,110000001,110000099,120100100,130000000,140000123,150999999` / youhou: `01,02,11,21,41` / material: `0101,0201,0701,9901` / kensa-sort: `01,02,03,05,09` | 件数・`name/category/unit/minPrice/youhouCode/materialCategory/kensaSort/validFrom/validTo/version` 一致、`minPrice` 欠損時の `missingMaster`、並び順（srycd 昇順）、監査メタ有無 |
| 保険者・住所 (ORCA-06) | `psql "$LEGACY_ORCA_DSN" -c "SELECT * FROM tbl_hokenja WHERE hknjanum IN (...)"` / `SELECT * FROM tbl_zip WHERE zip IN (...)` | `curl -u "$BASIC_USER:$BASIC_PASS" "$NEW_BASE/orca/master/hokenja?hknjanum=XXXX"` / `.../address?zip=XXXXX"` | hokenja: `01110126,01120112,01230567,13999999,32123456,40123456,52123456,61234567,73214567,99234567` / zip: `0600000,1000001,1500001,1600022,2210045,5310054,6500044,8120011,9000012,9896161` | 件数・`payerCode/payerName/payerType/payerRatio/prefCode/cityCode/zip/addressLine/version`、空配列時の `fallbackUsed`、`prefCode+cityCode` 並び順、null/空文字の扱い |
| 電子点数表 (ORCA-08) | `psql "$LEGACY_ORCA_DSN" -c "SELECT * FROM tbl_etensu_1 WHERE srycd IN (...)"` | `curl -u "$BASIC_USER:$BASIC_PASS" "$NEW_BASE/orca/tensu/ten?min=110000000&max=110000199&asOf=2025-04-01"` | srycd: `110000000,110000099,110000123,111000000,112000000,112000999,113999999,114000123,115000000,119999999,120000000,129000000,130000000,199999999` | 件数・`tensuCode/name/kubun/tanka/unit/category/startDate/endDate/tensuVersion/version`、空配列時の `missingMaster`、並び順（tensuCode 昇順）、単価の総計/中央値/最大値差分 |

## 判定項目と閾値
| 観点 | 判定基準 | 許容差分 |
| --- | --- | --- |
| 件数一致 | A と B の件数が一致（住所は zip 毎の件数一致） | ±1 レコードまで許容（zip が複数自治体に紐づく場合） |
| 主要フィールド一致 | 主要カラム（上表参照）が完全一致 | 0 件差分が理想。差分比率 ≤ 0.5% を暫定許容（再計測必須）。 |
| null / 空配列 | 空レスポンス時は `[]` かつ `missingMaster=true`/`fallbackUsed=true` を返却 | null 応答は禁止（REST 側は空配列）。 |
| 並び順 | ソートキー（srycd / payerCode→prefCode→cityCode / tensuCode）で昇順一致 | 許容なし。差異は API 側でソートを補正。 |
| 監査メタ | `runId` `dataSource` `snapshotVersion` `cacheHit` `missingMaster` `fallbackUsed` `fetchedAt` が B で必須。A は取得可否のみ記録。 | B に欠落があれば NG。 |

## SLA / 品質判定テーブル
| 指標 | 目標 | 警告 | エラー判定 |
| --- | --- | --- | --- |
| P99 レイテンシ | ≤ 2.5s (tensu), ≤ 1.5s (hokenja/address), ≤ 2.0s (generic-price 他) | +0.5s 超 | 目標 +1.0s 超または 5xx 連発 |
| エラー率 | < 0.5% （HTTP5xx/timeout） | 0.5%〜1% | 1% 超 |
| データ一致率 | 99.5% 以上（主要フィールド完全一致） | 99.0%〜99.5% | 99.0% 未満 |
| `missingMaster` 発生率 | < 1.0%（zip 空配列は除外） | 1.0%〜2.0% | 2.0% 超 |

## 成果物・保存ルール（RUN_ID をすべてのファイル名に付与）
- HAR: `artifacts/api-stability/20251124T151500Z/ab-compare/<master>/run-<RUN_ID>-<case>.har`
- JSON (生レス・整形後): `.../json/raw|normalized/run-<RUN_ID>-<master>-<case>.json`
- diff (jq / zod 検証結果): `.../diff/run-<RUN_ID>-<master>-<case>.json`
- csv 集計: `.../summary/run-<RUN_ID>-<master>-metrics.csv`（件数・中央値・最大値・一致率）
- ハッシュ: `.../hashes/run-<RUN_ID>-<master>.sha256`（フィールド順固定で JSON 文字列化後に算出）
- ログ追記先: `docs/server-modernization/phase2/operations/logs/20251123T135709Z-webclient-master-bridge.md#run_id-20251124t151500z-ab-compare-draft`

## 実行手順（雛形コマンド）
```bash
export RUN_ID=20251124T151500Z
export LEGACY_ORCA_DSN="postgres://ormaster:***@127.0.0.1:5432/orca?sslmode=disable"  # 旧経路A
export NEW_BASE="http://127.0.0.1:8000"                                                # 新経路B
export AUTH="ormaster:change_me"                                                      # BASIC 認証（仮）

# 例: ORCA-05 generic-price A/B 取得（srycd リストは上表から）
srycds=(110000000 110000001 110000099 120100100 130000000 140000123 150999999)
printf '%s\n' "${srycds[@]}" | xargs -I{} -P4 sh -c '
  code={}
  # A: DB 抜き取り
  psql "$LEGACY_ORCA_DSN" -c "SELECT * FROM tbl_generic_price WHERE srycd='\''${code}'\''" \
    > "artifacts/api-stability/$RUN_ID/ab-compare/orca05/raw/run-${RUN_ID}-A-${code}.sql.txt"
  # B: 新 REST
  curl -u "$AUTH" -sS "$NEW_BASE/orca/master/generic-price?srycd=${code}" \
    -D "artifacts/api-stability/$RUN_ID/ab-compare/orca05/raw/run-${RUN_ID}-B-${code}.hdr" \
    -o "artifacts/api-stability/$RUN_ID/ab-compare/orca05/raw/run-${RUN_ID}-B-${code}.json"
'

# 正規化・ハッシュ（整形用 jq 例）
jq -S '.[] | {code,name,category,unit,minPrice,youhouCode,materialCategory,kensaSort,validFrom,validTo,version,dataSource,cacheHit,missingMaster,fallbackUsed}' \
  artifacts/api-stability/$RUN_ID/ab-compare/orca05/raw/run-${RUN_ID}-B-*.json \
  | jq -s 'sort_by(.code)' \
  > artifacts/api-stability/$RUN_ID/ab-compare/orca05/normalized/run-${RUN_ID}-B.json
sha256sum artifacts/api-stability/$RUN_ID/ab-compare/orca05/normalized/run-${RUN_ID}-B.json \
  > artifacts/api-stability/$RUN_ID/ab-compare/orca05/hashes/run-${RUN_ID}-B.sha256
```
- 住所と点数表も同様に zip / srycd リストを差し替えて実行。  
- 並列度は `-P4` 目安（P99 測定のため 3 回繰り返し実行し中央値を採用）。  
- jq 正規化はフィールド順固定のうえで sha256 を算出し、A/B を `diff` または `cmp` で比較。  
- 監査メタ (`dataSource` など) が欠落していれば REST 側のバグとしてログへ記録。

## 判定・報告フォーマット
| 項目 | 内容 |
| --- | --- |
| runId | 20251124T151500Z（親=20251124T000000Z） |
| ケース | ORCA-05 generic-price / youhou / material / kensa-sort, ORCA-06 hokenja / address, ORCA-08 tensu |
| 一致率 | 件数・主要フィールド一致率（%） |
| 差分概要 | srycd/payerCode/tensuCode 単位の欠落・値差分・並び差分を列挙 |
| SLA | P99, エラー率（%）, missingMaster/fallbackUsed 発生率 |
| 成果物 | HAR/JSON/csv/hash への相対パス |
| 判定 | PASS / WARN / FAIL（理由付き） |

## 実施前チェック
- `AGENTS.md` の制約（Python 実行禁止・サーバー配下非改変・接続先は mac-dev）を遵守。  
- `VITE_DISABLE_MSW=1` で MSW を無効化し、新 REST が到達可能な状態を確認。  
- 旧経路Aの DB 参照は **読取専用** で実行し、更新系 SQL を禁止。  
- すべてのファイル名・ログに RUN_ID を含め、DOC_STATUS 備考とログへ同一値で記録する。
