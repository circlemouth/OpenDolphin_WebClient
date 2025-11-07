import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import type { AttachmentContent, AttachmentSummary, AttachmentKind } from '@/features/charts/types/attachment';

interface RawAttachmentModel {
  id: number;
  confirmed?: string | null;
  started?: string | null;
  ended?: string | null;
  recorded?: string | null;
  linkId?: number | null;
  linkRelation?: string | null;
  status?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  contentSize?: number | null;
  lastModified?: number | null;
  digest?: string | null;
  title?: string | null;
  uri?: string | null;
  extension?: string | null;
  memo?: string | null;
  bytes?: string | null;
}

interface RawDocInfoModel {
  docPk?: number;
  title?: string | null;
  confirmDate?: string | null;
  firstConfirmDate?: string | null;
  departmentDesc?: string | null;
  status?: string | null;
}

interface RawDocumentModel {
  id?: number;
  confirmed?: string | null;
  started?: string | null;
  recorded?: string | null;
  status?: string | null;
  docInfoModel?: RawDocInfoModel | null;
  attachment?: RawAttachmentModel[] | null;
}

interface RawDocumentList {
  list?: RawDocumentModel[] | null;
}

const ATTACHMENT_CHUNK_SIZE = 20;

const toAttachmentKind = (attachment: RawAttachmentModel): AttachmentKind => {
  const extension = attachment.extension?.trim().toLowerCase();
  const contentType = attachment.contentType?.toLowerCase() ?? '';
  const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff', 'svg']);
  if (contentType.startsWith('image/') || (extension && imageExtensions.has(extension))) {
    return 'image';
  }
  if (contentType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }
  return 'other';
};

const coalesceDate = (...values: (string | null | undefined)[]): string | null => {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return null;
};

const transformAttachment = (
  document: RawDocumentModel,
  docInfo: RawDocInfoModel | null | undefined,
  attachment: RawAttachmentModel,
): AttachmentSummary | null => {
  if (!attachment.id) {
    return null;
  }
  const docId = docInfo?.docPk ?? document.id;
  if (!docId) {
    return null;
  }

  const recordedAt = coalesceDate(
    attachment.recorded,
    attachment.confirmed,
    document.recorded,
    docInfo?.confirmDate,
    docInfo?.firstConfirmDate,
    document.started,
  );

  return {
    id: attachment.id,
    documentId: docId,
    title: attachment.title?.trim() || attachment.fileName?.trim() || docInfo?.title?.trim() || '添付ファイル',
    description: attachment.memo?.trim() || docInfo?.title?.trim() || undefined,
    fileName: attachment.fileName?.trim() || undefined,
    extension: attachment.extension?.trim().toLowerCase() || undefined,
    contentType: attachment.contentType?.trim() || undefined,
    size: typeof attachment.contentSize === 'number' ? attachment.contentSize : undefined,
    recordedAt,
    confirmedAt: attachment.confirmed ?? null,
    createdAt: attachment.started ?? null,
    uri: attachment.uri ?? null,
    kind: toAttachmentKind(attachment),
    documentTitle: docInfo?.title?.trim() || undefined,
    documentDepartment: docInfo?.departmentDesc?.trim() || undefined,
    documentStatus: docInfo?.status?.trim() || document.status || undefined,
  };
};

const chunkIds = (ids: number[]): number[][] => {
  const result: number[][] = [];
  for (let index = 0; index < ids.length; index += ATTACHMENT_CHUNK_SIZE) {
    result.push(ids.slice(index, index + ATTACHMENT_CHUNK_SIZE));
  }
  return result;
};

export const fetchDocumentAttachments = async (documentIds: number[]): Promise<AttachmentSummary[]> => {
  const uniqueIds = Array.from(new Set(documentIds.filter((id) => Number.isFinite(id)))) as number[];
  if (uniqueIds.length === 0) {
    return [];
  }

  const documents: RawDocumentModel[] = [];
  for (const chunk of chunkIds(uniqueIds)) {
    const endpoint = `/karte/documents/${chunk.join(',')}`;
    const response = await measureApiPerformance(
      PERFORMANCE_METRICS.charts.attachments.fetchDocuments,
      `GET ${endpoint}`,
      async () => httpClient.get<RawDocumentList>(endpoint),
      { documentCount: chunk.length },
    );
    const list = response.data?.list ?? [];
    documents.push(...list);
  }

  const attachments: AttachmentSummary[] = [];
  for (const doc of documents) {
    const docInfo = doc.docInfoModel;
    const list = doc.attachment ?? [];
    for (const attachment of list) {
      const transformed = transformAttachment(doc, docInfo, attachment);
      if (transformed) {
        attachments.push(transformed);
      }
    }
  }

  return attachments;
};

export const fetchAttachmentContent = async (attachmentId: number): Promise<AttachmentContent> => {
  const endpoint = `/karte/attachment/${attachmentId}`;
  const response = await measureApiPerformance(
    PERFORMANCE_METRICS.charts.attachments.fetchContent,
    `GET ${endpoint}`,
    async () => httpClient.get<RawAttachmentModel>(endpoint),
    { attachmentId },
  );
  const data = response.data;
  const contentType = data.contentType?.trim() || 'application/octet-stream';
  const bytesBase64 = data.bytes ?? '';

  return {
    id: attachmentId,
    contentType,
    bytesBase64,
    dataUrl: bytesBase64 ? `data:${contentType};base64,${bytesBase64}` : '',
    fileName: data.fileName ?? undefined,
  };
};
