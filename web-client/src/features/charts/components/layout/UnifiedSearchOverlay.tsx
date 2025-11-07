import styled from '@emotion/styled';

export interface SearchResultItem<TSection extends string = string, TPlanType extends string = string> {
  id: string;
  label: string;
  detail: string;
  section: TSection;
  payload?: string;
  planType?: TPlanType;
}

interface UnifiedSearchOverlayProps<TSection extends string = string, TPlanType extends string = string> {
  open: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  sections: readonly TSection[];
  activeSection: TSection;
  onSectionChange: (section: TSection) => void;
  results: SearchResultItem<TSection, TPlanType>[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onConfirm: (item: SearchResultItem<TSection, TPlanType>) => void;
  onClose: () => void;
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(20, 31, 44, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

const Dialog = styled.div`
  width: min(720px, 90vw);
  background: ${({ theme }) => theme.palette.surface};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.elevation.level2};
  display: grid;
  gap: 16px;
  padding: 20px;
`;

const SearchField = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 10px 12px;
  font-size: 1rem;
  background: ${({ theme }) => theme.palette.surface};
  color: ${({ theme }) => theme.palette.text};
`;

const SectionTabs = styled.div`
  display: flex;
  gap: 8px;
`;

const SectionTab = styled.button<{ $active: boolean }>`
  border: none;
  padding: 6px 12px;
  border-radius: 999px;
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surfaceMuted)};
  color: ${({ theme, $active }) => ($active ? '#ffffff' : theme.palette.text)};
  cursor: pointer;
`;

const ResultsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
  display: grid;
  gap: 8px;
`;

const ResultItem = styled.li<{ $active: boolean }>`
  border: 1px solid ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 10px 12px;
  cursor: pointer;
  background: ${({ theme, $active }) => ($active ? theme.palette.accent : theme.palette.surface)};
  color: ${({ theme }) => theme.palette.text};
`;

export const UnifiedSearchOverlay = <TSection extends string = string, TPlanType extends string = string>({
  open,
  query,
  onQueryChange,
  sections,
  activeSection,
  onSectionChange,
  results,
  selectedIndex,
  onSelectIndex,
  onConfirm,
  onClose,
}: UnifiedSearchOverlayProps<TSection, TPlanType>) => {
  if (!open) {
    return null;
  }

  return (
    <Backdrop onClick={onClose} role="dialog" aria-modal="true">
      <Dialog onClick={(event) => event.stopPropagation()}>
        <SearchField
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          placeholder="薬、処置、検査、テンプレ、過去文を検索"
          autoFocus
        />
        <SectionTabs>
          {sections.map((section) => (
            <SectionTab
              key={section}
              type="button"
              $active={section === activeSection}
              onClick={() => onSectionChange(section)}
            >
              {section}
            </SectionTab>
          ))}
        </SectionTabs>
        <ResultsList>
          {results.map((item, index) => (
            <ResultItem
              key={item.id}
              $active={index === selectedIndex}
              onMouseEnter={() => onSelectIndex(index)}
              onClick={() => onConfirm(item)}
            >
              <div style={{ fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: '0.85rem', color: '#4f5a6b' }}>{item.detail}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.section}</div>
            </ResultItem>
          ))}
          {results.length === 0 ? <li style={{ color: '#6b7280' }}>一致する候補がありません</li> : null}
        </ResultsList>
        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          ↑↓ で候補移動、Enter で {activeSection === 'A&P' ? 'カード追加' : '文挿入'} / Esc で閉じる
        </div>
      </Dialog>
    </Backdrop>
  );
};
