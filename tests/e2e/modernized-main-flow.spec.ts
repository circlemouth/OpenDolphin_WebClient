// RUN_ID=20251212T090000Z
// Reception→Charts→Patients→Administration の主要フローで tone/banner/aria-live/telemetry を自動確認する。

import { test, expect } from '../playwright/fixtures';

import { baseUrl, runId, seedAuthSession } from './helpers/orcaMaster';

test.use({ ignoreHTTPSErrors: true });

async function expectToneBanner(page: import('@playwright/test').Page, scopeSelector: string) {
  const banner = page.locator(`${scopeSelector} .tone-banner`).first();
  await expect(banner).toBeVisible({ timeout: 15_000 });
  await expect(banner).toHaveAttribute('role', 'alert');
  const live = await banner.getAttribute('aria-live');
  expect(live === 'polite' || live === 'assertive').toBeTruthy();
  await expect(banner).toHaveAttribute('data-run-id', runId);
  return banner;
}

test.describe('@flow Modernized main flow + a11y + telemetry', () => {
  test('Reception→Charts→Patients→Administration を通し aria-live と telemetry を検証', async ({ page }) => {
    await seedAuthSession(page);
    await page.goto(`${baseUrl}/reception`);

    const receptionHeading = page.getByRole('heading', { name: /Reception/i });
    await expect(receptionHeading).toBeVisible({ timeout: 15_000 });

    await expectToneBanner(page, '.order-console');

    // Reception 側で missingMaster を切替し、tone/telemetry を発火させる。
    const toggleMissingMaster = page.getByRole('button', { name: /missingMaster を/i }).first();
    await toggleMissingMaster.click();
    await expectToneBanner(page, '.order-console');

    // Charts へ遷移し tone バナーと AuthServiceControls の telemetry を確認。
    await page.getByRole('link', { name: /カルテ|Charts/i }).click();
    await page.waitForURL('**/charts');
    await expect(page.locator('.charts-page')).toBeVisible({ timeout: 15_000 });

    await expectToneBanner(page, '.charts-page');

    const chartsToggleMissingMaster = page.getByRole('button', { name: /missingMaster:\s*(true|false)/i }).first();
    await chartsToggleMissingMaster.click();
    await expectToneBanner(page, '.charts-page');

    // Patients へ遷移し aria-live/role と runId を確認。
    await page.getByRole('link', { name: /患者管理|Patients/i }).click();
    await page.waitForURL('**/patients');

    const patientsMain = page.locator('.patients-page');
    await expect(patientsMain).toBeVisible({ timeout: 15_000 });
    await expect(patientsMain).toHaveAttribute('data-run-id', runId);

    const patientsLiveRegion = page.locator('.patients-page [aria-live]').first();
    await expect(patientsLiveRegion).toBeVisible();
    const patientsRole = await patientsLiveRegion.getAttribute('role');
    expect(patientsRole === 'status' || patientsRole === 'alert').toBeTruthy();

    // Administration へ遷移し aria-live/role と runId を確認。
    await page.getByRole('link', { name: /Administration/i }).click();
    await page.waitForURL('**/administration');

    const adminMain = page.locator('[data-test-id="administration-page"]');
    await expect(adminMain).toBeVisible({ timeout: 15_000 });
    await expect(adminMain).toHaveAttribute('data-run-id', runId);

    const adminLead = page.locator('.administration-page__lead');
    await expect(adminLead).toBeVisible();
    await expect(adminLead).toHaveAttribute('role', 'status');
    await expect(adminLead).toHaveAttribute('aria-live', 'assertive');

    // telemetry (window.__AUDIT_UI_STATE__) が採取でき、各記録に runId が含まれること。
    const telemetry = await page.evaluate(() => (window as any).__AUDIT_UI_STATE__ ?? []);
    expect(Array.isArray(telemetry)).toBeTruthy();
    expect(telemetry.length).toBeGreaterThan(0);
    expect(telemetry.every((entry: any) => entry.runId)).toBeTruthy();
  });
});

