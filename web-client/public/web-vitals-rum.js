import { onCLS, onINP, onLCP, onFCP, onTTFB } from '/vendor/web-vitals.js';

const runId = window.__PERF_RUN_ID__ || '20251124T200000Z';
const source = 'charts/orca-master';
const endpoint = window.__PERF_ENDPOINT__ || 'http://localhost:4173/__perf-log';

// ログをクライアント側でも保持しておき、Playwright から収集できるようにする
window.__WEB_VITALS_LOG__ = window.__WEB_VITALS_LOG__ || [];

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

  window.__WEB_VITALS_LOG__.push(payload);
  // CI のテキストログにも残す
  console.info('[web-vitals]', JSON.stringify(payload));

  navigator.sendBeacon?.(endpoint, JSON.stringify(payload)) ||
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      mode: 'no-cors',
    }).catch(() => {});
}

onCLS(send, { reportAllChanges: true });
onINP(send, { reportAllChanges: true });
onLCP(send);
onFCP(send);
onTTFB(send);
