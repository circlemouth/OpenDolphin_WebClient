export type StoredAuth = {
  facilityId: string;
  userId: string;
};

export function readStoredAuth(): StoredAuth | null {
  if (typeof localStorage === 'undefined') return null;
  const facilityId = localStorage.getItem('devFacilityId');
  const userId = localStorage.getItem('devUserId');
  if (!facilityId || !userId) return null;
  return { facilityId, userId };
}

export function resolveAuditActor(): string {
  const stored = readStoredAuth();
  if (!stored) return 'unknown';
  return `${stored.facilityId}:${stored.userId}`;
}

