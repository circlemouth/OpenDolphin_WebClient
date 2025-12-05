import {
  recordOutpatientFunnel,
  type DataSourceTransition,
  type OutpatientFlagAttributes,
} from '../../libs/telemetry/telemetryClient';

export type ResolveMasterSource = 'mock' | 'snapshot' | 'server' | 'fallback';

let currentResolveMasterSource: ResolveMasterSource = 'mock';

export function getResolveMasterSource() {
  return currentResolveMasterSource;
}

export function setResolveMasterSource(source: ResolveMasterSource) {
  currentResolveMasterSource = source;
}

export type OrchestrationFlagAttributes = OutpatientFlagAttributes & {
  dataSourceTransition?: DataSourceTransition;
};

export function handleOutpatientFlags(flags: OrchestrationFlagAttributes) {
  if (flags.cacheHit) {
    setResolveMasterSource('server');
  }
  return recordOutpatientFunnel('charts_orchestration', {
    ...flags,
    dataSourceTransition: flags.dataSourceTransition ?? 'server',
  });
}
