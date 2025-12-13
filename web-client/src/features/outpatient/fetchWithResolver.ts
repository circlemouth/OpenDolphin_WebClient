import type { QueryFunctionContext } from '@tanstack/react-query';

import { httpFetch } from '../../libs/http/httpClient';
import { generateRunId, getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition, ResolveMasterSource } from '../../libs/observability/types';
import { normalizeBoolean } from './transformers';
import type { OutpatientMeta } from './types';

export type FetchCandidate = {
  path: string;
  source: ResolveMasterSource;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: HeadersInit;
};

export type FetchWithResolverOptions = {
  candidates: FetchCandidate[];
  body?: Record<string, unknown>;
  method?: FetchCandidate['method'];
  headers?: HeadersInit;
  queryContext?: QueryFunctionContext;
  preferredSource?: ResolveMasterSource;
  description?: string;
};

export type FetchWithResolverResult = {
  raw: Record<string, unknown>;
  meta: OutpatientMeta;
  ok: boolean;
  error?: string;
};

const orderCandidates = (candidates: FetchCandidate[], preferred?: ResolveMasterSource) => {
  if (!preferred) return candidates;
  const preferredOnes = candidates.filter((candidate) => candidate.source === preferred);
  const others = candidates.filter((candidate) => candidate.source !== preferred);
  return [...preferredOnes, ...others];
};

export async function fetchWithResolver(options: FetchWithResolverOptions): Promise<FetchWithResolverResult> {
  const runId = getObservabilityMeta().runId ?? generateRunId();
  updateObservabilityMeta({ runId });

  const cacheHitHint = options.queryContext?.meta?.servedFromCache === true ? true : undefined;
  const retryCount = (options.queryContext?.meta?.retryCount as number | undefined) ?? undefined;
  const orderedCandidates = orderCandidates(options.candidates, options.preferredSource);
  const fallbackSource = (options.preferredSource ?? orderedCandidates[0]?.source ?? 'snapshot') as ResolveMasterSource;

  let lastResult: FetchWithResolverResult | undefined;

  for (const candidate of orderedCandidates) {
    try {
      const method = candidate.method ?? options.method ?? 'POST';
      const body = method === 'GET' ? undefined : options.body ? JSON.stringify(options.body) : undefined;
      const response = await httpFetch(candidate.path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
          ...(candidate.headers ?? {}),
        },
        body,
      });

      const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const after = getObservabilityMeta();
      const meta: OutpatientMeta = {
        runId: (json.runId as string | undefined) ?? after.runId ?? runId,
        traceId: after.traceId,
        dataSourceTransition: (json.dataSourceTransition as DataSourceTransition | undefined) ?? candidate.source,
        resolveMasterSource: candidate.source,
        cacheHit: normalizeBoolean(json.cacheHit ?? cacheHitHint ?? after.cacheHit),
        missingMaster: normalizeBoolean(json.missingMaster ?? after.missingMaster),
        fallbackUsed: normalizeBoolean(json.fallbackUsed ?? after.fallbackUsed),
        fetchedAt: (json.fetchedAt as string | undefined) ?? after.fetchedAt,
        recordsReturned: typeof json.recordsReturned === 'number' ? (json.recordsReturned as number) : undefined,
        fromCache: cacheHitHint,
        retryCount,
        sourcePath: candidate.path,
        httpStatus: response.status,
        auditEvent: (json.auditEvent as Record<string, unknown> | undefined) ?? undefined,
      };

      updateObservabilityMeta({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        dataSourceTransition: meta.dataSourceTransition,
        fallbackUsed: meta.fallbackUsed,
        fetchedAt: meta.fetchedAt,
        recordsReturned: meta.recordsReturned,
      });

      const ok = response.ok;
      const result: FetchWithResolverResult = {
        raw: json,
        meta,
        ok,
        error: ok ? undefined : `status ${response.status}`,
      };

      if (ok) {
        return result;
      }
      lastResult = result;
    } catch (error) {
      lastResult = {
        raw: {},
        meta: {
          runId,
          dataSourceTransition: candidate.source ?? fallbackSource,
          resolveMasterSource: candidate.source ?? fallbackSource,
          cacheHit: cacheHitHint,
          fromCache: cacheHitHint,
          retryCount,
        },
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const fallbackMeta: OutpatientMeta = {
    runId,
    dataSourceTransition: fallbackSource,
    resolveMasterSource: fallbackSource,
    cacheHit: cacheHitHint,
    fromCache: cacheHitHint,
    retryCount,
    ...(lastResult?.meta ?? {}),
  };

  updateObservabilityMeta({
    runId: fallbackMeta.runId,
    cacheHit: fallbackMeta.cacheHit,
    missingMaster: fallbackMeta.missingMaster,
    dataSourceTransition: fallbackMeta.dataSourceTransition,
    fallbackUsed: fallbackMeta.fallbackUsed,
    fetchedAt: fallbackMeta.fetchedAt,
    recordsReturned: fallbackMeta.recordsReturned,
  });

  return lastResult ?? { raw: {}, meta: fallbackMeta, ok: false, error: 'no response' };
}
