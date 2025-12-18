import type { QueryFunctionContext } from '@tanstack/react-query';

import { logUiState } from '../../libs/audit/auditLogger';
import { updateObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition, ResolveMasterSource } from '../../libs/observability/types';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { fetchWithResolver } from '../outpatient/fetchWithResolver';
import { mergeOutpatientMeta } from '../outpatient/transformers';
import type { OrcaOutpatientSummary } from '../outpatient/types';
export type { OrcaOutpatientSummary } from '../outpatient/types';

const orcaSummaryCandidates = [
  { path: '/orca21/medicalmodv2/outpatient', source: 'server' as ResolveMasterSource },
  { path: '/orca21/medicalmodv2/outpatient/mock', source: 'mock' as ResolveMasterSource },
];

const preferredSource = (): ResolveMasterSource | undefined =>
  import.meta.env.VITE_DISABLE_MSW === '1' ? 'server' : undefined;

const resolvedDataSource = (transition?: DataSourceTransition, fallback?: ResolveMasterSource): ResolveMasterSource | undefined =>
  (transition as ResolveMasterSource | undefined) ?? fallback;

export async function fetchOrcaOutpatientSummary(
  context?: QueryFunctionContext,
  options: { preferredSourceOverride?: ResolveMasterSource } = {},
): Promise<OrcaOutpatientSummary> {
  const result = await fetchWithResolver({
    candidates: orcaSummaryCandidates,
    queryContext: context,
    preferredSource: options.preferredSourceOverride ?? preferredSource(),
    description: 'medical_outpatient_summary',
  });

  const payload = (result.raw as Record<string, unknown>) ?? {};
  const recordsReturned = Array.isArray((payload as any)?.outpatientList)
    ? ((payload as any).outpatientList as unknown[]).length
    : typeof payload.recordsReturned === 'number'
      ? (payload.recordsReturned as number)
      : undefined;

  const meta = mergeOutpatientMeta(payload, {
    ...result.meta,
    recordsReturned,
    resolveMasterSource: resolvedDataSource(result.meta.dataSourceTransition, result.meta.resolveMasterSource),
  });

  const summary: OrcaOutpatientSummary = {
    ...meta,
    note: typeof payload.apiResultMessage === 'string' ? (payload.apiResultMessage as string) : undefined,
    payload,
  };

  recordOutpatientFunnel('charts_orchestration', {
    runId: summary.runId,
    cacheHit: summary.cacheHit ?? result.meta.fromCache ?? false,
    missingMaster: summary.missingMaster ?? false,
    dataSourceTransition: summary.dataSourceTransition ?? 'snapshot',
    fallbackUsed: summary.fallbackUsed ?? false,
    action: 'medical_fetch',
    outcome: result.ok ? 'success' : 'error',
    note: summary.sourcePath,
  });

  logUiState({
    action: 'outpatient_fetch',
    screen: 'charts',
    runId: summary.runId,
    cacheHit: summary.cacheHit ?? result.meta.fromCache,
    missingMaster: summary.missingMaster,
    dataSourceTransition: summary.dataSourceTransition,
    fallbackUsed: summary.fallbackUsed,
    details: {
      endpoint: summary.sourcePath ?? result.meta.sourcePath,
      fetchedAt: summary.fetchedAt,
      recordsReturned: summary.recordsReturned,
      resolveMasterSource: summary.resolveMasterSource,
      fromCache: result.meta.fromCache,
      retryCount: result.meta.retryCount,
      description: 'medical_outpatient_summary',
    },
  });

  updateObservabilityMeta({
    runId: summary.runId,
    cacheHit: summary.cacheHit,
    missingMaster: summary.missingMaster,
    dataSourceTransition: summary.dataSourceTransition,
    fallbackUsed: summary.fallbackUsed,
    fetchedAt: summary.fetchedAt,
    recordsReturned: summary.recordsReturned,
  });

  return summary;
}
