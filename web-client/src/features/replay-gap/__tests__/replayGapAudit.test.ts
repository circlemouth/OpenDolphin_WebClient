import { describe, expect, it, vi, beforeEach } from 'vitest';

import { sendReplayGapAudit } from '@/features/replay-gap/replayGapAudit';
import type { ReplayGapAuditPayload } from '@/features/replay-gap/replayGapAudit';
import { httpClient } from '@/libs/http';

vi.mock('@/libs/http', () => ({
  httpClient: {
    post: vi.fn(),
  },
}));

const postMock = httpClient.post as unknown as ReturnType<typeof vi.fn>;

const basePayload: ReplayGapAuditPayload = {
  action: 'replay-gap.reload',
  reason: 'replay-gap',
  origin: 'web-client',
  platform: 'web-client',
  mode: 'auto',
  status: 'success',
  attempts: 1,
  recordedAt: new Date().toISOString(),
};

describe('sendReplayGapAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('succeeds on first attempt without retries', async () => {
    postMock.mockResolvedValueOnce(undefined);

    await expect(sendReplayGapAudit(basePayload, { wait: () => Promise.resolve() })).resolves.toBeUndefined();
    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(httpClient.post).toHaveBeenCalledWith('/audit/events', basePayload);
  });

  it('retries with exponential backoff when the first attempt fails', async () => {
    const error = new Error('network');
    postMock.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const waitSpy = vi.fn(() => Promise.resolve());
    const logger = { warn: vi.fn(), error: vi.fn() };

    await expect(sendReplayGapAudit(basePayload, { wait: waitSpy, logger })).resolves.toBeUndefined();
    expect(httpClient.post).toHaveBeenCalledTimes(2);
    expect(waitSpy).toHaveBeenCalledTimes(1);
    expect(waitSpy).toHaveBeenCalledWith(500);
    expect(logger.warn).toHaveBeenCalledWith('Replay gap audit send failed. Retrying...', error);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('propagates the last error after exhausting retries', async () => {
    const error = new Error('timeout');
    postMock.mockRejectedValue(error);
    const waitSpy = vi.fn(() => Promise.resolve());
    const logger = { warn: vi.fn(), error: vi.fn() };

    await expect(sendReplayGapAudit(basePayload, { wait: waitSpy, logger, maxAttempts: 3 })).rejects.toThrow('timeout');
    expect(httpClient.post).toHaveBeenCalledTimes(3);
    expect(waitSpy).toHaveBeenCalledTimes(2);
    expect(waitSpy).toHaveBeenNthCalledWith(1, 500);
    expect(waitSpy).toHaveBeenNthCalledWith(2, 1000);
    expect(logger.error).toHaveBeenCalledWith('Replay gap audit aborted after max retries.', error);
  });
});
