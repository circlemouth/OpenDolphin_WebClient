import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { buildFacilityPath, normalizeFacilityId } from '../../routes/facilityRoutes';
import { FacilityLoginEntry } from './FacilityLoginEntry';
import { isLegacyFrom, resolveFromState } from './loginRouteState';
import { loadDevFacilityId, loadRecentFacilities } from './recentFacilityStore';

type FacilityJson = {
  facilityId?: unknown;
};

const readDefaultFacilityId = () => normalizeFacilityId(import.meta.env.VITE_DEFAULT_FACILITY_ID ?? '');

const loadFacilityIdFromJson = async (): Promise<string | undefined> => {
  if (typeof fetch === 'undefined') return undefined;
  try {
    const response = await fetch('/facility.json', { cache: 'no-store' });
    if (!response.ok) return undefined;
    const data = (await response.json()) as FacilityJson;
    if (!data || typeof data !== 'object') return undefined;
    return normalizeFacilityId(typeof data.facilityId === 'string' ? data.facilityId : undefined);
  } catch {
    return undefined;
  }
};

const resolveFacilityId = async (): Promise<string | undefined> => {
  const recentFacilities = loadRecentFacilities();
  if (recentFacilities.length === 1) {
    return recentFacilities[0];
  }
  if (recentFacilities.length > 0) {
    return undefined;
  }

  const devFacilityId = loadDevFacilityId();
  if (devFacilityId) return devFacilityId;

  const envFacilityId = readDefaultFacilityId();
  if (envFacilityId) return envFacilityId;

  return loadFacilityIdFromJson();
};

export const FacilityLoginResolver = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showEntry, setShowEntry] = useState(false);
  const [isResolving, setIsResolving] = useState(true);

  const fromState = useMemo(() => resolveFromState(location.state), [location.state]);
  const forwardState = useMemo(() => (fromState ? { from: fromState } : undefined), [fromState]);
  const legacyFrom = useMemo(() => isLegacyFrom(fromState), [fromState]);

  useEffect(() => {
    let active = true;
    setShowEntry(false);
    setIsResolving(true);

    const attemptResolve = async () => {
      const facilityId = await resolveFacilityId();
      if (!active) return;
      if (facilityId) {
        navigate(buildFacilityPath(facilityId, '/login'), {
          replace: !(fromState || legacyFrom),
          state: forwardState,
        });
        return;
      }
      setShowEntry(true);
      setIsResolving(false);
    };

    void attemptResolve();

    return () => {
      active = false;
    };
  }, [forwardState, fromState, legacyFrom, location.key, navigate]);

  if (isResolving) {
    return (
      <main className="login-shell">
        <section className="login-card" aria-labelledby="facility-login-resolve">
          <header className="login-card__header">
            <h1 id="facility-login-resolve">施設情報を確認中…</h1>
            <p>施設IDの補完候補を確認しています。少々お待ちください。</p>
          </header>
        </section>
      </main>
    );
  }

  if (!showEntry) return null;

  return <FacilityLoginEntry />;
};
