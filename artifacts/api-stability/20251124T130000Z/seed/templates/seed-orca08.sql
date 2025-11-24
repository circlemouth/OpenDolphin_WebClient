-- RUN_ID=20251124T130000Z (ORCA-08 seed template)
-- 電子点数表 (例: TBL_ETENSU_1)

BEGIN;

INSERT INTO TBL_ETENSU_1 (srycd, kubun, name, tanka, tani, category, ymd_start, ymd_end, tensu_version)
VALUES
  ('110000001', '11', '初診料', 288, 'visit', '診察', '20240401', '99991231', '202404'),
  ('110000101', '11', '再診料', 75, 'visit', '診察', '20240401', '99991231', '202404');

COMMIT;
