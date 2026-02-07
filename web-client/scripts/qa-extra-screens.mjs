import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const now = new Date();
const runId = process.env.RUN_ID ?? now.toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const baseURL = process.env.QA_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const artifactRoot =
  process.env.QA_ARTIFACT_DIR ??
  path.resolve(process.cwd(), '..', 'artifacts', 'webclient', 'screen-structure-plan', runId);
const screenshotDir = path.join(artifactRoot, 'screenshots-extra');

fs.mkdirSync(screenshotDir, { recursive: true });

const facilityPath = path.resolve(process.cwd(), '..', 'facility.json');
const facilityJson = JSON.parse(fs.readFileSync(facilityPath, 'utf-8'));
const facilityId = String(facilityJson.facilityId ?? '0001');

const sessionRole = process.env.QA_ROLE ?? 'admin';
const sessionRoles = process.env.QA_ROLES ? process.env.QA_ROLES.split(',').map((role) => role.trim()).filter(Boolean) : [sessionRole];
const scenarioLabel = process.env.QA_SCENARIO ?? sessionRole;

const session = {
  facilityId,
  userId: 'doctor1',
  displayName: `QA ${scenarioLabel}`,
  clientUuid: `qa-${runId}`,
  runId,
  role: sessionRole,
  roles: sessionRoles,
};

const results = [];

const record = (bucket, entry) => bucket.push(entry);

const writeScreenshot = async (page, name) => {
  const fileName = `${name}.png`;
  const filePath = path.join(screenshotDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  return `screenshots-extra/${fileName}`;
};

const runStep = async ({ label, url, expected, action }) => {
  try {
    const actual = await action();
    record(results, { label, url, expected, result: 'OK', actual, error: '' });
  } catch (error) {
    record(results, { label, url, expected, result: 'NG', actual: '', error: String(error) });
  }
};

const createSessionContext = async (browser) => {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, baseURL });
  await ctx.addInitScript(([key, value]) => {
    window.sessionStorage.setItem(key, value);
  }, ['opendolphin:web-client:auth', JSON.stringify(session)]);
  return ctx;
};

const checkDenied = async (page, text) =>
  await page.getByText(text).isVisible().catch(() => false);

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await createSessionContext(browser);
  const page = await context.newPage();

  // Charts Print: outpatient
  await runStep({
    label: 'Charts Print: 外来印刷プレビュー',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/charts/print/outpatient`,
    expected: 'charts-print 画面が表示される（状態欠落の場合はエラーバナー）',
    action: async () => {
      await page.goto(`/f/${encodeURIComponent(facilityId)}/charts/print/outpatient`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const hasPrint = (await page.locator('main.charts-print').count()) > 0;
      const redirected = page.url().includes('/login');
      const shot = await writeScreenshot(page, '01-charts-print-outpatient');
      if (!hasPrint && redirected) throw new Error(`redirected to ${page.url()}`);
      return `url=${page.url()} / ${shot} / charts-print=${hasPrint}`;
    },
  });

  // Charts Print: document
  await runStep({
    label: 'Charts Print: 文書印刷プレビュー',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/charts/print/document`,
    expected: 'charts-print 画面が表示される（状態欠落の場合はエラーバナー）',
    action: async () => {
      await page.goto(`/f/${encodeURIComponent(facilityId)}/charts/print/document`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const hasPrint = (await page.locator('main.charts-print').count()) > 0;
      const redirected = page.url().includes('/login');
      const shot = await writeScreenshot(page, '02-charts-print-document');
      if (!hasPrint && redirected) throw new Error(`redirected to ${page.url()}`);
      return `url=${page.url()} / ${shot} / charts-print=${hasPrint}`;
    },
  });

  // Debug ORCA API
  await runStep({
    label: 'Debug ORCA API Console',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/debug/orca-api`,
    expected: 'アクセス拒否または ORCA API Console が表示',
    action: async () => {
      await page.goto(`/f/${encodeURIComponent(facilityId)}/debug/orca-api`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const denied = await checkDenied(page, '権限がないため ORCA API コンソールへのアクセスを拒否しました。');
      const consoleVisible = (await page.getByText('Debug / ORCA API Console').count()) > 0;
      const redirected = page.url().includes('/login');
      const shot = await writeScreenshot(page, '03-debug-orca-api');
      if (!denied && !consoleVisible && redirected) {
        throw new Error(`redirected to ${page.url()}`);
      }
      return `url=${page.url()} / ${shot} / denied=${denied} / console=${consoleVisible}`;
    },
  });

  // Debug Legacy REST
  await runStep({
    label: 'Debug Legacy REST Console',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/debug/legacy-rest`,
    expected: 'アクセス拒否または Legacy REST コンソールが表示',
    action: async () => {
      await page.goto(`/f/${encodeURIComponent(facilityId)}/debug/legacy-rest`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const denied = await checkDenied(page, '権限がないため Legacy REST コンソールへのアクセスを拒否しました。');
      const consoleVisible = (await page.getByText('Legacy REST 互換 API コンソール').count()) > 0;
      const redirected = page.url().includes('/login');
      const shot = await writeScreenshot(page, '04-debug-legacy-rest');
      if (!denied && !consoleVisible && redirected) {
        throw new Error(`redirected to ${page.url()}`);
      }
      return `url=${page.url()} / ${shot} / denied=${denied} / console=${consoleVisible}`;
    },
  });

  await context.close();
  await browser.close();

  const summary = {
    runId,
    executedAt: new Date().toISOString(),
    baseURL,
    facilityId,
    sessionRole: session.role,
    scenario: scenarioLabel,
  };

  const toRows = (items) =>
    items
      .map(
        (item) =>
          `| ${item.label} | ${item.url} | ${item.expected} | ${item.result} | ${item.actual || item.error} |`,
      )
      .join('\n');

  const log = `# 追加画面の動作確認（残り画面）\n\n` +
    `- RUN_ID: ${summary.runId}\n` +
    `- 実施日時: ${summary.executedAt}\n` +
    `- Base URL: ${summary.baseURL}\n` +
    `- Facility ID: ${summary.facilityId}\n` +
    `- セッションロール: ${summary.sessionRole}\n` +
    `- シナリオ: ${summary.scenario}\n\n` +
    `| 項目 | URL | 期待 | 結果 | 証跡/備考 |\n` +
    `| --- | --- | --- | --- | --- |\n` +
    `${toRows(results)}\n`;

  fs.mkdirSync(artifactRoot, { recursive: true });
  fs.writeFileSync(path.join(artifactRoot, 'qa-extra-log.md'), log);
  fs.writeFileSync(path.join(artifactRoot, 'qa-extra-log.json'), JSON.stringify({ summary, results }, null, 2));

  console.log(`QA extra log written: ${path.join(artifactRoot, 'qa-extra-log.md')}`);
  console.log(`Screenshots: ${screenshotDir}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
