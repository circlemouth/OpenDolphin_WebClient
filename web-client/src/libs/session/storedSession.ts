const AUTH_STORAGE_KEY = 'opendolphin:web-client:auth';

export type StoredSession = {
  facilityId: string;
  userId: string;
  displayName?: string;
  commonName?: string;
  role?: string;
  runId?: string;
};

export function readStoredSession(): StoredSession | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.facilityId || !parsed.userId) return null;
    return {
      facilityId: parsed.facilityId,
      userId: parsed.userId,
      displayName: parsed.displayName,
      commonName: parsed.commonName,
      role: parsed.role,
      runId: parsed.runId,
    };
  } catch {
    return null;
  }
}

export function resolveSessionActor(): { actor: string; facilityId: string } | null {
  const session = readStoredSession();
  if (!session) return null;
  return { actor: `${session.facilityId}:${session.userId}`, facilityId: session.facilityId };
}

