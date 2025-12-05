import { useMemo } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';

export function OrcaSummary() {
  const { flags } = useAuthService();
  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };
  const { tone, message: sharedMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const summaryMessage = useMemo(() => {
    if (flags.missingMaster) {
      return `${sharedMessage} OrcaSummary は再取得完了まで tone=server を維持します。`;
    }
    if (flags.cacheHit) {
      return `${sharedMessage} ORCA 再送は Info tone で提示し、${transitionMeta.label} を記録します。`;
    }
    return `${sharedMessage} ${transitionMeta.label} を監査ログへ再送出します。`;
  }, [flags.cacheHit, flags.missingMaster, sharedMessage, transitionMeta.label]);

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
        ariaLive={tone === 'info' ? 'polite' : 'assertive'}
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
