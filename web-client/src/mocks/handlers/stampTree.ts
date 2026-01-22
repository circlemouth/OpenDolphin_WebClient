import { http, HttpResponse } from 'msw';

const generateRunId = () => new Date().toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';

const generateTraceId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `trace-${Date.now()}`;
};

const respond = (body: Record<string, unknown>, status = 200) =>
  HttpResponse.json(body, {
    status,
    headers: {
      'x-run-id': String(body.runId ?? ''),
      'x-trace-id': String((body as any).traceId ?? ''),
    },
  });

export const stampTreeHandlers = [
  http.get('/user/:userName', ({ params }) => {
    const runId = generateRunId();
    const traceId = generateTraceId();
    const userName = String(params.userName ?? '');
    return respond(
      {
        ok: true,
        status: 200,
        runId,
        traceId,
        id: 1,
        userId: userName,
      },
      200,
    );
  }),
  http.get('/touch/stampTree/:userPk', ({ params, request }) => {
    const runId = generateRunId();
    const traceId = generateTraceId();
    const userPk = String(params.userPk ?? '');
    const url = new URL(request.url);
    if (userPk === '404' || url.searchParams.get('missing') === '1') {
      return respond(
        {
          ok: false,
          status: 404,
          runId,
          traceId,
          message: 'stamp tree not found',
        },
        404,
      );
    }
    return respond(
      {
        ok: true,
        status: 200,
        runId,
        traceId,
        stampTreeList: [
          {
            treeName: '個人',
            entity: 'medOrder',
            treeOrder: '1',
            stampList: [
              {
                name: '降圧セット',
                entity: 'medOrder',
                stampId: 'STAMP-1',
              },
            ],
          },
        ],
      },
      200,
    );
  }),
  http.get('/touch/stamp/:stampId', ({ params }) => {
    const runId = generateRunId();
    const traceId = generateTraceId();
    const stampId = String(params.stampId ?? '');
    if (stampId === 'missing') {
      return respond(
        {
          ok: false,
          status: 404,
          runId,
          traceId,
          message: 'stamp not found',
        },
        404,
      );
    }
    return respond(
      {
        ok: true,
        status: 200,
        runId,
        traceId,
        orderName: '降圧セット',
        admin: '1日1回 朝',
        bundleNumber: '1',
        memo: '注意事項',
        claimItem: [{ name: 'アムロジピン', number: '1', unit: '錠' }],
      },
      200,
    );
  }),
];
