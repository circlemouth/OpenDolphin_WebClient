import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFacilitySchedule } from '@/features/schedule/api/facility-schedule-api';
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

vi.mock('@/libs/monitoring', () => ({
  measureApiPerformance: vi.fn((_, __, fn: () => Promise<unknown>) => fn()),
}));

describe('facility-schedule-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
    vi.mocked(measureApiPerformance).mockClear();
  });

  it('normalizes schedule entries and sorts by scheduled time', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          {
            id: 2,
            pvtDate: '2026-05-11T10:00:00+09:00',
            state: 1,
            deptName: '内科',
            doctorName: '医師B',
            patientModel: {
              id: 22,
              patientId: '0002',
              fullName: '田中 花子',
              kanaName: 'タナカ ハナコ',
              gender: 'F',
            },
          },
          {
            id: 1,
            pvtDate: '2026-05-11T09:00:00+09:00',
            state: 0,
            deptName: '内科',
            doctorName: '医師A',
            memo: '初診',
            firstInsurance: '社保',
            lastDocDate: '2026-05-01T00:00:00+09:00',
            patientModel: {
              id: 21,
              patientId: '0001',
              fullName: '山田 太郎',
              ownerUUID: null,
            },
          },
        ],
      },
    } as never);

    const result = await fetchFacilitySchedule({ date: '2026-05-11' });

    expect(httpClient.get).toHaveBeenCalledWith('/schedule/pvt/2026-05-11');
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      visitId: 1,
      patientId: '0001',
      patientName: '山田 太郎',
      memo: '初診',
      firstInsurance: '社保',
      lastDocumentDate: new Date('2026-05-01T00:00:00+09:00').toISOString(),
    });
    expect(result[0].scheduledAt < result[1].scheduledAt).toBe(true);
  });

  it('builds assigned endpoint when doctor id is provided', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { list: [] } } as never);

    await fetchFacilitySchedule({
      date: '2026-05-11',
      assignedOnly: true,
      orcaDoctorId: '1001',
      unassignedDoctorId: '18080',
    });

    expect(httpClient.get).toHaveBeenCalledWith('/schedule/pvt/1001%2C18080%2C2026-05-11');
  });
});
