const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const FACILITY_ID = 'LOCAL.FACILITY.0001';
const USER_ID = 'dolphin';
const PASSWORD = 'dolphin';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('例: 0001').fill(FACILITY_ID);
  await page.getByRole('button', { name: 'ログインへ進む' }).click();

  await page.getByPlaceholder('例: doctor01').waitFor({ timeout: 30000 });
  await page.getByPlaceholder('例: doctor01').fill(USER_ID);
  await page.getByPlaceholder('パスワード').fill(PASSWORD);
  await page.getByRole('button', { name: /ログイン/ }).click();
  await page.waitForURL(/\/f\//, { timeout: 30000 });
  await page.waitForTimeout(1000);

  const currentFacilityButton = page.getByRole('button', { name: '現在の施設へ戻る' });
  if (await currentFacilityButton.isVisible()) {
    await currentFacilityButton.click();
    await page.waitForTimeout(1000);
  }

  await page.goto(`${BASE_URL}/f/${encodeURIComponent(FACILITY_ID)}/patients`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const patientRow = page.getByRole('button', { name: /000002/ }).first();
  await patientRow.click();
  await page.waitForTimeout(2000);

  console.log('insuranceinf1v2 text count', await page.getByText('insuranceinf1v2').count());
  console.log('ORCA メモ取得/更新 heading count', await page.getByRole('heading', { name: 'ORCA メモ取得/更新' }).count());
  console.log('保険者検索 heading count', await page.getByRole('heading', { name: /保険者検索/ }).count());
  console.log('insurance helper class count', await page.locator('.patients-page__insurance-helper').count());

  await page.screenshot({ path: 'artifacts/ui-check/20260113T082200Z/patients-orca-debug6.png', fullPage: true });

  await browser.close();
})();
