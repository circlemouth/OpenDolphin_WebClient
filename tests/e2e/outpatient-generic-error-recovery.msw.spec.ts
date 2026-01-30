import { test, expect } from '../playwright/fixtures';

import { profile, seedAuthSession } from './helpers/orcaMaster';

const RUN_ID = '20260126T074551Z';
const DEFAULT_HEADERS = { 'x-msw-scenario': 'cache-hit', 'x-run-id': RUN_ID } as const;

async function prepareSession(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('devFacilityId', '1.3.6.1.4.1.9414.72.103');
  });
  await seedAuthSession(page);
}

test.describe('Outpatient generic error recovery (MSW)', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用（Stage 接続禁止）');

  test('Reception 403: 再ログイン CTA と warning トーン', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({ ...DEFAULT_HEADERS, 'x-msw-fault': 'http-403' });
    await prepareSession(page);
    await page.goto('/reception');

    const banner = page.locator('.api-failure .tone-banner--warning');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('再ログイン');
    await expect(page.getByRole('button', { name: '再ログイン' })).toBeVisible();
  });

  test('Patients 404: 空状態 UI と info トーン', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({ ...DEFAULT_HEADERS, 'x-msw-fault': 'http-404' });
    await prepareSession(page);
    await page.goto('/patients');

    const banner = page.locator('.api-failure .tone-banner--info');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('見つかりません');
    await expect(page.locator('.patients-page__empty')).toContainText('0件です');
  });

  test('Patients network failure: 再取得 CTA と error トーン', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({ ...DEFAULT_HEADERS, 'x-msw-fault': 'network-error' });
    await prepareSession(page);
    await page.goto('/patients');

    const banner = page.locator('.api-failure .tone-banner--error');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('ネットワーク');
    const retryButton = page.locator('.api-failure').getByRole('button', { name: '再取得' });
    await expect(retryButton).toBeVisible();
  });

  test('Reception 500: 再取得クールダウン（5秒）', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({ ...DEFAULT_HEADERS, 'x-msw-fault': 'http-500' });
    await prepareSession(page);
    await page.goto('/reception');

    const banner = page.locator('.api-failure .tone-banner--error');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('サーバー側で障害が発生しています');

    const retryButton = page.locator('.api-failure').getByRole('button', { name: '再取得' });
    await retryButton.click();
    await expect(page.locator('.api-failure').getByRole('button', { name: /待機/ })).toBeVisible();
  });

  test('Reception 401: セッション失効でログイン画面へ遷移', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({ ...DEFAULT_HEADERS, 'x-msw-fault': 'http-401' });
    await prepareSession(page);
    await page.goto('/reception');

    await expect(page).toHaveURL(/login/);
    await expect(page.locator('.status-message')).toContainText('再ログイン');
  });
});
