import { useQuery } from '@tanstack/react-query';

import { fetchKarteByPatientId } from '@/features/patients/api/karte-api';
import type { KarteSummary } from '@/features/patients/types/karte';
import { defaultKarteFromDate } from '@/features/patients/utils/rest-date';

export const patientKarteQueryKey = ['patients', 'karte'] as const;

interface UsePatientKarteOptions {
  fromDate?: string;
  enabled?: boolean;
}

export const usePatientKarte = (
  patientId: string | null,
  options: UsePatientKarteOptions = {},
) => {
  const { fromDate = defaultKarteFromDate(), enabled = true } = options;

  return useQuery<KarteSummary | null>({
    queryKey: [...patientKarteQueryKey, patientId, fromDate] as const,
    queryFn: () => {
      if (!patientId) {
        return Promise.resolve(null);
      }
      return fetchKarteByPatientId(patientId, fromDate);
    },
    enabled: Boolean(enabled && patientId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60,
  });
};
