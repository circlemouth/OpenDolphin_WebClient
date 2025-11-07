import { setTimeout as delay } from 'node:timers/promises';

interface EndpointDescriptor {
  method: string;
  path: string;
}

const baseUrl = process.env.LOAD_TEST_BASE_URL ?? `${process.env.VITE_API_BASE_URL ?? 'https://localhost:8443'}`;
const concurrency = Number.parseInt(process.env.LOAD_TEST_CLIENTS ?? '30', 10);
const iterations = Number.parseInt(process.env.LOAD_TEST_ITERATIONS ?? '5', 10);
const rampDelayMs = Number.parseInt(process.env.LOAD_TEST_RAMP_MS ?? '250', 10);

const endpointConfig = process.env.LOAD_TEST_ENDPOINTS ?? '/patient/name/test,/karte/pid/TEST%2C20000101,/orca/tensu/name/TEST%2C20240101,true/';

const parseEndpoint = (entry: string): EndpointDescriptor => {
  const trimmed = entry.trim();
  if (!trimmed) {
    return { method: 'GET', path: '/' };
  }
  const [maybeMethod, maybePath] = trimmed.split(/\s+/, 2);
  if (!maybePath) {
    return { method: 'GET', path: maybeMethod };
  }
  return { method: maybeMethod.toUpperCase(), path: maybePath };
};

const endpoints = endpointConfig
  .split(',')
  .map(parseEndpoint)
  .filter((entry) => Boolean(entry.path));

if (endpoints.length === 0) {
  console.error('LOAD_TEST_ENDPOINTS に有効なエンドポイントが指定されていません。');
  process.exit(1);
}

const metrics: number[] = [];
let successCount = 0;
let failureCount = 0;

const invokeEndpoint = async (descriptor: EndpointDescriptor) => {
  const controller = new AbortController();
  const timeoutMs = Number.parseInt(process.env.LOAD_TEST_TIMEOUT_MS ?? '10000', 10);
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${descriptor.path.startsWith('/') ? '' : '/'}${descriptor.path}`, {
      method: descriptor.method,
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
      },
      signal: controller.signal,
    });
    const duration = performance.now() - start;
    metrics.push(duration);
    if (!response.ok) {
      failureCount += 1;
      console.warn(`HTTP ${response.status} ${descriptor.method} ${descriptor.path} (${Math.round(duration)}ms)`);
    } else {
      successCount += 1;
    }
  } catch (error) {
    failureCount += 1;
    const duration = performance.now() - start;
    console.error(`リクエスト失敗 ${descriptor.method} ${descriptor.path} (${Math.round(duration)}ms):`, error);
  } finally {
    clearTimeout(timer);
  }
};

const runClient = async (clientId: number) => {
  for (let i = 0; i < iterations; i += 1) {
    for (const endpoint of endpoints) {
      await invokeEndpoint(endpoint);
    }
    await delay(Number.parseInt(process.env.LOAD_TEST_ITERATION_DELAY_MS ?? '50', 10));
  }
  console.log(`クライアント${clientId.toString().padStart(2, '0')} 完了`);
};

const percentile = (values: number[], p: number) => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = rank - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

const main = async () => {
  console.log('=== OpenDolphin WebClient 負荷テスト ===');
  console.log(`ベースURL: ${baseUrl}`);
  console.log(`同時クライアント: ${concurrency} / 反復回数: ${iterations}`);
  console.log(`対象エンドポイント: ${endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`).join(', ')}`);

  const tasks: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i += 1) {
    const task = runClient(i + 1);
    tasks.push(task);
    await delay(rampDelayMs);
  }

  await Promise.all(tasks);

  console.log('=== 結果 ===');
  console.log(`成功: ${successCount} / 失敗: ${failureCount}`);
  if (metrics.length > 0) {
    const avg = metrics.reduce((sum, value) => sum + value, 0) / metrics.length;
    console.log(`平均応答時間: ${avg.toFixed(1)}ms`);
    console.log(`P50: ${percentile(metrics, 50).toFixed(1)}ms / P90: ${percentile(metrics, 90).toFixed(1)}ms / P99: ${percentile(metrics, 99).toFixed(1)}ms`);
  }
};

main().catch((error) => {
  console.error('負荷テストの実行中にエラーが発生しました', error);
  process.exitCode = 1;
});
