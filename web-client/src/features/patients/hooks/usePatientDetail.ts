import { useQuery } from '@tanstack/react-query';

import { fetchPatientById } from '@/features/patients/api/patient-api';
import type { PatientDetail } from '@/features/patients/types/patient';

export const patientDetailQueryKey = ['patients', 'detail'] as const;

interface UsePatientDetailOptions {
  enabled?: boolean;
}

export const usePatientDetail = (patientId: string | null, options: UsePatientDetailOptions = {}) => {
  const { enabled = true } = options;

  return useQuery<PatientDetail | null>({
    queryKey: [...patientDetailQueryKey, patientId] as const,
    queryFn: () => {
      if (!patientId) {
        return Promise.resolve(null);
      }
      return fetchPatientById(patientId);
    },
    enabled: Boolean(enabled && patientId),
    staleTime: 1000 * 15,
    gcTime: 1000 * 60,
  });
};
