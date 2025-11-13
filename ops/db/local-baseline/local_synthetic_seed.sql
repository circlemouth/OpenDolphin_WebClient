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

CREATE SEQUENCE IF NOT EXISTS d_letter_module_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS d_document_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS d_module_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS d_image_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS d_attachment_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_letter_module (
    id BIGINT NOT NULL DEFAULT nextval('d_letter_module_seq'),
    confirmed TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    started TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ended TIMESTAMP WITHOUT TIME ZONE,
    recorded TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    linkId BIGINT,
    linkRelation VARCHAR(255),
    status VARCHAR(1) NOT NULL DEFAULT 'F',
    creator_id BIGINT NOT NULL,
    karte_id BIGINT NOT NULL,
    title VARCHAR(255),
    letterType VARCHAR(255),
    handleClass VARCHAR(255),
    clientHospital VARCHAR(255),
    clientDept VARCHAR(255),
    clientDoctor VARCHAR(255),
    clientZipCode VARCHAR(32),
    clientAddress VARCHAR(255),
    clientTelephone VARCHAR(64),
    clientFax VARCHAR(64),
    consultantHospital VARCHAR(255),
    consultantDept VARCHAR(255),
    consultantDoctor VARCHAR(255),
    consultantZipCode VARCHAR(32),
    consultantAddress VARCHAR(255),
    consultantTelephone VARCHAR(64),
    consultantFax VARCHAR(64),
    patientId VARCHAR(64),
    patientName VARCHAR(255),
    patientKana VARCHAR(255),
    patientGender VARCHAR(16),
    patientBirthday VARCHAR(32),
    patientAge VARCHAR(32),
    patientOccupation VARCHAR(255),
    patientZipCode VARCHAR(32),
    patientAddress VARCHAR(255),
    patientTelephone VARCHAR(64),
    patientMobilePhone VARCHAR(64),
    patientFaxNumber VARCHAR(64),
    CONSTRAINT d_letter_module_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_letter_module_creator FOREIGN KEY (creator_id) REFERENCES d_users(id),
    CONSTRAINT fk_d_letter_module_karte FOREIGN KEY (karte_id) REFERENCES d_karte(id)
);

CREATE INDEX IF NOT EXISTS d_letter_module_idx
    ON d_letter_module (karte_id);

CREATE SEQUENCE IF NOT EXISTS d_nlabo_module_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_nlabo_module (
    id BIGINT NOT NULL DEFAULT nextval('d_nlabo_module_seq'),
    patientId VARCHAR(64) NOT NULL,
    laboCenterCode VARCHAR(64),
    patientName VARCHAR(255),
    patientSex VARCHAR(16),
    sampleDate VARCHAR(64),
    numOfItems VARCHAR(32),
    moduleKey VARCHAR(255),
    reportFormat VARCHAR(255),
    CONSTRAINT d_nlabo_module_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS d_nlabo_module_pid_idx
    ON d_nlabo_module (patientId, sampleDate DESC);

CREATE SEQUENCE IF NOT EXISTS d_nlabo_item_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_nlabo_item (
    id BIGINT NOT NULL DEFAULT nextval('d_nlabo_item_seq'),
    patientId VARCHAR(64) NOT NULL,
    sampleDate VARCHAR(64) NOT NULL,
    laboCode VARCHAR(64),
    lipemia VARCHAR(32),
    hemolysis VARCHAR(32),
    dialysis VARCHAR(32),
    reportStatus VARCHAR(32),
    groupCode VARCHAR(64) NOT NULL,
    groupName VARCHAR(255),
    parentCode VARCHAR(64) NOT NULL,
    itemCode VARCHAR(64) NOT NULL,
    medisCode VARCHAR(64),
    itemName VARCHAR(255) NOT NULL,
    abnormalFlg VARCHAR(32),
    normalValue VARCHAR(255),
    c_value VARCHAR(255),
    unit VARCHAR(32),
    specimenCode VARCHAR(64),
    specimenName VARCHAR(255),
    commentCode1 VARCHAR(64),
    comment1 VARCHAR(255),
    commentCode2 VARCHAR(64),
    comment2 VARCHAR(255),
    sortKey VARCHAR(64),
    laboModule_id BIGINT NOT NULL,
    CONSTRAINT d_nlabo_item_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_nlabo_item_module FOREIGN KEY (laboModule_id) REFERENCES d_nlabo_module(id)
);

CREATE INDEX IF NOT EXISTS d_nlabo_item_module_idx
    ON d_nlabo_item (laboModule_id);

CREATE INDEX IF NOT EXISTS d_nlabo_item_patient_idx
    ON d_nlabo_item (patientId, sampleDate DESC);

CREATE SEQUENCE IF NOT EXISTS d_stamp_tree_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS d_stamp_tree (
    id BIGINT NOT NULL DEFAULT nextval('d_stamp_tree_seq'),
    user_id BIGINT NOT NULL,
    tree_name VARCHAR(255) NOT NULL,
    publishType VARCHAR(64),
    category VARCHAR(64),
    partyName VARCHAR(255),
    url VARCHAR(255),
    description TEXT,
    publishedDate DATE,
    lastUpdated DATE,
    published VARCHAR(255),
    treeBytes BYTEA NOT NULL,
    versionNumber VARCHAR(64),
    CONSTRAINT d_stamp_tree_pkey PRIMARY KEY (id),
    CONSTRAINT fk_d_stamp_tree_user FOREIGN KEY (user_id) REFERENCES d_users(id)
);

CREATE INDEX IF NOT EXISTS d_stamp_tree_user_idx
    ON d_stamp_tree (user_id);

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

-- Chart summary seed for WEB1001 (ChartsPage parity)
WITH web_patient_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_patient WHERE facilityId = '1.3.6.1.4.1.9414.72.103' AND patientId = 'WEB1001'),
        nextval('hibernate_sequence')
    ) AS id
), upsert_web_patient AS (
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
        (SELECT id FROM web_patient_seed),
        '1.3.6.1.4.1.9414.72.103',
        'WEB1001',
        '青木',
        '太郎',
        '青木 太郎',
        'アオキ',
        'タロウ',
        'アオキ タロウ',
        'Aoki',
        'Taro',
        'Aoki Taro',
        'M',
        '1980-01-15',
        '03-6200-1001',
        'web1001@example.com'
    )
    ON CONFLICT (id) DO UPDATE SET
        facilityId = EXCLUDED.facilityId,
        patientId = EXCLUDED.patientId,
        fullName = EXCLUDED.fullName,
        gender = EXCLUDED.gender
    RETURNING id
)
SELECT id FROM upsert_web_patient;

WITH web_patient_ref AS (
    SELECT id FROM d_patient WHERE facilityId = '1.3.6.1.4.1.9414.72.103' AND patientId = 'WEB1001' LIMIT 1
), web_karte_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_karte WHERE patient_id = (SELECT id FROM web_patient_ref)),
        10 -- Legacy parity requires fixed d_karte PK
    ) AS id
)
INSERT INTO d_karte (id, patient_id, created)
VALUES (
    (SELECT id FROM web_karte_seed),
    (SELECT id FROM web_patient_ref),
    DATE '2024-03-15'
)
ON CONFLICT (id) DO UPDATE SET
    patient_id = EXCLUDED.patient_id,
    created = EXCLUDED.created;

WITH web_patient_ref AS (
    SELECT id, facilityId FROM d_patient WHERE facilityId = '1.3.6.1.4.1.9414.72.103' AND patientId = 'WEB1001' LIMIT 1
), web_visit_seed AS (
    SELECT COALESCE(
        (SELECT id FROM d_patient_visit WHERE patient_id = (SELECT id FROM web_patient_ref) AND pvtDate = '2025-11-10T10:30:00'),
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
    (SELECT id FROM web_visit_seed),
    (SELECT id FROM web_patient_ref),
    (SELECT facilityId FROM web_patient_ref),
    2,
    '2025-11-10T10:30:00',
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
    'Chart summary synthetic visit',
    '00:20'
)
ON CONFLICT (id) DO UPDATE SET
    facilityId = EXCLUDED.facilityId,
    pvtDate = EXCLUDED.pvtDate,
    deptName = EXCLUDED.deptName,
    deptCode = EXCLUDED.deptCode,
    doctorId = EXCLUDED.doctorId,
    doctorName = EXCLUDED.doctorName;

-- Letter parity seed (WEB1001)
WITH creator_ref AS (
    SELECT id FROM d_users WHERE userId = '1.3.6.1.4.1.9414.72.103:doctor1' LIMIT 1
), karte_ref AS (
    SELECT k.id AS karte_id
    FROM d_karte k
    JOIN d_patient p ON p.id = k.patient_id
    WHERE p.facilityId = '1.3.6.1.4.1.9414.72.103'
      AND p.patientId = 'WEB1001'
    LIMIT 1
)
INSERT INTO d_letter_module (
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
    title,
    letterType,
    handleClass,
    clientHospital,
    clientDept,
    clientDoctor,
    clientZipCode,
    clientAddress,
    clientTelephone,
    clientFax,
    consultantHospital,
    consultantDept,
    consultantDoctor,
    consultantZipCode,
    consultantAddress,
    consultantTelephone,
    consultantFax,
    patientId,
    patientName,
    patientKana,
    patientGender,
    patientBirthday,
    patientAge,
    patientOccupation,
    patientZipCode,
    patientAddress,
    patientTelephone,
    patientMobilePhone,
    patientFaxNumber
)
SELECT
    8,
    TIMESTAMP '2025-11-10 00:00:00',
    TIMESTAMP '2025-11-10 00:00:00',
    NULL,
    TIMESTAMP '2025-11-10 00:00:00',
    0,
    'new',
    'F',
    creator_ref.id,
    karte_ref.karte_id,
    '紹介状パリティテスト',
    'REFERRAL',
    'open.dolphin.impl.letter.LetterImpl',
    'OpenDolphin Clinic',
    '内科',
    '堂粉 太郎',
    '1000001',
    '東京都千代田区1-1-1',
    '03-0000-0000',
    NULL,
    'Reference Hospital',
    '循環器科',
    '紹介 先医師',
    '1500001',
    '東京都渋谷区2-2-2',
    '03-1111-1111',
    NULL,
    'WEB1001',
    'ウェブ 太郎',
    'ウェブタロウ',
    'M',
    '1985-04-01',
    '40',
    NULL,
    '1000001',
    '東京都千代田区1-1-1',
    '03-0000-0000',
    NULL,
    NULL
FROM creator_ref, karte_ref
ON CONFLICT (id) DO UPDATE SET
    confirmed = EXCLUDED.confirmed,
    recorded = EXCLUDED.recorded,
    letterType = EXCLUDED.letterType,
    handleClass = EXCLUDED.handleClass,
    clientHospital = EXCLUDED.clientHospital,
    consultantHospital = EXCLUDED.consultantHospital,
    patientName = EXCLUDED.patientName,
    patientKana = EXCLUDED.patientKana,
    patientGender = EXCLUDED.patientGender,
    patientBirthday = EXCLUDED.patientBirthday,
    patientAddress = EXCLUDED.patientAddress;

-- NLabo module + item seed for WEB1001
WITH module_seed AS (
    INSERT INTO d_nlabo_module (
        id,
        patientId,
        laboCenterCode,
        patientName,
        patientSex,
        sampleDate,
        numOfItems,
        moduleKey,
        reportFormat
    ) VALUES (
        9101,
        '1.3.6.1.4.1.9414.72.103:WEB1001',
        'NLABO01',
        '青木 太郎',
        'M',
        '2025-11-08T09:15:00',
        '2',
        'WEB1001-20251108',
        'NLabV1'
    )
    ON CONFLICT (id) DO UPDATE SET
        sampleDate = EXCLUDED.sampleDate,
        numOfItems = EXCLUDED.numOfItems,
        moduleKey = EXCLUDED.moduleKey,
        reportFormat = EXCLUDED.reportFormat
    RETURNING id
)
INSERT INTO d_nlabo_item (
    id,
    patientId,
    sampleDate,
    laboCode,
    lipemia,
    hemolysis,
    dialysis,
    reportStatus,
    groupCode,
    groupName,
    parentCode,
    itemCode,
    medisCode,
    itemName,
    abnormalFlg,
    normalValue,
    c_value,
    unit,
    specimenCode,
    specimenName,
    commentCode1,
    comment1,
    commentCode2,
    comment2,
    sortKey,
    laboModule_id
)
SELECT * FROM (
    VALUES
        (
            9201,
            '1.3.6.1.4.1.9414.72.103:WEB1001',
            '2025-11-08T09:15:00',
            'HGB',
            NULL,
            NULL,
            NULL,
            'final',
            'HEM',
            '血液一般',
            'BLOOD',
            'HGB',
            '12345',
            'ヘモグロビン',
            'N',
            '13.0-17.0',
            '15.2',
            'g/dL',
            'WB',
            '全血',
            NULL,
            NULL,
            NULL,
            NULL,
            '01',
            (SELECT id FROM module_seed)
        ),
        (
            9202,
            '1.3.6.1.4.1.9414.72.103:WEB1001',
            '2025-11-08T09:15:00',
            'WBC',
            NULL,
            NULL,
            NULL,
            'final',
            'HEM',
            '血液一般',
            'BLOOD',
            'WBC',
            '54321',
            '白血球数',
            'H',
            '3.5-9.0',
            '10.2',
            '10^3/uL',
            'WB',
            '全血',
            NULL,
            NULL,
            NULL,
            NULL,
            '02',
            (SELECT id FROM module_seed)
        )
) AS items(
    id,
    patientId,
    sampleDate,
    laboCode,
    lipemia,
    hemolysis,
    dialysis,
    reportStatus,
    groupCode,
    groupName,
    parentCode,
    itemCode,
    medisCode,
    itemName,
    abnormalFlg,
    normalValue,
    c_value,
    unit,
    specimenCode,
    specimenName,
    commentCode1,
    comment1,
    commentCode2,
    comment2,
    sortKey,
    laboModule_id
)
ON CONFLICT (id) DO UPDATE SET
    sampleDate = EXCLUDED.sampleDate,
    c_value = EXCLUDED.c_value,
    abnormalFlg = EXCLUDED.abnormalFlg;

-- Stamp tree seed for doctor1
WITH user_ref AS (
    SELECT id FROM d_users WHERE userId = '1.3.6.1.4.1.9414.72.103:doctor1' LIMIT 1
)
INSERT INTO d_stamp_tree (
    id,
    user_id,
    tree_name,
    publishType,
    category,
    partyName,
    url,
    description,
    publishedDate,
    lastUpdated,
    published,
    treeBytes,
    versionNumber
)
SELECT
    9,
    user_ref.id,
    'スタンプパーソナル',
    'facility',
    'karte',
    'OpenDolphin Clinic',
    'https://example.com',
    'Parity stamp tree',
    DATE '2025-11-10',
    DATE '2025-11-10',
    NULL,
    decode('PHN0YW1wVHJlZSB2ZXJzaW9uPSIxLjAiPjxmb2xkZXIgbmFtZT0icm9vdCI+PC9mb2xkZXI+PC9zdGFtcFRyZWU+', 'base64'),
    '0'
FROM user_ref
ON CONFLICT (id) DO UPDATE SET
    lastUpdated = EXCLUDED.lastUpdated,
    treeBytes = EXCLUDED.treeBytes,
    versionNumber = EXCLUDED.versionNumber;

-- Align sequences with seeded IDs
SELECT setval('d_letter_module_seq', COALESCE((SELECT MAX(id) FROM d_letter_module), 1));
SELECT setval('d_nlabo_module_seq', COALESCE((SELECT MAX(id) FROM d_nlabo_module), 9101));
SELECT setval('d_nlabo_item_seq', COALESCE((SELECT MAX(id) FROM d_nlabo_item), 9202));
SELECT setval('d_stamp_tree_seq', COALESCE((SELECT MAX(id) FROM d_stamp_tree), 1));


COMMIT;
