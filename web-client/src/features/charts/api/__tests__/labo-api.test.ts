import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchLaboItemTrend, fetchLaboModules } from '@/features/charts/api/labo-api';
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

describe('labo-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
    vi.mocked(measureApiPerformance).mockClear();
  });

  it('fetches and normalizes labo modules', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          {
            id: 20,
            sampleDate: '2026-05-10T09:30:00+09:00',
            numOfItems: '2',
            items: [
              {
                id: 200,
                itemCode: 'HB',
                itemName: 'ヘモグロビン',
                value: '13.5',
                unit: 'g/dL',
              },
              {
                id: 201,
                itemCode: 'WBC',
                itemName: '白血球',
                value: '4200',
                unit: '/µL',
              },
            ],
          },
          {
            id: 21,
            sampleDate: '2026-05-09T09:00:00+09:00',
            numOfItems: '1',
            items: [
              {
                id: 210,
                itemCode: 'CRP',
                itemName: 'CRP',
                value: '0.20',
                unit: 'mg/dL',
              },
            ],
          },
        ],
      },
    } as never);

    const modules = await fetchLaboModules('0001', { limit: 10 });

    expect(httpClient.get).toHaveBeenCalledWith('/lab/module/0001%2C0%2C10');
    expect(modules).toHaveLength(2);
    expect(modules[0]).toMatchObject({ id: 20, itemCount: 2 });
    expect(modules[0].items[0]).toMatchObject({ itemCode: 'HB', valueText: '13.5' });
    expect(modules[1].sampleDate).toBe(new Date('2026-05-09T09:00:00+09:00').toISOString());
  });

  it('fetches trend data and extracts numeric values', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          { sampleDate: '2026-05-01T09:00:00+09:00', value: '5.1', unit: 'mg/dL', abnormalFlg: 'H' },
          { sampleDate: '2026-05-08T09:00:00+09:00', value: '<4.8', unit: 'mg/dL', abnormalFlg: null },
        ],
      },
    } as never);

    const trend = await fetchLaboItemTrend('0001', 'CRP', { limit: 20 });

    expect(httpClient.get).toHaveBeenCalledWith('/lab/item/0001%2C0%2C20%2CCRP');
    expect(trend).toHaveLength(2);
    expect(trend[0]).toMatchObject({ sampleDate: new Date('2026-05-01T09:00:00+09:00').toISOString(), numericValue: 5.1 });
    expect(trend[1].numericValue).toBe(4.8);
  });
});
