import { describe, expect, it, vi, beforeEach } from 'vitest';

import { httpClient } from '@/libs/http';
import { buildPatientSearchPath, searchPatients } from '@/features/patients/api/patient-api';

vi.mock('@/libs/http', async () => {
  const actual = await vi.importActual<typeof import('@/libs/http')>('@/libs/http');
  return {
    ...actual,
    httpClient: {
      get: vi.fn(),
    },
  };
});

describe('patient-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
  });

  it('builds search path with encoded keyword', () => {
    expect(buildPatientSearchPath({ mode: 'name', keyword: '山田 太郎' })).toBe('/patient/name/%E5%B1%B1%E7%94%B0%20%E5%A4%AA%E9%83%8E');
    expect(buildPatientSearchPath({ mode: 'id', keyword: '000123' })).toBe('/patient/id/000123');
  });

  it('returns empty array when keyword is blank', async () => {
    const result = await searchPatients({ mode: 'name', keyword: '   ' });
    expect(result).toEqual([]);
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('maps and filters patient resources', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          {
            id: 1,
            patientId: '0001-01',
            fullName: '山田 太郎',
            kanaName: 'ヤマダ タロウ',
            genderDesc: '男性',
            pvtDate: '2025-01-01',
            appMemo: 'ペニシリン禁忌',
            reserve1: '感染症注意',
          },
          {
            id: null,
            patientId: null,
            fullName: null,
          },
        ],
      },
    } as never);

    const result = await searchPatients({ mode: 'name', keyword: '山田' });

    expect(httpClient.get).toHaveBeenCalledWith('/patient/name/%E5%B1%B1%E7%94%B0');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      patientId: '0001-01',
      safetyNotes: ['ペニシリン禁忌', '感染症注意'],
    });
  });
});
