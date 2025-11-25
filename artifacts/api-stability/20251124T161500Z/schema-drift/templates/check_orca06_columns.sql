-- ORCA-06 drift check template (保険者・住所)
-- 使用例: psql -v run_id=20251124T161500Z -v schema=public -f check_orca06_columns.sql
\pset format csv
\pset tuples_only on
\pset footer off

WITH expected_columns AS (
  -- TODO: 定義書 2024-04-26 に基づき期待カラムを列挙する
  SELECT * FROM (VALUES
    -- 保険者情報 (TBL_HKNJAINF_MASTER)
    ('tbl_hknjainf_master', 'hknjanum',         'character',          8,   NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'hknjaname',        'character varying',  200, NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'hknjaname_tan1',   'character varying',  100, NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'hknjaname_tan2',   'character varying',  40,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'hknjaname_tan3',   'character varying',  40,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'hknnum',           'character',          3,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'hon_gaikyurate',   'smallint',           NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'hon_nyukyurate',   'smallint',           NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'kzk_gaikyurate',   'smallint',           NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'kzk_nyukyurate',   'smallint',           NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'post',             'character varying',  7,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'adrs',             'character varying',  200, NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'banti',            'character varying',  200, NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'tel',              'character varying',  15,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'kigo',             'character varying',  80,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'idokbn',           'character varying',  1,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'idoymd',           'character varying',  8,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'termid',           'character varying',  16,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'opid',             'character varying',  16,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'creymd',           'character varying',  8,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'upymd',            'character varying',  8,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'uphms',            'character varying',  6,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_hknjainf_master', 'hospnum',          'smallint',           NULL, 16, 0,   'YES', NULL, '2024-04-26'),

    -- 住所 (TBL_ADRS)
    ('tbl_adrs', 'lpubcd',          'character varying', 5,   NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_adrs', 'post',            'character varying', 7,   NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_adrs', 'rennum',          'smallint',          NULL, 16, 0,   'NO',  NULL, '2024-04-26'),
    ('tbl_adrs', 'prefkana',        'character varying', 40,  NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_adrs', 'citykana',        'character varying', 200, NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_adrs', 'townkana',        'character varying', 400, NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_adrs', 'prefname',        'character varying', 20,  NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_adrs', 'cityname',        'character varying', 100, NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_adrs', 'townname',        'character varying', 200, NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_adrs', 'editadrs_kana',   'character varying', 640, NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_adrs', 'editadrs_name',   'character varying', 320, NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_adrs', 'towndivflg',      'character varying', 1,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_adrs', 'manytownflg',     'character varying', 1,   NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_adrs', 'hospnum',         'smallint',          NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_adrs', 'townname2',       'character varying', 1200,NULL, NULL, 'YES', NULL, '2024-04-26')
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
      -- TODO: ORCA-06 対象テーブルを列挙
      'tbl_hknjainf_master',
      'tbl_adrs'
    )
),
joined AS (
  SELECT
    :'run_id'::text AS run_id,
    'ORCA-06' AS master,
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
      WHEN a.table_name IS NULL THEN CASE WHEN e.column_name IN ('valid_from','valid_to') THEN 'validity_missing' ELSE 'missing_column' END
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
