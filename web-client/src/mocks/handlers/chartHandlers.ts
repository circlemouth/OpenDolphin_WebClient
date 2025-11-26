import { HttpResponse, http } from 'msw';

import {
  chartsPatientListFixture,
  docInfoListFixture,
  freeDocumentFixture,
  karteSummaryFixture,
  labModuleListFixture,
  patientDetailFixture,
  patientVisitListFixture,
} from '@/mocks/fixtures/charts';
import {
  chartEventLongPollPayload,
  chartEventSseData,
  imagesPlaceholderResponse,
  modulesPlaceholderResponse,
  retryAfterPayload,
  stampTreeSyncResponseText,
} from '@/mocks/fixtures/apiStability';

const LP_POLL_DELAY_MS = 55000;
const LP_POLL_MAX_ATTEMPTS = 5;

// orca-trial フラグは ORCA ラッパー用のため MSW では透過処理（実サーバー接続時のみ効く）
const parseCompatFlags = (headerValue: string | null) =>
  new Set(
    (headerValue ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );

const waitWithAbort = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    if (!signal) {
      return;
    }
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

const buildSseResponse = () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: chartUpdate\n`));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chartEventSseData)}\n\n`));
      controller.enqueue(encoder.encode('retry: 3000\n\n'));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Compat-Mode': 'lp-only-bypass', // lp-only flagが無い場合は SSE 優先
    },
  });
};

let lpPollCount = 0;

export const chartHandlers = [
  http.get('/api/pvt2/pvtList', () => HttpResponse.json(patientVisitListFixture)),
  http.get('/api/charts/patientList', () => HttpResponse.json(chartsPatientListFixture)),
  http.get('/api/patient/id/:patientId', () => HttpResponse.json(patientDetailFixture)),
  http.get('/api/karte/pid/:params', () => HttpResponse.json(karteSummaryFixture)),
  http.get('/api/karte/freedocument/:patientId', () => HttpResponse.json(freeDocumentFixture)),
  http.get('/api/lab/module/:params', () => HttpResponse.json(labModuleListFixture)),
  // lp-only フラグ時は LP を優先し、SSE をバイパスする
  http.get('/api/chart-events', ({ request }) => {
    const compatFlags = parseCompatFlags(request.headers.get('x-client-compat'));
    if (compatFlags.has('lp-only')) {
      return HttpResponse.text('', { status: 204, headers: { 'X-Compat-Mode': 'lp-only' } });
    }
    return buildSseResponse();
  }),
  http.get('/api/chartEvent/subscribe', async ({ request }) => {
    const compatFlags = parseCompatFlags(request.headers.get('x-client-compat'));
    const url = new URL(request.url);
    if (url.searchParams.get('simulateConflict') === '1') {
      return HttpResponse.json({ reason: 'chart locked' }, { status: 409 });
    }

    // lp-only フラグ: Legacy の LP 優先。AbortSignal 受信時は 499 相当を返す。
    try {
      await waitWithAbort(LP_POLL_DELAY_MS, request.signal);
    } catch {
      return HttpResponse.json({ reason: 'client aborted' }, { status: 499 });
    }

    lpPollCount += 1;
    if (lpPollCount > LP_POLL_MAX_ATTEMPTS) {
      return HttpResponse.text('', { status: 204, headers: { 'X-Compat-Mode': 'lp-timeout' } });
    }

    return HttpResponse.json(chartEventLongPollPayload, {
      headers: { 'X-Compat-Mode': compatFlags.has('lp-only') ? 'lp-only' : 'lp-default' },
    });
  }),
  http.put('/api/chartEvent/event', () => HttpResponse.text('1')),
  // strict-delete フラグ: DELETE 系は常に 204/空ボディを返す
  http.delete('/api/chartEvent/:id', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('simulateConflict') === '1') {
      return HttpResponse.json({ reason: 'chart locked' }, { status: 409 });
    }
    return HttpResponse.text('', { status: 204, headers: { 'X-Compat-Mode': 'strict-delete' } });
  }),
  // attachment placeholder フラグ: 添付 API 未移植時に空リストを返す
  http.get('/api/karte/images', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('simulateConflict') === '1') {
      return HttpResponse.json({ reason: 'locked' }, { status: 409 });
    }
    return HttpResponse.json(imagesPlaceholderResponse, {
      headers: { 'X-Compat-Mode': 'attachment-placeholder' },
    });
  }),
  http.delete('/api/karte/images/:imageId', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('simulateConflict') === '1') {
      return HttpResponse.json({ reason: 'locked' }, { status: 409 });
    }
    return HttpResponse.text('', { status: 204, headers: { 'X-Compat-Mode': 'attachment-placeholder' } });
  }),
  http.get('/api/karte/modules', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('withDraft') === '1') {
      return HttpResponse.json(retryAfterPayload, { status: 503, headers: { 'Retry-After': '2' } });
    }
    return HttpResponse.json(modulesPlaceholderResponse, {
      headers: { 'X-Compat-Mode': 'attachment-placeholder' },
    });
  }),
  // no-op sync フラグ: スタンプ同期は未実装のため 200 + テキストを固定返却
  http.put('/api/stamp/tree/sync', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('fail') === '1') {
      return HttpResponse.json(retryAfterPayload, { status: 503 });
    }
    return HttpResponse.text(stampTreeSyncResponseText, {
      status: 200,
      headers: { 'Content-Type': 'text/plain', 'X-Compat-Mode': 'no-op-sync' },
    });
  }),
  http.get('/api/karte/docinfo/:params', () => HttpResponse.json(docInfoListFixture)),
];
