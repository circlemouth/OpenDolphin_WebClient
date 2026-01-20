import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta } from '../../libs/observability/observability';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument, readXmlText } from '../../libs/xml/xmlUtils';

export type OrcaClaimSendResult = {
  ok: boolean;
  status: number;
  rawXml: string;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  invoiceNumber?: string;
  dataId?: string;
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

export const ORCA_MEDICALMODV2_PATH = '/api21/medicalmodv2';

export const buildMedicalModV2RequestXml = (params: {
  patientId: string;
  performDate: string;
  departmentCode: string;
  requestNumber?: string;
  medicalUid?: string;
}) => {
  const performDate = params.performDate.length >= 10 ? params.performDate.slice(0, 10) : params.performDate;
  return [
    '<data>',
    '  <medicalreq type="record">',
    `    <Request_Number type="string">${params.requestNumber ?? '01'}</Request_Number>`,
    '    <InOut type="string">O</InOut>',
    `    <Patient_ID type="string">${params.patientId}</Patient_ID>`,
    `    <Perform_Date type="string">${performDate}</Perform_Date>`,
    `    <Perform_Time type="string">${params.performDate.slice(11, 19) || '00:00:00'}</Perform_Time>`,
    params.medicalUid ? `    <Medical_Uid type="string">${params.medicalUid}</Medical_Uid>` : undefined,
    '    <Diagnosis_Information type="record">',
    `      <Department_Code type="string">${params.departmentCode}</Department_Code>`,
    '      <Medical_Information type="array">',
    '        <Medical_Class_Information type="record">',
    '          <Medical_Class type="string">11</Medical_Class>',
    '          <Medical_Class_Name type="string">基本診療料</Medical_Class_Name>',
    '          <Medical_Class_Number type="string">1</Medical_Class_Number>',
    '          <Medication_Info type="array">',
    '            <Medication_Info type="record">',
    '              <Medication_Code type="string">110000010</Medication_Code>',
    '              <Medication_Name type="string">初診料</Medication_Name>',
    '              <Medication_Number type="string">1</Medication_Number>',
    '            </Medication_Info>',
    '          </Medication_Info>',
    '        </Medical_Class_Information>',
    '      </Medical_Information>',
    '    </Diagnosis_Information>',
    '  </medicalreq>',
    '</data>',
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');
};

export async function postOrcaMedicalModV2Xml(
  requestXml: string,
  options: { classCode?: string } = {},
): Promise<OrcaClaimSendResult> {
  const runId = getObservabilityMeta().runId;
  const url = options.classCode ? `${ORCA_MEDICALMODV2_PATH}?class=${options.classCode}` : `${ORCA_MEDICALMODV2_PATH}?class=01`;
  const response = await httpFetch(url, {
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
  const invoiceNumber = readXmlText(doc, 'Invoice_Number');
  const dataId = readXmlText(doc, 'Data_Id') ?? readXmlText(doc, 'DataID') ?? readXmlText(doc, 'Data_ID');
  const requiredCheck = checkRequiredTags(doc, ['Api_Result', 'Invoice_Number', 'Data_Id']);
  return {
    ok: response.ok && !error,
    status: response.status,
    rawXml,
    apiResult: meta.apiResult,
    apiResultMessage: meta.apiResultMessage,
    informationDate: meta.informationDate,
    informationTime: meta.informationTime,
    invoiceNumber,
    dataId,
    missingTags: requiredCheck.missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
