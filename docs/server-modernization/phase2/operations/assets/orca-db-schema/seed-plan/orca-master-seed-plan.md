# ORCA-05/06/08 結合テスト用シード計画（RUN_ID=20251124T130000Z, 親=20251124T000000Z）

目的: ORCA-05/06/08 の結合テストで最低限必要なマスターデータを ORMaster/CI 環境に投入できるよう、テーブル・主要列・サンプル値・依存関係・クリーニング手順を整理する。DB スキーマは ORCA 正式版 2024-04-26 を前提とし、追加列は `field-mapping/orca-master-field-matrix.md` に準拠する。

## 1. シード対象マスタ一覧
| 種別 | テーブル | 主要列 | サンプル値 (RUN_ID=20251124T130000Z) | 依存/備考 |
| --- | --- | --- | --- | --- |
| 薬剤分類 (generic-class) | `TBL_GENERIC_CLASS` | `class_code`, `class_name`, `category_code`, `unit`, `start_date`, `end_date`, `note` | `211` / `降圧薬` / `generic` / `tablet` / `20240401` / `99991231` / `seed-run-20251124T130000Z` | 親分類→子分類の階層（例: `21101` ACE 阻害薬）。`category_code` は 2〜4 桁で管理。 |
| 最低薬価 (generic-price) | `TBL_GENERIC_PRICE` | `srycd`, `name`, `unit`, `price`, `youhoucode`, `start_date`, `end_date` | `610008123` / `アムロジピン錠 5mg` / `TAB` / `12.5` / `Y003` / `20240401` / `99991231` | `srycd` は薬剤コード。`youhoucode` は用法コードに外部キー相当。`price` null も許容（未収載）。 |
| 用法 | `TBL_YOUHOU` | `youhoucode`, `youhouname`, `start_date`, `end_date`, `kana_name` | `10` / `1日1回 朝食後` / `20240401` / `99991231` / `イチニチイッカイ チョウショクゴ` | `youhoucode` を薬価シードと整合させる（例: `Y003` → `10`）。 |
| 特定器材 | `TBL_MATERIAL` | `material_code`, `material_name`, `material_category`, `unit`, `price`, `start_date`, `end_date`, `maker` | `5001001` / `注射器 2.5mL` / `A1` / `EA` / `35.0` / `20240401` / `20250331` / `seed-maker` | `material_category` は償還区分。価格 0 も可。 |
| 検査分類 | `TBL_KENSASORT` | `kensa_code`, `kensa_name`, `kensa_sort`, `start_date`, `end_date` | `1101` / `血液検査` / `11` / `20240401` / `99991231` | `kensa_sort` は2桁分類コード。 |
| 保険者 | `TBL_HKNJAINF` | `hknjanum`, `hknjaname`, `hknjakbn`, `hknjafutankeiritsu`, `pref_code`, `city_code`, `zip`, `address`, `tel`, `start_date`, `end_date` | `06123456` / `札幌市国民健康保険` / `1`(national_health) / `0.7` / `01` / `01100` / `0600001` / `北海道札幌市中央区北一条西2` / `011-123-4567` / `20240401` / `99991231` | `hknjakbn` は区分（1=国保, 2=社保 等）。UI 用にカナ列があれば同時投入。 |
| 住所 | `TBL_ADRS` | `zip`, `pref_code`, `city_code`, `city`, `town`, `kana`, `roman`, `full_address`, `start_date`, `end_date` | `1000001` / `13` / `13101` / `千代田区` / `千代田` / `チヨダク チヨダ` / `Chiyoda-ku Chiyoda` / `東京都千代田区千代田` / `20240401` / `99991231` | 郵便番号完全一致で参照。`roman` は null 可。 |
| 電子点数表 | `TBL_ETENSU_1`（例: 診療区分） | `srycd`, `kubun`, `name`, `tanka`, `tani`, `category`, `ymd_start`, `ymd_end`, `tensu_version` | `110000001` / `11` / `初診料` / `288` / `visit` / `診察` / `20240401` / `99991231` / `202404` | 区分ごとに `TBL_ETENSU_1~5` を使用。`kubun`=11/21/31… で区別。 |

## 2. 依存関係と投入順序
1. **基礎コード**: 用法 (`TBL_YOUHOU`)、検査分類 (`TBL_KENSASORT`)、特材分類 (`TBL_MATERIAL` の category) を先に挿入。
2. **薬剤系**: 薬剤分類 (`TBL_GENERIC_CLASS`) → 最低薬価 (`TBL_GENERIC_PRICE`) の順に投入。`generic-price.youhoucode` は存在する用法コードへ合わせる。
3. **保険/住所**: 住所 (`TBL_ADRS`) → 保険者 (`TBL_HKNJAINF`)。保険者は `pref_code/city_code/zip` を住所と整合させる。
4. **電子点数表**: 区分別に `TBL_ETENSU_1~5` へ投入。`tensu_version` と有効期間を共通化（例: 202404 版）。
5. **監査メタ**: 監査用 `runId` や `version` は DB には保持しないため、CI 実行時に API 層で付与する（本計画では DB シードのみ）。

## 3. クリーニング手順（再投入用）
- 各テーブルに `note` もしくはカスタムタグ列がある場合は `note LIKE 'seed-run-20251124T130000Z%'` を付与し、削除しやすくする。
- 再投入前に以下を実行（例: PostgreSQL）：
  ```sql
  DELETE FROM TBL_GENERIC_PRICE  WHERE name LIKE '%seed-run-20251124T130000Z%';
  DELETE FROM TBL_GENERIC_CLASS  WHERE note LIKE 'seed-run-20251124T130000Z%';
  DELETE FROM TBL_YOUHOU         WHERE youhouname LIKE '%seed-run-20251124T130000Z%';
  DELETE FROM TBL_MATERIAL       WHERE maker = 'seed-maker' AND start_date='20240401';
  DELETE FROM TBL_KENSASORT      WHERE kensa_name LIKE '%seed-run-20251124T130000Z%';
  DELETE FROM TBL_HKNJAINF       WHERE hknjanum='06123456';
  DELETE FROM TBL_ADRS           WHERE zip='1000001' AND full_address LIKE '%seed-run-20251124T130000Z%';
  DELETE FROM TBL_ETENSU_1       WHERE srycd IN ('110000001','110000101');
  ```
- クリーニング後に `VACUUM ANALYZE` を推奨（CI では任意）。

## 4. テンプレートとの対応
- SQL/CSV 雛形を `artifacts/api-stability/20251124T130000Z/seed/templates/` に配置。
- 列順は上記「主要列」に合わせ、文字コードは UTF-8、改行は LF。
- テンプレートから生成する実データは **本計画 RUN_ID をファイル名/コメントに明示** する（例: `seed-orca05-20251124T130000Z.sql`）。

## 5. CI・ローカル投入の想定パス
- ローカル ORMaster: `psql -h 127.0.0.1 -U ormaster -d ormaster -f seed.sql`
- docker-compose（例: service 名 `orca-db`）: `docker exec -i orca-db psql -U ormaster -d ormaster -f /tmp/seed.sql`
- CI では `artifacts/api-stability/20251124T130000Z/seed/templates/README.md` 記載のコマンド例を使用し、投入前後で件数差分をログ出力する。

## 6. 留意事項
- Python スクリプトは禁止。シード生成は SQL/CSV 手作業またはシェル/Node 簡易スクリプトで行う。
- サーバー実装や Legacy 資産 (`server/`, `client/`, `common/`, `ext_lib/`) は変更しない。
- 住所/保険者コードは JIS X0401/0402 準拠。点数表は 2024-04 版を基準とし、将来版を追加する場合は `tensu_version` でバージョン分けする。
