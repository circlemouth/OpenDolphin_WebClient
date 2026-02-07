import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const now = new Date();
const runId = process.env.RUN_ID ?? now.toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const baseURL = process.env.QA_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

const repoRoot = path.resolve(process.cwd());
const artifactRoot =
  process.env.QA_ARTIFACT_DIR ?? path.resolve(repoRoot, 'artifacts', 'verification', runId, 'charts-ui-prestudy');
const screenshotDir = path.join(artifactRoot, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

const facilityPath = path.resolve(repoRoot, 'facility.json');
const facilityJson = JSON.parse(fs.readFileSync(facilityPath, 'utf-8'));
const facilityId = String(facilityJson.facilityId ?? '0001');

const sessionRole = process.env.QA_ROLE ?? 'admin';
const sessionRoles = process.env.QA_ROLES
  ? process.env.QA_ROLES
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean)
  : [sessionRole];
const scenarioLabel = process.env.QA_SCENARIO ?? sessionRole;

// NOTE: These are dev-only credentials commonly used in existing QA scripts.
// Avoid printing them.
const authUserId = process.env.QA_USER_ID ?? 'doctor1';
const authPasswordPlain = process.env.QA_PASSWORD_PLAIN ?? 'doctor2025';
const authPasswordMd5 = process.env.QA_PASSWORD_MD5 ?? '632080fabdb968f9ac4f31fb55104648';

const patientId = process.env.QA_PATIENT_ID ?? '01415';

const session = {
  facilityId,
  userId: authUserId,
  displayName: `QA ${scenarioLabel}`,
  clientUuid: `qa-${runId}`,
  runId,
  role: sessionRole,
  roles: sessionRoles,
};

const viewports = [
  { width: 1366, height: 768, label: '1366x768' },
  { width: 1440, height: 900, label: '1440x900' },
  { width: 1920, height: 1080, label: '1920x1080' },
];

const chartUrl = `/f/${encodeURIComponent(facilityId)}/charts?patientId=${encodeURIComponent(patientId)}&runId=${encodeURIComponent(runId)}`;

const applyMaskStyle = async (page) => {
  // Mask potentially sensitive patient info (left column + sticky summary).
  await page.addStyleTag({
    content: `
      #charts-patient-summary,
      .charts-workbench__column--left,
      #charts-patient-memo {
        filter: blur(10px) !important;
      }
      #charts-patient-summary::after,
      .charts-workbench__column--left::after,
      #charts-patient-memo::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.15);
        pointer-events: none;
      }
    `,
  });
};

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    x: Math.round(r.x),
    y: Math.round(r.y),
    width: Math.round(r.width),
    height: Math.round(r.height),
    top: Math.round(r.top),
    right: Math.round(r.right),
    bottom: Math.round(r.bottom),
    left: Math.round(r.left),
  };
};

const evaluateMeasurements = async (page) => {
  return await page.evaluate(() => {
    const rectOf = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const round = (v) => Math.round(v);
      return {
        x: round(r.x),
        y: round(r.y),
        width: round(r.width),
        height: round(r.height),
        top: round(r.top),
        right: round(r.right),
        bottom: round(r.bottom),
        left: round(r.left),
      };
    };

    const visibleHeight = (rect) => {
      if (!rect) return 0;
      const top = Math.max(0, rect.top);
      const bottom = Math.min(window.innerHeight, rect.bottom);
      return Math.max(0, Math.round(bottom - top));
    };

    const scrollInfo = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return { selector: sel, present: false };
      const style = window.getComputedStyle(el);
      const canScrollY = ['auto', 'scroll'].includes(style.overflowY) || ['auto', 'scroll'].includes(style.overflow);
      const canScrollX = ['auto', 'scroll'].includes(style.overflowX) || ['auto', 'scroll'].includes(style.overflow);
      return {
        selector: sel,
        present: true,
        overflowY: style.overflowY,
        overflowX: style.overflowX,
        canScrollY,
        canScrollX,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        isOverflowingY: el.scrollHeight > el.clientHeight + 1,
        isOverflowingX: el.scrollWidth > el.clientWidth + 1,
      };
    };

    const centerColumn = rectOf('.charts-workbench__column--center');
    const centerVisible = visibleHeight(centerColumn);

    const topbar = rectOf('#charts-topbar');
    const actionbar = rectOf('#charts-actionbar');
    const summary = rectOf('#charts-patient-summary');

    const soapCard = rectOf('#charts-soap-note');
    const timelineCard = rectOf('#charts-document-timeline');
    const centerHeader = rectOf('.charts-workbench__column--center .charts-column-header');

    const workbench = rectOf('.charts-workbench');
    const workbenchLayout = rectOf('.charts-workbench__layout');

    const doc = document.documentElement;

    return {
      url: location.href,
      scrollY: Math.round(window.scrollY),
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      pageScroll: {
        isScrollable: doc.scrollHeight > window.innerHeight + 1,
        scrollHeight: doc.scrollHeight,
        clientHeight: doc.clientHeight,
      },
      fixedHeights: {
        topbarHeight: topbar?.height ?? null,
        actionbarHeight: actionbar?.height ?? null,
        stickySummaryHeight: summary?.height ?? null,
        centerColumnHeaderHeight: centerHeader?.height ?? null,
      },
      centralInput: {
        // "central" is the center column; cards represent the main input blocks.
        centerColumnRect: centerColumn,
        centerColumnVisibleHeight: centerVisible,
        soapCardRect: soapCard,
        timelineCardRect: timelineCard,
        workbenchRect: workbench,
        workbenchLayoutRect: workbenchLayout,
      },
      scrollAreas: [
        { selector: 'window', present: true, isOverflowingY: doc.scrollHeight > window.innerHeight + 1 },
        scrollInfo('.document-timeline__virtual'),
        scrollInfo('.charts-docked-panel__tabs'),
        scrollInfo('.charts-orca-original__response'),
      ],
    };
  });
};

const createSessionContext = async (browser) => {
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    baseURL,
  });

  await ctx.addInitScript(
    ([key, value, auth]) => {
      // Auth session (app)
      window.sessionStorage.setItem(key, value);

      // Dev auth helpers (used by httpClient/vite proxy in this repo)
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

      // Seed encounter context to avoid "patient not selected" blocking too much UI.
      window.sessionStorage.setItem(
        `opendolphin:web-client:charts:encounter-context:v2:${auth.facilityId}:${auth.userId}`,
        JSON.stringify({ patientId: auth.patientId }),
      );
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
        patientId,
      },
    ],
  );

  return ctx;
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await createSessionContext(browser);

  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleMessages.push({ type, text: msg.text(), location: msg.location(), ts: new Date().toISOString() });
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(String(error));
  });

  const measurements = [];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(chartUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('.charts-page').waitFor({ timeout: 30000 });

    // Let layout settle (React Query + CSS)
    await page.waitForTimeout(1200);

    // Snapshot 1: top of page
    await applyMaskStyle(page);
    await page.waitForTimeout(50);
    const topShot = path.join(screenshotDir, `charts-top-${vp.label}.png`);
    await page.screenshot({ path: topShot, fullPage: false });
    const topData = await evaluateMeasurements(page);
    measurements.push({
      position: 'top',
      viewportPreset: vp,
      ...topData,
      screenshot: path.relative(artifactRoot, topShot),
    });

    // Snapshot 2: scroll to center input (SOAP card) and measure visible space there.
    await page.locator('#charts-soap-note').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await applyMaskStyle(page);
    await page.waitForTimeout(50);
    const soapShot = path.join(screenshotDir, `charts-soap-${vp.label}.png`);
    await page.screenshot({ path: soapShot, fullPage: false });
    const soapData = await evaluateMeasurements(page);
    measurements.push({
      position: 'soap',
      viewportPreset: vp,
      ...soapData,
      screenshot: path.relative(artifactRoot, soapShot),
    });
  }

  await context.close();
  await browser.close();

  const summary = {
    runId,
    executedAt: new Date().toISOString(),
    baseURL,
    facilityId,
    chartUrl: `${baseURL}${chartUrl}`,
    viewports,
    consoleErrorCount: consoleMessages.filter((m) => m.type === 'error').length,
    consoleWarningCount: consoleMessages.filter((m) => m.type === 'warning').length,
    pageErrorCount: pageErrors.length,
  };

  fs.writeFileSync(path.join(artifactRoot, 'summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(artifactRoot, 'measurements.json'), JSON.stringify({ summary, measurements }, null, 2));
  fs.writeFileSync(path.join(artifactRoot, 'console.json'), JSON.stringify(consoleMessages, null, 2));
  fs.writeFileSync(path.join(artifactRoot, 'page-errors.json'), JSON.stringify(pageErrors, null, 2));

  const toLine = (item) => {
    const label = item.viewportPreset?.label ?? '(unknown)';
    const vh = item.viewportPreset?.height ?? item.viewport?.innerHeight;
    const fixed = item.fixedHeights;
    const center = item.centralInput;
    const centerW = center?.centerColumnRect?.width ?? '—';
    const centerVis = center?.centerColumnVisibleHeight ?? '—';
    const soapW = center?.soapCardRect?.width ?? '—';
    const soapH = center?.soapCardRect?.height ?? '—';
    return `- ${label} (${item.position}, scrollY=${item.scrollY}px): centerWidth=${centerW}px, centerVisibleHeight=${centerVis}px, soapCard=${soapW}x${soapH}px, fixed(topbar/action/summary)=${fixed.topbarHeight}/${fixed.actionbarHeight}/${fixed.stickySummaryHeight}px (viewportH=${vh})`;
  };

  const md =
    `# Charts UI pre-study measurements\n\n` +
    `- RUN_ID: ${runId}\n` +
    `- ExecutedAt: ${summary.executedAt}\n` +
    `- Base URL: ${summary.baseURL}\n` +
    `- Facility ID: ${summary.facilityId}\n` +
    `- URL: ${summary.chartUrl}\n\n` +
    `## Quick Summary\n\n` +
    measurements.map(toLine).join('\n') +
    `\n\n` +
    `## Notes\n\n` +
    `- Screenshots are masked (blur) for patient-identifying regions.\n` +
    `- Detailed rectangles/scroll info are in measurements.json.\n`;

  fs.writeFileSync(path.join(artifactRoot, 'measurements.md'), md);

  console.log(JSON.stringify({ artifactRoot, runId }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
