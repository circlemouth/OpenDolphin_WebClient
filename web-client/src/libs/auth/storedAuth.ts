import { resolveSessionActor } from '../session/storedSession';

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

export function resolveAuditActor(): { actor: string; facilityId: string } {
  // 監査の「誰が」は、ログインにより確定した sessionStorage を優先する。
  // localStorage(devFacilityId/devUserId) はヘッダ補助のため乖離し得る。
  const sessionActor = resolveSessionActor();
  if (sessionActor) return sessionActor;

  const stored = readStoredAuth();
  if (!stored) return { actor: 'unknown', facilityId: 'unknown' };
  return { actor: `${stored.facilityId}:${stored.userId}`, facilityId: stored.facilityId };
}
