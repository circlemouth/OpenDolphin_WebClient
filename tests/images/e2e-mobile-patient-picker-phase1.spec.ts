import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../playwright/fixtures';
import { e2eAuthSession, profile, seedAuthSession } from '../e2e/helpers/orcaMaster';

test.describe('Mobile patient picker (Phase1)', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用（Stage 接続禁止）');

  test('shows today candidates from /api/orca/queue and supports manual patientId check', async ({ page }) => {
    const runId = process.env.RUN_ID ?? 'unknown-run-id';
    const root = path.join(process.cwd(), 'artifacts', 'verification', runId, 'mobile-patient-pick-phase1');
    const shotsDir = path.join(root, 'screenshots');
    fs.mkdirSync(shotsDir, { recursive: true });

    // iPhone-ish viewport (mobile-first UI validation).
    await page.setViewportSize({ width: 390, height: 844 });

    await seedAuthSession(page);

    // Ensure ORCA queue has deterministic candidates in MSW mode.
    await page.addInitScript(() => {
      window.localStorage.setItem('mswFault', 'queue-stall');
    });

    const facilityId = e2eAuthSession.credentials.facilityId;
    await page.goto(`/f/${facilityId}/debug/mobile-patient-picker?msw=1`);

    await expect(page.getByRole('heading', { name: 'Mobile Patient Picker (Phase1 demo)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '当日受付候補' })).toBeVisible();

    const firstRow = page.locator('[data-test-id="mobile-patient-picker-row"]').first();
    await expect(firstRow).toBeVisible();

    // One-tap selection should update "selected patientId" banner.
    await firstRow.click();
    await expect(page.getByText('選択中 patientId:')).toBeVisible();

    // Manual input validation path (digits-only, pad-to-6) and existence check button is visible.
    await expect(page.locator('[data-test-id="mobile-patient-picker-check"]')).toBeVisible();

    await page.screenshot({ path: path.join(shotsDir, 'mobile-patient-picker-phase1.png'), fullPage: true });
  });
});

