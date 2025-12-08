const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const artifactDir = path.resolve(__dirname, '../artifacts/webclient/e2e/20251208T180500Z-integration');
  fs.mkdirSync(artifactDir, { recursive: true });
  const consoleLog = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    recordHarPath: path.join(artifactDir, 'network.har'),
  });
  context.addInitScript(() => {
    // Allow React DevTools hook for headless to avoid Vite preamble error
    window.__ALLOW_REACT_DEVTOOLS__ = true;
  });
  const page = await context.newPage();
  page.on('console', (msg) => {
    const line = `${msg.type()}: ${msg.text()}`;
    consoleLog.push(line);
  });
  page.on('pageerror', (err) => {
    const line = `pageerror: ${err.message}`;
    consoleLog.push(line);
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.fill('input[placeholder="例: 0001"]', '1.3.6.1.4.1.9414.10.1');
  await page.fill('input[placeholder="例: doctor01"]', 'dolphindev');
  await page.fill('input[placeholder="パスワード"]', 'dolphindev');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.getByRole('button', { name: /ログイン|login|sign in/i }).click(),
  ]);

  // navigate to Outpatient mock page
  await page.getByRole('link', { name: /Outpatient Mock/i }).click();
  await page.waitForSelector('[data-test-id="outpatient-mock-page"]');
  await page.waitForTimeout(1500);

  // capture telemetry data exposed for debugging
  const telemetry = await page.evaluate(() => ({
    flagsText: document.querySelector('[data-test-id="telemetry-log"]')?.textContent ?? '',
    funnel: (window).__OUTPATIENT_FUNNEL__,
    resolve: (window).__OUTPATIENT_RESOLVE__,
    orchestration: (window).__OUTPATIENT_ORCHESTRATION__,
    runId: (window).__OUTPATIENT_RESOLVE__?.runId ?? null,
  }));
  fs.writeFileSync(path.join(artifactDir, 'telemetry.json'), JSON.stringify(telemetry, null, 2), 'utf8');

  // screenshots
  await page.screenshot({ path: path.join(artifactDir, 'screen-outpatient.png'), fullPage: true });
  await page.locator('[data-test-id="reception-section"]').screenshot({ path: path.join(artifactDir, 'screen-reception.png') });
  await page.locator('[data-test-id="charts-section"]').screenshot({ path: path.join(artifactDir, 'screen-charts.png') });

  fs.writeFileSync(path.join(artifactDir, 'console.txt'), consoleLog.join('\n'), 'utf8');

  await browser.close();
})();
