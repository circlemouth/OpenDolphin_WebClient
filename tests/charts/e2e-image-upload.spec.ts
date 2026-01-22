import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../playwright/fixtures';
import { baseUrl, e2eAuthSession, seedAuthSession, withChartLock } from '../e2e/helpers/orcaMaster';

const RUN_ID = process.env.RUN_ID ?? '20260122T001851Z';
process.env.RUN_ID ??= RUN_ID;

test.use({
  ignoreHTTPSErrors: true,
  video: 'on',
  extraHTTPHeaders: {
    'x-msw-missing-master': '0',
    'x-msw-transition': 'server',
    'x-msw-cache-hit': '0',
    'x-msw-fallback-used': '0',
    'x-msw-run-id': RUN_ID,
  },
});

test('画像タブで一覧・アップロード・フォールバックが確認できる', async ({ page }) => {
  const artifactDir =
    process.env.PLAYWRIGHT_ARTIFACT_DIR ??
    path.join(process.cwd(), 'artifacts', 'webclient', 'orca-e2e', '20260122', 'images-ui');
  fs.mkdirSync(artifactDir, { recursive: true });

  const consoleMessages: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  await page.addInitScript(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices = async () => [];
    }
  });

  await withChartLock(page, async () => {
    await seedAuthSession(page);
    const facilityId = e2eAuthSession.credentials.facilityId;
    const userId = e2eAuthSession.credentials.userId;
    const passwordMd5 = e2eAuthSession.credentials.passwordMd5;

    await page.route('**/karte/images**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          list: [
            {
              id: 901,
              title: '胸部X線',
              fileName: 'xray_2026_01_21.png',
              contentType: 'image/png',
              contentSize: 245120,
              recordedAt: '2026-01-21T12:00:00Z',
              thumbnailUrl: '/mock/thumbnail/901',
            },
          ],
          page: 1,
          total: 1,
          meta: { placeholder: false, maxSizeBytes: 5 * 1024 * 1024 },
          runId: RUN_ID,
          traceId: `trace-${RUN_ID}`,
        }),
      });
    });
    await page.addInitScript(
      ({ facility, user, password, runId }) => {
        window.localStorage.setItem('devFacilityId', facility);
        window.localStorage.setItem('devUserId', user);
        window.localStorage.setItem('devPasswordMd5', password);
        window.sessionStorage.setItem(
          'opendolphin:web-client:auth',
          JSON.stringify({
            facilityId: facility,
            userId: user,
            role: 'admin',
            runId,
            clientUuid: 'e2e-playwright',
          }),
        );
        window.sessionStorage.setItem(
          'opendolphin:web-client:auth-flags',
          JSON.stringify({
            sessionKey: `${facility}:${user}`,
            flags: {
              runId,
              cacheHit: false,
              missingMaster: false,
              dataSourceTransition: 'server',
              fallbackUsed: false,
            },
            updatedAt: new Date().toISOString(),
          }),
        );
      },
      { facility: facilityId, user: userId, password: passwordMd5, runId: RUN_ID },
    );

    await page.goto(`${baseUrl}/f/${facilityId}/charts?patientId=000001&visitDate=2026-01-21&msw=1`);
    await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });

    const utilityTabs = page.getByRole('tablist', { name: 'ユーティリティ' });
    const imageTab = utilityTabs.getByRole('tab', { name: '画像' });
    await expect(imageTab).toBeEnabled({ timeout: 20_000 });
    await imageTab.click();

    const panel = page.locator('[data-test-id="charts-image-panel"]');
    await expect(panel).toBeVisible({ timeout: 10_000 });

    await expect(panel.locator('[data-test-id="image-thumbnail-list"]')).toContainText('胸部X線');
    await expect(panel.locator('[data-test-id="image-camera-fallback"]')).toContainText('カメラデバイス');

    await page.route('**/karte/document', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.continue();
    });

    const fileInput = panel.locator('[data-test-id="image-file-input"]');
    await fileInput.setInputFiles({
      name: 'upload.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    });

    const uploadItem = panel.locator('[data-test-id="image-upload-item"]').first();
    await expect(uploadItem).toContainText('upload.png');

    const progressLocator = uploadItem.locator('[data-test-id="image-upload-progress"]');
    const progressBefore = await progressLocator.evaluate((el) => (el as HTMLProgressElement).value);
    await page.waitForTimeout(120);
    const progressAfter = await progressLocator.evaluate((el) => (el as HTMLProgressElement).value);
    expect(progressAfter).not.toBe(progressBefore);

    await expect(panel.locator('[data-test-id="image-upload-status"]')).toContainText('アップロード');

    await page.screenshot({
      path: path.join(artifactDir, 'images-ui.png'),
      fullPage: true,
    });

    const auditEvents = await page.evaluate(() => (window as any).__AUDIT_EVENTS__ ?? []);
    const telemetryEvents = await page.evaluate(() => (window as any).__OUTPATIENT_FUNNEL__ ?? []);

    fs.writeFileSync(
      path.join(artifactDir, 'images-ui-log.json'),
      JSON.stringify(
        {
          runId: RUN_ID,
          auditEvents,
          telemetryEvents,
          consoleMessages,
        },
        null,
        2,
      ),
    );

    const video = page.video();
    if (video) {
      await page.close();
      await video.saveAs(path.join(artifactDir, 'images-ui.webm'));
    }
  });
});
