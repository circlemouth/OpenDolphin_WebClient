import { type DataSourceTransition, type LiveRegionAria, type LiveRegionTone, type ObservabilityMeta } from './types';

const DEFAULT_RUN_ID =
  import.meta.env.VITE_RUM_RUN_ID ??
  // Playwright や dev 用の簡易キー（環境変数経由で指定されることが多い）
  (import.meta.env as Record<string, string | undefined>).VITE_RUN_ID;

let currentMeta: ObservabilityMeta = {
  runId: DEFAULT_RUN_ID,
};

type HeadersDict = Record<string, string>;
const liveRegionToneMap: Record<LiveRegionTone, Exclude<LiveRegionAria, 'off'>> = {
  info: 'polite',
  success: 'polite',
  warning: 'assertive',
  error: 'assertive',
};

const normalizeHeaders = (headers?: HeadersInit): HeadersDict => {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const entries: HeadersDict = {};
    headers.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }
  if (Array.isArray(headers)) {
    return headers.reduce<HeadersDict>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
  return { ...headers };
};

const toHeaderValue = (value?: boolean | string): string | undefined => {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === undefined) return undefined;
  return String(value);
};

const mergeMeta = (base: ObservabilityMeta, next?: ObservabilityMeta): ObservabilityMeta => {
  if (!next) return base;
  const merged: ObservabilityMeta = { ...base };
  (Object.keys(next) as (keyof ObservabilityMeta)[]).forEach((key) => {
    const candidate = next[key];
    if (candidate !== undefined) {
      merged[key] = candidate;
    }
  });
  return merged;
};

export const generateRunId = () => {
  const iso = new Date().toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  return iso.replace(/[-:]/g, '') + 'Z';
};

const generateTraceId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `trace-${Date.now()}`;
};

export function updateObservabilityMeta(next: ObservabilityMeta) {
  currentMeta = mergeMeta(currentMeta, next);
}

export function getObservabilityMeta(): ObservabilityMeta {
  return { ...currentMeta };
}

export function resolveRunId(runId?: string): string | undefined {
  return runId ?? currentMeta.runId;
}

export function resolveAriaLive(tone: LiveRegionTone, override?: LiveRegionAria): LiveRegionAria {
  if (override) return override;
  return liveRegionToneMap[tone];
}

export function ensureObservabilityMeta(overrides?: ObservabilityMeta): ObservabilityMeta {
  const merged = mergeMeta(currentMeta, overrides);
  if (!merged.runId) {
    merged.runId = generateRunId();
    updateObservabilityMeta({ runId: merged.runId });
  }
  if (!merged.traceId) {
    merged.traceId = generateTraceId();
    updateObservabilityMeta({ traceId: merged.traceId });
  }
  return { ...merged };
}

export function applyObservabilityHeaders(init?: RequestInit, overrides?: ObservabilityMeta): RequestInit {
  const headers = normalizeHeaders(init?.headers);
  const meta = mergeMeta(currentMeta, overrides);
  const resolvedTraceId = meta.traceId ?? generateTraceId();
  if (!meta.traceId) {
    updateObservabilityMeta({ traceId: resolvedTraceId });
    meta.traceId = resolvedTraceId;
  }

  const headerMap: Record<string, string | undefined> = {
    'X-Run-Id': meta.runId,
    'X-Trace-Id': resolvedTraceId,
    'X-Cache-Hit': toHeaderValue(meta.cacheHit),
    'X-Missing-Master': toHeaderValue(meta.missingMaster),
    'X-DataSource-Transition': meta.dataSourceTransition,
    'X-Fallback-Used': toHeaderValue(meta.fallbackUsed),
  };

  Object.entries(headerMap).forEach(([key, value]) => {
    if (!value) return;
    // 既存ヘッダーを尊重し、未指定の場合のみ上書きする。
    if (!headers[key] && !headers[key.toLowerCase()]) {
      headers[key] = value;
    }
  });

  return { ...(init ?? {}), headers };
}

export function captureObservabilityFromResponse(response: Response) {
  const headers = response.headers;
  const next: ObservabilityMeta = {};

  const runId = headers.get('x-run-id');
  const traceId = headers.get('x-trace-id');
  const cacheHit = headers.get('x-cache-hit');
  const missingMaster = headers.get('x-missing-master');
  const dataSourceTransition = headers.get('x-datasource-transition') as DataSourceTransition | null;
  const fallbackUsed = headers.get('x-fallback-used');

  if (runId) next.runId = runId;
  if (traceId) next.traceId = traceId;
  if (cacheHit !== null) next.cacheHit = cacheHit === 'true';
  if (missingMaster !== null) next.missingMaster = missingMaster === 'true';
  if (dataSourceTransition) next.dataSourceTransition = dataSourceTransition;
  if (fallbackUsed !== null) next.fallbackUsed = fallbackUsed === 'true';

  if (Object.keys(next).length > 0) {
    updateObservabilityMeta(next);
  }
}
