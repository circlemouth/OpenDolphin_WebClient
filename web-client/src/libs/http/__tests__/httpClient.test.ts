import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  httpClient,
  setAuthHeaderProvider,
  setHttpAuditLogger,
  type HttpAuditEvent,
} from '@/libs/http';

describe('httpClient', () => {
  beforeEach(() => {
    setAuthHeaderProvider(null);
    setHttpAuditLogger(null);
    vi.restoreAllMocks();
  });

  it('applies auth headers and emits audit events', async () => {
    const events: HttpAuditEvent[] = [];
    setAuthHeaderProvider(() => ({
      userName: '0001:doctor01',
      password: 'hash',
      clientUUID: 'uuid',
    }));
    setHttpAuditLogger((event) => {
      events.push(event);
    });

    const response = await httpClient.get('/dummy', {
      adapter: async (config) => ({
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    });

    expect(response.data).toEqual({ ok: true });
    expect(events[0]).toMatchObject({ phase: 'request', method: 'GET', url: '/dummy' });
    expect(events[1]).toMatchObject({ phase: 'response', status: 200 });
  });

  it('retries on server errors and records error events', async () => {
    const events: HttpAuditEvent[] = [];
    setHttpAuditLogger((event) => {
      events.push(event);
    });

    const adapter = vi
      .fn()
      .mockImplementationOnce(async (config) => {
        const error = new AxiosError('Service Unavailable', 'ERR_BAD_RESPONSE', config, undefined, {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {},
          config,
          data: null,
        });
        throw error;
      })
      .mockImplementationOnce(async (config) => ({
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }));

    vi.useFakeTimers();
    const promise = httpClient.get('/retry', { adapter });
    await vi.advanceTimersByTimeAsync(1000);
    const response = await promise;
    vi.useRealTimers();

    expect(adapter).toHaveBeenCalledTimes(2);
    expect(response.data).toEqual({ ok: true });
    const phases = events.map((event) => event.phase);
    expect(phases).toEqual(['request', 'error', 'request', 'response']);
    expect(events[1].status).toBe(503);
  });
});
