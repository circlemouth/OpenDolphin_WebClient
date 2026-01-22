import { http, HttpResponse } from 'msw';

const resolveAuditHeaders = (request: Request) => {
  const runId = request.headers.get('x-run-id') ?? 'MSW-RUN-IMAGES';
  const traceId = request.headers.get('x-trace-id') ?? `trace-${runId}`;
  return { runId, traceId };
};

const respondJson = (body: Record<string, unknown>, headers: Record<string, string> = {}, status = 200) =>
  HttpResponse.json(body, {
    status,
    headers: {
      ...headers,
    },
  });

const logRequest = (label: string, request: Request) => {
  const { runId, traceId } = resolveAuditHeaders(request);
  if (typeof console !== 'undefined') {
    console.info('[msw][karte-image]', {
      label,
      method: request.method,
      url: request.url,
      runId,
      traceId,
    });
  }
  return { runId, traceId };
};

export const karteImageHandlers = [
  http.get('/karte/images', ({ request }) => {
    const { runId, traceId } = logRequest('list', request);
    return respondJson(
      {
        list: [
          {
            id: 901,
            title: '胸部X線',
            fileName: 'xray_2026_01_21.png',
            contentType: 'image/png',
            contentSize: 245_120,
            recordedAt: '2026-01-21T12:00:00Z',
            thumbnailUrl: '/mock/thumbnail/901',
          },
        ],
        page: 1,
        total: 1,
        meta: { placeholder: false, maxSizeBytes: 5 * 1024 * 1024 },
        runId,
        traceId,
      },
      {
        'x-run-id': runId,
        'x-trace-id': traceId,
      },
    );
  }),
  http.get('/karte/iamges', ({ request }) => {
    const { runId, traceId } = logRequest('list-typo', request);
    return respondJson(
      {
        list: [],
        page: 1,
        total: 0,
        meta: { placeholder: true, maxSizeBytes: 5 * 1024 * 1024 },
        runId,
        traceId,
      },
      {
        'x-run-id': runId,
        'x-trace-id': traceId,
        'x-compat-mode': 'legacy-iamges',
      },
    );
  }),
  http.get('/karte/image/:id', ({ request, params }) => {
    const { runId, traceId } = logRequest('detail', request);
    return respondJson(
      {
        id: Number(params.id),
        title: '胸部X線',
        contentType: 'image/png',
        contentSize: 245_120,
        recordedAt: '2026-01-21T12:00:00Z',
        bytes: 'BASE64_PLACEHOLDER',
        runId,
        traceId,
      },
      {
        'x-run-id': runId,
        'x-trace-id': traceId,
      },
    );
  }),
  http.get('/karte/attachment/:id', ({ request, params }) => {
    const { runId, traceId } = logRequest('attachment', request);
    return respondJson(
      {
        id: Number(params.id),
        title: '添付ファイル',
        fileName: 'attachment-20260121.pdf',
        contentType: 'application/pdf',
        contentSize: 1024,
        bytes: 'BASE64_PLACEHOLDER',
        runId,
        traceId,
      },
      {
        'x-run-id': runId,
        'x-trace-id': traceId,
      },
    );
  }),
  http.put('/karte/document', async ({ request }) => {
    const { runId, traceId } = logRequest('document-put', request);
    const payload = await request.json().catch(() => null);
    const attachments = Array.isArray((payload as any)?.attachment) ? ((payload as any).attachment as unknown[]) : [];
    const attachmentIds = attachments
      .map((entry: any) => (typeof entry?.id === 'number' ? entry.id : null))
      .filter((value): value is number => typeof value === 'number');
    if (!payload || attachments.length === 0) {
      return respondJson(
        { ok: false, reason: 'missing_attachment', runId, traceId },
        { 'x-run-id': runId, 'x-trace-id': traceId },
        400,
      );
    }
    return respondJson(
      { ok: true, docPk: 9024, receivedAttachments: attachments.length, attachmentIds, runId, traceId },
      { 'x-run-id': runId, 'x-trace-id': traceId },
      200,
    );
  }),
  http.post('/karte/document', async ({ request }) => {
    const { runId, traceId } = logRequest('document-post', request);
    const payload = await request.json().catch(() => null);
    const attachments = Array.isArray((payload as any)?.attachment) ? ((payload as any).attachment as unknown[]) : [];
    const attachmentIds = attachments
      .map((entry: any) => (typeof entry?.id === 'number' ? entry.id : null))
      .filter((value): value is number => typeof value === 'number');
    return respondJson(
      { ok: true, docPk: 9025, receivedAttachments: attachments.length, attachmentIds, runId, traceId },
      { 'x-run-id': runId, 'x-trace-id': traceId },
      200,
    );
  }),
];
