import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import { formatRestTimestamp } from '@/features/charts/utils/rest-timestamp';

export interface RawFreeDocumentResource {
  id?: number;
  facilityPatId?: string;
  confirmed?: string | null;
  comment?: string | null;
}

export interface FreeDocumentSummary {
  id: number | null;
  facilityPatientId: string | null;
  confirmedAt: string | null;
  comment: string;
}

const transformFreeDocument = (raw: RawFreeDocumentResource | null | undefined): FreeDocumentSummary | null => {
  if (!raw) {
    return null;
  }
  let confirmedAt: string | null = null;
  if (raw.confirmed) {
    const parsed = new Date(raw.confirmed);
    confirmedAt = Number.isNaN(parsed.getTime()) ? raw.confirmed : parsed.toISOString();
  }

  return {
    id: typeof raw.id === 'number' ? raw.id : null,
    facilityPatientId: raw.facilityPatId ?? null,
    confirmedAt,
    comment: raw.comment ?? '',
  };
};

export const fetchFreeDocument = async (patientId: string): Promise<FreeDocumentSummary | null> => {
  const trimmed = patientId.trim();
  if (!trimmed) {
    return null;
  }

  const endpoint = `/karte/freedocument/${encodeURIComponent(trimmed)}`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.charts.freeDocument.fetch,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawFreeDocumentResource | null>(endpoint);
      return transformFreeDocument(response.data);
    },
    { patientId: trimmed },
  );
};

export interface SaveFreeDocumentPayload {
  patientId: string;
  comment: string;
  id?: number | null;
}

export const saveFreeDocument = async (payload: SaveFreeDocumentPayload): Promise<FreeDocumentSummary> => {
  const { patientId, comment, id } = payload;
  const trimmedPatientId = patientId.trim();
  if (!trimmedPatientId) {
    throw new Error('patientId is required');
  }

  const now = new Date();
  const confirmed = formatRestTimestamp(now);
  const requestBody: RawFreeDocumentResource = {
    id: id ?? undefined,
    facilityPatId: trimmedPatientId,
    confirmed,
    comment,
  };

  const endpoint = '/karte/freedocument';
  await measureApiPerformance(
    PERFORMANCE_METRICS.charts.freeDocument.save,
    `PUT ${endpoint}`,
    async () => {
      await httpClient.put<string>(endpoint, requestBody);
    },
    { patientId: trimmedPatientId },
  );

  return {
    id: id ?? null,
    facilityPatientId: trimmedPatientId,
    confirmedAt: now.toISOString(),
    comment,
  };
};
