type MaskedValue = string | number | boolean | null | undefined | Record<string, unknown> | MaskedValue[];

const REDACT_KEYS = new Set([
  'facilityid',
  'userid',
  'patientid',
  'appointmentid',
  'claimid',
  'actor',
  'displayname',
  'commonname',
  'name',
  'kana',
  'address',
  'phone',
  'zip',
  'insurance',
  'memo',
  'birthdate',
  'sex',
  'username',
  'user_name',
  'clientuuid',
  'client_uuid',
  'password',
  'passwordmd5',
]);

const REDACT_KEYWORDS = ['password', 'passcode', 'token', 'secret', 'authorization', 'cookie', 'sessionid', 'csrf'];

const shouldRedactKey = (key: string) => {
  const normalized = key.toLowerCase();
  if (REDACT_KEYS.has(normalized)) return true;
  return REDACT_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const redactValue = (value: unknown): MaskedValue => {
  if (value === null || value === undefined) return value as MaskedValue;
  if (typeof value === 'string' || typeof value === 'number') return '[REDACTED]';
  return '[REDACTED]';
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === '[object Object]';
};

const maskValue = (value: unknown, visited: WeakMap<object, unknown>): MaskedValue => {
  if (value === null || value === undefined) return value as MaskedValue;
  if (typeof value !== 'object') return value as MaskedValue;
  if (!value) return value as MaskedValue;
  if (visited.has(value as object)) {
    return visited.get(value as object) as MaskedValue;
  }

  if (Array.isArray(value)) {
    const next: MaskedValue[] = [];
    visited.set(value, next);
    value.forEach((item) => {
      next.push(maskValue(item, visited));
    });
    return next;
  }

  if (!isPlainObject(value)) {
    return value as MaskedValue;
  }

  const next: Record<string, unknown> = {};
  visited.set(value as object, next);
  Object.entries(value).forEach(([key, entryValue]) => {
    if (shouldRedactKey(key)) {
      next[key] = redactValue(entryValue);
    } else {
      next[key] = maskValue(entryValue, visited);
    }
  });
  return next;
};

export function maskSensitiveLog<T>(value: T): T {
  return maskValue(value, new WeakMap()) as T;
}
