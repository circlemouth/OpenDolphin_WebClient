import { useQuery } from '@tanstack/react-query';

import { fetchPatientVisits } from '@/features/charts/api/patient-visit-api';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';

export const patientVisitsQueryKey = ['charts', 'visits'] as const;

export const usePatientVisits = () =>
  useQuery<PatientVisitSummary[]>({
    queryKey: patientVisitsQueryKey,
    queryFn: fetchPatientVisits,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60,
  });
