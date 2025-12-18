import { delay, http, HttpResponse } from 'msw';

type FaultSpec = {
  tokens: Set<string>;
  delayMs?: number;
};

const parseFaultSpec = (request: Request): FaultSpec => {
  const raw = request.headers.get('x-msw-fault') ?? '';
  const tokens = new Set(
    raw
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token.length > 0),
  );
  const delayRaw = request.headers.get('x-msw-delay-ms');
  const parsed = delayRaw ? Number(delayRaw) : undefined;
  const delayMs = typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 60_000) : undefined;
  return { tokens, delayMs };
};

const applyFaultDelay = async (fault: FaultSpec) => {
  if (!fault.delayMs) return;
  await delay(fault.delayMs);
};

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

