import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CHART_EVENT_REPLAY_GAP_EVENT,
  handleChartEventStreamMessage,
  readStoredLastEventId,
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
});
