BEGIN;

SET search_path = opendolphin, public;

CREATE SEQUENCE IF NOT EXISTS opendolphin.hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

DO $$
BEGIN
    IF to_regclass('d_patient') IS NULL THEN
        RAISE EXCEPTION 'd_patient not found; run migrations before seeding.';
    END IF;
    IF to_regclass('d_karte') IS NULL THEN
        RAISE EXCEPTION 'd_karte not found; run migrations before seeding.';
    END IF;
    IF to_regclass('d_patient_visit') IS NULL THEN
        RAISE EXCEPTION 'd_patient_visit not found; run migrations before seeding.';
    END IF;
    IF to_regclass('d_document') IS NULL THEN
        RAISE EXCEPTION 'd_document not found; run migrations before seeding.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.72.103') THEN
        RAISE EXCEPTION 'facility seed not found; run local_synthetic_seed.sql first.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM d_users WHERE userid = '1.3.6.1.4.1.9414.72.103:doctor1') THEN
        RAISE EXCEPTION 'doctor1 seed not found; run local_synthetic_seed.sql first.';
    END IF;
END$$;

WITH seed_patients AS (
    SELECT * FROM (VALUES
        ('10010', '受付', '再現', '受付 再現', 'F', 'female', '1980-01-01', 'reception'),
        ('10011', '診療', '再現', '診療 再現', 'M', 'male', '1975-05-20', 'treatment'),
        ('10012', '会計', '再現', '会計 再現', 'F', 'female', '1968-11-15', 'billing'),
        ('10013', '帳票', '再現', '帳票 再現', 'M', 'male', '1990-03-08', 'report')
    ) AS t(patientid, familyname, givenname, fullname, gender, genderdesc, birthday, scenario)
), facility AS (
    SELECT id, facilityid FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.72.103'
), upsert_patients AS (
    INSERT INTO d_patient (
        id,
        facilityid,
        patientid,
        familyname,
        givenname,
        fullname,
        gender,
        genderdesc,
        birthday
    )
    SELECT
        COALESCE(
            (SELECT id FROM d_patient WHERE facilityid = facility.facilityid AND patientid = sp.patientid),
            nextval('public.hibernate_sequence')
        ) AS id,
        facility.facilityid,
        sp.patientid,
        sp.familyname,
        sp.givenname,
        sp.fullname,
        sp.gender,
        sp.genderdesc,
        sp.birthday::date
    FROM seed_patients sp
    CROSS JOIN facility
    ON CONFLICT (facilityid, patientid) DO UPDATE SET
        familyname = EXCLUDED.familyname,
        givenname = EXCLUDED.givenname,
        fullname = EXCLUDED.fullname,
        gender = EXCLUDED.gender,
        genderdesc = EXCLUDED.genderdesc,
        birthday = EXCLUDED.birthday
    RETURNING id, patientid
)
SELECT 1;

SELECT setval(
    'public.hibernate_sequence',
    GREATEST(
        COALESCE((SELECT MAX(id) FROM d_facility), 1),
        COALESCE((SELECT MAX(id) FROM d_users), 1),
        COALESCE((SELECT MAX(id) FROM d_roles), 1),
        COALESCE((SELECT MAX(id) FROM d_patient), 1),
        COALESCE((SELECT MAX(id) FROM d_karte), 1)
    ),
    true
);

WITH seed_patients AS (
    SELECT * FROM (VALUES
        ('10010'), ('10011'), ('10012'), ('10013')
    ) AS t(patientid)
), facility AS (
    SELECT facilityid FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.72.103'
)
INSERT INTO d_karte (
    id,
    created,
    patient_id
)
SELECT
    nextval('public.hibernate_sequence'),
    CURRENT_DATE,
    p.id
FROM d_patient p
JOIN facility f ON p.facilityid = f.facilityid
JOIN seed_patients sp ON sp.patientid = p.patientid
WHERE NOT EXISTS (
    SELECT 1 FROM d_karte k WHERE k.patient_id = p.id
);

WITH facility AS (
    SELECT facilityid FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.72.103'
), seed_visits AS (
    SELECT * FROM (VALUES
        ('10010', 1, (current_date::text || 'T09:10:00'), 0, 'walkin', '内科', '01', '内科', 'doctor1', 'Doctor One', 'JMARI-001', 'INS-REPRO-001', '協会けんぽ', '受付シナリオ seed', '00:05'),
        ('10011', 2, (current_date::text || 'T09:20:00'), 8, 'walkin', '内科', '01', '内科', 'doctor1', 'Doctor One', 'JMARI-001', 'INS-REPRO-002', '協会けんぽ', '診療シナリオ seed', '00:10'),
        ('10012', 3, (current_date::text || 'T09:30:00'), 2, 'walkin', '内科', '01', '内科', 'doctor1', 'Doctor One', 'JMARI-001', 'INS-REPRO-003', '協会けんぽ', '会計シナリオ seed', '00:15'),
        ('10013', 4, (current_date::text || 'T09:40:00'), 2, 'walkin', '内科', '01', '内科', 'doctor1', 'Doctor One', 'JMARI-001', 'INS-REPRO-004', '協会けんぽ', '帳票シナリオ seed', '00:20')
    ) AS t(patientid, number, pvtdate, status, appointment, department, deptcode, deptname, doctorid, doctorname, jmarinumber, insuranceuid, firstinsurance, memo, watingtime)
), patient_map AS (
    SELECT id, patientid FROM d_patient
    WHERE facilityid = (SELECT facilityid FROM facility)
)
DELETE FROM d_patient_visit pv
USING patient_map pm, seed_visits sv
WHERE pv.patient_id = pm.id
  AND pm.patientid = sv.patientid
  AND pv.pvtdate LIKE (current_date::text || '%');

WITH facility AS (
    SELECT facilityid FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.72.103'
), seed_visits AS (
    SELECT * FROM (VALUES
        ('10010', 1, (current_date::text || 'T09:10:00'), 0, 'walkin', '内科', '01', '内科', 'doctor1', 'Doctor One', 'JMARI-001', 'INS-REPRO-001', '協会けんぽ', '受付シナリオ seed', '00:05'),
        ('10011', 2, (current_date::text || 'T09:20:00'), 8, 'walkin', '内科', '01', '内科', 'doctor1', 'Doctor One', 'JMARI-001', 'INS-REPRO-002', '協会けんぽ', '診療シナリオ seed', '00:10'),
        ('10012', 3, (current_date::text || 'T09:30:00'), 2, 'walkin', '内科', '01', '内科', 'doctor1', 'Doctor One', 'JMARI-001', 'INS-REPRO-003', '協会けんぽ', '会計シナリオ seed', '00:15'),
        ('10013', 4, (current_date::text || 'T09:40:00'), 2, 'walkin', '内科', '01', '内科', 'doctor1', 'Doctor One', 'JMARI-001', 'INS-REPRO-004', '協会けんぽ', '帳票シナリオ seed', '00:20')
    ) AS t(patientid, number, pvtdate, status, appointment, department, deptcode, deptname, doctorid, doctorname, jmarinumber, insuranceuid, firstinsurance, memo, watingtime)
), patient_map AS (
    SELECT id, patientid FROM d_patient
    WHERE facilityid = (SELECT facilityid FROM facility)
)
INSERT INTO d_patient_visit (
    id,
    patient_id,
    facilityid,
    number,
    pvtdate,
    appointment,
    department,
    status,
    insuranceuid,
    deptcode,
    deptname,
    doctorid,
    doctorname,
    jmarinumber,
    firstinsurance,
    memo,
    watingtime
)
SELECT
    nextval('opendolphin.hibernate_sequence'),
    pm.id,
    f.facilityid,
    sv.number,
    sv.pvtdate,
    sv.appointment,
    sv.department,
    sv.status,
    sv.insuranceuid,
    sv.deptcode,
    sv.deptname,
    sv.doctorid,
    sv.doctorname,
    sv.jmarinumber,
    sv.firstinsurance,
    sv.memo,
    sv.watingtime
FROM seed_visits sv
JOIN patient_map pm ON pm.patientid = sv.patientid
CROSS JOIN facility f;

WITH seed_docs AS (
    SELECT * FROM (VALUES
        ('10011', '00000000000000000000000000001011', 'karte', '診療サマリ seed', 'recode', NULL::timestamp),
        ('10012', '00000000000000000000000000001012', 'karte', '会計サマリ seed', 'recode', NOW()),
        ('10013', '00000000000000000000000000001013', 'letter', '帳票サマリ seed', 'recode', NOW())
    ) AS t(patientid, docid, doctype, title, purpose, claimdate)
), facility AS (
    SELECT facilityid FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.72.103'
), patient_map AS (
    SELECT id, patientid FROM d_patient WHERE facilityid = (SELECT facilityid FROM facility)
), karte_map AS (
    SELECT k.id AS karte_id, p.patientid FROM d_karte k
    JOIN patient_map p ON k.patient_id = p.id
), creator AS (
    SELECT id FROM d_users WHERE userid = '1.3.6.1.4.1.9414.72.103:doctor1'
)
INSERT INTO d_document (
    id,
    confirmed,
    started,
    ended,
    recorded,
    linkid,
    linkrelation,
    status,
    creator_id,
    karte_id,
    docid,
    doctype,
    title,
    purpose,
    department,
    departmentdesc,
    healthinsurance,
    healthinsurancedesc,
    healthinsuranceguid,
    hasmark,
    hasimage,
    hasrp,
    hastreatment,
    haslabotest,
    versionnumber,
    parentid,
    parentidrelation,
    labtestordernumber,
    claimdate,
    admflag
)
SELECT
    nextval('opendolphin.hibernate_sequence'),
    NOW(),
    NOW(),
    NULL,
    NOW(),
    NULL,
    NULL,
    'F',
    creator.id,
    km.karte_id,
    sd.docid,
    sd.doctype,
    sd.title,
    sd.purpose,
    '01',
    '内科,01,Doctor One,doctor1',
    'H',
    '協会けんぽ',
    'INS-REPRO-000',
    false,
    false,
    false,
    false,
    false,
    '1',
    NULL,
    NULL,
    NULL,
    sd.claimdate,
    NULL
FROM seed_docs sd
JOIN karte_map km ON km.patientid = sd.patientid
CROSS JOIN creator
WHERE NOT EXISTS (
    SELECT 1 FROM d_document d WHERE d.docid = sd.docid
);

SELECT setval(
    'opendolphin.hibernate_sequence',
    GREATEST(
        COALESCE((SELECT MAX(id) FROM d_patient_visit), 1),
        COALESCE((SELECT MAX(id) FROM d_document), 1)
    ),
    true
);

COMMIT;
