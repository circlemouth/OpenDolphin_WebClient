import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173';
const facilityId = process.env.FACILITY_ID ?? '1.3.6.1.4.1.9414.10.1';
const userId = process.env.USER_ID ?? 'dolphindev';
const password = process.env.PASSWORD ?? 'dolphindev';
const outDir = process.env.OUT_DIR ?? '.';

async function login(page, useMsw) {
  const query = useMsw ? '?msw=1' : '';
  await page.goto(`${baseUrl}/login${query}`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('施設ID').fill(facilityId);
  await page.getByLabel('ユーザーID').fill(userId);
  await page.getByLabel('パスワード').fill(password);
  await Promise.all([
    page.waitForURL('**/reception**', { timeout: 20000 }),
    page.getByRole('button', { name: 'ログイン' }).click(),
  ]);
}

async function capturePage(page, slug) {
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, `${slug}.png`), fullPage: true });
}

async function runProfile(profileLabel, useMsw) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleLogs = [];
  const requestFailures = [];
  const responseErrors = [];

  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('requestfailed', (req) => {
    requestFailures.push(`[requestfailed] ${req.method()} ${req.url()} ${req.failure()?.errorText ?? ''}`);
  });
  page.on('response', (res) => {
    const status = res.status();
    if (status >= 400) {
      responseErrors.push(`[response ${status}] ${res.request().method()} ${res.url()}`);
    }
  });

  await login(page, useMsw);
  await capturePage(page, `${profileLabel}-reception`);

  await page.goto(`${baseUrl}/f/${encodeURIComponent(facilityId)}/charts`, { waitUntil: 'domcontentloaded' });
  await capturePage(page, `${profileLabel}-charts`);

  await page.goto(`${baseUrl}/f/${encodeURIComponent(facilityId)}/patients`, { waitUntil: 'domcontentloaded' });
  await capturePage(page, `${profileLabel}-patients`);

  await page.goto(`${baseUrl}/f/${encodeURIComponent(facilityId)}/administration`, { waitUntil: 'domcontentloaded' });
  await capturePage(page, `${profileLabel}-administration`);

  await page.goto(`${baseUrl}/f/${encodeURIComponent(facilityId)}/charts/print/outpatient`, { waitUntil: 'domcontentloaded' });
  await capturePage(page, `${profileLabel}-charts-print-outpatient`);

  await page.goto(`${baseUrl}/f/${encodeURIComponent(facilityId)}/charts/print/document`, { waitUntil: 'domcontentloaded' });
  await capturePage(page, `${profileLabel}-charts-print-document`);

  await page.goto(`${baseUrl}/f/${encodeURIComponent(facilityId)}/debug`, { waitUntil: 'domcontentloaded' });
  await capturePage(page, `${profileLabel}-debug`);

  await page.goto(`${baseUrl}/f/${encodeURIComponent(facilityId)}/debug/outpatient-mock`, { waitUntil: 'domcontentloaded' });
  await capturePage(page, `${profileLabel}-debug-outpatient-mock`);

  await page.goto(`${baseUrl}/f/${encodeURIComponent(facilityId)}/debug/orca-api`, { waitUntil: 'domcontentloaded' });
  await capturePage(page, `${profileLabel}-debug-orca-api`);

  await page.goto(`${baseUrl}/f/${encodeURIComponent(facilityId)}/debug/legacy-rest`, { waitUntil: 'domcontentloaded' });
  await capturePage(page, `${profileLabel}-debug-legacy-rest`);

  fs.writeFileSync(path.join(outDir, `${profileLabel}-console.log`), consoleLogs.join('\n'));
  fs.writeFileSync(path.join(outDir, `${profileLabel}-requestfailed.log`), requestFailures.join('\n'));
  fs.writeFileSync(path.join(outDir, `${profileLabel}-response-errors.log`), responseErrors.join('\n'));

  await browser.close();
}

await runProfile('msw-on', true);
await runProfile('msw-off', false);
