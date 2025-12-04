import { recordOutpatientFunnel, type OutpatientFlagAttributes } from '../../libs/telemetry/telemetryClient';

export type ResolveMasterSource = 'mock' | 'snapshot' | 'server' | 'fallback';

let currentResolveMasterSource: ResolveMasterSource = 'mock';

export function getResolveMasterSource() {
  return currentResolveMasterSource;
}

export function setResolveMasterSource(source: ResolveMasterSource) {
  currentResolveMasterSource = source;
}

export function handleOutpatientFlags(flags: OutpatientFlagAttributes) {
  if (flags.cacheHit) {
    setResolveMasterSource('server');
  }
  return recordOutpatientFunnel('charts_orchestration', {
    ...flags,
    dataSourceTransition: 'server',
  });
}
