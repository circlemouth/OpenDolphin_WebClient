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
const { chromium, devices } = require('@playwright/test');

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
  const required = ['baseUrl', 'outDir', 'facilityId', 'userId', 'password', 'patientId', 'runId'];
  for (const key of required) {
    if (!map.get(key)) throw new Error(`missing --${key}`);
  }
  return {
    baseUrl: map.get('baseUrl'),
    outDir: map.get('outDir'),
    facilityId: map.get('facilityId'),
    userId: map.get('userId'),
    password: map.get('password'),
    patientId: map.get('patientId'),
    runId: map.get('runId'),
  };
};

const ensureDir = async (dir) => fs.mkdir(dir, { recursive: true });
const toSafe = (value) => String(value).replace(/[^a-zA-Z0-9_.-]+/g, '_');

const writeJson = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
};

const writeFileIfMissing = async (filePath, buf) => {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, buf);
  }
};

const tinyPngBytes = Buffer.from(
  // 1x1 transparent png
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2N0AAAAASUVORK5CYII=',
  'base64',
);

const injectSession = async (context, params) => {
  const passwordMd5 = crypto.createHash('md5').update(params.password, 'utf8').digest('hex');
  const sessionKey = 'opendolphin:web-client:auth';
  const injectedSession = {
    facilityId: params.facilityId,
    userId: params.userId,
    displayName: params.userId,
    commonName: params.userId,
    clientUuid: 'playwright-mobile-images',
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
  // Mask PHI-like fields in screenshots (patientId/status).
  await page.addStyleTag({
    content: `
      [data-test-id="mobile-images-status"],
      [data-test-id="mobile-patient-id-input"] {
        filter: blur(10px) !important;
      }
    `,
  });
};

const installBinaryRoutes = async (context, params) => {
  // Satisfy thumbnail/download links under MSW list payload.
  await context.route('**/mock/thumbnail/**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
      body: tinyPngBytes,
    });
  });
  await context.route('**/openDolphin/resources/patients/**/images/**', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="${toSafe(params.patientId)}.png"`,
      },
      body: tinyPngBytes,
    });
  });
};

const runScenario = async (params, scenario) => {
  const base = params.baseUrl.replace(/\/+$/, '');
  const facilityEnc = encodeURIComponent(params.facilityId);
  const url = `${base}/f/${facilityEnc}/m/images`;

  const outDir = path.resolve(params.outDir);
  const screenshotsDir = path.join(outDir, 'screenshots', scenario.label);
  await ensureDir(screenshotsDir);

  const tinyUploadPath = path.join(outDir, 'assets', 'tiny.png');
  const largeUploadPath = path.join(outDir, 'assets', 'large.png');
  await ensureDir(path.dirname(tinyUploadPath));
  await writeFileIfMissing(tinyUploadPath, tinyPngBytes);
  // MSW handler returns 413 when file size > 5MiB. Content validity is irrelevant for this check.
  await writeFileIfMissing(largeUploadPath, Buffer.alloc(6 * 1024 * 1024, 0));

  const harPath = path.join(outDir, scenario.harName);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...scenario.device,
    recordHar: { path: harPath, content: 'embed' },
  });
  const injected = await injectSession(context, params);
  await installBinaryRoutes(context, params);

  const requestLog = [];
  const responseLog = [];
  const page = await context.newPage();
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/patients/') || url.includes('/openDolphin/resources/patients/') || url.includes('/mock/thumbnail/')) {
      requestLog.push({
        ts: Date.now(),
        method: req.method(),
        url,
        headers: req.headers(),
        resourceType: req.resourceType(),
      });
    }
  });
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('/patients/') || url.includes('/openDolphin/resources/patients/') || url.includes('/mock/thumbnail/')) {
      responseLog.push({
        ts: Date.now(),
        status: res.status(),
        url,
      });
    }
  });

  const forced413 = scenario.force413Once ? 1 : 0;

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-test-id="mobile-images-page"]', { timeout: 15000 });
  await applyMaskStyle(page);
  await page.screenshot({ path: path.join(screenshotsDir, '01-open.png'), fullPage: true });

  // Patient identify (patient ID input).
  await page.fill('[data-test-id="mobile-patient-id-input"]', params.patientId);
  await page.click('[data-test-id="mobile-patient-commit"]');
  await page.waitForSelector(`[data-test-id="mobile-images-status"]:has-text("patientId=")`, { timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotsDir, '02-patient-selected.png'), fullPage: true });

  // Verify accept/capture attrs.
  const captureInput = page.locator('[data-test-id="mobile-image-capture-input"]');
  const fileInput = page.locator('[data-test-id="mobile-image-file-input"]');
  const attrs = {
    captureAccept: await captureInput.getAttribute('accept'),
    captureCapture: await captureInput.getAttribute('capture'),
    fileAccept: await fileInput.getAttribute('accept'),
    fileCapture: await fileInput.getAttribute('capture'),
  };
  await page.screenshot({ path: path.join(screenshotsDir, '03-capture-attrs.png'), fullPage: true });

  // Pick file (use file input as "upload substitute") and send.
  if (scenario.force413Once) {
    // Error+retry case: 413 via large file, then retry with a small image.
    await fileInput.setInputFiles(largeUploadPath);
    await page.waitForSelector('[data-test-id="mobile-image-preview"]', { timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '04-file-selected-large.png'), fullPage: true });

    await page.click('[data-test-id="mobile-image-send"]');
    await page.waitForSelector('[data-test-id="mobile-images-status"]:has-text("413")', { timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '05-error-413.png'), fullPage: true });

    // Retry
    await page.click('[data-test-id="mobile-image-retry"]');
    await page.waitForSelector('[data-test-id="mobile-images-status"]:has-text("再送信")', { timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '06-retry-ready.png'), fullPage: true });

    // Switch to a valid small image for the retry attempt.
    await fileInput.setInputFiles(tinyUploadPath);
    await page.waitForSelector('[data-test-id="mobile-image-preview"]', { timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '06b-retry-file-selected.png'), fullPage: true });
    await page.click('[data-test-id="mobile-image-send"]');
  } else {
    await fileInput.setInputFiles(tinyUploadPath);
    await page.waitForSelector('[data-test-id="mobile-image-preview"]', { timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, '04-file-selected.png'), fullPage: true });

    await page.click('[data-test-id="mobile-image-send"]');
  }

  await page.waitForSelector('[data-test-id="mobile-images-status"]:has-text("送信しました")', { timeout: 15000 });
  await page.waitForSelector('[data-test-id="mobile-images-list"] li', { timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotsDir, '07-upload-success-list.png'), fullPage: true });

  // Download/preview: opens a popup tab (target=_blank). We prove the link loads.
  const downloadLink = page.locator('[data-test-id="mobile-images-download-link"]').first();
  const hasDownload = (await downloadLink.count()) > 0;
  let popupStatus = null;
  if (hasDownload) {
    const [popup] = await Promise.all([page.waitForEvent('popup'), downloadLink.click()]);
    await popup.waitForLoadState('domcontentloaded');
    await popup.waitForTimeout(250);
    await popup.screenshot({ path: path.join(screenshotsDir, '08-download-popup.png'), fullPage: true });
    popupStatus = { url: popup.url() };
    await popup.close().catch(() => {});
  }

  await context.close();
  await browser.close();

  const result = {
    label: scenario.label,
    deviceName: scenario.deviceName,
    url,
    injected,
    patientIdMasked: true,
    patientIdLength: params.patientId.length,
    attrs,
    forced413Triggered: forced413,
    popupStatus,
    harFile: scenario.harName,
    screenshotsDir: path.relative(outDir, screenshotsDir),
    requestLogCount: requestLog.length,
    responseLogCount: responseLog.length,
  };
  await writeJson(path.join(outDir, `run-${scenario.label}.json`), {
    ...result,
    requestLog,
    responseLog,
  });
  return result;
};

const run = async () => {
  const params = parseArgs();
  const outDir = path.resolve(params.outDir);
  await ensureDir(outDir);

  const scenarios = [
    {
      label: 'iphone',
      deviceName: 'iPhone 13',
      device: devices['iPhone 13'],
      harName: 'network.har',
      force413Once: true,
    },
    {
      label: 'android',
      deviceName: 'Pixel 5',
      device: devices['Pixel 5'],
      harName: 'network-android.har',
      force413Once: false,
    },
    {
      label: 'ipad',
      deviceName: 'iPad (gen 7)',
      device: devices['iPad (gen 7)'],
      harName: 'network-ipad.har',
      force413Once: false,
    },
  ];

  const meta = {
    runId: params.runId,
    baseUrl: params.baseUrl,
    facilityId: params.facilityId,
    userId: params.userId,
    patientIdMasked: true,
    startedAtUtc: new Date().toISOString(),
  };
  await writeJson(path.join(outDir, 'meta.json'), meta);

  const results = [];
  for (const scenario of scenarios) {
    // Run sequentially (avoid parallel flakiness and ensure error+retry evidence is deterministic).
    // eslint-disable-next-line no-await-in-loop
    const res = await runScenario(params, scenario);
    results.push(res);
  }

  await writeJson(path.join(outDir, 'summary.json'), {
    ...meta,
    finishedAtUtc: new Date().toISOString(),
    results,
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, outDir, results }, null, 2));
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
