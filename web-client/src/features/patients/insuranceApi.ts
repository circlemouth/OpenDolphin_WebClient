import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument, readXmlText } from '../../libs/xml/xmlUtils';

export type HealthInsuranceEntry = {
  providerClass?: string;
  providerName?: string;
  providerId?: string;
};

export type PublicInsuranceEntry = {
  publicClass?: string;
  publicName?: string;
  publicId?: string;
};

export type InsuranceListResponse = {
  ok: boolean;
  status: number;
  apiResult?: string;
  apiResultMessage?: string;
  baseDate?: string;
  healthInsurances: HealthInsuranceEntry[];
  publicInsurances: PublicInsuranceEntry[];
  rawXml: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

const DEFAULT_REQUEST_NUMBER = '01';
const REQUIRED_TAGS = ['Api_Result', 'Api_Result_Message'];

const buildRequestXml = (baseDate: string, requestNumber?: string) => {
  return [
    '<data>',
    '  <insuranceinf1v2req type="record">',
    `    <Request_Number type="string">${requestNumber ?? DEFAULT_REQUEST_NUMBER}</Request_Number>`,
    `    <Base_Date type="string">${baseDate}</Base_Date>`,
    '  </insuranceinf1v2req>',
    '</data>',
  ].join('\n');
};

const parseHealthInsurances = (doc: Document | null): HealthInsuranceEntry[] => {
  if (!doc) return [];
  const nodes = Array.from(
    doc.querySelectorAll('HealthInsurance_Information, HealthInsurance_Information_child'),
  );
  return nodes
    .map((node) => ({
      providerClass: readXmlText(node, 'InsuranceProvider_Class'),
      providerName: readXmlText(node, 'InsuranceProvider_WholeName'),
      providerId: readXmlText(node, 'InsuranceProvider_Identification_Number'),
    }))
    .filter((entry) => entry.providerName || entry.providerId || entry.providerClass);
};

const parsePublicInsurances = (doc: Document | null): PublicInsuranceEntry[] => {
  if (!doc) return [];
  const nodes = Array.from(
    doc.querySelectorAll('PublicInsurance_Information, PublicInsurance_Information_child'),
  );
  return nodes
    .map((node) => ({
      publicClass: readXmlText(node, 'PublicInsurance_Class'),
      publicName: readXmlText(node, 'PublicInsurance_Name'),
      publicId: readXmlText(node, 'PublicInsurance_Identification_Number'),
    }))
    .filter((entry) => entry.publicName || entry.publicId || entry.publicClass);
};

export async function fetchInsuranceList(params: {
  baseDate: string;
  requestNumber?: string;
}): Promise<InsuranceListResponse> {
  const runId = getObservabilityMeta().runId;
  updateObservabilityMeta({ runId });
  const requestXml = buildRequestXml(params.baseDate, params.requestNumber);

  const response = await httpFetch('/api01rv2/insuranceinf1v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      Accept: 'application/xml',
    },
    body: requestXml,
  });

  const rawXml = await response.text();
  const { doc, error } = parseXmlDocument(rawXml);
  const meta = extractOrcaXmlMeta(doc);
  const requiredCheck = checkRequiredTags(doc, REQUIRED_TAGS);
  const baseDate = readXmlText(doc, 'Base_Date') ?? params.baseDate;

  return {
    ok: response.ok && !error,
    status: response.status,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    baseDate,
    healthInsurances: parseHealthInsurances(doc),
    publicInsurances: parsePublicInsurances(doc),
    rawXml,
    missingTags: requiredCheck.missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
