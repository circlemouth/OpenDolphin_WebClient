import type { LiveRegionAria } from '../../libs/observability/types';
import { resolveAriaLive, resolveRunId } from '../../libs/observability/observability';

export type AuditSummaryTone = 'info' | 'warning' | 'error';
export type AuditSummaryVariant = 'inline' | 'pill' | 'banner';

export type AuditSummary = {
  action?: string;
  outcome?: string;
  actor?: string;
  note?: string;
  lockExpiresAt?: string;
  traceId?: string;
  timestamp?: string;
  message?: string;
};

export interface AuditSummaryInlineProps {
  auditEvent?: Record<string, unknown>;
  summary?: AuditSummary;
  tone?: AuditSummaryTone;
  variant?: AuditSummaryVariant;
  showActor?: boolean;
  showTrace?: boolean;
  showNote?: boolean;
  showLock?: boolean;
  maxFragments?: number;
  ariaLive?: LiveRegionAria;
  runId?: string;
  className?: string;
  as?: 'div' | 'span';
}

const normalizeText = (value?: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '—') return undefined;
  return trimmed;
};

const buildSummaryFromAudit = (auditEvent?: Record<string, unknown>): AuditSummary | undefined => {
  if (!auditEvent) return undefined;
  const action = normalizeText(auditEvent.action);
  const outcome = normalizeText(auditEvent.outcome);
  const details = typeof auditEvent.details === 'object' && auditEvent.details !== null
    ? (auditEvent.details as Record<string, unknown>)
    : {};
  const actor = normalizeText(details.actor);
  const note = normalizeText(details.note);
  const lockExpiresAt = normalizeText(details.lockExpiresAt);
  const traceId = normalizeText(details.traceId);
  const timestamp = normalizeText(auditEvent.timestamp ?? details.timestamp);

  return {
    action: action ?? 'AUDIT_EVENT',
    outcome,
    actor,
    note,
    lockExpiresAt,
    traceId,
    timestamp,
  };
};

const resolveTone = (summary?: AuditSummary, fallback?: AuditSummaryTone): AuditSummaryTone => {
  if (fallback) return fallback;
  const action = summary?.action ?? '';
  const outcome = summary?.outcome ?? '';
  const isWarningAction = /LOCK|CONFLICT|FAIL/i.test(action);
  const isWarningOutcome = /error|failed|conflict/i.test(outcome);
  if (isWarningOutcome) return 'error';
  if (isWarningAction) return 'warning';
  return 'info';
};

const buildFragments = (summary?: AuditSummary, options?: {
  showActor?: boolean;
  showTrace?: boolean;
  showNote?: boolean;
  showLock?: boolean;
  maxFragments?: number;
}): string[] => {
  if (!summary) return [];
  if (summary.message) return [summary.message];

  const fragments: string[] = [];
  const actionLabel = summary.outcome ? `${summary.action ?? 'AUDIT_EVENT'}(${summary.outcome})` : summary.action;
  if (actionLabel) fragments.push(actionLabel);
  if (options?.showActor && summary.actor) fragments.push(`actor=${summary.actor}`);
  if (options?.showNote && summary.note) fragments.push(`note=${summary.note}`);
  if (options?.showLock && summary.lockExpiresAt) fragments.push(`lockExpiresAt=${summary.lockExpiresAt}`);
  if (options?.showTrace && summary.traceId) fragments.push(`traceId=${summary.traceId}`);
  if (summary.timestamp) fragments.push(`timestamp=${summary.timestamp}`);

  const limit = options?.maxFragments ?? 4;
  return fragments.slice(0, Math.max(1, limit));
};

export function AuditSummaryInline({
  auditEvent,
  summary,
  tone,
  variant = 'inline',
  showActor = true,
  showTrace = false,
  showNote = false,
  showLock = true,
  maxFragments = 4,
  ariaLive,
  runId,
  className,
  as = 'div',
}: AuditSummaryInlineProps) {
  const resolvedSummary = summary ?? buildSummaryFromAudit(auditEvent);
  const resolvedTone = resolveTone(resolvedSummary, tone);
  const fragments = buildFragments(resolvedSummary, { showActor, showTrace, showNote, showLock, maxFragments });
  const resolvedRunId = resolveRunId(runId);
  const live = resolveAriaLive(resolvedTone === 'error' ? 'error' : resolvedTone, ariaLive);
  const Container = as;

  return (
    <Container
      className={`audit-summary-inline audit-summary-inline--${variant} audit-summary-inline--${resolvedTone}${className ? ` ${className}` : ''}`}
      role="status"
      aria-live={live}
      aria-atomic="true"
      data-run-id={resolvedRunId}
    >
      {fragments.length > 0 ? (
        fragments.map((fragment, index) => (
          <span key={`${fragment}-${index}`} className="audit-summary-inline__fragment">
            {fragment}
          </span>
        ))
      ) : (
        <span className="audit-summary-inline__fragment">—</span>
      )}
    </Container>
  );
}
