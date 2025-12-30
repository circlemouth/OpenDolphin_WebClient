export const FACILITY_ROUTE_PREFIX = '/f';

export const normalizeFacilityId = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const decodeFacilityParam = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const buildFacilityPath = (facilityId: string | undefined, path: string): string => {
  const normalizedId = normalizeFacilityId(facilityId);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!normalizedId) return normalizedPath;
  if (normalizedPath.startsWith(`${FACILITY_ROUTE_PREFIX}/`)) return normalizedPath;
  return `${FACILITY_ROUTE_PREFIX}/${encodeURIComponent(normalizedId)}${normalizedPath}`;
};

export const buildFacilityUrl = (facilityId: string | undefined, pathname: string, search?: string): string => {
  const base = buildFacilityPath(facilityId, pathname);
  return search ? `${base}${search}` : base;
};

export const ensureFacilityUrl = (facilityId: string | undefined, pathname: string, search?: string): string => {
  if (pathname.startsWith(`${FACILITY_ROUTE_PREFIX}/`)) {
    return search ? `${pathname}${search}` : pathname;
  }
  return buildFacilityUrl(facilityId, pathname, search);
};

export const parseFacilityPath = (
  pathname: string,
): { facilityId: string; suffix: string } | null => {
  if (!pathname.startsWith(`${FACILITY_ROUTE_PREFIX}/`)) return null;
  const [, , rawFacilityId, ...rest] = pathname.split('/');
  if (!rawFacilityId) return null;
  const facilityId = decodeFacilityParam(rawFacilityId) ?? rawFacilityId;
  const suffix = `/${rest.join('/')}` || '/';
  return { facilityId, suffix: suffix === '/' ? '/' : suffix };
};
