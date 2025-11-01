import { useMemo } from 'react';
import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard } from '@/components';
import type { RegisteredDiagnosis } from '@/features/charts/types/diagnosis';
import {
  diagnosisCodeLabel,
  diagnosisDisplayName,
  diagnosisStatusTone,
  formatDiagnosisDate,
} from '@/features/charts/components/diagnosis-utils';

interface ProblemListCardProps {
  activeDiagnoses: RegisteredDiagnosis[];
  pastDiagnoses: RegisteredDiagnosis[];
  primaryDiagnosisName: string;
  onSelectPrimary: (diagnosis: RegisteredDiagnosis) => void;
  onAppendToPlan: (diagnosis: RegisteredDiagnosis) => void;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onReload: () => void;
}

const CardShell = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled.h4`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ProblemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ProblemItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProblemButton = styled.button<{ $primary: boolean }>`
  flex: 1 1 auto;
  text-align: left;
  border: 1px solid ${({ theme, $primary }) => ($primary ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $primary }) => ($primary ? theme.palette.surfaceStrong : theme.palette.surface)};
  color: ${({ theme }) => theme.palette.text};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 12px;
  cursor: pointer;
  display: grid;
  gap: 4px;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primary};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const ProblemName = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
`;

const ProblemMeta = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ProblemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Message = styled.div<{ $tone: 'info' | 'danger' }>`
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.border : theme.palette.danger ?? '#b91c1c')};
  background: ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.surfaceMuted : theme.palette.dangerMuted ?? '#fee2e2')};
  color: ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.text : theme.palette.danger ?? '#7f1d1d')};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 12px;
  font-size: 0.85rem;
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const buildKey = (diagnosis: RegisteredDiagnosis) =>
  diagnosis.id != null ? `diagnosis-${diagnosis.id}` : `${diagnosis.diagnosis ?? 'unknown'}-${diagnosis.started ?? Math.random()}`;

export const ProblemListCard = ({
  activeDiagnoses,
  pastDiagnoses,
  primaryDiagnosisName,
  onSelectPrimary,
  onAppendToPlan,
  isLoading,
  isFetching,
  error,
  onReload,
}: ProblemListCardProps) => {
  const primaryLookup = useMemo(() => primaryDiagnosisName.trim().toLowerCase(), [primaryDiagnosisName]);
  const renderSection = (label: string, rows: RegisteredDiagnosis[], sectionId: string) => (
    <Section aria-labelledby={sectionId}>
      <SectionTitle id={sectionId}>{label}</SectionTitle>
      {rows.length === 0 ? (
        <EmptyText>表示する病名はありません。</EmptyText>
      ) : (
        <ProblemList role="list">
          {rows.map((diagnosis) => {
            const name = diagnosisDisplayName(diagnosis);
            const code = diagnosisCodeLabel(diagnosis);
            const isPrimary = primaryLookup !== '' && name.trim().toLowerCase() === primaryLookup;
            return (
              <ProblemItem key={buildKey(diagnosis)}>
                <ProblemButton
                  type="button"
                  $primary={isPrimary}
                  aria-pressed={isPrimary}
                  onClick={() => onSelectPrimary(diagnosis)}
                >
                  <ProblemName>
                    {name}
                    {isPrimary ? '（主病名）' : ''}
                  </ProblemName>
                  <ProblemMeta>{code}</ProblemMeta>
                  <ProblemMeta>初回: {formatDiagnosisDate(diagnosis.firstEncounterDate)}</ProblemMeta>
                </ProblemButton>
                <StatusBadge tone={diagnosisStatusTone(diagnosis.status)}>{diagnosis.status ?? 'F'}</StatusBadge>
                <ProblemActions>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onAppendToPlan(diagnosis)}
                    aria-label={`${name} を Plan カードに追加`}
                  >
                    A/P 追加
                  </Button>
                </ProblemActions>
              </ProblemItem>
            );
          })}
        </ProblemList>
      )}
    </Section>
  );

  return (
    <CardShell role="region" aria-labelledby="problem-list-title" aria-busy={isLoading}>
      <CardHeader>
        <Title id="problem-list-title">問題リスト</Title>
        <Button type="button" size="sm" variant="ghost" onClick={onReload} isLoading={isFetching}>
          再読込
        </Button>
      </CardHeader>
      {isLoading ? <Message $tone="info">病名一覧を読み込んでいます…</Message> : null}
      {!isLoading && error ? <Message $tone="danger">病名一覧の取得に失敗しました。</Message> : null}
      {!isLoading && !error ? (
        <>
          {renderSection('アクティブ', activeDiagnoses, 'problem-list-active')}
          {renderSection('既往', pastDiagnoses, 'problem-list-inactive')}
        </>
      ) : null}
    </CardShell>
  );
};
