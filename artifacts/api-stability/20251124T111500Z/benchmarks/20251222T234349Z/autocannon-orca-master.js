#!/usr/bin/env node
// ORCA-05/06/08 用 autocannon テンプレート
// 想定パス:
//   ORCA-05: GET /orca/master/generic-price?srycd=1100001
//   ORCA-06: GET /orca/master/hokenja?pref=01&keyword=協会
//   ORCA-08: GET /orca/tensu/etensu?asOf=2025-11-24&tensuVersion=2024A&page=1&pageSize=20
// サンプルメタ送信: X-Run-Id, X-ORCA-Facility, X-ORCA-User

const autocannon = require('autocannon');
const fs = require('fs');

const cfg = (() => {
  try {
    return JSON.parse(fs.readFileSync('./bench.config.json', 'utf8'));
  } catch (e) {
    return JSON.parse(fs.readFileSync('./bench.config.example.json', 'utf8'));
  }
})();

const base = cfg.baseUrl.replace(/\/$/, '');
const commonHeaders = Object.assign({
  'accept': 'application/json',
  'x-run-id': cfg.runId,
  'x-orca-facility': cfg.facilityId,
  'x-orca-user': cfg.userId,
}, cfg.headers || {});

const cases = [
  {
    title: 'ORCA-05 cache-hit generic-class',
    path: cfg.scenarios?.orca05CacheHit?.path || '/orca/master/generic-class?asOf=2025-11-24&limit=50',
    connections: 30,
    p99Target: 1200,
  },
  {
    title: 'ORCA-05 cache-miss generic-class',
    path: cfg.scenarios?.orca05CacheMiss?.path || '/orca/master/generic-class?asOf=2026-01-01&limit=50',
    connections: 10,
    p99Target: 1200,
  },
  {
    title: 'ORCA-06 address zip',
    path: cfg.scenarios?.orca06Address?.path || '/orca/master/address?zip=0600000',
    connections: 30,
    p99Target: 1000,
  },
  {
    title: 'ORCA-08 etensu page',
    path: cfg.scenarios?.orca08Etensu?.path || '/orca/tensu/etensu?asOf=2025-11-24&tensuVersion=2024A&page=1&pageSize=20',
    connections: 20,
    p99Target: 1800,
  },
];

(async () => {
  for (const c of cases) {
    console.log(`\n== ${c.title} ==`);
    const res = await autocannon({
      url: `${base}${c.path}`,
      connections: c.connections,
      duration: 60,
      headers: commonHeaders,
      setupClient: (client) => {
        if (cfg.basicAuth && cfg.basicAuth.user) {
          const token = Buffer.from(`${cfg.basicAuth.user}:${cfg.basicAuth.pass}`).toString('base64');
          client.setHeader('authorization', `Basic ${token}`);
        }
      },
    });

    console.log('p99(ms):', res.latency.p99, 'target:', c.p99Target);
    console.log('errors:', res.errors, 'timeouts:', res.timeouts);
  }
})();
