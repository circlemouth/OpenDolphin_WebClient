import { describe, expect, it, vi } from 'vitest';

import { CHART_EVENT_REPLAY_TARGETS, triggerChartEventReplayRecovery } from '../chartEventReplayRecovery';

describe('chartEventReplayRecovery', () => {
  it('replay-gap で対象クエリの再取得が起動する', async () => {
    const refetchQueries = vi.fn().mockResolvedValue(undefined);

    const result = await triggerChartEventReplayRecovery({ refetchQueries });

    expect(result.failures).toHaveLength(0);
    expect(refetchQueries).toHaveBeenCalledTimes(CHART_EVENT_REPLAY_TARGETS.length);
    CHART_EVENT_REPLAY_TARGETS.forEach((target) => {
      expect(refetchQueries).toHaveBeenCalledWith({ queryKey: target.key, type: 'all' });
    });
  });
});
