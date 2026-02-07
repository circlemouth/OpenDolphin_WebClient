import { writeFile } from 'node:fs/promises';
import { setupServer } from 'msw/node';
import { handlers } from '../../../../web-client/src/mocks/handlers/index.ts';

const server = setupServer(...handlers);

const fetchJson = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  return {
    url,
    status: response.status,
    headers: {
      'x-run-id': response.headers.get('x-run-id'),
      'x-trace-id': response.headers.get('x-trace-id'),
    },
    body,
  };
};

const run = async () => {
  server.listen({ onUnhandledRequest: 'error' });
  try {
    const results = [] as any[];
    results.push(await fetchJson('http://localhost/orca/disease/import/01415'));
    results.push(await fetchJson('http://localhost/orca/order/bundles?patientId=01415&entity=generalOrder'));
    results.push(
      await fetchJson('http://localhost/orca/order/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: '01415',
          operations: [{ operation: 'create', entity: 'generalOrder', bundleName: 'テストオーダー', items: [] }],
        }),
      }),
    );
    await writeFile(new URL('./msw-orca-orders-smoke.json', import.meta.url), JSON.stringify(results, null, 2));
    console.log('msw smoke done');
  } finally {
    server.close();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
