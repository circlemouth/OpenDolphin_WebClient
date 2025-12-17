import { useCallback, useEffect, useMemo, useState } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { ReceptionEntry, ReceptionStatus } from '../reception/api';
import type { ClaimOutpatientPayload, ClaimBundle, ClaimBundleStatus } from '../outpatient/types';
import type { AppointmentDataBanner } from '../outpatient/appointmentDataBanner';

export interface DocumentTimelineProps {
  entries?: ReceptionEntry[];
  appointmentBanner?: AppointmentDataBanner | null;
  auditEvent?: Record<string, unknown>;
  selectedPatientId?: string;
  selectedAppointmentId?: string;
  claimData?: ClaimOutpatientPayload;
  claimError?: Error;
  isClaimLoading?: boolean;
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

const deriveNextAction = (
  status: ReceptionStatus,
  queuePhase: QueuePhase,
  missingMaster?: boolean,
): string => {
  if (missingMaster) return 'マスタ再取得を完了してから ORCA 再送を実行';
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
  claimData,
  claimError,
  isClaimLoading,
  onRetryClaim,
}: DocumentTimelineProps) {
  const { flags } = useAuthService();
  const resolvedRunId = claimData?.runId ?? flags.runId;
  const resolvedMissingMaster = claimData?.missingMaster ?? flags.missingMaster;
  const resolvedCacheHit = claimData?.cacheHit ?? flags.cacheHit;
  const resolvedTransition = claimData?.dataSourceTransition ?? flags.dataSourceTransition;
  const resolvedFallbackUsed = claimData?.fallbackUsed ?? false;
  const fallbackFlagMissing = claimData?.fallbackFlagMissing ?? false;
  const resolvedCacheMiss = resolvedCacheHit === false;
  const tonePayload: ChartTonePayload = {
    missingMaster: resolvedMissingMaster ?? false,
    cacheHit: resolvedCacheHit ?? false,
    dataSourceTransition: resolvedTransition ?? 'snapshot',
  };

  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const claimBundles = claimData?.bundles ?? [];

  const queuePhase = resolveQueuePhase({
    missingMaster: resolvedMissingMaster,
    isClaimLoading,
    claimError,
    fallbackUsed: resolvedFallbackUsed,
    cacheHit: resolvedCacheHit,
  });

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

  const rank: Record<ReceptionStatus, number> = useMemo(
    () => Object.fromEntries(STATUS_ORDER.map((s, idx) => [s, idx])),
    [],
  );

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
        (selectedPatientId && entry.patientId === selectedPatientId) ||
        (selectedAppointmentId && entry.appointmentId === selectedAppointmentId),
    ),
  [selectedAppointmentId, selectedPatientId, sortedEntries]);

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

  const [collapsedSections, setCollapsedSections] = useState<Record<ReceptionStatus, boolean>>({});

  const toggleSection = useCallback((status: ReceptionStatus) => {
    setCollapsedSections((prev) => ({ ...prev, [status]: !prev[status] }));
  }, []);

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
              (selectedPatientId && entry.patientId === selectedPatientId) ||
              (selectedAppointmentId && entry.appointmentId === selectedAppointmentId);
            const shouldHighlight = resolvedMissingMaster || isSelected;
            const bundle = pickClaimBundleForEntry(entry, claimBundles);
            const nextAction = deriveNextAction(entry.status, queuePhase, resolvedMissingMaster);
            const bundleStatus = bundle?.claimStatus ?? '診療中';
            const queueStepStatus: Record<'受付' | '診療' | 'ORCAキュー', 'done' | 'active' | 'blocked' | 'pending'> = {
              受付: 'done',
              診療: entry.status === '受付中' || entry.status === '予約' ? 'active' : 'done',
              ORCAキュー:
                queuePhase === 'error'
                  ? 'blocked'
                  : queuePhase === 'retrying' || queuePhase === 'pending'
                    ? 'active'
                    : bundleStatus === '会計待ち' || bundleStatus === '会計済み'
                      ? 'done'
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
                </header>
                <div className="document-timeline__steps" aria-label="受付からORCAまでの進捗">
                  {(['受付', '診療', 'ORCAキュー'] as const).map((step) => (
                    <div key={step} className={`document-timeline__step document-timeline__step--${queueStepStatus[step]}`}>
                      <span className="document-timeline__step-label">{step}</span>
                    </div>
                  ))}
                </div>
                <p className="document-timeline__entry-note">
                  {entry.note ?? 'メモなし'} ｜ キュー: {bundle?.claimStatusText ?? bundle?.claimStatus ?? '未取得'}
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
    queuePhase,
    resolvedMissingMaster,
    resolvedRunId,
    selectedAppointmentId,
    selectedPatientId,
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
      className="document-timeline"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      role="region"
      data-run-id={resolvedRunId}
    >
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
        <div className="document-timeline__retry" role="alert" aria-live="assertive">
          <p>請求バンドルの取得に失敗しました: {claimError.message}</p>
          {onRetryClaim && (
            <button className="document-timeline__retry-button" onClick={onRetryClaim} disabled={isClaimLoading}>
              {isClaimLoading ? '再取得中…' : '請求バンドルを再取得'}
            </button>
          )}
        </div>
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
        <div className="document-timeline__list">{entryList}</div>
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
