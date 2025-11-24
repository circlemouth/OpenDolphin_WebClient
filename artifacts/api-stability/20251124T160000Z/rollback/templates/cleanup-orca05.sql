\set ON_ERROR_STOP on
-- RUN_ID: 20251124T160000Z (parent=20251124T000000Z)
-- Scope: ORCA-05 薬剤分類/最低薬価/用法/特定器材/検査分類 シード撤回
-- Dry-run: コメントを外す前に "SELECT" ブロックで件数確認。run_id_tag を実投入時に置換。
-- psql -v run_id_tag="seed-run-20251124T130000Z" -f cleanup-orca05.sql

-- ===== Dry-run (件数確認) =====
-- SELECT 'TBL_GENERIC_PRICE' AS table, count(*) FROM TBL_GENERIC_PRICE  WHERE name LIKE '%' || :'run_id_tag' || '%';
-- SELECT 'TBL_GENERIC_CLASS' AS table, count(*) FROM TBL_GENERIC_CLASS  WHERE note LIKE  :'run_id_tag' || '%';
-- SELECT 'TBL_YOUHOU'        AS table, count(*) FROM TBL_YOUHOU       WHERE youhouname LIKE '%' || :'run_id_tag' || '%';
-- SELECT 'TBL_MATERIAL'      AS table, count(*) FROM TBL_MATERIAL     WHERE maker = 'seed-maker' AND start_date='20240401';
-- SELECT 'TBL_KENSASORT'     AS table, count(*) FROM TBL_KENSASORT    WHERE kensa_name LIKE '%' || :'run_id_tag' || '%';

BEGIN;
  -- 実行前に Dry-run で件数を確認すること
  DELETE FROM TBL_GENERIC_PRICE  WHERE name LIKE '%' || :'run_id_tag' || '%';
  DELETE FROM TBL_GENERIC_CLASS  WHERE note LIKE  :'run_id_tag' || '%';
  DELETE FROM TBL_YOUHOU         WHERE youhouname LIKE '%' || :'run_id_tag' || '%';
  DELETE FROM TBL_MATERIAL       WHERE maker = 'seed-maker' AND start_date='20240401';
  DELETE FROM TBL_KENSASORT      WHERE kensa_name LIKE '%' || :'run_id_tag' || '%';

  -- 依存テーブルがある場合はここに追加（例: 薬効階層、特材カテゴリマスター）

  -- 必要に応じて VACUUM ANALYZE を別トランザクションで実行
COMMIT;
