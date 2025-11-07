import styled from '@emotion/styled';

import type { MediaItem } from '@/features/charts/types/media';
import type { MonshinSummaryItem, PastSummaryItem, VitalSignItem } from '@/features/charts/types/reference';

const Panel = styled.section`
  display: grid;
  gap: 16px;
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

const SummaryGrid = styled.div`
  display: grid;
  gap: 8px;
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

const VitalItem = styled.button`
  display: grid;
  gap: 4px;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.text};
  font-size: 0.9rem;
  text-align: left;
  cursor: grab;

  strong {
    font-size: 0.82rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
`;

const MediaThumb = styled.button`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  overflow: hidden;
  position: relative;
  padding: 0;
  cursor: pointer;
  background: ${({ theme }) => theme.palette.surface};
  display: flex;
  flex-direction: column;
  text-align: left;
  box-shadow: ${({ theme }) => theme.elevation.level1};
`;

const MediaPreview = styled.div<{ $kind: MediaItem['kind'] }>`
  width: 100%;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: ${({ theme, $kind }) => {
    switch ($kind) {
      case 'pdf':
        return theme.palette.primaryStrong;
      default:
        return theme.palette.text;
    }
  }};
  background: ${({ theme, $kind }) => {
    switch ($kind) {
      case 'image':
        return theme.palette.surfaceStrong;
      case 'pdf':
        return theme.palette.warning;
      default:
        return theme.palette.surfaceMuted;
    }
  }};
`;

const MediaCaption = styled.div`
  display: grid;
  gap: 2px;
  padding: 6px;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.text};
`;

const MediaTitle = styled.span`
  font-weight: 600;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.text};
`;

const MediaMeta = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const MediaNotice = styled.p<{ $tone?: 'muted' | 'danger' }>`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme, $tone }) => ($tone === 'danger' ? theme.palette.danger : theme.palette.textMuted)};
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
  box-shadow: ${({ theme }) => theme.elevation.level0};

  &:hover {
    box-shadow: ${({ theme }) => theme.elevation.level1};
  }
`;

const PastSummaryTitle = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.text};
`;

const PastSummaryExcerpt = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const PastSummaryMeta = styled.span`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const formatMediaTimestamp = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMediaSize = (size?: number): string | null => {
  if (!size || size <= 0) {
    return null;
  }
  if (size < 1024) {
    return `${size} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  if (unitIndex < 0) {
    unitIndex = 0;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

const mediaKindLabel = (kind: MediaItem['kind']): string => {
  switch (kind) {
    case 'image':
      return 'IMG';
    case 'pdf':
      return 'PDF';
    default:
      return 'FILE';
  }
};

export interface ClinicalReferencePanelProps {
  monshinSummary: MonshinSummaryItem[];
  vitalSigns: VitalSignItem[];
  mediaItems: MediaItem[];
  mediaLoading?: boolean;
  mediaError?: string | null;
  pastSummaries: PastSummaryItem[];
  onSnippetDragStart: (snippet: string) => void;
  onMediaOpen: (item: MediaItem) => void;
  onPastSummaryOpen: (item: PastSummaryItem) => void;
}

export const ClinicalReferencePanel = ({
  monshinSummary,
  vitalSigns,
  mediaItems,
  mediaLoading = false,
  mediaError = null,
  pastSummaries,
  onSnippetDragStart,
  onMediaOpen,
  onPastSummaryOpen,
}: ClinicalReferencePanelProps) => (
  <Panel aria-label="参照情報">
    <Section aria-labelledby="reference-monshin">
      <SectionTitle id="reference-monshin">最新問診</SectionTitle>
      {monshinSummary.length === 0 ? (
        <MediaNotice>問診結果がまだありません。受付メモや SOAP を参照してください。</MediaNotice>
      ) : (
        <SummaryGrid>
          {monshinSummary.map((item) => {
            const snippet = `${item.question}: ${item.answer}`;
            return (
              <SummaryItem
                key={item.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', snippet);
                  onSnippetDragStart(snippet);
                }}
              >
                <SummaryQuestion>{item.question}</SummaryQuestion>
                <SummaryAnswer>{item.answer}</SummaryAnswer>
              </SummaryItem>
            );
          })}
        </SummaryGrid>
      )}
    </Section>

    <Section aria-labelledby="reference-vitals">
      <SectionTitle id="reference-vitals">バイタルサイン</SectionTitle>
      {vitalSigns.length === 0 ? (
        <MediaNotice>バイタルが未入力です。測定値を記録すると表示されます。</MediaNotice>
      ) : (
        <VitalGrid>
          {vitalSigns.map((vital) => {
            const snippet = `${vital.label}: ${vital.value}`;
            return (
              <VitalItem
                key={vital.id}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', snippet);
                  onSnippetDragStart(snippet);
                }}
              >
                <strong>{vital.label}</strong>
                <span>{vital.value}</span>
              </VitalItem>
            );
          })}
        </VitalGrid>
      )}
    </Section>

    <Section aria-labelledby="reference-media">
      <SectionTitle id="reference-media">関連画像・検査資料</SectionTitle>
      {mediaLoading ? (
        <MediaNotice>画像・添付を読み込んでいます…</MediaNotice>
      ) : mediaError ? (
        <MediaNotice $tone="danger">{mediaError}</MediaNotice>
      ) : mediaItems.length === 0 ? (
        <MediaNotice>関連メディアがまだありません。検査取り込みやカルテ添付から追加できます。</MediaNotice>
      ) : (
        <MediaGrid>
          {mediaItems.map((media) => {
            const timestamp = formatMediaTimestamp(media.capturedAt ?? media.confirmedAt ?? media.createdAt ?? null);
            const sizeLabel = formatMediaSize(media.size);
            const documentLabel =
              media.documentTitle && media.documentTitle !== media.title ? media.documentTitle : null;
            return (
              <MediaThumb key={media.id} type="button" onClick={() => onMediaOpen(media)}>
                <MediaPreview $kind={media.kind}>{mediaKindLabel(media.kind)}</MediaPreview>
                <MediaCaption>
                  <MediaTitle>{media.title}</MediaTitle>
                  {documentLabel ? <MediaMeta>{documentLabel}</MediaMeta> : null}
                  {media.fileName ? <MediaMeta>{media.fileName}</MediaMeta> : null}
                  {sizeLabel ? <MediaMeta>{sizeLabel}</MediaMeta> : null}
                  {timestamp ? <MediaMeta>{timestamp}</MediaMeta> : null}
                </MediaCaption>
              </MediaThumb>
            );
          })}
        </MediaGrid>
      )}
    </Section>

    <Section aria-labelledby="reference-past-summary">
      <SectionTitle id="reference-past-summary">過去カルテサマリ</SectionTitle>
      {pastSummaries.length === 0 ? (
        <MediaNotice>過去カルテはまだ読み込まれていません。</MediaNotice>
      ) : (
        <PastSummaryList>
          {pastSummaries.map((summary) => {
            const snippet = `${summary.title}: ${summary.excerpt}`;
            return (
              <PastSummaryCard
                key={summary.id}
                onClick={() => onPastSummaryOpen(summary)}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', snippet);
                  onSnippetDragStart(snippet);
                }}
              >
                <PastSummaryTitle>{summary.title}</PastSummaryTitle>
                <PastSummaryExcerpt>{summary.excerpt}</PastSummaryExcerpt>
                {summary.recordedAt ? <PastSummaryMeta>{summary.recordedAt}</PastSummaryMeta> : null}
              </PastSummaryCard>
            );
          })}
        </PastSummaryList>
      )}
    </Section>
  </Panel>
);
