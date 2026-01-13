import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta } from '../../libs/observability/observability';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument, readXmlText } from '../../libs/xml/xmlUtils';

export type IncomeInfoEntry = {
  performDate?: string;
  performEndDate?: string;
  inOut?: string;
  invoiceNumber?: string;
  departmentName?: string;
  insuranceCombinationNumber?: string;
  oeMoney?: number;
};

export type IncomeInfoResponse = {
  ok: boolean;
  status: number;
  rawXml: string;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  entries: IncomeInfoEntry[];
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

const ORCA_INCOME_INFO_PATH = '/api01rv2/incomeinfv2';

const parseOrcaNumber = (value?: string) => {
  if (!value) return undefined;
  const cleaned = value.replace(/\s+/g, '');
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const buildIncomeInfoRequestXml = (params: { patientId: string; performMonth?: string; performYear?: string }) => {
  return [
    '<data>',
    '  <private_objects>',
    `    <Patient_ID>${params.patientId}</Patient_ID>`,
    `    <Perform_Month>${params.performMonth ?? ''}</Perform_Month>`,
    `    <Perform_Year>${params.performYear ?? ''}</Perform_Year>`,
    '  </private_objects>',
    '</data>',
  ].join('\n');
};

const parseIncomeEntries = (doc: Document | null): IncomeInfoEntry[] => {
  if (!doc) return [];
  return Array.from(doc.querySelectorAll('Income_Information_child')).map((node) => ({
    performDate: readXmlText(node, 'Perform_Date'),
    performEndDate: readXmlText(node, 'Perform_End_Date'),
    inOut: readXmlText(node, 'InOut'),
    invoiceNumber: readXmlText(node, 'Invoice_Number'),
    departmentName: readXmlText(node, 'Department_Name'),
    insuranceCombinationNumber: readXmlText(node, 'Insurance_Combination_Number'),
    oeMoney: parseOrcaNumber(readXmlText(node, 'Cd_Information > Oe_Money')),
  }));
};

export async function fetchOrcaIncomeInfoXml(requestXml: string): Promise<IncomeInfoResponse> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(ORCA_INCOME_INFO_PATH, {
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
    entries: parseIncomeEntries(doc),
    missingTags: requiredCheck.missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
