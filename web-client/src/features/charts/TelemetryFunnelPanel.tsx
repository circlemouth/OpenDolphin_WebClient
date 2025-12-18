import { useEffect, useState } from 'react';

import {
  getOutpatientFunnelLog,
  subscribeOutpatientFunnel,
  type OutpatientFunnelRecord,
} from '../../libs/telemetry/telemetryClient';
import { useAuthService } from './authService';

export function TelemetryFunnelPanel() {
  const { flags } = useAuthService();
  const [log, setLog] = useState<OutpatientFunnelRecord[]>(() => getOutpatientFunnelLog());

  useEffect(() => {
    setLog(getOutpatientFunnelLog());
  }, [flags.cacheHit, flags.dataSourceTransition, flags.missingMaster, flags.runId]);

  useEffect(() => {
    const unsubscribe = subscribeOutpatientFunnel((nextLog) => setLog(nextLog));
    return () => unsubscribe();
  }, []);

  return (
    <section
      className="telemetry-panel"
      id="charts-telemetry"
      tabIndex={-1}
      data-focus-anchor="true"
      aria-live="off"
      role="status"
      data-run-id={flags.runId}
    >
      <h2>Telemetry funnel（resolve_master → charts_orchestration → charts_action）</h2>
      <p className="telemetry-panel__meta">
        runId={flags.runId} ｜ dataSourceTransition={flags.dataSourceTransition} ｜ missingMaster={String(flags.missingMaster)} ｜ cacheHit={String(flags.cacheHit)}
      </p>
      <ol className="telemetry-panel__list">
        {log.length === 0 && <li>funnel 未記録（フラグ操作や API 応答で生成）</li>}
        {log.map((entry, index) => (
          <li key={`${entry.stage}-${index}`} data-stage={entry.stage}>
            {index + 1}. {entry.stage} ｜ action: {entry.action ?? '—'} ｜ transition: {entry.dataSourceTransition} ｜ missingMaster:{' '}
            {String(entry.missingMaster)} ｜ cacheHit: {String(entry.cacheHit)} ｜ fallbackUsed: {String(entry.fallbackUsed ?? false)} ｜ outcome:{' '}
            {entry.outcome ?? 'n/a'} ｜ recordedAt: {entry.recordedAt}
          </li>
        ))}
      </ol>
    </section>
  );
}
