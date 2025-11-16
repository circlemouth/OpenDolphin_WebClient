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
      post: vi.fn(),
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
    vi.mocked(httpClient.post).mockReset();
    vi.mocked(httpClient.put).mockReset();
    vi.mocked(measureApiPerformance).mockClear();
  });

  it('fetches appointments using the ORCA wrapper', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({
      data: {
        slots: [
          {
            appointmentDate: '2026-05-01',
            appointmentTime: '10:00:00',
            appointmentId: 'AP-01',
            medicalInformation: '検査',
            patient: { patientId: '0001' },
          },
          {
            appointmentDate: '2026-05-02',
            appointmentTime: '09:30:00',
            appointmentId: 'AP-02',
            appointmentInformation: '診察',
            patient: { patientId: '0001' },
          },
        ],
      },
    } as never);

    const from = new Date('2026-04-01T00:00:00+09:00');
    const to = new Date('2026-06-01T00:00:00+09:00');

    const result = await fetchAppointments({ karteId: 200, from, to });

    expect(httpClient.post).toHaveBeenCalledWith('/orca/appointments/list', {
      appointmentDate: '2026-04-01',
      fromDate: '2026-04-01',
      toDate: '2026-06-01',
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: '検査',
      patientId: '0001',
      karteId: 200,
    });
    expect(result[0].dateTime).toBe('2026-05-01 10:00:00');
  });

  it('sends appointment mutation payloads on save', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: {} } as never);

    const command: AppointmentCommand = {
      action: 'create',
      facilityId: 'FAC001',
      userId: 'doctor01',
      userModelId: 42,
      karteId: 200,
      patientId: '0001',
      patientName: '山田太郎',
      patientKana: 'ヤマダタロウ',
      scheduledAt: new Date('2026-05-10T09:00:00+09:00'),
      name: '定期検査',
      memo: '事前に絶食',
    };

    await saveAppointments([command]);

    expect(httpClient.post).toHaveBeenCalledWith(
      '/orca/appointments/mutation',
      expect.objectContaining({
        requestNumber: '01',
        appointmentDate: '2026-05-10',
        appointmentTime: '09:00:00',
        appointmentInformation: '定期検査',
        patient: expect.objectContaining({ patientId: '0001', wholeName: '山田太郎' }),
      }),
    );
  });

  it('switches requestNumber for update and cancel actions', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: {} } as never);

    const update: AppointmentCommand = {
      action: 'update',
      id: 55,
      externalId: 'AP-55',
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
      externalId: 'AP-77',
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

    expect(httpClient.post).toHaveBeenNthCalledWith(
      1,
      '/orca/appointments/mutation',
      expect.objectContaining({
        requestNumber: '01',
        appointmentId: 'AP-55',
      }),
    );
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      '/orca/appointments/mutation',
      expect.objectContaining({
        requestNumber: '02',
        appointmentId: 'AP-77',
      }),
    );
  });
});
