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
  clientUuid: 'ui-proposal-client-uuid',
  runId: '20260207T121235Z',
  role: 'doctor',
  roles: ['doctor'],
};

const viewports = [
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
];

const browser = await chromium.launch();

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();

  // Seed auth/session to bypass login UI.
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((payload) => {
    const { session, facilityId, userId } = payload;
    window.sessionStorage.setItem('opendolphin:web-client:auth', JSON.stringify(session));
    window.localStorage.setItem('devFacilityId', facilityId);
    window.localStorage.setItem('devUserId', userId);
    // Avoid storing any password in artifacts; MSW does not require auth.
    window.localStorage.removeItem('devPasswordPlain');
    window.localStorage.removeItem('devPasswordMd5');
  }, { session, facilityId: session.facilityId, userId: session.userId });

  const chartsUrl = `${baseUrl}/f/${encodeURIComponent(session.facilityId)}/charts?patientId=01415&receptionId=RCPT-1415&appointmentId=APT-1415&visitDate=2026-02-07&msw=1`;
  await page.goto(chartsUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#charts-main').waitFor({ timeout: 30_000 });
  await page.locator('#charts-topbar').waitFor({ timeout: 30_000 });

  await page.screenshot({ path: path.join(baseDir, 'screenshots', `${viewport.name}-current.png`) });

  const mockPath = path.join(baseDir, 'mock-proposal-c.html');
  await page.goto(`file://${mockPath}`, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(baseDir, 'screenshots', `${viewport.name}-mock.png`) });

  await context.close();
}

await browser.close();
