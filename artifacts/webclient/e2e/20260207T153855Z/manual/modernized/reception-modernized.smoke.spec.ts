import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '@playwright/test';

const RUN_ID = process.env.RUN_ID ?? '20260207T153855Z';
const FACILITY_ID = '1.3.6.1.4.1.9414.10.1';

const ART_DIR = path.join(
  process.cwd(),
  'artifacts',
  'webclient',
  'e2e',
  RUN_ID,
  'manual',
  'modernized',
);

test('Reception page renders (modernized env smoke)', async ({ page }) => {
  fs.mkdirSync(ART_DIR, { recursive: true });

  await page.goto('/');

  // Facility select
  await page.locator('#facility-login-id').fill(FACILITY_ID);
  await page.getByRole('button', { name: 'ログインへ進む' }).click();

  // Login
  await page.locator('#login-user-id').fill('dolphindev');
  await page.locator('#login-password').fill('dolphindev');
  await Promise.all([
    // After successful login, the SPA navigates away from /login quickly (feedback may not render).
    page.waitForURL((url) => url.pathname.includes('/f/') && !url.pathname.includes('/login'), { timeout: 60_000 }),
    page.getByRole('button', { name: /^ログイン/ }).click(),
  ]);

  // Reception
  await page.goto(`/f/${encodeURIComponent(FACILITY_ID)}/reception`);
  await expect(page.getByRole('heading', { name: /Reception 受付一覧と更新状況/ })).toBeVisible({ timeout: 30_000 });

  await page.screenshot({ path: path.join(ART_DIR, 'reception-modernized.png'), fullPage: true });
});
