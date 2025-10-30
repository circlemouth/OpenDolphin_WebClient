import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

export const saveSchemaDocument = async (payload: unknown): Promise<number> => {
  const endpoint = '/karte/document';
  return measureApiPerformance(
    'charts.schema.save',
    `POST ${endpoint}`,
    async () => {
      const response = await httpClient.post<string>(endpoint, payload);
      return Number.parseInt(response.data, 10);
    },
    typeof payload === 'object' && payload !== null && 'docInfoModel' in payload
      ? { patientId: (payload as { docInfoModel?: { patientId?: string } }).docInfoModel?.patientId }
      : undefined,
  );
};
