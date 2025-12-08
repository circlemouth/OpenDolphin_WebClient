const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const artifactDir = path.join(__dirname, '..', '..', 'artifacts', 'webclient', 'e2e', '20251208T153500Z-integration');
  const harPath = path.join(artifactDir, 'network.har');
  const consolePath = path.join(artifactDir, 'console.txt');
  const telemetryPath = path.join(artifactDir, 'telemetry.json');
  const localLogPath = path.join(artifactDir, 'local.log');

  const consoleLogs = [];
  const telemetry = [];
  const pending = [];

  fs.mkdirSync(artifactDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const baseURL = 'http://localhost:4173';
  const context = await browser.newContext({
    baseURL,
    ignoreHTTPSErrors: true,
    recordHar: { path: harPath, omitContent: false },
  });

  await context.addInitScript(() => {
    // avoid perf-env-boot forcing React DevTools hook to read-only in headless
    window.__ALLOW_REACT_DEVTOOLS__ = true;
    window.__LHCI_DISABLE_REACT_DEVTOOLS__ = false;
  });

  context.on('console', (msg) => {
    const line = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(line);
    if (msg.text().startsWith('[telemetry] Record outpatient funnel')) {
      const args = msg.args();
      if (args.length > 1) {
        const p = args[1].jsonValue().then((data) => telemetry.push(data)).catch(() => {});
        pending.push(p);
      }
    }
  });

  const page = await context.newPage();

  await page.goto(`${baseURL}/login`);
  await page.fill('input[placeholder="例: 0001"]', '1.3.6.1.4.1.9414.10.1');
  await page.fill('input[placeholder="例: doctor01"]', 'dolphindev');
  await page.fill('input[placeholder="パスワード"]', 'dolphindev');
  await page.click('button:has-text("ログイン")');
  await page.waitForURL('**/reception', { timeout: 15000 });

  await page.selectOption('#master-source', 'server');
  await page.click('button:has-text("missingMaster を false に")');
  await page.click('button:has-text("cacheHit を true に")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'reception-tone.png'), fullPage: true });

  await page.click('a:has-text("カルテ / Charts")');
  await page.waitForURL('**/charts', { timeout: 10000 });

  const missingBtn = page.locator('button:has-text("missingMaster:")').first();
  await missingBtn.waitFor({ state: 'visible' });
  let text = await missingBtn.innerText();
  if (text.includes('true')) {
    await missingBtn.click();
    await page.waitForTimeout(200);
    text = await missingBtn.innerText();
    consoleLogs.push(`[action] missingMaster now ${text}`);
  }
  const cacheBtn = page.locator('button:has-text("cacheHit:")').first();
  await cacheBtn.waitFor({ state: 'visible' });
  let cacheText = await cacheBtn.innerText();
  if (cacheText.includes('false')) {
    await cacheBtn.click();
    await page.waitForTimeout(200);
    cacheText = await cacheBtn.innerText();
    consoleLogs.push(`[action] cacheHit now ${cacheText}`);
  }
  await page.selectOption('#transition-select', 'server');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'charts-tone.png'), fullPage: true });

  const patients = page.locator('.patients-tab');
  if (await patients.count()) {
    await patients.first().screenshot({ path: path.join(artifactDir, 'patients-tone.png') });
  }

  await Promise.all(pending);
  await context.close();
  await browser.close();

  fs.writeFileSync(consolePath, consoleLogs.join('\n'), 'utf8');
  fs.writeFileSync(telemetryPath, JSON.stringify(telemetry, null, 2), 'utf8');
  fs.writeFileSync(localLogPath, [
    'RUN_ID=20251208T153500Z',
    'Steps:',
    '- Login -> Reception -> Charts sequence with VITE_DISABLE_MSW=1',
    '- Toggled resolveMasterSource=server, missingMaster=false, cacheHit=true at Reception',
    '- Charts AuthService flags set to missingMaster=false, cacheHit=true, dataSourceTransition=server',
    '- Captured screenshots and telemetry console logs',
  ].join('\n'), 'utf8');
})();
