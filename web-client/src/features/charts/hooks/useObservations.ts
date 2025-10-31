import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createObservations,
  deleteObservations,
  fetchObservations,
  updateObservations,
} from '@/features/charts/api/observation-api';
import type { ObservationModel } from '@/features/charts/types/observation';
import { formatRestDate } from '@/features/patients/utils/rest-date';

export const observationsQueryKey = (
  karteId: number | null | undefined,
  observation: string | null,
  phenomenon: string | null,
  firstConfirmed: string | undefined,
) => ['charts', 'observations', karteId ?? 'none', observation ?? '', phenomenon ?? '', firstConfirmed ?? ''] as const;

interface UseObservationsOptions {
  karteId: number | null;
  observation?: string | null;
  phenomenon?: string | null;
  firstConfirmed?: string;
  enabled?: boolean;
}

export const useObservations = ({
  karteId,
  observation = null,
  phenomenon = null,
  firstConfirmed,
  enabled = true,
}: UseObservationsOptions) =>
  useQuery<ObservationModel[]>({
    queryKey: observationsQueryKey(karteId, observation, phenomenon, firstConfirmed),
    enabled: Boolean(enabled && karteId && (observation || phenomenon)),
    queryFn: async () => {
      if (!karteId) {
        return [];
      }
      return fetchObservations(karteId, observation ?? null, phenomenon ?? null, firstConfirmed);
    },
    staleTime: 1000 * 30,
  });

interface BuildObservationParams {
  karteId: number;
  userModelId: number;
  observation: string;
  phenomenon: string;
  value?: string;
  unit?: string;
  categoryValue?: string;
  valueDesc?: string;
  memo?: string;
  timestamp?: Date;
}

export const buildNewObservation = ({
  karteId,
  userModelId,
  observation,
  phenomenon,
  value,
  unit,
  categoryValue,
  valueDesc,
  memo,
  timestamp = new Date(),
}: BuildObservationParams): ObservationModel => {
  const restTimestamp = formatRestDate(timestamp);
  return {
    observation,
    phenomenon,
    value: value ?? null,
    unit: unit ?? null,
    categoryValue: categoryValue ?? null,
    valueDesc: valueDesc ?? null,
    memo: memo ?? null,
    started: restTimestamp,
    confirmed: restTimestamp,
    recorded: restTimestamp,
    status: 'F',
    karteBean: { id: karteId },
    userModel: { id: userModelId },
  };
};

export const useObservationMutations = (
  karteId: number | null,
  observation: string | null,
  phenomenon: string | null,
  firstConfirmed: string | undefined,
) => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({
      queryKey: observationsQueryKey(karteId, observation, phenomenon, firstConfirmed),
    });
  };

  const createMutation = useMutation({
    mutationFn: createObservations,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: updateObservations,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteObservations,
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
};

export const useObservationFilterOptions = (diagnoses: ObservationModel[] | undefined) =>
  useMemo(() => {
    const observationSet = new Set<string>();
    const phenomenonSet = new Set<string>();
    (diagnoses ?? []).forEach((item) => {
      if (item.observation) {
        observationSet.add(item.observation);
      }
      if (item.phenomenon) {
        phenomenonSet.add(item.phenomenon);
      }
    });
    return {
      observations: Array.from(observationSet),
      phenomena: Array.from(phenomenonSet),
    };
  }, [diagnoses]);
