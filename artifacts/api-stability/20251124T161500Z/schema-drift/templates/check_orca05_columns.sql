-- ORCA-05 drift check template (薬効/最低薬価/用法/特定器材/検査分類)
-- RUN_ID は -v run_id=20251124T161500Z などで渡す
-- スキーマは -v schema=public などで指定
-- 出力を CSV/JSON に切り替える場合は下記 pset を変更する
\pset format csv
\pset tuples_only on
\pset footer off

WITH expected_columns AS (
  -- TODO: 定義書 2024-04-26 を基に期待カラムを列挙する
  -- 例: table_name, column_name, data_type, char_len, num_precision, num_scale, is_nullable, column_default, source_version
  SELECT * FROM (VALUES
    -- 医薬品分類 (TBL_GENERIC_CLASS)
    ('tbl_generic_class', 'yakkakjncd', 'character varying', 12, NULL, NULL, 'NO', NULL, '2024-04-26'),
    ('tbl_generic_class', 'yukostymd',  'character varying', 8,  NULL, NULL, 'NO', NULL, '2024-04-26'),
    ('tbl_generic_class', 'yukoedymd',  'character varying', 8,  NULL, NULL, 'NO', NULL, '2024-04-26'),
    ('tbl_generic_class', 'kouhatu',    'smallint',          NULL, 16, 0,   'NO', NULL, '2024-04-26'),
    ('tbl_generic_class', 'upymd',      'character varying', 8,  NULL, NULL, 'YES', NULL, '2024-04-26'),

    -- 最低薬価 (TBL_GENERIC_PRICE)
    ('tbl_generic_price', 'yakkakjncd', 'character varying', 12, NULL, NULL, 'NO', NULL, '2024-04-26'),
    ('tbl_generic_price', 'yukostymd',  'character varying', 8,  NULL, NULL, 'NO', NULL, '2024-04-26'),
    ('tbl_generic_price', 'yukoedymd',  'character varying', 8,  NULL, NULL, 'NO', NULL, '2024-04-26'),
    ('tbl_generic_price', 'price',      'numeric',           NULL, 12, 3,   'NO', NULL, '2024-04-26'),
    ('tbl_generic_price', 'creymd',     'character varying', 8,  NULL, NULL, 'NO', NULL, '2024-04-26'),
    ('tbl_generic_price', 'upymd',      'character varying', 8,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_generic_price', 'gecode',     'character varying', 12, NULL, NULL, 'YES', NULL, '2024-04-26'),

    -- 用法 (TBL_YOUHOU)
    ('tbl_youhou', 'code',         'character varying', 16, NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_youhou', 'basic_c',      'character varying', 1,  NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_youhou', 'basic_name',   'character varying', 8,  NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_youhou', 'detail_c',     'character varying', 1,  NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_youhou', 'detail_name',  'character varying', 60, NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_youhou', 'timing_c',     'smallint',          NULL, 16, 0,   'NO',  NULL, '2024-04-26'),
    ('tbl_youhou', 'timing_name',  'character varying', 240,NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'name',         'character varying', 200,NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_youhou', 'refer_no',     'integer',           NULL, 32, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'yukostymd',    'character varying', 8,  NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_youhou', 'yukoedymd',    'character varying', 8,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'code_c',       'smallint',          NULL, 16, 0,   'NO',  NULL, '2024-04-26'),
    ('tbl_youhou', 'add_condition','smallint',          NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'add_timing',   'smallint',          NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'add_time',     'smallint',          NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'add_interval', 'smallint',          NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'add_body',     'smallint',          NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'kana',         'character varying', 480,NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'cd_chozai',    'smallint',          NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'termid',       'character varying', 16,NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'opid',         'character varying', 16,NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'creymd',       'character varying', 8,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'crehms',       'character varying', 6,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'upymd',        'character varying', 8,  NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_youhou', 'uphms',        'character varying', 6,  NULL, NULL, 'YES', NULL, '2024-04-26'),

    -- 特材品目算定品目 (TBL_MATERIAL_H_M)
    ('tbl_material_h_m', 'kanrino',    'bigint',            NULL, 64, 0,   'NO',  NULL, '2024-04-26'),
    ('tbl_material_h_m', 'jancd',      'character varying', 13,  NULL, NULL,'NO',  NULL, '2024-04-26'),
    ('tbl_material_h_m', 'snamecd',    'smallint',          NULL, 16, 0,   'NO',  NULL, '2024-04-26'),
    ('tbl_material_h_m', 'kikakucd',   'smallint',          NULL, 16, 0,   'NO',  NULL, '2024-04-26'),
    ('tbl_material_h_m', 'srycd',      'character',         9,   NULL, NULL,'NO',  NULL, '2024-04-26'),
    ('tbl_material_h_m', 'companycd1', 'smallint',          NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_material_h_m', 'companycd2', 'smallint',          NULL, 16, 0,   'YES', NULL, '2024-04-26'),
    ('tbl_material_h_m', 'dockanricd', 'character varying', 30,  NULL, NULL,'YES', NULL, '2024-04-26'),
    ('tbl_material_h_m', 'kinokbnno',  'character varying', 30,  NULL, NULL,'YES', NULL, '2024-04-26'),
    ('tbl_material_h_m', 'chgymd',     'character varying', 8,   NULL, NULL,'YES', NULL, '2024-04-26'),
    ('tbl_material_h_m', 'creymd',     'character varying', 8,   NULL, NULL,'YES', NULL, '2024-04-26'),
    ('tbl_material_h_m', 'upymd',      'character varying', 8,   NULL, NULL,'YES', NULL, '2024-04-26'),
    ('tbl_material_h_m', 'uphms',      'character varying', 6,   NULL, NULL,'YES', NULL, '2024-04-26'),

    -- 検査分類 (TBL_KENSASORT)
    ('tbl_kensasort', 'knsbunrui', 'numeric',   NULL, 2, 0,   'NO',  NULL, '2024-04-26'),
    ('tbl_kensasort', 'srycd',     'character', 9,    NULL, NULL, 'NO',  NULL, '2024-04-26'),
    ('tbl_kensasort', 'dspseq',    'numeric',   NULL, 4, 0,   'NO',  NULL, '2024-04-26'),
    ('tbl_kensasort', 'termid',    'character varying', 32, NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_kensasort', 'opid',      'character varying', 16, NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_kensasort', 'creymd',    'character', 8,    NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_kensasort', 'upymd',     'character', 8,    NULL, NULL, 'YES', NULL, '2024-04-26'),
    ('tbl_kensasort', 'uphms',     'character', 6,    NULL, NULL, 'YES', NULL, '2024-04-26')
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
      -- ORCA-05 対象テーブル（薬効/最低薬価/用法/特材/検査分類）
      'tbl_generic_class',
      'tbl_generic_price',
      'tbl_youhou',
      'tbl_material_h_m',
      'tbl_kensasort'
    )
),
joined AS (
  SELECT
    :'run_id'::text AS run_id,
    'ORCA-05' AS master,
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
