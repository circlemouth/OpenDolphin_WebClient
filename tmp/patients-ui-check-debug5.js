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

  const fetchOriginalButton = page.getByRole('button', { name: 'patientgetv2 取得' });
  await fetchOriginalButton.click();
  await page.getByText(/Api_Result:/).first().waitFor({ timeout: 30000 });

  await page.getByRole('radio', { name: 'JSON' }).check();
  await fetchOriginalButton.click();
  await page.getByText(/Format: JSON/).waitFor({ timeout: 30000 });

  const memoActionsCount = await page.$$eval('.patients-page__orca-memo-actions', (els) => els.length);
  const memoButtons = await page.$$eval('.patients-page__orca-memo-actions button', (els) =>
    els.map((el) => ({ text: el.textContent, disabled: el.disabled }))
  );
  console.log('URL', page.url());
  console.log('MEMO_ACTIONS', memoActionsCount);
  console.log('MEMO_BUTTONS', memoButtons);

  await page.screenshot({ path: 'artifacts/ui-check/20260113T082200Z/patients-orca-debug5.png', fullPage: true });

  await browser.close();
})();
