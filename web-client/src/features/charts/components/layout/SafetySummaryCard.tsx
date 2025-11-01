import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard } from '@/components';
import type { SafetyTone } from '@/features/charts/utils/caution-tone';
import type { AppTheme } from '@/styles/theme';

export interface SafetySummaryEntry {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  tone: SafetyTone;
  snippet: string;
}

export interface SafetySummarySection {
  id: string;
  title: string;
  items: SafetySummaryEntry[];
  loading?: boolean;
  error?: string | null;
  emptyMessage: string;
}

interface SafetySummaryCardProps {
  sections: SafetySummarySection[];
  onSnippetDragStart: (snippet: string) => void;
}

const Card = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  span {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionTitle = styled.h4`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const SectionList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionItem = styled.li`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: stretch;
  gap: 8px;
`;

const toneBorder = (tone: SafetyTone, theme: AppTheme) => {
  if (tone === 'danger') {
    return theme.palette.danger;
  }
  if (tone === 'warning') {
    return theme.palette.warning;
  }
  return theme.palette.border;
};

const toneBackground = (tone: SafetyTone, theme: AppTheme) => {
  if (tone === 'danger') {
    return theme.palette.dangerMuted ?? '#fde2e4';
  }
  if (tone === 'warning') {
    return theme.palette.warningMuted ?? '#fef3c7';
  }
  return theme.palette.surface;
};

const SummaryHandle = styled.div<{ $tone: SafetyTone }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid ${({ theme, $tone }) => toneBorder($tone, theme)};
  background: ${({ theme, $tone }) => toneBackground($tone, theme)};
  color: ${({ theme }) => theme.palette.text};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 12px;
  cursor: grab;
  user-select: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primary};
    box-shadow: ${({ theme }) => theme.elevation.level1};
  }

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const SummaryLabel = styled.span`
  font-weight: 600;
  font-size: 0.95rem;
`;

const SummaryDescription = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.text};
  white-space: pre-wrap;
`;

const SummaryMeta = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const CopyButton = styled(Button)`
  align-self: center;
`;

const Message = styled.p<{ $tone: 'info' | 'danger' }>`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ theme, $tone }) => ($tone === 'danger' ? theme.palette.danger : theme.palette.textMuted)};
`;

const EmptyNotice = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const toneLabel: Record<SafetyTone, string> = {
  danger: '危険',
  warning: '注意',
  info: '情報',
};

export const SafetySummaryCard = ({ sections, onSnippetDragStart }: SafetySummaryCardProps) => {
  const handleCopy = (snippet: string) => {
    onSnippetDragStart(snippet);
    try {
      void navigator?.clipboard?.writeText?.(snippet);
    } catch (error) {
      // clipboard 取得に失敗した場合は黙ってフォールバック（ドラッグ操作で補える）
    }
  };

  return (
    <Card role="complementary" aria-labelledby="safety-summary-title">
      <Header>
        <h3 id="safety-summary-title">安全サマリ</h3>
        <span>アレルギー・既往歴・現用薬の要約。ドラッグまたはコピーで SOAP へ挿入できます。</span>
      </Header>
      {sections.map((section) => {
        const sectionId = `safety-summary-${section.id}`;
        return (
          <Section key={section.id} aria-labelledby={sectionId} aria-busy={section.loading}>
            <SectionTitle id={sectionId}>{section.title}</SectionTitle>
            {section.loading ? <Message $tone="info">読み込み中です…</Message> : null}
            {!section.loading && section.error ? (
              <Message $tone="danger">{section.error}</Message>
            ) : null}
            {!section.loading && !section.error ? (
              section.items.length ? (
                <SectionList role="list">
                  {section.items.map((item) => (
                    <SectionItem key={item.id}>
                      <SummaryHandle
                        role="button"
                        tabIndex={0}
                        draggable
                        $tone={item.tone}
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', item.snippet);
                          onSnippetDragStart(item.snippet);
                        }}
                        onClick={() => handleCopy(item.snippet)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleCopy(item.snippet);
                          }
                        }}
                      >
                        <SummaryHeader>
                          <SummaryLabel>{item.label}</SummaryLabel>
                          <StatusBadge tone={item.tone === 'info' ? 'info' : item.tone} size="sm">
                            {toneLabel[item.tone]}
                          </StatusBadge>
                        </SummaryHeader>
                        {item.description ? <SummaryDescription>{item.description}</SummaryDescription> : null}
                        {item.meta ? <SummaryMeta>{item.meta}</SummaryMeta> : null}
                      </SummaryHandle>
                      <CopyButton
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleCopy(item.snippet);
                        }}
                        aria-label={`${item.label} をコピー`}
                      >
                        コピー
                      </CopyButton>
                    </SectionItem>
                  ))}
                </SectionList>
              ) : (
                <EmptyNotice>{section.emptyMessage}</EmptyNotice>
              )
            ) : null}
          </Section>
        );
      })}
    </Card>
  );
};
