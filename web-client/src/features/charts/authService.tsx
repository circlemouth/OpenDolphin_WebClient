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
const DEFAULT_FLAGS: AuthServiceFlags = {
  runId: AUTH_RUN_ID,
  missingMaster: true,
  cacheHit: false,
  dataSourceTransition: 'snapshot',
  fallbackUsed: false,
};

const AuthServiceContext = createContext<AuthServiceContextValue | null>(null);

export function AuthServiceProvider({
  children,
  initialFlags,
}: {
  children: ReactNode;
  initialFlags?: Partial<AuthServiceFlags>;
}) {
  const [flags, setFlags] = useState<AuthServiceFlags>({
    ...DEFAULT_FLAGS,
    ...initialFlags,
    runId: initialFlags?.runId ?? DEFAULT_FLAGS.runId,
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
  }, [flags.runId, flags.cacheHit, flags.missingMaster, flags.dataSourceTransition, flags.fallbackUsed]);

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
