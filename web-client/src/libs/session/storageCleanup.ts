import { buildScopedStorageKey, toScopeSuffix, type StorageScope } from './storageScope';

const SESSION_BASE_KEYS = [
  'opendolphin:web-client:charts:encounter-context',
  'opendolphin:web-client:patients:returnTo',
  'opendolphin:web-client:soap-history',
  'opendolphin:web-client:charts:printPreview:outpatient',
  'opendolphin:web-client:charts:printPreview:report',
  'opendolphin:web-client:charts:printResult:outpatient',
  'opendolphin:web-client:tab-session-id',
  'opendolphin:web-client:auth',
  'opendolphin:web-client:auth-flags',
];

const LOCAL_BASE_KEYS = [
  'opendolphin:web-client:charts:lock',
  'opendolphin:web-client:auth:shared-session',
  'opendolphin:web-client:auth:shared-flags',
];

const VERSIONS = ['v2', 'v1'];

const removeIfMatch = (storage: Storage, predicate: (key: string) => boolean) => {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && predicate(key)) keys.push(key);
  }
  keys.forEach((key) => {
    try {
      storage.removeItem(key);
    } catch {
      // ignore removal failures
    }
  });
};

const matchScopedKey = (base: string, scope: StorageScope, versions = VERSIONS) => {
  const suffix = toScopeSuffix(scope);
  if (!suffix) return (key: string) => false;
  return (key: string) =>
    versions.some((ver) => {
      const prefixWithScope = `${base}:${ver}:${suffix}`;
      const prefixWithoutScope = `${base}:${ver}`;
      return (
        key === prefixWithScope ||
        key.startsWith(`${prefixWithScope}:`) ||
        key === prefixWithoutScope ||
        key.startsWith(`${prefixWithoutScope}:`)
      );
    });
};

export const clearScopedStorage = (scope: StorageScope) => {
  if (typeof window === 'undefined') return;

  // sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    removeIfMatch(sessionStorage, (key) => SESSION_BASE_KEYS.some((base) => matchScopedKey(base, scope)(key)));
  }

  // localStorage
  if (typeof localStorage !== 'undefined') {
    removeIfMatch(localStorage, (key) => {
      if (LOCAL_BASE_KEYS.some((base) => matchScopedKey(base, scope)(key))) return true;
      return false;
    });
  }
};

export const clearAllAuthShared = () => {
  if (typeof localStorage === 'undefined') return;
  ['opendolphin:web-client:auth:shared-session:v1', 'opendolphin:web-client:auth:shared-flags:v1'].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
};
