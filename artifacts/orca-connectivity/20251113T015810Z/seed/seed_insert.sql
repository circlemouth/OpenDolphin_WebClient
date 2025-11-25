BEGIN;
INSERT INTO tbl_ptinf (
  hospnum, ptid, kananame, name, sex, birthday,
  termid, opid, creymd, upymd, uphms
) VALUES (
  1, 1, 'TEST PATIENT', 'Test Patient 000001', '1', '19800101',
  'CLI-SEED', 'workerw36', '20251113', '20251113', '101500'
) ON CONFLICT (hospnum, ptid) DO NOTHING;

INSERT INTO tbl_ptnum (
  hospnum, ptid, ptnum, termid, opid, creymd, upymd, uphms
) VALUES (
  1, 1, '000001', 'CLI-SEED', 'workerw36', '20251113', '20251113', '101500'
) ON CONFLICT (hospnum, ptid) DO NOTHING;

INSERT INTO tbl_uketuke (
  hospnum, ukeymd, ukeid, uketime, ptid, name, sryka, drcd,
  srflg, termid, opid, creymd, upymd, uphms, srynaiyo
) VALUES (
  1, '20251113', 1, '101500', 1, 'Test Patient 000001', '01', '00001',
  '00', 'CLI-SEED', 'workerw36', '20251113', '20251113', '101500', '01'
);
COMMIT;
-- Adjust Medical_Information text to align with API filter
UPDATE tbl_uketuke
   SET srynaiyo='外来'
 WHERE hospnum=1 AND ukeymd='20251113' AND ukeid=1;
INSERT INTO tbl_ptmemoinf (
  hospnum, ptid, sysymd, memokbn, rennum, sryka, memo,
  termid, opid, creymd, upymd, uphms
) VALUES (
  1, 1, '20251113', 0, 1, '01', '受付seed',
  'CLI-SEED', 'workerw36', '20251113', '20251113', '103000'
);
-- Normalize srynaiyo code to numeric form for API filter
UPDATE tbl_uketuke
   SET srynaiyo='01'
 WHERE hospnum=1 AND ukeymd='20251113' AND ukeid=1;
