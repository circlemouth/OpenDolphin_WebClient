import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../playwright/fixtures';
import { baseUrl, e2eAuthSession, seedAuthSession, withChartLock } from '../e2e/helpers/orcaMaster';
import {
  buildAppointmentFixture,
  buildMedicalSummaryFixture,
  buildPatientListFixture,
  buildVisitListFixture,
  type OutpatientFlagSet,
} from '../../web-client/src/mocks/fixtures/outpatient';

const RUN_ID = process.env.RUN_ID ?? '20260204T163000Z';
process.env.RUN_ID ??= RUN_ID;

const artifactDir =
  process.env.PLAYWRIGHT_ARTIFACT_DIR ??
  path.join(process.cwd(), 'artifacts', 'verification', RUN_ID);

const writeNote = (fileName: string, body: string) => {
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, fileName), body);
};

test.use({
  ignoreHTTPSErrors: true,
  extraHTTPHeaders: {
    'x-msw-missing-master': '0',
    'x-msw-transition': 'server',
    'x-msw-cache-hit': '0',
    'x-msw-fallback-used': '0',
    'x-msw-run-id': RUN_ID,
  },
});

test('薬剤/処置マスタ検索→入力が反映される (MSW)', async ({ page }) => {
  fs.mkdirSync(artifactDir, { recursive: true });

  await withChartLock(page, async () => {
    await seedAuthSession(page);
    const facilityId = e2eAuthSession.credentials.facilityId;
    const userId = e2eAuthSession.credentials.userId;
    const outpatientFlags: OutpatientFlagSet = {
      runId: RUN_ID,
      cacheHit: false,
      missingMaster: false,
      dataSourceTransition: 'server',
      fallbackUsed: false,
    };

    await page.route('**/orca21/medicalmodv2/outpatient**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildMedicalSummaryFixture(outpatientFlags)),
      }),
    );
    await page.route('**/orca/appointments/list/mock**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildAppointmentFixture(outpatientFlags)),
      }),
    );
    await page.route('**/orca/visits/list/mock**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildVisitListFixture(outpatientFlags)),
      }),
    );
    await page.route('**/orca/appointments/list**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildAppointmentFixture(outpatientFlags)),
      }),
    );
    await page.route('**/orca/visits/list**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildVisitListFixture(outpatientFlags)),
      }),
    );
    await page.route('**/orca/patients/local-search/mock**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildPatientListFixture(outpatientFlags, '/orca/patients/local-search/mock')),
      }),
    );
    await page.route('**/orca/patients/local-search**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildPatientListFixture(outpatientFlags, '/orca/patients/local-search')),
      }),
    );

    await page.addInitScript((runId) => {
      const raw = window.sessionStorage.getItem('opendolphin:web-client:auth');
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        parsed.runId = runId;
        window.sessionStorage.setItem('opendolphin:web-client:auth', JSON.stringify(parsed));
      } catch {
        // ignore
      }
    }, RUN_ID);

    await page.addInitScript(
      ({ storageKey, sessionKey, flags }) => {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({ sessionKey, flags, updatedAt: new Date().toISOString() }),
        );
      },
      {
        storageKey: 'opendolphin:web-client:auth-flags',
        sessionKey: `${facilityId}:${userId}`,
        flags: {
          runId: RUN_ID,
          cacheHit: false,
          missingMaster: false,
          dataSourceTransition: 'server',
          fallbackUsed: false,
        },
      },
    );
    await page.addInitScript((headers) => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init = {}) => {
        const nextHeaders = new Headers(init.headers || {});
        Object.entries(headers).forEach(([key, value]) => {
          if (!nextHeaders.has(key)) {
            nextHeaders.set(key, value);
          }
        });
        return originalFetch(input, { ...init, headers: nextHeaders });
      };
    }, {
      'x-msw-missing-master': '0',
      'x-msw-transition': 'server',
      'x-msw-cache-hit': '0',
      'x-msw-fallback-used': '0',
      'x-msw-run-id': RUN_ID,
    });

    await page.goto(`${baseUrl}/f/${facilityId}/charts?patientId=000001&visitDate=2026-02-04&msw=1`);
    await expect(page.locator('.charts-page')).toBeVisible({ timeout: 20_000 });
    const topbarMeta = page.locator('[data-test-id="charts-topbar-meta"]');
    await page.evaluate(
      ({ sessionKey, flags }) => {
        const envelope = {
          version: 1,
          sessionKey,
          payload: flags,
          updatedAt: new Date().toISOString(),
        };
        const key = 'opendolphin:web-client:auth:shared-flags:v1';
        try {
          window.localStorage.setItem(key, JSON.stringify(envelope));
        } catch {
          // ignore
        }
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(envelope) }));
      },
      {
        sessionKey: `${facilityId}:${userId}`,
        flags: {
          runId: RUN_ID,
          cacheHit: false,
          missingMaster: false,
          dataSourceTransition: 'server',
          fallbackUsed: false,
        },
      },
    );
    const debugControls = page.locator('.auth-service-controls');
    if ((await debugControls.count()) > 0) {
      const missingMasterButton = debugControls.getByRole('button', { name: /missingMaster:/ }).first();
      const buttonText = await missingMasterButton.textContent();
      if (buttonText?.includes('true')) {
        await missingMasterButton.click();
      }
      const transitionSelect = debugControls.locator('#transition-select');
      if ((await transitionSelect.count()) > 0) {
        await transitionSelect.selectOption('server');
      }
    }
    await expect(topbarMeta).toHaveAttribute('data-missing-master', 'false', { timeout: 10_000 });
    await expect(topbarMeta).toHaveAttribute('data-source-transition', 'server', { timeout: 10_000 });

    // 薬剤マスタ（処方）検索
    await page.locator('[data-utility-action="prescription-edit"]').click();
    const panel = page.locator('.charts-side-panel__content');
    const masterKeyword = panel.locator('input[id$="-master-keyword"]');
    await expect(masterKeyword).toBeVisible({ timeout: 10_000 });
    await masterKeyword.fill('アム');

    const medCandidate = panel.getByRole('button', { name: /アムロジピン/ });
    await expect(medCandidate).toBeVisible({ timeout: 5_000 });
    await medCandidate.click();

    const itemNameInput = panel.getByPlaceholder('項目名');
    await expect(itemNameInput).toHaveValue(/A100 アムロジピン/);

    await page.screenshot({
      path: path.join(artifactDir, 'order-master-medication.png'),
      fullPage: true,
    });

    // 処置マスタ（材料）検索
    await page.locator('[data-utility-action="order-edit"]').click();
    const panel2 = page.locator('.charts-side-panel__content');
    const masterKeyword2 = panel2.locator('input[id$="-master-keyword"]');
    await expect(masterKeyword2).toBeVisible({ timeout: 10_000 });

    await panel2.getByLabel('検索種別').selectOption('material');
    await masterKeyword2.fill('処置');

    const procCandidate = panel2.getByRole('button', { name: /処置材料A/ });
    await expect(procCandidate).toBeVisible({ timeout: 5_000 });
    await procCandidate.click();

    const itemNameInput2 = panel2.getByPlaceholder('項目名');
    await expect(itemNameInput2).toHaveValue(/M001 処置材料A/);

    await page.screenshot({
      path: path.join(artifactDir, 'order-master-procedure.png'),
      fullPage: true,
    });

    writeNote(
      'qa-order-master-search.md',
      [
        `RUN_ID: ${RUN_ID}`,
        'MSW: on',
        '確認項目:',
        '- 薬剤マスタ検索 → 選択 → 入力反映',
        '- 処置マスタ検索（材料） → 選択 → 入力反映',
        '',
        `スクショ: order-master-medication.png / order-master-procedure.png`,
        'HAR: har/ 配下に保存',
      ].join('\n'),
    );
  });
});
