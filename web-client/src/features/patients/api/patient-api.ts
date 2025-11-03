import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import type {
  PatientDetail,
  PatientHealthInsurance,
  PatientListResponse,
  PatientSearchMode,
  PatientSearchRequest,
  PatientSummary,
  PatientUpsertPayload,
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

const toHealthInsuranceList = (list?: RawPatientResource['healthInsurances']): PatientHealthInsurance[] => {
  if (!list || list.length === 0) {
    return [];
  }
  return list
    .map((entry) => {
      if (!entry) {
        return null;
      }
      const rawBeanBytes = typeof entry.beanBytes === 'string' ? entry.beanBytes.trim() : '';
      if (!rawBeanBytes) {
        return null;
      }
      return {
        id: entry.id ?? undefined,
        beanBytes: rawBeanBytes,
      } satisfies PatientHealthInsurance;
    })
    .filter((entry): entry is PatientHealthInsurance => entry !== null);
};

const transformPatientDetail = (resource: RawPatientResource): PatientDetail | null => {
  const summary = transformPatient(resource);
  if (!summary) {
    return null;
  }

  const address = resource.simpleAddressModel ?? null;
  const normalizedAddress = address
    ? {
        zipCode: address.zipCode?.trim() ?? undefined,
        address: address.address?.trim() ?? undefined,
      }
    : null;

  return {
    id: summary.id,
    patientId: summary.patientId,
    fullName: summary.fullName,
    kanaName: resource.kanaName?.trim() ?? undefined,
    gender: resource.gender?.trim() ?? 'U',
    genderDesc: resource.genderDesc?.trim() ?? undefined,
    birthday: resource.birthday?.trim() ?? undefined,
    memo: resource.memo?.trim() ?? undefined,
    appMemo: resource.appMemo?.trim() ?? undefined,
    relations: resource.relations?.trim() ?? undefined,
    telephone: resource.telephone?.trim() ?? undefined,
    mobilePhone: resource.mobilePhone?.trim() ?? undefined,
    email: resource.email?.trim() ?? undefined,
    address: normalizedAddress,
    reserve1: resource.reserve1?.trim() ?? undefined,
    reserve2: resource.reserve2?.trim() ?? undefined,
    reserve3: resource.reserve3?.trim() ?? undefined,
    reserve4: resource.reserve4?.trim() ?? undefined,
    reserve5: resource.reserve5?.trim() ?? undefined,
    reserve6: resource.reserve6?.trim() ?? undefined,
    safetyNotes: summary.safetyNotes,
    healthInsurances: toHealthInsuranceList(resource.healthInsurances),
    raw: resource,
  };
};

const buildUpsertRequestPayload = (payload: PatientUpsertPayload) => {
  const address = payload.address;
  return {
    id: payload.id,
    patientId: payload.patientId.trim(),
    fullName: payload.fullName.trim(),
    kanaName: payload.kanaName?.trim(),
    gender: payload.gender.trim(),
    genderDesc: payload.genderDesc?.trim(),
    birthday: payload.birthday?.trim(),
    memo: payload.memo?.trim(),
    appMemo: payload.appMemo?.trim(),
    relations: payload.relations?.trim(),
    telephone: payload.telephone?.trim(),
    mobilePhone: payload.mobilePhone?.trim(),
    email: payload.email?.trim(),
    reserve1: payload.reserve1?.trim(),
    reserve2: payload.reserve2?.trim(),
    reserve3: payload.reserve3?.trim(),
    reserve4: payload.reserve4?.trim(),
    reserve5: payload.reserve5?.trim(),
    reserve6: payload.reserve6?.trim(),
    simpleAddressModel: address
      ? {
          zipCode: address.zipCode?.trim(),
          address: address.address?.trim(),
        }
      : undefined,
    healthInsurances: payload.healthInsurances.map((entry) => ({
      id: entry.id,
      beanBytes: entry.beanBytes,
    })),
  };
};

export const buildPatientSearchPath = (mode: PatientSearchMode, keyword: string): string => {
  const base = searchEndpointMap[mode] ?? searchEndpointMap.name;
  return `${base}${encodeURIComponent(keyword.trim())}`;
};

const fetchPatientsByMode = async (mode: PatientSearchMode, keyword: string): Promise<PatientSummary[]> => {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return [];
  }
  const path = buildPatientSearchPath(mode, trimmed);
  return measureApiPerformance(
    PERFORMANCE_METRICS.patients.search,
    `GET ${path}`,
    async () => {
      const response = await httpClient.get<PatientListResponse>(path);
      const rawList = response.data?.list ?? [];

      return rawList
        .map(transformPatient)
        .filter((patient): patient is PatientSummary => Boolean(patient));
    },
    {
      mode,
      keywordLength: trimmed.length,
    },
  );
};

export const searchPatients = async (params: PatientSearchRequest): Promise<PatientSummary[]> => {
  if ('keyword' in params) {
    return fetchPatientsByMode(params.mode, params.keyword);
  }

  const filters = [
    { mode: 'name' as const, keyword: params.nameKeyword },
    { mode: 'kana' as const, keyword: params.kanaKeyword },
    { mode: 'id' as const, keyword: params.idKeyword },
    { mode: 'digit' as const, keyword: params.digitKeyword },
  ].filter((entry) => Boolean(entry.keyword && entry.keyword.trim()));

  if (filters.length === 0) {
    return [];
  }

  const results = await Promise.all(
    filters.map(async ({ mode, keyword }) => fetchPatientsByMode(mode, keyword ?? '')),
  );

  const [firstResult = []] = results;
  if (firstResult.length === 0) {
    return [];
  }

  const intersection = new Map(firstResult.map((patient) => [patient.patientId, patient]));
  for (const result of results.slice(1)) {
    const patientIds = new Set(result.map((patient) => patient.patientId));
    for (const patientId of Array.from(intersection.keys())) {
      if (!patientIds.has(patientId)) {
        intersection.delete(patientId);
      }
    }
  }

  return Array.from(intersection.values());
};

export const fetchPatientById = async (patientId: string): Promise<PatientDetail | null> => {
  const trimmed = patientId.trim();
  if (!trimmed) {
    return null;
  }

  const path = `/patient/id/${encodeURIComponent(trimmed)}`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.patients.fetchById,
    `GET ${path}`,
    async () => {
      const response = await httpClient.get<RawPatientResource>(path);
      const resource = response.data;
      if (!resource) {
        return null;
      }
      return transformPatientDetail(resource);
    },
    {
      patientId: trimmed,
    },
  );
};

export const createPatient = async (payload: PatientUpsertPayload): Promise<string> => {
  const requestBody = buildUpsertRequestPayload(payload);
  return measureApiPerformance(
    PERFORMANCE_METRICS.patients.create,
    'POST /patient',
    async () => {
      const response = await httpClient.post<string>('/patient', requestBody);
      return response.data ?? '';
    },
    {
      hasInsurance: payload.healthInsurances.length > 0,
    },
  );
};

export const updatePatient = async (payload: PatientUpsertPayload): Promise<string> => {
  const requestBody = buildUpsertRequestPayload(payload);
  return measureApiPerformance(
    PERFORMANCE_METRICS.patients.update,
    'PUT /patient',
    async () => {
      const response = await httpClient.put<string>('/patient', requestBody);
      return response.data ?? '';
    },
    {
      patientId: payload.patientId.trim(),
      hasInsurance: payload.healthInsurances.length > 0,
    },
  );
};
