import axios from 'axios';

import { httpClient } from '@/libs/http';
import { recordOperationEvent } from '@/libs/audit';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import type {
  PhrContainer,
  PhrKeyResource,
} from '@/features/administration/types/phr';

export type PhrTextType = 'medication' | 'labtest' | 'disease' | 'allergy';

export interface PhrKeyUpsertPayload {
  id?: number | null;
  facilityId: string;
  patientId: string;
  accessKey: string;
  secretKey: string;
  registeredString?: string | null;
}

export interface PhrKeyLookupResult extends PhrKeyResource {
  registeredString?: string | null;
}

export interface PhrContainerRequest {
  facilityId: string;
  patientId: string;
  documentSince?: string;
  labSince?: string;
  rpRequest?: boolean;
  replyTo?: string;
}

const normalizeDateTime = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length === 19) {
    return trimmed;
  }
  if (trimmed.length >= 19) {
    return trimmed.slice(0, 19);
  }
  return trimmed;
};

const handleNullableLookup = async <T>(executor: () => Promise<T>): Promise<T | null> => {
  try {
    return await executor();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const fetchPhrKeyByPatientId = async (patientId: string): Promise<PhrKeyLookupResult | null> =>
  handleNullableLookup(async () => {
    const endpoint = `/20/adm/phr/patient/${encodeURIComponent(patientId.trim())}`;
    const response = await measureApiPerformance(
      PERFORMANCE_METRICS.administration.phr.fetchKeyByPatient,
      `GET ${endpoint}`,
      async () => httpClient.get<PhrKeyLookupResult>(endpoint),
      { patientId },
    );
    const resource = response.data ?? {};
    return {
      ...resource,
      registeredString: resource.registeredString ?? normalizeDateTime(resource.registered),
    };
  });

export const fetchPhrKeyByAccessKey = async (accessKey: string): Promise<PhrKeyLookupResult | null> =>
  handleNullableLookup(async () => {
    const endpoint = `/20/adm/phr/accessKey/${encodeURIComponent(accessKey.trim())}`;
    const response = await measureApiPerformance(
      PERFORMANCE_METRICS.administration.phr.fetchKeyByAccess,
      `GET ${endpoint}`,
      async () => httpClient.get<PhrKeyLookupResult>(endpoint),
      { accessKey },
    );
    const resource = response.data ?? {};
    return {
      ...resource,
      registeredString: resource.registeredString ?? normalizeDateTime(resource.registered),
    };
  });

export const upsertPhrKey = async (payload: PhrKeyUpsertPayload): Promise<number> => {
  const body = {
    id: payload.id ?? undefined,
    facilityId: payload.facilityId,
    patientId: payload.patientId,
    accessKey: payload.accessKey,
    secretKey: payload.secretKey,
    registeredString: normalizeDateTime(payload.registeredString) ?? undefined,
  };
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.administration.phr.upsertKey,
    'PUT /20/adm/phr/accessKey',
    async () => httpClient.put<number>('/20/adm/phr/accessKey', body),
    { patientId: payload.patientId, facilityId: payload.facilityId },
  );
  recordOperationEvent('administration', 'info', 'phr_key_upsert', 'PHR キーを登録・更新しました', {
    patientId: payload.patientId,
  });
  return response.data ?? 0;
};

const buildPhrContainerPath = (request: PhrContainerRequest): string => {
  const segments: string[] = [request.facilityId.trim(), request.patientId.trim()];
  if (request.documentSince?.trim()) {
    segments.push(request.documentSince.trim());
  }
  if (request.labSince?.trim()) {
    if (segments.length === 2) {
      segments.push(''); // docSince を空表現で維持
    }
    segments.push(request.labSince.trim());
  }
  if (request.rpRequest) {
    if (segments.length < 4) {
      segments.push('');
      segments.push('');
    }
    segments.push('1');
    segments.push((request.replyTo ?? '').trim());
  }
  return `/20/adm/phr/${segments.join(',')}`;
};

export const fetchPhrContainer = async (request: PhrContainerRequest): Promise<PhrContainer> => {
  const endpoint = buildPhrContainerPath(request);
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.administration.phr.fetchContainer,
    `GET ${endpoint}`,
    async () => httpClient.get<PhrContainer>(endpoint, { responseType: 'json' }),
    {
      facilityId: request.facilityId,
      patientId: request.patientId,
    },
  );
  recordOperationEvent('administration', 'info', 'phr_container_fetch', 'PHR データを取得しました', {
    patientId: request.patientId,
    docSince: request.documentSince ?? null,
    labSince: request.labSince ?? null,
  });
  return response.data ?? { docList: [], labList: [] };
};

const phrTextEndpointMap: Record<PhrTextType, string> = {
  medication: '/20/adm/phr/medication/',
  labtest: '/20/adm/phr/labtest/',
  disease: '/20/adm/phr/disease/',
  allergy: '/20/adm/phr/allergy/',
};

export const fetchPhrText = async (patientId: string, type: PhrTextType): Promise<string> => {
  const base = phrTextEndpointMap[type];
  const endpoint = `${base}${encodeURIComponent(patientId.trim())}`;
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.administration.phr.fetchText,
    `GET ${endpoint}`,
    async () => httpClient.get<string>(endpoint),
    { patientId, type },
  );
  recordOperationEvent('administration', 'info', 'phr_text_fetch', 'PHR テキストデータを取得しました', {
    patientId,
    type,
  });
  return (response.data ?? '').trim();
};
