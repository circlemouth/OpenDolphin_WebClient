import type { AuthCredentials, AuthenticatedUserProfile } from '@/libs/auth/auth-types';

export interface StoredAuthSession {
  credentials: AuthCredentials;
  userProfile?: AuthenticatedUserProfile;
  persistedAt: number;
}

const STORAGE_KEY = 'opendolphin:web-client:auth';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const getStorage = (): StorageLike | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.sessionStorage) {
    return window.sessionStorage;
  }

  if (window.localStorage) {
    return window.localStorage;
  }

  return null;
};

export const loadStoredAuthSession = (): StoredAuthSession | null => {
  try {
    const storage = getStorage();
    if (!storage) {
      return null;
    }

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredAuthSession | undefined;
    if (!parsed || !parsed.credentials) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('認証セッションの復元に失敗しました。保存データを破棄します。', error);
    try {
      getStorage()?.removeItem(STORAGE_KEY);
    } catch (removeError) {
      console.warn('破損した認証セッションの削除に失敗しました。', removeError);
    }
    return null;
  }
};

export const persistAuthSession = (session: StoredAuthSession) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEY);
};

export const __internal = {
  STORAGE_KEY,
  getStorage,
};
