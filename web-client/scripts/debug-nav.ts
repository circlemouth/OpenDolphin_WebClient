import { chromium } from 'playwright';

const AUTH_KEY = 'opendolphin:web-client:auth';

const sessionPayload = {
  credentials: {
    facilityId: '0001',
    userId: 'doctor01',
    passwordMd5: 'dummy-hash',
    clientUuid: 'debug-client-uuid',
  },
  userProfile: {
    facilityId: '0001',
    userId: 'doctor01',
    displayName: 'テストドクター',
    roles: ['admin'],
    userModelId: 1,
  },
  persistedAt: Date.now(),
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  page.on('console', (msg) => {
    console.log('[browser console]', msg.type(), msg.text());
  });

  await page.addInitScript(({ key, value }) => {
    window.sessionStorage.setItem(key, value);
  }, { key: AUTH_KEY, value: JSON.stringify(sessionPayload) });

  await page.goto('https://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('main');

  const navToCharts = page.getByRole('link', { name: 'カルテ閲覧' });
  await navToCharts.click();
  await page.waitForTimeout(1000);

  console.log('URL after charts:', page.url());

  const navToReception = page.getByRole('link', { name: '受付一覧' });
  await navToReception.click();
  await page.waitForTimeout(1000);

  console.log('URL after reception:', page.url());

  const mainHtml = await page.locator('main').innerHTML();
  console.log('\nMain content HTML length:', mainHtml.length);

  await browser.close();
})();
