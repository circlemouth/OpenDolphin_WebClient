import styled from '@emotion/styled';
import type { SVGProps } from 'react';

import { StatusBadge, SurfaceCard } from '@/components';
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

const CopyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M8 3a2 2 0 0 0-2 2v12h2V5h9V3H8Zm4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-8Zm0 2h8v12h-8V9Z"
    />
  </svg>
);

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
`;

const Card = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  width: 100%;
  max-width: 264px;
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h3 {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.35;
  }

  span {
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
  }
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
  gap: 6px;
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
  font-size: 0.82rem;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: calc(0.82rem * 1.45 * 2);
  word-break: break-word;
`;

const SummaryDescription = styled.span`
  font-size: 0.82rem;
  line-height: 1.45;
  color: ${({ theme }) => theme.palette.text};
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  max-height: calc(0.82rem * 1.45 * 6);
  word-break: break-word;
`;

const SummaryMeta = styled.span`
  font-size: 0.75rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.palette.textMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  max-height: calc(0.75rem * 1.4 * 3);
  word-break: break-word;
`;

const Message = styled.p<{ $tone: 'info' | 'danger' }>`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: ${({ theme, $tone }) => ($tone === 'danger' ? theme.palette.danger : theme.palette.textMuted)};
`;

const EmptyNotice = styled.p`
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.45;
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
    } catch (_error) {
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
                      <IconActionButton
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleCopy(item.snippet);
                        }}
                        aria-label={`${item.label} をコピー`}
                        title={`${item.label} をコピー`}
                      >
                        <CopyIcon aria-hidden="true" />
                      </IconActionButton>
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
