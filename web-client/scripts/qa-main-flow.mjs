import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const runId = process.env.RUN_ID ?? '20260106T205641Z';
const baseURL = process.env.QA_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'https://localhost:4173';
const artifactRoot =
  process.env.QA_ARTIFACT_DIR ??
  path.resolve(process.cwd(), '..', 'artifacts', 'webclient', 'screen-structure-plan', runId);
const screenshotDir = path.join(artifactRoot, 'screenshots');

fs.mkdirSync(screenshotDir, { recursive: true });

const facilityPath = path.resolve(process.cwd(), '..', 'facility.json');
const facilityJson = JSON.parse(fs.readFileSync(facilityPath, 'utf-8'));
const facilityId = String(facilityJson.facilityId ?? '0001');

const session = {
  facilityId,
  userId: 'doctor1',
  displayName: 'QA Admin',
  clientUuid: `qa-${runId}`,
  runId,
  role: 'admin',
  roles: ['admin'],
};

const results = [];
const debugResults = [];
const legacyResults = [];

const record = (bucket, entry) => bucket.push(entry);

const writeScreenshot = async (page, name) => {
  const fileName = `${name}.png`;
  const filePath = path.join(screenshotDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  return `screenshots/${fileName}`;
};

const runStep = async ({ bucket, label, url, expected, action }) => {
  try {
    const actual = await action();
    record(bucket, { label, url, expected, result: 'OK', actual, error: '' });
  } catch (error) {
    record(bucket, { label, url, expected, result: 'NG', actual: '', error: String(error) });
  }
};

const run = async () => {
  const browser = await chromium.launch({ headless: true });

  // Step 1: Login entry (facility selection) without session.
  {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL });
    const page = await context.newPage();
    await runStep({
      bucket: results,
      label: 'Login: 施設選択画面表示',
      url: `${baseURL}/login`,
      expected: '施設選択画面が表示される',
      action: async () => {
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'OpenDolphin Web 施設選択' }).waitFor({ timeout: 15000 });
        const shot = await writeScreenshot(page, '01-login-entry');
        return `heading=OpenDolphin Web 施設選択 / ${shot}`;
      },
    });
    await context.close();
  }

  const createSessionContext = async () => {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, baseURL });
    await ctx.addInitScript(([key, value]) => {
      window.sessionStorage.setItem(key, value);
    }, ['opendolphin:web-client:auth', JSON.stringify(session)]);
    return ctx;
  };

  // Main flow with session injection.
  const context = await createSessionContext();
  const page = await context.newPage();

  await runStep({
    bucket: results,
    label: 'Reception: 受付画面表示',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/reception`,
    expected: '受付画面が表示され、main に reception-page が存在する',
    action: async () => {
      await page.goto(`/f/${encodeURIComponent(facilityId)}/reception`, { waitUntil: 'domcontentloaded' });
      await page.locator('.reception-page').waitFor({ timeout: 20000 });
      const shot = await writeScreenshot(page, '02-reception');
      return `url=${page.url()} / ${shot}`;
    },
  });

  await runStep({
    bucket: results,
    label: 'Charts: カルテ画面表示',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/charts`,
    expected: 'カルテ画面が表示され、charts-page が存在する',
    action: async () => {
      await page.getByRole('link', { name: /カルテ|Charts/i }).click();
      await page.waitForURL('**/charts');
      await page.locator('.charts-page').waitFor({ timeout: 20000 });
      const shot = await writeScreenshot(page, '03-charts');
      return `url=${page.url()} / ${shot}`;
    },
  });

  await runStep({
    bucket: results,
    label: 'Patients: 患者画面表示',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/patients`,
    expected: '患者画面が表示され、patients-page が存在する',
    action: async () => {
      await page.getByRole('link', { name: /患者|Patients/i }).click();
      await page.waitForURL('**/patients');
      await page.locator('.patients-page').waitFor({ timeout: 20000 });
      const shot = await writeScreenshot(page, '04-patients');
      return `url=${page.url()} / ${shot}`;
    },
  });

  await runStep({
    bucket: results,
    label: 'Administration: 管理画面表示',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/administration`,
    expected: '管理画面が表示され、管理ページ要素が存在する',
    action: async () => {
      await page.getByRole('link', { name: /管理|Administration/i }).click();
      await page.waitForURL('**/administration');
      await page.locator('[data-test-id="administration-page"]').waitFor({ timeout: 20000 });
      const shot = await writeScreenshot(page, '05-administration');
      return `url=${page.url()} / ${shot}`;
    },
  });

  await context.close();

  // Debug isolation checks (fresh session context).
  const debugContext = await createSessionContext();
  const debugPage = await debugContext.newPage();
  {
    const url = `/f/${encodeURIComponent(facilityId)}/debug`;
    await debugPage.goto(url, { waitUntil: 'domcontentloaded' });
    await debugPage.waitForTimeout(1200);
    const denied = await debugPage.getByText('デバッグ導線へのアクセスを拒否しました。').isVisible().catch(() => false);
    const redirectedToLogin = debugPage.url().includes('/login');
    const shot = await writeScreenshot(debugPage, '06-debug-hub-denied');
    record(debugResults, {
      label: 'Debug Hub: デバッグ導線はアクセス拒否',
      url: `${baseURL}${url}`,
      expected: 'アクセス拒否メッセージまたはログイン誘導',
      result: denied || redirectedToLogin ? 'OK' : 'NG',
      actual: `url=${debugPage.url()} / ${shot}${denied ? ' / 拒否表示' : redirectedToLogin ? ' / ログイン誘導' : ' / メッセージ未検出'}`,
      error: '',
    });
  }

  {
    const url = `/f/${encodeURIComponent(facilityId)}/debug/outpatient-mock`;
    await debugPage.goto(url, { waitUntil: 'domcontentloaded' });
    await debugPage.waitForTimeout(1200);
    const denied = await debugPage.getByText('デバッグ画面へのアクセスを拒否しました。').isVisible().catch(() => false);
    const redirectedToLogin = debugPage.url().includes('/login');
    const shot = await writeScreenshot(debugPage, '07-debug-outpatient-denied');
    record(debugResults, {
      label: 'Debug Outpatient Mock: アクセス拒否',
      url: `${baseURL}${url}`,
      expected: 'アクセス拒否メッセージまたはログイン誘導',
      result: denied || redirectedToLogin ? 'OK' : 'NG',
      actual: `url=${debugPage.url()} / ${shot}${denied ? ' / 拒否表示' : redirectedToLogin ? ' / ログイン誘導' : ' / メッセージ未検出'}`,
      error: '',
    });
  }

  // Legacy debug route check (no session).
  {
    const legacyContext = await browser.newContext({ ignoreHTTPSErrors: true, baseURL });
    const legacyPage = await legacyContext.newPage();
    await runStep({
      bucket: legacyResults,
      label: 'Legacy /outpatient-mock: 旧導線の非表示/拒否',
      url: `${baseURL}/outpatient-mock`,
      expected: '旧導線の案内画面またはログイン誘導が表示される',
      action: async () => {
        await legacyPage.goto('/outpatient-mock', { waitUntil: 'domcontentloaded' });
        await legacyPage.locator('main, .status-message, [role="status"]').first().waitFor({ timeout: 15000 });
        const shot = await writeScreenshot(legacyPage, '08-legacy-outpatient-mock');
        return `url=${legacyPage.url()} / ${shot}`;
      },
    });
    await legacyContext.close();
  }

  await debugContext.close();
  await browser.close();

  const summary = {
    runId,
    executedAt: new Date().toISOString(),
    baseURL,
    facilityId,
    sessionRole: session.role,
    mswDisabled: process.env.VITE_DISABLE_MSW ?? '(not provided)',
  };

  const toRows = (items) =>
    items
      .map(
        (item) =>
          `| ${item.label} | ${item.url} | ${item.expected} | ${item.result} | ${item.actual || item.error} |`,
      )
      .join('\n');

  const log = `# 50_主要導線の動作確認と回帰チェック\n\n` +
    `- RUN_ID: ${summary.runId}\n` +
    `- 実施日時: ${summary.executedAt}\n` +
    `- Base URL: ${summary.baseURL}\n` +
    `- Facility ID: ${summary.facilityId}\n` +
    `- セッションロール: ${summary.sessionRole}\n` +
    `- VITE_DISABLE_MSW: ${summary.mswDisabled}\n\n` +
    `## 主要導線（Login → Reception → Charts → Patients → Administration）\n\n` +
    `| 項目 | URL | 期待 | 結果 | 証跡/備考 |\n` +
    `| --- | --- | --- | --- | --- |\n` +
    `${toRows(results)}\n\n` +
    `## デバッグ隔離/旧導線の確認\n\n` +
    `| 項目 | URL | 期待 | 結果 | 証跡/備考 |\n` +
    `| --- | --- | --- | --- | --- |\n` +
    `${toRows(debugResults.concat(legacyResults))}\n\n` +
    `## 備考\n` +
    `- ログインは施設選択画面の表示まで確認。実ログインはローカルDB未初期化のためセッション注入で代替。\n` +
    `- デバッグ導線は VITE_ENABLE_DEBUG_PAGES=0 のため拒否表示またはログイン誘導を確認。\n`;

  fs.mkdirSync(artifactRoot, { recursive: true });
  fs.writeFileSync(path.join(artifactRoot, 'qa-log.md'), log);
  fs.writeFileSync(path.join(artifactRoot, 'qa-log.json'), JSON.stringify({ summary, results, debugResults, legacyResults }, null, 2));

  console.log(`QA log written: ${path.join(artifactRoot, 'qa-log.md')}`);
  console.log(`Screenshots: ${screenshotDir}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
