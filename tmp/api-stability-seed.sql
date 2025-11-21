-- Minimal seed for API stability measurements
DO $$
DECLARE
  fac_id bigint;
  user_pk bigint;
  pat_id bigint;
  karte_pk bigint;
  doc_pk bigint;
  pvt_pk bigint;
BEGIN
  SELECT id INTO fac_id FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.72.103';
  IF fac_id IS NULL THEN
    fac_id := nextval('hibernate_sequence');
    INSERT INTO d_facility (
      id, facilityid, facilityname, zipcode, address, telephone, registereddate, membertype, url
    ) VALUES (
      fac_id, '1.3.6.1.4.1.9414.72.103', 'OpenDolphin Trace Clinic',
      '1000002', '東京都千代田区1-1-2', '03-0000-0001', CURRENT_DATE, 'facility', 'https://localhost/trace-clinic'
    );
  END IF;

  SELECT id INTO user_pk FROM d_users WHERE userid = '1.3.6.1.4.1.9414.72.103:doctor1';
  IF user_pk IS NULL THEN
    user_pk := nextval('hibernate_sequence');
    INSERT INTO d_users (
      id, userid, password, sirname, givenname, commonname, membertype, memo, registereddate, email,
      facility_id, license, licensedesc, licensecodesys, department, departmentdesc, departmentcodesys,
      factor2auth, mainmobile, submobile, usedrugid
    ) VALUES (
      user_pk, '1.3.6.1.4.1.9414.72.103:doctor1', '632080fabdb968f9ac4f31fb55104648',
      '医師', '一郎', 'Doctor One', 'doctor', 'API stability seed user', CURRENT_DATE, 'doctor1@example.com',
      fac_id, 'doctor', 'Doctor', '99', '01', 'General Practice', '99', 'TOTP', '+819012300001', '+819012300002', 'RX-JPQL-0001'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM d_roles WHERE user_id = '1.3.6.1.4.1.9414.72.103:doctor1' AND c_role = 'doctor'
  ) THEN
    INSERT INTO d_roles (id, c_role, user_id, c_user)
    VALUES (nextval('hibernate_sequence'), 'doctor', '1.3.6.1.4.1.9414.72.103:doctor1', user_pk);
  END IF;

  SELECT id INTO pat_id FROM d_patient
    WHERE facilityid = '1.3.6.1.4.1.9414.72.103' AND patientid = '0000001'
    LIMIT 1;
  IF pat_id IS NULL THEN
    pat_id := nextval('hibernate_sequence');
    INSERT INTO d_patient (
      id, facilityid, patientid, fullname, gender, birthday, familyname, givenname, kananame,
      kanafamilyname, kanagivenname, romanfamilyname, romangivenname, romanname, telephone, email
    ) VALUES (
      pat_id, '1.3.6.1.4.1.9414.72.103', '0000001', '架空 花子', 'F', '1985-05-23', '架空', '花子', 'カクウ ハナコ',
      'カクウ', 'ハナコ', 'Kakuu', 'Hanako', 'Kakuu Hanako', '03-0000-0020', 'patient0001@example.com'
    );
  END IF;

  SELECT id INTO karte_pk FROM d_karte WHERE patient_id = pat_id LIMIT 1;
  IF karte_pk IS NULL THEN
    karte_pk := nextval('hibernate_sequence');
    INSERT INTO d_karte (id, patient_id, created)
    VALUES (karte_pk, pat_id, CURRENT_DATE);
  END IF;

  SELECT id INTO doc_pk FROM d_document WHERE docid = 'DOC-API-001' LIMIT 1;
  IF doc_pk IS NULL THEN
    doc_pk := nextval('hibernate_sequence');
    INSERT INTO d_document (
      id, confirmed, ended, linkid, linkrelation, recorded, started, status, admflag,
      claimdate, department, departmentdesc, docid, doctype, hasimage, haslabotest, hasmark,
      hasrp, hastreatment, healthinsurance, healthinsurancedesc, healthinsuranceguid, labtestordernumber,
      parentid, parentidrelation, purpose, title, versionnumber, creator_id, karte_id
    ) VALUES (
      doc_pk, now(), NULL, 0, NULL, now(), now(), 'F', NULL,
      NULL, '01', '内科', 'DOC-API-001', 'karte', false, false, false,
      false, false, NULL, NULL, NULL, NULL,
      NULL, NULL, 'progress', 'API Seed Progress Note', '1', user_pk, karte_pk
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM d_module WHERE doc_id = doc_pk) THEN
    INSERT INTO d_module (
      id, confirmed, ended, linkid, linkrelation, recorded, started, status,
      beanbytes, entity, name, performflag, role, stampnumber, creator_id, karte_id, doc_id
    ) VALUES (
      nextval('hibernate_sequence'), now(), NULL, 0, NULL, now(), now(), 'F',
      lo_from_bytea(0, '\\x'::bytea), 'progressCourse', 'API Stability Progress', NULL, 'p',
      1, user_pk, karte_pk, doc_pk
    );
  END IF;

  SELECT id INTO pvt_pk FROM d_patient_visit WHERE facilityid = '1.3.6.1.4.1.9414.72.103' AND patient_id = pat_id LIMIT 1;
  IF pvt_pk IS NULL THEN
    pvt_pk := nextval('hibernate_sequence');
    INSERT INTO d_patient_visit (
      id, facilityid, patient_id, pvtdate, status, department, deptcode, deptname, doctorid, doctorname, memo
    ) VALUES (
      pvt_pk, '1.3.6.1.4.1.9414.72.103', pat_id, '2024-01-01T09:00:00Z', 2,
      '01', '01', '内科', '9001:doctor1', 'Doctor One', 'api stability seed'
    );
  END IF;

  UPDATE d_patient_visit
  SET pvtdate = to_char(current_timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      status = 2
  WHERE id = pvt_pk;
END $$;

CREATE TABLE IF NOT EXISTS tbl_syskanri (
  kanricd text PRIMARY KEY,
  hospnum integer,
  kanritbl text
);

CREATE TABLE IF NOT EXISTS tbl_dbkanri (
  kanricd text PRIMARY KEY,
  version text
);

CREATE TABLE IF NOT EXISTS tbl_genericname (
  yakkakjncd text PRIMARY KEY,
  genericname text
);

CREATE TABLE IF NOT EXISTS tbl_tensu (
  srycd text PRIMARY KEY,
  name text,
  kananame text,
  taniname text,
  tensikibetu text,
  ten text,
  nyugaitekkbn text,
  routekkbn text,
  srysyukbn text,
  hospsrykbn text,
  ykzkbn text,
  yakkakjncd text,
  yukostymd text,
  yukoedymd text
);

INSERT INTO tbl_syskanri (kanricd, hospnum, kanritbl)
VALUES ('1001', 1, '0000000000JPN130000000000')
ON CONFLICT (kanricd) DO UPDATE SET hospnum = EXCLUDED.hospnum, kanritbl = EXCLUDED.kanritbl;

INSERT INTO tbl_dbkanri (kanricd, version)
VALUES ('ORCADB00', '040700-1')
ON CONFLICT (kanricd) DO UPDATE SET version = EXCLUDED.version;

INSERT INTO tbl_genericname (yakkakjncd, genericname)
VALUES ('123456789', 'プロパネコール注')
ON CONFLICT (yakkakjncd) DO UPDATE SET genericname = EXCLUDED.genericname;

INSERT INTO tbl_tensu (
  srycd, name, kananame, taniname, tensikibetu, ten, nyugaitekkbn, routekkbn,
  srysyukbn, hospsrykbn, ykzkbn, yakkakjncd, yukostymd, yukoedymd
) VALUES (
  '110001110', 'プロパネコール注', 'ﾌﾟﾛﾊﾟﾈｺｰﾙ', 'mL', '220', '120', '0', '21',
  'GA', '0', '1', '1234567890', '20240401', '99999999'
) ON CONFLICT (srycd) DO UPDATE SET
  name = EXCLUDED.name,
  kananame = EXCLUDED.kananame,
  taniname = EXCLUDED.taniname,
  tensikibetu = EXCLUDED.tensikibetu,
  ten = EXCLUDED.ten,
  nyugaitekkbn = EXCLUDED.nyugaitekkbn,
  routekkbn = EXCLUDED.routekkbn,
  srysyukbn = EXCLUDED.srysyukbn,
  hospsrykbn = EXCLUDED.hospsrykbn,
  ykzkbn = EXCLUDED.ykzkbn,
  yakkakjncd = EXCLUDED.yakkakjncd,
  yukostymd = EXCLUDED.yukostymd,
  yukoedymd = EXCLUDED.yukoedymd;
