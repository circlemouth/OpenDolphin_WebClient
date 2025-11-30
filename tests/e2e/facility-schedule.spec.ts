import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { test, expect, type Page } from '@playwright/test';

import { baseUrl, runId, seedAuthSession } from './helpers/orcaMaster';

const RUN_ID_ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts/e2e/20251129T163000Z');
if (!existsSync(RUN_ID_ARTIFACTS_DIR)) {
  mkdirSync(RUN_ID_ARTIFACTS_DIR, { recursive: true });
}

test.use({ ignoreHTTPSErrors: true });

const chartPreset = {
  chartId: 'chart-2025-11',
  patientId: '0000001',
  patientName: '山田 太郎',
  dateRange: '2025-11-01〜2025-11-29',
  query: '診察',
  runId,
};

const attachDiagnostics = (page: Page) => {
  page.on('console', (message) => {
    console.log('[page console]', message.type(), message.text());
  });
  page.on('requestfailed', (request) => {
    console.log('[request failed]', request.url(), request.failure()?.errorText ?? 'no error');
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log('[response]', response.status(), response.url());
    }
  });
  page.on('pageerror', (error) => {
    console.log('[page error]', error?.message ?? error);
  });
  page.on('framenavigated', (frame) => {
    if (frame === frame.page().mainFrame()) {
      console.log('[frame nav]', frame.url());
    }
  });
};

test.describe('FacilitySchedule Danger Zone', () => {
  test.beforeEach(async ({ page }) => {
    attachDiagnostics(page);
    await seedAuthSession(page);
    await page.goto(`${baseUrl}/facility-schedule`);
    await page.waitForTimeout(2000);
    console.log('[body snapshot]', await page.evaluate(() => document.body.innerHTML.slice(0, 400)));
  });

  test('renders runId info and enables Danger Zone after confirmation', async ({ page }) => {
    const facilityHeading = page.getByRole('heading', { name: '施設全体の予約一覧' });
    await facilityHeading.waitFor({ state: 'visible', timeout: 15000 });
    await expect(facilityHeading).toBeVisible();

    const reservationButton = page.getByRole('button', { name: '予約詳細' }).first();
    await reservationButton.click();

    await expect(page.getByText(`RUN_ID: ${runId}`)).toBeVisible();
    await expect(page.locator('details [data-run-id]').first()).toHaveAttribute('data-run-id', runId);

    const patientInput = page.getByLabel('患者ID（再入力）');
    await patientInput.fill('0000001');
    const visitInput = page.getByLabel('予約ID（再入力）');
    await visitInput.fill('100');

    const acknowledgedCheckbox = page.getByLabel('操作が復元不能であることを認識しました');
    await acknowledgedCheckbox.check();
    const evidenceCheckbox = page.getByLabel(/証跡（.*）を確認済みです/);
    await evidenceCheckbox.check();

    const deleteButton = page.getByRole('button', { name: '予約を削除' });
    await expect(deleteButton).toHaveAttribute('data-run-id', runId);
    await expect(deleteButton).toBeDisabled();

    await page.waitForTimeout(3200);
    await expect(deleteButton).toBeEnabled();

    await page.screenshot({
      path: path.join(RUN_ID_ARTIFACTS_DIR, 'facility-schedule-danger-zone.png'),
      fullPage: true,
    });
  });
});

test.describe('PatientDataExport runId coverage', () => {
  test.beforeEach(async ({ page }) => {
    attachDiagnostics(page);
    await seedAuthSession(page);
    await page.addInitScript(([storageKey, payload]) => {
      window.sessionStorage.setItem(storageKey, payload);
    }, ['opendolphin:web-client:charts-preset', JSON.stringify(chartPreset)]);
    await page.goto(`${baseUrl}/administration/patients`);
    await page.waitForTimeout(2000);
    console.log('[body snapshot]', await page.evaluate(() => document.body.innerHTML.slice(0, 400)));
  });

  test('shows runId badge and export buttons with data/run-id + aria attributes', async ({ page }) => {
    const exportHeading = page.getByRole('heading', { name: '患者データ出力' });
    await exportHeading.waitFor({ state: 'visible', timeout: 15000 });
    await expect(exportHeading).toBeVisible();
    await expect(page.locator(`[data-run-id="${runId}"]`).first()).toBeVisible();

    const presetCard = page.getByText('Chart ID: chart-2025-11');
    await expect(presetCard).toBeVisible();
    await expect(page.getByText(`RUN_ID: ${runId}`)).toBeVisible();

    const csvButton = page.getByRole('button', { name: 'CSV をダウンロード' });
    const jsonButton = page.getByRole('button', { name: 'JSON をダウンロード' });

    await expect(csvButton).toBeDisabled();
    await expect(jsonButton).toBeDisabled();

    await page.getByRole('button', { name: '患者全件を取得' }).click();
    await expect(page.getByText('患者データを')).toBeVisible();

    await expect(csvButton).toBeEnabled();
    await expect(jsonButton).toBeEnabled();

    await expect(csvButton).toHaveAttribute('data-run-id', runId);
    await expect(csvButton).toHaveAttribute('aria-label', `RUN_ID=${runId} で患者データCSVをダウンロード`);
    await expect(jsonButton).toHaveAttribute('data-run-id', runId);
    await expect(jsonButton).toHaveAttribute('aria-label', `RUN_ID=${runId} で患者データJSONをダウンロード`);

    await page.screenshot({
      path: path.join(RUN_ID_ARTIFACTS_DIR, 'patient-data-export.png'),
      fullPage: true,
    });
  });
});
