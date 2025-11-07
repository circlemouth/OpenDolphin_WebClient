-- information_schema を利用したカラム存在チェック
-- 本番/検証環境で `psql -f` あるいは手動実行し、Flyway `V0221__doc_module_flag_columns.sql` 適用要否を判定する。

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'd_document'
  AND column_name = 'admflag';

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'd_module'
  AND column_name = 'performflag';
