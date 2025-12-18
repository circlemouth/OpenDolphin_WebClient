import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';

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
  traceId?: string;
  fetchedAt?: string;
  source?: 'mock' | 'live';
  verifyAdminDelivery?: boolean;
  queue: OrcaQueueEntry[];
};

const ORCA_QUEUE_ENDPOINT = '/api/orca/queue';

const normalizeBooleanHeader = (value: string | null) => {
  if (value === null) return undefined;
  return value === 'enabled' || value === '1' || value === 'true';
};

const getString = (value: unknown) => (typeof value === 'string' ? value : undefined);
const getBoolean = (value: unknown) => (typeof value === 'boolean' ? value : undefined);

const normalizeQueue = (json: unknown, headers: Headers): OrcaQueueResponse => {
  const body = (json ?? {}) as Record<string, unknown>;
  const queue = Array.isArray((body as { queue?: unknown }).queue)
    ? (((body as { queue?: unknown }).queue as OrcaQueueEntry[]) ?? [])
    : [];

  const runId = getString(body.runId) ?? headers.get('x-run-id') ?? undefined;
  const traceId = headers.get('x-trace-id') ?? getObservabilityMeta().traceId;
  if (runId) updateObservabilityMeta({ runId });

  return {
    runId,
    traceId,
    fetchedAt: new Date().toISOString(),
    source:
      (getString(body.source) as 'mock' | 'live' | undefined) ??
      (headers.get('x-orca-queue-mode') === 'mock' ? 'mock' : 'live'),
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

