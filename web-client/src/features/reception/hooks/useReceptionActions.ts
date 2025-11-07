import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { publishChartEvent } from '@/features/charts/api/chart-event-api';
import { patientVisitsQueryKey } from '@/features/charts/hooks/usePatientVisits';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { CHART_EVENT_TYPES } from '@/features/charts/types/chart-event';
import { setOpenBit } from '@/features/charts/utils/visit-state';
import { buildSafetyNotes } from '@/features/patients/utils/safety-notes';

interface ToggleCallArgs {
  visit: PatientVisitSummary;
  shouldCall: boolean;
}

interface ToggleCallResult {
  visitId: number;
  nextState: number;
}

interface UpdateMemoArgs {
  visit: PatientVisitSummary;
  memo: string;
}

interface UpdateMemoResult {
  visitId: number;
  memo: string;
}

const updateCachedVisit = <T extends { visitId: number }>(
  queryClient: QueryClient,
  result: T,
  updater: (visit: PatientVisitSummary) => PatientVisitSummary,
) => {
  queryClient.setQueryData<PatientVisitSummary[] | undefined>(patientVisitsQueryKey, (current) => {
    if (!current) {
      return current;
    }
    return current.map((visit) => (visit.visitId === result.visitId ? updater(visit) : visit));
  });
};

export const useReceptionCallMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<ToggleCallResult, unknown, ToggleCallArgs>({
    mutationFn: async ({ visit, shouldCall }) => {
      const nextState = setOpenBit(visit.state, shouldCall);
      await publishChartEvent({
        visit,
        nextState,
        ownerUuid: visit.ownerUuid ?? null,
        eventType: CHART_EVENT_TYPES.PVT_STATE,
      });
      return { visitId: visit.visitId, nextState };
    },
    onSuccess: (result) => {
      updateCachedVisit(queryClient, result, (visit) => ({
        ...visit,
        state: result.nextState,
        raw: {
          ...visit.raw,
          state: result.nextState,
        },
      }));
    },
  });
};

const sanitizeMemo = (memo: string) => memo.replace(/\r\n/g, '\n');

export const useReceptionMemoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateMemoResult, unknown, UpdateMemoArgs>({
    mutationFn: async ({ visit, memo }) => {
      const sanitized = sanitizeMemo(memo);
      await publishChartEvent({
        visit,
        memo: sanitized,
        eventType: CHART_EVENT_TYPES.PVT_MEMO,
      });
      return { visitId: visit.visitId, memo: sanitized };
    },
    onSuccess: (result) => {
      updateCachedVisit(queryClient, result, (visit) => {
        const safetyNotes = buildSafetyNotes([
          visit.raw.patientModel?.appMemo,
          visit.raw.patientModel?.reserve1,
          visit.raw.patientModel?.reserve2,
          visit.raw.patientModel?.reserve3,
          visit.raw.patientModel?.reserve4,
          visit.raw.patientModel?.reserve5,
          visit.raw.patientModel?.reserve6,
          result.memo ? result.memo : undefined,
        ]);

        return {
          ...visit,
          memo: result.memo || undefined,
          safetyNotes,
          raw: {
            ...visit.raw,
            memo: result.memo || undefined,
          },
        };
      });
    },
  });
};
