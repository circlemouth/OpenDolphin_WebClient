import styled from '@emotion/styled';

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

const ChecklistNav = styled.nav`
  width: 100%;
  min-width: 0;
  background: ${({ theme }) => theme.palette.surface};
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: ${({ theme }) => theme.elevation.level1};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text};
`;

const ChecklistItemRow = styled.div<{ $completed: boolean }>`
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $completed }) => ($completed ? theme.palette.accent : 'transparent')};
  color: ${({ theme, $completed }) => ($completed ? theme.palette.primary : theme.palette.text)};
  transition: background 0.2s ease;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
`;

const LabelColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InlineToggle = styled.button<{ $active: boolean }>`
  align-self: start;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surface)};
  color: ${({ theme, $active }) => ($active ? '#ffffff' : theme.palette.textMuted)};
  border-radius: 16px;
  padding: 2px 10px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.palette.accent};
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
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.label}</span>
          <InlineToggle
            type="button"
            onClick={() => onToggleInstantSave(item.id)}
            $active={item.instantSave}
            aria-pressed={item.instantSave}
            aria-label={`${item.label} を即保存に${item.instantSave ? 'しない' : '設定'}`}
          >
            即保存
          </InlineToggle>
        </LabelColumn>
      </ChecklistItemRow>
    ))}
  </ChecklistNav>
);
