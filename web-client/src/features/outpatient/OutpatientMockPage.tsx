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
import {
  listOutpatientScenarios,
  OUTPATIENT_FALLBACK_RUN_ID,
  type OutpatientScenarioId,
  type OutpatientFlagSet,
} from '../../mocks/fixtures/outpatient';

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
  OUTPATIENT_FALLBACK_RUN_ID;

const toResolvedFlags = (claim: FlagEnvelope, medical: FlagEnvelope): ResolvedFlags => ({
  runId: claim.runId ?? medical.runId ?? FALLBACK_RUN_ID,
  traceId: claim.traceId ?? medical.traceId,
  cacheHit: claim.cacheHit ?? medical.cacheHit ?? false,
  missingMaster: claim.missingMaster ?? medical.missingMaster ?? true,
  dataSourceTransition: claim.dataSourceTransition ?? medical.dataSourceTransition ?? 'server',
});

export function OutpatientMockPage() {
  const mswDisabled = import.meta.env.VITE_DISABLE_MSW === '1';
  const scenarioOptions = useMemo(() => listOutpatientScenarios(), []);
  const [scenarioId, setScenarioId] = useState<OutpatientScenarioId>('snapshot-missing-master');
  const [overrideFlags, setOverrideFlags] = useState<Partial<OutpatientFlagSet>>({});
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
        const headers = new Headers();
        if (!mswDisabled) {
          headers.set('x-msw-scenario', scenarioId);
          if (overrideFlags.cacheHit !== undefined) headers.set('x-msw-cache-hit', overrideFlags.cacheHit ? '1' : '0');
          if (overrideFlags.missingMaster !== undefined)
            headers.set('x-msw-missing-master', overrideFlags.missingMaster ? '1' : '0');
          if (overrideFlags.dataSourceTransition) headers.set('x-msw-transition', overrideFlags.dataSourceTransition);
        }
        const [claimRes, medicalRes] = await Promise.all([
          httpFetch('/api01rv2/claim/outpatient/mock', { method: 'POST', headers }),
          httpFetch('/orca21/medicalmodv2/outpatient', { method: 'POST', headers }),
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
  }, [scenarioId, overrideFlags.cacheHit, overrideFlags.missingMaster, overrideFlags.dataSourceTransition, mswDisabled]);

  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };
  const { tone, message, transitionMeta } = useMemo(
    () => getChartToneDetails(tonePayload),
    [tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster],
  );

  const handleScenarioChange = (id: OutpatientScenarioId) => {
    setScenarioId(id);
    setOverrideFlags({});
    clearOutpatientFunnelLog();
    setLoaded(false);
    logUiState({
      action: 'scenario_change',
      screen: 'outpatient-mock',
      controlId: 'scenario-select',
      runId: flags.runId,
      dataSourceTransition: flags.dataSourceTransition,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      details: { scenarioId: id },
    });
  };

  const handleOverride = (partial: Partial<OutpatientFlagSet>) => {
    setOverrideFlags((prev) => ({ ...prev, ...partial }));
    setLoaded(false);
    clearOutpatientFunnelLog();
    logUiState({
      action: 'scenario_override',
      screen: 'outpatient-mock',
      controlId: 'override-flags',
      runId: flags.runId,
      dataSourceTransition: partial.dataSourceTransition ?? flags.dataSourceTransition,
      cacheHit: partial.cacheHit ?? flags.cacheHit,
      missingMaster: partial.missingMaster ?? flags.missingMaster,
    });
  };

  const resetOverrides = () => {
    setOverrideFlags({});
    clearOutpatientFunnelLog();
    setLoaded(false);
  };

  return (
    <>
      <Global styles={receptionStyles} />
      <main className="reception-page" data-test-id="outpatient-mock-page">
        <section className="reception-page__header">
          <h1>Outpatient MSW 事前検証 (Reception → Charts)</h1>
          <p>
            `/api01rv2/claim/outpatient/*` と `/orca21/medicalmodv2/outpatient` を MSW/Playwright でモックし、
            missingMaster/cacheHit/dataSourceTransition の同期と telemetry funnel（resolve_master → charts_orchestration）を可視化します。
            VITE_DISABLE_MSW=1 のときは実 API 接続となり、シナリオ切替は無効化されます。
          </p>
          <p className="status-message" role="status" aria-live="polite">
            RUN_ID: <strong>{flags.runId}</strong> ／ dataSourceTransition: <strong>{flags.dataSourceTransition}</strong> ／
            cacheHit: <strong>{flags.cacheHit ? 'true' : 'false'}</strong> ／ missingMaster:{' '}
            <strong>{flags.missingMaster ? 'true' : 'false'}</strong> ／ resolveMasterSource:{' '}
            <strong>{masterSource}</strong>
            {!loaded ? '（読込中…）' : ''}
          </p>
          {mswDisabled ? (
            <p className="status-message" aria-live="assertive">
              ⚠️ VITE_DISABLE_MSW=1: 実 API 接続中のためシナリオ切替は無効です。MSW を使う場合はフラグを 0 にして再読込してください。
            </p>
          ) : (
            <p className="status-message" aria-live="polite">
              MSW モック有効: シナリオ選択・フラグ上書きで Reception/Charts/Patients を同一フィクスチャから給電します。
            </p>
          )}
        </section>

        {!mswDisabled && (
          <section className="order-console" data-test-id="scenario-panel">
            <div className="order-console__step">
              <span className="order-console__step-label">シナリオ</span>
              <select
                value={scenarioId}
                onChange={(event) => handleScenarioChange(event.target.value as OutpatientScenarioId)}
              >
                {scenarioOptions.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.label}
                  </option>
                ))}
              </select>
              <p className="order-console__note">
                {scenarioOptions.find((s) => s.id === scenarioId)?.description ?? 'custom'}
              </p>
            </div>
            <div className="order-console__step">
              <span className="order-console__step-label">フラグ上書き</span>
              <div className="order-console__status-group" aria-live="polite">
                <button
                  type="button"
                  className="order-console__toggle"
                  onClick={() => handleOverride({ missingMaster: !flags.missingMaster })}
                >
                  missingMaster: {flags.missingMaster ? 'true' : 'false'}
                </button>
                <button
                  type="button"
                  className="order-console__toggle"
                  onClick={() => handleOverride({ cacheHit: !flags.cacheHit })}
                >
                  cacheHit: {flags.cacheHit ? 'true' : 'false'}
                </button>
                <label className="order-console__toggle">
                  dataSourceTransition:
                  <select
                    value={overrideFlags.dataSourceTransition ?? flags.dataSourceTransition}
                    onChange={(event) => handleOverride({ dataSourceTransition: event.target.value as DataSourceTransition })}
                  >
                    {['mock', 'snapshot', 'server', 'fallback'].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="order-console__toggle" onClick={resetOverrides}>
                  上書きをリセット
                </button>
              </div>
            </div>
          </section>
        )}

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
