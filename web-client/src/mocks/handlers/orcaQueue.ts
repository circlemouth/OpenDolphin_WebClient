import { http, HttpResponse } from 'msw';

import { applyFaultDelay, parseFaultSpec } from '../utils/faultInjection';

const toIso = (date: Date) => date.toISOString();

const buildStalledQueue = (runId: string) => {
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

    const queue = fault.tokens.has('queue-stall') ? buildStalledQueue(runId) : [];

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
];
