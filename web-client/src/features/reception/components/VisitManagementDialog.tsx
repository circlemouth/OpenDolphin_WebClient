import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import {
  Button,
  SelectField,
  SurfaceCard,
  Stack,
  StatusBadge,
  TextArea,
  TextField,
} from '@/components';
import type { SelectOption } from '@/components/SelectField';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { LegacyVisitSearchParams } from '@/features/reception/api/visit-api';

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
  onLegacyMemoSubmit: (memo: string) => Promise<void>;
  onLegacyFetchVisits: (params: LegacyVisitSearchParams) => Promise<PatientVisitSummary[]>;
  onLegacyReRegister: () => Promise<void>;
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

const baseVisitStateOptions: SelectOption[] = [
  { value: '0', label: '待機中 (0)' },
  { value: '1', label: '呼出済み (1)' },
];

const TabSwitcher = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 6px 12px;
  cursor: pointer;
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surfaceMuted)};
  color: ${({ theme, $active }) => ($active ? theme.palette.onPrimary : theme.palette.text)};
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: ${({ theme, $active }) => ($active ? theme.elevation.level1 : 'none')};
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.palette.primaryStrong : theme.palette.surfaceStrong};
  }
`;

const FeedbackMessage = styled.div<{ $tone: 'info' | 'danger' }>`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.85rem;
  background: ${({ theme, $tone }) =>
    $tone === 'info' ? theme.palette.surfaceMuted : theme.palette.dangerSubtle};
  color: ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.text : theme.palette.danger)};
`;

const LegacySection = styled.div`
  display: grid;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 14px;
`;

const LegacyFieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
`;

const LegacyTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th,
  td {
    padding: 6px 8px;
    border-bottom: 1px solid ${({ theme }) => theme.palette.border};
    text-align: left;
  }

  th {
    background: ${({ theme }) => theme.palette.surfaceMuted};
    font-weight: 600;
  }
`;

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
  onLegacyMemoSubmit,
  onLegacyFetchVisits,
  onLegacyReRegister,
}: VisitManagementDialogProps) => {
  const visitStateValue = String(visit.state);
  const stateOptions: SelectOption[] = baseVisitStateOptions.some(
    (option) => option.value === visitStateValue,
  )
    ? baseVisitStateOptions
    : [
        ...baseVisitStateOptions,
        { value: visitStateValue, label: `現在の状態 (${visitStateValue})` },
      ];
  const [activeTab, setActiveTab] = useState<'standard' | 'legacy'>('standard');
  const [legacyMemo, setLegacyMemo] = useState(visit.memo ?? '');
  const [legacyMemoStatus, setLegacyMemoStatus] =
    useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [legacyMemoMessage, setLegacyMemoMessage] = useState<string | null>(null);

  const defaultLegacyParams = useMemo(() => {
    const baseDate = visit.visitDate ? visit.visitDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
    return {
      visitDate: baseDate,
      appointmentFrom: baseDate,
      appointmentTo: baseDate,
      firstResult: '0',
      doctorId: visit.doctorId ?? '',
      unassignedDoctorId: '19999',
    };
  }, [visit.visitDate, visit.doctorId]);

  const [legacyParams, setLegacyParams] = useState(defaultLegacyParams);
  const [legacyResults, setLegacyResults] = useState<PatientVisitSummary[]>([]);
  const [legacyFetchState, setLegacyFetchState] =
    useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [legacyFetchError, setLegacyFetchError] = useState<string | null>(null);
  const [legacyReRegisterStatus, setLegacyReRegisterStatus] =
    useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [legacyReRegisterMessage, setLegacyReRegisterMessage] = useState<string | null>(null);

  useEffect(() => {
    setLegacyMemo(visit.memo ?? '');
    setLegacyMemoStatus('idle');
    setLegacyMemoMessage(null);
    setLegacyParams(defaultLegacyParams);
    setLegacyResults([]);
    setLegacyFetchState('idle');
    setLegacyFetchError(null);
    setLegacyReRegisterStatus('idle');
    setLegacyReRegisterMessage(null);
  }, [visit.visitId, visit.memo, defaultLegacyParams]);

  const handleLegacyMemoSave = async () => {
    setLegacyMemoStatus('loading');
    setLegacyMemoMessage(null);
    try {
      await onLegacyMemoSubmit(legacyMemo);
      setLegacyMemoStatus('success');
      setLegacyMemoMessage('旧APIで受付メモを更新しました。');
    } catch (error) {
      setLegacyMemoStatus('error');
      const message =
        error instanceof Error ? error.message : '受付メモの更新に失敗しました。';
      setLegacyMemoMessage(message);
    }
  };

  const handleLegacyFetch = async () => {
    setLegacyFetchState('loading');
    setLegacyFetchError(null);
    try {
      const params: LegacyVisitSearchParams = {
        visitDate: legacyParams.visitDate,
        appointmentFrom: legacyParams.appointmentFrom,
        appointmentTo: legacyParams.appointmentTo,
        firstResult: Number.parseInt(legacyParams.firstResult, 10) || 0,
        doctorId: legacyParams.doctorId || null,
        unassignedDoctorId: legacyParams.unassignedDoctorId || null,
      };
      const results = await onLegacyFetchVisits(params);
      setLegacyResults(results);
      setLegacyFetchState('success');
    } catch (error) {
      setLegacyFetchState('error');
      const message =
        error instanceof Error ? error.message : '受付一覧の取得に失敗しました。';
      setLegacyFetchError(message);
    }
  };

  const handleLegacyReRegister = async () => {
    setLegacyReRegisterStatus('loading');
    setLegacyReRegisterMessage(null);
    try {
      await onLegacyReRegister();
      setLegacyReRegisterStatus('success');
      setLegacyReRegisterMessage(
        '旧APIで再登録を受け付けました。受付一覧を再取得して状況を確認してください。',
      );
    } catch (error) {
      setLegacyReRegisterStatus('error');
      const message =
        error instanceof Error ? error.message : '旧APIでの受付登録に失敗しました。';
      setLegacyReRegisterMessage(message);
    }
  };

  const formatVisitDate = (value?: string) => {
    if (!value) {
      return '未取得';
    }
    return value.replace('T', ' ').replace('Z', '');
  };

  return (
    <DialogOverlay role="dialog" aria-modal="true" aria-label="受付詳細操作" onClick={onClose}>
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

        <TabSwitcher>
          <TabButton
            type="button"
            $active={activeTab === 'standard'}
            onClick={() => setActiveTab('standard')}
          >
            基本操作
          </TabButton>
          <TabButton type="button" $active={activeTab === 'legacy'} onClick={() => setActiveTab('legacy')}>
            旧API互換
          </TabButton>
        </TabSwitcher>

        {activeTab === 'standard' ? (
          <>
            <Stack gap={8}>
              <SelectField
                label="受付状態"
                value={String(stateValue)}
                onChange={(event) => onChangeState(Number.parseInt(event.currentTarget.value, 10))}
                disabled={isUpdating || isDeleting}
                description="診察開始前に呼出済みへ更新すると診察室モニターへ即時反映されます"
                options={stateOptions}
              />
              <Button
                type="button"
                variant="primary"
                onClick={onSubmitState}
                disabled={isUpdating || isDeleting}
                isLoading={isUpdating}
              >
                状態を更新
              </Button>
              {visit.ownerUuid ? (
                <StatusBadge tone="info">他端末で編集中: {visit.ownerUuid}</StatusBadge>
              ) : null}
            </Stack>

            <DangerNotice>
              受付取消はロングポーリング配信後に復元できません。既に診療が始まっている場合は状態変更のみ実施してください。
            </DangerNotice>

            <Stack gap={8}>
              <Button
                type="button"
                variant="danger"
                onClick={onDelete}
                disabled={isUpdating || isDeleting}
                isLoading={isDeleting}
              >
                受付を取消する
              </Button>
            </Stack>

            {errorMessage ? (
              <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }} role="alert">
                {errorMessage}
              </p>
            ) : null}
          </>
        ) : (
          <Stack gap={12}>
            <LegacySection>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>受付メモ更新 (PUT /pvt/memo)</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Swing クライアントと同じ旧 API を利用して受付メモを更新します。更新結果は即座にロングポーリングへ配信されます。
              </p>
              <TextArea
                label="受付メモ"
                rows={3}
                value={legacyMemo}
                onChange={(event) => {
                  setLegacyMemo(event.currentTarget.value);
                  setLegacyMemoStatus('idle');
                  setLegacyMemoMessage(null);
                }}
                disabled={legacyMemoStatus === 'loading'}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setLegacyMemo(visit.memo ?? '');
                    setLegacyMemoStatus('idle');
                    setLegacyMemoMessage(null);
                  }}
                  disabled={legacyMemoStatus === 'loading'}
                >
                  入力を元に戻す
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleLegacyMemoSave}
                  disabled={legacyMemoStatus === 'loading'}
                  isLoading={legacyMemoStatus === 'loading'}
                >
                  旧APIで保存する
                </Button>
              </div>
              {legacyMemoMessage ? (
                <FeedbackMessage
                  $tone={legacyMemoStatus === 'error' ? 'danger' : 'info'}
                  role={legacyMemoStatus === 'error' ? 'alert' : 'status'}
                >
                  {legacyMemoMessage}
                </FeedbackMessage>
              ) : null}
            </LegacySection>

            <LegacySection>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>受付一覧取得 (GET /pvt)</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Swing クライアントと同じパラメータで受付一覧を取得します。担当医未指定の場合は全件を検索します。
              </p>
              <LegacyFieldGrid>
                <TextField
                  label="受付日 (YYYY-MM-DD)"
                  value={legacyParams.visitDate}
                  onChange={(event) =>
                    setLegacyParams((prev) => ({
                      ...prev,
                      visitDate: event.currentTarget.value,
                    }))
                  }
                />
                <TextField
                  label="取得開始インデックス"
                  value={legacyParams.firstResult}
                  onChange={(event) =>
                    setLegacyParams((prev) => ({
                      ...prev,
                      firstResult: event.currentTarget.value,
                    }))
                  }
                />
                <TextField
                  label="担当医 ID (任意)"
                  value={legacyParams.doctorId}
                  onChange={(event) =>
                    setLegacyParams((prev) => ({
                      ...prev,
                      doctorId: event.currentTarget.value,
                    }))
                  }
                />
                <TextField
                  label="未割当 ID (任意)"
                  value={legacyParams.unassignedDoctorId}
                  onChange={(event) =>
                    setLegacyParams((prev) => ({
                      ...prev,
                      unassignedDoctorId: event.currentTarget.value,
                    }))
                  }
                />
                <TextField
                  label="予約検索 From"
                  value={legacyParams.appointmentFrom}
                  onChange={(event) =>
                    setLegacyParams((prev) => ({
                      ...prev,
                      appointmentFrom: event.currentTarget.value,
                    }))
                  }
                />
                <TextField
                  label="予約検索 To"
                  value={legacyParams.appointmentTo}
                  onChange={(event) =>
                    setLegacyParams((prev) => ({
                      ...prev,
                      appointmentTo: event.currentTarget.value,
                    }))
                  }
                />
              </LegacyFieldGrid>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setLegacyParams(defaultLegacyParams);
                    setLegacyResults([]);
                    setLegacyFetchState('idle');
                    setLegacyFetchError(null);
                  }}
                  disabled={legacyFetchState === 'loading'}
                >
                  条件をリセット
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleLegacyFetch}
                  disabled={legacyFetchState === 'loading'}
                  isLoading={legacyFetchState === 'loading'}
                >
                  旧APIで取得する
                </Button>
              </div>
              {legacyFetchError ? (
                <FeedbackMessage $tone="danger" role="alert">
                  {legacyFetchError}
                </FeedbackMessage>
              ) : null}
              {legacyResults.length > 0 ? (
                <LegacyTable>
                  <thead>
                    <tr>
                      <th>受付ID</th>
                      <th>患者ID</th>
                      <th>氏名</th>
                      <th>状態</th>
                      <th>受付日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {legacyResults.map((item) => (
                      <tr key={item.visitId}>
                        <td>{item.visitId}</td>
                        <td>{item.patientId}</td>
                        <td>{item.fullName}</td>
                        <td>{item.state}</td>
                        <td>{formatVisitDate(item.visitDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </LegacyTable>
              ) : legacyFetchState === 'success' ? (
                <FeedbackMessage $tone="info" role="status">
                  該当する受付は見つかりませんでした。
                </FeedbackMessage>
              ) : null}
            </LegacySection>

            <LegacySection>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>受付再登録 (POST /pvt)</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                現在の受付情報を旧 API に送信し直します。重複登録を避けるため、実行後は受付一覧の状況を確認してください。
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLegacyReRegister}
                  disabled={legacyReRegisterStatus === 'loading'}
                  isLoading={legacyReRegisterStatus === 'loading'}
                >
                  旧APIで再登録する
                </Button>
              </div>
              {legacyReRegisterMessage ? (
                <FeedbackMessage
                  $tone={legacyReRegisterStatus === 'error' ? 'danger' : 'info'}
                  role={legacyReRegisterStatus === 'error' ? 'alert' : 'status'}
                >
                  {legacyReRegisterMessage}
                </FeedbackMessage>
              ) : null}
            </LegacySection>
          </Stack>
        )}
      </DialogShell>
    </DialogOverlay>
  );
};

