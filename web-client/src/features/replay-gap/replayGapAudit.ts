import { httpClient } from '@/libs/http';

import type { ReplayGapReloadMode } from '@/features/replay-gap/useReplayGapController';

export type ReplayGapAuditStatus = 'success' | 'failure';

export type ReplayGapAuditPlatform = 'web-reception' | 'web-charts' | 'web-client';

export interface ReplayGapAuditPayload {
  action: 'replay-gap.reload';
  reason: 'replay-gap';
  origin: 'web-client';
  platform: ReplayGapAuditPlatform;
  mode: ReplayGapReloadMode;
  status: ReplayGapAuditStatus;
  attempts: number;
  clientUuid?: string | null;
  gapSize?: number;
  lastEventId?: string | null;
  lastErrorCode?: number;
  gapDetectedAt?: string;
  recoveredAt?: string;
  recordedAt: string;
  metadata?: {
    escalated?: boolean;
    gapDurationMs?: number;
  };
}

type WaitFunction = (ms: number) => Promise<void>;

const sleep: WaitFunction = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ReplayGapAuditOptions {
  maxAttempts?: number;
  wait?: WaitFunction;
  logger?: Pick<Console, 'warn' | 'error'>;
}

export const sendReplayGapAudit = async (
  payload: ReplayGapAuditPayload,
  options?: ReplayGapAuditOptions,
) => {
  const maxAttempts = options?.maxAttempts ?? 3;
  const waitFn = options?.wait ?? sleep;
  const logger = options?.logger ?? console;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await httpClient.post('/audit/events', payload);
      return;
    } catch (error) {
      logger.warn?.('Replay gap audit send failed. Retrying...', error);
      if (attempt === maxAttempts) {
        logger.error?.('Replay gap audit aborted after max retries.', error);
        throw error;
      }
      const delay = 500 * 2 ** (attempt - 1);
      await waitFn(delay);
    }
  }
};
