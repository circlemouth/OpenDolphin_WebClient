import { useQuery } from '@tanstack/react-query';

import { searchPatients } from '@/features/patients/api/patient-api';
import type { PatientSearchRequest, PatientSummary } from '@/features/patients/types/patient';

export const patientSearchQueryKey = ['patients', 'search'] as const;

export const usePatientSearch = (params: PatientSearchRequest | null) => {
  const hasCriteria =
    params !== null &&
    ('keyword' in params
      ? params.keyword.trim().length > 0
      : Boolean(
          (params.nameKeyword && params.nameKeyword.trim()) ||
            (params.kanaKeyword && params.kanaKeyword.trim()) ||
            (params.idKeyword && params.idKeyword.trim()) ||
            (params.digitKeyword && params.digitKeyword.trim()),
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
