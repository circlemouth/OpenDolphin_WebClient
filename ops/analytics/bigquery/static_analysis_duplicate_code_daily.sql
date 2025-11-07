-- static_analysis_duplicate_code_daily.sql
-- CPD Nightly メトリクスを BigQuery 本テーブルへ反映する MERGE ステートメント。
--
-- 前提:
-- 1. `cpd-metrics.sh` で生成した JSON を `static_analysis.duplicate_code_staging`
--    (スキーマ: job_name STRING, build_number INT64, build_url STRING, git_branch STRING,
--               git_commit STRING, generated_at TIMESTAMP, duplicate_lines INT64,
--               duplication_count INT64, file_count INT64,
--               modules ARRAY<STRUCT<name STRING, file_count INT64>>)
--    へロード済みであること。
-- 2. 本番集計テーブル `static_analysis.duplicate_code_daily` のスキーマは以下:
--      report_date DATE
--      job_name STRING
--      build_number INT64
--      build_url STRING
--      git_branch STRING
--      git_commit STRING
--      duplicate_lines INT64
--      duplication_count INT64
--      file_count INT64
--      modules ARRAY<STRUCT<name STRING, file_count INT64>>
--      generated_ts TIMESTAMP
--      ingested_at TIMESTAMP
--
-- 使用方法:
--   bq query --use_legacy_sql=false < ops/analytics/bigquery/static_analysis_duplicate_code_daily.sql

MERGE `static_analysis.duplicate_code_daily` AS TARGET
USING (
  SELECT
    DATE(TIMESTAMP(generated_at)) AS report_date,
    job_name,
    build_number,
    build_url,
    git_branch,
    git_commit,
    duplicate_lines,
    duplication_count,
    file_count,
    modules,
    TIMESTAMP(generated_at) AS generated_ts,
    CURRENT_TIMESTAMP() AS ingested_at
  FROM `static_analysis.duplicate_code_staging`
) AS SOURCE
ON TARGET.report_date = SOURCE.report_date
   AND TARGET.job_name = SOURCE.job_name
   AND TARGET.build_number = SOURCE.build_number
WHEN MATCHED THEN
  UPDATE SET
    build_url = SOURCE.build_url,
    git_branch = SOURCE.git_branch,
    git_commit = SOURCE.git_commit,
    duplicate_lines = SOURCE.duplicate_lines,
    duplication_count = SOURCE.duplication_count,
    file_count = SOURCE.file_count,
    modules = SOURCE.modules,
    generated_ts = SOURCE.generated_ts,
    ingested_at = SOURCE.ingested_at
WHEN NOT MATCHED THEN
  INSERT (
    report_date,
    job_name,
    build_number,
    build_url,
    git_branch,
    git_commit,
    duplicate_lines,
    duplication_count,
    file_count,
    modules,
    generated_ts,
    ingested_at
  )
  VALUES (
    SOURCE.report_date,
    SOURCE.job_name,
    SOURCE.build_number,
    SOURCE.build_url,
    SOURCE.git_branch,
    SOURCE.git_commit,
    SOURCE.duplicate_lines,
    SOURCE.duplication_count,
    SOURCE.file_count,
    SOURCE.modules,
    SOURCE.generated_ts,
    SOURCE.ingested_at
  );
