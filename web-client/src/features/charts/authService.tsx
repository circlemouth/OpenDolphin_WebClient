import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { handleOutpatientFlags } from './orchestration';

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
  replaceFlags: (next: Partial<AuthServiceFlags>) => void;
}

const AUTH_RUN_ID = '20251205T150000Z';
const DEFAULT_FLAGS: AuthServiceFlags = {
  runId: AUTH_RUN_ID,
  missingMaster: true,
  cacheHit: false,
  dataSourceTransition: 'snapshot',
};

const AuthServiceContext = createContext<AuthServiceContextValue | null>(null);

export function AuthServiceProvider({
  children,
  initialFlags,
  runId,
}: {
  children: ReactNode;
  initialFlags?: Partial<AuthServiceFlags>;
  runId?: string;
}) {
  const initialFlagsRef = useRef(initialFlags);
  const [flags, setFlags] = useState<AuthServiceFlags>({
    ...DEFAULT_FLAGS,
    ...initialFlags,
    runId: initialFlags?.runId ?? DEFAULT_FLAGS.runId,
  });

  useEffect(() => {
    initialFlagsRef.current = initialFlags;
  }, [initialFlags]);

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

  const replaceFlags = useCallback((next: Partial<AuthServiceFlags>) => {
    setFlags((prev) => ({ ...prev, ...next }));
  }, []);

  useEffect(() => {
    if (!runId) return;
    if (runId === flags.runId) return;
    setFlags({
      ...DEFAULT_FLAGS,
      ...(initialFlagsRef.current ?? {}),
      runId,
    });
  }, [flags.runId, runId]);

  useEffect(() => {
    const flagSnapshot = {
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
    };
    recordOutpatientFunnel('resolve_master', {
      ...flagSnapshot,
      dataSourceTransition: flags.dataSourceTransition,
    });
    handleOutpatientFlags({
      ...flagSnapshot,
      dataSourceTransition: flags.dataSourceTransition,
    });
  }, [flags.runId, flags.cacheHit, flags.missingMaster, flags.dataSourceTransition]);

  const value = useMemo(
    () => ({ flags, setMissingMaster, setCacheHit, setDataSourceTransition, bumpRunId, replaceFlags }),
    [flags, bumpRunId, replaceFlags, setCacheHit, setDataSourceTransition, setMissingMaster],
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
