#!/usr/bin/env node
/**
 * Verify that Vite preview works under a subpath (VITE_BASE_PATH) and survives direct reloads.
 *
 * Steps:
 * 1) npm run build with VITE_BASE_PATH (default: /foo/)
 * 2) npm run preview -- --host --port <PORT> --strictPort with the same base path
 * 3) Fetch `${base}/` and `${base}/f/0001/reception` expecting HTTP 200
 *
 * Environment:
 *  - VITE_BASE_PATH: base path to test (default: /foo/)
 *  - SUBPATH_PREVIEW_PORT: port for vite preview (default: 4175)
 */

import { spawn, spawnSync } from 'node:child_process';
import { Agent } from 'node:https';
import net from 'node:net';
import process from 'node:process';

const projectRoot = new URL('..', import.meta.url).pathname;

// Allow self-signed certificate used by vite preview
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const normalizeBasePath = (raw = '/foo/') => {
  const trimmed = raw.trim();
  if (!trimmed) return '/';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withoutTrailing = withLeading.replace(/\/+$/, '') || '/';
  return withoutTrailing === '/' ? '/' : `${withoutTrailing}/`;
};

const basePath = normalizeBasePath(process.env.VITE_BASE_PATH);
const preferredPort = Number(process.env.SUBPATH_PREVIEW_PORT ?? 4175);
const agent = new Agent({ rejectUnauthorized: false });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensurePortFree = (port) =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if ((err).code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(err);
      }
    });
    server.listen(port, () => {
      server.close(() => resolve(port));
    });
  });

const choosePort = async () => {
  const candidates = [preferredPort, preferredPort + 1, preferredPort + 2];
  for (const port of candidates) {
    try {
      await ensurePortFree(port);
      return port;
    } catch {
      // try next
    }
  }
  throw new Error(`No free port found near ${preferredPort}`);
};

const runBuild = () => {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: projectRoot,
    env: { ...process.env, VITE_BASE_PATH: basePath },
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`npm run build failed with code ${result.status}`);
  }
};

const startPreview = (port) => {
  const proc = spawn(
    'npm',
    ['run', 'preview', '--', '--host', '--port', String(port), '--strictPort'],
    {
      cwd: projectRoot,
      env: { ...process.env, VITE_BASE_PATH: basePath },
      stdio: ['inherit', 'pipe', 'pipe'],
    },
  );
  proc.stdout.on('data', (data) => process.stdout.write(data));
  proc.stderr.on('data', (data) => process.stderr.write(data));
  return proc;
};

const waitForServer = async (origin, tries = 30) => {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(origin, { agent });
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await wait(1000);
  }
  throw new Error(`Preview server did not become ready at ${origin}`);
};

const expect200 = async (url) => {
  const res = await fetch(url, { agent });
  if (!res.ok) {
    throw new Error(`Expected 200 at ${url} but got ${res.status}`);
  }
};

const main = async () => {
  const port = await choosePort();
  const origin = `https://localhost:${port}`;

  console.info(`[subpath-preview] basePath=${basePath} port=${port}`);
  runBuild();

  const preview = startPreview(port);
  try {
    await waitForServer(`${origin}${basePath}`);
    await expect200(`${origin}${basePath}`);
    await expect200(`${origin}${basePath}f/0001/reception`);
    console.info('[subpath-preview] OK: both routes returned 200');
  } finally {
    preview.kill('SIGINT');
  }
};

main().catch((err) => {
  console.error('[subpath-preview] FAILED', err);
  process.exit(1);
});
