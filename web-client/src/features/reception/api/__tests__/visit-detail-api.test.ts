import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchPatientVisitHistory, fetchTemporaryDocumentPatients } from '@/features/reception/api/visit-detail-api';
import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

vi.mock('@/libs/http', async () => {
  const actual = await vi.importActual<typeof import('@/libs/http')>('@/libs/http');
  return {
    ...actual,
    httpClient: {
      get: vi.fn(),
    },
  };
});

vi.mock('@/libs/monitoring', async () => {
  const actual = await vi.importActual<typeof import('@/libs/monitoring')>('@/libs/monitoring');
  return {
    ...actual,
    measureApiPerformance: vi.fn((_, __, fn: () => Promise<unknown>) => fn()),
  };
});

describe('visit-detail-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
    vi.mocked(measureApiPerformance).mockClear();
  });

  it('指定患者の来院履歴を取得し、日付順にソートする', async () => {
    vi.mocked(httpClient.get).mockImplementation(async (url: string) => {
      if (url.includes('2026-05')) {
        return {
          data: {
            list: [
              { patientId: '0001', fullName: '山田 太郎', pvtDate: '2026-05-15T09:00:00+09:00', memo: '再診' },
              { patientId: '0002', fullName: '佐藤 花子', pvtDate: '2026-05-15T10:00:00+09:00' },
            ],
          },
        } as never;
      }
      if (url.includes('2026-04')) {
        return {
          data: {
            list: [
              { patientId: '0001', fullName: '山田 太郎', pvtDate: '2026-04-30T11:00:00+09:00', memo: '初診' },
            ],
          },
        } as never;
      }
      return {
        data: {
          list: [
            { patientId: '0001', fullName: '山田 太郎', pvtDate: '2026-03-01T08:30:00+09:00' },
            { patientId: '0001', fullName: '山田 太郎', pvtDate: '2026-03-01T08:30:00+09:00' },
          ],
        },
      } as never;
    });

    const history = await fetchPatientVisitHistory('0001', new Date('2026-05-15T12:00:00+09:00'));

    expect(httpClient.get).toHaveBeenCalledTimes(3);
    expect(history).toHaveLength(3);
    expect(history[0].visitDate).toBe('2026-05-15T09:00:00+09:00');
    expect(history[1].visitDate).toBe('2026-04-30T11:00:00+09:00');
    expect(history[2].visitDate).toBe('2026-03-01T08:30:00+09:00');
    expect(history[0].memo).toBe('再診');
  });

  it('仮保存カルテを持つ患者一覧を取得する', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          { patientId: '0001', fullName: '山田 太郎', pvtDate: '2026-05-10T10:00:00+09:00' },
          { patientId: '0003', fullName: '鈴木 次郎', pvtDate: null },
          { patientId: null, fullName: '匿名', pvtDate: null },
        ],
      },
    } as never);

    const patients = await fetchTemporaryDocumentPatients();

    expect(httpClient.get).toHaveBeenCalledWith('/patient/documents/status');
    expect(patients).toHaveLength(2);
    expect(patients[0]).toMatchObject({ patientId: '0001', fullName: '山田 太郎' });
    expect(patients[1]).toMatchObject({ patientId: '0003', fullName: '鈴木 次郎' });
  });
});
