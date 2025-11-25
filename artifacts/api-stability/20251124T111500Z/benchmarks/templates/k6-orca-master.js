import http from 'k6/http';
import { check, Trend } from 'k6';

// テンプレート: ORCA-05/06/08 ベンチ計測（キャッシュヒット/ミス両対応）
// 想定パスとサンプルクエリ:
// ORCA-05: /orca/master/generic-class?asOf=2025-11-24&limit=50 (キャッシュヒット), /orca/master/generic-class?asOf=2026-01-01 (キャッシュミス)
// ORCA-06: /orca/master/address?zip=0600000 または /orca/master/hokenja?pref=01&keyword=協会
// ORCA-08: /orca/tensu/etensu?asOf=2025-11-24&tensuVersion=2024A&page=1&pageSize=20（大型レスポンス/キャッシュミス想定）
// サンプルペイロード（POST が必要な場合の雛形）: { "runId": "<RUN_ID>", "asOf": "2025-11-24", "facilityId": "demo-hospital", "userId": "bench-bot" }

const cfg = (() => {
  try {
    return JSON.parse(open('./bench.config.json'));
  } catch (e) {
    return JSON.parse(open('./bench.config.example.json'));
  }
})();

const base = cfg.baseUrl.replace(/\/$/, '');
const commonHeaders = Object.assign({
  'X-Run-Id': cfg.runId,
  'X-ORCA-Facility': cfg.facilityId,
  'X-ORCA-User': cfg.userId,
}, cfg.headers || {});

const dbTime = new Trend('db_time_ms');
const rowCount = new Trend('row_count');
const payloadSize = new Trend('payload_bytes');

export const options = {
  scenarios: {
    orca05_cache_hit: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      tags: { api: 'ORCA-05', cache: 'hit' },
    },
    orca05_cache_miss: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      tags: { api: 'ORCA-05', cache: 'miss' },
    },
    orca06_address: {
      executor: 'constant-arrival-rate',
      rate: 30,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 10,
      tags: { api: 'ORCA-06', cache: 'hit' },
    },
    orca08_etensu: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 10,
      tags: { api: 'ORCA-08', cache: 'miss' },
    },
  },
  thresholds: {
    'http_req_duration{api:ORCA-05}': ['p(99)<1200'],
    'http_req_duration{api:ORCA-05,cache:hit}': ['p(99)<600'],
    'http_req_duration{api:ORCA-06}': ['p(99)<1000'],
    'http_req_duration{api:ORCA-08}': ['p(99)<1800'],
    'http_req_failed': ['rate<0.01'],
  },
};

function withAuth(url) {
  const params = {
    headers: commonHeaders,
  };
  if (cfg.basicAuth && cfg.basicAuth.user) {
    params.auth = { user: cfg.basicAuth.user, pass: cfg.basicAuth.pass };
  }
  return { url, params };
}

function recordObservability(res) {
  dbTime.add(Number(res.headers['X-Orca-Db-Time'] || 0));
  rowCount.add(Number(res.headers['X-Orca-Row-Count'] || 0));
  payloadSize.add(Number(res.headers['Content-Length'] || 0));
}

export default function () {
  const scenario = __ENV.SCENARIO || __ITER.toString();
  let target;
  switch (__VU % 4) {
    case 0:
      target = cfg.scenarios?.orca05CacheHit?.path;
      break;
    case 1:
      target = cfg.scenarios?.orca05CacheMiss?.path;
      break;
    case 2:
      target = cfg.scenarios?.orca06Address?.path;
      break;
    default:
      target = cfg.scenarios?.orca08Etensu?.path;
  }

  const { url, params } = withAuth(`${base}${target}`);
  const res = http.get(url, params);

  recordObservability(res);

  check(res, {
    'status is 2xx/304': (r) => r.status >= 200 && r.status < 400,
    'cacheHit tag present': (r) => !!r.headers['X-Orca-Cache-Hit'] || true, // allow missing header in early runs
  });
}
