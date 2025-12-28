import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PluginOption } from 'vite';

type NextHandleFunction = (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void;

const runId = process.env.RUN_ID ?? process.env.VITE_RUM_RUN_ID ?? '20251202T090000Z';

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
};

const shouldUseMockOrcaQueue = (req: IncomingMessage) => {
  const header = req.headers['x-use-mock-orca-queue'];
  if (header === '1' || header === '0') {
    return header === '1';
  }
  return process.env.VITE_USE_MOCK_ORCA_QUEUE === '1';
};

const shouldVerifyAdminDelivery = (req: IncomingMessage) => {
  const header = req.headers['x-verify-admin-delivery'];
  if (header === '1' || header === '0') {
    return header === '1';
  }
  return process.env.VITE_VERIFY_ADMIN_DELIVERY === '1';
};

const readBooleanFromHeaderOrEnv = (
  req: IncomingMessage,
  headerName: string,
  envName: string,
  fallback: boolean,
) => {
  const header = req.headers[headerName] as string | undefined;
  if (header === '1' || header === '0') {
    return header === '1';
  }
  const env = process.env[envName];
  if (env === '1' || env === '0') {
    return env === '1';
  }
  return fallback;
};

const readChartsMasterSource = (req: IncomingMessage) => {
  const header = (req.headers['x-charts-master-source'] as string | undefined) ?? undefined;
  const env = process.env.VITE_CHARTS_MASTER_SOURCE ?? undefined;
  const raw = (header ?? env ?? 'auto').trim();
  if (raw === 'auto' || raw === 'server' || raw === 'mock' || raw === 'snapshot' || raw === 'fallback') {
    return raw;
  }
  return 'auto';
};

const createFlagAwareMiddleware = (): NextHandleFunction => (req, res, next) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const useMock = shouldUseMockOrcaQueue(req);
  const verifyAdmin = shouldVerifyAdminDelivery(req);
  const isAdminConfig = url.pathname.startsWith('/api/admin/config') || url.pathname.startsWith('/api/admin/delivery');
  const chartsDisplayEnabled = readBooleanFromHeaderOrEnv(req, 'x-charts-display-enabled', 'VITE_CHARTS_DISPLAY_ENABLED', true);
  const chartsSendEnabled = readBooleanFromHeaderOrEnv(req, 'x-charts-send-enabled', 'VITE_CHARTS_SEND_ENABLED', true);
  const chartsMasterSource = readChartsMasterSource(req);
  const environment =
    (process.env.VITE_ENVIRONMENT ??
      process.env.VITE_DEPLOY_ENV ??
      process.env.VITE_STAGE ??
      (process.env.NODE_ENV === 'production' ? 'prod' : 'dev')) || 'dev';

  if (url.pathname.startsWith('/api/orca/queue')) {
    res.setHeader('x-orca-queue-mode', useMock ? 'mock' : 'live');
    res.setHeader('x-admin-delivery-verification', verifyAdmin ? 'enabled' : 'disabled');

    if (useMock) {
      json(res, 200, {
        runId,
        source: 'mock',
        verifyAdminDelivery: verifyAdmin,
        queue: [
          {
            patientId: 'MOCK-001',
            status: 'pending',
            retryable: true,
            lastDispatchAt: new Date().toISOString(),
          },
          {
            patientId: 'MOCK-002',
            status: 'delivered',
            retryable: false,
            lastDispatchAt: new Date(Date.now() - 90_000).toISOString(),
          },
        ],
      });
      return;
    }
  }

  if (isAdminConfig) {
    res.setHeader('x-admin-delivery-verification', verifyAdmin ? 'enabled' : 'disabled');
    res.setHeader('x-orca-queue-mode', useMock ? 'mock' : 'live');
    res.setHeader('x-environment', environment);
    // モック/検証ヘッダーが有効な場合は、実 API へ到達させずにここで応答を返す。
    if (verifyAdmin || useMock) {
      json(res, 200, {
        runId,
        verified: true,
        source: useMock ? 'mock' : 'live',
        environment,
        deliveredAt: new Date().toISOString(),
        chartsDisplayEnabled,
        chartsSendEnabled,
        chartsMasterSource,
        note: 'Flagged by x-verify-admin-delivery header for Playwright/preview checks.',
      });
      return;
    }
  }

  next();
};

export const flaggedMockPlugin = (): PluginOption => ({
  name: 'flagged-mock-switch',
  configureServer(server) {
    server.middlewares.use(createFlagAwareMiddleware());
  },
  configurePreviewServer(server) {
    server.middlewares.use(createFlagAwareMiddleware());
  },
});
