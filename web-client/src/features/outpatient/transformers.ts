import type { DataSourceTransition, ResolveMasterSource } from '../../libs/observability/types';
import type { AppointmentPayload, OutpatientMeta, ReceptionEntry, ReceptionStatus } from './types';

export const normalizeBoolean = (value: unknown): boolean | undefined => {
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

export const parseAppointmentEntries = (json: any): ReceptionEntry[] => {
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

export const mergeOutpatientMeta = (
  raw: Record<string, unknown>,
  defaults: Partial<OutpatientMeta> = {},
): OutpatientMeta => {
  const resolvedTransition = (raw.dataSourceTransition as DataSourceTransition | undefined) ?? defaults.dataSourceTransition;
  const resolvedSource = (defaults.resolveMasterSource ?? resolvedTransition) as ResolveMasterSource | undefined;

  const recordsReturned =
    typeof raw.recordsReturned === 'number'
      ? (raw.recordsReturned as number)
      : defaults.recordsReturned;

  return {
    runId: (raw.runId as string | undefined) ?? defaults.runId,
    traceId: (raw.traceId as string | undefined) ?? defaults.traceId,
    dataSourceTransition: resolvedTransition,
    resolveMasterSource: resolvedSource,
    cacheHit: normalizeBoolean(raw.cacheHit ?? defaults.cacheHit),
    missingMaster: normalizeBoolean(raw.missingMaster ?? defaults.missingMaster),
    fallbackUsed: normalizeBoolean(raw.fallbackUsed ?? defaults.fallbackUsed),
    fetchedAt: (raw.fetchedAt as string | undefined) ?? defaults.fetchedAt,
    recordsReturned,
    fromCache: defaults.fromCache,
    retryCount: defaults.retryCount,
    sourcePath: defaults.sourcePath,
    httpStatus: defaults.httpStatus,
    auditEvent: (raw.auditEvent as Record<string, unknown> | undefined) ?? defaults.auditEvent,
  };
};

export const attachAppointmentMeta = (
  payload: AppointmentPayload,
  meta: OutpatientMeta,
): AppointmentPayload => ({
  ...payload,
  runId: meta.runId,
  dataSourceTransition: meta.dataSourceTransition,
  resolveMasterSource: meta.resolveMasterSource,
  cacheHit: meta.cacheHit,
  missingMaster: meta.missingMaster,
  fallbackUsed: meta.fallbackUsed,
  fetchedAt: meta.fetchedAt,
  recordsReturned: meta.recordsReturned,
  fromCache: meta.fromCache,
  retryCount: meta.retryCount,
  sourcePath: meta.sourcePath,
  httpStatus: meta.httpStatus,
  auditEvent: meta.auditEvent ?? payload.auditEvent,
});
