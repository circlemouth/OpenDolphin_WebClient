import { describe, beforeEach, it, expect, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import React from 'react';

import { applyObservabilityHeaders, updateObservabilityMeta } from '../../observability/observability';
import { AuthServiceProvider } from '../../../features/charts/authService';
import { clearSharedAuthFlags, persistSharedAuthFlags } from '../authSync';
import { AUTH_FLAGS_STORAGE_KEY, AUTH_SESSION_STORAGE_KEY } from '../authStorage';

class FakeBroadcastChannel {
  static listeners = new Map<string, Set<(event: MessageEvent) => void>>();
  name: string;
  handlers = new Set<(event: MessageEvent) => void>();

  constructor(name: string) {
    this.name = name;
    if (!FakeBroadcastChannel.listeners.has(name)) {
      FakeBroadcastChannel.listeners.set(name, new Set());
    }
  }

  postMessage(data: unknown) {
    const listeners = FakeBroadcastChannel.listeners.get(this.name);
    listeners?.forEach((handler) => handler({ data } as MessageEvent));
  }

  addEventListener(event: string, handler: (event: MessageEvent) => void) {
    if (event !== 'message') return;
    const listeners = FakeBroadcastChannel.listeners.get(this.name);
    listeners?.add(handler);
    this.handlers.add(handler);
  }

  removeEventListener(event: string, handler: (event: MessageEvent) => void) {
    if (event !== 'message') return;
    const listeners = FakeBroadcastChannel.listeners.get(this.name);
    listeners?.delete(handler);
    this.handlers.delete(handler);
  }

  close() {
    this.handlers.forEach((handler) => this.removeEventListener('message', handler));
  }
}

describe('auth sync / runId propagation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // @ts-expect-error test stub
    globalThis.BroadcastChannel = FakeBroadcastChannel;
    updateObservabilityMeta({ runId: undefined as unknown as string, traceId: undefined });
  });

  it('propagates runId updates from another tab into request headers', async () => {
    const sessionKey = '0001:user1';
    const initialRunId = 'RUN-OLD';
    const nextRunId = 'RUN-NEW';

    sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        facilityId: '0001',
        userId: 'user1',
        role: 'doctor',
        runId: initialRunId,
      }),
    );

    render(
      <AuthServiceProvider
        sessionKey={sessionKey}
        initialFlags={{ runId: initialRunId, cacheHit: false, missingMaster: true, dataSourceTransition: 'snapshot' }}
      >
        <div data-testid="probe" />
      </AuthServiceProvider>,
    );

    const initial = applyObservabilityHeaders();
    expect((initial.headers as Record<string, string>)['X-Run-Id']).toBe(initialRunId);

    await act(async () => {
      persistSharedAuthFlags(sessionKey, {
        runId: nextRunId,
        cacheHit: true,
        missingMaster: false,
        fallbackUsed: false,
        dataSourceTransition: 'server',
      });
    });

    await waitFor(() => {
      const updated = applyObservabilityHeaders();
      expect((updated.headers as Record<string, string>)['X-Run-Id']).toBe(nextRunId);
    });
  });

  it('clears old runId when flags:clear is broadcast', async () => {
    const sessionKey = '0001:user1';
    const initialRunId = 'RUN-OLD';

    sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        facilityId: '0001',
        userId: 'user1',
        role: 'doctor',
        runId: initialRunId,
      }),
    );

    render(
      <AuthServiceProvider
        sessionKey={sessionKey}
        initialFlags={{ runId: initialRunId, cacheHit: false, missingMaster: true, dataSourceTransition: 'snapshot' }}
      >
        <div data-testid="probe" />
      </AuthServiceProvider>,
    );

    const before = applyObservabilityHeaders();
    expect((before.headers as Record<string, string>)['X-Run-Id']).toBe(initialRunId);

    await act(async () => {
      clearSharedAuthFlags();
    });

    await waitFor(() => {
      const after = applyObservabilityHeaders();
      const runId = (after.headers as Record<string, string>)['X-Run-Id'];
      expect(runId).toBeDefined();
      expect(runId).not.toBe(initialRunId);
    });
  });

  it('ignores stored auth flags with mismatched runId on init', async () => {
    const sessionKey = '0001:user1';
    const oldRunId = 'RUN-OLD';
    const newRunId = 'RUN-NEW';

    sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        facilityId: '0001',
        userId: 'user1',
        role: 'doctor',
        runId: newRunId,
      }),
    );
    sessionStorage.setItem(
      AUTH_FLAGS_STORAGE_KEY,
      JSON.stringify({
        sessionKey,
        updatedAt: new Date().toISOString(),
        flags: {
          runId: oldRunId,
          cacheHit: true,
          missingMaster: false,
          fallbackUsed: false,
          dataSourceTransition: 'server',
        },
      }),
    );

    render(
      <AuthServiceProvider
        sessionKey={sessionKey}
        initialFlags={{ runId: newRunId, cacheHit: false, missingMaster: true, dataSourceTransition: 'snapshot' }}
      >
        <div data-testid="probe" />
      </AuthServiceProvider>,
    );

    const headers = applyObservabilityHeaders();
    expect((headers.headers as Record<string, string>)['X-Run-Id']).toBe(newRunId);
  });
});
