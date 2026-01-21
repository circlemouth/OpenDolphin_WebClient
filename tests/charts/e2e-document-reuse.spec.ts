import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../playwright/fixtures';
import { baseUrl, e2eAuthSession, seedAuthSession, withChartLock } from '../e2e/helpers/orcaMaster';

const RUN_ID = process.env.RUN_ID ?? '20260121T111311Z';
process.env.RUN_ID ??= RUN_ID;

test.use({
  ignoreHTTPSErrors: true,
  extraHTTPHeaders: {
    'x-msw-missing-master': '0',
    'x-msw-transition': 'server',
    'x-msw-cache-hit': '0',
    'x-msw-fallback-used': '0',
    'x-msw-run-id': RUN_ID,
  },
});

test('文書履歴をコピーして編集フォームへ再適用できる', async ({ page }) => {
  const artifactDir =
    process.env.PLAYWRIGHT_ARTIFACT_DIR ??
    path.join(process.cwd(), 'artifacts', 'webclient', 'orca-e2e', '20260121', 'document-reuse');
  fs.mkdirSync(artifactDir, { recursive: true });

  await withChartLock(page, async () => {
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

    await page.goto(
      `${baseUrl}/f/${facilityId}/charts?patientId=000001&visitDate=2026-01-21&msw=1`,
    );
    await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });

    const utilityTabs = page.getByRole('tablist', { name: 'ユーティリティ' });
    const documentTab = utilityTabs.getByRole('tab', { name: '文書' });
    await expect(documentTab).toBeEnabled({ timeout: 20_000 });
    await documentTab.click();

    const panel = page.locator('[data-test-id="document-create-panel"]');
    await expect(panel.getByText('文書作成メニュー')).toBeVisible({ timeout: 10_000 });

    await panel.getByLabel('テンプレート *').selectOption('REF-ODT-STD');
    await panel.getByLabel('宛先医療機関 *').fill('東京クリニック');
    await panel.getByLabel('宛先医師 *').fill('山田太郎');
    await panel.getByLabel('紹介目的 *').fill('精査依頼');
    await panel.getByLabel('主病名 *').fill('高血圧');
    await panel.getByLabel('紹介内容 *').fill('既往歴と検査結果を記載');
    await panel.getByRole('button', { name: '保存' }).click();
    await expect(panel.getByText('文書を保存しました。')).toBeVisible({ timeout: 10_000 });

    const storageKey = `opendolphin:web-client:charts:document-history:v2:${facilityId}:${userId}`;
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), storageKey);
    expect(stored).not.toBeNull();

    await panel.getByRole('button', { name: 'コピーして編集' }).click();
    await expect(panel.getByLabel('宛先医療機関 *')).toHaveValue('東京クリニック');
    await expect(panel.getByLabel('宛先医師 *')).toHaveValue('山田太郎');
    await expect(panel.getByLabel('紹介目的 *')).toHaveValue('精査依頼');
    await expect(panel.getByLabel('主病名 *')).toHaveValue('高血圧');
    await expect(panel.getByLabel('紹介内容 *')).toHaveValue('既往歴と検査結果を記載');

    await page.screenshot({
      path: path.join(artifactDir, 'document-reuse.png'),
      fullPage: true,
    });
  });
});
