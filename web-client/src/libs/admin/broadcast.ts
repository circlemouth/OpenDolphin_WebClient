export type AdminDeliveryFlagState = 'applied' | 'pending' | 'unknown';

export type AdminDeliveryStatus = {
  chartsDisplayEnabled?: AdminDeliveryFlagState;
  chartsSendEnabled?: AdminDeliveryFlagState;
  chartsMasterSource?: AdminDeliveryFlagState;
};

export type AdminBroadcast = {
  runId?: string;
  action?: 'config' | 'queue';
  deliveryId?: string;
  deliveryVersion?: string;
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
  queueCount?: number;
  queueWarningCount?: number;
  note?: string;
  source?: string;
  updatedAt: string;
};

const STORAGE_KEY = 'admin:broadcast';

const parseBroadcast = (raw: string | null): AdminBroadcast | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdminBroadcast;
    return parsed;
  } catch {
    return null;
  }
};

export function readAdminBroadcast(): AdminBroadcast | null {
  if (typeof localStorage === 'undefined') return null;
  return parseBroadcast(localStorage.getItem(STORAGE_KEY));
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

export function subscribeAdminBroadcast(callback: (payload: AdminBroadcast) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleCustom = (event: Event) => {
    const custom = event as CustomEvent<AdminBroadcast>;
    if (custom.detail) callback(custom.detail);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    const parsed = parseBroadcast(event.newValue);
    if (parsed) callback(parsed);
  };

  window.addEventListener('admin:broadcast', handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('admin:broadcast', handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}
