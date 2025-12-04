import { useMemo } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { computeChartTone, getTransitionMeta, type ChartTonePayload } from '../../ux/charts/tones';

export function OrcaSummary() {
  const { flags } = useAuthService();
  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };
  const tone = computeChartTone(tonePayload);
  const transitionMeta = getTransitionMeta(flags.dataSourceTransition);

  const summaryMessage = useMemo(() => {
    if (flags.missingMaster) {
      return 'OrcaSummary では `missingMaster=true` を警告に変換し、再取得まで tone=server を保持します。';
    }
    if (flags.cacheHit) {
      return 'キャッシュ命中のためORCA再送を Info tone で示し、`dataSourceTransition=server` を保持。';
    }
    return 'ORCA master の `dataSourceTransition` 情報を監査ログへ再送出します。';
  }, [flags.cacheHit, flags.missingMaster]);

  return (
    <section
      className="orca-summary"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      data-run-id={flags.runId}
    >
      <ToneBanner
        tone={tone}
        message={summaryMessage}
        destination="ORCA master"
        runId={flags.runId}
      />
      <div className="orca-summary__details">
        <div className="orca-summary__meta">
          <p className="orca-summary__meta-label">dataSourceTransition</p>
          <strong>{transitionMeta.label}</strong>
          <p>{transitionMeta.description}</p>
        </div>
        <div className="orca-summary__badges">
          <StatusBadge
            label="missingMaster"
            value={flags.missingMaster ? 'true' : 'false'}
            tone={flags.missingMaster ? 'warning' : 'success'}
            description={flags.missingMaster ? 'マスタ未取得で再送停止' : 'マスタ取得済みで ORCA 再送可能'}
            ariaLive={flags.missingMaster ? 'assertive' : 'polite'}
            runId={flags.runId}
          />
          <StatusBadge
            label="cacheHit"
            value={flags.cacheHit ? 'true' : 'false'}
            tone={flags.cacheHit ? 'success' : 'warning'}
            description={flags.cacheHit ? 'マスタキャッシュ命中' : 'キャッシュを使えず再取得を試行'}
            runId={flags.runId}
          />
        </div>
      </div>
    </section>
  );
}
