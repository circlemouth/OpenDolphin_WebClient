BEGIN;

-- 共通で利用する施設シーケンス。
CREATE SEQUENCE IF NOT EXISTS facility_num START WITH 200 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS d_roles (
    id BIGINT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    c_role VARCHAR(255) NOT NULL,
    c_user BIGINT NOT NULL,
    CONSTRAINT fk_roles_user FOREIGN KEY (c_user) REFERENCES d_users(id)
);

CREATE TABLE IF NOT EXISTS appointment_model (
    id BIGINT PRIMARY KEY,
    karte_id BIGINT,
    date DATE
);

CREATE TABLE IF NOT EXISTS patient_visit_model (
    id BIGINT PRIMARY KEY,
    facility_id BIGINT,
    pvt_date TIMESTAMP,
    status VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS document_model (
    id BIGINT PRIMARY KEY,
    karte_id BIGINT,
    started TIMESTAMP,
    status VARCHAR(32),
    link_id BIGINT
);

CREATE TABLE IF NOT EXISTS nlabo_module (
    id BIGINT PRIMARY KEY,
    patient_id BIGINT,
    sample_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registered_diagnosis_model (
    id BIGINT PRIMARY KEY,
    karte_id BIGINT,
    started TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patient_model (
    id BIGINT PRIMARY KEY,
    facility_id BIGINT,
    kana_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS d_factor2_backupkey (
    id BIGINT PRIMARY KEY,
    user_pk BIGINT,
    backup_code VARCHAR(255)
);

-- ローカル検証用施設レコード。
WITH facility_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_facility WHERE facilityId = 'LOCAL.FACILITY.0001'),
        nextval('hibernate_sequence')
    ) AS id
), upsert_facility AS (
    INSERT INTO d_facility (
        id,
        facilityId,
        facilityName,
        zipCode,
        address,
        telephone,
        registeredDate,
        memberType,
        url
    ) VALUES (
        (SELECT id FROM facility_seed),
        'LOCAL.FACILITY.0001',
        'OpenDolphin Local Dev Clinic',
        '1000001',
        '東京都千代田区1-1-1',
        '03-0000-0000',
        CURRENT_DATE,
        'facility',
        'https://localhost'
    )
    ON CONFLICT (facilityId) DO UPDATE SET
        facilityName = EXCLUDED.facilityName,
        zipCode = EXCLUDED.zipCode,
        address = EXCLUDED.address,
        telephone = EXCLUDED.telephone,
        registeredDate = EXCLUDED.registeredDate,
        memberType = EXCLUDED.memberType,
        url = EXCLUDED.url
    RETURNING id
), selected_facility AS (
    SELECT id FROM upsert_facility
    UNION ALL
    SELECT id FROM d_facility WHERE facilityId = 'LOCAL.FACILITY.0001' LIMIT 1
)
INSERT INTO d_users (
    id,
    userId,
    password,
    sirName,
    givenName,
    commonName,
    memberType,
    memo,
    registeredDate,
    email,
    facility_id,
    license,
    licenseDesc,
    licenseCodeSys,
    department,
    departmentDesc,
    departmentCodeSys,
    factor2Auth,
    mainMobile,
    subMobile,
    useDrugId
)
SELECT
    COALESCE(
        (SELECT id FROM d_users WHERE userId='LOCAL.FACILITY.0001:dolphin'),
        nextval('hibernate_sequence')
    ) AS id,
    'LOCAL.FACILITY.0001:dolphin',
    '36cdf8b887a5cffc78dcd5c08991b993',
    '開発',
    '太郎',
    '開発 太郎',
    'doctor',
    'ローカル検証用アカウント',
    CURRENT_DATE,
    'dev@example.com',
    selected_facility.id,
    'doctor',
    'Doctor',
    '99',
    '01',
    'General Practice',
    '99',
    'TOTP',
    '+819012345678',
    '+819012345679',
    'RX-0001'
FROM selected_facility
ON CONFLICT (userId) DO UPDATE SET
    password = EXCLUDED.password,
    commonName = EXCLUDED.commonName,
    memberType = EXCLUDED.memberType,
    memo = EXCLUDED.memo,
    email = EXCLUDED.email,
    facility_id = EXCLUDED.facility_id;

-- SYSAD ロールを必ず付与する。
INSERT INTO d_roles (id, user_id, c_role, c_user)
SELECT
    nextval('hibernate_sequence'),
    u.userId,
    'system-administrator',
    u.id
FROM d_users u
WHERE u.userId = 'LOCAL.FACILITY.0001:dolphin'
  AND NOT EXISTS (
    SELECT 1 FROM d_roles r
    WHERE r.user_id = u.userId
      AND r.c_role = 'system-administrator'
  );

-- JPQL parity 用の施設 (1.3.6.1.4.1.9414.72.103) を整備する。
INSERT INTO d_facility (
    id,
    facilityId,
    facilityName,
    zipCode,
    address,
    telephone,
    registeredDate,
    memberType,
    url
)
VALUES (
    COALESCE(
        (SELECT id FROM d_facility WHERE facilityId = '1.3.6.1.4.1.9414.72.103'),
        nextval('hibernate_sequence')
    ),
    '1.3.6.1.4.1.9414.72.103',
    'OpenDolphin Trace Clinic',
    '1000002',
    '東京都千代田区1-1-2',
    '03-0000-0001',
    CURRENT_DATE,
    'facility',
    'https://localhost/trace-clinic'
)
ON CONFLICT (facilityId) DO UPDATE SET
    facilityName = EXCLUDED.facilityName,
    zipCode = EXCLUDED.zipCode,
    address = EXCLUDED.address,
    telephone = EXCLUDED.telephone,
    registeredDate = EXCLUDED.registeredDate,
    memberType = EXCLUDED.memberType,
    url = EXCLUDED.url;

WITH facility_pk AS (
    SELECT id FROM d_facility WHERE facilityId = '1.3.6.1.4.1.9414.72.103' LIMIT 1
), user_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_users WHERE userId = '1.3.6.1.4.1.9414.72.103:doctor1'),
        nextval('hibernate_sequence')
    ) AS id
)
INSERT INTO d_users (
    id,
    userId,
    password,
    sirName,
    givenName,
    commonName,
    memberType,
    memo,
    registeredDate,
    email,
    facility_id,
    license,
    licenseDesc,
    licenseCodeSys,
    department,
    departmentDesc,
    departmentCodeSys,
    factor2Auth,
    mainMobile,
    subMobile,
    useDrugId
)
SELECT
    (SELECT id FROM user_seed),
    '1.3.6.1.4.1.9414.72.103:doctor1',
    '632080fabdb968f9ac4f31fb55104648',
    '医師',
    '一郎',
    'Doctor One',
    'doctor',
    'JPQL parity trace physician',
    CURRENT_DATE,
    'doctor1@example.com',
    facility_pk.id,
    'doctor',
    'Doctor',
    '99',
    '01',
    'General Practice',
    '99',
    'TOTP',
    '+819012300001',
    '+819012300002',
    'RX-JPQL-0001'
FROM facility_pk
ON CONFLICT (userId) DO UPDATE SET
    password = EXCLUDED.password,
    commonName = EXCLUDED.commonName,
    memberType = EXCLUDED.memberType,
    memo = EXCLUDED.memo,
    email = EXCLUDED.email,
    facility_id = EXCLUDED.facility_id;

INSERT INTO d_roles (id, user_id, c_role, c_user)
SELECT
    nextval('hibernate_sequence'),
    '1.3.6.1.4.1.9414.72.103:doctor1',
    'doctor',
    u.id
FROM d_users u
WHERE u.userId = '1.3.6.1.4.1.9414.72.103:doctor1'
  AND NOT EXISTS (
    SELECT 1 FROM d_roles r
    WHERE r.user_id = '1.3.6.1.4.1.9414.72.103:doctor1'
      AND r.c_role = 'doctor'
  );

WITH patient_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_patient WHERE facilityId = '1.3.6.1.4.1.9414.72.103' AND patientId = '0000001'),
        nextval('hibernate_sequence')
    ) AS id
), upsert_patient AS (
    INSERT INTO d_patient (
        id,
        facilityId,
        patientId,
        familyName,
        givenName,
        fullName,
        kanaFamilyName,
        kanaGivenName,
        kanaName,
        romanFamilyName,
        romanGivenName,
        romanName,
        gender,
        birthday,
        telephone,
        email
    ) VALUES (
        (SELECT id FROM patient_seed),
        '1.3.6.1.4.1.9414.72.103',
        '0000001',
        '架空',
        '花子',
        '架空 花子',
        'カクウ',
        'ハナコ',
        'カクウ ハナコ',
        'Kakuu',
        'Hanako',
        'Kakuu Hanako',
        'F',
        '1985-05-23',
        '03-0000-0020',
        'patient0001@example.com'
    )
    ON CONFLICT (id) DO UPDATE SET
        facilityId = EXCLUDED.facilityId,
        patientId = EXCLUDED.patientId,
        fullName = EXCLUDED.fullName,
        gender = EXCLUDED.gender
    RETURNING id
)
SELECT id FROM upsert_patient;

WITH patient_ref AS (
    SELECT id FROM d_patient WHERE facilityId = '1.3.6.1.4.1.9414.72.103' AND patientId = '0000001' LIMIT 1
), karte_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_karte WHERE patient_id = (SELECT id FROM patient_ref)),
        nextval('hibernate_sequence')
    ) AS id
)
INSERT INTO d_karte (id, patient_id, created)
VALUES (
    (SELECT id FROM karte_seed),
    (SELECT id FROM patient_ref),
    CURRENT_DATE
)
ON CONFLICT (id) DO UPDATE SET
    patient_id = EXCLUDED.patient_id,
    created = EXCLUDED.created;

WITH patient_ref AS (
    SELECT id, facilityId FROM d_patient WHERE facilityId = '1.3.6.1.4.1.9414.72.103' AND patientId = '0000001' LIMIT 1
), pvt_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_patient_visit WHERE patient_id = (SELECT id FROM patient_ref) AND pvtDate = '2025-11-09T09:00:00'),
        nextval('hibernate_sequence')
    ) AS id
)
INSERT INTO d_patient_visit (
    id,
    patient_id,
    facilityId,
    number,
    pvtDate,
    appointment,
    department,
    status,
    insuranceUid,
    deptCode,
    deptName,
    doctorId,
    doctorName,
    jmariNumber,
    firstInsurance,
    memo,
    watingTime
)
VALUES (
    (SELECT id FROM pvt_seed),
    (SELECT id FROM patient_ref),
    (SELECT facilityId FROM patient_ref),
    1,
    '2025-11-09T09:00:00',
    NULL,
    'General Practice,01,Doctor One,doctor1,JMARI0001',
    0,
    NULL,
    '01',
    'General Practice',
    'doctor1',
    'Doctor One',
    'JMARI0001',
    'National Insurance',
    '受付メモ: 予定カルテ JPQL',
    '00:15'
)
ON CONFLICT (id) DO UPDATE SET
    facilityId = EXCLUDED.facilityId,
    pvtDate = EXCLUDED.pvtDate,
    deptName = EXCLUDED.deptName,
    deptCode = EXCLUDED.deptCode,
    doctorId = EXCLUDED.doctorId,
    doctorName = EXCLUDED.doctorName;

WITH creator_ref AS (
    SELECT id FROM d_users WHERE userId = '1.3.6.1.4.1.9414.72.103:doctor1' LIMIT 1
), karte_ref AS (
    SELECT k.id AS karte_id, p.patientId AS patient_code
    FROM d_karte k
    JOIN d_patient p ON p.id = k.patient_id
    WHERE p.facilityId = '1.3.6.1.4.1.9414.72.103'
      AND p.patientId = '0000001'
    LIMIT 1
)
INSERT INTO d_appo (
    id,
    confirmed,
    started,
    ended,
    recorded,
    linkId,
    linkRelation,
    status,
    creator_id,
    karte_id,
    patientId,
    c_name,
    memo,
    c_date
)
SELECT
    8001,
    TIMESTAMP '2025-11-09 08:00:00',
    TIMESTAMP '2025-11-09 08:00:00',
    NULL,
    TIMESTAMP '2025-11-09 08:05:00',
    0,
    'SELF',
    'F',
    creator_ref.id,
    karte_ref.karte_id,
    karte_ref.patient_code,
    '初診外来',
    'JPQL parity synthetic appointment',
    DATE '2025-11-10'
FROM creator_ref, karte_ref
ON CONFLICT (id) DO UPDATE SET
    c_name = EXCLUDED.c_name,
    c_date = EXCLUDED.c_date,
    creator_id = EXCLUDED.creator_id,
    karte_id = EXCLUDED.karte_id,
    patientId = EXCLUDED.patientId;

COMMIT;
