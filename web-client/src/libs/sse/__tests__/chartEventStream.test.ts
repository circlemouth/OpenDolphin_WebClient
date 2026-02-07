import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CHART_EVENT_REPLAY_GAP_EVENT,
  handleChartEventStreamMessage,
  readStoredLastEventId,
  startChartEventStream,
} from '../chartEventStream';

const facilityId = '1.3.6.1.4.1.9414.10.1';

beforeEach(() => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
});

describe('chartEventStream', () => {
  it('SSE 受信で Last-Event-ID が更新される', () => {
    handleChartEventStreamMessage({
      facilityId,
      message: {
        id: '42',
        event: 'chart-event',
        data: '{}',
      },
    });

    expect(readStoredLastEventId(facilityId)).toBe('42');
  });

  it('replay-gap イベントで復元ハンドラが起動する', () => {
    const onReplayGap = vi.fn();

    handleChartEventStreamMessage({
      facilityId,
      message: {
        event: CHART_EVENT_REPLAY_GAP_EVENT,
        data: '{"requiredAction":"reload"}',
      },
      onReplayGap,
    });

    expect(onReplayGap).toHaveBeenCalledTimes(1);
  });

  it('503 の場合は stream unavailable としてリトライせず停止する', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn(async () => new Response('', { status: 503 }));
    vi.stubGlobal('fetch', fetchSpy);

    const onError = vi.fn();
    const stop = startChartEventStream({
      facilityId,
      clientUuid: 'dev-client',
      apiBaseUrl: 'http://localhost/api',
      retryDelayMs: 10,
      onMessage: () => {},
      onError,
    });

    // Give the background loop a chance to run.
    await Promise.resolve();
    await Promise.resolve();

    // Even if we advance time, the loop should have stopped after the first 503.
    await vi.advanceTimersByTimeAsync(100);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalled();

    stop();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
