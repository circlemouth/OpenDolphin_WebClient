import { Global } from '@emotion/react';

import type { LiveRegionAria } from '../../../libs/observability/types';
import { resolveAriaLive, resolveRunId } from '../../../libs/observability/observability';
import { toneBannerStyles } from '../styles';

export type BannerTone = 'error' | 'warning' | 'info';

const tonePrefix: Record<BannerTone, string> = {
  error: 'エラー',
  warning: '注意',
  info: '情報',
};

export interface ToneBannerProps {
  tone: BannerTone;
  message: string;
  patientId?: string;
  receptionId?: string;
  destination?: string;
  nextAction?: string;
  runId?: string;
  ariaLive?: LiveRegionAria;
}

export function ToneBanner({
  tone,
  message,
  patientId,
  receptionId,
  destination,
  nextAction,
  runId,
  ariaLive,
}: ToneBannerProps) {
  const live = resolveAriaLive(tone, ariaLive);
  const role = tone === 'info' ? 'status' : 'alert';
  const resolvedRunId = resolveRunId(runId);
  const fragments = [
    message,
    patientId ? `患者ID: ${patientId}` : undefined,
    receptionId ? `受付ID: ${receptionId}` : undefined,
    destination ? `送信先: ${destination}` : undefined,
    nextAction ? `次アクション: ${nextAction}` : undefined,
  ].filter((fragment): fragment is string => typeof fragment === 'string');
  const ariaText = [tonePrefix[tone], ...fragments].join('、');
  return (
    <>
      <Global styles={toneBannerStyles} />
      <div
        className={`tone-banner tone-banner--${tone}`}
        role={role}
        aria-live={live}
        aria-atomic="true"
        aria-label={ariaText}
        tabIndex={0}
        data-run-id={resolvedRunId}
      >
        <div className="tone-banner__tag">{tonePrefix[tone]}</div>
        <p className="tone-banner__message">{fragments.join(' ｜ ')}</p>
      </div>
    </>
  );
}
