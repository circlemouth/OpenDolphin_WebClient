import { test, expect } from '../playwright/fixtures';
import type { Page } from '@playwright/test';
import { profile } from './helpers/orcaMaster';

const runId = process.env.RUN_ID ?? '20251217T130407Z';

async function loginWithMsw(page: Page) {
  const facilityId = 'FAC-E2E';
  const userId = 'doctor-e2e';

  await page.route('**/api/user/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        facilityId,
        userId,
        displayName: 'E2E Doctor',
        role: 'doctor',
      }),
    }),
  );

  await page.goto('/login?msw=1');
  await page.getByLabel('施設ID').fill(facilityId);
  await page.getByLabel('ユーザーID').fill(userId);
  await page.getByLabel('パスワード').fill('password');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL('**/reception', { timeout: 10_000 });
}

async function mockOutpatientEndpoints(
  page: Page,
  payload: { missingMaster: boolean; fallbackUsed?: boolean; dataSourceTransition?: string },
) {
  const common = {
    runId,
    cacheHit: !payload.missingMaster,
    missingMaster: payload.missingMaster,
    fallbackUsed: payload.fallbackUsed ?? false,
    dataSourceTransition: (payload.dataSourceTransition as any) ?? 'server',
    recordsReturned: 3,
    fetchedAt: '2025-12-17T12:34:56Z',
  };

  await page.route('**/api01rv2/claim/outpatient/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...common,
        claimStatus: payload.fallbackUsed ? '会計待ち' : '診療中',
        claimStatusText: payload.fallbackUsed ? '暫定計算' : '計算済み',
        bundles: [
          { bundleNumber: 'B1', totalClaimAmount: 1200 },
          { bundleNumber: 'B2', totalClaimAmount: 800 },
        ],
      }),
    }),
  );

  await page.route('**/orca21/medicalmodv2/outpatient**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...common,
        outpatientList: [{}, {}, {}],
        apiResultMessage: payload.fallbackUsed ? 'fallbackUsed=true' : 'server ok',
      }),
    }),
  );

  await page.route('**/api01rv2/appointment/outpatient/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...common,
        outpatientList: [
          {
            appointmentId: 'APT-001',
            patientId: 'PX-1',
            name: 'テスト太郎',
            department: '内科',
            appointmentTime: '09:00',
            status: '予約',
          },
          {
            appointmentId: 'APT-002',
            patientId: 'PX-2',
            name: 'テスト花子',
            department: '内科',
            appointmentTime: payload.fallbackUsed ? '09:00' : '10:00',
            status: '予約',
          },
        ],
      }),
    }),
  );
}

test.describe('OrcaSummary UX (MSW)', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用');

  test('fallbackUsed=true でCTAがブロックされ、警告がassertive', async ({ page }) => {
    await loginWithMsw(page);
    await mockOutpatientEndpoints(page, { missingMaster: true, fallbackUsed: true, dataSourceTransition: 'fallback' });

    await page.getByRole('link', { name: 'カルテ / Charts' }).click();
    await page.waitForURL('**/charts', { timeout: 10_000 });

    const summary = page.locator('[data-test-id="orca-summary"]');
    await expect(summary).toBeVisible();

    const toneBanner = summary.locator('.tone-banner');
    await expect(toneBanner).toHaveAttribute('aria-live', /assertive/);

    const billingCta = summary.getByRole('button', { name: '会計へ' });
    await expect(billingCta).toBeDisabled();
    await expect(billingCta).toHaveAttribute('data-disabled-reason', 'fallback_used');

    const warning = summary.locator('[data-test-id="orca-summary-warning"]').first();
    await expect(warning).toContainText('暫定');
  });

  test('Alt+R で再取得をトリガし audit に manualRefresh が残る', async ({ page }) => {
    await loginWithMsw(page);
    await mockOutpatientEndpoints(page, { missingMaster: false, fallbackUsed: false, dataSourceTransition: 'server' });

    await page.getByRole('link', { name: 'カルテ / Charts' }).click();
    await page.waitForSelector('[data-test-id="orca-summary"]', { timeout: 10_000 });

    await page.keyboard.press('Alt+R');

    await page.waitForFunction(
      () =>
        Array.isArray((window as any).__AUDIT_UI_STATE__) &&
        (window as any).__AUDIT_UI_STATE__.some((entry: any) => entry?.details?.manualRefresh === true),
    );

    const auditLog = await page.evaluate(() => (window as any).__AUDIT_UI_STATE__);
    const manual = auditLog.find((entry: any) => entry?.details?.manualRefresh === true);
    expect(manual).toBeTruthy();
  });
});
