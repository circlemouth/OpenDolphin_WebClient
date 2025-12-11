const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RUN_ID = process.env.RUN_ID || '20251211T150000Z';
const baseURL = process.env.BASE_URL || 'https://localhost:5173';
// 証跡はリポジトリ直下の artifacts 配下へ保存する
const outRoot = path.resolve(__dirname, '../artifacts/webclient/debug/20251211T150000Z-bugs');
const harPath = path.join(outRoot, 'har', 'headed-session.har');
const logPath = path.join(outRoot, 'logs', 'headed-session.log');
const screenshotDir = path.join(outRoot, 'screenshots');

fs.mkdirSync(path.dirname(harPath), { recursive: true });
fs.mkdirSync(path.dirname(logPath), { recursive: true });
fs.mkdirSync(screenshotDir, { recursive: true });

const logStream = fs.createWriteStream(logPath, { flags: 'w' });
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  logStream.write(`${line}\n`);
  console.log(line);
};

async function screenshot(page, name) {
  const filePath = path.join(screenshotDir, name);
  await page.screenshot({ path: filePath, fullPage: true });
  log(`screenshot: ${name}`);
}

async function main() {
  log(`RUN_ID=${RUN_ID} baseURL=${baseURL}`);

  const browser = await chromium.launch({ headless: false, args: ['--disable-extensions'] });
  const context = await browser.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
    viewport: { width: 1400, height: 900 },
    recordHar: { path: harPath, mode: 'full' },
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    try {
      // Avoid React DevTools preamble errors in Playwright.
      delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    } catch (e) {
      /* noop */
    }
  });

  page.on('console', (msg) => log(`[console.${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => log(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => log(`[requestfailed] ${req.method()} ${req.url()} => ${req.failure()?.errorText}`));

  const safeGoto = async (url) => {
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      return true;
    } catch (error) {
      log(`[goto-error] ${url} :: ${error.message}`);
      return false;
    }
  };

  const login = {
    facilityId: '1.3.6.1.4.1.9414.10.1',
    userId: 'dolphindev',
    password: 'dolphindev',
  };

  try {
    log('opening /login');
    await safeGoto('/login');
    await page.waitForTimeout(1500);
    await screenshot(page, 'login-headed.png');

    const formCount = await page.locator('form.login-form').count();
    log(`login form count=${formCount}`);
    if (formCount === 0) {
      log('login form not rendered; aborting scenario');
      return;
    }

    await page.fill('label:has-text("施設ID") input', login.facilityId);
    await page.fill('label:has-text("ユーザーID") input', login.userId);
    await page.fill('label:has-text("パスワード") input', login.password);
    await screenshot(page, 'login-filled.png');

    await Promise.all([
      page.click('button:has-text("ログイン")'),
      page.waitForTimeout(2000),
    ]);

    let loggedIn = false;
    try {
      await page.waitForSelector('.app-shell', { timeout: 10000 });
      loggedIn = true;
      log('app-shell detected');
    } catch (error) {
      log(`[login-wait-failed] ${error.message}`);
    }
    await screenshot(page, loggedIn ? 'after-login.png' : 'login-error.png');

    const navSteps = [
      { name: 'reception', linkText: '受付 / トーン連携', shot: 'reception.png' },
      { name: 'charts', linkText: 'カルテ / Charts', shot: 'charts.png' },
      { name: 'outpatient-mock', linkText: 'Outpatient Mock', shot: 'outpatient-mock.png' },
      // 予約画面: リンク文言揺れを許容し、見つからなければログだけ残す
      { name: 'reservation', linkText: '予約', shot: 'reservation.png' },
    ];

    for (const step of navSteps) {
      const link = page.getByRole('link', { name: step.linkText });
      const exists = await link.count();
      if (exists === 0) {
        log(`[nav-missing] ${step.name} link not found`);
        continue;
      }
      log(`navigating to ${step.name}`);
      await Promise.all([
        link.first().click(),
        page.waitForTimeout(2000),
      ]);
      await screenshot(page, `${step.shot}`);
    }
  } finally {
    await context.close();
    await browser.close();
    log('session finished');
    logStream.close();
  }
}

main().catch((error) => {
  log(`[fatal] ${error.message}`);
  logStream.close();
  process.exit(1);
});
