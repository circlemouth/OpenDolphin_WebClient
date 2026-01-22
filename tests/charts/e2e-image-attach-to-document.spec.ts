import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../playwright/fixtures';
import { baseUrl, e2eAuthSession, seedAuthSession, withChartLock } from '../e2e/helpers/orcaMaster';

const RUN_ID = process.env.RUN_ID ?? '20260123T090000Z';
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

const setupAuth = async (page: any) => {
  await seedAuthSession(page);
  const facilityId = e2eAuthSession.credentials.facilityId;
  const userId = e2eAuthSession.credentials.userId;
  const passwordMd5 = e2eAuthSession.credentials.passwordMd5;
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
  return { facilityId };
};

test('画像アップロードから文書貼付までの導線を確認する', async ({ page }) => {
  const artifactDir =
    process.env.PLAYWRIGHT_ARTIFACT_DIR ??
    path.join(process.cwd(), 'artifacts', 'webclient', 'orca-e2e', '20260123', 'image-attach');
  fs.mkdirSync(artifactDir, { recursive: true });

  const consoleMessages: Array<{ type: string; text: string }> = [];
  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  await withChartLock(page, async () => {
    const { facilityId } = await setupAuth(page);
    let imageListCount = 0;
    const documentPayloads: Array<Record<string, any>> = [];
    const uploadPayloads: Array<Record<string, any>> = [];

    await page.route('**/karte/images**', async (route) => {
      imageListCount += 1;
      const list = imageListCount >= 2
        ? [
            {
              id: 901,
              title: '胸部X線',
              fileName: 'xray_2026_01_21.png',
              contentType: 'image/png',
              contentSize: 245120,
              recordedAt: '2026-01-21T12:00:00Z',
              thumbnailUrl: '/mock/thumbnail/901',
            },
          ]
        : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          list,
          page: 1,
          total: list.length,
          meta: { placeholder: false, maxSizeBytes: 5 * 1024 * 1024 },
          runId: RUN_ID,
          traceId: `trace-${RUN_ID}`,
        }),
      });
    });

    await page.route('**/karte/document', async (route) => {
      const request = route.request();
      const payload = request.postDataJSON() as Record<string, any> | null;
      if (payload) {
        if (payload?.docInfoModel?.title === '画像添付') {
          uploadPayloads.push(payload);
        } else {
          documentPayloads.push(payload);
        }
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          docPk: 9025,
          receivedAttachments: Array.isArray(payload?.attachment) ? payload?.attachment.length : 0,
          runId: RUN_ID,
          traceId: `trace-${RUN_ID}`,
        }),
      });
    });

    await page.goto(`${baseUrl}/f/${facilityId}/charts?patientId=000001&visitDate=2026-01-21&msw=1`);
    await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });

    const utilityTabs = page.getByRole('tablist', { name: 'ユーティリティ' });
    const imageTab = utilityTabs.getByRole('tab', { name: '画像' });
    await expect(imageTab).toBeEnabled({ timeout: 20_000 });
    await imageTab.click();

    const imagePanel = page.locator('[data-test-id="charts-image-panel"]');
    await expect(imagePanel).toBeVisible({ timeout: 10_000 });

    const fileInput = imagePanel.locator('[data-test-id="image-file-input"]');
    await fileInput.setInputFiles({
      name: 'upload.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    });

    await expect(imagePanel.locator('[data-test-id="image-upload-status"]')).toContainText('アップロード');
    await expect(imagePanel.locator('[data-test-id="image-thumbnail-list"]')).toContainText('胸部X線');

    await imagePanel.locator('[data-test-id="image-attach-document"]').first().click();
    await imagePanel.locator('[data-test-id="image-attach-soap"]').first().click();

    const freeNote = page.getByPlaceholder('Free を記載してください。');
    await expect(freeNote).toHaveValue(/attachment:901/);

    const documentTab = utilityTabs.getByRole('tab', { name: '文書' });
    await documentTab.click();

    const documentPanel = page.locator('[data-test-id="document-create-panel"]');
    await expect(documentPanel.getByText('文書作成メニュー')).toBeVisible({ timeout: 10_000 });
    await expect(documentPanel.locator('[data-test-id="document-attachment-summary"]')).toContainText('1 件');

    await documentPanel.getByLabel('テンプレート *').selectOption('REF-ODT-STD');
    await documentPanel.getByLabel('宛先医療機関 *').fill('東京クリニック');
    await documentPanel.getByLabel('宛先医師 *').fill('山田太郎');
    await documentPanel.getByLabel('紹介目的 *').fill('精査依頼');
    await documentPanel.getByLabel('主病名 *').fill('高血圧');
    await documentPanel.getByLabel('紹介内容 *').fill('既往歴と検査結果を記載');

    const saveStartedAt = Date.now();
    await documentPanel.getByRole('button', { name: '保存' }).click();
    await expect(documentPanel.getByText('文書を保存しました。')).toBeVisible({ timeout: 10_000 });
    const saveElapsedMs = Date.now() - saveStartedAt;
    expect(saveElapsedMs, '保存処理は1.5s以内であること').toBeLessThanOrEqual(1500);

    expect(documentPayloads.length).toBeGreaterThanOrEqual(1);
    const docPayload = documentPayloads[documentPayloads.length - 1];
    expect(Array.isArray(docPayload.attachment)).toBe(true);
    expect(docPayload.attachment[0]?.id).toBe(901);

    const auditEvents = await page.evaluate(() => (window as any).__AUDIT_EVENTS__ ?? []);
    const imageAttachEvents = auditEvents.filter(
      (event: any) => event?.payload?.action === 'chart_image_attach' && event?.payload?.details?.attachmentId === 901,
    );
    expect(imageAttachEvents.length, 'chart_image_attach が欠落しないこと').toBe(1);

    await page.screenshot({
      path: path.join(artifactDir, 'image-attach-success.png'),
      fullPage: true,
    });

    fs.writeFileSync(
      path.join(artifactDir, 'image-attach-log.json'),
      JSON.stringify(
        {
          runId: RUN_ID,
          saveElapsedMs,
          documentPayloads,
          uploadPayloads,
          auditEvents,
          consoleMessages,
        },
        null,
        2,
      ),
    );

    const video = page.video();
    if (video) {
      await page.close();
      await video.saveAs(path.join(artifactDir, 'image-attach-success.webm'));
    }
  });
});

test('文書保存エラー時は再送できる', async ({ page }) => {
  const artifactDir =
    process.env.PLAYWRIGHT_ARTIFACT_DIR ??
    path.join(process.cwd(), 'artifacts', 'webclient', 'orca-e2e', '20260123', 'image-attach');
  fs.mkdirSync(artifactDir, { recursive: true });

  await withChartLock(page, async () => {
    const { facilityId } = await setupAuth(page);
    let documentSaveCount = 0;

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

    await page.route('**/karte/document', async (route) => {
      const payload = route.request().postDataJSON() as Record<string, any> | null;
      if (payload?.docInfoModel?.title === '画像添付') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            docPk: 9024,
            runId: RUN_ID,
            traceId: `trace-${RUN_ID}`,
          }),
        });
        return;
      }
      documentSaveCount += 1;
      if (documentSaveCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, reason: 'server_error', runId: RUN_ID, traceId: `trace-${RUN_ID}` }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, docPk: 9026, runId: RUN_ID, traceId: `trace-${RUN_ID}` }),
      });
    });

    await page.goto(`${baseUrl}/f/${facilityId}/charts?patientId=000001&visitDate=2026-01-21&msw=1`);
    await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });

    const utilityTabs = page.getByRole('tablist', { name: 'ユーティリティ' });
    const imageTab = utilityTabs.getByRole('tab', { name: '画像' });
    await imageTab.click();

    const imagePanel = page.locator('[data-test-id="charts-image-panel"]');
    await expect(imagePanel).toBeVisible({ timeout: 10_000 });
    await imagePanel.locator('[data-test-id="image-attach-document"]').first().click();

    const documentTab = utilityTabs.getByRole('tab', { name: '文書' });
    await documentTab.click();

    const documentPanel = page.locator('[data-test-id="document-create-panel"]');
    await expect(documentPanel).toBeVisible({ timeout: 10_000 });
    await documentPanel.getByLabel('テンプレート *').selectOption('REF-ODT-STD');
    await documentPanel.getByLabel('宛先医療機関 *').fill('東京クリニック');
    await documentPanel.getByLabel('宛先医師 *').fill('山田太郎');
    await documentPanel.getByLabel('紹介目的 *').fill('精査依頼');
    await documentPanel.getByLabel('主病名 *').fill('高血圧');
    await documentPanel.getByLabel('紹介内容 *').fill('既往歴と検査結果を記載');

    await documentPanel.getByRole('button', { name: '保存' }).click();
    await expect(documentPanel.getByText('文書保存に失敗しました')).toBeVisible({ timeout: 10_000 });
    await expect(documentPanel.getByRole('button', { name: '再送' })).toBeVisible({ timeout: 10_000 });

    await documentPanel.getByRole('button', { name: '再送' }).click();
    await expect(documentPanel.getByText('文書を保存しました。')).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: path.join(artifactDir, 'image-attach-retry.png'),
      fullPage: true,
    });
  });
});
