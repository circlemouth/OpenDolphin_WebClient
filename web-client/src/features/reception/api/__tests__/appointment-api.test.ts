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

vi.mock('@/libs/monitoring', async () => {
  const actual = await vi.importActual<typeof import('@/libs/monitoring')>('@/libs/monitoring');
  return {
    ...actual,
    measureApiPerformance: vi.fn((_, __, fn: () => Promise<unknown>) => fn()),
  };
});

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

    const from = new Date('2026-04-01T00:00:00+09:00');
    const to = new Date('2026-06-01T00:00:00+09:00');

    const result = await fetchAppointments({ karteId: 200, from, to });

    expect(httpClient.get).toHaveBeenCalledWith(
      '/karte/appo/200%2C2026-04-01%2000%3A00%3A00%2C2026-06-01%2000%3A00%3A00',
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 1,
      name: '検査',
      patientId: '0001',
      karteId: 200,
    });
    expect(result[0].dateTime).toBe('2026-05-01 10:00:00');
  });

  it('sends appointment payload with metadata on save', async () => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: '1' } as never);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-09T01:23:45+09:00'));

    try {
      const command: AppointmentCommand = {
        action: 'create',
        facilityId: 'FAC001',
        userId: 'doctor01',
        userModelId: 42,
        karteId: 200,
        patientId: '0001',
        scheduledAt: new Date('2026-05-10T09:00:00+09:00'),
        name: '定期検査',
        memo: '事前に絶食',
      };

      await saveAppointments([command]);

      expect(httpClient.put).toHaveBeenCalledTimes(1);
      const [endpoint, payload] = vi.mocked(httpClient.put).mock.calls[0];
      expect(endpoint).toBe('/appo');

      const expectedAuditTimestamp = '2026-05-09 01:23:45';
      const expectedScheduleTimestamp = '2026-05-10 09:00:00';

      expect(payload).toMatchObject({
        list: [
          expect.objectContaining({
            state: 1,
            name: '定期検査',
            memo: '事前に絶食',
            patientId: '0001',
            karteBean: { id: 200 },
            userModel: { id: 42, userId: 'FAC001:doctor01' },
            date: expectedScheduleTimestamp,
            confirmed: expectedAuditTimestamp,
            started: expectedAuditTimestamp,
            recorded: expectedAuditTimestamp,
            status: 'F',
            linkId: 0,
            linkRelation: null,
            ended: null,
          }),
        ],
      });
    } finally {
      vi.useRealTimers();
    }
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
      scheduledAt: new Date('2026-05-11T09:00:00+09:00'),
      name: '再診',
      memo: '',
    };

    const cancel: AppointmentCommand = {
      action: 'cancel',
      id: 77,
      facilityId: 'FAC001',
      userId: 'doctor01',
      userModelId: 42,
      karteId: 200,
      patientId: '0001',
      scheduledAt: new Date('2026-05-12T10:30:00+09:00'),
      name: '取消対象',
      memo: 'キャンセル理由',
    };

    await saveAppointments([update, cancel]);

    const [, payload] = vi.mocked(httpClient.put).mock.calls[0];
    const list = (payload as {
      list: Array<{ state: number; name: string | null; memo: string | null }>;
    }).list;

    expect(list[0].state).toBe(3);
    expect(list[0].name).toBe('再診');
    expect(list[1].state).toBe(3);
    expect(list[1].name).toBeNull();
    expect(list[1].memo).toBeNull();
  });
});
