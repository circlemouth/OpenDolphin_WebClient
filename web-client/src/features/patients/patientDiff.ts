import type { PatientRecord } from './api';

export type PatientEditableSection = 'basic' | 'insurance';

const BASIC_KEYS: (keyof PatientRecord)[] = ['name', 'kana', 'birthDate', 'sex', 'phone', 'zip', 'address'];
const INSURANCE_KEYS: (keyof PatientRecord)[] = ['insurance'];

export const PATIENT_FIELD_LABEL: Record<keyof PatientRecord, string> = {
  patientId: '患者ID',
  name: '氏名',
  kana: 'カナ',
  birthDate: '生年月日',
  sex: '性別',
  phone: '電話',
  zip: '郵便番号',
  address: '住所',
  insurance: '保険/自費',
  memo: 'メモ',
  lastVisit: '最終受診',
};

const normalize = (value: unknown) => (value === undefined || value === null ? '' : String(value)).trim();

export function diffPatientKeys(params: {
  baseline: PatientRecord | null;
  draft: PatientRecord;
  section: PatientEditableSection;
}): (keyof PatientRecord)[] {
  const { baseline, draft, section } = params;
  const keys = section === 'insurance' ? INSURANCE_KEYS : BASIC_KEYS;
  if (!baseline) {
    return keys.filter((key) => normalize((draft as any)[key]) !== '');
  }
  return keys.filter((key) => normalize((baseline as any)[key]) !== normalize((draft as any)[key]));
}

export function pickPatientSection(params: {
  baseline?: PatientRecord | null;
  fallback?: PatientRecord | null;
  section: PatientEditableSection;
}): PatientRecord {
  const { baseline, fallback, section } = params;
  const source = baseline ?? fallback ?? {};
  const next: PatientRecord = {
    patientId: source.patientId,
    name: source.name,
    kana: source.kana,
    birthDate: source.birthDate,
    sex: source.sex,
    phone: source.phone,
    zip: source.zip,
    address: source.address,
    insurance: source.insurance,
    memo: source.memo,
    lastVisit: source.lastVisit,
  };
  if (section === 'insurance') {
    // insurance 以外は閲覧用なので不要な値は残しておく（差分表示に使う）
    return next;
  }
  return next;
}

