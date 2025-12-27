import { useCallback, useEffect, useMemo, useState } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { ApiFailureBanner } from '../shared/ApiFailureBanner';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { ReceptionEntry, ReceptionStatus } from '../reception/api';
import type { ClaimOutpatientPayload, ClaimBundle, ClaimBundleStatus } from '../outpatient/types';
import type { AppointmentDataBanner } from '../outpatient/appointmentDataBanner';
import type { OrcaQueueEntry, OrcaQueueResponse } from '../outpatient/orcaQueueApi';
import { resolveOrcaSendStatus } from '../outpatient/orcaQueueStatus';
import { resolveOutpatientFlags } from '../outpatient/flags';

export interface DocumentTimelineProps {
  entries?: ReceptionEntry[];
  appointmentBanner?: AppointmentDataBanner | null;
  auditEvent?: Record<string, unknown>;
  selectedPatientId?: string;
  selectedAppointmentId?: string;
  selectedReceptionId?: string;
  claimData?: ClaimOutpatientPayload;
  claimError?: Error;
  isClaimLoading?: boolean;
  orcaQueue?: OrcaQueueResponse;
  orcaQueueUpdatedAt?: number;
  isOrcaQueueLoading?: boolean;
  orcaQueueError?: Error;
  recordsReturned?: number;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  isInitialLoading?: boolean;
  pageSize?: number;
  isRefetchingList?: boolean;
  onRetryClaim?: () => void;
}

const STATUS_ORDER: ReceptionStatus[] = ['受付中', '診療中', '会計待ち', '会計済み', '予約'];

const VIRTUAL_WINDOW = 32;

const resolveReceptionStatusFromClaim = (status?: ClaimBundleStatus): ReceptionStatus | undefined => {
  if (status === '会計待ち' || status === '会計済み') return status;
  if (status === '診療中') return '診療中';
  if (status === '受付中') return '受付中';
  if (status === '予約') return '予約';
  return undefined;
};

const pickClaimBundleForEntry = (entry: ReceptionEntry, bundles: ClaimBundle[]) =>
  bundles.find(
    (bundle) =>
      (entry.patientId && bundle.patientId === entry.patientId) ||
      (entry.appointmentId && bundle.appointmentId === entry.appointmentId),
  );

type QueuePhase = 'ok' | 'retrying' | 'holding' | 'error' | 'pending';

type OrcaQueueCounts = {
  waiting: number;
  processing: number;
  success: number;
  failure: number;
  unknown: number;
  stalled: number;
};

const resolveQueuePhase = (options: {
  missingMaster?: boolean;
  isClaimLoading?: boolean;
  claimError?: Error;
  fallbackUsed?: boolean;
  cacheHit?: boolean;
}): QueuePhase => {
  if (options.claimError) return 'error';
  if (options.missingMaster) return 'holding';
  if (options.isClaimLoading) return 'retrying';
  if (options.fallbackUsed === true || options.cacheHit === false) return 'pending';
  return 'ok';
};

const buildOrcaQueueCounts = (queue: OrcaQueueEntry[]): OrcaQueueCounts => {
  const counts: OrcaQueueCounts = {
    waiting: 0,
    processing: 0,
    success: 0,
    failure: 0,
    unknown: 0,
    stalled: 0,
  };

  for (const entry of queue) {
    const status = resolveOrcaSendStatus(entry);
    if (!status) {
      counts.unknown += 1;
      continue;
    }
    counts[status.key] += 1;
    if (status.isStalled) counts.stalled += 1;
  }

  return counts;
};

const deriveNextAction = (
  status: ReceptionStatus,
  queuePhase: QueuePhase,
  missingMaster?: boolean,
  sendStatus?: ReturnType<typeof resolveOrcaSendStatus>,
): string => {
  if (missingMaster) return 'マスタ再取得を完了してから ORCA 再送を実行';
  if (sendStatus?.key === 'failure') return '送信失敗：エラー詳細を確認し、ORCA再送（Alt+S）';
  if (sendStatus?.key === 'waiting' || sendStatus?.key === 'processing') {
    return sendStatus.isStalled
      ? '送信が滞留：ORCA キューを確認し、必要なら再送（Alt+S）または設定確認'
      : '送信待ち/処理中：反映を確認してから会計へ進む';
  }
  if (queuePhase === 'error') return '請求キューを再取得し、失敗理由を確認';
  if (queuePhase === 'retrying') return '再取得完了まで待機し、結果を確認';
  if (queuePhase === 'pending') return 'ORCA キューへの反映を確認してから会計へ進む';
  switch (status) {
    case '受付中':
      return '診療開始を知らせ、受付情報を確定';
    case '診療中':
      return 'カルテ保存後に ORCA 送信を実行';
    case '会計待ち':
      return '請求金額を確認し会計へ進む';
    case '会計済み':
      return '記録を監査ログに同期し終了';
    case '予約':
      return '来院時に受付へ変換し、診療へ送る';
    default:
      return '状況を確認';
  }
};

export function DocumentTimeline({
  entries = [],
  appointmentBanner,
  auditEvent,
  selectedPatientId,
  selectedAppointmentId,
  selectedReceptionId,
  claimData,
  claimError,
  isClaimLoading,
  orcaQueue,
  orcaQueueUpdatedAt,
  isOrcaQueueLoading,
  orcaQueueError,
  recordsReturned,
  hasNextPage,
  onLoadMore,
  isLoadingMore,
  isInitialLoading,
  pageSize,
  isRefetchingList,
  onRetryClaim,
}: DocumentTimelineProps) {
  const { flags } = useAuthService();
  const resolvedFlags = resolveOutpatientFlags(claimData, flags);
  const resolvedRunId = resolvedFlags.runId ?? flags.runId;
  const resolvedMissingMaster = resolvedFlags.missingMaster ?? flags.missingMaster;
  const resolvedCacheHit = resolvedFlags.cacheHit ?? flags.cacheHit;
  const resolvedTransition = resolvedFlags.dataSourceTransition ?? flags.dataSourceTransition;
  const resolvedFallbackUsed = resolvedFlags.fallbackUsed ?? flags.fallbackUsed ?? false;
  const fallbackFlagMissing = resolvedFlags.fallbackFlagMissing ?? false;
  const tonePayload: ChartTonePayload = {
    missingMaster: resolvedMissingMaster ?? false,
    cacheHit: resolvedCacheHit ?? false,
    dataSourceTransition: resolvedTransition ?? 'snapshot',
  };

  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);
  const claimFetchedAt = claimData?.fetchedAt;
  const orcaQueueUpdatedAtLabel =
    typeof orcaQueueUpdatedAt === 'number' && orcaQueueUpdatedAt > 0 ? new Date(orcaQueueUpdatedAt).toISOString() : undefined;

  const auditSummary = useMemo(() => {
    if (!auditEvent) return null;
    const payload = auditEvent as Record<string, unknown>;
    const action = typeof payload.action === 'string' ? payload.action : 'AUDIT_EVENT';
    const outcome = typeof payload.outcome === 'string' ? payload.outcome : undefined;
    const details = (typeof payload.details === 'object' && payload.details !== null
      ? (payload.details as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const actor = typeof details.actor === 'string' ? details.actor : undefined;
    const note = typeof details.note === 'string' ? details.note : undefined;
    const lockExpiresAt = typeof details.lockExpiresAt === 'string' ? details.lockExpiresAt : undefined;

    const isConflict =
      action === 'CHARTS_EDIT_LOCK' ||
      action === 'CHARTS_CONFLICT' ||
      action === 'CHARTS_ACTION_FAILURE';
    const bannerTone = isConflict ? 'warning' : 'info';
    const message = [
      outcome ? `${action}(${outcome})` : action,
      actor ? `actor=${actor}` : undefined,
      note ? `note=${note}` : undefined,
      lockExpiresAt ? `lockExpiresAt=${lockExpiresAt}` : undefined,
    ]
      .filter((fragment): fragment is string => typeof fragment === 'string' && fragment.length > 0)
      .join(' ｜ ');

    return { tone: bannerTone as 'warning' | 'info', message };
  }, [auditEvent]);

  const claimBundles = claimData?.bundles ?? [];

  const queuePhase = resolveQueuePhase({
    missingMaster: resolvedMissingMaster,
    isClaimLoading,
    claimError,
    fallbackUsed: resolvedFallbackUsed,
    cacheHit: resolvedCacheHit,
  });

  const orcaQueueByPatientId = useMemo(() => {
    const map = new Map<string, OrcaQueueEntry>();
    const queue = orcaQueue?.queue ?? [];
    for (const entry of queue) {
      if (!entry?.patientId) continue;
      const prev = map.get(entry.patientId);
      if (!prev) {
        map.set(entry.patientId, entry);
        continue;
      }
      const prevAt = prev.lastDispatchAt ?? '';
      const nextAt = entry.lastDispatchAt ?? '';
      if (nextAt && (!prevAt || nextAt >= prevAt)) {
        map.set(entry.patientId, entry);
      }
    }
    return map;
  }, [orcaQueue?.queue]);

  const selectedSendStatus = useMemo(() => {
    if (!selectedPatientId) return undefined;
    return resolveOrcaSendStatus(orcaQueueByPatientId.get(selectedPatientId));
  }, [orcaQueueByPatientId, selectedPatientId]);

  const orcaQueueCounts = useMemo(() => buildOrcaQueueCounts([...orcaQueueByPatientId.values()]), [orcaQueueByPatientId]);

  const orcaQueueCountsTone = useMemo(() => {
    if (orcaQueueCounts.failure > 0) return 'error' as const;
    if (orcaQueueCounts.stalled > 0) return 'warning' as const;
    if (orcaQueueCounts.waiting > 0) return 'warning' as const;
    if (orcaQueueCounts.processing > 0) return 'info' as const;
    return 'success' as const;
  }, [orcaQueueCounts.failure, orcaQueueCounts.processing, orcaQueueCounts.stalled, orcaQueueCounts.waiting]);

  const entriesWithClaim = useMemo(() => {
    if (entries.length === 0) return [];
    if (claimBundles.length === 0) return entries;
    return entries.map((entry) => {
      const bundle = pickClaimBundleForEntry(entry, claimBundles);
      if (!bundle) return entry;
      const status = resolveReceptionStatusFromClaim(bundle.claimStatus);
      if (!status) return entry;
      return {
        ...entry,
        status,
        note: entry.note ?? bundle.claimStatusText ?? '請求処理中',
      };
    });
  }, [claimBundles, entries]);

  const rank: Record<ReceptionStatus, number> = useMemo(() => {
    return STATUS_ORDER.reduce<Record<ReceptionStatus, number>>((acc, status, idx) => {
      acc[status] = idx;
      return acc;
    }, {} as Record<ReceptionStatus, number>);
  }, []);

  const sortedEntries = useMemo(() => {
    if (entriesWithClaim.length === 0) return [] as ReceptionEntry[];
    return [...entriesWithClaim].sort((a, b) => {
      const left = rank[a.status] ?? 99;
      const right = rank[b.status] ?? 99;
      if (left !== right) return left - right;
      return (a.appointmentTime ?? '').localeCompare(b.appointmentTime ?? '');
    });
  }, [entriesWithClaim, rank]);

  const [windowStart, setWindowStart] = useState(0);
  const [windowSize, setWindowSize] = useState(VIRTUAL_WINDOW);
  const totalEntries = sortedEntries.length;

  const selectedIndex = useMemo(() =>
    sortedEntries.findIndex(
      (entry) =>
        (selectedReceptionId && entry.receptionId === selectedReceptionId) ||
        (selectedAppointmentId && entry.appointmentId === selectedAppointmentId) ||
        (selectedPatientId && entry.patientId === selectedPatientId),
    ),
  [selectedAppointmentId, selectedPatientId, selectedReceptionId, sortedEntries]);

  const selectedEntry = useMemo(() => {
    if (selectedIndex < 0) return undefined;
    return sortedEntries[selectedIndex];
  }, [selectedIndex, sortedEntries]);

  useEffect(() => {
    if (selectedIndex < 0) return;
    if (selectedIndex < windowStart || selectedIndex >= windowStart + windowSize) {
      const centeredStart = Math.max(0, selectedIndex - Math.floor(windowSize / 2));
      setWindowStart(centeredStart);
    }
  }, [selectedIndex, windowSize, windowStart]);

  useEffect(() => {
    if (totalEntries === 0) {
      setWindowStart(0);
      return;
    }
    if (windowStart >= totalEntries) {
      setWindowStart(Math.max(0, totalEntries - windowSize));
    }
  }, [totalEntries, windowSize, windowStart]);

  const windowedEntries = useMemo(() => {
    if (totalEntries === 0) return [] as ReceptionEntry[];
    if (totalEntries <= windowSize) return sortedEntries;
    return sortedEntries.slice(windowStart, windowStart + windowSize);
  }, [sortedEntries, totalEntries, windowSize, windowStart]);

  const groupedEntries = useMemo(() =>
    STATUS_ORDER.map((status) => ({
      status,
      items: windowedEntries.filter((entry) => entry.status === status),
      total: sortedEntries.filter((entry) => entry.status === status).length,
    })).filter((section) => section.items.length > 0 || section.total > 0),
  [sortedEntries, windowedEntries]);

  const [collapsedSections, setCollapsedSections] = useState<Partial<Record<ReceptionStatus, boolean>>>({});

  const toggleSection = useCallback((status: ReceptionStatus) => {
    setCollapsedSections((prev) => ({ ...prev, [status]: !prev[status] }));
  }, []);

  const sectionLogs = useMemo(() => {
    const selectedBundle = selectedEntry ? pickClaimBundleForEntry(selectedEntry, claimBundles) : undefined;
    const planDetail = selectedEntry
      ? deriveNextAction(selectedEntry.status, queuePhase, resolvedMissingMaster, selectedSendStatus)
      : '次にやることを待機中';
    const assessmentDetail = auditSummary?.message ?? '監査ログ未取得';
    const objectiveDetail = selectedBundle?.claimStatusText ?? selectedBundle?.claimStatus ?? selectedEntry?.status ?? '状態未取得';
    const subjectDetail = [
      selectedEntry?.department ? `診療科: ${selectedEntry.department}` : '診療科未指定',
      selectedEntry?.physician ? `担当: ${selectedEntry.physician}` : '担当未指定',
    ].join(' ｜ ');
    const appointmentMeta = selectedEntry?.appointmentTime ? `受付: ${selectedEntry.appointmentTime}` : '受付時刻未取得';
    const receptionMeta = selectedEntry?.receptionId ? `受付ID: ${selectedEntry.receptionId}` : undefined;
    const visitMeta = selectedEntry?.visitDate ? `診療日: ${selectedEntry.visitDate}` : undefined;
    const claimMeta = claimFetchedAt ? `claim更新: ${claimFetchedAt}` : 'claim更新: 未取得';
    const orcaMeta = orcaQueueUpdatedAtLabel ? `ORCA更新: ${orcaQueueUpdatedAtLabel}` : 'ORCA更新: 未取得';

    return [
      {
        key: 'free',
        label: 'Free',
        body: selectedEntry?.note ?? '記載なし',
        meta: appointmentMeta,
        tone: resolvedMissingMaster ? 'warning' : 'neutral',
      },
      {
        key: 'subjective',
        label: 'Subjective',
        body: subjectDetail,
        meta: visitMeta,
        tone: resolvedMissingMaster ? 'warning' : 'neutral',
      },
      {
        key: 'objective',
        label: 'Objective',
        body: `状態: ${objectiveDetail}`,
        meta: receptionMeta ?? claimMeta,
        tone: queuePhase === 'error' ? 'error' : 'neutral',
      },
      {
        key: 'assessment',
        label: 'Assessment',
        body: assessmentDetail,
        meta: `${claimMeta} ｜ ${orcaMeta}`,
        tone: resolvedMissingMaster ? 'warning' : 'neutral',
      },
      {
        key: 'plan',
        label: 'Plan',
        body: planDetail,
        meta: selectedSendStatus?.label ? `ORCA送信: ${selectedSendStatus.label}` : orcaMeta,
        tone: queuePhase === 'error' ? 'error' : 'info',
      },
    ];
  }, [
    auditSummary?.message,
    claimBundles,
    claimFetchedAt,
    orcaQueueUpdatedAtLabel,
    queuePhase,
    resolvedMissingMaster,
    selectedEntry,
    selectedSendStatus,
  ]);

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
      <div key={section.status} className="document-timeline__section" data-total-count={section.total}>
        <div className="document-timeline__section-header">
          <div className="document-timeline__section-labels">
            <span className="document-timeline__section-badge">{section.status}</span>
            <span className="document-timeline__section-count">
              表示 {section.items.length} / 全 {section.total} 件
            </span>
          </div>
          <button
            className="document-timeline__toggle"
            type="button"
            onClick={() => toggleSection(section.status)}
            aria-expanded={!collapsedSections[section.status]}
          >
            {collapsedSections[section.status] ? '展開' : '折りたたむ'}
          </button>
        </div>
        {!collapsedSections[section.status] &&
          section.items.map((entry) => {
            const isSelected =
              (selectedReceptionId && entry.receptionId === selectedReceptionId) ||
              (selectedPatientId && entry.patientId === selectedPatientId) ||
              (selectedAppointmentId && entry.appointmentId === selectedAppointmentId);
            const shouldHighlight = resolvedMissingMaster || isSelected;
            const bundle = pickClaimBundleForEntry(entry, claimBundles);
            const sendStatus = resolveOrcaSendStatus(entry.patientId ? orcaQueueByPatientId.get(entry.patientId) : undefined);
            const nextAction = deriveNextAction(entry.status, queuePhase, resolvedMissingMaster, sendStatus);
            const bundleStatus = bundle?.claimStatus ?? '診療中';
            const queueStepStatus: Record<'受付' | '診療' | '会計', 'done' | 'active' | 'blocked' | 'pending'> = {
              受付: entry.status === '予約' ? 'pending' : 'done',
              診療:
                entry.status === '予約' || entry.status === '受付中'
                  ? 'pending'
                  : entry.status === '診療中'
                    ? 'active'
                    : 'done',
              会計:
                entry.status === '会計済み'
                  ? 'done'
                  : entry.status === '会計待ち'
                    ? 'active'
                    : sendStatus?.key === 'failure' || queuePhase === 'error' || queuePhase === 'holding'
                      ? 'blocked'
                      : sendStatus?.key === 'waiting' || sendStatus?.key === 'processing' || queuePhase === 'retrying' || queuePhase === 'pending'
                        ? 'pending'
                        : bundleStatus === '会計待ち' || bundleStatus === '会計済み'
                          ? 'active'
                          : 'pending',
            };

            return (
              <article
                key={`${entry.id}-${entry.appointmentTime ?? entry.patientId ?? entry.name ?? ''}`}
                className={`document-timeline__entry${shouldHighlight ? ' document-timeline__entry--highlight' : ''}`}
                data-run-id={resolvedRunId}
              >
                <header>
                  <span className="document-timeline__entry-time">{entry.appointmentTime ?? '---'}</span>
                  <div className="document-timeline__entry-title">
                    <strong>{entry.name ?? '患者未登録'}（{entry.patientId ?? entry.appointmentId ?? 'ID不明'}）</strong>
                    <span className="document-timeline__entry-meta">
                      {entry.department ?? '―'} ｜ {entry.status}
                      {entry.receptionId ? ` ｜ 受付ID: ${entry.receptionId}` : ''}
                    </span>
                  </div>
                  {shouldHighlight && <span className="document-timeline__badge-warning">missingMaster</span>}
                  {queuePhase === 'error' && <span className="document-timeline__badge-error">再取得待ち</span>}
                  {queuePhase === 'retrying' && <span className="document-timeline__badge-info">再取得中</span>}
                  {sendStatus && (
                    <span
                      className={
                        sendStatus.tone === 'success'
                          ? 'document-timeline__badge-success'
                          : sendStatus.tone === 'error'
                            ? 'document-timeline__badge-error'
                            : sendStatus.tone === 'warning'
                              ? 'document-timeline__badge-warning'
                              : 'document-timeline__badge-info'
                      }
                    >
                      送信:{sendStatus.label}
                    </span>
                  )}
                  {sendStatus?.isStalled && <span className="document-timeline__badge-warning">滞留</span>}
                </header>
                <div className="document-timeline__steps" aria-label="受付から会計までの進捗">
                  {(['受付', '診療', '会計'] as const).map((step) => (
                    <div key={step} className={`document-timeline__step document-timeline__step--${queueStepStatus[step]}`}>
                      <span className="document-timeline__step-label">{step}</span>
                    </div>
                  ))}
                </div>
                <p className="document-timeline__entry-note">
                  {entry.note ?? 'メモなし'} ｜ 請求: {bundle?.claimStatusText ?? bundle?.claimStatus ?? '未取得'}
                  {sendStatus?.lastDispatchAt ? ` ｜ 最終送信: ${sendStatus.lastDispatchAt}` : ''}
                  {sendStatus?.key === 'failure' && sendStatus.error ? ` ｜ エラー: ${sendStatus.error}` : ''}
                </p>
                <div className="document-timeline__actions" aria-label="次にやること">
                  <strong>次にやること:</strong>
                  <span>{nextAction}</span>
                </div>
              </article>
            );
          })}
      </div>
    ));
  }, [
    claimBundles,
    collapsedSections,
    groupedEntries,
    orcaQueueByPatientId,
    queuePhase,
    resolvedMissingMaster,
    resolvedRunId,
    selectedAppointmentId,
    selectedPatientId,
    selectedReceptionId,
    toggleSection,
  ]);

  const moveWindow = useCallback(
    (direction: 'next' | 'prev' | 'start' | 'all' | 'center') => {
      if (totalEntries <= windowSize && direction !== 'all') return;
      if (direction === 'start') {
        setWindowStart(0);
        setWindowSize(VIRTUAL_WINDOW);
        return;
      }
      if (direction === 'all') {
        setWindowStart(0);
        setWindowSize(totalEntries || VIRTUAL_WINDOW);
        return;
      }
      if (direction === 'center' && selectedIndex >= 0) {
        setWindowStart(Math.max(0, selectedIndex - Math.floor(windowSize / 2)));
        return;
      }
      if (direction === 'next') {
        setWindowStart((prev) => Math.min(prev + windowSize, Math.max(0, totalEntries - windowSize)));
      } else {
        setWindowStart((prev) => Math.max(0, prev - windowSize));
      }
    },
    [selectedIndex, totalEntries, windowSize],
  );

  return (
    <section
      id="document-timeline"
      className="document-timeline"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      role="region"
      tabIndex={-1}
      data-run-id={resolvedRunId}
    >
      <div className="document-timeline__header" aria-label="DocumentTimeline メタ">
        <h2>Document Timeline</h2>
        <div className="document-timeline__meta-bar" role="status" aria-live="polite">
          <span>RUN_ID: {resolvedRunId}</span>
          <span>dataSourceTransition: {resolvedTransition ?? 'snapshot'}</span>
          <span>cacheHit: {String(resolvedCacheHit ?? false)}</span>
          <span>missingMaster: {String(resolvedMissingMaster ?? false)}</span>
          <span>fallbackUsed: {String(resolvedFallbackUsed ?? false)}</span>
        </div>
      </div>
      <ToneBanner
        tone={tone}
        message={toneMessage}
        runId={resolvedRunId}
        destination="ORCA Queue"
        nextAction={resolvedMissingMaster ? 'マスタ再取得' : queuePhase === 'error' ? '請求再取得' : 'ORCA再送'}
      />
      {appointmentBanner && (
        <ToneBanner
          tone={appointmentBanner.tone}
          message={appointmentBanner.message}
          runId={resolvedRunId}
          destination="予約/来院リスト"
          nextAction="必要に応じて再取得"
          ariaLive={appointmentBanner.tone === 'info' ? 'polite' : 'assertive'}
        />
      )}
      {orcaQueueError && (
        <ApiFailureBanner
          subject="ORCA キュー"
          error={orcaQueueError}
          destination="ORCA キュー"
          runId={resolvedRunId}
          nextAction="再取得 / 設定確認（Administration のキュー監視）"
          ariaLive="assertive"
        />
      )}
      <div className="document-timeline__controls">
        <div className="document-timeline__control-group" aria-label="表示件数とページング">
          <button type="button" onClick={() => moveWindow('start')} className="document-timeline__pager">先頭</button>
          <button type="button" onClick={() => moveWindow('prev')} className="document-timeline__pager">前へ</button>
          <button type="button" onClick={() => moveWindow('next')} className="document-timeline__pager">次へ</button>
          <button type="button" onClick={() => moveWindow('center')} className="document-timeline__pager">選択へ</button>
          <button type="button" onClick={() => moveWindow('all')} className="document-timeline__pager">すべて表示</button>
          <span className="document-timeline__window-meta">
            表示 {windowedEntries.length}/{totalEntries} 件
          </span>
          <span className="document-timeline__window-meta">
            取得 {recordsReturned ?? entries.length} 件{typeof pageSize === 'number' ? `（pageSize=${pageSize}）` : ''}
            {isRefetchingList ? ' ｜ 再取得中…' : ''}
          </span>
        </div>
        <div className="document-timeline__control-group" aria-label="仮想化ウィンドウサイズ">
          <label>
            ウィンドウ: 
            <input
              type="number"
              min={8}
              max={256}
              step={8}
              value={windowSize}
              onChange={(e) => setWindowSize(Math.max(8, Math.min(256, Number(e.target.value))))}
            />
          </label>
        </div>
        {hasNextPage && onLoadMore && (
          <div className="document-timeline__control-group" aria-label="追加読み込み">
            <button type="button" onClick={onLoadMore} className="document-timeline__pager" disabled={isLoadingMore || isInitialLoading}>
              {isLoadingMore ? '追加取得中…' : 'さらに読み込む'}
            </button>
          </div>
        )}
      </div>
      {resolvedFallbackUsed && (
        <div className="document-timeline__fallback" role="alert" aria-live="assertive">
          <strong>請求試算は暫定データ（fallbackUsed=true）です。</strong>
          <p>最新の請求バンドル取得を優先してください。必要に応じて Reception で再取得してから送信してください。</p>
        </div>
      )}
      {fallbackFlagMissing && (
        <div className="document-timeline__fallback" role="alert" aria-live="assertive">
          <strong>API から fallbackUsed フラグが返却されていません。</strong>
          <p>サーバー側の telemetry 設定を確認し、fallback 判定を UI/Audit に連携してください。</p>
        </div>
      )}
      {claimError && (
        <ApiFailureBanner
          subject="請求バンドル"
          error={claimError}
          httpStatus={claimData?.httpStatus}
          apiResult={claimData?.apiResult}
          apiResultMessage={claimData?.apiResultMessage}
          destination="請求バンドル"
          runId={resolvedRunId}
          nextAction="再取得"
          retryLabel="請求バンドルを再取得"
          onRetry={onRetryClaim}
          isRetrying={isClaimLoading}
        />
      )}
      {!claimError && onRetryClaim && (resolvedFallbackUsed || resolvedCacheHit === false) && (
        <div className="document-timeline__retry" aria-live="polite">
          <p>請求バンドルの整合性を再確認するには再取得を実行してください。</p>
          <button className="document-timeline__retry-button" onClick={onRetryClaim} disabled={isClaimLoading}>
            {isClaimLoading ? '再取得中…' : '請求バンドルを再取得'}
          </button>
        </div>
      )}
      <div className="document-timeline__content">
        <div className="document-timeline__timeline">
          <div className="document-timeline__section-logs" aria-label="セクション別ログ">
            <div className="document-timeline__section-logs-header">
              <h3>セクション別ログ</h3>
              <span>RUN_ID: {resolvedRunId} ｜ transition: {resolvedTransition ?? 'snapshot'}</span>
            </div>
            <div className="document-timeline__section-logs-grid">
              {sectionLogs.map((log) => {
                const metaId = log.meta ? `document-timeline-log-${log.key}-meta` : undefined;
                const bodyId = `document-timeline-log-${log.key}-body`;
                const describedBy = metaId ? `${metaId} ${bodyId}` : bodyId;
                return (
                  <article
                    key={log.key}
                    className={`document-timeline__section-log document-timeline__section-log--${log.tone}`}
                    data-run-id={resolvedRunId}
                    aria-label={`${log.label} セクションログ`}
                    aria-describedby={describedBy}
                  >
                    <header>
                      <strong>{log.label}</strong>
                      {log.meta ? <span id={metaId}>{log.meta}</span> : null}
                    </header>
                    <p id={bodyId}>{log.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="document-timeline__list" aria-label="タイムライン">
            <div className="document-timeline__timeline-header">
              <h3>タイムライン</h3>
              <span>受付→診療→会計</span>
            </div>
            {entryList}
          </div>
        </div>
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
              <StatusBadge
                label="ORCA送信（選択患者）"
                value={selectedSendStatus?.label ?? (selectedPatientId ? '未取得' : '患者未選択')}
                tone={
                  selectedSendStatus?.tone ??
                  (selectedPatientId ? 'warning' : 'info')
                }
                description={
                  selectedSendStatus
                    ? [
                        selectedSendStatus.isStalled ? '滞留を検知' : undefined,
                        selectedSendStatus.lastDispatchAt ? `lastDispatchAt=${selectedSendStatus.lastDispatchAt}` : undefined,
                        selectedSendStatus.key === 'failure' && selectedSendStatus.error ? `error=${selectedSendStatus.error}` : undefined,
                      ]
                        .filter((v): v is string => typeof v === 'string' && v.length > 0)
                        .join(' ｜ ')
                    : 'ORCA キュー応答から送信状態を解決します（Alt+S で再送）。'
                }
                ariaLive={selectedSendStatus?.isStalled ? 'assertive' : 'polite'}
                runId={orcaQueue?.runId ?? resolvedRunId}
              />
              <StatusBadge
                label="ORCA キュー"
                value={orcaQueue?.source ? `${orcaQueue.source}` : isOrcaQueueLoading ? '取得中' : '未取得'}
                tone={orcaQueue?.source ? 'info' : isOrcaQueueLoading ? 'info' : 'warning'}
                description={
                  [
                    orcaQueue?.queue ? `entries=${orcaQueue.queue.length}` : undefined,
                    orcaQueue?.fetchedAt ? `fetchedAt=${orcaQueue.fetchedAt}` : undefined,
                    orcaQueue?.traceId ? `traceId=${orcaQueue.traceId}` : undefined,
                    typeof orcaQueueUpdatedAt === 'number' && orcaQueueUpdatedAt > 0 ? `updatedAt=${new Date(orcaQueueUpdatedAt).toISOString()}` : undefined,
                  ]
                    .filter((v): v is string => typeof v === 'string' && v.length > 0)
                    .join(' ｜ ')
                }
                runId={orcaQueue?.runId ?? resolvedRunId}
              />
              <StatusBadge
                label="ORCA キュー内訳"
                value={`待ち:${orcaQueueCounts.waiting} / 処理中:${orcaQueueCounts.processing} / 成功:${orcaQueueCounts.success} / 失敗:${orcaQueueCounts.failure}`}
                tone={orcaQueueCountsTone}
                description={
                  [
                    orcaQueueCounts.stalled > 0 ? `滞留:${orcaQueueCounts.stalled}` : undefined,
                    orcaQueueCounts.unknown > 0 ? `不明:${orcaQueueCounts.unknown}` : undefined,
                  ]
                    .filter((v): v is string => typeof v === 'string' && v.length > 0)
                    .join(' ｜ ') || '選択患者以外の滞留/失敗も含めて俯瞰します。'
                }
                ariaLive={orcaQueueCounts.failure > 0 || orcaQueueCounts.stalled > 0 ? 'assertive' : 'polite'}
                runId={orcaQueue?.runId ?? resolvedRunId}
              />
            </div>
            {claimData?.fetchedAt && (
              <p className="document-timeline__queue-meta">
                最終取得: {claimData.fetchedAt} ｜ recordsReturned: {claimData.recordsReturned ?? claimBundles.length ?? '―'}
              </p>
            )}
            {claimBundles.length > 0 && (
              <div className="document-timeline__queue-meta" aria-live="polite">
                <strong>請求バンドル ({claimBundles.length}件)</strong>
                <ul>
                  {claimBundles.slice(0, 3).map((bundle, idx) => (
                    <li key={bundle.bundleNumber ?? `${bundle.patientId ?? 'unknown'}-${bundle.appointmentId ?? idx}`}>
                      {bundle.patientId ?? '患者不明'} ｜ {bundle.bundleNumber ?? 'bundle?'} ｜{' '}
                      {bundle.claimStatus ?? '状態不明'}
                    </li>
                  ))}
                  {claimBundles.length > 3 && <li>…ほか {claimBundles.length - 3} 件</li>}
                </ul>
              </div>
            )}
          </div>
          {auditSummary ? (
            <ToneBanner
              tone={auditSummary.tone}
              message={auditSummary.message}
              destination="Charts/Timeline"
              nextAction="必要なら再取得して整合を確認"
              runId={resolvedRunId}
              ariaLive="polite"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
