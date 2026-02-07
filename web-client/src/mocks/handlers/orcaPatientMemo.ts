import { http, HttpResponse } from 'msw';

const extractTagValue = (xml: string, tag: string) => {
  if (!xml) return undefined;
  const pattern = new RegExp(`<${tag}\\b[^>]*>(.*?)</${tag}>`, 'i');
  const match = xml.match(pattern);
  return match?.[1]?.trim() || undefined;
};

const buildXmlResponse = (body: string, status = 200) =>
  new HttpResponse(body, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
    },
  });

export const orcaPatientMemoHandlers = [
  http.post('/api01rv2/patientlst7v2', async ({ request }) => {
    const raw = await request.text().catch(() => '');
    const patientId = extractTagValue(raw, 'Patient_ID');
    const baseDate = extractTagValue(raw, 'Base_Date');
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<xmlio2>',
      '  <patientlst7res type="record">',
      '    <Api_Result type="string">0000</Api_Result>',
      '    <Api_Result_Message type="string">正常終了</Api_Result_Message>',
      ...(patientId ? [`    <Patient_ID type="string">${patientId}</Patient_ID>`] : []),
      ...(baseDate ? [`    <Base_Date type="string">${baseDate}</Base_Date>`] : []),
      '  </patientlst7res>',
      '</xmlio2>',
    ].join('\n');
    return buildXmlResponse(xml);
  }),
];
