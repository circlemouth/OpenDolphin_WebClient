import { httpFetch } from '../../libs/http/httpClient';
import { ensureObservabilityMeta, getObservabilityMeta } from '../../libs/observability/observability';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument } from '../../libs/xml/xmlUtils';

export type OrcaXmlProxyEndpoint = 'acceptlstv2' | 'system01lstv2' | 'manageusersv2' | 'insprogetv2';

export type OrcaXmlProxyResponse = {
  ok: boolean;
  status: number;
  endpoint: OrcaXmlProxyEndpoint;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  rawXml: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

type OrcaXmlProxyEndpointConfig = {
  path: string;
  supportsClass: boolean;
};

const ORCA_XML_PROXY_ENDPOINTS: Record<OrcaXmlProxyEndpoint, OrcaXmlProxyEndpointConfig> = {
  acceptlstv2: {
    path: '/api/api01rv2/acceptlstv2',
    supportsClass: true,
  },
  system01lstv2: {
    path: '/api/api01rv2/system01lstv2',
    supportsClass: true,
  },
  manageusersv2: {
    path: '/api/orca101/manageusersv2',
    supportsClass: false,
  },
  insprogetv2: {
    path: '/api/api01rv2/insprogetv2',
    supportsClass: false,
  },
};

const REQUIRED_ORCA_TAGS = ['Api_Result'];

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

export const buildAcceptListRequestXml = (params?: { acceptanceDate?: string; acceptanceTime?: string }) => {
  const now = new Date();
  const acceptanceDate = params?.acceptanceDate ?? formatDate(now);
  const acceptanceTime = params?.acceptanceTime ?? formatTime(now);
  return [
    '<data>',
    '  <acceptlstv2req type="record">',
    `    <Acceptance_Date type="string">${acceptanceDate}</Acceptance_Date>`,
    `    <Acceptance_Time type="string">${acceptanceTime}</Acceptance_Time>`,
    '  </acceptlstv2req>',
    '</data>',
  ].join('\n');
};

export const buildSystemListRequestXml = (classCode?: string) => {
  const requestNumber = classCode?.trim() ? classCode.trim() : '02';
  return [
    '<data>',
    '  <system01lstv2req type="record">',
    `    <Request_Number type="string">${requestNumber}</Request_Number>`,
    '  </system01lstv2req>',
    '</data>',
  ].join('\n');
};

export const buildManageUsersRequestXml = (requestNumber?: string) => {
  const request = requestNumber?.trim() ? requestNumber.trim() : '01';
  return [
    '<data>',
    '  <manageusersreq type="record">',
    `    <Request_Number type="string">${request}</Request_Number>`,
    '  </manageusersreq>',
    '</data>',
  ].join('\n');
};

export const buildInsuranceProviderRequestXml = () => {
  return ['<data>', '  <insprogetreq type="record">', '  </insprogetreq>', '</data>'].join('\n');
};

export async function postOrcaXmlProxy(params: {
  endpoint: OrcaXmlProxyEndpoint;
  xml: string;
  classCode?: string;
}): Promise<OrcaXmlProxyResponse> {
  const { endpoint, xml, classCode } = params;
  const beforeMeta = ensureObservabilityMeta();
  const config = ORCA_XML_PROXY_ENDPOINTS[endpoint];
  const query = new URLSearchParams();
  if (config.supportsClass && classCode?.trim()) {
    query.set('class', classCode.trim());
  }
  const target = query.toString() ? `${config.path}?${query.toString()}` : config.path;
  const response = await httpFetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      Accept: 'application/xml; charset=UTF-8',
    },
    body: xml?.trim() ? xml : '',
  });
  const rawXml = await response.text();
  const { doc, error } = parseXmlDocument(rawXml);
  const meta = extractOrcaXmlMeta(doc);
  const requiredCheck = checkRequiredTags(doc, REQUIRED_ORCA_TAGS);
  const afterMeta = getObservabilityMeta();
  const missingTags = error ? [] : requiredCheck.missingTags;
  const errorParts: string[] = [];
  if (error) {
    errorParts.push(error);
  }
  if (!response.ok) {
    errorParts.push(`HTTP ${response.status}`);
  }
  const errorMessage = errorParts.length ? errorParts.join(' / ') : undefined;

  return {
    ok: response.ok && !error,
    status: response.status,
    endpoint,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    informationDate: meta.informationDate,
    informationTime: meta.informationTime,
    rawXml,
    missingTags,
    runId: afterMeta.runId ?? beforeMeta.runId,
    traceId: afterMeta.traceId ?? beforeMeta.traceId,
    error: errorMessage,
  };
}
