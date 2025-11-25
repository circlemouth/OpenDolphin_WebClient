\set ON_ERROR_STOP on
-- RUN_ID: 20251124T160000Z (parent=20251124T000000Z)
-- Scope: ORCA-06 保険者・住所 シード撤回
-- Dry-run: コメントを外す前に件数確認。run_id_tag は投入時のタグ/zip を設定。
-- psql -v run_id_tag="seed-run-20251124T130000Z" -v zip_tag="1000001" -f cleanup-orca06.sql

-- ===== Dry-run (件数確認) =====
-- SELECT 'TBL_HKNJAINF' AS table, count(*) FROM TBL_HKNJAINF WHERE hknjanum='06123456' OR hknjaname LIKE '%' || :'run_id_tag' || '%';
-- SELECT 'TBL_ADRS'     AS table, count(*) FROM TBL_ADRS    WHERE zip=:'zip_tag' OR full_address LIKE '%' || :'run_id_tag' || '%';

BEGIN;
  DELETE FROM TBL_HKNJAINF WHERE hknjanum='06123456' OR hknjaname LIKE '%' || :'run_id_tag' || '%';
  DELETE FROM TBL_ADRS     WHERE zip=:'zip_tag' OR full_address LIKE '%' || :'run_id_tag' || '%';
  -- 住所コードの参照整合性を確認し、必要なら関連ビュー/キャッシュを再構築
COMMIT;
