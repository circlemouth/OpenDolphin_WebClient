import { http, HttpResponse } from 'msw';

const buildNoopEvent = () => {
  const payload = {
    source: 'mock',
    emittedAt: new Date().toISOString(),
  };
  return [
    'event: noop',
    `data: ${JSON.stringify(payload)}`,
    '',
    '',
  ].join('\n');
};

export const chartEventHandlers = [
  http.get(/\/api\/chart-events$/, () => {
    const body = buildNoopEvent();
    return new HttpResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Chart-Events-Mode': 'mock',
      },
    });
  }),
];
