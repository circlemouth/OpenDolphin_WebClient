import { Global } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

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
import { ToneBanner } from '../../reception/components/ToneBanner';
import { useSession } from '../../../AppRouter';
import { fetchEffectiveAdminConfig, type ChartsMasterSourcePolicy } from '../../administration/api';
import type { ClaimOutpatientPayload } from '../../outpatient/types';
import { hasStoredAuth } from '../../../libs/http/httpClient';
import {
  buildChartsEncounterSearch,
  hasEncounterContext,
  loadChartsEncounterContext,
  normalizeVisitDate,
  parseChartsEncounterContext,
  storeChartsEncounterContext,
  type OutpatientEncounterContext,
} from '../encounterContext';

const isLikelyNetworkError = (error: unknown) => {
  if (!error) return false;
  if (error instanceof TypeError) return true;
  if (error instanceof Error) return /Failed to fetch|NetworkError|ネットワーク/i.test(error.message);
  return false;
};
import { getAppointmentDataBanner } from '../../outpatient/appointmentDataBanner';

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
  const session = useSession();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = (location.state as Partial<OutpatientEncounterContext> | null) ?? {};
  const [encounterContext, setEncounterContext] = useState<OutpatientEncounterContext>(() => {
    const urlContext = parseChartsEncounterContext(location.search);
    if (hasEncounterContext(urlContext)) return urlContext;
    const stored = loadChartsEncounterContext();
    if (hasEncounterContext(stored)) return stored ?? {};
    return {
      patientId: typeof navigationState.patientId === 'string' ? navigationState.patientId : undefined,
      appointmentId: typeof navigationState.appointmentId === 'string' ? navigationState.appointmentId : undefined,
      receptionId: typeof navigationState.receptionId === 'string' ? navigationState.receptionId : undefined,
      visitDate: normalizeVisitDate(typeof navigationState.visitDate === 'string' ? navigationState.visitDate : undefined),
    };
  });
  const [draftState, setDraftState] = useState<{
    dirty: boolean;
    patientId?: string;
    appointmentId?: string;
    receptionId?: string;
    visitDate?: string;
  }>({ dirty: false });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);
  const [lockState, setLockState] = useState<{ locked: boolean; reason?: string }>({ locked: false });
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [contextAlert, setContextAlert] = useState<{ tone: 'info' | 'warning'; message: string } | null>(null);
  const [deliveryImpactBanner, setDeliveryImpactBanner] = useState<{ tone: 'info' | 'warning'; message: string } | null>(null);
  const [deliveryAppliedMeta, setDeliveryAppliedMeta] = useState<{
    appliedAt: string;
    appliedTo: string;
    role: string;
    runId?: string;
    deliveredAt?: string;
    deliveryId?: string;
    deliveryVersion?: string;
    syncMismatch?: boolean;
    syncMismatchFields?: string;
  } | null>(null);
  const appliedMeta = useRef<{
    runId?: string;
    cacheHit?: boolean;
    missingMaster?: boolean;
    dataSourceTransition?: DataSourceTransition;
    fallbackUsed?: boolean;
  }>({});
  const { broadcast } = useAdminBroadcast();
  const appliedDelivery = useRef<{ key?: string }>({});
  const previousDeliveryFlags = useRef<{
    chartsDisplayEnabled?: boolean;
    chartsSendEnabled?: boolean;
    chartsMasterSource?: ChartsMasterSourcePolicy;
  }>({});

  const urlContext = useMemo(() => parseChartsEncounterContext(location.search), [location.search]);

  const sameEncounterContext = useCallback((left: OutpatientEncounterContext, right: OutpatientEncounterContext) => {
    return (
      (left.patientId ?? '') === (right.patientId ?? '') &&
      (left.appointmentId ?? '') === (right.appointmentId ?? '') &&
      (left.receptionId ?? '') === (right.receptionId ?? '') &&
      (normalizeVisitDate(left.visitDate) ?? '') === (normalizeVisitDate(right.visitDate) ?? '')
    );
  }, []);

  useEffect(() => {
    if (!hasEncounterContext(urlContext)) return;
    if (sameEncounterContext(urlContext, encounterContext)) return;
    if (draftState.dirty || lockState.locked) {
      setContextAlert({
        tone: 'warning',
        message: '未保存ドラフトまたは処理中のため、URL からの患者切替をブロックしました（別患者混入防止）。',
      });
      const currentSearch = buildChartsEncounterSearch(encounterContext);
      if (location.search !== currentSearch) {
        navigate({ pathname: '/charts', search: currentSearch }, { replace: true });
      }
      return;
    }
    setEncounterContext(urlContext);
    setContextAlert({
      tone: 'info',
      message: 'URL の外来コンテキストに合わせて表示を更新しました（戻る/進む操作）。',
    });
  }, [draftState.dirty, encounterContext, location.search, lockState.locked, navigate, sameEncounterContext, urlContext]);

  useEffect(() => {
    if (!hasEncounterContext(encounterContext)) return;
    storeChartsEncounterContext(encounterContext);
    const nextSearch = buildChartsEncounterSearch(encounterContext);
    if (location.search === nextSearch) return;
    navigate({ pathname: '/charts', search: nextSearch }, { replace: true });
  }, [encounterContext, location.search, navigate]);

  const adminQueryKey = ['admin-effective-config'];
  const adminConfigQuery = useQuery({
    queryKey: adminQueryKey,
    queryFn: fetchEffectiveAdminConfig,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });

  useEffect(() => {
    if (!broadcast?.updatedAt) return;
    void adminConfigQuery.refetch();
  }, [adminConfigQuery, broadcast?.updatedAt]);

  const chartsMasterSourcePolicy: ChartsMasterSourcePolicy =
    (adminConfigQuery.data?.chartsMasterSource as ChartsMasterSourcePolicy | undefined) ??
    (broadcast?.chartsMasterSource as ChartsMasterSourcePolicy | undefined) ??
    'auto';
  const chartsDisplayEnabled =
    (adminConfigQuery.data?.chartsDisplayEnabled ?? broadcast?.chartsDisplayEnabled) ?? true;
  const chartsSendEnabled =
    (adminConfigQuery.data?.chartsSendEnabled ?? broadcast?.chartsSendEnabled) ?? true;

  const resolvePreferredSourceOverride = (policy: ChartsMasterSourcePolicy) => {
    if (policy === 'server') return 'server' as const;
    if (policy === 'mock') return 'mock' as const;
    if (policy === 'fallback') return 'mock' as const;
    if (policy === 'snapshot') return 'snapshot' as const;
    return undefined;
  };
  const preferredSourceOverride = resolvePreferredSourceOverride(chartsMasterSourcePolicy);
  const forceFallbackUsed = chartsMasterSourcePolicy === 'fallback';
  const sendAllowedByDelivery = chartsSendEnabled && (chartsMasterSourcePolicy === 'auto' || chartsMasterSourcePolicy === 'server');
  const sendDisabledReason = !chartsSendEnabled
    ? '管理配信で ORCA送信 が disabled になっています。'
    : chartsMasterSourcePolicy === 'fallback'
      ? '管理配信で masterSource=fallback が指定されているため ORCA送信 を停止しています。'
      : chartsMasterSourcePolicy === 'mock'
        ? '管理配信で masterSource=mock が指定されているため ORCA送信 を停止しています。'
        : undefined;

  useEffect(() => {
    const data = adminConfigQuery.data;
    if (!data) return;
    const key = JSON.stringify({
      deliveryId: data.deliveryId,
      deliveryVersion: data.deliveryVersion,
      deliveredAt: data.deliveredAt,
      runId: data.runId,
      chartsDisplayEnabled: data.chartsDisplayEnabled,
      chartsSendEnabled: data.chartsSendEnabled,
      chartsMasterSource: data.chartsMasterSource,
    });
    if (appliedDelivery.current.key === key) return;
    appliedDelivery.current.key = key;

    const appliedAt = new Date().toISOString();
    const appliedTo = `${session.facilityId}:${session.userId}`;
    setDeliveryAppliedMeta({
      appliedAt,
      appliedTo,
      role: session.role,
      runId: data.runId ?? flags.runId,
      deliveredAt: data.deliveredAt,
      deliveryId: data.deliveryId,
      deliveryVersion: data.deliveryVersion,
      syncMismatch: data.syncMismatch,
      syncMismatchFields: data.syncMismatchFields?.length ? data.syncMismatchFields.join(', ') : undefined,
    });
    logAuditEvent({
      runId: data.runId ?? flags.runId,
      source: 'admin/delivery.apply',
      note: 'charts apply admin delivery',
      payload: {
        appliedAt,
        appliedTo,
        role: session.role,
        delivery: {
          deliveryId: data.deliveryId,
          deliveryVersion: data.deliveryVersion,
          deliveredAt: data.deliveredAt,
        },
        flags: {
          chartsDisplayEnabled: data.chartsDisplayEnabled,
          chartsSendEnabled: data.chartsSendEnabled,
          chartsMasterSource: data.chartsMasterSource,
        },
        syncMismatch: data.syncMismatch,
        syncMismatchFields: data.syncMismatchFields,
        raw: {
          config: data.rawConfig,
          delivery: data.rawDelivery,
        },
      },
    });

    const prevSource = previousDeliveryFlags.current.chartsMasterSource ?? 'auto';
    const prevSend = previousDeliveryFlags.current.chartsSendEnabled;
    const prevDisplay = previousDeliveryFlags.current.chartsDisplayEnabled;

    const nextSource = (data.chartsMasterSource ?? chartsMasterSourcePolicy) as ChartsMasterSourcePolicy;
    const nextSend = data.chartsSendEnabled ?? chartsSendEnabled;
    const nextDisplay = data.chartsDisplayEnabled ?? chartsDisplayEnabled;
    const isFirstApply = previousDeliveryFlags.current.chartsMasterSource === undefined;
    previousDeliveryFlags.current = {
      chartsMasterSource: nextSource,
      chartsSendEnabled: nextSend,
      chartsDisplayEnabled: nextDisplay,
    };

    if (isFirstApply && (nextSource === 'fallback' || nextSource === 'mock')) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: `Charts masterSource=${nextSource} で起動しています（送信は停止扱い）。`,
      });
      return;
    }
    if (isFirstApply && nextSend === false) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: 'Charts の ORCA送信 は管理配信で disabled の状態です。',
      });
      return;
    }
    if (isFirstApply && nextDisplay === false) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: 'Charts の表示は管理配信で disabled の状態です。',
      });
      return;
    }
    if (prevSource !== nextSource) {
      const impact =
        nextSource === 'fallback'
          ? '（送信停止・フォールバック扱い）'
          : nextSource === 'mock'
            ? '（送信停止・モック優先）'
            : '';
      setDeliveryImpactBanner({
        tone: nextSource === 'fallback' ? 'warning' : nextSource === 'mock' ? 'warning' : 'info',
        message: `Charts masterSource が ${prevSource} → ${nextSource} に更新されました${impact}`,
      });
      return;
    }
    if (prevSend !== undefined && prevSend !== nextSend && nextSend === false) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: 'Charts の ORCA送信 が管理配信で無効化されました。',
      });
      return;
    }
    if (prevDisplay !== undefined && prevDisplay !== nextDisplay && nextDisplay === false) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: 'Charts の表示が管理配信で無効化されました。',
      });
      return;
    }
    setDeliveryImpactBanner(null);
  }, [
    adminConfigQuery.data,
    chartsDisplayEnabled,
    chartsMasterSourcePolicy,
    chartsSendEnabled,
    flags.runId,
    session.facilityId,
    session.role,
    session.userId,
  ]);

  const claimQueryKey = ['charts-claim-flags'];
  const claimQuery = useQuery({
    queryKey: claimQueryKey,
    queryFn: (context) => fetchClaimFlags(context, { screen: 'charts', preferredSourceOverride }),
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
      fetchAppointmentOutpatients({ date: today, page: pageParam, size: 50 }, context, { preferredSourceOverride }),
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
    queryFn: (context) => fetchOrcaOutpatientSummary(context, { preferredSourceOverride }),
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
  const resolvedFallbackUsed = (mergedFlags.fallbackUsed ?? flags.fallbackUsed ?? false) || forceFallbackUsed;

  const selectedQueueEntry = useMemo(() => {
    const entries = (claimQuery.data as ClaimOutpatientPayload | undefined)?.queueEntries ?? [];
    if (!encounterContext.patientId) return entries[0];
    return entries.find((entry) => entry.patientId === encounterContext.patientId) ?? entries[0];
  }, [claimQuery.data, encounterContext.patientId]);

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

  const selectedEntry = useMemo(() => {
    if (!encounterContext.patientId && !encounterContext.appointmentId && !encounterContext.receptionId) return undefined;
    const byReception = encounterContext.receptionId
      ? patientEntries.find((entry) => entry.receptionId === encounterContext.receptionId)
      : undefined;
    if (byReception) return byReception;
    const byAppointment = encounterContext.appointmentId
      ? patientEntries.find((entry) => entry.appointmentId === encounterContext.appointmentId)
      : undefined;
    if (byAppointment) return byAppointment;
    if (!encounterContext.patientId) return undefined;
    return patientEntries.find((entry) => (entry.patientId ?? entry.id) === encounterContext.patientId);
  }, [encounterContext.appointmentId, encounterContext.patientId, encounterContext.receptionId, patientEntries]);
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

  const appointmentBanner = useMemo(
    () =>
      getAppointmentDataBanner({
        entries: patientEntries,
        isLoading: appointmentQuery.isLoading,
        isError: appointmentQuery.isError,
        error: appointmentQuery.error,
        date: today,
      }),
    [appointmentQuery.error, appointmentQuery.isError, appointmentQuery.isLoading, patientEntries, today],
  );
  useEffect(() => {
    if (patientEntries.length === 0) return;
    if (draftState.dirty || lockState.locked) return;
    const resolve = (entries: ReceptionEntry[], context: OutpatientEncounterContext) => {
      if (context.receptionId) return entries.find((entry) => entry.receptionId === context.receptionId);
      if (context.appointmentId) return entries.find((entry) => entry.appointmentId === context.appointmentId);
      if (context.patientId) return entries.find((entry) => (entry.patientId ?? entry.id) === context.patientId);
      return undefined;
    };

    const resolved = resolve(patientEntries, encounterContext);
    const head = patientEntries[0];
    if (!resolved && hasEncounterContext(encounterContext)) {
      setContextAlert({
        tone: 'warning',
        message: `指定された外来コンテキストが見つかりません（patientId=${encounterContext.patientId ?? '―'} receptionId=${encounterContext.receptionId ?? '―'}）。先頭の患者へ切替えました。`,
      });
      setEncounterContext({
        patientId: head.patientId ?? head.id,
        appointmentId: head.appointmentId,
        receptionId: head.receptionId,
        visitDate: normalizeVisitDate(head.visitDate) ?? today,
      });
      return;
    }

    const chosen = resolved ?? head;
    const nextContext: OutpatientEncounterContext = {
      patientId: chosen.patientId ?? chosen.id,
      appointmentId: chosen.appointmentId,
      receptionId: chosen.receptionId,
      visitDate: normalizeVisitDate(chosen.visitDate) ?? encounterContext.visitDate ?? today,
    };
    if (!sameEncounterContext(nextContext, encounterContext)) {
      setEncounterContext(nextContext);
      setContextAlert(null);
    }
  }, [draftState.dirty, encounterContext, lockState.locked, patientEntries, sameEncounterContext, today]);

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
          <span className="charts-page__pill">Charts master: {chartsMasterSourcePolicy}</span>
          <span className="charts-page__pill">Charts送信: {sendAllowedByDelivery ? 'enabled' : 'disabled'}</span>
          <span className="charts-page__pill">
            配信: {adminConfigQuery.data?.deliveryVersion ?? adminConfigQuery.data?.deliveryId ?? '―'}
          </span>
          <span className="charts-page__pill">適用先: {session.facilityId}:{session.userId}</span>
        </div>
      </section>
      <AdminBroadcastBanner broadcast={broadcast} surface="charts" />
      {contextAlert ? (
        <ToneBanner
          tone={contextAlert.tone}
          message={contextAlert.message}
          destination="Charts"
          nextAction="必要なら Reception で再選択"
          runId={flags.runId}
          ariaLive={contextAlert.tone === 'info' ? 'polite' : 'assertive'}
        />
      ) : null}
      {deliveryImpactBanner ? (
        <ToneBanner
          tone={deliveryImpactBanner.tone}
          message={deliveryImpactBanner.message}
          destination="Charts"
          nextAction="再取得/リロードで反映"
          runId={adminConfigQuery.data?.runId ?? broadcast?.runId ?? flags.runId}
          ariaLive="assertive"
        />
      ) : null}

      {!chartsDisplayEnabled ? (
        <ToneBanner
          tone="warning"
          message="Charts の表示が管理配信で disabled です。Administration で再度 enabled にして配信してください。"
          destination="Charts"
          nextAction="Administration で再配信"
          runId={adminConfigQuery.data?.runId ?? broadcast?.runId ?? flags.runId}
          ariaLive="assertive"
        />
      ) : null}

      {deliveryAppliedMeta ? (
        <section className="charts-card" aria-label="管理配信の適用メタ">
          <h2>管理配信（適用メタ）</h2>
          <div className="charts-page__meta" aria-live="polite">
            <span className="charts-page__pill">適用時刻: {deliveryAppliedMeta.appliedAt}</span>
            <span className="charts-page__pill">適用ユーザー: {deliveryAppliedMeta.appliedTo}</span>
            <span className="charts-page__pill">role: {deliveryAppliedMeta.role}</span>
            <span className="charts-page__pill">配信runId: {deliveryAppliedMeta.runId ?? '―'}</span>
            <span className="charts-page__pill">deliveredAt: {deliveryAppliedMeta.deliveredAt ?? '―'}</span>
            <span className="charts-page__pill">deliveryId: {deliveryAppliedMeta.deliveryId ?? '―'}</span>
            <span className="charts-page__pill">deliveryVersion: {deliveryAppliedMeta.deliveryVersion ?? '―'}</span>
            <span className="charts-page__pill">
              syncMismatch: {deliveryAppliedMeta.syncMismatch === undefined ? '―' : String(deliveryAppliedMeta.syncMismatch)}
            </span>
            <span className="charts-page__pill">mismatchFields: {deliveryAppliedMeta.syncMismatchFields ?? '―'}</span>
          </div>
        </section>
      ) : null}

      {!chartsDisplayEnabled ? null : (
        <>
          <div className="charts-card charts-card--actions">
            <ChartsActionBar
              runId={resolvedRunId ?? flags.runId}
              cacheHit={resolvedCacheHit ?? false}
              missingMaster={resolvedMissingMaster ?? false}
              dataSourceTransition={resolvedTransition ?? 'snapshot'}
              fallbackUsed={resolvedFallbackUsed}
              selectedEntry={selectedEntry}
              sendEnabled={sendAllowedByDelivery}
              sendDisabledReason={sendDisabledReason}
              patientId={encounterContext.patientId}
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
            appointmentBanner={appointmentBanner}
            auditEvent={latestAuditEvent as Record<string, unknown> | undefined}
            selectedPatientId={encounterContext.patientId}
            selectedAppointmentId={encounterContext.appointmentId}
            selectedReceptionId={encounterContext.receptionId}
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
            appointmentBanner={appointmentBanner}
            auditEvent={latestAuditEvent as Record<string, unknown> | undefined}
            selectedContext={encounterContext}
            draftDirty={draftState.dirty}
            switchLocked={lockState.locked}
            switchLockedReason={lockState.reason}
            onDraftDirtyChange={(next) => setDraftState(next)}
            onSelectEncounter={(next) => {
              if (!next) return;
              setEncounterContext((prev) => ({
                ...prev,
                ...next,
                visitDate: normalizeVisitDate(next.visitDate) ?? prev.visitDate ?? today,
              }));
              setContextAlert(null);
            }}
          />
        </div>
        <div className="charts-card">
          <TelemetryFunnelPanel />
        </div>
      </section>
        </>
      )}
    </main>
  );
}
