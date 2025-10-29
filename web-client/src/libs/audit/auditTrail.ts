import { setHttpAuditLogger } from '@/libs/http';
import { getCsrfToken } from '@/libs/security';

export type AuditCategory = 'http' | 'auth' | 'patient' | 'chart' | 'orca' | 'system';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface ClientAuditEvent {
  id: string;
  timestamp: string;
  category: AuditCategory;
  severity: AuditSeverity;
  action: string;
  description?: string;
  durationMs?: number;
  statusCode?: number;
  metadata?: Record<string, unknown>;
}

const AUDIT_ENDPOINT = import.meta.env.VITE_AUDIT_ENDPOINT ?? '/audit/logs';
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BUFFER_SIZE = 25;

const eventBuffer: ClientAuditEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const ensureTimer = () => {
  if (flushTimer) {
    return;
  }
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushBuffer('interval');
  }, FLUSH_INTERVAL_MS);
};

const generateEventId = () => crypto.randomUUID();

const drainEvents = () => ({
  events: eventBuffer.splice(0, eventBuffer.length),
  generatedAt: new Date().toISOString(),
});

const postWithFetch = async (body: string) => {
  const token = getCsrfToken();
  await fetch(AUDIT_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-CSRF-Token': token } : {}),
      'Cache-Control': 'no-store',
    },
    body,
    keepalive: true,
  });
};

export const flushBuffer = async (reason: 'interval' | 'manual' | 'visibilitychange' | 'beforeunload') => {
  if (eventBuffer.length === 0) {
    return;
  }

  const snapshot = drainEvents();
  const payload = JSON.stringify({ reason, ...snapshot });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    const sent = navigator.sendBeacon(AUDIT_ENDPOINT, blob);
    if (sent) {
      return;
    }
  }

  try {
    await postWithFetch(payload);
  } catch (error) {
    console.warn('監査ログの送信に失敗しました。再送キューに積み直します。', error);
    eventBuffer.unshift(...snapshot.events);
  }
};

export const recordAuditEvent = (event: Omit<ClientAuditEvent, 'id' | 'timestamp'>) => {
  const enriched: ClientAuditEvent = {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    ...event,
  };
  eventBuffer.push(enriched);
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    void flushBuffer('manual');
    return;
  }
  ensureTimer();
};

export const recordOperationEvent = (
  category: Exclude<AuditCategory, 'http'>,
  severity: AuditSeverity,
  action: string,
  description?: string,
  metadata?: Record<string, unknown>,
) => {
  recordAuditEvent({ category, severity, action, description, metadata });
};

export const initializeAuditTrail = () => {
  setHttpAuditLogger((event) => {
    const severity: AuditSeverity = event.phase === 'error' ? 'warning' : 'info';
    recordAuditEvent({
      category: 'http',
      severity,
      action: `${event.method} ${event.url ?? ''}`.trim(),
      durationMs: event.durationMs,
      statusCode: event.status,
      metadata: { retryCount: event.retryCount },
    });
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void flushBuffer('visibilitychange');
      }
    });
    window.addEventListener('beforeunload', () => {
      void flushBuffer('beforeunload');
    });
  }
};
