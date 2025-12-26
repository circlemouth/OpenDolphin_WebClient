import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../../../../web-client/node_modules/playwright/index.mjs';

const runId = '20251225T231456Z';
const baseURL = 'http://localhost:5174';
const artifactDir = path.resolve('artifacts/webclient/msw-off/20251225T231456Z');
const logPath = path.join(artifactDir, 'playwright-results.json');
const screenshotsDir = path.join(artifactDir, 'screenshots');

fs.mkdirSync(screenshotsDir, { recursive: true });

const loginValues = {
  facilityId: '1.3.6.1.4.1.9414.72.103',
  userId: 'doctor1',
  password: 'doctor2025',
  clientUUID: 'msw-off-20251225',
};

const results = {
  runId,
  baseURL,
  steps: [],
  network: [],
  serviceWorkerRegistrations: null,
};

const recordStep = (name, detail = {}) => {
  results.steps.push({ name, ...detail });
};

const recordNetwork = (entry) => {
  results.network.push(entry);
};

const interestingPath = (url) =>
  url.includes('/api01rv2/') || url.includes('/orca21/') || url.includes('/orca12/') || url.includes('/api/pvt2/') || url.includes('/api/karte/') || url.includes('/api/user/');

const sanitizeHeaders = (headers) => {
  const sanitized = { ...headers };
  delete sanitized['set-cookie'];
  delete sanitized['authorization'];
  return sanitized;
};

const waitForReception = async (page) => {
  const target = '**/reception**';
  await page.waitForURL(target, { timeout: 30000 });
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL });

  page.on('response', async (response) => {
    const url = response.url();
    if (!interestingPath(url)) return;
    const headers = response.headers();
    recordNetwork({
      url,
      status: response.status(),
      headers: sanitizeHeaders(headers),
    });
  });

  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=OpenDolphin Web ログイン', { timeout: 20000 });
    await page.getByRole('textbox', { name: '施設ID' }).fill(loginValues.facilityId);
    await page.getByRole('textbox', { name: 'ユーザーID' }).fill(loginValues.userId);
    await page.getByRole('textbox', { name: 'パスワード', exact: false }).fill(loginValues.password);
    await page.getByRole('textbox', { name: 'クライアントUUID (任意)' }).fill(loginValues.clientUUID);

    await Promise.all([
      waitForReception(page),
      page.getByRole('button', { name: /ログイン/ }).click(),
    ]);

    recordStep('login', { url: page.url() });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '01-reception.png'), fullPage: true });

    const receptionTone = await page.textContent('[data-test-id="reception-tone"] .tone-banner').catch(() => null);
    recordStep('reception', { tone: receptionTone });

    await page.goto('/charts/patients', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '02-charts-patients.png'), fullPage: true });

    const chartsTone = await page.textContent('[data-test-id="charts-tone"] .tone-banner').catch(() => null);
    recordStep('charts', { tone: chartsTone });

    const swCount = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return null;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.length;
    });
    results.serviceWorkerRegistrations = swCount;
  } catch (err) {
    recordStep('error', { message: err?.message, stack: err?.stack });
    await page.screenshot({ path: path.join(screenshotsDir, '99-error.png'), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
    fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
  }
};

main().catch((err) => {
  recordStep('fatal', { message: err?.message, stack: err?.stack });
  fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
  process.exit(1);
});
