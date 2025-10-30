import { httpClient } from '@/libs/http';
import { recordOperationEvent } from '@/libs/audit';

import type { ProgressNoteContext } from '@/features/charts/utils/progress-note-payload';
import { createProgressNoteDocument } from '@/features/charts/utils/progress-note-payload';

export const saveProgressNote = async (context: ProgressNoteContext, patientVisitState: number, visitId: number) => {
  const payload = createProgressNoteDocument(context);
  const endpoint = `/karte/document/pvt/${visitId},${patientVisitState}`;
  const response = await httpClient.post<string>(endpoint, payload);
  recordOperationEvent('chart', 'info', 'progress_note_save', 'カルテ文書を保存しました', {
    visitId,
    modules: payload.modules?.length ?? 0,
    billingMode: context.billing.mode,
    sendClaim: payload.docInfoModel?.sendClaim ?? false,
  });
  return response.data;
};
