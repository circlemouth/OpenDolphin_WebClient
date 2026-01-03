import type { ClaimBundle, ClaimQueueEntry, ClaimQueuePhase } from '../outpatient/types';
import type { ReceptionEntry } from './api';

export type QueueDelayReasonKey =
  | 'no_queue'
  | 'phase_exempt'
  | 'phase_exempt_sent'
  | 'hold'
  | 'retry_overdue'
  | 'retry_missing_next_retry'
  | 'pending_overdue'
  | 'sent_overdue'
  | 'not_due';

export type QueueDelayDecision = {
  isDelayed: boolean;
  reason: QueueDelayReasonKey;
  phase?: ClaimQueuePhase;
  thresholdMs: number;
  elapsedMs?: number;
  nextRetryAt?: string;
  retryCount?: number;
};

export type SendErrorDecision = {
  isSendError: boolean;
  phase?: ClaimQueuePhase;
  errorMessage?: string;
};

export type UnapprovedDecision = {
  isUnapproved: boolean;
  claimStatusText?: string;
  claimStatus?: string;
  matchedPhrase?: string;
};

export type ExceptionDecision = {
  kind?: 'send_error' | 'delayed' | 'unapproved';
  detail: string;
  nextAction: string;
  reasons: {
    unapproved?: UnapprovedDecision;
    sendError?: SendErrorDecision;
    delayed?: QueueDelayDecision;
  };
};

const UNAPPROVED_PHRASES = ['会計待ち', '未承認', '未確定', '未送信', '承認待ち'];

const toTimeMs = (value?: string) => {
  if (!value) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
};

export const resolveUnapproved = (bundle?: ClaimBundle): UnapprovedDecision => {
  const claimStatusText = bundle?.claimStatusText ?? '';
  const claimStatus = bundle?.claimStatus ?? '';
  const matchedPhrase = UNAPPROVED_PHRASES.find((phrase) => claimStatusText.includes(phrase));
  const isUnapproved = Boolean(matchedPhrase || claimStatus === '会計待ち');
  return { isUnapproved, claimStatusText: claimStatusText || undefined, claimStatus: claimStatus || undefined, matchedPhrase };
};

export const resolveSendError = (queue?: ClaimQueueEntry): SendErrorDecision => {
  if (!queue) return { isSendError: false };
  const hasErrorMessage = typeof queue.errorMessage === 'string' && queue.errorMessage.trim().length > 0;
  const isFailedPhase = queue.phase === 'failed';
  const isSendError = isFailedPhase || (hasErrorMessage && queue.phase !== 'ack');
  return { isSendError, phase: queue.phase, errorMessage: queue.errorMessage };
};

export const resolveQueueDelay = (
  queue: ClaimQueueEntry | undefined,
  nowMs: number,
  thresholdMs: number,
): QueueDelayDecision => {
  if (!queue) return { isDelayed: false, reason: 'no_queue', thresholdMs };
  const phase = queue.phase;
  const retryCount = queue.retryCount ?? 0;

  if (phase === 'failed' || phase === 'ack') {
    return { isDelayed: false, reason: 'phase_exempt', phase, thresholdMs, retryCount };
  }

  if (phase === 'hold') {
    return { isDelayed: true, reason: 'hold', phase, thresholdMs, retryCount, nextRetryAt: queue.nextRetryAt };
  }

  const nextRetryAtMs = toTimeMs(queue.nextRetryAt);
  const elapsedMs = nextRetryAtMs !== undefined ? nowMs - nextRetryAtMs : undefined;

  if (phase === 'sent') {
    if (elapsedMs !== undefined && elapsedMs >= thresholdMs) {
      return { isDelayed: true, reason: 'sent_overdue', phase, thresholdMs, elapsedMs, nextRetryAt: queue.nextRetryAt, retryCount };
    }
    return { isDelayed: false, reason: 'phase_exempt_sent', phase, thresholdMs, elapsedMs, nextRetryAt: queue.nextRetryAt, retryCount };
  }

  if (elapsedMs !== undefined && elapsedMs >= thresholdMs) {
    return {
      isDelayed: true,
      reason: phase === 'retry' ? 'retry_overdue' : 'pending_overdue',
      phase,
      thresholdMs,
      elapsedMs,
      nextRetryAt: queue.nextRetryAt,
      retryCount,
    };
  }

  if (phase === 'retry' && retryCount > 0 && nextRetryAtMs === undefined) {
    return {
      isDelayed: true,
      reason: 'retry_missing_next_retry',
      phase,
      thresholdMs,
      retryCount,
    };
  }

  return { isDelayed: false, reason: 'not_due', phase, thresholdMs, elapsedMs, nextRetryAt: queue.nextRetryAt, retryCount };
};

export const resolveExceptionDecision = (options: {
  entry: ReceptionEntry;
  bundle?: ClaimBundle;
  queue?: ClaimQueueEntry;
  nowMs: number;
  thresholdMs: number;
}): ExceptionDecision => {
  const unapproved = resolveUnapproved(options.bundle);
  const sendError = resolveSendError(options.queue);
  const delayed = resolveQueueDelay(options.queue, options.nowMs, options.thresholdMs);

  const detailParts: string[] = [];
  if (sendError.isSendError) {
    detailParts.push(`送信エラー: ${sendError.errorMessage ?? '失敗状態'}`);
  }
  if (delayed.isDelayed) {
    const elapsedMinutes = delayed.elapsedMs !== undefined ? Math.floor(delayed.elapsedMs / 60000) : undefined;
    const elapsedText = elapsedMinutes !== undefined ? `経過${elapsedMinutes}分` : '経過未取得';
    detailParts.push(`遅延: ${delayed.reason} / 閾値${Math.floor(delayed.thresholdMs / 60000)}分 / ${elapsedText}`);
  }
  if (unapproved.isUnapproved) {
    detailParts.push(`未承認: ${unapproved.matchedPhrase ?? unapproved.claimStatusText ?? unapproved.claimStatus ?? '会計待ち'}`);
  }

  const kind = sendError.isSendError ? 'send_error' : delayed.isDelayed ? 'delayed' : unapproved.isUnapproved ? 'unapproved' : undefined;
  const nextAction = kind === 'send_error' ? '再送/原因確認' : kind === 'delayed' ? '遅延監視/キュー確認' : kind === 'unapproved' ? '承認/会計確認' : '—';

  return {
    kind,
    detail: detailParts.join(' / '),
    nextAction,
    reasons: { unapproved, sendError, delayed },
  };
};

export type QueuePhaseSummary = {
  total: number;
  pending: number;
  retry: number;
  hold: number;
  failed: number;
  sent: number;
  ack: number;
  delayed: number;
  delayedReasonCounts: Record<QueueDelayReasonKey, number>;
};

export const buildQueuePhaseSummary = (
  entries: ClaimQueueEntry[],
  nowMs: number,
  thresholdMs: number,
): QueuePhaseSummary => {
  const delayedReasonCounts: Record<QueueDelayReasonKey, number> = {
    no_queue: 0,
    phase_exempt: 0,
    phase_exempt_sent: 0,
    hold: 0,
    retry_overdue: 0,
    retry_missing_next_retry: 0,
    pending_overdue: 0,
    sent_overdue: 0,
    not_due: 0,
  };
  const summary: QueuePhaseSummary = {
    total: entries.length,
    pending: 0,
    retry: 0,
    hold: 0,
    failed: 0,
    sent: 0,
    ack: 0,
    delayed: 0,
    delayedReasonCounts,
  };

  entries.forEach((entry) => {
    summary[entry.phase] += 1;
    const decision = resolveQueueDelay(entry, nowMs, thresholdMs);
    delayedReasonCounts[decision.reason] += 1;
    if (decision.isDelayed) summary.delayed += 1;
  });

  return summary;
};

export const buildExceptionAuditDetails = (options: {
  runId?: string;
  items: Array<{
    kind: 'send_error' | 'delayed' | 'unapproved';
    entry: ReceptionEntry;
    reasons: ExceptionDecision['reasons'];
  }>;
  queueSummary: QueuePhaseSummary;
  thresholdMs: number;
}) => {
  const unapprovedByReason: Record<string, number> = {};
  const delayedReasonCounts: Record<string, number> = {};
  const sendErrorByPhase: Record<string, number> = {};

  options.items.forEach((item) => {
    if (item.reasons.unapproved?.isUnapproved) {
      const key = item.reasons.unapproved.matchedPhrase ?? item.reasons.unapproved.claimStatusText ?? item.reasons.unapproved.claimStatus ?? 'unknown';
      unapprovedByReason[key] = (unapprovedByReason[key] ?? 0) + 1;
    }
    if (item.reasons.delayed?.isDelayed) {
      const key = item.reasons.delayed.reason;
      delayedReasonCounts[key] = (delayedReasonCounts[key] ?? 0) + 1;
    }
    if (item.reasons.sendError?.isSendError) {
      const key = item.reasons.sendError.phase ?? 'unknown';
      sendErrorByPhase[key] = (sendErrorByPhase[key] ?? 0) + 1;
    }
  });

  return {
    runId: options.runId,
    exceptionCounts: {
      total: options.items.length,
      unapproved: options.items.filter((item) => item.kind === 'unapproved').length,
      sendError: options.items.filter((item) => item.kind === 'send_error').length,
      delayed: options.items.filter((item) => item.kind === 'delayed').length,
    },
    queuePhaseCounts: {
      pending: options.queueSummary.pending,
      retry: options.queueSummary.retry,
      hold: options.queueSummary.hold,
      failed: options.queueSummary.failed,
      sent: options.queueSummary.sent,
      ack: options.queueSummary.ack,
      delayed: options.queueSummary.delayed,
    },
    unapprovedBasis: {
      reasons: unapprovedByReason,
    },
    sendErrorBasis: {
      phases: sendErrorByPhase,
    },
    delayedBasis: {
      thresholdMs: options.thresholdMs,
      reasons: delayedReasonCounts,
      reasonCountsByQueue: options.queueSummary.delayedReasonCounts,
    },
    samples: options.items.slice(0, 12).map((item) => ({
      kind: item.kind,
      patientId: item.entry.patientId,
      appointmentId: item.entry.appointmentId,
      receptionId: item.entry.receptionId,
      queuePhase: item.reasons.delayed?.phase ?? item.reasons.sendError?.phase ?? undefined,
      unapprovedReason: item.reasons.unapproved?.matchedPhrase ?? item.reasons.unapproved?.claimStatusText,
      delayedReason: item.reasons.delayed?.reason,
      sendErrorMessage: item.reasons.sendError?.errorMessage,
    })),
  };
};
