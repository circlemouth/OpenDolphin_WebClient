import { test, expect } from '../playwright/fixtures';

import { e2eAuthSession, profile, seedAuthSession } from './helpers/orcaMaster';

test.describe('Outpatient auto refresh stale banner', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用（Stage 接続禁止）');

  test('Reception/Patients の自動更新遅延バナーを表示する', async ({ page }) => {
    await page.addInitScript(() => {
      const originalNow = Date.now.bind(Date);
      (window as any).__AUTO_REFRESH_INTERVAL_MS__ = 1000;
      (window as any).__AUTO_REFRESH_OFFSET_MS__ = 0;
      Date.now = () => originalNow() + (window as any).__AUTO_REFRESH_OFFSET_MS__;
    });

    await seedAuthSession(page);

    const facilityId = e2eAuthSession.credentials.facilityId;
    await page.goto(`/f/${facilityId}/reception`);
    await expect(page.getByRole('heading', { name: 'Reception → Charts トーン連携' })).toBeVisible();
    await page.evaluate(() => {
      (window as any).__AUTO_REFRESH_OFFSET_MS__ = 5000;
    });
    await page.waitForTimeout(1200);
    await expect(page.getByText('受付一覧の自動更新が遅れています')).toBeVisible();

    await page.goto(`/f/${facilityId}/patients`);
    await expect(page.getByRole('heading', { name: '患者一覧・編集' })).toBeVisible();
    await page.evaluate(() => {
      (window as any).__AUTO_REFRESH_OFFSET_MS__ = 5000;
    });
    await page.waitForTimeout(1200);
    await expect(page.getByText('患者一覧の自動更新が遅れています')).toBeVisible();
  });
});
