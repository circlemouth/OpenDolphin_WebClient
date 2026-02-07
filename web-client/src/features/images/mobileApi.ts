import { buildHttpHeaders, httpFetch } from '../../libs/http/httpClient';
import { captureObservabilityFromResponse, ensureObservabilityMeta, getObservabilityMeta } from '../../libs/observability/observability';

export type PatientImageListItem = {
  id: string;
  fileName?: string;
  contentType?: string;
  contentSize?: number;
  recordedAt?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
};

export type PatientImageListResult = {
  ok: boolean;
  status: number;
  endpoint: string;
  list: PatientImageListItem[];
  runId?: string;
  traceId?: string;
  error?: string;
};

export type PatientImageUploadResult = {
  ok: boolean;
  status: number;
  endpoint: string;
  payload?: Record<string, unknown>;
  runId?: string;
  traceId?: string;
  error?: string;
};

const FEATURE_HEADER_NAME = 'X-Feature-Images';
const FEATURE_HEADER_VALUE = '1';

const buildGateHeaders = (init?: RequestInit) => {
  const headers = buildHttpHeaders({
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
      [FEATURE_HEADER_NAME]: FEATURE_HEADER_VALUE,
    },
  });
  return headers;
};

const parseMaybeJson = async (response: Response) => {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    return { json: (await response.json()) as Record<string, unknown> };
  }
  return { text: await response.text() };
};

export async function fetchPatientImageList(patientId: string): Promise<PatientImageListResult> {
  const metaBefore = ensureObservabilityMeta();
  const endpoint = `/patients/${encodeURIComponent(patientId)}/images`;
  const response = await httpFetch(endpoint, {
    method: 'GET',
    headers: buildGateHeaders(),
  });
  const parsed = await parseMaybeJson(response);
  const payload = parsed.json;
  const rawList = Array.isArray(payload)
    ? (payload as unknown[])
    : Array.isArray((payload as any)?.list)
      ? (((payload as any).list as unknown[]) ?? [])
      : [];
  const list: PatientImageListItem[] = rawList
    .map((entry: any) => {
      const imageId = entry?.imageId ?? entry?.id;
      if (imageId === undefined || imageId === null) return null;
      return {
        id: String(imageId),
        fileName: typeof entry?.fileName === 'string' ? entry.fileName : undefined,
        contentType: typeof entry?.contentType === 'string' ? entry.contentType : undefined,
        contentSize: typeof entry?.size === 'number' ? entry.size : typeof entry?.contentSize === 'number' ? entry.contentSize : undefined,
        recordedAt: typeof entry?.createdAt === 'string' ? entry.createdAt : typeof entry?.recordedAt === 'string' ? entry.recordedAt : undefined,
        downloadUrl: typeof entry?.downloadUrl === 'string' ? entry.downloadUrl : undefined,
        thumbnailUrl: typeof entry?.thumbnailUrl === 'string' ? entry.thumbnailUrl : undefined,
      } satisfies PatientImageListItem;
    })
    .filter((item): item is PatientImageListItem => Boolean(item));
  const metaAfter = getObservabilityMeta();
  return {
    ok: response.ok,
    status: response.status,
    endpoint,
    list,
    runId: metaAfter.runId ?? metaBefore.runId,
    traceId: metaAfter.traceId ?? metaBefore.traceId,
    error: response.ok ? undefined : `HTTP ${response.status}`,
  };
}

const parseXhrHeaders = (xhr: XMLHttpRequest) => {
  const raw = xhr.getAllResponseHeaders?.() ?? '';
  const headers = new Headers();
  raw
    .trim()
    .split(/[\r\n]+/)
    .forEach((line) => {
      const parts = line.split(': ');
      const key = parts.shift();
      if (!key) return;
      const value = parts.join(': ');
      headers.append(key, value);
    });
  return headers;
};

export type UploadProgressEvent = {
  mode: 'real' | 'indeterminate';
  loaded?: number;
  total?: number;
  percent?: number;
};

export function uploadPatientImageViaXhr(params: {
  patientId: string;
  file: File;
  onProgress?: (event: UploadProgressEvent) => void;
}): Promise<PatientImageUploadResult & { progressMode: UploadProgressEvent['mode'] }> {
  const metaBefore = ensureObservabilityMeta();
  const endpoint = `/patients/${encodeURIComponent(params.patientId)}/images`;
  let progressMode: UploadProgressEvent['mode'] = 'indeterminate';

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);

    // NOTE: Do not set Content-Type for multipart/form-data; the browser will set boundary.
    const headers = buildGateHeaders({ method: 'POST' });
    Object.entries(headers).forEach(([key, value]) => {
      if (!value) return;
      if (key.toLowerCase() === 'content-type') return;
      xhr.setRequestHeader(key, value);
    });

    const emitProgress = (event: UploadProgressEvent) => {
      progressMode = event.mode;
      params.onProgress?.(event);
    };

    if (xhr.upload && typeof xhr.upload.addEventListener === 'function') {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          emitProgress({ mode: 'real', loaded: event.loaded, total: event.total, percent });
          return;
        }
        emitProgress({ mode: 'indeterminate' });
      });
    } else {
      emitProgress({ mode: 'indeterminate' });
    }

    xhr.onload = () => {
      const headers = parseXhrHeaders(xhr);
      const response = new Response(xhr.responseText ?? '', { status: xhr.status, headers });
      captureObservabilityFromResponse(response);
      const metaAfter = getObservabilityMeta();
      let payloadData: Record<string, unknown> | undefined;
      const contentType = headers.get('Content-Type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          payloadData = JSON.parse(xhr.responseText ?? '{}') as Record<string, unknown>;
        } catch {
          payloadData = undefined;
        }
      }
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        endpoint,
        payload: payloadData,
        runId: metaAfter.runId ?? metaBefore.runId,
        traceId: metaAfter.traceId ?? metaBefore.traceId,
        error: xhr.status >= 200 && xhr.status < 300 ? undefined : `HTTP ${xhr.status}`,
        progressMode,
      });
    };

    xhr.onerror = () => {
      const metaAfter = getObservabilityMeta();
      resolve({
        ok: false,
        status: 0,
        endpoint,
        runId: metaAfter.runId ?? metaBefore.runId,
        traceId: metaAfter.traceId ?? metaBefore.traceId,
        error: 'network_error',
        progressMode,
      });
    };

    const form = new FormData();
    form.append('file', params.file, params.file.name);
    xhr.send(form);
  });
}
