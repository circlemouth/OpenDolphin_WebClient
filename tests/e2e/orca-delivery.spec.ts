// RUN_ID=20251202T090000Z
// 実行例: RUN_ID=20251202T090000Z VITE_USE_MOCK_ORCA_QUEUE=1 VITE_VERIFY_ADMIN_DELIVERY=1 npx playwright test tests/e2e/orca-delivery.spec.ts --project=chromium --grep "ORCA 送信|Administration 配信"
// テスト内でフィクスチャサーバーを起動するため、別途 dev サーバーは不要。ヘッダーは playwright.config.ts の extraHTTPHeaders かテスト内の headers で上書き可能。

import http from 'node:http';
import { AddressInfo } from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '../playwright/fixtures';
import { request as playwrightRequest } from '@playwright/test';

import { fetchAuditLog, logOrcaQueueStatus } from '../playwright/utils/ui-helpers';

type RequestCapture = { path: string; headers: Record<string, string | undefined> };
type FixtureServer = { url: string; close: () => Promise<void>; requests: RequestCapture[] };

const runId = process.env.RUN_ID ?? '20251202T090000Z';
const fixtureRoot = path.resolve(process.cwd(), 'tests/playwright/utils/fixtures');

const loadFixture = <T>(...segments: string[]): T => {
  const filePath = path.join(fixtureRoot, ...segments);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
};

const roles = loadFixture<Record<string, { userId: string }>>('auth', 'roles.json');
const queueMock = loadFixture<any>('orca', 'queue', 'mock-success.json');
const queueLive = loadFixture<any>('orca', 'queue', 'live-fallback.json');
const adminVerified = loadFixture<any>('admin', 'delivery', 'verification-enabled.json');
const adminBypass = loadFixture<any>('admin', 'delivery', 'verification-bypass.json');
const auditSeed = loadFixture<any[]>('audit', 'entries.json');

const sendJson = (res: http.ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) => {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    ...headers,
  });
  res.end(JSON.stringify(body));
};

async function startFixtureServer(): Promise<FixtureServer> {
  const requests: RequestCapture[] = [];
  const auditLog = [...auditSeed];

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const useMock = req.headers['x-use-mock-orca-queue'] === '1';
    const verifyAdmin = req.headers['x-verify-admin-delivery'] === '1';
    const userId = (req.headers['x-e2e-user'] as string) ?? 'anonymous';

    requests.push({
      path: `${url.pathname}${url.search}`,
      headers: {
        'x-use-mock-orca-queue': req.headers['x-use-mock-orca-queue'] as string | undefined,
        'x-verify-admin-delivery': req.headers['x-verify-admin-delivery'] as string | undefined,
        'x-e2e-user': userId,
      },
    });

    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }

    if (url.pathname.startsWith('/api/orca/queue')) {
      const retry = url.searchParams.get('retry') === '1';
      const patientId = url.searchParams.get('patientId') ?? queueMock.queue[0].patientId;
      const base = useMock ? queueMock : queueLive;
      const payload = {
        ...base,
        runId,
        verifyAdminDelivery: verifyAdmin,
        queue: base.queue.map((entry: any) => ({ ...entry })),
      };
      if (retry) {
        payload.queue = payload.queue.map((entry: any) =>
          entry.patientId === patientId ? { ...entry, status: 'delivered', retryable: false } : entry,
        );
      }

      auditLog.push({
        runId,
        endpoint: 'orca/queue',
        action: retry ? 'retry' : 'dispatch',
        patientId,
        mode: useMock ? 'mock' : 'live',
        user: userId,
        result: payload.queue.find((entry: any) => entry.patientId === patientId)?.status ?? 'unknown',
        at: new Date().toISOString(),
      });

      sendJson(res, 200, payload, {
        'x-orca-queue-mode': useMock ? 'mock' : 'live',
        'x-admin-delivery-verification': verifyAdmin ? 'enabled' : 'disabled',
        'x-orca-retry': retry ? '1' : '0',
      });
      return;
    }

    if (url.pathname.startsWith('/api/admin/delivery') || url.pathname.startsWith('/api/admin/config')) {
      const base = verifyAdmin ? adminVerified : adminBypass;
      const payload = {
        ...base,
        runId,
        verified: verifyAdmin && base.verified !== false,
        source: useMock ? 'mock' : base.source ?? 'live',
      };

      auditLog.push({
        runId,
        endpoint: 'admin/delivery',
        action: verifyAdmin ? 'verify' : 'bypass',
        user: userId,
        mode: useMock ? 'mock' : 'live',
        verified: payload.verified,
        at: new Date().toISOString(),
      });

      sendJson(res, 200, payload, {
        'x-admin-delivery-verification': verifyAdmin ? 'enabled' : 'disabled',
        'x-orca-queue-mode': useMock ? 'mock' : 'live',
      });
      return;
    }

    if (url.pathname.startsWith('/api/audit')) {
      const targetRun = url.searchParams.get('runId') ?? runId;
      const endpointFilter = url.searchParams.get('endpoint');
      const entries = auditLog.filter(
        (entry) => entry.runId === targetRun && (!endpointFilter || entry.endpoint === endpointFilter),
      );
      sendJson(res, 200, entries);
      return;
    }

    sendJson(res, 404, { message: 'not found' });
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  const url = `http://127.0.0.1:${port}`;
  return {
    url,
    requests,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

test.describe('ORCA 送信/Administration 配信', () => {
  let fixtureServer: FixtureServer;

  test.beforeAll(async () => {
    fixtureServer = await startFixtureServer();
  });

  test.afterAll(async () => {
    await fixtureServer.close();
  });

  test('ORCA 送信 - モックONでヘッダーとリトライ導線を検証', async ({ page }) => {
    const headers = {
      'x-use-mock-orca-queue': '1',
      'x-verify-admin-delivery': '1',
      'x-e2e-user': roles.system_admin.userId,
    };
    const endpoint = `${fixtureServer.url}/api/orca/queue?patientId=${queueMock.queue[0].patientId}`;

    const first = await page.request.get(endpoint, { headers });
    expect(first.status()).toBe(200);
    expect(first.headers()['x-orca-queue-mode']).toBe('mock');
    expect(first.headers()['x-admin-delivery-verification']).toBe('enabled');

    const body = await first.json();
    expect(body.runId).toBe(runId);
    expect(body.source).toBe('mock');
    expect(body.queue.some((entry: any) => entry.retryable)).toBeTruthy();

    const retried = await page.request.get(`${endpoint}&retry=1`, { headers });
    expect(retried.headers()['x-orca-retry']).toBe('1');
    const retriedBody = await retried.json();
    const retriedEntry = retriedBody.queue.find((entry: any) => entry.patientId === queueMock.queue[0].patientId);
    expect(retriedEntry?.status).toBe('delivered');

    const apiContext = await playwrightRequest.newContext({
      baseURL: fixtureServer.url,
      extraHTTPHeaders: headers,
    });
    const queueStatus = await logOrcaQueueStatus(apiContext, queueMock.queue[0].patientId);
    expect(queueStatus.queue.some((entry: any) => entry.patientId === queueMock.queue[0].patientId)).toBeTruthy();
    await apiContext.dispose();

    expect(fixtureServer.requests.some((req) => req.headers['x-use-mock-orca-queue'] === '1')).toBeTruthy();
  });

  test('ORCA 送信 - モックOFFで live レスポンス差分と監査ログを確認', async ({ page }) => {
    const headers = {
      'x-use-mock-orca-queue': '0',
      'x-verify-admin-delivery': '1',
      'x-e2e-user': roles.doctor.userId,
    };
    const endpoint = `${fixtureServer.url}/api/orca/queue?patientId=${queueLive.queue[0].patientId}`;
    const res = await page.request.get(endpoint, { headers });

    expect(res.status()).toBe(200);
    expect(res.headers()['x-orca-queue-mode']).toBe('live');
    expect(res.headers()['x-admin-delivery-verification']).toBe('enabled');

    const body = await res.json();
    expect(body.runId).toBe(runId);
    expect(body.source).toBe('live');
    expect(body.queue[0].status).toBe(queueLive.queue[0].status);

    const auditContext = await playwrightRequest.newContext({
      baseURL: fixtureServer.url,
      extraHTTPHeaders: headers,
    });
    const audit = await fetchAuditLog(auditContext, runId, { endpoint: 'orca/queue' });
    expect(audit.some((entry: any) => entry.mode === 'live')).toBeTruthy();
    await auditContext.dispose();
  });

  test('Administration 配信 - 検証ONでヘッダーと監査ログを取得', async ({ page }) => {
    const headers = {
      'x-use-mock-orca-queue': '1',
      'x-verify-admin-delivery': '1',
      'x-e2e-user': roles.system_admin.userId,
    };
    const res = await page.request.get(`${fixtureServer.url}/api/admin/delivery`, { headers });

    expect(res.status()).toBe(200);
    expect(res.headers()['x-admin-delivery-verification']).toBe('enabled');

    const body = await res.json();
    expect(body.runId).toBe(runId);
    expect(body.verified).toBe(true);
    expect(body.deliveryId).toBe(adminVerified.deliveryId);
    expect(body.chartsDisplayEnabled).toBe(true);
    expect(body.chartsSendEnabled).toBe(true);
    expect(body.chartsMasterSource).toBe('server');

    const auditContext = await playwrightRequest.newContext({
      baseURL: fixtureServer.url,
      extraHTTPHeaders: headers,
    });
    const audit = await fetchAuditLog(auditContext, runId, { endpoint: 'admin/delivery' });
    expect(audit.length).toBeGreaterThan(0);
    expect(audit.some((entry: any) => entry.action === 'verify')).toBeTruthy();
    await auditContext.dispose();
  });

  test('Administration 配信 - 検証OFFフォールバックとレスポンス差分を確認', async ({ page }) => {
    const headers = {
      'x-use-mock-orca-queue': '0',
      'x-verify-admin-delivery': '0',
      'x-e2e-user': roles.reception.userId,
    };
    const res = await page.request.get(`${fixtureServer.url}/api/admin/delivery`, { headers });

    expect(res.status()).toBe(200);
    expect(res.headers()['x-admin-delivery-verification']).toBe('disabled');

    const body = await res.json();
    expect(body.runId).toBe(runId);
    expect(body.verified).toBe(false);
    expect(body.source).toBe('live');
    expect(body.deliveryId).toBe(adminBypass.deliveryId);
    expect(body.chartsDisplayEnabled).toBe(true);
    expect(body.chartsSendEnabled).toBe(false);
    expect(body.chartsMasterSource).toBe('fallback');
    expect(body.note).toContain('フォールスルー');
  });
});
