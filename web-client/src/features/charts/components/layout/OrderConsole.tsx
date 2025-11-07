import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { ComponentProps, ReactElement } from 'react';

import { Button, SelectField, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import { ClaimAdjustmentPanel } from '@/features/charts/components/ClaimAdjustmentPanel';
import { LabResultsPanel } from '@/features/charts/components/LabResultsPanel';
import { MedicalCertificatesPanel } from '@/features/charts/components/MedicalCertificatesPanel';
import { OrcaOrderPanel } from '@/features/charts/components/OrcaOrderPanel';
import { OrderSetPanel } from '@/features/charts/components/OrderSetPanel';
import { PatientDocumentsPanel } from '@/features/charts/components/PatientDocumentsPanel';
import { SchemaEditorPanel } from '@/features/charts/components/SchemaEditorPanel';
import { StampLibraryPanel } from '@/features/charts/components/StampLibraryPanel';
import type { PlanComposerCard } from '@/features/charts/components/layout/WorkSurface';
import type { DecisionSupportMessage } from '@/features/charts/types/decision-support';
import type { BillingMode } from '@/features/charts/utils/progress-note-payload';
import type { ParsedHealthInsurance } from '@/features/charts/utils/health-insurance';

const ConsoleShell = styled.aside<{ $panelVisible: boolean; $collapsed: boolean; $useModal: boolean }>`
  width: ${({ $useModal, $panelVisible, $collapsed }) => {
    if ($useModal) {
      return '48px';
    }
    if ($collapsed) {
      return '48px';
    }
    return $panelVisible ? '264px' : '48px';
  }};
  max-width: ${({ $useModal }) => ($useModal ? '48px' : '264px')};
  min-width: 48px;
  flex: 0 0 auto;
  background: ${({ theme }) => theme.palette.surface};
  border-left: 1px solid ${({ theme }) => theme.palette.border};
  display: flex;
  transition: width 0.24s ease;
  overflow: visible;
  height: 100%;
  position: relative;
`;

const IconRail = styled.nav`
  width: 48px;
  flex: 0 0 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 12px;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  border-right: 1px solid ${({ theme }) => theme.palette.border};
`;

const IconList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
`;

const IconButton = styled.button<{ $active: boolean }>`
  width: 100%;
  height: 48px;
  border: none;
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.palette.onPrimary : theme.palette.textMuted)};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  position: relative;

  &:hover {
    background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surface)};
    color: ${({ theme }) => theme.palette.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 999px;
    background: ${({ theme, $active }) => ($active ? theme.palette.primary : 'transparent')};
  }
`;

const IconGlyph = styled.span`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;

  svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
  }
`;

const RailFooter = styled.div`
  margin-top: auto;
  padding-top: 8px;
  display: flex;
  justify-content: center;
  width: 100%;
`;

const CollapseToggle = styled.button<{ $collapsed: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surface};
  color: ${({ theme }) => theme.palette.text};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, opacity 0.2s ease;

  &:hover:enabled {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const PanelContainer = styled.div<{ $visible: boolean }>`
  flex: 0 0 ${({ $visible }) => ($visible ? '216px' : '0px')};
  width: ${({ $visible }) => ($visible ? '216px' : '0px')};
  max-width: 216px;
  display: flex;
  flex-direction: column;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transform: ${({ $visible }) => ($visible ? 'translateX(0)' : 'translateX(-8px)')};
  transition: opacity 0.24s ease, transform 0.24s ease, width 0.24s ease;
  background: ${({ theme }) => theme.palette.surface};
  height: 100%;
  overflow: hidden;
`;

const PanelScroll = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edge;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const PanelHeading = styled.h2`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${({ theme }) => theme.palette.text};
`;

const PanelGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

const BillingCard = styled(SurfaceCard)`
  display: grid;
  gap: 16px;
  padding: 16px;
`;

const InlineMessage = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const SupportBanner = styled(SurfaceCard)`
  display: grid;
  gap: 8px;
  padding: 12px;
`;

const SupportList = styled.div`
  display: grid;
  gap: 8px;
`;

const SupportItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const SupportContent = styled.div`
  display: grid;
  gap: 2px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.text};
`;

const SupportMeta = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  z-index: 1200;
`;

const ModalSheet = styled.div`
  width: min(320px, 90vw);
  max-width: 320px;
  height: 100%;
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: ${({ theme }) => theme.elevation.level2};
  display: flex;
  flex-direction: column;
`;

const ModalHeaderBar = styled(PanelHeader)`
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
`;

const ModalTitle = styled(PanelHeading)`
  font-size: 1rem;
`;

const ModalCloseButton = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.palette.text};
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.accent};
    outline-offset: 2px;
  }
`;

const PlanSection = styled.div`
  display: grid;
  gap: 12px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.palette.text};
`;

const PlanCardList = styled.div`
  display: grid;
  gap: 12px;
`;

const PlanCardItem = styled(SurfaceCard)`
  display: grid;
  gap: 12px;
  padding: 16px;
`;

const PlanCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const PlanCardTitle = styled.h4`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: ${({ theme }) => theme.palette.text};
`;

const PlanCardSummary = styled.span`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const PlanCardMeta = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const MedicationIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="3.5" y="5" width="17" height="10.5" rx="5.25" ry="5.25" strokeWidth="1.6" />
    <line x1="12" y1="5" x2="12" y2="15.5" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ExamIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M9 3h6v2h-1v8.2a3.5 3.5 0 1 1-7 0V5H9z" strokeWidth="1.6" strokeLinejoin="round" />
    <line x1="9" y1="9" x2="15" y2="9" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ImagingIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="3" y="7" width="18" height="12" rx="3" ry="3" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="3.5" strokeWidth="1.6" />
    <path d="M9 7l1.2-2h3.6L15 7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProcedureIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 5v14" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M5 12h14" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const DocumentsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M8 3h7l4 4v14H8z" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M15 3v4h4" strokeWidth="1.6" strokeLinejoin="round" />
    <line x1="10" y1="14" x2="16" y2="14" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="10" y1="18" x2="16" y2="18" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const BillingIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M7 5l5 6 5-6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 11v7" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M8 14h8" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M8 17h8" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const PlanCardActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

type OrderSetPanelProps = ComponentProps<typeof OrderSetPanel>;
type StampLibraryPanelProps = ComponentProps<typeof StampLibraryPanel>;
type OrcaOrderPanelProps = ComponentProps<typeof OrcaOrderPanel>;
type LabResultsPanelProps = ComponentProps<typeof LabResultsPanel>;
type PatientDocumentsPanelProps = ComponentProps<typeof PatientDocumentsPanel>;
type MedicalCertificatesPanelProps = ComponentProps<typeof MedicalCertificatesPanel>;
type SchemaEditorPanelProps = ComponentProps<typeof SchemaEditorPanel>;
type ClaimAdjustmentPanelProps = ComponentProps<typeof ClaimAdjustmentPanel>;

type OrderConsoleBillingState = {
  mode: BillingMode;
  insuranceId: string | null;
  selfPayCategory: string;
  quantity: string;
  performer: string;
  lotNumber: string;
  memo: string;
};

export interface OrderConsoleBillingProps {
  billing: OrderConsoleBillingState;
  onModeChange: (mode: BillingMode) => void;
  updateBilling: (patch: Partial<OrderConsoleBillingState>) => void;
  canSelectInsurance: boolean;
  insuranceOptions: ParsedHealthInsurance[];
  selectedInsurance: ParsedHealthInsurance | null;
  claimSendEnabled: boolean;
  billingDisabled: boolean;
}

export interface OrderModuleSummary {
  id: string;
  entity: string;
  label: string;
  source: 'stamp' | 'orca';
}

export type PlanTab = 'medication' | 'exam' | 'imaging' | 'procedure' | 'documents';
export type ConsoleTab = PlanTab | 'billing';

const CONSOLE_TABS: { key: ConsoleTab; label: string }[] = [
  { key: 'medication', label: '処方' },
  { key: 'exam', label: '検査' },
  { key: 'imaging', label: '画像' },
  { key: 'procedure', label: '処置' },
  { key: 'documents', label: '紹介/文書' },
  { key: 'billing', label: '会計' },
];

const TAB_ICON_COMPONENTS: Record<ConsoleTab, () => ReactElement> = {
  medication: MedicationIcon,
  exam: ExamIcon,
  imaging: ImagingIcon,
  procedure: ProcedureIcon,
  documents: DocumentsIcon,
  billing: BillingIcon,
};

const ENTITY_TO_TAB: Partial<Record<string, PlanTab>> = {
  medOrder: 'medication',
  injectionOrder: 'medication',
  testOrder: 'exam',
  physiologyOrder: 'exam',
  bacteriaOrder: 'exam',
  radiologyOrder: 'imaging',
  treatmentOrder: 'procedure',
  surgeryOrder: 'procedure',
  baseChargeOrder: 'procedure',
  instractionChargeOrder: 'documents',
  otherOrder: 'procedure',
  generalOrder: 'documents',
};

const STAMP_FILTERS: Record<PlanTab, string[]> = {
  medication: ['medOrder', 'injectionOrder'],
  exam: ['testOrder', 'physiologyOrder', 'bacteriaOrder'],
  imaging: ['radiologyOrder'],
  procedure: ['treatmentOrder', 'surgeryOrder', 'baseChargeOrder', 'otherOrder'],
  documents: ['instractionChargeOrder', 'generalOrder'],
};

const EMPTY_SECTION_MESSAGE: Record<PlanTab, string> = {
  medication: 'A/P で処方オーダを追加するとここに表示されます。',
  exam: '検体検査や生体検査の予定はまだありません。',
  imaging: '画像検査オーダは追加されていません。',
  procedure: '処置・手技のオーダはまだ登録されていません。',
  documents: '紹介状や文書テンプレートの予定はまだありません。',
};

const SEVERITY_LABEL: Record<DecisionSupportMessage['severity'], string> = {
  danger: '重大',
  warning: '注意',
  info: '情報',
};

const CATEGORY_LABEL: Record<DecisionSupportMessage['category'], string> = {
  interaction: '相互作用',
  allergy: 'アレルギー',
  safety: '安全情報',
  system: '通知',
};

export interface OrderConsoleProps {
  collapsed: boolean;
  forceCollapse: boolean;
  onToggleCollapse: () => void;
  onHoverExpand: () => void;
  onHoverLeave: () => void;
  orderSetProps: OrderSetPanelProps;
  stampLibraryProps: StampLibraryPanelProps;
  orcaOrderProps: OrcaOrderPanelProps;
  labResultsProps: LabResultsPanelProps;
  patientDocumentsProps: PatientDocumentsPanelProps;
  medicalCertificatesProps: MedicalCertificatesPanelProps;
  schemaEditorProps: SchemaEditorPanelProps;
  billingProps: OrderConsoleBillingProps;
  claimAdjustmentProps: ClaimAdjustmentPanelProps;
  planCards: PlanComposerCard[];
  orderModules: OrderModuleSummary[];
  onPlanCardChange: (id: string, patch: Partial<PlanComposerCard>) => void;
  onPlanCardRemove: (id: string) => void;
  onPlanCardFocus?: (id: string) => void;
  orderEditingDisabled?: boolean;
  decisionSupportMessages?: DecisionSupportMessage[];
}

export const OrderConsole = ({
  collapsed,
  forceCollapse,
  onToggleCollapse,
  onHoverExpand,
  onHoverLeave,
  orderSetProps,
  stampLibraryProps,
  orcaOrderProps,
  labResultsProps,
  patientDocumentsProps,
  medicalCertificatesProps,
  schemaEditorProps,
  billingProps,
  claimAdjustmentProps,
  planCards,
  orderModules,
  onPlanCardChange,
  onPlanCardRemove,
  onPlanCardFocus,
  orderEditingDisabled = false,
  decisionSupportMessages = [],
}: OrderConsoleProps) => {
  const [activeTab, setActiveTab] = useState<ConsoleTab>('medication');
  const [interactionMessages, setInteractionMessages] = useState<DecisionSupportMessage[]>([]);
  const [panelModalOpen, setPanelModalOpen] = useState(false);
  const panelId = useId();
  const headingId = `${panelId}-heading`;
  const useModal = forceCollapse;
  const panelVisible = !useModal && !collapsed;
  const activeTabMeta = useMemo(
    () => CONSOLE_TABS.find((tab) => tab.key === activeTab) ?? CONSOLE_TABS[0],
    [activeTab],
  );

  const handleHoverEnter = useCallback(() => {
    if (forceCollapse) {
      onHoverExpand();
    }
  }, [forceCollapse, onHoverExpand]);

  const handleHoverLeave = useCallback(() => {
    if (forceCollapse) {
      onHoverLeave();
    }
  }, [forceCollapse, onHoverLeave]);

  const handleInteractionSupportUpdate = useCallback((messages: DecisionSupportMessage[]) => {
    setInteractionMessages(messages);
  }, []);

  useEffect(() => {
    if (!useModal) {
      if (panelModalOpen) {
        setPanelModalOpen(false);
      }
      return;
    }
    if (!panelModalOpen) {
      return;
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPanelModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [useModal, panelModalOpen]);

  const closeModal = useCallback(() => {
    setPanelModalOpen(false);
  }, []);

  const handleTabSelect = useCallback(
    (tab: ConsoleTab, { viaHover = false }: { viaHover?: boolean } = {}) => {
      if (tab !== activeTab) {
        setActiveTab(tab);
      }
      if (useModal) {
        if (!viaHover) {
          setPanelModalOpen(true);
        }
        return;
      }
      if (collapsed) {
        onToggleCollapse();
      }
    },
    [activeTab, collapsed, onToggleCollapse, useModal],
  );

  const mergedSupportMessages = useMemo(() => {
    if (decisionSupportMessages.length === 0 && interactionMessages.length === 0) {
      return [];
    }
    const merged = new Map<string, DecisionSupportMessage>();
    decisionSupportMessages.forEach((message) => merged.set(message.id, message));
    interactionMessages.forEach((message) => merged.set(message.id, message));
    return Array.from(merged.values());
  }, [decisionSupportMessages, interactionMessages]);

  const moduleMap = useMemo(
    () => new Map(orderModules.map((module) => [module.id, module])),
    [orderModules],
  );

  const groupedCards = useMemo(() => {
    const groups: Record<PlanTab, PlanComposerCard[]> = {
      medication: [],
      exam: [],
      imaging: [],
      procedure: [],
      documents: [],
    };
    planCards.forEach((card) => {
      if (!card.orderModuleId) {
        return;
      }
      const module = moduleMap.get(card.orderModuleId);
      let target = module?.entity ? ENTITY_TO_TAB[module.entity] ?? undefined : undefined;
      if (!target) {
        switch (card.type) {
          case 'medication':
          case 'injection':
            target = 'medication';
            break;
          case 'exam':
            target = 'exam';
            break;
          case 'procedure':
            target = 'procedure';
            break;
          case 'guidance':
          case 'followup':
            target = 'documents';
            break;
          default:
            target = 'procedure';
        }
      }
      if (target === 'exam' && module?.entity === 'radiologyOrder') {
        target = 'imaging';
      }
      groups[target].push(card);
    });
    return groups;
  }, [moduleMap, planCards]);

  const { stamps, ...stampLibraryRest } = stampLibraryProps;

  const stampGroups = useMemo(
    () =>
      (Object.keys(STAMP_FILTERS) as PlanTab[]).reduce(
        (acc, tab) => {
          acc[tab] = stamps.filter((stamp) => (stamp.entity ? STAMP_FILTERS[tab].includes(stamp.entity) : false));
          return acc;
        },
        {} as Record<PlanTab, typeof stamps>,
      ),
    [stamps],
  );

  const {
    billing,
    onModeChange,
    updateBilling,
    canSelectInsurance,
    insuranceOptions,
    selectedInsurance,
    claimSendEnabled,
    billingDisabled,
  } = billingProps;

  const renderPlanSection = (tab: PlanTab, title: string) => {
    const cards = groupedCards[tab];
    return (
      <PlanSection>
        <SectionHeader>
          <SectionTitle>{title}</SectionTitle>
          <StatusBadge tone="neutral">{cards.length} 件</StatusBadge>
        </SectionHeader>
        {cards.length === 0 ? (
          <SurfaceCard tone="muted">
            <InlineMessage>{EMPTY_SECTION_MESSAGE[tab]}</InlineMessage>
          </SurfaceCard>
        ) : (
          <PlanCardList>
            {cards.map((card) => {
              const module = card.orderModuleId ? moduleMap.get(card.orderModuleId) ?? null : null;
              return (
                <PlanCardItem key={card.id}>
                  <PlanCardHeader>
                    <div>
                      <PlanCardTitle>{card.title || module?.label || '未設定'}</PlanCardTitle>
                      {card.orderSummary ? <PlanCardSummary>{card.orderSummary}</PlanCardSummary> : null}
                      {module ? <PlanCardMeta>モジュール: {module.label}</PlanCardMeta> : null}
                    </div>
                    <PlanCardActions>
                      {onPlanCardFocus ? (
                        <Button type="button" size="sm" variant="ghost" onClick={() => onPlanCardFocus(card.id)}>
                          中央で編集
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onPlanCardRemove(card.id)}
                        disabled={orderEditingDisabled}
                      >
                        削除
                      </Button>
                    </PlanCardActions>
                  </PlanCardHeader>
                  <TextField
                    label="件名"
                    value={card.title}
                    onChange={(event) => onPlanCardChange(card.id, { title: event.currentTarget.value })}
                    disabled={orderEditingDisabled}
                  />
                  <TextArea
                    label="指示内容"
                    value={card.detail}
                    onChange={(event) => onPlanCardChange(card.id, { detail: event.currentTarget.value })}
                    rows={3}
                    disabled={orderEditingDisabled}
                  />
                  <TextArea
                    label="備考"
                    value={card.note}
                    onChange={(event) => onPlanCardChange(card.id, { note: event.currentTarget.value })}
                    rows={2}
                    disabled={orderEditingDisabled}
                  />
                </PlanCardItem>
              );
            })}
          </PlanCardList>
        )}
      </PlanSection>
    );
  };

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'medication':
        return (
          <PanelGroup>
            {renderPlanSection('medication', '処方中のオーダ')}
            <OrderSetPanel {...orderSetProps} />
            <StampLibraryPanel {...stampLibraryRest} stamps={stampGroups.medication} />
            <OrcaOrderPanel
              {...orcaOrderProps}
              initialMode="tensu"
              onDecisionSupportUpdate={handleInteractionSupportUpdate}
            />
          </PanelGroup>
        );
      case 'exam':
        return (
          <PanelGroup>
            {renderPlanSection('exam', '検査オーダ')}
            <StampLibraryPanel {...stampLibraryRest} stamps={stampGroups.exam} />
            <OrcaOrderPanel
              {...orcaOrderProps}
              initialMode="tensu"
              onDecisionSupportUpdate={handleInteractionSupportUpdate}
            />
            <LabResultsPanel {...labResultsProps} />
          </PanelGroup>
        );
      case 'imaging':
        return (
          <PanelGroup>
            {renderPlanSection('imaging', '画像検査オーダ')}
            <StampLibraryPanel {...stampLibraryRest} stamps={stampGroups.imaging} />
            <OrcaOrderPanel
              {...orcaOrderProps}
              initialMode="tensu"
              onDecisionSupportUpdate={handleInteractionSupportUpdate}
            />
          </PanelGroup>
        );
      case 'procedure':
        return (
          <PanelGroup>
            {renderPlanSection('procedure', '処置・手技オーダ')}
            <StampLibraryPanel {...stampLibraryRest} stamps={stampGroups.procedure} />
            <OrcaOrderPanel
              {...orcaOrderProps}
              initialMode="tensu"
              onDecisionSupportUpdate={handleInteractionSupportUpdate}
            />
          </PanelGroup>
        );
      case 'documents':
        return (
          <PanelGroup>
            {renderPlanSection('documents', '紹介状・文書メモ')}
            <PatientDocumentsPanel {...patientDocumentsProps} />
            <MedicalCertificatesPanel {...medicalCertificatesProps} />
            <SchemaEditorPanel {...schemaEditorProps} />
          </PanelGroup>
        );
      case 'billing':
        return (
          <PanelGroup>
            <BillingCard>
              <Stack gap={16}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>請求モード</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    type="button"
                    size="sm"
                    variant={billing.mode === 'insurance' ? 'primary' : 'ghost'}
                    onClick={() => onModeChange('insurance')}
                    disabled={!canSelectInsurance}
                  >
                    保険請求
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={billing.mode === 'self-pay' ? 'secondary' : 'ghost'}
                    onClick={() => onModeChange('self-pay')}
                  >
                    自費モード
                  </Button>
                  <StatusBadge tone={claimSendEnabled ? 'info' : 'warning'}>
                    CLAIM送信: {claimSendEnabled ? '有効' : '無効'}
                  </StatusBadge>
                </div>
                {billing.mode === 'insurance' ? (
                  canSelectInsurance ? (
                    <Stack gap={12}>
                      <SelectField
                        label="適用保険"
                        value={billing.insuranceId ?? (insuranceOptions[0]?.id ?? '')}
                        onChange={(event) => updateBilling({ insuranceId: event.currentTarget.value || null })}
                        options={insuranceOptions.map((option) => ({ value: option.id, label: option.label }))}
                        disabled={billingDisabled}
                      />
                      {selectedInsurance ? (
                        <InlineMessage>{selectedInsurance.description ?? selectedInsurance.label}</InlineMessage>
                      ) : null}
                    </Stack>
                  ) : (
                    <InlineMessage>受付情報に保険が紐付いていません。自費モードに切り替えて保存してください。</InlineMessage>
                  )
                ) : (
                  <Stack gap={12}>
                    <TextField
                      label="自費カテゴリ"
                      value={billing.selfPayCategory}
                      onChange={(event) => updateBilling({ selfPayCategory: event.currentTarget.value })}
                      disabled={billingDisabled}
                    />
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <TextField
                        label="数量"
                        value={billing.quantity}
                        onChange={(event) => updateBilling({ quantity: event.currentTarget.value })}
                        disabled={billingDisabled}
                      />
                      <TextField
                        label="実施者"
                        value={billing.performer}
                        onChange={(event) => updateBilling({ performer: event.currentTarget.value })}
                        disabled={billingDisabled}
                      />
                      <TextField
                        label="ロット番号"
                        value={billing.lotNumber}
                        onChange={(event) => updateBilling({ lotNumber: event.currentTarget.value })}
                        disabled={billingDisabled}
                      />
                    </div>
                    <TextArea
                      label="自費メモ"
                      value={billing.memo}
                      onChange={(event) => updateBilling({ memo: event.currentTarget.value })}
                      rows={3}
                      disabled={billingDisabled}
                    />
                  </Stack>
                )}
              </Stack>
            </BillingCard>
            <ClaimAdjustmentPanel {...claimAdjustmentProps} />
          </PanelGroup>
        );
      default:
        return null;
    }
  };

  const activeTabLabel = activeTabMeta.label;

  const corePanelContent = (
    <>
      {mergedSupportMessages.length > 0 ? (
        <SupportBanner tone="muted">
          <SectionTitle style={{ fontSize: '0.95rem' }}>意思決定支援</SectionTitle>
          <SupportList>
            {mergedSupportMessages.map((message) => (
              <SupportItem key={message.id}>
                <StatusBadge tone={message.severity}>{SEVERITY_LABEL[message.severity]}</StatusBadge>
                <SupportContent>
                  <strong>{message.headline}</strong>
                  {message.detail ? <span>{message.detail}</span> : null}
                  <SupportMeta>
                    {CATEGORY_LABEL[message.category]}
                    {message.timestamp ? ` / ${message.timestamp}` : ''}
                  </SupportMeta>
                </SupportContent>
              </SupportItem>
            ))}
          </SupportList>
        </SupportBanner>
      ) : null}
      {renderActivePanel()}
    </>
  );

  return (
    <>
      <ConsoleShell
        $panelVisible={panelVisible}
        $collapsed={collapsed}
        $useModal={useModal}
        onMouseEnter={handleHoverEnter}
        onMouseLeave={handleHoverLeave}
      >
        <IconRail aria-label="オーダーメニュー">
          <IconList>
            {CONSOLE_TABS.map((tab) => {
              const IconComponent = TAB_ICON_COMPONENTS[tab.key];
              const isActive = activeTab === tab.key;
              return (
                <IconButton
                  key={tab.key}
                  type="button"
                  $active={isActive}
                  onMouseEnter={() => handleTabSelect(tab.key, { viaHover: true })}
                  onFocus={() => handleTabSelect(tab.key, { viaHover: true })}
                  onClick={() => handleTabSelect(tab.key)}
                  aria-pressed={isActive}
                  aria-label={tab.label}
                  aria-controls={panelId}
                  title={tab.label}
                >
                  <IconGlyph>
                    <IconComponent />
                  </IconGlyph>
                </IconButton>
              );
            })}
          </IconList>
          <RailFooter>
            <CollapseToggle
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'コンソールを展開' : 'コンソールを折りたたむ'}
              $collapsed={collapsed}
              disabled={forceCollapse}
            >
              {collapsed ? '⮞' : '⮜'}
            </CollapseToggle>
          </RailFooter>
        </IconRail>
        <PanelContainer $visible={panelVisible} aria-hidden={!panelVisible}>
          {panelVisible ? (
            <PanelScroll id={panelId} role="tabpanel" aria-labelledby={headingId} aria-label={activeTabLabel}>
              <PanelHeader>
                <PanelHeading id={headingId}>{activeTabLabel}</PanelHeading>
              </PanelHeader>
              {corePanelContent}
            </PanelScroll>
          ) : null}
        </PanelContainer>
      </ConsoleShell>
      {useModal && panelModalOpen ? (
        <ModalOverlay onClick={closeModal}>
          <ModalSheet
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            onClick={(event) => event.stopPropagation()}
          >
            <ModalHeaderBar>
              <ModalTitle id={headingId}>{activeTabLabel}</ModalTitle>
              <ModalCloseButton type="button" aria-label="閉じる" onClick={closeModal}>
                ×
              </ModalCloseButton>
            </ModalHeaderBar>
            <PanelScroll id={panelId} role="tabpanel" aria-labelledby={headingId} aria-label={activeTabLabel}>
              {corePanelContent}
            </PanelScroll>
          </ModalSheet>
        </ModalOverlay>
      ) : null}
    </>
  );
};
