import { useQuery } from '@tanstack/react-query';

import { fetchStampLibrary } from '@/features/charts/api/stamp-api';
import type { StampDefinition } from '@/features/charts/types/stamp';

export const useStampLibrary = (userPk: number | null | undefined) =>
  useQuery<StampDefinition[]>({
    queryKey: ['stamp-library', userPk ?? 'none'],
    enabled: Boolean(userPk),
    staleTime: 1000 * 60 * 5,
    queryFn: () => {
      if (!userPk) {
        return Promise.resolve([]);
      }
      return fetchStampLibrary(userPk);
    },
  });
