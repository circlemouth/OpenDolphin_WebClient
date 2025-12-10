import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';

const PATIENT_ROWS = [
  { patientId: 'PX-2024-001', name: '山田 太郎', insurance: '保険', lastEvent: 'ORCA queue 追加' },
  { patientId: 'PX-2024-002', name: '鈴木 花子', insurance: '自費', lastEvent: 'missingMaster 再送待ち' },
  { patientId: 'PX-2024-003', name: '佐藤 一郎', insurance: '保険', lastEvent: 'cacheHit= true' },
];

export function PatientsTab() {
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
        {PATIENT_ROWS.map((patient) => (
          <article key={patient.patientId} className="patients-tab__row" data-run-id={flags.runId}>
            <div className="patients-tab__row-meta">
              <span className="patients-tab__row-id">{patient.patientId}</span>
              <strong>{patient.name}</strong>
            </div>
            <p className="patients-tab__row-detail">{patient.insurance} | {patient.lastEvent}</p>
            <span className="patients-tab__row-status">
              {flags.missingMaster ? 'missingMaster 警告' : flags.cacheHit ? 'cacheHit 命中' : 'server route'}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
