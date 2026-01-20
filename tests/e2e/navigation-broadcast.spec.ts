// RUN_ID=20260120T061247Z
// タブ間での auth/runId 共有とログアウトブロードキャストを検証する。

import { test, expect } from '../playwright/fixtures';
import { baseUrl, runId, e2eAuthSession, seedAuthSession } from './helpers/orcaMaster';

const authChannel = 'opendolphin:web-client:auth';
const sessionExpiredChannel = 'opendolphin:web-client:session-expired';
const sessionKey = `${e2eAuthSession.credentials.facilityId}:${e2eAuthSession.credentials.userId}`;

test.describe('@navigation tab broadcast', () => {
  test('runId が BroadcastChannel で同期され、セッション失効も全タブでログアウトされる', async ({ page, context }) => {
    await seedAuthSession(page);
    const pageA = page;

    const facilityPath = `/f/${encodeURIComponent(e2eAuthSession.credentials.facilityId)}/reception`;

    await pageA.goto(`${baseUrl}${facilityPath}`);
    await expect(pageA.getByRole('heading', { name: /Reception/i })).toBeVisible({ timeout: 15_000 });
    const runIdBadgeA = pageA.locator('.app-shell__nav-runid');
    const initialRunId = (await runIdBadgeA.getAttribute('data-run-id')) ?? runId;

    const pageB = await context.newPage();
    await seedAuthSession(pageB);
    await pageB.goto(`${baseUrl}${facilityPath}`);
    await expect(pageB.getByRole('heading', { name: /Reception/i })).toBeVisible({ timeout: 15_000 });
    const runIdBadgeB = pageB.locator('.app-shell__nav-runid');
    await expect(runIdBadgeB).toHaveAttribute('data-run-id', initialRunId);

    const nextRunId = `${initialRunId}-TABSYNC`;
    await pageA.evaluate(
      ({ channel, sessionKey, nextRunId }) => {
        const envelope = {
          version: 1,
          sessionKey,
          payload: {
            runId: nextRunId,
            cacheHit: false,
            missingMaster: false,
            dataSourceTransition: 'server',
            fallbackUsed: false,
          },
          updatedAt: new Date().toISOString(),
        };
        const bc = new BroadcastChannel(channel);
        bc.postMessage({ version: 1, type: 'flags:update', envelope, origin: 'e2e' });
        bc.close();
      },
      { channel: authChannel, sessionKey, nextRunId },
    );

    await expect(runIdBadgeA).toHaveAttribute('data-run-id', nextRunId);
    await expect(runIdBadgeB).toHaveAttribute('data-run-id', nextRunId);

    await pageA.evaluate(({ channel }) => {
      const envelope = {
        id: 'e2e-expire',
        notice: {
          reason: 'unauthorized',
          status: 401,
          occurredAt: new Date().toISOString(),
          message: 'session expired (e2e)',
        },
      };
      const bc = new BroadcastChannel(channel);
      bc.postMessage(envelope);
      bc.close();
    }, { channel: sessionExpiredChannel });

    await Promise.all([
      pageA.waitForURL('**/login', { timeout: 15_000 }),
      pageB.waitForURL('**/login', { timeout: 15_000 }),
    ]);
  });
});
