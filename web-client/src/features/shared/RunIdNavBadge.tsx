import { resolveAriaLive, resolveRunId } from '../../libs/observability/observability';

type RunIdNavBadgeProps = {
  runId?: string;
  onCopy?: () => void;
};

export function RunIdNavBadge({ runId, onCopy }: RunIdNavBadgeProps) {
  const resolvedRunId = resolveRunId(runId);
  return (
    <div
      className="app-shell__nav-runid"
      role="status"
      aria-live={resolveAriaLive('info')}
      aria-atomic="true"
      data-run-id={resolvedRunId}
    >
      <span className="app-shell__nav-label">RUN_ID</span>
      <span className="app-shell__nav-badge app-shell__nav-badge--info">{resolvedRunId ?? '未取得'}</span>
      {onCopy && resolvedRunId ? (
        <button type="button" className="app-shell__nav-copy" onClick={onCopy} aria-label="RUN_ID をコピー">
          コピー
        </button>
      ) : null}
    </div>
  );
}
