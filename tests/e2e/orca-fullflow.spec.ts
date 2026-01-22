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
  await expect(page.locator('[data-test-id="reception-accept-form"]')).toBeVisible({ timeout: 20_000 });
};

const registerOutpatientMocks = async (page: Page) => {
  const now = new Date();
  const baseFlags = {
    runId: RUN_ID,
    traceId: TRACE_ID,
    cacheHit: true,
    missingMaster: false,
    dataSourceTransition: 'server',
    fallbackUsed: false,
    fetchedAt: now.toISOString(),
    recordsReturned: 1,
  };

  await page.route('**/orca/appointments/list**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...baseFlags,
        appointmentDate: now.toISOString().slice(0, 10),
        slots: [
          {
            appointmentId: 'APT-2401',
            appointmentTime: '0910',
            departmentName: '01 内科',
            physicianName: '医師',
            patient: {
              patientId: '000001',
              wholeName: '山田 花子',
              wholeNameKana: 'ヤマダ ハナコ',
              birthDate: '1985-04-12',
              sex: 'F',
            },
            visitInformation: '受付テスト',
            medicalInformation: '受付テスト',
          },
        ],
        reservations: [],
      }),
    }),
  );

  await page.route('**/orca/visits/list**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...baseFlags, visitDate: now.toISOString().slice(0, 10), visits: [] }),
    }),
  );

  await page.route('**/orca/claim/outpatient**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...baseFlags,
        claimStatus: '診療中',
        claimStatusText: '計算済み',
        bundles: [
          {
            bundleNumber: 'BUNDLE-1',
            patientId: '000001',
            appointmentId: 'APT-2401',
            claimStatus: '会計待ち',
            invoiceNumber: 'INV-000001',
            dataId: 'DATA-000001',
          },
        ],
        queueEntries: [],
      }),
    }),
  );

  await page.route('**/orca/patients/local-search**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...baseFlags, patients: [] }),
    }),
  );

  await page.route('**/orca21/medicalmodv2/outpatient**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...baseFlags, recordsReturned: 0, outpatientList: [] }),
    }),
  );

  await page.route('**/api01rv2/incomeinfv2**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/xml',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<xmlio2>
  <incomeinfv2res>
    <Api_Result>00</Api_Result>
    <Api_Result_Message>OK</Api_Result_Message>
    <Information_Date>${now.toISOString().slice(0, 10)}</Information_Date>
    <Information_Time>${now.toISOString().slice(11, 19)}</Information_Time>
    <Income_Information>
      <Income_Information_child>
        <Perform_Date>${now.toISOString().slice(0, 10)}</Perform_Date>
        <Invoice_Number>INV-000001</Invoice_Number>
        <Insurance_Combination_Number>0001</Insurance_Combination_Number>
        <Department_Name>内科</Department_Name>
      </Income_Information_child>
    </Income_Information>
  </incomeinfv2res>
</xmlio2>`,
    }),
  );

  await page.route('**/api/orca/queue**', (route) => {
    const url = new URL(route.request().url());
    const retryRequested = url.searchParams.get('retry') === '1';
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        runId: RUN_ID,
        traceId: TRACE_ID,
        retryRequested,
        retryApplied: retryRequested ? true : undefined,
        retryReason: retryRequested ? 'msw-retry' : undefined,
        patientId: url.searchParams.get('patientId') ?? undefined,
        source: 'mock',
        fetchedAt: now.toISOString(),
        queue: [],
      }),
    });
  });

  await page.route('**/orca/visits/mutation**', async (route) => {
    const payload = JSON.parse(route.request().postData() ?? '{}') as Record<string, any>;
    const patientId = payload.patientId ?? '000001';
    const requestNumber = payload.requestNumber ?? '01';
    const isWarning = patientId === '00021';
    const apiResult = isWarning ? '21' : '00';
    const acceptanceId = isWarning ? undefined : payload.acceptanceId ?? `A-${patientId}-MSW`;
    const body = {
      apiResult,
      apiResultMessage: isWarning ? '受付が存在しません' : '正常終了',
      runId: RUN_ID,
      traceId: TRACE_ID,
      requestId: `msw-${Date.now()}`,
      dataSourceTransition: 'mock',
      cacheHit: false,
      missingMaster: false,
      fetchedAt: now.toISOString(),
      acceptanceId,
      acceptanceDate: payload.acceptanceDate ?? now.toISOString().slice(0, 10),
      acceptanceTime: payload.acceptanceTime ?? now.toISOString().slice(11, 19),
      departmentCode: payload.departmentCode ?? '01',
      physicianCode: payload.physicianCode ?? '1001',
      medicalInformation: payload.medicalInformation ?? (requestNumber === '02' ? '受付取消' : '外来受付'),
      requestNumber,
      patient: {
        patientId,
        name: payload.patientName ?? 'MSW 患者',
        kana: payload.patientKana ?? 'エムエスダブリュ',
        birthDate: '1990-01-01',
        sex: 'F',
      },
      warnings: isWarning ? ['受付が見つかりません'] : [],
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
      headers: { 'x-run-id': RUN_ID, 'x-trace-id': TRACE_ID },
    });
  });
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
      'x-msw-scenario': 'cache-hit',
      'x-msw-run-id': RUN_ID,
      'x-msw-cache-hit': '1',
      'x-msw-missing-master': '0',
      'x-msw-transition': 'server',
      'x-msw-fallback-used': '0',
    });

    await setupBaseRoutes(page);
    await setupSession(page);
    await registerOutpatientMocks(page);
    const tracePath = await startTrace(page, `${RUN_ID}-fullflow-success-${testInfo.repeatEachIndex}.zip`);

    await page.route('**/api21/medicalmodv2**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/xml',
        body: [
          '<xmlio2>',
          '  <medicalres>',
          '    <Api_Result>00</Api_Result>',
          '    <Api_Result_Message>OK</Api_Result_Message>',
          `    <Information_Date>${new Date().toISOString().slice(0, 10)}</Information_Date>`,
          `    <Information_Time>${new Date().toISOString().slice(11, 19)}</Information_Time>`,
          '    <Invoice_Number>INV-000001</Invoice_Number>',
          '    <Data_Id>DATA-000001</Data_Id>',
          '  </medicalres>',
          '</xmlio2>',
        ].join(''),
      }),
    );
    await page.route('**/api21/medicalmodv23**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/xml',
        body: [
          '<xmlio2>',
          '  <medicalmodv23res>',
          '    <Api_Result>00</Api_Result>',
          '    <Api_Result_Message>OK</Api_Result_Message>',
          `    <Information_Date>${new Date().toISOString().slice(0, 10)}</Information_Date>`,
          `    <Information_Time>${new Date().toISOString().slice(11, 19)}</Information_Time>`,
          '  </medicalmodv23res>',
          '</xmlio2>',
        ].join(''),
      }),
    );
    await page.route('**/api01rv2/prescriptionv2**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          report: {
            Api_Result: '0000',
            Api_Result_Message: 'OK',
            Data_Id: 'DATA-PRESCRIPTIONV2',
            Form_ID: 'FORM-DATA-PRESCRIPTIONV2',
            Form_Name: 'Prescription',
          },
        }),
      }),
    );
    await page.route('**/blobapi/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<<>>\nstartxref\n0\n%%EOF'),
      }),
    );

    await gotoReception(page);
    await setObservabilityMeta(page);

    const acceptForm = page.locator('[data-test-id="reception-accept-form"]');
    await acceptForm.getByLabel(/患者ID/).fill('000123');
    await acceptForm.getByLabel(/保険\/自費/).selectOption('self');
    await acceptForm.getByLabel(/来院区分/).selectOption('1');
    await Promise.all([
      page.waitForSelector('.tone-banner--info', { timeout: 10_000 }),
      acceptForm.getByRole('button', { name: '受付送信' }).click(),
    ]);
    const acceptBanner = page.locator('.reception-accept .tone-banner');
    await expect(acceptBanner).toContainText('受付登録が完了しました');
    await expect(acceptBanner).toContainText('Api_Result=00');

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
      'x-msw-scenario': 'cache-hit',
      'x-msw-run-id': RUN_ID,
      'x-msw-cache-hit': '1',
      'x-msw-missing-master': '0',
      'x-msw-transition': 'server',
      'x-msw-fallback-used': '0',
    });

    await setupBaseRoutes(page);
    await setupSession(page);
    await registerOutpatientMocks(page);
    const tracePath = await startTrace(page, `${RUN_ID}-fullflow-warning-${testInfo.repeatEachIndex}.zip`);

    await page.route('**/api21/medicalmodv2**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/xml',
        body: [
          '<xmlio2>',
          '  <medicalres>',
          '    <Api_Result>21</Api_Result>',
          '    <Api_Result_Message>警告</Api_Result_Message>',
          `    <Information_Date>${new Date().toISOString().slice(0, 10)}</Information_Date>`,
          `    <Information_Time>${new Date().toISOString().slice(11, 19)}</Information_Time>`,
          '    <Invoice_Number>INV-000001</Invoice_Number>',
          '    <Data_Id>DATA-000001</Data_Id>',
          '  </medicalres>',
          '</xmlio2>',
        ].join(''),
      }),
    );
    await page.route('**/api21/medicalmodv23**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/xml',
        body: [
          '<xmlio2>',
          '  <medicalmodv23res>',
          '    <Api_Result>00</Api_Result>',
          '    <Api_Result_Message>OK</Api_Result_Message>',
          `    <Information_Date>${new Date().toISOString().slice(0, 10)}</Information_Date>`,
          `    <Information_Time>${new Date().toISOString().slice(11, 19)}</Information_Time>`,
          '  </medicalmodv23res>',
          '</xmlio2>',
        ].join(''),
      }),
    );
    await page.route('**/api01rv2/prescriptionv2**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          report: {
            Api_Result: '0001',
            Api_Result_Message: '帳票データなし',
          },
        }),
      }),
    );

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
