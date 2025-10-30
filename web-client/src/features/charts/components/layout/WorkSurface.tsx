import type { UIEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import styled from '@emotion/styled';

import { Button, SurfaceCard, TextArea } from '@/components';

export type SurfaceMode = 'objective' | 'plan';

export interface PlanComposerCard {
  id: string;
  type: 'medication' | 'procedure' | 'exam' | 'followup';
  title: string;
  detail: string;
  note: string;
}

interface WorkSurfaceProps {
  mode: SurfaceMode;
  onModeChange: (mode: SurfaceMode) => void;
  objectiveValue: string;
  onObjectiveChange: (value: string) => void;
  assessmentValue: string;
  onAssessmentChange: (value: string) => void;
  planCards: PlanComposerCard[];
  onPlanCardChange: (id: string, patch: Partial<PlanComposerCard>) => void;
  onPlanCardRemove: (id: string) => void;
  onPlanCardInsert: (type: PlanComposerCard['type']) => void;
  onPlanCardReorder: (fromId: string, toId: string) => void;
  onPlanUndo: () => void;
  onPlanCardFocus: (id: string) => void;
  onObjectiveInsertText: (text: string) => void;
  onPlanInsertText: (text: string) => void;
  isLockedByMe: boolean;
}

const SurfaceShell = styled.main`
  position: relative;
  flex: 1 1 auto;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: ${({ theme }) => theme.elevation.level1};
  min-height: 480px;
`;

const SurfaceToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 8px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  border: none;
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surfaceMuted)};
  color: ${({ theme, $active }) => ($active ? '#ffffff' : theme.palette.text)};
  border-radius: 999px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease;

  &:focus {
    outline: 3px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const Slides = styled.div<{ $mode: SurfaceMode }>`
  display: flex;
  width: 200%;
  transform: translateX(${({ $mode }) => ($mode === 'objective' ? '0%' : '-50%')});
  transition: transform 150ms ease-in-out;
`;

const Slide = styled.section`
  width: 50%;
  padding: 16px 24px 32px;
  overflow-y: auto;
  max-height: calc(100vh - 80px - 72px - 48px);
`;

const HintBox = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.85rem;
  display: flex;
  gap: 12px;
`;

const TemplateButton = styled.button`
  border: 1px dashed ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surface};
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.palette.primary};
    background: ${({ theme }) => theme.palette.accent};
  }
`;

const HighlightStrip = styled.ul`
  margin: 12px 0 0;
  padding-inline-start: 1.2rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const PlanList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PlanCardShell = styled.article`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: inset 0 1px 0 rgba(17, 24, 39, 0.04);
  padding: 12px;
  display: grid;
  gap: 8px;
  cursor: grab;
`;

const PlanHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const PlanTitleInput = styled.input`
  border: none;
  font-weight: 600;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text};
  background: transparent;
  width: 100%;
  &:focus {
    outline: 2px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const PlanTag = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.palette.accent};
  color: ${({ theme }) => theme.palette.primary};
  text-transform: uppercase;
`;

const PlanActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.text};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.palette.accent};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const PlanDetailArea = styled.textarea`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 8px 10px;
  min-height: 80px;
  font-size: 0.9rem;
  resize: vertical;
  color: ${({ theme }) => theme.palette.text};
  background: ${({ theme }) => theme.palette.surface};
`;

const PlanNoteArea = styled.textarea`
  border: 1px dashed ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 6px 8px;
  min-height: 48px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
  background: ${({ theme }) => theme.palette.surface};
`;

const PlanFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const planTypeLabel = (type: PlanComposerCard['type']) => {
  switch (type) {
    case 'medication':
      return '薬';
    case 'procedure':
      return '処置';
    case 'exam':
      return '検査';
    case 'followup':
      return 'フォローアップ';
    default:
      return 'Plan';
  }
};

const extractHighlights = (text: string) => {
  const negatives = Array.from(text.matchAll(/(否定|なし|陰性|問題なし|症状なし)/g)).map((match) => match[0]);
  const numbers = Array.from(text.matchAll(/[-+]?[0-9]+(?:\.[0-9]+)?/g)).map((match) => match[0]);
  return { negatives, numbers };
};

const TEMPLATE_SNIPPETS = [
  '意識清明。呼吸音左右差なし。',
  '血圧 130/82 mmHg、脈拍 72 bpm 整。',
  '経口摂取良好。尿量は問題なし。',
];

export const WorkSurface = ({
  mode,
  onModeChange,
  objectiveValue,
  onObjectiveChange,
  assessmentValue,
  onAssessmentChange,
  planCards,
  onPlanCardChange,
  onPlanCardRemove,
  onPlanCardInsert,
  onPlanCardReorder,
  onPlanUndo,
  onPlanCardFocus,
  onObjectiveInsertText,
  onPlanInsertText,
  isLockedByMe,
}: WorkSurfaceProps) => {
  const objectiveScrollRef = useRef(0);
  const planScrollRef = useRef(0);
  const objectiveRef = useRef<HTMLDivElement | null>(null);
  const planRef = useRef<HTMLDivElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  const handleToggle = useCallback(
    (nextMode: SurfaceMode) => {
      if (nextMode === mode) {
        return;
      }
      onModeChange(nextMode);
      liveRegionRef.current?.setAttribute('aria-live', 'polite');
      liveRegionRef.current?.setAttribute('data-mode', nextMode);
    },
    [mode, onModeChange],
  );

  const handleObjectiveScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    objectiveScrollRef.current = event.currentTarget.scrollTop;
  }, []);

  const handlePlanScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    planScrollRef.current = event.currentTarget.scrollTop;
  }, []);

  useEffect(() => {
    const target = mode === 'objective' ? objectiveRef.current : planRef.current;
    const scrollTop = mode === 'objective' ? objectiveScrollRef.current : planScrollRef.current;
    if (target) {
      window.requestAnimationFrame(() => {
        target.scrollTop = scrollTop;
      });
    }
  }, [mode]);

  const highlights = useMemo(() => extractHighlights(objectiveValue), [objectiveValue]);

  return (
    <SurfaceShell>
      <SurfaceToolbar>
        <ToolbarActions>
          <ToggleButton
            type="button"
            $active={mode === 'objective'}
            onClick={() => handleToggle('objective')}
            aria-pressed={mode === 'objective'}
          >
            O 面（所見）
          </ToggleButton>
          <ToggleButton
            type="button"
            $active={mode === 'plan'}
            onClick={() => handleToggle('plan')}
            aria-pressed={mode === 'plan'}
          >
            A&P 面（評価・計画）
          </ToggleButton>
        </ToolbarActions>
        <ToolbarActions>
          <Button type="button" variant="ghost" onClick={() => onPlanCardInsert('medication')} disabled={!isLockedByMe}>
            薬オーダ追加
          </Button>
          <Button type="button" variant="ghost" onClick={() => onPlanUndo()} disabled={!isLockedByMe}>
            直前の操作を元に戻す
          </Button>
        </ToolbarActions>
      </SurfaceToolbar>
      <Slides $mode={mode}>
        <Slide ref={objectiveRef} onScroll={handleObjectiveScroll} aria-label="所見エディタ">
          <SurfaceCard tone="muted">
            <TextArea
              label="Objective"
              placeholder="診察所見やバイタルを入力 (ドラッグ＆ドロップで挿入可)"
              value={objectiveValue}
              onChange={(event) => onObjectiveChange(event.currentTarget.value)}
              disabled={!isLockedByMe}
              rows={12}
              onDrop={(event) => {
                event.preventDefault();
                const data = event.dataTransfer.getData('text/plain');
                if (data) {
                  onObjectiveInsertText(data);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
            />
            <HintBox>
              <strong>ヒント</strong>
              <span>F3 でテンプレ検索。数字と否定語は下のリストで強調表示されます。</span>
            </HintBox>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {TEMPLATE_SNIPPETS.map((snippet) => (
                <TemplateButton key={snippet} onClick={() => onObjectiveInsertText(snippet)} disabled={!isLockedByMe}>
                  {snippet}
                </TemplateButton>
              ))}
            </div>
            <HighlightStrip aria-live="polite">
              {highlights.negatives.length > 0 ? (
                <li>否定語: {highlights.negatives.join(', ')}</li>
              ) : (
                <li>否定語は検出されませんでした</li>
              )}
              {highlights.numbers.length > 0 ? (
                <li>数値: {highlights.numbers.join(', ')}</li>
              ) : (
                <li>数値は検出されませんでした</li>
              )}
            </HighlightStrip>
          </SurfaceCard>
        </Slide>
        <Slide ref={planRef} onScroll={handlePlanScroll} aria-label="評価と計画" aria-live="polite">
          <SurfaceCard tone="muted">
            <TextArea
              label="Assessment"
              placeholder="診断評価や所見のまとめ"
              value={assessmentValue}
              onChange={(event) => onAssessmentChange(event.currentTarget.value)}
              disabled={!isLockedByMe}
              rows={4}
              onDrop={(event) => {
                event.preventDefault();
                const data = event.dataTransfer.getData('text/plain');
                if (data) {
                  onPlanInsertText(data);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
            />
            <PlanList>
              {planCards.map((card) => (
                <PlanCardShell
                  key={card.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/x-plan-card', card.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(event) => {
                    const sourceId = event.dataTransfer.getData('application/x-plan-card');
                    if (sourceId && sourceId !== card.id) {
                      onPlanCardReorder(sourceId, card.id);
                    }
                  }}
                >
                  <PlanHeader>
                    <PlanTag>{planTypeLabel(card.type)}</PlanTag>
                    <PlanActions>
                      <IconButton type="button" onClick={() => onPlanCardInsert(card.type)} aria-label={`${planTypeLabel(card.type)}カードを追加`}>
                        +
                      </IconButton>
                      <IconButton type="button" onClick={() => onPlanCardRemove(card.id)} aria-label="カードを削除">
                        ×
                      </IconButton>
                    </PlanActions>
                  </PlanHeader>
                  <PlanTitleInput
                    value={card.title}
                    onChange={(event) => onPlanCardChange(card.id, { title: event.currentTarget.value })}
                    placeholder={`${planTypeLabel(card.type)}内容`}
                    onFocus={() => onPlanCardFocus(card.id)}
                  />
                  <PlanDetailArea
                    value={card.detail}
                    onChange={(event) => onPlanCardChange(card.id, { detail: event.currentTarget.value })}
                    placeholder="詳細・用量・頻度など"
                    onFocus={() => onPlanCardFocus(card.id)}
                    onDrop={(event) => {
                      event.preventDefault();
                      const data = event.dataTransfer.getData('text/plain');
                      if (data) {
                        onPlanCardChange(card.id, { detail: `${card.detail}\n${data}`.trim() });
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                  />
                  <PlanNoteArea
                    value={card.note}
                    onChange={(event) => onPlanCardChange(card.id, { note: event.currentTarget.value })}
                    placeholder="フォロー指示や患者連絡メモ"
                    onFocus={() => onPlanCardFocus(card.id)}
                  />
                  <PlanFooter>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Alt + ↑/↓ で並べ替え / ドラッグ&ドロップ対応
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>カードID: {card.id.slice(0, 8)}</span>
                  </PlanFooter>
                </PlanCardShell>
              ))}
              {planCards.length === 0 ? (
                <HintBox>
                  <strong>Plan 未追加</strong>
                  <span>最初のカードを追加してください。テンプレートやミニサマリをドラッグすると自動生成されます。</span>
                </HintBox>
              ) : null}
            </PlanList>
          </SurfaceCard>
        </Slide>
      </Slides>
      <div ref={liveRegionRef} aria-live="polite" style={{ position: 'absolute', left: -9999, top: 'auto', height: 1, width: 1, overflow: 'hidden' }}>
        {mode === 'objective' ? '所見エディタが表示されました' : '評価と計画エディタが表示されました'}
      </div>
    </SurfaceShell>
  );
};
