import { httpFetch } from '../../libs/http/httpClient';
import { ensureObservabilityMeta, getObservabilityMeta } from '../../libs/observability/observability';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

export type TouchAdmPhrMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
export type TouchAdmPhrContentType = 'json' | 'text' | 'form' | 'xml';

export type TouchAdmPhrContext = {
  facilityId?: string;
  userId?: string;
  patientId?: string;
  patientPk?: string;
  accessKey?: string;
};

export type TouchAdmPhrEndpoint = {
  id: string;
  group: 'touch' | 'adm10' | 'adm20' | 'phr' | 'demo';
  label: string;
  method: TouchAdmPhrMethod;
  description: string;
  buildPath: (context: TouchAdmPhrContext) => string;
  buildQuery?: (context: TouchAdmPhrContext) => string | undefined;
  buildBody?: (context: TouchAdmPhrContext) => string | undefined;
  defaultContentType?: TouchAdmPhrContentType;
  accept?: string;
  stub?: boolean;
  stubHint?: string;
};

const resolveFacilityId = (context: TouchAdmPhrContext) => context.facilityId?.trim() || '0001';
const resolveUserId = (context: TouchAdmPhrContext) => context.userId?.trim() || 'user';
const resolveCompositeUserId = (context: TouchAdmPhrContext) =>
  `${resolveFacilityId(context)}:${resolveUserId(context)}`;
const resolvePatientId = (context: TouchAdmPhrContext) => context.patientId?.trim() || '00002';
const resolvePatientPk = (context: TouchAdmPhrContext) => context.patientPk?.trim() || '1';
const resolveAccessKey = (context: TouchAdmPhrContext) => context.accessKey?.trim() || 'ACCESS-KEY';
const resolveTouchPassword = () => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('devPasswordMd5');
    if (stored?.trim()) return stored.trim();
  }
  return 'password';
};

const resolveTouchDeviceId = () => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('devClientUuid');
    if (stored?.trim()) return stored.trim();
  }
  return 'touch-adm-phr-device';
};

const DEFAULT_TOUCH_ACCESS_REASON = 'touch-adm-phr-connectivity';
const DEFAULT_TOUCH_CONSENT_TOKEN = 'touch-adm-phr-consent';

export const TOUCH_ADM_PHR_ENDPOINTS: readonly TouchAdmPhrEndpoint[] = [
  {
    id: 'touch-user',
    group: 'touch',
    label: '/touch/user/{userId,facilityId,password}',
    method: 'GET',
    description: 'Touch ユーザー取得。パラメータ不足は 4xx 想定。',
    buildPath: (context) =>
      `/touch/user/${resolveUserId(context)},${resolveFacilityId(context)},${resolveTouchPassword()}`,
    accept: 'application/json',
  },
  {
    id: 'touch-patient',
    group: 'touch',
    label: '/touch/patient/{pk}',
    method: 'GET',
    description: 'Touch 患者情報。pk は DB 主キー。',
    buildPath: (context) => `/touch/patient/${resolvePatientPk(context)}`,
    accept: 'application/json',
  },
  {
    id: 'touch-patient-package',
    group: 'touch',
    label: '/touch/patientPackage/{pk}',
    method: 'GET',
    description: 'Touch 患者パッケージ。pk は DB 主キー。',
    buildPath: (context) => `/touch/patientPackage/${resolvePatientPk(context)}`,
    accept: 'application/json',
  },
  {
    id: 'touch-patients-name',
    group: 'touch',
    label: '/touch/patients/name/{facilityId,keyword,offset,limit}',
    method: 'GET',
    description: 'Touch 患者検索。facilityId,キーワード,開始,件数。',
    buildPath: (context) => `/touch/patients/name/${resolveFacilityId(context)},テスト,0,10`,
    accept: 'application/json',
  },
  {
    id: 'touch-patient-visit',
    group: 'touch',
    label: '/touch/patient/visit?facility={facilityId}',
    method: 'GET',
    description: 'Touch 受付一覧（JSON）。',
    buildPath: () => '/touch/patient/visit',
    buildQuery: (context) => `facility=${resolveFacilityId(context)}&offset=0&limit=10&sort=pvtDate&order=desc`,
    accept: 'application/json',
  },
  {
    id: 'jtouch-patient-count',
    group: 'touch',
    label: '/jtouch/patients/count',
    method: 'GET',
    description: 'JsonTouch 患者件数。',
    buildPath: () => '/jtouch/patients/count',
    accept: 'text/plain',
  },
  {
    id: 'jtouch-patient-name',
    group: 'touch',
    label: '/jtouch/patients/name/{keyword,offset,limit}',
    method: 'GET',
    description: 'JsonTouch 患者検索（facilityId は認証から取得）。',
    buildPath: () => '/jtouch/patients/name/テスト,0,10',
    accept: 'application/json',
  },
  {
    id: 'jtouch-user',
    group: 'touch',
    label: '/jtouch/user/{uid}',
    method: 'GET',
    description: 'JsonTouch ユーザー情報。',
    buildPath: (context) => `/jtouch/user/${resolveCompositeUserId(context)}`,
    accept: 'application/json',
  },
  {
    id: 'touch-eht-serverinfo',
    group: 'touch',
    label: '/10/eht/serverinfo',
    method: 'GET',
    description: 'Touch EHT サーバー設定。',
    buildPath: () => '/10/eht/serverinfo',
    accept: 'application/octet-stream',
  },
  {
    id: 'adm10-jtouch-count',
    group: 'adm10',
    label: '/10/adm/jtouch/patients/count',
    method: 'GET',
    description: 'ADM10 JsonTouch 患者件数。',
    buildPath: () => '/10/adm/jtouch/patients/count',
    accept: 'text/plain',
  },
  {
    id: 'adm10-jtouch-patient-name',
    group: 'adm10',
    label: '/10/adm/jtouch/patients/name/{keyword,offset,limit}',
    method: 'GET',
    description: 'ADM10 JsonTouch 患者検索。',
    buildPath: () => '/10/adm/jtouch/patients/name/テスト,0,10',
    accept: 'application/json',
  },
  {
    id: 'adm20-jtouch-count',
    group: 'adm20',
    label: '/20/adm/jtouch/patients/count',
    method: 'GET',
    description: 'ADM20 JsonTouch 患者件数。',
    buildPath: () => '/20/adm/jtouch/patients/count',
    accept: 'text/plain',
  },
  {
    id: 'adm20-eht-serverinfo',
    group: 'adm20',
    label: '/20/adm/eht/serverinfo',
    method: 'GET',
    description: 'ADM20 EHT サーバー設定。',
    buildPath: () => '/20/adm/eht/serverinfo',
    accept: 'application/octet-stream',
  },
  {
    id: 'adm20-careplan',
    group: 'adm20',
    label: '/20/adm/carePlan/{pk}',
    method: 'GET',
    description: 'ADM20 入院ケアプラン。',
    buildPath: (context) => `/20/adm/carePlan/${resolvePatientPk(context)}`,
    accept: 'application/octet-stream',
  },
  {
    id: 'phr-access-key',
    group: 'phr',
    label: '/20/adm/phr/accessKey/{accessKey}',
    method: 'GET',
    description: 'PHR アクセスキー取得。',
    buildPath: (context) => `/20/adm/phr/accessKey/${resolveAccessKey(context)}`,
    accept: 'application/octet-stream',
  },
  {
    id: 'phr-patient-key',
    group: 'phr',
    label: '/20/adm/phr/patient/{patientId}',
    method: 'GET',
    description: 'PHR 患者キー取得。',
    buildPath: (context) => `/20/adm/phr/patient/${resolvePatientId(context)}`,
    accept: 'application/octet-stream',
  },
  {
    id: 'demo-user',
    group: 'demo',
    label: '/demo/user/{userId}',
    method: 'GET',
    description: 'Touch デモ系エンドポイント。',
    buildPath: (context) => `/demo/user/${resolveUserId(context)}`,
    accept: 'application/xml',
    stub: true,
    stubHint: 'demo固定',
  },
];

export type TouchAdmPhrRequest = {
  method: TouchAdmPhrMethod;
  path: string;
  query?: string;
  body?: string;
  contentType?: TouchAdmPhrContentType;
  accept?: string;
};

export type TouchAdmPhrResponseMode = 'json' | 'text' | 'binary';

export type TouchAdmPhrResponse = {
  ok: boolean;
  status: number;
  statusText?: string;
  raw: string;
  json?: unknown;
  mode: TouchAdmPhrResponseMode;
  binarySize?: number;
  contentType?: string;
  headers: Record<string, string>;
  runId?: string;
  traceId?: string;
};

export const buildTouchAdmPhrUrl = (path: string, query?: string) => {
  const normalizedPath = (() => {
    if (!API_BASE_URL) return path;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith(API_BASE_URL)) return path;
    if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
    return `${API_BASE_URL}/${path}`;
  })();
  if (!query) return normalizedPath;
  const trimmed = query.trim();
  if (!trimmed) return normalizedPath;
  if (normalizedPath.includes('?')) {
    return `${normalizedPath}&${trimmed}`;
  }
  return `${normalizedPath}?${trimmed}`;
};

const resolveContentTypeHeader = (contentType?: TouchAdmPhrContentType) => {
  switch (contentType) {
    case 'form':
      return 'application/x-www-form-urlencoded; charset=UTF-8';
    case 'text':
      return 'text/plain; charset=UTF-8';
    case 'xml':
      return 'application/xml; charset=UTF-8';
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

const resolveResponseMode = (contentType?: string): TouchAdmPhrResponseMode => {
  if (!contentType) return 'text';
  const normalized = contentType.toLowerCase();
  if (normalized.includes('json')) return 'json';
  if (normalized.startsWith('text/')) return 'text';
  if (normalized.includes('xml')) return 'text';
  if (normalized.includes('javascript')) return 'text';
  return 'binary';
};

export async function requestTouchAdmPhr(request: TouchAdmPhrRequest): Promise<TouchAdmPhrResponse> {
  const beforeMeta = ensureObservabilityMeta();
  const target = buildTouchAdmPhrUrl(request.path, request.query);
  const headers: Record<string, string> = {
    Accept: request.accept ?? 'application/json, text/plain, */*',
  };
  if (!headers['X-Access-Reason']) {
    headers['X-Access-Reason'] = DEFAULT_TOUCH_ACCESS_REASON;
  }
  if (!headers['X-Consent-Token']) {
    headers['X-Consent-Token'] = DEFAULT_TOUCH_CONSENT_TOKEN;
  }
  if (!headers['X-Device-Id']) {
    headers['X-Device-Id'] = resolveTouchDeviceId();
  }
  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentTypeHeader = resolveContentTypeHeader(request.contentType);
    headers['Content-Type'] = contentTypeHeader;
    body = request.body;
  }

  const response = await httpFetch(target, {
    method: request.method,
    headers,
    body,
  });

  const contentType = response.headers.get('content-type') ?? undefined;
  const mode = resolveResponseMode(contentType);
  let raw = '';
  let json: unknown;
  let binarySize: number | undefined;

  if (mode === 'binary') {
    const buffer = await response.arrayBuffer();
    binarySize = buffer.byteLength;
  } else {
    raw = await response.text();
    json = parseMaybeJson(raw, contentType);
  }

  const meta = getObservabilityMeta();
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    raw,
    json,
    mode,
    binarySize,
    contentType,
    headers: normalizeHeaders(response.headers),
    runId: meta.runId ?? beforeMeta.runId,
    traceId: meta.traceId ?? beforeMeta.traceId,
  };
}
