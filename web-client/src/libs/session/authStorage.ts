export const AUTH_SESSION_STORAGE_KEY = 'opendolphin:web-client:auth';
export const AUTH_FLAGS_STORAGE_KEY = 'opendolphin:web-client:auth-flags';
export const AUTH_BROADCAST_CHANNEL = 'opendolphin:web-client:auth';

// 12 時間は既存の AuthService フラグ TTL と同じ。
export const AUTH_FLAGS_TTL_MS = 12 * 60 * 60 * 1000;
