import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createDiagnoses,
  deleteDiagnoses,
  fetchDiagnoses,
  updateDiagnoses,
} from '@/features/charts/api/diagnosis-api';
import type { RegisteredDiagnosis } from '@/features/charts/types/diagnosis';
import { formatRestDate } from '@/features/patients/utils/rest-date';

export const diagnosesQueryKey = (karteId: number | null | undefined, fromDate: string, activeOnly: boolean) =>
  ['charts', 'diagnosis', karteId ?? 'none', fromDate, activeOnly] as const;

interface UseDiagnosesOptions {
  karteId: number | null;
  fromDate: string;
  activeOnly?: boolean;
  enabled?: boolean;
}

export const useDiagnoses = ({
  karteId,
  fromDate,
  activeOnly = false,
  enabled = true,
}: UseDiagnosesOptions) =>
  useQuery<RegisteredDiagnosis[]>({
    queryKey: diagnosesQueryKey(karteId, fromDate, activeOnly),
    enabled: Boolean(enabled && karteId),
    queryFn: async () => {
      if (!karteId) {
        return [];
      }
      return fetchDiagnoses(karteId, fromDate, activeOnly);
    },
    staleTime: 1000 * 30,
  });

const diagnoseIdentifier = (diagnosis: RegisteredDiagnosis): string => {
  if (diagnosis.id != null) {
    return `${diagnosis.id}`;
  }
  const name = diagnosis.diagnosis?.trim() ?? '';
  const started = diagnosis.started?.trim() ?? diagnosis.firstEncounterDate?.trim() ?? '';
  return `${name}::${started}`;
};

const sortByStartedDesc = (diagnoses: RegisteredDiagnosis[]): RegisteredDiagnosis[] =>
  [...diagnoses].sort((left, right) => {
    const leftDate = left.started ?? left.firstEncounterDate ?? null;
    const rightDate = right.started ?? right.firstEncounterDate ?? null;
    const leftTs = leftDate ? new Date(leftDate).getTime() : 0;
    const rightTs = rightDate ? new Date(rightDate).getTime() : 0;
    return rightTs - leftTs;
  });

export interface DiagnosisBuckets {
  active: RegisteredDiagnosis[];
  past: RegisteredDiagnosis[];
}

export const partitionDiagnoses = (
  activeDiagnoses: RegisteredDiagnosis[] | undefined,
  allDiagnoses: RegisteredDiagnosis[] | undefined,
): DiagnosisBuckets => {
  const activeSorted = sortByStartedDesc(activeDiagnoses ?? []);
  const allSorted = sortByStartedDesc(allDiagnoses ?? []);
  const activeIds = new Set(activeSorted.map(diagnoseIdentifier));
  const past = allSorted.filter((diagnosis) => !activeIds.has(diagnoseIdentifier(diagnosis)));
  return {
    active: activeSorted,
    past,
  };
};

interface UseDiagnosisBucketsOptions {
  karteId: number | null;
  fromDate: string;
  enabled?: boolean;
}

export const useDiagnosisBuckets = ({ karteId, fromDate, enabled = true }: UseDiagnosisBucketsOptions) => {
  const activeQuery = useDiagnoses({ karteId, fromDate, activeOnly: true, enabled });
  const allQuery = useDiagnoses({ karteId, fromDate, activeOnly: false, enabled });

  const buckets = useMemo(() => partitionDiagnoses(activeQuery.data, allQuery.data), [activeQuery.data, allQuery.data]);

  const refetch = useCallback(async () => {
    await Promise.all([activeQuery.refetch(), allQuery.refetch()]);
  }, [activeQuery, allQuery]);

  return {
    activeDiagnoses: buckets.active,
    pastDiagnoses: buckets.past,
    isLoading: activeQuery.isLoading || allQuery.isLoading,
    isFetching: activeQuery.isFetching || allQuery.isFetching,
    error: activeQuery.error ?? allQuery.error ?? null,
    refetch,
  };
};

const toDateOnly = (date: Date): string => {
  const year = `${date.getFullYear()}`.padStart(4, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface BuildDiagnosisParams {
  karteId: number;
  userModelId: number;
  diagnosis: string;
  diagnosisCode?: string;
  diagnosisCodeSystem?: string;
  department?: string | null;
  departmentDesc?: string | null;
  relatedHealthInsurance?: string | null;
  category?: RegisteredDiagnosis['diagnosisCategoryModel'];
  outcome?: RegisteredDiagnosis['diagnosisOutcomeModel'];
  onsetDate?: Date;
}

export const buildNewDiagnosis = ({
  karteId,
  userModelId,
  diagnosis,
  diagnosisCode,
  diagnosisCodeSystem,
  department,
  departmentDesc,
  relatedHealthInsurance,
  category,
  outcome,
  onsetDate,
}: BuildDiagnosisParams): RegisteredDiagnosis => {
  const now = new Date();
  const timestamp = formatRestDate(now);
  const firstEncounter = onsetDate ? toDateOnly(onsetDate) : toDateOnly(now);
  return {
    diagnosis,
    diagnosisCode: diagnosisCode ?? '',
    diagnosisCodeSystem: diagnosisCodeSystem ?? 'ICD10',
    firstEncounterDate: firstEncounter,
    started: timestamp,
    confirmed: timestamp,
    recorded: timestamp,
    status: 'F',
    relatedHealthInsurance: relatedHealthInsurance ?? null,
    department: department ?? undefined,
    departmentDesc: departmentDesc ?? undefined,
    diagnosisCategoryModel: category ?? null,
    diagnosisOutcomeModel: outcome ?? null,
    karteBean: { id: karteId },
    userModel: { id: userModelId },
  };
};

export const invalidateDiagnosisQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  karteId: number | null,
  fromDate: string,
) => {
  void queryClient.invalidateQueries({ queryKey: diagnosesQueryKey(karteId, fromDate, true) });
  void queryClient.invalidateQueries({ queryKey: diagnosesQueryKey(karteId, fromDate, false) });
};

export const useDiagnosisMutations = (
  karteId: number | null,
  fromDate: string,
) => {
  const queryClient = useQueryClient();
  const invalidate = useCallback(() => {
    invalidateDiagnosisQueries(queryClient, karteId, fromDate);
  }, [fromDate, karteId, queryClient]);

  const createMutation = useMutation({
    mutationFn: createDiagnoses,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: updateDiagnoses,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiagnoses,
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
};

export const useDiagnosisById = (diagnoses: RegisteredDiagnosis[] | undefined, id: number | null) =>
  useMemo(() => {
    if (!diagnoses || id == null) {
      return null;
    }
    return diagnoses.find((item) => item.id === id) ?? null;
  }, [diagnoses, id]);
