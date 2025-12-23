#!/usr/bin/env node
// ORCA-08 autocannon runner (serial)
const autocannon = require('autocannon');
const fs = require('fs');

const cfg = (() => {
  try {
    return JSON.parse(fs.readFileSync('./bench.config.json', 'utf8'));
  } catch (e) {
    throw new Error('bench.config.json is required');
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
    title: 'ORCA-08 etensu small (serial)',
    path: cfg.scenarios?.orca08Small?.path,
    connections: 1,
    p99Target: 1800,
  },
  {
    title: 'ORCA-08 etensu large (serial)',
    path: cfg.scenarios?.orca08Large?.path,
    connections: 1,
    p99Target: 2500,
  },
].filter(c => c.path);

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
