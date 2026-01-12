import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { randomUUID } from 'node:crypto';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { flaggedMockPlugin } from './plugins/flagged-mock-plugin';

const apiProxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8080/openDolphin/resources';
const useHttps = process.env.VITE_DEV_USE_HTTPS !== '0';
const httpsOption = useHttps ? {} : false;
const runId = process.env.VITE_RUM_RUN_ID ?? process.env.RUN_ID ?? '20251124T200000Z';
const rumOutputDir = path.resolve(__dirname, `../artifacts/perf/orca-master/${runId}/rum`);
const orcaCertPath = process.env.ORCA_PROD_CERT_PATH ?? process.env.ORCA_PROD_CERT;
const orcaCertPass = process.env.ORCA_PROD_CERT_PASS;
const orcaBasicUser = process.env.ORCA_PROD_BASIC_USER;
const orcaBasicKey = process.env.ORCA_PROD_BASIC_KEY;
const hasOrcaCert = Boolean(orcaCertPath && orcaCertPass && fs.existsSync(orcaCertPath));
const orcaClientAgent = hasOrcaCert
  ? new https.Agent({
      pfx: fs.readFileSync(orcaCertPath as string),
      passphrase: orcaCertPass,
      rejectUnauthorized: false,
    })
  : undefined;
const orcaAuthHeader =
  orcaBasicUser && orcaBasicKey
    ? {
        Authorization: `Basic ${Buffer.from(`${orcaBasicUser}:${orcaBasicKey}`).toString('base64')}`,
      }
    : undefined;

const apiProxy = {
  '/api': {
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
    agent: orcaClientAgent,
    headers: orcaAuthHeader,
    // /api/ にのみマッチさせ、/api01rv2 などは書き換えない。
    rewrite: (path: string) => path.replace(/^\/api(?=\/|$)/, ''),
  },
  // ORCA / 外来 API 群を開発プロキシ経由でモダナイズ版サーバーへ中継する。
  '/api01rv2': {
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
    agent: orcaClientAgent,
    headers: orcaAuthHeader,
  },
  '/orca21': {
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
    agent: orcaClientAgent,
    headers: orcaAuthHeader,
  },
  '/orca12': {
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
    agent: orcaClientAgent,
    headers: orcaAuthHeader,
  },
  '/orca': {
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
    agent: orcaClientAgent,
    headers: orcaAuthHeader,
  },
} as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    flaggedMockPlugin(),
    {
      name: 'preview-perf-log-sink',
      configurePreviewServer(previewServer) {
        previewServer.middlewares.use('/__perf-log', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', () => {
            try {
              fs.mkdirSync(rumOutputDir, { recursive: true });
              const timestamp = new Date().toISOString().replace(/[:]/g, '').replace(/\..+/, 'Z');
              const filename = path.join(rumOutputDir, `${timestamp}-${process.pid}-${randomUUID()}.json`);
              fs.writeFileSync(filename, body || '{}', 'utf8');
              // Keep console noise minimal but traceable when needed.
              console.info('[perf-log] saved', path.basename(filename));
            } catch (error) {
              console.error('[perf-log] failed to persist log', error);
            }

            res.statusCode = 204;
            res.end();
          });
        });
      },
    },
  ],
  server: {
    // 開発計測時に自己署名証明書で LHCI が落ちないよう HTTP に切替可能にする
    https: httpsOption,
    strictPort: true,
    proxy: { ...apiProxy },
  },
  preview: {
    https: httpsOption,
    proxy: { ...apiProxy },
  },
  build: {
    rollupOptions: {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
