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

COMMIT;
