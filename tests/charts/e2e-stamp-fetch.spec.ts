import { test, expect } from '../playwright/fixtures';
import { seedAuthSession, baseUrl, e2eAuthSession, profile } from '../e2e/helpers/orcaMaster';

test.describe('Charts stamp fetch', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用');

  test('サーバースタンプを取得して選択肢に表示する', async ({ page }) => {
    const runId = process.env.RUN_ID ?? 'RUN-E2E';
    await seedAuthSession(page);
    const facilityId = e2eAuthSession.credentials.facilityId;
    const userId = e2eAuthSession.credentials.userId;
    await page.context().setExtraHTTPHeaders({
      'x-msw-scenario': 'cache-hit',
      'x-msw-cache-hit': '1',
      'x-msw-missing-master': '0',
      'x-msw-transition': 'server',
      'x-msw-fallback-used': '0',
    });
    await page.route('**/user/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, userId: `${facilityId}:${userId}`, runId }),
      }),
    );
    await page.route('**/touch/stampTree/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          runId,
          stampTreeList: [
            {
              treeName: '個人',
              entity: 'medOrder',
              stampList: [
                {
                  name: '降圧セット',
                  entity: 'medOrder',
                  stampId: 'STAMP-1',
                },
              ],
            },
          ],
        }),
      }),
    );
    await page.addInitScript(({ facility, user, runId }) => {
      window.localStorage.setItem('devFacilityId', facility);
      window.localStorage.setItem('devUserId', user);
      window.localStorage.setItem('devPasswordMd5', '632080fabdb968f9ac4f31fb55104648');
      window.sessionStorage.setItem(
        'opendolphin:web-client:auth',
        JSON.stringify({
          facilityId: facility,
          userId: user,
          role: 'admin',
          runId,
          clientUuid: 'e2e-playwright',
        }),
      );
      window.sessionStorage.setItem(
        'opendolphin:web-client:auth-flags',
        JSON.stringify({
          sessionKey: `${facility}:${user}`,
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
    }, { facility: facilityId, user: userId, runId });
    await page.goto(
      `${baseUrl}/f/${facilityId}/charts?msw=1&patientId=000001&appointmentId=APT-2401&visitDate=2026-01-20`,
    );

    await expect(page.locator('[data-test-id="charts-actionbar"]')).toBeVisible({ timeout: 20_000 });

    const prescriptionTab = page.getByRole('tab', { name: '処方' });
    await expect(prescriptionTab).toBeEnabled();
    await prescriptionTab.click();

    await expect(page.getByText('スタンプ保存/取り込み')).toBeVisible({ timeout: 10_000 });
    const stampSelect = page.getByLabel('既存スタンプ');
    await expect(stampSelect).toBeEnabled();
    await expect(stampSelect).toContainText('降圧セット', { timeout: 10_000 });
  });
});
