import type { DataSourceTransition } from '../observability/types';
import {
  AUTH_BROADCAST_CHANNEL,
  AUTH_FLAGS_STORAGE_KEY,
  AUTH_FLAGS_TTL_MS,
  AUTH_SESSION_STORAGE_KEY,
} from './authStorage';

export type SharedAuthFlags = {
  runId: string;
  missingMaster: boolean;
  cacheHit: boolean;
  dataSourceTransition: DataSourceTransition;
  fallbackUsed: boolean;
};

export type SharedAuthSession = {
  facilityId: string;
  userId: string;
  displayName?: string;
  commonName?: string;
  role?: string;
  roles?: string[];
  clientUuid?: string;
  runId: string;
};

type SharedEnvelope<T> = {
  version: 1;
  sessionKey?: string;
  payload: T;
  updatedAt: string;
};

type AuthBroadcastMessage =
  | { version: 1; type: 'session:update'; envelope: SharedEnvelope<SharedAuthSession>; origin: string }
  | { version: 1; type: 'session:clear'; origin: string }
  | { version: 1; type: 'flags:update'; envelope: SharedEnvelope<SharedAuthFlags>; origin: string }
  | { version: 1; type: 'flags:clear'; origin: string };

const SHARED_SESSION_KEY = 'opendolphin:web-client:auth:shared-session:v1';
const SHARED_FLAGS_KEY = 'opendolphin:web-client:auth:shared-flags:v1';
const SHARED_SESSION_TTL_MS = AUTH_FLAGS_TTL_MS;

const TAB_ORIGIN =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;

const nowIso = () => new Date().toISOString();

const safeJsonParse = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const isExpired = (updatedAt: string, ttlMs: number) => {
  const parsed = Date.parse(updatedAt);
  if (Number.isNaN(parsed)) return true;
  return Date.now() - parsed > ttlMs;
};

const buildSessionKey = (session: { facilityId?: string; userId?: string } | null | undefined) => {
  if (!session?.facilityId || !session?.userId) return undefined;
  return `${session.facilityId}:${session.userId}`;
};

const validateSharedSession = (session: SharedAuthSession | null | undefined): session is SharedAuthSession => {
  if (!session) return false;
  return typeof session.facilityId === 'string' && typeof session.userId === 'string' && typeof session.runId === 'string';
};

const validateSharedFlags = (flags: SharedAuthFlags | null | undefined): flags is SharedAuthFlags => {
  if (!flags) return false;
  return (
    typeof flags.runId === 'string' &&
    typeof flags.missingMaster === 'boolean' &&
    typeof flags.cacheHit === 'boolean' &&
    typeof flags.fallbackUsed === 'boolean' &&
    typeof flags.dataSourceTransition === 'string'
  );
};

const writeLocalStorage = (key: string, value: unknown) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors (quota/denied)
  }
};

const removeLocalStorage = (key: string) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const postAuthMessage = (message: AuthBroadcastMessage) => {
  if (typeof BroadcastChannel === 'undefined') return;
  try {
    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // ignore broadcast failures
  }
};

const readSharedSessionEnvelope = (): SharedEnvelope<SharedAuthSession> | null => {
  if (typeof localStorage === 'undefined') return null;
  const parsed = safeJsonParse<SharedEnvelope<SharedAuthSession>>(localStorage.getItem(SHARED_SESSION_KEY));
  if (!parsed || parsed.version !== 1 || !parsed.payload || typeof parsed.updatedAt !== 'string') return null;
  if (isExpired(parsed.updatedAt, SHARED_SESSION_TTL_MS)) {
    removeLocalStorage(SHARED_SESSION_KEY);
    return null;
  }
  if (!validateSharedSession(parsed.payload)) return null;
  return parsed;
};

const readSharedFlagsEnvelope = (): SharedEnvelope<SharedAuthFlags> | null => {
  if (typeof localStorage === 'undefined') return null;
  const parsed = safeJsonParse<SharedEnvelope<SharedAuthFlags>>(localStorage.getItem(SHARED_FLAGS_KEY));
  if (!parsed || parsed.version !== 1 || !parsed.payload || typeof parsed.updatedAt !== 'string') return null;
  if (isExpired(parsed.updatedAt, AUTH_FLAGS_TTL_MS)) {
    removeLocalStorage(SHARED_FLAGS_KEY);
    return null;
  }
  if (!validateSharedFlags(parsed.payload)) return null;
  return parsed;
};

export function persistSharedSession(session: SharedAuthSession, origin = TAB_ORIGIN) {
  const envelope: SharedEnvelope<SharedAuthSession> = {
    version: 1,
    sessionKey: buildSessionKey(session),
    payload: session,
    updatedAt: nowIso(),
  };
  writeLocalStorage(SHARED_SESSION_KEY, envelope);
  postAuthMessage({ version: 1, type: 'session:update', envelope, origin });
}

export function persistSharedAuthFlags(sessionKey: string | undefined, flags: SharedAuthFlags, origin = TAB_ORIGIN) {
  if (!sessionKey) return;
  const envelope: SharedEnvelope<SharedAuthFlags> = {
    version: 1,
    sessionKey,
    payload: flags,
    updatedAt: nowIso(),
  };
  writeLocalStorage(SHARED_FLAGS_KEY, envelope);
  postAuthMessage({ version: 1, type: 'flags:update', envelope, origin });
}

export function clearSharedAuth(origin = TAB_ORIGIN) {
  removeLocalStorage(SHARED_SESSION_KEY);
  removeLocalStorage(SHARED_FLAGS_KEY);
  postAuthMessage({ version: 1, type: 'session:clear', origin });
  postAuthMessage({ version: 1, type: 'flags:clear', origin });
}

export function clearSharedAuthFlags(origin = TAB_ORIGIN) {
  removeLocalStorage(SHARED_FLAGS_KEY);
  postAuthMessage({ version: 1, type: 'flags:clear', origin });
}

export function clearSharedAuthSession(origin = TAB_ORIGIN) {
  removeLocalStorage(SHARED_SESSION_KEY);
  postAuthMessage({ version: 1, type: 'session:clear', origin });
}

export function restoreSharedAuthToSessionStorage(options?: { sessionKey?: string }) {
  if (typeof sessionStorage === 'undefined') return { session: null, flags: null };
  const sharedSession = readSharedSessionEnvelope();
  const derivedSessionKey = buildSessionKey(sharedSession?.payload);
  const targetSessionKey = options?.sessionKey ?? derivedSessionKey;
  const sharedFlags = readSharedFlagsEnvelope();

  const sessionPresent = Boolean(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY));
  if (!sessionPresent && sharedSession?.payload) {
    try {
      sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(sharedSession.payload));
    } catch {
      // ignore storage errors
    }
  }

  const flagsPresent = Boolean(sessionStorage.getItem(AUTH_FLAGS_STORAGE_KEY));
  if (!flagsPresent && sharedFlags?.payload && sharedFlags.sessionKey === targetSessionKey) {
    try {
      sessionStorage.setItem(
        AUTH_FLAGS_STORAGE_KEY,
        JSON.stringify({
          sessionKey: sharedFlags.sessionKey,
          flags: sharedFlags.payload,
          updatedAt: sharedFlags.updatedAt,
        }),
      );
    } catch {
      // ignore storage errors
    }
  }

  return {
    session: sharedSession?.payload ?? null,
    flags: sharedFlags?.sessionKey === targetSessionKey ? sharedFlags.payload : null,
  };
}

export function resolveLatestSharedRunId(sessionKey?: string): string | undefined {
  const flagsEnvelope = readSharedFlagsEnvelope();
  if (flagsEnvelope && (!sessionKey || flagsEnvelope.sessionKey === sessionKey)) {
    return flagsEnvelope.payload.runId;
  }
  const sessionEnvelope = readSharedSessionEnvelope();
  if (sessionEnvelope && (!sessionKey || sessionEnvelope.sessionKey === sessionKey)) {
    return sessionEnvelope.payload.runId;
  }
  return undefined;
}

export function subscribeSharedAuth(options: {
  sessionKey?: string;
  onSession?: (session: SharedAuthSession, meta: { updatedAt: string; sessionKey?: string }) => void;
  onFlags?: (flags: SharedAuthFlags, meta: { updatedAt: string; sessionKey?: string }) => void;
  onClear?: () => void;
}) {
  const handlers: Array<() => void> = [];
  const { sessionKey, onSession, onFlags, onClear } = options;

  const handleFlagsEnvelope = (envelope: SharedEnvelope<SharedAuthFlags>) => {
    if (sessionKey && envelope.sessionKey !== sessionKey) return;
    if (!validateSharedFlags(envelope.payload)) return;
    onFlags?.(envelope.payload, { updatedAt: envelope.updatedAt, sessionKey: envelope.sessionKey });
  };

  const handleSessionEnvelope = (envelope: SharedEnvelope<SharedAuthSession>) => {
    if (!validateSharedSession(envelope.payload)) return;
    if (sessionKey && envelope.sessionKey && envelope.sessionKey !== sessionKey) return;
    onSession?.(envelope.payload, { updatedAt: envelope.updatedAt, sessionKey: envelope.sessionKey });
  };

  const onMessage = (payload: AuthBroadcastMessage) => {
    if (!payload || payload.version !== 1) return;
    switch (payload.type) {
      case 'session:update':
        handleSessionEnvelope(payload.envelope);
        break;
      case 'flags:update':
        handleFlagsEnvelope(payload.envelope);
        break;
      case 'session:clear':
      case 'flags:clear':
        onClear?.();
        break;
      default:
    }
  };

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
      const listener = (event: MessageEvent<AuthBroadcastMessage>) => onMessage(event.data);
      channel.addEventListener('message', listener);
      handlers.push(() => {
        channel.removeEventListener('message', listener);
        channel.close();
      });
    }
  } catch {
    // ignore broadcast errors
  }

  if (typeof window !== 'undefined') {
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === SHARED_SESSION_KEY) {
        const envelope = readSharedSessionEnvelope();
        if (envelope) handleSessionEnvelope(envelope);
        else onClear?.();
      }
      if (event.key === SHARED_FLAGS_KEY) {
        const envelope = readSharedFlagsEnvelope();
        if (envelope) handleFlagsEnvelope(envelope);
        else onClear?.();
      }
    };
    window.addEventListener('storage', onStorage);
    handlers.push(() => window.removeEventListener('storage', onStorage));
  }

  return () => handlers.forEach((dispose) => dispose());
}
