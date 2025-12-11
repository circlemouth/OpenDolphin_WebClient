import { getObservabilityMeta } from '../observability/observability';
import type { DataSourceTransition as ObservabilityDataSourceTransition } from '../observability/types';

export type DataSourceTransition = ObservabilityDataSourceTransition;

export type TelemetryFunnelStage = 'resolve_master' | 'charts_orchestration';

export interface OutpatientFunnelPayload {
  runId?: string;
  traceId?: string;
  cacheHit: boolean;
  missingMaster: boolean;
  dataSourceTransition: DataSourceTransition;
}

export interface OutpatientFlagAttributes extends Omit<OutpatientFunnelPayload, 'dataSourceTransition'> {}

export interface OutpatientFunnelRecord extends OutpatientFunnelPayload {
  stage: TelemetryFunnelStage;
  funnel: 'funnels/outpatient';
  recordedAt: string;
}

const funnelLog: OutpatientFunnelRecord[] = [];

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
    recordedAt: new Date().toISOString(),
  };
  funnelLog.push(record);
  if (typeof console !== 'undefined') {
    console.info('[telemetry] Record outpatient funnel', record);
  }
  return record;
}

export function getOutpatientFunnelLog() {
  return [...funnelLog];
}

export function clearOutpatientFunnelLog() {
  funnelLog.length = 0;
}
