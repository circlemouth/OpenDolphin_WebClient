export type TraceNoticeSeverity = 'info' | 'warning' | 'error';

export interface TraceNotice {
  id: string;
  message: string;
  statusCode?: number;
  url?: string;
  traceId?: string;
  requestId?: string;
  severity: TraceNoticeSeverity;
  createdAt: number;
}

type NoticeListener = (notices: TraceNotice[]) => void;

const listeners = new Set<NoticeListener>();
let queue: TraceNotice[] = [];
const MAX_NOTICES = 3;

export const pushTraceNotice = (notice: Omit<TraceNotice, 'id' | 'createdAt'>) => {
  const enriched: TraceNotice = {
    ...notice,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  queue = [enriched, ...queue].slice(0, MAX_NOTICES);
  listeners.forEach((listener) => listener(queue));
};

export const dismissTraceNotice = (id: string) => {
  queue = queue.filter((entry) => entry.id !== id);
  listeners.forEach((listener) => listener(queue));
};

export const subscribeTraceNotices = (listener: NoticeListener) => {
  listeners.add(listener);
  listener(queue);
  return () => {
    listeners.delete(listener);
  };
};
