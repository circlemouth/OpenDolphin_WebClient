// RUN_ID=20260206T141412Z-cmd_20260206_21_sub_1-charts-ia
// Charts 情報設計（中央 SOAP 最大化 + 左=過去参照 + 左から Do）の検討用に、
// 現行画面へ注釈オーバーレイを載せて機微マスク済みスクリーンショットを採取する。

import path from 'node:path';

import { test, expect, type Page } from '../../playwright/fixtures';
import { baseUrl } from '../helpers/orcaMaster';

const RUN_ID = process.env.RUN_ID ?? 'unknown-run-id';
const ARTIFACT_DIR = process.env.PLAYWRIGHT_ARTIFACT_DIR ?? '';

async function loginWithMsw(page: Page) {
  await page.goto(`${baseUrl}/login?msw=1`, { waitUntil: 'domcontentloaded' });

  // In dev, /login often starts with a facility selection step (SPA routing).
  const facilityEntryButton = page.getByRole('button', { name: 'ログインへ進む' });
  if (await facilityEntryButton.isVisible().catch(() => false)) {
    await page.locator('#facility-login-id').fill('0001');
    await Promise.all([
      page.waitForURL(/\/f\/.+\/login/, { timeout: 20_000 }),
      facilityEntryButton.click(),
    ]);
  }

  // Credentials step (LoginScreen).
  await page.locator('#login-facility-id').fill('0001');
  await page.locator('#login-user-id').fill('doctor1');
  await page.locator('#login-password').fill('pass');

  await Promise.all([
    page.waitForURL(/reception/, { timeout: 30_000 }),
    page.getByRole('button', { name: /ログイン/ }).click(),
  ]);
}

async function openChartsFromReception(page: Page) {
  const firstRow = page.getByRole('row', { name: /山田\s*花子/ });
  await expect(firstRow).toBeVisible({ timeout: 20_000 });
  await firstRow.dblclick();
  await expect(page).toHaveURL(/charts/, { timeout: 20_000 });
  await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });
}

async function applySensitiveMasks(page: Page) {
  await page.evaluate(() => {
    const blur = (el: Element | null, radius = 10) => {
      if (!el) return;
      (el as HTMLElement).style.filter = `blur(${radius}px)`;
    };

    // Patient pill (top action area)
    const pills = Array.from(document.querySelectorAll('.charts-actions__pill'));
    const patientPill = pills.find((pill) => pill.textContent?.includes('患者:'));
    blur(patientPill ?? null, 12);

    // Sticky summary bar usually contains patient identifying info.
    blur(document.querySelector('#charts-patient-summary'), 14);

    // Safety / meta blocks can include IDs.
    blur(document.querySelector('#charts-topbar'), 6);

    // Left/Timeline can contain identifying text; keep the overall geometry but hide content.
    blur(document.querySelector('.charts-workbench__column--left'), 8);
    blur(document.querySelector('#charts-document-timeline'), 6);
  });
}

type Annotation = {
  selector: string;
  label: string;
  color: string;
};

async function annotate(page: Page, annotations: Annotation[]) {
  await page.evaluate(({ annotations, runId }) => {
    const layerId = '__charts_ia_overlay__';
    document.getElementById(layerId)?.remove();

    const layer = document.createElement('div');
    layer.id = layerId;
    layer.style.position = 'fixed';
    layer.style.inset = '0';
    layer.style.zIndex = '2147483647';
    layer.style.pointerEvents = 'none';
    layer.style.fontFamily =
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

    const makeTag = (text: string, color: string) => {
      const tag = document.createElement('div');
      tag.textContent = text;
      tag.style.display = 'inline-block';
      tag.style.padding = '4px 6px';
      tag.style.borderRadius = '6px';
      tag.style.background = 'rgba(0,0,0,0.78)';
      tag.style.color = '#fff';
      tag.style.fontSize = '12px';
      tag.style.border = `1px solid ${color}`;
      tag.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
      return tag;
    };

    const header = makeTag(`IA screenshot overlay | RUN_ID=${runId}`, '#ffffff');
    header.style.position = 'fixed';
    header.style.left = '12px';
    header.style.top = '12px';
    layer.appendChild(header);

    const viewportH = window.innerHeight;

    for (const ann of annotations) {
      const el = document.querySelector(ann.selector);
      if (!el) continue;
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const box = document.createElement('div');
      box.style.position = 'fixed';
      box.style.left = `${Math.max(0, rect.left)}px`;
      box.style.top = `${Math.max(0, rect.top)}px`;
      box.style.width = `${Math.max(0, rect.width)}px`;
      box.style.height = `${Math.max(0, rect.height)}px`;
      box.style.border = `2px solid ${ann.color}`;
      box.style.background = 'rgba(0,0,0,0.04)';
      box.style.borderRadius = '10px';
      layer.appendChild(box);

      const tag = makeTag(
        `${ann.label} (${Math.round(rect.width)}x${Math.round(rect.height)})`,
        ann.color,
      );
      tag.style.position = 'fixed';
      tag.style.left = `${Math.max(0, rect.left + 8)}px`;
      tag.style.top = `${Math.max(0, rect.top + 8)}px`;
      layer.appendChild(tag);

      // If this is the SOAP panel, annotate below-fold risk relative to viewport.
      if (ann.selector === '#charts-soap-note') {
        const below = rect.top - viewportH;
        const note = makeTag(
          below > 0
            ? `SOAP is below fold by ~${Math.round(below)}px (scroll needed)`
            : 'SOAP is in viewport',
          ann.color,
        );
        note.style.position = 'fixed';
        note.style.left = `${Math.max(0, rect.left + 8)}px`;
        note.style.top = `${Math.max(0, rect.top + 36)}px`;
        layer.appendChild(note);
      }
    }

    document.body.appendChild(layer);
  }, { annotations, runId: RUN_ID });
}

async function saveShot(page: Page, name: string) {
  if (!ARTIFACT_DIR) return;
  const outPath = path.join(ARTIFACT_DIR, 'screenshots', name);
  await page.screenshot({ path: outPath, fullPage: false });
}

test('charts ia: current layout (top) annotated', async ({ context }) => {
  test.setTimeout(90_000);
  const page = await context.newPage();
  await loginWithMsw(page);
  await openChartsFromReception(page);

  await applySensitiveMasks(page);
  await annotate(page, [
    { selector: '#charts-topbar', label: 'Topbar (meta/actions)', color: '#00E5FF' },
    { selector: '#charts-actionbar', label: 'ActionBar (send/print/finish)', color: '#FFEA00' },
    { selector: '#charts-patient-summary', label: 'Sticky patient summary (masked)', color: '#FF5252' },
    { selector: '.charts-workbench__column--left', label: 'Left column (current)', color: '#B2FF59' },
    { selector: '.charts-workbench__column--center', label: 'Center column (SOAP/TL)', color: '#7C4DFF' },
    { selector: '.charts-workbench__column--right', label: 'Right column (ORCA summary)', color: '#FF6D00' },
    { selector: '#charts-soap-note', label: 'SOAP panel', color: '#7C4DFF' },
    { selector: '#charts-document-timeline', label: 'DocumentTimeline', color: '#7C4DFF' },
  ]);

  await saveShot(page, '01-top-annotated.png');
});

test('charts ia: SOAP area annotated (scroll to SOAP)', async ({ context }) => {
  test.setTimeout(90_000);
  const page = await context.newPage();
  await loginWithMsw(page);
  await openChartsFromReception(page);

  await page.locator('#charts-soap-note').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  await applySensitiveMasks(page);
  await annotate(page, [
    { selector: '.charts-workbench__column--left', label: 'Left column (future: Past ref + Do)', color: '#B2FF59' },
    { selector: '.charts-workbench__column--center', label: 'Center (maximize SOAP)', color: '#7C4DFF' },
    { selector: '#charts-soap-note', label: 'SOAP (target workspace)', color: '#7C4DFF' },
    { selector: '.charts-workbench__column--right', label: 'Right (utility/orca)', color: '#FF6D00' },
  ]);

  await saveShot(page, '02-soap-annotated.png');
});
