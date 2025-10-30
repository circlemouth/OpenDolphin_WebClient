import { useState } from 'react';
import styled from '@emotion/styled';

interface MiniSummaryDockProps {
  summaryLines: string[];
  onExpand: () => void;
  onSnippetDragStart: (snippet: string) => void;
}

const DockContainer = styled.div<{ $hovered: boolean }>`
  position: fixed;
  right: 24px;
  bottom: 64px;
  width: ${({ $hovered }) => ($hovered ? '360px' : '320px')};
  height: ${({ $hovered }) => ($hovered ? '240px' : '210px')};
  background: ${({ theme }) => theme.palette.surface};
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.elevation.level1};
  transition: width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 90;
`;

const DockHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  font-size: 0.9rem;
  font-weight: 600;
`;

const DockBody = styled.div`
  flex: 1;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const SummaryLine = styled.button`
  text-align: left;
  border: none;
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 8px;
  cursor: grab;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.text};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.palette.border};
`;

export const MiniSummaryDock = ({ summaryLines, onExpand, onSnippetDragStart }: MiniSummaryDockProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <DockContainer
      $hovered={hovered}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="complementary"
      aria-label="ミニサマリ"
    >
      <DockHeader>
        <span>前回サマリ</span>
        <button
          type="button"
          onClick={onExpand}
          style={{ border: 'none', background: 'transparent', color: '#1d3d5e', cursor: 'pointer' }}
        >
          展開
        </button>
      </DockHeader>
      <DockBody>
        {summaryLines.length === 0 ? (
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            前回カルテのサマリがありません。カルテ保存後に要約が表示されます。
          </span>
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
    </DockContainer>
  );
};
