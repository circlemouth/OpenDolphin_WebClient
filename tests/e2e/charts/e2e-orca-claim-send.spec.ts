import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../../playwright/fixtures';
import { baseUrl, seedAuthSession } from '../helpers/orcaMaster';

const RUN_ID = process.env.RUN_ID ?? '20260120T203313Z';

test.describe('ORCA公式経路 送信本線化 (medicalmodv2→medicalmodv23)', () => {
  test('伝票番号とData_Idを取得してトースト表示する', async ({ page }) => {
    const telemetryLogs: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (text.includes('[telemetry]')) {
        telemetryLogs.push(text);
      }
    });
    await page.context().setExtraHTTPHeaders({
      'x-msw-scenario': 'cache-hit',
      'x-msw-cache-hit': '1',
      'x-msw-missing-master': '0',
      'x-msw-transition': 'server',
      'x-msw-fallback-used': '0',
    });
    await page.route('**/api/user/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          facilityId: '0001',
          userId: 'doctor1',
          displayName: 'Playwright Doctor',
          roles: ['doctor'],
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
    const baseFlags = {
      runId: RUN_ID,
      traceId: `trace-${RUN_ID}`,
      cacheHit: true,
      missingMaster: false,
      dataSourceTransition: 'server',
      fallbackUsed: false,
    };
    await page.route('**/orca/claim/outpatient', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...baseFlags,
          recordsReturned: 1,
          bundles: [
            {
              bundleNumber: 'BUNDLE-1',
              patientId: '000001',
              appointmentId: 'APT-2401',
              claimStatus: '会計待ち',
            },
          ],
          queueEntries: [],
        }),
      }),
    );
    await page.route('**/orca/appointments/list', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...baseFlags,
          appointmentDate: '2026-01-20',
          slots: [
            {
              appointmentId: 'APT-2401',
              appointmentTime: '0910',
              departmentName: '01 内科',
              departmentCode: '01',
              patient: {
                patientId: '000001',
                wholeName: '山田 花子',
                wholeNameKana: 'ヤマダ ハナコ',
                birthDate: '1985-04-12',
                sex: 'F',
              },
            },
          ],
          reservations: [],
          visits: [],
        }),
      }),
    );
    await page.route('**/orca/visits/list', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...baseFlags, visits: [] }),
      }),
    );
    await page.route('**/orca/patients/local-search**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...baseFlags, patients: [] }),
      }),
    );
    await page.route('**/orca21/medicalmodv2/outpatient', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...baseFlags, recordsReturned: 0, outpatientList: [] }),
      }),
    );
    await page.route('**/api01rv2/incomeinfv2', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/xml',
        body: '<xmlio2><incomeinfv2res><Api_Result>00</Api_Result></incomeinfv2res></xmlio2>',
      }),
    );
    await page.route('**/api01rv2/pusheventgetv2', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pusheventgetv2res: { Api_Result: '0000', Api_Result_Message: 'OK', Event_Information: [] },
        }),
      }),
    );
    const medicalmodv2Xml = [
      '<xmlio2>',
      '  <medicalres>',
      '    <Api_Result>00</Api_Result>',
      '    <Api_Result_Message>OK</Api_Result_Message>',
      '    <Information_Date>2026-01-20</Information_Date>',
      '    <Information_Time>09:00:00</Information_Time>',
      '    <Invoice_Number>INV-000001</Invoice_Number>',
      '    <Data_Id>DATA-000001</Data_Id>',
      '  </medicalres>',
      '</xmlio2>',
    ].join('');
    const medicalmodv23Xml = [
      '<xmlio2>',
      '  <medicalmodv23res>',
      '    <Api_Result>00</Api_Result>',
      '    <Api_Result_Message>OK</Api_Result_Message>',
      '    <Information_Date>2026-01-20</Information_Date>',
      '    <Information_Time>09:00:00</Information_Time>',
      '  </medicalmodv23res>',
      '</xmlio2>',
    ].join('');
    await page.route('**/api21/medicalmodv2**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/xml',
        body: medicalmodv2Xml,
      }),
    );
    await page.route('**/api21/medicalmodv23**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/xml',
        body: medicalmodv23Xml,
      }),
    );
    await page.route('**/orca/queue', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...baseFlags, source: 'mock', fetchedAt: new Date().toISOString(), queue: [] }),
      }),
    );
    await page.route('**/orca/disease/import/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
    );
    await seedAuthSession(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('devFacilityId', '0001');
      window.localStorage.setItem('devUserId', 'doctor1');
      window.localStorage.setItem('devPasswordMd5', '632080fabdb968f9ac4f31fb55104648');
      const approvalPrefix = 'opendolphin:web-client:charts:approval:v1:';
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith(approvalPrefix)) {
          window.localStorage.removeItem(key);
        }
      });
    });
    const facilityId = '1.3.6.1.4.1.9414.72.103';
    await page.goto(
      `${baseUrl}/f/${facilityId}/charts?msw=1&patientId=000001&appointmentId=APT-2401&visitDate=2026-01-20`,
    );
    await expect(page.locator('[data-test-id="charts-actionbar"]')).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/charts/, { timeout: 10_000 });

    // ORCA送信を実行
    await page.getByRole('button', { name: 'ORCA 送信' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'ORCA送信の確認' });
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: '送信する' }).click();

    const toast = page.locator('.charts-actions__toast');
    await expect(toast).toContainText('ORCA送信を完了', { timeout: 10_000 });
    await expect(toast).toContainText('Invoice_Number', { timeout: 10_000 });
    await expect(toast).toContainText('Data_Id', { timeout: 10_000 });

    // 監査メタが runId を含むことを確認（aria 属性で確認）
    const statusLine = page.locator('.charts-actions__status');
    await expect(statusLine).toHaveText(/runId=/, { timeout: 5_000 });

    const artifactRoot = process.env.PLAYWRIGHT_ARTIFACT_DIR ?? 'artifacts/webclient/orca-e2e/20260121/claim-send';
    const telemetryDir = path.join(artifactRoot, 'telemetry');
    fs.mkdirSync(telemetryDir, { recursive: true });
    if (telemetryLogs.length === 0) {
      telemetryLogs.push('[telemetry] log not captured');
    }
    fs.writeFileSync(
      path.join(telemetryDir, 'orca-claim-send-telemetry.txt'),
      [`RUN_ID=${RUN_ID}`, ...telemetryLogs].join('\n'),
      'utf8',
    );
  });
});
