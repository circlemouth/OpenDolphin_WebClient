import { Global } from '@emotion/react';

import { toneBannerStyles } from '../styles';

export type BannerTone = 'error' | 'warning' | 'info';

const tonePrefix: Record<BannerTone, string> = {
  error: 'エラー',
  warning: '注意',
  info: '情報',
};

const toneLive: Record<BannerTone, 'polite' | 'assertive'> = {
  error: 'assertive',
  warning: 'assertive',
  info: 'polite',
};

export interface ToneBannerProps {
  tone: BannerTone;
  message: string;
  patientId?: string;
  receptionId?: string;
  destination?: string;
  nextAction?: string;
  runId?: string;
  ariaLive?: 'polite' | 'assertive';
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
  const live = ariaLive ?? toneLive[tone];
  const role = tone === 'info' ? 'status' : 'alert';
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
        data-run-id={runId}
      >
        <div className="tone-banner__tag">{tonePrefix[tone]}</div>
        <p className="tone-banner__message">{fragments.join(' ｜ ')}</p>
      </div>
    </>
  );
}
