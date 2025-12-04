export type DataSourceTransition = 'mock' | 'snapshot' | 'server' | 'fallback';

export type TelemetryFunnelStage = 'resolve_master' | 'charts_orchestration';

export interface OutpatientFunnelPayload {
  runId?: string;
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
  const record: OutpatientFunnelRecord = {
    stage,
    funnel: 'funnels/outpatient',
    dataSourceTransition: payload.dataSourceTransition ?? 'server',
    cacheHit: payload.cacheHit,
    missingMaster: payload.missingMaster,
    runId: payload.runId,
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
