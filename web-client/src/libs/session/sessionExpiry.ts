export type SessionExpiryReason = 'unauthorized' | 'forbidden' | 'timeout';

export type SessionExpiryNotice = {
  reason: SessionExpiryReason;
  status?: number;
  occurredAt: string;
  message: string;
};

export const SESSION_EXPIRED_EVENT = 'opendolphin:session-expired';
const SESSION_EXPIRED_STORAGE_KEY = 'opendolphin:web-client:session-expired';
const SESSION_EXPIRED_DEBOUNCE_MS = 5000;

let lastNotifiedAt = 0;

const buildMessage = (reason: SessionExpiryReason) => {
  if (reason === 'forbidden') {
    return '権限不足のためアクセスできません。権限を確認して再ログインしてください。';
  }
  if (reason === 'timeout') {
    return 'セッションの有効期限が切れました。再ログインしてください。';
  }
  return 'セッションが切れました。再ログインしてください。';
};

export function notifySessionExpired(reason: SessionExpiryReason, status?: number) {
  const now = Date.now();
  if (now - lastNotifiedAt < SESSION_EXPIRED_DEBOUNCE_MS) return;
  lastNotifiedAt = now;
  const payload: SessionExpiryNotice = {
    reason,
    status,
    occurredAt: new Date(now).toISOString(),
    message: buildMessage(reason),
  };
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(SESSION_EXPIRED_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: payload }));
  }
}

export function consumeSessionExpiredNotice(): SessionExpiryNotice | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_EXPIRED_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_EXPIRED_STORAGE_KEY);
    const parsed = JSON.parse(raw) as SessionExpiryNotice;
    if (!parsed?.message) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSessionExpiredNotice() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_EXPIRED_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
