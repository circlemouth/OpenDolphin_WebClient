// RUN_ID=20251218T171651Z
// Charts: 障害注入（timeout/500/schema mismatch/queue stall）を MSW で再現し、
// 「落ちずに説明できる」ことと、解除後に再取得で復帰できることを確認する。

import { test, expect } from '../playwright/fixtures';
import type { Page, Route } from '@playwright/test';

import { baseUrl, profile } from './helpers/orcaMaster';

test.use({ ignoreHTTPSErrors: true });

const stubSessionApis = async (page: Page) => {
  const adminConfig = {
    runId: '20251218T171651Z',
    chartsDisplayEnabled: true,
    chartsSendEnabled: true,
    chartsMasterSource: 'auto',
    verified: true,
    source: 'mock',
  };

  await page.route('**/api/user/**', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        facilityId: '0001',
        userId: 'doctor1',
        displayName: 'Playwright Doctor',
        roles: ['admin'],
      }),
    }),
  );

  await page.route('**/api/admin/config', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminConfig) }),
  );
  await page.route('**/api/admin/delivery', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminConfig) }),
  );
};

async function loginWithMsw(page: Page) {
  await stubSessionApis(page);
  await page.goto(`${baseUrl}/login?msw=1`);
  await page.getByLabel('施設ID').fill('0001');
  await page.getByLabel('ユーザーID').fill('doctor1');
  await page.getByLabel('パスワード').fill('pass');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForResponse('**/api/user/**', { timeout: 10_000 });
  await expect(page).toHaveURL(/reception/);
}

const openCharts = async (page: Page) => {
  await page.goto(`${baseUrl}/charts?msw=1`);
  await expect(page.locator('[data-test-id="charts-actionbar"]')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-test-id="medical-record-panel"]')).toBeVisible({ timeout: 20_000 });
};

test.describe('Charts fault injection (MSW)', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用（Stage 接続禁止）');

  test('timeout: 504 でも UI が落ちずに説明でき、解除後に再取得で復帰', async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-msw-scenario': 'cache-hit',
      'x-msw-fault': 'timeout',
    });
    const page = await context.newPage();
    await loginWithMsw(page);
    await openCharts(page);

    const claimRetry = page.locator('.document-timeline__retry');
    await expect(claimRetry).toBeVisible();
    await expect(claimRetry).toContainText('請求バンドルの取得に失敗しました');

    const medical = page.locator('[data-test-id="medical-record-panel"]');
    await expect(medical).toContainText('外来医療記録の取得に失敗しました');

    await context.setExtraHTTPHeaders({ 'x-msw-scenario': 'cache-hit' });
    await page.getByRole('button', { name: '請求バンドルを再取得' }).click();
    await expect(claimRetry).toBeHidden({ timeout: 20_000 });
  });

  test('http-500: 500 でも UI が落ちずに説明でき、解除後に再取得で復帰', async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-msw-scenario': 'cache-hit',
      'x-msw-fault': 'http-500',
    });
    const page = await context.newPage();
    await loginWithMsw(page);
    await openCharts(page);

    const claimRetry = page.locator('.document-timeline__retry');
    await expect(claimRetry).toBeVisible();
    await expect(claimRetry).toContainText('請求バンドルの取得に失敗しました');

    const medical = page.locator('[data-test-id="medical-record-panel"]');
    await expect(medical).toContainText('外来医療記録の取得に失敗しました');

    await context.setExtraHTTPHeaders({ 'x-msw-scenario': 'cache-hit' });
    await page.getByRole('button', { name: '請求バンドルを再取得' }).click();
    await expect(claimRetry).toBeHidden({ timeout: 20_000 });
  });

  test('schema-mismatch: 200 + ERROR_* でも UI が落ちずに説明でき、解除後に再取得で復帰', async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-msw-scenario': 'cache-hit',
      'x-msw-fault': 'schema-mismatch',
    });
    const page = await context.newPage();
    await loginWithMsw(page);
    await openCharts(page);

    const claimRetry = page.locator('.document-timeline__retry');
    await expect(claimRetry).toBeVisible();
    await expect(claimRetry).toContainText('取得に失敗');

    const medical = page.locator('[data-test-id="medical-record-panel"]');
    await expect(medical).toContainText('取得に失敗');

    await context.setExtraHTTPHeaders({ 'x-msw-scenario': 'cache-hit' });
    await page.getByRole('button', { name: '請求バンドルを再取得' }).click();
    await expect(claimRetry).toBeHidden({ timeout: 20_000 });
  });

  test('queue-stall: 滞留バッジが表示され、解除後に復帰', async ({ context }) => {
    await context.setExtraHTTPHeaders({
      'x-msw-scenario': 'cache-hit',
      'x-msw-fault': 'queue-stall',
    });
    const page = await context.newPage();
    await loginWithMsw(page);
    await openCharts(page);

    const stalled = page.locator('.document-timeline__badge-warning', { hasText: '滞留' });
    await expect(stalled).toBeVisible({ timeout: 20_000 });

    await context.setExtraHTTPHeaders({ 'x-msw-scenario': 'cache-hit' });
    await page.reload();
    await expect(stalled).toBeHidden({ timeout: 20_000 });
  });
});

