import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition } from '../../libs/observability/types';

export type OrcaOutpatientSummary = {
  runId?: string;
  dataSourceTransition?: DataSourceTransition;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  fetchedAt?: string;
  recordsReturned?: number;
  note?: string;
  payload?: Record<string, unknown>;
};

const orcaSummaryCandidates = ['/orca21/medicalmodv2/outpatient'];

const normalizeBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return undefined;
};

const tryFetchJson = async (paths: string[], body: Record<string, unknown>) => {
  for (const path of paths) {
    try {
      const response = await httpFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) continue;
      const data = await response.json().catch(() => undefined);
      return { data, path };
    } catch (error) {
      console.warn('[charts] fetch failed for', path, error);
    }
  }
  return undefined;
};

export async function fetchOrcaOutpatientSummary(): Promise<OrcaOutpatientSummary> {
  const result = await tryFetchJson(orcaSummaryCandidates, {});
  const json = (result?.data as Record<string, unknown>) ?? {};
  const payload = typeof json === 'object' && json ? json : {};
  const runId = (payload.runId as string | undefined) ?? getObservabilityMeta().runId;
  const records = Array.isArray((payload as Record<string, unknown>)?.outpatientList)
    ? ((payload as Record<string, unknown>).outpatientList as unknown[]).length
    : typeof payload.recordsReturned === 'number'
      ? (payload.recordsReturned as number)
      : undefined;
  const summary: OrcaOutpatientSummary = {
    runId,
    dataSourceTransition: payload.dataSourceTransition as DataSourceTransition | undefined,
    cacheHit: normalizeBoolean(payload.cacheHit),
    missingMaster: normalizeBoolean(payload.missingMaster),
    fallbackUsed: normalizeBoolean(payload.fallbackUsed),
    fetchedAt: (payload.fetchedAt as string | undefined) ?? (payload.timestamp as string | undefined),
    recordsReturned: records,
    note: typeof payload.apiResultMessage === 'string' ? (payload.apiResultMessage as string) : undefined,
    payload,
  };

  updateObservabilityMeta({
    runId: summary.runId,
    cacheHit: summary.cacheHit,
    missingMaster: summary.missingMaster,
    dataSourceTransition: summary.dataSourceTransition,
    fallbackUsed: summary.fallbackUsed,
  });

  return summary;
}
