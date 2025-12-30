import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';

import { buildFacilityPath, normalizeFacilityId } from '../../routes/facilityRoutes';
import { loadRecentFacilities } from './recentFacilityStore';

type FacilityLoginEntryProps = {
  heading?: string;
};

const normalizeFromState = (state: unknown): { from?: string | Location } | undefined => {
  if (!state) return undefined;
  if (typeof state === 'object' && state !== null && 'from' in state) {
    return state as { from?: string | Location };
  }
  return undefined;
};

export const FacilityLoginEntry = ({ heading = 'OpenDolphin Web 施設選択' }: FacilityLoginEntryProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [recentFacilities] = useState(() => loadRecentFacilities());
  const [manualMode, setManualMode] = useState(recentFacilities.length === 0);
  const [facilityInput, setFacilityInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fromState = useMemo(() => normalizeFromState(location.state)?.from, [location.state]);
  const forwardState = useMemo(() => (fromState ? { from: fromState } : undefined), [fromState]);

  const handleSelectFacility = (facilityId: string) => {
    const normalized = normalizeFacilityId(facilityId);
    if (!normalized) {
      setError('施設IDを入力してください。');
      return;
    }
    setError(null);
    navigate(buildFacilityPath(normalized, '/login'), { state: forwardState });
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSelectFacility(facilityInput);
  };

  const handleManualChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFacilityInput(event.target.value);
    if (error) setError(null);
  };

  const hasRecentFacilities = recentFacilities.length > 0;

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="facility-login-heading">
        <header className="login-card__header">
          <h1 id="facility-login-heading">{heading}</h1>
          <p>ログインする施設IDを選択または入力してください。選択後にログイン画面へ進みます。</p>
        </header>

        {hasRecentFacilities ? (
          <div className="facility-entry__block" aria-label="最近利用施設">
            <p className="facility-entry__label">最近利用した施設</p>
            <div className="facility-entry__choices">
              {recentFacilities.map((facilityId) => (
                <button
                  key={facilityId}
                  type="button"
                  className="facility-entry__choice"
                  onClick={() => handleSelectFacility(facilityId)}
                >
                  {facilityId}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="facility-entry__toggle"
              onClick={() => setManualMode(true)}
              disabled={manualMode}
            >
              別施設を選択
            </button>
          </div>
        ) : (
          <p className="facility-entry__empty">最近利用した施設は未登録です。</p>
        )}

        {manualMode ? (
          <form className="login-form facility-entry__form" onSubmit={handleManualSubmit} noValidate>
            <label className="field">
              <span>施設ID</span>
              <input
                type="text"
                autoComplete="organization"
                value={facilityInput}
                onChange={handleManualChange}
                placeholder="例: 0001"
              />
            </label>
            {error ? <span className="field-error">{error}</span> : null}

            <div className="login-form__actions facility-entry__actions">
              <button type="submit">ログインへ進む</button>
              {hasRecentFacilities ? (
                <button
                  type="button"
                  className="facility-entry__secondary"
                  onClick={() => setManualMode(false)}
                >
                  最近利用施設から選択
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>
    </main>
  );
};
