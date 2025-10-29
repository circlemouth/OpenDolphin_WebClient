import { httpClient } from '@/libs/http';

import type { ProgressNoteContext } from '@/features/charts/utils/progress-note-payload';
import { createProgressNoteDocument } from '@/features/charts/utils/progress-note-payload';

export const saveProgressNote = async (context: ProgressNoteContext, patientVisitState: number, visitId: number) => {
  const payload = createProgressNoteDocument(context);
  const endpoint = `/karte/document/pvt/${visitId},${patientVisitState}`;
  const response = await httpClient.post<string>(endpoint, payload);
  return response.data;
};
