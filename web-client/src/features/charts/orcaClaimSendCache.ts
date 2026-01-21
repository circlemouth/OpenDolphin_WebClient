type StorageScope = { facilityId?: string | null; userId?: string | null };

export type OrcaClaimSendCacheEntry = {
  patientId?: string;
  appointmentId?: string;
  invoiceNumber?: string;
  dataId?: string;
  runId?: string;
  traceId?: string;
  apiResult?: string;
  sendStatus?: 'success' | 'error';
  errorMessage?: string;
  savedAt: string;
};

type OrcaClaimSendCacheStore = Record<string, OrcaClaimSendCacheEntry>;
const AUTH_STORAGE_KEY = 'opendolphin:web-client:auth';

const buildKey = (scope: StorageScope) => {
  const facility = scope.facilityId ?? 'unknown-facility';
  const user = scope.userId ?? 'unknown-user';
  return `charts:orca-claim-send:${facility}:${user}`;
};

const resolveScope = (scope: StorageScope): StorageScope => {
  if (scope.facilityId && scope.userId) return scope;
  if (typeof sessionStorage === 'undefined') return scope;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return scope;
    const parsed = JSON.parse(raw) as { facilityId?: string; userId?: string };
    return {
      facilityId: scope.facilityId ?? parsed.facilityId ?? undefined,
      userId: scope.userId ?? parsed.userId ?? undefined,
    };
  } catch {
    return scope;
  }
};

export function saveOrcaClaimSendCache(value: OrcaClaimSendCacheEntry, scope: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  if (!value.patientId) return;
  const resolvedScope = resolveScope(scope);
  const key = buildKey(resolvedScope);
  const payload: OrcaClaimSendCacheEntry = { ...value, savedAt: new Date().toISOString() };
  const store = loadOrcaClaimSendCache(resolvedScope) ?? {};
  store[value.patientId] = payload;
  sessionStorage.setItem(key, JSON.stringify(store));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('orca-claim-send-cache-update', { detail: { patientId: value.patientId } }));
  }
}

export function loadOrcaClaimSendCache(scope: StorageScope): OrcaClaimSendCacheStore | null {
  if (typeof sessionStorage === 'undefined') return null;
  const resolvedScope = resolveScope(scope);
  const key = buildKey(resolvedScope);
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OrcaClaimSendCacheStore | OrcaClaimSendCacheEntry;
    if (parsed && 'savedAt' in parsed) {
      return parsed.patientId ? { [parsed.patientId]: parsed } : null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

export function getOrcaClaimSendEntry(scope: StorageScope, patientId?: string | null) {
  if (!patientId) return null;
  const store = loadOrcaClaimSendCache(scope);
  return store?.[patientId] ?? null;
}
