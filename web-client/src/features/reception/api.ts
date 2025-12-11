import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition } from '../../libs/observability/types';

export type ReceptionStatus = '受付中' | '診療中' | '会計待ち' | '会計済み' | '予約';

export type ReceptionEntry = {
  id: string;
  appointmentId?: string;
  patientId?: string;
  name?: string;
  kana?: string;
  birthDate?: string;
  sex?: string;
  department?: string;
  physician?: string;
  appointmentTime?: string;
  visitDate?: string;
  status: ReceptionStatus;
  insurance?: string;
  note?: string;
  source: 'slots' | 'reservations' | 'visits' | 'unknown';
};

export type OutpatientFlagResponse = {
  runId?: string;
  dataSourceTransition?: DataSourceTransition;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  fetchedAt?: string;
  recordsReturned?: number;
  auditEvent?: Record<string, unknown>;
};

export type AppointmentQueryParams = {
  date: string;
  keyword?: string;
  departmentCode?: string;
  physicianCode?: string;
};

export type AppointmentPayload = {
  entries: ReceptionEntry[];
  raw: unknown;
  runId?: string;
  apiResult?: string;
  apiResultMessage?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  dataSourceTransition?: DataSourceTransition;
  fetchedAt?: string;
};

const SAMPLE_APPOINTMENTS: ReceptionEntry[] = [
  {
    id: 'SAMPLE-01',
    appointmentId: 'APT-2401',
    patientId: '000001',
    name: '山田 花子',
    kana: 'ヤマダ ハナコ',
    birthDate: '1985-04-12',
    sex: 'F',
    department: '内科',
    physician: '藤井',
    appointmentTime: '09:10',
    status: '受付中',
    insurance: '社保 12',
    note: '血圧フォロー',
    source: 'unknown',
  },
  {
    id: 'SAMPLE-02',
    appointmentId: 'APT-2402',
    patientId: '000002',
    name: '佐藤 太郎',
    kana: 'サトウ タロウ',
    birthDate: '1978-11-30',
    sex: 'M',
    department: '整形',
    physician: '鈴木',
    appointmentTime: '09:25',
    status: '診療中',
    insurance: '国保 34',
    note: '膝痛・レントゲン待ち',
    source: 'unknown',
  },
  {
    id: 'SAMPLE-03',
    appointmentId: 'APT-2403',
    patientId: '000003',
    name: '高橋 光',
    kana: 'タカハシ ヒカリ',
    birthDate: '1992-02-01',
    sex: 'F',
    department: '小児',
    physician: '山口',
    appointmentTime: '10:05',
    status: '予約',
    insurance: '自費',
    note: '健診',
    source: 'unknown',
  },
];

const claimCandidates = ['/api01rv2/claim/outpatient/mock', '/api01rv2/claim/outpatient'];
const appointmentCandidates = [
  '/api01rv2/appointment/outpatient/list',
  '/api01rv2/appointment/outpatient',
  '/api01rv2/appointment/outpatient/mock',
];

const normalizeBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return undefined;
};

const deriveStatus = (payload: {
  visitInformation?: string;
  updateTime?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}): ReceptionStatus => {
  const info = payload.visitInformation ?? '';
  if (info.includes('会計済')) return '会計済み';
  if (info.includes('会計') || info.includes('精算')) return '会計待ち';
  if (info.includes('診察') || info.includes('診療') || info.includes('処置')) return '診療中';
  if (info.includes('予約')) return '予約';
  if (payload.appointmentDate && payload.appointmentTime) {
    return '予約';
  }
  return '受付中';
};

const toDisplayTime = (date?: string, time?: string) => {
  if (!time) return '';
  if (time.length === 4) {
    return `${time.slice(0, 2)}:${time.slice(2)}`;
  }
  if (time.length === 6) {
    return `${time.slice(0, 2)}:${time.slice(2, 4)}`;
  }
  if (date && time.includes('T')) {
    const [, t] = time.split('T');
    return t?.slice(0, 5) ?? time;
  }
  return time;
};

const buildEntryId = (candidate?: string, fallback?: string) =>
  candidate?.trim() || fallback || `R-${Math.random().toString(36).slice(2, 8)}`;

const parseAppointmentPayload = (json: any): ReceptionEntry[] => {
  const entries: ReceptionEntry[] = [];

  const slots: any[] = Array.isArray(json?.slots) ? json.slots : [];
  slots.forEach((slot, index) => {
    const patient = slot.patient ?? {};
    entries.push({
      id: buildEntryId(slot.appointmentId, `slot-${index}`),
      appointmentId: slot.appointmentId,
      patientId: patient.patientId,
      name: patient.wholeName,
      kana: patient.wholeNameKana,
      birthDate: patient.birthDate,
      sex: patient.sex,
      department: slot.departmentName ?? slot.departmentCode,
      physician: slot.physicianName ?? slot.physicianCode,
      appointmentTime: toDisplayTime(json?.appointmentDate, slot.appointmentTime),
      status: deriveStatus({ visitInformation: slot.visitInformation, appointmentDate: json?.appointmentDate, appointmentTime: slot.appointmentTime }),
      note: slot.medicalInformation,
      source: 'slots',
    });
  });

  const reservations: any[] = Array.isArray(json?.reservations) ? json.reservations : [];
  reservations.forEach((reservation, index) => {
    entries.push({
      id: buildEntryId(reservation.appointmentId, `reservation-${index}`),
      appointmentId: reservation.appointmentId,
      patientId: json?.patient?.patientId,
      name: json?.patient?.wholeName,
      kana: json?.patient?.wholeNameKana,
      birthDate: json?.patient?.birthDate,
      sex: json?.patient?.sex,
      department: reservation.departmentName ?? reservation.departmentCode,
      physician: reservation.physicianName ?? reservation.physicianCode,
      appointmentTime: toDisplayTime(reservation.appointmentDate, reservation.appointmentTime),
      status: deriveStatus({
        visitInformation: reservation.visitInformation,
        appointmentDate: reservation.appointmentDate,
        appointmentTime: reservation.appointmentTime,
      }),
      note: reservation.appointmentNote,
      source: 'reservations',
    });
  });

  const visits: any[] = Array.isArray(json?.visits) ? json.visits : [];
  visits.forEach((visit, index) => {
    const patient = visit.patient ?? {};
    entries.push({
      id: buildEntryId(visit.voucherNumber, `visit-${index}`),
      appointmentId: visit.sequentialNumber,
      patientId: patient.patientId,
      name: patient.wholeName,
      kana: patient.wholeNameKana,
      birthDate: patient.birthDate,
      sex: patient.sex,
      department: visit.departmentName ?? visit.departmentCode,
      physician: visit.physicianName ?? visit.physicianCode,
      appointmentTime: toDisplayTime(json?.visitDate, visit.updateTime ?? visit.appointmentTime),
      status: deriveStatus({
        visitInformation: visit.visitInformation,
        appointmentDate: json?.visitDate,
        appointmentTime: visit.updateTime,
      }),
      insurance: visit.insuranceCombinationNumber,
      source: 'visits',
    });
  });

  return entries;
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
      console.warn('[reception] fetch failed for', path, error);
    }
  }
  return undefined;
};

export async function fetchAppointmentOutpatients(params: AppointmentQueryParams): Promise<AppointmentPayload> {
  const today = params.date;
  const result = await tryFetchJson(appointmentCandidates, {
    appointmentDate: today,
    keyword: params.keyword,
    departmentCode: params.departmentCode,
    physicianCode: params.physicianCode,
  });

  const json = result?.data ?? {};
  const entries = parseAppointmentPayload(json);
  const runId = json.runId ?? getObservabilityMeta().runId;
  const meta: AppointmentPayload = {
    entries: entries.length > 0 ? entries : SAMPLE_APPOINTMENTS,
    raw: json,
    runId,
    apiResult: json.apiResult,
    apiResultMessage: json.apiResultMessage,
    cacheHit: normalizeBoolean(json.cacheHit),
    missingMaster: normalizeBoolean(json.missingMaster),
    dataSourceTransition: json.dataSourceTransition,
    fetchedAt: json.fetchedAt,
  };

  updateObservabilityMeta({
    runId: meta.runId,
    cacheHit: meta.cacheHit,
    missingMaster: meta.missingMaster,
    dataSourceTransition: meta.dataSourceTransition,
  });

  return meta;
}

export async function fetchClaimFlags(): Promise<OutpatientFlagResponse> {
  const result = await tryFetchJson(claimCandidates, {});
  const json = (result?.data as Record<string, unknown>) ?? {};
  const flags: OutpatientFlagResponse = {
    runId: (json.runId as string | undefined) ?? getObservabilityMeta().runId,
    dataSourceTransition: json.dataSourceTransition as DataSourceTransition | undefined,
    cacheHit: normalizeBoolean(json.cacheHit),
    missingMaster: normalizeBoolean(json.missingMaster),
    fallbackUsed: normalizeBoolean(json.fallbackUsed),
    fetchedAt: json.fetchedAt as string | undefined,
    recordsReturned: typeof json.recordsReturned === 'number' ? json.recordsReturned : undefined,
    auditEvent: (json.auditEvent as Record<string, unknown>) ?? undefined,
  };

  updateObservabilityMeta({
    runId: flags.runId,
    cacheHit: flags.cacheHit,
    missingMaster: flags.missingMaster,
    dataSourceTransition: flags.dataSourceTransition,
    fallbackUsed: flags.fallbackUsed,
  });

  return flags;
}
