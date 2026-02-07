import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseDir = process.env.BASE_DIR;
const port = Number(process.env.PORT);
if (!baseDir) throw new Error('BASE_DIR missing');
if (!Number.isFinite(port)) throw new Error('PORT missing');

const baseUrl = `http://127.0.0.1:${port}`;
const session = {
  facilityId: '0001',
  userId: 'user01',
  displayName: 'user01',
  commonName: 'user01',
  clientUuid: 'e2e-client-uuid',
  runId: 'RUN-STAMP-001',
  role: 'doctor',
  roles: ['doctor'],
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();

const network = [];
page.on('response', (res) => {
  const url = res.url();
  if (url.includes('/touch/stamp') || url.includes('/touch/stampTree') || url.includes('/user/')) {
    network.push({ url, status: res.status() });
  }
});

await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
await page.evaluate((payload) => {
  const { session, facilityId, userId } = payload;
  window.sessionStorage.setItem('opendolphin:web-client:auth', JSON.stringify(session));
  window.localStorage.setItem('devFacilityId', facilityId);
  window.localStorage.setItem('devUserId', userId);
}, { session, facilityId: session.facilityId, userId: session.userId });

await page.goto(`${baseUrl}/f/${encodeURIComponent(session.facilityId)}/charts`, { waitUntil: 'domcontentloaded' });
await page.locator('.charts-docked-panel').waitFor({ timeout: 30_000 });

const tabNames = await page.getByRole('tab').allTextContents();
await fs.writeFile(path.join(baseDir, 'debug-tab-names.txt'), tabNames.join('\n'));

await page.screenshot({ path: path.join(baseDir, 'charts-before-open-stamps.png'), fullPage: true });

const stampsTab = page.locator('button[data-utility-action="stamps"]');
await stampsTab.waitFor({ timeout: 30_000 });
await stampsTab.click();

const panel = page.locator('[data-test-id="stamp-library-panel"]');
await panel.waitFor({ timeout: 30_000 });
await page.getByText('サーバースタンプ', { exact: false }).first().waitFor({ timeout: 30_000 });
await page.screenshot({ path: path.join(baseDir, 'charts-stamp-library-phase2.png'), fullPage: true });

await page.getByRole('button', { name: /降圧セット/ }).click({ timeout: 30_000 });
await page.getByText('memo: 注意事項', { exact: false }).waitFor({ timeout: 30_000 });
await page.screenshot({ path: path.join(baseDir, 'charts-stamp-library-preview.png'), fullPage: true });

await fs.writeFile(path.join(baseDir, 'network-stamp-endpoints.json'), JSON.stringify(network, null, 2));

await context.close();
await browser.close();
