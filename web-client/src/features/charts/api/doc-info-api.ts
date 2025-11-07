import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import {
  fromRawDocumentModel,
  toDocInfoSummary,
  type DocInfoListResponse,
  type DocInfoSummary,
  type DocumentListResponse,
  type DocumentModelPayload,
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
    PERFORMANCE_METRICS.charts.docInfo.fetchList,
    `GET ${endpoint}`,
    async () => httpClient.get<DocInfoListResponse>(endpoint),
    { karteId, fromDate, includeModified },
  );
  const list = response.data?.list ?? [];
  return list
    .map((entry) => toDocInfoSummary(entry))
    .filter((entry): entry is DocInfoSummary => Boolean(entry));
};

export const fetchDocumentsByIds = async (docIds: number[]): Promise<DocumentModelPayload[]> => {
  if (docIds.length === 0) {
    return [];
  }
  const param = docIds.join(',');
  const endpoint = `/karte/documents/${encodeParam(param)}`;
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.charts.docInfo.fetchDocuments,
    `GET ${endpoint}`,
    async () => httpClient.get<DocumentListResponse>(endpoint),
    { count: docIds.length },
  );
  const list = response.data?.list ?? [];
  return list
    .map((entry) => fromRawDocumentModel(entry))
    .filter((entry): entry is DocumentModelPayload => Boolean(entry));
};

export const updateDocumentTitle = async (docPk: number, title: string) => {
  const endpoint = `/karte/document/${docPk}`;
  await measureApiPerformance(
    PERFORMANCE_METRICS.charts.docInfo.updateTitle,
    `PUT ${endpoint}`,
    async () =>
      httpClient.put<string>(endpoint, title, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }),
    { docPk },
  );
};
