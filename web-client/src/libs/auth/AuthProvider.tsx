import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { AuthContext } from '@/libs/auth/auth-context';
import { createAuthHeaders } from '@/libs/auth/auth-headers';
import { destroyAuthSession, loginWithPassword, restoreAuthSession } from '@/libs/auth/auth-service';
import type { AuthContextValue, AuthSession, LoginPayload } from '@/libs/auth/auth-types';
import { setAuthHeaderProvider } from '@/libs/http/httpClient';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<AuthSession | null>(() => restoreAuthSession());

  const getAuthHeaders = useCallback(() => createAuthHeaders(session?.credentials), [session]);

  useEffect(() => {
    setAuthHeaderProvider(getAuthHeaders);

    return () => {
      setAuthHeaderProvider(null);
    };
  }, [getAuthHeaders]);

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

  const hasRole = useCallback(
    (role: string) => {
      const normalized = role?.trim().toLowerCase();
      if (!normalized) {
        return false;
      }
      const roles = session?.userProfile?.roles ?? [];
      return roles.some((entry) => entry?.toLowerCase() === normalized);
    },
    [session],
  );

  const hasAnyRole = useCallback(
    (...roles: string[]) => roles.some((role) => hasRole(role)),
    [hasRole],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login,
      logout,
      getAuthHeaders,
      hasRole,
      hasAnyRole,
    }),
    [getAuthHeaders, hasAnyRole, hasRole, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
