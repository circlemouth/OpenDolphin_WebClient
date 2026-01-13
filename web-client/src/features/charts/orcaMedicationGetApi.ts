import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta } from '../../libs/observability/observability';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument, readXmlText } from '../../libs/xml/xmlUtils';

export type MedicationGetInfo = {
  medicationCode?: string;
  medicationName?: string;
  medicationNameKana?: string;
  startDate?: string;
  endDate?: string;
  requestCode?: string;
};

export type MedicationGetSelection = {
  commentCode?: string;
  commentName?: string;
  category?: string;
  itemNumber?: string;
  itemNumberBranch?: string;
};

export type MedicationGetResponse = {
  ok: boolean;
  status: number;
  rawXml: string;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  medication?: MedicationGetInfo;
  selections: MedicationGetSelection[];
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

const ORCA_MEDICATION_GET_PATH = '/api01rv2/medicationgetv2';

export const buildMedicationGetRequestXml = (params: {
  requestNumber?: string;
  requestCode: string;
  baseDate?: string;
}) => {
  return [
    '<data>',
    '  <medicationgetreq type="record">',
    `    <Request_Number type="string">${params.requestNumber ?? '02'}</Request_Number>`,
    `    <Request_Code type="string">${params.requestCode}</Request_Code>`,
    `    <Base_Date type="string">${params.baseDate ?? ''}</Base_Date>`,
    '  </medicationgetreq>',
    '</data>',
  ].join('\n');
};

const parseMedicationInfo = (doc: Document | null): MedicationGetInfo | undefined => {
  if (!doc) return undefined;
  const medicationCode = readXmlText(doc, 'Medication_Code');
  const medicationName = readXmlText(doc, 'Medication_Name');
  if (!medicationCode && !medicationName) return undefined;
  return {
    medicationCode,
    medicationName,
    medicationNameKana: readXmlText(doc, 'Medication_Name_inKana'),
    startDate: readXmlText(doc, 'StartDate'),
    endDate: readXmlText(doc, 'EndDate'),
    requestCode: readXmlText(doc, 'Request_Code'),
  };
};

const parseSelections = (doc: Document | null): MedicationGetSelection[] => {
  if (!doc) return [];
  return Array.from(doc.querySelectorAll('Selection_Expression_Information_child')).map((node) => ({
    commentCode: readXmlText(node, 'Comment_Code'),
    commentName: readXmlText(node, 'Comment_Name'),
    category: readXmlText(node, 'Category'),
    itemNumber: readXmlText(node, 'Item_Number'),
    itemNumberBranch: readXmlText(node, 'Item_Number_Branch'),
  }));
};

export async function fetchOrcaMedicationGetXml(requestXml: string): Promise<MedicationGetResponse> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(ORCA_MEDICATION_GET_PATH, {
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
    medication: parseMedicationInfo(doc),
    selections: parseSelections(doc),
    missingTags: requiredCheck.missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
