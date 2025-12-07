import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const runId = '20251207T094118Z';
const baseURL = 'http://localhost:4176';
const artifactDir = path.resolve('artifacts/webclient/e2e/20251207T094118Z-charts');
fs.mkdirSync(artifactDir, { recursive: true });

const loginValues = {
  facilityId: '1.3.6.1.4.1.9414.72.103',
  userId: 'doctor1',
  password: 'doctor2025',
  clientUUID: 'qa-client-20251207',
};

const results = {
  runId,
  baseURL,
  steps: [],
  telemetry: [],
};

const recordStep = (name, detail) => {
  results.steps.push({ name, ...detail });
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ baseURL });

  try {
    await page.goto('/login');
    await page.waitForSelector('text=OpenDolphin Web ログイン', { timeout: 20000 });
    await page.getByRole('textbox', { name: '施設ID' }).fill(loginValues.facilityId);
    await page.getByRole('textbox', { name: 'ユーザーID' }).fill(loginValues.userId);
    await page.getByRole('textbox', { name: 'パスワード', exact: false }).fill(loginValues.password);
    await page.getByRole('textbox', { name: 'クライアントUUID (任意)' }).fill(loginValues.clientUUID);

    await Promise.all([
      page.waitForNavigation({ url: '**/reception**' }),
      page.getByRole('button', { name: /ログイン/ }).click(),
    ]);
    recordStep('login', { url: page.url() });

    await page.waitForSelector('[data-test-id="reception-tone"] .tone-banner', { timeout: 20000 });
    const receptionTone = await page.textContent('[data-test-id="reception-tone"] .tone-banner').catch(() => null);
    const receptionAria = await page.getAttribute('[data-test-id="reception-tone"] .tone-banner', 'aria-live').catch(() => null);
    const recBadges = await page.locator('[data-test-id="reception-badges"] .status-badge').allTextContents().catch(() => []);
    recordStep('reception', { url: page.url(), tone: receptionTone, aria: receptionAria, badges: recBadges });
    await page.screenshot({ path: path.join(artifactDir, '01-reception.png'), fullPage: true });

    const navSelectors = [
      '[data-test-id="nav-charts"]',
      'a[href*="charts"]',
      'text=Charts',
      'text=カルテ',
    ];
    let navigated = false;
    for (const sel of navSelectors) {
      const locator = page.locator(sel).first();
      if (await locator.count() > 0 && await locator.isVisible().catch(() => false)) {
        await locator.click();
        await page.waitForTimeout(500);
        if (page.url().includes('charts')) {
          navigated = true;
          break;
        }
      }
    }
    if (!navigated) {
      await page.goto('/charts/patients');
      await page.waitForLoadState('networkidle');
    }
    recordStep('charts-nav', { url: page.url() });

    await page.waitForSelector('[data-test-id="charts-tone"] .tone-banner', { timeout: 20000 });
    const chartsTone = await page.textContent('[data-test-id="charts-tone"] .tone-banner').catch(() => null);
    const chartsAria = await page.getAttribute('[data-test-id="charts-tone"] .tone-banner', 'aria-live').catch(() => null);
    const chartsBadges = await page.locator('[data-test-id="charts-badges"] .status-badge').allTextContents().catch(() => []);

    const patientsTab = page.getByRole('tab', { name: /Patients|患者/ }).first();
    if (await patientsTab.count() > 0) {
      await patientsTab.click();
      await page.waitForTimeout(500);
    }

    const patientsTone = await page.textContent('[data-test-id="patients-tone"] .tone-banner').catch(() => null);
    const patientsAria = await page.getAttribute('[data-test-id="patients-tone"] .tone-banner', 'aria-live').catch(() => null);
    const patientsBadges = await page.locator('[data-test-id="patients-badges"] .status-badge').allTextContents().catch(() => []);

    let telemetry = [];
    try {
      telemetry = await page.evaluate(() => window.__OUTPATIENT_FUNNEL__ ?? []);
    } catch (err) {
      telemetry = [];
    }
    results.telemetry = telemetry;

    recordStep('charts/patients', {
      url: page.url(),
      chartsTone,
      chartsAria,
      chartsBadges,
      patientsTone,
      patientsAria,
      patientsBadges,
    });
    await page.screenshot({ path: path.join(artifactDir, '02-charts-patients.png'), fullPage: true });
  } catch (err) {
    recordStep('error', { message: err.message, stack: err.stack });
    await page.screenshot({ path: path.join(artifactDir, '99-error.png'), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(artifactDir, 'results.json'), JSON.stringify(results, null, 2));
  }
})();
