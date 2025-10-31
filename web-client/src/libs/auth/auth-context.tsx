import { createContext, useContext } from 'react';

import type { AuthContextValue } from '@/libs/auth/auth-types';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth は AuthProvider 配下でのみ利用できます');
  }

  return context;
};
