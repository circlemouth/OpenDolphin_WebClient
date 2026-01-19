export type StorageScope = {
  facilityId?: string;
  userId?: string;
};

const normalize = (value?: string) => value?.trim();

export const toScopeSuffix = (scope?: StorageScope | null): string | null => {
  const facility = normalize(scope?.facilityId);
  const user = normalize(scope?.userId);
  if (!facility || !user) return null;
  return `${facility}:${user}`;
};

export const buildScopedStorageKey = (
  baseKey: string,
  version: string,
  scope?: StorageScope | null,
): string | null => {
  const suffix = toScopeSuffix(scope);
  if (!suffix) return null;
  return `${baseKey}:${version}:${suffix}`;
};

export const isScopedKeyFor = (
  key: string,
  baseKey: string,
  version: string,
  scope?: StorageScope | null,
): boolean => {
  const suffix = toScopeSuffix(scope);
  if (!suffix) return false;
  return key === `${baseKey}:${version}:${suffix}`;
};
