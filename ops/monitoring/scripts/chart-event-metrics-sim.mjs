#!/usr/bin/env node

/**
 * chart-event-metrics-sim.mjs
 *
 * ChartEvent SSE の履歴バッファ（100 件リングバッファ）を再現した
 * ローカルシミュレーター。1 日分のチャーン（接続断/再接続）を仮定し、
 * chartEvent.history.retained / chartEvent.history.gapDetected の疑似メトリクスを
 * 1 分粒度で生成する。
 *
 * 使い方:
 *   node ops/monitoring/scripts/chart-event-metrics-sim.mjs \
 *     --output tmp/chart-event-metrics-20260622 \
 *     --start 2026-06-21T00:00:00Z \
 *     --minutes 1440 \
 *     --seed 42
 *
 * 生成物:
 *   <output>.csv    ... timestamp, retained, gapDetected の時系列
 *   <output>.json   ... 推移サマリ（max / p95 / 閾値超過時間 / gap 発生回数）
 */

import fs from "fs";
import path from "path";

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current.startsWith("--")) {
      const key = current.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[key] = value;
    }
  }
  return args;
};

const args = parseArgs(process.argv.slice(2));
const minutes = Number(args.minutes ?? 24 * 60);
const outputBase =
  args.output ??
  path.join(
    "tmp",
    `chart-event-metrics-${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}`
  );
const seed = Number(args.seed ?? 42);
const startTimestamp = args.start
  ? Date.parse(args.start)
  : Date.UTC(2026, 5, 21, 0, 0, 0); // 2026-06-21 00:00:00Z

if (Number.isNaN(startTimestamp)) {
  console.error("Invalid --start value. Use ISO8601 format.");
  process.exit(1);
}

const ensureDir = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

const createRng = (initialSeed) => {
  let state = initialSeed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const rng = createRng(seed);

const randomNormal = (mean, std) => {
  const u1 = rng() || 1e-10;
  const u2 = rng() || 1e-10;
  const mag = Math.sqrt(-2.0 * Math.log(u1));
  const z0 = mag * Math.cos(2.0 * Math.PI * u2);
  return mean + std * z0;
};

const HISTORY_LIMIT = 100;
let retained = 0;
let sequence = 0;
let gapCounter = 0;
let disconnectRemaining = 0;
let gapPending = false;

const rows = [];
const gapEvents = [];

const calcArrivalMean = (minute) => {
  const hour = Math.floor(minute / 60) % 24;
  if (hour >= 8 && hour < 11) return 12;
  if (hour >= 11 && hour < 13) return 15;
  if (hour >= 13 && hour < 17) return 13;
  if (hour >= 17 && hour < 20) return 9;
  if (hour >= 20 && hour < 23) return 6;
  return 4;
};

const calcConsumeMean = (minute) => {
  const hour = Math.floor(minute / 60) % 24;
  if (hour >= 8 && hour < 18) return 17;
  if (hour >= 18 && hour < 22) return 11;
  return 6;
};

for (let i = 0; i < minutes; i++) {
  const timestamp = new Date(startTimestamp + i * 60_000);
  const hour = Math.floor(i / 60) % 24;

  let disconnected = disconnectRemaining > 0;
  if (!disconnected) {
    const dropWindow = hour >= 7 && hour <= 21 ? 0.015 : 0.005;
    if (rng() < dropWindow) {
      disconnectRemaining = 3 + Math.floor(rng() * 25);
      disconnected = true;
    }
  }

  const arrivals = Math.max(
    0,
    Math.round(randomNormal(calcArrivalMean(i), 3 + rng() * 2))
  );
  retained += arrivals;
  sequence += arrivals;

  const consumeMean = calcConsumeMean(i);
  const consumption = disconnected
    ? 0
    : Math.min(
        retained,
        Math.max(0, Math.round(randomNormal(consumeMean, 2 + rng())))
      );
  retained = Math.max(0, retained - consumption);

  if (retained > HISTORY_LIMIT) {
    retained = HISTORY_LIMIT;
    if (disconnected) {
      gapPending = true;
    }
  }

  const gapIncrement = !disconnected && gapPending ? 1 : 0;
  if (gapIncrement) {
    gapCounter += gapIncrement;
    gapEvents.push({
      timestamp: timestamp.toISOString(),
      comment: "Reconnect after history overflow while disconnected",
    });
    gapPending = false;
  }

  rows.push({
    timestamp: timestamp.toISOString(),
    retained,
    gapDetected: gapCounter,
  });

  if (disconnectRemaining > 0) {
    disconnectRemaining -= 1;
  }
}

const retainedSeries = rows.map((row) => row.retained);
const sorted = [...retainedSeries].sort((a, b) => a - b);
const percentile = (p) => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
};

const minutesAbove85 = retainedSeries.filter((value) => value >= 85).length;
const minutesAbove90 = retainedSeries.filter((value) => value >= 90).length;

const summary = {
  sampleMinutes: minutes,
  intervalMinutes: 1,
  start: new Date(startTimestamp).toISOString(),
  end: new Date(startTimestamp + (minutes - 1) * 60_000).toISOString(),
  stats: {
    maxRetained: Math.max(...retainedSeries),
    meanRetained:
      retainedSeries.reduce((sum, value) => sum + value, 0) / retainedSeries.length,
    p95Retained: percentile(95),
    p99Retained: percentile(99),
    minutesGte85: minutesAbove85,
    minutesGte90: minutesAbove90,
  },
  gapDetectedTotal: gapCounter,
  gapEvents,
};

const csvPath = `${outputBase}.csv`;
const summaryPath = `${outputBase}.json`;

ensureDir(csvPath);
const csvContent =
  "timestamp,chartEvent.history.retained,chartEvent.history.gapDetected\n" +
  rows.map((row) => `${row.timestamp},${row.retained},${row.gapDetected}`).join("\n");
fs.writeFileSync(csvPath, csvContent, "utf8");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");

console.log(
  `Generated ${minutes} samples. retained max=${summary.stats.maxRetained.toFixed(
    1
  )}, p95=${summary.stats.p95Retained.toFixed(1)}, gapDetected=${gapCounter}`
);
console.log(`CSV: ${csvPath}`);
console.log(`Summary: ${summaryPath}`);
