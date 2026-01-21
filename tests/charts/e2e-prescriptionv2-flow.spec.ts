import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../playwright/fixtures';
import { baseUrl, e2eAuthSession, seedAuthSession, withChartLock } from '../e2e/helpers/orcaMaster';
import { buildIncomeInfoXml, ORCA_ADDITIONAL_PDF_BYTES } from '../../web-client/src/mocks/fixtures/orcaAdditional';
import {
  buildAppointmentFixture,
  buildClaimFixture,
  buildVisitListFixture,
  type OutpatientFlagSet,
} from '../../web-client/src/mocks/fixtures/outpatient';

const RUN_ID = process.env.RUN_ID ?? '20260121T125056Z';
process.env.RUN_ID ??= RUN_ID;

const artifactDir =
  process.env.PLAYWRIGHT_ARTIFACT_DIR ??
  path.join(process.cwd(), 'artifacts', 'webclient', 'orca-e2e', '20260122', 'prescription');

const seedChartSession = async (page: Parameters<typeof withChartLock>[0]) => {
  const outpatientFlags: OutpatientFlagSet = {
    runId: 'RUN-E2E',
    cacheHit: false,
    missingMaster: false,
    dataSourceTransition: 'server',
    fallbackUsed: false,
  };

  await seedAuthSession(page);
  const facilityId = e2eAuthSession.credentials.facilityId;
  const userId = e2eAuthSession.credentials.userId;
  const passwordMd5 = e2eAuthSession.credentials.passwordMd5;
  const clientUuid = e2eAuthSession.credentials.clientUuid;

  await page.route('**/api01rv2/incomeinfv2', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/xml; charset=UTF-8',
      body: buildIncomeInfoXml(),
    }),
  );
  await page.route('**/orca/appointments/list', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildAppointmentFixture(outpatientFlags)),
    }),
  );
  await page.route('**/orca/visits/list', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildVisitListFixture(outpatientFlags)),
    }),
  );
  await page.route('**/orca/claim/outpatient', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildClaimFixture(outpatientFlags)),
    }),
  );

  await page.addInitScript(
    ({ storageKey, payload }) => {
      window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
    },
    {
      storageKey: `charts:orca-claim-send:${facilityId}:${userId}`,
      payload: {
        '000001': {
          patientId: '000001',
          appointmentId: 'A-1',
          invoiceNumber: 'INV-001',
          dataId: 'DATA-CLAIM-1',
          runId: 'RUN-CLAIM',
          traceId: 'TRACE-CLAIM',
          apiResult: '00',
          sendStatus: 'success',
          savedAt: '2026-01-22T09:00:00Z',
        },
      },
    },
  );
  await page.addInitScript(
    ({ storageKey, sessionKey, flags }) => {
      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify({ sessionKey, flags, updatedAt: new Date().toISOString() }),
      );
    },
    {
      storageKey: 'opendolphin:web-client:auth-flags',
      sessionKey: `${facilityId}:${userId}`,
      flags: outpatientFlags,
    },
  );
  await page.addInitScript(
    ({ facilityId, userId, passwordMd5, clientUuid }) => {
      window.localStorage.setItem('devFacilityId', facilityId);
      window.localStorage.setItem('devUserId', userId);
      if (passwordMd5) window.localStorage.setItem('devPasswordMd5', passwordMd5);
      if (clientUuid) window.localStorage.setItem('devClientUuid', clientUuid);
    },
    { facilityId, userId, passwordMd5, clientUuid },
  );

  await page.goto(
    `${baseUrl}/f/${facilityId}/charts?patientId=000001&appointmentId=APT-2401&visitDate=2026-01-22&msw=1`,
  );
  await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: '山田 花子' })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#charts-action-print')).toBeEnabled({ timeout: 20_000 });
};

test.use({
  ignoreHTTPSErrors: true,
  extraHTTPHeaders: {
    'x-msw-missing-master': '0',
    'x-msw-transition': 'server',
    'x-msw-cache-hit': '0',
    'x-msw-fallback-used': '0',
    'x-msw-run-id': RUN_ID,
  },
});

test('prescriptionv2 Data_Id 取得でPDFプレビューを表示する (MSW)', async ({ page }) => {
  fs.mkdirSync(artifactDir, { recursive: true });

  await withChartLock(page, async () => {
    await seedChartSession(page);

    await page.route('**/api01rv2/prescriptionv2', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          report: {
            Api_Result: '0000',
            Api_Result_Message: 'OK',
            Information_Date: '2026-01-22',
            Information_Time: '12:00:00',
            Data_Id: 'DATA-PRESCRIPTION',
            Form_ID: 'FORM-DATA-PRESCRIPTION',
            Form_Name: 'Prescription',
          },
        }),
      }),
    );
    await page.route('**/blobapi/DATA-PRESCRIPTION', (route) =>
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
        body: Buffer.from(ORCA_ADDITIONAL_PDF_BYTES),
      }),
    );

    await page.getByRole('button', { name: '印刷/エクスポート' }).click();
    const printDialog = page.locator('[data-test-id="charts-print-dialog"]');
    await expect(printDialog).toBeVisible({ timeout: 10_000 });
    await printDialog.getByLabel('帳票種別').selectOption('prescription');
    await expect(printDialog.getByLabel('伝票番号（Invoice_Number）*')).toHaveValue('INV-001');

    await printDialog.getByRole('button', { name: '開く' }).click();

    await page.waitForURL(/\/charts\/print\/document/);
    await expect(page.getByRole('heading', { name: '処方箋 PDFプレビュー' })).toBeVisible({ timeout: 20_000 });

    const pdfStart = Date.now();
    await expect(page.locator('iframe[title="ORCA帳票PDF"]')).toBeVisible({ timeout: 3000 });
    const pdfElapsed = Date.now() - pdfStart;
    expect(pdfElapsed).toBeLessThanOrEqual(3000);

    const pdfBytes = await page.evaluate(async () => {
      const response = await fetch('/blobapi/DATA-PRESCRIPTION');
      const buffer = await response.arrayBuffer();
      return Array.from(new Uint8Array(buffer));
    });
    fs.writeFileSync(path.join(artifactDir, 'prescriptionv2.pdf'), Buffer.from(pdfBytes));

    const auditEntry = await page.evaluate(() => {
      const events = (window as any).__AUDIT_EVENTS__ as Array<any> | undefined;
      if (!Array.isArray(events)) return null;
      return events.find((entry) => entry?.payload?.action === 'prescription_print');
    });
    expect(auditEntry?.payload?.details?.apiResult).toBe('0000');
    expect(auditEntry?.payload?.details?.invoiceNumber).toBe('INV-001');
    expect(auditEntry?.payload?.details?.dataId).toBe('DATA-PRESCRIPTION');

    await page.screenshot({
      path: path.join(artifactDir, 'prescription-preview.png'),
      fullPage: true,
    });
  });
});

test('prescriptionv2 Data_Id 未取得時にエラーバナーとローカル印刷導線を表示する (MSW)', async ({ page }) => {
  fs.mkdirSync(artifactDir, { recursive: true });

  await withChartLock(page, async () => {
    await seedChartSession(page);

    await page.route('**/api01rv2/prescriptionv2', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          report: {
            Api_Result: '0000',
            Api_Result_Message: 'OK',
            Information_Date: '2026-01-22',
            Information_Time: '12:00:00',
            Form_ID: 'FORM-EMPTY',
            Form_Name: 'Prescription',
          },
        }),
      }),
    );

    await page.getByRole('button', { name: '印刷/エクスポート' }).click();
    const printDialog = page.locator('[data-test-id="charts-print-dialog"]');
    await expect(printDialog).toBeVisible({ timeout: 10_000 });
    await printDialog.getByLabel('帳票種別').selectOption('prescription');
    await expect(printDialog.getByLabel('伝票番号（Invoice_Number）*')).toHaveValue('INV-001');

    await printDialog.getByRole('button', { name: '開く' }).click();

    const banner = page.locator('.charts-actions__banner .tone-banner__message');
    await expect(banner).toContainText('帳票出力に失敗', { timeout: 20_000 });
    await expect(page.getByText(/ローカル印刷/)).toBeVisible({ timeout: 20_000 });

    const auditEntry = await page.evaluate(() => {
      const events = (window as any).__AUDIT_EVENTS__ as Array<any> | undefined;
      if (!Array.isArray(events)) return null;
      return events.find((entry) => entry?.payload?.action === 'prescription_print');
    });
    expect(auditEntry?.payload?.details?.apiResult).toBe('0000');
    expect(auditEntry?.payload?.details?.invoiceNumber).toBe('INV-001');
    expect(auditEntry?.payload?.details?.dataId).toBe('DATA-CLAIM-1');

    await page.screenshot({
      path: path.join(artifactDir, 'prescription-missing-data-id.png'),
      fullPage: true,
    });
  });
});
