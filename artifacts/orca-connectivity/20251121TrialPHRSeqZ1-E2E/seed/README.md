# PHR E2E Seed (RUN_ID=20251121TrialPHRSeqZ1-E2E)
- 対象 DB: `opendolphin-postgres-modernized` / database `opendolphin_modern`
- 適用手順:
  1. コンテナ起動後に `docker exec -i opendolphin-postgres-modernized psql -U opendolphin -d opendolphin_modern -f /workspace/artifacts/orca-connectivity/20251121TrialPHRSeqZ1-E2E/seed/seed_insert.sql`
  2. `SELECT facilityid, patientid, accesskey FROM d_phr_key WHERE patientid='WEB1001';` を実行しアクセスキーを確認。
  3. `SELECT count(*) FROM d_nlabo_item WHERE patientid='WEB1001';`、`SELECT count(*) FROM d_diagnosis WHERE karte_id=10;` 等で投入済みデータを確認。
- 挿入される主なデータ:
  - `d_phr_key`: `PHR-WEB1001-ACCESS`
  - `d_observation`: ピーナッツアレルギー（severity=severe）
  - `d_diagnosis`: 急性気管支炎サンプル
  - `d_nlabo_module`/`d_nlabo_item`: ヘモグロビン A1c=7.2%
  - `d_document` + `d_image`: `PHR-E2E-DOC-001` / 胸部X線サンプル JPEG
