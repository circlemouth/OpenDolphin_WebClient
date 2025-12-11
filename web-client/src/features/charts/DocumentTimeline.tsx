import { useMemo } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { OutpatientFlagResponse, ReceptionEntry, ReceptionStatus } from '../reception/api';

export interface DocumentTimelineProps {
  entries?: ReceptionEntry[];
  auditEvent?: Record<string, unknown>;
  selectedPatientId?: string;
  selectedAppointmentId?: string;
  claimFlags?: OutpatientFlagResponse;
}

const STATUS_ORDER: ReceptionStatus[] = ['受付中', '診療中', '会計待ち', '会計済み', '予約'];

export function DocumentTimeline({
  entries = [],
  auditEvent,
  selectedPatientId,
  selectedAppointmentId,
  claimFlags,
}: DocumentTimelineProps) {
  const { flags } = useAuthService();
  const resolvedRunId = claimFlags?.runId ?? flags.runId;
  const resolvedMissingMaster = claimFlags?.missingMaster ?? flags.missingMaster;
  const resolvedCacheHit = claimFlags?.cacheHit ?? flags.cacheHit;
  const resolvedTransition = claimFlags?.dataSourceTransition ?? flags.dataSourceTransition;
  const resolvedFallbackUsed = claimFlags?.fallbackUsed ?? false;
  const tonePayload: ChartTonePayload = {
    missingMaster: resolvedMissingMaster ?? false,
    cacheHit: resolvedCacheHit ?? false,
    dataSourceTransition: resolvedTransition ?? 'snapshot',
  };

  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const groupedEntries = useMemo(() => {
    if (entries.length === 0) return [];
    const rank: Record<ReceptionStatus, number> = Object.fromEntries(STATUS_ORDER.map((s, idx) => [s, idx]));
    const sorted = [...entries].sort((a, b) => {
      const left = rank[a.status] ?? 99;
      const right = rank[b.status] ?? 99;
      if (left !== right) return left - right;
      return (a.appointmentTime ?? '').localeCompare(b.appointmentTime ?? '');
    });
    return STATUS_ORDER.map((status) => ({
      status,
      items: sorted.filter((entry) => entry.status === status),
    })).filter((section) => section.items.length > 0);
  }, [entries]);

  const entryList = useMemo(() => {
    if (groupedEntries.length === 0) {
      return (
        <article className="document-timeline__entry" data-run-id={resolvedRunId}>
          <header>
            <span className="document-timeline__entry-time">--:--</span>
            <strong>外来データ未取得</strong>
          </header>
          <p>外来 API 応答を待機しています。受付画面で再取得するか、接続設定を確認してください。</p>
        </article>
      );
    }

    return groupedEntries.map((section) => (
      <div key={section.status} className="document-timeline__section">
        <div className="document-timeline__section-header">
          <span className="document-timeline__section-badge">{section.status}</span>
          <span className="document-timeline__section-count">{section.items.length}件</span>
        </div>
        {section.items.slice(0, 4).map((entry) => {
          const isSelected =
            (selectedPatientId && entry.patientId === selectedPatientId) ||
            (selectedAppointmentId && entry.appointmentId === selectedAppointmentId);
          const shouldHighlight = resolvedMissingMaster || isSelected;
          return (
            <article
              key={`${entry.id}-${entry.appointmentTime ?? entry.patientId ?? entry.name ?? ''}`}
              className={`document-timeline__entry${shouldHighlight ? ' document-timeline__entry--highlight' : ''}`}
              data-run-id={resolvedRunId}
            >
              <header>
                <span className="document-timeline__entry-time">{entry.appointmentTime ?? '---'}</span>
                <strong>{entry.name ?? '患者未登録'}（{entry.patientId ?? entry.appointmentId ?? 'ID不明'}）</strong>
              </header>
              <p>{entry.note ?? 'メモなし'} ｜ 状態: {entry.status} ｜ 診療科: {entry.department ?? '―'}</p>
            </article>
          );
        })}
      </div>
    ));
  }, [groupedEntries, resolvedMissingMaster, resolvedRunId, selectedAppointmentId, selectedPatientId]);

  return (
    <section
      className="document-timeline"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      role="region"
      data-run-id={resolvedRunId}
    >
      <ToneBanner
        tone={tone}
        message={toneMessage}
        runId={resolvedRunId}
        destination="ORCA Queue"
        nextAction={resolvedMissingMaster ? 'マスタ再取得' : 'ORCA再送'}
      />
      <div className="document-timeline__content">
        <div className="document-timeline__list">{entryList}</div>
        <div className="document-timeline__insights">
          <StatusBadge
            label="missingMaster"
            value={resolvedMissingMaster ? 'true' : 'false'}
            tone={resolvedMissingMaster ? 'warning' : 'success'}
            description={resolvedMissingMaster ? 'マスタ欠損を検知・再取得を待機中' : 'マスタ取得済み・ORCA 再送フェーズ'}
            ariaLive={resolvedMissingMaster ? 'assertive' : 'polite'}
            runId={resolvedRunId}
          />
          <StatusBadge
            label="cacheHit"
            value={resolvedCacheHit ? 'true' : 'false'}
            tone={resolvedCacheHit ? 'success' : 'warning'}
            description={resolvedCacheHit ? 'キャッシュ命中：再取得不要' : 'キャッシュ未命中：再取得または server route を模索'}
            runId={resolvedRunId}
          />
          <div
            className={`document-timeline__transition document-timeline__transition--${transitionMeta.tone}`}
            role="status"
            aria-live="polite"
          >
            <strong>{transitionMeta.label}</strong>
            <p>{transitionMeta.description}</p>
          </div>
          <div className="document-timeline__queue" aria-live="polite">
            <div className="document-timeline__queue-header">
              <strong>ORCA キュー連携</strong>
              <span className="document-timeline__queue-runid">RUN_ID: {resolvedRunId}</span>
            </div>
            <div className="document-timeline__queue-badges">
              <StatusBadge
                label="dataSourceTransition"
                value={resolvedTransition ?? 'snapshot'}
                tone={transitionMeta.tone}
                description={transitionMeta.description}
                runId={resolvedRunId}
              />
              <StatusBadge
                label="fallbackUsed"
                value={resolvedFallbackUsed ? 'true' : 'false'}
                tone={resolvedFallbackUsed ? 'error' : 'info'}
                description={resolvedFallbackUsed ? 'フォールバック使用中。優先で再取得を実施' : 'フォールバック未使用'}
                runId={resolvedRunId}
              />
            </div>
            {claimFlags?.fetchedAt && (
              <p className="document-timeline__queue-meta">
                最終取得: {claimFlags.fetchedAt} ｜ recordsReturned: {claimFlags.recordsReturned ?? '―'}
              </p>
            )}
          </div>
          {auditEvent && (
            <div className="document-timeline__audit" role="alert" aria-live="assertive">
              <strong>auditEvent</strong>
              <p className="document-timeline__audit-text">
                {Object.entries(auditEvent)
                  .map(([key, value]) => `${key}: ${String(value)}`)
                  .join(' ｜ ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
