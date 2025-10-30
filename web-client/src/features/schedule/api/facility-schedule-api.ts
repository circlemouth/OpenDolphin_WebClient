import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';
import type {
  RawPatientModel,
  RawPatientVisit,
} from '@/features/charts/types/patient-visit';

export interface FacilityScheduleEntry {
  visitId: number;
  patientPk: number;
  patientId: string;
  patientName: string;
  patientKana?: string;
  gender?: string;
  birthday?: string;
  scheduledAt: string;
  appointment?: string;
  departmentName?: string;
  doctorName?: string;
  memo?: string;
  firstInsurance?: string;
  facilityId?: string;
  jmariNumber?: string;
  state: number;
  ownerUuid?: string | null;
  lastDocumentDate?: string | null;
  raw: RawPatientVisit;
}

export interface FacilityScheduleResponse {
  list?: RawPatientVisit[] | null;
}

const normalizeDateTime = (value: string | undefined | null): string | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const normalizeScheduleEntry = (resource: RawPatientVisit): FacilityScheduleEntry | null => {
  const visitId = resource.id ?? 0;
  const patient: RawPatientModel | null | undefined = resource.patientModel;
  const patientPk = patient?.id ?? 0;
  const patientId = patient?.patientId?.trim();
  const patientName = patient?.fullName?.trim();
  const scheduledAt = normalizeDateTime(resource.pvtDate);

  if (!visitId || !patientPk || !patientId || !patientName || !scheduledAt) {
    return null;
  }

  return {
    visitId,
    patientPk,
    patientId,
    patientName,
    patientKana: patient?.kanaName ?? undefined,
    gender: patient?.gender ?? undefined,
    birthday: patient?.birthday ?? undefined,
    scheduledAt,
    appointment: resource.appointment ?? undefined,
    departmentName: resource.deptName ?? resource.department ?? undefined,
    doctorName: resource.doctorName ?? undefined,
    memo: resource.memo ?? undefined,
    firstInsurance: resource.firstInsurance ?? undefined,
    facilityId: resource.facilityId ?? undefined,
    jmariNumber: resource.jmariNumber ?? undefined,
    state: resource.state ?? 0,
    ownerUuid: patient?.ownerUUID ?? null,
    lastDocumentDate: normalizeDateTime(resource.lastDocDate ?? undefined),
    raw: resource,
  };
};

export interface FetchFacilityScheduleParams {
  date: string;
  assignedOnly?: boolean;
  orcaDoctorId?: string | null;
  unassignedDoctorId?: string | null;
}

const buildEndpoint = ({ date, assignedOnly, orcaDoctorId, unassignedDoctorId }: FetchFacilityScheduleParams): string => {
  if (assignedOnly && orcaDoctorId) {
    const unassigned = unassignedDoctorId ?? '';
    return `/schedule/pvt/${encodeURIComponent(`${orcaDoctorId},${unassigned},${date}`)}`;
  }
  return `/schedule/pvt/${encodeURIComponent(date)}`;
};

export const fetchFacilitySchedule = async (
  params: FetchFacilityScheduleParams,
): Promise<FacilityScheduleEntry[]> => {
  const endpoint = buildEndpoint(params);

  return measureApiPerformance(
    'schedule.facility.fetch',
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<FacilityScheduleResponse>(endpoint);
      const list = response.data?.list ?? [];

      return list
        .map(normalizeScheduleEntry)
        .filter((entry): entry is FacilityScheduleEntry => Boolean(entry))
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    },
    params,
  );
};
