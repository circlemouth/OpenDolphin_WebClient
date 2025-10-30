import { useQuery } from '@tanstack/react-query';

import { fetchTemporaryDocumentPatients } from '@/features/reception/api/visit-detail-api';

export const useTemporaryDocuments = () =>
  useQuery({
    queryKey: ['reception', 'temporaryDocuments'],
    queryFn: fetchTemporaryDocumentPatients,
    staleTime: 1000 * 60,
  });
