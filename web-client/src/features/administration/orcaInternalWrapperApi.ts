import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';

export type MedicalSetMutationRequest = {
  requestNumber?: string;
  patientId?: string;
  sets?: Array<{
    medicalClass?: string;
    medicationCode?: string;
    medicationName?: string;
    quantity?: string;
    note?: string;
  }>;
};

export type MedicationSyncRequest = {
  requestNumber?: string;
  medications?: Array<{
    medicationCode?: string;
    medicationName?: string;
    kanaName?: string;
    unit?: string;
    point?: string;
    startDate?: string;
    endDate?: string;
  }>;
};

export type BirthDeliveryRequest = {
  requestNumber?: string;
  patientId?: string;
  insuranceCombinationNumber?: string;
  performDate?: string;
  note?: string;
};

export type MedicalRecordsRequest = {
  patientId?: string;
  fromDate?: string;
  toDate?: string;
  performMonths?: number;
  departmentCode?: string;
  sequentialNumber?: string;
  insuranceCombinationNumber?: string;
  includeVisitStatus?: boolean;
};

export type PatientMutationRequest = {
  operation?: 'create' | 'update' | 'delete' | string;
  patient?: {
    id?: number;
    patientId?: string;
    wholeName?: string;
    wholeNameKana?: string;
    birthDate?: string;
    sex?: string;
    telephone?: string;
    mobilePhone?: string;
    zipCode?: string;
    addressLine?: string;
  };
};

export type SubjectiveEntryRequest = {
  patientId?: string;
  performDate?: string;
  soapCategory?: string;
  physicianCode?: string;
  body?: string;
};

export type OrcaInternalWrapperBase = {
  ok: boolean;
  status: number;
  apiResult?: string;
  apiResultMessage?: string;
  messageDetail?: string;
  warningMessage?: string;
  runId?: string;
  traceId?: string;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  stub?: boolean;
  error?: string;
  raw: Record<string, unknown>;
};

export type MedicalRecordEntry = {
  performDate?: string;
  departmentCode?: string;
  departmentName?: string;
  sequentialNumber?: string;
  insuranceCombinationNumber?: string;
  documentId?: string;
  documentStatus?: string;
  lastUpdated?: string;
};

export type MedicalPatientSummary = {
  patientId?: string;
  wholeName?: string;
  wholeNameKana?: string;
  birthDate?: string;
  sex?: string;
};

export type MedicalRecordsResponse = OrcaInternalWrapperBase & {
  generatedAt?: string;
  patient?: MedicalPatientSummary;
  records: MedicalRecordEntry[];
  warnings?: string[];
};

export type SubjectiveEntryResponse = OrcaInternalWrapperBase & {
  recordedAt?: string;
};

export type PatientMutationResponse = OrcaInternalWrapperBase & {
  patientDbId?: number;
  patientId?: string;
};

const ORCA_MEDICAL_SETS_ENDPOINT = '/orca/medical-sets';
const ORCA_TENSU_SYNC_ENDPOINT = '/orca/tensu/sync';
const ORCA_BIRTH_DELIVERY_ENDPOINT = '/orca/birth-delivery';
const ORCA_MEDICAL_RECORDS_ENDPOINT = '/orca/medical/records';
const ORCA_PATIENT_MUTATION_ENDPOINT = '/orca/patient/mutation';
const ORCA_CHART_SUBJECTIVES_ENDPOINT = '/orca/chart/subjectives';

const normalizeBooleanHeader = (value: string | null) => {
  if (value === null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'enabled' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'disabled' || normalized === 'no') return false;
  return undefined;
};

const normalizeBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return normalizeBooleanHeader(value);
  if (typeof value === 'number') return value !== 0;
  return undefined;
};

const getString = (value: unknown) => (typeof value === 'string' ? value : undefined);
const normalizeApiResultValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
};
const normalizeApiResultMessage = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
};
const getNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;

const ensureRunId = () => {
  const meta = getObservabilityMeta();
  if (meta.runId) return meta.runId;
  const next = generateRunId();
  updateObservabilityMeta({ runId: next });
  return next;
};

const updateObservability = (next: {
  runId?: string;
  traceId?: string;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
}) => {
  if (next.runId || next.traceId || next.missingMaster !== undefined || next.fallbackUsed !== undefined) {
    updateObservabilityMeta({
      ...(next.runId ? { runId: next.runId } : {}),
      ...(next.traceId ? { traceId: next.traceId } : {}),
      ...(next.missingMaster !== undefined ? { missingMaster: next.missingMaster } : {}),
      ...(next.fallbackUsed !== undefined ? { fallbackUsed: next.fallbackUsed } : {}),
    });
  }
};

const normalizeBase = (json: unknown, headers: Headers, status: number, ok: boolean): OrcaInternalWrapperBase => {
  const body = asRecord(json) ?? {};
  const apiResult = normalizeApiResultValue(
    body.apiResult ?? body.Api_Result ?? body.api_result ?? body.API_RESULT,
  );
  const apiResultMessage = normalizeApiResultMessage(
    body.apiResultMessage ??
      body.Api_Result_Message ??
      body.api_result_message ??
      body.API_RESULT_MESSAGE,
  );
  const messageDetail =
    getString(body.messageDetail ?? body.Message_Detail ?? body.message ?? body.detail)
    ?? undefined;
  const warningMessage = getString(body.warningMessage ?? body.warning ?? body.Warning_Message);
  const runId = getString(body.runId) ?? headers.get('x-run-id') ?? getObservabilityMeta().runId;
  const traceId = getString(body.traceId) ?? headers.get('x-trace-id') ?? getObservabilityMeta().traceId;
  const missingMaster =
    normalizeBoolean(body.missingMaster ?? body.missing_master) ?? normalizeBooleanHeader(headers.get('x-missing-master'));
  const fallbackUsed =
    normalizeBoolean(body.fallbackUsed ?? body.fallback_used) ?? normalizeBooleanHeader(headers.get('x-fallback-used'));
  const errorMessage = !ok ? `HTTP ${status}` : undefined;
  const stub = apiResult ? apiResult.startsWith('79') : undefined;

  if (runId) {
    updateObservability({ runId, traceId, missingMaster, fallbackUsed });
  } else {
    updateObservability({ traceId, missingMaster, fallbackUsed });
  }

  return {
    ok,
    status,
    apiResult,
    apiResultMessage,
    messageDetail,
    warningMessage,
    runId,
    traceId,
    missingMaster,
    fallbackUsed,
    stub,
    error: errorMessage,
    raw: body,
  };
};

const normalizeMedicalRecords = (
  json: unknown,
  headers: Headers,
  status: number,
  ok: boolean,
): MedicalRecordsResponse => {
  const base = normalizeBase(json, headers, status, ok);
  const body = base.raw;
  const patientBody = asRecord(body.patient);
  const recordsValue = Array.isArray(body.records) ? body.records : [];
  const records: MedicalRecordEntry[] = recordsValue.map((entry) => {
    const record = asRecord(entry) ?? {};
    return {
      performDate: getString(record.performDate),
      departmentCode: getString(record.departmentCode),
      departmentName: getString(record.departmentName),
      sequentialNumber: getString(record.sequentialNumber),
      insuranceCombinationNumber: getString(record.insuranceCombinationNumber),
      documentId: getString(record.documentId),
      documentStatus: getString(record.documentStatus),
      lastUpdated: getString(record.lastUpdated),
    };
  });

  const warnings = Array.isArray(body.warnings)
    ? body.warnings.map((warning) => getString(warning) ?? '').filter((warning) => warning.length > 0)
    : undefined;

  const patient: MedicalPatientSummary | undefined = patientBody
    ? {
        patientId: getString(patientBody.patientId),
        wholeName: getString(patientBody.wholeName),
        wholeNameKana: getString(patientBody.wholeNameKana),
        birthDate: getString(patientBody.birthDate),
        sex: getString(patientBody.sex),
      }
    : undefined;

  return {
    ...base,
    generatedAt: getString(body.generatedAt),
    patient,
    records,
    warnings,
  };
};

const normalizeSubjectiveEntry = (
  json: unknown,
  headers: Headers,
  status: number,
  ok: boolean,
): SubjectiveEntryResponse => {
  const base = normalizeBase(json, headers, status, ok);
  const body = base.raw;
  return {
    ...base,
    recordedAt: getString(body.recordedAt),
  };
};

const normalizePatientMutation = (
  json: unknown,
  headers: Headers,
  status: number,
  ok: boolean,
): PatientMutationResponse => {
  const base = normalizeBase(json, headers, status, ok);
  const body = base.raw;
  return {
    ...base,
    patientDbId: getNumber(body.patientDbId ?? body.patient_db_id),
    patientId: getString(body.patientId ?? body.patient_id),
  };
};

const postInternalWrapper = async (path: string, payload: Record<string, unknown> | undefined) => {
  ensureRunId();
  const response = await httpFetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload ?? {}),
  });
  const json = await response.json().catch(() => ({}));
  return { response, json };
};

export async function postMedicalSets(payload: MedicalSetMutationRequest | Record<string, unknown>) {
  const { response, json } = await postInternalWrapper(ORCA_MEDICAL_SETS_ENDPOINT, payload as Record<string, unknown>);
  return normalizeBase(json, response.headers, response.status, response.ok);
}

export async function postTensuSync(payload: MedicationSyncRequest | Record<string, unknown>) {
  const { response, json } = await postInternalWrapper(ORCA_TENSU_SYNC_ENDPOINT, payload as Record<string, unknown>);
  return normalizeBase(json, response.headers, response.status, response.ok);
}

export async function postBirthDelivery(payload: BirthDeliveryRequest | Record<string, unknown>) {
  const { response, json } = await postInternalWrapper(ORCA_BIRTH_DELIVERY_ENDPOINT, payload as Record<string, unknown>);
  return normalizeBase(json, response.headers, response.status, response.ok);
}

export async function postMedicalRecords(payload: MedicalRecordsRequest | Record<string, unknown>) {
  const { response, json } = await postInternalWrapper(ORCA_MEDICAL_RECORDS_ENDPOINT, payload as Record<string, unknown>);
  return normalizeMedicalRecords(json, response.headers, response.status, response.ok);
}

export async function postPatientMutation(payload: PatientMutationRequest | Record<string, unknown>) {
  const { response, json } = await postInternalWrapper(ORCA_PATIENT_MUTATION_ENDPOINT, payload as Record<string, unknown>);
  return normalizePatientMutation(json, response.headers, response.status, response.ok);
}

export async function postSubjectiveEntry(payload: SubjectiveEntryRequest | Record<string, unknown>) {
  const { response, json } = await postInternalWrapper(ORCA_CHART_SUBJECTIVES_ENDPOINT, payload as Record<string, unknown>);
  return normalizeSubjectiveEntry(json, response.headers, response.status, response.ok);
}
