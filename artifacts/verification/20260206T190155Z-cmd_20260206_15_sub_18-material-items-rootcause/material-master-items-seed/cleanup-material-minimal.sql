-- Cleanup for seed-material-minimal.sql
BEGIN;
DELETE FROM master.tbl_material_h_m WHERE kanrino = 9001001;
DELETE FROM master.tbl_material_h_n WHERE snamecd = 9001;
DELETE FROM master.tbl_material_h_c WHERE companycd = 9001;
DELETE FROM master.tbl_material_h_k WHERE kikakucd = 9001;
COMMIT;
