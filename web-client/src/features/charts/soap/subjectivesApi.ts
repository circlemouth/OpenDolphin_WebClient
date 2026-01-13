import { httpFetch } from '../../../libs/http/httpClient';
import { getObservabilityMeta } from '../../../libs/observability/observability';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument, readXmlText, readXmlTexts } from '../../../libs/xml/xmlUtils';

export type SubjectivesListItem = {
  inOut?: string;
  departmentCode?: string;
  departmentName?: string;
  insuranceCombinationNumber?: string;
  detailRecord?: string;
  detailRecordName?: string;
  subjectivesNumber?: string;
};

export type SubjectivesListResponse = {
  ok: boolean;
  status: number;
  rawXml: string;
  items: SubjectivesListItem[];
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

export type SubjectivesModResponse = {
  ok: boolean;
  status: number;
  rawXml: string;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  warningMessages: string[];
  subjectivesNumber?: string;
  detailRecord?: string;
  detailRecordName?: string;
  subjectivesCode?: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

const SUBJECTIVES_LIST_PATH = '/api01rv2/subjectiveslstv2';
const SUBJECTIVES_MOD_PATH = '/orca25/subjectivesv2';

export const buildSubjectivesListRequestXml = (params: {
  patientId: string;
  performMonth?: string;
  performDay?: string;
  inOut?: string;
  departmentCode?: string;
  insuranceCombinationNumber?: string;
  subjectivesDetailRecord?: string;
  subjectivesNumber?: string;
  requestNumber?: string;
}) => {
  return [
    '<data>',
    '  <subjectiveslstreq type="record">',
    `    <Request_Number type="string">${params.requestNumber ?? '01'}</Request_Number>`,
    `    <Patient_ID type="string">${params.patientId}</Patient_ID>`,
    `    <Perform_Date type="string">${params.performMonth ?? ''}</Perform_Date>`,
    `    <InOut type="string">${params.inOut ?? 'O'}</InOut>`,
    `    <Department_Code type="string">${params.departmentCode ?? ''}</Department_Code>`,
    `    <Insurance_Combination_Number type="string">${params.insuranceCombinationNumber ?? ''}</Insurance_Combination_Number>`,
    `    <Perform_Day type="string">${params.performDay ?? ''}</Perform_Day>`,
    `    <Subjectives_Detail_Record type="string">${params.subjectivesDetailRecord ?? ''}</Subjectives_Detail_Record>`,
    `    <Subjectives_Number type="string">${params.subjectivesNumber ?? ''}</Subjectives_Number>`,
    '  </subjectiveslstreq>',
    '</data>',
  ].join('\n');
};

export const buildSubjectivesModRequestXml = (params: {
  patientId: string;
  performDate?: string;
  inOut?: string;
  departmentCode?: string;
  insuranceCombinationNumber?: string;
  detailRecord?: string;
  subjectivesCode: string;
}) => {
  return [
    '<data>',
    '  <subjectivesmodreq type="record">',
    `    <InOut type="string">${params.inOut ?? 'O'}</InOut>`,
    `    <Patient_ID type="string">${params.patientId}</Patient_ID>`,
    `    <Perform_Date type="string">${params.performDate ?? ''}</Perform_Date>`,
    `    <Department_Code type="string">${params.departmentCode ?? ''}</Department_Code>`,
    `    <Insurance_Combination_Number type="string">${params.insuranceCombinationNumber ?? ''}</Insurance_Combination_Number>`,
    `    <Subjectives_Detail_Record type="string">${params.detailRecord ?? '07'}</Subjectives_Detail_Record>`,
    `    <Subjectives_Code type="string">${params.subjectivesCode}</Subjectives_Code>`,
    '  </subjectivesmodreq>',
    '</data>',
  ].join('\n');
};

const parseSubjectivesListItems = (doc: Document | null): SubjectivesListItem[] => {
  if (!doc) return [];
  return Array.from(doc.querySelectorAll('Subjectives_Information_child')).map((node) => ({
    inOut: readXmlText(node, 'InOut'),
    departmentCode: readXmlText(node, 'Department_Code'),
    departmentName: readXmlText(node, 'Department_Name'),
    insuranceCombinationNumber: readXmlText(node, 'Insurance_Combination_Number'),
    detailRecord: readXmlText(node, 'Subjectives_Detail_Record'),
    detailRecordName: readXmlText(node, 'Subjectives_Detail_Record_WholeName'),
    subjectivesNumber: readXmlText(node, 'Subjectives_Number'),
  }));
};

export async function fetchSubjectivesListXml(requestXml: string): Promise<SubjectivesListResponse> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(SUBJECTIVES_LIST_PATH, {
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
    items: parseSubjectivesListItems(doc),
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

export async function postSubjectivesModXml(requestXml: string, classCode = '01'): Promise<SubjectivesModResponse> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(`${SUBJECTIVES_MOD_PATH}?class=${encodeURIComponent(classCode)}`, {
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
    warningMessages: readXmlTexts(doc, 'Api_Warning_Message'),
    subjectivesNumber: readXmlText(doc, 'Subjectives_Number'),
    detailRecord: readXmlText(doc, 'Subjectives_Detail_Record'),
    detailRecordName: readXmlText(doc, 'Subjectives_Detail_Record_WholeName'),
    subjectivesCode: readXmlText(doc, 'Subjectives_Code'),
    missingTags: requiredCheck.missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
