import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
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
  fetchedAt?: string;
  recordsReturned?: number;
  sourcePath?: string;
  status?: number;
  error?: string;
  auditEvent?: Record<string, unknown>;
  raw?: unknown;
};

export type PatientMutationPayload = {
  patient: PatientRecord;
  operation: 'create' | 'update' | 'delete';
  runId?: string;
  auditMeta?: {
    source?: 'patients' | 'charts';
    section?: 'basic' | 'insurance';
    changedKeys?: string[];
    receptionId?: string;
    appointmentId?: string;
    visitDate?: string;
    actorRole?: string;
  };
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
  status?: number;
  sourcePath?: string;
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

const patientInfoCandidates = ['/api01rv2/patient/outpatient', '/api01rv2/patient/outpatient/mock'];
const patientMutationCandidates = ['/orca12/patientmodv2/outpatient', '/orca12/patientmodv2/outpatient/mock'];

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

type FetchAttempt =
  | {
      data?: Record<string, unknown>;
      path?: string;
      status?: number;
      error?: undefined;
    }
  | {
      data?: undefined;
      path?: string;
      status?: number;
      error: string;
    };

const tryFetchJson = async (paths: string[], body: Record<string, unknown>): Promise<FetchAttempt | undefined> => {
  let lastFailure: FetchAttempt | undefined;
  for (const path of paths) {
    try {
      const response = await httpFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const status = response.status;
      const data = (await response.json().catch(() => undefined)) as Record<string, unknown> | undefined;
      if (response.ok) {
        return { data, path, status };
      }
      lastFailure = { data, path, status, error: `status ${status}` };
    } catch (error) {
      console.warn('[patients] fetch failed for', path, error);
      lastFailure = { path, error: error instanceof Error ? error.message : String(error) };
    }
  }
  return lastFailure;
};

const tryPostJson = async (paths: string[], body: Record<string, unknown>) => {
  let lastFailure: { json?: Record<string, unknown>; status?: number; path?: string } | undefined;
  for (const path of paths) {
    try {
      const response = await httpFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (response.ok) {
        return { ok: true, json, status: response.status, path };
      }
      lastFailure = { json, status: response.status, path };
    } catch (error) {
      console.warn('[patients] post failed for', path, error);
    }
  }
  return { ok: false, json: lastFailure?.json ?? {}, status: lastFailure?.status, path: lastFailure?.path };
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

  const result = await tryFetchJson(patientInfoCandidates, payload);
  const json = (result?.data as Record<string, unknown>) ?? {};
  const patients = parsePatients(json);
  const resolvedPatients = patients.length > 0 ? patients : result?.error ? [] : SAMPLE_PATIENTS;
  const recordsReturned =
    typeof json.recordsReturned === 'number'
      ? (json.recordsReturned as number)
      : typeof patients.length === 'number'
        ? patients.length
        : undefined;

  const meta: PatientListResponse = {
    patients: resolvedPatients,
    runId: (json.runId as string | undefined) ?? getObservabilityMeta().runId,
    cacheHit: normalizeBoolean(json.cacheHit),
    missingMaster: normalizeBoolean(json.missingMaster),
    dataSourceTransition: json.dataSourceTransition as DataSourceTransition | undefined,
    fallbackUsed: normalizeBoolean(json.fallbackUsed),
    fetchedAt: typeof json.fetchedAt === 'string' ? (json.fetchedAt as string) : undefined,
    recordsReturned,
    sourcePath: result?.path,
    status: result?.status,
    error: result?.error,
    auditEvent: (json.auditEvent as Record<string, unknown>) ?? undefined,
    raw: json,
  };

  const auditDetails = {
    ...(typeof (meta.auditEvent as Record<string, unknown> | undefined)?.details === 'object'
      ? ((meta.auditEvent as Record<string, unknown>).details as Record<string, unknown>)
      : {}),
    runId: meta.runId,
    dataSourceTransition: meta.dataSourceTransition,
    cacheHit: meta.cacheHit,
    missingMaster: meta.missingMaster,
    fallbackUsed: meta.fallbackUsed,
    fetchedAt: meta.fetchedAt,
    recordsReturned: meta.recordsReturned,
    sourcePath: meta.sourcePath,
  };

  meta.auditEvent = {
    action: (meta.auditEvent as Record<string, unknown> | undefined)?.action ?? 'PATIENT_OUTPATIENT_FETCH',
    ...((meta.auditEvent as Record<string, unknown>) ?? {}),
    details: auditDetails,
  };

  updateObservabilityMeta({
    runId: meta.runId,
    cacheHit: meta.cacheHit,
    missingMaster: meta.missingMaster,
    dataSourceTransition: meta.dataSourceTransition,
    fallbackUsed: meta.fallbackUsed,
    fetchedAt: meta.fetchedAt,
    recordsReturned: meta.recordsReturned,
  });

  recordOutpatientFunnel('patient_fetch', {
    runId: meta.runId,
    cacheHit: meta.cacheHit ?? false,
    missingMaster: meta.missingMaster ?? false,
    dataSourceTransition: meta.dataSourceTransition ?? 'server',
    fallbackUsed: meta.fallbackUsed ?? false,
    action: 'patient_fetch',
    outcome: meta.error ? 'error' : 'success',
    note: meta.error ?? meta.sourcePath,
    reason: meta.error ?? undefined,
  });

  logAuditEvent({
    runId: meta.runId,
    source: 'patient-fetch',
    cacheHit: meta.cacheHit,
    missingMaster: meta.missingMaster,
    dataSourceTransition: meta.dataSourceTransition,
    fallbackUsed: meta.fallbackUsed,
    payload: meta.auditEvent as Record<string, unknown> | undefined,
  });

  logUiState({
    action: 'patient_fetch',
    screen: 'patients',
    runId: meta.runId,
    cacheHit: meta.cacheHit,
    missingMaster: meta.missingMaster,
    dataSourceTransition: meta.dataSourceTransition,
    fallbackUsed: meta.fallbackUsed,
    details: {
      fetchedAt: meta.fetchedAt,
      recordsReturned: meta.recordsReturned,
      endpoint: meta.sourcePath,
      status: meta.status,
      error: meta.error,
    },
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
    source: payload.auditMeta?.source ?? 'patients',
    section: payload.auditMeta?.section,
    changedKeys: payload.auditMeta?.changedKeys,
    receptionId: payload.auditMeta?.receptionId,
    appointmentId: payload.auditMeta?.appointmentId,
    visitDate: payload.auditMeta?.visitDate,
    actorRole: payload.auditMeta?.actorRole,
  };
  const body = {
    ...payload.patient,
    operation: payload.operation,
    auditEvent,
    runId,
  };
  updateObservabilityMeta({ runId });

  const postResult = await tryPostJson(patientMutationCandidates, body);
  const json = postResult.json ?? {};
  const serverAuditEvent = (json.auditEvent as Record<string, unknown> | undefined) ?? undefined;
  const result: PatientMutationResult = {
    ok: postResult.ok,
    runId: (json.runId as string | undefined) ?? runId,
    cacheHit: normalizeBoolean(json.cacheHit),
    missingMaster: normalizeBoolean(json.missingMaster),
    dataSourceTransition: json.dataSourceTransition as DataSourceTransition | undefined,
    fallbackUsed: normalizeBoolean(json.fallbackUsed),
    auditEvent: serverAuditEvent,
    message: (json.apiResultMessage as string | undefined) ?? (postResult.ok ? '保存しました' : '保存に失敗しました'),
    patient: json.patient as PatientRecord | undefined,
    status: postResult.status,
    sourcePath: postResult.path,
  };

  const serverDetails =
    serverAuditEvent && typeof serverAuditEvent.details === 'object' && serverAuditEvent.details !== null
      ? (serverAuditEvent.details as Record<string, unknown>)
      : {};

  const normalizedDetails: Record<string, unknown> = {
    ...serverDetails,
    operation: payload.operation,
    source: payload.auditMeta?.source ?? 'patients',
    section: payload.auditMeta?.section,
    changedKeys: payload.auditMeta?.changedKeys,
    patientId: payload.patient.patientId,
    receptionId: payload.auditMeta?.receptionId,
    appointmentId: payload.auditMeta?.appointmentId,
    visitDate: payload.auditMeta?.visitDate,
    actorRole: payload.auditMeta?.actorRole,
    status: result.status,
    sourcePath: result.sourcePath,
    outcome: result.ok ? 'success' : 'error',
    message: result.message,
  };

  result.auditEvent = {
    action: (serverAuditEvent?.action as string | undefined) ?? 'PATIENTMODV2_OUTPATIENT_MUTATE',
    outcome: (serverAuditEvent?.outcome as string | undefined) ?? (result.ok ? 'success' : 'error'),
    subject: (serverAuditEvent?.subject as string | undefined) ?? (payload.auditMeta?.source ?? 'patients'),
    runId: (serverAuditEvent?.runId as string | undefined) ?? result.runId,
    details: normalizedDetails,
  };

  updateObservabilityMeta({
    runId: result.runId,
    cacheHit: result.cacheHit,
    missingMaster: result.missingMaster,
    dataSourceTransition: result.dataSourceTransition,
    fallbackUsed: result.fallbackUsed,
  });

  recordOutpatientFunnel('patient_save', {
    runId: result.runId,
    cacheHit: result.cacheHit ?? false,
    missingMaster: result.missingMaster ?? false,
    dataSourceTransition: result.dataSourceTransition ?? 'server',
    fallbackUsed: result.fallbackUsed ?? false,
    action: `patient_save_${payload.operation}`,
    outcome: result.ok ? 'success' : 'error',
    note: result.ok ? (result.sourcePath ?? '') : `${result.sourcePath ?? ''} status=${result.status ?? 'unknown'}`,
    reason: result.ok ? undefined : result.message ?? result.sourcePath,
  });

  logAuditEvent({
    runId: result.runId,
    source: 'patient-save',
    cacheHit: result.cacheHit,
    missingMaster: result.missingMaster,
    fallbackUsed: result.fallbackUsed,
    dataSourceTransition: result.dataSourceTransition,
    payload: result.auditEvent,
  });

  logUiState({
    action: 'patient_save',
    screen: payload.auditMeta?.source ?? 'patients',
    controlId: `patient_save_${payload.operation}`,
    runId: result.runId,
    cacheHit: result.cacheHit,
    missingMaster: result.missingMaster,
    fallbackUsed: result.fallbackUsed,
    dataSourceTransition: result.dataSourceTransition,
    details: normalizedDetails,
  });

  return result;
}
