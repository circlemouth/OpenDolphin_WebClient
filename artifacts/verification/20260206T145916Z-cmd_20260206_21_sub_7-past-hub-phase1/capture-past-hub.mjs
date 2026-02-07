import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runId = process.env.RUN_ID;
if (!runId) {
  console.error('RUN_ID is required');
  process.exit(2);
}

const outPath = process.env.OUT_PATH;
if (!outPath) {
  console.error('OUT_PATH is required');
  process.exit(2);
}

const flag = process.env.FLAG_LABEL ?? 'unknown';
const expectPastHub = process.env.EXPECT_PAST_HUB ?? '';

const facilityId = '1.3.6.1.4.1.9414.72.103';
const userId = 'doctor1';
const passwordMd5 = '632080fabdb968f9ac4f31fb55104648';
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173';

const url = `${baseUrl}/f/${facilityId}/charts?patientId=000001&visitDate=2026-01-21&msw=1`;

const maskCss = `
  /* Screenshot evidence only; prevent real-looking identifiers from being readable */
  .charts-patient-summary, .patients-tab__table, .patients-tab__history-row {
    filter: blur(6px) saturate(0.8);
  }
  .charts-past-hub {
    filter: none;
  }
`;

const main = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'x-msw-missing-master': '0',
      'x-msw-transition': 'server',
      'x-msw-cache-hit': '0',
      'x-msw-fallback-used': '0',
      'x-msw-run-id': runId,
    },
  });

  await page.addInitScript(
    ({ facility, user, password, runId }) => {
      window.localStorage.setItem('devFacilityId', facility);
      window.localStorage.setItem('devUserId', user);
      window.localStorage.setItem('devPasswordMd5', password);
      window.sessionStorage.setItem(
        'opendolphin:web-client:auth',
        JSON.stringify({
          facilityId: facility,
          userId: user,
          role: 'admin',
          runId,
          clientUuid: 'evidence-playwright',
        }),
      );
      window.sessionStorage.setItem(
        'opendolphin:web-client:auth-flags',
        JSON.stringify({
          sessionKey: `${facility}:${user}`,
          flags: {
            runId,
            cacheHit: false,
            missingMaster: false,
            dataSourceTransition: 'server',
            fallbackUsed: false,
          },
          updatedAt: new Date().toISOString(),
        }),
      );
      if (!window.$RefreshReg$) window.$RefreshReg$ = () => {};
      if (!window.$RefreshSig$) window.$RefreshSig$ = () => (type) => type;
    },
    { facility: facilityId, user: userId, password: passwordMd5, runId },
  );

  // Charts may keep long-lived connections; don't rely on networkidle.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('.charts-page', { timeout: 20_000 });

  await page.addStyleTag({ content: maskCss });

  if (expectPastHub === '1') {
    await page.waitForSelector('#charts-past-hub', { timeout: 20_000 });
  }
  if (expectPastHub === '0') {
    const count = await page.locator('#charts-past-hub').count();
    if (count !== 0) throw new Error('Expected Past Hub to be hidden, but #charts-past-hub exists');
  }

  // Evidence: ensure the UI finished rendering.
  await page.waitForTimeout(500);

  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`captured ${flag}: ${outPath}`);

  await browser.close();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
