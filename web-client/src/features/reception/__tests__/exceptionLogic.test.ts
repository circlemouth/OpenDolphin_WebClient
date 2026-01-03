import { describe, expect, it } from 'vitest';

import type { ClaimBundle, ClaimQueueEntry } from '../../outpatient/types';
import type { ReceptionEntry } from '../api';
import {
  buildExceptionAuditDetails,
  buildQueuePhaseSummary,
  resolveExceptionDecision,
  resolveQueueDelay,
} from '../exceptionLogic';

const thresholdMs = 5 * 60 * 1000;
const nowMs = 1_000_000;

const buildEntry = (overrides: Partial<ReceptionEntry> = {}): ReceptionEntry => ({
  id: 'E-1',
  patientId: 'P-1',
  status: '受付中',
  source: 'visits',
  ...overrides,
});

const buildBundle = (overrides: Partial<ClaimBundle> = {}): ClaimBundle => ({
  bundleNumber: 'B-1',
  claimStatusText: '会計待ち',
  claimStatus: '会計待ち',
  ...overrides,
});

const buildQueue = (overrides: Partial<ClaimQueueEntry> = {}): ClaimQueueEntry => ({
  id: 'Q-1',
  phase: 'pending',
  ...overrides,
});

describe('resolveQueueDelay', () => {
  it('ack は遅延判定対象外', () => {
    const decision = resolveQueueDelay(buildQueue({ phase: 'ack' }), nowMs, thresholdMs);
    expect(decision.isDelayed).toBe(false);
    expect(decision.reason).toBe('phase_exempt');
  });

  it('sent は nextRetryAt が未設定なら遅延扱いしない', () => {
    const decision = resolveQueueDelay(buildQueue({ phase: 'sent' }), nowMs, thresholdMs);
    expect(decision.isDelayed).toBe(false);
    expect(decision.reason).toBe('phase_exempt_sent');
  });

  it('hold は即時遅延として扱う', () => {
    const decision = resolveQueueDelay(buildQueue({ phase: 'hold' }), nowMs, thresholdMs);
    expect(decision.isDelayed).toBe(true);
    expect(decision.reason).toBe('hold');
  });

  it('retry で nextRetryAt が閾値を超過していれば遅延', () => {
    const nextRetryAt = new Date(nowMs - thresholdMs - 60_000).toISOString();
    const decision = resolveQueueDelay(buildQueue({ phase: 'retry', nextRetryAt, retryCount: 1 }), nowMs, thresholdMs);
    expect(decision.isDelayed).toBe(true);
    expect(decision.reason).toBe('retry_overdue');
  });

  it('retry で nextRetryAt が無く retryCount>0 の場合は遅延', () => {
    const decision = resolveQueueDelay(buildQueue({ phase: 'retry', retryCount: 2 }), nowMs, thresholdMs);
    expect(decision.isDelayed).toBe(true);
    expect(decision.reason).toBe('retry_missing_next_retry');
  });

  it('pending で nextRetryAt が閾値を超過していれば遅延', () => {
    const nextRetryAt = new Date(nowMs - thresholdMs - 120_000).toISOString();
    const decision = resolveQueueDelay(buildQueue({ phase: 'pending', nextRetryAt }), nowMs, thresholdMs);
    expect(decision.isDelayed).toBe(true);
    expect(decision.reason).toBe('pending_overdue');
  });

  it('retry で nextRetryAt が閾値未満なら遅延扱いしない', () => {
    const nextRetryAt = new Date(nowMs - 60_000).toISOString();
    const decision = resolveQueueDelay(buildQueue({ phase: 'retry', nextRetryAt, retryCount: 1 }), nowMs, thresholdMs);
    expect(decision.isDelayed).toBe(false);
    expect(decision.reason).toBe('not_due');
  });
});

describe('resolveExceptionDecision', () => {
  it('未承認のみの場合は unapproved と判定', () => {
    const decision = resolveExceptionDecision({
      entry: buildEntry(),
      bundle: buildBundle({ claimStatusText: '未承認' }),
      queue: undefined,
      nowMs,
      thresholdMs,
    });
    expect(decision.kind).toBe('unapproved');
  });

  it('送信エラーがある場合は send_error を優先', () => {
    const decision = resolveExceptionDecision({
      entry: buildEntry(),
      bundle: buildBundle({ claimStatusText: '未承認' }),
      queue: buildQueue({ phase: 'failed', errorMessage: 'send failed' }),
      nowMs,
      thresholdMs,
    });
    expect(decision.kind).toBe('send_error');
  });

  it('遅延がある場合は delayed を優先', () => {
    const nextRetryAt = new Date(nowMs - thresholdMs - 60_000).toISOString();
    const decision = resolveExceptionDecision({
      entry: buildEntry(),
      bundle: buildBundle({ claimStatusText: '未承認' }),
      queue: buildQueue({ phase: 'retry', nextRetryAt, retryCount: 1 }),
      nowMs,
      thresholdMs,
    });
    expect(decision.kind).toBe('delayed');
  });
});

describe('buildExceptionAuditDetails', () => {
  it('監査ログ詳細の構造を保持する', () => {
    const entry = buildEntry();
    const queueSummary = buildQueuePhaseSummary(
      [
        buildQueue({ phase: 'retry', retryCount: 1, nextRetryAt: new Date(nowMs - thresholdMs - 60_000).toISOString() }),
        buildQueue({ phase: 'failed', errorMessage: 'error' }),
      ],
      nowMs,
      thresholdMs,
    );
    const decision1 = resolveExceptionDecision({
      entry,
      bundle: buildBundle(),
      queue: buildQueue({ phase: 'failed', errorMessage: 'error' }),
      nowMs,
      thresholdMs,
    });
    const decision2 = resolveExceptionDecision({
      entry: { ...entry, id: 'E-2' },
      bundle: buildBundle({ claimStatusText: '未承認' }),
      queue: undefined,
      nowMs,
      thresholdMs,
    });
    const details = buildExceptionAuditDetails({
      runId: 'RUN-1',
      items: [
        { kind: decision1.kind!, entry, reasons: decision1.reasons },
        { kind: decision2.kind!, entry: { ...entry, id: 'E-2' }, reasons: decision2.reasons },
      ],
      queueSummary,
      thresholdMs,
    });
    expect(details).toMatchSnapshot();
  });
});
