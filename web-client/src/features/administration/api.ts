import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import {
  checkRequiredTags,
  extractOrcaXmlMeta,
  parseXmlDocument,
  readXmlText,
  readXmlTexts,
} from '../../libs/xml/xmlUtils';
export type { OrcaQueueEntry, OrcaQueueResponse } from '../outpatient/orcaQueueApi';
export { discardOrcaQueue, fetchOrcaQueue, retryOrcaQueue } from '../outpatient/orcaQueueApi';

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
  status?: number;
  runId?: string;
  deliveryId?: string;
  deliveryVersion?: string;
  deliveryEtag?: string;
  deliveredAt?: string;
  source?: 'mock' | 'live';
  verified?: boolean;
  note?: string;
  environment?: string;
  deliveryMode?: string;
};

export type EffectiveAdminConfigResponse = AdminConfigResponse & {
  rawConfig?: AdminConfigResponse;
  rawDelivery?: AdminConfigResponse;
  syncMismatch?: boolean;
  syncMismatchFields?: Array<keyof AdminConfigPayload>;
};

const ADMIN_CONFIG_ENDPOINT = '/api/admin/config';
const ADMIN_DELIVERY_ENDPOINT = '/api/admin/delivery';
const ORCA_MASTER_LAST_UPDATE_ENDPOINT = '/api/orca51/masterlastupdatev3';
const ORCA_MEDICATION_MOD_ENDPOINT = '/api/orca102/medicatonmodv2';
const ORCA_SYSTEM_INFO_ENDPOINT = '/api/api01rv2/systeminfv2';
const ORCA_SYSTEM_DAILY_ENDPOINT = '/api/api01rv2/system01dailyv2';
const ORCA_MEDICAL_SET_ENDPOINT = '/api/orca21/medicalsetv2';

const REQUIRED_ORCA_TAGS = ['Api_Result', 'Api_Result_Message'];
let adminEndpointUnavailable = false;

const buildAdminUnavailableResponse = (status = 404): AdminConfigResponse => ({
  status,
  note: 'admin endpoint unavailable',
  chartsDisplayEnabled: true,
  chartsSendEnabled: true,
  chartsMasterSource: 'auto',
});

const normalizeBooleanHeader = (value: string | null) => {
  if (value === null) return undefined;
  return value === 'enabled' || value === '1' || value === 'true';
};

const normalizeHeaderValue = (value: string | null) => (typeof value === 'string' ? value.trim() : undefined);
const getString = (value: unknown) => (typeof value === 'string' ? value : undefined);
const getBoolean = (value: unknown) => (typeof value === 'boolean' ? value : undefined);
const resolveClientEnvironment = () => {
  const meta = import.meta.env as Record<string, string | undefined>;
  return meta.VITE_ENVIRONMENT ?? meta.VITE_DEPLOY_ENV ?? (import.meta.env.MODE === 'development' ? 'dev' : meta.MODE);
};

// 優先順位: header > body > client env (import.meta.env)
const normalizeEnvironment = (body: Record<string, unknown>, headers: Headers) => {
  const header =
    headers.get('x-environment') ??
    headers.get('x-env') ??
    headers.get('x-stage') ??
    headers.get('x-runtime-env') ??
    undefined;
  const bodyValue = getString(body.environment) ?? getString(body.env) ?? getString(body.stage);
  const clientValue = resolveClientEnvironment();
  return header ?? bodyValue ?? clientValue;
};
const normalizeDeliveryMode = (body: Record<string, unknown>, headers: Headers) => {
  const header = headers.get('x-delivery-mode') ?? headers.get('x-admin-delivery-mode') ?? undefined;
  return getString(body.deliveryMode) ?? getString(body.deliveryState) ?? getString(body.deliveryStatus) ?? header;
};

const isChartsMasterSourcePolicy = (value: string): value is ChartsMasterSourcePolicy =>
  value === 'auto' || value === 'server' || value === 'mock' || value === 'snapshot' || value === 'fallback';

const getChartsMasterSourcePolicy = (value: unknown): ChartsMasterSourcePolicy | undefined => {
  const raw = getString(value);
  if (!raw) return undefined;
  return isChartsMasterSourcePolicy(raw) ? raw : undefined;
};

const normalizeConfig = (json: unknown, headers: Headers, status?: number): AdminConfigResponse => {
  const body = (json ?? {}) as Record<string, unknown>;
  const runId = getString(body.runId) ?? headers.get('x-run-id') ?? undefined;
  const verifyHeader = headers.get('x-admin-delivery-verification');
  const queueMode = headers.get('x-orca-queue-mode');
  const headerEtag = normalizeHeaderValue(headers.get('etag') ?? headers.get('x-etag') ?? headers.get('x-delivery-etag'));
  const deliveryEtag = getString(body.etag) ?? headerEtag;
  const deliveryVersion = getString(body.deliveryVersion) ?? getString(body.version) ?? deliveryEtag;
  const verified = getBoolean(body.verified) ?? normalizeBooleanHeader(verifyHeader);
  const source = (getString(body.source) as 'mock' | 'live' | undefined) ?? (queueMode === 'mock' ? 'mock' : 'live');
  const environment = normalizeEnvironment(body, headers);
  const deliveryMode = normalizeDeliveryMode(body, headers);

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
    deliveryVersion,
    deliveryEtag,
    deliveredAt: getString(body.deliveredAt) ?? getString(body.updatedAt),
    status,
    note: getString(body.note),
    runId,
    source,
    verified,
    environment,
    deliveryMode,
  };

  if (runId) {
    updateObservabilityMeta({ runId });
  }
  return payload;
};

export async function fetchAdminConfig(): Promise<AdminConfigResponse> {
  if (adminEndpointUnavailable) return buildAdminUnavailableResponse();
  const response = await httpFetch(ADMIN_CONFIG_ENDPOINT, { method: 'GET', notifySessionExpired: false });
  const json = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    return buildAdminUnavailableResponse(response.status);
  }
  if (response.status === 404) {
    adminEndpointUnavailable = true;
    return buildAdminUnavailableResponse(response.status);
  }
  return normalizeConfig(json, response.headers, response.status);
}

export async function saveAdminConfig(payload: AdminConfigPayload): Promise<AdminConfigResponse> {
  const response = await httpFetch(ADMIN_CONFIG_ENDPOINT, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    notifySessionExpired: false,
  });
  const json = await response.json().catch(() => ({}));
  return normalizeConfig(json, response.headers, response.status);
}

export async function fetchAdminDelivery(): Promise<AdminConfigResponse> {
  if (adminEndpointUnavailable) return buildAdminUnavailableResponse();
  const response = await httpFetch(ADMIN_DELIVERY_ENDPOINT, { method: 'GET', notifySessionExpired: false });
  const json = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    return buildAdminUnavailableResponse(response.status);
  }
  if (response.status === 404) {
    adminEndpointUnavailable = true;
    return buildAdminUnavailableResponse(response.status);
  }
  return normalizeConfig(json, response.headers, response.status);
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
    status: delivery.status ?? config.status,
    orcaEndpoint: delivery.orcaEndpoint || config.orcaEndpoint,
    mswEnabled: delivery.mswEnabled ?? config.mswEnabled,
    useMockOrcaQueue: delivery.useMockOrcaQueue ?? config.useMockOrcaQueue,
    verifyAdminDelivery: delivery.verifyAdminDelivery ?? config.verifyAdminDelivery,
    chartsDisplayEnabled: delivery.chartsDisplayEnabled ?? config.chartsDisplayEnabled,
    chartsSendEnabled: delivery.chartsSendEnabled ?? config.chartsSendEnabled,
    chartsMasterSource: delivery.chartsMasterSource ?? config.chartsMasterSource,
    environment: delivery.environment ?? config.environment,
    deliveryMode: delivery.deliveryMode ?? config.deliveryMode,
    deliveryVersion: delivery.deliveryVersion ?? config.deliveryVersion,
    deliveryEtag: delivery.deliveryEtag ?? config.deliveryEtag,
    rawConfig: config,
    rawDelivery: delivery,
    syncMismatch: syncMismatchFields.length > 0 ? true : false,
    syncMismatchFields,
  };
}

export async function fetchEffectiveAdminConfig(): Promise<EffectiveAdminConfigResponse> {
  const config = await fetchAdminConfig();
  if (adminEndpointUnavailable) return config;
  const delivery = await fetchAdminDelivery().catch(() => null);
  if (!delivery) return config;
  return mergeAdminConfigResponses(config, delivery);
}

export type MasterVersionEntry = {
  name?: string;
  localVersion?: string;
  newVersion?: string;
};

export type MasterLastUpdateResponse = {
  ok: boolean;
  status: number;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  lastUpdateDate?: string;
  versions: MasterVersionEntry[];
  rawXml: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

export type MedicationModResponse = {
  ok: boolean;
  status: number;
  apiResult?: string;
  apiResultMessage?: string;
  rawXml: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

export type SystemInfoResponse = {
  ok: boolean;
  status: number;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  jmaReceiptVersion?: string;
  databaseLocalVersion?: string;
  databaseNewVersion?: string;
  lastUpdateDate?: string;
  versions: MasterVersionEntry[];
  rawXml: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

export type SystemDailyResponse = {
  ok: boolean;
  status: number;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  baseDate?: string;
  rawXml: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

export type MedicalSetEntry = {
  setCode?: string;
  setName?: string;
  startDate?: string;
  endDate?: string;
  inOut?: string;
  medicationSummary?: string;
};

export type MedicalSetResponse = {
  ok: boolean;
  status: number;
  apiResult?: string;
  apiResultMessage?: string;
  baseDate?: string;
  entries: MedicalSetEntry[];
  rawXml: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

export type MedicalSetSearchPayload = {
  baseDate: string;
  setCode?: string;
  setName?: string;
  startDate?: string;
  endDate?: string;
  inOut?: string;
  requestNumber?: string;
};

export type MedicationModPayload = {
  classCode: string;
  xml: string;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const ensureRunId = () => {
  const current = getObservabilityMeta().runId;
  const runId = current ?? generateRunId();
  if (!current) updateObservabilityMeta({ runId });
  return runId;
};

const parseXmlPayload = async (response: Response) => {
  const rawXml = await response.text();
  const { doc, error } = parseXmlDocument(rawXml);
  const meta = extractOrcaXmlMeta(doc);
  const requiredCheck = checkRequiredTags(doc, REQUIRED_ORCA_TAGS);
  return { doc, rawXml, error, meta, missingTags: requiredCheck.missingTags };
};

const parseMasterVersions = (doc: Document | null): MasterVersionEntry[] => {
  if (!doc) return [];
  const nodes = Array.from(
    doc.querySelectorAll('Master_Version_Information, Master_Version_Information_child'),
  );
  return nodes
    .map((node) => ({
      name: readXmlText(node, 'Name'),
      localVersion: readXmlText(node, 'Local_Version'),
      newVersion: readXmlText(node, 'New_Version'),
    }))
    .filter((entry) => entry.name || entry.localVersion || entry.newVersion);
};

const buildEmptyRequestXml = () => '<data></data>';

const buildSystemInfoRequestXml = () => {
  const now = new Date();
  return [
    '<data>',
    '  <private_objects>',
    `    <Request_Date>${formatDate(now)}</Request_Date>`,
    `    <Request_Time>${formatTime(now)}</Request_Time>`,
    '  </private_objects>',
    '</data>',
  ].join('\n');
};

const buildSystemDailyRequestXml = (baseDate: string, requestNumber?: string) => {
  const safeBaseDate = escapeXml(baseDate);
  const request = escapeXml(requestNumber ?? '01');
  return [
    '<data>',
    '  <system01_dailyreq type="record">',
    `    <Request_Number type="string">${request}</Request_Number>`,
    `    <Base_Date type="string">${safeBaseDate}</Base_Date>`,
    '  </system01_dailyreq>',
    '</data>',
  ].join('\n');
};

const buildMedicalSetRequestXml = (payload: MedicalSetSearchPayload) => {
  return [
    '<data>',
    '  <medicalsetreq>',
    `    <Request_Number>${escapeXml(payload.requestNumber ?? '01')}</Request_Number>`,
    `    <Base_Date>${escapeXml(payload.baseDate)}</Base_Date>`,
    `    <Set_Code>${escapeXml(payload.setCode ?? '')}</Set_Code>`,
    `    <Set_Code_Name>${escapeXml(payload.setName ?? '')}</Set_Code_Name>`,
    `    <Start_Date>${escapeXml(payload.startDate ?? '')}</Start_Date>`,
    `    <Ende_Date>${escapeXml(payload.endDate ?? '')}</Ende_Date>`,
    `    <InOut>${escapeXml(payload.inOut ?? '')}</InOut>`,
    '  </medicalsetreq>',
    '</data>',
  ].join('\n');
};

const parseMedicalSetEntries = (doc: Document | null): MedicalSetEntry[] => {
  if (!doc) return [];
  const nodes = Array.from(
    doc.querySelectorAll(
      'Medical_Set_Information, Medical_Set_Information_child, Medical_Set_Info, Medical_Set_Info_child',
    ),
  );
  const entries = nodes.map((node) => {
    const medicationNames = readXmlTexts(node, 'Medication_Name');
    const medicationCodes = readXmlTexts(node, 'Medication_Code');
    const medicationSummary = medicationNames.length
      ? medicationNames.join(' / ')
      : medicationCodes.length
        ? medicationCodes.join(' / ')
        : undefined;
    return {
      setCode: readXmlText(node, 'Set_Code') ?? readXmlText(node, 'Medical_Set_Code'),
      setName: readXmlText(node, 'Set_Code_Name') ?? readXmlText(node, 'Set_Name'),
      startDate: readXmlText(node, 'Start_Date'),
      endDate: readXmlText(node, 'Ende_Date') ?? readXmlText(node, 'End_Date'),
      inOut: readXmlText(node, 'InOut'),
      medicationSummary,
    };
  });
  return entries.filter((entry) => entry.setCode || entry.setName || entry.medicationSummary);
};

export async function fetchMasterLastUpdate(): Promise<MasterLastUpdateResponse> {
  const runId = ensureRunId();
  const response = await httpFetch(ORCA_MASTER_LAST_UPDATE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      Accept: 'application/xml',
    },
    body: buildEmptyRequestXml(),
  });
  const { doc, rawXml, error, meta, missingTags } = await parseXmlPayload(response);
  const versions = parseMasterVersions(doc);
  return {
    ok: response.ok && !error,
    status: response.status,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    informationDate: readXmlText(doc, 'Information_Date'),
    informationTime: readXmlText(doc, 'Information_Time'),
    lastUpdateDate: readXmlText(doc, 'Last_Update_Date') ?? readXmlText(doc, 'Master_Update_Date'),
    versions,
    rawXml,
    missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}

export async function syncMedicationMod(payload: MedicationModPayload): Promise<MedicationModResponse> {
  const runId = ensureRunId();
  const params = new URLSearchParams();
  if (payload.classCode) params.set('class', payload.classCode);
  const query = params.toString();
  const response = await httpFetch(`${ORCA_MEDICATION_MOD_ENDPOINT}${query ? `?${query}` : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      Accept: 'application/xml',
    },
    body: payload.xml?.trim() ? payload.xml : buildEmptyRequestXml(),
  });
  const { rawXml, error, meta, missingTags } = await parseXmlPayload(response);
  return {
    ok: response.ok && !error,
    status: response.status,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    rawXml,
    missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}

export async function fetchSystemInfo(): Promise<SystemInfoResponse> {
  const runId = ensureRunId();
  const response = await httpFetch(ORCA_SYSTEM_INFO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      Accept: 'application/xml',
    },
    body: buildSystemInfoRequestXml(),
  });
  const { doc, rawXml, error, meta, missingTags } = await parseXmlPayload(response);
  const versions = parseMasterVersions(doc);
  return {
    ok: response.ok && !error,
    status: response.status,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    informationDate: readXmlText(doc, 'Information_Date'),
    informationTime: readXmlText(doc, 'Information_Time'),
    jmaReceiptVersion: readXmlText(doc, 'Jma_Receipt_Version'),
    databaseLocalVersion: readXmlText(doc, 'Database_Information Local_Version'),
    databaseNewVersion: readXmlText(doc, 'Database_Information New_Version'),
    lastUpdateDate: readXmlText(doc, 'Master_Update_Information Last_Update_Date') ?? readXmlText(doc, 'Last_Update_Date'),
    versions,
    rawXml,
    missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}

export async function fetchSystemDaily(baseDate: string, requestNumber?: string): Promise<SystemDailyResponse> {
  const runId = ensureRunId();
  const response = await httpFetch(ORCA_SYSTEM_DAILY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      Accept: 'application/xml',
    },
    body: buildSystemDailyRequestXml(baseDate, requestNumber),
  });
  const { doc, rawXml, error, meta, missingTags } = await parseXmlPayload(response);
  return {
    ok: response.ok && !error,
    status: response.status,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    informationDate: readXmlText(doc, 'Information_Date'),
    informationTime: readXmlText(doc, 'Information_Time'),
    baseDate: readXmlText(doc, 'Base_Date') ?? baseDate,
    rawXml,
    missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}

export async function fetchMedicalSet(payload: MedicalSetSearchPayload): Promise<MedicalSetResponse> {
  const runId = ensureRunId();
  const response = await httpFetch(ORCA_MEDICAL_SET_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      Accept: 'application/xml',
    },
    body: buildMedicalSetRequestXml(payload),
  });
  const { doc, rawXml, error, meta, missingTags } = await parseXmlPayload(response);
  return {
    ok: response.ok && !error,
    status: response.status,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    baseDate: readXmlText(doc, 'Base_Date') ?? payload.baseDate,
    entries: parseMedicalSetEntries(doc),
    rawXml,
    missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
