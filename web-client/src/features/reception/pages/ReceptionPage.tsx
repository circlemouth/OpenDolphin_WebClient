import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';

import { Button, SelectField, Stack, StatusBadge, SurfaceCard, TextField } from '@/components';
import { usePatientVisits } from '@/features/charts/hooks/usePatientVisits';
import { hasOpenBit } from '@/features/charts/utils/visit-state';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { useAuth } from '@/libs/auth';

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

const EmptyState = styled(SurfaceCard)`
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
`;

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

export const ReceptionPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const clientUuid = session?.credentials.clientUuid;
  const visitsQuery = usePatientVisits();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const visits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);

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

  const handleOpenChart = (visitId: number) => {
    navigate(`/charts/${visitId}`);
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

  return (
    <PageContainer>
      <HeaderBar>
        <TitleBlock>
          <h1>受付患者一覧</h1>
          <p>待機状況を確認し、カルテ編集へ素早く遷移できます。</p>
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

      {visitsQuery.isLoading ? (
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
      ) : (
        <QueueGrid>
          {filteredVisits.map((visit) => {
            const statusBadge = renderStatusBadge(visit);
            const isOwnedByMe = clientUuid && visit.ownerUuid === clientUuid;
            const isOwnedByOther = clientUuid && visit.ownerUuid && visit.ownerUuid !== clientUuid;

            return (
              <VisitCard key={visit.visitId} tone="muted" padding="lg">
                <Stack gap={12}>
                  <CardHeader>
                    <div>
                      <PatientName>{visit.fullName}</PatientName>
                      <MetaList>
                        <span>ID: {visit.patientId}</span>
                        <span>来院: {visit.visitDate ?? '---'}</span>
                        {visit.memo ? <span>受付メモ: {visit.memo}</span> : null}
                      </MetaList>
                    </div>
                    {statusBadge}
                  </CardHeader>
                  <BadgeRow>
                    {isOwnedByMe ? <StatusBadge tone="success">自端末で編集中</StatusBadge> : null}
                    {isOwnedByOther ? <StatusBadge tone="danger">他端末で編集中</StatusBadge> : null}
                    {!visit.ownerUuid && visit.safetyNotes?.length
                      ? visit.safetyNotes.map((note) => (
                          <StatusBadge key={note} tone="warning">
                            {note}
                          </StatusBadge>
                        ))
                      : null}
                  </BadgeRow>
                  <Button type="button" variant="primary" onClick={() => handleOpenChart(visit.visitId)}>
                    カルテを開く
                  </Button>
                </Stack>
              </VisitCard>
            );
          })}
        </QueueGrid>
      )}
    </PageContainer>
  );
};
