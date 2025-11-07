import { useState } from 'react';
import type { FormEvent } from 'react';
import styled from '@emotion/styled';

import { Button, Stack, TextField } from '@/components';
import {
  useReceptionCheckIn,
  type BarcodeCheckInResult,
  BarcodeCheckInMultipleMatchesError,
  BarcodeCheckInNotFoundError,
} from '@/features/reception/hooks/useReceptionCheckIn';
import type { PatientSummary } from '@/features/patients/types/patient';

const Container = styled.div`
  display: grid;
  gap: 12px;
`;

const FeedbackMessage = styled.p<{ tone: 'success' | 'danger' | 'warning' }>`
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
    return theme.palette.warning;
  }};
`;

interface BarcodeCheckInPanelProps {
  onSuccess?: (result: BarcodeCheckInResult) => void;
  onMultipleMatches?: (payload: { patientId: string; candidates: PatientSummary[] }) => void;
  onNotFound?: (patientId: string) => void;
  onUnhandledError?: (error: Error) => void;
  registrationDefaults: {
    departmentCode?: string;
    departmentName?: string;
    doctorId?: string;
    doctorName?: string;
    insuranceUid?: string;
  };
}

export const BarcodeCheckInPanel = ({
  onSuccess,
  onMultipleMatches,
  onNotFound,
  onUnhandledError,
  registrationDefaults,
}: BarcodeCheckInPanelProps) => {
  const [barcode, setBarcode] = useState('');
  const [memo, setMemo] = useState('');
  const [feedback, setFeedback] = useState<
    { tone: 'success' | 'danger' | 'warning'; message: string } | null
  >(null);
  const checkInMutation = useReceptionCheckIn();

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
        departmentCode: registrationDefaults.departmentCode,
        departmentName: registrationDefaults.departmentName,
        doctorId: registrationDefaults.doctorId,
        doctorName: registrationDefaults.doctorName,
        insuranceUid: registrationDefaults.insuranceUid,
      });
      setFeedback({
        tone: 'success',
        message: `患者ID ${result.patientId} (${result.patient.fullName}) を受付登録しました。`,
      });
      onSuccess?.(result);
      resetForm();
    } catch (error) {
      if (error instanceof BarcodeCheckInMultipleMatchesError) {
        setFeedback({
          tone: 'warning',
          message: `患者ID ${error.patientId} に該当する患者が複数見つかりました。検索結果から選択してください。`,
        });
        onMultipleMatches?.({ patientId: error.patientId, candidates: error.matches });
        return;
      }

      if (error instanceof BarcodeCheckInNotFoundError) {
        setFeedback({
          tone: 'danger',
          message: `患者ID ${error.patientId} の患者が見つかりませんでした。手動検索で確認してください。`,
        });
        onNotFound?.(error.patientId);
        return;
      }

      const fallback = error instanceof Error ? error : new Error('受付登録に失敗しました。');
      setFeedback({ tone: 'danger', message: fallback.message });
      onUnhandledError?.(fallback);
    }
  };

  return (
    <Container>
      <Stack gap={12}>
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
            <div>
              <Button type="submit" variant="primary" isLoading={checkInMutation.isPending}>
                受付に追加
              </Button>
            </div>
            {feedback ? <FeedbackMessage tone={feedback.tone}>{feedback.message}</FeedbackMessage> : null}
          </Stack>
        </form>
      </Stack>
    </Container>
  );
};
