import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition } from '../../libs/observability/types';

export type PatientMasterSearchParams = {
  name?: string;
  kana?: string;
  fuzzyMode?: string;
  birthStartDate?: string;
  birthEndDate?: string;
  sex?: string;
  inOut?: string;
};

export type PatientMasterRecord = {
  patientId?: string;
  name?: string;
  kana?: string;
  birthDate?: string;
  sex?: string;
  zip?: string;
  address?: string;
  outpatientClass?: string;
  insuranceCount?: number;
  publicInsuranceCount?: number;
};

export type PatientMasterSearchResponse = {
  ok: boolean;
  patients: PatientMasterRecord[];
  runId?: string;
  traceId?: string;
  requestId?: string;
  apiResult?: string;
  apiResultMessage?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  dataSourceTransition?: DataSourceTransition;
  fallbackUsed?: boolean;
  fetchedAt?: string;
  recordsReturned?: number;
  sourcePath?: string;
  status?: number;
  error?: string;
  raw?: Record<string, unknown>;
};

const normalizeApiString = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

const normalizeBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return undefined;
};

const normalizeDataSourceTransition = (value: unknown): DataSourceTransition | undefined => {
  return typeof value === 'string' ? (value as DataSourceTransition) : undefined;
};

const parsePatientDetail = (raw: Record<string, unknown>): PatientMasterRecord => {
  const summary = (raw.summary ?? raw.Summary ?? raw.patientSummary ?? raw.PatientSummary) as Record<string, unknown> | undefined;
  const patientId =
    normalizeApiString(summary?.patientId) ??
    normalizeApiString(summary?.Patient_ID) ??
    normalizeApiString(raw.patientId) ??
    normalizeApiString(raw.Patient_ID);
  const name =
    normalizeApiString(summary?.wholeName) ??
    normalizeApiString(summary?.name) ??
    normalizeApiString(summary?.Patient_Name) ??
    normalizeApiString(raw.wholeName) ??
    normalizeApiString(raw.Patient_Name);
  const kana =
    normalizeApiString(summary?.wholeNameKana) ??
    normalizeApiString(summary?.kana) ??
    normalizeApiString(summary?.Patient_Kana) ??
    normalizeApiString(raw.wholeNameKana) ??
    normalizeApiString(raw.Patient_Kana);
  const birthDate =
    normalizeApiString(summary?.birthDate) ??
    normalizeApiString(summary?.BirthDate) ??
    normalizeApiString(raw.birthDate) ??
    normalizeApiString(raw.BirthDate);
  const sex =
    normalizeApiString(summary?.sex) ??
    normalizeApiString(summary?.Sex) ??
    normalizeApiString(raw.sex) ??
    normalizeApiString(raw.Sex);
  const zip = normalizeApiString(raw.zipCode ?? raw.ZipCode ?? raw.zip ?? raw.postal);
  const address = normalizeApiString(raw.address ?? raw.Address);
  const outpatientClass = normalizeApiString(raw.outpatientClass ?? raw.Outpatient_Class);
  const insurances = Array.isArray(raw.insurances) ? raw.insurances : Array.isArray(raw.insurance) ? raw.insurance : [];
  const publicInsurances = Array.isArray(raw.publicInsurances) ? raw.publicInsurances : [];
  return {
    patientId,
    name,
    kana,
    birthDate,
    sex,
    zip,
    address,
    outpatientClass,
    insuranceCount: insurances.length,
    publicInsuranceCount: publicInsurances.length,
  };
};

export async function fetchPatientMasterSearch(params: PatientMasterSearchParams): Promise<PatientMasterSearchResponse> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });
  const payload: Record<string, unknown> = {
    name: params.name?.trim() || undefined,
    kana: params.kana?.trim() || undefined,
    fuzzyMode: params.fuzzyMode?.trim() || undefined,
    birthStartDate: params.birthStartDate || undefined,
    birthEndDate: params.birthEndDate || undefined,
    sex: params.sex?.trim() || undefined,
    inOut: params.inOut?.trim() || undefined,
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

  let response: Response | null = null;
  let json: Record<string, unknown> = {};
  let error: string | undefined;
  try {
    response = await httpFetch('/orca/patients/name-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const apiResult = normalizeApiString(json.apiResult ?? (json as Record<string, unknown>)['Api_Result']);
  const apiResultMessage = normalizeApiString(json.apiResultMessage ?? (json as Record<string, unknown>)['Api_Result_Message']);
  const patientsRaw = Array.isArray(json.patients) ? (json.patients as Record<string, unknown>[]) : [];
  const patients = patientsRaw.map(parsePatientDetail);
  const meta: PatientMasterSearchResponse = {
    ok: Boolean(response?.ok) && !error,
    patients,
    runId: normalizeApiString(json.runId) ?? runId,
    traceId: normalizeApiString(json.traceId),
    requestId: normalizeApiString(json.requestId),
    apiResult,
    apiResultMessage,
    cacheHit: normalizeBoolean(json.cacheHit),
    missingMaster: normalizeBoolean(json.missingMaster),
    dataSourceTransition: normalizeDataSourceTransition(json.dataSourceTransition),
    fallbackUsed: normalizeBoolean(json.fallbackUsed),
    fetchedAt: normalizeApiString(json.fetchedAt),
    recordsReturned: typeof json.recordsReturned === 'number' ? (json.recordsReturned as number) : patients.length,
    sourcePath: '/orca/patients/name-search',
    status: response?.status,
    error,
    raw: json,
  };

  updateObservabilityMeta({
    runId: meta.runId,
    traceId: meta.traceId,
    cacheHit: meta.cacheHit,
    missingMaster: meta.missingMaster,
    dataSourceTransition: meta.dataSourceTransition,
    fallbackUsed: meta.fallbackUsed,
    fetchedAt: meta.fetchedAt,
    recordsReturned: meta.recordsReturned,
  });

  logAuditEvent({
    runId: meta.runId,
    traceId: meta.traceId,
    source: 'patient-name-search',
    cacheHit: meta.cacheHit,
    missingMaster: meta.missingMaster,
    dataSourceTransition: meta.dataSourceTransition,
    payload: {
      action: 'PATIENT_NAME_SEARCH',
      outcome: meta.ok ? 'success' : 'error',
      details: {
        apiResult: meta.apiResult,
        apiResultMessage: meta.apiResultMessage,
        status: meta.status,
        name: payload.name,
        kana: payload.kana,
        birthStartDate: payload.birthStartDate,
        birthEndDate: payload.birthEndDate,
        sex: payload.sex,
        inOut: payload.inOut,
        recordsReturned: meta.recordsReturned,
      },
    },
  });

  logUiState({
    action: 'patient_name_search',
    screen: 'reception',
    runId: meta.runId,
    cacheHit: meta.cacheHit,
    missingMaster: meta.missingMaster,
    dataSourceTransition: meta.dataSourceTransition,
    fallbackUsed: meta.fallbackUsed,
    details: {
      status: meta.status,
      apiResult: meta.apiResult,
      apiResultMessage: meta.apiResultMessage,
      recordsReturned: meta.recordsReturned,
    },
  });

  return meta;
}
