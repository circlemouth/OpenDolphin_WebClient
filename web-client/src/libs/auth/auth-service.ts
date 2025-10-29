import { httpClient } from '@/libs/http/httpClient';
import { createAuthHeaders, createClientUuid, hashPasswordMd5 } from '@/libs/auth/auth-headers';
import { clearAuthSession, loadStoredAuthSession, persistAuthSession } from '@/libs/auth/auth-storage';
import type { AuthSession, LoginPayload } from '@/libs/auth/auth-types';

interface RoleResource {
  role?: string;
}

interface LicenseResource {
  license?: string;
}

interface FacilityResource {
  facilityId?: string;
  facilityName?: string;
}

interface UserResourceResponse {
  id?: number;
  userId: string;
  facilityId: string;
  displayName?: string;
  commonName?: string;
  roles?: RoleResource[];
  licenseModel?: LicenseResource | null;
  facilityModel?: FacilityResource | null;
}

const formatUserEndpoint = (facilityId: string, userId: string) => `/user/${facilityId}:${userId}`;

export const restoreAuthSession = (): AuthSession | null => {
  const stored = loadStoredAuthSession();
  if (!stored) {
    return null;
  }

  return {
    credentials: stored.credentials,
    userProfile: stored.userProfile,
  };
};

export const loginWithPassword = async (payload: LoginPayload): Promise<AuthSession> => {
  const passwordMd5 = await hashPasswordMd5(payload.password);
  const clientUuid = createClientUuid(payload.clientUuid);

  const credentials = {
    facilityId: payload.facilityId,
    userId: payload.userId,
    passwordMd5,
    clientUuid,
  } as const;

  const endpoint = formatUserEndpoint(payload.facilityId, payload.userId);
  const response = await httpClient.get<UserResourceResponse>(endpoint, {
    headers: createAuthHeaders(credentials),
  });

  const userProfile = response.data
    ? {
        facilityId: response.data.facilityId ?? payload.facilityId,
        userId: response.data.userId ?? payload.userId,
        displayName: response.data.displayName ?? response.data.commonName,
        roles: response.data.roles?.map((role) => role.role).filter((role): role is string => Boolean(role)),
        userModelId: response.data.id,
        commonName: response.data.commonName,
        facilityName: response.data.facilityModel?.facilityName,
        licenseName: response.data.licenseModel?.license,
      }
    : undefined;

  const session: AuthSession = {
    credentials,
    userProfile,
  };

  persistAuthSession({
    credentials,
    userProfile,
    persistedAt: Date.now(),
  });

  return session;
};

export const destroyAuthSession = () => {
  clearAuthSession();
};
