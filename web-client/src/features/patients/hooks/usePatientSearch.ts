import { useQuery } from '@tanstack/react-query';

import { searchPatients } from '@/features/patients/api/patient-api';
import type { PatientSearchRequest, PatientSummary } from '@/features/patients/types/patient';

export const patientSearchQueryKey = ['patients', 'search'] as const;

export const usePatientSearch = (params: PatientSearchRequest | null) => {
  const hasText = (value: string | undefined) => Boolean(value && value.trim().length > 0);
  const hasCriteria =
    params !== null &&
    ('keyword' in params
      ? hasText(params.keyword)
      : Boolean(
          hasText(params.nameKeyword) ||
            hasText(params.kanaKeyword) ||
            hasText(params.idKeyword) ||
            hasText(params.digitKeyword),
        ));

  return useQuery<PatientSummary[]>({
    queryKey: [...patientSearchQueryKey, params] as const,
    queryFn: () => {
      if (!params) {
        return Promise.resolve([]);
      }
      return searchPatients(params);
    },
    enabled: hasCriteria,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60,
  });
};
