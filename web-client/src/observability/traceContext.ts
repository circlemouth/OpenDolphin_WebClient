type TraceContextListener = (snapshot: TraceContextSnapshot) => void;

export interface TraceContextSnapshot {
  traceId?: string;
  spanId?: string;
  requestId?: string;
  source?: 'http-request' | 'ui';
  updatedAt: number;
}

const listeners = new Set<TraceContextListener>();

let latest: TraceContextSnapshot = {
  traceId: undefined,
  spanId: undefined,
  requestId: undefined,
  source: undefined,
  updatedAt: 0,
};

export const getLatestTraceContext = () => latest;

export const updateTraceContext = (partial: Partial<TraceContextSnapshot>) => {
  latest = {
    ...latest,
    ...partial,
    updatedAt: Date.now(),
  };
  listeners.forEach((listener) => listener(latest));
  return latest;
};

export const subscribeTraceContext = (listener: TraceContextListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
