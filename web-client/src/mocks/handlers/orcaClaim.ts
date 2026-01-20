import { http, HttpResponse } from 'msw';

import { applyFaultDelay, parseFaultSpec } from '../utils/faultInjection';

const buildMedicalModV2Response = (options: { apiResult?: string; invoiceNumber?: string; dataId?: string }) => {
  const apiResult = options.apiResult ?? '00';
  const invoiceNumber = options.invoiceNumber ?? 'INV-000001';
  const dataId = options.dataId ?? 'DATA-000001';
  return [
    '<xmlio2>',
    '  <medicalres>',
    `    <Api_Result>${apiResult}</Api_Result>`,
    '    <Api_Result_Message>OK</Api_Result_Message>',
    '    <Information_Date>2026-01-20</Information_Date>',
    '    <Information_Time>09:00:00</Information_Time>',
    `    <Invoice_Number>${invoiceNumber}</Invoice_Number>`,
    `    <Data_Id>${dataId}</Data_Id>`,
    '  </medicalres>',
    '</xmlio2>',
  ].join('');
};

const buildMedicalModV23Response = (options: { apiResult?: string }) => {
  const apiResult = options.apiResult ?? '00';
  return [
    '<xmlio2>',
    '  <medicalmodv23res>',
    `    <Api_Result>${apiResult}</Api_Result>`,
    '    <Api_Result_Message>OK</Api_Result_Message>',
    '    <Information_Date>2026-01-20</Information_Date>',
    '    <Information_Time>09:00:00</Information_Time>',
    '  </medicalmodv23res>',
    '</xmlio2>',
  ].join('');
};

const respondXml = (xml: string, status = 200) =>
  HttpResponse.text(xml, {
    status,
    headers: { 'Content-Type': 'application/xml; charset=UTF-8' },
  });

export const orcaClaimHandlers = [
  http.post('/api21/medicalmodv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const xml = buildMedicalModV2Response({ apiResult: fault.tokens.has('api-error') ? 'E99' : '00' });
    if (fault.tokens.has('timeout')) return respondXml(xml, 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(xml, 500);
    if (fault.tokens.has('invalid-xml')) return respondXml('<invalid>');
    return respondXml(xml);
  }),
  http.post('/api21/medicalmodv23', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const xml = buildMedicalModV23Response({ apiResult: fault.tokens.has('api-error') ? 'E99' : '00' });
    if (fault.tokens.has('timeout')) return respondXml(xml, 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(xml, 500);
    if (fault.tokens.has('invalid-xml')) return respondXml('<invalid>');
    return respondXml(xml);
  }),
];
