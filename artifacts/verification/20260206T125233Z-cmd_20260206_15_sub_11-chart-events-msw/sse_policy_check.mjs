import fs from 'node:fs';
import path from 'node:path';

import { chromium } from 'playwright';

const mustGetEnv = (key) => {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

const runId = mustGetEnv('RUN_ID');
const baseUrl = mustGetEnv('BASE_URL'); // e.g. http://localhost:5173
const label = mustGetEnv('LABEL'); // msw_off / msw_on

const outDir = process.env.OUT_DIR || process.cwd();
const facilityId = process.env.FACILITY_ID || '1.3.6.1.4.1.9414.10.1';
const userId = process.env.USER_ID || 'dolphindev';
const role = process.env.ROLE || 'system_admin';
const clientUuid = process.env.CLIENT_UUID || `ashigaru3-${label}`;

const authKey = 'opendolphin:web-client:auth';
const session = {
  facilityId,
  userId,
  displayName: 'Ashigaru3',
  commonName: 'Ashigaru3',
  clientUuid,
  runId,
  role,
  roles: [role],
};

const results = {
  runId,
  label,
  baseUrl,
  facilityId,
  chartsUrl: `${baseUrl}/f/${encodeURIComponent(facilityId)}/charts`,
  startedAt: new Date().toISOString(),
  console: [],
  chartEventsRequests: [],
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Make the app think we're already logged in and make SSE clientUUID resolvable.
  await context.addInitScript(
    ({ authKey, session, clientUuid }) => {
      try {
        sessionStorage.setItem(authKey, JSON.stringify(session));
      } catch {
        // ignore
      }
      try {
        localStorage.setItem('devClientUuid', clientUuid);
      } catch {
        // ignore
      }
    },
    { authKey, session, clientUuid },
  );

  const page = await context.newPage();

  page.on('console', (msg) => {
    results.console.push({
      ts: new Date().toISOString(),
      type: msg.type(),
      text: msg.text(),
    });
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (!/\/api\/chart-events(?:\\?|$)/.test(url)) return;
    const headers = response.headers();
    results.chartEventsRequests.push({
      ts: new Date().toISOString(),
      url,
      status: response.status(),
      // Minimal but enough for evidence.
      xChartEventsMode: headers['x-chart-events-mode'] ?? null,
      contentType: headers['content-type'] ?? null,
    });
  });

  await page.goto(results.chartsUrl, { waitUntil: 'domcontentloaded' });
  // Give the SSE loop time to connect/retry (retryDelayMs=3000).
  await page.waitForTimeout(10_000);

  await page.screenshot({ path: path.join(outDir, `${label}.charts.png`), fullPage: true });

  results.finishedAt = new Date().toISOString();
  results.chartEventsRequestCount = results.chartEventsRequests.length;
  results.chartEventsStatuses = results.chartEventsRequests.map((r) => r.status);

  fs.writeFileSync(path.join(outDir, `${label}.results.json`), JSON.stringify(results, null, 2));
  fs.writeFileSync(
    path.join(outDir, `${label}.console.txt`),
    results.console.map((l) => `${l.ts} [${l.type}] ${l.text}`).join('\n') + '\n',
  );

  await browser.close();
};

main().catch((err) => {
  const message = err instanceof Error ? `${err.stack || err.message}` : String(err);
  fs.writeFileSync(path.join(outDir, `${label}.error.txt`), message + '\n');
  process.exitCode = 1;
});
