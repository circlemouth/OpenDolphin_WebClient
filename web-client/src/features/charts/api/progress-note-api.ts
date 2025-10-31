import { httpClient } from '@/libs/http';
import { recordOperationEvent } from '@/libs/audit';

import { toRawDocumentModel, type DocumentModelPayload } from '@/features/charts/types/doc';
import type { ProgressNoteContext } from '@/features/charts/utils/progress-note-payload';
import { createProgressNoteDocument } from '@/features/charts/utils/progress-note-payload';

export const saveProgressNote = async (
  context: ProgressNoteContext,
  patientVisitState: number,
  visitId: number,
) => {
  const document: DocumentModelPayload = createProgressNoteDocument(context);
  const endpoint = `/karte/document/pvt/${visitId},${patientVisitState}`;
  const response = await httpClient.post<string>(endpoint, toRawDocumentModel(document));
  recordOperationEvent('chart', 'info', 'progress_note_save', 'カルテ文書を保存しました', {
    visitId,
    modules: document.modules.length,
    billingMode: context.billing.mode,
    sendClaim: document.docInfoModel.sendClaim,
  });
  return response.data;
};
