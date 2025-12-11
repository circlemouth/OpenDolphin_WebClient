import { useEffect, useState } from 'react';

import { getOutpatientFunnelLog, type OutpatientFunnelRecord } from '../../libs/telemetry/telemetryClient';
import { useAuthService } from './authService';

export function TelemetryFunnelPanel() {
  const { flags } = useAuthService();
  const [log, setLog] = useState<OutpatientFunnelRecord[]>(() => getOutpatientFunnelLog());

  useEffect(() => {
    setLog(getOutpatientFunnelLog());
  }, [flags.cacheHit, flags.dataSourceTransition, flags.missingMaster, flags.runId]);

  return (
    <section className="telemetry-panel" aria-live="polite" aria-atomic="false" role="status" data-run-id={flags.runId}>
      <h2>Telemetry funnel（resolve_master → charts_orchestration）</h2>
      <p className="telemetry-panel__meta">
        runId={flags.runId} ｜ dataSourceTransition={flags.dataSourceTransition} ｜ missingMaster={String(flags.missingMaster)} ｜ cacheHit={String(flags.cacheHit)}
      </p>
      <ol className="telemetry-panel__list">
        {log.length === 0 && <li>funnel 未記録（フラグ操作や API 応答で生成）</li>}
        {log.map((entry, index) => (
          <li key={`${entry.stage}-${index}`} data-stage={entry.stage}>
            {index + 1}. {entry.stage} ｜ transition: {entry.dataSourceTransition} ｜ missingMaster: {String(entry.missingMaster)} ｜ cacheHit:{' '}
            {String(entry.cacheHit)} ｜ recordedAt: {entry.recordedAt}
          </li>
        ))}
      </ol>
    </section>
  );
}
