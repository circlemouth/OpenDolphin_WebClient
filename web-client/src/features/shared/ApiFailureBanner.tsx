import { ToneBanner } from '../reception/components/ToneBanner';
import { buildApiFailureBanner, type ApiErrorContext } from './apiError';
import { resolveRunId, resolveTraceId } from '../../libs/observability/observability';
import { copyTextToClipboard } from '../../libs/observability/runIdCopy';
import type { LiveRegionAria } from '../../libs/observability/types';
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
  const actionLabel = retryLabel ?? nextAction;
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
  return (
    <div className="api-failure">
      <ToneBanner
        tone={banner.tone}
        message={banner.message}
        destination={destination}
        nextAction={nextAction}
        runId={runId}
        traceId={traceId}
        showMeta
        ariaLive={ariaLive}
      />
      {(onRetry && actionLabel) || shareEnabled ? (
        <div className="api-failure__actions" role="group" aria-label={`${subject}の操作`}>
          {onRetry && actionLabel ? (
            <button
              type="button"
              className="api-failure__button"
              onClick={onRetry}
              disabled={retryDisabled || isRetrying}
            >
              {isRetrying ? `${actionLabel}中…` : actionLabel}
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
