import { recordOperationEvent } from '@/libs/audit';
import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import { toRawDocumentModel, type DocumentModelPayload } from '@/features/charts/types/doc';
import type { ModuleModelPayload } from '@/features/charts/types/module';

interface ModuleSearchResponse {
  list?: ModuleModelPayload[] | null;
}

export interface ModuleSearchParams {
  karteId: number;
  fromDate: string;
  toDate: string;
  entities: string[];
}

const encodeParam = (value: string) => encodeURIComponent(value);

const normalizeDate = (value: string) => {
  if (!value) {
    return '';
  }
  return value.trim();
};

export const searchModules = async ({
  karteId,
  fromDate,
  toDate,
  entities,
}: ModuleSearchParams): Promise<ModuleModelPayload[]> => {
  if (!karteId || entities.length === 0) {
    return [];
  }

  const segments = [
    String(karteId),
    normalizeDate(fromDate),
    normalizeDate(toDate),
    ...entities.map((entry) => entry.trim()).filter(Boolean),
  ];

  const endpoint = `/karte/moduleSearch/${encodeParam(segments.join(','))}`;
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.charts.claim.moduleSearch,
    `GET ${endpoint}`,
    async () => httpClient.get<ModuleSearchResponse>(endpoint),
    { karteId, entityCount: entities.length },
  );

  const modules = response.data?.list ?? [];
  recordOperationEvent('chart', 'info', 'claim_module_search', 'モジュール検索 (GET /karte/moduleSearch) を実行しました', {
    karteId,
    entityCount: entities.length,
    resultCount: modules.length,
  });
  return modules;
};

export const sendClaimDocument = async (payload: DocumentModelPayload): Promise<void> => {
  const rawPayload = toRawDocumentModel(payload);
  await measureApiPerformance(
    PERFORMANCE_METRICS.charts.claim.send,
    'PUT /karte/claim',
    async () => httpClient.put<string>('/karte/claim', rawPayload),
    { docPk: payload.id },
  );

  recordOperationEvent(
    'chart',
    'warning',
    'claim_send',
    'CLAIM 再送信 (PUT /karte/claim) を実行しました',
    {
      docPk: payload.id,
      docTitle: payload.docInfoModel?.title,
    },
  );
};
