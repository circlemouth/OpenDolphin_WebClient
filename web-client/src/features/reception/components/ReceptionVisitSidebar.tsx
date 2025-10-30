import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard, Stack } from '@/components';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { useVisitHistory } from '@/features/reception/hooks/useVisitHistory';

interface ReceptionVisitSidebarProps {
  visit: PatientVisitSummary;
  onClose: () => void;
  onManage: () => void;
  onOpenChart: () => void;
  hasTemporaryDocument: boolean;
}

const SidebarCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  span {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Section = styled.section`
  display: grid;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
`;

const MetaList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px 12px;
  font-size: 0.85rem;

  dt {
    color: ${({ theme }) => theme.palette.textMuted};
    font-weight: 500;
  }

  dd {
    margin: 0;
  }
`;

const HistoryList = styled.ul`
  margin: 0;
  padding-left: 1em;
  display: grid;
  gap: 6px;
  font-size: 0.85rem;
`;

const formatDateTime = (value?: string) => {
  if (!value) {
    return '---';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('ja-JP', { hour12: false });
};

const deriveStatusBadge = (visit: PatientVisitSummary) => {
  if (visit.ownerUuid) {
    return <StatusBadge tone="info">診察中</StatusBadge>;
  }
  if (visit.state !== undefined && (visit.state & 1) === 1) {
    return <StatusBadge tone="warning">呼出済み</StatusBadge>;
  }
  return <StatusBadge tone="neutral">待機中</StatusBadge>;
};

export const ReceptionVisitSidebar = ({
  visit,
  onClose,
  onManage,
  onOpenChart,
  hasTemporaryDocument,
}: ReceptionVisitSidebarProps) => {
  const historyQuery = useVisitHistory(visit.patientId, visit.visitDate);

  return (
    <SidebarCard tone="muted" padding="md" aria-live="polite">
      <Header>
        <TitleBlock>
          <h2>{visit.fullName}</h2>
          <span>患者ID: {visit.patientId}</span>
        </TitleBlock>
        <Button type="button" variant="ghost" onClick={onClose}>
          閉じる
        </Button>
      </Header>

      <BadgeRow>
        {deriveStatusBadge(visit)}
        {hasTemporaryDocument ? <StatusBadge tone="danger">仮保存カルテあり</StatusBadge> : null}
        {visit.safetyNotes.map((note) => (
          <StatusBadge key={note} tone="warning">
            {note}
          </StatusBadge>
        ))}
      </BadgeRow>

      <Section>
        <SectionTitle>受付概要</SectionTitle>
        <MetaList>
          <dt>来院日時</dt>
          <dd>{formatDateTime(visit.visitDate)}</dd>
          <dt>担当医</dt>
          <dd>{visit.doctorName ? `${visit.doctorName}${visit.doctorId ? ` (${visit.doctorId})` : ''}` : '---'}</dd>
          <dt>診療科</dt>
          <dd>{visit.departmentName ? `${visit.departmentName}${visit.departmentCode ? ` (${visit.departmentCode})` : ''}` : '---'}</dd>
          <dt>受付メモ</dt>
          <dd>{visit.memo ?? '---'}</dd>
        </MetaList>
      </Section>

      <Section>
        <SectionTitle>アクション</SectionTitle>
        <Stack gap={8}>
          <Button type="button" variant="primary" onClick={onOpenChart}>
            カルテを開く
          </Button>
          <Button type="button" variant="secondary" onClick={onManage}>
            詳細操作（状態変更・受付取消）
          </Button>
        </Stack>
      </Section>

      <Section>
        <SectionTitle>最近の来院履歴</SectionTitle>
        {historyQuery.isLoading ? (
          <span>履歴を読み込み中です…</span>
        ) : historyQuery.data && historyQuery.data.length > 0 ? (
          <HistoryList>
            {historyQuery.data.map((entry, index) => (
              <li key={entry.visitDate ?? `${entry.patientId}-${index}`}>
                {formatDateTime(entry.visitDate)} / {entry.memo ?? '受付記録'}
              </li>
            ))}
          </HistoryList>
        ) : (
          <span>表示できる履歴がありません。</span>
        )}
      </Section>
    </SidebarCard>
  );
};
