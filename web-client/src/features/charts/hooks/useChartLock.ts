import { useMutation, useQueryClient } from '@tanstack/react-query';

import { publishChartEvent } from '@/features/charts/api/chart-event-api';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { patientVisitsQueryKey } from '@/features/charts/hooks/usePatientVisits';

const BIT_OPEN = 0;

const setBit = (state: number, bit: number, enabled: boolean) =>
  enabled ? state | (1 << bit) : state & ~(1 << bit);

export const useChartLock = (visit: PatientVisitSummary | null, clientUuid: string | undefined) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (nextOwner: string | null) => {
      if (!visit) {
        throw new Error('診察対象が選択されていません');
      }
      const nextState = setBit(visit.state, BIT_OPEN, Boolean(nextOwner));
      await publishChartEvent({ visit, nextState, ownerUuid: nextOwner });
      return { nextState, nextOwner };
    },
    onSuccess: ({ nextState, nextOwner }) => {
      if (!visit) {
        return;
      }
      queryClient.setQueryData<PatientVisitSummary[] | undefined>(patientVisitsQueryKey, (current) => {
        if (!current) {
          return current;
        }
        return current.map((entry) =>
          entry.visitId === visit.visitId
            ? {
                ...entry,
                state: nextState,
                ownerUuid: nextOwner,
                raw: {
                  ...entry.raw,
                  state: nextState,
                  patientModel: {
                    ...entry.raw.patientModel,
                    ownerUUID: nextOwner ?? undefined,
                  },
                },
              }
            : entry,
        );
      });
    },
  });

  const lock = () => {
    if (!clientUuid) {
      throw new Error('clientUUID が未定義のため診察を開始できません');
    }
    return mutation.mutateAsync(clientUuid);
  };

  const unlock = () => mutation.mutateAsync(null);

  return {
    lock,
    unlock,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
