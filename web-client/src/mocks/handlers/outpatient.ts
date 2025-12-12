import { http, HttpResponse } from 'msw';

import {
  buildAppointmentFixture,
  buildClaimFixture,
  buildMedicalSummaryFixture,
  buildPatientListFixture,
  getOutpatientScenario,
  selectOutpatientScenario,
  updateOutpatientScenarioFlags,
  type OutpatientScenarioId,
} from '../fixtures/outpatient';

const respond = <T extends Record<string, unknown>>(body: T) =>
  HttpResponse.json(body, {
    status: typeof body.status === 'number' ? (body.status as number) : 200,
    headers: {
      'x-run-id': String(body.runId ?? ''),
      'x-data-source-transition': String(body.dataSourceTransition ?? ''),
      'x-cache-hit': String(body.cacheHit ?? ''),
      'x-missing-master': String(body.missingMaster ?? ''),
      'x-fallback-used': String((body as Record<string, unknown>).fallbackUsed ?? ''),
    },
  });

const applyRequestScenario = (request: Request) => {
  const headerScenario = request.headers.get('x-msw-scenario') as OutpatientScenarioId | null;
  if (headerScenario) {
    selectOutpatientScenario(headerScenario);
    return getOutpatientScenario();
  }

  const url = new URL(request.url);
  const queryScenario = (url.searchParams.get('scenario') as OutpatientScenarioId | null) ?? undefined;
  if (queryScenario) {
    selectOutpatientScenario(queryScenario);
    return getOutpatientScenario();
  }

  const cacheHitHeader = request.headers.get('x-msw-cache-hit');
  const missingMasterHeader = request.headers.get('x-msw-missing-master');
  const transitionHeader = request.headers.get('x-msw-transition');
  const fallbackUsedHeader = request.headers.get('x-msw-fallback-used');
  if (cacheHitHeader || missingMasterHeader || transitionHeader || fallbackUsedHeader) {
    updateOutpatientScenarioFlags({
      cacheHit: cacheHitHeader === '1' || cacheHitHeader === 'true' ? true : cacheHitHeader === '0' ? false : undefined,
      missingMaster:
        missingMasterHeader === '1' || missingMasterHeader === 'true'
          ? true
          : missingMasterHeader === '0'
            ? false
            : undefined,
      dataSourceTransition: (transitionHeader as any) ?? undefined,
      fallbackUsed:
        fallbackUsedHeader === '1' || fallbackUsedHeader === 'true'
          ? true
          : fallbackUsedHeader === '0'
            ? false
            : undefined,
    });
  }

  return getOutpatientScenario();
};

export const outpatientHandlers = [
  http.post('/api01rv2/claim/outpatient', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildClaimFixture(scenario.flags));
  }),
  http.post('/api01rv2/claim/outpatient/mock', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildClaimFixture(scenario.flags));
  }),
  http.post('/api01rv2/appointment/outpatient', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildAppointmentFixture(scenario.flags));
  }),
  http.post('/api01rv2/appointment/outpatient/mock', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildAppointmentFixture(scenario.flags));
  }),
  http.post('/api01rv2/appointment/outpatient/list', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildAppointmentFixture(scenario.flags));
  }),
  http.post('/orca21/medicalmodv2/outpatient', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildMedicalSummaryFixture(scenario.flags));
  }),
  http.post('/api01rv2/patient/outpatient', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildPatientListFixture(scenario.flags, '/api01rv2/patient/outpatient'));
  }),
  http.post('/api01rv2/patient/outpatient/mock', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildPatientListFixture(scenario.flags, '/api01rv2/patient/outpatient/mock'));
  }),
  http.post('/orca12/patientmodv2/outpatient', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildPatientListFixture(scenario.flags));
  }),
  http.post('/orca12/patientmodv2/outpatient/mock', ({ request }) => {
    const scenario = applyRequestScenario(request);
    return respond(buildPatientListFixture(scenario.flags));
  }),
];
