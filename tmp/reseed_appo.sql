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
