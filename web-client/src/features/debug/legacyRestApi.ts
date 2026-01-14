import { httpFetch } from '../../libs/http/httpClient';
import { ensureObservabilityMeta, getObservabilityMeta } from '../../libs/observability/observability';

export type LegacyRestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export type LegacyRestEndpoint = {
  id: string;
  label: string;
  method: LegacyRestMethod;
  path: string;
  description: string;
  defaultQuery?: string;
  defaultBody?: string;
  defaultContentType?: LegacyRestContentType;
};

export type LegacyRestContentType = 'json' | 'text' | 'form';

export const LEGACY_REST_ENDPOINTS: readonly LegacyRestEndpoint[] = [
  {
    id: 'pvt',
    label: '/pvt',
    method: 'GET',
    path: '/pvt',
    description: '受付/来院（PVT）一覧。',
  },
  {
    id: 'pvt2',
    label: '/pvt2',
    method: 'GET',
    path: '/pvt2',
    description: '受付/来院（PVT2）一覧。',
  },
  {
    id: 'appo',
    label: '/appo',
    method: 'GET',
    path: '/appo',
    description: '予約/来院情報（Legacy appo）。',
  },
  {
    id: 'karte',
    label: '/karte',
    method: 'GET',
    path: '/karte',
    description: 'カルテ（Karte）情報。',
  },
  {
    id: 'stamp',
    label: '/stamp',
    method: 'GET',
    path: '/stamp',
    description: 'スタンプツリー/スタンプ情報。',
  },
  {
    id: 'patient',
    label: '/patient',
    method: 'GET',
    path: '/patient',
    description: '患者情報（Legacy REST）。',
  },
  {
    id: 'odletter',
    label: '/odletter',
    method: 'GET',
    path: '/odletter',
    description: '文書（紹介状など）情報。',
  },
  {
    id: 'schedule',
    label: '/schedule',
    method: 'GET',
    path: '/schedule',
    description: 'スケジュール情報。',
  },
  {
    id: 'reporting-karte',
    label: '/reporting/karte',
    method: 'GET',
    path: '/reporting/karte',
    description: '帳票（カルテ）出力。',
  },
  {
    id: 'lab',
    label: '/lab',
    method: 'GET',
    path: '/lab',
    description: '検体/検査関連情報。',
  },
  {
    id: 'mml',
    label: '/mml',
    method: 'GET',
    path: '/mml',
    description: 'MML データ連携。',
  },
  {
    id: 'chartEvent',
    label: '/chartEvent',
    method: 'GET',
    path: '/chartEvent',
    description: 'チャートイベント履歴。',
  },
  {
    id: 'chart-events',
    label: '/chart-events',
    method: 'GET',
    path: '/chart-events',
    description: 'チャートイベントストリーム。',
  },
  {
    id: 'system',
    label: '/system',
    method: 'GET',
    path: '/system',
    description: 'システム情報（Legacy REST）。',
  },
  {
    id: 'serverinfo',
    label: '/serverinfo',
    method: 'GET',
    path: '/serverinfo',
    description: 'サーバー情報。',
  },
  {
    id: 'demo',
    label: '/demo',
    method: 'GET',
    path: '/demo',
    description: 'デモ系エンドポイント。',
  },
];

export type LegacyRestRequest = {
  method: LegacyRestMethod;
  path: string;
  query?: string;
  body?: string;
  contentType?: LegacyRestContentType;
};

export type LegacyRestResponseMode = 'json' | 'text' | 'binary';

export type LegacyRestResponse = {
  ok: boolean;
  status: number;
  statusText?: string;
  raw: string;
  json?: unknown;
  mode: LegacyRestResponseMode;
  binarySize?: number;
  contentType?: string;
  headers: Record<string, string>;
  runId?: string;
  traceId?: string;
};

export const buildLegacyRestUrl = (path: string, query?: string) => {
  if (!query) return path;
  const trimmed = query.trim();
  if (!trimmed) return path;
  if (path.includes('?')) {
    return `${path}&${trimmed}`;
  }
  return `${path}?${trimmed}`;
};

const resolveContentTypeHeader = (contentType?: LegacyRestContentType) => {
  switch (contentType) {
    case 'form':
      return 'application/x-www-form-urlencoded; charset=UTF-8';
    case 'text':
      return 'text/plain; charset=UTF-8';
    case 'json':
    default:
      return 'application/json; charset=UTF-8';
  }
};

const normalizeHeaders = (headers: Headers) => {
  const entries: Record<string, string> = {};
  headers.forEach((value, key) => {
    entries[key] = value;
  });
  return entries;
};

const shouldParseJson = (raw: string, contentType?: string) => {
  if (contentType?.toLowerCase().includes('json')) return true;
  const trimmed = raw.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

const parseMaybeJson = (raw: string, contentType?: string) => {
  if (!raw) return undefined;
  if (!shouldParseJson(raw, contentType)) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
};

const resolveResponseMode = (contentType?: string): LegacyRestResponseMode => {
  if (!contentType) return 'text';
  const normalized = contentType.toLowerCase();
  if (normalized.includes('json')) return 'json';
  if (normalized.startsWith('text/')) return 'text';
  if (normalized.includes('xml')) return 'text';
  if (normalized.includes('javascript')) return 'text';
  return 'binary';
};

export async function requestLegacyRest(request: LegacyRestRequest): Promise<LegacyRestResponse> {
  const beforeMeta = ensureObservabilityMeta();
  const target = buildLegacyRestUrl(request.path, request.query);
  const headers: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
  };
  let body: string | undefined;
  const hasBody =
    request.method !== 'GET' && request.method !== 'OPTIONS' && Boolean(request.body?.trim());
  if (hasBody) {
    headers['Content-Type'] = resolveContentTypeHeader(request.contentType);
    body = request.body?.trim() ?? '';
  }
  const response = await httpFetch(target, {
    method: request.method,
    headers,
    body,
  });
  const contentType = response.headers.get('content-type') ?? undefined;
  const mode = resolveResponseMode(contentType);
  let raw = '';
  let json: unknown | undefined;
  let binarySize: number | undefined;
  if (mode === 'binary') {
    const buffer = await response.arrayBuffer();
    binarySize = buffer.byteLength;
  } else {
    raw = await response.text();
    json = parseMaybeJson(raw, contentType);
  }
  const resolvedMode: LegacyRestResponseMode = json ? 'json' : mode;
  const afterMeta = getObservabilityMeta();

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    raw,
    json,
    mode: resolvedMode,
    binarySize,
    contentType,
    headers: normalizeHeaders(response.headers),
    runId: afterMeta.runId ?? beforeMeta.runId,
    traceId: afterMeta.traceId ?? beforeMeta.traceId,
  };
}

export const __legacyRestTestUtils = {
  parseMaybeJson,
  shouldParseJson,
  resolveResponseMode,
};
