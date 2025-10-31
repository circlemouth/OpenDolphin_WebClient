import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard, TextField } from '@/components';
import { useDocInfos, useDocumentDetail } from '@/features/charts/hooks/useDocInfos';
import { updateDocumentTitle } from '@/features/charts/api/doc-info-api';
import type { DocInfoSummary, DocumentModelPayload } from '@/features/charts/types/doc';

type DocumentTimelinePanelProps = {
  karteId: number | null;
  fromDate: string;
  includeModified?: boolean;
  onDocumentSelected?: (document: DocumentModelPayload | null) => void;
  onDocInfosLoaded?: (documents: DocInfoSummary[]) => void;
  onEditDocument?: (document: DocumentModelPayload) => void;
};

type StatusTone = 'info' | 'warning' | 'danger' | 'muted';

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

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
`;

const DocumentItem = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ theme, $selected }) => ($selected ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $selected }) =>
    $selected ? theme.palette.surfaceStrong : theme.palette.surfaceMuted};
  transition: border 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primaryStrong};
    box-shadow: ${({ theme }) => theme.elevation.level1};
  }
`;

const DocumentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const DocumentTitle = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
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

const InlineFeedback = styled.div<{ $tone: StatusTone }>`
  font-size: 0.85rem;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $tone }) => {
    switch ($tone) {
      case 'warning':
        return theme.palette.warningMuted ?? '#fef3c7';
      case 'danger':
        return theme.palette.dangerMuted ?? '#fee2e2';
      case 'muted':
        return theme.palette.surfaceMuted;
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
      case 'muted':
        return theme.palette.textMuted;
      default:
        return theme.palette.text;
    }
  }};
  border: 1px solid
    ${({ theme, $tone }) => {
      switch ($tone) {
        case 'warning':
          return theme.palette.warning ?? '#f59e0b';
        case 'danger':
          return theme.palette.danger ?? '#f87171';
        case 'muted':
          return theme.palette.border;
        default:
          return theme.palette.border;
      }
    }};
`;

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '---';
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getStatusTone = (status?: string | null): StatusTone => {
  if (!status) {
    return 'muted';
  }
  const normalized = status.toUpperCase();
  if (normalized === 'F') {
    return 'info';
  }
  if (normalized === 'M') {
    return 'warning';
  }
  if (normalized === 'D') {
    return 'danger';
  }
  return 'muted';
};

const filterDocuments = (documents: DocInfoSummary[], keyword: string): DocInfoSummary[] => {
  if (!keyword) {
    return documents;
  }
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) {
    return documents;
  }
  return documents.filter((doc) => {
    const haystack = [
      doc.title,
      doc.docType,
      doc.departmentDesc,
      doc.status,
      doc.docId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalized);
  });
};

export const DocumentTimelinePanel = ({
  karteId,
  fromDate,
  includeModified = true,
  onDocumentSelected,
  onDocInfosLoaded,
}: DocumentTimelinePanelProps) => {
  const [keyword, setKeyword] = useState('');
  const [selectedDocPk, setSelectedDocPk] = useState<number | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameFeedback, setRenameFeedback] = useState<{ tone: 'info' | 'danger'; message: string } | null>(null);

  const docInfosQuery = useDocInfos({
    karteId,
    fromDate,
    includeModified,
    enabled: Boolean(karteId),
  });

  const detailQuery = useDocumentDetail(selectedDocPk, { enabled: Boolean(selectedDocPk) });
  const renameMutation = useMutation({
    mutationFn: async ({ docPk, title }: { docPk: number; title: string }) => updateDocumentTitle(docPk, title),
    onSuccess: () => {
      setRenameFeedback({ tone: 'info', message: 'タイトルを更新しました。' });
      void docInfosQuery.refetch();
      void detailQuery.refetch();
    },
    onError: (error: unknown) => {
      setRenameFeedback({
        tone: 'danger',
        message: error instanceof Error ? error.message : 'タイトルの更新に失敗しました。',
      });
    },
  });

  useEffect(() => {
    if (detailQuery.data && onDocumentSelected) {
      onDocumentSelected(detailQuery.data);
    }
  }, [detailQuery.data, onDocumentSelected]);

  useEffect(() => {
    if (!docInfosQuery.data || docInfosQuery.data.length === 0) {
      setSelectedDocPk(null);
      return;
    }
    if (selectedDocPk && docInfosQuery.data.some((doc) => doc.docPk === selectedDocPk)) {
      return;
    }
    setSelectedDocPk(docInfosQuery.data[0]?.docPk ?? null);
  }, [docInfosQuery.data, selectedDocPk]);

  const filteredDocs = useMemo(
    () => filterDocuments(docInfosQuery.data ?? [], keyword),
    [docInfosQuery.data, keyword],
  );

  useEffect(() => {
    if (onDocInfosLoaded) {
      onDocInfosLoaded(docInfosQuery.data ?? []);
    }
  }, [docInfosQuery.data, onDocInfosLoaded]);

  const handleSelect = (docPk: number) => {
    setSelectedDocPk(docPk);
  };

  return (
    <DocumentPanelCard>
      <PanelHeader>
        <h3>カルテタイムライン</h3>
        <p>カルテの確定履歴を一覧し、内容を素早く確認できます。</p>
      </PanelHeader>
      <ToolbarRow>
        <TextField
          label="検索"
          placeholder="カルテ名・診療科・ステータスで絞り込み"
          value={keyword}
          onChange={(event) => setKeyword(event.currentTarget.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setKeyword('');
            void docInfosQuery.refetch();
          }}
          isLoading={docInfosQuery.isFetching}
        >
          更新
        </Button>
      </ToolbarRow>
      {docInfosQuery.isLoading ? (
        <InlineFeedback $tone="muted">カルテ一覧を読み込んでいます…</InlineFeedback>
      ) : docInfosQuery.error ? (
        <InlineFeedback $tone="danger">
          カルテ情報の取得に失敗しました。ネットワークと権限を確認してください。
        </InlineFeedback>
      ) : filteredDocs.length === 0 ? (
        <InlineFeedback $tone="muted">該当する文書がありません。</InlineFeedback>
      ) : (
        <ListContainer role="list">
          {filteredDocs.map((doc) => {
            const isSelected = doc.docPk === selectedDocPk;
            const tone = getStatusTone(doc.status);
            return (
              <DocumentItem
                key={doc.docPk}
                type="button"
                $selected={isSelected}
                onClick={() => handleSelect(doc.docPk)}
                role="listitem"
                aria-pressed={isSelected}
              >
                <DocumentMeta>
                  <StatusBadge tone={tone === 'muted' ? 'info' : tone}>
                    {doc.status ?? '---'}
                  </StatusBadge>
                  <span>{formatDateTime(doc.confirmDate ?? doc.firstConfirmDate ?? undefined)}</span>
                  {doc.departmentDesc ? <span>{doc.departmentDesc}</span> : null}
                  {doc.docType ? <span>{doc.docType}</span> : null}
                </DocumentMeta>
                <DocumentTitle>{doc.title || '無題のカルテ'}</DocumentTitle>
              </DocumentItem>
            );
          })}
        </ListContainer>
      )}

      <DetailCard aria-live="polite">
        <DetailSection>
          <DetailHeading>カルテ詳細</DetailHeading>
          {detailQuery.isLoading ? (
            <InlineFeedback $tone="muted">カルテ詳細を読み込んでいます…</InlineFeedback>
          ) : !selectedDocPk ? (
            <InlineFeedback $tone="muted">カルテを選択すると詳細を表示します。</InlineFeedback>
          ) : detailQuery.error ? (
            <InlineFeedback $tone="danger">カルテ詳細の取得に失敗しました。</InlineFeedback>
          ) : detailQuery.data ? (
            <>
              <DetailList>
                <li>
                  <strong>タイトル:</strong> {detailQuery.data.docInfoModel?.title ?? '---'}
                </li>
                <li>
                  <strong>確定日時:</strong>{' '}
                  {formatDateTime(detailQuery.data.docInfoModel?.confirmDate)}
                </li>
                <li>
                  <strong>ステータス:</strong> {detailQuery.data.status ?? '---'}
                </li>
                <li>
                  <strong>作成者:</strong>{' '}
                  {detailQuery.data.docInfoModel.creatorLicense ??
                    detailQuery.data.docInfoModel.departmentDesc ??
                    '---'}
                </li>
                <li>
                  <strong>請求送信:</strong>{' '}
                  {detailQuery.data.docInfoModel?.sendClaim ? '送信あり' : '未送信'}
                </li>
              </DetailList>
              <DetailSection>
                <DetailHeading>タイトル編集</DetailHeading>
                <TextField
                  label="タイトル"
                  value={renameTitle}
                  onChange={(event) => {
                    setRenameTitle(event.currentTarget.value);
                    setRenameFeedback(null);
                  }}
                  disabled={!detailQuery.data}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRenameTitle(detailQuery.data?.docInfoModel?.title ?? '');
                      setRenameFeedback(null);
                    }}
                    disabled={!detailQuery.data}
                  >
                    リセット
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleRename}
                    disabled={!selectedDocPk || renameMutation.isPending}
                    isLoading={renameMutation.isPending}
                  >
                    更新
                  </Button>
                </div>
                {renameFeedback ? (
                  <InlineFeedback $tone={renameFeedback.tone}>{renameFeedback.message}</InlineFeedback>
                ) : null}
              </DetailSection>
              <DetailSection>
                <DetailHeading>モジュール</DetailHeading>
                {detailQuery.data.modules && detailQuery.data.modules.length > 0 ? (
                  <DetailList>
                    {detailQuery.data.modules.slice(0, 5).map((module, index) => (
                      <li key={`${detailQuery.data!.id}-module-${index}`}>
                        {module.moduleInfoBean?.stampName ?? module.moduleInfoBean?.stampRole ?? 'スタンプ'}{' '}
                        ({module.moduleInfoBean?.entity ?? 'entity'})
                      </li>
                    ))}
                    {detailQuery.data.modules.length > 5 ? (
                      <li>…ほか {detailQuery.data.modules.length - 5} 件</li>
                    ) : null}
                  </DetailList>
                ) : (
                  <InlineFeedback $tone="muted">モジュール情報はありません。</InlineFeedback>
                )}
              </DetailSection>
              <DetailSection>
                <DetailHeading>添付ファイル</DetailHeading>
                {detailQuery.data.attachment && detailQuery.data.attachment.length > 0 ? (
                  <DetailList>
                    {detailQuery.data.attachment.slice(0, 5).map((attachment) => (
                      <li key={`${detailQuery.data!.id}-attachment-${attachment.id}`}>
                        {attachment.title ?? attachment.fileName ?? '添付ファイル'}
                      </li>
                    ))}
                    {detailQuery.data.attachment.length > 5 ? (
                      <li>…ほか {detailQuery.data.attachment.length - 5} 件</li>
                    ) : null}
                  </DetailList>
                ) : (
                  <InlineFeedback $tone="muted">添付ファイルはありません。</InlineFeedback>
                )}
              </DetailSection>
            </>
          ) : (
            <InlineFeedback $tone="muted">詳細情報が見つかりませんでした。</InlineFeedback>
          )}
        </DetailSection>
      </DetailCard>
    </DocumentPanelCard>
  );
};












