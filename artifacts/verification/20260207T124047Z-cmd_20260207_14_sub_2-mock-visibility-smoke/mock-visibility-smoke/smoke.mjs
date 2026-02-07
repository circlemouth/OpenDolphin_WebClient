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
  const required = ['baseUrl', 'outDir', 'facilityId', 'userId', 'password', 'label', 'runId'];
  for (const key of required) {
    if (!map.get(key)) throw new Error(`missing --${key}`);
  }
  return {
    baseUrl: map.get('baseUrl'),
    outDir: map.get('outDir'),
    facilityId: map.get('facilityId'),
    userId: map.get('userId'),
    password: map.get('password'),
    label: map.get('label'),
    runId: map.get('runId'),
  };
};

const ensureDir = async (dir) => fs.mkdir(dir, { recursive: true });
const toSafe = (value) => String(value).replace(/[^a-zA-Z0-9_.-]+/g, '_');

const writeJson = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
};

const injectSession = async (context, params) => {
  const passwordMd5 = crypto.createHash('md5').update(params.password, 'utf8').digest('hex');
  const sessionKey = 'opendolphin:web-client:auth';
  const injectedSession = {
    facilityId: params.facilityId,
    userId: params.userId,
    displayName: params.userId,
    commonName: params.userId,
    clientUuid: 'playwright-mock-visibility',
    runId: params.runId,
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
  return { sessionKey, injectedSession };
};

const applyMaskStyle = async (page) => {
  // Mask PHI-like fields. Keep it simple: blur table rows and patient identifiers.
  await page.addStyleTag({
    content: `
      .reception-table__row,
      #charts-patient-summary,
      [data-test-id*="patient"],
      input[type="text"],
      input[type="search"] {
        filter: blur(10px) !important;
      }
    `,
  });
};

const keywordRegex = /\\b(mock|msw|fixture|seed|dummy|sample|lorem|test patient|stub|demo)\\b|モック|ダミー|サンプル|テスト|仮データ|固定データ/i;

const scanKeywords = async (page) => {
  const text = (await page.locator('body').innerText().catch(() => '')).slice(0, 200000);
  const lines = text
    .split(/\\r?\\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const hits = [];
  for (const line of lines) {
    if (!keywordRegex.test(line)) continue;
    // keep short evidence lines only
    hits.push(line.slice(0, 240));
    if (hits.length >= 40) break;
  }
  return { hitCount: hits.length, sampleLines: hits };
};

const gotoReception = async (page, base, facilityId) => {
  const facilityEnc = encodeURIComponent(facilityId);
  const url = `${base}/f/${facilityEnc}/reception`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Reception', { timeout: 15000 });
  return url;
};

const enterChartsFromReception = async (page) => {
  const rows = page.locator('tr.reception-table__row');
  await rows.first().waitFor({ timeout: 15000 });
  for (let i = 0; i < 12; i += 1) {
    const row = rows.nth(i);
    const text = (await row.innerText().catch(() => '')).trim();
    if (!text) continue;
    if (text.includes('未登録')) continue;
    await row.dblclick();
    break;
  }
  await page.waitForURL(/\/charts(\?|$)/, { timeout: 15000 });
  await page.waitForSelector('#charts-main', { timeout: 15000 });
  await page.waitForSelector('#soap-note-free', { timeout: 15000 });
};

const openChartsImagingTabIfExists = async (page) => {
  // Requires docked panel open.
  const candidates = [/画像/i, /imaging/i];
  for (const pattern of candidates) {
    const tab = page.getByRole('tab', { name: pattern });
    if ((await tab.count().catch(() => 0)) > 0) {
      const first = tab.first();
      await first.click({ force: true }).catch(() => {});
      await page.waitForTimeout(250);
      return true;
    }
  }
  return false;
};

const openMobileImages = async (page, base, facilityId) => {
  const facilityEnc = encodeURIComponent(facilityId);
  const url = `${base}/f/${facilityEnc}/m/images`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  return url;
};

const openPatients = async (page, base, facilityId) => {
  const facilityEnc = encodeURIComponent(facilityId);
  const url = `${base}/f/${facilityEnc}/patients`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  return url;
};

const openAdministration = async (page, base, facilityId) => {
  const facilityEnc = encodeURIComponent(facilityId);
  const url = `${base}/f/${facilityEnc}/administration`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  return url;
};

const openPrintOutpatient = async (page, base, facilityId) => {
  const facilityEnc = encodeURIComponent(facilityId);
  const url = `${base}/f/${facilityEnc}/charts/print/outpatient`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  return url;
};

const run = async () => {
  const params = parseArgs();
  const base = params.baseUrl.replace(/\/+$/, '');
  const outDir = path.resolve(params.outDir);
  const screenshotsDir = path.join(outDir, 'screenshots', toSafe(params.label));
  const harPath = path.join(outDir, 'har', `network-${toSafe(params.label)}.har`);
  await ensureDir(screenshotsDir);
  await ensureDir(path.dirname(harPath));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    recordHar: { path: harPath, content: 'embed' },
  });
  const injected = await injectSession(context, params);
  const page = await context.newPage();
  await applyMaskStyle(page);

  const pages = [];
  const capture = async (name) => {
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(name)}.png`), fullPage: false });
  };
  const notePage = async (screen, url) => {
    const keyword = await scanKeywords(page);
    const meta = {
      screen,
      url,
      finalUrl: page.url(),
      title: await page.title().catch(() => ''),
      receptionRowCount: await page.locator('tr.reception-table__row').count().catch(() => 0),
      chartsLoaded: (await page.locator('#charts-main').count().catch(() => 0)) > 0,
      mobileImagesLoaded: (await page.locator('[data-test-id=\"mobile-images-page\"]').count().catch(() => 0)) > 0,
      keyword,
    };
    pages.push({
      screen,
      url,
      finalUrl: meta.finalUrl,
      title: meta.title,
      receptionRowCount: meta.receptionRowCount,
      chartsLoaded: meta.chartsLoaded,
      mobileImagesLoaded: meta.mobileImagesLoaded,
      hitCount: keyword.hitCount,
      sampleLines: keyword.sampleLines,
    });
  };

  // Reception
  const receptionUrl = await gotoReception(page, base, params.facilityId);
  await notePage('Reception', receptionUrl);
  await capture('reception');

  // Charts
  await enterChartsFromReception(page);
  await notePage('Charts', page.url());
  await capture('charts');
  // Include docked panel state
  await page.keyboard.press('Control+Shift+U');
  await page.waitForTimeout(200);
  await notePage('Charts(docked)', page.url());
  await capture('charts-docked');
  const imagingOpened = await openChartsImagingTabIfExists(page);
  if (imagingOpened) {
    await notePage('Charts(docked:imaging)', page.url());
    await capture('charts-docked-imaging');
  }

  // Print
  const printUrl = await openPrintOutpatient(page, base, params.facilityId);
  await notePage('Print(outpatient)', printUrl);
  await capture('print-outpatient');

  // Patients
  const patientsUrl = await openPatients(page, base, params.facilityId);
  await notePage('Patients', patientsUrl);
  await capture('patients');

  // Administration
  const admUrl = await openAdministration(page, base, params.facilityId);
  await notePage('Administration', admUrl);
  await capture('administration');

  // Images / Mobile
  const mobileUrl = await openMobileImages(page, base, params.facilityId);
  await notePage('MobileImages', mobileUrl);
  await capture('mobile-images');

  await context.close();
  await browser.close();

  await writeJson(path.join(outDir, `run-${toSafe(params.label)}.json`), {
    label: params.label,
    baseUrl: base,
    facilityId: params.facilityId,
    userId: params.userId,
    injected,
    harFile: path.relative(outDir, harPath),
    screenshotsDir: path.relative(outDir, screenshotsDir),
    pages,
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, label: params.label, pages: pages.map((p) => ({ screen: p.screen, hitCount: p.hitCount })) }, null, 2));
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
