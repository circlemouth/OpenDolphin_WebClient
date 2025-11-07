import { useQuery } from '@tanstack/react-query';

import { fetchFreeDocument, type FreeDocumentSummary } from '@/features/charts/api/free-document-api';

export const freeDocumentQueryKey = ['charts', 'free-document'] as const;

interface UseFreeDocumentOptions {
  enabled?: boolean;
}

export const useFreeDocument = (patientId: string | null, options: UseFreeDocumentOptions = {}) => {
  const { enabled = true } = options;
  return useQuery<FreeDocumentSummary | null>({
    queryKey: [...freeDocumentQueryKey, patientId] as const,
    queryFn: () => {
      if (!patientId) {
        return Promise.resolve(null);
      }
      return fetchFreeDocument(patientId);
    },
    enabled: Boolean(enabled && patientId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60,
  });
};
