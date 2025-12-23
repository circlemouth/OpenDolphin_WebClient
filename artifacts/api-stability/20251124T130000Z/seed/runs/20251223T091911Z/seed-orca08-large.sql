-- RUN_ID=20251223T091911Z (ORCA-08 large seed)
-- Generate many rows for TBL_ETENSU_1 to validate large response behavior.
BEGIN;
INSERT INTO TBL_ETENSU_1 (srycd, kubun, name, tanka, tani, category, ymd_start, ymd_end, tensu_version)
SELECT
  lpad((990000000 + gs)::text, 9, '0') AS srycd,
  '99' AS kubun,
  '負荷テスト' || gs AS name,
  100 + (gs % 50) AS tanka,
  'unit' AS tani,
  '負荷' AS category,
  '20240401' AS ymd_start,
  '99991231' AS ymd_end,
  '202404' AS tensu_version
FROM generate_series(1, 5000) AS gs;
COMMIT;
