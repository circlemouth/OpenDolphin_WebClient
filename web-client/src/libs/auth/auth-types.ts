import type { AuthHeaders } from '@/libs/auth/auth-headers';

export interface AuthIdentity {
  facilityId: string;
  userId: string;
}

export interface AuthCredentials extends AuthIdentity {
  passwordMd5: string;
  clientUuid: string;
}

export interface LoginPayload extends AuthIdentity {
  password: string;
  clientUuid?: string;
}

export interface AuthenticatedUserProfile {
  facilityId: string;
  userId: string;
  displayName?: string;
  roles?: string[];
  userModelId?: number;
  commonName?: string;
  facilityName?: string;
  licenseName?: string;
}

export interface AuthSession {
  credentials: AuthCredentials;
  userProfile?: AuthenticatedUserProfile;
}

export interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthSession>;
  logout: () => void;
  getAuthHeaders: () => AuthHeaders | null;
  hasRole: (role: string) => boolean;
  hasAnyRole: (...roles: string[]) => boolean;
}
