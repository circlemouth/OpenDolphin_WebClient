import { recordOperationEvent } from '@/libs/audit';
import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import { toRawDocumentModel, type DocumentModelPayload } from '@/features/charts/types/doc';

export const updateDocument = async (payload: DocumentModelPayload): Promise<void> => {
  const rawPayload = toRawDocumentModel(payload);
  await measureApiPerformance(
    PERFORMANCE_METRICS.charts.document.update,
    'PUT /karte/document',
    async () => httpClient.put<string>('/karte/document', rawPayload),
    { docPk: payload.id },
  );

  recordOperationEvent('chart', 'info', 'document_update', 'カルテ文書を更新しました', {
    docPk: payload.id,
    docTitle: payload.docInfoModel?.title,
  });
};
