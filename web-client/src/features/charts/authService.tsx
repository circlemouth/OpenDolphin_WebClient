import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type DataSourceTransition = 'mock' | 'snapshot' | 'server' | 'fallback';

export type AuthServiceFlags = {
  runId: string;
  missingMaster: boolean;
  cacheHit: boolean;
  dataSourceTransition: DataSourceTransition;
};

export interface AuthServiceContextValue {
  flags: AuthServiceFlags;
  setMissingMaster: (next: boolean) => void;
  setCacheHit: (next: boolean) => void;
  setDataSourceTransition: (next: DataSourceTransition) => void;
  bumpRunId: (runId: string) => void;
}

const AUTH_RUN_ID = '20251205T090000Z';
const DEFAULT_FLAGS: AuthServiceFlags = {
  runId: AUTH_RUN_ID,
  missingMaster: true,
  cacheHit: false,
  dataSourceTransition: 'snapshot',
};

const AuthServiceContext = createContext<AuthServiceContextValue | null>(null);

export function AuthServiceProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState(DEFAULT_FLAGS);

  const setMissingMaster = useCallback((next: boolean) => {
    setFlags((prev) => ({ ...prev, missingMaster: next }));
  }, []);

  const setCacheHit = useCallback((next: boolean) => {
    setFlags((prev) => ({ ...prev, cacheHit: next }));
  }, []);

  const setDataSourceTransition = useCallback((next: DataSourceTransition) => {
    setFlags((prev) => ({ ...prev, dataSourceTransition: next }));
  }, []);

  const bumpRunId = useCallback((runId: string) => {
    setFlags((prev) => ({ ...prev, runId }));
  }, []);

  const value = useMemo(
    () => ({ flags, setMissingMaster, setCacheHit, setDataSourceTransition, bumpRunId }),
    [flags, bumpRunId, setCacheHit, setDataSourceTransition, setMissingMaster],
  );

  return <AuthServiceContext.Provider value={value}>{children}</AuthServiceContext.Provider>;
}

export function useAuthService() {
  const context = useContext(AuthServiceContext);
  if (!context) {
    throw new Error('useAuthService must be used within AuthServiceProvider');
  }
  return context;
}
