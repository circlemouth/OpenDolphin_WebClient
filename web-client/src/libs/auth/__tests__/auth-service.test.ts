import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hashPasswordMd5 } from '@/libs/auth/auth-headers';
import {
  destroyAuthSession,
  loginWithPassword,
  restoreAuthSession,
} from '@/libs/auth/auth-service';
import { __internal, clearAuthSession, loadStoredAuthSession } from '@/libs/auth/auth-storage';
import type { AuthSession } from '@/libs/auth/auth-types';
import { httpClient } from '@/libs/http';

describe('auth-service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAuthSession();
    if (typeof window !== 'undefined') {
      window.sessionStorage?.clear();
      window.localStorage?.clear();
    }
  });

  it('logs in via /user endpoint, hashes password, and persists the session', async () => {
    const facilityId = '0001';
    const userId = 'doctor01';
    const password = 'secret-password';
    const expectedHash = await hashPasswordMd5(password);

    const getSpy = vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: {
        facilityId,
        userId,
        displayName: '担当医 太郎',
        roles: ['doctor'],
      },
    } as never);

    const session = await loginWithPassword({ facilityId, userId, password });

    expect(getSpy).toHaveBeenCalledWith(`/user/${facilityId}:${userId}`, {
      headers: expect.objectContaining({
        userName: `${facilityId}:${userId}`,
        password: expectedHash,
      }),
    });

    expect(session.credentials.facilityId).toBe(facilityId);
    expect(session.credentials.userId).toBe(userId);
    expect(session.credentials.passwordMd5).toBe(expectedHash);
    expect(session.credentials.clientUuid).toMatch(/[0-9a-f-]{8,}/i);
    expect(session.userProfile?.displayName).toBe('担当医 太郎');

    const stored = loadStoredAuthSession();
    expect(stored).not.toBeNull();
    expect(stored?.credentials.passwordMd5).toBe(expectedHash);
  });

  it('restores session from storage', () => {
    const mockSession: AuthSession = {
      credentials: {
        facilityId: '0001',
        userId: 'nurse01',
        passwordMd5: 'hash',
        clientUuid: 'uuid',
      },
      userProfile: {
        facilityId: '0001',
        userId: 'nurse01',
        displayName: '看護師 花子',
      },
    };

    clearAuthSession();
    const storage = window.sessionStorage ?? window.localStorage;
    storage?.setItem(
      __internal.STORAGE_KEY,
      JSON.stringify({ ...mockSession, persistedAt: Date.now() }),
    );

    const restored = restoreAuthSession();
    expect(restored).toEqual(mockSession);
  });

  it('clears session on destroyAuthSession', () => {
    const storage = window.sessionStorage ?? window.localStorage;
    storage?.setItem(
      __internal.STORAGE_KEY,
      JSON.stringify({
        credentials: {
          facilityId: '0001',
          userId: 'admin01',
          passwordMd5: 'hash',
          clientUuid: 'uuid',
        },
        persistedAt: Date.now(),
      }),
    );

    destroyAuthSession();

    expect(loadStoredAuthSession()).toBeNull();
  });
});
