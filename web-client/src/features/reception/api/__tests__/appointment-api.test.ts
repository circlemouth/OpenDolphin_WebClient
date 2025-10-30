import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAppointments,
  saveAppointments,
  type AppointmentCommand,
} from '@/features/reception/api/appointment-api';
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

vi.mock('@/libs/monitoring', () => ({
  measureApiPerformance: vi.fn((_, __, fn: () => Promise<unknown>) => fn()),
}));

describe('appointment-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
    vi.mocked(httpClient.put).mockReset();
    vi.mocked(measureApiPerformance).mockClear();
  });

  it('fetches appointments and flattens nested lists', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          {
            list: [
              { id: 1, date: '2026-05-01T10:00:00+09:00', name: '検査', patientId: '0001', state: 1, karteBean: { id: 200 } },
              { id: 2, date: '2026-05-02T09:30:00+09:00', name: '診察', patientId: '0001', state: 3 },
            ],
          },
        ],
      },
    } as never);

    const from = new Date('2026-04-01T00:00:00');
    const to = new Date('2026-06-01T00:00:00');

    const result = await fetchAppointments({ karteId: 200, from, to });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/karte/appo/200%2C2026-04-01T00%3A00%3A00%2C2026-06-01T00%3A00%3A00',
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 1,
      name: '検査',
      patientId: '0001',
      karteId: 200,
    });
    expect(result[0].dateTime).toBe(new Date('2026-05-01T10:00:00+09:00').toISOString());
  });

  it('sends appointment payload with metadata on save', async () => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: '1' } as never);

    const command: AppointmentCommand = {
      action: 'create',
      facilityId: 'FAC001',
      userId: 'doctor01',
      userModelId: 42,
      karteId: 200,
      patientId: '0001',
      scheduledAt: new Date('2026-05-10T09:00:00'),
      name: '定期検査',
      memo: '事前に絶食',
    };

    await saveAppointments([command]);

    expect(httpClient.put).toHaveBeenCalledTimes(1);
    const [endpoint, payload] = vi.mocked(httpClient.put).mock.calls[0];
    expect(endpoint).toBe('/appo');
    expect(payload).toMatchObject({
      list: [
        expect.objectContaining({
          state: 1,
          name: '定期検査',
          memo: '事前に絶食',
          patientId: '0001',
          karteBean: { id: 200 },
          userModel: { id: 42, userId: 'FAC001:doctor01' },
        }),
      ],
    });
  });

  it('marks command as replace when updating or cancelling', async () => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: '1' } as never);

    const update: AppointmentCommand = {
      action: 'update',
      id: 55,
      facilityId: 'FAC001',
      userId: 'doctor01',
      userModelId: 42,
      karteId: 200,
      patientId: '0001',
      scheduledAt: new Date('2026-05-11T09:00:00'),
      name: '再診',
      memo: '',
    };

    await saveAppointments([update]);

    const [, payload] = vi.mocked(httpClient.put).mock.calls[0];
    expect((payload as { list: Array<{ state: number; name: string | null }> }).list[0].state).toBe(3);
    expect((payload as { list: Array<{ name: string | null }> }).list[0].name).toBe('再診');
  });
});
