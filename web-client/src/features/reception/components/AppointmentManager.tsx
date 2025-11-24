import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, SurfaceCard, TextArea, TextField, SelectField } from '@/components';
import type { SelectOption } from '@/components/SelectField';
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

const ReminderOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1300;
`;

const ReminderDialogShell = styled(SurfaceCard)`
  width: min(560px, 100%);
  max-height: calc(100vh - 64px);
  overflow: auto;
  display: grid;
  gap: 16px;
  padding: 24px;
`;

const ReminderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const ReminderLogList = styled.ul`
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 4px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const REMINDER_PREFIX = '【リマインダー】';

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

const reminderChannels: SelectOption[] = [
  { value: 'email', label: 'メール' },
  { value: 'sms', label: 'SMS' },
];

type ReminderChannel = 'email' | 'sms';

interface ReminderRecordInput {
  channel: ReminderChannel;
  contact: string;
  note?: string;
}

const extractReminderHistory = (memo?: string | null) =>
  memo
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(REMINDER_PREFIX))
    .map((line) => line.slice(REMINDER_PREFIX.length).trim()) ?? [];

const appendReminderLog = (memo: string | null | undefined, entry: string) => {
  const base = memo?.trim();
  return base ? `${base}\n${entry}` : entry;
};

const buildReminderEntry = (
  date: Date,
  channel: ReminderChannel,
  contact: string,
  note: string | undefined,
  operator?: string,
) => {
  const label = channel === 'email' ? 'メール' : 'SMS';
  const timestamp = formatDateTimeLabel(date.toISOString());
  const contactText = contact ? `(${contact})` : '';
  const noteText = note ? ` / ${note}` : '';
  const operatorText = operator ? ` by ${operator}` : '';
  return `${REMINDER_PREFIX}${timestamp} ${label}${contactText}${noteText}${operatorText}`;
};

interface AppointmentManagerProps {
  visit: PatientVisitSummary;
  karteId: number | null;
  facilityId: string;
  userId: string;
  userModelId?: number | null;
  facilityName?: string;
  operatorName?: string;
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

interface ReminderDialogProps {
  appointment: AppointmentSummary;
  patientName: string;
  facilityName?: string;
  operatorName?: string;
  onClose: () => void;
  onRecord: (input: ReminderRecordInput) => Promise<void> | void;
  isSaving: boolean;
  error?: string | null;
}

const ReminderDialog = ({
  appointment,
  patientName,
  facilityName,
  operatorName,
  onClose,
  onRecord,
  isSaving,
  error,
}: ReminderDialogProps) => {
  const [channel, setChannel] = useState<ReminderChannel>('email');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const appointmentLabel = appointment.name || '診察予約';
  const formattedDate = formatDateTimeLabel(appointment.dateTime);
  const facilityLabel = facilityName ?? '当院';
  const operatorLabel = operatorName ?? '';
  const subject = `【${facilityLabel}】予約リマインダー（${formattedDate}）`;
  const baseBody = `${patientName} 様\n\n${facilityLabel}です。${formattedDate} に ${appointmentLabel} のご予約があります。\nご来院が難しい場合はお早めにご連絡ください。\n`;
  const body = `${baseBody}${additionalMessage ? `\n${additionalMessage}\n` : ''}\n---\n${facilityLabel}\n${operatorLabel ? `担当: ${operatorLabel}\n` : ''}`;
  const reminderLogs = extractReminderHistory(appointment.memo);
  const contactLabel = channel === 'email' ? 'メールアドレス（送信先）' : '電話番号（送信先）';

  const handleCopyMessage = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setLocalError('クリップボード API が利用できません。ブラウザの設定をご確認ください。');
      setCopyFeedback(null);
      return;
    }
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopyFeedback('件名と本文をコピーしました。');
      setLocalError(null);
    } catch (copyError) {
      console.error('リマインダー本文のコピーに失敗しました', copyError);
      setLocalError('リマインダー本文のコピーに失敗しました。ブラウザの権限設定を確認してください。');
      setCopyFeedback(null);
    }
  };

  const handleLaunchMailer = () => {
    if (channel !== 'email') {
      return;
    }
    if (typeof window === 'undefined') {
      setLocalError('メールアプリの起動はブラウザ環境でのみ利用できます。');
      return;
    }
    const trimmed = contact.trim();
    if (!trimmed) {
      setLocalError('送信先メールアドレスを入力してください。');
      return;
    }
    const mailto = `mailto:${encodeURIComponent(trimmed)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank', 'noopener');
  };

  const handleRecordClick = async () => {
    const trimmed = contact.trim();
    if (!trimmed) {
      setLocalError(
        channel === 'email' ? '送信先メールアドレスを入力してください。' : '送信先電話番号を入力してください。',
      );
      return;
    }
    setLocalError(null);
    setCopyFeedback(null);
    try {
      await onRecord({ channel, contact: trimmed, note: note.trim() || undefined });
    } catch (recordError) {
      console.error('リマインダー送信履歴の記録処理でエラーが発生しました', recordError);
    }
  };

  return (
    <ReminderOverlay role="dialog" aria-modal aria-label="予約リマインダー送信">
      <ReminderDialogShell tone="muted">
        <ReminderHeader>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>予約リマインダー</h2>
            <InlineText>
              {formattedDate} / {appointmentLabel}
            </InlineText>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            閉じる
          </Button>
        </ReminderHeader>

        <Stack gap={12}>
          <SelectField
            label="送信方法"
            value={channel}
            options={reminderChannels}
            onChange={(event) => setChannel(event.currentTarget.value as ReminderChannel)}
            disabled={isSaving}
          />
          <TextField
            label={contactLabel}
            value={contact}
            onChange={(event) => setContact(event.currentTarget.value)}
            disabled={isSaving}
          />
          <TextField
            label="記録用メモ"
            placeholder="例：家族へ転送済み"
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
            disabled={isSaving}
          />
          <TextArea
            label="患者への追記事項"
            placeholder="持ち物や来院時の注意事項があれば記載"
            value={additionalMessage}
            onChange={(event) => setAdditionalMessage(event.currentTarget.value)}
            rows={3}
            disabled={isSaving}
          />
          <TextField label="件名" value={subject} readOnly />
          <TextArea label="本文プレビュー" value={body} readOnly rows={6} />

          <ActionRow>
            <Button type="button" variant="secondary" onClick={handleCopyMessage} disabled={isSaving}>
              件名と本文をコピー
            </Button>
            {channel === 'email' ? (
              <Button type="button" variant="ghost" onClick={handleLaunchMailer} disabled={isSaving}>
                メールアプリを開く
              </Button>
            ) : null}
          </ActionRow>

          <ActionRow>
            <Button type="button" variant="primary" onClick={handleRecordClick} disabled={isSaving}>
              送信済みを記録
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              閉じる
            </Button>
          </ActionRow>

          {copyFeedback ? <InfoText>{copyFeedback}</InfoText> : null}
          {localError ? <ErrorText role="alert">{localError}</ErrorText> : null}
          {error ? <ErrorText role="alert">{error}</ErrorText> : null}

          <div>
            <h3 style={{ margin: '8px 0', fontSize: '0.95rem' }}>送信履歴</h3>
            {reminderLogs.length > 0 ? (
              <ReminderLogList>
                {reminderLogs.map((log, index) => (
                  <li key={`${log}-${index}`}>{log}</li>
                ))}
              </ReminderLogList>
            ) : (
              <InlineText>送信履歴はまだありません。</InlineText>
            )}
          </div>
        </Stack>
      </ReminderDialogShell>
    </ReminderOverlay>
  );
};

const DEFAULT_RANGE_DAYS = 60;

export const AppointmentManager = ({
  visit,
  karteId,
  facilityId,
  userId,
  userModelId,
  facilityName,
  operatorName,
  onClose,
  onPendingChange,
}: AppointmentManagerProps) => {
  const [form, setForm] = useState<FormState>(createInitialFormState);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [reminderTarget, setReminderTarget] = useState<AppointmentSummary | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);

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

  const appointments = useMemo(
    () => appointmentsQuery.data ?? [],
    [appointmentsQuery.data],
  );

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

  useEffect(() => {
    if (!reminderTarget) {
      return;
    }
    const exists = appointments.some((appointment) => appointment.id === reminderTarget.id);
    if (!exists) {
      setReminderTarget(null);
    }
  }, [appointments, reminderTarget]);

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

  const buildCommand = (action: 'create' | 'update' | 'cancel', source?: AppointmentSummary | null): AppointmentCommand | null => {
    if (!ensureUserContext()) {
      return null;
    }
    const scheduled = action === 'cancel' ? fromInputValue(form.dateTime) : fromInputValue(form.dateTime);
    if (!scheduled) {
      setFormError('予約日時を入力してください。');
      return null;
    }
    return {
      id: source?.id ?? form.id ?? undefined,
      externalId: source?.externalId ?? undefined,
      scheduledAt: scheduled,
      name: action === 'cancel' ? null : form.name.trim(),
      memo: action === 'cancel' ? null : form.memo.trim(),
      patientId: visit.patientId,
      patientName: visit.fullName,
      patientKana: visit.kanaName ?? null,
      birthDate: visit.birthday ?? null,
      sex: visit.gender ?? null,
      departmentCode: visit.departmentCode ?? null,
      physicianCode: visit.doctorId ?? null,
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
    const current = form.id ? appointments.find((appointment) => appointment.id === form.id) ?? null : null;
    const command = buildCommand(form.id ? 'update' : 'create', current);
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
    const command = buildCommand('cancel', appointment);
    if (!command) {
      return;
    }
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

  const handleOpenReminder = (appointment: AppointmentSummary) => {
    setReminderError(null);
    setReminderTarget(appointment);
  };

  const handleCloseReminder = () => {
    setReminderTarget(null);
    setReminderError(null);
  };

  const handleRecordReminder = async (input: ReminderRecordInput) => {
    if (!karteId) {
      setReminderError('カルテ ID を特定できません。受付情報を再読み込みしてください。');
      return;
    }
    if (!userModelId) {
      setReminderError('ユーザー情報を取得できません。再ログイン後にお試しください。');
      return;
    }
    if (!reminderTarget) {
      setReminderError('リマインダー対象の予約を特定できません。再度選択してください。');
      return;
    }

    setReminderError(null);
    setInfoMessage(null);

    try {
      const entry = buildReminderEntry(
        new Date(),
        input.channel,
        input.contact,
        input.note,
        operatorName ?? userId,
      );
      const command: AppointmentCommand = {
        id: reminderTarget.id,
        externalId: reminderTarget.externalId ?? null,
        scheduledAt: new Date(reminderTarget.dateTime),
        name: reminderTarget.name,
        memo: appendReminderLog(reminderTarget.memo, entry),
        patientId: reminderTarget.patientId,
        patientName: visit.fullName,
        patientKana: visit.kanaName ?? null,
        birthDate: visit.birthday ?? null,
        sex: visit.gender ?? null,
        departmentCode: visit.departmentCode ?? null,
        physicianCode: visit.doctorId ?? null,
        karteId,
        userModelId,
        userId,
        facilityId,
        action: 'update',
      };
      await saveMutation.mutateAsync([command]);
      setInfoMessage('リマインダー送信履歴を記録しました。');
      setReminderTarget(null);
    } catch (error) {
      console.error('リマインダー送信履歴の記録に失敗しました', error);
      setReminderError('リマインダー送信履歴の記録に失敗しました。ネットワーク状況を確認してください。');
    }
  };

  return (
    <>
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

      {appointmentsQuery.isPending ? <InlineText>予約情報を取得しています…</InlineText> : null}
      {appointmentsQuery.error ? <ErrorText>予約情報の取得に失敗しました。再読み込みしてください。</ErrorText> : null}
      {infoMessage ? <InfoText>{infoMessage}</InfoText> : null}
      {formError ? <ErrorText role="alert">{formError}</ErrorText> : null}
      {reminderError && !reminderTarget ? <ErrorText role="alert">{reminderError}</ErrorText> : null}

      <AppointmentList>
      {appointments.length === 0 ? (
        <InlineText>表示期間内の予約はありません。新しい予約を登録してください。</InlineText>
      ) : (
        appointments.map((appointment) => {
          const reminderHistory = extractReminderHistory(appointment.memo);
          const latestReminder = reminderHistory.at(-1);
          return (
            <AppointmentItem key={appointment.id}>
              <AppointmentMeta>
                <strong>{formatDateTimeLabel(appointment.dateTime)}</strong>
                <span>{appointment.name || '（名称未設定）'}</span>
                {appointment.memo ? <InlineText>{appointment.memo}</InlineText> : null}
                {latestReminder ? <InlineText>最新リマインダー: {latestReminder}</InlineText> : null}
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
                  onClick={() => handleOpenReminder(appointment)}
                  disabled={saveMutation.isPending}
                >
                  リマインダー
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
          );
        })
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

      {reminderTarget ? (
        <ReminderDialog
          appointment={reminderTarget}
          patientName={visit.fullName}
          facilityName={facilityName}
          operatorName={operatorName ?? userId}
          onClose={handleCloseReminder}
          onRecord={handleRecordReminder}
          isSaving={saveMutation.isPending}
          error={reminderError}
        />
      ) : null}
    </>
  );
};
