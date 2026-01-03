import { useEffect, useState } from 'react';

import {
  getOutpatientFunnelLog,
  subscribeOutpatientFunnel,
  type OutpatientFunnelRecord,
} from '../../libs/telemetry/telemetryClient';
import { resolveAriaLive, resolveRunId } from '../../libs/observability/observability';
import { useAuthService } from './authService';

export function TelemetryFunnelPanel() {
  const { flags } = useAuthService();
  const [log, setLog] = useState<OutpatientFunnelRecord[]>(() => getOutpatientFunnelLog());
  const resolvedRunId = resolveRunId(flags.runId);
  const infoLive = resolveAriaLive('info');

  useEffect(() => {
    setLog(getOutpatientFunnelLog());
  }, [flags.cacheHit, flags.dataSourceTransition, flags.missingMaster, flags.runId]);

  useEffect(() => {
    const unsubscribe = subscribeOutpatientFunnel((nextLog) => setLog(nextLog));
    return () => unsubscribe();
  }, []);

  return (
    <section className="telemetry-panel" aria-live={infoLive} aria-atomic="false" role="status" data-run-id={resolvedRunId}>
      <h2>Telemetry funnel（resolve_master → charts_orchestration → charts_action / charts_patient_sidepane）</h2>
      <p className="telemetry-panel__meta">
        runId={resolvedRunId} ｜ dataSourceTransition={flags.dataSourceTransition} ｜ missingMaster={String(flags.missingMaster)} ｜ cacheHit={String(flags.cacheHit)}
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
