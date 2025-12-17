import { Global } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

import { AuthServiceControls } from '../AuthServiceControls';
import { useAuthService, type DataSourceTransition } from '../authService';
import { DocumentTimeline } from '../DocumentTimeline';
import { OrcaSummary } from '../OrcaSummary';
import { PatientsTab } from '../PatientsTab';
import { TelemetryFunnelPanel } from '../TelemetryFunnelPanel';
import { ChartsActionBar } from '../ChartsActionBar';
import { normalizeAuditEventLog, normalizeAuditEventPayload } from '../audit';
import { chartsStyles } from '../styles';
import { receptionStyles } from '../../reception/styles';
import { fetchAppointmentOutpatients, fetchClaimFlags, type ReceptionEntry } from '../../reception/api';
import { getAuditEventLog, logAuditEvent, type AuditEventRecord } from '../../../libs/audit/auditLogger';
import { fetchOrcaOutpatientSummary } from '../api';
import { useAdminBroadcast } from '../../../libs/admin/useAdminBroadcast';
import { AdminBroadcastBanner } from '../../shared/AdminBroadcastBanner';
import type { ClaimOutpatientPayload } from '../../outpatient/types';
import { hasStoredAuth } from '../../../libs/http/httpClient';

const isLikelyNetworkError = (error: unknown) => {
  if (!error) return false;
  if (error instanceof TypeError) return true;
  if (error instanceof Error) return /Failed to fetch|NetworkError|ネットワーク/i.test(error.message);
  return false;
};

export function ChartsPage() {
  return (
    <>
      <Global styles={[receptionStyles, chartsStyles]} />
      <ChartsContent />
    </>
  );
}

function ChartsContent() {
  const { flags, setCacheHit, setDataSourceTransition, setMissingMaster, setFallbackUsed, bumpRunId } = useAuthService();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigationState = (location.state as { patientId?: string; appointmentId?: string } | null) ?? {};
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(navigationState.patientId);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(navigationState.appointmentId);
  const [draftState, setDraftState] = useState<{ dirty: boolean; patientId?: string; appointmentId?: string }>({ dirty: false });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);
  const [lockState, setLockState] = useState<{ locked: boolean; reason?: string }>({ locked: false });
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const appliedMeta = useRef<{
    runId?: string;
    cacheHit?: boolean;
    missingMaster?: boolean;
    dataSourceTransition?: DataSourceTransition;
    fallbackUsed?: boolean;
  }>({});
  const { broadcast } = useAdminBroadcast();

  const claimQueryKey = ['charts-claim-flags'];
  const claimQuery = useQuery({
    queryKey: claimQueryKey,
    queryFn: (context) => fetchClaimFlags(context, { screen: 'charts' }),
    refetchInterval: 120_000,
    staleTime: 120_000,
    meta: {
      servedFromCache: !!queryClient.getQueryState(claimQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(claimQueryKey)?.fetchFailureCount ?? 0,
    },
  });

  const appointmentQueryKey = ['charts-appointments', today];
  const appointmentQuery = useInfiniteQuery({
    queryKey: appointmentQueryKey,
    queryFn: ({ pageParam = 1, ...context }) =>
      fetchAppointmentOutpatients({ date: today, page: pageParam, size: 50 }, context),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasNextPage === false) return undefined;
      if (lastPage.hasNextPage === true) return (lastPage.page ?? allPages.length) + 1;
      const size = lastPage.size ?? 50;
      if (lastPage.recordsReturned !== undefined && lastPage.recordsReturned < size) return undefined;
      return (lastPage.page ?? allPages.length) + 1;
    },
    initialPageParam: 1,
    refetchOnWindowFocus: false,
    meta: {
      servedFromCache: !!queryClient.getQueryState(appointmentQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(appointmentQueryKey)?.fetchFailureCount ?? 0,
    },
  });

  const orcaSummaryQueryKey = ['orca-outpatient-summary', flags.runId];
  const orcaSummaryQuery = useQuery({
    queryKey: orcaSummaryQueryKey,
    queryFn: (context) => fetchOrcaOutpatientSummary(context),
    refetchInterval: 120_000,
    staleTime: 120_000,
    meta: {
      servedFromCache: !!queryClient.getQueryState(orcaSummaryQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(orcaSummaryQueryKey)?.fetchFailureCount ?? 0,
    },
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
    const auditMeta = { runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed };
    const auditEvent = normalizeAuditEventPayload(
      claimQuery.data?.auditEvent as Record<string, unknown> | undefined,
      auditMeta,
    );
    return { ...auditMeta, auditEvent };
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

  const resolvedRunId = mergedFlags.runId ?? flags.runId;
  const resolvedCacheHit = mergedFlags.cacheHit ?? flags.cacheHit;
  const resolvedMissingMaster = mergedFlags.missingMaster ?? flags.missingMaster;
  const resolvedTransition = mergedFlags.dataSourceTransition ?? flags.dataSourceTransition;
  const resolvedFallbackUsed = mergedFlags.fallbackUsed ?? flags.fallbackUsed ?? false;

  const selectedQueueEntry = useMemo(() => {
    const entries = (claimQuery.data as ClaimOutpatientPayload | undefined)?.queueEntries ?? [];
    if (!selectedPatientId) return entries[0];
    return entries.find((entry) => entry.patientId === selectedPatientId) ?? entries[0];
  }, [claimQuery.data, selectedPatientId]);

  const hasPermission = useMemo(() => hasStoredAuth(), []);

  const networkDegradedReason = useMemo(() => {
    const firstError =
      (claimQuery.isError && isLikelyNetworkError(claimQuery.error) ? claimQuery.error : undefined) ??
      (orcaSummaryQuery.isError && isLikelyNetworkError(orcaSummaryQuery.error) ? orcaSummaryQuery.error : undefined) ??
      (appointmentQuery.isError && isLikelyNetworkError(appointmentQuery.error) ? appointmentQuery.error : undefined);
    if (!firstError) return undefined;
    const message = firstError instanceof Error ? firstError.message : String(firstError);
    return `直近の取得でネットワークエラーを検知: ${message}`;
  }, [appointmentQuery.error, appointmentQuery.isError, claimQuery.error, claimQuery.isError, orcaSummaryQuery.error, orcaSummaryQuery.isError]);

  const handleRetryClaim = () => {
    logAuditEvent({
      runId: claimQuery.data?.runId ?? resolvedRunId,
      cacheHit: claimQuery.data?.cacheHit,
      missingMaster: claimQuery.data?.missingMaster,
      fallbackUsed: claimQuery.data?.fallbackUsed,
      dataSourceTransition: claimQuery.data?.dataSourceTransition ?? resolvedTransition,
      payload: {
        action: 'CLAIM_OUTPATIENT_RETRY',
        outcome: 'started',
        details: {
          runId: claimQuery.data?.runId ?? resolvedRunId,
          dataSourceTransition: claimQuery.data?.dataSourceTransition ?? resolvedTransition,
          cacheHit: claimQuery.data?.cacheHit,
          missingMaster: claimQuery.data?.missingMaster,
          fallbackUsed: claimQuery.data?.fallbackUsed,
          sourcePath: claimQuery.data?.sourcePath,
        },
      },
    });
    void claimQuery.refetch();
  };

  useEffect(() => {
    const { runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed } = mergedFlags;
    const prev = appliedMeta.current;
    const hasRunIdChange = runId && prev.runId !== runId;
    const hasCacheChange = cacheHit !== undefined && cacheHit !== prev.cacheHit;
    const hasMissingChange = missingMaster !== undefined && missingMaster !== prev.missingMaster;
    const hasTransitionChange = dataSourceTransition && dataSourceTransition !== prev.dataSourceTransition;
    const hasFallbackChange = fallbackUsed !== undefined && fallbackUsed !== prev.fallbackUsed;
    if (!(hasRunIdChange || hasCacheChange || hasMissingChange || hasTransitionChange || hasFallbackChange)) return;

    if (runId) bumpRunId(runId);
    if (cacheHit !== undefined) setCacheHit(cacheHit);
    if (missingMaster !== undefined) setMissingMaster(missingMaster);
    if (dataSourceTransition) setDataSourceTransition(dataSourceTransition);
    if (fallbackUsed !== undefined) setFallbackUsed(fallbackUsed);
    appliedMeta.current = { runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed };
    setAuditEvents(getAuditEventLog());
  }, [
    bumpRunId,
    mergedFlags.cacheHit,
    mergedFlags.dataSourceTransition,
    mergedFlags.fallbackUsed,
    mergedFlags.missingMaster,
    mergedFlags.runId,
    setCacheHit,
    setDataSourceTransition,
    setFallbackUsed,
    setMissingMaster,
  ]);

  useEffect(() => {
    setAuditEvents(getAuditEventLog());
  }, [flags.cacheHit, flags.dataSourceTransition, flags.missingMaster, flags.runId]);

  const appointmentPages = appointmentQuery.data?.pages ?? [];
  const patientEntries: ReceptionEntry[] = useMemo(
    () => appointmentPages.flatMap((page) => page.entries ?? []),
    [appointmentPages],
  );
  const appointmentRecordsReturned = useMemo(
    () =>
      appointmentPages.reduce(
        (acc, page) => acc + (page.recordsReturned ?? page.entries?.length ?? 0),
        0,
      ),
    [appointmentPages],
  );
  const hasNextAppointments =
    appointmentQuery.hasNextPage ?? appointmentPages.some((page) => page.hasNextPage === true);
  useEffect(() => {
    if (patientEntries.length === 0) return;
    if (selectedPatientId || selectedAppointmentId) return;
    const head = patientEntries[0];
    setSelectedPatientId(head.patientId ?? head.id);
    setSelectedAppointmentId(head.appointmentId);
  }, [patientEntries, selectedAppointmentId, selectedPatientId]);

  const latestAuditEvent = useMemo(() => {
    const auditMeta = {
      runId: resolvedRunId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      dataSourceTransition: resolvedTransition,
      fallbackUsed: resolvedFallbackUsed,
    };
    if (auditEvents.length > 0) {
      return normalizeAuditEventLog(auditEvents[auditEvents.length - 1], auditMeta);
    }
    return mergedFlags.auditEvent;
  }, [auditEvents, mergedFlags.auditEvent, resolvedCacheHit, resolvedFallbackUsed, resolvedMissingMaster, resolvedRunId, resolvedTransition]);

  const handleRefreshSummary = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([claimQuery.refetch(), orcaSummaryQuery.refetch(), appointmentQuery.refetch()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [appointmentQuery, claimQuery, orcaSummaryQuery]);

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
          <span className="charts-page__pill">fallbackUsed: {String(flags.fallbackUsed)}</span>
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
          patientId={selectedPatientId}
          queueEntry={selectedQueueEntry}
          hasUnsavedDraft={draftState.dirty}
          hasPermission={hasPermission}
          requireServerRouteForSend
          requirePatientForSend
          networkDegradedReason={networkDegradedReason}
          onAfterSend={handleRefreshSummary}
          onDraftSaved={() => setDraftState((prev) => ({ ...prev, dirty: false }))}
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
            claimData={claimQuery.data as ClaimOutpatientPayload | undefined}
            claimError={
              claimQuery.isError
                ? claimQuery.error instanceof Error
                  ? claimQuery.error
                  : new Error(String(claimQuery.error))
                : undefined
            }
            isClaimLoading={claimQuery.isFetching}
            onRetryClaim={handleRetryClaim}
            recordsReturned={appointmentRecordsReturned}
            hasNextPage={hasNextAppointments}
            onLoadMore={() => appointmentQuery.fetchNextPage()}
            isLoadingMore={appointmentQuery.isFetchingNextPage}
            isInitialLoading={appointmentQuery.isLoading}
            pageSize={appointmentQuery.data?.pages?.[0]?.size ?? 50}
            isRefetchingList={appointmentQuery.isFetching && !appointmentQuery.isLoading}
          />
        </div>
        <div className="charts-card">
          <OrcaSummary
            summary={orcaSummaryQuery.data}
            claim={claimQuery.data as ClaimOutpatientPayload | undefined}
            appointments={patientEntries}
            onRefresh={handleRefreshSummary}
            isRefreshing={isManualRefreshing}
          />
        </div>
        <div className="charts-card">
          <PatientsTab
            entries={patientEntries}
            auditEvent={latestAuditEvent as Record<string, unknown> | undefined}
            selectedPatientId={selectedPatientId}
            draftDirty={draftState.dirty}
            onDraftDirtyChange={(next) => setDraftState(next)}
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
