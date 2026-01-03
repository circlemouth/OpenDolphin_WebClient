import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, getTransitionCopy, type ChartTonePayload } from '../../ux/charts/tones';
import { resolveAriaLive, resolveRunId } from '../../libs/observability/observability';
import type { OrcaOutpatientSummary } from './api';
import type { ClaimOutpatientPayload, ReceptionEntry } from '../outpatient/types';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { logUiState } from '../../libs/audit/auditLogger';
import { resolveOutpatientFlags, type OutpatientFlagSource } from '../outpatient/flags';
import { buildFacilityPath } from '../../routes/facilityRoutes';
import { useOptionalSession } from '../../AppRouter';

export interface OrcaSummaryProps {
  summary?: OrcaOutpatientSummary;
  claim?: ClaimOutpatientPayload;
  appointments?: ReceptionEntry[];
  appointmentMeta?: OutpatientFlagSource;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
}

export function OrcaSummary({
  summary,
  claim,
  appointments = [],
  appointmentMeta,
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
  const tonePayload: ChartTonePayload = {
    missingMaster: resolvedMissingMaster ?? false,
    cacheHit: resolvedCacheHit ?? false,
    dataSourceTransition: resolvedTransition ?? 'snapshot',
  };
  const { tone, message: sharedMessage, transitionMeta } = getChartToneDetails(tonePayload);
  const transitionCopy = getTransitionCopy(resolvedTransition ?? 'snapshot');

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

  const ctaDisabledReason = resolvedFallbackUsed ? 'fallback_used' : resolvedMissingMaster ? 'missing_master' : undefined;
  const isCtaDisabled = Boolean(ctaDisabledReason);

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
  }, [onRefresh, resolvedCacheHit, resolvedFallbackUsed, resolvedMissingMaster, resolvedRunId, resolvedTransition]);

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
            <span className="orca-summary__card-meta">status: {claim?.claimStatus ?? '—'}</span>
          </header>
          <ul>
            <li>総額: {claimTotal > 0 ? `${claimTotal.toLocaleString()} 円` : '—'}</li>
            <li>請求件数: {claimBundles.length} 件</li>
            <li>ステータス: {claim?.claimStatusText ?? '—'}</li>
            <li>recordsReturned: {claim?.recordsReturned ?? summary?.recordsReturned ?? '—'}</li>
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
