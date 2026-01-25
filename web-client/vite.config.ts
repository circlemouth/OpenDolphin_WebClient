import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { randomUUID } from 'node:crypto';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { flaggedMockPlugin } from './plugins/flagged-mock-plugin';

const apiProxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8080/openDolphin/resources';
const disableProxy = process.env.VITE_DISABLE_PROXY === '1';
const useHttps = process.env.VITE_DEV_USE_HTTPS !== '0';
const httpsOption = useHttps ? {} : false;
const runId = process.env.VITE_RUM_RUN_ID ?? process.env.RUN_ID ?? '20251124T200000Z';
const rumOutputDir = path.resolve(__dirname, `../artifacts/perf/orca-master/${runId}/rum`);
const orcaCertPath =
  process.env.ORCA_CERT_PATH ?? process.env.ORCA_PROD_CERT_PATH ?? process.env.ORCA_PROD_CERT;
const orcaCertPass = process.env.ORCA_CERT_PASS ?? process.env.ORCA_PROD_CERT_PASS;
const orcaBasicUser =
  process.env.ORCA_BASIC_USER ?? process.env.ORCA_PROD_BASIC_USER ?? process.env.ORCA_API_USER;
const orcaBasicKey =
  process.env.ORCA_BASIC_PASSWORD ??
  process.env.ORCA_BASIC_KEY ??
  process.env.ORCA_PROD_BASIC_KEY ??
  process.env.ORCA_API_PASSWORD;
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
const isTruthy = (value?: string) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};
const normalizePathPrefix = (raw?: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '/') return '';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
};
const parsePathPrefix = (raw?: string) => {
  if (!raw) return { prefix: '', auto: true };
  const trimmed = raw.trim();
  if (!trimmed) return { prefix: '', auto: true };
  const normalized = trimmed.toLowerCase();
  if (['off', 'false', 'none', 'disable', 'disabled'].includes(normalized)) {
    return { prefix: '', auto: false };
  }
  return { prefix: normalizePathPrefix(trimmed), auto: false };
};
const resolveTargetPath = (target: string) => {
  try {
    const url = new URL(target);
    return normalizePathPrefix(url.pathname);
  } catch {
    return '';
  }
};
const orcaModeRaw = process.env.VITE_ORCA_MODE ?? process.env.ORCA_MODE ?? '';
const orcaMode = orcaModeRaw.trim().toLowerCase();
const isWebOrca =
  orcaMode === 'weborca' || orcaMode === 'cloud' || isTruthy(process.env.ORCA_API_WEBORCA);
const orcaPathPrefixSpec = parsePathPrefix(
  process.env.VITE_ORCA_API_PATH_PREFIX ?? process.env.ORCA_API_PATH_PREFIX,
);
const resolvedOrcaPrefix = orcaPathPrefixSpec.auto ? (isWebOrca ? '/api' : '') : orcaPathPrefixSpec.prefix;
const targetPath = resolveTargetPath(apiProxyTarget);
const targetHasOrcaPrefix =
  resolvedOrcaPrefix &&
  (targetPath === resolvedOrcaPrefix || targetPath.startsWith(`${resolvedOrcaPrefix}/`));
const shouldAddOrcaPrefix = Boolean(resolvedOrcaPrefix) && !targetHasOrcaPrefix;
const addOrcaPrefix = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!resolvedOrcaPrefix || !shouldAddOrcaPrefix) {
    return normalizedPath;
  }
  if (normalizedPath === resolvedOrcaPrefix || normalizedPath.startsWith(`${resolvedOrcaPrefix}/`)) {
    return normalizedPath;
  }
  return `${resolvedOrcaPrefix}${normalizedPath}`;
};
const stripApiPrefix = (path: string) => path.replace(/^\/api(?=\/|$)/, '');
const orcaPrefixedPaths = [
  '/api01rv2',
  '/api21',
  '/orca06',
  '/orca12',
  '/orca21',
  '/orca22',
  '/orca25',
  '/orca51',
  '/orca101',
  '/orca102',
  '/blobapi',
] as const;
const isOrcaApiPath = (path: string) => {
  const stripped = stripApiPrefix(path);
  return orcaPrefixedPaths.some(
    (prefix) => stripped === prefix || stripped.startsWith(`${prefix}/`),
  );
};
const rewriteApiPath = (path: string) => {
  if (resolvedOrcaPrefix && isOrcaApiPath(path)) {
    return addOrcaPrefix(stripApiPrefix(path));
  }
  return stripApiPrefix(path);
};
const createProxyConfig = (rewrite?: (path: string) => string) => ({
  target: apiProxyTarget,
  changeOrigin: true,
  secure: false,
  agent: orcaClientAgent,
  headers: orcaAuthHeader,
  ...(rewrite ? { rewrite } : {}),
});
const normalizeBasePath = (raw?: string): string => {
  if (!raw) return '/';
  const trimmed = raw.trim();
  if (!trimmed) return '/';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (withLeadingSlash === '/') return '/';
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
};
const basePath = normalizeBasePath(process.env.VITE_BASE_PATH);
const viteBase = basePath === '/' ? '/' : `${basePath}/`;

const apiProxy = {
  '/api': createProxyConfig(rewriteApiPath),
  // ORCA / 外来 API 群を開発プロキシ経由でモダナイズ版サーバーへ中継する。
  '/api01rv2': createProxyConfig(addOrcaPrefix),
  '/api21': createProxyConfig(addOrcaPrefix),
  '/orca06': createProxyConfig(addOrcaPrefix),
  '/orca12': createProxyConfig(addOrcaPrefix),
  '/orca21': createProxyConfig(addOrcaPrefix),
  '/orca22': createProxyConfig(addOrcaPrefix),
  '/orca25': createProxyConfig(addOrcaPrefix),
  '/orca51': createProxyConfig(addOrcaPrefix),
  '/orca101': createProxyConfig(addOrcaPrefix),
  '/orca102': createProxyConfig(addOrcaPrefix),
  '/orca': createProxyConfig(),
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
  base: viteBase,
  server: {
    // 開発計測時に自己署名証明書で LHCI が落ちないよう HTTP に切替可能にする
    https: httpsOption,
    strictPort: true,
    proxy: disableProxy ? undefined : { ...apiProxy },
  },
  preview: {
    https: httpsOption,
    proxy: disableProxy ? undefined : { ...apiProxy },
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
