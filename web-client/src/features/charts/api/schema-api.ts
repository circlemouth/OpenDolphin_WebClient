import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import { toRawDocumentModel, type DocumentModelPayload } from '@/features/charts/types/doc';

export const saveSchemaDocument = async (payload: DocumentModelPayload): Promise<number> => {
  const endpoint = '/karte/document';
  const rawPayload = toRawDocumentModel(payload);
  return measureApiPerformance(
    PERFORMANCE_METRICS.charts.schema.save,
    `POST ${endpoint}`,
    async () => {
      const response = await httpClient.post<string>(endpoint, rawPayload);
      return Number.parseInt(response.data, 10);
    },
    payload.docInfoModel.patientId ? { patientId: payload.docInfoModel.patientId } : undefined,
  );
};
