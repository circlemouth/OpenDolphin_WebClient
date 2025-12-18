import { httpFetch } from '../../libs/http/httpClient';
import { updateObservabilityMeta } from '../../libs/observability/observability';

export type ChartsMasterSourcePolicy = 'auto' | 'server' | 'mock' | 'snapshot' | 'fallback';

export type AdminConfigPayload = {
  orcaEndpoint: string;
  mswEnabled: boolean;
  useMockOrcaQueue: boolean;
  verifyAdminDelivery: boolean;
  chartsDisplayEnabled: boolean;
  chartsSendEnabled: boolean;
  chartsMasterSource: ChartsMasterSourcePolicy;
};

export type AdminConfigResponse = Partial<AdminConfigPayload> & {
  runId?: string;
  deliveryId?: string;
  deliveryVersion?: string;
  deliveredAt?: string;
  source?: 'mock' | 'live';
  verified?: boolean;
  note?: string;
};

export type EffectiveAdminConfigResponse = AdminConfigResponse & {
  rawConfig?: AdminConfigResponse;
  rawDelivery?: AdminConfigResponse;
  syncMismatch?: boolean;
  syncMismatchFields?: Array<keyof AdminConfigPayload>;
};

export type OrcaQueueEntry = {
  patientId: string;
  status: 'pending' | 'delivered' | 'failed' | string;
  retryable?: boolean;
  lastDispatchAt?: string;
  error?: string;
  headers?: string[];
};

export type OrcaQueueResponse = {
  runId?: string;
  source?: 'mock' | 'live';
  verifyAdminDelivery?: boolean;
  queue: OrcaQueueEntry[];
};

const ADMIN_CONFIG_ENDPOINT = '/api/admin/config';
const ADMIN_DELIVERY_ENDPOINT = '/api/admin/delivery';
const ORCA_QUEUE_ENDPOINT = '/api/orca/queue';

const normalizeBooleanHeader = (value: string | null) => {
  if (value === null) return undefined;
  return value === 'enabled' || value === '1' || value === 'true';
};

const getString = (value: unknown) => (typeof value === 'string' ? value : undefined);
const getBoolean = (value: unknown) => (typeof value === 'boolean' ? value : undefined);

const isChartsMasterSourcePolicy = (value: string): value is ChartsMasterSourcePolicy =>
  value === 'auto' || value === 'server' || value === 'mock' || value === 'snapshot' || value === 'fallback';

const getChartsMasterSourcePolicy = (value: unknown): ChartsMasterSourcePolicy | undefined => {
  const raw = getString(value);
  if (!raw) return undefined;
  return isChartsMasterSourcePolicy(raw) ? raw : undefined;
};

const normalizeConfig = (json: unknown, headers: Headers): AdminConfigResponse => {
  const body = (json ?? {}) as Record<string, unknown>;
  const runId = getString(body.runId) ?? headers.get('x-run-id') ?? undefined;
  const verifyHeader = headers.get('x-admin-delivery-verification');
  const queueMode = headers.get('x-orca-queue-mode');
  const verified = getBoolean(body.verified) ?? normalizeBooleanHeader(verifyHeader);
  const source = (getString(body.source) as 'mock' | 'live' | undefined) ?? (queueMode === 'mock' ? 'mock' : 'live');

  const charts = (body.charts ?? {}) as Record<string, unknown>;

  const payload: AdminConfigResponse = {
    orcaEndpoint: getString(body.orcaEndpoint) ?? getString(body.endpoint),
    mswEnabled: getBoolean(body.mswEnabled) ?? getBoolean(body.msw),
    useMockOrcaQueue: getBoolean(body.useMockOrcaQueue) ?? (queueMode === null ? undefined : queueMode === 'mock'),
    verifyAdminDelivery: getBoolean(body.verifyAdminDelivery) ?? normalizeBooleanHeader(verifyHeader),
    chartsDisplayEnabled: getBoolean(body.chartsDisplayEnabled) ?? getBoolean(charts.displayEnabled),
    chartsSendEnabled: getBoolean(body.chartsSendEnabled) ?? getBoolean(charts.sendEnabled),
    chartsMasterSource:
      getChartsMasterSourcePolicy(body.chartsMasterSource) ?? getChartsMasterSourcePolicy(charts.masterSource),
    deliveryId: getString(body.deliveryId),
    deliveryVersion: getString(body.deliveryVersion) ?? getString(body.etag) ?? getString(body.version),
    deliveredAt: getString(body.deliveredAt) ?? getString(body.updatedAt),
    note: getString(body.note),
    runId,
    source,
    verified,
  };

  if (runId) {
    updateObservabilityMeta({ runId });
  }
  return payload;
};

export async function fetchAdminConfig(): Promise<AdminConfigResponse> {
  const response = await httpFetch(ADMIN_CONFIG_ENDPOINT, { method: 'GET' });
  const json = await response.json().catch(() => ({}));
  return normalizeConfig(json, response.headers);
}

export async function saveAdminConfig(payload: AdminConfigPayload): Promise<AdminConfigResponse> {
  const response = await httpFetch(ADMIN_CONFIG_ENDPOINT, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => ({}));
  return normalizeConfig(json, response.headers);
}

export async function fetchAdminDelivery(): Promise<AdminConfigResponse> {
  const response = await httpFetch(ADMIN_DELIVERY_ENDPOINT, { method: 'GET' });
  const json = await response.json().catch(() => ({}));
  return normalizeConfig(json, response.headers);
}

const ADMIN_SYNC_FIELDS: Array<keyof AdminConfigPayload> = [
  'orcaEndpoint',
  'mswEnabled',
  'useMockOrcaQueue',
  'verifyAdminDelivery',
  'chartsDisplayEnabled',
  'chartsSendEnabled',
  'chartsMasterSource',
];

const detectSyncMismatch = (config: AdminConfigResponse, delivery: AdminConfigResponse) => {
  const mismatched: Array<keyof AdminConfigPayload> = [];
  for (const key of ADMIN_SYNC_FIELDS) {
    const a = config[key];
    const b = delivery[key];
    if (a === undefined || b === undefined) continue;
    if (a !== b) mismatched.push(key);
  }
  return mismatched;
};

export function mergeAdminConfigResponses(
  config: AdminConfigResponse,
  delivery: AdminConfigResponse,
): EffectiveAdminConfigResponse {
  const syncMismatchFields = detectSyncMismatch(config, delivery);
  return {
    ...config,
    ...delivery,
    orcaEndpoint: delivery.orcaEndpoint || config.orcaEndpoint,
    mswEnabled: delivery.mswEnabled ?? config.mswEnabled,
    useMockOrcaQueue: delivery.useMockOrcaQueue ?? config.useMockOrcaQueue,
    verifyAdminDelivery: delivery.verifyAdminDelivery ?? config.verifyAdminDelivery,
    chartsDisplayEnabled: delivery.chartsDisplayEnabled ?? config.chartsDisplayEnabled,
    chartsSendEnabled: delivery.chartsSendEnabled ?? config.chartsSendEnabled,
    chartsMasterSource: delivery.chartsMasterSource ?? config.chartsMasterSource,
    rawConfig: config,
    rawDelivery: delivery,
    syncMismatch: syncMismatchFields.length > 0 ? true : false,
    syncMismatchFields,
  };
}

export async function fetchEffectiveAdminConfig(): Promise<EffectiveAdminConfigResponse> {
  const [config, delivery] = await Promise.all([fetchAdminConfig(), fetchAdminDelivery().catch(() => null)]);
  if (!delivery) return config;
  return mergeAdminConfigResponses(config, delivery);
}

const normalizeQueue = (json: unknown, headers: Headers): OrcaQueueResponse => {
  const body = (json ?? {}) as Record<string, unknown>;
  const queue = Array.isArray((body as { queue?: unknown }).queue)
    ? (((body as { queue?: unknown }).queue as OrcaQueueEntry[]) ?? [])
    : [];
  const runId = getString(body.runId) ?? headers.get('x-run-id') ?? undefined;
  if (runId) updateObservabilityMeta({ runId });
  return {
    runId,
    source: (getString(body.source) as 'mock' | 'live' | undefined) ?? (headers.get('x-orca-queue-mode') === 'mock' ? 'mock' : 'live'),
    verifyAdminDelivery:
      normalizeBooleanHeader(headers.get('x-admin-delivery-verification')) ?? getBoolean(body.verifyAdminDelivery),
    queue,
  };
};

export async function fetchOrcaQueue(patientId?: string): Promise<OrcaQueueResponse> {
  const endpoint = patientId ? `${ORCA_QUEUE_ENDPOINT}?patientId=${encodeURIComponent(patientId)}` : ORCA_QUEUE_ENDPOINT;
  const response = await httpFetch(endpoint, { method: 'GET' });
  const json = await response.json().catch(() => ({}));
  return normalizeQueue(json, response.headers);
}

export async function retryOrcaQueue(patientId: string): Promise<OrcaQueueResponse> {
  const endpoint = `${ORCA_QUEUE_ENDPOINT}?patientId=${encodeURIComponent(patientId)}&retry=1`;
  const response = await httpFetch(endpoint, { method: 'GET' });
  const json = await response.json().catch(() => ({}));
  return normalizeQueue(json, response.headers);
}

export async function discardOrcaQueue(patientId: string): Promise<OrcaQueueResponse> {
  const endpoint = `${ORCA_QUEUE_ENDPOINT}?patientId=${encodeURIComponent(patientId)}`;
  const response = await httpFetch(endpoint, { method: 'DELETE' });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    // DELETE 未対応環境では 404/405 が返る可能性があるため、GET で再取得してフォールバックする。
    return fetchOrcaQueue();
  }
  return normalizeQueue(json, response.headers);
}
