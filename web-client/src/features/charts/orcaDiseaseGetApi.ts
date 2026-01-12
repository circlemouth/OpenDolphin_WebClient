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

export const ORCA_DISEASEGETV2_PATH = '/api01rv2/diseasegetv2?class=01';

export const buildDiseaseGetRequestXml = (params: { patientId: string; baseDate?: string }) => {
  return [
    '<data>',
    '  <disease_inforeq type="record">',
    `    <Patient_ID type="string">${params.patientId}</Patient_ID>`,
    `    <Base_Date type="string">${params.baseDate ?? ''}</Base_Date>`,
    '  </disease_inforeq>',
    '</data>',
  ].join('\n');
};

export async function fetchOrcaDiseaseGetXml(requestXml: string): Promise<OrcaXmlResponse> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(ORCA_DISEASEGETV2_PATH, {
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
