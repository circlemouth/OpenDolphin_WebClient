import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta } from '../../libs/observability/observability';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument } from '../../libs/xml/xmlUtils';

export type OrcaXmlResponse = {
  ok: boolean;
  status: number;
  rawXml: string;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

export const ORCA_MEDICALMODV2_PATH = '/api21/medicalmodv2?class=01';
export const ORCA_MEDICALMODV23_PATH = '/api21/medicalmodv23';

export const buildMedicalModV23RequestXml = (params: {
  patientId: string;
  requestNumber?: string;
  firstCalculationDate?: string;
  lastVisitDate?: string;
  departmentCode?: string;
}) => {
  return [
    '<data>',
    '  <medicalv2req3 type="record">',
    `    <Request_Number type="string">${params.requestNumber ?? ''}</Request_Number>`,
    `    <Patient_ID type="string">${params.patientId}</Patient_ID>`,
    `    <First_Calculation_Date type="string">${params.firstCalculationDate ?? ''}</First_Calculation_Date>`,
    `    <LastVisit_Date type="string">${params.lastVisitDate ?? ''}</LastVisit_Date>`,
    `    <Department_Code type="string">${params.departmentCode ?? ''}</Department_Code>`,
    '  </medicalv2req3>',
    '</data>',
  ].join('\n');
};

export async function postOrcaMedicalModXml(requestXml: string): Promise<OrcaXmlResponse> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(ORCA_MEDICALMODV2_PATH, {
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
  const requiredCheck = checkRequiredTags(doc, ['Api_Result']);
  return {
    ok: response.ok && !error,
    status: response.status,
    rawXml,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    informationDate: meta.informationDate,
    informationTime: meta.informationTime,
    missingTags: requiredCheck.missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}

export async function postOrcaMedicalModV23Xml(requestXml: string): Promise<OrcaXmlResponse> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(ORCA_MEDICALMODV23_PATH, {
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
  const requiredCheck = checkRequiredTags(doc, ['Api_Result']);
  return {
    ok: response.ok && !error,
    status: response.status,
    rawXml,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    informationDate: meta.informationDate,
    informationTime: meta.informationTime,
    missingTags: requiredCheck.missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
