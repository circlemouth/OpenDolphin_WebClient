import { Global } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';

import { httpFetch } from '../../libs/http/httpClient';
import { persistHeaderFlags, resolveHeaderFlags } from '../../libs/http/header-flags';
import {
  clearOutpatientFunnelLog,
  getMaskedOutpatientFunnelLog,
  getOutpatientFunnelLog,
  recordOutpatientFunnel,
  type DataSourceTransition,
  type OutpatientFunnelRecord,
} from '../../libs/telemetry/telemetryClient';
import { logUiState } from '../../libs/audit/auditLogger';
import { resolveAriaLive, updateObservabilityMeta } from '../../libs/observability/observability';
import { handleOutpatientFlags, getResolveMasterSource, type ResolveMasterSource } from '../charts/orchestration';
import { ResolveMasterBadge } from '../reception/components/ResolveMasterBadge';
import { ToneBanner } from '../reception/components/ToneBanner';
import { receptionStyles } from '../reception/styles';
import { CacheHitBadge, MissingMasterBadge } from '../shared/StatusBadge';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import { MISSING_MASTER_RECOVERY_NEXT_ACTION } from '../shared/missingMasterRecovery';
import { useOptionalSession } from '../../AppRouter';
import { buildFacilityPath } from '../../routes/facilityRoutes';
import { resolveMockGateDecision } from '../../libs/devtools/mockGate';
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
const RUN_ID_PATTERN = /^\d{8}T\d{6}Z$/;

const toResolvedFlags = (medical: FlagEnvelope): ResolvedFlags => ({
  runId: medical.runId ?? FALLBACK_RUN_ID,
  traceId: medical.traceId,
  cacheHit: medical.cacheHit ?? false,
  missingMaster: medical.missingMaster ?? true,
  dataSourceTransition: medical.dataSourceTransition ?? 'server',
});

export function OutpatientMockPage() {
  const session = useOptionalSession();
  const mockGate = useMemo(() => resolveMockGateDecision(), []);
  const mswQueryEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('msw') === '1';
    } catch {
      return false;
    }
  }, []);
  const scenarioOptions = useMemo(() => listOutpatientScenarios(), []);
  const [scenarioId, setScenarioId] = useState<OutpatientScenarioId>('snapshot-missing-master');
  const [overrideFlags, setOverrideFlags] = useState<Partial<OutpatientFlagSet>>({});
  const [faultMode, setFaultMode] = useState<string>(() => resolveHeaderFlags().mswFault ?? '');
  const [faultDelayMs, setFaultDelayMs] = useState<number>(() => resolveHeaderFlags().mswDelayMs ?? 0);
  const [runIdInput, setRunIdInput] = useState<string>(FALLBACK_RUN_ID);
  const [runIdDirty, setRunIdDirty] = useState(false);
  const [runIdMessage, setRunIdMessage] = useState<string>('');
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
        if (mockGate.allowed) {
          headers.set('x-msw-scenario', scenarioId);
          if (overrideFlags.cacheHit !== undefined) headers.set('x-msw-cache-hit', overrideFlags.cacheHit ? '1' : '0');
          if (overrideFlags.missingMaster !== undefined)
            headers.set('x-msw-missing-master', overrideFlags.missingMaster ? '1' : '0');
          if (overrideFlags.dataSourceTransition) headers.set('x-msw-transition', overrideFlags.dataSourceTransition);
          if (overrideFlags.runId) headers.set('x-msw-run-id', overrideFlags.runId);
        }
        const medicalRes = await httpFetch('/orca21/medicalmodv2/outpatient', { method: 'POST', headers });
        const medicalJson = (await medicalRes.json().catch(() => ({}))) as FlagEnvelope;
        if (cancelled) return;

        const merged = toResolvedFlags(medicalJson);
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
        const maskedSnapshot = getMaskedOutpatientFunnelLog();
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
          (window as any).__OUTPATIENT_FUNNEL__ = maskedSnapshot;
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
  }, [
    scenarioId,
    overrideFlags.cacheHit,
    overrideFlags.missingMaster,
    overrideFlags.dataSourceTransition,
    overrideFlags.runId,
    mockGate.allowed,
  ]);

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
    setRunIdDirty(false);
    setRunIdMessage('');
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
    setRunIdDirty(false);
    setRunIdMessage('');
  };

  const applyFault = (next: { mode?: string; delayMs?: number }) => {
    const mode = next.mode !== undefined ? next.mode : faultMode;
    const delayMs = next.delayMs !== undefined ? next.delayMs : faultDelayMs;
    setFaultMode(mode);
    setFaultDelayMs(delayMs);
    persistHeaderFlags({
      mswFault: mode && mode.trim().length > 0 ? mode.trim() : undefined,
      mswDelayMs: delayMs && delayMs > 0 ? delayMs : undefined,
    });
    clearOutpatientFunnelLog();
    setLoaded(false);
  };

  useEffect(() => {
    if (!runIdDirty) {
      setRunIdInput(flags.runId);
    }
  }, [flags.runId, runIdDirty]);

  const applyRunIdOverride = () => {
    const trimmed = runIdInput.trim();
    if (trimmed.length === 0) {
      setRunIdMessage('runId が空白のため適用できません。');
      return;
    }
    if (!RUN_ID_PATTERN.test(trimmed)) {
      setRunIdMessage('runId は YYYYMMDDThhmmssZ を推奨します。');
    } else {
      setRunIdMessage('');
    }
    handleOverride({ runId: trimmed });
    setRunIdDirty(false);
  };

  return (
    <>
      <Global styles={receptionStyles} />
      <main className="reception-page" data-test-id="outpatient-mock-page">
        <section className="reception-page__header">
          <h1>Outpatient MSW 事前検証 (Reception → Charts)</h1>
          <p>
            `/orca21/medicalmodv2/outpatient` を MSW/Playwright でモックし、
            missingMaster/cacheHit/dataSourceTransition の同期と telemetry funnel（resolve_master → charts_orchestration）を可視化します。
            MSW を使う場合は gate 条件（DEV + VITE_ENABLE_MSW=1 + ?msw=1）を満たしてください。
          </p>
          <p className="status-message" role="status" aria-live={resolveAriaLive('info')}>
            RUN_ID: <strong>{flags.runId}</strong> ／ dataSourceTransition: <strong>{flags.dataSourceTransition}</strong> ／
            cacheHit: <strong>{flags.cacheHit ? 'true' : 'false'}</strong> ／ missingMaster:{' '}
            <strong>{flags.missingMaster ? 'true' : 'false'}</strong> ／ resolveMasterSource:{' '}
            <strong>{masterSource}</strong>
            {!loaded ? '（読込中…）' : ''}
          </p>
          {!mockGate.allowed ? (
            <p className="status-message" aria-live={resolveAriaLive('warning')}>
              ⚠️ MSW gate が閉じているため、モック/fixture 制御（シナリオ切替・runId/dataSourceTransition 上書き）は無効です。
              条件: DEV + VITE_ENABLE_MSW=1 + ?msw=1
            </p>
          ) : !mswQueryEnabled ? (
            <p className="status-message" aria-live={resolveAriaLive('warning')}>
              ⚠️ `msw=1` が付いていないため、障害注入ヘッダー（x-msw-fault / x-msw-delay-ms）は送出されません。検証時は{' '}
              <a href={`${buildFacilityPath(session?.facilityId, '/debug/outpatient-mock')}?msw=1`}>
                /debug/outpatient-mock?msw=1
              </a>{' '}
              を開いてください。
            </p>
          ) : (
            <p className="status-message" aria-live={resolveAriaLive('info')}>
              MSW モック有効: シナリオ選択・フラグ上書きで Reception/Charts/Patients を同一フィクスチャから給電します。
            </p>
          )}
        </section>

        {mockGate.allowed && (
          <section className="order-console" data-test-id="scenario-panel">
            <div className="order-console__step">
              <span className="order-console__step-label">シナリオ</span>
              <select
                id="outpatient-scenario"
                name="outpatientScenario"
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
              <div className="order-console__status-group" aria-live={resolveAriaLive('info')}>
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
                    id="outpatient-data-source-transition"
                    name="outpatientDataSourceTransition"
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
              <div className="order-console__status-group" aria-live={resolveAriaLive('info')}>
                <label className="order-console__toggle">
                  runId:
                  <input
                    id="outpatient-run-id"
                    name="outpatientRunId"
                    type="text"
                    value={runIdInput}
                    onChange={(event) => {
                      setRunIdInput(event.target.value);
                      setRunIdDirty(true);
                      if (runIdMessage) setRunIdMessage('');
                    }}
                    style={{ width: 240 }}
                    aria-label="MSW run id override"
                  />
                </label>
                <button
                  type="button"
                  className="order-console__toggle"
                  onClick={applyRunIdOverride}
                >
                  runId を適用
                </button>
              </div>
              {runIdMessage ? <p className="order-console__note">{runIdMessage}</p> : null}
              <p className="order-console__note">
                QA では runId と dataSourceTransition の切替をここで操作し、Reception/Charts のバナーと telemetry が連動しているか確認してください。
              </p>
            </div>
            <div className="order-console__step">
              <span className="order-console__step-label">障害注入（MSW）</span>
              <div className="order-console__status-group" aria-live={resolveAriaLive('info')}>
                <label className="order-console__toggle">
                  mode:
                  <select
                    id="outpatient-fault-mode"
                    name="outpatientFaultMode"
                    value={faultMode}
                    onChange={(event) => applyFault({ mode: event.target.value })}
                    aria-label="MSW fault injection mode"
                  >
                    <option value="">none</option>
                    <option value="timeout">timeout（504）</option>
                    <option value="http-500">http-500（500）</option>
                    <option value="schema-mismatch">schema-mismatch（200 + ERROR_*）</option>
                    <option value="queue-stall">queue-stall（/api/orca/queue 滞留）</option>
                  </select>
                </label>
                <label className="order-console__toggle">
                  delay(ms):
                  <input
                    id="outpatient-fault-delay"
                    name="outpatientFaultDelay"
                    type="number"
                    min={0}
                    step={100}
                    value={faultDelayMs}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setFaultDelayMs(Number.isFinite(next) ? next : 0);
                    }}
                    onBlur={() => applyFault({ delayMs: faultDelayMs })}
                    style={{ width: 120 }}
                    aria-label="MSW delay ms"
                  />
                </label>
                <button type="button" className="order-console__toggle" onClick={() => applyFault({ mode: '', delayMs: 0 })}>
                  障害注入を解除
                </button>
              </div>
              <p className="order-console__note">
                `x-msw-fault` / `x-msw-delay-ms` を全 API リクエストに付与します。Charts で「落ちずに説明できる」こと、
                解除後に再取得で復帰できることを確認してください。
              </p>
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
              nextAction={flags.missingMaster ? MISSING_MASTER_RECOVERY_NEXT_ACTION : 'ORCA 再送'}
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
            <ol className="order-console__note" data-test-id="telemetry-log" aria-live={resolveAriaLive('info')}>
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
