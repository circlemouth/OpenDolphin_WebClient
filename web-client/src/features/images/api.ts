import { logAuditEvent } from '../../libs/audit/auditLogger';
import { httpFetch } from '../../libs/http/httpClient';
import { ensureObservabilityMeta, getObservabilityMeta } from '../../libs/observability/observability';

const IMAGE_LIST_ENDPOINT = '/karte/images';
const IMAGE_LIST_TYPO_ENDPOINT = '/karte/iamges';
const IMAGE_DETAIL_ENDPOINT = '/karte/image';
const ATTACHMENT_ENDPOINT = '/karte/attachment';
const DOCUMENT_ENDPOINT = '/karte/document';

export type KarteImageListItem = {
  id: number;
  title?: string;
  fileName?: string;
  contentType?: string;
  contentSize?: number;
  recordedAt?: string;
  thumbnailUrl?: string;
};

export type KarteImageListResult = {
  ok: boolean;
  status: number;
  endpoint: string;
  list: KarteImageListItem[];
  page?: number;
  total?: number;
  meta?: Record<string, unknown>;
  rawXml?: string;
  runId?: string;
  traceId?: string;
  error?: string;
};

export type KarteImageDetailResult = {
  ok: boolean;
  status: number;
  endpoint: string;
  payload?: Record<string, unknown>;
  rawText?: string;
  runId?: string;
  traceId?: string;
  error?: string;
};

export type KarteAttachmentDetailResult = {
  ok: boolean;
  status: number;
  endpoint: string;
  payload?: Record<string, unknown>;
  rawText?: string;
  runId?: string;
  traceId?: string;
  error?: string;
};

export type KarteAttachmentPayload = {
  id?: number;
  fileName?: string;
  contentType?: string;
  contentSize?: number;
  lastModified?: number;
  digest?: string;
  title?: string;
  uri?: string;
  extension?: string;
  memo?: string;
  bytes?: string;
};

export type KarteDocumentAttachmentPayload = {
  id?: number;
  status?: string;
  docInfoModel?: Record<string, unknown>;
  userModel?: { id: number; commonName?: string };
  karteBean?: { id: number };
  attachment: KarteAttachmentPayload[];
};

export type AttachmentValidationError = {
  kind: 'missing' | 'size' | 'extension';
  message: string;
  fileName?: string;
  extension?: string;
  size?: number;
  maxSizeBytes?: number;
  allowedExtensions?: string[];
};

export type AttachmentValidationOptions = {
  maxSizeBytes?: number;
  allowedExtensions?: string[];
};

export type AttachmentValidationResult = {
  ok: boolean;
  errors: AttachmentValidationError[];
};

export type KarteDocumentSendResult = {
  ok: boolean;
  status: number;
  endpoint: string;
  payload?: Record<string, unknown>;
  rawText?: string;
  runId?: string;
  traceId?: string;
  error?: string;
  validationErrors?: AttachmentValidationError[];
};

export const IMAGE_ATTACHMENT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const IMAGE_ATTACHMENT_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff', 'webp'];

const normalizeExtension = (value?: string) => (value ? value.replace(/^\./, '').trim().toLowerCase() : undefined);

const resolveExtension = (attachment: KarteAttachmentPayload) => {
  const direct = normalizeExtension(attachment.extension);
  if (direct) return direct;
  if (!attachment.fileName) return undefined;
  const idx = attachment.fileName.lastIndexOf('.');
  if (idx < 0) return undefined;
  return normalizeExtension(attachment.fileName.slice(idx + 1));
};

const logImageApiAudit = (params: {
  operation: 'list' | 'detail' | 'attachment' | 'document';
  endpoint: string;
  ok: boolean;
  status: number;
  runId?: string;
  traceId?: string;
  details?: Record<string, unknown>;
}) => {
  logAuditEvent({
    runId: params.runId,
    traceId: params.traceId,
    payload: {
      action: 'image_api_call',
      outcome: params.ok ? 'success' : 'error',
      details: {
        operation: params.operation,
        endpoint: params.endpoint,
        status: params.status,
        runId: params.runId,
        traceId: params.traceId,
        ...params.details,
      },
    },
  });
};

export function validateAttachmentPayload(
  attachments: KarteAttachmentPayload[],
  options: AttachmentValidationOptions = {},
): AttachmentValidationResult {
  const maxSizeBytes = options.maxSizeBytes ?? IMAGE_ATTACHMENT_MAX_SIZE_BYTES;
  const allowedExtensions = options.allowedExtensions ?? IMAGE_ATTACHMENT_ALLOWED_EXTENSIONS;
  const errors: AttachmentValidationError[] = [];

  attachments.forEach((attachment) => {
    const fileName = attachment.fileName;
    const size = attachment.contentSize;
    const extension = resolveExtension(attachment);

    if (!attachment.bytes || !attachment.contentType || !fileName) {
      errors.push({
        kind: 'missing',
        message: '添付ファイルの必須メタデータが不足しています。',
        fileName,
      });
    }

    if (typeof size === 'number' && size > maxSizeBytes) {
      errors.push({
        kind: 'size',
        message: `添付ファイルが最大サイズ(${maxSizeBytes} bytes)を超えています。`,
        fileName,
        size,
        maxSizeBytes,
      });
    }

    if (extension && !allowedExtensions.includes(extension)) {
      errors.push({
        kind: 'extension',
        message: `許可されていない拡張子です。(${extension})`,
        fileName,
        extension,
        allowedExtensions,
      });
    }
  });

  return { ok: errors.length === 0, errors };
}

const parseMaybeJson = async (response: Response) => {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    return { json: (await response.json()) as Record<string, unknown> };
  }
  return { text: await response.text() };
};

export async function fetchKarteImageList(params: {
  chartId?: string;
  karteId?: string;
  from?: string;
  to?: string;
  allowTypoFallback?: boolean;
}): Promise<KarteImageListResult> {
  const metaBefore = ensureObservabilityMeta();
  const query = new URLSearchParams();
  if (params.chartId) query.set('chartId', params.chartId);
  if (params.karteId) query.set('karteId', params.karteId);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  const buildUrl = (endpoint: string) => (query.toString() ? `${endpoint}?${query.toString()}` : endpoint);

  const primaryEndpoint = buildUrl(IMAGE_LIST_ENDPOINT);
  let response = await httpFetch(primaryEndpoint, { method: 'GET' });
  let endpointUsed = primaryEndpoint;

  if (!response.ok && params.allowTypoFallback !== false) {
    const fallbackEndpoint = buildUrl(IMAGE_LIST_TYPO_ENDPOINT);
    response = await httpFetch(fallbackEndpoint, { method: 'GET' });
    endpointUsed = fallbackEndpoint;
  }

  const parsed = await parseMaybeJson(response);
  const payload = parsed.json;
  const list = Array.isArray(payload?.list) ? (payload?.list as KarteImageListItem[]) : [];
  const page = typeof payload?.page === 'number' ? (payload.page as number) : undefined;
  const total = typeof payload?.total === 'number' ? (payload.total as number) : undefined;
  const metaAfter = getObservabilityMeta();
  const result: KarteImageListResult = {
    ok: response.ok,
    status: response.status,
    endpoint: endpointUsed,
    list,
    page,
    total,
    meta: typeof payload?.meta === 'object' && payload?.meta !== null ? (payload.meta as Record<string, unknown>) : undefined,
    rawXml: parsed.text,
    runId: metaAfter.runId ?? metaBefore.runId,
    traceId: metaAfter.traceId ?? metaBefore.traceId,
    error: response.ok ? undefined : `HTTP ${response.status}`,
  };

  logImageApiAudit({
    operation: 'list',
    endpoint: endpointUsed,
    ok: result.ok,
    status: result.status,
    runId: result.runId,
    traceId: result.traceId,
    details: {
      recordsReturned: list.length,
      page,
      total,
    },
  });

  return result;
}

export async function fetchKarteImageDetail(id: number | string): Promise<KarteImageDetailResult> {
  const metaBefore = ensureObservabilityMeta();
  const endpoint = `${IMAGE_DETAIL_ENDPOINT}/${encodeURIComponent(String(id))}`;
  const response = await httpFetch(endpoint, { method: 'GET' });
  const parsed = await parseMaybeJson(response);
  const metaAfter = getObservabilityMeta();
  const result: KarteImageDetailResult = {
    ok: response.ok,
    status: response.status,
    endpoint,
    payload: parsed.json,
    rawText: parsed.text,
    runId: metaAfter.runId ?? metaBefore.runId,
    traceId: metaAfter.traceId ?? metaBefore.traceId,
    error: response.ok ? undefined : `HTTP ${response.status}`,
  };

  logImageApiAudit({
    operation: 'detail',
    endpoint,
    ok: result.ok,
    status: result.status,
    runId: result.runId,
    traceId: result.traceId,
    details: { imageId: id },
  });

  return result;
}

export async function fetchKarteAttachmentDetail(id: number | string): Promise<KarteAttachmentDetailResult> {
  const metaBefore = ensureObservabilityMeta();
  const endpoint = `${ATTACHMENT_ENDPOINT}/${encodeURIComponent(String(id))}`;
  const response = await httpFetch(endpoint, { method: 'GET' });
  const parsed = await parseMaybeJson(response);
  const metaAfter = getObservabilityMeta();
  const result: KarteAttachmentDetailResult = {
    ok: response.ok,
    status: response.status,
    endpoint,
    payload: parsed.json,
    rawText: parsed.text,
    runId: metaAfter.runId ?? metaBefore.runId,
    traceId: metaAfter.traceId ?? metaBefore.traceId,
    error: response.ok ? undefined : `HTTP ${response.status}`,
  };

  logImageApiAudit({
    operation: 'attachment',
    endpoint,
    ok: result.ok,
    status: result.status,
    runId: result.runId,
    traceId: result.traceId,
    details: { attachmentId: id },
  });

  return result;
}

export async function sendKarteDocumentWithAttachments(
  payload: KarteDocumentAttachmentPayload,
  options: {
    method?: 'POST' | 'PUT';
    validate?: boolean;
    validationOptions?: AttachmentValidationOptions;
  } = {},
): Promise<KarteDocumentSendResult> {
  const metaBefore = ensureObservabilityMeta();
  const validation = options.validate === false
    ? { ok: true, errors: [] }
    : validateAttachmentPayload(payload.attachment ?? [], options.validationOptions);

  if (!validation.ok) {
    const metaAfter = getObservabilityMeta();
    const result: KarteDocumentSendResult = {
      ok: false,
      status: 0,
      endpoint: DOCUMENT_ENDPOINT,
      runId: metaAfter.runId ?? metaBefore.runId,
      traceId: metaAfter.traceId ?? metaBefore.traceId,
      error: 'validation_failed',
      validationErrors: validation.errors,
    };
    logImageApiAudit({
      operation: 'document',
      endpoint: DOCUMENT_ENDPOINT,
      ok: false,
      status: 0,
      runId: result.runId,
      traceId: result.traceId,
      details: {
        attachmentsSent: payload.attachment?.length ?? 0,
        validationErrors: validation.errors.map((entry) => entry.message),
      },
    });
    return result;
  }

  const response = await httpFetch(DOCUMENT_ENDPOINT, {
    method: options.method ?? 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const parsed = await parseMaybeJson(response);
  const metaAfter = getObservabilityMeta();
  const result: KarteDocumentSendResult = {
    ok: response.ok,
    status: response.status,
    endpoint: DOCUMENT_ENDPOINT,
    payload: parsed.json,
    rawText: parsed.text,
    runId: metaAfter.runId ?? metaBefore.runId,
    traceId: metaAfter.traceId ?? metaBefore.traceId,
    error: response.ok ? undefined : `HTTP ${response.status}`,
  };

  logImageApiAudit({
    operation: 'document',
    endpoint: DOCUMENT_ENDPOINT,
    ok: result.ok,
    status: result.status,
    runId: result.runId,
    traceId: result.traceId,
    details: {
      attachmentsSent: payload.attachment?.length ?? 0,
      documentId: payload.id,
    },
  });

  return result;
}
