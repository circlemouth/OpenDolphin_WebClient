import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

import type {
  PatientListResponse,
  PatientSearchMode,
  PatientSearchRequest,
  PatientSummary,
  RawPatientResource,
} from '@/features/patients/types/patient';
import { buildSafetyNotes } from '@/features/patients/utils/safety-notes';

const searchEndpointMap: Record<PatientSearchMode, string> = {
  name: '/patient/name/',
  kana: '/patient/kana/',
  id: '/patient/id/',
  digit: '/patient/digit/',
};

const transformPatient = (resource: RawPatientResource): PatientSummary | null => {
  const id = resource.id ?? 0;
  const patientId = resource.patientId?.trim();
  const fullName = resource.fullName?.trim();

  if (!id || !patientId || !fullName) {
    return null;
  }

  return {
    id,
    patientId,
    fullName,
    kanaName: resource.kanaName?.trim(),
    gender: resource.gender?.trim(),
    genderDesc: resource.genderDesc?.trim(),
    birthday: resource.birthday?.trim(),
    lastVisitDate: resource.pvtDate?.trim(),
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
  };
};

export const buildPatientSearchPath = ({ mode, keyword }: PatientSearchRequest): string => {
  const base = searchEndpointMap[mode] ?? searchEndpointMap.name;
  return `${base}${encodeURIComponent(keyword.trim())}`;
};

export const searchPatients = async (params: PatientSearchRequest): Promise<PatientSummary[]> => {
  const keyword = params.keyword.trim();
  if (!keyword) {
    return [];
  }

  const path = buildPatientSearchPath({ ...params, keyword });
  return measureApiPerformance(
    'patients.search',
    `GET ${path}`,
    async () => {
      const response = await httpClient.get<PatientListResponse>(path);
      const rawList = response.data?.list ?? [];

      return rawList
        .map(transformPatient)
        .filter((patient): patient is PatientSummary => Boolean(patient));
    },
    {
      mode: params.mode,
      keywordLength: keyword.length,
    },
  );
};
