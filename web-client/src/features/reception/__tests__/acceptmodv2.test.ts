import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mutateVisit, buildVisitEntryFromMutation } from '../api';
import { fetchWithResolver } from '../../outpatient/fetchWithResolver';

const recordOutpatientFunnel = vi.hoisted(() => vi.fn());
const logAuditEvent = vi.hoisted(() => vi.fn());
const logUiState = vi.hoisted(() => vi.fn());

vi.mock('../../outpatient/fetchWithResolver', () => ({
  fetchWithResolver: vi.fn(),
}));

vi.mock('../../../libs/telemetry/telemetryClient', () => ({
  recordOutpatientFunnel,
}));

vi.mock('../../../libs/audit/auditLogger', () => ({
  logAuditEvent,
  logUiState,
}));

vi.mock('../../../libs/observability/observability', () => ({
  updateObservabilityMeta: vi.fn(),
  getObservabilityMeta: () => ({}),
  ensureObservabilityMeta: () => ({}),
  resolveRunId: (value?: string) => value,
}));

const mockFetch = vi.mocked(fetchWithResolver);

describe('acceptmodv2 mutateVisit', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('Api_Result=00 で acceptanceId と patient を返す', async () => {
    mockFetch.mockResolvedValue({
      raw: {
        acceptanceId: 'A123',
        acceptanceDate: '2026-01-20',
        acceptanceTime: '09:00:00',
        apiResult: '00',
        apiResultMessage: 'OK',
        patient: { patientId: '000001', wholeName: '山田' },
      },
      meta: { httpStatus: 200, dataSourceTransition: 'mock' },
      ok: true,
    });

    const result = await mutateVisit({
      patientId: '000001',
      requestNumber: '01',
      acceptanceDate: '2026-01-20',
      acceptancePush: '1',
      paymentMode: 'insurance',
    });

    expect(result.acceptanceId).toBe('A123');
    expect(result.patient?.patientId).toBe('000001');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ requestNumber: '01', patientId: '000001' }),
      }),
    );
  });

  it('Api_Result=21 の場合は警告トーン扱いで acceptanceId を持たない', async () => {
    mockFetch.mockResolvedValue({
      raw: { apiResult: '21', apiResultMessage: '受付なし' },
      meta: { httpStatus: 200, dataSourceTransition: 'mock' },
      ok: true,
    });

    const result = await mutateVisit({
      patientId: '000021',
      requestNumber: '01',
      acceptanceDate: '2026-01-20',
      acceptancePush: '1',
      paymentMode: 'self',
    });

    expect(result.acceptanceId).toBeUndefined();
    expect(result.apiResult).toBe('21');
  });

  it('実環境相当の空文字応答でも patientId を維持する', async () => {
    mockFetch.mockResolvedValue({
      raw: {
        apiResult: '00',
        apiResultMessage: '受付登録終了',
        acceptanceId: '',
        acceptanceDate: '',
        acceptanceTime: '',
        patient: { patientId: '' },
      },
      meta: { httpStatus: 200, dataSourceTransition: 'server' },
      ok: true,
    });

    const result = await mutateVisit({
      patientId: '000099',
      requestNumber: '01',
      acceptanceDate: '2026-01-20',
      acceptancePush: '1',
      paymentMode: 'insurance',
    });

    expect(result.acceptanceId).toBeUndefined();
    expect(result.patient?.patientId).toBe('000099');

    const entry = buildVisitEntryFromMutation(result, { paymentMode: 'insurance' });
    expect(entry?.patientId).toBe('000099');
    expect(entry?.id).toBe('000099');
  });

  it('監査ログに action=reception_accept と runId/traceId が入る', async () => {
    mockFetch.mockResolvedValue({
      raw: {
        apiResult: '00',
        apiResultMessage: 'OK',
        acceptanceId: 'A999',
        runId: 'RUN-TEST',
        traceId: 'TRACE-TEST',
        patient: { patientId: '000001' },
      },
      meta: { httpStatus: 200, dataSourceTransition: 'mock', runId: 'RUN-TEST', traceId: 'TRACE-TEST' },
      ok: true,
    });

    logAuditEvent.mockClear();
    logUiState.mockClear();

    await mutateVisit({
      patientId: '000001',
      requestNumber: '01',
      acceptanceDate: '2026-01-20',
      acceptancePush: '1',
      paymentMode: 'insurance',
    });

    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'RUN-TEST',
        traceId: 'TRACE-TEST',
        payload: expect.objectContaining({
          action: 'reception_accept',
          traceId: 'TRACE-TEST',
        }),
      }),
    );
    expect(logUiState).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'send',
        runId: 'RUN-TEST',
        traceId: 'TRACE-TEST',
        details: expect.objectContaining({ traceId: 'TRACE-TEST' }),
      }),
    );
  });
});

describe('buildVisitEntryFromMutation', () => {
  it('取消リクエストでは null を返す', () => {
    const entry = buildVisitEntryFromMutation(
      { requestNumber: '02', patient: { patientId: '000001' } },
      { paymentMode: 'insurance' },
    );
    expect(entry).toBeNull();
  });

  it('登録レスポンスを ReceptionEntry に整形する', () => {
    const entry = buildVisitEntryFromMutation(
      {
        requestNumber: '01',
        acceptanceId: 'A1',
        acceptanceDate: '2026-01-20',
        acceptanceTime: '09:00:00',
        departmentName: '内科',
        physicianName: '医師',
        patient: { patientId: '000001', name: '山田' },
      },
      { paymentMode: 'self' },
    );
    expect(entry).not.toBeNull();
    expect(entry?.receptionId).toBe('A1');
    expect(entry?.insurance).toBe('自費');
    expect(entry?.status).toBe('受付中');
  });
});
