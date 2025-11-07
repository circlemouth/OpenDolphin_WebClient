import { describe, expect, it, vi } from 'vitest';

import userEvent from '@testing-library/user-event';

import { render, screen, waitFor } from '@/test/test-utils';
import { AppointmentManager } from '@/features/reception/components/AppointmentManager';
import { useAppointments, useSaveAppointments } from '@/features/reception/hooks/useAppointments';

vi.mock('@/features/reception/hooks/useAppointments', () => ({
  useAppointments: vi.fn(),
  useSaveAppointments: vi.fn(),
}));

const baseVisit = {
  visitId: 10,
  patientId: '000001',
  fullName: '患者 太郎',
  memo: null,
  ownerUuid: null,
  safetyNotes: [],
  state: 0,
  visitDate: '2026-05-01',
};

const facilityKarteId = 123;

const appointmentSample = {
  id: 90,
  dateTime: '2026-05-20T00:00:00.000Z',
  name: '内視鏡検査',
  memo: '事前説明済み',
  patientId: '000001',
  karteId: facilityKarteId,
  state: 1,
};

describe('AppointmentManager reminder flow', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('records reminder logs via appointment memo update', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useAppointments).mockReturnValue({
      data: [appointmentSample],
      isLoading: false,
      error: null,
    } as never);

    vi.mocked(useSaveAppointments).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    render(
      <AppointmentManager
        visit={baseVisit as never}
        karteId={facilityKarteId}
        facilityId="FAC001"
        userId="user-1"
        userModelId={99}
        facilityName="テストクリニック"
        operatorName="受付 太郎"
        onClose={vi.fn()}
      />,
      { withRouter: false },
    );

    const reminderButton = await screen.findByRole('button', { name: 'リマインダー' });
    await userEvent.click(reminderButton);

    const emailField = await screen.findByLabelText('メールアドレス（送信先）');
    const noteField = await screen.findByLabelText('記録用メモ');
    const recordButton = await screen.findByRole('button', { name: '送信済みを記録' });

    await userEvent.type(emailField, 'test@example.com');
    await userEvent.type(noteField, '家族へ転送済み');

    expect(recordButton).not.toBeDisabled();
    await userEvent.click(recordButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1);
    });

    const payload = mutateAsync.mock.calls[0][0][0];
    expect(payload).toMatchObject({
      action: 'update',
      patientId: appointmentSample.patientId,
      karteId: facilityKarteId,
    });
    expect(payload.memo).toContain('事前説明済み');
    expect(payload.memo).toContain('【リマインダー】');
    expect(payload.memo).toContain('メール');
    expect(payload.memo).toContain('test@example.com');
    expect(payload.memo).toContain('家族へ転送済み');
  });
});
