import { ensureObservabilityMeta } from '../observability/observability';
import type { DataSourceTransition as ObservabilityDataSourceTransition } from '../observability/types';

export type DataSourceTransition = ObservabilityDataSourceTransition;

export type TelemetryFunnelStage =
  | 'resolve_master'
  | 'charts_orchestration'
  | 'charts_action'
  | 'charts_patient_edit'
  | 'charts_patient_sidepane'
  | 'patient_fetch'
  | 'patient_save'
  | 'orca_summary';

export interface OutpatientFunnelPayload {
  runId?: string;
  traceId?: string;
  cacheHit: boolean;
  missingMaster: boolean;
  dataSourceTransition: DataSourceTransition;
  fallbackUsed?: boolean;
  action?: string;
  outcome?: 'success' | 'error' | 'blocked' | 'started';
  durationMs?: number;
  note?: string;
  reason?: string;
}

export interface OutpatientFlagAttributes extends Omit<OutpatientFunnelPayload, 'dataSourceTransition'> {}

export interface OutpatientFunnelRecord extends OutpatientFunnelPayload {
  stage: TelemetryFunnelStage;
  funnel: 'funnels/outpatient';
  recordedAt: string;
}

const funnelLog: OutpatientFunnelRecord[] = [];
const funnelSubscribers = new Set<(log: OutpatientFunnelRecord[]) => void>();

function notifyFunnelSubscribers() {
  const snapshot = getOutpatientFunnelLog();
  funnelSubscribers.forEach((subscriber) => {
    try {
      subscriber(snapshot);
    } catch (error) {
      console.warn('[telemetry] failed to notify subscriber', error);
    }
  });
}

export function subscribeOutpatientFunnel(subscriber: (log: OutpatientFunnelRecord[]) => void) {
  funnelSubscribers.add(subscriber);
  return () => funnelSubscribers.delete(subscriber);
}

export function recordOutpatientFunnel(
  stage: TelemetryFunnelStage,
  payload: OutpatientFlagAttributes & Partial<Pick<OutpatientFunnelPayload, 'dataSourceTransition'>>,
) {
  const meta = ensureObservabilityMeta();
  const resolvedCacheHit = payload.cacheHit ?? meta.cacheHit ?? false;
  const resolvedFallbackUsed = payload.fallbackUsed ?? meta.fallbackUsed ?? false;
  const resolvedTransition =
    payload.dataSourceTransition ??
    meta.dataSourceTransition ??
    (resolvedFallbackUsed ? 'fallback' : resolvedCacheHit ? 'server' : 'server');
  const resolvedReason = payload.reason;
  const record: OutpatientFunnelRecord = {
    stage,
    funnel: 'funnels/outpatient',
    dataSourceTransition: resolvedTransition,
    cacheHit: resolvedCacheHit,
    missingMaster: payload.missingMaster ?? meta.missingMaster ?? false,
    runId: payload.runId ?? meta.runId,
    traceId: payload.traceId ?? meta.traceId,
    fallbackUsed: resolvedFallbackUsed,
    action: payload.action,
    outcome: payload.outcome,
    durationMs: payload.durationMs,
    note: payload.note,
    reason: resolvedReason,
    recordedAt: new Date().toISOString(),
  };
  const missing: string[] = [];
  if (!record.runId) missing.push('runId');
  if (record.dataSourceTransition === undefined) missing.push('dataSourceTransition');
  if (record.cacheHit === undefined) missing.push('cacheHit');
  if (record.missingMaster === undefined) missing.push('missingMaster');
  if ((record.outcome === 'error' || record.outcome === 'blocked') && !record.reason) {
    missing.push('reason');
  }
  if (missing.length > 0 && typeof console !== 'undefined') {
    console.warn('[telemetry] recordOutpatientFunnel schema warning', { stage, missing, record });
  }
  funnelLog.push(record);
  if (typeof console !== 'undefined') {
    console.info('[telemetry] Record outpatient funnel', record);
  }
  notifyFunnelSubscribers();
  return record;
}

export function getOutpatientFunnelLog() {
  return [...funnelLog];
}

export function clearOutpatientFunnelLog() {
  funnelLog.length = 0;
  notifyFunnelSubscribers();
}
