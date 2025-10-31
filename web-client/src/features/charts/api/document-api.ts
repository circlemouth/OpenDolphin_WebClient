import { recordOperationEvent } from '@/libs/audit';
import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

import type { DocumentModelPayload } from '@/features/charts/types/doc';

export const updateDocument = async (payload: DocumentModelPayload): Promise<void> => {
  await measureApiPerformance(
    'charts.document.update',
    'PUT /karte/document',
    async () => httpClient.put<string>('/karte/document', payload),
    { docPk: payload.id },
  );

  recordOperationEvent('chart', 'info', 'document_update', 'カルテ文書を更新しました', {
    docPk: payload.id,
    docTitle: payload.docInfoModel?.title,
  });
};
