import { describe, expect, it } from 'vitest';

import { buildQueueEntryFromSendCache, buildSendClaimBundle, resolveBillingStatusFromInvoice } from '../orcaBillingStatus';

const buildSendCache = (overrides: Partial<{
  patientId: string;
  appointmentId: string;
  invoiceNumber: string;
  dataId: string;
  runId: string;
  traceId: string;
  sendStatus: 'success' | 'error';
  errorMessage: string;
  savedAt: string;
}> = {}) => ({
  patientId: 'P-1',
  appointmentId: 'A-1',
  invoiceNumber: 'INV-1',
  dataId: 'DATA-1',
  runId: 'RUN-1',
  traceId: 'TRACE-1',
  sendStatus: 'success',
  errorMessage: undefined,
  savedAt: '2026-01-22T09:00:00Z',
  ...overrides,
});

describe('resolveBillingStatusFromInvoice', () => {
  it('伝票番号が一致すれば会計済みを返す', () => {
    const decision = resolveBillingStatusFromInvoice('INV-1', new Set(['INV-1']));
    expect(decision.status).toBe('会計済み');
    expect(decision.paid).toBe(true);
  });

  it('伝票番号が不一致なら会計待ちを返す', () => {
    const decision = resolveBillingStatusFromInvoice('INV-1', new Set(['INV-2']));
    expect(decision.status).toBe('会計待ち');
    expect(decision.paid).toBe(false);
  });

  it('伝票番号が無ければ未決定', () => {
    const decision = resolveBillingStatusFromInvoice(undefined, new Set(['INV-1']));
    expect(decision.status).toBeUndefined();
    expect(decision.paid).toBe(false);
  });
});

describe('buildSendClaimBundle', () => {
  it('送信結果から請求バンドルを組み立てる', () => {
    const bundle = buildSendClaimBundle(buildSendCache(), new Set(['INV-1']));
    expect(bundle.invoiceNumber).toBe('INV-1');
    expect(bundle.claimStatus).toBe('会計済み');
  });
});

describe('buildQueueEntryFromSendCache', () => {
  it('会計済みなら ack にする', () => {
    const queue = buildQueueEntryFromSendCache(buildSendCache(), new Set(['INV-1']));
    expect(queue.phase).toBe('ack');
  });

  it('送信失敗は failed にする', () => {
    const queue = buildQueueEntryFromSendCache(buildSendCache({ sendStatus: 'error', invoiceNumber: 'INV-2' }), new Set());
    expect(queue.phase).toBe('failed');
  });
});
