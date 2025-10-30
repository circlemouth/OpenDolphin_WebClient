import styled from '@emotion/styled';

import { Button, SelectField, SurfaceCard, Stack, StatusBadge } from '@/components';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';

interface VisitManagementDialogProps {
  visit: PatientVisitSummary;
  stateValue: number;
  onChangeState: (nextState: number) => void;
  onSubmitState: () => void;
  onDelete: () => void;
  onClose: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
  errorMessage?: string | null;
}

const DialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
`;

const DialogShell = styled(SurfaceCard)`
  max-width: 520px;
  width: 100%;
  display: grid;
  gap: 16px;
`;

const DialogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 1.1rem;
  }
`;

const DangerNotice = styled.div`
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.palette.dangerSubtle};
  color: ${({ theme }) => theme.palette.danger};
  font-size: 0.9rem;
`;

const options = [
  { value: 0, label: '待機中 (0)' },
  { value: 1, label: '呼出済み (1)' },
];

export const VisitManagementDialog = ({
  visit,
  stateValue,
  onChangeState,
  onSubmitState,
  onDelete,
  onClose,
  isUpdating,
  isDeleting,
  errorMessage,
}: VisitManagementDialogProps) => {
  const stateOptions = options.some((option) => option.value === visit.state)
    ? options
    : [...options, { value: visit.state, label: `現在の状態 (${visit.state})` }];

  return (
    <DialogOverlay role="dialog" aria-modal aria-label="受付詳細操作" onClick={onClose}>
      <DialogShell tone="muted" padding="lg" onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <div>
            <h2>{visit.fullName} の受付操作</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>患者ID: {visit.patientId}</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            閉じる
          </Button>
        </DialogHeader>

        <Stack gap={8}>
          <SelectField
            label="受付状態"
            value={String(stateValue)}
            onChange={(event) => onChangeState(Number.parseInt(event.currentTarget.value, 10))}
            disabled={isUpdating || isDeleting}
            description="診察開始前に呼出済みへ更新すると診察室モニターへ即時反映されます"
          >
            {stateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <Button type="button" variant="primary" onClick={onSubmitState} disabled={isUpdating || isDeleting} isLoading={isUpdating}>
            状態を更新
          </Button>
          {visit.ownerUuid ? <StatusBadge tone="info">他端末で編集中: {visit.ownerUuid}</StatusBadge> : null}
        </Stack>

        <DangerNotice>
          受付取消はロングポーリング配信後に復元できません。既に診療が始まっている場合は状態変更のみ実施してください。
        </DangerNotice>

        <Stack gap={8}>
          <Button type="button" variant="danger" onClick={onDelete} disabled={isUpdating || isDeleting} isLoading={isDeleting}>
            受付を取消する
          </Button>
        </Stack>

        {errorMessage ? (
          <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </DialogShell>
    </DialogOverlay>
  );
};
