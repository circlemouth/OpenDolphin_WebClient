import { useEffect, useState } from 'react';
import styled from '@emotion/styled';

interface DiffMergeOverlayProps {
  open: boolean;
  title: string;
  currentParagraphs: string[];
  incomingParagraphs: string[];
  onMerge: (selected: string[]) => void;
  onClose: () => void;
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 20, 33, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 220;
`;

const Panel = styled.div`
  width: min(960px, 94vw);
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.elevation.level2};
  display: grid;
  grid-template-rows: auto 1fr auto;
  max-height: 90vh;
`;

const PanelHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  font-weight: 600;
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 16px 20px;
  overflow: auto;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ParagraphCard = styled.label<{ $selected: boolean }>`
  border: 2px solid ${({ theme, $selected }) => ($selected ? theme.palette.primary : theme.palette.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px;
  display: grid;
  gap: 6px;
  cursor: pointer;
  background: ${({ theme, $selected }) => ($selected ? theme.palette.accent : theme.palette.surface)};
`;

const Footer = styled.div`
  padding: 12px 20px;
  border-top: 1px solid ${({ theme }) => theme.palette.border};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  border: none;
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $primary }) => ($primary ? theme.palette.primary : theme.palette.surfaceMuted)};
  color: ${({ theme, $primary }) => ($primary ? '#ffffff' : theme.palette.text)};
  cursor: pointer;
`;

export const DiffMergeOverlay = ({
  open,
  title,
  currentParagraphs,
  incomingParagraphs,
  onMerge,
  onClose,
}: DiffMergeOverlayProps) => {
  const [selectedCurrent, setSelectedCurrent] = useState<string[]>([]);
  const [selectedIncoming, setSelectedIncoming] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedCurrent([]);
      setSelectedIncoming([]);
    }
  }, [open, title]);

  if (!open) {
    return null;
  }

  const toggleSelection = (value: string, current: boolean) => {
    if (current) {
      setSelectedCurrent((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
      );
      return;
    }
    setSelectedIncoming((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  return (
    <Backdrop role="dialog" aria-modal="true" onClick={onClose}>
      <Panel onClick={(event) => event.stopPropagation()}>
        <PanelHeader>{title}</PanelHeader>
        <Columns>
          <Column>
            <strong>現在の文書</strong>
            {currentParagraphs.map((paragraph) => (
              <ParagraphCard
                key={paragraph}
                $selected={selectedCurrent.includes(paragraph)}
              >
                <input
                  type="checkbox"
                  checked={selectedCurrent.includes(paragraph)}
                  onChange={() => toggleSelection(paragraph, true)}
                />
                <span>{paragraph}</span>
              </ParagraphCard>
            ))}
          </Column>
          <Column>
            <strong>取り込み候補</strong>
            {incomingParagraphs.map((paragraph) => (
              <ParagraphCard
                key={paragraph}
                $selected={selectedIncoming.includes(paragraph)}
              >
                <input
                  type="checkbox"
                  checked={selectedIncoming.includes(paragraph)}
                  onChange={() => toggleSelection(paragraph, false)}
                />
                <span>{paragraph}</span>
              </ParagraphCard>
            ))}
          </Column>
        </Columns>
        <Footer>
          <ActionButton type="button" onClick={onClose}>
            キャンセル
          </ActionButton>
          <ActionButton
            type="button"
            $primary
            onClick={() => onMerge([...selectedCurrent, ...selectedIncoming])}
          >
            選択した段落をマージ
          </ActionButton>
        </Footer>
      </Panel>
    </Backdrop>
  );
};
