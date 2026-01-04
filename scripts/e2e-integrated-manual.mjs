import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const runId = process.env.RUN_ID ?? new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const facilityId = process.env.E2E_FACILITY_ID ?? '0001';
const userId = process.env.E2E_USER_ID ?? 'doctor1';
const passwordMd5 = process.env.E2E_PASSWORD_MD5 ?? '632080fabdb968f9ac4f31fb55104648';
const outDir = path.resolve('artifacts/validation/e2e/screenshots');
const logDir = path.resolve('artifacts/validation/e2e/logs');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(logDir, { recursive: true });

const logLines = [];
const log = (message) => {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  logLines.push(line);
};

const writeLog = () => {
  fs.writeFileSync(path.join(logDir, `${runId}-manual-e2e.log`), `${logLines.join('\n')}\n`);
};

const screenshotPath = (name) => path.join(outDir, `${runId}-${name}.png`);

const screenshotIfVisible = async (locator, name) => {
  try {
    if (await locator.isVisible({ timeout: 5000 })) {
      await locator.screenshot({ path: screenshotPath(name) });
      log(`screenshot: ${name}`);
      return true;
    }
  } catch (err) {
    log(`screenshot skipped (${name}): ${err.message}`);
  }
  return false;
};

const screenshotPage = async (page, name) => {
  await page.screenshot({ path: screenshotPath(name), fullPage: true });
  log(`screenshot: ${name} (full page)`);
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const sessionKey = 'opendolphin:web-client:auth';
  const sessionPayload = {
    facilityId,
    userId,
    displayName: 'E2E Manual',
    clientUuid: 'e2e-manual',
    runId,
    role: 'doctor',
    roles: ['doctor'],
  };
  await context.addInitScript(([key, session, stored]) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
    window.localStorage.setItem('devFacilityId', stored.facilityId);
    window.localStorage.setItem('devUserId', stored.userId);
    window.localStorage.setItem('devPasswordMd5', stored.passwordMd5);
    window.localStorage.setItem('devClientUuid', stored.clientUuid);
  }, [sessionKey, sessionPayload, { facilityId, userId, passwordMd5, clientUuid: sessionPayload.clientUuid }]);
  const page = await context.newPage();

  log(`baseUrl=${baseUrl}`);

  const facilityBase = `/f/${encodeURIComponent(facilityId)}`;
  await page.goto(`${baseUrl}/login?msw=1`, { waitUntil: 'domcontentloaded' });
  const returnButton = page.getByRole('button', { name: '現在の施設へ戻る' });
  try {
    await Promise.all([
      page.waitForURL(`**${facilityBase}/reception**`, { timeout: 20000 }),
      returnButton.click({ timeout: 20000, force: true }),
    ]);
    await page.waitForSelector('.reception-page', { timeout: 20000 });
  } catch (err) {
    log(`reception load failed: ${page.url()}`);
    await screenshotPage(page, 'reception-not-ready');
    throw err;
  }
  log('session seeded and reception loaded');

  // Reception: exception list / queue status / audit search
  await screenshotPage(page, 'reception-overview');
  await screenshotIfVisible(page.locator('section[aria-label="例外一覧"]'), 'reception-exceptions');
  await screenshotIfVisible(page.locator('[aria-label^="ORCAキュー"]').first(), 'reception-queue-status');
  await screenshotIfVisible(page.locator('section[aria-label="監査履歴検索"]'), 'reception-audit-search');

  // Navigate to Charts from Reception to ensure encounter context
  await context.setExtraHTTPHeaders({
    'x-msw-scenario': 'cache-hit',
    'X-Run-Id': runId,
  });
  const firstRow = page.getByRole('row', { name: /山田/ });
  let chartsNavigated = false;
  if (await firstRow.isVisible().catch(() => false)) {
    try {
      await Promise.all([
        page.waitForURL('**/charts**', { timeout: 20000 }),
        firstRow.dblclick(),
      ]);
      chartsNavigated = true;
    } catch (err) {
      log(`charts navigation via double click failed: ${err.message}`);
    }
  }
  if (!chartsNavigated) {
    const chartsLink = page.getByRole('link', { name: /カルテ|Charts/i });
    try {
      await Promise.all([
        page.waitForURL('**/charts**', { timeout: 20000 }),
        chartsLink.click({ timeout: 20000, force: true }),
      ]);
      chartsNavigated = true;
    } catch (err) {
      log(`charts navigation via nav link failed: ${err.message}`);
    }
  }

  // Charts: send + print + recovery (timeout -> retry)
  await context.setExtraHTTPHeaders({
    'x-msw-scenario': 'cache-hit',
    'X-Run-Id': runId,
  });
  try {
    await page.waitForSelector('.charts-page', { timeout: 20000 });
  } catch (err) {
    log(`charts load failed: ${page.url()}`);
    await screenshotPage(page, 'charts-not-ready');
    throw err;
  }
  await screenshotPage(page, 'charts-overview');

  const sendButton = page.getByRole('button', { name: 'ORCA 送信' });
  if (await sendButton.isVisible()) {
    if (await sendButton.isEnabled()) {
      await sendButton.click();
      const sendDialog = page.locator('[data-test-id="charts-send-dialog"]');
      try {
        await sendDialog.waitFor({ timeout: 10000 });
        await screenshotPage(page, 'charts-send-confirm');
        await sendDialog.getByRole('button', { name: /キャンセル|閉じる/ }).first().click().catch(() => {});
        if (await sendDialog.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape').catch(() => {});
        }
      } catch (err) {
        log(`send dialog not visible: ${err.message}`);
        await screenshotPage(page, 'charts-send-dialog-missing');
      }
    } else {
      await screenshotPage(page, 'charts-send-disabled');
    }
  }

  const printButton = page.locator('#charts-action-print');
  if (await printButton.isVisible()) {
    if (await printButton.isEnabled()) {
      await printButton.click();
      try {
        const printDialog = page.locator('[data-test-id="charts-print-dialog"]');
        await printDialog.waitFor({ timeout: 10000 });
        await screenshotPage(page, 'charts-print-dialog');
        const closeButton = printDialog.getByRole('button', { name: /閉じる|キャンセル|戻る|閉じて/ }).first();
        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click().catch(() => {});
        } else {
          await page.keyboard.press('Escape').catch(() => {});
        }
        if (await printDialog.isVisible().catch(() => false)) {
          await page.keyboard.press('Escape').catch(() => {});
        }
      } catch (err) {
        log(`print dialog not visible: ${err.message}`);
        await screenshotPage(page, 'charts-print-dialog-missing');
      }
    } else {
      await screenshotPage(page, 'charts-print-disabled');
    }
  }

  // Inject timeout fault and recover
  await context.setExtraHTTPHeaders({
    'x-msw-scenario': 'cache-hit',
    'x-msw-fault': 'timeout',
    'X-Run-Id': runId,
  });
  const orcaActions = page.locator('[aria-label="OrcaSummary アクション"]');
  if (await orcaActions.isVisible()) {
    await page.keyboard.press('Escape').catch(() => {});
    await orcaActions.getByRole('button', { name: '再取得' }).click();
    await page.waitForTimeout(1500);
    await screenshotPage(page, 'charts-retry-error');
  }

  await context.setExtraHTTPHeaders({
    'x-msw-scenario': 'cache-hit',
    'X-Run-Id': runId,
  });
  if (await orcaActions.isVisible()) {
    await orcaActions.getByRole('button', { name: '再取得' }).click();
    await page.waitForTimeout(1500);
    await screenshotPage(page, 'charts-retry-recovered');
  }

  // Patients: missing master warning + audit search
  await context.setExtraHTTPHeaders({
    'x-msw-scenario': 'patient-missing-master',
    'X-Run-Id': runId,
    'X-Cache-Hit': 'false',
    'X-Missing-Master': 'true',
    'X-DataSource-Transition': 'server',
    'X-Fallback-Used': 'false',
  });
  await page.goto(`${baseUrl}${facilityBase}/patients?msw=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.patients-page', { timeout: 20000 });
  await screenshotPage(page, 'patients-overview');
  await screenshotIfVisible(page.locator('.patients-page__block').first(), 'patients-missing-master-block');
  await screenshotIfVisible(page.locator('[aria-label="監査検索"]'), 'patients-audit-search');

  // Administration: delivery status / guard / audit (admin role in new context)
  const adminContext = await browser.newContext({ ignoreHTTPSErrors: true });
  const adminSession = {
    facilityId,
    userId: 'admin',
    displayName: 'E2E Admin',
    clientUuid: 'e2e-admin',
    runId,
    role: 'admin',
    roles: ['admin'],
  };
  await adminContext.addInitScript(([key, session, stored]) => {
    window.sessionStorage.setItem(key, JSON.stringify(session));
    window.localStorage.setItem('devFacilityId', stored.facilityId);
    window.localStorage.setItem('devUserId', stored.userId);
    window.localStorage.setItem('devPasswordMd5', stored.passwordMd5);
    window.localStorage.setItem('devClientUuid', stored.clientUuid);
  }, [sessionKey, adminSession, { facilityId, userId: 'admin', passwordMd5, clientUuid: adminSession.clientUuid }]);
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`${baseUrl}/login?msw=1`, { waitUntil: 'domcontentloaded' });
  const adminReturn = adminPage.getByRole('button', { name: '現在の施設へ戻る' });
  await Promise.all([
    adminPage.waitForURL(`**${facilityBase}/reception**`, { timeout: 20000 }),
    adminReturn.click({ timeout: 20000, force: true }),
  ]);
  const adminLink = adminPage.getByRole('link', { name: /Administration/i });
  await Promise.all([
    adminPage.waitForURL('**/administration**', { timeout: 20000 }),
    adminLink.click({ timeout: 20000, force: true }),
  ]);
  await adminPage.waitForSelector('[data-test-id="administration-page"]', { timeout: 20000 });
  await screenshotPage(adminPage, 'administration-overview');
  await adminContext.close();

  // Capture audit events from window for memo
  const auditUiState = await page.evaluate(() => (window).__AUDIT_UI_STATE__ ?? []);
  const auditEvents = await page.evaluate(() => (window).__AUDIT_EVENTS__ ?? []);
  fs.writeFileSync(
    path.join(logDir, `${runId}-audit-ui-state.json`),
    JSON.stringify(auditUiState, null, 2),
  );
  fs.writeFileSync(
    path.join(logDir, `${runId}-audit-events.json`),
    JSON.stringify(auditEvents, null, 2),
  );
  log(`audit logs saved: ${runId}-audit-ui-state.json, ${runId}-audit-events.json`);

  await browser.close();
  writeLog();
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
