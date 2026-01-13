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

  const memoSection = page.locator('.patients-page__orca-memo');
  await memoSection.waitFor({ state: 'visible', timeout: 30000 });
  await memoSection.scrollIntoViewIfNeeded();

  const memoActions = memoSection.locator('.patients-page__orca-memo-actions');
  await memoActions.waitFor({ state: 'visible', timeout: 30000 });
  const refetchButton = memoActions.locator('button').first();
  await refetchButton.click();
  await memoSection.getByText(/Api_Result:/).first().waitFor({ timeout: 30000 });

  const memoTextarea = memoSection.locator('textarea');
  await memoTextarea.fill('テストメモ');

  const dateInputs = memoSection.locator('input[type="date"]');
  if (await dateInputs.count()) {
    const performDateInput = (await dateInputs.count()) > 1 ? dateInputs.nth(1) : dateInputs.first();
    const performDateValue = await performDateInput.inputValue();
    if (!performDateValue) {
      const today = new Date().toISOString().slice(0, 10);
      await performDateInput.fill(today);
    }
  }

  const saveButton = memoActions.locator('button').nth(1);
  const memoButtonCount = await memoActions.locator('button').count();
  if (memoButtonCount >= 2) {
    const saveHandle = await saveButton.elementHandle();
    if (saveHandle) {
      await page.waitForFunction((el) => !el.disabled, saveHandle, { timeout: 30000 });
    }
    await saveButton.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-orca-memo.png`, fullPage: true });
  } else {
    await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-orca-memo.png`, fullPage: true });
  }

  const insuranceSection = page.locator('.patients-page__insurance-helper');
  await insuranceSection.waitFor({ state: 'visible', timeout: 30000 });
  await insuranceSection.scrollIntoViewIfNeeded();
  await insuranceSection.getByRole('button', { name: '保険者一覧を取得' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-insurance.png`, fullPage: true });

  await browser.close();
})();
