export type DataSourceTransition = 'mock' | 'snapshot' | 'server' | 'fallback';

export type ObservabilityMeta = {
  runId?: string;
  traceId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  dataSourceTransition?: DataSourceTransition;
  fallbackUsed?: boolean;
  fetchedAt?: string;
  recordsReturned?: number;
};
