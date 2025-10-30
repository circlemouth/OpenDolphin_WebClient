import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, SurfaceCard, TextArea, TextField } from '@/components';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import {
  type AppointmentCommand,
  type AppointmentSummary,
} from '@/features/reception/api/appointment-api';
import { useAppointments, useSaveAppointments } from '@/features/reception/hooks/useAppointments';

const ManagerCard = styled(SurfaceCard)`
  display: grid;
  gap: 16px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
`;

const InlineText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.danger};
`;

const InfoText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.success};
`;

const AppointmentList = styled.div`
  display: grid;
  gap: 8px;
`;

const AppointmentItem = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const AppointmentMeta = styled.div`
  display: grid;
  gap: 4px;
`;

const AppointmentActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormRow = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const formatDateTimeLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toInputValue = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const fromInputValue = (value: string) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

interface AppointmentManagerProps {
  visit: PatientVisitSummary;
  karteId: number | null;
  facilityId: string;
  userId: string;
  userModelId?: number | null;
  onClose: () => void;
  onPendingChange?: (isPending: boolean) => void;
}

interface FormState {
  id: number | null;
  dateTime: string;
  name: string;
  memo: string;
}

const createInitialFormState = (): FormState => ({
  id: null,
  dateTime: '',
  name: '',
  memo: '',
});

const DEFAULT_RANGE_DAYS = 60;

export const AppointmentManager = ({
  visit,
  karteId,
  facilityId,
  userId,
  userModelId,
  onClose,
  onPendingChange,
}: AppointmentManagerProps) => {
  const [form, setForm] = useState<FormState>(createInitialFormState);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const rangeStart = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }, []);

  const rangeEnd = useMemo(() => {
    const end = new Date(rangeStart);
    end.setDate(end.getDate() + DEFAULT_RANGE_DAYS);
    end.setHours(23, 59, 59, 0);
    return end;
  }, [rangeStart]);

  const appointmentsQuery = useAppointments(karteId, {
    from: rangeStart,
    to: rangeEnd,
    enabled: Boolean(karteId),
  });

  const saveMutation = useSaveAppointments();

  useEffect(() => {
    if (!onPendingChange) {
      return;
    }
    onPendingChange(saveMutation.isPending);
  }, [saveMutation.isPending, onPendingChange]);

  useEffect(() => {
    if (!onPendingChange) {
      return;
    }
    return () => {
      onPendingChange(false);
    };
  }, [onPendingChange]);

  const appointments = appointmentsQuery.data ?? [];

  useEffect(() => {
    if (!selectedAppointmentId) {
      return;
    }
    const current = appointments.find((entry) => entry.id === selectedAppointmentId);
    if (!current) {
      return;
    }
    setForm({
      id: current.id,
      dateTime: toInputValue(current.dateTime),
      name: current.name,
      memo: current.memo ?? '',
    });
  }, [appointments, selectedAppointmentId]);

  const resetForm = () => {
    setForm(createInitialFormState());
    setSelectedAppointmentId(null);
    setFormError(null);
  };

  const handleSelectAppointment = (appointment: AppointmentSummary) => {
    setInfoMessage(null);
    setFormError(null);
    setSelectedAppointmentId(appointment.id);
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setInfoMessage(null);
    setFormError(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.dateTime) {
      setFormError('予約日時を入力してください。');
      return false;
    }
    const parsed = fromInputValue(form.dateTime);
    if (!parsed) {
      setFormError('予約日時の形式が正しくありません。');
      return false;
    }
    if (!form.name.trim()) {
      setFormError('予約内容（メニュー名など）を入力してください。');
      return false;
    }
    const duplicate = appointments.some(
      (appointment) =>
        appointment.id !== form.id &&
        Math.abs(new Date(appointment.dateTime).getTime() - parsed.getTime()) < 60 * 1000,
    );
    if (duplicate) {
      setFormError('同じ日時の予約が既に登録されています。時間帯を調整してください。');
      return false;
    }
    return true;
  };

  const ensureUserContext = () => {
    if (!karteId) {
      setFormError('カルテ ID を特定できません。受付情報を再読み込みしてください。');
      return false;
    }
    if (!userModelId) {
      setFormError('ユーザー情報を取得できません。再ログイン後にお試しください。');
      return false;
    }
    return true;
  };

  const buildCommand = (action: 'create' | 'update' | 'cancel'): AppointmentCommand | null => {
    if (!ensureUserContext()) {
      return null;
    }
    const scheduled = action === 'cancel' ? fromInputValue(form.dateTime) : fromInputValue(form.dateTime);
    if (!scheduled) {
      setFormError('予約日時を入力してください。');
      return null;
    }
    return {
      id: action === 'create' ? undefined : form.id ?? undefined,
      scheduledAt: scheduled,
      name: action === 'cancel' ? null : form.name.trim(),
      memo: action === 'cancel' ? null : form.memo.trim(),
      patientId: visit.patientId,
      karteId: karteId!,
      userModelId: userModelId!,
      userId,
      facilityId,
      action,
    };
  };

  const handleSubmit = async () => {
    setInfoMessage(null);
    if (!validateForm()) {
      return;
    }
    const command = buildCommand(form.id ? 'update' : 'create');
    if (!command) {
      return;
    }
    try {
      await saveMutation.mutateAsync([command]);
      setInfoMessage(command.id ? '予約を更新しました。' : '予約を登録しました。');
      resetForm();
    } catch (error) {
      console.error('予約保存に失敗しました', error);
      setFormError('予約の保存に失敗しました。ネットワークを確認して再試行してください。');
    }
  };

  const handleCancelAppointment = async (appointment: AppointmentSummary) => {
    if (!ensureUserContext()) {
      return;
    }
    setInfoMessage(null);
    setFormError(null);
    const command: AppointmentCommand = {
      id: appointment.id,
      scheduledAt: new Date(appointment.dateTime),
      name: null,
      memo: null,
      patientId: appointment.patientId,
      karteId: appointment.karteId,
      userModelId: userModelId!,
      userId,
      facilityId,
      action: 'cancel',
    };
    try {
      await saveMutation.mutateAsync([command]);
      setInfoMessage('予約を取り消しました。');
      if (selectedAppointmentId === appointment.id) {
        resetForm();
      }
    } catch (error) {
      console.error('予約取消に失敗しました', error);
      setFormError('予約の取り消しに失敗しました。ネットワークを確認して再試行してください。');
    }
  };

  return (
    <ManagerCard tone="muted" padding="lg">
      <HeaderRow>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>予約管理</h2>
          <InlineText>
            {visit.fullName}（ID: {visit.patientId}）の予約を登録・更新します。
          </InlineText>
        </div>
        <Button type="button" variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>
          閉じる
        </Button>
      </HeaderRow>

      {appointmentsQuery.isLoading ? <InlineText>予約情報を取得しています…</InlineText> : null}
      {appointmentsQuery.error ? <ErrorText>予約情報の取得に失敗しました。再読み込みしてください。</ErrorText> : null}
      {infoMessage ? <InfoText>{infoMessage}</InfoText> : null}
      {formError ? <ErrorText role="alert">{formError}</ErrorText> : null}

      <AppointmentList>
        {appointments.length === 0 ? (
          <InlineText>表示期間内の予約はありません。新しい予約を登録してください。</InlineText>
        ) : (
          appointments.map((appointment) => (
            <AppointmentItem key={appointment.id}>
              <AppointmentMeta>
                <strong>{formatDateTimeLabel(appointment.dateTime)}</strong>
                <span>{appointment.name || '（名称未設定）'}</span>
                {appointment.memo ? <InlineText>{appointment.memo}</InlineText> : null}
              </AppointmentMeta>
              <AppointmentActions>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleSelectAppointment(appointment)}
                  disabled={saveMutation.isPending}
                >
                  編集
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleCancelAppointment(appointment)}
                  disabled={saveMutation.isPending}
                >
                  取消
                </Button>
              </AppointmentActions>
            </AppointmentItem>
          ))
        )}
      </AppointmentList>

      <Stack gap={12}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>{form.id ? '予約を更新' : '新規予約を登録'}</h3>
        <FormRow>
          <TextField
            label="予約日時"
            type="datetime-local"
            value={form.dateTime}
            onChange={(event) => handleFieldChange('dateTime', event.currentTarget.value)}
            required
            disabled={saveMutation.isPending}
          />
          <TextField
            label="予約内容"
            placeholder="例：内視鏡検査 / 血液検査"
            value={form.name}
            onChange={(event) => handleFieldChange('name', event.currentTarget.value)}
            required
            disabled={saveMutation.isPending}
          />
        </FormRow>
        <TextArea
          label="メモ"
          placeholder="スタッフへの注意事項などを記載"
          value={form.memo}
          onChange={(event) => handleFieldChange('memo', event.currentTarget.value)}
          rows={3}
          disabled={saveMutation.isPending}
        />
        <ActionRow>
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={saveMutation.isPending}>
            {form.id ? '変更を保存' : '予約を登録'}
          </Button>
          <Button type="button" variant="ghost" onClick={resetForm} disabled={saveMutation.isPending}>
            入力をクリア
          </Button>
        </ActionRow>
      </Stack>
    </ManagerCard>
  );
};
