import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta } from '../../libs/observability/observability';
import { checkRequiredTags, extractOrcaXmlMeta, parseXmlDocument, readXmlText } from '../../libs/xml/xmlUtils';

export type ContraindicationMedication = {
  medicationCode: string;
  medicationName?: string;
};

export type ContraindicationInfo = {
  contraCode?: string;
  contraName?: string;
  interactCode?: string;
  administerDate?: string;
  contextClass?: string;
};

export type ContraindicationResult = {
  medicationCode?: string;
  medicationName?: string;
  medicalResult?: string;
  medicalResultMessage?: string;
  warnings: ContraindicationInfo[];
};

export type ContraindicationCheckResponse = {
  ok: boolean;
  status: number;
  rawXml: string;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  results: ContraindicationResult[];
  symptomInfo: { code?: string; content?: string; detail?: string }[];
  missingTags?: string[];
  runId?: string;
  traceId?: string;
  error?: string;
};

const ORCA_CONTRAINDICATION_PATH = '/api01rv2/contraindicationcheckv2';

export const buildContraindicationCheckRequestXml = (params: {
  patientId: string;
  performMonth: string;
  checkTerm?: string;
  medications: ContraindicationMedication[];
  requestNumber?: string;
}) => {
  const medicationNodes = params.medications
    .map(
      (med) => [
        '      <Medical_Information_child type="record">',
        `        <Medication_Code type="string">${med.medicationCode}</Medication_Code>`,
        `        <Medication_Name type="string">${med.medicationName ?? ''}</Medication_Name>`,
        '      </Medical_Information_child>',
      ].join('\n'),
    )
    .join('\n');

  return [
    '<data>',
    '  <contraindication_checkreq type="record">',
    `    <Request_Number type="string">${params.requestNumber ?? '01'}</Request_Number>`,
    `    <Patient_ID type="string">${params.patientId}</Patient_ID>`,
    `    <Perform_Month type="string">${params.performMonth}</Perform_Month>`,
    `    <Check_Term type="string">${params.checkTerm ?? '1'}</Check_Term>`,
    '    <Medical_Information type="array">',
    medicationNodes,
    '    </Medical_Information>',
    '  </contraindication_checkreq>',
    '</data>',
  ].join('\n');
};

const parseContraindicationResults = (doc: Document | null): ContraindicationResult[] => {
  if (!doc) return [];
  return Array.from(doc.querySelectorAll('Medical_Information_child')).map((node) => ({
    medicationCode: readXmlText(node, 'Medication_Code'),
    medicationName: readXmlText(node, 'Medication_Name'),
    medicalResult: readXmlText(node, 'Medical_Result'),
    medicalResultMessage: readXmlText(node, 'Medical_Result_Message'),
    warnings: Array.from(node.querySelectorAll('Medical_Info_child')).map((infoNode) => ({
      contraCode: readXmlText(infoNode, 'Contra_Code'),
      contraName: readXmlText(infoNode, 'Contra_Name'),
      interactCode: readXmlText(infoNode, 'Interact_Code'),
      administerDate: readXmlText(infoNode, 'Administer_Date'),
      contextClass: readXmlText(infoNode, 'Context_Class'),
    })),
  }));
};

const parseSymptomInfo = (doc: Document | null) => {
  if (!doc) return [];
  return Array.from(doc.querySelectorAll('Symptom_Information_child')).map((node) => ({
    code: readXmlText(node, 'Symptom_Code'),
    content: readXmlText(node, 'Symptom_Content'),
    detail: readXmlText(node, 'Symptom_Detail'),
  }));
};

export async function fetchContraindicationCheckXml(requestXml: string): Promise<ContraindicationCheckResponse> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(ORCA_CONTRAINDICATION_PATH, {
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
    results: parseContraindicationResults(doc),
    symptomInfo: parseSymptomInfo(doc),
    missingTags: requiredCheck.missingTags,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error,
  };
}
