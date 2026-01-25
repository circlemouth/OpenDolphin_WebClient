type StorageScope = { facilityId?: string | null; userId?: string | null };

export type OrcaIncomeInfoCacheEntry = {
  patientId: string;
  performMonth?: string;
  invoiceNumbers: string[];
  fetchedAt: string;
  apiResult?: string;
  apiResultMessage?: string;
};

type OrcaIncomeInfoCacheStore = Record<string, OrcaIncomeInfoCacheEntry>;
const AUTH_STORAGE_KEY = 'opendolphin:web-client:auth';

const buildKey = (scope: StorageScope) => {
  const facility = scope.facilityId ?? 'unknown-facility';
  const user = scope.userId ?? 'unknown-user';
  return `charts:orca-income-info:${facility}:${user}`;
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

const normalizeInvoiceNumbers = (values: string[]) => {
  const seen = new Set<string>();
  const normalized: string[] = [];
  values.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    normalized.push(trimmed);
  });
  return normalized;
};

export function saveOrcaIncomeInfoCache(value: OrcaIncomeInfoCacheEntry, scope: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  if (!value.patientId) return;
  const resolvedScope = resolveScope(scope);
  const key = buildKey(resolvedScope);
  const payload: OrcaIncomeInfoCacheEntry = {
    ...value,
    invoiceNumbers: normalizeInvoiceNumbers(value.invoiceNumbers ?? []),
  };
  const store = loadOrcaIncomeInfoCache(resolvedScope) ?? {};
  store[value.patientId] = payload;
  sessionStorage.setItem(key, JSON.stringify(store));
}

export function loadOrcaIncomeInfoCache(scope: StorageScope): OrcaIncomeInfoCacheStore | null {
  if (typeof sessionStorage === 'undefined') return null;
  const resolvedScope = resolveScope(scope);
  const key = buildKey(resolvedScope);
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OrcaIncomeInfoCacheStore | OrcaIncomeInfoCacheEntry;
    if (parsed && typeof parsed === 'object') {
      const entry = parsed as OrcaIncomeInfoCacheEntry;
      const patientId = entry.patientId;
      if (typeof entry.fetchedAt === 'string' && typeof patientId === 'string' && patientId) {
        return { [patientId]: entry };
      }
    }
    return parsed as OrcaIncomeInfoCacheStore;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

export function getOrcaIncomeInfoEntry(scope: StorageScope, patientId?: string | null) {
  if (!patientId) return null;
  const store = loadOrcaIncomeInfoCache(scope);
  return store?.[patientId] ?? null;
}
