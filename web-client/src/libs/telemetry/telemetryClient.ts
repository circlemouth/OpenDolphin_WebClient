import { getObservabilityMeta } from '../observability/observability';
import type { DataSourceTransition as ObservabilityDataSourceTransition } from '../observability/types';

export type DataSourceTransition = ObservabilityDataSourceTransition;

export type TelemetryFunnelStage =
  | 'resolve_master'
  | 'charts_orchestration'
  | 'charts_action'
  | 'charts_patient_sidepane'
  | 'patient_fetch'
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
  const meta = getObservabilityMeta();
  const record: OutpatientFunnelRecord = {
    stage,
    funnel: 'funnels/outpatient',
    dataSourceTransition: payload.dataSourceTransition ?? meta.dataSourceTransition ?? 'server',
    cacheHit: payload.cacheHit ?? meta.cacheHit ?? false,
    missingMaster: payload.missingMaster ?? meta.missingMaster ?? false,
    runId: payload.runId ?? meta.runId,
    traceId: payload.traceId ?? meta.traceId,
    fallbackUsed: payload.fallbackUsed ?? meta.fallbackUsed ?? false,
    action: payload.action,
    outcome: payload.outcome,
    durationMs: payload.durationMs,
    note: payload.note,
    recordedAt: new Date().toISOString(),
  };
  const missing: string[] = [];
  if (!record.runId) missing.push('runId');
  if (record.dataSourceTransition === undefined) missing.push('dataSourceTransition');
  if (record.cacheHit === undefined) missing.push('cacheHit');
  if (record.missingMaster === undefined) missing.push('missingMaster');
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
