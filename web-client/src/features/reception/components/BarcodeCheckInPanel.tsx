import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, SurfaceCard, TextField } from '@/components';
import { useReceptionCheckIn, type BarcodeCheckInResult } from '@/features/reception/hooks/useReceptionCheckIn';
import { useReceptionPreferences } from '@/features/reception/hooks/useReceptionPreferences';

const Panel = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InlineFields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

const FeedbackMessage = styled.p<{ tone: 'success' | 'danger' | 'neutral' }>`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme, tone }) => {
    if (tone === 'success') {
      return theme.palette.success;
    }
    if (tone === 'danger') {
      return theme.palette.danger;
    }
    return theme.palette.textMuted;
  }};
`;

interface BarcodeCheckInPanelProps {
  onSuccess?: (result: BarcodeCheckInResult) => void;
}

export const BarcodeCheckInPanel = ({ onSuccess }: BarcodeCheckInPanelProps) => {
  const [barcode, setBarcode] = useState('');
  const [memo, setMemo] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [insuranceUid, setInsuranceUid] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(
    null,
  );
  const checkInMutation = useReceptionCheckIn();
  const { preferences, setDefaults } = useReceptionPreferences();

  useEffect(() => {
    setDepartmentCode(preferences.defaultDepartmentCode ?? '');
    setDepartmentName(preferences.defaultDepartmentName ?? '');
    setDoctorId(preferences.defaultDoctorId ?? '');
    setDoctorName(preferences.defaultDoctorName ?? '');
    setInsuranceUid(preferences.defaultInsuranceUid ?? '');
  }, [preferences.defaultDepartmentCode, preferences.defaultDepartmentName, preferences.defaultDoctorId, preferences.defaultDoctorName, preferences.defaultInsuranceUid]);

  const resetForm = () => {
    setBarcode('');
    setMemo('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    if (!barcode.trim()) {
      setFeedback({ tone: 'danger', message: 'バーコードを入力してください。' });
      return;
    }

    try {
      const result = await checkInMutation.mutateAsync({
        code: barcode,
        memo,
        departmentCode,
        departmentName,
        doctorId,
        doctorName,
        insuranceUid,
      });
      setFeedback({
        tone: 'success',
        message: `患者ID ${result.patientId} (${result.patient.fullName}) を受付登録しました。`,
      });
      onSuccess?.(result);
      resetForm();
      setDefaults({
        defaultDepartmentCode: departmentCode || undefined,
        defaultDepartmentName: departmentName || undefined,
        defaultDoctorId: doctorId || undefined,
        defaultDoctorName: doctorName || undefined,
        defaultInsuranceUid: insuranceUid || undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '受付登録に失敗しました。';
      setFeedback({ tone: 'danger', message });
    }
  };

  return (
    <Panel tone="muted" padding="lg">
      <Stack gap={12}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>バーコード受付</h2>
          <p style={{ margin: '4px 0 0', color: '#4b5563', fontSize: '0.85rem' }}>
            診察券バーコードを読み取ると自動で受付リストへ登録します。担当医や保険コードの初期値は記憶されます。
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <Stack gap={12}>
            <TextField
              label="バーコード入力"
              placeholder="診察券のバーコードをスキャン"
              value={barcode}
              onChange={(event) => setBarcode(event.currentTarget.value)}
              autoFocus
              required
              disabled={checkInMutation.isPending}
            />
            <TextField
              label="受付メモ"
              placeholder="任意で受付メモを入力"
              value={memo}
              onChange={(event) => setMemo(event.currentTarget.value)}
              disabled={checkInMutation.isPending}
            />
            <InlineFields>
              <TextField
                label="診療科コード"
                value={departmentCode}
                onChange={(event) => setDepartmentCode(event.currentTarget.value)}
                disabled={checkInMutation.isPending}
              />
              <TextField
                label="診療科名"
                value={departmentName}
                onChange={(event) => setDepartmentName(event.currentTarget.value)}
                disabled={checkInMutation.isPending}
              />
              <TextField
                label="担当医コード"
                value={doctorId}
                onChange={(event) => setDoctorId(event.currentTarget.value)}
                disabled={checkInMutation.isPending}
              />
              <TextField
                label="担当医名"
                value={doctorName}
                onChange={(event) => setDoctorName(event.currentTarget.value)}
                disabled={checkInMutation.isPending}
              />
              <TextField
                label="保険UUID"
                value={insuranceUid}
                onChange={(event) => setInsuranceUid(event.currentTarget.value)}
                disabled={checkInMutation.isPending}
                placeholder="必要に応じて指定"
              />
            </InlineFields>
            <div>
              <Button type="submit" variant="primary" isLoading={checkInMutation.isPending}>
                受付に追加
              </Button>
            </div>
            {feedback ? <FeedbackMessage tone={feedback.tone}>{feedback.message}</FeedbackMessage> : null}
          </Stack>
        </form>
      </Stack>
    </Panel>
  );
};
