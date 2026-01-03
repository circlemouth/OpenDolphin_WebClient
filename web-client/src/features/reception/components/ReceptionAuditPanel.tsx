import { useMemo, useState } from 'react';

import type { ReceptionEntry } from '../api';
import { getAuditEventLog, logUiState, type AuditEventRecord } from '../../../libs/audit/auditLogger';

const resolveAuditAction = (record: AuditEventRecord) => {
  const payload = record.payload ?? {};
  const action =
    (payload.action as string | undefined) ??
    ((payload.auditEvent as { action?: string } | undefined)?.action ?? undefined) ??
    'AUDIT_EVENT';
  const outcome =
    (payload.outcome as string | undefined) ??
    ((payload.auditEvent as { outcome?: string } | undefined)?.outcome ?? undefined) ??
    '—';
  return { action, outcome };
};

const resolveAuditDetails = (record: AuditEventRecord) => {
  const payload = record.payload ?? {};
  const details = (payload.details as Record<string, unknown> | undefined) ?? {};
  return {
    runId: record.runId ?? (details.runId as string | undefined),
    traceId: record.traceId ?? (details.traceId as string | undefined),
    patientId: record.patientId ?? (details.patientId as string | undefined),
    appointmentId: record.appointmentId ?? (details.appointmentId as string | undefined),
    sourcePath: details.sourcePath as string | undefined,
    queueSnapshot: details.queueSnapshot as Record<string, unknown> | undefined,
  };
};

const toHaystack = (record: AuditEventRecord) => {
  const payload = record.payload ?? {};
  const details = (payload.details as Record<string, unknown> | undefined) ?? {};
  const parts = [
    record.runId,
    record.traceId,
    record.source,
    record.note,
    record.patientId,
    record.appointmentId,
    record.claimId,
    payload.action as string | undefined,
    payload.outcome as string | undefined,
    payload.subject as string | undefined,
    (payload.auditEvent as { action?: string } | undefined)?.action,
    (payload.auditEvent as { outcome?: string } | undefined)?.outcome,
    details.sourcePath as string | undefined,
    details.queuePhase as string | undefined,
  ].filter(Boolean);
  try {
    return `${parts.join(' ')} ${JSON.stringify(details)}`.toLowerCase();
  } catch {
    return parts.join(' ').toLowerCase();
  }
};

export type ReceptionAuditPanelProps = {
  runId?: string;
  selectedEntry?: ReceptionEntry;
};

export function ReceptionAuditPanel({ runId, selectedEntry }: ReceptionAuditPanelProps) {
  const [query, setQuery] = useState('');
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [auditSnapshot, setAuditSnapshot] = useState<AuditEventRecord[]>(() => getAuditEventLog());

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return auditSnapshot.filter((record) => {
      if (selectedOnly && selectedEntry) {
        const pid = selectedEntry.patientId;
        const aid = selectedEntry.appointmentId;
        const rid = selectedEntry.receptionId;
        if (pid && record.patientId !== pid) {
          const details = resolveAuditDetails(record);
          if (details.patientId !== pid) return false;
        }
        if (aid && record.appointmentId !== aid) {
          const details = resolveAuditDetails(record);
          if (details.appointmentId !== aid) return false;
        }
        if (rid && record.payload && (record.payload.receptionId as string | undefined) !== rid) {
          return false;
        }
      }
      if (!trimmed) return true;
      return toHaystack(record).includes(trimmed);
    });
  }, [auditSnapshot, query, selectedEntry, selectedOnly]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [filtered],
  );

  const summary = useMemo(() => {
    const total = filtered.length;
    const success = filtered.filter((record) => resolveAuditAction(record).outcome === 'success').length;
    const error = filtered.filter((record) => resolveAuditAction(record).outcome === 'error').length;
    return { total, success, error };
  }, [filtered]);

  return (
    <section className="reception-audit" aria-label="監査履歴検索" data-run-id={runId}>
      <header className="reception-audit__header">
        <div>
          <h2>監査履歴検索</h2>
          <p>auditEvent と UI 操作ログの履歴を runId / patientId / action で検索できます。</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAuditSnapshot(getAuditEventLog());
            logUiState({
              action: 'audit_open',
              screen: 'reception/audit',
              controlId: 'audit-refresh',
              runId,
            });
          }}
        >
          履歴を更新
        </button>
      </header>

      <form
        className="reception-audit__controls"
        onSubmit={(event) => {
          event.preventDefault();
          logUiState({
            action: 'search',
            screen: 'reception/audit',
            controlId: 'audit-search',
            runId,
            details: { query, selectedOnly },
          });
        }}
      >
        <label className="reception-audit__field">
          <span>検索</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="runId / patientId / action / queue"
          />
        </label>
        <label className="reception-audit__toggle">
          <input
            type="checkbox"
            checked={selectedOnly}
            onChange={(event) => setSelectedOnly(event.target.checked)}
          />
          選択中の患者のみ
        </label>
        <button type="submit">検索</button>
      </form>

      <div className="reception-audit__summary" role="status" aria-live="polite">
        <span>該当 {summary.total} 件</span>
        <span>success {summary.success}</span>
        <span>error {summary.error}</span>
        {selectedEntry?.patientId ? <span>patientId {selectedEntry.patientId}</span> : null}
      </div>

      <div className="reception-audit__list" role="list">
        {sorted.length === 0 ? (
          <p className="reception-audit__empty" role="status" aria-live="polite">
            監査履歴が見つかりませんでした。
          </p>
        ) : (
          sorted.map((record, index) => {
            const { action, outcome } = resolveAuditAction(record);
            const details = resolveAuditDetails(record);
            const queueSnapshot = details.queueSnapshot;
            return (
              <div key={`${record.timestamp}-${index}`} className="reception-audit__row" role="listitem">
                <div className="reception-audit__row-main">
                  <strong>{action}</strong>
                  <span className={`reception-audit__pill reception-audit__pill--${outcome === 'error' ? 'error' : 'info'}`}>
                    outcome: {outcome}
                  </span>
                  {record.source && <span className="reception-audit__pill">source: {record.source}</span>}
                </div>
                <div className="reception-audit__row-sub">
                  <span>{record.timestamp}</span>
                  <span>runId: {details.runId ?? '—'}</span>
                  <span>traceId: {details.traceId ?? '—'}</span>
                  {details.patientId ? <span>patientId: {details.patientId}</span> : null}
                  {details.appointmentId ? <span>appointmentId: {details.appointmentId}</span> : null}
                  {details.sourcePath ? <span>endpoint: {details.sourcePath}</span> : null}
                </div>
                {queueSnapshot ? (
                  <div className="reception-audit__row-queue">
                    <span>queueSnapshot:</span>
                    <code>
                      pending {String(queueSnapshot.pending)} / retry {String(queueSnapshot.retry)} / hold{' '}
                      {String(queueSnapshot.hold)} / failed {String(queueSnapshot.failed)} / delayed{' '}
                      {String(queueSnapshot.delayed)}
                    </code>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
