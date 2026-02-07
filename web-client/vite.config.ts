import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { randomUUID } from 'node:crypto';

import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { flaggedMockPlugin } from './plugins/flagged-mock-plugin';

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
const normalizeBasePath = (raw?: string): string => {
  if (!raw) return '/';
  const trimmed = raw.trim();
  if (!trimmed) return '/';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (withLeadingSlash === '/') return '/';
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite does not automatically populate `process.env` for `vite.config.ts` from `.env*`.
  // `loadEnv()` keeps dev/proxy settings consistent whether started via scripts or manually.
  const env = loadEnv(mode, process.cwd(), '');
  const getEnv = (key: string) => process.env[key] ?? env[key];

  const apiProxyTarget = getEnv('VITE_DEV_PROXY_TARGET') ?? 'http://localhost:8080/openDolphin/resources';
  const disableProxy = getEnv('VITE_DISABLE_PROXY') === '1';
  const useHttps = isTruthy(getEnv('VITE_DEV_USE_HTTPS'));
  const httpsOption = useHttps ? {} : false;
  const runId = getEnv('VITE_RUM_RUN_ID') ?? getEnv('RUN_ID') ?? '20251124T200000Z';
  const rumOutputDir = path.resolve(__dirname, `../artifacts/perf/orca-master/${runId}/rum`);

  const orcaCertPath = getEnv('ORCA_CERT_PATH') ?? getEnv('ORCA_PROD_CERT_PATH') ?? getEnv('ORCA_PROD_CERT');
  const orcaCertPass = getEnv('ORCA_CERT_PASS') ?? getEnv('ORCA_PROD_CERT_PASS');
  const orcaBasicUser = getEnv('ORCA_BASIC_USER') ?? getEnv('ORCA_PROD_BASIC_USER') ?? getEnv('ORCA_API_USER');
  const orcaBasicKey =
    getEnv('ORCA_BASIC_PASSWORD') ??
    getEnv('ORCA_BASIC_KEY') ??
    getEnv('ORCA_PROD_BASIC_KEY') ??
    getEnv('ORCA_API_PASSWORD');

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
  const shouldAttachOrcaAuth = Boolean(orcaAuthHeader?.Authorization);
  const shouldDropOrcaResultMessage = isTruthy(
    getEnv('VITE_DEV_PROXY_DROP_ORCA_RESULT_MESSAGE') ?? getEnv('VITE_PROXY_DROP_ORCA_RESULT_MESSAGE'),
  );
  const shouldDropOrcaHeaders = isTruthy(
    getEnv('VITE_DEV_PROXY_DROP_ORCA_HEADERS') ?? getEnv('VITE_PROXY_DROP_ORCA_HEADERS'),
  );
  const needsProxyConfigure = shouldAttachOrcaAuth || shouldDropOrcaResultMessage || shouldDropOrcaHeaders;

  const orcaModeRaw = getEnv('VITE_ORCA_MODE') ?? getEnv('ORCA_MODE') ?? '';
  const orcaMode = orcaModeRaw.trim().toLowerCase();
  const isWebOrca = orcaMode === 'weborca' || orcaMode === 'cloud' || isTruthy(getEnv('ORCA_API_WEBORCA'));
  const resourcePathPrefix = normalizePathPrefix(getEnv('VITE_DEV_PROXY_RESOURCE_PREFIX') ?? '/openDolphin/resources');
  const orcaPathPrefixSpec = parsePathPrefix(getEnv('VITE_ORCA_API_PATH_PREFIX') ?? getEnv('ORCA_API_PATH_PREFIX'));
  const resolvedOrcaPrefix = orcaPathPrefixSpec.auto ? (isWebOrca ? '/api' : '') : orcaPathPrefixSpec.prefix;
  const targetPath = resolveTargetPath(apiProxyTarget);
  const targetHasOrcaPrefix =
    resolvedOrcaPrefix && (targetPath === resolvedOrcaPrefix || targetPath.startsWith(`${resolvedOrcaPrefix}/`));
  const shouldAddOrcaPrefix = Boolean(resolvedOrcaPrefix) && !targetHasOrcaPrefix;
  // When the proxy target is an origin (e.g. `http://localhost:9080`), we still need to reach the
  // JAX-RS resources mounted under `/openDolphin/resources` (server-modernized/legacy both).
  // Previously this was gated by `!isWebOrca`, which caused `/orca/*` (and other API paths) to 404
  // under WebORCA mode unless the env already included the resource path.
  const shouldAddResourcePrefix = Boolean(resourcePathPrefix) && (!targetPath || targetPath === '/');

  const addOrcaPrefix = (rawPath: string) => {
    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    if (!resolvedOrcaPrefix || !shouldAddOrcaPrefix) return normalizedPath;
    if (normalizedPath === resolvedOrcaPrefix || normalizedPath.startsWith(`${resolvedOrcaPrefix}/`)) return normalizedPath;
    return `${resolvedOrcaPrefix}${normalizedPath}`;
  };
  const addResourcePrefix = (rawPath: string) => {
    const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    if (!shouldAddResourcePrefix || !resourcePathPrefix) return normalizedPath;
    if (normalizedPath === resourcePathPrefix || normalizedPath.startsWith(`${resourcePathPrefix}/`)) return normalizedPath;
    return `${resourcePathPrefix}${normalizedPath}`;
  };
  const rewriteOrcaPath = (rawPath: string) => addResourcePrefix(isWebOrca ? addOrcaPrefix(rawPath) : rawPath);
  const stripApiPrefix = (rawPath: string) => rawPath.replace(/^\/api(?=\/|$)/, '');

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
  const isOrcaApiPath = (rawPath: string) => {
    const stripped = stripApiPrefix(rawPath);
    return orcaPrefixedPaths.some((prefix) => stripped === prefix || stripped.startsWith(`${prefix}/`));
  };
  const isAdminApiPath = (rawPath: string) => {
    const trimmed = rawPath.trim();
    return trimmed === '/api/admin' || trimmed.startsWith('/api/admin/');
  };
  const isApiOrcaQueuePath = (rawPath: string) => {
    const trimmed = rawPath.trim();
    return trimmed === '/api/orca' || trimmed.startsWith('/api/orca/');
  };
  const rewriteApiPath = (rawPath: string) => {
    if (isAdminApiPath(rawPath) || isApiOrcaQueuePath(rawPath)) return addResourcePrefix(rawPath);
    if (resolvedOrcaPrefix && isOrcaApiPath(rawPath)) return addOrcaPrefix(stripApiPrefix(rawPath));
    return addResourcePrefix(stripApiPrefix(rawPath));
  };

  const createProxyConfig = (rewrite?: (p: string) => string) => ({
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
    agent: orcaClientAgent,
    ...(needsProxyConfigure
      ? {
          configure: (proxy: import('http-proxy').Server) => {
            if (shouldAttachOrcaAuth) {
              proxy.on('proxyReq', (proxyReq, req) => {
                const proxyAuth =
                  typeof proxyReq.getHeader === 'function' ? proxyReq.getHeader('authorization') : undefined;
                const existingAuth = proxyAuth ?? req.headers?.authorization;
                if (!existingAuth && orcaAuthHeader?.Authorization) {
                  proxyReq.setHeader('Authorization', orcaAuthHeader.Authorization);
                }
              });
            }
            if (shouldDropOrcaHeaders || shouldDropOrcaResultMessage) {
              proxy.on('proxyRes', (proxyRes) => {
                const headers = proxyRes.headers;
                if (!headers) return;
                Object.keys(headers).forEach((key) => {
                  const normalized = key.toLowerCase();
                  if (shouldDropOrcaHeaders && normalized.startsWith('x-orca-')) {
                    delete headers[key];
                    return;
                  }
                  if (shouldDropOrcaResultMessage && normalized === 'x-orca-api-result-message') {
                    delete headers[key];
                  }
                });
              });
            }
          },
        }
      : {}),
    ...(rewrite ? { rewrite } : {}),
  });

  const apiProxy = {
    '/api': createProxyConfig(rewriteApiPath),
    '/user': createProxyConfig(addResourcePrefix),
    '/karte': createProxyConfig(addResourcePrefix),
    '/odletter': createProxyConfig(addResourcePrefix),
    // ORCA / 外来 API 群を開発プロキシ経由でモダナイズ版サーバーへ中継する。
    '/api01rv2': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/api21': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/orca06': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/orca12': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/orca21': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/orca22': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/orca25': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/orca51': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/orca101': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/orca102': createProxyConfig((p: string) => addResourcePrefix(addOrcaPrefix(p))),
    '/orca': createProxyConfig(rewriteOrcaPath),
  } as const;

  const basePath = normalizeBasePath(getEnv('VITE_BASE_PATH'));
  const viteBase = basePath === '/' ? '/' : `${basePath}/`;

  return {
    plugins: [
      react(),
      basicSsl(),
      // Fixture injection via middleware must be explicit (avoid accidental stage/prod mixing).
      ...(isTruthy(getEnv('VITE_ENABLE_FLAGGED_MOCKS')) ? [flaggedMockPlugin()] : []),
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
  };
});
