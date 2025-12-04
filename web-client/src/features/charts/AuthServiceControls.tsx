import { useState } from 'react';

import { useAuthService, type DataSourceTransition } from './authService';

const TRANSITIONS: DataSourceTransition[] = ['mock', 'snapshot', 'server', 'fallback'];

export function AuthServiceControls() {
  const { flags, setMissingMaster, setCacheHit, setDataSourceTransition, bumpRunId } = useAuthService();
  const [draftRunId, setDraftRunId] = useState(flags.runId);

  return (
    <section className="auth-service-controls" aria-live="polite" aria-atomic="false">
      <h2>Auth-service flags（デモ）</h2>
      <p className="auth-service-controls__description">
        `auth-service` から届く `missingMaster`/`cacheHit`/`dataSourceTransition` を切り替えて、Charts 側の tone を
        `data-run-id` ごとに確認できます。
      </p>
      <div className="auth-service-controls__grid">
        <button
          type="button"
          className="auth-service-controls__toggle"
          onClick={() => setMissingMaster(!flags.missingMaster)}
        >
          missingMaster: {flags.missingMaster ? 'true' : 'false'}
        </button>
        <button
          type="button"
          className="auth-service-controls__toggle"
          onClick={() => setCacheHit(!flags.cacheHit)}
        >
          cacheHit: {flags.cacheHit ? 'true' : 'false'}
        </button>
        <label className="auth-service-controls__select" htmlFor="transition-select">
          <span>dataSourceTransition</span>
          <select
            id="transition-select"
            value={flags.dataSourceTransition}
            onChange={(event) => setDataSourceTransition(event.target.value as DataSourceTransition)}
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
            onBlur={() => bumpRunId(draftRunId || flags.runId)}
          />
        </label>
      </div>
    </section>
  );
}
