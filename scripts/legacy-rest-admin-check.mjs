import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const RUN_ID = process.env.RUN_ID ?? '20260114T135802Z';
const BASE_URL = process.env.WEB_CLIENT_BASE_URL ?? 'http://localhost:5173';
const FACILITY_ID = process.env.LEGACY_REST_FACILITY_ID ?? 'LOCAL.FACILITY.0001';
const USER_ID = process.env.LEGACY_REST_USER_ID ?? 'dolphin';
const PASSWORD_MD5 = process.env.LEGACY_REST_PASSWORD_MD5 ?? '36cdf8b887a5cffc78dcd5c08991b993';
const CLIENT_UUID = process.env.LEGACY_REST_CLIENT_UUID ?? 'legacy-rest-client';
const OUTPUT_DIR = process.env.LEGACY_REST_OUTPUT_DIR ?? `artifacts/webclient/legacy-rest/${RUN_ID}`;

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const main = async () => {
  await ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.addInitScript((payload) => {
    const { facilityId, userId, passwordMd5, clientUuid, runId } = payload;
    const session = {
      facilityId,
      userId,
      clientUuid,
      runId,
      role: 'system_admin',
      roles: ['system_admin'],
    };
    sessionStorage.setItem('opendolphin:web-client:auth', JSON.stringify(session));
    localStorage.setItem('devFacilityId', facilityId);
    localStorage.setItem('devUserId', userId);
    localStorage.setItem('devPasswordMd5', passwordMd5);
    localStorage.setItem('devClientUuid', clientUuid);
    localStorage.setItem('devRole', 'system_admin');
  }, {
    facilityId: FACILITY_ID,
    userId: USER_ID,
    passwordMd5: PASSWORD_MD5,
    clientUuid: CLIENT_UUID,
    runId: RUN_ID,
  });

  const targetUrl = `${BASE_URL}/f/${encodeURIComponent(FACILITY_ID)}/administration`;
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('.admin-legacy-rest__row', { timeout: 30000 });

  const row = page.locator('.admin-legacy-rest__row', { hasText: '/serverinfo' }).first();
  const button = row.getByRole('button', { name: '疎通確認' });
  await button.click();

  const statusLocator = row.locator('.admin-legacy-rest__actions .status-message');
  await statusLocator.waitFor({ timeout: 10000 });

  const statusText = await statusLocator.innerText();
  const auditEvents = await page.evaluate(() => (window).__AUDIT_EVENTS__ ?? []);
  const legacyEvents = auditEvents.filter((entry) => entry?.payload?.legacy);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'legacy-rest-admin.png'),
    fullPage: true,
  });

  const report = {
    runId: RUN_ID,
    url: targetUrl,
    statusText,
    legacyEvents: legacyEvents.slice(0, 3),
  };

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'legacy-rest-admin-check.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );

  await browser.close();
};

main().catch((error) => {
  console.error('[legacy-rest-admin-check] failed', error);
  process.exit(1);
});
