import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const RUN_ID = '20251124T090000Z';
const parentRunId = '20251124T000000Z';
const baseDir = path.join(process.cwd(), '..', 'artifacts', 'api-stability', parentRunId, 'ui-smoke');
const harPath = path.join(baseDir, `${RUN_ID}-orca-smoke.har`);
const logPath = path.join(baseDir, `${RUN_ID}-orca-smoke-log.json`);
fs.mkdirSync(baseDir, { recursive: true });

const session = {
  credentials: {
    facilityId: '0001',
    userId: 'demo',
    passwordMd5: 'dummy-md5',
    clientUuid: 'demo-client-uuid',
  },
  userProfile: {
    facilityId: '0001',
    userId: 'demo',
    displayName: 'Demo Doctor',
    roles: ['doctor'],
    userModelId: 1,
    facilityName: 'Demo Clinic',
  },
  persistedAt: Date.now(),
};

const main = async () => {
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
  const context = await browser.newContext({
    baseURL: 'https://localhost:4173',
    ignoreHTTPSErrors: true,
    recordHar: { path: harPath, mode: 'minimal' },
  });

  await context.addInitScript(({ storedSession }) => {
    sessionStorage.setItem('opendolphin:web-client:auth', JSON.stringify(storedSession));
  }, { storedSession: session });

  const page = await context.newPage();

  const logs = [];
  page.on('console', (msg) => {
    logs.push({ type: 'console', text: msg.text(), location: msg.location(), ts: new Date().toISOString() });
  });
  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/orca/')) return;
    let body = null;
    try {
      body = await response.text();
    } catch (_) {}
    logs.push({
      type: 'response',
      url,
      status: response.status(),
      headers: response.headers(),
      body,
      ts: new Date().toISOString(),
    });
  });

  await page.goto('/charts/72001', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.waitForSelector('text=ORCA マスター検索と併用禁忌チェック', { timeout: 8000 });

  const startBtn = page.getByRole('button', { name: /診察開始/ });
  if (await startBtn.count()) {
    try {
      await startBtn.first().click({ timeout: 5000 });
      await page.waitForTimeout(500);
    } catch (error) {
      logs.push({ type: 'note', text: '診察開始ボタンのクリックに失敗', error: String(error) });
    }
  }

  try {
    const results = await page.evaluate(async () => {
      const endpoints = [
        '/orca/master/etensu',
        '/orca/master/hokenja',
        '/orca/master/address?zipcode=1000001',
        '/orca/tensu/ten/0-300/',
      ];
      const outputs = [];
      for (const endpoint of endpoints) {
        const res = await fetch(endpoint);
        const json = await res.json();
        outputs.push({ endpoint, status: res.status, payload: json });
      }
      return outputs;
    });
    logs.push({ type: 'note', text: 'orca fetch results', data: results });
  } catch (error) {
    logs.push({ type: 'note', text: 'orca fetch evaluate failed', error: String(error) });
  }

  await page.waitForTimeout(500);
  await browser.close();

  fs.writeFileSync(logPath, JSON.stringify({ runId: RUN_ID, parentRunId, logs }, null, 2));
  console.log(JSON.stringify({ harPath, logPath }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
