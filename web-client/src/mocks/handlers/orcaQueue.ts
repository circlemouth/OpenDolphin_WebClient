import { http, HttpResponse } from 'msw';

import { applyFaultDelay, parseFaultSpec } from '../utils/faultInjection';

const toIso = (date: Date) => date.toISOString();

const buildStalledQueue = () => {
  const now = Date.now();
  const lastDispatchAt = toIso(new Date(now - 25 * 60_000)); // 25 分前（滞留扱いになりやすい）
  return [
    {
      patientId: '000002',
      status: 'pending',
      retryable: true,
      lastDispatchAt,
      error: 'MSW injected stall: pending too long',
    },
    {
      patientId: '000001',
      status: 'delivered',
      retryable: false,
      lastDispatchAt: toIso(new Date(now - 2 * 60_000)),
    },
  ];
};

export const orcaQueueHandlers = [
  http.get('/api/orca/queue', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);

    const runId = request.headers.get('x-run-id') ?? request.headers.get('X-Run-Id') ?? '';
    const traceId = request.headers.get('x-trace-id') ?? request.headers.get('X-Trace-Id') ?? '';

    if (fault.tokens.has('timeout')) {
      return HttpResponse.json(
        {
          runId,
          traceId,
          source: 'mock',
          fetchedAt: new Date().toISOString(),
          queue: [],
        },
        {
          status: 504,
          headers: {
            'x-run-id': runId,
            'x-trace-id': traceId,
            'x-orca-queue-mode': 'mock',
          },
        },
      );
    }

    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return HttpResponse.json(
        {
          runId,
          traceId,
          source: 'mock',
          fetchedAt: new Date().toISOString(),
          queue: [],
        },
        {
          status: 500,
          headers: {
            'x-run-id': runId,
            'x-trace-id': traceId,
            'x-orca-queue-mode': 'mock',
          },
        },
      );
    }

    if (fault.tokens.has('schema-mismatch')) {
      return HttpResponse.json(
        {
          runId,
          traceId,
          source: 'mock',
          fetchedAt: new Date().toISOString(),
          queue: 'schema-mismatch',
          apiResult: 'ERROR_SCHEMA_MISMATCH',
        } as any,
        {
          status: 200,
          headers: {
            'x-run-id': runId,
            'x-trace-id': traceId,
            'x-orca-queue-mode': 'mock',
          },
        },
      );
    }

    const queue = fault.tokens.has('queue-stall') ? buildStalledQueue() : [];

    return HttpResponse.json(
      {
        runId,
        traceId,
        source: 'mock',
        fetchedAt: new Date().toISOString(),
        queue,
      },
      {
        status: 200,
        headers: {
          'x-run-id': runId,
          'x-trace-id': traceId,
          'x-orca-queue-mode': 'mock',
        },
      },
    );
  }),
  http.post('/api01rv2/pusheventgetv2', async ({ request }) => {
    const fault = parseFaultSpec(request);
    await applyFaultDelay(fault);

    const runId = request.headers.get('x-run-id') ?? request.headers.get('X-Run-Id') ?? '';
    const traceId = request.headers.get('x-trace-id') ?? request.headers.get('X-Trace-Id') ?? '';

    if (fault.tokens.has('timeout')) {
      return HttpResponse.json(
        {
          pusheventgetv2res: {
            Api_Result: '9001',
            Api_Result_Message: 'timeout',
            Event_Information: [],
          },
        },
        {
          status: 504,
          headers: {
            'x-run-id': runId,
            'x-trace-id': traceId,
            'x-orca-pushevent-total': '0',
            'x-orca-pushevent-kept': '0',
            'x-orca-pushevent-deduped': '0',
            'x-orca-pushevent-new': '0',
          },
        },
      );
    }

    if (fault.tokens.has('http-500') || fault.tokens.has('500')) {
      return HttpResponse.json(
        {
          pusheventgetv2res: {
            Api_Result: '9999',
            Api_Result_Message: 'mock failure',
            Event_Information: [],
          },
        },
        {
          status: 500,
          headers: {
            'x-run-id': runId,
            'x-trace-id': traceId,
            'x-orca-pushevent-total': '0',
            'x-orca-pushevent-kept': '0',
            'x-orca-pushevent-deduped': '0',
            'x-orca-pushevent-new': '0',
          },
        },
      );
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const events = [
      {
        data: {
          uuid: 'mock-event-001',
          id: 1,
          event: 'patient_accept',
          user: 'mock',
          body: {
            Patient_ID: '000001',
            Department_Code: '01',
            Department_Name: '内科',
          },
          time: timestamp,
        },
      },
    ];

    return HttpResponse.json(
      {
        pusheventgetv2res: {
          Api_Result: '0000',
          Api_Result_Message: 'OK',
          Event_Information: events,
        },
      },
      {
        status: 200,
        headers: {
          'x-run-id': runId,
          'x-trace-id': traceId,
          'x-orca-pushevent-total': String(events.length),
          'x-orca-pushevent-kept': String(events.length),
          'x-orca-pushevent-deduped': '0',
          'x-orca-pushevent-new': String(events.length),
        },
      },
    );
  }),
];
