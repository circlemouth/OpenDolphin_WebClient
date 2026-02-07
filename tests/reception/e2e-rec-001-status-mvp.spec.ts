import { test, expect } from '../playwright/fixtures';
import type { Page } from '@playwright/test';

import { e2eAuthSession, profile, seedAuthSession } from '../e2e/helpers/orcaMaster';

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

test.describe('REC-001 Reception status MVP', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用（Stage 接続禁止）');

  test('shows normalized status + next action and exposes retry guidance via feature flag', async ({ page }) => {
    await seedAuthSession(page);

    // Enable MSW fault injection via header-flags mechanism (requires msw=1 and debug UI enabled in env).
    await page.addInitScript(() => {
      window.localStorage.setItem('mswFault', 'queue-stall');
    });

    const facilityId = e2eAuthSession.credentials.facilityId;
    await page.goto(`/f/${facilityId}/reception?msw=1`);
    await ensureMswControlled(page);
    const controllerUrl = await page.evaluate(() => navigator.serviceWorker?.controller?.scriptURL ?? '');
    expect(controllerUrl).toContain('mockServiceWorker');
    await expect(page.getByRole('heading', { name: 'Reception 受付一覧と更新状況' })).toBeVisible();

    // Feature flag path should expose the MVP UI elements.
    const card = page.locator('[data-test-id="reception-entry-card"][data-patient-id="000002"]').first();
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card.locator('[data-test-id="reception-status-mvp"]')).toBeVisible();

    // Patient 000002 is included in MSW outpatient fixture; with queue-stall it should be "pending stalled" and retryable.
    await expect(card.locator('[data-test-id="reception-status-mvp-retry"]')).toBeVisible();

    // Sanity: the retry button triggers retryOrcaQueue without crashing.
    await card.locator('[data-test-id="reception-status-mvp-retry"]').click();
    await expect(page.getByText('ORCA再送を要求しました')).toBeVisible();
  });
});
