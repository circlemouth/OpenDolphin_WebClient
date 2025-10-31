import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { fetchDocInfos, fetchDocumentsByIds } from '@/features/charts/api/doc-info-api';
import type { DocInfoSummary, DocumentModelPayload } from '@/features/charts/types/doc';

export const docInfosQueryKey = (karteId: number | null | undefined, fromDate: string, includeModified: boolean) =>
  ['charts', 'docinfo', karteId ?? 'none', fromDate, includeModified] as const;

interface UseDocInfosOptions {
  karteId: number | null;
  fromDate: string;
  includeModified?: boolean;
  enabled?: boolean;
}

export const useDocInfos = ({
  karteId,
  fromDate,
  includeModified = true,
  enabled = true,
}: UseDocInfosOptions) =>
  useQuery<DocInfoSummary[]>({
    queryKey: docInfosQueryKey(karteId, fromDate, includeModified),
    enabled: Boolean(enabled && karteId),
    queryFn: async () => {
      if (!karteId) {
        return [];
      }
      return fetchDocInfos(karteId, fromDate, includeModified);
    },
    staleTime: 1000 * 30,
  });

interface UseDocumentDetailOptions {
  enabled?: boolean;
}

export const useDocumentDetail = (docPk: number | null, options: UseDocumentDetailOptions = {}) => {
  const { enabled = true } = options;

  return useQuery<DocumentModelPayload | null>({
    queryKey: ['charts', 'documents', docPk ?? 'none'],
    enabled: Boolean(enabled && docPk),
    queryFn: async () => {
      if (!docPk) {
        return null;
      }
      const documents = await fetchDocumentsByIds([docPk]);
      return documents[0] ?? null;
    },
  });
};

export const useDocumentDetailsBatch = () =>
  useMutation({
    mutationFn: async (docPks: number[]) => {
      if (docPks.length === 0) {
        return [] as DocumentModelPayload[];
      }
      return fetchDocumentsByIds(docPks);
    },
  });

export const useLatestDocument = (documents: DocInfoSummary[] | undefined) =>
  useMemo(() => {
    if (!documents || documents.length === 0) {
      return null;
    }
    return [...documents].sort((a, b) => {
      const left = a.confirmDate ? new Date(a.confirmDate).getTime() : 0;
      const right = b.confirmDate ? new Date(b.confirmDate).getTime() : 0;
      return right - left;
    })[0];
  }, [documents]);
