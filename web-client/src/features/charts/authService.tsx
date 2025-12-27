import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { logUiState } from '../../libs/audit/auditLogger';
import { getObservabilityMeta, updateObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition as ObservabilityDataSourceTransition } from '../../libs/observability/types';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { handleOutpatientFlags } from './orchestration';

export type DataSourceTransition = ObservabilityDataSourceTransition;

export type AuthServiceFlags = {
  runId: string;
  missingMaster: boolean;
  cacheHit: boolean;
  dataSourceTransition: DataSourceTransition;
  fallbackUsed: boolean;
};

export interface AuthServiceContextValue {
  flags: AuthServiceFlags;
  setMissingMaster: (next: boolean) => void;
  setCacheHit: (next: boolean) => void;
  setDataSourceTransition: (next: DataSourceTransition) => void;
  setFallbackUsed: (next: boolean) => void;
  bumpRunId: (runId: string) => void;
}

const AUTH_RUN_ID = getObservabilityMeta().runId ?? '20251205T150000Z';
const AUTH_FLAGS_STORAGE_KEY = 'opendolphin:web-client:auth-flags';
const AUTH_FLAGS_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_FLAGS: AuthServiceFlags = {
  runId: AUTH_RUN_ID,
  missingMaster: true,
  cacheHit: false,
  dataSourceTransition: 'snapshot',
  fallbackUsed: false,
};

const AuthServiceContext = createContext<AuthServiceContextValue | null>(null);

type StoredAuthFlags = {
  sessionKey: string;
  flags: AuthServiceFlags;
  updatedAt: string;
};

const readStoredAuthFlags = (sessionKey?: string, expectedRunId?: string): AuthServiceFlags | null => {
  if (!sessionKey || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_FLAGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuthFlags;
    if (!parsed || parsed.sessionKey !== sessionKey || !parsed.flags) {
      sessionStorage.removeItem(AUTH_FLAGS_STORAGE_KEY);
      return null;
    }
    if (expectedRunId && parsed.flags.runId !== expectedRunId) {
      sessionStorage.removeItem(AUTH_FLAGS_STORAGE_KEY);
      return null;
    }
    const updatedAt = Date.parse(parsed.updatedAt);
    if (!Number.isNaN(updatedAt) && Date.now() - updatedAt > AUTH_FLAGS_TTL_MS) {
      sessionStorage.removeItem(AUTH_FLAGS_STORAGE_KEY);
      return null;
    }
    return parsed.flags;
  } catch {
    return null;
  }
};

const persistAuthFlags = (sessionKey: string | undefined, flags: AuthServiceFlags) => {
  if (!sessionKey || typeof sessionStorage === 'undefined') return;
  const payload: StoredAuthFlags = {
    sessionKey,
    flags,
    updatedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(AUTH_FLAGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

export const clearStoredAuthFlags = () => {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(AUTH_FLAGS_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

type AuthServicePatch = Partial<AuthServiceFlags>;

const definedPatch = (patch: AuthServicePatch) => {
  const next: AuthServicePatch = {};
  if (patch.runId !== undefined) next.runId = patch.runId;
  if (patch.cacheHit !== undefined) next.cacheHit = patch.cacheHit;
  if (patch.missingMaster !== undefined) next.missingMaster = patch.missingMaster;
  if (patch.dataSourceTransition !== undefined) next.dataSourceTransition = patch.dataSourceTransition;
  if (patch.fallbackUsed !== undefined) next.fallbackUsed = patch.fallbackUsed;
  return next;
};

export const applyAuthServicePatch = (
  patch: AuthServicePatch,
  previous: AuthServicePatch,
  actions: Pick<
    AuthServiceContextValue,
    'bumpRunId' | 'setCacheHit' | 'setMissingMaster' | 'setDataSourceTransition' | 'setFallbackUsed'
  >,
): AuthServicePatch => {
  const updates = definedPatch(patch);
  const changed = Object.entries(updates).some(([key, value]) => previous[key as keyof AuthServicePatch] !== value);
  if (!changed) return previous;

  if (typeof updates.runId === 'string' && updates.runId.length > 0) actions.bumpRunId(updates.runId);
  if (updates.cacheHit !== undefined) actions.setCacheHit(updates.cacheHit);
  if (updates.missingMaster !== undefined) actions.setMissingMaster(updates.missingMaster);
  if (updates.dataSourceTransition !== undefined) actions.setDataSourceTransition(updates.dataSourceTransition);
  if (updates.fallbackUsed !== undefined) actions.setFallbackUsed(updates.fallbackUsed);

  return { ...previous, ...updates };
};

export function AuthServiceProvider({
  children,
  initialFlags,
  sessionKey,
}: {
  children: ReactNode;
  initialFlags?: Partial<AuthServiceFlags>;
  sessionKey?: string;
}) {
  const [flags, setFlags] = useState<AuthServiceFlags>(() => {
    const base = {
      ...DEFAULT_FLAGS,
      ...initialFlags,
      runId: initialFlags?.runId ?? DEFAULT_FLAGS.runId,
    };
    const restored = readStoredAuthFlags(sessionKey, base.runId);
    return restored ? { ...base, ...restored, runId: restored.runId ?? base.runId } : base;
  });

  const setMissingMaster = useCallback((next: boolean) => {
    setFlags((prev) => ({ ...prev, missingMaster: next }));
  }, []);

  const setCacheHit = useCallback((next: boolean) => {
    setFlags((prev) => ({ ...prev, cacheHit: next }));
  }, []);

  const setDataSourceTransition = useCallback((next: DataSourceTransition) => {
    setFlags((prev) => ({ ...prev, dataSourceTransition: next }));
  }, []);

  const setFallbackUsed = useCallback((next: boolean) => {
    setFlags((prev) => ({ ...prev, fallbackUsed: next }));
  }, []);

  const bumpRunId = useCallback((runId: string) => {
    setFlags((prev) => ({ ...prev, runId }));
  }, []);

  useEffect(() => {
    const flagSnapshot = {
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      fallbackUsed: flags.fallbackUsed,
    };
    updateObservabilityMeta({
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      dataSourceTransition: flags.dataSourceTransition,
      fallbackUsed: flags.fallbackUsed,
    });
    recordOutpatientFunnel('resolve_master', {
      ...flagSnapshot,
      dataSourceTransition: flags.dataSourceTransition,
      fallbackUsed: flags.fallbackUsed,
    });
    handleOutpatientFlags({
      ...flagSnapshot,
      dataSourceTransition: flags.dataSourceTransition,
      fallbackUsed: flags.fallbackUsed,
    });
    logUiState({
      action: 'tone_change',
      screen: 'charts/auth-service',
      controlId: 'auth-service-flags',
      dataSourceTransition: flags.dataSourceTransition,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      fallbackUsed: flags.fallbackUsed,
      runId: flags.runId,
    });
    persistAuthFlags(sessionKey, flags);
  }, [flags.runId, flags.cacheHit, flags.missingMaster, flags.dataSourceTransition, flags.fallbackUsed, sessionKey]);

  const value = useMemo(
    () => ({ flags, setMissingMaster, setCacheHit, setDataSourceTransition, setFallbackUsed, bumpRunId }),
    [flags, bumpRunId, setCacheHit, setDataSourceTransition, setMissingMaster, setFallbackUsed],
  );

  return <AuthServiceContext.Provider value={value}>{children}</AuthServiceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthService() {
  const context = useContext(AuthServiceContext);
  if (!context) {
    throw new Error('useAuthService must be used within AuthServiceProvider');
  }
  return context;
}
