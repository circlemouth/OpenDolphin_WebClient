import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { shouldNotifySessionExpired } from './httpClient';

const AUTH_KEY = 'opendolphin:web-client:auth';

const setSession = () => {
  sessionStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ facilityId: 'f001', userId: 'user01', role: 'doctor', runId: 'run-1' }),
  );
};

const mockFetchSequence = (statuses: number[]) => {
  const queue = [...statuses];
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
    const status = queue.shift() ?? 200;
    return Promise.resolve(new Response(null, { status }));
  });
};

const importSubjects = async () => {
  const sessionExpiry = await import('../session/sessionExpiry');
  const httpClient = await import('./httpClient');
  return { sessionExpiry, httpClient };
};

describe('shouldNotifySessionExpired', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('returns false when no stored session exists', () => {
    expect(shouldNotifySessionExpired(401)).toBe(false);
    expect(shouldNotifySessionExpired(419)).toBe(false);
  });

  it('returns true for 401 when a session exists', () => {
    setSession();
    expect(shouldNotifySessionExpired(401)).toBe(true);
  });

  it('returns false when notifySessionExpired is disabled', () => {
    setSession();
    expect(shouldNotifySessionExpired(401, { notifySessionExpired: false })).toBe(false);
    expect(shouldNotifySessionExpired(419, { notifySessionExpired: false })).toBe(false);
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

describe('httpFetch session expiry debounce', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-19T00:00:00Z'));
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('debounces consecutive 401 responses', async () => {
    setSession();
    mockFetchSequence([401, 401]);
    const { sessionExpiry, httpClient } = await importSubjects();
    vi.spyOn(sessionExpiry, 'notifySessionExpired');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    await httpClient.httpFetch('/dummy');
    vi.advanceTimersByTime(1_000);
    await httpClient.httpFetch('/dummy');

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('debounces mixed 419 then 440 responses', async () => {
    setSession();
    mockFetchSequence([419, 440]);
    const { sessionExpiry, httpClient } = await importSubjects();
    vi.spyOn(sessionExpiry, 'notifySessionExpired');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    await httpClient.httpFetch('/dummy');
    vi.advanceTimersByTime(2_000);
    await httpClient.httpFetch('/dummy');

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not notify for repeated 403 responses without opt-in', async () => {
    setSession();
    mockFetchSequence([403, 403]);
    const { sessionExpiry, httpClient } = await importSubjects();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    vi.spyOn(sessionExpiry, 'notifySessionExpired');

    await httpClient.httpFetch('/dummy');
    await httpClient.httpFetch('/dummy');

    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});

describe('httpFetch session expiry reasons', () => {
  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps 403 to forbidden only when opted-in', async () => {
    setSession();
    mockFetchSequence([403]);
    const { sessionExpiry, httpClient } = await importSubjects();
    const notifySpy = vi.spyOn(sessionExpiry, 'notifySessionExpired');

    await httpClient.httpFetch('/dummy', { notifyForbiddenAsSessionExpiry: true });
    expect(notifySpy).toHaveBeenCalledWith('forbidden', 403);

    notifySpy.mockClear();
    mockFetchSequence([403]);
    await httpClient.httpFetch('/dummy');
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it('maps 401 to unauthorized and 419 to timeout', async () => {
    setSession();
    mockFetchSequence([401]);
    const { sessionExpiry, httpClient } = await importSubjects();
    const notifySpy = vi.spyOn(sessionExpiry, 'notifySessionExpired');

    await httpClient.httpFetch('/dummy');
    expect(notifySpy).toHaveBeenCalledWith('unauthorized', 401);

    notifySpy.mockClear();
    mockFetchSequence([419]);
    await httpClient.httpFetch('/dummy');
    expect(notifySpy).toHaveBeenCalledWith('timeout', 419);
  });

  it('does not notify for ORCA endpoints by default', async () => {
    setSession();
    mockFetchSequence([401]);
    const { sessionExpiry, httpClient } = await importSubjects();
    const notifySpy = vi.spyOn(sessionExpiry, 'notifySessionExpired');

    await httpClient.httpFetch('/orca/appointments/list');
    expect(notifySpy).not.toHaveBeenCalled();
  });
});
