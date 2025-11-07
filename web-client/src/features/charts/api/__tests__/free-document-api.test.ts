import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFreeDocument, saveFreeDocument } from '@/features/charts/api/free-document-api';
import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

vi.mock('@/libs/http', async () => {
  const actual = await vi.importActual<typeof import('@/libs/http')>('@/libs/http');
  return {
    ...actual,
    httpClient: {
      get: vi.fn(),
      put: vi.fn(),
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

describe('free-document-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
    vi.mocked(httpClient.put).mockReset();
    vi.mocked(measureApiPerformance).mockClear();
  });

  it('returns null when patient id is blank', async () => {
    const result = await fetchFreeDocument('   ');
    expect(result).toBeNull();
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('fetches and normalizes free document summary', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        id: 10,
        facilityPatId: 'FAC001:0001',
        confirmed: '2026-05-01T12:00:00+09:00',
        comment: '要約',
      },
    } as never);

    const result = await fetchFreeDocument('0001');

    expect(httpClient.get).toHaveBeenCalledWith('/karte/freedocument/0001');
    expect(result).toEqual({
      id: 10,
      facilityPatientId: 'FAC001:0001',
      confirmedAt: new Date('2026-05-01T12:00:00+09:00').toISOString(),
      comment: '要約',
    });
  });

  it('sends trimmed comment when saving', async () => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: '1' } as never);

    await saveFreeDocument({ patientId: '0001 ', comment: ' 記録 ', id: 15 });

    expect(httpClient.put).toHaveBeenCalledTimes(1);
    const [endpoint, payload] = vi.mocked(httpClient.put).mock.calls[0];
    expect(endpoint).toBe('/karte/freedocument');
    expect(payload).toMatchObject({
      id: 15,
      facilityPatId: '0001',
      comment: ' 記録 ',
    });
  });
});
