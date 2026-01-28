BEGIN;

SET search_path = public;

-- Ensure base sequence exists for inserts
CREATE SEQUENCE IF NOT EXISTS hibernate_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Align sequence with existing records to avoid duplicate keys
DO $$
DECLARE
    max_id BIGINT;
BEGIN
    SELECT GREATEST(
        COALESCE((SELECT max(id) FROM d_facility), 0),
        COALESCE((SELECT max(id) FROM d_users), 0),
        COALESCE((SELECT max(id) FROM d_roles), 0),
        COALESCE((SELECT max(id) FROM d_patient), 0),
        COALESCE((SELECT max(id) FROM d_karte), 0),
        1
    ) INTO max_id;

    PERFORM setval('hibernate_sequence', max_id, true);
END$$;

-- Local facility for sysad user (LOCAL.FACILITY.0001)
WITH facility_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_facility WHERE facilityid = 'LOCAL.FACILITY.0001'),
        nextval('hibernate_sequence')
    ) AS id
), upsert_facility AS (
    INSERT INTO d_facility (
        id,
        facilityid,
        facilityname,
        membertype,
        registereddate,
        zipcode,
        address,
        telephone
    ) VALUES (
        (SELECT id FROM facility_seed),
        'LOCAL.FACILITY.0001',
        'OpenDolphin Local Dev Clinic',
        'PROCESS',
        CURRENT_DATE,
        '000-0000',
        'Tokyo',
        '03-0000-0000'
    )
    ON CONFLICT (facilityid) DO UPDATE SET
        facilityname = EXCLUDED.facilityname,
        membertype = EXCLUDED.membertype,
        registereddate = EXCLUDED.registereddate,
        zipcode = EXCLUDED.zipcode,
        address = EXCLUDED.address,
        telephone = EXCLUDED.telephone
    RETURNING id
), selected_facility AS (
    SELECT id FROM upsert_facility
    UNION ALL
    SELECT id FROM d_facility WHERE facilityid = 'LOCAL.FACILITY.0001' LIMIT 1
)
INSERT INTO d_users (
    id,
    userid,
    password,
    commonname,
    facility_id,
    membertype,
    registereddate,
    sirname,
    givenname,
    email
) SELECT
    COALESCE(
        (SELECT id FROM d_users WHERE userid = 'LOCAL.FACILITY.0001:dolphin'),
        nextval('hibernate_sequence')
    ) AS id,
    'LOCAL.FACILITY.0001:dolphin',
    '36cdf8b887a5cffc78dcd5c08991b993', -- dolphin (MD5)
    'Sysad Admin',
    selected_facility.id,
    'PROCESS',
    CURRENT_DATE,
    'Sysad',
    'Admin',
    'dev@example.com'
FROM selected_facility
ON CONFLICT (userid) DO UPDATE SET
    password = EXCLUDED.password,
    commonname = EXCLUDED.commonname,
    membertype = EXCLUDED.membertype,
    facility_id = EXCLUDED.facility_id,
    registereddate = EXCLUDED.registereddate,
    sirname = EXCLUDED.sirname,
    givenname = EXCLUDED.givenname,
    email = EXCLUDED.email;

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), role_name, 'LOCAL.FACILITY.0001:dolphin', u.id
FROM d_users u
JOIN (VALUES ('system-administrator'), ('doctor'), ('user')) AS roles(role_name) ON 1=1
WHERE u.userid = 'LOCAL.FACILITY.0001:dolphin'
  AND NOT EXISTS (
    SELECT 1 FROM d_roles r
    WHERE r.user_id = u.userid AND r.c_role = roles.role_name
  );

-- Local facility seed patient + karte
WITH patient_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_patient WHERE facilityid = 'LOCAL.FACILITY.0001' AND patientid = '00001'),
        nextval('hibernate_sequence')
    ) AS id
), upsert_patient AS (
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
    ) VALUES (
        (SELECT id FROM patient_seed),
        'LOCAL.FACILITY.0001',
        '00001',
        'Seed',
        'Patient',
        'Seed Patient',
        'M',
        'male',
        '1970-01-01'
    )
    ON CONFLICT (facilityid, patientid) DO UPDATE SET
        familyname = EXCLUDED.familyname,
        givenname = EXCLUDED.givenname,
        fullname = EXCLUDED.fullname,
        gender = EXCLUDED.gender,
        genderdesc = EXCLUDED.genderdesc,
        birthday = EXCLUDED.birthday
    RETURNING id
), selected_patient AS (
    SELECT id FROM upsert_patient
    UNION ALL
    SELECT id FROM d_patient WHERE facilityid = 'LOCAL.FACILITY.0001' AND patientid = '00001' LIMIT 1
)
INSERT INTO d_karte (
    id,
    created,
    patient_id
)
SELECT
    nextval('hibernate_sequence'),
    CURRENT_DATE,
    selected_patient.id
FROM selected_patient
WHERE NOT EXISTS (
    SELECT 1 FROM d_karte WHERE patient_id = selected_patient.id
);

-- Modernized facility + doctor user (1.3.6.1.4.1.9414.72.103)
WITH facility_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.72.103'),
        nextval('hibernate_sequence')
    ) AS id
), upsert_facility AS (
    INSERT INTO d_facility (
        id,
        facilityid,
        facilityname,
        membertype,
        registereddate,
        zipcode,
        address,
        telephone
    ) VALUES (
        (SELECT id FROM facility_seed),
        '1.3.6.1.4.1.9414.72.103',
        'Modernized Clinic',
        'PROCESS',
        CURRENT_DATE,
        '000-0000',
        'Tokyo',
        '03-0000-0001'
    )
    ON CONFLICT (facilityid) DO UPDATE SET
        facilityname = EXCLUDED.facilityname,
        membertype = EXCLUDED.membertype,
        registereddate = EXCLUDED.registereddate,
        zipcode = EXCLUDED.zipcode,
        address = EXCLUDED.address,
        telephone = EXCLUDED.telephone
    RETURNING id
), selected_facility AS (
    SELECT id FROM upsert_facility
    UNION ALL
    SELECT id FROM d_facility WHERE facilityid = '1.3.6.1.4.1.9414.72.103' LIMIT 1
)
INSERT INTO d_users (
    id,
    userid,
    password,
    commonname,
    facility_id,
    membertype,
    registereddate,
    sirname,
    givenname,
    email
) SELECT
    COALESCE(
        (SELECT id FROM d_users WHERE userid = '1.3.6.1.4.1.9414.72.103:doctor1'),
        nextval('hibernate_sequence')
    ) AS id,
    '1.3.6.1.4.1.9414.72.103:doctor1',
    '632080fabdb968f9ac4f31fb55104648', -- doctor1 (MD5)
    'Doctor One',
    selected_facility.id,
    'PROCESS',
    CURRENT_DATE,
    'Takagi',
    'Kaoru',
    'doctor1@example.com'
FROM selected_facility
ON CONFLICT (userid) DO UPDATE SET
    password = EXCLUDED.password,
    commonname = EXCLUDED.commonname,
    membertype = EXCLUDED.membertype,
    facility_id = EXCLUDED.facility_id,
    registereddate = EXCLUDED.registereddate,
    sirname = EXCLUDED.sirname,
    givenname = EXCLUDED.givenname,
    email = EXCLUDED.email;

INSERT INTO d_roles (id, c_role, user_id, c_user)
SELECT nextval('hibernate_sequence'), role_name, '1.3.6.1.4.1.9414.72.103:doctor1', u.id
FROM d_users u
JOIN (VALUES ('admin'), ('doctor'), ('user')) AS roles(role_name) ON 1=1
WHERE u.userid = '1.3.6.1.4.1.9414.72.103:doctor1'
  AND NOT EXISTS (
    SELECT 1 FROM d_roles r
    WHERE r.user_id = u.userid AND r.c_role = roles.role_name
  );

-- Modernized facility seed patient + karte
WITH patient_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_patient WHERE facilityid = '1.3.6.1.4.1.9414.72.103' AND patientid = '00001'),
        nextval('hibernate_sequence')
    ) AS id
), upsert_patient AS (
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
    ) VALUES (
        (SELECT id FROM patient_seed),
        '1.3.6.1.4.1.9414.72.103',
        '00001',
        'Seed',
        'Patient',
        'Seed Patient',
        'M',
        'male',
        '1970-01-01'
    )
    ON CONFLICT (facilityid, patientid) DO UPDATE SET
        familyname = EXCLUDED.familyname,
        givenname = EXCLUDED.givenname,
        fullname = EXCLUDED.fullname,
        gender = EXCLUDED.gender,
        genderdesc = EXCLUDED.genderdesc,
        birthday = EXCLUDED.birthday
    RETURNING id
), selected_patient AS (
    SELECT id FROM upsert_patient
    UNION ALL
    SELECT id FROM d_patient WHERE facilityid = '1.3.6.1.4.1.9414.72.103' AND patientid = '00001' LIMIT 1
)
INSERT INTO d_karte (
    id,
    created,
    patient_id
)
SELECT
    nextval('hibernate_sequence'),
    CURRENT_DATE,
    selected_patient.id
FROM selected_patient
WHERE NOT EXISTS (
    SELECT 1 FROM d_karte WHERE patient_id = selected_patient.id
);

-- Align hibernate_sequence with current max
SELECT setval(
    'hibernate_sequence',
    GREATEST(
        COALESCE((SELECT MAX(id) FROM d_facility), 1),
        COALESCE((SELECT MAX(id) FROM d_users), 1),
        COALESCE((SELECT MAX(id) FROM d_roles), 1),
        COALESCE((SELECT MAX(id) FROM d_patient), 1),
        COALESCE((SELECT MAX(id) FROM d_karte), 1)
    ),
    true
);

-- Align patient/karte sequences if they exist
DO $$
BEGIN
    IF to_regclass('opendolphin.d_patient_seq') IS NOT NULL THEN
        PERFORM setval(
            'opendolphin.d_patient_seq',
            GREATEST(COALESCE((SELECT MAX(id) FROM d_patient), 1), 1),
            true
        );
    END IF;
    IF to_regclass('opendolphin.d_karte_seq') IS NOT NULL THEN
        PERFORM setval(
            'opendolphin.d_karte_seq',
            GREATEST(COALESCE((SELECT MAX(id) FROM d_karte), 1), 1),
            true
        );
    END IF;
END$$;

COMMIT;
