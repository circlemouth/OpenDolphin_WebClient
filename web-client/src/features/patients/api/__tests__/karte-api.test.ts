import { beforeEach, describe, expect, it, vi } from 'vitest';

import { httpClient } from '@/libs/http';
import { buildKartePidPath, fetchKarteByPatientId } from '@/features/patients/api/karte-api';

vi.mock('@/libs/http', async () => {
  const actual = await vi.importActual<typeof import('@/libs/http')>('@/libs/http');
  return {
    ...actual,
    httpClient: {
      get: vi.fn(),
    },
  };
});

describe('karte-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
  });

  it('builds karte endpoint with encoded params', () => {
    expect(buildKartePidPath('0001-01', '2025-01-01 00:00:00')).toBe('/karte/pid/0001-01%2C2025-01-01%2000%3A00%3A00');
  });

  it('returns null when patient id is blank', async () => {
    const result = await fetchKarteByPatientId('   ', '2025-01-01 00:00:00');
    expect(result).toBeNull();
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('maps karte response into summary objects', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        id: 123,
        created: '2025-01-01T09:00:00',
        allergies: [
          { factor: 'ペニシリン', severity: 'Severe', memo: 'ショック歴あり', identifiedDate: '2020-01-01' },
          { factor: '' },
        ],
        docInfoList: [
          {
            docPk: 11,
            title: '再診 2025/01/01',
            confirmDate: '2025-01-01T10:00:00',
            departmentDesc: '内科,コード,担当医',
            hasMark: true,
            status: 'F',
          },
          { docPk: null, title: null },
        ],
        memoList: [
          { id: 55, memo: '隔離必要', confirmed: '2024-12-31T12:00:00' },
        ],
        lastDocDate: '2025-01-01T10:00:00',
      },
    } as never);

    const result = await fetchKarteByPatientId('0001-01', '2025-01-01 00:00:00');

    expect(httpClient.get).toHaveBeenCalledWith('/karte/pid/0001-01%2C2025-01-01%2000%3A00%3A00');
    expect(result).not.toBeNull();
    expect(result?.allergies).toHaveLength(1);
    expect(result?.documents).toHaveLength(1);
    expect(result?.memos).toHaveLength(1);
  });
});
