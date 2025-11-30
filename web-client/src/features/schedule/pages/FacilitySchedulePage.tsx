import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button, SelectField, Stack, StatusBadge, SurfaceCard, TextField } from '@/components';
import {
  facilityScheduleQueryKey,
  useFacilitySchedule,
} from '@/features/schedule/hooks/useFacilitySchedule';
import type { FacilityScheduleEntry } from '@/features/schedule/api/facility-schedule-api';
import {
  createScheduleDocument,
  deleteScheduledVisit,
} from '@/features/schedule/api/schedule-document-api';
import { ScheduleReservationDialog } from '@/features/schedule/components/ScheduleReservationDialog';
import { useAuth } from '@/libs/auth';
import { recordOperationEvent, logChartsAction, logScheduleAction } from '@/libs/audit';
import { formatDataSourceTransition, getDataSourceStatus, type TooltipFields } from '@/libs/tooltipFields';
import { hasOpenBit } from '@/features/charts/utils/visit-state';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  h1 {
    margin: 0;
    font-size: 1.6rem;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const ControlsCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

const SummaryCard = styled(SurfaceCard)`
  display: grid;
  gap: 4px;

  span {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }

  strong {
    font-size: 1.8rem;
  }
`;

const ScheduleCard = styled(SurfaceCard)`
  display: grid;
  gap: 16px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const ScheduleTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 960px;
`;

const TableHeadCell = styled.th`
  text-align: left;
  padding: 12px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const TableRow = styled.tr<{ $status: ScheduleStatus }>`
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme, $status }) => {
    if ($status === 'inProgress') {
      return theme.palette.surfaceStrong;
    }
    if ($status === 'calling') {
      return theme.palette.surfaceMuted;
    }
    return theme.palette.surface;
  }};
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: 0.95rem;
  vertical-align: top;
`;

const EmptyState = styled.div`
  padding: 32px;
  text-align: center;
  color: ${({ theme }) => theme.palette.textMuted};
  border: 1px dashed ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const InlineMessage = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const NoticeMessage = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.success};
`;

type ScheduleStatus = 'scheduled' | 'calling' | 'inProgress';

const statusLabels: Record<ScheduleStatus, string> = {
  scheduled: '予約済み',
  calling: '呼出中',
  inProgress: '診察中',
};

const statusTones: Record<ScheduleStatus, 'neutral' | 'info' | 'warning'> = {
  scheduled: 'neutral',
  calling: 'info',
  inProgress: 'warning',
};

const SCHEDULE_EVIDENCE = 'docs/server-modernization/phase2/operations/logs/20251129T163000Z-schedule.md#facilityschedule';
const CHART_LINK_EVIDENCE =
  'docs/server-modernization/phase2/operations/logs/20251129T163000Z-schedule.md#facilityschedule-chart-link';

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const formatTime = (iso: string) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '---';
  }
  return parsed.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) {
    return '---';
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return '---';
  }
  return parsed.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const classifyStatus = (entry: FacilityScheduleEntry): ScheduleStatus => {
  if (entry.ownerUuid) {
    return 'inProgress';
  }
  if (hasOpenBit(entry.state)) {
    return 'calling';
  }
  return 'scheduled';
};

const getPatientDisplayName = (entry: FacilityScheduleEntry) => {
  if (entry.patientName) {
    return entry.patientName;
  }
  if (entry.patientId) {
    return `患者ID ${entry.patientId}`;
  }
  return '不明な患者';
};

const filterEntries = (
  entries: FacilityScheduleEntry[],
  doctor: string,
  status: ScheduleStatus | 'all',
  keyword: string,
) => {
  const lowered = keyword.trim().toLowerCase();
  return entries.filter((entry) => {
    if (doctor !== 'all') {
      const doctorName = entry.doctorName ?? '';
      if (!doctorName) {
        return false;
      }
      if (doctorName !== doctor) {
        return false;
      }
    }
    if (status !== 'all') {
      if (classifyStatus(entry) !== status) {
        return false;
      }
    }
    if (lowered) {
      const haystack = [
        entry.patientName,
        entry.patientId,
        entry.patientKana ?? '',
        entry.memo ?? '',
        entry.departmentName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(lowered)) {
        return false;
      }
    }
    return true;
  });
};

const buildDoctorOptions = (entries: FacilityScheduleEntry[]) => {
  const set = new Set<string>();
  entries.forEach((entry) => {
    if (entry.doctorName) {
      set.add(entry.doctorName);
    }
  });
  return ['all', ...Array.from(set)].map((value) => ({
    value,
    label: value === 'all' ? 'すべて' : value,
  }));
};

const buildStatusOptions = () => [
  { value: 'all', label: 'すべて' },
  { value: 'scheduled', label: statusLabels.scheduled },
  { value: 'calling', label: statusLabels.calling },
  { value: 'inProgress', label: statusLabels.inProgress },
];

const today = formatDateInput(new Date());

export const FacilitySchedulePage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const actorId = session?.credentials.userId ?? 'unknown';
  const facilityId = session?.credentials.facilityId ?? 'unknown';
  const actorRole = session?.userProfile?.roles?.join(', ') ?? 'unknown';
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ScheduleStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [assignedOnly, setAssignedOnly] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<FacilityScheduleEntry | null>(null);
  const [dialogFeedback, setDialogFeedback] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);

  const userModelId = session?.userProfile?.userModelId ?? null;
  const doctorOrcaId = session?.userProfile?.userId ?? null;

  const scheduleParams = useMemo(
    () => ({
      date: selectedDate,
      assignedOnly: assignedOnly && Boolean(doctorOrcaId),
      orcaDoctorId: assignedOnly && doctorOrcaId ? doctorOrcaId : undefined,
      unassignedDoctorId: assignedOnly && doctorOrcaId ? '18080' : undefined,
    }),
    [assignedOnly, doctorOrcaId, selectedDate],
  );

  const scheduleQueryKeyValue = useMemo(
    () => facilityScheduleQueryKey(scheduleParams),
    [scheduleParams],
  );

  const scheduleQuery = useFacilitySchedule(scheduleParams);
  const queryClient = useQueryClient();

  const entries = useMemo(
    () => scheduleQuery.data ?? [],
    [scheduleQuery.data],
  );

  const doctorOptions = useMemo(() => buildDoctorOptions(entries), [entries]);
  const statusOptions = useMemo(() => buildStatusOptions(), []);

  const filteredEntries = useMemo(
    () => filterEntries(entries, doctorFilter, statusFilter, keyword),
    [entries, doctorFilter, statusFilter, keyword],
  );

  const stats = useMemo(() => {
    const base = { total: entries.length, scheduled: 0, calling: 0, inProgress: 0 };
    entries.forEach((entry) => {
      const status = classifyStatus(entry);
      base[status] += 1;
    });
    return base;
  }, [entries]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('ja-JP'), []);
  const dataSourceStatus = useMemo(() => getDataSourceStatus(), []);
  const progressState = scheduleQuery.isPending ? 'initializing' : scheduleQuery.isFetching ? 'fetching' : 'synced';
  const {
    status: dataSourceLabel,
    runId,
    dataSourceTransition,
    cacheHit,
    missingMaster,
    fallbackUsed,
  } = dataSourceStatus;
  const scheduleTooltipFields = useMemo<TooltipFields>(
    () => ({
      progress: progressState,
      status: dataSourceLabel,
      runId,
      dataSourceTransition,
      cacheHit,
      missingMaster,
      fallbackUsed,
    }),
    [progressState, dataSourceLabel, runId, dataSourceTransition, cacheHit, missingMaster, fallbackUsed],
  );
  const dataSourceDisplayLabel =
    dataSourceLabel === 'server'
      ? '実API / Server'
      : dataSourceLabel === 'proxy'
      ? '開発 Proxy'
      : 'MSW 模擬データ';
  const dataSourceTone =
    dataSourceLabel === 'server'
      ? 'info'
      : dataSourceLabel === 'proxy'
      ? 'warning'
      : 'success';
  const transitionLabel = formatDataSourceTransition(dataSourceTransition);

  useEffect(() => {
    if (!pageNotice) {
      return;
    }
    const timer = setTimeout(() => {
      setPageNotice(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [pageNotice]);

  useEffect(() => {
    if (!selectedEntry) {
      return;
    }
    const stillExists = entries.some((entry) => entry.visitId === selectedEntry.visitId);
    if (!stillExists) {
      setSelectedEntry(null);
    }
  }, [entries, selectedEntry]);

  const resetDialogMessages = useCallback(() => {
    setDialogFeedback(null);
    setDialogError(null);
  }, []);

  const handleRefetch = useCallback(() => {
    recordOperationEvent(
      'schedule',
      'info',
      'facility_schedule_refetch',
      '施設スケジュールを再取得しました',
      {
        ...scheduleTooltipFields,
      },
    );
    void scheduleQuery.refetch();
  }, [scheduleQuery.refetch, scheduleTooltipFields]);

  const handleOpenReservation = useCallback(
    (entry: FacilityScheduleEntry) => {
      setSelectedEntry(entry);
      resetDialogMessages();
    },
    [resetDialogMessages],
  );

  const handleCloseReservation = useCallback(() => {
    setSelectedEntry(null);
    resetDialogMessages();
  }, [resetDialogMessages]);

  const handlePrevDay = () => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatDateInput(date));
  };

  const handleNextDay = () => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatDateInput(date));
  };

  const handleOpenChart = (entry: FacilityScheduleEntry) => {
    if (!entry.visitId) {
      return;
    }
    logChartsAction(
      'facility_schedule_chart_link',
      '施設スケジュールからカルテを開きました',
      {
        visitId: entry.visitId,
        patientId: entry.patientId,
        runId: scheduleTooltipFields.runId,
        facilityId,
        actorId,
        actorRole,
        evidencePath: CHART_LINK_EVIDENCE,
      },
    );
    navigate(`/charts/${entry.visitId}`);
  };

  type CreateDocumentArgs = {
    entry: FacilityScheduleEntry;
    sendClaim: boolean;
    scheduleDate: string;
  };

  const createDocumentMutation = useMutation<number, unknown, CreateDocumentArgs>({
    mutationFn: ({ entry, sendClaim, scheduleDate }) => {
      if (!userModelId) {
        return Promise.reject(new Error('担当医情報が取得できませんでした'));
      }
      return createScheduleDocument({
        visitId: entry.visitId,
        patientPk: entry.patientPk,
        scheduleDate,
        providerId: userModelId,
        sendClaim,
      });
    },
    onMutate: () => {
      setDialogError(null);
    },
    onSuccess: (count, { entry, sendClaim, scheduleDate }) => {
      const patientLabel = getPatientDisplayName(entry);
      setDialogFeedback('カルテ文書を生成しました。受付一覧を確認してください。');
      setPageNotice(`${patientLabel} の予約からカルテ文書を生成しました。`);
      logScheduleAction(
        'schedule_document_create',
        '予約連動カルテを生成しました',
        {
          visitId: entry.visitId,
          patientId: entry.patientId,
          scheduleDate,
          sendClaim,
          count,
          runId: scheduleTooltipFields.runId,
          actorId,
          actorRole,
          facilityId,
          evidencePath: SCHEDULE_EVIDENCE,
        },
      );
      recordOperationEvent(
        'reception',
        'info',
        'schedule_document_create',
        '予約連動カルテを生成しました',
        {
          visitId: entry.visitId,
          patientPk: entry.patientPk,
          scheduleDate,
          sendClaim,
          count,
        },
      );
      void queryClient.invalidateQueries({ queryKey: scheduleQueryKeyValue });
    },
    onError: (error, { entry, sendClaim, scheduleDate }) => {
      const message = error instanceof Error ? error.message : String(error);
      setDialogError(`カルテ文書の生成に失敗しました: ${message}`);
      logScheduleAction(
        'schedule_document_create',
        '予約連動カルテの生成に失敗しました',
        {
          visitId: entry.visitId,
          patientId: entry.patientId,
          scheduleDate,
          sendClaim,
          error: message,
          runId: scheduleTooltipFields.runId,
          actorId,
          actorRole,
          facilityId,
          evidencePath: SCHEDULE_EVIDENCE,
        },
        'warning',
      );
      recordOperationEvent(
        'reception',
        'warning',
        'schedule_document_create_failed',
        '予約連動カルテの生成に失敗しました',
        {
          visitId: entry.visitId,
          patientPk: entry.patientPk,
          scheduleDate,
          sendClaim,
          error: message,
        },
      );
    },
  });

  type DeleteReservationArgs = { entry: FacilityScheduleEntry; scheduleDate: string };

  const deleteReservationMutation = useMutation<void, unknown, DeleteReservationArgs>({
    mutationFn: ({ entry, scheduleDate }) =>
      deleteScheduledVisit({ visitId: entry.visitId, patientPk: entry.patientPk, scheduleDate }),
    onMutate: () => {
      setDialogError(null);
    },
    onSuccess: (_, { entry, scheduleDate }) => {
      const patientLabel = getPatientDisplayName(entry);
      setPageNotice(`${patientLabel} の予約を削除しました。`);
      logScheduleAction(
        'schedule_reservation_delete',
        '施設スケジュールから予約を削除しました',
        {
          visitId: entry.visitId,
          patientId: entry.patientId,
          scheduleDate,
          actionType: 'danger-delete',
          runId: scheduleTooltipFields.runId,
          actorId,
          actorRole,
          facilityId,
          evidencePath: SCHEDULE_EVIDENCE,
        },
        'warning',
      );
      recordOperationEvent(
        'reception',
        'info',
        'schedule_reservation_delete',
        '施設スケジュールから予約を削除しました',
        {
          visitId: entry.visitId,
          patientPk: entry.patientPk,
          scheduleDate,
        },
      );
      handleCloseReservation();
      void queryClient.invalidateQueries({ queryKey: scheduleQueryKeyValue });
    },
    onError: (error, { entry, scheduleDate }) => {
      const message = error instanceof Error ? error.message : String(error);
      setDialogError(`予約の削除に失敗しました: ${message}`);
      logScheduleAction(
        'schedule_reservation_delete_failed',
        '施設スケジュールの予約削除に失敗しました',
        {
          visitId: entry.visitId,
          patientId: entry.patientId,
          scheduleDate,
          actionType: 'danger-delete',
          error: message,
          runId: scheduleTooltipFields.runId,
          actorId,
          actorRole,
          facilityId,
          evidencePath: SCHEDULE_EVIDENCE,
        },
        'warning',
      );
      recordOperationEvent(
        'reception',
        'warning',
        'schedule_reservation_delete_failed',
        '施設スケジュールの予約削除に失敗しました',
        {
          visitId: entry.visitId,
          patientPk: entry.patientPk,
          scheduleDate,
          error: message,
        },
      );
    },
  });

  const handleCreateDocument = useCallback(
    (sendClaim: boolean) => {
      if (!selectedEntry) {
        return;
      }
      setDialogFeedback(null);
      createDocumentMutation.mutate({ entry: selectedEntry, sendClaim, scheduleDate: selectedDate });
    },
    [createDocumentMutation, selectedDate, selectedEntry],
  );

  const handleDeleteReservation = useCallback(() => {
    if (!selectedEntry) {
      return;
    }
    deleteReservationMutation.mutate({ entry: selectedEntry, scheduleDate: selectedDate });
  }, [deleteReservationMutation, selectedDate, selectedEntry]);

  const assignedOnlyHint =
    assignedOnly && !doctorOrcaId
      ? '担当医のみ表示は ORCA 担当医コードが未設定のため無効です。'
      : '担当医や状態で絞り込み、受付状況に応じた準備を進められます。';
  const activeEntryStatus = selectedEntry ? classifyStatus(selectedEntry) : 'scheduled';
  const activeStatusLabel = statusLabels[activeEntryStatus];
  const activeStatusTone = statusTones[activeEntryStatus];

  return (
    <PageContainer>
      <Header>
        <h1>施設全体の予約一覧</h1>
        <p>
          来院予定を日付と担当医ごとに俯瞰し、診療状況を把握します。オンプレ版 PatientSchedule の運用を
          Web へ統合しました。
        </p>
      </Header>

      <ControlsCard aria-labelledby="schedule-control-heading">
        <Stack gap={8}>
          <h2 id="schedule-control-heading" style={{ margin: 0, fontSize: '1.1rem' }}>
            表示条件
          </h2>
          <InlineMessage>{assignedOnlyHint}</InlineMessage>
        </Stack>
        <ControlRow>
          <div style={{ minWidth: '200px' }}>
            <TextField
              type="date"
              label="対象日"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.currentTarget.value)}
            />
          </div>
          <Stack direction="row" gap={8} align="center">
            <Button type="button" variant="secondary" size="sm" onClick={handlePrevDay}>
              前日
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleNextDay}>
              翌日
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDate(today)}>
              今日
            </Button>
          </Stack>
          <div style={{ minWidth: '200px' }}>
            <SelectField
              label="担当医"
              value={doctorFilter}
              onChange={(event) => setDoctorFilter(event.currentTarget.value)}
              options={doctorOptions}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <SelectField
              label="状態"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.currentTarget.value as 'all' | ScheduleStatus)}
              options={statusOptions}
            />
          </div>
          <div style={{ minWidth: '240px' }}>
            <TextField
              label="キーワード"
              placeholder="氏名 / ID / メモで検索"
              value={keyword}
              onChange={(event) => setKeyword(event.currentTarget.value)}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={assignedOnly && Boolean(doctorOrcaId)}
              onChange={(event) => setAssignedOnly(event.currentTarget.checked)}
              disabled={!doctorOrcaId}
            />
            担当医のみ
          </label>
        </ControlRow>
      </ControlsCard>

      <SummaryGrid>
        <SummaryCard tone="muted" padding="sm">
          <span>予約件数</span>
          <strong>{numberFormatter.format(stats.total)}</strong>
        </SummaryCard>
        <SummaryCard tone="muted" padding="sm">
          <span>{statusLabels.scheduled}</span>
          <strong>{numberFormatter.format(stats.scheduled)}</strong>
        </SummaryCard>
        <SummaryCard tone="muted" padding="sm">
          <span>{statusLabels.calling}</span>
          <strong>{numberFormatter.format(stats.calling)}</strong>
        </SummaryCard>
        <SummaryCard tone="muted" padding="sm">
          <span>{statusLabels.inProgress}</span>
          <strong>{numberFormatter.format(stats.inProgress)}</strong>
        </SummaryCard>
      </SummaryGrid>

      <ScheduleCard tone="default">
        <Stack direction="row" justify="between" align="center">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>予約詳細</h2>
            <InlineMessage>
              {numberFormatter.format(filteredEntries.length)} 件を表示中
              {doctorFilter !== 'all' ? ` / 担当医: ${doctorFilter}` : ''}
            </InlineMessage>
            {pageNotice ? <NoticeMessage role="status">{pageNotice}</NoticeMessage> : null}
            <InlineMessage role="status">
              <StatusBadge tone={dataSourceTone} tooltipFields={scheduleTooltipFields}>
                {dataSourceDisplayLabel}
              </StatusBadge>
              <span style={{ marginLeft: 8 }}>
                RUN_ID: {scheduleTooltipFields.runId ?? '未設定'}
              </span>
              {transitionLabel ? (
                <span style={{ marginLeft: 8 }}>経路: {transitionLabel}</span>
              ) : null}
              <span style={{ marginLeft: 8 }}>進捗: {scheduleTooltipFields.progress}</span>
            </InlineMessage>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRefetch}
            isLoading={scheduleQuery.isFetching}
          >
            再読み込み
          </Button>
        </Stack>
        <TableWrapper>
          <ScheduleTable>
            <thead>
              <tr>
                <TableHeadCell style={{ width: '120px' }}>予定時刻</TableHeadCell>
                <TableHeadCell style={{ width: '220px' }}>患者</TableHeadCell>
                <TableHeadCell style={{ width: '160px' }}>担当医 / 診療科</TableHeadCell>
                <TableHeadCell style={{ width: '120px' }}>状態</TableHeadCell>
                <TableHeadCell>メモ・保険</TableHeadCell>
                <TableHeadCell style={{ width: '160px' }}>最終カルテ</TableHeadCell>
                <TableHeadCell style={{ width: '120px' }}>操作</TableHeadCell>
              </tr>
            </thead>
            <tbody>
              {scheduleQuery.isPending ? (
                <tr>
                  <TableCell colSpan={7}>読み込み中です…</TableCell>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <TableCell colSpan={7}>
                    <EmptyState>条件に一致する予約はありません。</EmptyState>
                  </TableCell>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const status = classifyStatus(entry);
                  return (
                    <TableRow key={entry.visitId} $status={status}>
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>{formatTime(entry.scheduledAt)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{entry.patientId}</div>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600 }}>{entry.patientName}</div>
                        {entry.patientKana ? (
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{entry.patientKana}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div>{entry.doctorName ?? '---'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{entry.departmentName ?? '---'}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={statusTones[status]} tooltipFields={scheduleTooltipFields}>
                          {statusLabels[status]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div>{entry.memo ?? '---'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {entry.firstInsurance ? `保険: ${entry.firstInsurance}` : '保険情報は未登録'}
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(entry.lastDocumentDate)}</TableCell>
                      <TableCell>
                        <Stack gap={8}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenChart(entry)}
                            disabled={!entry.visitId}
                          >
                            カルテを開く
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReservation(entry)}
                          >
                            予約詳細
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </ScheduleTable>
        </TableWrapper>
      </ScheduleCard>

      {selectedEntry ? (
        <ScheduleReservationDialog
          entry={selectedEntry}
          selectedDate={selectedDate}
          onClose={handleCloseReservation}
          onCreateDocument={handleCreateDocument}
          onDeleteReservation={handleDeleteReservation}
          onOpenChart={() => handleOpenChart(selectedEntry)}
          isCreating={createDocumentMutation.isPending}
          isDeleting={deleteReservationMutation.isPending}
          isCreateDisabled={!userModelId}
          feedbackMessage={dialogFeedback}
          errorMessage={dialogError}
          runId={scheduleTooltipFields.runId}
          statusLabel={activeStatusLabel}
          statusTone={activeStatusTone}
        />
      ) : null}
    </PageContainer>
  );
};
