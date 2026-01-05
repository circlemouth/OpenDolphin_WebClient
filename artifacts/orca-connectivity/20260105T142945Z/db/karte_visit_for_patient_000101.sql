SET search_path = public;

WITH selected_patient AS (
    SELECT id FROM d_patient WHERE facilityid = 'LOCAL.FACILITY.0001' AND patientid = '000101' LIMIT 1
)
INSERT INTO d_karte (id, patient_id, created)
SELECT nextval('hibernate_sequence'), id, CURRENT_DATE
FROM selected_patient
WHERE NOT EXISTS (SELECT 1 FROM d_karte WHERE patient_id = id);

WITH selected_patient AS (
    SELECT id FROM d_patient WHERE facilityid = 'LOCAL.FACILITY.0001' AND patientid = '000101' LIMIT 1
)
INSERT INTO d_patient_visit (
    id, patient_id, facilityid, pvtdate, status, deptcode, deptname, doctorid, doctorname
)
SELECT nextval('hibernate_sequence'), id, 'LOCAL.FACILITY.0001', '2026-01-05', 0, '01', 'Internal', 'doctor1', 'Dr One'
FROM selected_patient
WHERE NOT EXISTS (
    SELECT 1 FROM d_patient_visit WHERE patient_id = id AND pvtdate = '2026-01-05'
);
