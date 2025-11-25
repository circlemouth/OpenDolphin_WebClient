\set ON_ERROR_STOP on
-- RUN_ID: 20251124T160000Z (parent=20251124T000000Z)
-- Scope: ORCA-08 電子点数表 シード撤回（TBL_ETENSU_1~5）
-- Dry-run: tensu_version か run_id_tag を指定して対象を限定する。
-- psql -v tensu_version="202404" -v run_id_tag="seed-run-20251124T130000Z" -f cleanup-orca08.sql

-- ===== Dry-run (件数確認) =====
-- SELECT 'TBL_ETENSU_1' AS table, count(*) FROM TBL_ETENSU_1 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';
-- SELECT 'TBL_ETENSU_2' AS table, count(*) FROM TBL_ETENSU_2 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';
-- SELECT 'TBL_ETENSU_3' AS table, count(*) FROM TBL_ETENSU_3 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';
-- SELECT 'TBL_ETENSU_4' AS table, count(*) FROM TBL_ETENSU_4 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';
-- SELECT 'TBL_ETENSU_5' AS table, count(*) FROM TBL_ETENSU_5 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';

BEGIN;
  DELETE FROM TBL_ETENSU_1 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';
  DELETE FROM TBL_ETENSU_2 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';
  DELETE FROM TBL_ETENSU_3 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';
  DELETE FROM TBL_ETENSU_4 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';
  DELETE FROM TBL_ETENSU_5 WHERE tensu_version=:'tensu_version' OR name LIKE '%' || :'run_id_tag' || '%';
  -- index / analyze は別トランザクションで実行
COMMIT;
