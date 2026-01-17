import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../playwright/fixtures';

import { e2eAuthSession, runId as defaultRunId } from './helpers/orcaMaster';

const runId = process.env.RUN_ID ?? defaultRunId;
const artifactDir = path.join(process.cwd(), 'artifacts', 'webclient', 'debug', '20251209T150000Z-bugs');

test.describe('Outpatient missingMaster 異常系注入 (MSW fixture)', () => {
  test('missingMaster=true / cacheHit=false を注入し UI と telemetry を採取する', async ({ page }) => {
    fs.mkdirSync(artifactDir, { recursive: true });

    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    const payload = {
      runId,
      dataSourceTransition: 'server',
      cacheHit: false,
      missingMaster: true,
      fallbackUsed: false,
    };

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
          commonName: 'E2E Admin',
        }),
      }),
    );

    await page.route('**/orca/claim/outpatient/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      }),
    );

    await page.route('**/orca21/medicalmodv2/outpatient**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      }),
    );

    await page.goto('/login?msw=1');
    await page.getByLabel('施設ID').fill(facilityId);
    await page.getByLabel('ユーザーID').fill(userId);
    await page.getByLabel('パスワード').fill('password');
    await Promise.all([
      page.waitForURL('**/reception'),
      page.getByRole('button', { name: 'ログイン' }).click(),
    ]);

    await page.getByRole('link', { name: 'Outpatient Mock' }).click();
    await page.waitForURL('**/outpatient-mock**');
    await page.waitForSelector('[data-test-id="outpatient-mock-page"]');

    const tone = page.locator('[data-test-id="reception-tone"] .tone-banner');
    await expect(tone).toBeVisible();
    const resolveMarker = page.locator('[data-test-id="resolve-master-badge"] .resolve-master__marker');
    await expect(resolveMarker).toContainText(/tone=server/i);

    await page.waitForFunction(
      () => Array.isArray((window as any).__OUTPATIENT_FUNNEL__) && (window as any).__OUTPATIENT_FUNNEL__.length >= 2,
    );

    const telemetry = await page.evaluate(() => (window as any).__OUTPATIENT_FUNNEL__ ?? []);

    const uiState = {
      runId,
      tone: {
        text: (await tone.textContent())?.trim(),
        ariaLive: await tone.getAttribute('aria-live'),
        dataRunId: await tone.getAttribute('data-run-id'),
      },
      resolveMasterBadge: {
        markerText: await resolveMarker.textContent(),
        dataRunId: await resolveMarker.getAttribute('data-run-id'),
      },
      badges: {
        missingMaster: await page
          .locator('[data-test-id="reception-badges"] .status-badge', { hasText: 'missingMaster' })
          .textContent(),
        cacheHit: await page
          .locator('[data-test-id="reception-badges"] .status-badge', { hasText: 'cacheHit' })
          .textContent(),
      },
    };

    fs.writeFileSync(path.join(artifactDir, 'ui-state.json'), JSON.stringify(uiState, null, 2));
    fs.writeFileSync(path.join(artifactDir, 'telemetry.json'), JSON.stringify(telemetry, null, 2));
    fs.writeFileSync(path.join(artifactDir, 'console.log'), consoleLogs.join('\n'), 'utf8');

    await page.screenshot({
      path: path.join(artifactDir, 'outpatient-missing-master.png'),
      fullPage: true,
    });
  });
});
