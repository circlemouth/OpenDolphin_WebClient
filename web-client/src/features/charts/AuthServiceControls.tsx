import { useState } from 'react';

import { logUiState } from '../../libs/audit/auditLogger';
import { resolveAriaLive } from '../../libs/observability/observability';
import { useAuthService, type DataSourceTransition } from './authService';

const TRANSITIONS: DataSourceTransition[] = ['mock', 'snapshot', 'server', 'fallback'];

export function AuthServiceControls() {
  const { flags, setMissingMaster, setCacheHit, setDataSourceTransition, bumpRunId } = useAuthService();
  const [draftRunId, setDraftRunId] = useState(flags.runId);

  const handleToggleMissingMaster = () => {
    const next = !flags.missingMaster;
    setMissingMaster(next);
    logUiState({
      action: 'tone_change',
      screen: 'charts/auth-service-controls',
      controlId: 'toggle-missing-master',
      missingMaster: next,
      cacheHit: flags.cacheHit,
      dataSourceTransition: flags.dataSourceTransition,
      runId: flags.runId,
    });
  };

  const handleToggleCacheHit = () => {
    const next = !flags.cacheHit;
    setCacheHit(next);
    logUiState({
      action: 'tone_change',
      screen: 'charts/auth-service-controls',
      controlId: 'toggle-cache-hit',
      missingMaster: flags.missingMaster,
      cacheHit: next,
      dataSourceTransition: flags.dataSourceTransition,
      runId: flags.runId,
    });
  };

  const handleTransitionChange = (value: DataSourceTransition) => {
    setDataSourceTransition(value);
    logUiState({
      action: 'config_delivery',
      screen: 'charts/auth-service-controls',
      controlId: 'transition-select',
      dataSourceTransition: value,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      runId: flags.runId,
    });
  };

  const handleRunIdBlur = () => {
    const nextRunId = draftRunId || flags.runId;
    bumpRunId(nextRunId);
    logUiState({
      action: 'config_delivery',
      screen: 'charts/auth-service-controls',
      controlId: 'run-id-input',
      runId: nextRunId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      dataSourceTransition: flags.dataSourceTransition,
    });
  };

  return (
    <section className="auth-service-controls" aria-live={resolveAriaLive('info')} aria-atomic="false">
      <h2>Auth-service flags（デモ）</h2>
      <p className="auth-service-controls__description">
        `auth-service` から届く `missingMaster`/`cacheHit`/`dataSourceTransition` を切り替えて、Charts 側の tone を
        `data-run-id` ごとに確認できます。
      </p>
      <div className="auth-service-controls__grid">
        <button
          type="button"
          className="auth-service-controls__toggle"
          onClick={handleToggleMissingMaster}
        >
          missingMaster: {flags.missingMaster ? 'true' : 'false'}
        </button>
        <button
          type="button"
          className="auth-service-controls__toggle"
          onClick={handleToggleCacheHit}
        >
          cacheHit: {flags.cacheHit ? 'true' : 'false'}
        </button>
        <label className="auth-service-controls__select" htmlFor="transition-select">
          <span>dataSourceTransition</span>
          <select
            id="transition-select"
            value={flags.dataSourceTransition}
            onChange={(event) => handleTransitionChange(event.target.value as DataSourceTransition)}
          >
            {TRANSITIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="auth-service-controls__select" htmlFor="run-id-input">
          <span>runId</span>
          <input
            id="run-id-input"
            value={draftRunId}
            onChange={(event) => setDraftRunId(event.target.value)}
            onBlur={handleRunIdBlur}
          />
        </label>
      </div>
    </section>
  );
}
