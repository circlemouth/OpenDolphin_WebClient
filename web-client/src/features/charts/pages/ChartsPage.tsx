import { Global } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { AuthServiceControls } from '../AuthServiceControls';
import { useAuthService } from '../authService';
import { DocumentTimeline } from '../DocumentTimeline';
import { OrcaSummary } from '../OrcaSummary';
import { PatientsTab } from '../PatientsTab';
import { TelemetryFunnelPanel } from '../TelemetryFunnelPanel';
import { chartsStyles } from '../styles';
import { receptionStyles } from '../../reception/styles';
import { fetchAppointmentOutpatients, fetchClaimFlags, type ReceptionEntry } from '../../reception/api';
import { getAuditEventLog, type AuditEventRecord } from '../../../libs/audit/auditLogger';

export function ChartsPage() {
  return (
    <>
      <Global styles={[receptionStyles, chartsStyles]} />
      <ChartsContent />
    </>
  );
}

function ChartsContent() {
  const { flags, setCacheHit, setDataSourceTransition, setMissingMaster, bumpRunId } = useAuthService();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);

  const claimQuery = useQuery({
    queryKey: ['charts-claim-flags'],
    queryFn: fetchClaimFlags,
    refetchInterval: 120_000,
  });

  const appointmentQuery = useQuery({
    queryKey: ['charts-appointments', today],
    queryFn: () => fetchAppointmentOutpatients({ date: today }),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const data = claimQuery.data;
    if (!data) return;
    if (data.runId) {
      bumpRunId(data.runId);
    }
    if (data.cacheHit !== undefined) setCacheHit(data.cacheHit);
    if (data.missingMaster !== undefined) setMissingMaster(data.missingMaster);
    if (data.dataSourceTransition) setDataSourceTransition(data.dataSourceTransition);
    setAuditEvents(getAuditEventLog());
  }, [bumpRunId, claimQuery.data, setCacheHit, setDataSourceTransition, setMissingMaster]);

  useEffect(() => {
    setAuditEvents(getAuditEventLog());
  }, [flags.cacheHit, flags.dataSourceTransition, flags.missingMaster, flags.runId]);

  const patientEntries: ReceptionEntry[] = appointmentQuery.data?.entries ?? [];
  const latestAuditEvent = useMemo(() => {
    if (auditEvents.length > 0) {
      return auditEvents[auditEvents.length - 1].payload ?? auditEvents[auditEvents.length - 1];
    }
    return claimQuery.data?.auditEvent;
  }, [auditEvents, claimQuery.data?.auditEvent]);

  return (
    <main className="charts-page" data-run-id={flags.runId}>
      <section className="charts-page__header">
        <h1>Charts / ORCA トーン連携デモ</h1>
        <p>
          Reception での `missingMaster` / `cacheHit` / `dataSourceTransition` を Charts 側へキャリーし、DocumentTimeline・
          OrcaSummary・Patients の各カードで同じ RUN_ID を基点にトーンをそろえます。Auth-service からのフラグを右上の
          コントロールで切り替え、監査メタの carry over を確認できます。
        </p>
        <div className="charts-page__meta" aria-live="polite">
          <span className="charts-page__pill">RUN_ID: {flags.runId}</span>
          <span className="charts-page__pill">dataSourceTransition: {flags.dataSourceTransition}</span>
          <span className="charts-page__pill">missingMaster: {String(flags.missingMaster)}</span>
          <span className="charts-page__pill">cacheHit: {String(flags.cacheHit)}</span>
        </div>
      </section>

      <section className="charts-page__grid">
        <div className="charts-card">
          <AuthServiceControls />
        </div>
        <div className="charts-card">
          <DocumentTimeline entries={patientEntries} auditEvent={latestAuditEvent as Record<string, unknown> | undefined} />
        </div>
        <div className="charts-card">
          <OrcaSummary />
        </div>
        <div className="charts-card">
          <PatientsTab entries={patientEntries} auditEvent={latestAuditEvent as Record<string, unknown> | undefined} />
        </div>
        <div className="charts-card">
          <TelemetryFunnelPanel />
        </div>
      </section>
    </main>
  );
}
