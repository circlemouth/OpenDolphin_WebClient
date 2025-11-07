import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button } from '@/components';

export interface PatientMemoHistoryEntry {
  id: number;
  memo: string;
  confirmed: string | null;
  status?: string | null;
}

interface PatientMemoHistoryDialogProps {
  open: boolean;
  entries: PatientMemoHistoryEntry[];
  activeEntryId: number | null;
  onClose: () => void;
  onRestore: (entry: PatientMemoHistoryEntry) => void;
}

const Backdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(20, 31, 44, 0.4);
  display: ${({ $open }) => ($open ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 220;
`;

const Dialog = styled.div`
  width: min(760px, 92vw);
  max-height: 80vh;
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.elevation.level2};
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
`;

const DialogHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 0;
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.palette.text};
`;

const DialogBody = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(0, 1.4fr);
  gap: 16px;
  padding: 16px 24px 24px;
  overflow: hidden;
`;

const HistoryList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  max-height: 100%;
  overflow-y: auto;
`;

const HistoryItemButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: grid;
  gap: 4px;
  text-align: left;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme, $active }) =>
    $active ? theme.palette.accent : theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.text};
  padding: 10px 12px;
  cursor: pointer;
`;

const HistoryTimestamp = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const HistoryPreviewLine = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HistoryBadge = styled.span<{ $tone: 'current' | 'latest' | 'archived' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  border-radius: 999px;
  padding: 2px 8px;
  background: ${({ theme, $tone }) => {
    if ($tone === 'current') {
      return theme.palette.primary;
    }
    if ($tone === 'latest') {
      return theme.palette.surfaceStrong;
    }
    return theme.palette.surface;
  }};
  color: ${({ theme, $tone }) => ($tone === 'archived' ? theme.palette.textMuted : '#ffffff')};
`;

const PreviewPanel = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 8px;
  height: 100%;
`;

const PreviewMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const PreviewBody = styled.div`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  padding: 12px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text};
  min-height: 200px;
`;

const DialogFooter = styled.footer`
  padding: 16px 24px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '記録日時不明';
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return '記録日時不明';
  }
  return new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const PatientMemoHistoryDialog = ({
  open,
  entries,
  activeEntryId,
  onClose,
  onRestore,
}: PatientMemoHistoryDialogProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      return;
    }

    if (entries.length === 0) {
      setSelectedId(null);
      return;
    }

    const activeEntry = activeEntryId ? entries.find((entry) => entry.id === activeEntryId) : null;
    if (activeEntry) {
      setSelectedId(activeEntry.id);
      return;
    }

    setSelectedId(entries[0]?.id ?? null);
  }, [open, entries, activeEntryId]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  );

  const handleRestore = () => {
    if (!selectedEntry) {
      return;
    }
    onRestore(selectedEntry);
  };

  const renderBadgeTone = (entryId: number): 'current' | 'latest' | 'archived' => {
    if (activeEntryId && entryId === activeEntryId) {
      return 'current';
    }
    if (entries[0] && entryId === entries[0].id) {
      return 'latest';
    }
    return 'archived';
  };

  return (
    <Backdrop $open={open} onClick={onClose} role="dialog" aria-modal="true">
      <Dialog onClick={(event) => event.stopPropagation()} aria-label="患者メモの履歴">
        <DialogHeader>
          <DialogTitle>患者メモの履歴</DialogTitle>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            閉じる
          </Button>
        </DialogHeader>
        <DialogBody>
          <HistoryList>
            {entries.map((entry) => (
              <li key={entry.id}>
                <HistoryItemButton
                  type="button"
                  $active={entry.id === selectedId}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <HistoryTimestamp>{formatDateTime(entry.confirmed)}</HistoryTimestamp>
                  <HistoryPreviewLine>
                    {entry.memo ? entry.memo.split('\n')[0] : '（内容なし）'}
                  </HistoryPreviewLine>
                  <HistoryBadge $tone={renderBadgeTone(entry.id)}>
                    {activeEntryId && entry.id === activeEntryId
                      ? '現在のメモ'
                      : entries[0] && entry.id === entries[0].id
                        ? '最新保存'
                        : '過去バージョン'}
                  </HistoryBadge>
                </HistoryItemButton>
              </li>
            ))}
            {entries.length === 0 ? (
              <li style={{ fontSize: '0.85rem', color: '#6b7280', padding: '8px 4px' }}>
                保存済みの履歴がまだありません。
              </li>
            ) : null}
          </HistoryList>
          <PreviewPanel>
            <PreviewMeta>
              {selectedEntry ? (
                <>
                  <span>{formatDateTime(selectedEntry.confirmed)}</span>
                  <span>
                    {selectedEntry.memo.length > 0
                      ? `${selectedEntry.memo.length} 文字`
                      : '内容なし'}
                  </span>
                </>
              ) : (
                <span>履歴を選択すると内容が表示されます。</span>
              )}
            </PreviewMeta>
            <PreviewBody>
              {selectedEntry ? selectedEntry.memo || '（内容なし）' : '表示する履歴を左から選択してください。'}
            </PreviewBody>
          </PreviewPanel>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleRestore}
            disabled={!selectedEntry || selectedEntry.id === activeEntryId}
          >
            この内容をエディタに反映
          </Button>
        </DialogFooter>
      </Dialog>
    </Backdrop>
  );
};
