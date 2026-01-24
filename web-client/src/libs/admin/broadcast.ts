export type AdminDeliveryFlagState = 'applied' | 'pending' | 'unknown';

export type AdminDeliveryStatus = {
  chartsDisplayEnabled?: AdminDeliveryFlagState;
  chartsSendEnabled?: AdminDeliveryFlagState;
  chartsMasterSource?: AdminDeliveryFlagState;
};

export type AdminQueueStatus = {
  total: number;
  pending: number;
  failed: number;
  delayed: number;
};

export type AdminBroadcast = {
  runId?: string;
  facilityId?: string;
  userId?: string;
  action?: 'config' | 'queue';
  deliveryId?: string;
  deliveryVersion?: string;
  deliveryEtag?: string;
  deliveredAt?: string;
  queueMode?: 'mock' | 'live';
  verifyAdminDelivery?: boolean;
  chartsDisplayEnabled?: boolean;
  chartsSendEnabled?: boolean;
  chartsMasterSource?: string;
  environment?: string;
  deliveryStatus?: AdminDeliveryStatus;
  queueOperation?: 'retry' | 'discard';
  queueResult?: 'success' | 'failure';
  queuePatientId?: string;
  queueStatus?: AdminQueueStatus;
  note?: string;
  source?: string;
  updatedAt: string;
};

const STORAGE_KEY = 'admin:broadcast';
const ADMIN_BROADCAST_TTL_MS = 60 * 60 * 1000;

export type AdminBroadcastScope = {
  facilityId: string;
  userId: string;
};

const parseBroadcast = (raw: string | null): AdminBroadcast | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdminBroadcast;
    return parsed;
  } catch {
    return null;
  }
};

const isExpiredBroadcast = (record: AdminBroadcast): boolean => {
  if (!record.updatedAt) return true;
  const updatedAtMs = Date.parse(record.updatedAt);
  if (Number.isNaN(updatedAtMs)) return true;
  return Date.now() - updatedAtMs > ADMIN_BROADCAST_TTL_MS;
};

const matchesScope = (record: AdminBroadcast, scope?: AdminBroadcastScope): boolean => {
  if (!scope) return true;
  if (!record.facilityId || !record.userId) return false;
  return record.facilityId === scope.facilityId && record.userId === scope.userId;
};

const shouldPurgeLegacy = (record: AdminBroadcast, scope?: AdminBroadcastScope): boolean => {
  if (!scope) return false;
  return !record.facilityId || !record.userId;
};

const removeStoredBroadcast = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

export function readAdminBroadcast(scope?: AdminBroadcastScope): AdminBroadcast | null {
  if (typeof localStorage === 'undefined') return null;
  const parsed = parseBroadcast(localStorage.getItem(STORAGE_KEY));
  if (!parsed) return null;
  if (isExpiredBroadcast(parsed)) {
    removeStoredBroadcast();
    return null;
  }
  if (shouldPurgeLegacy(parsed, scope)) {
    removeStoredBroadcast();
    return null;
  }
  if (!matchesScope(parsed, scope)) return null;
  return parsed;
}

export function publishAdminBroadcast(payload: Omit<AdminBroadcast, 'updatedAt'>) {
  const record: AdminBroadcast = {
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<AdminBroadcast>('admin:broadcast', { detail: record }));
  }
  return record;
}

export function subscribeAdminBroadcast(callback: (payload: AdminBroadcast) => void, scope?: AdminBroadcastScope) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleCustom = (event: Event) => {
    const custom = event as CustomEvent<AdminBroadcast>;
    if (!custom.detail) return;
    if (isExpiredBroadcast(custom.detail)) return;
    if (shouldPurgeLegacy(custom.detail, scope)) return;
    if (!matchesScope(custom.detail, scope)) return;
    callback(custom.detail);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    const parsed = parseBroadcast(event.newValue);
    if (!parsed) return;
    if (isExpiredBroadcast(parsed)) {
      removeStoredBroadcast();
      return;
    }
    if (shouldPurgeLegacy(parsed, scope)) {
      removeStoredBroadcast();
      return;
    }
    if (!matchesScope(parsed, scope)) return;
    callback(parsed);
  };

  window.addEventListener('admin:broadcast', handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('admin:broadcast', handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}
