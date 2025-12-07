import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.argv[2];
const runId = process.argv[3];
const artifactDir = process.argv[4];
const mode = process.argv[5] ?? 'fulfill';

if (!baseURL || !runId || !artifactDir) {
  console.error('Usage: node run-outpatient-ux.mjs <baseURL> <runId> <artifactDir> <mode>');
  process.exit(1);
}

fs.mkdirSync(artifactDir, { recursive: true });

const loginValues = {
  facilityId: '1.3.6.1.4.1.9414.72.103',
  userId: 'doctor1',
  password: 'password',
};

const scenarios = mode === 'fallback'
  ? [{ id: 'fallback', description: 'API unreachable -> fallback/default flags', cacheHit: false, missingMaster: true, dataSourceTransition: 'snapshot' }]
  : [
      { id: 'warn', description: 'missingMaster=true / cacheHit=false', cacheHit: false, missingMaster: true, dataSourceTransition: 'server' },
      { id: 'info', description: 'missingMaster=false / cacheHit=true', cacheHit: true, missingMaster: false, dataSourceTransition: 'server' },
    ];

const results = [];

for (const scenario of scenarios) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__ALLOW_REACT_DEVTOOLS__ = true;
    window.__LHCI_DISABLE_REACT_DEVTOOLS__ = false;
  });

  page.on('pageerror', (err) => console.error('pageerror', err));
  page.on('console', (msg) => console.log('console', msg.type(), msg.text()));

  await page.route('**/api/user/**', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        facilityId: loginValues.facilityId,
        userId: loginValues.userId,
        displayName: 'E2E Admin',
        commonName: 'E2E Admin',
      }),
    });
  });

  await page.route('**/api01rv2/claim/outpatient/**', (route) => {
    if (mode === 'fallback') return route.abort('failed');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ runId, cacheHit: scenario.cacheHit, missingMaster: scenario.missingMaster, dataSourceTransition: scenario.dataSourceTransition }),
    });
  });
  await page.route('**/orca21/medicalmodv2/outpatient**', (route) => {
    if (mode === 'fallback') return route.abort('failed');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ runId, cacheHit: scenario.cacheHit, missingMaster: scenario.missingMaster, dataSourceTransition: scenario.dataSourceTransition }),
    });
  });

  await page.goto('/login');
  await page.waitForSelector('text=OpenDolphin Web ログイン');
  await page.getByRole('textbox', { name: '施設ID' }).fill(loginValues.facilityId);
  await page.getByRole('textbox', { name: 'ユーザーID' }).fill(loginValues.userId);
  await page.getByRole('textbox', { name: 'パスワード', exact: false }).fill(loginValues.password);
  await page.getByRole('textbox', { name: 'クライアントUUID (任意)' }).fill('e2e-client');
  await Promise.all([
    page.waitForNavigation({ url: '**/reception' }),
    page.getByRole('button', { name: /ログイン/ }).click(),
  ]);
  console.log('after login url', page.url());

  await page.getByRole('link', { name: 'Outpatient Mock' }).click();
  await page.waitForURL('**/outpatient-mock**');
  console.log('after nav url', page.url());

  const toneSelector = '[data-test-id="reception-tone"] .tone-banner';
  const chartsToneSelector = '[data-test-id="charts-tone"] .tone-banner';
  const missingMasterSelector = '[data-test-id="reception-badges"] .status-badge:has-text("missingMaster")';
  const cacheHitSelector = '[data-test-id="reception-badges"] .status-badge:has-text("cacheHit")';

  await page.waitForSelector('[data-test-id="outpatient-mock-page"]');

  const toneText = await page.textContent(toneSelector);
  const toneAria = await page.getAttribute(toneSelector, 'aria-live');
  const chartsAria = await page.getAttribute(chartsToneSelector, 'aria-live');
  const missingMasterText = await page.textContent(missingMasterSelector).catch(() => 'N/A');
  const cacheHitText = await page.textContent(cacheHitSelector).catch(() => 'N/A');

  let telemetry = [];
  try {
    telemetry = await page.evaluate(() => (window).__OUTPATIENT_FUNNEL__ ?? []);
  } catch (err) {
    telemetry = [];
  }

  const shotPath = path.join(artifactDir, `${mode}-${scenario.id}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });

  results.push({
    mode,
    scenario: scenario.id,
    description: scenario.description,
    baseURL,
    runId,
    toneAria,
    chartsAria,
    toneText,
    missingMasterText,
    cacheHitText,
    telemetry,
    screenshot: shotPath,
  });

  await browser.close();
}

const logPath = path.join(artifactDir, `${mode}-results.json`);
fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
console.log(`Saved ${results.length} result(s) to ${logPath}`);
