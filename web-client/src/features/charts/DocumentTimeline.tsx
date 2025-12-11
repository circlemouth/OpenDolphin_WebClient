import { useMemo } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { ReceptionEntry } from '../reception/api';

export interface DocumentTimelineProps {
  entries?: ReceptionEntry[];
  auditEvent?: Record<string, unknown>;
}

export function DocumentTimeline({ entries = [], auditEvent }: DocumentTimelineProps) {
  const { flags } = useAuthService();
  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };

  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const entryList = useMemo(() => {
    const source = entries.length > 0 ? entries : [];
    if (source.length === 0) {
      return (
        <article className="document-timeline__entry" data-run-id={flags.runId}>
          <header>
            <span className="document-timeline__entry-time">--:--</span>
            <strong>外来データ未取得</strong>
          </header>
          <p>外来 API 応答を待機しています。受付画面で再取得するか、接続設定を確認してください。</p>
        </article>
      );
    }

    return source.slice(0, 6).map((entry) => (
      <article
        key={`${entry.id}-${entry.appointmentTime ?? entry.patientId ?? entry.name ?? ''}`}
        className={`document-timeline__entry${flags.missingMaster ? ' document-timeline__entry--highlight' : ''}`}
        data-run-id={flags.runId}
      >
        <header>
          <span className="document-timeline__entry-time">{entry.appointmentTime ?? '---'}</span>
          <strong>{entry.name ?? '患者未登録'}（{entry.patientId ?? entry.appointmentId ?? 'ID不明'}）</strong>
        </header>
        <p>{entry.note ?? 'メモなし'} ｜ 状態: {entry.status} ｜ 診療科: {entry.department ?? '―'}</p>
      </article>
    ));
  }, [entries, flags.missingMaster, flags.runId]);

  return (
    <section
      className="document-timeline"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      role="region"
      data-run-id={flags.runId}
    >
      <ToneBanner
        tone={tone}
        message={toneMessage}
        runId={flags.runId}
        destination="ORCA Queue"
        nextAction={flags.missingMaster ? 'マスタ再取得' : 'ORCA再送'}
      />
      <div className="document-timeline__content">
        <div className="document-timeline__list">{entryList}</div>
        <div className="document-timeline__insights">
          <StatusBadge
            label="missingMaster"
            value={flags.missingMaster ? 'true' : 'false'}
            tone={flags.missingMaster ? 'warning' : 'success'}
            description={flags.missingMaster ? 'マスタ欠損を検知・再取得を待機中' : 'マスタ取得済み・ORCA 再送フェーズ'}
            ariaLive={flags.missingMaster ? 'assertive' : 'polite'}
            runId={flags.runId}
          />
          <StatusBadge
            label="cacheHit"
            value={flags.cacheHit ? 'true' : 'false'}
            tone={flags.cacheHit ? 'success' : 'warning'}
            description={flags.cacheHit ? 'キャッシュ命中：再取得不要' : 'キャッシュ未命中：再取得または server route を模索'}
            runId={flags.runId}
          />
          <div
            className={`document-timeline__transition document-timeline__transition--${transitionMeta.tone}`}
            role="status"
            aria-live="polite"
          >
            <strong>{transitionMeta.label}</strong>
            <p>{transitionMeta.description}</p>
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
