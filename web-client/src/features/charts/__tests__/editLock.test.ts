import { describe, expect, it, beforeEach } from 'vitest';

import {
  acquireChartsTabLock,
  buildChartsTabLockStorageKey,
  readChartsTabLock,
  releaseChartsTabLock,
  renewChartsTabLock,
} from '../editLock';

describe('charts editLock (tab lock)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('buildChartsTabLockStorageKey: patientId が無い場合は null', () => {
    expect(buildChartsTabLockStorageKey({ facilityId: 'f', patientId: '' })).toBeNull();
    expect(buildChartsTabLockStorageKey({ facilityId: 'f' })).toBeNull();
  });

  it('acquire: 未保持なら取得できる', () => {
    const storageKey = buildChartsTabLockStorageKey({
      facilityId: 'FAC',
      patientId: 'P1',
      receptionId: 'R1',
    })!;
    const now = new Date('2025-12-18T09:00:00.000Z');
    const result = acquireChartsTabLock({
      storageKey,
      owner: { tabSessionId: 'tab-a', runId: 'RUN' },
      ttlMs: 5 * 60_000,
      now,
    });
    expect(result.ok).toBe(true);
    const stored = readChartsTabLock(storageKey);
    expect(stored?.owner.tabSessionId).toBe('tab-a');
    expect(stored?.owner.runId).toBe('RUN');
  });

  it('acquire: 他タブ保持中は拒否される', () => {
    const storageKey = buildChartsTabLockStorageKey({
      facilityId: 'FAC',
      patientId: 'P1',
      receptionId: 'R1',
    })!;
    const now = new Date('2025-12-18T09:00:00.000Z');
    acquireChartsTabLock({
      storageKey,
      owner: { tabSessionId: 'tab-a', runId: 'RUN-A' },
      ttlMs: 5 * 60_000,
      now,
    });

    const result = acquireChartsTabLock({
      storageKey,
      owner: { tabSessionId: 'tab-b', runId: 'RUN-B' },
      ttlMs: 5 * 60_000,
      now: new Date('2025-12-18T09:01:00.000Z'),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('locked_by_other_tab');
      expect(result.existing.owner.tabSessionId).toBe('tab-a');
    }
  });

  it('acquire: 期限切れは奪取できる', () => {
    const storageKey = buildChartsTabLockStorageKey({
      facilityId: 'FAC',
      patientId: 'P1',
      receptionId: 'R1',
    })!;
    acquireChartsTabLock({
      storageKey,
      owner: { tabSessionId: 'tab-a', runId: 'RUN-A' },
      ttlMs: 60_000,
      now: new Date('2025-12-18T09:00:00.000Z'),
    });

    const result = acquireChartsTabLock({
      storageKey,
      owner: { tabSessionId: 'tab-b', runId: 'RUN-B' },
      ttlMs: 60_000,
      now: new Date('2025-12-18T09:10:00.000Z'),
    });
    expect(result.ok).toBe(true);
    const stored = readChartsTabLock(storageKey);
    expect(stored?.owner.tabSessionId).toBe('tab-b');
  });

  it('renew/release: owner のみ可能', () => {
    const storageKey = buildChartsTabLockStorageKey({
      facilityId: 'FAC',
      patientId: 'P1',
      receptionId: 'R1',
    })!;
    acquireChartsTabLock({
      storageKey,
      owner: { tabSessionId: 'tab-a', runId: 'RUN-A' },
      ttlMs: 60_000,
      now: new Date('2025-12-18T09:00:00.000Z'),
    });

    const renewedByOther = renewChartsTabLock({
      storageKey,
      ownerTabSessionId: 'tab-b',
      ttlMs: 60_000,
      now: new Date('2025-12-18T09:00:30.000Z'),
    });
    expect(renewedByOther.ok).toBe(false);

    const renewed = renewChartsTabLock({
      storageKey,
      ownerTabSessionId: 'tab-a',
      ttlMs: 60_000,
      now: new Date('2025-12-18T09:00:30.000Z'),
    });
    expect(renewed.ok).toBe(true);

    releaseChartsTabLock({ storageKey, ownerTabSessionId: 'tab-b' });
    expect(readChartsTabLock(storageKey)).not.toBeNull();

    releaseChartsTabLock({ storageKey, ownerTabSessionId: 'tab-a' });
    expect(readChartsTabLock(storageKey)).toBeNull();
  });
});

