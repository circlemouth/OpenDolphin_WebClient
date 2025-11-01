import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import type { SVGProps } from 'react';
import { useMemo } from 'react';

import { StatusBadge, SurfaceCard } from '@/components';
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

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const ReloadIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M12 5a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5v3l4-4-4-4v3Z"
    />
  </svg>
);

const PlanIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M6 4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-4H6Zm7 1.5L17.5 9H13a2 2 0 0 1-2-2V5.5Zm-2 6.5h2v2h2v2h-2v2h-2v-2H9v-2h2v-2Z"
    />
  </svg>
);

const CardShell = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  width: 100%;
  max-width: 264px;
  margin: 0 auto;
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.35;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled.h4`
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ProblemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProblemItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const ProblemButton = styled.button<{ $primary: boolean }>`
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
  border: 1px solid ${({ theme, $primary }) => ($primary ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $primary }) => ($primary ? theme.palette.surfaceStrong : theme.palette.surface)};
  color: ${({ theme }) => theme.palette.text};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 8px 12px;
  cursor: pointer;
  display: grid;
  gap: 6px;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${({ theme, $primary }) => ($primary ? theme.elevation.level1 : 'none')};

  &:hover {
    border-color: ${({ theme }) => theme.palette.primary};
    box-shadow: ${({ theme }) => theme.elevation.level1};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const ProblemName = styled.span`
  font-weight: 600;
  font-size: 0.82rem;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  max-height: calc(0.82rem * 1.45 * 3);
  word-break: break-word;
`;

const ProblemMeta = styled.span`
  font-size: 0.78rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.palette.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: calc(0.78rem * 1.45 * 2);
  word-break: break-word;
`;

const ProblemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DiagnosisStatus = styled(StatusBadge)`
  margin-top: 4px;
  flex-shrink: 0;
`;

const IconActionButton = styled.button`
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surface};
  color: ${({ theme }) => theme.palette.textMuted};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${({ theme }) => theme.elevation.level1};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.palette.surfaceMuted};
    color: ${({ theme }) => theme.palette.primary};
    border-color: ${({ theme }) => theme.palette.primary};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }

  &[data-tone='primary'] {
    color: ${({ theme }) => theme.palette.primary};
  }

  &[data-loading='true'] svg {
    animation: ${spin} 0.8s linear infinite;
  }
`;

const Message = styled.div<{ $tone: 'info' | 'danger' }>`
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.border : theme.palette.danger ?? '#b91c1c')};
  background: ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.surfaceMuted : theme.palette.dangerMuted ?? '#fee2e2')};
  color: ${({ theme, $tone }) => ($tone === 'info' ? theme.palette.text : theme.palette.danger ?? '#7f1d1d')};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 8px 12px;
  font-size: 0.82rem;
  line-height: 1.45;
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.palette.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  max-height: calc(0.82rem * 1.45 * 6);
  word-break: break-word;
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
                <DiagnosisStatus tone={diagnosisStatusTone(diagnosis.status)} size="sm">
                  {diagnosis.status ?? 'F'}
                </DiagnosisStatus>
                <ProblemActions>
                  <IconActionButton
                    type="button"
                    onClick={() => onAppendToPlan(diagnosis)}
                    aria-label={`${name} を Plan カードに追加`}
                    title="Plan カードに追加"
                    data-tone="primary"
                  >
                    <PlanIcon aria-hidden="true" />
                  </IconActionButton>
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
        <IconActionButton
          type="button"
          onClick={onReload}
          aria-label="病名一覧を再読込"
          title="病名一覧を再読込"
          aria-busy={isFetching}
          data-loading={isFetching}
          disabled={isFetching}
        >
          <ReloadIcon aria-hidden="true" />
        </IconActionButton>
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
