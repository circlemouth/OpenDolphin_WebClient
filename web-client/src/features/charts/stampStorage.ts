import type { OrderBundleItem } from './orderBundleApi';

export type LocalStampBundle = {
  bundleName: string;
  admin: string;
  bundleNumber: string;
  adminMemo: string;
  memo: string;
  startDate: string;
  items: OrderBundleItem[];
};

export type LocalStampEntry = {
  id: string;
  name: string;
  category: string;
  target: string;
  entity: string;
  savedAt: string;
  bundle: LocalStampBundle;
};

const STORAGE_PREFIX = 'web-client:order-stamps';

const buildStorageKey = (userName: string) => `${STORAGE_PREFIX}:${userName}`;

const generateLocalStampId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function loadLocalStamps(userName: string): LocalStampEntry[] {
  if (typeof localStorage === 'undefined') return [];
  const key = buildStorageKey(userName);
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalStampEntry[];
  } catch {
    return [];
  }
}

export function saveLocalStamp(
  userName: string,
  entry: Omit<LocalStampEntry, 'id' | 'savedAt'>,
): LocalStampEntry {
  if (typeof localStorage === 'undefined') {
    return { ...entry, id: generateLocalStampId(), savedAt: new Date().toISOString() };
  }
  const key = buildStorageKey(userName);
  const existing = loadLocalStamps(userName);
  const next: LocalStampEntry = { ...entry, id: generateLocalStampId(), savedAt: new Date().toISOString() };
  const updated = [next, ...existing].slice(0, 200);
  localStorage.setItem(key, JSON.stringify(updated));
  return next;
}
