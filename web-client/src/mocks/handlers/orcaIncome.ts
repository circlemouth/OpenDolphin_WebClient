import { http, HttpResponse } from 'msw';

import { applyFaultDelay, parseFaultSpec } from '../utils/faultInjection';
import { ORCA_ADDITIONAL_INVALID_XML, buildIncomeInfoXml } from '../fixtures/orcaAdditional';

const respondXml = (xml: string, status = 200) =>
  HttpResponse.text(xml, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
    },
  });

const respondEmpty = (status = 200) => HttpResponse.text('', { status });

export const orcaIncomeHandlers = [
  http.post('/api01rv2/incomeinfv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);
    const omitRequired = fault.tokens.has('missing-required');
    const xml = buildIncomeInfoXml({ omitApiResult: omitRequired });
    if (fault.tokens.has('timeout')) return respondXml(xml, 504);
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) return respondXml(xml, 500);
    if (fault.tokens.has('empty-body')) return respondEmpty();
    if (fault.tokens.has('invalid-xml')) return respondXml(ORCA_ADDITIONAL_INVALID_XML);
    return respondXml(xml);
  }),
];
