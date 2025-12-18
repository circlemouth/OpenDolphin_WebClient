import type { OrcaQueueEntry } from './orcaQueueApi';
import type { ClaimQueueEntry, ClaimQueuePhase } from './types';

export type OrcaSendStatusKey = 'waiting' | 'processing' | 'success' | 'failure' | 'unknown';

export type OrcaSendStatus = {
  key: OrcaSendStatusKey;
  label: '待ち' | '処理中' | '成功' | '失敗' | '不明';
  tone: 'info' | 'warning' | 'success' | 'error';
  isStalled: boolean;
  lastDispatchAt?: string;
  error?: string;
};

const STALL_THRESHOLD_MS = 5 * 60 * 1000;
const PROCESSING_WINDOW_MS = 90 * 1000;

const normalizeClaimQueuePhaseFromStatus = (status: string): ClaimQueuePhase => {
  const normalized = status.toLowerCase();
  if (normalized === 'delivered' || normalized === 'ack') return 'ack';
  if (normalized === 'failed' || normalized === 'error') return 'failed';
  if (normalized === 'pending' || normalized === 'queued' || normalized === 'waiting') return 'pending';
  if (normalized.includes('retry')) return 'retry';
  if (normalized.includes('hold')) return 'hold';
  if (normalized.includes('sent')) return 'sent';
  return 'pending';
};

const toTimeMs = (iso?: string): number | undefined => {
  if (!iso) return undefined;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? undefined : t;
};

export const resolveOrcaSendStatus = (entry: OrcaQueueEntry | undefined, nowMs = Date.now()): OrcaSendStatus | undefined => {
  if (!entry) return undefined;

  const phase = normalizeClaimQueuePhaseFromStatus(entry.status);
  const lastDispatchAt = entry.lastDispatchAt;
  const lastMs = toTimeMs(lastDispatchAt);
  const elapsedMs = lastMs === undefined ? undefined : Math.max(0, nowMs - lastMs);

  if (phase === 'ack') {
    return { key: 'success', label: '成功', tone: 'success', isStalled: false, lastDispatchAt, error: entry.error };
  }
  if (phase === 'failed') {
    return { key: 'failure', label: '失敗', tone: 'error', isStalled: false, lastDispatchAt, error: entry.error };
  }

  const isProcessing =
    phase === 'retry' ||
    phase === 'sent' ||
    (phase === 'pending' && elapsedMs !== undefined && elapsedMs <= PROCESSING_WINDOW_MS) ||
    /processing|dispatch|sending|in[_-]?flight/.test(entry.status.toLowerCase());

  const key: OrcaSendStatusKey = isProcessing ? 'processing' : 'waiting';
  const label: OrcaSendStatus['label'] = isProcessing ? '処理中' : '待ち';
  const tone: OrcaSendStatus['tone'] = isProcessing ? 'info' : 'warning';
  const isStalled =
    (key === 'waiting' || key === 'processing') && elapsedMs !== undefined ? elapsedMs >= STALL_THRESHOLD_MS : false;

  return { key, label, tone, isStalled, lastDispatchAt, error: entry.error };
};

export const toClaimQueueEntryFromOrcaQueueEntry = (entry: OrcaQueueEntry): ClaimQueueEntry => {
  const phase = normalizeClaimQueuePhaseFromStatus(entry.status);
  return {
    id: `orca-queue-${entry.patientId}`,
    patientId: entry.patientId,
    phase,
    errorMessage: entry.error,
  };
};

