import { useEffect, useMemo, useState } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { buildApiFailureBanner, type ApiErrorContext } from './apiError';
import { resolveRunId, resolveTraceId } from '../../libs/observability/observability';
import { copyTextToClipboard } from '../../libs/observability/runIdCopy';
import type { LiveRegionAria } from '../../libs/observability/types';
import { notifySessionExpired } from '../../libs/session/sessionExpiry';
import { useAppToast } from '../../libs/ui/appToast';

export type ApiFailureBannerProps = ApiErrorContext & {
  subject: string;
  operation?: string;
  destination?: string;
  runId?: string;
  traceId?: string;
  nextAction?: string;
  ariaLive?: LiveRegionAria;
  retryLabel?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryDisabled?: boolean;
  showLogShare?: boolean;
  logShareLabel?: string;
};

export function ApiFailureBanner({
  subject,
  operation,
  destination,
  runId,
  traceId,
  nextAction,
  ariaLive,
  retryLabel,
  onRetry,
  isRetrying,
  retryDisabled,
  showLogShare,
  logShareLabel,
  ...context
}: ApiFailureBannerProps) {
  const { enqueue } = useAppToast();
  if (!context.error && context.httpStatus === undefined && !context.apiResult && !context.apiResultMessage && !context.outcome) {
    return null;
  }
  const banner = buildApiFailureBanner(subject, context, operation);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownNow, setCooldownNow] = useState(() => Date.now());
  const cooldownActive = typeof cooldownUntil === 'number' && cooldownUntil > cooldownNow;
  const cooldownSeconds = cooldownActive ? Math.max(1, Math.ceil((cooldownUntil - cooldownNow) / 1000)) : 0;
  const resolvedNextAction = banner.forceNextAction ? banner.nextAction : nextAction ?? banner.nextAction;
  const resolvedRetryLabel = retryLabel ?? banner.retryLabel ?? resolvedNextAction;
  const showReloginAction = Boolean(banner.reloginReason);
  const actionLabel = showReloginAction ? '再ログイン' : resolvedRetryLabel;
  const resolvedRunId = resolveRunId(runId);
  const resolvedTraceId = resolveTraceId(traceId);
  const canShareLog = Boolean(resolvedRunId || resolvedTraceId);
  const shareEnabled = showLogShare ?? true;
  const shareLabel = logShareLabel ?? 'ログ共有';
  const logShareDetail = `runId=${resolvedRunId ?? 'unknown'} / traceId=${resolvedTraceId ?? 'unknown'}`;
  const logShareText = [
    `subject=${subject}`,
    operation ? `operation=${operation}` : undefined,
    destination ? `destination=${destination}` : undefined,
    `runId=${resolvedRunId ?? 'unknown'}`,
    `traceId=${resolvedTraceId ?? 'unknown'}`,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' / ');

  useEffect(() => {
    if (!cooldownActive) return;
    const id = window.setInterval(() => setCooldownNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [cooldownActive]);

  const handleRetry = () => {
    if (cooldownActive) return;
    onRetry?.();
    if (typeof banner.cooldownMs === 'number' && banner.cooldownMs > 0) {
      const now = Date.now();
      setCooldownNow(now);
      setCooldownUntil(now + banner.cooldownMs);
    }
  };

  const handleRelogin = () => {
    if (!banner.reloginReason) return;
    notifySessionExpired(banner.reloginReason, context.httpStatus);
  };

  const handleShareLog = async () => {
    if (!canShareLog) {
      enqueue({ tone: 'error', message: 'ログ共有用IDが未取得です', detail: '再試行後に再度お試しください。' });
      return;
    }
    try {
      await copyTextToClipboard(logShareText);
      enqueue({ tone: 'success', message: 'ログ共有用IDをコピーしました', detail: logShareDetail });
    } catch {
      enqueue({ tone: 'error', message: 'ログ共有用IDのコピーに失敗しました', detail: 'クリップボード権限を確認してください。' });
    }
  };
  const retryDisabledByCooldown = cooldownActive;
  const retryDisabledState = retryDisabled || isRetrying || retryDisabledByCooldown;
  const actionLabelWithCooldown =
    retryDisabledByCooldown && actionLabel ? `${actionLabel}（${cooldownSeconds}秒待機）` : actionLabel;
  const retryActionLabel = useMemo(
    () => actionLabelWithCooldown,
    [actionLabelWithCooldown],
  );
  return (
    <div className="api-failure">
      <ToneBanner
        tone={banner.tone}
        message={banner.message}
        destination={destination}
        nextAction={resolvedNextAction}
        runId={runId}
        traceId={traceId}
        showMeta
        ariaLive={ariaLive}
      />
      {(actionLabel && (onRetry || showReloginAction)) || shareEnabled ? (
        <div className="api-failure__actions" role="group" aria-label={`${subject}の操作`}>
          {showReloginAction && actionLabel ? (
            <button
              type="button"
              className="api-failure__button"
              onClick={handleRelogin}
              disabled={retryDisabled || isRetrying}
            >
              {isRetrying ? `${retryActionLabel}中…` : retryActionLabel}
            </button>
          ) : onRetry && actionLabel ? (
            <button
              type="button"
              className="api-failure__button"
              onClick={handleRetry}
              disabled={retryDisabledState}
            >
              {isRetrying ? `${retryActionLabel}中…` : retryActionLabel}
            </button>
          ) : null}
          {shareEnabled ? (
            <button
              type="button"
              className="api-failure__button"
              onClick={handleShareLog}
              disabled={!canShareLog}
              aria-label={`${subject}のログ共有用IDをコピー`}
            >
              {shareLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
