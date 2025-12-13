export type DataSourceTransition = 'mock' | 'snapshot' | 'server' | 'fallback';

// dataSourceTransition と同じ語彙で master ソースの決定を表現する。
export type ResolveMasterSource = DataSourceTransition;

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
