SET search_path = public;

WITH patient_seed AS (
    INSERT INTO d_patient (
        id, facilityid, patientid, fullname, gender, birthday,
        familyname, givenname, kananame, kanafamilyname, kanagivenname
    ) VALUES (
        nextval('hibernate_sequence'),
        'LOCAL.FACILITY.0001',
        '000001',
        'Test Taro',
        'M',
        '1980-01-01',
        'Test',
        'Taro',
        'TEST TARO',
        'TEST',
        'TARO'
    )
    ON CONFLICT (facilityid, patientid) DO UPDATE SET
        fullname = EXCLUDED.fullname,
        birthday = EXCLUDED.birthday,
        gender = EXCLUDED.gender
    RETURNING id
), selected_patient AS (
    SELECT id FROM patient_seed
    UNION ALL
    SELECT id FROM d_patient WHERE facilityid = 'LOCAL.FACILITY.0001' AND patientid = '000001' LIMIT 1
)
INSERT INTO d_karte (id, patient_id, created)
SELECT nextval('hibernate_sequence'), id, CURRENT_DATE
FROM selected_patient
WHERE NOT EXISTS (SELECT 1 FROM d_karte WHERE patient_id = id);

WITH selected_patient AS (
    SELECT id FROM d_patient WHERE facilityid = 'LOCAL.FACILITY.0001' AND patientid = '000001' LIMIT 1
)
INSERT INTO d_patient_visit (
    id, patient_id, facilityid, pvtdate, status, deptcode, deptname, doctorid, doctorname
)
SELECT nextval('hibernate_sequence'), id, 'LOCAL.FACILITY.0001', '2026-01-05', 0, '01', 'Internal', 'doctor1', 'Dr One'
FROM selected_patient
WHERE NOT EXISTS (
    SELECT 1 FROM d_patient_visit WHERE patient_id = id AND pvtdate = '2026-01-05'
);
