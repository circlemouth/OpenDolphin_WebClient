import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';
import { httpClient } from '@/libs/http';
import type { PatientListResponse, RawPatientResource } from '@/features/patients/types/patient';
import { buildSafetyNotes } from '@/features/patients/utils/safety-notes';

export interface PatientVisitHistoryEntry {
  patientPk?: number;
  patientId: string;
  fullName: string;
  kanaName?: string;
  visitDate?: string;
  memo?: string;
  safetyNotes: string[];
  raw: RawPatientResource;
}

export interface TemporaryDocumentPatient {
  patientPk?: number;
  patientId: string;
  fullName: string;
  lastVisitDate?: string;
  raw: RawPatientResource;
}

const sanitizeString = (value?: string | null) => value?.trim() ?? undefined;

const toHistoryEntry = (resource: RawPatientResource): PatientVisitHistoryEntry | null => {
  const patientId = sanitizeString(resource.patientId);
  const fullName = sanitizeString(resource.fullName);

  if (!patientId || !fullName) {
    return null;
  }

  return {
    patientPk: resource.id,
    patientId,
    fullName,
    kanaName: sanitizeString(resource.kanaName),
    visitDate: sanitizeString(resource.pvtDate),
    memo: sanitizeString(resource.memo),
    safetyNotes: buildSafetyNotes([
      resource.appMemo,
      resource.reserve1,
      resource.reserve2,
      resource.reserve3,
      resource.reserve4,
      resource.reserve5,
      resource.reserve6,
    ]),
    raw: resource,
  } satisfies PatientVisitHistoryEntry;
};

const toTemporaryDocumentPatient = (resource: RawPatientResource): TemporaryDocumentPatient | null => {
  const patientId = sanitizeString(resource.patientId);
  const fullName = sanitizeString(resource.fullName);

  if (!patientId || !fullName) {
    return null;
  }

  return {
    patientPk: resource.id,
    patientId,
    fullName,
    lastVisitDate: sanitizeString(resource.pvtDate),
    raw: resource,
  } satisfies TemporaryDocumentPatient;
};

const formatYearMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const normalizeDate = (value?: string) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const fetchPatientsByPvtPrefix = async (prefix: string): Promise<PatientVisitHistoryEntry[]> => {
  const response = await httpClient.get<PatientListResponse>(`/patient/pvt/${encodeURIComponent(prefix)}`);
  const list = response.data?.list ?? [];

  return list.map(toHistoryEntry).filter((entry): entry is PatientVisitHistoryEntry => Boolean(entry));
};

export const fetchPatientVisitHistory = async (
  patientId: string,
  referenceDate: Date,
  monthsBack = 2,
): Promise<PatientVisitHistoryEntry[]> => {
  const prefixes: string[] = [];
  for (let offset = 0; offset <= monthsBack; offset += 1) {
    const target = new Date(referenceDate);
    target.setMonth(referenceDate.getMonth() - offset);
    prefixes.push(formatYearMonth(target));
  }

  const results = await measureApiPerformance(
    PERFORMANCE_METRICS.reception.pvtHistory,
    'GET /patient/pvt/{prefix}',
    async () => {
      const historyLists = await Promise.all(prefixes.map((prefix) => fetchPatientsByPvtPrefix(prefix)));
      return historyLists.flat();
    },
    {
      patientId,
      referenceDate: referenceDate.toISOString(),
      monthsBack,
    },
  );

  const filtered = results
    .filter((entry) => entry.patientId === patientId)
    .filter((entry, index, array) => {
      if (!entry.visitDate) {
        return true;
      }
      return (
        array.findIndex((candidate) => candidate.visitDate === entry.visitDate && candidate.patientId === entry.patientId) ===
        index
      );
    })
    .sort((a, b) => {
      const left = normalizeDate(b.visitDate);
      const right = normalizeDate(a.visitDate);
      if (left && right) {
        return left.getTime() - right.getTime();
      }
      if (left) {
        return -1;
      }
      if (right) {
        return 1;
      }
      return 0;
    });

  return filtered.slice(0, 10);
};

export const fetchTemporaryDocumentPatients = async (): Promise<TemporaryDocumentPatient[]> =>
  measureApiPerformance(
    PERFORMANCE_METRICS.reception.documentStatus,
    'GET /patient/documents/status',
    async () => {
      const response = await httpClient.get<PatientListResponse>('/patient/documents/status');
      const list = response.data?.list ?? [];
      return list
        .map(toTemporaryDocumentPatient)
        .filter((entry): entry is TemporaryDocumentPatient => Boolean(entry));
    },
  );
