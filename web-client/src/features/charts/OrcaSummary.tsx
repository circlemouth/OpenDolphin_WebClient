import { useMemo } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { OrcaOutpatientSummary } from './api';
import type { ClaimOutpatientPayload } from '../outpatient/types';

export interface OrcaSummaryProps {
  summary?: OrcaOutpatientSummary;
  claim?: ClaimOutpatientPayload;
}

export function OrcaSummary({ summary, claim }: OrcaSummaryProps) {
  const { flags } = useAuthService();
  const resolvedRunId = summary?.runId ?? claim?.runId ?? flags.runId;
  const resolvedMissingMaster = summary?.missingMaster ?? claim?.missingMaster ?? flags.missingMaster;
  const resolvedCacheHit = summary?.cacheHit ?? claim?.cacheHit ?? flags.cacheHit;
  const resolvedFallbackUsed = summary?.fallbackUsed ?? claim?.fallbackUsed ?? false;
  const resolvedTransition = summary?.dataSourceTransition ?? claim?.dataSourceTransition ?? flags.dataSourceTransition;
  const tonePayload: ChartTonePayload = {
    missingMaster: resolvedMissingMaster ?? false,
    cacheHit: resolvedCacheHit ?? false,
    dataSourceTransition: resolvedTransition ?? 'snapshot',
  };
  const { tone, message: sharedMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const summaryMessage = useMemo(() => {
    if (resolvedMissingMaster) {
      return `${sharedMessage} OrcaSummary は再取得完了まで tone=server を維持します。`;
    }
    if (resolvedFallbackUsed) {
      return `${sharedMessage} 請求バンドルは fallbackUsed=true のため暫定表示です。再取得または ORCA 再送を検討してください。`;
    }
    if (resolvedCacheHit) {
      return `${sharedMessage} ORCA 再送は Info tone で提示し、${transitionMeta.label} を記録します。`;
    }
    return `${sharedMessage} ${transitionMeta.label} を監査ログへ再送出します。`;
  }, [resolvedCacheHit, resolvedFallbackUsed, resolvedMissingMaster, sharedMessage, transitionMeta.label]);

  const payloadPreview = useMemo(() => {
    if (!summary?.payload) return null;
    const entries = Object.entries(summary.payload).slice(0, 4);
    return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' ｜ ');
  }, [summary?.payload]);

  return (
    <section
      className="orca-summary"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      data-run-id={resolvedRunId}
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
          <strong>{transitionMeta.label}</strong>
          <p>{transitionMeta.description}</p>
          <p className="orca-summary__meta-label">recordsReturned</p>
          <strong>{summary?.recordsReturned ?? claim?.recordsReturned ?? '―'}</strong>
          {summary?.fetchedAt && <p className="orca-summary__meta-note">取得: {summary.fetchedAt}</p>}
          {claim?.fetchedAt && !summary?.fetchedAt && <p className="orca-summary__meta-note">請求取得: {claim.fetchedAt}</p>}
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
            ariaLive={resolvedMissingMaster ? 'assertive' : 'polite'}
            runId={resolvedRunId}
          />
          <StatusBadge
            label="cacheHit"
            value={resolvedCacheHit ? 'true' : 'false'}
            tone={resolvedCacheHit ? 'success' : 'warning'}
            description={resolvedCacheHit ? 'マスタキャッシュ命中' : 'キャッシュを使えず再取得を試行'}
            runId={resolvedRunId}
          />
          <StatusBadge
            label="fallbackUsed"
            value={resolvedFallbackUsed ? 'true' : 'false'}
            tone={resolvedFallbackUsed ? 'error' : 'info'}
            description={resolvedFallbackUsed ? 'fallbackUsed=true ｜ snapshot/fallback データで処理中' : 'fallback 未使用'}
            runId={resolvedRunId}
          />
        </div>
      </div>
      {payloadPreview && (
        <div className="orca-summary__payload" aria-live="polite">
          <strong>応答プレビュー</strong>
          <p>{payloadPreview}</p>
        </div>
      )}
    </section>
  );
}
