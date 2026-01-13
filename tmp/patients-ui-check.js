const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const FACILITY_ID = 'LOCAL.FACILITY.0001';
const USER_ID = 'dolphin';
const PASSWORD = 'dolphin';
const RUN_ID = '20260113T082200Z';

const ensureVisible = async (page, locator) => {
  await locator.scrollIntoViewIfNeeded();
  await locator.waitFor({ state: 'visible', timeout: 30000 });
};

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
  console.log('URL(after goto patients)', page.url());

  const patientRow = page.getByRole('button', { name: /000002/ }).first();
  await ensureVisible(page, patientRow);
  await patientRow.click();

  const orcaOriginal = page.getByText('patientgetv2 原本参照');
  await ensureVisible(page, orcaOriginal);

  const fetchOriginalButton = page.getByRole('button', { name: 'patientgetv2 取得' });
  await fetchOriginalButton.click();
  await page.getByText(/Api_Result:/).first().waitFor({ timeout: 30000 });
  await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-orca-original-xml.png`, fullPage: true });

  await page.getByRole('radio', { name: 'JSON' }).check();
  await fetchOriginalButton.click();
  await page.getByText(/Format: JSON/).waitFor({ timeout: 30000 });
  await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-orca-original-json.png`, fullPage: true });

  const memoSection = page.locator('.patients-page__orca-memo');
  const memoSectionCount = await memoSection.count();
  console.log('MEMO_SECTION_COUNT', memoSectionCount);
  await memoSection.waitFor({ state: 'visible', timeout: 30000 });
  await memoSection.scrollIntoViewIfNeeded();
  const memoActions = memoSection.locator('.patients-page__orca-memo-actions');
  await memoActions.waitFor({ state: 'visible', timeout: 30000 });
  const refetchButton = memoActions.locator('button').first();
  const refetchHandle = await refetchButton.elementHandle();
  if (refetchHandle) {
    await page.waitForFunction((el) => !el.disabled, refetchHandle, { timeout: 30000 });
  }
  await refetchButton.click();
  await page.waitForTimeout(1500);

  const memoTextarea = memoSection.locator('textarea');
  await memoTextarea.fill('テストメモ');
  await page.waitForTimeout(500);
  const dateInputs = memoSection.locator('input[type=\"date\"]');
  const dateCount = await dateInputs.count();
  if (dateCount > 0) {
    const performDateInput = dateCount > 1 ? dateInputs.nth(1) : dateInputs.first();
    const performDateValue = await performDateInput.inputValue();
    if (!performDateValue) {
      const today = new Date().toISOString().slice(0, 10);
      await performDateInput.fill(today);
    }
  }
  await page.waitForTimeout(300);
  const saveButton = memoActions.locator('button').nth(1);
  const memoButtons = await memoActions.locator('button').evaluateAll((els) =>
    els.map((el) => ({ text: el.textContent, disabled: el.disabled }))
  );
  console.log('MEMO_BUTTONS', memoButtons);
  if (memoButtons.length === 0) {
    await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-orca-memo-empty.png`, fullPage: true });
  }
  if (memoButtons.length < 2) {
    await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-orca-memo.png`, fullPage: true });
  } else {
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.waitFor({ state: 'visible', timeout: 30000 });
    const saveHandle = await saveButton.elementHandle();
    if (saveHandle) {
      await page.waitForFunction((el) => !el.disabled, saveHandle, { timeout: 30000 });
    }
    await saveButton.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-orca-memo.png`, fullPage: true });
  }

  const insuranceSection = page.locator('.patients-page__insurance-helper');
  const insuranceCount = await insuranceSection.count();
  console.log('INSURANCE_SECTION_COUNT', insuranceCount);
  await insuranceSection.waitFor({ state: 'visible', timeout: 30000 });
  await insuranceSection.scrollIntoViewIfNeeded();
  await insuranceSection.getByRole('button', { name: '保険者一覧を取得' }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `artifacts/ui-check/${RUN_ID}/patients-insurance.png`, fullPage: true });

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
