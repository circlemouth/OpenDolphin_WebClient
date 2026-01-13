const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const FACILITY_ID = 'LOCAL.FACILITY.0001';
const USER_ID = 'dolphin';
const PASSWORD = 'dolphin';
const RUN_ID = '20260113T082200Z';

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

  await page.waitForSelector('.patients-page__orca-memo', { state: 'attached', timeout: 30000 });
  await page.locator('.patients-page__orca-memo').scrollIntoViewIfNeeded();

  const refetchButton = page.locator('.patients-page__orca-memo-actions button').first();
  await refetchButton.click();
  await page.waitForTimeout(1500);

  const today = new Date().toISOString().slice(0, 10);
  await page.evaluate((value) => {
    const textarea = document.querySelector('.patients-page__orca-memo textarea');
    if (textarea) {
      textarea.value = 'テストメモ';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const dateInputs = document.querySelectorAll('.patients-page__orca-memo input[type="date"]');
    const performInput = dateInputs.length > 1 ? dateInputs[1] : dateInputs[0];
    if (performInput && !performInput.value) {
      performInput.value = value;
      performInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, today);

  await page.waitForTimeout(500);

  const saveButton = page.locator('.patients-page__orca-memo-actions button').nth(1);
  await saveButton.click({ force: true });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-orca-memo.png`, fullPage: true });

  await browser.close();
})();
