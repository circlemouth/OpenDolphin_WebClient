-- Diagnosis parity seed for Legacy Postgres
-- Inserts minimal patient / karte / letter records and aligns diagnosis sequences.
-- 冪等に実行できるよう ON CONFLICT を使用する。

BEGIN;

-- 患者: テスト 太郎 (patientId=0000001, facilityId=F001)
INSERT INTO public.d_patient (
    id, facilityid, patientid, fullname, gender, genderdesc,
    kanafamilyname, kanagivenname, kananame,
    birthday, telephone, mobilephone, email,
    reserve1, reserve2, reserve3, reserve4, reserve5, reserve6,
    memo, address, zipcode, romanfamilyname, romangivenname, romanname
) VALUES (
    1001, 'F001', '0000001', 'テスト 太郎', 'M', '男性',
    'テスト', 'タロウ', 'テスト タロウ',
    '1980-05-05', '03-0000-1234', '080-0000-5678', 'test.taro@example.com',
    '要配慮: 花粉症', '在宅酸素', 'MRワクチン済', '要薬剤指導', '家族付き添い', '要通訳',
    'Legacy diagnosis parity seed', '東京都千代田区千代田1-1-1', '100-8111',
    'Test', 'Taro', 'Taro Test'
) ON CONFLICT (id) DO UPDATE
SET facilityid = EXCLUDED.facilityid,
    patientid = EXCLUDED.patientid,
    fullname = EXCLUDED.fullname,
    gender = EXCLUDED.gender,
    memo = EXCLUDED.memo;

-- カルテ: patient=1001 に紐づく 2001 番
INSERT INTO public.d_karte (id, created, patient_id)
VALUES (2001, DATE '2020-04-01', 1001)
ON CONFLICT (id) DO UPDATE
SET created = EXCLUDED.created,
    patient_id = EXCLUDED.patient_id;

-- 紹介状モジュール (監査・外部連携用メタデータ)
INSERT INTO public.d_letter_module (
    id, confirmed, started, ended, recorded, linkid, linkrelation,
    status, creator_id, karte_id,
    title, lettertype, handleclass,
    patientid, patientname, patientkana, patientgender, patientbirthday,
    patientzipcode, patientaddress, patienttelephone, patientmobilephone,
    clienthospital, clientdept, clientdoctor, clientzipcode, clientaddress,
    clienttelephone, clientfax
) VALUES (
    7001001,
    TIMESTAMP '2025-11-08 09:30:00',
    TIMESTAMP '2025-11-08 09:30:00',
    NULL,
    TIMESTAMP '2025-11-08 09:31:00',
    0,
    'seed',
    'F',
    9001,
    2001,
    'Legacy Diagnosis Seed Letter',
    'Referral',
    'DIAGNOSIS_PARITY',
    '0000001',
    'テスト 太郎',
    'テスト タロウ',
    'M',
    '1980-05-05',
    '100-8111',
    '東京都千代田区千代田1-1-1',
    '03-0000-1234',
    '080-0000-5678',
    'OpenDolphin Test Clinic',
    '内科',
    'Doctor Test',
    '100-8111',
    '東京都千代田区千代田1-1-1',
    '03-0000-0000',
    '03-0000-0001'
) ON CONFLICT (id) DO UPDATE
SET confirmed = EXCLUDED.confirmed,
    started = EXCLUDED.started,
    recorded = EXCLUDED.recorded,
    creator_id = EXCLUDED.creator_id,
    karte_id = EXCLUDED.karte_id,
    title = EXCLUDED.title;

-- 診断シード（参考用）。実運用では API 実行で追加されるため、存在しない場合のみ挿入。
WITH existing AS (
    SELECT 1 FROM opendolphin.d_diagnosis WHERE id = 9001001
)
INSERT INTO opendolphin.d_diagnosis (
    id, confirmed, ended, linkid, linkrelation, recorded, started, status,
    department, departmentdesc,
    diagnosis, diagnosiscategory, diagnosiscategorycodesys, diagnosiscategorydesc,
    diagnosiscode, diagnosiscodesystem,
    outcome, outcomecodesys, outcomedesc,
    firstencounterdate, relatedhealthinsurance,
    creator_id, karte_id
)
SELECT
    9001001,
    TIMESTAMP '2025-10-01 09:00:00',
    NULL,
    0,
    'seed',
    TIMESTAMP '2025-10-01 09:05:00',
    TIMESTAMP '2025-10-01 09:00:00',
    'F',
    '01',
    '内科',
    'シード病名',
    'mainDiagnosis',
    'custom',
    '主病名',
    'J00',
    'ICD10',
    'provisional',
    'custom',
    '継続',
    '2025-10-01',
    '060',
    9001,
    2001
WHERE NOT EXISTS (SELECT 1 FROM existing);

-- シーケンスを 2025 parity 用レンジ (>= 9002000) に揃える。
DO $$
DECLARE
  max_id bigint;
  target_value bigint;
BEGIN
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM opendolphin.d_diagnosis;
  target_value := GREATEST(max_id, 9002000);
  PERFORM setval('hibernate_sequence', target_value, true);
  PERFORM setval('opendolphin.d_diagnosis_seq', target_value, true);
END $$;

COMMIT;
