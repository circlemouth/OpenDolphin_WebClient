import styled from '@emotion/styled';

import { SurfaceCard } from '@/components';

interface MiniSummaryDockProps {
  summaryLines: string[];
  onExpand: () => void;
  onSnippetDragStart: (snippet: string) => void;
}

const DockCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
`;

const DockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const DockTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
`;

const DockBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ExpandButton = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.palette.primaryStrong};
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: background 0.2s ease, color 0.2s ease;

  &:hover,
  &:focus-visible {
    background: ${({ theme }) => theme.palette.surfaceMuted};
    outline: none;
  }
`;

const SummaryLine = styled.button`
  display: flex;
  align-items: flex-start;
  text-align: left;
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 10px 12px;
  cursor: grab;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.text};
  transition: border 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primary};
    box-shadow: ${({ theme }) => theme.elevation.level1};
  }
`;

const EmptyNotice = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

export const MiniSummaryDock = ({ summaryLines, onExpand, onSnippetDragStart }: MiniSummaryDockProps) => {
  return (
    <DockCard role="complementary" aria-label="ミニサマリ">
      <DockHeader>
        <DockTitle>前回サマリ</DockTitle>
        <ExpandButton type="button" onClick={onExpand}>
          展開
        </ExpandButton>
      </DockHeader>
      <DockBody>
        {summaryLines.length === 0 ? (
          <EmptyNotice>前回カルテの要約はありません。保存後に最新のサマリが表示されます。</EmptyNotice>
        ) : (
          summaryLines.map((line, index) => (
            <SummaryLine
              key={`${line}-${index}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', line);
                onSnippetDragStart(line);
              }}
              onClick={onExpand}
            >
              {line}
            </SummaryLine>
          ))
        )}
      </DockBody>
    </DockCard>
  );
};
