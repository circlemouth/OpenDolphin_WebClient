export type ChartsTabLockOwner = {
  runId?: string;
  tabSessionId: string;
};

export type ChartsTabLockRecord = {
  version: 1;
  key: string;
  owner: ChartsTabLockOwner;
  acquiredAt: string; // ISO
  expiresAt: string; // ISO
};

const TAB_SESSION_STORAGE_BASE = 'opendolphin:web-client:tab-session-id';
const TAB_SESSION_STORAGE_VERSION = 'v2';
const TAB_SESSION_STORAGE_LEGACY = `${TAB_SESSION_STORAGE_BASE}:v1`;
const LOCK_BASE = 'opendolphin:web-client:charts:lock';
const LOCK_VERSION = 'v2';
const LOCK_LEGACY_PREFIX = `${LOCK_BASE}:v1:`;
const LOCK_PREFIX_V2 = `${LOCK_BASE}:${LOCK_VERSION}:`;
const BROADCAST_CHANNEL = `${LOCK_BASE}:${LOCK_VERSION}`;

export type ChartsLockTarget = {
  facilityId?: string;
  patientId?: string;
  receptionId?: string;
  appointmentId?: string;
};

const safeJsonParse = (raw: string | null): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const toIso = (value: Date) => value.toISOString();

const parseIsoDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function getOrCreateTabSessionId(scope?: StorageScope): string {
  if (typeof sessionStorage === 'undefined') {
    return `tab-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
  }
  const scopedKey =
    buildScopedStorageKey(TAB_SESSION_STORAGE_BASE, TAB_SESSION_STORAGE_VERSION, scope) ?? TAB_SESSION_STORAGE_LEGACY;
  const existing = sessionStorage.getItem(scopedKey) ?? sessionStorage.getItem(TAB_SESSION_STORAGE_LEGACY);
  if (existing) return existing;
  const generated = `tab-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
  try {
    sessionStorage.setItem(scopedKey, generated);
    if (scopedKey !== TAB_SESSION_STORAGE_LEGACY) {
      sessionStorage.removeItem(TAB_SESSION_STORAGE_LEGACY);
    }
  } catch {
    // storage が使えない環境では揮発 ID として扱う
  }
  return generated;
}

export function buildChartsTabLockStorageKey(target: ChartsLockTarget, userScope?: StorageScope): string | null {
  const facility = (target.facilityId ?? '').trim();
  const patientId = (target.patientId ?? '').trim();
  if (!patientId) return null;
  const receptionId = (target.receptionId ?? '').trim();
  const appointmentId = (target.appointmentId ?? '').trim();
  const encounterScope = receptionId ? `reception:${receptionId}` : appointmentId ? `appointment:${appointmentId}` : `patient:${patientId}`;
  const facilityPart = facility ? `facility:${facility}` : 'facility:unknown';
  const scopedSuffix = buildScopedStorageKey(LOCK_BASE, LOCK_VERSION, userScope) ?? `${LOCK_BASE}:${LOCK_VERSION}`;
  return `${scopedSuffix}:${facilityPart}:${encounterScope}`;
}

export function buildLegacyChartsTabLockStorageKey(target: ChartsLockTarget): string | null {
  const facility = (target.facilityId ?? '').trim();
  const patientId = (target.patientId ?? '').trim();
  if (!patientId) return null;
  const receptionId = (target.receptionId ?? '').trim();
  const appointmentId = (target.appointmentId ?? '').trim();
  const scope = receptionId ? `reception:${receptionId}` : appointmentId ? `appointment:${appointmentId}` : `patient:${patientId}`;
  const facilityPart = facility ? `facility:${facility}` : 'facility:unknown';
  return `${LOCK_LEGACY_PREFIX}${facilityPart}:${patientId}:${scope}`;
}

export function readChartsTabLock(storageKey: string): ChartsTabLockRecord | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(storageKey);
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  const record = parsed as Partial<ChartsTabLockRecord>;
  if (record.version !== 1) return null;
  if (typeof record.key !== 'string') return null;
  if (!record.owner || typeof record.owner !== 'object') return null;
  const owner = record.owner as Partial<ChartsTabLockOwner>;
  if (typeof owner.tabSessionId !== 'string' || owner.tabSessionId.length === 0) return null;
  if (typeof record.acquiredAt !== 'string') return null;
  if (typeof record.expiresAt !== 'string') return null;
  if (!parseIsoDate(record.acquiredAt) || !parseIsoDate(record.expiresAt)) return null;
  return {
    version: 1,
    key: record.key,
    owner: { tabSessionId: owner.tabSessionId, runId: typeof owner.runId === 'string' ? owner.runId : undefined },
    acquiredAt: record.acquiredAt,
    expiresAt: record.expiresAt,
  };
}

export function isChartsTabLockExpired(lock: ChartsTabLockRecord, now = new Date()): boolean {
  const expires = parseIsoDate(lock.expiresAt);
  if (!expires) return true;
  return expires.getTime() <= now.getTime();
}

export function writeChartsTabLock(record: ChartsTabLockRecord) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(record.key, JSON.stringify(record));
  } catch {
    // storage が使えない環境ではスキップ
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL);
      channel.postMessage({ type: 'lock:update', key: record.key });
      channel.close();
    }
  } catch {
    // broadcast が無い/失敗しても storage event で同期される
  }
}

export function removeChartsTabLock(storageKey: string) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL);
      channel.postMessage({ type: 'lock:remove', key: storageKey });
      channel.close();
    }
  } catch {
    // ignore
  }
}

export type AcquireChartsTabLockResult =
  | { ok: true; record: ChartsTabLockRecord; stolen?: boolean }
  | { ok: false; reason: 'locked_by_other_tab'; existing: ChartsTabLockRecord };

export function acquireChartsTabLock(options: {
  storageKey: string;
  owner: ChartsTabLockOwner;
  ttlMs: number;
  now?: Date;
  force?: boolean;
}): AcquireChartsTabLockResult {
  const now = options.now ?? new Date();
  const existing = readChartsTabLock(options.storageKey);
  const expired = existing ? isChartsTabLockExpired(existing, now) : true;
  const ownedBySelf = existing?.owner.tabSessionId === options.owner.tabSessionId;
  const canTake = options.force === true || expired || ownedBySelf;

  if (existing && !canTake) {
    return { ok: false, reason: 'locked_by_other_tab', existing };
  }

  const record: ChartsTabLockRecord = {
    version: 1,
    key: options.storageKey,
    owner: options.owner,
    acquiredAt: ownedBySelf && existing ? existing.acquiredAt : toIso(now),
    expiresAt: toIso(new Date(now.getTime() + options.ttlMs)),
  };
  writeChartsTabLock(record);
  return { ok: true, record, stolen: Boolean(existing && !ownedBySelf) };
}

export function renewChartsTabLock(options: {
  storageKey: string;
  ownerTabSessionId: string;
  ttlMs: number;
  now?: Date;
}): { ok: true; record: ChartsTabLockRecord } | { ok: false; reason: 'not_owner' | 'missing' } {
  const now = options.now ?? new Date();
  const existing = readChartsTabLock(options.storageKey);
  if (!existing) return { ok: false, reason: 'missing' };
  if (existing.owner.tabSessionId !== options.ownerTabSessionId) return { ok: false, reason: 'not_owner' };
  const next: ChartsTabLockRecord = {
    ...existing,
    expiresAt: toIso(new Date(now.getTime() + options.ttlMs)),
  };
  writeChartsTabLock(next);
  return { ok: true, record: next };
}

export function releaseChartsTabLock(options: {
  storageKey: string;
  ownerTabSessionId: string;
}) {
  const existing = readChartsTabLock(options.storageKey);
  if (!existing) return;
  if (existing.owner.tabSessionId !== options.ownerTabSessionId) return;
  removeChartsTabLock(options.storageKey);
}

export function subscribeChartsTabLock(options: {
  onMessage: (key: string) => void;
}): () => void {
  const handlers: Array<() => void> = [];

  if (typeof window !== 'undefined') {
    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (!event.key.startsWith(LOCK_PREFIX_V2) && !event.key.startsWith(LOCK_LEGACY_PREFIX)) return;
      options.onMessage(event.key);
    };
    window.addEventListener('storage', onStorage);
    handlers.push(() => window.removeEventListener('storage', onStorage));
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL);
      const onMessage = (event: MessageEvent) => {
        const payload = event.data as { type?: string; key?: string } | null;
        if (!payload || typeof payload.key !== 'string') return;
        if (!payload.key.startsWith(LOCK_PREFIX_V2) && !payload.key.startsWith(LOCK_LEGACY_PREFIX)) return;
        options.onMessage(payload.key);
      };
      channel.addEventListener('message', onMessage);
      handlers.push(() => {
        channel.removeEventListener('message', onMessage);
        channel.close();
      });
    }
  } catch {
    // ignore
  }

  return () => handlers.forEach((dispose) => dispose());
}
import { buildScopedStorageKey, type StorageScope } from '../../libs/session/storageScope';
