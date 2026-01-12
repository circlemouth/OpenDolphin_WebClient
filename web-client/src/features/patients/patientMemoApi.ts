import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import { extractOrcaXmlMeta, parseXmlDocument, readXmlText } from '../../libs/xml/xmlUtils';

export type PatientMemoEntry = {
  departmentCode?: string;
  departmentName?: string;
  memo?: string;
  acceptanceDate?: string;
  acceptanceTime?: string;
};

export type PatientMemoResponse = {
  ok: boolean;
  status: number;
  apiResult?: string;
  apiResultMessage?: string;
  patientId?: string;
  baseDate?: string;
  memos: PatientMemoEntry[];
  rawXml: string;
  runId?: string;
  traceId?: string;
  error?: string;
};

export type PatientMemoUpdatePayload = {
  patientId: string;
  memo: string;
  performDate: string;
  memoClass?: string;
  departmentCode?: string;
  requestNumber?: string;
};

export type PatientMemoUpdateResult = {
  ok: boolean;
  status: number;
  apiResult?: string;
  apiResultMessage?: string;
  rawXml: string;
  runId?: string;
  traceId?: string;
  error?: string;
};

const DEFAULT_REQUEST_NUMBER = '01';

const buildRequestXml = (payload: {
  patientId: string;
  baseDate?: string;
  memoClass?: string;
  departmentCode?: string;
  requestNumber?: string;
}) => {
  return [
    '<data>',
    '  <patientlst7req type="record">',
    `    <Request_Number type="string">${payload.requestNumber ?? DEFAULT_REQUEST_NUMBER}</Request_Number>`,
    `    <Patient_ID type="string">${payload.patientId}</Patient_ID>`,
    `    <Base_Date type="string">${payload.baseDate ?? ''}</Base_Date>`,
    `    <Department_Code type="string">${payload.departmentCode ?? ''}</Department_Code>`,
    `    <Memo_Class type="string">${payload.memoClass ?? ''}</Memo_Class>`,
    '  </patientlst7req>',
    '</data>',
  ].join('\n');
};

const buildUpdateXml = (payload: PatientMemoUpdatePayload) => {
  return [
    '<data>',
    '  <patient_memomodreq type="record">',
    `    <Request_Number type="string">${payload.requestNumber ?? DEFAULT_REQUEST_NUMBER}</Request_Number>`,
    `    <Patient_ID type="string">${payload.patientId}</Patient_ID>`,
    `    <Perform_Date type="string">${payload.performDate}</Perform_Date>`,
    `    <Department_Code type="string">${payload.departmentCode ?? ''}</Department_Code>`,
    `    <Memo_Class type="string">${payload.memoClass ?? ''}</Memo_Class>`,
    `    <Patient_Memo type="string">${payload.memo}</Patient_Memo>`,
    '  </patient_memomodreq>',
    '</data>',
  ].join('\n');
};

const parsePatientMemoEntries = (doc: Document | null): PatientMemoEntry[] => {
  if (!doc) return [];
  const candidates = Array.from(
    doc.querySelectorAll('Patient_Memo_Information, Patient_Memo_Information_child'),
  ).filter((node) => node.querySelector('Patient_Memo'));

  return candidates.map((node) => ({
    departmentCode: readXmlText(node, 'Department_Code'),
    departmentName: readXmlText(node, 'Department_Name'),
    memo: readXmlText(node, 'Patient_Memo'),
    acceptanceDate: readXmlText(node, 'Acceptance_Date'),
    acceptanceTime: readXmlText(node, 'Acceptance_Time'),
  }));
};

export async function fetchPatientMemo(params: {
  patientId: string;
  baseDate?: string;
  memoClass?: string;
  departmentCode?: string;
  requestNumber?: string;
}): Promise<PatientMemoResponse> {
  const runId = getObservabilityMeta().runId;
  const requestXml = buildRequestXml(params);
  const response = await httpFetch('/api01rv2/patientlst7v2', {
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
  const patientId = readXmlText(doc, 'Patient_ID') ?? params.patientId;
  const baseDate = readXmlText(doc, 'Base_Date') ?? params.baseDate;
  const memos = parsePatientMemoEntries(doc);

  return {
    ok: response.ok && !error,
    status: response.status,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    patientId,
    baseDate,
    memos,
    rawXml,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}

export async function updatePatientMemo(payload: PatientMemoUpdatePayload): Promise<PatientMemoUpdateResult> {
  const runId = getObservabilityMeta().runId;
  updateObservabilityMeta({ runId });
  const requestXml = buildUpdateXml(payload);
  const response = await httpFetch('/orca06/patientmemomodv2', {
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
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    rawXml,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
