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
import { applyFaultDelay, parseFaultSpec } from '../utils/faultInjection';

const respond = <T extends Record<string, unknown>>(body: T) =>
  HttpResponse.json(body, {
    status: typeof body.status === 'number' ? (body.status as number) : 200,
    headers: {
      'x-run-id': String(body.runId ?? ''),
      'x-trace-id': String((body as any).traceId ?? ''),
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
  const runIdHeader = request.headers.get('x-msw-run-id');
  if (cacheHitHeader || missingMasterHeader || transitionHeader || fallbackUsedHeader || runIdHeader) {
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
      runId: runIdHeader ? String(runIdHeader) : undefined,
    });
  }

  return getOutpatientScenario();
};

export const outpatientHandlers = [
  http.post('/orca/claim/outpatient', async ({ request }) => {
    const fault = parseFaultSpec(request);
    const scenario = applyRequestScenario(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return respond(buildClaimFixture({ ...scenario.flags, status: 504 }));
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return respond(buildClaimFixture({ ...scenario.flags, status: 500 }));
    }
    if (fault.tokens.has('schema-mismatch')) {
      const mismatch = {
        runId: scenario.flags.runId,
        traceId: scenario.flags.traceId ?? `trace-${scenario.flags.runId}`,
        cacheHit: scenario.flags.cacheHit,
        missingMaster: scenario.flags.missingMaster,
        dataSourceTransition: scenario.flags.dataSourceTransition,
        fallbackUsed: scenario.flags.fallbackUsed,
        // NOTE: ClaimOutpatientPayload の期待形から外した型を返す（意図的なスキーマ不一致）。
        claimBundles: 'schema-mismatch',
        apiResult: 'ERROR_SCHEMA_MISMATCH',
        apiResultMessage: 'MSW injected schema mismatch for claim/outpatient',
        status: 200,
      } as any;
      return respond(mismatch);
    }
    return respond(buildClaimFixture(scenario.flags));
  }),
  http.post('/orca/appointments/list', async ({ request }) => {
    const fault = parseFaultSpec(request);
    const scenario = applyRequestScenario(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return respond({ ...(buildAppointmentFixture({ ...scenario.flags, status: 504 }) as any), status: 504 } as any);
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return respond({ ...(buildAppointmentFixture({ ...scenario.flags, status: 500 }) as any), status: 500 } as any);
    }
    if (fault.tokens.has('schema-mismatch')) {
      const mismatch = {
        runId: scenario.flags.runId,
        traceId: scenario.flags.traceId ?? `trace-${scenario.flags.runId}`,
        cacheHit: scenario.flags.cacheHit,
        missingMaster: scenario.flags.missingMaster,
        dataSourceTransition: scenario.flags.dataSourceTransition,
        fallbackUsed: scenario.flags.fallbackUsed,
        slots: 'schema-mismatch',
        reservations: { not: 'array' },
        visits: 42,
        apiResult: 'ERROR_SCHEMA_MISMATCH',
        apiResultMessage: 'MSW injected schema mismatch for appointments/list',
        status: 200,
      } as any;
      return respond(mismatch);
    }
    return respond(buildAppointmentFixture(scenario.flags));
  }),
  http.post('/orca/appointments/mock', async ({ request }) => {
    const fault = parseFaultSpec(request);
    const scenario = applyRequestScenario(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return respond({ ...(buildAppointmentFixture({ ...scenario.flags, status: 504 }) as any), status: 504 } as any);
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return respond({ ...(buildAppointmentFixture({ ...scenario.flags, status: 500 }) as any), status: 500 } as any);
    }
    if (fault.tokens.has('schema-mismatch')) {
      const mismatch = {
        runId: scenario.flags.runId,
        traceId: scenario.flags.traceId ?? `trace-${scenario.flags.runId}`,
        cacheHit: scenario.flags.cacheHit,
        missingMaster: scenario.flags.missingMaster,
        dataSourceTransition: scenario.flags.dataSourceTransition,
        fallbackUsed: scenario.flags.fallbackUsed,
        appointmentDate: null,
        visits: [{ voucherNumber: null }],
        apiResult: 'ERROR_SCHEMA_MISMATCH',
        apiResultMessage: 'MSW injected schema mismatch for appointments/mock',
        status: 200,
      } as any;
      return respond(mismatch);
    }
    return respond(buildAppointmentFixture(scenario.flags));
  }),
  http.post('/orca21/medicalmodv2/outpatient', async ({ request }) => {
    const fault = parseFaultSpec(request);
    const scenario = applyRequestScenario(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return respond(buildMedicalSummaryFixture({ ...scenario.flags, status: 504 }));
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return respond(buildMedicalSummaryFixture({ ...scenario.flags, status: 500 }));
    }
    if (fault.tokens.has('schema-mismatch')) {
      const mismatch = {
        runId: scenario.flags.runId,
        traceId: scenario.flags.traceId ?? `trace-${scenario.flags.runId}`,
        requestId: `req-${scenario.flags.runId}`,
        cacheHit: scenario.flags.cacheHit,
        missingMaster: scenario.flags.missingMaster,
        dataSourceTransition: scenario.flags.dataSourceTransition,
        fallbackUsed: scenario.flags.fallbackUsed,
        fetchedAt: new Date().toISOString(),
        recordsReturned: 0,
        outcome: 'ERROR',
        outpatientList: 'schema-mismatch',
        apiResult: 'ERROR_SCHEMA_MISMATCH',
        apiResultMessage: 'MSW injected schema mismatch for medicalmodv2/outpatient',
        status: 200,
      } as any;
      return respond(mismatch);
    }
    return respond(buildMedicalSummaryFixture(scenario.flags));
  }),
  http.post('/orca/patients/local-search', async ({ request }) => {
    const fault = parseFaultSpec(request);
    const scenario = applyRequestScenario(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return respond(buildPatientListFixture({ ...scenario.flags, status: 504 }, '/orca/patients/local-search'));
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return respond(buildPatientListFixture({ ...scenario.flags, status: 500 }, '/orca/patients/local-search'));
    }
    if (fault.tokens.has('schema-mismatch')) {
      const mismatch = {
        runId: scenario.flags.runId,
        traceId: scenario.flags.traceId ?? `trace-${scenario.flags.runId}`,
        cacheHit: scenario.flags.cacheHit,
        missingMaster: scenario.flags.missingMaster,
        dataSourceTransition: scenario.flags.dataSourceTransition,
        fallbackUsed: scenario.flags.fallbackUsed,
        patients: 'schema-mismatch',
        apiResult: 'ERROR_SCHEMA_MISMATCH',
        apiResultMessage: 'MSW injected schema mismatch for patients/local-search',
        status: 200,
      } as any;
      return respond(mismatch);
    }
    return respond(buildPatientListFixture(scenario.flags, '/orca/patients/local-search'));
  }),
  http.post('/orca/patients/local-search/mock', async ({ request }) => {
    const fault = parseFaultSpec(request);
    const scenario = applyRequestScenario(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return respond(buildPatientListFixture({ ...scenario.flags, status: 504 }, '/orca/patients/local-search/mock'));
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return respond(buildPatientListFixture({ ...scenario.flags, status: 500 }, '/orca/patients/local-search/mock'));
    }
    if (fault.tokens.has('schema-mismatch')) {
      const mismatch = {
        runId: scenario.flags.runId,
        traceId: scenario.flags.traceId ?? `trace-${scenario.flags.runId}`,
        cacheHit: scenario.flags.cacheHit,
        missingMaster: scenario.flags.missingMaster,
        dataSourceTransition: scenario.flags.dataSourceTransition,
        fallbackUsed: scenario.flags.fallbackUsed,
        patients: [],
        patientInfo: 123,
        apiResult: 'ERROR_SCHEMA_MISMATCH',
        apiResultMessage: 'MSW injected schema mismatch for patients/local-search/mock',
        status: 200,
      } as any;
      return respond(mismatch);
    }
    return respond(buildPatientListFixture(scenario.flags, '/orca/patients/local-search/mock'));
  }),
  http.post('/orca12/patientmodv2/outpatient', async ({ request }) => {
    const fault = parseFaultSpec(request);
    const scenario = applyRequestScenario(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return respond(buildPatientListFixture({ ...scenario.flags, status: 504 }));
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return respond(buildPatientListFixture({ ...scenario.flags, status: 500 }));
    }
    if (fault.tokens.has('schema-mismatch')) {
      const mismatch = {
        runId: scenario.flags.runId,
        traceId: scenario.flags.traceId ?? `trace-${scenario.flags.runId}`,
        cacheHit: scenario.flags.cacheHit,
        missingMaster: scenario.flags.missingMaster,
        dataSourceTransition: scenario.flags.dataSourceTransition,
        fallbackUsed: scenario.flags.fallbackUsed,
        patients: [{ patientId: 1 }],
        apiResult: 'ERROR_SCHEMA_MISMATCH',
        apiResultMessage: 'MSW injected schema mismatch for patientmodv2/outpatient',
        status: 200,
      } as any;
      return respond(mismatch);
    }
    return respond(buildPatientListFixture(scenario.flags));
  }),
  http.post('/orca12/patientmodv2/outpatient/mock', async ({ request }) => {
    const fault = parseFaultSpec(request);
    const scenario = applyRequestScenario(request);
    await applyFaultDelay(fault);
    if (fault.tokens.has('timeout')) {
      return respond(buildPatientListFixture({ ...scenario.flags, status: 504 }));
    }
    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return respond(buildPatientListFixture({ ...scenario.flags, status: 500 }));
    }
    if (fault.tokens.has('schema-mismatch')) {
      const mismatch = {
        runId: scenario.flags.runId,
        traceId: scenario.flags.traceId ?? `trace-${scenario.flags.runId}`,
        cacheHit: scenario.flags.cacheHit,
        missingMaster: scenario.flags.missingMaster,
        dataSourceTransition: scenario.flags.dataSourceTransition,
        fallbackUsed: scenario.flags.fallbackUsed,
        patients: null,
        apiResult: 'ERROR_SCHEMA_MISMATCH',
        apiResultMessage: 'MSW injected schema mismatch for patientmodv2/outpatient/mock',
        status: 200,
      } as any;
      return respond(mismatch);
    }
    return respond(buildPatientListFixture(scenario.flags));
  }),
];
