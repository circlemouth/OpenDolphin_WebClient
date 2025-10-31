import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

import { Button, SelectField, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import { useSidebar } from '@/app/layout/SidebarContext';
import { patientVisitsQueryKey, usePatientVisits } from '@/features/charts/hooks/usePatientVisits';
import { hasOpenBit } from '@/features/charts/utils/visit-state';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { useAuth } from '@/libs/auth';
import { useReceptionCallMutation, useReceptionMemoMutation } from '@/features/reception/hooks/useReceptionActions';
import { AppointmentManager } from '@/features/reception/components/AppointmentManager';
import { BarcodeCheckInPanel } from '@/features/reception/components/BarcodeCheckInPanel';
import { ColumnConfigurator } from '@/features/reception/components/ColumnConfigurator';
import { ReceptionVisitSidebar } from '@/features/reception/components/ReceptionVisitSidebar';
import { VisitManagementDialog } from '@/features/reception/components/VisitManagementDialog';
import { useTemporaryDocuments } from '@/features/reception/hooks/useTemporaryDocuments';
import {
  useReceptionPreferences,
  type ReceptionColumnKey,
  type ReceptionViewMode,
} from '@/features/reception/hooks/useReceptionPreferences';
import {
  deleteVisit,
  fetchLegacyVisits,
  registerLegacyVisit,
  updateLegacyVisitMemo,
  updateVisitState,
  type LegacyVisitSearchParams,
} from '@/features/reception/api/visit-api';

type QueueStatus = 'waiting' | 'calling' | 'inProgress';
type StatusFilter = 'all' | QueueStatus;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h1 {
    margin: 0;
    font-size: 1.4rem;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
`;

const SummaryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const SummaryCard = styled(SurfaceCard)`
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }

  strong {
    font-size: 1.5rem;
  }
`;

const QueueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
`;

const VisitCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const PatientName = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const MetaList = styled.div`
  display: grid;
  gap: 4px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MemoEditor = styled.div`
  display: grid;
  gap: 12px;
`;

const ErrorText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.danger};
`;

const EmptyState = styled(SurfaceCard)`
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
`;

const ConfiguratorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TableWrapper = styled(SurfaceCard)`
  padding: 0;
  overflow-x: auto;
`;

const VisitTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
`;

const TableHeadCell = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.textMuted};
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
`;

const TableDataCell = styled.td`
  padding: 12px 16px;
  vertical-align: top;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
`;

const TableActionCell = styled(TableDataCell)`
  min-width: 220px;
`;

const columnHeaders: Record<ReceptionColumnKey, string> = {
  status: 'ステータス',
  patientId: '患者ID',
  kanaName: 'ふりがな',
  visitDate: '来院日時',
  memo: '受付メモ',
  safetyNotes: '安全メモ',
  insurance: '保険情報',
  doctor: '担当医',
  owner: '編集中端末',
};

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'waiting', label: '待機中' },
  { value: 'calling', label: '呼出済み' },
  { value: 'inProgress', label: '診察中' },
];

const classifyVisit = (visit: PatientVisitSummary): QueueStatus => {
  if (visit.ownerUuid) {
    return 'inProgress';
  }
  if (hasOpenBit(visit.state)) {
    return 'calling';
  }
  return 'waiting';
};

const extractErrorMessage = (error: unknown) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '操作に失敗しました。時間をおいて再度お試しください。';
};

export const ReceptionPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const clientUuid = session?.credentials.clientUuid;
  const visitsQuery = usePatientVisits();
  const { preferences, setViewMode, setVisibleColumns } = useReceptionPreferences();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const receptionCallMutation = useReceptionCallMutation();
  const receptionMemoMutation = useReceptionMemoMutation();
  const [statePendingVisitId, setStatePendingVisitId] = useState<number | null>(null);
  const [memoPendingVisitId, setMemoPendingVisitId] = useState<number | null>(null);
  const [editingMemoVisitId, setEditingMemoVisitId] = useState<number | null>(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [stateError, setStateError] = useState<{ visitId: number; message: string } | null>(null);
  const [memoError, setMemoError] = useState<{ visitId: number; message: string } | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<PatientVisitSummary | null>(null);
  const [isAppointmentSaving, setIsAppointmentSaving] = useState(false);
  const [showColumnConfigurator, setShowColumnConfigurator] = useState(false);
  const queryClient = useQueryClient();
  const { setSidebar, clearSidebar } = useSidebar();
  const temporaryDocumentsQuery = useTemporaryDocuments();

  const visits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);
  const temporaryDocumentPatientIds = useMemo(
    () => new Set((temporaryDocumentsQuery.data ?? []).map((entry) => entry.patientId)),
    [temporaryDocumentsQuery.data],
  );
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [manageTargetId, setManageTargetId] = useState<number | null>(null);
  const [desiredState, setDesiredState] = useState(0);
  const [manageError, setManageError] = useState<string | null>(null);

  const selectedVisit = useMemo(
    () => visits.find((visit) => visit.visitId === selectedVisitId) ?? null,
    [visits, selectedVisitId],
  );
  const manageTarget = useMemo(
    () => visits.find((visit) => visit.visitId === manageTargetId) ?? null,
    [visits, manageTargetId],
  );

  useEffect(() => {
    if (manageTarget) {
      setDesiredState(manageTarget.state ?? 0);
    }
  }, [manageTarget]);

  const visibleColumns = useMemo(() => preferences.visibleColumns, [preferences.visibleColumns]);
  const isColumnVisible = useCallback(
    (key: ReceptionColumnKey) => visibleColumns.includes(key),
    [visibleColumns],
  );

  useEffect(() => {
    if (!scheduleTarget) {
      return;
    }
    const exists = visits.some((visit) => visit.visitId === scheduleTarget.visitId);
    if (!exists) {
      setScheduleTarget(null);
      setIsAppointmentSaving(false);
    }
  }, [scheduleTarget, visits]);

  const handleOpenChart = useCallback(
    (visitId: number) => {
      navigate(`/charts/${visitId}`);
    },
    [navigate],
  );

  const handleOpenManage = useCallback(
    (visit: PatientVisitSummary) => {
      setManageError(null);
      setManageTargetId(visit.visitId);
      setDesiredState(visit.state ?? 0);
    },
    [],
  );

  useEffect(() => {
    if (!selectedVisit) {
      clearSidebar();
      return;
    }
    setSidebar(
      <ReceptionVisitSidebar
        visit={selectedVisit}
        onClose={() => setSelectedVisitId(null)}
        onManage={() => handleOpenManage(selectedVisit)}
        onOpenChart={() => handleOpenChart(selectedVisit.visitId)}
        hasTemporaryDocument={temporaryDocumentPatientIds.has(selectedVisit.patientId)}
      />,
    );
    return () => {
      clearSidebar();
    };
  }, [
    selectedVisit,
    clearSidebar,
    setSidebar,
    handleOpenManage,
    handleOpenChart,
    temporaryDocumentPatientIds,
  ]);

  const handleCloseAppointmentManager = () => {
    setIsAppointmentSaving(false);
    setScheduleTarget(null);
  };

  const summary = useMemo(() => {
    const base = { waiting: 0, calling: 0, inProgress: 0 } as Record<QueueStatus, number>;
    visits.forEach((visit) => {
      const status = classifyVisit(visit);
      base[status] += 1;
    });
    return base;
  }, [visits]);

  const filteredVisits = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return visits.filter((visit) => {
      if (statusFilter !== 'all' && classifyVisit(visit) !== statusFilter) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }
      const target = [visit.fullName, visit.patientId, visit.kanaName, visit.memo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return target.includes(normalizedKeyword);
    });
  }, [keyword, statusFilter, visits]);

  const scheduleKarteId = scheduleTarget?.patientPk ?? null;

  const handleToggleCall = async (visit: PatientVisitSummary) => {
    if (visit.ownerUuid) {
      return;
    }
    setStateError(null);
    setStatePendingVisitId(visit.visitId);
    try {
      await receptionCallMutation.mutateAsync({
        visit,
        shouldCall: !hasOpenBit(visit.state),
      });
    } catch (error) {
      setStateError({ visitId: visit.visitId, message: extractErrorMessage(error) });
    } finally {
      setStatePendingVisitId(null);
    }
  };

  const handleStartMemoEdit = (visit: PatientVisitSummary) => {
    setMemoError(null);
    setEditingMemoVisitId(visit.visitId);
    setMemoDraft(visit.memo ?? '');
  };

  const handleCancelMemoEdit = () => {
    setEditingMemoVisitId(null);
    setMemoDraft('');
  };

  const handleSaveMemo = async (visit: PatientVisitSummary) => {
    setMemoError(null);
    setMemoPendingVisitId(visit.visitId);
    try {
      await receptionMemoMutation.mutateAsync({ visit, memo: memoDraft });
      setEditingMemoVisitId(null);
      setMemoDraft('');
    } catch (error) {
      setMemoError({ visitId: visit.visitId, message: extractErrorMessage(error) });
    } finally {
      setMemoPendingVisitId(null);
    }
  };

  const renderStatusBadge = (visit: PatientVisitSummary) => {
    const status = classifyVisit(visit);
    if (status === 'inProgress') {
      return <StatusBadge tone="info">診察中</StatusBadge>;
    }
    if (status === 'calling') {
      return <StatusBadge tone="warning">呼出済み</StatusBadge>;
    }
    return <StatusBadge tone="neutral">待機中</StatusBadge>;
  };

  const visitStateMutation = useMutation({
    mutationFn: async ({ visitId, nextState }: { visitId: number; nextState: number }) => {
      await updateVisitState(visitId, nextState);
      return { visitId, nextState };
    },
    onSuccess: ({ visitId, nextState }) => {
      queryClient.setQueryData<PatientVisitSummary[] | undefined>(patientVisitsQueryKey, (current) => {
        if (!current) {
          return current;
        }
        return current.map((visit) =>
          visit.visitId === visitId
            ? {
                ...visit,
                state: nextState,
                raw: {
                  ...visit.raw,
                  state: nextState,
                },
              }
            : visit,
        );
      });
      setManageTargetId(null);
      setManageError(null);
    },
    onError: (error) => {
      setManageError(extractErrorMessage(error));
    },
  });

  const visitDeleteMutation = useMutation({
    mutationFn: async (visitId: number) => {
      await deleteVisit(visitId);
      return visitId;
    },
    onSuccess: (visitId) => {
      queryClient.setQueryData<PatientVisitSummary[] | undefined>(patientVisitsQueryKey, (current) =>
        current ? current.filter((visit) => visit.visitId !== visitId) : current,
      );
      setManageTargetId(null);
      setManageError(null);
      setSelectedVisitId((current) => (current === visitId ? null : current));
    },
    onError: (error) => {
      setManageError(extractErrorMessage(error));
    },
  });

  const legacyMemoMutation = useMutation({
    mutationFn: async ({ visitId, memo }: { visitId: number; memo: string }) => {
      await updateLegacyVisitMemo(visitId, memo);
      return { visitId, memo };
    },
    onSuccess: ({ visitId, memo }) => {
      queryClient.setQueryData<PatientVisitSummary[] | undefined>(patientVisitsQueryKey, (current) => {
        if (!current) {
          return current;
        }
        return current.map((visit) =>
          visit.visitId === visitId
            ? {
                ...visit,
                memo,
                raw: {
                  ...visit.raw,
                  memo,
                  patientModel: visit.raw.patientModel
                    ? {
                        ...visit.raw.patientModel,
                        memo,
                      }
                    : visit.raw.patientModel,
                },
              }
            : visit,
        );
      });
    },
  });

  const legacyRegisterMutation = useMutation({
    mutationFn: async (visit: PatientVisitSummary['raw']) => {
      await registerLegacyVisit(visit);
      return visit.id ?? null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: patientVisitsQueryKey });
    },
  });

  const handleSubmitStateUpdate = async () => {
    if (!manageTarget) {
      return;
    }
    setManageError(null);
    try {
      await visitStateMutation.mutateAsync({ visitId: manageTarget.visitId, nextState: desiredState });
    } catch {
      // already handled in onError
    }
  };

  const handleDeleteVisit = async () => {
    if (!manageTarget) {
      return;
    }
    setManageError(null);
    try {
      await visitDeleteMutation.mutateAsync(manageTarget.visitId);
    } catch {
      // already handled
    }
  };

  const handleCloseManageDialog = () => {
    if (visitStateMutation.isPending || visitDeleteMutation.isPending || legacyMemoMutation.isPending || legacyRegisterMutation.isPending) {
      return;
    }
    setManageTargetId(null);
    setManageError(null);
  };

  const isManageProcessing =
    visitStateMutation.isPending ||
    visitDeleteMutation.isPending ||
    legacyMemoMutation.isPending ||
    legacyRegisterMutation.isPending;

  const handleLegacyMemoSubmit = async (memo: string) => {
    if (!manageTarget) {
      throw new Error('受付情報が見つかりません。');
    }
    try {
      await legacyMemoMutation.mutateAsync({ visitId: manageTarget.visitId, memo });
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  };

  const handleLegacyFetchVisits = async (params: LegacyVisitSearchParams) => {
    try {
      return await fetchLegacyVisits(params);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  };

  const handleLegacyReRegister = async () => {
    if (!manageTarget) {
      throw new Error('受付情報が見つかりません。');
    }
    try {
      await legacyRegisterMutation.mutateAsync(manageTarget.raw);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  };

  return (
    <PageContainer>
      <HeaderBar>
        <TitleBlock>
          <h1>受付患者一覧</h1>
          <p>受付状況を確認し、カルテ画面へ素早く遷移できます。</p>
        </TitleBlock>
        <Controls>
          <TextField
            label="検索"
            placeholder="氏名・患者ID・メモで絞り込み"
            value={keyword}
            onChange={(event) => setKeyword(event.currentTarget.value)}
          />
          <SelectField
            label="ステータス"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value as StatusFilter)}
            options={statusFilterOptions}
          />
          <SelectField
            label="表示形式"
            value={preferences.viewMode}
            onChange={(event) => setViewMode(event.currentTarget.value as ReceptionViewMode)}
            options={[
              { value: 'card', label: 'カード表示' },
              { value: 'table', label: '表形式' },
            ]}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowColumnConfigurator((prev) => !prev)}
          >
            {showColumnConfigurator ? '列設定を閉じる' : '表示列を設定'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              void visitsQuery.refetch();
            }}
            disabled={visitsQuery.isFetching}
          >
            {visitsQuery.isFetching ? '更新中…' : '受付情報を再取得'}
          </Button>
        </Controls>
      </HeaderBar>

      <SummaryRow>
        <SummaryCard tone="muted">
          <span>待機中</span>
          <strong>{summary.waiting}</strong>
        </SummaryCard>
        <SummaryCard tone="muted">
          <span>呼出済み</span>
          <strong>{summary.calling}</strong>
        </SummaryCard>
        <SummaryCard tone="muted">
          <span>診察中</span>
          <strong>{summary.inProgress}</strong>
        </SummaryCard>
      </SummaryRow>

      <ConfiguratorContainer>
        <BarcodeCheckInPanel />
        {showColumnConfigurator ? (
          <ColumnConfigurator
            selected={visibleColumns}
            onChange={(columns) => setVisibleColumns(columns)}
            onClose={() => setShowColumnConfigurator(false)}
          />
        ) : null}
      </ConfiguratorContainer>

      {visitsQuery.isPending ? (
        <EmptyState tone="muted">
          <h2 style={{ margin: 0, fontSize: '1rem' }}>受付情報を読み込み中です…</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>スタッフが受付登録を完了すると自動で表示されます。</p>
        </EmptyState>
      ) : filteredVisits.length === 0 ? (
        <EmptyState tone="muted">
          <h2 style={{ margin: 0, fontSize: '1rem' }}>表示できる受付がありません</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            絞り込み条件を確認するか、最新情報への更新をお試しください。
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              void visitsQuery.refetch();
            }}
            disabled={visitsQuery.isFetching}
          >
            再取得する
          </Button>
        </EmptyState>
      ) : preferences.viewMode === 'table' ? (
        <TableWrapper tone="muted">
          <VisitTable>
            <thead>
              <tr>
                <TableHeadCell>氏名</TableHeadCell>
                {visibleColumns.map((column) => (
                  <TableHeadCell key={column}>{columnHeaders[column]}</TableHeadCell>
                ))}
                <TableHeadCell>操作</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.map((visit) => {
                const isOwnedByMe = clientUuid && visit.ownerUuid === clientUuid;
                const isOwnedByOther =
                  clientUuid && visit.ownerUuid && visit.ownerUuid !== clientUuid;
                const isCalling = hasOpenBit(visit.state);
                const canToggleCall = !visit.ownerUuid;
                const callButtonLabel = isCalling ? '呼出を解除' : '呼出する';
                const callButtonTitle = !canToggleCall
                  ? '診察中のため呼出状態を変更できません'
                  : undefined;
                const isStateUpdating =
                  statePendingVisitId === visit.visitId && receptionCallMutation.isPending;
                const isMemoEditing = editingMemoVisitId === visit.visitId;
                const isMemoUpdating =
                  memoPendingVisitId === visit.visitId && receptionMemoMutation.isPending;
                const stateErrorMessage =
                  stateError?.visitId === visit.visitId ? stateError.message : null;
                const memoErrorMessage =
                  memoError?.visitId === visit.visitId ? memoError.message : null;
                const firstInsurance = visit.raw.firstInsurance?.trim();
                const doctorInfo =
                  [visit.doctorName?.trim(), visit.doctorId?.trim()].filter(Boolean).join(' / ') ||
                  '---';

                const renderColumnContent = (column: ReceptionColumnKey) => {
                  switch (column) {
                    case 'status':
                      return (
                        <BadgeRow>
                          {renderStatusBadge(visit)}
                          {temporaryDocumentPatientIds.has(visit.patientId) ? (
                            <StatusBadge tone="danger">仮保存カルテあり</StatusBadge>
                          ) : null}
                        </BadgeRow>
                      );
                    case 'patientId':
                      return visit.patientId;
                    case 'kanaName':
                      return visit.kanaName ?? '---';
                    case 'visitDate':
                      return visit.visitDate ?? '---';
                    case 'memo':
                      if (isMemoEditing) {
                        return (
                          <MemoEditor>
                            <TextArea
                              label="受付メモ"
                              description="保存すると他端末にも即座に反映されます。"
                              placeholder="スタッフ間で共有したい注意事項を入力してください。"
                              value={memoDraft}
                              onChange={(event) => setMemoDraft(event.currentTarget.value)}
                              disabled={isMemoUpdating}
                            />
                            {memoErrorMessage ? (
                              <ErrorText role="alert">{memoErrorMessage}</ErrorText>
                            ) : null}
                            <ActionRow>
                              <Button
                                type="button"
                                variant="primary"
                                onClick={() => {
                                  void handleSaveMemo(visit);
                                }}
                                isLoading={isMemoUpdating}
                              >
                                保存する
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={handleCancelMemoEdit}
                                disabled={isMemoUpdating}
                              >
                                キャンセル
                              </Button>
                            </ActionRow>
                          </MemoEditor>
                        );
                      }
                      return visit.memo ?? '---';
                    case 'safetyNotes':
                      return visit.safetyNotes?.length ? (
                        <BadgeRow>
                          {visit.safetyNotes.map((note) => (
                            <StatusBadge key={note} tone="warning">
                              {note}
                            </StatusBadge>
                          ))}
                        </BadgeRow>
                      ) : (
                        '---'
                      );
                    case 'insurance':
                      return firstInsurance ?? '---';
                    case 'doctor':
                      return doctorInfo;
                    case 'owner':
                      if (isOwnedByMe) {
                        return <StatusBadge tone="success">自端末で編集中</StatusBadge>;
                      }
                      if (isOwnedByOther) {
                        return <StatusBadge tone="danger">他端末で編集中</StatusBadge>;
                      }
                      return '---';
                    default:
                      return null;
                  }
                };

                return (
                  <tr key={visit.visitId}>
                    <TableDataCell>
                      <div style={{ fontWeight: 600 }}>{visit.fullName}</div>
                    </TableDataCell>
                    {visibleColumns.map((column) => (
                      <TableDataCell key={column}>{renderColumnContent(column)}</TableDataCell>
                    ))}
                    <TableActionCell>
                      {stateErrorMessage ? <ErrorText role="alert">{stateErrorMessage}</ErrorText> : null}
                      {!isMemoEditing && memoErrorMessage ? (
                        <ErrorText role="alert">{memoErrorMessage}</ErrorText>
                      ) : null}
                      <ActionRow>
                        <Button
                          type="button"
                          variant={isCalling ? 'secondary' : 'primary'}
                          onClick={() => {
                            void handleToggleCall(visit);
                          }}
                          disabled={!canToggleCall || isStateUpdating}
                          isLoading={isStateUpdating}
                          title={callButtonTitle}
                        >
                          {callButtonLabel}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleStartMemoEdit(visit)}
                          disabled={isMemoUpdating || isMemoEditing}
                        >
                          受付メモを編集
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setScheduleTarget(visit)}
                          disabled={isMemoUpdating || isStateUpdating || isAppointmentSaving}
                        >
                          予約を管理
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => handleOpenChart(visit.visitId)}
                        >
                          カルテを開く
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setSelectedVisitId(visit.visitId)}
                        >
                          受付詳細
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleOpenManage(visit)}
                          disabled={isManageProcessing}
                        >
                          詳細操作
                        </Button>
                      </ActionRow>
                    </TableActionCell>
                  </tr>
                );
              })}
            </tbody>
          </VisitTable>
        </TableWrapper>
      ) : (
        <QueueGrid>
          {filteredVisits.map((visit) => {
            const statusBadge = isColumnVisible('status') ? renderStatusBadge(visit) : null;
            const isOwnedByMe = clientUuid && visit.ownerUuid === clientUuid;
            const isOwnedByOther = clientUuid && visit.ownerUuid && visit.ownerUuid !== clientUuid;
            const isCalling = hasOpenBit(visit.state);
            const canToggleCall = !visit.ownerUuid;
            const callButtonLabel = isCalling ? '呼出を解除' : '呼出する';
            const callButtonTitle = !canToggleCall
              ? '診察中のため呼出状態を変更できません'
              : undefined;
            const isStateUpdating =
              statePendingVisitId === visit.visitId && receptionCallMutation.isPending;
            const isMemoEditing = editingMemoVisitId === visit.visitId;
            const isMemoUpdating =
              memoPendingVisitId === visit.visitId && receptionMemoMutation.isPending;
            const stateErrorMessage =
              stateError?.visitId === visit.visitId ? stateError.message : null;
            const memoErrorMessage =
              memoError?.visitId === visit.visitId ? memoError.message : null;
            const firstInsurance = visit.raw.firstInsurance?.trim() ?? '---';
            const doctorInfo =
              [visit.doctorName?.trim(), visit.doctorId?.trim()].filter(Boolean).join(' / ') ||
              '---';
            const isTemporaryDocument = temporaryDocumentPatientIds.has(visit.patientId);

            const badges: JSX.Element[] = [];
            if (isTemporaryDocument) {
              badges.push(
                <StatusBadge key="document" tone="danger">
                  仮保存カルテあり
                </StatusBadge>,
              );
            }
            if (isColumnVisible('owner')) {
              if (isOwnedByMe) {
                badges.push(
                  <StatusBadge key="owner-self" tone="success">
                    自端末で編集中
                  </StatusBadge>,
                );
              }
              if (isOwnedByOther) {
                badges.push(
                  <StatusBadge key="owner-other" tone="danger">
                    他端末で編集中
                  </StatusBadge>,
                );
              }
            }
            if (isColumnVisible('safetyNotes') && !visit.ownerUuid && visit.safetyNotes?.length) {
              visit.safetyNotes.forEach((note) => {
                badges.push(
                  <StatusBadge key={`note-${note}`} tone="warning">
                    {note}
                  </StatusBadge>,
                );
              });
            }

            const metaItems: JSX.Element[] = [];
            if (isColumnVisible('patientId')) {
              metaItems.push(<span key="patientId">ID: {visit.patientId}</span>);
            }
            if (isColumnVisible('kanaName')) {
              metaItems.push(<span key="kanaName">かな: {visit.kanaName ?? '---'}</span>);
            }
            if (isColumnVisible('visitDate')) {
              metaItems.push(<span key="visitDate">来院: {visit.visitDate ?? '---'}</span>);
            }
            if (isColumnVisible('insurance')) {
              metaItems.push(<span key="insurance">保険: {firstInsurance}</span>);
            }
            if (isColumnVisible('doctor')) {
              metaItems.push(<span key="doctor">担当医: {doctorInfo}</span>);
            }
            if (isColumnVisible('memo')) {
              metaItems.push(<span key="memo">受付メモ: {visit.memo ?? '---'}</span>);
            }

            return (
              <VisitCard key={visit.visitId} tone="muted" padding="lg">
                <Stack gap={12}>
                  <CardHeader>
                    <div>
                      <PatientName>{visit.fullName}</PatientName>
                      {metaItems.length ? <MetaList>{metaItems}</MetaList> : null}
                    </div>
                    {statusBadge}
                  </CardHeader>
                  {badges.length ? <BadgeRow>{badges}</BadgeRow> : null}
                  {stateErrorMessage ? <ErrorText role="alert">{stateErrorMessage}</ErrorText> : null}
                  {memoErrorMessage && !isMemoEditing ? (
                    <ErrorText role="alert">{memoErrorMessage}</ErrorText>
                  ) : null}
                  {isMemoEditing ? (
                    <MemoEditor>
                      <TextArea
                        label="受付メモ"
                        description="保存すると他端末にも即座に反映されます。"
                        placeholder="スタッフ間で共有したい注意事項を入力してください。"
                        value={memoDraft}
                        onChange={(event) => setMemoDraft(event.currentTarget.value)}
                        disabled={isMemoUpdating}
                      />
                      {memoErrorMessage ? <ErrorText role="alert">{memoErrorMessage}</ErrorText> : null}
                      <ActionRow>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => {
                            void handleSaveMemo(visit);
                          }}
                          isLoading={isMemoUpdating}
                        >
                          保存する
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleCancelMemoEdit}
                          disabled={isMemoUpdating}
                        >
                          キャンセル
                        </Button>
                      </ActionRow>
                    </MemoEditor>
                  ) : null}
                  <ActionRow>
                    <Button
                      type="button"
                      variant={isCalling ? 'secondary' : 'primary'}
                      onClick={() => {
                        void handleToggleCall(visit);
                      }}
                      disabled={!canToggleCall || isStateUpdating}
                      isLoading={isStateUpdating}
                      title={callButtonTitle}
                    >
                      {callButtonLabel}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleStartMemoEdit(visit)}
                      disabled={isMemoUpdating || isMemoEditing}
                    >
                      受付メモを編集
                    </Button>
                  </ActionRow>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setScheduleTarget(visit)}
                    disabled={isMemoUpdating || isStateUpdating || isAppointmentSaving}
                  >
                    予約を管理
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleOpenChart(visit.visitId)}
                  >
                    カルテを開く
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setSelectedVisitId(visit.visitId)}
                  >
                    受付詳細
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleOpenManage(visit)}
                    disabled={isManageProcessing}
                  >
                    詳細操作
                  </Button>
                </Stack>
              </VisitCard>
            );
          })}
        </QueueGrid>
      )}
      {scheduleTarget && session ? (
        <AppointmentManager
          visit={scheduleTarget}
          karteId={scheduleKarteId}
          facilityId={session.credentials.facilityId}
          userId={session.credentials.userId}
          userModelId={session.userProfile?.userModelId}
          facilityName={session.userProfile?.facilityName}
          operatorName={
            session.userProfile?.displayName ??
            session.userProfile?.commonName ??
            session.credentials.userId
          }
          onClose={handleCloseAppointmentManager}
          onPendingChange={setIsAppointmentSaving}
        />
      ) : null}
      {manageTarget ? (
        <VisitManagementDialog
          visit={manageTarget}
          stateValue={desiredState}
          onChangeState={setDesiredState}
          onSubmitState={() => {
            void handleSubmitStateUpdate();
          }}
          onDelete={() => {
            void handleDeleteVisit();
          }}
          onClose={handleCloseManageDialog}
          isUpdating={visitStateMutation.isPending}
          isDeleting={visitDeleteMutation.isPending}
          errorMessage={manageError}
          onLegacyMemoSubmit={handleLegacyMemoSubmit}
          onLegacyFetchVisits={handleLegacyFetchVisits}
          onLegacyReRegister={handleLegacyReRegister}
        />
      ) : null}
    </PageContainer>
  );
};
