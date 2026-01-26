import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const runId = process.env.RUN_ID ?? '20260126T140855Z';
const baseURL = process.env.E2E_BASE_URL ?? 'https://localhost:5176';
const facilityId = process.env.E2E_FACILITY_ID ?? 'LOCAL.FACILITY.0001';
const userId = process.env.E2E_USER_ID ?? 'dolphin';
const password = process.env.E2E_PASSWORD ?? 'dolphin';

const seedArtifactDir = path.resolve(`artifacts/preprod/seed/${runId}`);
const screenshotsDir = path.resolve('artifacts/validation/e2e/screenshots');
fs.mkdirSync(seedArtifactDir, { recursive: true });
fs.mkdirSync(screenshotsDir, { recursive: true });

const results = {
  runId,
  baseURL,
  facilityId,
  steps: [],
};

const recordStep = (name, detail) => {
  results.steps.push({ name, ...detail });
};

const readText = async (locator) => {
  try {
    if ((await locator.count()) === 0) return null;
    return (await locator.first().textContent())?.trim() ?? null;
  } catch {
    return null;
  }
};

const login = async (page) => {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('例: 0001').fill(facilityId);
  await page.getByRole('button', { name: 'ログインへ進む' }).click();
  await page.getByPlaceholder('例: doctor01').waitFor({ timeout: 30000 });
  await page.getByPlaceholder('例: doctor01').fill(userId);
  await page.getByPlaceholder('パスワード').fill(password);
  await page.getByRole('button', { name: /ログイン/ }).click();

  const statusMessage = page.locator('.status-message');
  await statusMessage.waitFor({ timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(1000);

  const successMessage = await readText(page.locator('.status-message.is-success'));
  const errorMessage = await readText(page.locator('.status-message.is-error'));
  recordStep('login-result', { url: page.url(), successMessage, errorMessage });
  await page.screenshot({ path: path.join(screenshotsDir, `${runId}-login-result.png`), fullPage: true });

  const currentFacilityButton = page.getByRole('button', { name: '現在の施設へ戻る' });
  if (await currentFacilityButton.isVisible().catch(() => false)) {
    await currentFacilityButton.click();
    await page.waitForTimeout(1000);
  }
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    await login(page);

    const receptionUrl = `${baseURL}/f/${encodeURIComponent(facilityId)}/reception`;
    await page.goto(receptionUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main.reception-page', { timeout: 30000 });
    await page.waitForTimeout(1500);

    const emptyText = await readText(page.locator('.reception-table__empty'));
    const rowCount = await page.locator('.reception-table tbody tr').count().catch(() => 0);
    recordStep('reception', { url: page.url(), rowCount, emptyText });
    await page.screenshot({ path: path.join(screenshotsDir, `${runId}-reception-orca.png`), fullPage: true });

    const chartTargets = [
      { patientId: '10011', visitDate: '2026-01-26' },
      { patientId: '10012', visitDate: '2026-01-26' },
      { patientId: '10013', visitDate: '2026-01-26' },
    ];

    for (const target of chartTargets) {
      const chartsUrl = `${baseURL}/f/${encodeURIComponent(facilityId)}/charts?patientId=${target.patientId}&visitDate=${target.visitDate}`;
      await page.goto(chartsUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#charts-document-timeline', { timeout: 30000 }).catch(() => null);
      await page.waitForTimeout(1500);
      const docCount = await page.locator('.document-timeline__entry-title').count().catch(() => 0);
      const docEmpty = await readText(page.locator('.document-timeline__fallback'));
      recordStep(`charts-${target.patientId}`, {
        url: page.url(),
        docCount,
        docEmpty,
      });
      await page.screenshot({
        path: path.join(screenshotsDir, `${runId}-charts-${target.patientId}.png`),
        fullPage: true,
      });
    }
  } catch (err) {
    recordStep('error', { message: err?.message ?? String(err) });
    await page.screenshot({ path: path.join(screenshotsDir, `${runId}-ui-error.png`), fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
    const logPath = path.join(seedArtifactDir, 'ui-check.log');
    fs.writeFileSync(logPath, JSON.stringify(results, null, 2));
  }
})();
