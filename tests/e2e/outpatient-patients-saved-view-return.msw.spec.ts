import { test, expect } from '../playwright/fixtures';

import { profile, seedAuthSession } from './helpers/orcaMaster';

const RUN_ID = '20260129T204103Z';

test.describe('Patients saved view return flow', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用（Stage 接続禁止）');

  test('検索→保存ビュー→復帰導線を確認する', async ({ page }) => {
    await page.context().setExtraHTTPHeaders({
      'x-msw-scenario': 'patient-normal',
      'X-Run-Id': RUN_ID,
    });

    await seedAuthSession(page);
    await page.goto('/patients?msw=1&from=charts&returnTo=/charts?patientId=000001');
    await expect(page.getByRole('heading', { name: '患者一覧と編集' })).toBeVisible();

    const keywordInput = page.getByRole('searchbox', { name: '患者検索キーワード' });
    await keywordInput.fill('000002');
    await page.getByRole('button', { name: '検索を更新' }).click();

    await page.getByLabel('ビュー名').fill('テストビュー');
    await page.getByRole('button', { name: '現在の条件を保存' }).click();

    await keywordInput.fill('000001');
    const savedView = page.locator('.patients-search__saved');
    await savedView.getByRole('combobox', { name: '保存ビュー' }).selectOption({ label: 'テストビュー' });
    await savedView.getByRole('button', { name: '適用' }).click();
    await expect(keywordInput).toHaveValue('000002');

    await expect(page.getByText('クエリ指定')).toBeVisible();
    const chartsButton = page.getByRole('button', { name: 'Charts に戻る' });
    await expect(chartsButton).toBeEnabled();
    await Promise.all([
      page.waitForURL('**/charts**', { timeout: 10_000 }),
      chartsButton.click(),
    ]);
  });
});
