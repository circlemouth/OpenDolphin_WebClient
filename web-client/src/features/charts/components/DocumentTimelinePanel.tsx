import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard, TextField } from '@/components';
import { updateDocumentTitle } from '@/features/charts/api/doc-info-api';
import { useDocumentDetail } from '@/features/charts/hooks/useDocInfos';
import {
  deriveActiveCategories,
  formatDateTime,
  getStatusTone,
  resolveErrorMessage,
} from '@/features/charts/components/document-timeline-utils';
import {
  MetadataBadge,
  MetadataBadgeRow,
} from '@/features/charts/components/shared/MetadataBadges';
import {
  TIMELINE_EVENT_CATEGORIES,
  TIMELINE_EVENT_META,
  filterTimelineEvents,
  type TimelineEvent,
  type TimelineEventCategory,
  type TimelineEventCategoryMeta,
  type TimelineEventPayload,
} from '@/features/charts/utils/timeline-events';
import type { DocumentModelPayload } from '@/features/charts/types/doc';
import type { PaletteToken } from '@/styles/theme';

type VisitEventPayload = Extract<TimelineEventPayload, { kind: 'visit' }>;
type LabEventPayload = Extract<TimelineEventPayload, { kind: 'lab' }>;
type OrderEventPayload = Extract<TimelineEventPayload, { kind: 'order' }>;

type FeedbackTone = 'info' | 'warning' | 'danger' | 'neutral';

type DocumentTimelinePanelProps = {
  events: TimelineEvent[];
  categories?: TimelineEventCategoryMeta[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRefresh?: () => void;
  onDocumentSelected?: (document: DocumentModelPayload | null) => void;
  onVisitEventSelected?: (payload: VisitEventPayload, event: TimelineEvent) => void;
  onLabEventSelected?: (payload: LabEventPayload, event: TimelineEvent) => void;
  onOrderEventSelected?: (payload: OrderEventPayload, event: TimelineEvent) => void;
  onEditDocument?: (document: DocumentModelPayload) => void;
};

const DocumentPanelCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h3 {
    margin: 0;
    font-size: 1.05rem;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const FilterButton = styled.button<{ $active: boolean; $color: PaletteToken }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme, $active, $color }) => ($active ? theme.palette[$color] : theme.palette.border)};
  background: ${({ theme, $active }) => ($active ? theme.palette.surfaceStrong : theme.palette.surfaceMuted)};
  color: ${({ theme, $active, $color }) => ($active ? theme.palette[$color] : theme.palette.textMuted)};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: border 0.2s ease, background 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: ${({ theme, $color }) => theme.palette[$color]};
    color: ${({ theme, $color }) => theme.palette[$color]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme, $color }) => theme.palette[$color]};
    outline-offset: 2px;
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
`;

const TimelineItem = styled.button<{ $selected: boolean }>`
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme, $selected }) => ($selected ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $selected }) => ($selected ? theme.palette.surfaceStrong : theme.palette.surfaceMuted)};
  transition: border 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primaryStrong};
    box-shadow: ${({ theme }) => theme.elevation.level1};
  }
`;

const EventIcon = styled.span<{ $color: PaletteToken }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid ${({ theme, $color }) => theme.palette[$color]};
  color: ${({ theme, $color }) => theme.palette[$color]};
  font-size: 0.85rem;
  font-weight: 600;
`;

const TimelineContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
`;

const TimelineHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const TimelineTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
  font-size: 0.95rem;
`;

const TimelineSubtitle = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const TimelineDescription = styled.div`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.palette.textMuted};
  line-height: 1.5;
`;

const DetailCard = styled.div`
  border: 1px dashed ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 16px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DetailHeading = styled.h4`
  margin: 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text};
`;

const DetailList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: ${({ theme }) => theme.palette.text};
`;

const InlineFeedback = styled.div<{ $tone: FeedbackTone }>`
  font-size: 0.85rem;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $tone }) => {
    switch ($tone) {
      case 'warning':
        return theme.palette.warningMuted ?? '#fef3c7';
      case 'danger':
        return theme.palette.dangerMuted ?? '#fee2e2';
      case 'info':
        return theme.palette.surfaceStrong;
      default:
        return theme.palette.surfaceMuted;
    }
  }};
  color: ${({ theme, $tone }) => {
    switch ($tone) {
      case 'warning':
        return theme.palette.warning ?? '#b45309';
      case 'danger':
        return theme.palette.danger ?? '#b91c1c';
      case 'info':
        return theme.palette.primaryStrong;
      default:
        return theme.palette.textMuted;
    }
  }};
  border: 1px solid
    ${({ theme, $tone }) => {
      switch ($tone) {
        case 'warning':
          return theme.palette.warning ?? '#f59e0b';
        case 'danger':
          return theme.palette.danger ?? '#f87171';
        case 'info':
          return theme.palette.primary ?? '#1d3d5e';
        default:
          return theme.palette.border;
      }
    }};
`;

export const DocumentTimelinePanel = ({
  events,
  categories = TIMELINE_EVENT_CATEGORIES,
  isLoading,
  isFetching,
  error,
  onRefresh,
  onDocumentSelected,
  onVisitEventSelected,
  onLabEventSelected,
  onOrderEventSelected,
  onEditDocument,
}: DocumentTimelinePanelProps) => {
  const [keyword, setKeyword] = useState('');
  const [activeCategories, setActiveCategories] = useState<TimelineEventCategory[]>(categories.map((category) => category.id));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameFeedback, setRenameFeedback] = useState<{ tone: 'info' | 'danger'; message: string } | null>(null);
  const emittedEventIdRef = useRef<string | null>(null);
  const documentSelectionCallbackRef = useRef<DocumentTimelinePanelProps['onDocumentSelected'] | null>(null);
  const lastDocumentEventIdRef = useRef<string | null>(null);
  const lastDocumentDataVersionRef = useRef<number | null>(null);

  useEffect(() => {
    documentSelectionCallbackRef.current = onDocumentSelected;
  }, [onDocumentSelected]);

  useEffect(() => {
    setActiveCategories((prev) => {
      const next = deriveActiveCategories(prev, categories);
      return next ?? prev;
    });
  }, [categories]);

  const categoryMap = useMemo(() => {
    const map = new Map<TimelineEventCategory, TimelineEventCategoryMeta>();
    categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [categories]);

  const filteredEvents = useMemo(
    () => filterTimelineEvents(events, { categories: new Set(activeCategories), keyword }),
    [events, activeCategories, keyword],
  );

  useEffect(() => {
    if (filteredEvents.length === 0) {
      setSelectedEventId(null);
      return;
    }
    if (!selectedEventId || !filteredEvents.some((item) => item.id === selectedEventId)) {
      setSelectedEventId(filteredEvents[0]?.id ?? null);
    }
  }, [filteredEvents, selectedEventId]);

  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((event) => event.id === selectedEventId) ?? null : null),
    [events, selectedEventId],
  );

  const selectedDocumentPk = selectedEvent?.payload.kind === 'document' ? selectedEvent.payload.docPk : null;

  const detailQuery = useDocumentDetail(selectedDocumentPk, { enabled: Boolean(selectedDocumentPk) });

  const renameMutation = useMutation({
    mutationFn: async ({ docPk, title }: { docPk: number; title: string }) => updateDocumentTitle(docPk, title),
    onSuccess: () => {
      setRenameFeedback({ tone: 'info', message: 'タイトルを更新しました。' });
      void detailQuery.refetch();
      if (onRefresh) {
        void onRefresh();
      }
    },
    onError: (mutationError: unknown) => {
      setRenameFeedback({
        tone: 'danger',
        message: mutationError instanceof Error ? mutationError.message : 'タイトルの更新に失敗しました。',
      });
    },
  });

  useEffect(() => {
    const emitDocumentSelection = documentSelectionCallbackRef.current;
    if (!selectedEvent || selectedEvent.payload.kind !== 'document') {
      if (lastDocumentEventIdRef.current !== null) {
        emitDocumentSelection?.(null);
      }
      lastDocumentEventIdRef.current = null;
      lastDocumentDataVersionRef.current = null;
      setRenameTitle((prev) => (prev === '' ? prev : ''));
      return;
    }

    if (!detailQuery.data) {
      return;
    }

    const currentEventId = selectedEvent.id;
    const currentDataVersion = detailQuery.dataUpdatedAt ?? null;

    if (
      lastDocumentEventIdRef.current === currentEventId &&
      lastDocumentDataVersionRef.current === currentDataVersion
    ) {
      return;
    }

    lastDocumentEventIdRef.current = currentEventId;
    lastDocumentDataVersionRef.current = currentDataVersion;

    const nextTitle = detailQuery.data.docInfoModel?.title ?? '';
    setRenameTitle((prev) => (prev === nextTitle ? prev : nextTitle));
    emitDocumentSelection?.(detailQuery.data);
  }, [detailQuery.data, detailQuery.dataUpdatedAt, selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) {
      emittedEventIdRef.current = null;
      return;
    }
    if (emittedEventIdRef.current === selectedEvent.id) {
      return;
    }
    emittedEventIdRef.current = selectedEvent.id;
    switch (selectedEvent.payload.kind) {
      case 'visit':
        onVisitEventSelected?.(selectedEvent.payload, selectedEvent);
        break;
      case 'lab':
        onLabEventSelected?.(selectedEvent.payload, selectedEvent);
        break;
      case 'order':
        onOrderEventSelected?.(selectedEvent.payload, selectedEvent);
        break;
      default:
        break;
    }
  }, [onLabEventSelected, onOrderEventSelected, onVisitEventSelected, selectedEvent]);

  const handleToggleCategory = (category: TimelineEventCategory) => {
    setActiveCategories((prev) => {
      if (prev.includes(category)) {
        const next = prev.filter((value) => value !== category);
        return next.length === 0 ? prev : next;
      }
      return [...prev, category];
    });
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setRenameFeedback(null);
  };

  const handleRename = useCallback(() => {
    if (!selectedDocumentPk) {
      return;
    }
    const trimmed = renameTitle.trim();
    if (!trimmed) {
      setRenameFeedback({ tone: 'danger', message: 'タイトルを入力してください。' });
      return;
    }
    renameMutation.mutate({ docPk: selectedDocumentPk, title: trimmed });
  }, [renameMutation, renameTitle, selectedDocumentPk]);

  const selectedDocumentDetail = detailQuery.data;
  const visitPayload: VisitEventPayload | null =
    selectedEvent?.payload.kind === 'visit' ? selectedEvent.payload : null;
  const labPayload: LabEventPayload | null =
    selectedEvent?.payload.kind === 'lab' ? selectedEvent.payload : null;
  const orderPayload: OrderEventPayload | null =
    selectedEvent?.payload.kind === 'order' ? selectedEvent.payload : null;

  const renderDetailContent = () => {
    if (!selectedEvent) {
      return <InlineFeedback $tone="neutral">イベントを選択すると詳細を表示します。</InlineFeedback>;
    }

    if (selectedEvent.payload.kind === 'document') {
      if (detailQuery.isLoading) {
        return <InlineFeedback $tone="neutral">カルテ詳細を読み込んでいます…</InlineFeedback>;
      }
      if (detailQuery.error) {
        return (
          <InlineFeedback $tone="danger" role="alert" aria-live="assertive">
            {resolveErrorMessage(detailQuery.error)}
          </InlineFeedback>
        );
      }
      if (!selectedDocumentDetail) {
        return <InlineFeedback $tone="neutral">カルテ詳細が見つかりませんでした。</InlineFeedback>;
      }
      return (
        <>
          <MetadataBadgeRow>
            <MetadataBadge $tone={getStatusTone(selectedDocumentDetail.docInfoModel?.status)}>
              ステータス: {selectedDocumentDetail.docInfoModel?.status ?? '---'}
            </MetadataBadge>
            <MetadataBadge>文書ID: {selectedDocumentDetail.docInfoModel?.docId}</MetadataBadge>
            <MetadataBadge>バージョン: {selectedDocumentDetail.docInfoModel?.versionNumber ?? '―'}</MetadataBadge>
            <MetadataBadge $tone="info">
              確定: {formatDateTime(selectedDocumentDetail.docInfoModel?.confirmDate ?? selectedDocumentDetail.docInfoModel?.firstConfirmDate ?? null)}
            </MetadataBadge>
            <MetadataBadge $tone="info">
              更新: {formatDateTime(selectedDocumentDetail.docInfoModel?.updatedAt ?? selectedDocumentDetail.docInfoModel?.recordedAt ?? null)}
            </MetadataBadge>
            <MetadataBadge $tone={selectedDocumentDetail.docInfoModel?.sendClaim ? 'info' : 'warning'}>
              CLAIM: {selectedDocumentDetail.docInfoModel?.sendClaim ? '送信済み' : '未送信'}
            </MetadataBadge>
          </MetadataBadgeRow>
          <DetailSection>
            <DetailHeading>カルテ基本情報</DetailHeading>
            <DetailList>
              <li>
                <strong>タイトル:</strong> {selectedDocumentDetail.docInfoModel?.title ?? '---'}
              </li>
              <li>
                <strong>確定日時:</strong> {formatDateTime(selectedDocumentDetail.docInfoModel?.confirmDate)}
              </li>
              <li>
                <strong>ステータス:</strong> {selectedDocumentDetail.status ?? '---'}
              </li>
              <li>
                <strong>診療科:</strong> {selectedEvent.badge ?? '---'}
              </li>
              <li>
                <strong>目的:</strong> {selectedDocumentDetail.docInfoModel?.purposeDesc ?? '---'}
              </li>
            </DetailList>
            {onEditDocument ? (
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => onEditDocument(selectedDocumentDetail)}
                >
                  編集
                </Button>
              </div>
            ) : null}
          </DetailSection>
          <DetailSection>
            <DetailHeading>タイトル編集</DetailHeading>
            <TextField
              label="タイトル"
              value={renameTitle}
              onChange={(event) => {
                setRenameTitle(event.currentTarget.value);
                setRenameFeedback(null);
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRenameTitle(selectedDocumentDetail.docInfoModel?.title ?? '');
                  setRenameFeedback(null);
                }}
              >
                リセット
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleRename}
                disabled={renameMutation.isPending}
                isLoading={renameMutation.isPending}
              >
                更新
              </Button>
            </div>
            {renameFeedback ? (
              <InlineFeedback
                $tone={renameFeedback.tone}
                role={renameFeedback.tone === 'danger' ? 'alert' : undefined}
                aria-live={renameFeedback.tone === 'danger' ? 'assertive' : 'polite'}
              >
                {renameFeedback.message}
              </InlineFeedback>
            ) : null}
          </DetailSection>
          <DetailSection>
            <DetailHeading>モジュール</DetailHeading>
            {selectedDocumentDetail.modules && selectedDocumentDetail.modules.length > 0 ? (
              <DetailList>
                {selectedDocumentDetail.modules.slice(0, 5).map((module, index) => (
                  <li key={`${selectedDocumentDetail.id}-module-${index}`}>
                    {module.moduleInfoBean?.stampName ?? module.moduleInfoBean?.stampRole ?? 'スタンプ'} (
                    {module.moduleInfoBean?.entity ?? 'entity'})
                  </li>
                ))}
                {selectedDocumentDetail.modules.length > 5 ? (
                  <li>…ほか {selectedDocumentDetail.modules.length - 5} 件</li>
                ) : null}
              </DetailList>
            ) : (
              <InlineFeedback $tone="neutral">モジュール情報はありません。</InlineFeedback>
            )}
          </DetailSection>
          <DetailSection>
            <DetailHeading>添付ファイル</DetailHeading>
            {selectedDocumentDetail.attachment && selectedDocumentDetail.attachment.length > 0 ? (
              <DetailList>
                {selectedDocumentDetail.attachment.slice(0, 5).map((attachment) => (
                  <li key={`${selectedDocumentDetail.id}-attachment-${attachment.id}`}>
                    {attachment.title ?? attachment.fileName ?? '添付ファイル'}
                  </li>
                ))}
                {selectedDocumentDetail.attachment.length > 5 ? (
                  <li>…ほか {selectedDocumentDetail.attachment.length - 5} 件</li>
                ) : null}
              </DetailList>
            ) : (
              <InlineFeedback $tone="neutral">添付ファイルはありません。</InlineFeedback>
            )}
          </DetailSection>
        </>
      );
    }

    if (selectedEvent.payload.kind === 'lab' && labPayload) {
      return (
        <>
          <DetailSection>
            <DetailHeading>検査概要</DetailHeading>
            <DetailList>
              <li>
                <strong>採取日時:</strong> {formatDateTime(labPayload.sampleDate ?? null)}
              </li>
              <li>
                <strong>異常件数:</strong> {labPayload.abnormalCount} 件
              </li>
            </DetailList>
          </DetailSection>
          <DetailSection>
            <DetailHeading>主な項目</DetailHeading>
            {labPayload.topItems.length > 0 ? (
              <DetailList>
                {labPayload.topItems.map((item, index) => (
                  <li key={`lab-item-${index}`}>
                    {item.name}: {item.value}
                    {item.unit ? ` ${item.unit}` : ''}
                  </li>
                ))}
              </DetailList>
            ) : (
              <InlineFeedback $tone="neutral">表示できる検査項目がありません。</InlineFeedback>
            )}
            <InlineFeedback $tone="info">選択すると中央カラムの検査参照が更新されます。</InlineFeedback>
          </DetailSection>
        </>
      );
    }

    if (selectedEvent.payload.kind === 'order' && orderPayload) {
      return (
        <>
          <DetailSection>
            <DetailHeading>オーダ概要</DetailHeading>
            <DetailList>
              <li>
                <strong>カテゴリ:</strong> {selectedEvent.subtitle ?? 'オーダ'}
              </li>
              <li>
                <strong>概要:</strong> {orderPayload.summary}
              </li>
              {orderPayload.detail ? (
                <li>
                  <strong>詳細:</strong> {orderPayload.detail}
                </li>
              ) : null}
            </DetailList>
            <InlineFeedback $tone="info">選択すると Plan にドラフトを挿入します。</InlineFeedback>
          </DetailSection>
        </>
      );
    }

    if (selectedEvent.payload.kind === 'visit' && visitPayload) {
      return (
        <>
          <DetailSection>
            <DetailHeading>来院情報</DetailHeading>
            <DetailList>
              <li>
                <strong>日時:</strong> {formatDateTime(selectedEvent.occurredAt)}
              </li>
              <li>
                <strong>診療科:</strong> {visitPayload.department ?? '---'}
              </li>
              <li>
                <strong>担当医:</strong> {visitPayload.doctor ?? '---'}
              </li>
              <li>
                <strong>ステータス:</strong> {visitPayload.state}
              </li>
            </DetailList>
            {selectedEvent.description ? (
              <InlineFeedback $tone="neutral">{selectedEvent.description}</InlineFeedback>
            ) : null}
            <InlineFeedback $tone="info">来院イベントは参考表示のみで、自動操作はありません。</InlineFeedback>
          </DetailSection>
        </>
      );
    }

    return <InlineFeedback $tone="neutral">イベント詳細が見つかりませんでした。</InlineFeedback>;
  };

  return (
    <DocumentPanelCard>
      <PanelHeader>
        <h3>イベントタイムライン</h3>
        <p>カルテ・来院・検査・オーダを横断的に検索し、中央カラムと連携します。</p>
      </PanelHeader>
      <ToolbarRow>
        <TextField
          label="検索"
          placeholder="タイトル・診療科・検査項目などで絞り込み"
          value={keyword}
          onChange={(event) => setKeyword(event.currentTarget.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setKeyword('');
            if (onRefresh) {
              void onRefresh();
            }
          }}
          isLoading={isFetching}
        >
          更新
        </Button>
      </ToolbarRow>
      <FilterGroup>
        {categories.map((category) => (
          <FilterButton
            key={category.id}
            type="button"
            $active={activeCategories.includes(category.id)}
            $color={category.color}
            onClick={() => handleToggleCategory(category.id)}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </FilterButton>
        ))}
      </FilterGroup>
      {isLoading ? (
        <InlineFeedback $tone="neutral">イベントを読み込んでいます…</InlineFeedback>
      ) : error ? (
        <InlineFeedback $tone="danger" role="alert" aria-live="assertive">
          {resolveErrorMessage(error)}
        </InlineFeedback>
      ) : filteredEvents.length === 0 ? (
        <InlineFeedback $tone="neutral">該当するイベントがありません。</InlineFeedback>
      ) : (
        <ListContainer role="list">
          {filteredEvents.map((event) => {
            const isSelected = event.id === selectedEventId;
            const meta = categoryMap.get(event.type) ?? TIMELINE_EVENT_META[event.type];
            const badgeTone =
              event.payload.kind === 'document'
                ? getStatusTone(event.payload.status)
                : event.payload.kind === 'lab' && event.payload.abnormalCount > 0
                  ? 'warning'
                  : 'neutral';
            const statusLabel =
              event.payload.kind === 'document'
                ? event.payload.status ?? '---'
                : event.payload.kind === 'lab' && event.payload.abnormalCount > 0
                  ? '要確認'
                  : event.payload.kind === 'visit'
                    ? `状態 ${event.payload.state}`
                    : event.badge ?? null;

            return (
              <TimelineItem
                key={event.id}
                type="button"
                $selected={isSelected}
                onClick={() => handleSelectEvent(event.id)}
                role="listitem"
                aria-pressed={isSelected}
              >
                <EventIcon $color={meta.color}>{meta.icon}</EventIcon>
                <TimelineContent>
                  <TimelineHeaderRow>
                    <span>{formatDateTime(event.occurredAt)}</span>
                    {statusLabel ? <StatusBadge tone={badgeTone}>{statusLabel}</StatusBadge> : null}
                    {event.payload.kind === 'document' && event.badge ? <span>{event.badge}</span> : null}
                  </TimelineHeaderRow>
                  <TimelineTitle>{event.title}</TimelineTitle>
                  {event.subtitle ? <TimelineSubtitle>{event.subtitle}</TimelineSubtitle> : null}
                  {event.description ? <TimelineDescription>{event.description}</TimelineDescription> : null}
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </ListContainer>
      )}
      <DetailCard aria-live="polite">
        <DetailSection>
          <DetailHeading>イベント詳細</DetailHeading>
          {renderDetailContent()}
        </DetailSection>
      </DetailCard>
    </DocumentPanelCard>
  );
};
