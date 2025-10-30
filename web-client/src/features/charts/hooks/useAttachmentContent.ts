import { useQuery } from '@tanstack/react-query';

import { fetchAttachmentContent } from '@/features/charts/api/attachment-api';
import type { AttachmentContent } from '@/features/charts/types/attachment';

export const attachmentContentQueryKey = ['charts', 'attachments', 'content'] as const;

interface UseAttachmentContentOptions {
  enabled?: boolean;
}

export const useAttachmentContent = (
  attachmentId: number | null | undefined,
  options: UseAttachmentContentOptions = {},
) => {
  const { enabled = true } = options;

  return useQuery<AttachmentContent | null>({
    queryKey: [...attachmentContentQueryKey, attachmentId ?? 'none'] as const,
    queryFn: () => {
      if (!attachmentId) {
        return Promise.resolve(null);
      }
      return fetchAttachmentContent(attachmentId);
    },
    enabled: Boolean(enabled && attachmentId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
