import { useQuery } from '@tanstack/react-query';

import { fetchPatientVisitHistory } from '@/features/reception/api/visit-detail-api';

const buildReferenceDate = (value?: string) => {
  if (!value) {
    return new Date();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
};

export const useVisitHistory = (patientId?: string, visitDate?: string) =>
  useQuery({
    queryKey: ['reception', 'visitHistory', patientId, visitDate?.slice(0, 7)],
    enabled: Boolean(patientId && visitDate),
    queryFn: async () => fetchPatientVisitHistory(patientId!, buildReferenceDate(visitDate)),
    staleTime: 1000 * 60,
  });
