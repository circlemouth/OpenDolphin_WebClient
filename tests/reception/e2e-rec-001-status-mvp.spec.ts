import { test, expect } from '../playwright/fixtures';

import { e2eAuthSession, profile, seedAuthSession } from '../e2e/helpers/orcaMaster';

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
    await expect(page.getByRole('heading', { name: 'Reception 受付一覧と更新状況' })).toBeVisible();

    // Feature flag path should expose the MVP UI elements.
    await expect(page.locator('[data-test-id="reception-status-mvp"]').first()).toBeVisible();

    // Patient 000002 is included in MSW outpatient fixture; with queue-stall it should be "pending stalled" and retryable.
    const row = page.locator('.reception-table tbody tr', { hasText: '000002' }).first();
    await expect(row).toBeVisible();
    await expect(row.locator('[data-test-id="reception-status-mvp-retry"]')).toBeVisible();

    // Sanity: the retry button triggers retryOrcaQueue without crashing.
    await row.locator('[data-test-id="reception-status-mvp-retry"]').click();
    await expect(page.getByText('ORCA再送を要求しました')).toBeVisible();
  });
});
