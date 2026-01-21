import { http, HttpResponse } from 'msw';

import { applyFaultDelay, parseFaultSpec } from '../utils/faultInjection';
import {
  ORCA_ADDITIONAL_INVALID_XML,
  ORCA_ADDITIONAL_PDF_BYTES,
  buildContraindicationXml,
  buildPatientGetJson,
  buildPatientGetXml,
  buildReportBody,
  buildSubjectivesListXml,
  buildSubjectivesModXml,
} from '../fixtures/orcaAdditional';

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

const respondEmpty = (status = 200) => HttpResponse.text('', { status });

export const orcaAdditionalHandlers = [
  http.post('/api01rv2/subjectiveslstv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const omitRequired = fault.tokens.has('missing-required');
    const xml = buildSubjectivesListXml({ omitApiResult: omitRequired });
    if (fault.tokens.has('timeout')) return respondXml(xml, 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(xml, 500);
    if (fault.tokens.has('empty-body')) return respondEmpty();
    if (fault.tokens.has('invalid-xml')) return respondXml(ORCA_ADDITIONAL_INVALID_XML);
    return respondXml(xml);
  }),
  http.post('/orca25/subjectivesv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const warning = fault.tokens.has('api-warning');
    const omitRequired = fault.tokens.has('missing-required');
    const xml = buildSubjectivesModXml({
      apiResult: warning ? 'E10' : '00',
      apiResultMessage: warning ? 'warning' : 'OK',
      warningMessages: warning ? ['Check content'] : [],
      omitApiResult: omitRequired,
    });
    if (fault.tokens.has('timeout')) return respondXml(xml, 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(xml, 500);
    if (fault.tokens.has('empty-body')) return respondEmpty();
    if (fault.tokens.has('invalid-xml')) return respondXml(ORCA_ADDITIONAL_INVALID_XML);
    return respondXml(xml);
  }),
  http.post('/api01rv2/contraindicationcheckv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const warning = fault.tokens.has('api-warning');
    const omitRequired = fault.tokens.has('missing-required');
    const xml = buildContraindicationXml({
      apiResult: warning ? 'E20' : '00',
      apiResultMessage: warning ? 'warning' : 'OK',
      omitApiResult: omitRequired,
    });
    if (fault.tokens.has('timeout')) return respondXml(xml, 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(xml, 500);
    if (fault.tokens.has('empty-body')) return respondEmpty();
    if (fault.tokens.has('invalid-xml')) return respondXml(ORCA_ADDITIONAL_INVALID_XML);
    return respondXml(xml);
  }),
  http.get('/api01rv2/patientgetv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    const omitRequired = fault.tokens.has('missing-required');
    const xml = buildPatientGetXml({ omitApiResult: omitRequired, omitApiResultMessage: omitRequired });
    const json = buildPatientGetJson({ omitApiResult: omitRequired, omitApiResultMessage: omitRequired });
    if (fault.tokens.has('timeout')) {
      return format === 'json' ? HttpResponse.json(json, { status: 504 }) : respondXml(xml, 504);
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return format === 'json' ? HttpResponse.json(json, { status: 500 }) : respondXml(xml, 500);
    }
    if (fault.tokens.has('empty-body')) return respondEmpty();
    if (fault.tokens.has('invalid-xml') && format !== 'json') return respondXml(ORCA_ADDITIONAL_INVALID_XML);
    return format === 'json' ? HttpResponse.json(json) : respondXml(xml);
  }),
  http.get('/blobapi/:dataId', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return HttpResponse.arrayBuffer(ORCA_ADDITIONAL_PDF_BYTES.buffer, {
        status: 504,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return HttpResponse.arrayBuffer(ORCA_ADDITIONAL_PDF_BYTES.buffer, {
        status: 500,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }
    if (fault.tokens.has('empty-body')) {
      return HttpResponse.arrayBuffer(new ArrayBuffer(0), {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }
    return HttpResponse.arrayBuffer(ORCA_ADDITIONAL_PDF_BYTES.buffer, {
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
      const omitRequired = fault.tokens.has('missing-required');
      const body = buildReportBody({
        label,
        dataId,
        omitDataId: fault.tokens.has('missing-data-id'),
        omitApiResult: omitRequired,
        omitApiResultMessage: omitRequired,
      });
      if (fault.tokens.has('timeout')) {
        return HttpResponse.json(body, { status: 504 });
      }
      if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
        return HttpResponse.json(body, { status: 500 });
      }
      if (fault.tokens.has('empty-body')) return respondEmpty();
      if (fault.tokens.has('api-error') && !omitRequired) {
        (body.report as Record<string, unknown>).Api_Result = 'E99';
        (body.report as Record<string, unknown>).Api_Result_Message = 'mock error';
      }
      return HttpResponse.json(body);
    }),
  ),
];
