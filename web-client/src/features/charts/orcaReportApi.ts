import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta } from '../../libs/observability/observability';

export type OrcaReportType =
  | 'prescription'
  | 'medicinenotebook'
  | 'karteno1'
  | 'karteno3'
  | 'invoicereceipt'
  | 'statement';

export const ORCA_REPORT_LABELS: Record<OrcaReportType, string> = {
  prescription: '処方箋',
  medicinenotebook: 'お薬手帳',
  karteno1: 'カルテ1号紙（外来）',
  karteno3: 'カルテ3号紙（外来）',
  invoicereceipt: '請求書兼領収書',
  statement: '診療費明細書',
};

const ORCA_REPORT_ENDPOINTS: Record<OrcaReportType, string> = {
  prescription: '/api01rv2/prescriptionv2',
  medicinenotebook: '/api01rv2/medicinenotebookv2',
  karteno1: '/api01rv2/karteno1v2',
  karteno3: '/api01rv2/karteno3v2',
  invoicereceipt: '/api01rv2/invoicereceiptv2',
  statement: '/api01rv2/statementv2',
};

export type OrcaReportRequestParams = {
  patientId: string;
  invoiceNumber?: string;
  outsideClass?: string;
  orderClass?: string;
  departmentCode?: string;
  insuranceCombinationNumber?: string;
  performMonth?: string;
  startDay?: string;
  lastPageNumber?: string;
  lastRowNumber?: string;
};

export type OrcaReportResponse = {
  ok: boolean;
  status: number;
  rawBody: string;
  apiResult?: string;
  apiResultMessage?: string;
  informationDate?: string;
  informationTime?: string;
  dataId?: string;
  formId?: string;
  formName?: string;
  runId?: string;
  traceId?: string;
  error?: string;
};

export type OrcaReportPdfResult = {
  ok: boolean;
  status: number;
  pdfBlob?: Blob;
  runId?: string;
  traceId?: string;
  dataId?: string;
  error?: string;
};

export function buildOrcaReportRequestXml(type: OrcaReportType, params: OrcaReportRequestParams): string {
  const base = ['<data>'];
  const end = ['</data>'];
  const requestNumber = '01';
  const patientId = params.patientId;

  switch (type) {
    case 'prescription':
      return [
        ...base,
        '  <prescriptionv2req type="record">',
        `    <Request_Number type="string">${requestNumber}</Request_Number>`,
        `    <Patient_ID type="string">${patientId}</Patient_ID>`,
        `    <Invoice_Number type="string">${params.invoiceNumber ?? ''}</Invoice_Number>`,
        `    <Outside_Class type="string">${params.outsideClass ?? 'False'}</Outside_Class>`,
        '  </prescriptionv2req>',
        ...end,
      ].join('\n');
    case 'medicinenotebook':
      return [
        ...base,
        '  <medicine_notebookv2req type="record">',
        `    <Request_Number type="string">${requestNumber}</Request_Number>`,
        `    <Patient_ID type="string">${patientId}</Patient_ID>`,
        `    <Invoice_Number type="string">${params.invoiceNumber ?? ''}</Invoice_Number>`,
        `    <Outside_Class type="string">${params.outsideClass ?? 'False'}</Outside_Class>`,
        '  </medicine_notebookv2req>',
        ...end,
      ].join('\n');
    case 'karteno1':
      return [
        ...base,
        '  <karte_no1v2req type="record">',
        `    <Request_Number type="string">${requestNumber}</Request_Number>`,
        `    <Order_Class type="string">${params.orderClass ?? '1'}</Order_Class>`,
        `    <Patient_ID type="string">${patientId}</Patient_ID>`,
        `    <Department_Code type="string">${params.departmentCode ?? ''}</Department_Code>`,
        `    <Insurance_Combination_Number type="string">${params.insuranceCombinationNumber ?? ''}</Insurance_Combination_Number>`,
        '  </karte_no1v2req>',
        ...end,
      ].join('\n');
    case 'karteno3':
      return [
        ...base,
        '  <karte_no3v2req type="record">',
        `    <Request_Number type="string">${requestNumber}</Request_Number>`,
        `    <Order_Class type="string">${params.orderClass ?? '1'}</Order_Class>`,
        `    <Patient_ID type="string">${patientId}</Patient_ID>`,
        `    <Perform_Month type="string">${params.performMonth ?? ''}</Perform_Month>`,
        `    <Department_Code type="string">${params.departmentCode ?? ''}</Department_Code>`,
        `    <Insurance_Combination_Number type="string">${params.insuranceCombinationNumber ?? ''}</Insurance_Combination_Number>`,
        `    <Start_Day type="string">${params.startDay ?? ''}</Start_Day>`,
        `    <Last_Page_Number type="string">${params.lastPageNumber ?? ''}</Last_Page_Number>`,
        `    <Last_Row_Number type="string">${params.lastRowNumber ?? ''}</Last_Row_Number>`,
        '  </karte_no3v2req>',
        ...end,
      ].join('\n');
    case 'invoicereceipt':
      return [
        ...base,
        '  <invoice_receiptv2req type="record">',
        `    <Request_Number type="string">${requestNumber}</Request_Number>`,
        `    <Patient_ID type="string">${patientId}</Patient_ID>`,
        `    <Invoice_Number type="string">${params.invoiceNumber ?? ''}</Invoice_Number>`,
        '  </invoice_receiptv2req>',
        ...end,
      ].join('\n');
    case 'statement':
      return [
        ...base,
        '  <statementv2req type="record">',
        `    <Request_Number type="string">${requestNumber}</Request_Number>`,
        `    <Patient_ID type="string">${patientId}</Patient_ID>`,
        `    <Invoice_Number type="string">${params.invoiceNumber ?? ''}</Invoice_Number>`,
        '  </statementv2req>',
        ...end,
      ].join('\n');
  }
}

type JsonValue = Record<string, unknown> | unknown[] | null;

const findJsonValue = (value: JsonValue, key: string): unknown => {
  if (!value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJsonValue(item as JsonValue, key);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (key in value) return (value as Record<string, unknown>)[key];
  for (const entry of Object.values(value)) {
    const found = findJsonValue(entry as JsonValue, key);
    if (found !== undefined) return found;
  }
  return undefined;
};

const readString = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value : undefined);

export async function postOrcaReportXml(type: OrcaReportType, requestXml: string): Promise<OrcaReportResponse> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(ORCA_REPORT_ENDPOINTS[type], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      Accept: 'application/json',
    },
    body: requestXml,
  });
  const rawBody = await response.text();
  let json: JsonValue = null;
  let parseError: string | undefined;
  try {
    json = JSON.parse(rawBody) as JsonValue;
  } catch (error) {
    parseError = error instanceof Error ? error.message : 'JSON parse failed';
  }

  const apiResult = readString(findJsonValue(json, 'Api_Result'));
  const apiResultMessage = readString(findJsonValue(json, 'Api_Result_Message'));
  const informationDate = readString(findJsonValue(json, 'Information_Date'));
  const informationTime = readString(findJsonValue(json, 'Information_Time'));
  const dataId = readString(findJsonValue(json, 'Data_Id'));
  const formId = readString(findJsonValue(json, 'Form_ID'));
  const formName = readString(findJsonValue(json, 'Form_Name'));

  return {
    ok: response.ok && !parseError,
    status: response.status,
    rawBody,
    apiResult,
    apiResultMessage,
    informationDate,
    informationTime,
    dataId,
    formId,
    formName,
    runId: getObservabilityMeta().runId ?? runId,
    traceId: getObservabilityMeta().traceId,
    error: parseError,
  };
}

const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

const isPdfBytes = (bytes: Uint8Array) => {
  if (bytes.length < PDF_SIGNATURE.length) return false;
  for (let i = 0; i < PDF_SIGNATURE.length; i += 1) {
    if (bytes[i] !== PDF_SIGNATURE[i]) return false;
  }
  return true;
};

const readUint32 = (view: DataView, offset: number) => view.getUint32(offset, true);
const readUint16 = (view: DataView, offset: number) => view.getUint16(offset, true);

const extractPdfFromZip = async (buffer: ArrayBuffer): Promise<Uint8Array> => {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  const textDecoder = new TextDecoder('utf-8');

  while (offset + 30 <= bytes.length) {
    const signature = readUint32(view, offset);
    if (signature !== 0x04034b50) {
      break;
    }
    const flags = readUint16(view, offset + 6);
    const compression = readUint16(view, offset + 8);
    const compressedSize = readUint32(view, offset + 18);
    const fileNameLength = readUint16(view, offset + 26);
    const extraLength = readUint16(view, offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    const extraStart = nameEnd + extraLength;
    const dataStart = extraStart;
    const dataEnd = dataStart + compressedSize;
    if (nameEnd > bytes.length || dataEnd > bytes.length) {
      break;
    }
    const fileName = textDecoder.decode(bytes.slice(nameStart, nameEnd));
    if (fileName.toLowerCase().endsWith('.pdf')) {
      if (compression === 0) {
        return bytes.slice(dataStart, dataEnd);
      }
      if (compression === 8) {
        if (!('DecompressionStream' in globalThis)) {
          throw new Error('zip 解凍に対応していない環境のため PDF を表示できません。');
        }
        if ((flags & 0x08) !== 0) {
          throw new Error('ZIP のサイズ情報が不足しているため PDF を展開できません。');
        }
        const stream = new Blob([bytes.slice(dataStart, dataEnd)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        const decompressed = new Uint8Array(await new Response(stream).arrayBuffer());
        return decompressed;
      }
    }
    offset = dataEnd;
  }
  throw new Error('PDF を含む blob を解析できませんでした。');
};

export async function fetchOrcaReportPdf(dataId: string): Promise<OrcaReportPdfResult> {
  const runId = getObservabilityMeta().runId;
  const response = await httpFetch(`/blobapi/${dataId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/octet-stream',
    },
  });
  const buffer = await response.arrayBuffer();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      runId: getObservabilityMeta().runId ?? runId,
      traceId: getObservabilityMeta().traceId,
      dataId,
      error: `blobapi failed (HTTP ${response.status})`,
    };
  }
  const bytes = new Uint8Array(buffer);
  try {
    const pdfBytes = isPdfBytes(bytes) ? bytes : await extractPdfFromZip(buffer);
    const pdfBuffer = pdfBytes.byteLength ? pdfBytes.slice().buffer : new ArrayBuffer(0);
    return {
      ok: true,
      status: response.status,
      pdfBlob: new Blob([pdfBuffer], {
        type: 'application/pdf',
      }),
      runId: getObservabilityMeta().runId ?? runId,
      traceId: getObservabilityMeta().traceId,
      dataId,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'blobapi PDF extract failed';
    return {
      ok: false,
      status: response.status,
      runId: getObservabilityMeta().runId ?? runId,
      traceId: getObservabilityMeta().traceId,
      dataId,
      error: detail,
    };
  }
}

export const resolveOrcaReportEndpoint = (type: OrcaReportType) => ORCA_REPORT_ENDPOINTS[type];
