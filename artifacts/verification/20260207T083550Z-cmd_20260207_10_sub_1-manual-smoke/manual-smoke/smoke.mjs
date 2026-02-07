import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import { chromium } from '@playwright/test';

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
  const required = ['baseUrl', 'outDir', 'facilityId', 'userId', 'password', 'label', 'flagsJson'];
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
    flagsJson: map.get('flagsJson'),
  };
};

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const writeJson = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
};

const toSafe = (value) => value.replace(/[^a-zA-Z0-9_.-]+/g, '_');

const run = async () => {
  const args = parseArgs();
  const facilityEnc = encodeURIComponent(args.facilityId);
  const base = args.baseUrl.replace(/\/+$/, '');
  const outDir = path.resolve(args.outDir);
  const screenshotsDir = path.join(outDir, 'screenshots');
  await ensureDir(screenshotsDir);

  const flags = JSON.parse(args.flagsJson);
  await writeJson(path.join(outDir, 'flags.json'), flags);

  const harPath = path.join(outDir, 'network.har');
  const browser = await chromium.launch({ headless: true });
  const passwordMd5 = crypto.createHash('md5').update(args.password, 'utf8').digest('hex');
  const injectedRunId = flags?.runId ?? `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
  const sessionKey = 'opendolphin:web-client:auth';
  const injectedSession = {
    facilityId: args.facilityId,
    userId: args.userId,
    displayName: args.userId,
    commonName: args.userId,
    clientUuid: 'playwright-smoke',
    runId: injectedRunId,
    role: 'doctor',
    roles: ['doctor', 'user'],
  };

  const context = await browser.newContext({
    recordHar: { path: harPath, content: 'embed' },
    viewport: { width: 1366, height: 768 },
  });
  await context.addInitScript(({ sessionKey, injectedSession, facilityId, userId, password, passwordMd5 }) => {
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
  }, {
    sessionKey,
    injectedSession,
    facilityId: args.facilityId,
    userId: args.userId,
    password: args.password,
    passwordMd5,
  });
  const page = await context.newPage();

  const requests = [];
  const responses = [];
  page.on('request', (req) => {
    requests.push({
      ts: Date.now(),
      method: req.method(),
      url: req.url(),
      resourceType: req.resourceType(),
    });
  });
  page.on('response', (res) => {
    responses.push({
      ts: Date.now(),
      status: res.status(),
      url: res.url(),
    });
  });

  const step = [];
  const note = (line, meta) => {
    step.push(meta ? `${line} ${JSON.stringify(meta)}` : line);
  };

  note('inject session (skip /api/user login)', { sessionKey, injectedSession });

  const receptionUrl = `${base}/f/${facilityEnc}/reception`;
  note('open reception', { url: receptionUrl });
  await page.goto(receptionUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Reception', { timeout: 15000 });
  const receptionStatusMvpCount = await page.locator('[data-test-id="reception-status-mvp"]').count();
  const receptionRetryCount = await page.locator('[data-test-id="reception-status-mvp-retry"]').count();
  await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(args.label)}-reception.png`), fullPage: true });

  note('open charts from first row (dblclick)');
  const rows = page.locator('tr.reception-table__row');
  await rows.first().waitFor({ timeout: 15000 });
  let clicked = false;
  for (let i = 0; i < 12; i += 1) {
    const row = rows.nth(i);
    const text = (await row.innerText().catch(() => '')).trim();
    if (!text) continue;
    // Prefer rows that have patientId (avoid "未登録" entries).
    if (text.includes('未登録')) continue;
    note('select reception row', { index: i, summary: text.slice(0, 140) });
    await row.dblclick();
    clicked = true;
    break;
  }
  if (!clicked) {
    note('fallback: select first reception row (patientId may be missing)');
    await rows.first().dblclick();
  }
  await page.waitForURL(/\/charts(\?|$)/, { timeout: 15000 });
  await page.waitForSelector('#charts-main', { timeout: 15000 });
  await page.waitForSelector('#soap-note-free', { timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(args.label)}-charts.png`), fullPage: true });

  // Utility panel: Ctrl+Shift+U
  note('open docked utility panel (Ctrl+Shift+U)');
  await page.keyboard.press('Control+Shift+U');
  await page.locator('#charts-docked-panel[data-open=\"true\"]').waitFor({ timeout: 15000 });

  // ORDER: open order-edit
  note('open utility tab: order-edit');
  const orderTab = page.getByRole('tab', { name: /オーダー編集/ });
  await orderTab.click({ force: true });
  await page.locator('#charts-docked-panel[data-open=\"true\"]').waitFor({ timeout: 15000 });
  const bundleNameInput = page.locator('#charts-docked-panel input[id$="-bundle-name"]').first();
  const bundleNameVisible = await bundleNameInput.isVisible().catch(() => false);
  if (!bundleNameVisible) {
    note('order-edit: bundle name input not visible (patient not selected or panel not opened?)');
  }
  await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(args.label)}-order-edit.png`), fullPage: true });

  // If MVP entity selector exists, flip once to prove it works.
  const entitySelect = page.locator('#charts-order-edit-entity');
  if (await entitySelect.count()) {
    note('order-edit MVP entity switch: generalOrder -> treatmentOrder');
    await entitySelect.selectOption('treatmentOrder');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(args.label)}-order-edit-treatment.png`), fullPage: true });
  } else {
    note('order-edit MVP entity selector not present');
  }

  // STAMP: open stamps tab if present.
  const stampsTab = page.getByRole('tab', { name: /スタンプ/ });
  if (await stampsTab.count()) {
    note('open utility tab: stamps');
    await stampsTab.click({ force: true });
    await page.locator('[data-test-id=\"stamp-library-panel\"]').waitFor({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(args.label)}-stamps.png`), fullPage: true });

    // Select first server stamp if exists; else select first button inside panel.
    const panel = page.locator('[data-test-id=\"stamp-library-panel\"]');
    const firstStampButton = panel.locator('section[aria-label^=\"サーバースタンプ\"] button').first();
    if (await firstStampButton.count()) {
      note('select first server stamp (for preview)');
      await firstStampButton.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(args.label)}-stamps-selected.png`), fullPage: true });

      const copyBtn = panel.getByRole('button', { name: /クリップボードへコピー/ });
      const openOrderBtn = panel.getByRole('button', { name: /オーダー編集を開く/ });
      if (await copyBtn.isEnabled()) {
        note('phase2: copy stamp to clipboard');
        await copyBtn.click({ force: true });
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(args.label)}-stamps-copied.png`), fullPage: true });
      } else {
        note('phase1: copy disabled (expected)');
      }

      if (await openOrderBtn.count() && (await openOrderBtn.isEnabled())) {
        note('phase2: open order-edit from stamp panel');
        await openOrderBtn.click({ force: true });
        await page.locator('#charts-docked-panel[data-open=\"true\"]').waitFor({ timeout: 15000 });
        await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(args.label)}-order-edit-from-stamps.png`), fullPage: true });

        // Try paste within OrderBundleEditPanel if button exists.
        const pasteBtn = page.getByRole('button', { name: 'スタンプペースト' });
        if (await pasteBtn.count()) {
          note('paste stamp into order edit');
          await pasteBtn.click({ force: true });
          await page.waitForTimeout(300);
          await page.screenshot({ path: path.join(screenshotsDir, `${toSafe(args.label)}-order-edit-pasted.png`), fullPage: true });
        }
      }
    } else {
      note('no server stamp buttons found (unexpected if stamp seed exists)');
    }
  } else {
    note('stamps tab not present (baseline expected)');
  }

  // Minimal network assertions for this smoke.
  const claimOutpatient = requests.filter((r) => r.url.includes('/orca/claim/outpatient'));
  const keyEndpoints = [
    '/orca/order/bundles',
    '/api/orca/queue',
    '/touch/stampTree',
    '/touch/stamp/',
    '/user/',
    '/orca/visits/list',
    '/orca/appointments/list',
  ];
  const keyHits = Object.fromEntries(
    keyEndpoints.map((p) => [p, requests.filter((r) => r.url.includes(p)).length]),
  );

  const summary = {
    label: args.label,
    baseUrl: base,
    facilityId: args.facilityId,
    flags,
    claimOutpatientCalled: claimOutpatient.length > 0,
    claimOutpatientRequests: claimOutpatient.slice(0, 5),
    requestCount: requests.length,
    responseCount: responses.length,
    ui: {
      receptionStatusMvpCount,
      receptionRetryCount,
      orderEditEntitySelectorPresent: (await entitySelect.count()) > 0,
      orderEditBundleNameInputVisible: bundleNameVisible,
    },
    keyEndpointHits: keyHits,
    firstRequests: requests.slice(0, 12),
  };
  await writeJson(path.join(outDir, 'network-summary.json'), summary);

  await fs.writeFile(path.join(outDir, 'steps.md'), step.map((l) => `- ${l}`).join('\n') + '\n', 'utf8');
  await context.close();
  await browser.close();
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
