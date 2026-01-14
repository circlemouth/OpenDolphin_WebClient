import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  postMedicalRecords,
  postMedicalSets,
  postPatientMutation,
} from './orcaInternalWrapperApi';
import { httpFetch } from '../../libs/http/httpClient';

vi.mock('../../libs/http/httpClient', () => ({
  httpFetch: vi.fn(),
}));

const mockHttpFetch = vi.mocked(httpFetch);

beforeEach(() => {
  mockHttpFetch.mockReset();
});

describe('orcaInternalWrapperApi', () => {
  it('stub 応答(Api_Result=79)を検知して stub=true を返す', async () => {
    mockHttpFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          apiResult: '79',
          apiResultMessage: 'Spec-based implementation / Trial未検証',
          runId: 'RUN-SET-1',
          messageDetail: 'stub response',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'x-trace-id': 'TRACE-SET-1',
            'x-missing-master': 'true',
            'x-fallback-used': 'false',
          },
        },
      ),
    );

    const result = await postMedicalSets({ requestNumber: '01' });

    expect(result.ok).toBe(true);
    expect(result.apiResult).toBe('79');
    expect(result.stub).toBe(true);
    expect(result.runId).toBe('RUN-SET-1');
    expect(result.traceId).toBe('TRACE-SET-1');
    expect(result.missingMaster).toBe(true);
    expect(result.fallbackUsed).toBe(false);
  });

  it('medical/records のレスポンスを正規化する', async () => {
    mockHttpFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          apiResult: '00',
          apiResultMessage: '処理終了',
          runId: 'RUN-MED-1',
          generatedAt: '2026-01-14T00:00:00Z',
          patient: {
            patientId: '00002',
            wholeName: 'テスト 太郎',
          },
          records: [
            {
              performDate: '2026-01-10',
              departmentCode: '01',
              documentId: 'DOC-1',
              documentStatus: 'FINAL',
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const result = await postMedicalRecords({ patientId: '00002' });

    expect(result.ok).toBe(true);
    expect(result.apiResult).toBe('00');
    expect(result.records.length).toBe(1);
    expect(result.patient?.patientId).toBe('00002');
  });

  it('patient mutation の DB ID を読み取る', async () => {
    mockHttpFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          apiResult: '00',
          apiResultMessage: '登録完了',
          runId: 'RUN-PATIENT-1',
          patientDbId: 12,
          patientId: '00003',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const result = await postPatientMutation({
      operation: 'create',
      patient: { patientId: '00003', wholeName: 'テスト 三郎' },
    });

    expect(result.ok).toBe(true);
    expect(result.patientDbId).toBe(12);
    expect(result.patientId).toBe('00003');
  });
});
