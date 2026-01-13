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

export type OrcaPushEvent = {
  eventId?: string;
  event?: string;
  user?: string;
  timestamp?: string;
  patientId?: string;
  payload?: Record<string, unknown>;
  raw?: Record<string, unknown>;
};

export type OrcaPushEventMeta = {
  total?: number;
  kept?: number;
  deduped?: number;
  newlyAdded?: number;
};

export type OrcaPushEventResponse = {
  ok?: boolean;
  runId?: string;
  traceId?: string;
  fetchedAt?: string;
  apiResult?: string;
  apiResultMessage?: string;
  eventName?: string;
  events: OrcaPushEvent[];
  meta?: OrcaPushEventMeta;
  missingTags?: string[];
  status?: number;
  warning?: string;
  error?: string;
};

const ORCA_QUEUE_ENDPOINT = '/api/orca/queue';
const ORCA_PUSH_EVENT_ENDPOINT = '/api01rv2/pusheventgetv2';

const normalizeBooleanHeader = (value: string | null) => {
  if (value === null) return undefined;
  return value === 'enabled' || value === '1' || value === 'true';
};

const getString = (value: unknown) => (typeof value === 'string' ? value : undefined);
const getBoolean = (value: unknown) => (typeof value === 'boolean' ? value : undefined);
const getNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);
const parseNumberHeader = (value: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const buildOrcaPushEventRequestXml = (params?: {
  requestNumber?: string;
  baseDate?: string;
  event?: string;
  user?: string;
  startTime?: string;
  endTime?: string;
}) => {
  const requestNumber = params?.requestNumber ?? '01';
  const baseDate = params?.baseDate ?? formatLocalDate(new Date());
  const fragments = [
    '<data>',
    '  <pusheventgetv2req type="record">',
    `    <Request_Number type="string">${requestNumber}</Request_Number>`,
    `    <Base_Date type="string">${baseDate}</Base_Date>`,
  ];
  if (params?.event) fragments.push(`    <Event type="string">${params.event}</Event>`);
  if (params?.user) fragments.push(`    <User type="string">${params.user}</User>`);
  if (params?.startTime) fragments.push(`    <Start_Time type="string">${params.startTime}</Start_Time>`);
  if (params?.endTime) fragments.push(`    <End_Time type="string">${params.endTime}</End_Time>`);
  fragments.push('  </pusheventgetv2req>', '</data>');
  return fragments.join('\n');
};

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

const resolvePushEventPayload = (json: unknown): Record<string, unknown> => {
  const body = asRecord(json) ?? {};
  const xmlio2 = asRecord(body.xmlio2);
  const xmlio2Res = xmlio2 ? asRecord(xmlio2.pusheventgetv2res) : undefined;
  return (
    asRecord(body.pusheventgetv2res) ??
    xmlio2Res ??
    body
  );
};

const buildPushEventKey = (event: OrcaPushEvent) => {
  if (event.eventId) return `id:${event.eventId}`;
  const fallback = [event.event ?? 'event', event.timestamp ?? 'time', event.patientId ?? 'patient'].join('|');
  return `fallback:${fallback}`;
};

const normalizePushEvents = (value: unknown): OrcaPushEvent[] => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const normalized: OrcaPushEvent[] = [];
  for (const item of list) {
    const record = asRecord(item) ?? {};
    const data = asRecord(record.data) ?? record;
    const payload = asRecord(data.body) ?? asRecord(data.payload) ?? asRecord(data.Payload);
    const patientInfo = asRecord(payload?.Patient_Information);
    const event: OrcaPushEvent = {
      eventId: getString(data.uuid ?? data.id ?? data.eventId ?? data.Event_Id ?? data.Event_ID ?? record.uuid ?? record.id),
      event: getString(data.event ?? data.Event ?? data.eventName ?? record.event ?? record.Event),
      user: getString(data.user ?? data.User ?? record.user),
      timestamp: getString(data.time ?? data.timestamp ?? data.Timestamp ?? record.timestamp),
      patientId: getString(
        data.patientId ??
          data.patient_id ??
          data.Patient_ID ??
          payload?.Patient_ID ??
          payload?.patient_id ??
          patientInfo?.Patient_ID ??
          patientInfo?.patient_id,
      ),
      payload,
      raw: record,
    };
    const key = buildPushEventKey(event);
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(event);
  }
  return normalized;
};

const normalizePushEventResponse = (json: unknown, headers: Headers, status: number): OrcaPushEventResponse => {
  const body = asRecord(json) ?? {};
  const payload = resolvePushEventPayload(json);
  const eventsValue =
    Array.isArray(payload.Event_Information) ? payload.Event_Information :
    Array.isArray(payload.event_information) ? payload.event_information :
    Array.isArray(payload.events) ? payload.events :
    Array.isArray(payload.EventInformation) ? payload.EventInformation :
    Array.isArray(json) ? json :
    [];
  const events = normalizePushEvents(eventsValue);
  const runId = headers.get('x-run-id') ?? getObservabilityMeta().runId;
  const traceId = headers.get('x-trace-id') ?? getObservabilityMeta().traceId;
  const apiResult = getString(payload.Api_Result ?? payload.apiResult);
  const apiResultMessage = getString(payload.Api_Result_Message ?? payload.apiResultMessage);
  const eventName = getString(payload.event ?? payload.Event);
  const missingTags = [
    apiResult ? undefined : 'Api_Result',
    apiResultMessage ? undefined : 'Api_Result_Message',
  ].filter((value): value is string => typeof value === 'string');
  if (runId) updateObservabilityMeta({ runId });

  return {
    runId,
    traceId,
    fetchedAt: new Date().toISOString(),
    apiResult,
    apiResultMessage,
    eventName,
    events,
    meta: {
      total: parseNumberHeader(headers.get('x-orca-pushevent-total')) ?? getNumber(payload.total),
      kept: parseNumberHeader(headers.get('x-orca-pushevent-kept')) ?? getNumber(payload.kept),
      deduped: parseNumberHeader(headers.get('x-orca-pushevent-deduped')) ?? getNumber(payload.deduped),
      newlyAdded: parseNumberHeader(headers.get('x-orca-pushevent-new')) ?? getNumber(payload.new),
    },
    missingTags: missingTags.length > 0 ? missingTags : undefined,
    status,
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

export async function fetchOrcaPushEvents(params?: {
  requestNumber?: string;
  baseDate?: string;
  event?: string;
  user?: string;
  startTime?: string;
  endTime?: string;
}): Promise<OrcaPushEventResponse> {
  const requestXml = buildOrcaPushEventRequestXml(params);
  const response = await httpFetch(ORCA_PUSH_EVENT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      Accept: 'application/json',
    },
    body: requestXml,
  });
  const json = await response.json().catch(() => ({}));
  const normalized = normalizePushEventResponse(json, response.headers, response.status);
  const error = response.ok ? undefined : `HTTP ${response.status}`;
  const warning =
    !normalized.apiResult || !normalized.apiResultMessage
      ? `missing: ${(normalized.missingTags ?? []).join(', ') || 'Api_Result/Api_Result_Message'}`
      : undefined;
  return {
    ...normalized,
    ok: response.ok,
    error,
    warning,
  };
}
