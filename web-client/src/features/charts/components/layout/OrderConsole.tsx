import { useCallback, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import type { ComponentProps } from 'react';

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

const ConsoleShell = styled.aside<{ $collapsed: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? '20px' : '380px')};
  max-width: 440px;
  flex: 0 0 auto;
  background: ${({ theme }) => theme.palette.surface};
  border-left: 1px solid ${({ theme }) => theme.palette.border};
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;
`;

const CollapseButton = styled.button`
  position: absolute;
  top: 12px;
  left: -36px;
  width: 32px;
  height: 32px;
  border-radius: 16px 0 0 16px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  background: ${({ theme }) => theme.palette.surface};
  color: ${({ theme }) => theme.palette.text};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.elevation.level1};
`;

const ConsoleBody = styled.div<{ $collapsed: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: ${({ $collapsed }) => ($collapsed ? '0' : '16px')};
  opacity: ${({ $collapsed }) => ($collapsed ? 0 : 1)};
  pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
  height: 100%;
  overflow-y: auto;
`;

const TabList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1 1 96px;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surfaceMuted)};
  color: ${({ theme, $active }) => ($active ? theme.palette.onPrimary : theme.palette.text)};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border 0.2s ease;
`;

const PanelGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
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

  return (
    <ConsoleShell $collapsed={collapsed} onMouseEnter={handleHoverEnter} onMouseLeave={handleHoverLeave}>
      <ConsoleBody $collapsed={collapsed}>
        <CollapseButton type="button" onClick={onToggleCollapse} aria-label="コンソールの表示を切り替え">
          {collapsed ? '⮞' : '⮜'}
        </CollapseButton>

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

        <TabList role="tablist" aria-label="Order console tabs">
          {CONSOLE_TABS.map((tab) => (
            <TabButton
              key={tab.key}
              type="button"
              $active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              aria-label={`${tab.label}タブ`}
            >
              {tab.label}
            </TabButton>
          ))}
        </TabList>

        {activeTab === 'medication' ? (
          <PanelGroup role="tabpanel" aria-label="処方">
            {renderPlanSection('medication', '処方中のオーダ')}
            <OrderSetPanel {...orderSetProps} />
            <StampLibraryPanel {...stampLibraryRest} stamps={stampGroups.medication} />
            <OrcaOrderPanel
              {...orcaOrderProps}
              initialMode="tensu"
              onDecisionSupportUpdate={handleInteractionSupportUpdate}
            />
          </PanelGroup>
        ) : null}

        {activeTab === 'exam' ? (
          <PanelGroup role="tabpanel" aria-label="検査">
            {renderPlanSection('exam', '検査オーダ')}
            <StampLibraryPanel {...stampLibraryRest} stamps={stampGroups.exam} />
            <OrcaOrderPanel
              {...orcaOrderProps}
              initialMode="tensu"
              onDecisionSupportUpdate={handleInteractionSupportUpdate}
            />
            <LabResultsPanel {...labResultsProps} />
          </PanelGroup>
        ) : null}

        {activeTab === 'imaging' ? (
          <PanelGroup role="tabpanel" aria-label="画像">
            {renderPlanSection('imaging', '画像検査オーダ')}
            <StampLibraryPanel {...stampLibraryRest} stamps={stampGroups.imaging} />
            <OrcaOrderPanel
              {...orcaOrderProps}
              initialMode="tensu"
              onDecisionSupportUpdate={handleInteractionSupportUpdate}
            />
          </PanelGroup>
        ) : null}

        {activeTab === 'procedure' ? (
          <PanelGroup role="tabpanel" aria-label="処置">
            {renderPlanSection('procedure', '処置・手技オーダ')}
            <StampLibraryPanel {...stampLibraryRest} stamps={stampGroups.procedure} />
            <OrcaOrderPanel
              {...orcaOrderProps}
              initialMode="tensu"
              onDecisionSupportUpdate={handleInteractionSupportUpdate}
            />
          </PanelGroup>
        ) : null}

        {activeTab === 'documents' ? (
          <PanelGroup role="tabpanel" aria-label="紹介・文書">
            {renderPlanSection('documents', '紹介状・文書メモ')}
            <PatientDocumentsPanel {...patientDocumentsProps} />
            <MedicalCertificatesPanel {...medicalCertificatesProps} />
            <SchemaEditorPanel {...schemaEditorProps} />
          </PanelGroup>
        ) : null}

        {activeTab === 'billing' ? (
          <PanelGroup role="tabpanel" aria-label="会計">
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
        ) : null}
      </ConsoleBody>
    </ConsoleShell>
  );
};
