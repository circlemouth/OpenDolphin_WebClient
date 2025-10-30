import styled from '@emotion/styled';

interface MonshinSummaryItem {
  id: string;
  question: string;
  answer: string;
}

interface VitalSignItem {
  id: string;
  label: string;
  value: string;
}

export interface MediaItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  capturedAt?: string;
  description?: string;
}

export interface PastSummaryItem {
  id: string;
  title: string;
  excerpt: string;
  recordedAt?: string;
}

interface RightPaneProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  monshinSummary: MonshinSummaryItem[];
  vitalSigns: VitalSignItem[];
  mediaItems: MediaItem[];
  pastSummaries: PastSummaryItem[];
  onSnippetDragStart: (snippet: string) => void;
  onMediaOpen: (item: MediaItem) => void;
  onPastSummaryOpen: (item: PastSummaryItem) => void;
  onHoverExpand?: () => void;
  onHoverLeave?: () => void;
}

const Aside = styled.aside<{ $collapsed: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? '16px' : '320px')};
  max-width: 340px;
  flex: 0 0 auto;
  position: relative;
  background: ${({ theme }) => theme.palette.surface};
  border-left: 1px solid ${({ theme }) => theme.palette.border};
  transition: width 0.2s ease;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PaneContent = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  flex: 1 1 auto;
  overflow-y: auto;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
`;

const CollapseButton = styled.button`
  position: absolute;
  top: 12px;
  left: -36px;
  width: 32px;
  height: 32px;
  border-radius: 16px 0 0 16px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surface};
  color: ${({ theme }) => theme.palette.text};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.elevation.level1};
`;

const Section = styled.section`
  display: grid;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text};
`;

const SummaryItem = styled.div`
  display: grid;
  gap: 4px;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surface};
  cursor: grab;
`;

const SummaryQuestion = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const SummaryAnswer = styled.span`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text};
  font-weight: 600;
`;

const VitalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
`;

const VitalItem = styled.div`
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.text};
  font-size: 0.85rem;
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
`;

const MediaThumb = styled.button`
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  overflow: hidden;
  position: relative;
  padding: 0;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.elevation.level1};
  background: ${({ theme }) => theme.palette.surface};
`;

const MediaCaption = styled.span`
  display: block;
  padding: 6px;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.text};
  text-align: left;
`;

const PastSummaryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PastSummaryCard = styled.button`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 10px;
  text-align: left;
  background: ${({ theme }) => theme.palette.surface};
  cursor: pointer;
  display: grid;
  gap: 4px;
`;

const PastSummaryTitle = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
`;

const PastSummaryExcerpt = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

export const RightPane = ({
  isCollapsed,
  onToggleCollapse,
  monshinSummary,
  vitalSigns,
  mediaItems,
  pastSummaries,
  onSnippetDragStart,
  onMediaOpen,
  onPastSummaryOpen,
  onHoverExpand,
  onHoverLeave,
}: RightPaneProps) => (
  <Aside
    $collapsed={isCollapsed}
    aria-label="右ペイン"
    onMouseEnter={onHoverExpand}
    onMouseLeave={onHoverLeave}
  >
    <CollapseButton type="button" onClick={onToggleCollapse} aria-expanded={!isCollapsed}>
      {isCollapsed ? '＜' : '＞'}
    </CollapseButton>
    <PaneContent $collapsed={isCollapsed}>
      <Section>
        <SectionTitle>最新問診＋バイタル</SectionTitle>
        {monshinSummary.length === 0 ? (
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            問診結果がまだありません。F3 検索や受付メモを参照してください。
          </span>
        ) : (
          monshinSummary.map((item) => (
            <SummaryItem
              key={item.id}
              draggable
              onDragStart={(event) => {
                const snippet = `${item.question}: ${item.answer}`;
                event.dataTransfer.setData('text/plain', snippet);
                onSnippetDragStart(snippet);
              }}
            >
              <SummaryQuestion>{item.question}</SummaryQuestion>
              <SummaryAnswer>{item.answer}</SummaryAnswer>
            </SummaryItem>
          ))
        )}
        <VitalGrid>
          {vitalSigns.map((vital) => (
            <VitalItem key={vital.id} draggable onDragStart={(event) => {
              const snippet = `${vital.label}: ${vital.value}`;
              event.dataTransfer.setData('text/plain', snippet);
              onSnippetDragStart(snippet);
            }}>
              <strong>{vital.label}</strong>
              <div>{vital.value}</div>
            </VitalItem>
          ))}
        </VitalGrid>
      </Section>
      <Section>
        <SectionTitle>関連画像 / 検査</SectionTitle>
        {mediaItems.length === 0 ? (
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            画像はまだありません。検査取り込みから追加できます。
          </span>
        ) : (
          <MediaGrid>
            {mediaItems.map((media) => (
              <MediaThumb key={media.id} onClick={() => onMediaOpen(media)}>
                <img
                  src={media.thumbnailUrl}
                  alt={media.title}
                  style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }}
                />
                <MediaCaption>{media.title}</MediaCaption>
              </MediaThumb>
            ))}
          </MediaGrid>
        )}
      </Section>
      <Section>
        <SectionTitle>過去カルテサマリ</SectionTitle>
        {pastSummaries.length === 0 ? (
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            過去カルテはまだ読み込まれていません。
          </span>
        ) : (
          <PastSummaryList>
            {pastSummaries.map((summary) => (
              <PastSummaryCard
                key={summary.id}
                onClick={() => onPastSummaryOpen(summary)}
                draggable
                onDragStart={(event) => {
                  const snippet = `${summary.title}: ${summary.excerpt}`;
                  event.dataTransfer.setData('text/plain', snippet);
                  onSnippetDragStart(snippet);
                }}
              >
                <PastSummaryTitle>{summary.title}</PastSummaryTitle>
                <PastSummaryExcerpt>{summary.excerpt}</PastSummaryExcerpt>
                {summary.recordedAt ? (
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{summary.recordedAt}</span>
                ) : null}
              </PastSummaryCard>
            ))}
          </PastSummaryList>
        )}
      </Section>
    </PaneContent>
  </Aside>
);
