import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

const runId = '20251124T171500Z';
const source = 'charts/orca-master';
const endpoint = window.__PERF_ENDPOINT__ || '/api/perf/vitals';

function send(metric) {
  const payload = {
    runId,
    source,
    name: metric.name,
    id: metric.id,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    mswEnabled: window.__MSW_ENABLED__ ?? null,
  };

  navigator.sendBeacon?.(endpoint, JSON.stringify(payload)) ||
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: 'no-cors',
    }).catch(() => {});
}

[onCLS, onINP, onLCP, onFCP, onTTFB].forEach((fn) => fn(send));
