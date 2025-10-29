import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { AuthContext } from '@/libs/auth/auth-context';
import { createAuthHeaders, createClientUuid, hashPasswordMd5 } from '@/libs/auth/auth-headers';
import type { AuthContextValue, AuthCredentials, LoginPayload } from '@/libs/auth/auth-types';
import { setAuthHeaderProvider } from '@/libs/http/httpClient';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);

  useEffect(() => {
    setAuthHeaderProvider(() => (credentials ? createAuthHeaders(credentials) : null));
  }, [credentials]);

  const login = useCallback(async (payload: LoginPayload) => {
    const passwordMd5 = await hashPasswordMd5(payload.password);
    const clientUuid = createClientUuid(payload.clientUuid);

    const nextCredentials: AuthCredentials = {
      facilityId: payload.facilityId,
      userId: payload.userId,
      passwordMd5,
      clientUuid,
    };

    setCredentials(nextCredentials);
    return nextCredentials;
  }, []);

  const logout = useCallback(() => {
    setCredentials(null);
  }, []);

  const getAuthHeaders = useCallback(() => (credentials ? createAuthHeaders(credentials) : {}), [credentials]);

  const value = useMemo<AuthContextValue>(
    () => ({
      credentials,
      isAuthenticated: Boolean(credentials),
      login,
      logout,
      getAuthHeaders,
    }),
    [credentials, getAuthHeaders, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
