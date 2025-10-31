import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

import type {
  DocInfoListResponse,
  DocInfoSummary,
  DocumentListResponse,
  DocumentModelPayload,
} from '@/features/charts/types/doc';

const encodeParam = (value: string) => encodeURIComponent(value);

export const fetchDocInfos = async (
  karteId: number,
  fromDate: string,
  includeModified = false,
): Promise<DocInfoSummary[]> => {
  const param = `${karteId},${fromDate},${includeModified}`;
  const endpoint = `/karte/docinfo/${encodeParam(param)}`;
  const response = await measureApiPerformance(
    'charts.docinfo.fetchList',
    `GET ${endpoint}`,
    async () => httpClient.get<DocInfoListResponse>(endpoint),
    { karteId, fromDate, includeModified },
  );
  return response.data?.list ?? [];
};

export const fetchDocumentsByIds = async (docIds: number[]): Promise<DocumentModelPayload[]> => {
  if (docIds.length === 0) {
    return [];
  }
  const param = docIds.join(',');
  const endpoint = `/karte/documents/${encodeParam(param)}`;
  const response = await measureApiPerformance(
    'charts.docinfo.fetchDocuments',
    `GET ${endpoint}`,
    async () => httpClient.get<DocumentListResponse>(endpoint),
    { count: docIds.length },
  );
  return response.data?.list ?? [];
};

export const updateDocumentTitle = async (docPk: number, title: string) => {
  const endpoint = `/karte/document/${docPk}`;
  await measureApiPerformance(
    'charts.docinfo.updateTitle',
    `PUT ${endpoint}`,
    async () =>
      httpClient.put<string>(endpoint, title, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }),
    { docPk },
  );
};
