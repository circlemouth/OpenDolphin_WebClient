import { beforeEach, describe, expect, it } from 'vitest';

import { shouldNotifySessionExpired } from './httpClient';

const AUTH_KEY = 'opendolphin:web-client:auth';

const setSession = () => {
  sessionStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ facilityId: 'f001', userId: 'user01', role: 'doctor', runId: 'run-1' }),
  );
};

describe('shouldNotifySessionExpired', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns false when no stored session exists', () => {
    expect(shouldNotifySessionExpired(401)).toBe(false);
    expect(shouldNotifySessionExpired(419)).toBe(false);
  });

  it('returns true for 401 when a session exists', () => {
    setSession();
    expect(shouldNotifySessionExpired(401)).toBe(true);
  });

  it('returns true for 419 and 440 when a session exists', () => {
    setSession();
    expect(shouldNotifySessionExpired(419)).toBe(true);
    expect(shouldNotifySessionExpired(440)).toBe(true);
  });

  it('ignores 403 by default even when a session exists', () => {
    setSession();
    expect(shouldNotifySessionExpired(403)).toBe(false);
  });

  it('notifies for 403 only when explicitly opted-in', () => {
    setSession();
    expect(shouldNotifySessionExpired(403, { notifyForbiddenAsSessionExpiry: true })).toBe(true);
  });

  it('returns false for non expiry statuses', () => {
    setSession();
    expect(shouldNotifySessionExpired(500)).toBe(false);
  });
});

