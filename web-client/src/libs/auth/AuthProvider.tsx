import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { AuthContext } from '@/libs/auth/auth-context';
import { createAuthHeaders } from '@/libs/auth/auth-headers';
import { destroyAuthSession, loginWithPassword, restoreAuthSession } from '@/libs/auth/auth-service';
import type { AuthContextValue, AuthSession, LoginPayload } from '@/libs/auth/auth-types';
import { setAuthHeaderProvider } from '@/libs/http/httpClient';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<AuthSession | null>(() => restoreAuthSession());

  useEffect(() => {
    setAuthHeaderProvider(() => (session ? createAuthHeaders(session.credentials) : null));
  }, [session]);

  useEffect(() => {
    const handleStorage = () => {
      setSession(restoreAuthSession());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const nextSession = await loginWithPassword(payload);
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    destroyAuthSession();
    setSession(null);
  }, []);

  const getAuthHeaders = useCallback(
    () => (session ? createAuthHeaders(session.credentials) : {}),
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login,
      logout,
      getAuthHeaders,
    }),
    [getAuthHeaders, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
