import { Global } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';

import { httpFetch } from '../../libs/http/httpClient';
import {
  clearOutpatientFunnelLog,
  getOutpatientFunnelLog,
  recordOutpatientFunnel,
  type DataSourceTransition,
  type OutpatientFunnelRecord,
} from '../../libs/telemetry/telemetryClient';
import { logUiState } from '../../libs/audit/auditLogger';
import { updateObservabilityMeta } from '../../libs/observability/observability';
import { handleOutpatientFlags, getResolveMasterSource, type ResolveMasterSource } from '../charts/orchestration';
import { ResolveMasterBadge } from '../reception/components/ResolveMasterBadge';
import { ToneBanner } from '../reception/components/ToneBanner';
import { receptionStyles } from '../reception/styles';
import { CacheHitBadge, MissingMasterBadge } from '../shared/StatusBadge';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';

type FlagEnvelope = {
  runId?: string;
  traceId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  dataSourceTransition?: DataSourceTransition;
};

type ResolvedFlags = {
  runId: string;
  traceId?: string;
  cacheHit: boolean;
  missingMaster: boolean;
  dataSourceTransition: DataSourceTransition;
};

const FALLBACK_RUN_ID =
  import.meta.env.VITE_RUM_RUN_ID ??
  // DEV/Playwright 用の暫定キー
  (import.meta.env as Record<string, string | undefined>).VITE_RUN_ID ??
  '20251208T124645Z';

const toResolvedFlags = (claim: FlagEnvelope, medical: FlagEnvelope): ResolvedFlags => ({
  runId: claim.runId ?? medical.runId ?? FALLBACK_RUN_ID,
  traceId: claim.traceId ?? medical.traceId,
  cacheHit: claim.cacheHit ?? medical.cacheHit ?? false,
  missingMaster: claim.missingMaster ?? medical.missingMaster ?? true,
  dataSourceTransition: claim.dataSourceTransition ?? medical.dataSourceTransition ?? 'server',
});

export function OutpatientMockPage() {
  const [flags, setFlags] = useState<ResolvedFlags>({
    runId: FALLBACK_RUN_ID,
    traceId: undefined,
    cacheHit: false,
    missingMaster: true,
    dataSourceTransition: 'snapshot',
  });
  const [masterSource, setMasterSource] = useState<ResolveMasterSource>('mock');
  const [telemetryLog, setTelemetryLog] = useState<OutpatientFunnelRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    clearOutpatientFunnelLog();

    const hydrateFlags = async () => {
      try {
        const [claimRes, medicalRes] = await Promise.all([
          httpFetch('/api01rv2/claim/outpatient/mock', { method: 'POST' }),
          httpFetch('/orca21/medicalmodv2/outpatient', { method: 'POST' }),
        ]);
        const claimJson = (await claimRes.json().catch(() => ({}))) as FlagEnvelope;
        const medicalJson = (await medicalRes.json().catch(() => ({}))) as FlagEnvelope;
        if (cancelled) return;

        const merged = toResolvedFlags(claimJson, medicalJson);
        setFlags(merged);
        updateObservabilityMeta({
          runId: merged.runId,
          traceId: merged.traceId,
          cacheHit: merged.cacheHit,
          missingMaster: merged.missingMaster,
          dataSourceTransition: merged.dataSourceTransition,
        });

        const resolveRecord = recordOutpatientFunnel('resolve_master', merged);
        const orchestrationRecord = handleOutpatientFlags(merged);
        setMasterSource(getResolveMasterSource());

        const funnelSnapshot = getOutpatientFunnelLog();
        setTelemetryLog(funnelSnapshot);
        logUiState({
          action: 'tone_change',
          screen: 'outpatient-mock',
          controlId: 'hydrate-flags',
          dataSourceTransition: merged.dataSourceTransition,
          cacheHit: merged.cacheHit,
          missingMaster: merged.missingMaster,
          runId: merged.runId,
          traceId: merged.traceId,
        });

        if (typeof window !== 'undefined') {
          (window as any).__OUTPATIENT_FUNNEL__ = funnelSnapshot;
          (window as any).__OUTPATIENT_RESOLVE__ = resolveRecord;
          (window as any).__OUTPATIENT_ORCHESTRATION__ = orchestrationRecord;
        }
      } catch (error) {
        console.error('[outpatient-mock] failed to hydrate flags', error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    hydrateFlags();
    return () => {
      cancelled = true;
    };
  }, []);

  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };
  const { tone, message, transitionMeta } = useMemo(
    () => getChartToneDetails(tonePayload),
    [tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster],
  );

  return (
    <>
      <Global styles={receptionStyles} />
      <main className="reception-page" data-test-id="outpatient-mock-page">
        <section className="reception-page__header">
          <h1>Outpatient MSW 事前検証 (Reception → Charts)</h1>
          <p>
            `/api01rv2/claim/outpatient/*` と `/orca21/medicalmodv2/outpatient` を MSW/Playwright でモックし、
            `tone=server` バナーと missingMaster/cacheHit/resolveMasterSource の同期、telemetry funnel
            の順序（resolve_master → charts_orchestration）を確認するためのデモページです。
          </p>
          <p className="status-message" role="status" aria-live="polite">
            RUN_ID: <strong>{flags.runId}</strong> ／ dataSourceTransition: <strong>{flags.dataSourceTransition}</strong> ／
            cacheHit: <strong>{flags.cacheHit ? 'true' : 'false'}</strong> ／ missingMaster:{' '}
            <strong>{flags.missingMaster ? 'true' : 'false'}</strong> ／ resolveMasterSource:{' '}
            <strong>{masterSource}</strong>
            {!loaded ? '（読込中…）' : ''}
          </p>
        </section>

        <section className="order-console" data-test-id="reception-section">
          <div className="order-console__step" data-test-id="reception-tone">
            <span className="order-console__step-label">Reception tone</span>
            <ToneBanner
              tone={tone}
              message={message}
              patientId="PX-DEMO-01"
              destination="ORCA Queue"
              nextAction={flags.missingMaster ? 'マスタ再取得' : 'ORCA 再送'}
              runId={flags.runId}
            />
          </div>
          <div className="order-console__step" data-test-id="resolve-master-badge">
            <span className="order-console__step-label">resolveMasterSource</span>
            <ResolveMasterBadge
              masterSource={masterSource}
              transitionDescription={`dataSourceTransition=${flags.dataSourceTransition}`}
              runId={flags.runId}
            />
          </div>
          <div className="order-console__status-group" data-test-id="reception-badges">
            <MissingMasterBadge missingMaster={flags.missingMaster} runId={flags.runId} />
            <CacheHitBadge cacheHit={flags.cacheHit} runId={flags.runId} />
          </div>
        </section>

        <section className="order-console" data-test-id="charts-section">
          <div className="order-console__step" data-test-id="charts-tone">
            <span className="order-console__step-label">Charts tone</span>
            <ToneBanner
              tone={tone}
              message={transitionMeta.description}
              destination="Charts DocumentTimeline"
              runId={flags.runId}
              ariaLive={tone === 'info' ? 'polite' : 'assertive'}
            />
          </div>
          <div className="order-console__step">
            <span className="order-console__step-label">Telemetry funnel (resolve → charts)</span>
            <ol className="order-console__note" data-test-id="telemetry-log" aria-live="polite">
              {telemetryLog.map((entry, index) => (
                <li key={`${entry.stage}-${index}`} data-stage={entry.stage} data-index={index}>
                  {index + 1}. {entry.stage} / transition: {entry.dataSourceTransition} / cacheHit:{' '}
                  {String(entry.cacheHit)} / missingMaster: {String(entry.missingMaster)}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </>
  );
}
