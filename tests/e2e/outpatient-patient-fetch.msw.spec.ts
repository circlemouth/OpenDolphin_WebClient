import { test, expect } from '../playwright/fixtures';

import { profile, seedAuthSession } from './helpers/orcaMaster';

type PatientScenario = {
  id: 'patient-normal' | 'patient-missing-master' | 'patient-fallback' | 'patient-timeout';
  description: string;
  runId: string;
  cacheHit: boolean;
  missingMaster: boolean;
  fallbackUsed: boolean;
  dataSourceTransition: 'server' | 'fallback';
  status?: number;
};

const RUN_ID = '20251212T143720Z';

const scenarios: PatientScenario[] = [
  {
    id: 'patient-normal',
    description: '正常取得: server/cacheHit=true/missingMaster=false',
    runId: RUN_ID,
    cacheHit: true,
    missingMaster: false,
    fallbackUsed: false,
    dataSourceTransition: 'server',
    status: 200,
  },
  {
    id: 'patient-missing-master',
    description: 'missingMaster=true で readOnly',
    runId: RUN_ID,
    cacheHit: false,
    missingMaster: true,
    fallbackUsed: false,
    dataSourceTransition: 'server',
    status: 200,
  },
  {
    id: 'patient-fallback',
    description: 'fallbackUsed=true で snapshot handoff',
    runId: RUN_ID,
    cacheHit: false,
    missingMaster: true,
    fallbackUsed: true,
    dataSourceTransition: 'fallback',
    status: 200,
  },
  {
    id: 'patient-timeout',
    description: '504/timeout で再取得導線',
    runId: RUN_ID,
    cacheHit: false,
    missingMaster: false,
    fallbackUsed: false,
    dataSourceTransition: 'server',
    status: 504,
  },
];

test.describe('Outpatient patient fetch metadata', () => {
  test.skip(profile !== 'msw', 'MSW プロファイル専用（Stage 接続禁止）');

  for (const scenario of scenarios) {
    test(`PatientsPage ${scenario.id}: ${scenario.description}`, async ({ page }) => {
      await page.context().setExtraHTTPHeaders({
        'x-msw-scenario': scenario.id,
        'X-Run-Id': scenario.runId,
        'X-Cache-Hit': String(scenario.cacheHit),
        'X-Missing-Master': String(scenario.missingMaster),
        'X-DataSource-Transition': scenario.dataSourceTransition,
        'X-Fallback-Used': String(scenario.fallbackUsed),
      });

      await seedAuthSession(page);
      await page.goto('/patients?msw=1');
      await expect(page.getByRole('heading', { name: '患者一覧と編集' })).toBeVisible();

      const badges = page.locator('.patients-page__badges');
      await expect(badges).toContainText(`runId`);
      await expect(badges).toContainText(String(scenario.missingMaster));
      await expect(badges).toContainText(String(scenario.cacheHit));
      await expect(badges).toContainText(String(scenario.fallbackUsed));

      const summary = page.locator('.patients-search__summary');
      await expect(summary).toContainText('Api_Result');

      if (scenario.id === 'patient-timeout') {
        const retry = page.locator('.api-failure');
        await expect(retry).toBeVisible();
        await expect(retry).toContainText('再取得');
      } else {
        await expect(summary).toContainText('fetchedAt');
        if (scenario.missingMaster || scenario.fallbackUsed) {
          await expect(page.locator('.patients-page__block')).toBeVisible();
        }
      }
    });
  }
});
