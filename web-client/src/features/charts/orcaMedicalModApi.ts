import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta } from '../../libs/observability/observability';
import { extractOrcaXmlMeta, parseXmlDocument } from '../../libs/xml/xmlUtils';

export type OrcaXmlResponse = {
  ok: boolean;
  status: number;
  rawXml: string;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  runId?: string;
  traceId?: string;
  error?: string;
};

export const ORCA_MEDICALMODV2_PATH = '/api21/medicalmodv2?class=01';

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
  return {
    ok: response.ok && !error,
    status: response.status,
    rawXml,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    informationDate: meta.informationDate,
    informationTime: meta.informationTime,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
