import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '@playwright/test';

import { e2eAuthSession, profile, runId as defaultRunId } from './helpers/orcaMaster';

const runId = process.env.RUN_ID ?? defaultRunId;
type Scenario = {
  id: 'A' | 'B';
  description: string;
  cacheHit: boolean;
  missingMaster: boolean;
};

const scenarios: Scenario[] = [
  {
    id: 'A',
    description: 'dataSourceTransition=server + cacheHit=true + missingMaster=false',
    cacheHit: true,
    missingMaster: false,
  },
  {
    id: 'B',
    description: 'dataSourceTransition=server + cacheHit=false + missingMaster=true',
    cacheHit: false,
    missingMaster: true,
  },
];

async function loginWithMsw(page: Page) {
  const { facilityId, userId } = e2eAuthSession.credentials;

  await page.addInitScript(() => {
    (window as any).__ALLOW_REACT_DEVTOOLS__ = true;
  });

  await page.route('**/api/user/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        facilityId,
        userId,
        displayName: 'E2E Admin',
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

test.describe('Outpatient flags (MSW preflight)', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用（Stage 接続禁止）');

  for (const scenario of scenarios) {
    test(`Reception→Charts telemetry funnel ${scenario.id}: ${scenario.description}`, async ({ page }) => {
      const payload = {
        runId,
        dataSourceTransition: 'server',
        cacheHit: scenario.cacheHit,
      missingMaster: scenario.missingMaster,
    };

      await loginWithMsw(page);

      await page.route('**/api01rv2/claim/outpatient/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(payload),
        }),
      );
      await page.route('**/orca21/medicalmodv2/outpatient', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(payload),
        }),
      );

      await page.getByRole('link', { name: 'Outpatient Mock' }).click();
      await page.waitForURL('**/outpatient-mock**');
      await page.waitForSelector('[data-test-id="outpatient-mock-page"]');

      const tone = page.locator('[data-test-id="reception-tone"] .tone-banner');
      await expect(tone).toHaveAttribute('data-run-id', runId, { timeout: 10_000 });
      await expect(tone).toBeVisible();

      const resolveMasterMarker = page.locator('[data-test-id="resolve-master-badge"] .resolve-master__marker');
      await expect(resolveMasterMarker).toHaveText(/tone=server/i);

      const missingMasterBadge = page.locator('[data-test-id="reception-badges"] .status-badge').filter({
        hasText: 'missingMaster',
      });
      await expect(missingMasterBadge).toContainText(String(scenario.missingMaster));

      const cacheHitBadge = page.locator('[data-test-id="reception-badges"] .status-badge').filter({
        hasText: 'cacheHit',
      });
      await expect(cacheHitBadge).toContainText(String(scenario.cacheHit));

      await page.waitForFunction(() => Array.isArray((window as any).__OUTPATIENT_FUNNEL__) && (window as any).__OUTPATIENT_FUNNEL__.length >= 2);
      const telemetry = await page.evaluate(() => (window as any).__OUTPATIENT_FUNNEL__);
      expect(Array.isArray(telemetry)).toBeTruthy();
      expect(telemetry[0].stage).toBe('resolve_master');
      expect(telemetry[1].stage).toBe('charts_orchestration');
      expect(telemetry[0].cacheHit).toBe(scenario.cacheHit);
      expect(telemetry[0].missingMaster).toBe(scenario.missingMaster);

      const log = page.locator('[data-test-id="telemetry-log"] li');
      await expect(log.nth(0)).toContainText('resolve_master');
      await expect(log.nth(1)).toContainText('charts_orchestration');

      const artifactDir = path.join(process.cwd(), 'artifacts', 'webclient', 'e2e', `${runId}-outpatient-mock`);
      fs.mkdirSync(artifactDir, { recursive: true });
      await page.screenshot({ path: path.join(artifactDir, `${scenario.id}-tone.png`), fullPage: true });
    });
  }
});
