import path from 'node:path';
import { chromium } from 'playwright';

const baseDir = process.env.BASE_DIR;
const port = Number(process.env.PORT);
if (!baseDir) throw new Error('BASE_DIR missing');
if (!Number.isFinite(port)) throw new Error('PORT missing');

const baseUrl = `http://127.0.0.1:${port}`;

const session = {
  facilityId: '0001',
  userId: 'doctor1',
  displayName: 'doctor1',
  commonName: 'doctor1',
  clientUuid: 'msw-banner-client-uuid',
  runId: 'RUN-MSW-BANNER',
  role: 'doctor',
  roles: ['doctor'],
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(`${baseUrl}/login?msw=1`, { waitUntil: 'domcontentloaded' });

await page.evaluate((payload) => {
  const { session, facilityId, userId } = payload;
  window.sessionStorage.setItem('opendolphin:web-client:auth', JSON.stringify(session));
  window.localStorage.setItem('devFacilityId', facilityId);
  window.localStorage.setItem('devUserId', userId);
  window.localStorage.removeItem('devPasswordPlain');
  window.localStorage.removeItem('devPasswordMd5');
}, { session, facilityId: session.facilityId, userId: session.userId });

await page.goto(`${baseUrl}/f/${encodeURIComponent(session.facilityId)}/reception?msw=1`, { waitUntil: 'domcontentloaded' });
await page.locator('[data-test-id="mock-mode-banner"]').waitFor({ timeout: 30_000 });
await page.screenshot({ path: path.join(baseDir, 'screenshots', 'msw-on-banner.png'), fullPage: true });

await context.close();
await browser.close();
