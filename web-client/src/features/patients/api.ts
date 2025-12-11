import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition } from '../../libs/observability/types';

export type PatientRecord = {
  patientId?: string;
  name?: string;
  kana?: string;
  birthDate?: string;
  sex?: string;
  phone?: string;
  zip?: string;
  address?: string;
  insurance?: string;
  memo?: string;
  lastVisit?: string;
};

export type PatientSearchParams = {
  keyword?: string;
  departmentCode?: string;
  physicianCode?: string;
  paymentMode?: 'all' | 'insurance' | 'self';
};

export type PatientListResponse = {
  patients: PatientRecord[];
  runId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  dataSourceTransition?: DataSourceTransition;
  fallbackUsed?: boolean;
  auditEvent?: Record<string, unknown>;
  raw?: unknown;
};

export type PatientMutationPayload = {
  patient: PatientRecord;
  operation: 'create' | 'update' | 'delete';
  runId?: string;
};

export type PatientMutationResult = {
  ok: boolean;
  runId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  dataSourceTransition?: DataSourceTransition;
  fallbackUsed?: boolean;
  auditEvent?: Record<string, unknown>;
  message?: string;
  patient?: PatientRecord;
};

const SAMPLE_PATIENTS: PatientRecord[] = [
  {
    patientId: '000001',
    name: '山田 花子',
    kana: 'ヤマダ ハナコ',
    birthDate: '1985-04-12',
    sex: 'F',
    phone: '03-1234-5678',
    insurance: '社保12',
    memo: '高血圧フォロー',
    lastVisit: '2025-12-08',
  },
  {
    patientId: '000002',
    name: '佐藤 太郎',
    kana: 'サトウ タロウ',
    birthDate: '1978-11-30',
    sex: 'M',
    phone: '03-9876-5432',
    insurance: '国保34',
    memo: '膝関節痛',
    lastVisit: '2025-12-04',
  },
  {
    patientId: '000003',
    name: '高橋 光',
    kana: 'タカハシ ヒカリ',
    birthDate: '1992-02-01',
    sex: 'F',
    phone: '080-1234-4444',
    insurance: '自費',
    memo: '健診',
    lastVisit: '2025-11-30',
  },
];

const patientCandidates = ['/orca12/patientmodv2/outpatient', '/orca12/patientmodv2/outpatient/mock'];

const normalizeBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return undefined;
};

const parsePatients = (json: any): PatientRecord[] => {
  const list: any[] = Array.isArray(json?.patients)
    ? json.patients
    : Array.isArray(json?.patientInformation)
      ? json.patientInformation
      : [];

  const mapOne = (raw: any): PatientRecord => ({
    patientId: raw.patientId ?? raw.Patient_ID ?? raw.patient_id ?? raw.id,
    name: raw.name ?? raw.Patient_Name ?? raw.wholeName,
    kana: raw.kana ?? raw.Patient_Kana ?? raw.wholeNameKana,
    birthDate: raw.birthDate ?? raw.Patient_BirthDate ?? raw.birth,
    sex: raw.sex ?? raw.Patient_Sex ?? raw.gender,
    phone: raw.phone ?? raw.PhoneNumber ?? raw.tel,
    zip: raw.zip ?? raw.postal,
    address: raw.address,
    insurance: raw.insurance ?? raw.insuranceCombinationNumber ?? raw.payCategory,
    memo: raw.memo ?? raw.note ?? raw.comment,
    lastVisit: raw.lastVisit ?? raw.visitDate ?? raw.last_visit,
  });

  return list.map(mapOne).filter((patient) => Object.keys(patient).length > 0);
};

const tryFetchJson = async (paths: string[], body: Record<string, unknown>) => {
  for (const path of paths) {
    try {
      const response = await httpFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) continue;
      const data = await response.json().catch(() => undefined);
      return { data, path };
    } catch (error) {
      console.warn('[patients] fetch failed for', path, error);
    }
  }
  return undefined;
};

export async function fetchPatients(params: PatientSearchParams): Promise<PatientListResponse> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  const payload: Record<string, unknown> = {
    keyword: params.keyword,
    departmentCode: params.departmentCode,
    physicianCode: params.physicianCode,
    paymentMode: params.paymentMode,
    runId,
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  updateObservabilityMeta({ runId });

  const result = await tryFetchJson(patientCandidates, payload);
  const json = (result?.data as Record<string, unknown>) ?? {};
  const patients = parsePatients(json);

  const meta: PatientListResponse = {
    patients: patients.length > 0 ? patients : SAMPLE_PATIENTS,
    runId: (json.runId as string | undefined) ?? getObservabilityMeta().runId,
    cacheHit: normalizeBoolean(json.cacheHit),
    missingMaster: normalizeBoolean(json.missingMaster),
    dataSourceTransition: json.dataSourceTransition as DataSourceTransition | undefined,
    fallbackUsed: normalizeBoolean(json.fallbackUsed),
    auditEvent: (json.auditEvent as Record<string, unknown>) ?? undefined,
    raw: json,
  };

  updateObservabilityMeta({
    runId: meta.runId,
    cacheHit: meta.cacheHit,
    missingMaster: meta.missingMaster,
    dataSourceTransition: meta.dataSourceTransition,
    fallbackUsed: meta.fallbackUsed,
  });

  return meta;
}

export async function savePatient(payload: PatientMutationPayload): Promise<PatientMutationResult> {
  const runId = payload.runId ?? getObservabilityMeta().runId ?? generateRunId();
  const auditEvent = {
    operation: payload.operation,
    runId,
    patientId: payload.patient.patientId,
    timestamp: new Date().toISOString(),
  };
  const body = {
    ...payload.patient,
    operation: payload.operation,
    auditEvent,
    runId,
  };
  updateObservabilityMeta({ runId });

  const response = await httpFetch('/orca12/patientmodv2/outpatient', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const result: PatientMutationResult = {
    ok: response.ok,
    runId: (json.runId as string | undefined) ?? runId,
    cacheHit: normalizeBoolean(json.cacheHit),
    missingMaster: normalizeBoolean(json.missingMaster),
    dataSourceTransition: json.dataSourceTransition as DataSourceTransition | undefined,
    fallbackUsed: normalizeBoolean(json.fallbackUsed),
    auditEvent: (json.auditEvent as Record<string, unknown>) ?? body.auditEvent,
    message: (json.apiResultMessage as string | undefined) ?? (response.ok ? '保存しました' : '保存に失敗しました'),
    patient: json.patient as PatientRecord | undefined,
  };

  updateObservabilityMeta({
    runId: result.runId,
    cacheHit: result.cacheHit,
    missingMaster: result.missingMaster,
    dataSourceTransition: result.dataSourceTransition,
    fallbackUsed: result.fallbackUsed,
  });

  return result;
}
