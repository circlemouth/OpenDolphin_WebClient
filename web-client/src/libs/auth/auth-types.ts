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

export interface AuthContextValue {
  credentials: AuthCredentials | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthCredentials>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}
