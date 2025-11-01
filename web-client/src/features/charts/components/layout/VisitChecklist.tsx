import styled from '@emotion/styled';
import type { SVGProps } from 'react';

export interface VisitChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  instantSave: boolean;
}

interface VisitChecklistProps {
  items: VisitChecklistItem[];
  onToggleCompleted: (id: string) => void;
  onToggleInstantSave: (id: string) => void;
}

const LightningIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="currentColor"
      d="M13.5 2a1 1 0 0 1 .82 1.57L12 8h4.5a1 1 0 0 1 .78 1.63l-7 8a1 1 0 0 1-1.74-.93L10.7 12H7a1 1 0 0 1-.82-1.57l6-8A1 1 0 0 1 13.5 2Z"
    />
  </svg>
);

const ChecklistNav = styled.nav`
  width: 100%;
  max-width: 264px;
  min-width: 0;
  background: ${({ theme }) => theme.palette.surface};
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: ${({ theme }) => theme.elevation.level1};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.35;
  color: ${({ theme }) => theme.palette.text};
`;

const ChecklistItemRow = styled.div<{ $completed: boolean }>`
  display: grid;
  grid-template-columns: 24px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $completed }) => ($completed ? theme.palette.accent : 'transparent')};
  color: ${({ theme, $completed }) => ($completed ? theme.palette.primary : theme.palette.text)};
  transition: background 0.2s ease, color 0.2s ease;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  justify-self: center;
  align-self: start;
`;

const LabelColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const ItemLabel = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.45;
  color: ${({ theme }) => theme.palette.text};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  max-height: calc(0.82rem * 1.45 * 6);
  word-break: break-word;
`;

const InstantSaveButton = styled.button<{ $active: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surface)};
  color: ${({ theme, $active }) => ($active ? theme.palette.onPrimary : theme.palette.textMuted)};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${({ theme, $active }) => ($active ? theme.elevation.level1 : 'none')};
  align-self: start;
  justify-self: end;

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.palette.primaryStrong : theme.palette.surfaceMuted};
    color: ${({ theme, $active }) => ($active ? theme.palette.onPrimary : theme.palette.primary)};
    border-color: ${({ theme }) => theme.palette.primary};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

export const VisitChecklist = ({ items, onToggleCompleted, onToggleInstantSave }: VisitChecklistProps) => (
  <ChecklistNav aria-label="今日の流れチェックリスト">
    <Title>今日の流れ</Title>
    {items.map((item) => (
      <ChecklistItemRow key={item.id} $completed={item.completed}>
        <Checkbox
          type="checkbox"
          checked={item.completed}
          onChange={() => onToggleCompleted(item.id)}
          aria-label={`${item.label} を完了`}
        />
        <LabelColumn>
          <ItemLabel>{item.label}</ItemLabel>
        </LabelColumn>
        <InstantSaveButton
          type="button"
          onClick={() => onToggleInstantSave(item.id)}
          $active={item.instantSave}
          aria-pressed={item.instantSave}
          aria-label={`${item.label} を即保存に${item.instantSave ? 'しない' : '設定'}`}
          title={`即保存トグル：${item.instantSave ? '有効' : '無効'}`}
        >
          <LightningIcon aria-hidden="true" />
        </InstantSaveButton>
      </ChecklistItemRow>
    ))}
  </ChecklistNav>
);
