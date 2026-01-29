import { describe, expect, it } from 'vitest';

import {
  delayReasonLabel,
  formatDelayedDetail,
  formatSendErrorDetail,
  formatUnapprovedDetail,
  priorityLabel,
} from '../exceptionPresentation';

describe('exceptionPresentation', () => {
  it('遅延理由と再送情報を組み立てる', () => {
    const detail = formatDelayedDetail({
      isDelayed: true,
      reason: 'retry_overdue',
      thresholdMs: 300_000,
      elapsedMs: 600_000,
      retryCount: 2,
      nextRetryAt: '2026-01-29T09:00:00Z',
    });
    expect(detail).toBe(
      `${delayReasonLabel.retry_overdue} / 経過10分 / 再送2回 / 次回2026-01-29T09:00:00Z`,
    );
  });

  it('送信エラーと未承認の詳細を整形する', () => {
    expect(
      formatSendErrorDetail({ isSendError: true, phase: 'failed', errorMessage: 'timeout' }),
    ).toBe('timeout');
    expect(
      formatUnapprovedDetail({ isUnapproved: true, matchedPhrase: '未承認', claimStatusText: '未承認' }),
    ).toBe('未承認');
  });

  it('優先度ラベルが取得できる', () => {
    expect(priorityLabel.send_error).toBe('最優先');
  });
});
