import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/test/test-utils';
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

describe('AppointmentManager', () => {
  it('notifies pending changes and disables close button while saving', () => {
    const mutateAsync = vi.fn();
    const pendingState = { value: false };

    vi.mocked(useAppointments).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as never);

    vi.mocked(useSaveAppointments).mockImplementation(() => ({
      mutateAsync,
      isPending: pendingState.value,
    }) as never);

    const onPendingChange = vi.fn();

    const { rerender } = render(
      <AppointmentManager
        visit={baseVisit as never}
        karteId={123}
        facilityId="FAC001"
        userId="user-1"
        userModelId={99}
        facilityName="テストクリニック"
        operatorName="受付 太郎"
        onClose={vi.fn()}
        onPendingChange={onPendingChange}
      />,
      { withRouter: false },
    );

    expect(onPendingChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('button', { name: '閉じる' })).not.toBeDisabled();

    pendingState.value = true;
    rerender(
      <AppointmentManager
        visit={baseVisit as never}
        karteId={123}
        facilityId="FAC001"
        userId="user-1"
        userModelId={99}
        facilityName="テストクリニック"
        operatorName="受付 太郎"
        onClose={vi.fn()}
        onPendingChange={onPendingChange}
      />,
    );

    expect(onPendingChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', { name: '閉じる' })).toBeDisabled();

    pendingState.value = false;
    rerender(
      <AppointmentManager
        visit={baseVisit as never}
        karteId={123}
        facilityId="FAC001"
        userId="user-1"
        userModelId={99}
        facilityName="テストクリニック"
        operatorName="受付 太郎"
        onClose={vi.fn()}
        onPendingChange={onPendingChange}
      />,
    );

    expect(onPendingChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('button', { name: '閉じる' })).not.toBeDisabled();
  });
});
