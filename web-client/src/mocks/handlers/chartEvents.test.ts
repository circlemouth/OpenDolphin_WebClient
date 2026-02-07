import { beforeAll, afterAll, afterEach, expect, test } from 'vitest';
import { setupServer } from 'msw/node';

import { chartEventHandlers } from './chartEvents';

const server = setupServer(...chartEventHandlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

test('chart-events mock returns SSE response', async () => {
  const response = await fetch('http://localhost/api/chart-events');
  expect(response.status).toBe(200);
  const contentType = response.headers.get('content-type') ?? '';
  expect(contentType).toContain('text/event-stream');
  const body = await response.text();
  expect(body).toContain('event: noop');
});
