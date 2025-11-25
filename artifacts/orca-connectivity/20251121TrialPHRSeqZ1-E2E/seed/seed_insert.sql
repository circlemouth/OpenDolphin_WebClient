BEGIN;

DELETE FROM d_phr_key WHERE facilityid='1.3.6.1.4.1.9414.72.103' AND patientid='WEB1001';
DELETE FROM d_observation WHERE karte_id=10;
DELETE FROM d_diagnosis WHERE karte_id=10;
DELETE FROM d_nlabo_item WHERE patientid='WEB1001';
DELETE FROM d_nlabo_module WHERE patientid='WEB1001';
DELETE FROM d_image WHERE karte_id=10;
DELETE FROM d_document WHERE karte_id=10 AND docid LIKE 'PHR-E2E%';

WITH key_ids AS (
  SELECT nextval('hibernate_sequence') AS id
)
INSERT INTO d_phr_key (id, facilityid, patientid, accesskey, secretkey, registered)
SELECT id,
       '1.3.6.1.4.1.9414.72.103',
       'WEB1001',
       'PHR-WEB1001-ACCESS',
       'SECRET-KEY-001',
       NOW()
  FROM key_ids;

WITH obs_ids AS (
  SELECT nextval('hibernate_sequence') AS id
)
INSERT INTO d_observation (
  id, confirmed, ended, linkid, linkrelation, recorded, started, status,
  categoryvalue, memo, observation, phenomenon, creator_id, karte_id
)
SELECT id,
       NOW(),
       NULL,
       0,
       'PHR-E2E',
       NOW(),
       NOW(),
       'F',
       'severe',
       'E2E allergy seed',
       'Allergy',
       'ピーナッツアレルギー',
       5,
       10
  FROM obs_ids;

INSERT INTO d_diagnosis (
  confirmed, ended, linkid, linkrelation, recorded, started, status,
  department, departmentdesc, diagnosis, diagnosiscategory, diagnosiscodesystem,
  creator_id, karte_id
)
VALUES (
  NOW(),
  NULL,
  0,
  'PHR-E2E',
  NOW(),
  NOW(),
  'F',
  '01',
  '内科',
  '急性気管支炎',
  '感染症',
  'ICD10',
  5,
  10
);

WITH module_row AS (
  INSERT INTO d_nlabo_module (
    patientid, labocentercode, patientname, patientsex, sampledate,
    numofitems, modulekey, reportformat
  ) VALUES (
    'WEB1001',
    'LCENTER01',
    '青木 太郎',
    'M',
    '2025-11-15',
    '1',
    'LAB-PHASE-B',
    'STANDARD'
  ) RETURNING id
)
INSERT INTO d_nlabo_item (
  patientid, sampledate, labocode, groupcode, groupname, parentcode,
  itemcode, itemname, abnormalflg, normalvalue, c_value, unit,
  labomodule_id
)
SELECT 'WEB1001',
       '2025-11-15',
       'HB1',
       'CHEM',
       '血液検査',
       'HB',
       'HB-A1C',
       'ヘモグロビンA1c',
       'H',
       '4.6-6.2%',
       '7.2',
       '%',
       id
  FROM module_row;

WITH doc_row AS (
  INSERT INTO d_document (
    confirmed, started, ended, recorded, linkid, linkrelation, status,
    creator_id, karte_id, docid, doctype, title, purpose,
    department, departmentdesc, healthinsurance, healthinsurancedesc,
    hasmark, hasimage, hasrp, hastreatment, haslabotest
  ) VALUES (
    NOW(),
    NOW(),
    NULL,
    NOW(),
    0,
    'PHR-E2E',
    'F',
    5,
    10,
    'PHR-E2E-DOC-001',
    'karte',
    'PHR Seed Document',
    'PHR Preview',
    '01',
    '内科',
    '社保本人',
    '社会保険本人',
    false,
    true,
    false,
    false,
    true
  ) RETURNING id
)
INSERT INTO d_image (
  confirmed, started, ended, recorded, linkid, linkrelation, status,
  creator_id, karte_id, contenttype, medicalrole, title, href,
  jpegbyte, doc_id
)
SELECT NOW(),
       NOW(),
       NULL,
       NOW(),
       0,
       'PHR-E2E',
       'F',
       5,
       10,
       'image/jpeg',
       'schema',
       '胸部X線(Seed)',
       '/schema/phr-e2e',
       decode('ffd8ffe000104a46494600010201004800480000ffed03fe50686f746f73686f7020332e30003842494d03ed000000000010004800000001000200480000000100023842494d03f300000000000800000000000000003842494d040a00000000000100003842494d271000000000000a000100000000000000023842494d03f5000000000048002f66660001006c66660006000000000001002f6666000100a1999a0006000000000001003200000001005a00000006000000000001003500000001002d000000060000000000013842494d03f80000000000700000ffffffffffffffffffffffffffffffffffffffffffff03e800000000ffffffffffffffffffffffffffffffffffffffffffff03e800000000ffffffffffffffffffffffffffffffffffffffffffff03e800000000ffffffffffffffffffffffffffffffffffffffffffff03e800003842494d0408000000000010000000010000024000000240000000003842494d040900000000028e00000001000000800000000100000180000001800000027200180001ffd8ffe000104a46494600010201004800480000fffe002746696c65207772697474656e2062792041646f62652050686f746f73686f70a820342e3000ffee000e41646f626500648000000001ffdb0084000c08080809080c09090c110b0a0b11150f0c0c0f1518131315131318110c0c0c0c0c0c110c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c010d0b0b0d0e0d100e0e10140e0e0e14140e0e0e0e14110c0c0c0c0c11110c0c0c0c0c0c110c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0cffc00011080001008003012200021101031101ffdd00040008ffc4013f0000010501010101010100000000000000030001020405060708090a0b0100010501010101010100000000000000010002030405060708090a0b1000010401030204020507060805030c33010002110304211231054151611322718132061491a1b14223241552c16233347282d14307259253f0e1f163733516a2b283264493546445c2a3743617d255e265f2b384c3d375e3f3462794a485b495c4d4e4f4a5b5c5d5e5f55666768696a6b6c6d6e6f637475767778797a7b7c7d7e7f711000202010204040304050607070605350100021103213112044151617122130532819114a1b14223c152d1f0332462e1728292435315637334f1250616a2b283072635c2d2449354a317644555367465e2f2b384c3d375e3f34694a485b495c4d4e4f4a5b5c5d5e5f55666768696a6b6c6d6e6f62737475767778797a7b7c7ffda000c03010002110311003f00e8d25e0e92a8d07de125e0e924a7de125e0e924a7de125e0e924a7de125e0e924a7de125e0e924a7de125e0e924a7de125e0e924a7ffd93842494d04060000000000070001000000010100fffe002746696c65207772697474656e2062792041646f62652050686f746f73686f70a820342e3000ffee000e41646f626500648000000001ffdb0084000c08080809080c09090c110b0a0b11150f0c0c0f1518131315131318110c0c0c0c0c0c110c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c010d0b0b0d0e0d100e0e10140e0e0e14140e0e0e0e14110c0c0c0c0c11110c0c0c0c0c0c110c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0cffc00011080001014403012200021101031101ffdd00040015ffc4013f0000010501010101010100000000000000030001020405060708090a0b0100010501010101010100000000000000010002030405060708090a0b1000010401030204020507060805030c33010002110304211231054151611322718132061491a1b14223241552c16233347282d14307259253f0e1f163733516a2b283264493546445c2a3743617d255e265f2b384c3d375e3f3462794a485b495c4d4e4f4a5b5c5d5e5f55666768696a6b6c6d6e6f637475767778797a7b7c7d7e7f711000202010204040304050607070605350100021103213112044151617122130532819114a1b14223c152d1f0332462e1728292435315637334f1250616a2b283072635c2d2449354a317644555367465e2f2b384c3d375e3f34694a485b495c4d4e4f4a5b5c5d5e5f55666768696a6b6c6d6e6f62737475767778797a7b7c7ffda000c03010002110311003f00da4978824a8b9cfb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494fb7a4bc412494ff00ffd9','hex'),
       id
  FROM doc_row;

COMMIT;
