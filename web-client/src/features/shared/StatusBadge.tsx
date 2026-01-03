import type { ReactNode } from 'react';
import { Global } from '@emotion/react';
import type { LiveRegionAria } from '../../libs/observability/types';
import { resolveAriaLive, resolveRunId } from '../../libs/observability/observability';
import { statusBadgeStyles } from '../reception/styles';

export type BadgeTone = 'info' | 'warning' | 'error' | 'success';

export interface StatusBadgeProps {
  label: string;
  value: string;
  tone?: BadgeTone;
  description?: ReactNode;
  ariaLive?: LiveRegionAria;
  runId?: string;
}

const toneLabel: Record<BadgeTone, string> = {
  info: 'Info',
  warning: 'Warning',
  error: 'Error',
  success: 'Success',
};

export function StatusBadge({
  label,
  value,
  tone = 'info',
  description,
  ariaLive,
  runId,
}: StatusBadgeProps) {
  const descriptionText = typeof description === 'string' ? description : undefined;
  const ariaText = [label, value, descriptionText].filter(Boolean).join('、');
  const live = resolveAriaLive(tone, ariaLive);
  const resolvedRunId = resolveRunId(runId);
  return (
    <>
      <Global styles={statusBadgeStyles} />
      <div
        className={`status-badge status-badge--${tone}`}
        role="status"
        aria-live={live}
        aria-atomic="true"
        aria-label={ariaText}
        data-run-id={resolvedRunId}
      >
        <div className="status-badge__row">
          <span className="status-badge__label">{label}</span>
          <strong className="status-badge__value">{value}</strong>
        </div>
        {description && (
          <p className="status-badge__description">
            <span className="status-badge__tone">{toneLabel[tone]}: </span>
            {description}
          </p>
        )}
      </div>
    </>
  );
}

interface MissingMasterBadgeProps {
  missingMaster: boolean;
  runId?: string;
}

export function MissingMasterBadge({ missingMaster, runId }: MissingMasterBadgeProps) {
  return (
    <StatusBadge
      label="missingMaster"
      value={missingMaster ? 'true' : 'false'}
      tone={missingMaster ? 'warning' : 'success'}
      description={
        missingMaster
          ? 'tone=server ｜ マスタ未取得のため ORCA 再送を停止'
          : 'tone=info ｜ マスタ取得済み、再送を継続'
      }
      ariaLive="polite"
      runId={runId}
    />
  );
}

interface CacheHitBadgeProps {
  cacheHit: boolean;
  runId?: string;
}

export function CacheHitBadge({ cacheHit, runId }: CacheHitBadgeProps) {
  return (
    <StatusBadge
      label="cacheHit"
      value={cacheHit ? 'true' : 'false'}
      tone={cacheHit ? 'success' : 'warning'}
      description={cacheHit ? 'cacheHit=true ｜ 再取得不要で ORCA 送信準備完了' : 'cacheHit=false ｜ サーバー再取得または fallback が必要'}
      ariaLive="polite"
      runId={runId}
    />
  );
}
