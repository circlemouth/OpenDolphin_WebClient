import { useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard, TextField } from '@/components';
import {
  buildNewDiagnosis,
  useDiagnosisBuckets,
  useDiagnosisMutations,
} from '@/features/charts/hooks/useDiagnoses';
import { canResolveDiagnosis, diagnosisStatusTone, formatDiagnosisDate } from '@/features/charts/components/diagnosis-utils';
import type { RegisteredDiagnosis } from '@/features/charts/types/diagnosis';
import { formatRestDate } from '@/features/patients/utils/rest-date';

type DiagnosisPanelProps = {
  karteId: number | null;
  fromDate: string;
  userModelId: number | null;
  departmentCode?: string | null;
  departmentName?: string | null;
  relatedInsurance?: string | null;
};

const PanelCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h3 {
    margin: 0;
    font-size: 1.05rem;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.85rem;
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`;

const ListHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 80px;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.textMuted};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const DiagnosisRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 80px;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid ${({ theme }) => theme.palette.border};
  align-items: center;

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }
`;

const ActionsCell = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const FeedbackBox = styled.div<{ $tone: 'info' | 'danger' }>`
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.primary : theme.palette.danger ?? '#b91c1c')};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $tone }) =>
    $tone === 'info' ? theme.palette.surfaceMuted : theme.palette.dangerMuted ?? '#fee2e2'};
  color: ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.text : theme.palette.danger ?? '#7f1d1d')};
  padding: 10px 12px;
  font-size: 0.85rem;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const InlineToggle = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
`;

export const DiagnosisPanel = ({
  karteId,
  fromDate,
  userModelId,
  departmentCode,
  departmentName,
  relatedInsurance,
}: DiagnosisPanelProps) => {
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');

  const diagnosisBuckets = useDiagnosisBuckets({
    karteId,
    fromDate,
    enabled: Boolean(karteId),
  });

  const { createMutation, updateMutation, deleteMutation } = useDiagnosisMutations(karteId, fromDate);

  const activeDiagnoses = diagnosisBuckets.activeDiagnoses;
  const pastDiagnoses = diagnosisBuckets.pastDiagnoses;
  const displayedDiagnoses = useMemo(
    () => (showInactive ? [...activeDiagnoses, ...pastDiagnoses] : activeDiagnoses),
    [activeDiagnoses, pastDiagnoses, showInactive],
  );

  const handleResolve = async (diagnosis: RegisteredDiagnosis) => {
    if (!diagnosis.id) {
      return;
    }
    const now = new Date();
    await updateMutation.mutateAsync([
      {
        ...diagnosis,
        status: 'D',
        ended: diagnosis.ended ?? formatRestDate(now),
      },
    ]);
  };

  const handleDelete = async (diagnosis: RegisteredDiagnosis) => {
    if (!diagnosis.id) {
      return;
    }
    if (!window.confirm('選択した病名を削除しますか？')) {
      return;
    }
    await deleteMutation.mutateAsync([diagnosis.id]);
  };

  const handleSubmit = async () => {
    if (!karteId || !userModelId) {
      setFormError('カルテ情報またはユーザー情報が不足しています。');
      return;
    }
    if (!nameInput.trim()) {
      setFormError('病名を入力してください。');
      return;
    }
    setFormError(null);
    const payload = buildNewDiagnosis({
      karteId,
      userModelId,
      diagnosis: nameInput.trim(),
      diagnosisCode: codeInput.trim() || undefined,
      diagnosisCodeSystem: 'ICD10',
      department: departmentCode ?? undefined,
      departmentDesc: departmentName ?? undefined,
      relatedHealthInsurance: relatedInsurance ?? undefined,
    });
    try {
      await createMutation.mutateAsync([payload]);
      setNameInput('');
      setCodeInput('');
      setFormOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '登録に失敗しました。';
      setFormError(message);
    }
  };

  return (
    <PanelCard>
      <PanelHeader>
        <h3>病名管理</h3>
        <p>カルテに紐づく病名を一覧し、登録や完了処理を行えます。</p>
      </PanelHeader>
      <ToggleRow>
        <InlineToggle>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => setShowInactive(event.currentTarget.checked)}
          />
          <span>完了済みも表示</span>
        </InlineToggle>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => diagnosisBuckets.refetch()}
          isLoading={diagnosisBuckets.isFetching}
        >
          再読込
        </Button>
        <Button type="button" size="sm" onClick={() => setFormOpen((prev) => !prev)}>
          {formOpen ? '登録フォームを閉じる' : '新しい病名を登録'}
        </Button>
      </ToggleRow>

      {formOpen ? (
        <SurfaceCard tone="muted">
          <FormGrid>
            <TextField
              label="病名"
              value={nameInput}
              onChange={(event) => setNameInput(event.currentTarget.value)}
              placeholder="例: 高血圧症"
            />
            <TextField
              label="病名コード"
              value={codeInput}
              onChange={(event) => setCodeInput(event.currentTarget.value)}
              placeholder="例: I10"
            />
          </FormGrid>
          {formError ? <FeedbackBox $tone="danger">{formError}</FeedbackBox> : null}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFormOpen(false);
                setFormError(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              isLoading={createMutation.isPending}
              disabled={!nameInput.trim()}
            >
              登録
            </Button>
          </div>
        </SurfaceCard>
      ) : null}

      {diagnosisBuckets.isLoading ? (
        <FeedbackBox $tone="info">病名一覧を読み込んでいます…</FeedbackBox>
      ) : diagnosisBuckets.error ? (
        <FeedbackBox $tone="danger">病名一覧の取得に失敗しました。</FeedbackBox>
      ) : displayedDiagnoses.length === 0 ? (
        <FeedbackBox $tone="info">病名の登録はありません。</FeedbackBox>
      ) : (
        <ListContainer>
          <ListHeader>
            <span>病名</span>
            <span>コード</span>
            <span>開始日</span>
            <span>操作</span>
          </ListHeader>
          {displayedDiagnoses.map((diagnosis) => (
            <DiagnosisRow key={diagnosis.id ?? diagnosis.diagnosis ?? Math.random()}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong>{diagnosis.diagnosis ?? '不明な病名'}</strong>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {diagnosis.diagnosisCode ?? 'コード未設定'}
                </span>
              </div>
              <div>
                <StatusBadge tone={diagnosisStatusTone(diagnosis.status)}>
                  {diagnosis.status ?? 'F'}
                </StatusBadge>
              </div>
              <div style={{ fontSize: '0.85rem' }}>{formatDiagnosisDate(diagnosis.firstEncounterDate)}</div>
              <ActionsCell>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!canResolveDiagnosis(diagnosis) || updateMutation.isPending}
                  onClick={() => handleResolve(diagnosis)}
                >
                  終了
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={deleteMutation.isPending}
                  onClick={() => handleDelete(diagnosis)}
                >
                  削除
                </Button>
              </ActionsCell>
            </DiagnosisRow>
          ))}
        </ListContainer>
      )}
    </PanelCard>
  );
};
