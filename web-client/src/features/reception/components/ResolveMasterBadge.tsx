export type ResolveMasterSource = 'mock' | 'snapshot' | 'server' | 'fallback';

const toneMapping: Record<ResolveMasterSource, 'info' | 'warning' | 'error' | 'success'> = {
  mock: 'info',
  snapshot: 'info',
  server: 'warning',
  fallback: 'error',
};

export interface ResolveMasterBadgeProps {
  masterSource: ResolveMasterSource;
  transitionDescription?: string;
  runId?: string;
}

export function ResolveMasterBadge({ masterSource, transitionDescription, runId }: ResolveMasterBadgeProps) {
  return (
    <div
      className={`resolve-master resolve-master--${toneMapping[masterSource]}`}
      role="note"
      aria-live="polite"
      data-run-id={runId}
    >
      <span className="resolve-master__label">resolveMasterSource</span>
      <strong className="resolve-master__value">{masterSource}</strong>
      <span className="resolve-master__marker">tone=server</span>
      {transitionDescription && <small className="resolve-master__transition">{transitionDescription}</small>}
    </div>
  );
}
