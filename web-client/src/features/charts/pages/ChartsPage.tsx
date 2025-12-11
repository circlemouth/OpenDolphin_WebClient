import { Global } from '@emotion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

import { AuthServiceControls } from '../AuthServiceControls';
import { useAuthService, type DataSourceTransition } from '../authService';
import { DocumentTimeline } from '../DocumentTimeline';
import { OrcaSummary } from '../OrcaSummary';
import { PatientsTab } from '../PatientsTab';
import { TelemetryFunnelPanel } from '../TelemetryFunnelPanel';
import { ChartsActionBar } from '../ChartsActionBar';
import { chartsStyles } from '../styles';
import { receptionStyles } from '../../reception/styles';
import { fetchAppointmentOutpatients, fetchClaimFlags, type ReceptionEntry } from '../../reception/api';
import { getAuditEventLog, type AuditEventRecord } from '../../../libs/audit/auditLogger';
import { fetchOrcaOutpatientSummary } from '../api';
import { useAdminBroadcast } from '../../../libs/admin/useAdminBroadcast';
import { AdminBroadcastBanner } from '../../shared/AdminBroadcastBanner';

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
  const location = useLocation();
  const navigationState = (location.state as { patientId?: string; appointmentId?: string } | null) ?? {};
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(navigationState.patientId);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(navigationState.appointmentId);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);
  const [lockState, setLockState] = useState<{ locked: boolean; reason?: string }>({ locked: false });
  const appliedMeta = useRef<{
    runId?: string;
    cacheHit?: boolean;
    missingMaster?: boolean;
    dataSourceTransition?: DataSourceTransition;
  }>({});
  const { broadcast } = useAdminBroadcast();

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

  const orcaSummaryQuery = useQuery({
    queryKey: ['orca-outpatient-summary', flags.runId],
    queryFn: fetchOrcaOutpatientSummary,
    refetchInterval: 120_000,
  });

  const mergedFlags = useMemo(() => {
    const runId = claimQuery.data?.runId ?? orcaSummaryQuery.data?.runId ?? flags.runId;
    const cacheHit = claimQuery.data?.cacheHit ?? orcaSummaryQuery.data?.cacheHit ?? flags.cacheHit;
    const missingMaster =
      claimQuery.data?.missingMaster ?? orcaSummaryQuery.data?.missingMaster ?? flags.missingMaster;
    const dataSourceTransition =
      claimQuery.data?.dataSourceTransition ??
      orcaSummaryQuery.data?.dataSourceTransition ??
      flags.dataSourceTransition;
    const fallbackUsed = claimQuery.data?.fallbackUsed ?? orcaSummaryQuery.data?.fallbackUsed;
    const auditEvent = claimQuery.data?.auditEvent;
    return { runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed, auditEvent };
  }, [
    claimQuery.data?.auditEvent,
    claimQuery.data?.cacheHit,
    claimQuery.data?.dataSourceTransition,
    claimQuery.data?.missingMaster,
    claimQuery.data?.runId,
    claimQuery.data?.fallbackUsed,
    flags.cacheHit,
    flags.dataSourceTransition,
    flags.missingMaster,
    flags.runId,
    orcaSummaryQuery.data?.cacheHit,
    orcaSummaryQuery.data?.dataSourceTransition,
    orcaSummaryQuery.data?.missingMaster,
    orcaSummaryQuery.data?.runId,
    orcaSummaryQuery.data?.fallbackUsed,
  ]);

  useEffect(() => {
    const { runId, cacheHit, missingMaster, dataSourceTransition } = mergedFlags;
    const prev = appliedMeta.current;
    const hasRunIdChange = runId && prev.runId !== runId;
    const hasCacheChange = cacheHit !== undefined && cacheHit !== prev.cacheHit;
    const hasMissingChange = missingMaster !== undefined && missingMaster !== prev.missingMaster;
    const hasTransitionChange = dataSourceTransition && dataSourceTransition !== prev.dataSourceTransition;
    if (!(hasRunIdChange || hasCacheChange || hasMissingChange || hasTransitionChange)) return;

    if (runId) bumpRunId(runId);
    if (cacheHit !== undefined) setCacheHit(cacheHit);
    if (missingMaster !== undefined) setMissingMaster(missingMaster);
    if (dataSourceTransition) setDataSourceTransition(dataSourceTransition);
    appliedMeta.current = { runId, cacheHit, missingMaster, dataSourceTransition };
    setAuditEvents(getAuditEventLog());
  }, [
    bumpRunId,
    mergedFlags.cacheHit,
    mergedFlags.dataSourceTransition,
    mergedFlags.missingMaster,
    mergedFlags.runId,
    setCacheHit,
    setDataSourceTransition,
    setMissingMaster,
  ]);

  useEffect(() => {
    setAuditEvents(getAuditEventLog());
  }, [flags.cacheHit, flags.dataSourceTransition, flags.missingMaster, flags.runId]);

  const patientEntries: ReceptionEntry[] = appointmentQuery.data?.entries ?? [];
  useEffect(() => {
    if (patientEntries.length === 0) return;
    if (selectedPatientId || selectedAppointmentId) return;
    const head = patientEntries[0];
    setSelectedPatientId(head.patientId ?? head.id);
    setSelectedAppointmentId(head.appointmentId);
  }, [patientEntries, selectedAppointmentId, selectedPatientId]);

  const latestAuditEvent = useMemo(() => {
    if (auditEvents.length > 0) {
      return auditEvents[auditEvents.length - 1].payload ?? auditEvents[auditEvents.length - 1];
    }
    return claimQuery.data?.auditEvent;
  }, [auditEvents, claimQuery.data?.auditEvent]);

  const resolvedRunId = mergedFlags.runId ?? flags.runId;
  const resolvedCacheHit = mergedFlags.cacheHit ?? flags.cacheHit;
  const resolvedMissingMaster = mergedFlags.missingMaster ?? flags.missingMaster;
  const resolvedTransition = mergedFlags.dataSourceTransition ?? flags.dataSourceTransition;
  const resolvedFallbackUsed = mergedFlags.fallbackUsed ?? false;

  return (
    <main className="charts-page" data-run-id={flags.runId} aria-busy={lockState.locked}>
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
      <AdminBroadcastBanner broadcast={broadcast} surface="charts" />

      <div className="charts-card charts-card--actions">
        <ChartsActionBar
          runId={resolvedRunId ?? flags.runId}
          cacheHit={resolvedCacheHit ?? false}
          missingMaster={resolvedMissingMaster ?? false}
          dataSourceTransition={resolvedTransition ?? 'snapshot'}
          fallbackUsed={resolvedFallbackUsed}
          onLockChange={(locked, reason) => setLockState({ locked, reason })}
        />
      </div>

      <section className="charts-page__grid">
        <div className="charts-card">
          <AuthServiceControls />
        </div>
        <div className="charts-card">
          <DocumentTimeline
            entries={patientEntries}
            auditEvent={latestAuditEvent as Record<string, unknown> | undefined}
            selectedPatientId={selectedPatientId}
            selectedAppointmentId={selectedAppointmentId}
            claimFlags={claimQuery.data}
          />
        </div>
        <div className="charts-card">
          <OrcaSummary summary={orcaSummaryQuery.data} />
        </div>
        <div className="charts-card">
          <PatientsTab
            entries={patientEntries}
            auditEvent={latestAuditEvent as Record<string, unknown> | undefined}
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            onSelectAppointment={setSelectedAppointmentId}
          />
        </div>
        <div className="charts-card">
          <TelemetryFunnelPanel />
        </div>
      </section>
    </main>
  );
}
