import { useMemo } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { ReceptionEntry, ReceptionStatus } from '../reception/api';
import type { ClaimOutpatientPayload, ClaimBundle, ClaimBundleStatus } from '../outpatient/types';

export interface DocumentTimelineProps {
  entries?: ReceptionEntry[];
  auditEvent?: Record<string, unknown>;
  selectedPatientId?: string;
  selectedAppointmentId?: string;
  claimData?: ClaimOutpatientPayload;
  claimError?: Error;
  isClaimLoading?: boolean;
  onRetryClaim?: () => void;
}

const STATUS_ORDER: ReceptionStatus[] = ['受付中', '診療中', '会計待ち', '会計済み', '予約'];

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

export function DocumentTimeline({
  entries = [],
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
  const tonePayload: ChartTonePayload = {
    missingMaster: resolvedMissingMaster ?? false,
    cacheHit: resolvedCacheHit ?? false,
    dataSourceTransition: resolvedTransition ?? 'snapshot',
  };

  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const claimBundles = claimData?.bundles ?? [];

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

  const groupedEntries = useMemo(() => {
    if (entriesWithClaim.length === 0) return [];
    const rank: Record<ReceptionStatus, number> = Object.fromEntries(STATUS_ORDER.map((s, idx) => [s, idx]));
    const sorted = [...entriesWithClaim].sort((a, b) => {
      const left = rank[a.status] ?? 99;
      const right = rank[b.status] ?? 99;
      if (left !== right) return left - right;
      return (a.appointmentTime ?? '').localeCompare(b.appointmentTime ?? '');
    });
    return STATUS_ORDER.map((status) => ({
      status,
      items: sorted.filter((entry) => entry.status === status),
    })).filter((section) => section.items.length > 0);
  }, [entriesWithClaim]);

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
      <div key={section.status} className="document-timeline__section">
        <div className="document-timeline__section-header">
          <span className="document-timeline__section-badge">{section.status}</span>
          <span className="document-timeline__section-count">{section.items.length}件</span>
        </div>
        {section.items.slice(0, 4).map((entry) => {
          const isSelected =
            (selectedPatientId && entry.patientId === selectedPatientId) ||
            (selectedAppointmentId && entry.appointmentId === selectedAppointmentId);
          const shouldHighlight = resolvedMissingMaster || isSelected;
          return (
            <article
              key={`${entry.id}-${entry.appointmentTime ?? entry.patientId ?? entry.name ?? ''}`}
              className={`document-timeline__entry${shouldHighlight ? ' document-timeline__entry--highlight' : ''}`}
              data-run-id={resolvedRunId}
            >
              <header>
                <span className="document-timeline__entry-time">{entry.appointmentTime ?? '---'}</span>
                <strong>{entry.name ?? '患者未登録'}（{entry.patientId ?? entry.appointmentId ?? 'ID不明'}）</strong>
              </header>
              <p>{entry.note ?? 'メモなし'} ｜ 状態: {entry.status} ｜ 診療科: {entry.department ?? '―'}</p>
            </article>
          );
        })}
      </div>
    ));
  }, [groupedEntries, resolvedMissingMaster, resolvedRunId, selectedAppointmentId, selectedPatientId]);

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
        nextAction={resolvedMissingMaster ? 'マスタ再取得' : 'ORCA再送'}
      />
      {resolvedFallbackUsed && (
        <div className="document-timeline__fallback" role="alert" aria-live="assertive">
          <strong>請求試算は暫定データ（fallbackUsed=true）です。</strong>
          <p>最新の請求バンドル取得を優先してください。必要に応じて Reception で再取得してから送信してください。</p>
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
                  {claimBundles.slice(0, 3).map((bundle) => (
                    <li key={`${bundle.bundleNumber ?? bundle.patientId ?? Math.random()}`}>
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
