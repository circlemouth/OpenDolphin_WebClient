-- Minimal seed for /orca/master/material items>0 (DEV ONLY)
-- Target DB: jma-receipt-docker (postgres:10), db=orca, schema=master
-- Adds one synthetic material to:
--   - master.tbl_material_h_n (name)
--   - master.tbl_material_h_c (maker)
--   - master.tbl_material_h_k (spec)
--   - master.tbl_material_h_m (main)
--
-- Note: server-modernized currently reads tbl_material_h_m without join, so name/maker become codes.
--       This seed is mainly for proving UI -> POST /orca/order/bundles wiring.

BEGIN;

INSERT INTO master.tbl_material_h_n (snamecd, sname, creymd, upymd, uphms)
VALUES (9001, 'ガーゼ(検証シード)', '20260207', '20260207', '000000');

INSERT INTO master.tbl_material_h_c (companycd, name, creymd, upymd, uphms)
VALUES (9001, 'seed-maker', '20260207', '20260207', '000000');

INSERT INTO master.tbl_material_h_k (kikakucd, kikaku, creymd, upymd, uphms)
VALUES (9001, 'seed-spec', '20260207', '20260207', '000000');

INSERT INTO master.tbl_material_h_m (
  kanrino,
  jancd,
  snamecd,
  kikakucd,
  srycd,
  companycd1,
  companycd2,
  dockanricd,
  kinokbnno,
  creymd,
  upymd,
  uphms
)
VALUES (
  9001001,
  NULL,
  9001,
  9001,
  '5001001',
  9001,
  0,
  'A1',
  '11',
  '20260207',
  '20260207',
  '000000'
);

COMMIT;
