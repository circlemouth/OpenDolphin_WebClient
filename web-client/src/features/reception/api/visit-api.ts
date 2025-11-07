import { recordOperationEvent } from '@/libs/audit';
import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';
import { normalizePatientVisit } from '@/features/charts/api/patient-visit-api';
import type {
  PatientVisitListResponse,
  PatientVisitSummary,
  RawPatientVisit,
} from '@/features/charts/types/patient-visit';
import type { PatientDetail, PatientDetailAddress } from '@/features/patients/types/patient';

export interface VisitRegistrationOptions {
  memo?: string;
  doctorId?: string;
  doctorName?: string;
  departmentCode?: string;
  departmentName?: string;
  insuranceUid?: string;
  appointment?: string;
  checkInAt?: Date;
  source?: 'barcode' | 'manual' | 'schedule';
}

interface VisitRegistrationPayload {
  pvtDate: string;
  state: number;
  memo?: string;
  doctorId?: string;
  doctorName?: string;
  deptCode?: string;
  deptName?: string;
  insuranceUid?: string;
  appointment?: string;
  facilityId?: string;
  department?: string;
  patientModel: Record<string, unknown>;
}

const STORAGE_SAFE_KEYS: Array<keyof VisitRegistrationPayload> = [
  'pvtDate',
  'state',
  'memo',
  'doctorId',
  'doctorName',
  'deptCode',
  'deptName',
  'insuranceUid',
  'appointment',
  'facilityId',
  'department',
  'patientModel',
];

const sanitizeString = (value: string | undefined | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const buildSimpleAddress = (address?: PatientDetailAddress | null) => {
  if (!address) {
    return undefined;
  }
  const zipCode = sanitizeString(address.zipCode);
  const addr = sanitizeString(address.address);
  if (!zipCode && !addr) {
    return undefined;
  }
  return {
    zipCode,
    address: addr,
  };
};

const mergePatientModel = (patient: PatientDetail): Record<string, unknown> => {
  const raw = patient.raw ?? {};

  const payload: Record<string, unknown> = {
    ...raw,
    id: patient.id,
    patientId: sanitizeString(patient.patientId),
    fullName: sanitizeString(patient.fullName),
    kanaName: sanitizeString(patient.kanaName),
    gender: sanitizeString(patient.gender),
    genderDesc: sanitizeString(patient.genderDesc),
    birthday: sanitizeString(patient.birthday),
    memo: sanitizeString(patient.memo),
    appMemo: sanitizeString(patient.appMemo),
    relations: sanitizeString(patient.relations),
    telephone: sanitizeString(patient.telephone),
    mobilePhone: sanitizeString(patient.mobilePhone),
    email: sanitizeString(patient.email),
    reserve1: sanitizeString(patient.reserve1),
    reserve2: sanitizeString(patient.reserve2),
    reserve3: sanitizeString(patient.reserve3),
    reserve4: sanitizeString(patient.reserve4),
    reserve5: sanitizeString(patient.reserve5),
    reserve6: sanitizeString(patient.reserve6),
    simpleAddressModel: buildSimpleAddress(patient.address),
    healthInsurances:
      patient.healthInsurances.length > 0
        ? patient.healthInsurances.map((entry) => ({
            id: entry.id,
            beanBytes: entry.beanBytes,
          }))
        : raw.healthInsurances,
  };

  // Remove undefined entries explicitly to avoid sending empty keys
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
};

export const buildVisitRegistrationPayload = (
  patient: PatientDetail,
  options: VisitRegistrationOptions = {},
): VisitRegistrationPayload => {
  const checkInAt = options.checkInAt ?? new Date();
  const timestamp = checkInAt.toISOString();
  const departmentName = sanitizeString(options.departmentName);
  const departmentCode = sanitizeString(options.departmentCode);
  const doctorName = sanitizeString(options.doctorName);
  const doctorId = sanitizeString(options.doctorId);
  const insuranceUid = sanitizeString(options.insuranceUid);
  const memo = sanitizeString(options.memo);
  const appointment = sanitizeString(options.appointment);

  const departmentAggregate = [departmentName, departmentCode, doctorName, doctorId]
    .map((value) => value ?? '')
    .join(',');

  return {
    pvtDate: timestamp,
    state: 0,
    memo,
    doctorId: doctorId,
    doctorName: doctorName,
    deptCode: departmentCode,
    deptName: departmentName,
    insuranceUid,
    appointment,
    department: departmentAggregate,
    patientModel: mergePatientModel(patient),
  } satisfies VisitRegistrationPayload;
};

export const registerVisit = async (
  patient: PatientDetail,
  options: VisitRegistrationOptions = {},
) => {
  const payload = buildVisitRegistrationPayload(patient, options);
  const requestBody = Object.fromEntries(
    STORAGE_SAFE_KEYS.map((key) => {
      const value = payload[key];
      return value === undefined ? null : [key, value];
    }).filter(Boolean) as Array<[keyof VisitRegistrationPayload, unknown]>,
  );

  await httpClient.post('/pvt2', requestBody);
};

export const updateVisitState = async (visitId: number, state: number) => {
  const endpoint = `/pvt/${visitId},${state}`;
  await httpClient.put<string>(endpoint);
};

export const deleteVisit = async (visitId: number) => {
  await httpClient.delete(`/pvt2/${visitId}`);
};

const encodeParam = (value: string) => encodeURIComponent(value);

export interface LegacyVisitSearchParams {
  visitDate: string;
  firstResult?: number;
  appointmentFrom?: string | null;
  appointmentTo?: string | null;
  doctorId?: string | null;
  unassignedDoctorId?: string | null;
}

const coerceDate = (input: string | null | undefined, fallback: string): string => {
  const trimmed = input?.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed;
};

const toNonNegativeInteger = (value: number | null | undefined, fallback: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value));
};

export const fetchLegacyVisits = async (params: LegacyVisitSearchParams): Promise<PatientVisitSummary[]> => {
  const baseDate = coerceDate(params.visitDate, new Date().toISOString().slice(0, 10));
  const firstResult = toNonNegativeInteger(params.firstResult, 0);
  const appoFrom = coerceDate(params.appointmentFrom, baseDate);
  const appoTo = coerceDate(params.appointmentTo, appoFrom);

  const doctorId = params.doctorId?.trim();
  const unassigned = params.unassignedDoctorId?.trim() || '19999';

  const segments = doctorId
    ? [doctorId, unassigned, baseDate, String(firstResult), appoFrom, appoTo]
    : [baseDate, String(firstResult), appoFrom, appoTo];

  const endpoint = `/pvt/${encodeParam(segments.join(','))}`;
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.reception.legacy.fetchVisits,
    `GET ${endpoint}`,
    async () => httpClient.get<PatientVisitListResponse>(endpoint),
    {
      doctorId: doctorId ?? 'all',
      visitDate: baseDate,
      firstResult,
    },
  );

  const list = response.data?.list ?? [];
  const visits = list
    .map(normalizePatientVisit)
    .filter((visit): visit is PatientVisitSummary => Boolean(visit));

  recordOperationEvent('reception', 'info', 'legacy_fetch_visits', '旧API (GET /pvt) で受付一覧を取得しました', {
    doctorId: doctorId ?? null,
    resultCount: visits.length,
  });

  return visits;
};

export const registerLegacyVisit = async (payload: RawPatientVisit): Promise<void> => {
  await measureApiPerformance(
    PERFORMANCE_METRICS.reception.legacy.registerVisit,
    'POST /pvt',
    async () => httpClient.post('/pvt', payload),
    { hasPatientModel: Boolean(payload.patientModel) },
  );

  const patientId = payload.patientModel?.patientId ?? null;
  recordOperationEvent('reception', 'warning', 'legacy_register_visit', '旧API (POST /pvt) で受付登録を実行しました', {
    patientId,
    doctorId: payload.doctorId ?? null,
  });
};

export const updateLegacyVisitMemo = async (visitId: number, memo: string): Promise<void> => {
  const endpoint = `/pvt/memo/${encodeParam(`${visitId},${memo}`)}`;
  await measureApiPerformance(
    PERFORMANCE_METRICS.reception.legacy.updateMemo,
    `PUT ${endpoint}`,
    async () => httpClient.put<string>(endpoint),
    { visitId },
  );

  recordOperationEvent('reception', 'info', 'legacy_update_memo', '旧API (PUT /pvt/memo) で受付メモを更新しました', {
    visitId,
  });
};
