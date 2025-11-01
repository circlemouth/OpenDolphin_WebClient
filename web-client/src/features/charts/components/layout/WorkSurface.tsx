import { type DragEvent, useMemo, useState } from 'react';
import styled from '@emotion/styled';

import { Button, StatusBadge, SurfaceCard, TextArea } from '@/components';
import { buildObjectiveNarrative } from '@/features/charts/utils/progress-note-payload';

export type SoapSection = 'subjective' | 'objective' | 'assessment' | 'plan';

export interface PlanComposerCard {
  id: string;
  type: 'medication' | 'procedure' | 'exam' | 'followup' | 'injection' | 'guidance';
  title: string;
  detail: string;
  note: string;
  orderModuleId?: string | null;
  orderSummary?: string | null;
  isPrimaryDiagnosis?: boolean;
}

interface MonshinSummaryItem {
  id: string;
  question: string;
  answer: string;
}

interface WorkSurfaceProps {
  activeSection: SoapSection;
  onSectionChange: (section: SoapSection) => void;
  subjectiveValue: string;
  onSubjectiveChange: (value: string) => void;
  onSubjectiveInsertText: (text: string) => void;
  objectiveValue: string;
  onObjectiveChange: (value: string) => void;
  onObjectiveInsertText: (text: string) => void;
  rosValue: string;
  onRosChange: (value: string) => void;
  onRosInsertText: (text: string) => void;
  physicalExamValue: string;
  onPhysicalExamChange: (value: string) => void;
  onPhysicalExamInsertText: (text: string) => void;
  assessmentValue: string;
  onAssessmentChange: (value: string) => void;
  onAssessmentInsertText: (text: string) => void;
  planCards: PlanComposerCard[];
  onPlanCardChange: (id: string, patch: Partial<PlanComposerCard>) => void;
  onPlanCardRemove: (id: string) => void;
  onPlanCardInsert: (
    type: PlanComposerCard['type'],
    initializer?: (card: PlanComposerCard) => PlanComposerCard,
  ) => string | null;
  onPlanCardReorder: (fromId: string, toId: string) => void;
  onPlanUndo: () => void;
  onPlanCardFocus: (id: string) => void;
  onPlanInsertText: (text: string) => void;
  primaryDiagnosisCardId: string | null;
  onPrimaryDiagnosisSelect: (id: string) => void;
  referenceSplitOpen: boolean;
  onReferenceSplitToggle: () => void;
  referenceDocument: {
    title: string;
    confirmedAt: string | null;
    subjective: string;
    objective: string;
    ros: string;
    physicalExam: string;
    assessment: string;
    plan: string;
  } | null;
  referenceLabModules: {
    id: string;
    sampleDate: string | null;
    items: {
      id: string;
      label: string;
      value: string;
      unit?: string;
      abnormalFlag?: string | null;
    }[];
  }[];
  referenceLabLoading: boolean;
  referenceLabError: string | null;
  monshinSummary: MonshinSummaryItem[];
  onMonshinDiffRequest: (incomingParagraphs: string[]) => void;
  onMonshinHistoryRequest: () => void;
  isLockedByMe: boolean;
}

const SOAP_SECTIONS: { id: SoapSection; label: string }[] = [
  { id: 'subjective', label: 'Subjective (HPI)' },
  { id: 'objective', label: 'Objective / ROS / PE' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'plan', label: 'Plan' },
];

const OBJECTIVE_TEMPLATES = [
  '意識清明。呼吸音左右差なし。',
  '血圧 130/82 mmHg、脈拍 72 bpm 整。',
  '経口摂取良好。尿量は問題なし。',
];

const ROS_TEMPLATES = [
  '全身：発熱・体重減少なし。',
  '呼吸器：咳嗽・呼吸困難なし。',
  '循環器：動悸・胸痛なし。',
  '消化器：腹痛・嘔気・下痢なし。',
];

const PHYSICAL_EXAM_TEMPLATES = [
  '視診：顔色良好、皮疹なし。',
  '胸部：呼吸音清、ラ音なし。',
  '心音：整、雑音なし。',
  '腹部：平坦・軟、圧痛なし。',
];

const SurfaceShell = styled.main`
  position: relative;
  flex: 1 1 auto;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: ${({ theme }) => theme.elevation.level1};
  min-height: 480px;
  display: flex;
  flex-direction: column;
`;

const SurfaceHeader = styled.header`
  padding: 12px 18px 8px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const TabList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 240px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const TabButton = styled.button<{ $active: boolean }>`
  border: none;
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surfaceMuted)};
  color: ${({ theme, $active }) => ($active ? '#ffffff' : theme.palette.text)};
  border-radius: 999px;
  padding: 6px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.82rem;
  line-height: 1.3;
  letter-spacing: 0.01em;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: ${({ theme, $active }) => ($active ? theme.elevation.level2 : 'none')};

  &:focus {
    outline: 3px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const SurfaceBody = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px 18px 20px;
  display: grid;
  gap: 14px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

const MonshinCard = styled(SurfaceCard)`
  display: grid;
  gap: 12px;
`;

const MonshinHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const MonshinTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 1rem;
  }

  span {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;

const MonshinActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MonshinToggle = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.palette.primary};
  cursor: pointer;
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};

  &:hover {
    background: ${({ theme }) => theme.palette.accent};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const MonshinList = styled.ul`
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 1.1rem;
  color: ${({ theme }) => theme.palette.text};
`;

const MonshinQuestion = styled.span`
  font-weight: 600;
`;

const MonshinAnswer = styled.span`
  display: block;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const AccordionSection = styled.section`
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: ${({ theme }) => theme.elevation.level1};
`;

const SectionHeaderButton = styled.button<{ $expanded: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border: none;
  cursor: pointer;
  background: ${({ theme, $expanded }) => ($expanded ? theme.palette.surfaceStrong : theme.palette.surface)};
  transition: background 0.2s ease;
  font-size: 1rem;
  font-weight: 600;

  &:focus {
    outline: 3px solid ${({ theme }) => theme.palette.accent};
    outline-offset: -3px;
  }
`;

const SectionIndicator = styled.span<{ $expanded: boolean }>`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.palette.textMuted};
  transform: rotate(${({ $expanded }) => ($expanded ? '90deg' : '0deg')});
  transition: transform 0.2s ease;
`;

const SectionBody = styled.div<{ $expanded: boolean }>`
  display: ${({ $expanded }) => ($expanded ? 'block' : 'none')};
  padding: 16px 20px 24px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  border-top: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: 0 0 ${({ theme }) => theme.radius.lg} ${({ theme }) => theme.radius.lg};
`;

const SectionStack = styled.div`
  display: grid;
  gap: 16px;
`;

const TemplateRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

  &:focus {
    outline: 2px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const HintBox = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.82rem;
  display: flex;
  gap: 12px;
`;

const HighlightStrip = styled.ul`
  margin: 12px 0 0;
  padding-inline-start: 1.2rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const PlanList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PlanCardShell = styled.article<{ $primary: boolean }>`
  border: 1px solid ${({ theme, $primary }) => ($primary ? theme.palette.primaryStrong ?? theme.palette.primary : theme.palette.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: ${({ theme, $primary }) => ($primary ? theme.elevation.level2 : 'inset 0 1px 0 rgba(17, 24, 39, 0.04)')};
  padding: 12px 14px;
  display: grid;
  gap: 10px;
  cursor: grab;
`;

const PlanHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: nowrap;
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
  gap: 4px;
  flex-wrap: nowrap;
  flex: 0 0 auto;
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
  flex: 0 0 auto;

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

const OrderSummaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
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

const SectionToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
`;

const PlanDropZone = styled.div`
  border: 1px dashed ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 12px;
  text-align: center;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
  background: ${({ theme }) => theme.palette.surface};
`;

const SubSection = styled.div`
  display: grid;
  gap: 12px;
`;

const SubSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
`;

const ReferenceSplit = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const ReferenceColumnCard = styled(SurfaceCard)`
  display: grid;
  gap: 12px;
`;

const ReferenceHeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
`;

const ReferenceTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
`;

const ReferenceMeta = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ReferenceSectionBlock = styled.section`
  display: grid;
  gap: 8px;
`;

const ReferenceSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ReferenceSectionBody = styled.div`
  display: grid;
  gap: 6px;
`;

const ReferenceParagraphRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const ReferenceParagraphText = styled.p`
  flex: 1 1 auto;
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.text};
  white-space: pre-wrap;
`;

const ReferenceParagraphActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ReferenceEmpty = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ReferenceError = styled(ReferenceEmpty)`
  color: ${({ theme }) => theme.palette.danger};
`;

const ReferenceLabList = styled.div`
  display: grid;
  gap: 12px;
`;

const ReferenceLabModuleCard = styled.div`
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.palette.surface};
  padding: 12px;
  display: grid;
  gap: 8px;
`;

const ReferenceLabModuleHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-weight: 600;
`;

const ReferenceLabItems = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
`;

const ReferenceLabItemRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.9rem;
`;

const ReferenceLabItemText = styled.span`
  flex: 1 1 auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  color: ${({ theme }) => theme.palette.text};
`;

const ReferenceLabItemActions = styled.div`
  display: flex;
  gap: 4px;
`;

const ReferenceLabValue = styled.span<{ $abnormal: boolean }>`
  color: ${({ theme, $abnormal }) => ($abnormal ? theme.palette.danger : theme.palette.text)};
  font-weight: ${({ $abnormal }) => ($abnormal ? 600 : 400)};
`;

const planTypeLabel = (type: PlanComposerCard['type']) => {
  switch (type) {
    case 'medication':
      return '薬';
    case 'injection':
      return '注射';
    case 'procedure':
      return '処置';
    case 'exam':
      return '検査';
    case 'guidance':
      return '指導料';
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

export const WorkSurface = ({
  activeSection,
  onSectionChange,
  subjectiveValue,
  onSubjectiveChange,
  onSubjectiveInsertText,
  objectiveValue,
  onObjectiveChange,
  onObjectiveInsertText,
  rosValue,
  onRosChange,
  onRosInsertText,
  physicalExamValue,
  onPhysicalExamChange,
  onPhysicalExamInsertText,
  assessmentValue,
  onAssessmentChange,
  onAssessmentInsertText,
  planCards,
  onPlanCardChange,
  onPlanCardRemove,
  onPlanCardInsert,
  onPlanCardReorder,
  onPlanUndo,
  onPlanCardFocus,
  onPlanInsertText,
  primaryDiagnosisCardId,
  onPrimaryDiagnosisSelect,
  referenceSplitOpen,
  onReferenceSplitToggle,
  referenceDocument,
  referenceLabModules,
  referenceLabLoading,
  referenceLabError,
  monshinSummary,
  onMonshinDiffRequest,
  onMonshinHistoryRequest,
  isLockedByMe,
}: WorkSurfaceProps) => {
  const [monshinCollapsed, setMonshinCollapsed] = useState(false);

  const monshinParagraphs = useMemo(
    () => monshinSummary.map((item) => `${item.question}: ${item.answer}`),
    [monshinSummary],
  );

  const objectiveNarrative = useMemo(
    () => buildObjectiveNarrative({ objective: objectiveValue, ros: rosValue, physicalExam: physicalExamValue }),
    [objectiveValue, physicalExamValue, rosValue],
  );
  const highlights = useMemo(() => extractHighlights(objectiveNarrative), [objectiveNarrative]);

  const handleTabChange = (section: SoapSection) => {
    if (section !== activeSection) {
      onSectionChange(section);
    }
  };

  const handleAccordionToggle = (section: SoapSection) => {
    if (section !== activeSection) {
      onSectionChange(section);
      return;
    }
    // 折りたたみは常に何か一つ開いた状態を維持するため、同じセクションを再クリックしても閉じない
  };

  const handleDrop = (event: DragEvent, onInsert: (text: string) => void) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');
    if (data) {
      onInsert(data);
    }
  };

  const handleMonshinInsert = () => {
    if (monshinParagraphs.length === 0) {
      return;
    }
    onSectionChange('subjective');
    onSubjectiveInsertText(monshinParagraphs.join('\n'));
  };

  const handleMonshinDiff = () => {
    if (monshinParagraphs.length === 0) {
      return;
    }
    onMonshinDiffRequest(monshinParagraphs);
  };

  const formatReferenceDate = (value: string | null) => {
    if (!value) {
      return '---';
    }
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toParagraphs = (value: string) =>
    value
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  const handleInsertSection = (insert: (text: string) => void, text: string) => {
    const normalized = text.trim();
    if (!normalized) {
      return;
    }
    insert(normalized);
  };

  const documentSections = referenceDocument
    ? [
        { id: 'subjective', label: 'Subjective', value: referenceDocument.subjective, onInsert: onSubjectiveInsertText },
        { id: 'objective', label: 'Objective', value: referenceDocument.objective, onInsert: onObjectiveInsertText },
        { id: 'ros', label: 'ROS', value: referenceDocument.ros, onInsert: onRosInsertText },
        { id: 'physicalExam', label: 'Physical Exam', value: referenceDocument.physicalExam, onInsert: onPhysicalExamInsertText },
        { id: 'assessment', label: 'Assessment', value: referenceDocument.assessment, onInsert: onAssessmentInsertText },
        { id: 'plan', label: 'Plan', value: referenceDocument.plan, onInsert: onPlanInsertText },
      ]
    : [];

  const labModulesToRender = referenceLabModules.slice(0, 4);

  return (
    <SurfaceShell>
      <SurfaceHeader>
        <TabList role="tablist" aria-label="SOAP セクション">
          {SOAP_SECTIONS.map((section) => (
            <TabButton
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              $active={activeSection === section.id}
              onClick={() => handleTabChange(section.id)}
            >
              {section.label}
            </TabButton>
          ))}
        </TabList>
        <HeaderActions>
          <Button
            type="button"
            size="sm"
            variant={referenceSplitOpen ? 'secondary' : 'ghost'}
            onClick={onReferenceSplitToggle}
          >
            {referenceSplitOpen ? '参照パネルを閉じる' : '参照パネルを表示'}
          </Button>
        </HeaderActions>
      </SurfaceHeader>
      <SurfaceBody>
        <MonshinCard tone="muted">
          <MonshinHeader>
            <MonshinTitle>
              <strong>最新問診サマリ</strong>
              <span>受付で入力された問診内容を本文に取り込めます。</span>
            </MonshinTitle>
            <MonshinActions>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleMonshinInsert}
                disabled={!isLockedByMe || monshinParagraphs.length === 0}
              >
                本文に取り込む
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleMonshinDiff}
                disabled={!isLockedByMe || monshinParagraphs.length === 0}
              >
                差分確認
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onMonshinHistoryRequest}>
                履歴
              </Button>
              <MonshinToggle type="button" onClick={() => setMonshinCollapsed((prev) => !prev)}>
                {monshinCollapsed ? '開く' : '折りたたむ'}
              </MonshinToggle>
            </MonshinActions>
          </MonshinHeader>
          {!monshinCollapsed && (
            <MonshinList>
              {monshinSummary.length === 0 ? (
                <li style={{ color: '#6b7280', listStyle: 'none' }}>問診結果はまだありません。</li>
              ) : (
                monshinSummary.map((item) => (
                  <li key={item.id}>
                    <MonshinQuestion>{item.question}</MonshinQuestion>
                    <MonshinAnswer>{item.answer}</MonshinAnswer>
                  </li>
                ))
              )}
            </MonshinList>
          )}
        </MonshinCard>

        <AccordionSection>
          <SectionHeaderButton
            type="button"
            onClick={() => handleAccordionToggle('subjective')}
            aria-expanded={activeSection === 'subjective'}
            aria-controls="worksurface-subjective"
            $expanded={activeSection === 'subjective'}
          >
            Subjective (HPI)
            <SectionIndicator aria-hidden $expanded={activeSection === 'subjective'}>
              ▸
            </SectionIndicator>
          </SectionHeaderButton>
          <SectionBody id="worksurface-subjective" role="region" aria-label="Subjective" $expanded={activeSection === 'subjective'}>
            <SurfaceCard tone="muted">
              <TextArea
                label="Subjective (HPI)"
                placeholder="患者の主訴や背景を記入"
                value={subjectiveValue}
                onChange={(event) => onSubjectiveChange(event.currentTarget.value)}
                disabled={!isLockedByMe}
                rows={10}
                onDrop={(event) => handleDrop(event, onSubjectiveInsertText)}
                onDragOver={(event) => event.preventDefault()}
              />
              <HintBox>
                <strong>ヒント</strong>
                <span>問診カードの「本文に取り込む」ボタンで、最新の問診内容を自動挿入できます。</span>
              </HintBox>
            </SurfaceCard>
          </SectionBody>
        </AccordionSection>

        <AccordionSection>
          <SectionHeaderButton
            type="button"
            onClick={() => handleAccordionToggle('objective')}
            aria-expanded={activeSection === 'objective'}
            aria-controls="worksurface-objective"
            $expanded={activeSection === 'objective'}
          >
            Objective / ROS / PE
            <SectionIndicator aria-hidden $expanded={activeSection === 'objective'}>
              ▸
            </SectionIndicator>
          </SectionHeaderButton>
          <SectionBody id="worksurface-objective" role="region" aria-label="Objective" $expanded={activeSection === 'objective'}>
            <SectionStack>
              <SurfaceCard tone="muted">
                <TextArea
                  label="Objective"
                  placeholder="診察所見やバイタルを入力 (ドラッグ＆ドロップで挿入可)"
                  value={objectiveValue}
                  onChange={(event) => onObjectiveChange(event.currentTarget.value)}
                  disabled={!isLockedByMe}
                  rows={8}
                  onDrop={(event) => handleDrop(event, onObjectiveInsertText)}
                  onDragOver={(event) => event.preventDefault()}
                />
                <TemplateRow>
                  {OBJECTIVE_TEMPLATES.map((snippet) => (
                    <TemplateButton
                      key={snippet}
                      type="button"
                      onClick={() => onObjectiveInsertText(snippet)}
                      disabled={!isLockedByMe}
                    >
                      {snippet}
                    </TemplateButton>
                  ))}
                </TemplateRow>
                <HintBox>
                  <strong>ヒント</strong>
                  <span>否定語と数値は自動で検出し、下のハイライトに表示します。</span>
                </HintBox>
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

              <SurfaceCard tone="muted">
                <SubSection>
                  <SubSectionHeader>
                    <span>Review of Systems (ROS)</span>
                  </SubSectionHeader>
                  <TextArea
                    label="ROS"
                    placeholder="症状の有無、全身状態など"
                    value={rosValue}
                    onChange={(event) => onRosChange(event.currentTarget.value)}
                    disabled={!isLockedByMe}
                    rows={6}
                    onDrop={(event) => handleDrop(event, onRosInsertText)}
                    onDragOver={(event) => event.preventDefault()}
                  />
                  <TemplateRow>
                    {ROS_TEMPLATES.map((snippet) => (
                      <TemplateButton key={snippet} type="button" onClick={() => onRosInsertText(snippet)} disabled={!isLockedByMe}>
                        {snippet}
                      </TemplateButton>
                    ))}
                  </TemplateRow>
                </SubSection>
              </SurfaceCard>

              <SurfaceCard tone="muted">
                <SubSection>
                  <SubSectionHeader>
                    <span>Physical Exam (PE)</span>
                  </SubSectionHeader>
                  <TextArea
                    label="PE"
                    placeholder="身体診察の詳細"
                    value={physicalExamValue}
                    onChange={(event) => onPhysicalExamChange(event.currentTarget.value)}
                    disabled={!isLockedByMe}
                    rows={6}
                    onDrop={(event) => handleDrop(event, onPhysicalExamInsertText)}
                    onDragOver={(event) => event.preventDefault()}
                  />
                  <TemplateRow>
                    {PHYSICAL_EXAM_TEMPLATES.map((snippet) => (
                      <TemplateButton
                        key={snippet}
                        type="button"
                        onClick={() => onPhysicalExamInsertText(snippet)}
                        disabled={!isLockedByMe}
                      >
                        {snippet}
                      </TemplateButton>
                    ))}
                  </TemplateRow>
                </SubSection>
              </SurfaceCard>
            </SectionStack>
          </SectionBody>
        </AccordionSection>

        <AccordionSection>
          <SectionHeaderButton
            type="button"
            onClick={() => handleAccordionToggle('assessment')}
            aria-expanded={activeSection === 'assessment'}
            aria-controls="worksurface-assessment"
            $expanded={activeSection === 'assessment'}
          >
            Assessment
            <SectionIndicator aria-hidden $expanded={activeSection === 'assessment'}>
              ▸
            </SectionIndicator>
          </SectionHeaderButton>
          <SectionBody id="worksurface-assessment" role="region" aria-label="Assessment" $expanded={activeSection === 'assessment'}>
            <SurfaceCard tone="muted">
              <TextArea
                label="Assessment"
                placeholder="診断評価や所見のまとめ"
                value={assessmentValue}
                onChange={(event) => onAssessmentChange(event.currentTarget.value)}
                disabled={!isLockedByMe}
                rows={6}
                onDrop={(event) => handleDrop(event, onAssessmentInsertText)}
                onDragOver={(event) => event.preventDefault()}
              />
            </SurfaceCard>
          </SectionBody>
        </AccordionSection>

        <AccordionSection>
          <SectionHeaderButton
            type="button"
            onClick={() => handleAccordionToggle('plan')}
            aria-expanded={activeSection === 'plan'}
            aria-controls="worksurface-plan"
            $expanded={activeSection === 'plan'}
          >
            Plan
            <SectionIndicator aria-hidden $expanded={activeSection === 'plan'}>
              ▸
            </SectionIndicator>
          </SectionHeaderButton>
          <SectionBody id="worksurface-plan" role="region" aria-label="Plan" $expanded={activeSection === 'plan'}>
            <SectionStack>
              <SectionToolbar>
                <Button type="button" variant="ghost" onClick={() => onPlanCardInsert('medication')} disabled={!isLockedByMe}>
                  薬オーダ追加
                </Button>
                <Button type="button" variant="ghost" onClick={onPlanUndo} disabled={!isLockedByMe}>
                  直前の操作を元に戻す
                </Button>
              </SectionToolbar>
              <SurfaceCard tone="muted">
                <PlanList>
                  {planCards.map((card) => {
                    const isPrimary = Boolean(card.isPrimaryDiagnosis || (primaryDiagnosisCardId && primaryDiagnosisCardId === card.id));
                    return (
                      <PlanCardShell
                        key={card.id}
                        $primary={isPrimary}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PlanTag>{planTypeLabel(card.type)}</PlanTag>
                            {isPrimary ? (
                              <StatusBadge tone="success" size="sm">
                                主病名
                              </StatusBadge>
                            ) : null}
                          </div>
                          <PlanActions>
                            <Button
                              type="button"
                              size="sm"
                              variant={isPrimary ? 'secondary' : 'ghost'}
                              onClick={() => onPrimaryDiagnosisSelect(card.id)}
                              disabled={!isLockedByMe}
                            >
                              主病名
                            </Button>
                            <IconButton
                              type="button"
                              onClick={() => onPlanCardInsert(card.type)}
                              aria-label={`${planTypeLabel(card.type)}カードを追加`}
                              disabled={!isLockedByMe}
                            >
                              +
                            </IconButton>
                            <IconButton
                              type="button"
                              onClick={() => onPlanCardRemove(card.id)}
                              aria-label="カードを削除"
                              disabled={!isLockedByMe}
                            >
                              ×
                            </IconButton>
                          </PlanActions>
                        </PlanHeader>
                      <PlanTitleInput
                        value={card.title}
                        onChange={(event) => onPlanCardChange(card.id, { title: event.currentTarget.value })}
                        placeholder={`${planTypeLabel(card.type)}内容`}
                        onFocus={() => onPlanCardFocus(card.id)}
                        disabled={!isLockedByMe}
                      />
                      {card.orderSummary ? (
                        <OrderSummaryRow>
                          <StatusBadge tone="info" size="sm">
                            オーダ
                          </StatusBadge>
                          <span>{card.orderSummary}</span>
                        </OrderSummaryRow>
                      ) : null}
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
                        disabled={!isLockedByMe}
                      />
                      <PlanNoteArea
                        value={card.note}
                        onChange={(event) => onPlanCardChange(card.id, { note: event.currentTarget.value })}
                        placeholder="フォロー指示や患者連絡メモ"
                        onFocus={() => onPlanCardFocus(card.id)}
                        disabled={!isLockedByMe}
                      />
                      <PlanFooter>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Alt + ↑/↓ で並べ替え / ドラッグ&ドロップ対応
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>カードID: {card.id.slice(0, 8)}</span>
                      </PlanFooter>
                      </PlanCardShell>
                    );
                  })}
                </PlanList>
                {planCards.length === 0 ? (
                  <HintBox>
                    <strong>Plan 未追加</strong>
                    <span>最初のカードを追加してください。テンプレートや問診サマリからドラッグすると自動生成できます。</span>
                  </HintBox>
                ) : null}
                <PlanDropZone
                  role="button"
                  tabIndex={0}
                  aria-label="Plan ドロップゾーン"
                  onDrop={(event) => handleDrop(event, onPlanInsertText)}
                  onDragOver={(event) => event.preventDefault()}
                >
                  テキストをドロップすると Plan カードとして追加されます
                </PlanDropZone>
              </SurfaceCard>
            </SectionStack>
          </SectionBody>
        </AccordionSection>

        {referenceSplitOpen ? (
          <ReferenceSplit>
            <ReferenceColumnCard tone="muted">
              <ReferenceHeaderRow>
                <ReferenceTitle>{referenceDocument ? referenceDocument.title : '参照カルテ'}</ReferenceTitle>
                {referenceDocument?.confirmedAt ? <ReferenceMeta>{formatReferenceDate(referenceDocument.confirmedAt)}</ReferenceMeta> : null}
              </ReferenceHeaderRow>
              {!referenceDocument ? (
                <ReferenceEmpty>カルテタイムラインから参照する文書を選択してください。</ReferenceEmpty>
              ) : (() => {
                  const sections = documentSections
                    .map((section) => {
                      const paragraphs = toParagraphs(section.value);
                      if (paragraphs.length === 0) {
                        return null;
                      }
                      return (
                        <ReferenceSectionBlock key={section.id}>
                          <ReferenceSectionHeader>
                            <span>{section.label}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleInsertSection(section.onInsert, section.value)}
                              disabled={!isLockedByMe}
                            >
                              全部挿入
                            </Button>
                          </ReferenceSectionHeader>
                          <ReferenceSectionBody>
                            {paragraphs.map((paragraph, index) => (
                              <ReferenceParagraphRow key={`${section.id}-${index}`}>
                                <ReferenceParagraphText>{paragraph}</ReferenceParagraphText>
                                <ReferenceParagraphActions>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => section.onInsert(paragraph)}
                                    disabled={!isLockedByMe}
                                  >
                                    挿入
                                  </Button>
                                </ReferenceParagraphActions>
                              </ReferenceParagraphRow>
                            ))}
                          </ReferenceSectionBody>
                        </ReferenceSectionBlock>
                      );
                    })
                    .filter((node): node is JSX.Element => Boolean(node));
                  return sections.length > 0 ? sections : <ReferenceEmpty>このカルテには引用可能な本文がありません。</ReferenceEmpty>;
                })()}
            </ReferenceColumnCard>
            <ReferenceColumnCard tone="muted">
              <ReferenceHeaderRow>
                <ReferenceTitle>検査結果</ReferenceTitle>
                {labModulesToRender.length > 0 ? <ReferenceMeta>{`${labModulesToRender.length}件`}</ReferenceMeta> : null}
              </ReferenceHeaderRow>
              {referenceLabLoading ? (
                <ReferenceEmpty>検査結果を読み込んでいます…</ReferenceEmpty>
              ) : referenceLabError ? (
                <ReferenceError>{referenceLabError}</ReferenceError>
              ) : labModulesToRender.length === 0 ? (
                <ReferenceEmpty>検査結果はまだ読み込まれていません。</ReferenceEmpty>
              ) : (
                <ReferenceLabList>
                  {labModulesToRender.map((module) => (
                    <ReferenceLabModuleCard key={module.id}>
                      <ReferenceLabModuleHeader>
                        <span>{formatReferenceDate(module.sampleDate)}</span>
                        <ReferenceMeta>{`${module.items.length}件`}</ReferenceMeta>
                      </ReferenceLabModuleHeader>
                      <ReferenceLabItems>
                        {module.items.slice(0, 5).map((item) => {
                          const valueLabel = item.unit ? `${item.value} ${item.unit}` : item.value;
                          const snippet = item.unit ? `${item.label}: ${item.value} ${item.unit}` : `${item.label}: ${item.value}`;
                          const abnormal = Boolean(item.abnormalFlag && item.abnormalFlag !== 'N' && item.abnormalFlag !== '0');
                          return (
                            <ReferenceLabItemRow key={item.id}>
                              <ReferenceLabItemText>
                                <span>{item.label}</span>
                                <ReferenceLabValue $abnormal={abnormal}>{valueLabel}</ReferenceLabValue>
                              </ReferenceLabItemText>
                              <ReferenceLabItemActions>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onObjectiveInsertText(snippet)}
                                  disabled={!isLockedByMe}
                                >
                                  Oに挿入
                                </Button>
                              </ReferenceLabItemActions>
                            </ReferenceLabItemRow>
                          );
                        })}
                      </ReferenceLabItems>
                    </ReferenceLabModuleCard>
                  ))}
                </ReferenceLabList>
              )}
            </ReferenceColumnCard>
          </ReferenceSplit>
        ) : null}

      </SurfaceBody>
    </SurfaceShell>
  );
};
