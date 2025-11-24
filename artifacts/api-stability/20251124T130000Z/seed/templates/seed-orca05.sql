-- RUN_ID=20251124T130000Z (ORCA-05 seed template)
-- 薬剤分類 / 最低薬価 / 用法 / 特定器材 / 検査分類

BEGIN;

-- 用法 (TBL_YOUHOU)
INSERT INTO TBL_YOUHOU (youhoucode, youhouname, kana_name, start_date, end_date)
VALUES ('10', '1日1回 朝食後', 'イチニチイッカイ チョウショクゴ', '20240401', '99991231');

-- 薬剤分類 (TBL_GENERIC_CLASS)
INSERT INTO TBL_GENERIC_CLASS (class_code, class_name, category_code, unit, start_date, end_date, note)
VALUES
  ('211', '降圧薬', 'generic', 'tablet', '20240401', '99991231', 'seed-run-20251124T130000Z'),
  ('21101', 'ACE 阻害薬', 'generic', 'tablet', '20240401', '99991231', 'seed-run-20251124T130000Z');

-- 最低薬価 (TBL_GENERIC_PRICE)
INSERT INTO TBL_GENERIC_PRICE (srycd, name, unit, price, youhoucode, start_date, end_date)
VALUES
  ('610008123', 'アムロジピン錠 5mg', 'TAB', 12.5, '10', '20240401', '99991231'),
  ('699999999', '未収載薬', 'TAB', NULL, NULL, '20240401', '99991231');

-- 特定器材 (TBL_MATERIAL)
INSERT INTO TBL_MATERIAL (material_code, material_name, material_category, unit, price, start_date, end_date, maker)
VALUES
  ('5001001', '注射器 2.5mL', 'A1', 'EA', 35.0, '20240401', '20250331', 'seed-maker');

-- 検査分類 (TBL_KENSASORT)
INSERT INTO TBL_KENSASORT (kensa_code, kensa_name, kensa_sort, start_date, end_date)
VALUES ('1101', '血液検査', '11', '20240401', '99991231');

COMMIT;
