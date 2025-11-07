import { useQuery } from '@tanstack/react-query';

import { fetchDocumentAttachments } from '@/features/charts/api/attachment-api';
import type { AttachmentSummary } from '@/features/charts/types/attachment';

export const documentAttachmentsQueryKey = ['charts', 'attachments', 'documents'] as const;

interface UseDocumentAttachmentsOptions {
  enabled?: boolean;
}

export const useDocumentAttachments = (
  documentIds: number[] | null | undefined,
  options: UseDocumentAttachmentsOptions = {},
) => {
  const { enabled = true } = options;

  return useQuery<AttachmentSummary[]>({
    queryKey: [...documentAttachmentsQueryKey, documentIds?.join(',') ?? 'none'] as const,
    queryFn: () => {
      if (!documentIds || documentIds.length === 0) {
        return Promise.resolve([]);
      }
      return fetchDocumentAttachments(documentIds);
    },
    enabled: Boolean(enabled && documentIds && documentIds.length > 0),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
};
