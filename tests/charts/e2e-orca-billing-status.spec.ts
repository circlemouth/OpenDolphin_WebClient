import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../playwright/fixtures';
import { baseUrl, e2eAuthSession, seedAuthSession, withChartLock } from '../e2e/helpers/orcaMaster';
import { buildIncomeInfoXml } from '../../web-client/src/mocks/fixtures/orcaAdditional';

const RUN_ID = process.env.RUN_ID ?? '20260121T111246Z';
process.env.RUN_ID ??= RUN_ID;

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

test('会計伝票の送信結果と incomeinfv2 を突き合わせて会計済みを表示する (MSW)', async ({ page }) => {
  const artifactDir =
    process.env.PLAYWRIGHT_ARTIFACT_DIR ??
    path.join(process.cwd(), 'artifacts', 'webclient', 'orca-e2e', '20260122', 'billing-status');
  fs.mkdirSync(artifactDir, { recursive: true });

    await withChartLock(page, async () => {
      await seedAuthSession(page);
      const facilityId = e2eAuthSession.credentials.facilityId;
      const userId = e2eAuthSession.credentials.userId;

      await page.route('**/api01rv2/incomeinfv2', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/xml; charset=UTF-8',
          body: buildIncomeInfoXml(),
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
            dataId: 'DATA-1',
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
        flags: {
          runId: 'RUN-E2E',
          cacheHit: false,
          missingMaster: false,
          dataSourceTransition: 'server',
          fallbackUsed: false,
        },
      },
    );

    await page.goto(`${baseUrl}/f/${facilityId}/charts?patientId=000001&visitDate=2026-01-21&msw=1`);
    await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });

    const summary = page.locator('[data-test-id=\"orca-summary\"]');
    await expect(summary).toBeVisible({ timeout: 20_000 });

    const refreshButton = summary.getByRole('button', { name: '収納情報を確認' });
    await expect(refreshButton).toBeEnabled({ timeout: 20_000 });
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api01rv2/incomeinfv2') && response.ok()),
      refreshButton.click(),
    ]);

    await expect(summary.getByText(/Api_Result=00/)).toBeVisible({ timeout: 10_000 });
    await expect(summary.getByText('ステータス: 会計済み')).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: path.join(artifactDir, 'billing-status.png'),
      fullPage: true,
    });
  });
});
