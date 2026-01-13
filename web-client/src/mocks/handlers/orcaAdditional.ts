import { http, HttpResponse } from 'msw';

import { applyFaultDelay, parseFaultSpec } from '../utils/faultInjection';

const ISO_DATE = '20260113';
const ISO_TIME = '220000';

const buildReportBody = (label: string, dataId: string) => ({
  report: {
    Api_Result: '0000',
    Api_Result_Message: 'OK',
    Information_Date: ISO_DATE,
    Information_Time: ISO_TIME,
    Data_Id: dataId,
    Form_ID: `FORM-${dataId}`,
    Form_Name: label,
  },
});

const reportLabels: Record<string, string> = {
  prescriptionv2: 'Prescription',
  medicinenotebookv2: 'MedicineNotebook',
  karteno1v2: 'KarteNo1',
  karteno3v2: 'KarteNo3',
  invoicereceiptv2: 'InvoiceReceipt',
  statementv2: 'Statement',
};

const respondXml = (xml: string, status = 200) =>
  HttpResponse.text(xml, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
    },
  });

const buildIncomeInfoXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <incomeinfores type="record">
    <Api_Result type="string">00</Api_Result>
    <Api_Result_Message type="string">OK</Api_Result_Message>
    <Information_Date type="string">${ISO_DATE}</Information_Date>
    <Information_Time type="string">${ISO_TIME}</Information_Time>
    <Income_Information type="array">
      <Income_Information_child type="record">
        <Perform_Date type="string">2026-01-10</Perform_Date>
        <Perform_End_Date type="string">2026-01-10</Perform_End_Date>
        <InOut type="string">O</InOut>
        <Invoice_Number type="string">INV-001</Invoice_Number>
        <Department_Name type="string">Internal</Department_Name>
        <Insurance_Combination_Number type="string">0001</Insurance_Combination_Number>
        <Cd_Information type="record">
          <Ac_Money type="string">100</Ac_Money>
          <Ic_Money type="string">50</Ic_Money>
          <Ai_Money type="string">25</Ai_Money>
          <Oe_Money type="string">0</Oe_Money>
          <Ml_Smoney type="string">0</Ml_Smoney>
        </Cd_Information>
      </Income_Information_child>
    </Income_Information>
  </incomeinfores>
</data>
`;

const buildSubjectivesListXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <subjectiveslstres type="record">
    <Api_Result type="string">00</Api_Result>
    <Api_Result_Message type="string">OK</Api_Result_Message>
    <Information_Date type="string">${ISO_DATE}</Information_Date>
    <Information_Time type="string">${ISO_TIME}</Information_Time>
    <Subjectives_Information type="array">
      <Subjectives_Information_child type="record">
        <InOut type="string">O</InOut>
        <Department_Code type="string">01</Department_Code>
        <Department_Name type="string">Internal</Department_Name>
        <Insurance_Combination_Number type="string">0001</Insurance_Combination_Number>
        <Subjectives_Detail_Record type="string">07</Subjectives_Detail_Record>
        <Subjectives_Detail_Record_WholeName type="string">Sample Detail</Subjectives_Detail_Record_WholeName>
        <Subjectives_Number type="string">1</Subjectives_Number>
      </Subjectives_Information_child>
    </Subjectives_Information>
  </subjectiveslstres>
</data>
`;

const buildSubjectivesModXml = (warning = false) => `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <subjectivesmodres type="record">
    <Api_Result type="string">${warning ? 'E10' : '00'}</Api_Result>
    <Api_Result_Message type="string">${warning ? 'warning' : 'OK'}</Api_Result_Message>
    <Information_Date type="string">${ISO_DATE}</Information_Date>
    <Information_Time type="string">${ISO_TIME}</Information_Time>
    ${warning ? '<Api_Warning_Message>Check content</Api_Warning_Message>' : ''}
    <Subjectives_Number type="string">1</Subjectives_Number>
    <Subjectives_Detail_Record type="string">07</Subjectives_Detail_Record>
    <Subjectives_Detail_Record_WholeName type="string">Sample Detail</Subjectives_Detail_Record_WholeName>
    <Subjectives_Code type="string">TEST</Subjectives_Code>
  </subjectivesmodres>
</data>
`;

const buildContraindicationXml = (warning = false) => `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <contraindication_checkres type="record">
    <Api_Result type="string">${warning ? 'E20' : '00'}</Api_Result>
    <Api_Result_Message type="string">${warning ? 'warning' : 'OK'}</Api_Result_Message>
    <Information_Date type="string">${ISO_DATE}</Information_Date>
    <Information_Time type="string">${ISO_TIME}</Information_Time>
    <Medical_Information type="array">
      <Medical_Information_child type="record">
        <Medication_Code type="string">A100</Medication_Code>
        <Medication_Name type="string">Amlodipine</Medication_Name>
        <Medical_Result type="string">0</Medical_Result>
        <Medical_Result_Message type="string">OK</Medical_Result_Message>
        <Medical_Info type="array">
          <Medical_Info_child type="record">
            <Contra_Code type="string">C001</Contra_Code>
            <Contra_Name type="string">ContraSample</Contra_Name>
            <Context_Class type="string">1</Context_Class>
          </Medical_Info_child>
        </Medical_Info>
      </Medical_Information_child>
    </Medical_Information>
    <Symptom_Information type="array">
      <Symptom_Information_child type="record">
        <Symptom_Code type="string">S001</Symptom_Code>
        <Symptom_Content type="string">Headache</Symptom_Content>
      </Symptom_Information_child>
    </Symptom_Information>
  </contraindication_checkres>
</data>
`;

const buildPatientGetXml = () => `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <patientgetv2res type="record">
    <Api_Result type="string">00</Api_Result>
    <Api_Result_Message type="string">OK</Api_Result_Message>
    <Information_Date type="string">${ISO_DATE}</Information_Date>
    <Information_Time type="string">${ISO_TIME}</Information_Time>
    <Patient_Information type="record">
      <Patient_ID type="string">000001</Patient_ID>
      <Patient_Name type="string">Sample</Patient_Name>
    </Patient_Information>
  </patientgetv2res>
</data>
`;

const buildPatientGetJson = () => ({
  patientgetv2res: {
    Api_Result: '0000',
    Api_Result_Message: 'OK',
    Information_Date: ISO_DATE,
    Information_Time: ISO_TIME,
    Patient_Information: {
      Patient_ID: '000001',
      Patient_Name: 'Sample',
    },
  },
});

const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]);

export const orcaAdditionalHandlers = [
  http.post('/api01rv2/incomeinfv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) return respondXml(buildIncomeInfoXml(), 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(buildIncomeInfoXml(), 500);
    return respondXml(buildIncomeInfoXml());
  }),
  http.post('/api01rv2/subjectiveslstv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) return respondXml(buildSubjectivesListXml(), 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(buildSubjectivesListXml(), 500);
    return respondXml(buildSubjectivesListXml());
  }),
  http.post('/orca25/subjectivesv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const warning = fault.tokens.has('api-warning');
    if (fault.tokens.has('timeout')) return respondXml(buildSubjectivesModXml(warning), 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(buildSubjectivesModXml(warning), 500);
    return respondXml(buildSubjectivesModXml(warning));
  }),
  http.post('/api01rv2/contraindicationcheckv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const warning = fault.tokens.has('api-warning');
    if (fault.tokens.has('timeout')) return respondXml(buildContraindicationXml(warning), 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(buildContraindicationXml(warning), 500);
    return respondXml(buildContraindicationXml(warning));
  }),
  http.get('/api01rv2/patientgetv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    if (fault.tokens.has('timeout')) {
      return format === 'json'
        ? HttpResponse.json(buildPatientGetJson(), { status: 504 })
        : respondXml(buildPatientGetXml(), 504);
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return format === 'json'
        ? HttpResponse.json(buildPatientGetJson(), { status: 500 })
        : respondXml(buildPatientGetXml(), 500);
    }
    return format === 'json' ? HttpResponse.json(buildPatientGetJson()) : respondXml(buildPatientGetXml());
  }),
  http.get('/blobapi/:dataId', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return HttpResponse.arrayBuffer(pdfBytes, {
        status: 504,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return HttpResponse.arrayBuffer(pdfBytes, {
        status: 500,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }
    return HttpResponse.arrayBuffer(pdfBytes, {
      status: 200,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  }),
  ...Object.keys(reportLabels).map((key) =>
    http.post(`/api01rv2/${key}`, async ({ request }) => {
      const fault = parseFaultSpec(request);
      await applyFaultDelay(fault);
      const label = reportLabels[key] ?? key;
      const dataId = `DATA-${key.toUpperCase()}`;
      if (fault.tokens.has('timeout')) {
        return HttpResponse.json(buildReportBody(label, dataId), { status: 504 });
      }
      if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
        return HttpResponse.json(buildReportBody(label, dataId), { status: 500 });
      }
      if (fault.tokens.has('missing-data-id')) {
        const body = buildReportBody(label, dataId);
        delete (body.report as Record<string, unknown>).Data_Id;
        return HttpResponse.json(body);
      }
      if (fault.tokens.has('api-error')) {
        const body = buildReportBody(label, dataId);
        body.report.Api_Result = 'E99';
        body.report.Api_Result_Message = 'mock error';
        return HttpResponse.json(body);
      }
      return HttpResponse.json(buildReportBody(label, dataId));
    }),
  ),
];
