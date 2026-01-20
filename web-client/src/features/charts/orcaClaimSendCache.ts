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

const buildKey = (scope: StorageScope) => {
  const facility = scope.facilityId ?? 'unknown-facility';
  const user = scope.userId ?? 'unknown-user';
  return `charts:orca-claim-send:${facility}:${user}`;
};

export function saveOrcaClaimSendCache(value: OrcaClaimSendCacheEntry, scope: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  if (!value.patientId) return;
  const key = buildKey(scope);
  const payload: OrcaClaimSendCacheEntry = { ...value, savedAt: new Date().toISOString() };
  const store = loadOrcaClaimSendCache(scope) ?? {};
  store[value.patientId] = payload;
  sessionStorage.setItem(key, JSON.stringify(store));
}

export function loadOrcaClaimSendCache(scope: StorageScope): OrcaClaimSendCacheStore | null {
  if (typeof sessionStorage === 'undefined') return null;
  const key = buildKey(scope);
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
