import { ToneBanner } from '../reception/components/ToneBanner';
import { buildApiFailureBanner, type ApiErrorContext } from './apiError';
import type { LiveRegionAria } from '../../libs/observability/types';

export type ApiFailureBannerProps = ApiErrorContext & {
  subject: string;
  operation?: string;
  destination?: string;
  runId?: string;
  nextAction?: string;
  ariaLive?: LiveRegionAria;
  retryLabel?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryDisabled?: boolean;
};

export function ApiFailureBanner({
  subject,
  operation,
  destination,
  runId,
  nextAction,
  ariaLive,
  retryLabel,
  onRetry,
  isRetrying,
  retryDisabled,
  ...context
}: ApiFailureBannerProps) {
  if (!context.error && context.httpStatus === undefined && !context.apiResult && !context.apiResultMessage && !context.outcome) {
    return null;
  }
  const banner = buildApiFailureBanner(subject, context, operation);
  const actionLabel = retryLabel ?? nextAction;
  return (
    <div className="api-failure">
      <ToneBanner
        tone={banner.tone}
        message={banner.message}
        destination={destination}
        nextAction={nextAction}
        runId={runId}
        ariaLive={ariaLive}
      />
      {onRetry && actionLabel && (
        <div className="api-failure__actions" role="group" aria-label={`${subject}の再試行`}>
          <button
            type="button"
            className="api-failure__button"
            onClick={onRetry}
            disabled={retryDisabled || isRetrying}
          >
            {isRetrying ? `${actionLabel}中…` : actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
