-- ORCA-08 drift check template (電子点数表・診療行為区分)
-- RUN_ID / schema を psql -v で指定して実行する
\pset format csv
\pset tuples_only on
\pset footer off

WITH expected_columns AS (
  -- TODO: 定義書 2024-04-26 に基づき期待カラムを列挙する
  SELECT * FROM (VALUES
    -- 点数 (TBL_TENSU)
    ('tbl_tensu', 'srycd',       'character',          9,   NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_tensu', 'yukostymd',   'character',          8,   NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_tensu', 'yukoedymd',   'character',          8,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_tensu', 'srykbn',      'character',          2,   NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_tensu', 'srysyukbn',   'character',          3,   NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_tensu', 'name',        'character varying',  200, NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_tensu', 'kananame',    'character varying',  200, NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_tensu', 'ten',         'numeric',            NULL, 11, 0,    'NO',  NULL, '2024-04-26'),
    ('tbl_tensu', 'tanicd',      'character',          3,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_tensu', 'taniname',    'character varying',  24,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_tensu', 'datakbn',     'smallint',           NULL, 16, 0,    'YES', NULL, '2024-04-26'),
    ('tbl_tensu', 'hkntekkbn',   'smallint',           NULL, 16, 0,    'YES', NULL, '2024-04-26'),
    ('tbl_tensu', 'nyugaitekkbn','smallint',           NULL, 16, 0,    'YES', NULL, '2024-04-26'),
    ('tbl_tensu', 'routekkbn',   'smallint',           NULL, 16, 0,    'YES', NULL, '2024-04-26'),
    ('tbl_tensu', 'hospsrykbn',  'smallint',           NULL, 16, 0,    'YES', NULL, '2024-04-26')
  ) AS v(table_name, column_name, data_type, char_len, num_precision, num_scale, is_nullable, column_default, source_version)
),
actual_columns AS (
  SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
  FROM information_schema.columns
  WHERE table_schema = :'schema'
    AND table_name IN (
      -- ORCA-08 対象テーブル（点数）
      'tbl_tensu'
    )
),
joined AS (
  SELECT
    :'run_id'::text AS run_id,
    'ORCA-08' AS master,
    COALESCE(e.table_name, a.table_name) AS table_name,
    COALESCE(e.column_name, a.column_name) AS column_name,
    e.data_type AS expected_type,
    a.data_type AS actual_type,
    e.char_len AS expected_length,
    a.character_maximum_length AS actual_length,
    e.num_precision AS expected_precision,
    a.numeric_precision AS actual_precision,
    e.num_scale AS expected_scale,
    a.numeric_scale AS actual_scale,
    e.is_nullable AS expected_nullable,
    a.is_nullable AS actual_nullable,
    e.column_default AS expected_default,
    a.column_default AS actual_default,
    e.source_version,
    CASE
      WHEN a.table_name IS NULL THEN CASE WHEN e.column_name IN ('valid_from','valid_to','start_date','end_date') THEN 'validity_missing' ELSE 'missing_column' END
      WHEN e.table_name IS NULL THEN 'extra_column'
      WHEN e.data_type IS DISTINCT FROM a.data_type THEN 'type_mismatch'
      WHEN e.char_len IS DISTINCT FROM a.character_maximum_length THEN 'length_mismatch'
      WHEN e.num_precision IS DISTINCT FROM a.numeric_precision OR e.num_scale IS DISTINCT FROM a.numeric_scale THEN 'precision_mismatch'
      WHEN e.is_nullable IS DISTINCT FROM a.is_nullable THEN 'nullability_mismatch'
      WHEN COALESCE(e.column_default,'') IS DISTINCT FROM COALESCE(a.column_default,'') THEN 'default_mismatch'
      ELSE 'match'
    END AS diff_kind
  FROM expected_columns e
  FULL OUTER JOIN actual_columns a
    ON e.table_name = a.table_name AND e.column_name = a.column_name
)
SELECT
  run_id, master, table_name, column_name, diff_kind,
  expected_type, actual_type,
  expected_length, actual_length,
  expected_precision, actual_precision,
  expected_scale, actual_scale,
  expected_nullable, actual_nullable,
  expected_default, actual_default,
  source_version
FROM joined
WHERE diff_kind <> 'match'
ORDER BY table_name, column_name;
