import fs from 'node:fs';
import path from 'node:path';

import { test, expect, type Page } from '../playwright/fixtures';
import { baseUrl, seedAuthSession } from './helpers/orcaMaster';

const RUN_ID = process.env.RUN_ID ?? '20260122T015836Z';
const TRACE_ID = process.env.TRACE_ID ?? `trace-${RUN_ID}`;
const ARTIFACT_ROOT =
  process.env.PLAYWRIGHT_ARTIFACT_DIR ?? 'artifacts/webclient/orca-e2e/20260123/fullflow';

const FACILITY_ID = '1.3.6.1.4.1.9414.72.103';

test.use({ trace: 'off', serviceWorkers: 'allow' });

const ensureDir = (target: string) => {
  fs.mkdirSync(target, { recursive: true });
};

const artifactPath = (name: string) => {
  ensureDir(ARTIFACT_ROOT);
  return path.join(ARTIFACT_ROOT, name);
};

const startTrace = async (page: Page, name: string) => {
  const traceDir = artifactPath('traces');
  ensureDir(traceDir);
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  return path.join(traceDir, name);
};

const stopTrace = async (page: Page, outputPath: string) => {
  await page.context().tracing.stop({ path: outputPath });
};

const setupSession = async (page: Page) => {
  await seedAuthSession(page);
  await page.addInitScript(({ runId }) => {
    window.localStorage.setItem('devFacilityId', '1.3.6.1.4.1.9414.72.103');
    window.localStorage.setItem('devUserId', 'doctor1');
    window.localStorage.setItem('devPasswordMd5', '632080fabdb968f9ac4f31fb55104648');
    window.localStorage.setItem('devClientUuid', 'e2e-playwright');
    window.localStorage.setItem('devRole', 'admin');
    window.sessionStorage.setItem(
      'opendolphin:web-client:auth',
      JSON.stringify({
        facilityId: '1.3.6.1.4.1.9414.72.103',
        userId: 'doctor1',
        role: 'admin',
        runId,
        clientUuid: 'e2e-playwright',
      }),
    );
    window.sessionStorage.setItem(
      'opendolphin:web-client:auth-flags',
      JSON.stringify({
        sessionKey: '1.3.6.1.4.1.9414.72.103:doctor1',
        flags: {
          runId,
          cacheHit: true,
          missingMaster: false,
          dataSourceTransition: 'server',
          fallbackUsed: false,
        },
        updatedAt: new Date().toISOString(),
      }),
    );
    const approvalPrefix = 'opendolphin:web-client:charts:approval:v1:';
    Object.keys(window.localStorage).forEach((key) => {
      if (key.startsWith(approvalPrefix)) {
        window.localStorage.removeItem(key);
      }
    });
  }, { runId: RUN_ID });
};

const setupBaseRoutes = async (page: Page) => {
  await page.route('**/api/user/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        facilityId: FACILITY_ID,
        userId: 'doctor1',
        displayName: 'E2E Doctor',
        roles: ['admin'],
      }),
    }),
  );

  const adminConfig = {
    runId: RUN_ID,
    chartsDisplayEnabled: true,
    chartsSendEnabled: true,
    chartsMasterSource: 'auto',
    verified: true,
    source: 'mock',
  };
  await page.route('**/api/admin/config', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminConfig) }),
  );
  await page.route('**/api/admin/delivery', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminConfig) }),
  );
};

const setObservabilityMeta = async (page: Page) => {
  await page.evaluate(
    async ({ runId, traceId }) => {
      const mod = await import('/src/libs/observability/observability');
      mod.updateObservabilityMeta({ runId, traceId, cacheHit: true, missingMaster: false, dataSourceTransition: 'server' });
    },
    { runId: RUN_ID, traceId: TRACE_ID },
  );
};

const gotoReception = async (page: Page) => {
  await page.goto(`${baseUrl}/f/${encodeURIComponent(FACILITY_ID)}/reception?msw=1`);
  await ensureMswControlled(page);
  const controllerUrl = await page.evaluate(() => navigator.serviceWorker?.controller?.scriptURL ?? '');
  expect(controllerUrl).toContain('mockServiceWorker');
  await expect(page.locator('[data-test-id="reception-accept-form"]')).toBeVisible({ timeout: 20_000 });
};

const ensureMswControlled = async (page: Page) => {
  const registrationFound = await page
    .waitForFunction(() => navigator.serviceWorker.getRegistrations().then((regs) => regs.length > 0), null, {
      timeout: 10_000,
    })
    .then(() => true)
    .catch(() => false);

  if (!registrationFound) {
    // MSW が登録されない場合は、そのまま終了して後続のエラーで検知する。
    return;
  }

  try {
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 5_000 });
    return;
  } catch {
    // First load may not be controlled; reload once to attach the MSW service worker.
  }
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 10_000 });
};

const openChartsFromRow = async (page: Page, matcher: RegExp) => {
  const row = page.getByRole('row', { name: matcher });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.dblclick();
  await expect(page).toHaveURL(/charts/);
  await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });
};

test.describe('ORCA E2E full flow (reception → send → report)', () => {
  test('受付登録→診療終了→ORCA送信→処方箋プレビュー (Api_Result=00)', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const started = Date.now();

    await page.context().setExtraHTTPHeaders({
      'x-msw-run-id': RUN_ID,
      'x-msw-cache-hit': '1',
      'x-msw-missing-master': '0',
      'x-msw-transition': 'server',
      'x-msw-fallback-used': '0',
    });

    await setupBaseRoutes(page);
    await setupSession(page);
    const tracePath = await startTrace(page, `${RUN_ID}-fullflow-success-${testInfo.repeatEachIndex}.zip`);

    await gotoReception(page);
    await setObservabilityMeta(page);

    const acceptForm = page.locator('[data-test-id="reception-accept-form"]');
    await acceptForm.getByLabel(/患者ID/).fill('000001');
    await acceptForm.getByLabel(/保険\/自費/).selectOption('self');
    await acceptForm.getByLabel(/来院区分/).selectOption('1');
    await Promise.all([
      page.waitForSelector('.tone-banner--info', { timeout: 10_000 }),
      acceptForm.getByRole('button', { name: '受付送信' }).click(),
    ]);
    const acceptBanner = page.locator('.reception-accept .tone-banner');
    await expect(acceptBanner).toContainText('受付登録が完了しました');
    await expect(acceptBanner).toContainText('Api_Result=00');
    await expect(
      page.locator('[data-test-id="accept-api-result"], [data-test-id="accept-duration-ms"]'),
    ).toHaveCount(2);

    await openChartsFromRow(page, /山田\s*花子/);
    const meta = page.locator('[data-test-id="charts-topbar-meta"]');
    await expect(meta).toHaveAttribute('data-run-id', RUN_ID);
    await expect(meta).toHaveAttribute('data-trace-id', TRACE_ID);

    await page.getByRole('button', { name: '診療終了' }).click();
    const toast = page.locator('.charts-actions__toast');
    await expect(toast).toContainText('診療終了を完了', { timeout: 15_000 });

    await page.getByRole('button', { name: 'ORCA 送信' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'ORCA送信の確認' });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: '送信する' }).click();
    await expect(toast).toContainText('ORCA送信を完了', { timeout: 15_000 });
    await expect(toast).toContainText(/Invoice_Number=/);
    await expect(toast).toContainText(/Data_Id=/);

    await page.evaluate(() => {
      const approvalPrefix = 'opendolphin:web-client:charts:approval:v1:';
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(approvalPrefix)) localStorage.removeItem(key);
      });
    });
    await page.reload();
    await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: '印刷/エクスポート' }).click();
    const printDialog = page.getByRole('dialog', { name: '印刷/帳票出力の確認' });
    await expect(printDialog).toBeVisible({ timeout: 10_000 });
    await page.getByLabel('帳票種別').selectOption('prescription');
    await page.getByLabel('伝票番号（Invoice_Number）*').fill('INV-000001');
    await printDialog.getByRole('button', { name: '開く' }).click();

    await page.waitForURL(/charts\/print\/document/);
    await expect(page.getByText('処方箋 PDFプレビュー')).toBeVisible();
    await expect(page.getByText('Data_Id=DATA-PRESCRIPTIONV2')).toBeVisible();
    await expect(page.locator('.charts-print__pdf-preview iframe')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: '閉じる' }).click();
    await expect(page).toHaveURL(/charts/);

    await page.goto(`${baseUrl}/f/${encodeURIComponent(FACILITY_ID)}/reception?msw=1&patientId=000001`);
    const receptionRow = page.getByRole('row', { name: /山田\s*花子/ });
    await expect(receptionRow).toContainText('invoice: INV-000001');
    await expect(receptionRow).toContainText('data: DATA-000001');

    const durationMs = Date.now() - started;
    const notePath = artifactPath('notes/fullflow-success.md');
    ensureDir(path.dirname(notePath));
    fs.writeFileSync(
      notePath,
      [
        `# ORCA Fullflow Success (${RUN_ID})`,
        `- traceId: ${TRACE_ID}`,
        `- durationMs: ${durationMs}`,
        `- artifactDir: ${ARTIFACT_ROOT}`,
      ].join('\n'),
      'utf8',
    );

    expect(durationMs).toBeLessThan(120_000);
    await stopTrace(page, tracePath);
  });

  test('Api_Result=21 警告と再送キュー、Api_Result=0001 帳票エラーを検証', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const started = Date.now();

    await page.context().setExtraHTTPHeaders({
      'x-msw-run-id': RUN_ID,
      'x-msw-cache-hit': '1',
      'x-msw-missing-master': '0',
      'x-msw-transition': 'server',
      'x-msw-fallback-used': '0',
      'x-msw-fault': 'api-21,api-0001',
    });

    await setupBaseRoutes(page);
    await setupSession(page);
    const tracePath = await startTrace(page, `${RUN_ID}-fullflow-warning-${testInfo.repeatEachIndex}.zip`);

    await gotoReception(page);
    await setObservabilityMeta(page);

    const acceptForm = page.locator('[data-test-id="reception-accept-form"]');
    await acceptForm.getByLabel(/患者ID/).fill('00021');
    await acceptForm.getByLabel(/保険\/自費/).selectOption('self');
    await acceptForm.getByLabel(/来院区分/).selectOption('1');
    await acceptForm.getByRole('button', { name: '受付送信' }).click();
    const warningBanner = page.locator('.reception-accept .tone-banner');
    await expect(warningBanner).toContainText('受付なし');
    await expect(warningBanner).toContainText('Api_Result=21');

    await openChartsFromRow(page, /山田\s*花子/);
    const retryResponsePromise = page.waitForResponse((response) => {
      const url = response.url();
      return url.includes('/api/orca/queue') && url.includes('retry=1');
    });

    await page.getByRole('button', { name: 'ORCA 送信' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'ORCA送信の確認' });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: '送信する' }).click();

    const retryResponse = await retryResponsePromise;
    const retryJson = (await retryResponse.json()) as Record<string, unknown>;
    expect(retryJson.retryRequested).toBe(true);
    expect(retryJson.retryApplied).toBe(true);
    expect(retryJson.retryReason).toBe('msw-retry');

    const sendBanner = page.locator('.charts-actions__banner .tone-banner--warning');
    await expect(sendBanner).toContainText('ORCA送信に警告/失敗', { timeout: 15_000 });
    await expect(sendBanner).toContainText('Api_Result=21');

    await page.evaluate(() => {
      const approvalPrefix = 'opendolphin:web-client:charts:approval:v1:';
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(approvalPrefix)) localStorage.removeItem(key);
      });
    });
    await page.reload();
    await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: '印刷/エクスポート' }).click();
    const printDialog = page.getByRole('dialog', { name: '印刷/帳票出力の確認' });
    await expect(printDialog).toBeVisible({ timeout: 10_000 });
    await page.getByLabel('帳票種別').selectOption('prescription');
    await page.getByLabel('伝票番号（Invoice_Number）*').fill('INV-000001');
    await printDialog.getByRole('button', { name: '開く' }).click();

    const errorBanner = page.locator('.charts-actions__banner .tone-banner--error');
    await expect(errorBanner).toContainText('帳票出力に失敗', { timeout: 15_000 });
    await expect(errorBanner).toContainText('apiResult=0001');

    const durationMs = Date.now() - started;
    const notePath = artifactPath('notes/fullflow-warning.md');
    ensureDir(path.dirname(notePath));
    fs.writeFileSync(
      notePath,
      [
        `# ORCA Fullflow Warning (${RUN_ID})`,
        `- traceId: ${TRACE_ID}`,
        `- durationMs: ${durationMs}`,
        `- artifactDir: ${ARTIFACT_ROOT}`,
      ].join('\n'),
      'utf8',
    );

    expect(durationMs).toBeLessThan(120_000);
    await stopTrace(page, tracePath);
  });
});
