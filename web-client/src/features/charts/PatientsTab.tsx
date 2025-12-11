import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { ReceptionEntry } from '../reception/api';

export interface PatientsTabProps {
  entries?: ReceptionEntry[];
  auditEvent?: Record<string, unknown>;
}

export function PatientsTab({ entries = [], auditEvent }: PatientsTabProps) {
  const { flags } = useAuthService();
  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };
  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);

  return (
    <section
      className="patients-tab"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      data-run-id={flags.runId}
    >
      <ToneBanner tone={tone} message={toneMessage} runId={flags.runId} ariaLive={flags.missingMaster ? 'assertive' : 'polite'} />
      <div className="patients-tab__header">
        <div>
          <p className="patients-tab__header-label">dataSourceTransition</p>
          <strong>{transitionMeta.label}</strong>
          <p className="patients-tab__header-description">{transitionMeta.description}</p>
        </div>
        <div className="patients-tab__badges">
          <StatusBadge
            label="missingMaster"
            value={flags.missingMaster ? 'true' : 'false'}
            tone={flags.missingMaster ? 'warning' : 'success'}
            ariaLive={flags.missingMaster ? 'assertive' : 'polite'}
            runId={flags.runId}
          />
          <StatusBadge
            label="cacheHit"
            value={flags.cacheHit ? 'true' : 'false'}
            tone={flags.cacheHit ? 'success' : 'warning'}
            runId={flags.runId}
          />
        </div>
      </div>
      <div className="patients-tab__table" role="list">
        {entries.length === 0 && (
          <article className="patients-tab__row" data-run-id={flags.runId}>
            <div className="patients-tab__row-meta">
              <span className="patients-tab__row-id">患者データなし</span>
              <strong>外来 API 応答を待機</strong>
            </div>
            <p className="patients-tab__row-detail">Reception からの取得結果がまだ届いていません。</p>
            <span className="patients-tab__row-status">tone={tone}</span>
          </article>
        )}
        {entries.slice(0, 6).map((patient) => (
          <article key={patient.id} className="patients-tab__row" data-run-id={flags.runId}>
            <div className="patients-tab__row-meta">
              <span className="patients-tab__row-id">{patient.patientId ?? patient.appointmentId ?? 'ID不明'}</span>
              <strong>{patient.name ?? '患者未登録'}</strong>
            </div>
            <p className="patients-tab__row-detail">
              {patient.insurance ?? patient.source} | {patient.note ?? 'メモなし'}
            </p>
            <span className="patients-tab__row-status">
              {flags.missingMaster ? 'missingMaster 警告' : flags.cacheHit ? 'cacheHit 命中' : 'server route'}
            </span>
          </article>
        ))}
      </div>
      {auditEvent && (
        <div className="patients-tab__audit" role="alert" aria-live="assertive">
          <strong>auditEvent</strong>
          <p>
            {Object.entries(auditEvent)
              .map(([key, value]) => `${key}: ${String(value)}`)
              .join(' ｜ ')}
          </p>
        </div>
      )}
    </section>
  );
}
