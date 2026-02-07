import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Resolve Playwright from `web-client/node_modules` even though this script lives under artifacts/.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webClientDir = path.resolve(__dirname, '../../../../web-client');
const require = createRequire(path.join(webClientDir, 'package.json'));
const { chromium } = require('@playwright/test');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const map = new Map();
  for (let i = 0; i < args.length; i += 1) {
    const key = args[i];
    if (!key?.startsWith('--')) continue;
    const value = args[i + 1];
    map.set(key.slice(2), value);
    i += 1;
  }
  const required = ['baseUrl', 'outDir', 'facilityId', 'userId', 'password'];
  for (const key of required) {
    if (!map.get(key)) throw new Error(`missing --${key}`);
  }
  return {
    baseUrl: map.get('baseUrl'),
    outDir: map.get('outDir'),
    facilityId: map.get('facilityId'),
    userId: map.get('userId'),
    password: map.get('password'),
  };
};

const ensureDir = async (dir) => fs.mkdir(dir, { recursive: true });

const injectSession = async (context, params) => {
  const passwordMd5 = crypto.createHash('md5').update(params.password, 'utf8').digest('hex');
  const sessionKey = 'opendolphin:web-client:auth';
  const injectedSession = {
    facilityId: params.facilityId,
    userId: params.userId,
    displayName: params.userId,
    commonName: params.userId,
    clientUuid: 'playwright-charts-ui-proposal',
    runId: 'charts-ui-proposal',
    role: 'doctor',
    roles: ['doctor', 'user'],
  };
  await context.addInitScript(
    ({ sessionKey, injectedSession, facilityId, userId, password, passwordMd5 }) => {
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(injectedSession));
        localStorage.setItem(sessionKey, JSON.stringify(injectedSession));
        localStorage.setItem('devFacilityId', facilityId);
        localStorage.setItem('devUserId', userId);
        localStorage.setItem('devPasswordMd5', passwordMd5);
        localStorage.setItem('devClientUuid', injectedSession.clientUuid);
        localStorage.setItem('devRole', injectedSession.role);
        sessionStorage.setItem('devPasswordPlain', password);
        sessionStorage.setItem('devFacilityId', facilityId);
        sessionStorage.setItem('devUserId', userId);
        sessionStorage.setItem('devPasswordMd5', passwordMd5);
        sessionStorage.setItem('devClientUuid', injectedSession.clientUuid);
        sessionStorage.setItem('devRole', injectedSession.role);
      } catch {
        // ignore storage failures
      }
    },
    {
      sessionKey,
      injectedSession,
      facilityId: params.facilityId,
      userId: params.userId,
      password: params.password,
      passwordMd5,
    },
  );
};

const captureAt = async (params, viewport, prefix) => {
  const base = params.baseUrl.replace(/\/+$/, '');
  const facilityEnc = encodeURIComponent(params.facilityId);
  const receptionUrl = `${base}/f/${facilityEnc}/reception`;
  const outDir = path.resolve(params.outDir);
  const screenshotsDir = path.join(outDir, 'screenshots');
  await ensureDir(screenshotsDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  await injectSession(context, params);
  const page = await context.newPage();

  await page.goto(receptionUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Reception', { timeout: 15000 });

  // Enter charts from a reception row. This avoids depending on URL params stability.
  const rows = page.locator('tr.reception-table__row');
  await rows.first().waitFor({ timeout: 15000 });
  let clicked = false;
  for (let i = 0; i < 12; i += 1) {
    const row = rows.nth(i);
    const text = (await row.innerText().catch(() => '')).trim();
    if (!text) continue;
    if (text.includes('未登録')) continue;
    await row.dblclick();
    clicked = true;
    break;
  }
  if (!clicked) await rows.first().dblclick();

  await page.waitForURL(/\/charts(\?|$)/, { timeout: 15000 });
  await page.waitForSelector('#charts-main', { timeout: 15000 });
  await page.waitForSelector('#soap-note-free', { timeout: 15000 });
  await page.waitForTimeout(300);

  // Viewport capture (exact resolution evidence)
  await page.screenshot({ path: path.join(screenshotsDir, `charts-${prefix}-viewport.png`), fullPage: false });
  // Full page capture (context for scrolling/structure)
  await page.screenshot({ path: path.join(screenshotsDir, `charts-${prefix}.png`), fullPage: true });

  // Include the right docked panel state too (common UI context for proposal).
  await page.keyboard.press('Control+Shift+U');
  await page.locator('#charts-docked-panel[data-open=\"true\"]').waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(screenshotsDir, `charts-docked-${prefix}-viewport.png`), fullPage: false });
  await page.screenshot({ path: path.join(screenshotsDir, `charts-docked-${prefix}.png`), fullPage: true });

  await context.close();
  await browser.close();
};

const run = async () => {
  const params = parseArgs();
  await captureAt(params, { width: 1366, height: 768 }, '1366x768');
  await captureAt(params, { width: 1440, height: 900 }, '1440x900');
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
