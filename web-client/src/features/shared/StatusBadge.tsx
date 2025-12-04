import type { ReactNode } from 'react';

export type BadgeTone = 'info' | 'warning' | 'error' | 'success';

export interface StatusBadgeProps {
  label: string;
  value: string;
  tone?: BadgeTone;
  description?: ReactNode;
  ariaLive?: 'off' | 'polite' | 'assertive';
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
  ariaLive = 'polite',
  runId,
}: StatusBadgeProps) {
  return (
    <div
      className={`status-badge status-badge--${tone}`}
      role="status"
      aria-live={ariaLive}
      data-run-id={runId}
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
          ? 'マスターデータ欠損の警告。解消するまで再送を繰り返します。'
          : 'マスタ取得済み。ORCA 送信結果と tone=server を保持。'
      }
      ariaLive={missingMaster ? 'assertive' : 'polite'}
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
      description={cacheHit ? 'キャッシュ命中: 再取得なし' : '再フェッチが必要です。'}
      ariaLive="polite"
      runId={runId}
    />
  );
}
