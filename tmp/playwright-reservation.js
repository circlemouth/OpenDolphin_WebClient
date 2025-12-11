const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RUN_ID = process.env.RUN_ID || '20251211T150000Z';
const baseURL = process.env.BASE_URL || 'https://localhost:5173';
const outRoot = path.resolve(__dirname, '../artifacts/webclient/debug/20251211T150000Z-bugs');
const harPath = path.join(outRoot, 'har', 'reservation-session.har');
const logPath = path.join(outRoot, 'logs', 'reservation-session.log');
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
    try { delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__; } catch (_) {}
  });

  page.on('console', (msg) => log(`[console.${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => log(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => log(`[requestfailed] ${req.method()} ${req.url()} => ${req.failure()?.errorText}`));

  const login = {
    facilityId: '1.3.6.1.4.1.9414.10.1',
    userId: 'dolphindev',
    password: 'dolphindev',
  };

  try {
    log('opening /login');
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.fill('label:has-text("施設ID") input', login.facilityId);
    await page.fill('label:has-text("ユーザーID") input', login.userId);
    await page.fill('label:has-text("パスワード") input', login.password);
    await screenshot(page, 'reservation-login.png');

    await Promise.all([
      page.click('button:has-text("ログイン")'),
      page.waitForSelector('.app-shell', { timeout: 10000 }),
    ]);
    await screenshot(page, 'reservation-after-login.png');

    // 直接 URL で予約画面へ飛ぶ案（ルート未実装のため実行は保留）
    // const reservationPath = process.env.RESERVATION_PATH; // 例: '/appointments'
    // if (reservationPath) {
    //   log(`navigating directly to ${reservationPath}`);
    //   await page.goto(reservationPath, { waitUntil: 'networkidle' });
    //   await screenshot(page, 'reservation-direct.png');
    // }

    // ナビゲーション探索: メニューやボタンで「予約」を探す
    const candidateTexts = ['予約', '予約管理', 'Appointment', '予約一覧'];
    let navigated = false;
    for (const text of candidateTexts) {
      const locator = page.getByRole('link', { name: text, exact: false }).first();
      if (await locator.count()) {
        log(`navigating via link text: ${text}`);
        await Promise.all([
          locator.click(),
          page.waitForTimeout(2000),
        ]);
        navigated = true;
        break;
      }
      const button = page.getByRole('button', { name: text, exact: false }).first();
      if (await button.count()) {
        log(`navigating via button text: ${text}`);
        await Promise.all([
          button.click(),
          page.waitForTimeout(2000),
        ]);
        navigated = true;
        break;
      }
    }

    if (!navigated) {
      log('[reservation-missing] 予約系のリンク/ボタンが見つかりませんでした');
      await screenshot(page, 'reservation-missing.png');
      return;
    }

    await screenshot(page, 'reservation.png');

    // 予約一覧っぽいテーブルがあればキャプチャ
    const grid = page.locator('table, [role="grid"]');
    if (await grid.count()) {
      log(`reservation grid count=${await grid.count()}`);
      await screenshot(page, 'reservation-grid.png');
    }

  } finally {
    await context.close();
    await browser.close();
    log('session finished');
    logStream.close();
  }
}

main().catch((err) => {
  log(`[fatal] ${err.message}`);
  logStream.close();
  process.exit(1);
});
