import { normalizeFacilityId } from '../../routes/facilityRoutes';

const RECENT_FACILITIES_KEY = 'opendolphin:web-client:recentFacilities';
const MAX_RECENT_FACILITIES = 5;

const parseStoredFacilities = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => (typeof value === 'string' ? normalizeFacilityId(value) : undefined))
      .filter((value): value is string => Boolean(value));
  } catch {
    return [];
  }
};

const uniqueFacilities = (values: string[]) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

export const loadRecentFacilities = (): string[] => {
  if (typeof localStorage === 'undefined') return [];
  const stored = parseStoredFacilities(localStorage.getItem(RECENT_FACILITIES_KEY));
  return uniqueFacilities(stored).slice(0, MAX_RECENT_FACILITIES);
};

export const loadDevFacilityId = (): string | undefined => {
  if (typeof localStorage === 'undefined') return undefined;
  return normalizeFacilityId(localStorage.getItem('devFacilityId'));
};

export const addRecentFacility = (facilityId: string) => {
  if (typeof localStorage === 'undefined') return [];
  const normalized = normalizeFacilityId(facilityId);
  if (!normalized) return loadRecentFacilities();
  const existing = loadRecentFacilities();
  const merged = uniqueFacilities([normalized, ...existing]).slice(0, MAX_RECENT_FACILITIES);
  try {
    localStorage.setItem(RECENT_FACILITIES_KEY, JSON.stringify(merged));
  } catch {
    // storage が使えない環境ではスキップ
  }
  return merged;
};
