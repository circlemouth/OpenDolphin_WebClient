import type { ExceptionDecision, QueueDelayReasonKey } from './exceptionLogic';

export const priorityLabel: Record<'send_error' | 'delayed' | 'unapproved', string> = {
  send_error: '最優先',
  delayed: '優先',
  unapproved: '確認',
};

export const delayReasonLabel: Record<QueueDelayReasonKey, string> = {
  no_queue: 'キューなし',
  phase_exempt: '遅延対象外',
  phase_exempt_sent: '送信済み',
  hold: '保留',
  retry_overdue: '再送期限超過',
  retry_missing_next_retry: '再送時刻未取得',
  pending_overdue: '待機超過',
  sent_overdue: '送信後停滞',
  not_due: '期限内',
};

export const formatUnapprovedDetail = (decision?: ExceptionDecision['reasons']['unapproved']) => {
  if (!decision?.isUnapproved) return '対象外';
  return decision.matchedPhrase ?? decision.claimStatusText ?? decision.claimStatus ?? '会計待ち';
};

export const formatSendErrorDetail = (decision?: ExceptionDecision['reasons']['sendError']) => {
  if (!decision?.isSendError) return '対象外';
  if (decision.errorMessage) return decision.errorMessage;
  if (decision.phase) return `phase:${decision.phase}`;
  return '失敗状態';
};

export const formatDelayedDetail = (decision?: ExceptionDecision['reasons']['delayed']) => {
  if (!decision?.isDelayed) return '対象外';
  const parts = [];
  if (decision.reason) parts.push(delayReasonLabel[decision.reason]);
  if (decision.elapsedMs !== undefined) parts.push(`経過${Math.floor(decision.elapsedMs / 60000)}分`);
  if (decision.retryCount !== undefined && decision.retryCount > 0) parts.push(`再送${decision.retryCount}回`);
  if (decision.nextRetryAt) parts.push(`次回${decision.nextRetryAt}`);
  return parts.join(' / ') || '遅延判定';
};
