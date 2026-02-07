import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const now = new Date();
const runId = process.env.RUN_ID ?? now.toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const baseURL = process.env.QA_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5174';
const artifactRoot =
  process.env.QA_ARTIFACT_DIR ??
  path.resolve(process.cwd(), '..', 'artifacts', 'webclient', 'screen-structure-plan', runId);
const screenshotDir = path.join(artifactRoot, 'screenshots-orca-off');

fs.mkdirSync(screenshotDir, { recursive: true });

const facilityPath = path.resolve(process.cwd(), '..', 'facility.json');
const facilityJson = JSON.parse(fs.readFileSync(facilityPath, 'utf-8'));
const facilityId = String(facilityJson.facilityId ?? '0001');

const sessionRole = process.env.QA_ROLE ?? 'admin';
const sessionRoles = process.env.QA_ROLES ? process.env.QA_ROLES.split(',').map((role) => role.trim()).filter(Boolean) : [sessionRole];
const scenarioLabel = process.env.QA_SCENARIO ?? sessionRole;

const authUserId = 'doctor1';
const authPasswordPlain = 'doctor2025';
const authPasswordMd5 = '632080fabdb968f9ac4f31fb55104648';

const session = {
  facilityId,
  userId: authUserId,
  displayName: `QA ${scenarioLabel}`,
  clientUuid: `qa-${runId}`,
  runId,
  role: sessionRole,
  roles: sessionRoles,
};

const results = [];
const responses = [];

const record = (bucket, entry) => bucket.push(entry);

const writeScreenshot = async (page, name) => {
  const fileName = `${name}.png`;
  const filePath = path.join(screenshotDir, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  return `screenshots-orca-off/${fileName}`;
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
  await ctx.addInitScript(
    ([key, value, auth]) => {
      window.sessionStorage.setItem(key, value);
      window.sessionStorage.setItem('devFacilityId', auth.facilityId);
      window.sessionStorage.setItem('devUserId', auth.userId);
      window.sessionStorage.setItem('devPasswordMd5', auth.passwordMd5);
      window.sessionStorage.setItem('devPasswordPlain', auth.passwordPlain);
      window.sessionStorage.setItem('devClientUuid', auth.clientUuid);
      window.localStorage.setItem('devFacilityId', auth.facilityId);
      window.localStorage.setItem('devUserId', auth.userId);
      window.localStorage.setItem('devPasswordMd5', auth.passwordMd5);
      window.localStorage.setItem('devPasswordPlain', auth.passwordPlain);
      window.localStorage.setItem('devClientUuid', auth.clientUuid);
    },
    [
      'opendolphin:web-client:auth',
      JSON.stringify(session),
      {
        facilityId,
        userId: authUserId,
        passwordMd5: authPasswordMd5,
        passwordPlain: authPasswordPlain,
        clientUuid: session.clientUuid,
      },
    ],
  );
  return ctx;
};

const isTarget = (url) =>
  url.includes('/orca/appointments/list') ||
  url.includes('/orca/visits/list') ||
  url.includes('/orca21/medicalmodv2/outpatient');

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await createSessionContext(browser);
  const page = await context.newPage();

  page.on('response', async (response) => {
    const url = response.url();
    if (!isTarget(url)) return;
    responses.push({
      url,
      status: response.status(),
      statusText: response.statusText(),
    });
  });

  await runStep({
    label: 'Reception: 外来リスト取得(ORCA off)',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/reception`,
    expected: 'reception-page が表示され、/orca/appointments/list が 404 にならない',
    action: async () => {
      await page.goto(`/f/${encodeURIComponent(facilityId)}/reception`, { waitUntil: 'domcontentloaded' });
      await page.locator('.reception-page').waitFor({ timeout: 20000 });
      await page.waitForTimeout(2000);
      const shot = await writeScreenshot(page, '01-reception-orca-off');
      const appointmentResponses = responses.filter((r) => r.url.includes('/orca/appointments/list'));
      const has404 = appointmentResponses.some((r) => r.status === 404);
      if (has404) throw new Error(`appointments/list returned 404: ${JSON.stringify(appointmentResponses)}`);
      return `url=${page.url()} / ${shot} / appointments=${appointmentResponses.length}`;
    },
  });

  await runStep({
    label: 'Charts: 外来カルテ取得(ORCA off)',
    url: `${baseURL}/f/${encodeURIComponent(facilityId)}/charts`,
    expected: 'charts-page が表示され、/orca21/medicalmodv2/outpatient が 404 にならない',
    action: async () => {
      await page.getByRole('link', { name: /カルテ|Charts/i }).click();
      await page.waitForURL('**/charts');
      await page.locator('.charts-page').waitFor({ timeout: 20000 });
      await page.waitForTimeout(2000);
      const shot = await writeScreenshot(page, '02-charts-orca-off');
      const medicalResponses = responses.filter((r) => r.url.includes('/orca21/medicalmodv2/outpatient'));
      const has404 = medicalResponses.some((r) => r.status === 404);
      if (has404) throw new Error(`medicalmodv2/outpatient returned 404: ${JSON.stringify(medicalResponses)}`);
      return `url=${page.url()} / ${shot} / medical=${medicalResponses.length}`;
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

  const log = `# Reception/Charts ORCA 404 解消確認（VITE_ORCA_API_PATH_PREFIX=off）\n\n` +
    `- RUN_ID: ${summary.runId}\n` +
    `- 実施日時: ${summary.executedAt}\n` +
    `- Base URL: ${summary.baseURL}\n` +
    `- Facility ID: ${summary.facilityId}\n` +
    `- セッションロール: ${summary.sessionRole}\n` +
    `- シナリオ: ${summary.scenario}\n\n` +
    `| 項目 | URL | 期待 | 結果 | 証跡/備考 |\n` +
    `| --- | --- | --- | --- | --- |\n` +
    `${toRows(results)}\n\n` +
    `## Network Responses\n\n` +
    responses.map((r) => `- ${r.status} ${r.url}`).join('\n') +
    `\n`;

  fs.mkdirSync(artifactRoot, { recursive: true });
  fs.writeFileSync(path.join(artifactRoot, 'qa-reception-charts-orca.md'), log);
  fs.writeFileSync(path.join(artifactRoot, 'qa-reception-charts-orca.json'), JSON.stringify({ summary, results, responses }, null, 2));

  console.log(`QA log written: ${path.join(artifactRoot, 'qa-reception-charts-orca.md')}`);
  console.log(`Screenshots: ${screenshotDir}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
