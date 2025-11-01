import styled from '@emotion/styled';

import { Button, TextArea } from '@/components';
import type { MediaItem } from '@/features/charts/types/media';
import type { MonshinSummaryItem, PastSummaryItem, VitalSignItem } from '@/features/charts/types/reference';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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

interface RightPaneProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  visitMemo: string;
  visitMemoStatus: SaveStatus;
  visitMemoError: string | null;
  visitMemoDirty: boolean;
  onVisitMemoChange: (value: string) => void;
  onVisitMemoSave: () => void;
  onVisitMemoReset: () => void;
  visitMemoDisabled?: boolean;
  monshinSummary: MonshinSummaryItem[];
  vitalSigns: VitalSignItem[];
  mediaItems: MediaItem[];
  mediaLoading?: boolean;
  mediaError?: string | null;
  pastSummaries: PastSummaryItem[];
  onSnippetDragStart: (snippet: string) => void;
  onMediaOpen: (item: MediaItem) => void;
  onPastSummaryOpen: (item: PastSummaryItem) => void;
  patientMemo: string;
  patientMemoStatus: SaveStatus;
  patientMemoError: string | null;
  patientMemoDirty: boolean;
  patientMemoUpdatedAt: string | null;
  onPatientMemoChange: (value: string) => void;
  onPatientMemoSave: () => void;
  onPatientMemoReset: () => void;
  patientMemoDisabled?: boolean;
  hasPatientMemoHistory: boolean;
  onPatientMemoHistoryOpen: () => void;
  freeDocumentComment: string;
  freeDocumentStatus: SaveStatus;
  freeDocumentError: string | null;
  freeDocumentDirty: boolean;
  freeDocumentUpdatedAt: string | null;
  onFreeDocumentChange: (value: string) => void;
  onFreeDocumentSave: () => void;
  onFreeDocumentReset: () => void;
  freeDocumentDisabled?: boolean;
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
  min-height: 0;
  display: flex;
  flex-direction: column;

  @media (max-width: 1180px) {
    width: 100%;
    max-width: none;
    border-left: none;
    border-top: 1px solid ${({ theme }) => theme.palette.border};
    border-radius: ${({ theme }) => theme.radius.lg};
  }
`;

const PaneContent = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  flex: 1 1 auto;
  overflow-y: auto;
  max-height: calc(var(--charts-workspace-viewport, 100vh) - var(--charts-workspace-vertical-padding, 56px));
  scrollbar-gutter: stable both-edges;
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};

  @media (max-width: 1180px) {
    max-height: none;
    overflow-y: visible;
    padding: 16px 20px 20px;
  }
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

  @media (max-width: 1180px) {
    display: none;
  }
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

const EditorCard = styled.section`
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const EditorHeader = styled.div`
  display: grid;
  gap: 4px;
`;

const EditorHeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const EditorHeaderActions = styled.div`
  display: flex;
  gap: 4px;
`;

const HelperText = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const EditorFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const EditorActions = styled.div`
  display: flex;
  gap: 8px;
`;

const StatusText = styled.span<{ $tone: 'muted' | 'success' | 'danger' }>`
  font-size: 0.8rem;
  color: ${({ theme, $tone }) => {
    if ($tone === 'success') {
      return theme.palette.success;
    }
    if ($tone === 'danger') {
      return theme.palette.danger;
    }
    return theme.palette.textMuted;
  }};
`;

const formatUpdatedAt = (value: string | null) => {
  if (!value) {
    return '---';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '---';
  }
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  overflow: hidden;
  position: relative;
  padding: 0;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.elevation.level1};
  background: ${({ theme }) => theme.palette.surface};
  display: flex;
  flex-direction: column;
  text-align: left;
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

const MediaNotice = styled.span<{ $tone?: 'muted' | 'danger' }>`
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
  visitMemo,
  visitMemoStatus,
  visitMemoError,
  visitMemoDirty,
  onVisitMemoChange,
  onVisitMemoSave,
  onVisitMemoReset,
  visitMemoDisabled = false,
  monshinSummary,
  vitalSigns,
  mediaItems,
  mediaLoading = false,
  mediaError = null,
  pastSummaries,
  onSnippetDragStart,
  onMediaOpen,
  onPastSummaryOpen,
  patientMemo,
  patientMemoStatus,
  patientMemoError,
  patientMemoDirty,
  patientMemoUpdatedAt,
  onPatientMemoChange,
  onPatientMemoSave,
  onPatientMemoReset,
  patientMemoDisabled = false,
  hasPatientMemoHistory,
  onPatientMemoHistoryOpen,
  freeDocumentComment,
  freeDocumentStatus,
  freeDocumentError,
  freeDocumentDirty,
  freeDocumentUpdatedAt,
  onFreeDocumentChange,
  onFreeDocumentSave,
  onFreeDocumentReset,
  freeDocumentDisabled = false,
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
      <EditorCard aria-labelledby="visit-memo-heading">
        <EditorHeader>
          <SectionTitle id="visit-memo-heading">問診メモ（受付共有）</SectionTitle>
          <HelperText>受付と診察端末で共有される主訴メモです。保存すると ChartEvent 経由で即時同期されます。</HelperText>
        </EditorHeader>
        <TextArea
          label="主訴 / 受付メモ"
          value={visitMemo}
          onChange={(event) => onVisitMemoChange(event.currentTarget.value)}
          placeholder="例：動悸がする、発熱 38.5℃"
          rows={4}
          disabled={visitMemoDisabled}
        />
        <EditorFooter>
          <StatusText $tone={visitMemoError ? 'danger' : visitMemoStatus === 'saved' ? 'success' : 'muted'}>
            {visitMemoError
              ? visitMemoError
              : visitMemoStatus === 'saving'
                ? '保存中…'
                : visitMemoStatus === 'saved'
                  ? '保存しました'
                  : visitMemoDirty
                    ? '未保存の変更があります'
                    : '受付共有メモは未入力でも保存できます'}
          </StatusText>
          <EditorActions>
            <Button
              type="button"
              variant="ghost"
              onClick={onVisitMemoReset}
              disabled={visitMemoDisabled || visitMemoStatus === 'saving' || !visitMemoDirty}
            >
              取り消し
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onVisitMemoSave}
              disabled={
                visitMemoDisabled ||
                visitMemoStatus === 'saving' ||
                (!visitMemoDirty && visitMemoStatus !== 'error')
              }
            >
              保存
            </Button>
          </EditorActions>
        </EditorFooter>
      </EditorCard>

      <EditorCard aria-labelledby="patient-memo-heading">
        <EditorHeader>
          <EditorHeaderTop>
            <SectionTitle id="patient-memo-heading">患者メモ（院内共有）</SectionTitle>
            {hasPatientMemoHistory ? (
              <EditorHeaderActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onPatientMemoHistoryOpen}
                  disabled={patientMemoDisabled}
                >
                  履歴
                </Button>
              </EditorHeaderActions>
            ) : null}
          </EditorHeaderTop>
          <HelperText>カルテ全体の注意事項を記録します。保存すると既存オンプレクライアントと共用されます。</HelperText>
        </EditorHeader>
        <TextArea
          label="患者メモ"
          value={patientMemo}
          onChange={(event) => onPatientMemoChange(event.currentTarget.value)}
          placeholder="例：ペニシリンアレルギーあり / 感染症対策のため個室対応"
          rows={5}
          disabled={patientMemoDisabled}
        />
        <EditorFooter>
          <StatusText $tone={patientMemoError ? 'danger' : patientMemoStatus === 'saved' ? 'success' : 'muted'}>
            {patientMemoError
              ? patientMemoError
              : patientMemoStatus === 'saving'
                ? '保存中…'
                : patientMemoStatus === 'saved'
                  ? '保存しました'
                  : patientMemoDirty
                    ? '未保存の変更があります'
                    : patientMemoUpdatedAt
                      ? `最終更新: ${formatUpdatedAt(patientMemoUpdatedAt)}`
                      : '最初の保存で患者メモが作成されます'}
          </StatusText>
          <EditorActions>
            <Button
              type="button"
              variant="ghost"
              onClick={onPatientMemoReset}
              disabled={patientMemoDisabled || patientMemoStatus === 'saving' || !patientMemoDirty}
            >
              取り消し
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onPatientMemoSave}
              disabled={
                patientMemoDisabled ||
                patientMemoStatus === 'saving' ||
                (!patientMemoDirty && patientMemoStatus !== 'error')
              }
            >
              保存
            </Button>
          </EditorActions>
        </EditorFooter>
      </EditorCard>

      <EditorCard aria-labelledby="free-document-heading">
        <EditorHeader>
          <SectionTitle id="free-document-heading">サマリ文書（FreeDocument）</SectionTitle>
          <HelperText>診療経過の要約を保存します。オンプレ版クライアントと同じサマリ文書を更新します。</HelperText>
        </EditorHeader>
        <TextArea
          label="サマリ本文"
          value={freeDocumentComment}
          onChange={(event) => onFreeDocumentChange(event.currentTarget.value)}
          placeholder="例：診断の経緯、今後のフォロー方針などを記録"
          rows={6}
          disabled={freeDocumentDisabled}
        />
        <EditorFooter>
          <StatusText $tone={freeDocumentError ? 'danger' : freeDocumentStatus === 'saved' ? 'success' : 'muted'}>
            {freeDocumentError
              ? freeDocumentError
              : freeDocumentStatus === 'saving'
                ? '保存中…'
                : freeDocumentStatus === 'saved'
                  ? '保存しました'
                  : freeDocumentDirty
                    ? '未保存の変更があります'
                    : freeDocumentUpdatedAt
                      ? `最終更新: ${formatUpdatedAt(freeDocumentUpdatedAt)}`
                      : '最初の保存でサマリ文書が作成されます'}
          </StatusText>
          <EditorActions>
            <Button
              type="button"
              variant="ghost"
              onClick={onFreeDocumentReset}
              disabled={freeDocumentDisabled || freeDocumentStatus === 'saving' || !freeDocumentDirty}
            >
              取り消し
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onFreeDocumentSave}
              disabled={
                freeDocumentDisabled ||
                freeDocumentStatus === 'saving' ||
                (!freeDocumentDirty && freeDocumentStatus !== 'error')
              }
            >
              保存
            </Button>
          </EditorActions>
        </EditorFooter>
      </EditorCard>

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
        {mediaLoading ? (
          <MediaNotice>画像・添付を読み込んでいます…</MediaNotice>
        ) : mediaError ? (
          <MediaNotice $tone="danger">画像・添付の取得に失敗しました。再読み込みしてください。</MediaNotice>
        ) : mediaItems.length === 0 ? (
          <MediaNotice>画像・添付はまだありません。検査取り込みやカルテ添付から追加できます。</MediaNotice>
        ) : (
          <MediaGrid>
            {mediaItems.map((media) => {
              const timestamp = formatMediaTimestamp(media.capturedAt);
              const sizeLabel = formatMediaSize(media.size);
              const documentLabel = media.documentTitle && media.documentTitle !== media.title ? media.documentTitle : null;
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
