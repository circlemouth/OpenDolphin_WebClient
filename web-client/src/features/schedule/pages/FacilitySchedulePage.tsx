import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

import { Button, SelectField, Stack, StatusBadge, SurfaceCard, TextField } from '@/components';
import { useFacilitySchedule } from '@/features/schedule/hooks/useFacilitySchedule';
import type { FacilityScheduleEntry } from '@/features/schedule/api/facility-schedule-api';
import { useAuth } from '@/libs/auth';
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

type ScheduleStatus = 'scheduled' | 'calling' | 'inProgress';

const statusLabels: Record<ScheduleStatus, string> = {
  scheduled: '待機',
  calling: '呼出中',
  inProgress: '診察中',
};

const statusTones: Record<ScheduleStatus, 'neutral' | 'info' | 'warning'> = {
  scheduled: 'neutral',
  calling: 'info',
  inProgress: 'warning',
};

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
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ScheduleStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [assignedOnly, setAssignedOnly] = useState(false);

  const doctorOrcaId = session?.userProfile?.userId ?? null;
  const scheduleQuery = useFacilitySchedule({
    date: selectedDate,
    assignedOnly: assignedOnly && Boolean(doctorOrcaId),
    orcaDoctorId: assignedOnly && doctorOrcaId ? doctorOrcaId : undefined,
    unassignedDoctorId: assignedOnly && doctorOrcaId ? '18080' : undefined,
  });

  const entries = scheduleQuery.data ?? [];

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
    if (entry.visitId) {
      navigate(`/charts/${entry.visitId}`);
    }
  };

  return (
    <PageContainer>
      <Header>
        <h1>施設全体の予約一覧</h1>
        <p>来院予定を日付・担当医ごとに俯瞰し、診療状況を把握します。オンプレ版 PatientSchedule の運用を Web へ統合しました。</p>
      </Header>

      <ControlsCard aria-labelledby="schedule-control-heading">
        <Stack gap={8}>
          <h2 id="schedule-control-heading" style={{ margin: 0, fontSize: '1.1rem' }}>
            表示条件
          </h2>
          <InlineMessage>
            {assignedOnly && !doctorOrcaId
              ? '担当医のみ表示は ORCA 担当医コードが未設定のため無効です。'
              : '担当医や状態で絞り込み、受付状況に応じた準備を進められます。'}
          </InlineMessage>
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
          <strong>{stats.total}</strong>
        </SummaryCard>
        <SummaryCard tone="muted" padding="sm">
          <span>{statusLabels.scheduled}</span>
          <strong>{stats.scheduled}</strong>
        </SummaryCard>
        <SummaryCard tone="muted" padding="sm">
          <span>{statusLabels.calling}</span>
          <strong>{stats.calling}</strong>
        </SummaryCard>
        <SummaryCard tone="muted" padding="sm">
          <span>{statusLabels.inProgress}</span>
          <strong>{stats.inProgress}</strong>
        </SummaryCard>
      </SummaryGrid>

      <ScheduleCard tone="default">
        <Stack direction="row" justify="between" align="center">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>予約詳細</h2>
            <InlineMessage>
              {filteredEntries.length} 件を表示中
              {doctorFilter !== 'all' ? ` / 担当医: ${doctorFilter}` : ''}
            </InlineMessage>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => scheduleQuery.refetch()} isLoading={scheduleQuery.isFetching}>
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
              {scheduleQuery.isLoading ? (
                <tr>
                  <TableCell colSpan={7}>読み込み中です…</TableCell>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <TableCell colSpan={7}>
                    <EmptyState>条件に一致する予約がありません。</EmptyState>
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
                        <StatusBadge tone={statusTones[status]}>{statusLabels[status]}</StatusBadge>
                      </TableCell>
                      <TableCell>
                        <div>{entry.memo ?? '---'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {entry.firstInsurance ? `保険: ${entry.firstInsurance}` : '保険情報未登録'}
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(entry.lastDocumentDate)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenChart(entry)}
                          disabled={!entry.visitId}
                        >
                          カルテを開く
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </tbody>
          </ScheduleTable>
        </TableWrapper>
      </ScheduleCard>
    </PageContainer>
  );
};
