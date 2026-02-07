import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '../playwright/fixtures';
import { baseUrl, runId, seedAuthSession } from '../e2e/helpers/orcaMaster';

const buildArtifactRoot = (): string => {
  // Allow overriding the artifact root from the outside (CI / local runs).
  // Default: local-only artifacts under artifacts/webclient/e2e/<RUN_ID>/...
  if (process.env.PLAYWRIGHT_ARTIFACT_DIR) return process.env.PLAYWRIGHT_ARTIFACT_DIR;
  return path.join(process.cwd(), 'artifacts', 'webclient', 'e2e', runId, 'reception', 'acceptmodv2');
};

const artifactRoot = buildArtifactRoot();

test.use({ trace: 'off' });

test.describe('Reception acceptmodv2 (/orca/visits/mutation)', () => {
  test.beforeEach(async ({ page }) => {
    fs.mkdirSync(artifactRoot, { recursive: true });
    await seedAuthSession(page);
    let registeredVisits: Array<{
      acceptanceId: string;
      patientId: string;
      acceptanceDate: string;
      acceptanceTime: string;
    }> = [];
    // Stub backend endpoints to keep tests self-contained (MSWに依存せず成功/21を制御)
    const fulfillIfFetch = async (route: any, handler: (route: any) => Promise<void>) => {
      const type = route.request().resourceType();
      if (type !== 'xhr' && type !== 'fetch') {
        await route.continue();
        return;
      }
      await handler(route);
    };

    await page.route('**/orca/visits/mutation**', async (route) =>
      fulfillIfFetch(route, async (routed) => {
        const body = JSON.parse(routed.request().postData() ?? '{}') as Record<string, any>;
      const patientId = body.patientId ?? '';
      const requestNumber = body.requestNumber ?? '01';
      const isWarning = patientId === '00021';
      const isCancel = requestNumber === '02';
      const apiResult = isWarning ? '21' : '00';
      const response = {
        apiResult,
        apiResultMessage: isWarning ? '受付なし' : '正常終了',
        runId,
        traceId: 'trace-accept-e2e',
        acceptanceId: isWarning ? undefined : `A-${patientId || '000001'}`,
        acceptanceDate: body.acceptanceDate ?? '2026-01-20',
        acceptanceTime: body.acceptanceTime ?? '09:00:00',
        departmentCode: body.departmentCode ?? '01',
        physicianCode: body.physicianCode ?? '1001',
        medicalInformation: body.medicalInformation ?? (isCancel ? '受付取消' : '外来受付'),
        patient: {
          patientId: patientId || '000000',
          name: 'MSW 患者',
          kana: 'エムエスダブリュ',
          birthDate: '1990-01-01',
          sex: 'F',
        },
      };
        await routed.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
        headers: {
          'x-run-id': response.runId,
          'x-trace-id': response.traceId,
        },
      });

        if (!isCancel && response.apiResult === '00' && response.acceptanceId) {
          registeredVisits = [
            {
              acceptanceId: response.acceptanceId,
              patientId: response.patient.patientId,
              acceptanceDate: response.acceptanceDate,
              acceptanceTime: response.acceptanceTime,
            },
            ...registeredVisits.filter((entry) => entry.acceptanceId !== response.acceptanceId),
          ];
        }
        if (isCancel && response.apiResult === '00') {
          registeredVisits = registeredVisits.filter((entry) => entry.acceptanceId !== response.acceptanceId);
        }
      }),
    );

    const fulfillJson = (route: any, body: any) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    await page.route('**/api/user/**', async (route) =>
      fulfillIfFetch(route, async (routed) => {
        await fulfillJson(routed, {
          facilityId: '1.3.6.1.4.1.9414.72.103',
          userId: 'doctor1',
          displayName: 'E2E Admin',
        });
      }),
    );
    await page.route('**/orca/appointments/list**', (route) =>
      fulfillIfFetch(route, (r) =>
        fulfillJson(r, {
          visitDate: '2026-01-20',
          visits: registeredVisits.map((visit, index) => ({
            sequentialNumber: `SEQ-${index + 1}`,
            acceptanceId: visit.acceptanceId,
            receptionId: visit.acceptanceId,
            patient: {
              patientId: visit.patientId,
              wholeName: 'MSW 患者',
              wholeNameKana: 'エムエスダブリュ',
              birthDate: '1990-01-01',
              sex: 'F',
            },
            appointmentTime: visit.acceptanceTime,
            updateTime: visit.acceptanceTime,
            visitDate: visit.acceptanceDate,
            departmentCode: '01',
            physicianCode: '1001',
            visitInformation: '01',
          })),
          apiResult: '00',
          recordsReturned: registeredVisits.length,
        }),
      ),
    );
    await page.route('**/orca/visits/list**', (route) =>
      fulfillIfFetch(route, (r) =>
        fulfillJson(r, {
          visitDate: '2026-01-20',
          visits: registeredVisits.map((visit, index) => ({
            sequentialNumber: `SEQ-${index + 1}`,
            acceptanceId: visit.acceptanceId,
            receptionId: visit.acceptanceId,
            patient: {
              patientId: visit.patientId,
              wholeName: 'MSW 患者',
              wholeNameKana: 'エムエスダブリュ',
              birthDate: '1990-01-01',
              sex: 'F',
            },
            appointmentTime: visit.acceptanceTime,
            updateTime: visit.acceptanceTime,
            visitDate: visit.acceptanceDate,
            departmentCode: '01',
            physicianCode: '1001',
            visitInformation: '01',
          })),
          apiResult: '00',
          recordsReturned: registeredVisits.length,
        }),
      ),
    );
    await page.route('**/orca/queue**', (route) =>
      fulfillIfFetch(route, (r) => fulfillJson(r, { queue: [], apiResult: '00' })),
    );
    await page.route('**/admin/**', (route) => fulfillIfFetch(route, (r) => fulfillJson(r, {})));
    await page.route('**/api01rv2/**', (route) => fulfillIfFetch(route, (r) => fulfillJson(r, {})));

    const facility = encodeURIComponent('1.3.6.1.4.1.9414.72.103');
    // MSW を有効化すると SW 側の fixture が先に応答し、page.route の stub と競合する。
    // この spec は stubbed routes で自己完結させるため、?msw=1 は付けない。
    // NOTE: 日付は固定し、一覧フィルタと stub の整合を保つ。
    await page.goto(`${baseUrl}/f/${facility}/reception?date=2026-01-20`);
    await expect(page.locator('[data-test-id="reception-accept-form"]')).toBeVisible({ timeout: 15_000 });
  });

  test('Api_Result=00 で受付登録がリストへ反映される', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    await page.context().tracing.start({ screenshots: true, snapshots: true });

    const cards = page.locator('[data-test-id="reception-entry-card"]');
    const dataCountBefore = await cards.count();

    const acceptForm = page.locator('[data-test-id="reception-accept-form"]');
    await acceptForm.getByLabel(/患者ID/).fill('000123');
    await acceptForm.getByLabel(/保険\/自費/).selectOption('self');
    await acceptForm.getByLabel(/来院区分/).selectOption('1');

    await Promise.all([
      page.waitForSelector('.tone-banner--info', { timeout: 10_000 }),
      page.getByRole('button', { name: '受付送信' }).click(),
    ]);

    const banner = page.locator('.tone-banner--info');
    await expect(banner).toContainText(/受付登録が完了しました/);
    await expect(page.locator('[data-test-id="accept-api-result"]')).toContainText(/Api_Result:\s*(00|0000)/);

    const durationText = await page.locator('[data-test-id="accept-duration-ms"]').innerText();
    const durationMs = Number(durationText.replace(/\D+/g, ''));
    expect(durationMs).toBeLessThan(1000);
    const auditEvents = await page.evaluate(() => (window as any).__AUDIT_EVENTS__ ?? []);
    const receptionAudits = auditEvents.filter((event: any) => event?.payload?.action === 'reception_accept');
    const hasReceptionAudit = receptionAudits.length > 0;
    expect(hasReceptionAudit).toBeTruthy();
    fs.writeFileSync(
      path.join(artifactRoot, 'audit-reception_accept.json'),
      JSON.stringify(receptionAudits, null, 2),
      'utf8',
    );

    const newCard = page.locator('[data-test-id="reception-entry-card"][data-patient-id="000123"]').first();
    await expect(newCard).toBeVisible({ timeout: 10_000 });
    const dataCountAfter = await cards.count();
    expect(dataCountAfter).toBe(dataCountBefore + 1);

    // Charts へ遷移し runId / traceId を確認
    await newCard.dblclick();
    await expect(page).toHaveURL(/charts/);
    const chartsMain = page.locator('.charts-page');
    await expect(chartsMain).toBeVisible({ timeout: 15_000 });
    const chartsRunId = await chartsMain.getAttribute('data-run-id');
    const chartsTraceId = await chartsMain.getAttribute('data-trace-id');
    const metaRunId = await page.locator('[data-test-id="charts-topbar-meta"]').getAttribute('data-run-id');
    const metaTraceId = await page.locator('[data-test-id="charts-topbar-meta"]').getAttribute('data-trace-id');
    expect(chartsRunId).toBe(metaRunId);
    expect(chartsTraceId).toBe(metaTraceId);
    expect(chartsRunId).toBeTruthy();
    expect(chartsTraceId).toBeTruthy();

    await page.screenshot({ path: path.join(artifactRoot, 'acceptmodv2-register.png'), fullPage: true });
    await page.context().tracing.stop({ path: path.join(artifactRoot, 'acceptmodv2-register-trace.zip') });
    fs.writeFileSync(path.join(artifactRoot, 'console-register.log'), consoleLogs.join('\n'), 'utf8');
  });

  test('Api_Result=21 は警告バナーを表示しリストは変更しない', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    await page.context().tracing.start({ screenshots: true, snapshots: true });

    const cards = page.locator('[data-test-id="reception-entry-card"]');
    const dataCountBefore = await cards.count();

    const acceptForm = page.locator('[data-test-id="reception-accept-form"]');
    await acceptForm.getByLabel(/患者ID/).fill('00021');
    await acceptForm.getByLabel(/保険\/自費/).selectOption('self');
    await acceptForm.getByLabel(/来院区分/).selectOption('1');
    await acceptForm.getByRole('radio', { name: /受付登録/ }).check();
    await acceptForm.getByRole('button', { name: '受付送信' }).click();

    const warning = page.locator('.tone-banner--warning').filter({ hasText: '受付なし' });
    await expect(warning).toBeVisible({ timeout: 10_000 });
    await expect(warning).toContainText(/受付なし/);
    const dataCountAfter = await cards.count();
    expect(dataCountAfter).toBe(dataCountBefore);

    await page.screenshot({ path: path.join(artifactRoot, 'acceptmodv2-api21.png'), fullPage: true });
    await page.context().tracing.stop({ path: path.join(artifactRoot, 'acceptmodv2-api21-trace.zip') });
    fs.writeFileSync(path.join(artifactRoot, 'console-api21.log'), consoleLogs.join('\n'), 'utf8');
  });

  test('受付取消(02)で件数が減り、受付ID未入力では送信できない', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

    await page.context().tracing.start({ screenshots: true, snapshots: true });

    const acceptForm = page.locator('[data-test-id="reception-accept-form"]');

    // まず登録して1件増やす
    await acceptForm.getByLabel(/患者ID/).fill('000555');
    await acceptForm.getByLabel(/保険\/自費/).selectOption('insurance');
    await acceptForm.getByLabel(/来院区分/).selectOption('1');
    await acceptForm.getByRole('button', { name: '受付送信' }).click();
    await page.waitForSelector('.tone-banner--info', { timeout: 10_000 });

    const cards = page.locator('[data-test-id="reception-entry-card"]');
    const dataCountAfterRegister = await cards.count();

    // 取消に切替し、受付ID未入力だとボタン無効
    await acceptForm.getByRole('radio', { name: /受付取消/ }).check();
    const submit = acceptForm.getByRole('button', { name: '受付送信' });
    // 受付IDが自動入力されている可能性があるため、一度クリアして無効化を確認する
    await acceptForm.getByLabel(/受付ID/).fill('');
    await expect(submit).toBeDisabled();
    await acceptForm.getByLabel(/受付ID/).fill('A-000555');
    await expect(submit).toBeEnabled();

    await submit.click();
    await page.waitForSelector('.tone-banner--info', { timeout: 10_000 });
    const dataCountAfterCancel = await cards.count();
    expect(dataCountAfterCancel).toBe(dataCountAfterRegister - 1);
    const cancelDurationText = await page.locator('[data-test-id="accept-duration-ms"]').innerText();
    const cancelDurationMs = Number(cancelDurationText.replace(/\D+/g, ''));
    expect(cancelDurationMs).toBeLessThan(1000);

    const logLine = consoleLogs.find((line) => line.includes('[acceptmodv2]') && line.includes('A-000555'));
    expect(logLine).toBeTruthy();
    const jsonPart = [...consoleLogs]
      .reverse()
      .find((line) => line.includes('[acceptmodv2]') && line.includes('"requestNumber": "02"'))
      ?.split('[acceptmodv2]')[1]
      ?.trim();
    if (jsonPart) {
      const parsed = JSON.parse(jsonPart);
      expect(parsed.requestNumber).toBe('02');
      expect(parsed.apiResult).toBe('00');
    }

    await page.screenshot({ path: path.join(artifactRoot, 'acceptmodv2-cancel.png'), fullPage: true });
    await page.context().tracing.stop({ path: path.join(artifactRoot, 'acceptmodv2-cancel-trace.zip') });
    fs.writeFileSync(path.join(artifactRoot, 'console-cancel.log'), consoleLogs.join('\n'), 'utf8');
  });
});
