import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, getTransitionCopy, type ChartTonePayload } from '../../ux/charts/tones';
import { resolveAriaLive, resolveRunId } from '../../libs/observability/observability';
import type { OrcaOutpatientSummary } from './api';
import type { ClaimOutpatientPayload, ReceptionEntry } from '../outpatient/types';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { resolveOutpatientFlags, type OutpatientFlagSource } from '../outpatient/flags';
import { buildFacilityPath } from '../../routes/facilityRoutes';
import { useOptionalSession } from '../../AppRouter';
import { buildIncomeInfoRequestXml, fetchOrcaIncomeInfoXml } from './orcaIncomeInfoApi';
import { getOrcaClaimSendEntry } from './orcaClaimSendCache';
import {
  buildBillingStatusUpdateAudit,
  resolveBillingStatusFromInvoice,
  resolveBillingStatusUpdateDurationMs,
} from './orcaBillingStatus';
import { saveOrcaIncomeInfoCache } from './orcaIncomeInfoCache';

export interface OrcaSummaryProps {
  summary?: OrcaOutpatientSummary;
  claim?: ClaimOutpatientPayload;
  appointments?: ReceptionEntry[];
  appointmentMeta?: OutpatientFlagSource;
  patientId?: string;
  visitDate?: string;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
}

export function OrcaSummary({
  summary,
  claim,
  appointments = [],
  appointmentMeta,
  patientId,
  visitDate,
  onRefresh,
  isRefreshing = false,
}: OrcaSummaryProps) {
  const navigate = useNavigate();
  const session = useOptionalSession();
  const { flags } = useAuthService();
  const resolvedFlags = resolveOutpatientFlags(summary, claim, appointmentMeta, flags);
  const resolvedRunId = resolveRunId(resolvedFlags.runId ?? flags.runId);
  const resolvedMissingMaster = resolvedFlags.missingMaster ?? flags.missingMaster;
  const resolvedCacheHit = resolvedFlags.cacheHit ?? flags.cacheHit;
  const resolvedFallbackUsed = resolvedFlags.fallbackUsed ?? flags.fallbackUsed ?? false;
  const resolvedTransition = resolvedFlags.dataSourceTransition ?? flags.dataSourceTransition;
  const fallbackFlagMissing = resolvedFlags.fallbackFlagMissing ?? false;
  const [perfMeasured, setPerfMeasured] = useState(false);
  const renderStartedAt = useMemo(() => performance.now(), []);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const performMonth = useMemo(() => (visitDate ?? today).slice(0, 7), [today, visitDate]);
  const tonePayload: ChartTonePayload = {
    missingMaster: resolvedMissingMaster ?? false,
    cacheHit: resolvedCacheHit ?? false,
    dataSourceTransition: resolvedTransition ?? 'snapshot',
  };
  const { tone, message: sharedMessage, transitionMeta } = getChartToneDetails(tonePayload);
  const transitionCopy = getTransitionCopy(resolvedTransition ?? 'snapshot');

  const incomeInfoQuery = useQuery({
    queryKey: ['orca-income-info', patientId, performMonth],
    queryFn: () => {
      if (!patientId) throw new Error('patientId is required');
      const requestXml = buildIncomeInfoRequestXml({ patientId, performMonth });
      return fetchOrcaIncomeInfoXml(requestXml);
    },
    enabled: false,
    staleTime: 60_000,
  });

  const [lastSendCache, setLastSendCache] = useState<ReturnType<typeof getOrcaClaimSendEntry> | null>(null);

  useEffect(() => {
    const cache = getOrcaClaimSendEntry(
      { facilityId: session?.facilityId, userId: session?.userId },
      patientId,
    );
    setLastSendCache(cache);
  }, [session?.facilityId, session?.userId, patientId, summary?.fetchedAt, claim?.fetchedAt, summary?.runId, claim?.runId]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ patientId?: string }>).detail;
      if (detail?.patientId && detail.patientId !== patientId) return;
      const cache = getOrcaClaimSendEntry(
        { facilityId: session?.facilityId, userId: session?.userId },
        patientId,
      );
      setLastSendCache(cache);
    };
    window.addEventListener('orca-claim-send-cache-update', handler);
    return () => {
      window.removeEventListener('orca-claim-send-cache-update', handler);
    };
  }, [patientId, session?.facilityId, session?.userId]);

  const incomeInfoNotice = useMemo(() => {
    if (!patientId) {
      return { tone: 'warning' as const, message: '患者が未選択のため収納情報を取得できません。' };
    }
    if (incomeInfoQuery.isError) {
      return { tone: 'error' as const, message: '収納情報の取得に失敗しました。' };
    }
    const data = incomeInfoQuery.data;
    if (!data) return null;
    const apiResultLabel = `Api_Result=${data.apiResult ?? '—'}`;
    if (!data.ok) {
      const detail = data.error ?? data.apiResultMessage ?? '収納情報の取得に失敗しました。';
      return { tone: 'error' as const, message: `${apiResultLabel} / ${detail}` };
    }
    const hasMissing = (data.missingTags ?? []).length > 0;
    const apiOk = Boolean(data.apiResult && /^0+$/.test(data.apiResult));
    if (!apiOk || hasMissing) {
      const missing = hasMissing ? `missingTags=${data.missingTags?.join(',')}` : undefined;
      const reason = [data.apiResultMessage, missing].filter(Boolean).join(' / ');
      return {
        tone: 'warning' as const,
        message: `${apiResultLabel} / ${reason || '収納情報の取得に警告'}`,
      };
    }
    if (data.entries.length === 0) {
      return { tone: 'warning' as const, message: `${apiResultLabel} / 収納情報が見つかりません。` };
    }
    return { tone: 'success' as const, message: `${apiResultLabel} / 収納情報の取得に成功` };
  }, [incomeInfoQuery.data, incomeInfoQuery.isError, patientId]);
  const resolvedIncomeTone = incomeInfoNotice?.tone === 'success' ? 'info' : incomeInfoNotice?.tone;

  const summaryMessage = useMemo(() => {
    if (resolvedMissingMaster) {
      return `${sharedMessage} OrcaSummary は再取得完了まで tone=server を維持します。`;
    }
    if (resolvedFallbackUsed) {
      return `${sharedMessage} 請求バンドルは fallbackUsed=true のため暫定表示です。再取得または ORCA 再送を検討してください。`;
    }
    if (fallbackFlagMissing) {
      return `${sharedMessage} fallbackUsed フラグが欠落しています。サーバー応答にフラグを含めてください。`;
    }
    if (resolvedCacheHit) {
      return `${sharedMessage} ORCA 再送は Info tone で提示し、${transitionMeta.label} を記録します。`;
    }
    return `${sharedMessage} ${transitionMeta.label} を監査ログへ再送出します。`;
  }, [resolvedCacheHit, resolvedFallbackUsed, fallbackFlagMissing, resolvedMissingMaster, sharedMessage, transitionMeta.label]);

  const payloadPreview = useMemo(() => {
    if (!summary?.payload) return null;
    const entries = Object.entries(summary.payload).slice(0, 4);
    return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' ｜ ');
  }, [summary?.payload]);

  const claimBundles = claim?.bundles ?? [];
  const claimTotal = useMemo(
    () =>
      claimBundles.reduce((acc, bundle) => {
        if (typeof bundle.totalClaimAmount === 'number') return acc + bundle.totalClaimAmount;
        const itemSum = bundle.items?.reduce((sum, item) => sum + (item.amount ?? 0), 0) ?? 0;
        return acc + itemSum;
      }, 0),
    [claimBundles],
  );
  const appointmentList = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => (a.appointmentTime ?? '').localeCompare(b.appointmentTime ?? ''));
    return sorted.slice(0, 3);
  }, [appointments]);
  const hasAppointmentCollision = useMemo(() => {
    const seen = new Set<string>();
    return appointmentList.some((entry) => {
      const key = `${entry.appointmentTime ?? ''}-${entry.department ?? ''}`;
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
  }, [appointmentList]);

  const incomeEntries = incomeInfoQuery.data?.entries ?? [];
  const paidInvoiceNumbers = useMemo(() => {
    const numbers = incomeEntries.map((entry) => entry.invoiceNumber).filter((value): value is string => Boolean(value));
    return new Set(numbers);
  }, [incomeEntries]);
  const incomePreview = incomeEntries.slice(0, 3);
  const incomeLatest = useMemo(() => {
    if (incomeEntries.length === 0) return undefined;
    return [...incomeEntries].sort((a, b) => (b.performDate ?? '').localeCompare(a.performDate ?? ''))[0];
  }, [incomeEntries]);
  const incomeStatusLabel = useMemo(() => {
    if (!patientId) return '患者未選択';
    if (incomeEntries.length === 0) return 'データなし';
    return null;
  }, [incomeEntries.length, patientId]);
  const incomeTotals = useMemo(() => {
    const totals = incomeEntries.reduce(
      (acc, entry) => {
        acc.unpaid += entry.aiMoney ?? 0;
        acc.paid += entry.oeMoney ?? 0;
        acc.window += entry.acMoney ?? 0;
        return acc;
      },
      { unpaid: 0, paid: 0, window: 0 },
    );
    return totals;
  }, [incomeEntries]);

  const ctaDisabledReason = resolvedFallbackUsed ? 'fallback_used' : resolvedMissingMaster ? 'missing_master' : undefined;
  const isCtaDisabled = Boolean(ctaDisabledReason);
  const invoiceNumber = claim?.invoiceNumber ?? lastSendCache?.invoiceNumber;
  const billingDecision = useMemo(
    () => resolveBillingStatusFromInvoice(invoiceNumber, paidInvoiceNumbers),
    [invoiceNumber, paidInvoiceNumbers],
  );
  const displayClaimStatus = billingDecision.status ?? claim?.claimStatus;
  const billingStatusRef = useRef<string | undefined>(undefined);
  const incomeRefreshCompletedAtRef = useRef<number | null>(null);

  const handleNavigate = useCallback(
    (target: 'reservation' | 'billing' | 'new-appointment') => {
      const search = new URLSearchParams();
      search.set('from', 'charts');
      search.set('runId', resolvedRunId ?? '');
      search.set('transition', resolvedTransition ?? 'snapshot');
      if (target === 'reservation') search.set('section', 'appointment');
      if (target === 'billing') search.set('section', 'billing');
      if (target === 'new-appointment') search.set('create', '1');
      navigate(`${buildFacilityPath(session?.facilityId, '/reception')}?${search.toString()}`, {
        state: { runId: resolvedRunId, dataSourceTransition: resolvedTransition, from: 'charts', manualRefresh: false },
      });
      logUiState({
        action: 'outpatient_fetch',
        screen: 'charts/orca-summary',
        controlId: `navigate-${target}`,
        runId: resolvedRunId,
        cacheHit: resolvedCacheHit,
        missingMaster: resolvedMissingMaster,
        dataSourceTransition: resolvedTransition,
        fallbackUsed: resolvedFallbackUsed,
        details: { target, dataSourceTransition: resolvedTransition },
      });
      recordOutpatientFunnel('orca_summary', {
        action: `navigate_${target}`,
        outcome: 'success',
        cacheHit: resolvedCacheHit ?? false,
        missingMaster: resolvedMissingMaster ?? false,
        dataSourceTransition: resolvedTransition ?? 'snapshot',
        fallbackUsed: resolvedFallbackUsed ?? false,
        runId: resolvedRunId,
        note: `cta:${target}`,
      });
    },
    [
      navigate,
      resolvedCacheHit,
      resolvedFallbackUsed,
      resolvedMissingMaster,
      resolvedRunId,
      resolvedTransition,
      session?.facilityId,
    ],
  );

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    logUiState({
      action: 'outpatient_fetch',
      screen: 'charts/orca-summary',
      controlId: 'refresh',
      runId: resolvedRunId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      dataSourceTransition: resolvedTransition,
      fallbackUsed: resolvedFallbackUsed,
      details: { manualRefresh: true },
    });
    const started = performance.now();
    recordOutpatientFunnel('orca_summary', {
      action: 'manual_refresh',
      outcome: 'started',
      cacheHit: resolvedCacheHit ?? false,
      missingMaster: resolvedMissingMaster ?? false,
      dataSourceTransition: resolvedTransition ?? 'snapshot',
      fallbackUsed: resolvedFallbackUsed ?? false,
      runId: resolvedRunId,
    });
    try {
      await onRefresh();
      recordOutpatientFunnel('orca_summary', {
        action: 'manual_refresh',
        outcome: 'success',
        cacheHit: resolvedCacheHit ?? false,
        missingMaster: resolvedMissingMaster ?? false,
        dataSourceTransition: resolvedTransition ?? 'snapshot',
        fallbackUsed: resolvedFallbackUsed ?? false,
        runId: resolvedRunId,
        durationMs: Math.round(performance.now() - started),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      recordOutpatientFunnel('orca_summary', {
        action: 'manual_refresh',
        outcome: 'error',
        cacheHit: resolvedCacheHit ?? false,
        missingMaster: resolvedMissingMaster ?? false,
        dataSourceTransition: resolvedTransition ?? 'snapshot',
        fallbackUsed: resolvedFallbackUsed ?? false,
        runId: resolvedRunId,
        note: reason,
        reason,
      });
    }
  }, [
    onRefresh,
    resolvedCacheHit,
    resolvedFallbackUsed,
    resolvedMissingMaster,
    resolvedRunId,
    resolvedTransition,
  ]);

  const handleIncomeRefresh = useCallback(async () => {
    if (!patientId) return;
    const started = performance.now();
    recordOutpatientFunnel('orca_summary', {
      action: 'income_refresh',
      outcome: 'started',
      cacheHit: resolvedCacheHit ?? false,
      missingMaster: resolvedMissingMaster ?? false,
      dataSourceTransition: resolvedTransition ?? 'snapshot',
      fallbackUsed: resolvedFallbackUsed ?? false,
      runId: resolvedRunId,
    });
    try {
      await incomeInfoQuery.refetch();
      incomeRefreshCompletedAtRef.current = performance.now();
      recordOutpatientFunnel('orca_summary', {
        action: 'income_refresh',
        outcome: 'success',
        cacheHit: resolvedCacheHit ?? false,
        missingMaster: resolvedMissingMaster ?? false,
        dataSourceTransition: resolvedTransition ?? 'snapshot',
        fallbackUsed: resolvedFallbackUsed ?? false,
        runId: resolvedRunId,
        durationMs: Math.round(performance.now() - started),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      recordOutpatientFunnel('orca_summary', {
        action: 'income_refresh',
        outcome: 'error',
        cacheHit: resolvedCacheHit ?? false,
        missingMaster: resolvedMissingMaster ?? false,
        dataSourceTransition: resolvedTransition ?? 'snapshot',
        fallbackUsed: resolvedFallbackUsed ?? false,
        runId: resolvedRunId,
        note: reason,
        reason,
      });
    }
  }, [
    incomeInfoQuery,
    patientId,
    resolvedCacheHit,
    resolvedFallbackUsed,
    resolvedMissingMaster,
    resolvedRunId,
    resolvedTransition,
  ]);

  useEffect(() => {
    if (perfMeasured) return;
    if (!summary && !claim) return;
    setPerfMeasured(true);
    recordOutpatientFunnel('orca_summary', {
      action: 'render',
      outcome: 'success',
      durationMs: Math.round(performance.now() - renderStartedAt),
      cacheHit: resolvedCacheHit ?? false,
      missingMaster: resolvedMissingMaster ?? false,
      dataSourceTransition: resolvedTransition ?? 'snapshot',
      fallbackUsed: resolvedFallbackUsed ?? false,
      runId: resolvedRunId,
    });
  }, [
    claim,
    perfMeasured,
    renderStartedAt,
    resolvedCacheHit,
    resolvedFallbackUsed,
    resolvedMissingMaster,
    resolvedRunId,
    resolvedTransition,
    summary,
  ]);

  useEffect(() => {
    if (!patientId || !incomeInfoQuery.data?.ok) return;
    const invoiceNumbers = incomeEntries
      .map((entry) => entry.invoiceNumber)
      .filter((value): value is string => Boolean(value));
    saveOrcaIncomeInfoCache(
      {
        patientId,
        performMonth,
        invoiceNumbers,
        fetchedAt: new Date().toISOString(),
        apiResult: incomeInfoQuery.data.apiResult,
        apiResultMessage: incomeInfoQuery.data.apiResultMessage,
      },
      { facilityId: session?.facilityId, userId: session?.userId },
    );
  }, [
    incomeEntries,
    incomeInfoQuery.data?.apiResult,
    incomeInfoQuery.data?.apiResultMessage,
    incomeInfoQuery.data?.ok,
    patientId,
    performMonth,
    session?.facilityId,
    session?.userId,
  ]);

  useEffect(() => {
    if (!patientId || !invoiceNumber || !billingDecision.status) return;
    if (incomeRefreshCompletedAtRef.current) return;
    if (billingStatusRef.current === billingDecision.status) return;
    billingStatusRef.current = billingDecision.status;
    logAuditEvent({
      runId: resolvedRunId,
      source: 'charts/orca-summary',
      patientId,
      payload: buildBillingStatusUpdateAudit({
        status: billingDecision.status,
        invoiceNumber,
        performMonth,
        apiResult: incomeInfoQuery.data?.apiResult,
        apiResultMessage: incomeInfoQuery.data?.apiResultMessage,
        fetchedAt: incomeInfoQuery.data?.informationDate,
      }),
    });
  }, [
    billingDecision.status,
    incomeInfoQuery.data?.apiResult,
    incomeInfoQuery.data?.apiResultMessage,
    incomeInfoQuery.data?.informationDate,
    invoiceNumber,
    patientId,
    performMonth,
    resolvedRunId,
  ]);

  useEffect(() => {
    const completedAt = incomeRefreshCompletedAtRef.current;
    if (!completedAt) return;
    const durationMs = resolveBillingStatusUpdateDurationMs(completedAt, performance.now());
    incomeRefreshCompletedAtRef.current = null;
    if (durationMs === undefined) return;
    recordOutpatientFunnel('orca_summary', {
      action: 'billing_status_update',
      outcome: 'success',
      cacheHit: resolvedCacheHit ?? false,
      missingMaster: resolvedMissingMaster ?? false,
      dataSourceTransition: resolvedTransition ?? 'snapshot',
      fallbackUsed: resolvedFallbackUsed ?? false,
      runId: resolvedRunId,
      durationMs,
      note: displayClaimStatus ?? billingDecision.status ?? 'unknown',
    });
    logAuditEvent({
      runId: resolvedRunId,
      source: 'charts/orca-summary',
      patientId,
      payload: buildBillingStatusUpdateAudit({
        status: displayClaimStatus ?? billingDecision.status,
        invoiceNumber,
        performMonth,
        apiResult: incomeInfoQuery.data?.apiResult,
        apiResultMessage: incomeInfoQuery.data?.apiResultMessage,
        fetchedAt: incomeInfoQuery.data?.informationDate,
        durationMs,
      }),
    });
  }, [
    billingDecision.status,
    displayClaimStatus,
    incomeInfoQuery.data?.apiResult,
    incomeInfoQuery.data?.apiResultMessage,
    incomeInfoQuery.data?.informationDate,
    incomeInfoQuery.dataUpdatedAt,
    invoiceNumber,
    patientId,
    performMonth,
    resolvedCacheHit,
    resolvedFallbackUsed,
    resolvedMissingMaster,
    resolvedRunId,
    resolvedTransition,
  ]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        void handleRefresh();
      }
      if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        handleNavigate('billing');
      }
      if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        handleNavigate('reservation');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNavigate, handleRefresh]);

  return (
    <section
      className="orca-summary"
      id="charts-orca-summary"
      tabIndex={-1}
      data-focus-anchor="true"
      data-run-id={resolvedRunId}
      data-loading-scope="orca-summary"
      data-test-id="orca-summary"
    >
      <ToneBanner
        tone={tone}
        message={summaryMessage}
        destination="ORCA master"
        runId={resolvedRunId}
        ariaLive={tone === 'info' ? 'polite' : 'assertive'}
      />
      <div className="orca-summary__details">
        <div className="orca-summary__meta">
          <p className="orca-summary__meta-label">dataSourceTransition</p>
          <strong>{transitionCopy.headline}</strong>
          <p>{transitionCopy.body}</p>
          <p className="orca-summary__meta-label">recordsReturned</p>
          <strong>{summary?.recordsReturned ?? claim?.recordsReturned ?? '―'}</strong>
          <p className="orca-summary__meta-label">outcome</p>
          <strong>{summary?.outcome ?? '―'}</strong>
          {summary?.fetchedAt && <p className="orca-summary__meta-note">取得: {summary.fetchedAt}</p>}
          {claim?.fetchedAt && !summary?.fetchedAt && <p className="orca-summary__meta-note">請求取得: {claim.fetchedAt}</p>}
          {summary?.requestId && <p className="orca-summary__meta-note">requestId: {summary.requestId}</p>}
          {summary?.note && <p className="orca-summary__meta-note">メッセージ: {summary.note}</p>}
          {claim?.claimStatus && (
            <p className="orca-summary__meta-note">請求ステータス: {claim.claimStatus}（{claim.claimStatusText ?? 'textなし'}）</p>
          )}
          {claim?.bundles && claim.bundles.length > 0 && (
            <p className="orca-summary__meta-note">請求バンドル件数: {claim.bundles.length}</p>
          )}
        </div>
        <div className="orca-summary__badges">
          <StatusBadge
            label="missingMaster"
            value={resolvedMissingMaster ? 'true' : 'false'}
            tone={resolvedMissingMaster ? 'warning' : 'success'}
            description={resolvedMissingMaster ? 'マスタ未取得で再送停止' : 'マスタ取得済みで ORCA 再送可能'}
            ariaLive="off"
            runId={resolvedRunId}
          />
          <StatusBadge
            label="cacheHit"
            value={resolvedCacheHit ? 'true' : 'false'}
            tone={resolvedCacheHit ? 'success' : 'warning'}
            description={resolvedCacheHit ? 'マスタキャッシュ命中' : 'キャッシュを使えず再取得を試行'}
            ariaLive="off"
            runId={resolvedRunId}
          />
          <StatusBadge
            label="fallbackUsed"
            value={resolvedFallbackUsed ? 'true' : 'false'}
            tone={resolvedFallbackUsed ? 'error' : 'info'}
            description={resolvedFallbackUsed ? 'fallbackUsed=true ｜ snapshot/fallback データで処理中' : 'fallback 未使用'}
            ariaLive="off"
            runId={resolvedRunId}
          />
          {fallbackFlagMissing && (
            <StatusBadge
              label="fallbackFlagMissing"
              value="true"
              tone="warning"
              description="API 応答に fallbackUsed が含まれていません"
              ariaLive="off"
              runId={resolvedRunId}
            />
          )}
        </div>
      </div>
      <div className="orca-summary__cards" aria-live="off">
        <div className="orca-summary__card">
          <header>
            <strong>請求サマリ</strong>
            <span className="orca-summary__card-meta">status: {displayClaimStatus ?? '—'}</span>
          </header>
          <ul>
            <li>総額: {claimTotal > 0 ? `${claimTotal.toLocaleString()} 円` : '—'}</li>
            <li>請求件数: {claimBundles.length} 件</li>
            <li>ステータス: {billingDecision.statusText ?? claim?.claimStatusText ?? '—'}</li>
            <li>recordsReturned: {claim?.recordsReturned ?? summary?.recordsReturned ?? '—'}</li>
            {(invoiceNumber || claim?.invoiceNumber) && <li>伝票番号: {invoiceNumber ?? claim?.invoiceNumber}</li>}
            {claim?.dataId && <li>Data_Id: {claim.dataId}</li>}
            {lastSendCache?.sendStatus && (
              <li>ORCA送信: {lastSendCache.sendStatus === 'success' ? '成功' : '失敗'}</li>
            )}
            {!claim?.invoiceNumber && lastSendCache?.invoiceNumber && (
              <li>直近送信: 伝票 {lastSendCache.invoiceNumber}（runId={lastSendCache.runId ?? '—'}）</li>
            )}
            {!claim?.dataId && lastSendCache?.dataId && (
              <li>直近送信: Data_Id {lastSendCache.dataId}（runId={lastSendCache.runId ?? '—'}）</li>
            )}
          </ul>
        </div>
        <div className="orca-summary__card">
          <header>
            <strong>予約サマリ (直近3件)</strong>
          </header>
          {appointmentList.length === 0 && <p>予約データを取得中または未取得です。</p>}
          {appointmentList.length > 0 && (
            <ul>
              {appointmentList.map((entry) => (
                <li key={`${entry.appointmentId ?? entry.patientId ?? entry.appointmentTime ?? Math.random()}`}>
                  {entry.appointmentTime ?? '--:--'} ｜ {entry.department ?? '科未設定'} ｜ {entry.status} ｜ {entry.name ?? '氏名未設定'}
                </li>
              ))}
            </ul>
          )}
          {hasAppointmentCollision && (
            <p
              className="orca-summary__warning"
              data-test-id="orca-summary-warning"
              role="alert"
              aria-live={resolveAriaLive('warning')}
            >
              予約時間が重複しています。オーバーブッキングに注意してください。
            </p>
          )}
        </div>
        <div className="orca-summary__card">
          <header>
            <strong>収納情報</strong>
            <span className="orca-summary__card-meta">対象月: {performMonth}（確認用のみ）</span>
          </header>
          <button
            type="button"
            onClick={handleIncomeRefresh}
            disabled={!patientId || incomeInfoQuery.isFetching}
            data-disabled-reason={!patientId ? 'no-patient' : incomeInfoQuery.isFetching ? 'loading' : undefined}
          >
            {incomeInfoQuery.isFetching ? '収納情報確認中…' : '収納情報を確認'}
          </button>
          {incomeInfoNotice ? (
            <ToneBanner
              tone={resolvedIncomeTone ?? 'info'}
              message={incomeInfoNotice.message}
              destination="incomeinfv2"
              runId={resolvedRunId}
              ariaLive={resolveAriaLive(resolvedIncomeTone ?? 'info')}
            />
          ) : null}
          <div className="orca-summary__income-highlight">
            <div>
              <span className="orca-summary__label">最新収納</span>
              <strong>
                {incomeStatusLabel
                  ? incomeStatusLabel
                  : incomeLatest
                  ? `${incomeLatest.performDate ?? '日付不明'} ／ ${incomeLatest.departmentName ?? '科未設定'}`
                  : '—'}
              </strong>
            </div>
            <div>
              <span className="orca-summary__label">金額</span>
              <strong>{incomeLatest?.oeMoney !== undefined ? `${incomeLatest.oeMoney.toLocaleString()} 円` : '—'}</strong>
            </div>
          </div>
          <ul>
            <li>Api_Result: {incomeInfoQuery.data?.apiResult ?? '—'}</li>
            <li>件数: {incomeEntries.length} 件</li>
            <li>
              取得: {incomeInfoQuery.data?.informationDate ?? '—'} {incomeInfoQuery.data?.informationTime ?? ''}
            </li>
          </ul>
          <div className="orca-summary__income-summary">
            <div>
              <span className="orca-summary__label">未収合計</span>
              <strong>{incomeEntries.length > 0 ? `${incomeTotals.unpaid.toLocaleString()} 円` : '—'}</strong>
            </div>
            <div>
              <span className="orca-summary__label">入金合計</span>
              <strong>{incomeEntries.length > 0 ? `${incomeTotals.paid.toLocaleString()} 円` : '—'}</strong>
            </div>
          </div>
          {incomePreview.length > 0 && (
            <ul>
              {incomePreview.map((entry, index) => (
                <li key={`${entry.invoiceNumber ?? 'invoice'}-${index}`}>
                  {entry.performDate ?? '日付不明'} ｜ {entry.departmentName ?? '科未設定'} ｜ 入金: {entry.oeMoney?.toLocaleString() ?? '—'} 円
                </li>
              ))}
            </ul>
          )}
        </div>
        {(resolvedFallbackUsed || resolvedMissingMaster || hasAppointmentCollision) && (
          <div
            className="orca-summary__card orca-summary__card--warning"
            role="alert"
            aria-live={resolveAriaLive('warning')}
            data-test-id="orca-summary-warning"
          >
            <strong>注意</strong>
            <ul>
              {resolvedFallbackUsed && <li>計算は暫定（fallbackUsed=true）。会計/予約確定をブロックしています。</li>}
              {resolvedMissingMaster && <li>マスタ未取得のため送信を停止中。再取得してください。</li>}
              {hasAppointmentCollision && <li>予約衝突あり。日付・時間を確認してください。</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="orca-summary__cta" role="group" aria-label="OrcaSummary アクション">
        <button
          type="button"
          onClick={() => handleNavigate('reservation')}
          disabled={isCtaDisabled}
          data-disabled-reason={ctaDisabledReason}
        >
          予約へ
        </button>
        <button type="button" onClick={() => handleNavigate('billing')} disabled={isCtaDisabled} data-disabled-reason={ctaDisabledReason}>
          会計へ
        </button>
        <button type="button" onClick={handleRefresh} disabled={isRefreshing} data-disabled-reason={isRefreshing ? 'loading' : undefined}>
          {isRefreshing ? '再取得中…' : '再取得'}
        </button>
        <button
          type="button"
          onClick={() => handleNavigate('new-appointment')}
          disabled={isCtaDisabled}
          data-disabled-reason={ctaDisabledReason}
        >
          新規予約
        </button>
      </div>
      {payloadPreview && (
        <div className="orca-summary__payload" aria-live="off">
          <strong>応答プレビュー</strong>
          <p>{payloadPreview}</p>
        </div>
      )}
    </section>
  );
}
