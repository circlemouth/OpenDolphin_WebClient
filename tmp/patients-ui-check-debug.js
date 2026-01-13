const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const FACILITY_ID = 'LOCAL.FACILITY.0001';
const USER_ID = 'dolphin';
const PASSWORD = 'dolphin';
const RUN_ID = '20260113T082200Z';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

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
  await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-before-memo.png`, fullPage: true });

  const buttonTexts = await page.$$eval('button', (els) => els.map((el) => el.textContent));
  console.log('BUTTON_TEXTS', buttonTexts);

  await browser.close();
})();
