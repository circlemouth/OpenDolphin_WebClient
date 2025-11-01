import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
const buildUpdatedDocumentPayload = (
  original: DocumentModelPayload,
  updated: DocumentModelPayload,
): DocumentModelPayload => {
  const mergedDocInfo: DocInfoSummary = {
    ...original.docInfoModel,
    ...updated.docInfoModel,
    docPk: original.docInfoModel.docPk || original.id,
    parentPk: original.docInfoModel.parentPk ?? updated.docInfoModel.parentPk ?? null,
    docId: updated.docInfoModel.docId ?? original.docInfoModel.docId,
    firstConfirmDate: updated.docInfoModel.firstConfirmDate ?? original.docInfoModel.firstConfirmDate,
    versionNumber: updated.docInfoModel.versionNumber ?? original.docInfoModel.versionNumber ?? '1',
    status: updated.docInfoModel.status ?? original.docInfoModel.status ?? 'F',
    creatorLicense: updated.docInfoModel.creatorLicense ?? original.docInfoModel.creatorLicense,
    createrLisence:
      updated.docInfoModel.createrLisence ??
      updated.docInfoModel.creatorLicense ??
      original.docInfoModel.createrLisence ??
      original.docInfoModel.creatorLicense ??
      null,
    pVTHealthInsuranceModel:
      updated.docInfoModel.pVTHealthInsuranceModel ?? original.docInfoModel.pVTHealthInsuranceModel,
  };

  return {
    ...original,
    docInfoModel: mergedDocInfo,
    modules: updated.modules.length ? updated.modules : original.modules,
    schema: updated.schema.length ? updated.schema : original.schema,
    attachment: original.attachment,
    karteBean: updated.karteBean ?? original.karteBean,
    userModel: updated.userModel ?? original.userModel,
    memo: updated.memo ?? original.memo,
  };
};
import { useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { useNavigate, useParams } from 'react-router-dom';

import { Button, SelectField, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import { recordOperationEvent } from '@/libs/audit';
import { StampLibraryPanel } from '@/features/charts/components/StampLibraryPanel';
import { OrcaOrderPanel } from '@/features/charts/components/OrcaOrderPanel';
import { OrderSetPanel } from '@/features/charts/components/OrderSetPanel';
import { PatientDocumentsPanel } from '@/features/charts/components/PatientDocumentsPanel';
import { MedicalCertificatesPanel } from '@/features/charts/components/MedicalCertificatesPanel';
import { SchemaEditorPanel } from '@/features/charts/components/SchemaEditorPanel';
import { LabResultsPanel } from '@/features/charts/components/LabResultsPanel';
import { CareMapPanel } from '@/features/charts/components/CareMapPanel';
import { DocumentTimelinePanel } from '@/features/charts/components/DocumentTimelinePanel';
import { DiagnosisPanel } from '@/features/charts/components/DiagnosisPanel';
import { ObservationPanel } from '@/features/charts/components/ObservationPanel';
import { ClaimAdjustmentPanel } from '@/features/charts/components/ClaimAdjustmentPanel';
import { publishChartEvent } from '@/features/charts/api/chart-event-api';
import { useChartEventSubscription } from '@/features/charts/hooks/useChartEventSubscription';
import { useChartLock } from '@/features/charts/hooks/useChartLock';
import { usePatientVisits } from '@/features/charts/hooks/usePatientVisits';
import { useStampLibrary } from '@/features/charts/hooks/useStampLibrary';
import { useOrderSets } from '@/features/charts/hooks/useOrderSets';
import { useFreeDocument } from '@/features/charts/hooks/useFreeDocument';
import { useDocumentAttachments } from '@/features/charts/hooks/useDocumentAttachments';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { StampDefinition } from '@/features/charts/types/stamp';
import type { OrderSetDefinition } from '@/features/charts/types/order-set';
import { saveProgressNote } from '@/features/charts/api/progress-note-api';
import type { ProgressNoteDraft } from '@/features/charts/utils/progress-note-payload';
import type { BillingMode, ProgressNoteBilling } from '@/features/charts/utils/progress-note-payload';
import { extractInsuranceOptions } from '@/features/charts/utils/health-insurance';
import type { ParsedHealthInsurance } from '@/features/charts/utils/health-insurance';
import { updatePatientMemo } from '@/features/patients/api/patient-memo-api';
import { usePatientKarte } from '@/features/patients/hooks/usePatientKarte';
import { buildSafetyNotes } from '@/features/patients/utils/safety-notes';
import { determineSafetyTone, type SafetyTone } from '@/features/charts/utils/caution-tone';
import { defaultKarteFromDate, formatRestDate } from '@/features/patients/utils/rest-date';
import { useAuth } from '@/libs/auth';
import { fetchOrcaOrderModules } from '@/features/charts/api/orca-api';
import { PatientHeaderBar } from '@/features/charts/components/layout/PatientHeaderBar';
import { VisitChecklist, type VisitChecklistItem } from '@/features/charts/components/layout/VisitChecklist';
import {
  WorkSurface,
  type PlanComposerCard,
  type SurfaceMode,
} from '@/features/charts/components/layout/WorkSurface';
import { RightPane, type PastSummaryItem } from '@/features/charts/components/layout/RightPane';
import type { MediaItem } from '@/features/charts/types/media';
import type { DocInfoSummary, DocumentModelPayload } from '@/features/charts/types/doc';
import type { ModuleModelPayload } from '@/features/charts/types/module';
import {
  PatientMemoHistoryDialog,
  type PatientMemoHistoryEntry,
} from '@/features/charts/components/layout/PatientMemoHistoryDialog';
import { MiniSummaryDock } from '@/features/charts/components/layout/MiniSummaryDock';
import { StatusBar } from '@/features/charts/components/layout/StatusBar';
import { UnifiedSearchOverlay } from '@/features/charts/components/layout/UnifiedSearchOverlay';
import { ImageViewerOverlay } from '@/features/charts/components/layout/ImageViewerOverlay';
import { DiffMergeOverlay } from '@/features/charts/components/layout/DiffMergeOverlay';
import { BIT_OPEN } from '@/features/charts/utils/visit-state';
import { calculateAgeLabel } from '@/features/charts/utils/age-label';

const PageShell = styled.div`
  --charts-header-height: 76px;
  --charts-footer-height: 56px;
  --charts-workspace-viewport: calc(100vh - var(--charts-header-height, 76px) - var(--charts-footer-height, 56px));
  min-height: 100vh;
  height: 100vh;
  background: ${({ theme }) => theme.palette.background};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentViewport = styled.main`
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
`;

const ContentScrollArea = styled.div`
  height: 100%;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
`;

const ContentGrid = styled.div`
  --charts-workspace-vertical-padding: 56px;
  --charts-column-gap: clamp(16px, 2.2vw, 28px);
  display: grid;
  grid-template-columns: clamp(240px, 22%, 300px) minmax(0, 1fr) clamp(320px, 26%, 360px);
  grid-template-areas: 'left center right';
  align-items: start;
  column-gap: var(--charts-column-gap);
  row-gap: 24px;
  padding: 24px 32px 32px;
  min-height: 100%;
  box-sizing: border-box;

  @media (max-width: 1440px) {
    padding: 24px 28px 30px;
    --charts-workspace-vertical-padding: 54px;
  }

  @media (max-width: 1180px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'left'
      'center'
      'right';
    row-gap: 20px;
    padding: 20px 24px 28px;
    --charts-workspace-vertical-padding: 48px;
    --charts-column-gap: 20px;
  }

  @media (max-width: 768px) {
    padding: 16px 16px 24px;
    row-gap: 16px;
    --charts-workspace-vertical-padding: 40px;
  }
`;

const LeftRail = styled.div`
  grid-area: left;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const LeftRailContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
`;

const LeftRailSpacer = styled.div`
  flex: 1 1 auto;
`;

const LeftPanelCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
`;

const LeftPanelTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.palette.text};
`;

const LeftPanelBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BadgeWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const LeftPanelEmpty = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const VitalList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const VitalListItem = styled.li`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.text};
`;

const VitalLabel = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const VitalValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
`;

const CentralColumn = styled.div`
  grid-area: center;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const CentralScroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const WorkspaceStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RightRail = styled.div`
  grid-area: right;
  display: flex;
  min-height: 0;
  justify-content: flex-end;
  @media (max-width: 1180px) {
    justify-content: flex-start;
    width: 100%;
  }
`;

const SupplementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
`;

const ClinicalPanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ClinicalTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ClinicalTabButton = styled.button<{ $active: boolean }>`
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 6px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surfaceMuted)};
  color: ${({ theme, $active }) => ($active ? theme.palette.onPrimary : theme.palette.text)};
  box-shadow: ${({ theme, $active }) => ($active ? theme.elevation.level1 : 'none')};
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.palette.primaryStrong : theme.palette.surfaceStrong};
  }
`;

const EmptyStateCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  justify-content: center;
  min-height: 320px;
`;

const EmptyStateActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const InlineMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.textMuted};
  font-size: 0.85rem;
`;

const InlineError = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.palette.danger};
  font-size: 0.9rem;
`;

const defaultDraft: ProgressNoteDraft = {
  title: '',
  subjective: '',
  objective: '',
  assessment: '',
  plan: '',
};

type BillingState = {
  mode: BillingMode;
  insuranceId: string | null;
  selfPayCategory: string;
  quantity: string;
  performer: string;
  lotNumber: string;
  memo: string;
};

type SafetyAlert = {
  id: string;
  label: string;
  tone: SafetyTone;
};

const SELF_PAY_OPTIONS = [
  { value: '950', label: 'その他の自費（非課税）' },
  { value: '960', label: 'その他の自費（課税）' },
] as const;

const createInitialBillingState = (
  mode: BillingMode,
  insuranceId: string | null,
  performer?: string,
): BillingState => ({
  mode,
  insuranceId,
  selfPayCategory: '950',
  quantity: '1',
  performer: performer ?? '',
  lotNumber: '',
  memo: '',
});

const INITIAL_CHECKLIST: VisitChecklistItem[] = [
  { id: 'interview', label: '問診', completed: false, instantSave: false },
  { id: 'vitals', label: 'バイタル', completed: false, instantSave: false },
  { id: 'procedure', label: '処置', completed: false, instantSave: false },
  { id: 'billing', label: '会計', completed: false, instantSave: false },
];

const SEARCH_SECTIONS = ['O', '薬', '処置', '検査', 'フォローアップ', 'テンプレ', '過去カルテ', 'A&P'] as const;

const SEARCH_SECTION_LABELS = SEARCH_SECTIONS.map((section) => section as string);

type SearchSection = (typeof SEARCH_SECTIONS)[number];

type SearchResultItem = {
  id: string;
  label: string;
  detail: string;
  section: SearchSection;
  payload: string;
  planType?: PlanComposerCard['type'];
};

const ORDER_ENTITY_PLAN_TYPE: Record<string, PlanComposerCard['type']> = {
  medOrder: 'medication',
  injectionOrder: 'injection',
  treatmentOrder: 'procedure',
  surgeryOrder: 'procedure',
  testOrder: 'exam',
  physiologyOrder: 'exam',
  bacteriaOrder: 'exam',
  radiologyOrder: 'exam',
  baseChargeOrder: 'procedure',
  instractionChargeOrder: 'guidance',
  otherOrder: 'procedure',
  generalOrder: 'followup',
};

const ORDER_ENTITY_LABEL: Record<string, string> = {
  medOrder: '処方',
  injectionOrder: '注射',
  treatmentOrder: '処置',
  surgeryOrder: '手術',
  testOrder: '検体検査',
  physiologyOrder: '生体検査',
  bacteriaOrder: '細菌検査',
  radiologyOrder: '画像検査',
  baseChargeOrder: '診察料',
  instractionChargeOrder: '指導・在宅',
  otherOrder: 'その他',
  generalOrder: '汎用',
};

const getEntityLabel = (entity: string) => ORDER_ENTITY_LABEL[entity] ?? 'オーダ';

interface OrderModuleDraft {
  id: string;
  source: 'stamp' | 'orca';
  stampId?: string;
  label: string;
  moduleInfo: {
    stampName: string;
    stampRole: string;
    entity: string;
    stampNumber: number;
    stampId?: string;
  };
  beanBytes: string;
}

const createOrderModuleId = () => globalThis.crypto?.randomUUID?.() ?? `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildOrderSummary = (draft: OrderModuleDraft) => {
  const label = getEntityLabel(draft.moduleInfo.entity);
  const name = draft.moduleInfo.stampName || draft.label;
  return `${label}: ${name}`;
};

const serializePlanCards = (cards: PlanComposerCard[]) =>
  cards
    .map((card) => {
      const rows = [
        `[${card.type}] ${card.title || '未入力'}`,
        card.detail,
        card.note ? `メモ: ${card.note}` : null,
      ].filter(Boolean);
      return rows.join('\n');
    })
    .join('\n\n');

const createPlanCard = (
  type: PlanComposerCard['type'],
  detail = '',
  title = '',
  extras?: Partial<Pick<PlanComposerCard, 'orderModuleId' | 'orderSummary'>>,
): PlanComposerCard => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type,
  title,
  detail,
  note: '',
  orderModuleId: extras?.orderModuleId ?? null,
  orderSummary: extras?.orderSummary ?? null,
});
const decodeBase64String = (input: string): string => {
  try {
    const bufferLike = (globalThis as {
      Buffer?: { from: (value: string, encoding: string) => { toString: (encoding: string) => string } };
    }).Buffer;

    if (bufferLike) {
      return bufferLike.from(input, 'base64').toString('utf-8');
    }

    if (typeof globalThis.atob === 'function') {
      const binary = globalThis.atob(input);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes);
    }
  } catch (error) {
    console.error('Base64 decode failed', error);
  }
  return '';
};

const decodeXmlEntities = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, '\n');

const decodeProgressCourseText = (beanBytes?: string | null): string => {
  if (!beanBytes) {
    return '';
  }
  const xml = decodeBase64String(beanBytes);
  if (!xml) {
    return '';
  }
  const match = xml.match(/<string>([\s\S]*?)<\/string>/);
  if (!match) {
    return '';
  }
  return decodeXmlEntities(match[1] ?? '');
};

const splitSoaSections = (text: string) => {
  const sections = {
    subjective: '',
    objective: '',
    assessment: '',
  };
  const blocks = text.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);
  blocks.forEach((block) => {
    if (block.startsWith('S:')) {
      sections.subjective = block.replace(/^S:\s*/, '').trim();
      return;
    }
    if (block.startsWith('O:')) {
      sections.objective = block.replace(/^O:\s*/, '').trim();
      return;
    }
    if (block.startsWith('A:')) {
      sections.assessment = block.replace(/^A:\s*/, '').trim();
    }
  });
  return sections;
};

const convertModuleToOrderDraft = (module: ModuleModelPayload, index: number): OrderModuleDraft | null => {
  if (!module.moduleInfoBean?.entity || !module.beanBytes) {
    return null;
  }
  return {
    id: createOrderModuleId(),
    source: 'stamp',
    stampId: module.moduleInfoBean.stampId ?? undefined,
    label: module.moduleInfoBean.stampName ?? module.moduleInfoBean.entity,
    moduleInfo: {
      stampName: module.moduleInfoBean.stampName ?? '',
      stampRole: module.moduleInfoBean.stampRole ?? '',
      entity: module.moduleInfoBean.entity,
      stampNumber: module.moduleInfoBean.stampNumber ?? index,
      stampId: module.moduleInfoBean.stampId ?? undefined,
    },
    beanBytes: module.beanBytes,
  } satisfies OrderModuleDraft;
};

type DocumentPresetState = {
  templateId: string;
  memo?: string;
  extraNote?: string;
  version: number;
};

const FORCE_COLLAPSE_BREAKPOINT = 860;
const AUTO_EXPAND_BREAKPOINT = 1320;

export const ChartsPage = () => {
  useChartEventSubscription();

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const params = useParams<{ visitId?: string }>();
  const { session } = useAuth();
  const doctorDisplayName =
    session?.userProfile?.displayName ??
    (session?.userProfile as { commonName?: string } | undefined)?.commonName ??
    session?.credentials.userId ?? '';
  const visitsQuery = usePatientVisits();
  const userPk = session?.userProfile?.userModelId ?? null;
  const stampLibraryQuery = useStampLibrary(userPk);
  const canLoadStampLibrary = Boolean(userPk);
  const {
    orderSets,
    createOrderSet,
    updateOrderSet,
    deleteOrderSet,
    markOrderSetUsed,
    importSharedOrderSets,
  } = useOrderSets();
  const [draft, setDraft] = useState<ProgressNoteDraft>(defaultDraft);
  const [billing, setBilling] = useState<BillingState>(
    createInitialBillingState('insurance', null, session?.userProfile?.displayName),
  );
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [chiefComplaintDirty, setChiefComplaintDirty] = useState(false);
  const [chiefComplaintStatus, setChiefComplaintStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [chiefComplaintError, setChiefComplaintError] = useState<string | null>(null);
  const [diagnosisTags, setDiagnosisTags] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<VisitChecklistItem[]>(INITIAL_CHECKLIST);
  const [activeSurface, setActiveSurface] = useState<SurfaceMode>('objective');
  const [planCards, setPlanCards] = useState<PlanComposerCard[]>([]);
  const previousPlanCardsRef = useRef<PlanComposerCard[] | null>(null);
  const [focusedPlanCardId, setFocusedPlanCardId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [orderModules, setOrderModules] = useState<OrderModuleDraft[]>([]);
  const [editingDocument, setEditingDocument] = useState<DocumentModelPayload | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(undefined);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rightPaneCollapsed, setRightPaneCollapsed] = useState(false);
  const [forceCollapse, setForceCollapse] = useState(false);
  const forceCollapseRef = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSection, setSearchSection] = useState<SearchSection>('O');
  const [searchIndex, setSearchIndex] = useState(0);
  const [imageViewer, setImageViewer] = useState<{ open: boolean; media: MediaItem | null }>({
    open: false,
    media: null,
  });
  const [diffMergeState, setDiffMergeState] = useState<{
    open: boolean;
    title: string;
    current: string[];
    incoming: string[];
  }>({ open: false, title: '', current: [], incoming: [] });
  const [miniSummaryLines, setMiniSummaryLines] = useState<string[]>([]);
  const [unsentTaskCount, setUnsentTaskCount] = useState<number>(INITIAL_CHECKLIST.length);
  const [documentPreset, setDocumentPreset] = useState<DocumentPresetState | null>(null);
  const [lastAppliedOrderSetId, setLastAppliedOrderSetId] = useState<string | null>(null);
  const [patientMemo, setPatientMemo] = useState('');
  const [patientMemoId, setPatientMemoId] = useState<number | null>(null);
  const [patientMemoDirty, setPatientMemoDirty] = useState(false);
  const [patientMemoStatus, setPatientMemoStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [patientMemoError, setPatientMemoError] = useState<string | null>(null);
  const [patientMemoUpdatedAt, setPatientMemoUpdatedAt] = useState<string | null>(null);
  const [isPatientMemoHistoryOpen, setPatientMemoHistoryOpen] = useState(false);
  const [freeDocumentComment, setFreeDocumentComment] = useState('');
  const [freeDocumentId, setFreeDocumentId] = useState<number | null>(null);
  const [freeDocumentDirty, setFreeDocumentDirty] = useState(false);
  const [freeDocumentStatus, setFreeDocumentStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [freeDocumentError, setFreeDocumentError] = useState<string | null>(null);
  const [freeDocumentUpdatedAt, setFreeDocumentUpdatedAt] = useState<string | null>(null);
  const chiefComplaintRef = useRef<HTMLInputElement | null>(null);
  const isComposingRef = useRef(false);

  const selectedVisitId = useMemo(() => {
    if (!params.visitId) {
      return null;
    }
    const parsed = Number.parseInt(params.visitId, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [params.visitId]);

  const visits = useMemo(() => visitsQuery.data ?? [], [visitsQuery.data]);
  const selectedVisit = useMemo<PatientVisitSummary | null>(() => {
    if (!selectedVisitId) {
      return null;
    }
    return visits.find((visit) => visit.visitId === selectedVisitId) ?? null;
  }, [selectedVisitId, visits]);
  const visitNotFound = Boolean(selectedVisitId && !selectedVisit && !visitsQuery.isLoading);

  const insuranceOptions = useMemo<ParsedHealthInsurance[]>(() => extractInsuranceOptions(selectedVisit), [selectedVisit]);
  const canSelectInsurance = insuranceOptions.length > 0;
  const selectedInsurance = useMemo<ParsedHealthInsurance | null>(() => {
    if (billing.mode !== 'insurance') {
      return null;
    }
    if (!billing.insuranceId) {
      return null;
    }
    return insuranceOptions.find((option) => option.id === billing.insuranceId) ?? null;
  }, [billing.insuranceId, billing.mode, insuranceOptions]);
  const selectedSelfPayOption = useMemo(
    () => SELF_PAY_OPTIONS.find((option) => option.value === billing.selfPayCategory) ?? SELF_PAY_OPTIONS[0],
    [billing.selfPayCategory],
  );
  const billingPayload = useMemo<ProgressNoteBilling>(() => {
    if (billing.mode === 'insurance') {
      return {
        mode: 'insurance' as const,
        classCode: selectedInsurance?.classCode,
        description: selectedInsurance?.description ?? selectedInsurance?.label ?? '',
        guid: selectedInsurance?.guid ?? selectedVisit?.insuranceUid ?? undefined,
      };
    }

    return {
      mode: 'self-pay' as const,
      receiptCode: billing.selfPayCategory,
      label: selectedSelfPayOption.label,
      quantity: billing.quantity.trim() || undefined,
      performer: billing.performer.trim() || undefined,
      lotNumber: billing.lotNumber.trim() || undefined,
      memo: billing.memo.trim() || undefined,
    };
  }, [
    billing.mode,
    billing.selfPayCategory,
    billing.quantity,
    billing.performer,
    billing.lotNumber,
    billing.memo,
    selectedInsurance,
    selectedSelfPayOption.label,
    selectedVisit?.insuranceUid,
  ]);
  const claimSendEnabled = billing.mode === 'insurance' && Boolean(selectedInsurance?.classCode);
  const billingDisabled = !selectedVisit;
  const karteQuery = usePatientKarte(selectedVisit?.patientId ?? null, {
    fromDate: undefined,
    enabled: Boolean(selectedVisit),
  });

  const [docInfos, setDocInfos] = useState<DocInfoSummary[]>([]);
  const [activeClinicalTab, setActiveClinicalTab] = useState<'observation' | 'claim'>('observation');

  const karteId = karteQuery.data?.id ?? null;
  const patientPk = selectedVisit?.patientPk ?? null;
  const patientSummaryForDocuments = useMemo(() => {
    if (!selectedVisit) {
      return null;
    }
    const raw = selectedVisit.raw.patientModel;
    const address = raw?.simpleAddressModel?.address ?? undefined;
    const zipCode = raw?.simpleAddressModel?.zipCode ?? undefined;
    const telephone = raw?.telephone ?? undefined;
    const mobilePhone = raw?.mobilePhone ?? undefined;
    const birthday = selectedVisit.birthday ?? raw?.birthday ?? undefined;
    const gender = selectedVisit.gender ?? raw?.gender ?? raw?.genderDesc ?? undefined;
    return {
      id: selectedVisit.patientId,
      name: selectedVisit.fullName,
      kana: selectedVisit.kanaName ?? raw?.kanaName ?? undefined,
      gender,
      birthday,
      ageLabel: calculateAgeLabel(birthday),
      address,
      zipCode,
      telephone,
      mobilePhone,
    };
  }, [selectedVisit]);
  const latestPatientMemo = useMemo(() => karteQuery.data?.memos?.[0] ?? null, [karteQuery.data?.memos]);
  const refetchKarte = karteQuery.refetch;
  const freeDocumentQuery = useFreeDocument(selectedVisit?.patientId ?? null, {
    enabled: Boolean(selectedVisit),
  });
  const latestFreeDocument = useMemo(() => freeDocumentQuery.data ?? null, [freeDocumentQuery.data]);
  const timelineFromDate = useMemo(() => {
    if (selectedVisit?.visitDate) {
      const date = new Date(selectedVisit.visitDate);
      if (!Number.isNaN(date.getTime())) {
        return formatRestDate(date);
      }
    }
    if (karteQuery.data?.created) {
      const date = new Date(karteQuery.data.created);
      if (!Number.isNaN(date.getTime())) {
        return formatRestDate(date);
      }
    }
    return defaultKarteFromDate();
  }, [karteQuery.data?.created, selectedVisit?.visitDate]);

  useEffect(() => {
    if (karteQuery.data?.documents && karteQuery.data.documents.length > 0 && docInfos.length === 0) {
      setDocInfos(karteQuery.data.documents);
    }
  }, [karteQuery.data?.documents, docInfos.length]);

  useEffect(() => {
    if (!selectedVisit) {
      setDocInfos([]);
    }
  }, [selectedVisit?.visitId]);

  useEffect(() => {
    setEditingDocument(null);
  }, [selectedVisit?.visitId]);

  const clientUuid = session?.credentials.clientUuid;
  const lock = useChartLock(selectedVisit, clientUuid);

  useEffect(() => {
    if (!selectedVisit) {
      return;
    }
    const performer = session?.userProfile?.displayName;
    setBilling(createInitialBillingState('insurance', null, performer));
    setChecklist(INITIAL_CHECKLIST);
    setUnsentTaskCount(INITIAL_CHECKLIST.length);
    setDraft(defaultDraft);
    setPlanCards([]);
    setOrderModules([]);
    previousPlanCardsRef.current = null;
    setChiefComplaint(selectedVisit.memo ?? '');
    setChiefComplaintDirty(false);
    setChiefComplaintStatus('idle');
    setChiefComplaintError(null);
    setDiagnosisTags([]);
    setSaveState('saved');
    setHasUnsavedChanges(false);
    setSaveError(null);
    setDocumentPreset(null);
    setLastAppliedOrderSetId(null);
    setPatientMemo('');
    setPatientMemoId(null);
    setPatientMemoDirty(false);
    setPatientMemoStatus('idle');
    setPatientMemoError(null);
    setPatientMemoUpdatedAt(null);
    setFreeDocumentComment('');
    setFreeDocumentId(null);
    setFreeDocumentDirty(false);
    setFreeDocumentStatus('idle');
    setFreeDocumentError(null);
    setFreeDocumentUpdatedAt(null);
  }, [selectedVisit, selectedVisit?.visitId, session?.userProfile?.displayName]);

  useEffect(() => {
    if (selectedVisit) {
      return;
    }
    setBilling(createInitialBillingState('insurance', null, session?.userProfile?.displayName));
    setChecklist(INITIAL_CHECKLIST);
    setUnsentTaskCount(INITIAL_CHECKLIST.length);
    setDraft(defaultDraft);
    setPlanCards([]);
    setOrderModules([]);
    previousPlanCardsRef.current = null;
    setChiefComplaint('');
    setChiefComplaintDirty(false);
    setChiefComplaintStatus('idle');
    setChiefComplaintError(null);
    setDiagnosisTags([]);
    setSaveState('saved');
    setHasUnsavedChanges(false);
    setSaveError(null);
    setDocumentPreset(null);
    setLastAppliedOrderSetId(null);
    setPatientMemo('');
    setPatientMemoId(null);
    setPatientMemoDirty(false);
    setPatientMemoStatus('idle');
    setPatientMemoError(null);
    setPatientMemoUpdatedAt(null);
    setFreeDocumentComment('');
    setFreeDocumentId(null);
    setFreeDocumentDirty(false);
    setFreeDocumentStatus('idle');
    setFreeDocumentError(null);
    setFreeDocumentUpdatedAt(null);
  }, [selectedVisit, session?.userProfile?.displayName]);

  useEffect(() => {
    if (!selectedVisit) {
      return;
    }
    const defaultInsuranceId = insuranceOptions[0]?.id ?? null;
    if (billing.mode === 'insurance' && !billing.insuranceId && defaultInsuranceId) {
      setBilling((prev) => ({ ...prev, insuranceId: defaultInsuranceId }));
    }
    if (billing.mode === 'insurance' && !defaultInsuranceId) {
      setBilling((prev) => ({ ...prev, mode: 'self-pay', insuranceId: null }));
    }
  }, [insuranceOptions, selectedVisit, billing.mode, billing.insuranceId]);

  useEffect(() => {
    if (chiefComplaintStatus !== 'saved') {
      return;
    }
    const timer = window.setTimeout(() => setChiefComplaintStatus('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [chiefComplaintStatus]);

  useEffect(() => {
    if (patientMemoStatus !== 'saved') {
      return;
    }
    const timer = window.setTimeout(() => setPatientMemoStatus('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [patientMemoStatus]);

  useEffect(() => {
    if (freeDocumentStatus !== 'saved') {
      return;
    }
    const timer = window.setTimeout(() => setFreeDocumentStatus('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [freeDocumentStatus]);

  const monshinSummary = useMemo(() => {
    const memos = karteQuery.data?.memos ?? [];
    if (memos.length === 0) {
      return [];
    }
    return memos.slice(0, 3).map((memo) => ({
      id: `memo-${memo.id}`,
      question: memo.confirmed ? memo.confirmed : 'スタンプ記録',
      answer: memo.memo ?? '記録なし',
    }));
  }, [karteQuery.data?.memos]);

  const patientMemoHistory = useMemo<PatientMemoHistoryEntry[]>(() => {
    const memos = karteQuery.data?.memos ?? [];
    return memos
      .map((memo) => ({
        id: memo.id,
        memo: memo.memo?.trim() ?? '',
        confirmed: memo.confirmed ?? null,
        status: memo.status ?? undefined,
      }))
      .sort((a, b) => {
        const timeA = a.confirmed ? Date.parse(a.confirmed) : Number.MIN_SAFE_INTEGER;
        const timeB = b.confirmed ? Date.parse(b.confirmed) : Number.MIN_SAFE_INTEGER;
        if (!Number.isNaN(timeB - timeA) && timeB !== timeA) {
          return timeB - timeA;
        }
        return b.id - a.id;
      });
  }, [karteQuery.data?.memos]);

  useEffect(() => {
    if (!latestFreeDocument) {
      setFreeDocumentId(null);
      setFreeDocumentUpdatedAt(null);
      if (!freeDocumentDirty || freeDocumentStatus === 'saved') {
        setFreeDocumentComment('');
        setFreeDocumentDirty(false);
        if (freeDocumentStatus === 'saved') {
          setFreeDocumentStatus('idle');
        }
      }
      return;
    }

    setFreeDocumentId(latestFreeDocument.id ?? null);
    setFreeDocumentUpdatedAt(latestFreeDocument.confirmedAt ?? null);
    if (!freeDocumentDirty || freeDocumentStatus === 'saved') {
      setFreeDocumentComment(latestFreeDocument.comment ?? '');
      setFreeDocumentDirty(false);
      if (freeDocumentStatus === 'saved') {
        setFreeDocumentStatus('idle');
      }
    }
  }, [latestFreeDocument, freeDocumentDirty, freeDocumentStatus]);

  const vitalSigns = useMemo(
    () =>
      draft.objective
        ? Array.from(
            draft.objective.matchAll(
              /(BP|SpO2|HR|Temp)\s*[:=\uFF1A\u30FB-]?\s*([^\n]+)/gi,
            ),
          ).map((match, index) => ({
            id: `vital-${index}`,
            label: match[1].toUpperCase(),
            value: match[2].trim(),
          }))
        : [],
    [draft.objective],
  );

  const safetyAlerts = useMemo<SafetyAlert[]>(() => {
    const alerts = new Map<string, SafetyTone>();
    const cautionNotes = buildSafetyNotes(selectedVisit?.safetyNotes ?? []);
    cautionNotes.forEach((note) => {
      if (!alerts.has(note)) {
        alerts.set(note, determineSafetyTone(note));
      }
    });

    const allergyNotesRaw = (karteQuery.data?.allergies ?? []).map((allergy, index) => {
      const detailParts = [
        allergy.factor ?? '',
        allergy.severity ? `(${allergy.severity})` : '',
        allergy.memo ?? '',
      ]
        .map((part) => part.trim())
        .filter(Boolean);
      const detail = detailParts.join(' ');
      const base = detail || allergy.factor || `アレルギー ${index + 1}`;
      return `アレルギー: ${base}`.trim();
    });

    const allergyNotes = buildSafetyNotes(allergyNotesRaw);
    allergyNotes.forEach((note) => {
      if (!alerts.has(note)) {
        alerts.set(note, determineSafetyTone(note));
      }
    });

    return Array.from(alerts.entries()).map(([label, tone], index) => ({
      id: `safety-${index}`,
      label,
      tone,
    }));
}, [karteQuery.data?.allergies, selectedVisit?.safetyNotes]);

  const problemList = useMemo(() => buildSafetyNotes(diagnosisTags), [diagnosisTags]);

  useEffect(() => {
    if (!latestPatientMemo) {
      setPatientMemoId(null);
      setPatientMemoUpdatedAt(null);
      if (!patientMemoDirty || patientMemoStatus === 'saved') {
        setPatientMemo('');
        setPatientMemoDirty(false);
      }
      if (patientMemoStatus === 'saved') {
        setPatientMemoStatus('idle');
      }
      return;
    }

    setPatientMemoId(latestPatientMemo.id);
    setPatientMemoUpdatedAt(latestPatientMemo.confirmed ?? null);
    if (!patientMemoDirty || patientMemoStatus === 'saved') {
      setPatientMemo(latestPatientMemo.memo ?? '');
      setPatientMemoDirty(false);
      if (patientMemoStatus === 'saved') {
        setPatientMemoStatus('idle');
      }
    }
  }, [latestPatientMemo, patientMemoDirty, patientMemoStatus]);

  const pastSummaries: PastSummaryItem[] = useMemo(() => {
    const documents = karteQuery.data?.documents ?? [];
    return documents.slice(0, 5).map((doc) => ({
      id: `doc-${doc.docPk}`,
      title: doc.title,
      excerpt: doc.departmentDesc ?? doc.status ?? '詳細なし',
      recordedAt: doc.confirmDate ?? undefined,
    }));
  }, [karteQuery.data?.documents]);

  const documentIds = useMemo(() => (karteQuery.data?.documents ?? []).map((doc) => doc.docPk), [karteQuery.data?.documents]);

  const attachmentsQuery = useDocumentAttachments(documentIds, {
    enabled: Boolean(selectedVisit?.patientId && documentIds.length > 0),
  });

  const mediaItems: MediaItem[] = useMemo(() => {
    const source = attachmentsQuery.data;
    if (!source || source.length === 0) {
      return [];
    }
    const toTime = (value?: string | null): number => {
      if (!value) {
        return Number.NEGATIVE_INFINITY;
      }
      const normalized = value.includes('T') ? value : value.replace(' ', 'T');
      const time = new Date(normalized).getTime();
      return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
    };
    return source
      .slice()
      .sort((a, b) => {
        const timeA = toTime(a.recordedAt ?? a.confirmedAt ?? a.createdAt ?? null);
        const timeB = toTime(b.recordedAt ?? b.confirmedAt ?? b.createdAt ?? null);
        return timeB - timeA;
      })
      .slice(0, 12)
      .map((attachment) => {
        const capturedAt = attachment.recordedAt ?? attachment.confirmedAt ?? attachment.createdAt ?? null;
        return {
          id: `attachment-${attachment.id}`,
          title: attachment.title,
          capturedAt,
          description: attachment.description ?? attachment.documentTitle ?? undefined,
          attachmentId: attachment.id,
          documentId: attachment.documentId,
          fileName: attachment.fileName,
          size: attachment.size,
          contentType: attachment.contentType,
          kind: attachment.kind,
          documentTitle: attachment.documentTitle,
          documentDepartment: attachment.documentDepartment,
          documentStatus: attachment.documentStatus,
          uri: attachment.uri ?? null,
        };
      });
  }, [attachmentsQuery.data]);

  const mediaItemsLoading = attachmentsQuery.isLoading;
  const mediaItemsError = attachmentsQuery.error ? '画像添付の取得に失敗しました。再読み込みしてください。' : null;

  useEffect(() => {
    setMiniSummaryLines(pastSummaries.slice(0, 3).map((item) => `${item.title} - ${item.excerpt}`));
  }, [pastSummaries]);

  const updatePlanCards = useCallback(
    (updater: (cards: PlanComposerCard[]) => PlanComposerCard[]) => {
      setPlanCards((prev) => {
        const snapshot = prev.map((card) => ({ ...card }));
        const next = updater(prev);
        previousPlanCardsRef.current = snapshot;
        setDraft((draftPrev) => ({ ...draftPrev, plan: serializePlanCards(next) }));
        setSaveState('idle');
        setHasUnsavedChanges(true);
        return next;
      });
    },
    [],
  );

  const registerOrderModules = useCallback(
    (drafts: OrderModuleDraft[]) => {
      if (drafts.length === 0) {
        return;
      }
      setOrderModules((prev) => [...prev, ...drafts]);
      updatePlanCards((cards) => {
        const appended = drafts.map((draft) => {
          const entity = draft.moduleInfo.entity;
          const planType = ORDER_ENTITY_PLAN_TYPE[entity] ?? 'followup';
          const summary = buildOrderSummary(draft);
          const title = draft.moduleInfo.stampName || draft.label;
          const detail = draft.label || draft.moduleInfo.stampName;
          return createPlanCard(planType, detail, title, {
            orderModuleId: draft.id,
            orderSummary: summary,
          });
        });
        return [...cards, ...appended];
      });
    },
    [updatePlanCards],
  );

  const handlePlanCardChange = useCallback(
    (id: string, patch: Partial<PlanComposerCard>) => {
      updatePlanCards((cards) =>
        cards.map((card) => (card.id === id ? { ...card, ...patch } : card)),
      );
    },
    [updatePlanCards],
  );

  const handlePlanCardRemove = useCallback(
    (id: string) => {
      let moduleToRemove: string | null = null;
      updatePlanCards((cards) => {
        const target = cards.find((card) => card.id === id);
        moduleToRemove = target?.orderModuleId ?? null;
        return cards.filter((card) => card.id !== id);
      });
      if (moduleToRemove) {
        setOrderModules((prev) => prev.filter((module) => module.id !== moduleToRemove));
      }
    },
    [updatePlanCards],
  );

  const handlePlanCardInsert = useCallback(
    (type: PlanComposerCard['type']) => {
      updatePlanCards((cards) => [...cards, createPlanCard(type)]);
    },
    [updatePlanCards],
  );

  const handlePlanCardReorder = useCallback(
    (fromId: string, toId: string) => {
      updatePlanCards((cards) => {
        const fromIndex = cards.findIndex((card) => card.id === fromId);
        const toIndex = cards.findIndex((card) => card.id === toId);
        if (fromIndex === -1 || toIndex === -1) {
          return cards;
        }
        const next = [...cards];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
    },
    [updatePlanCards],
  );

  const handlePlanUndo = useCallback(() => {
    if (previousPlanCardsRef.current) {
      const snapshot = previousPlanCardsRef.current;
      setPlanCards(snapshot);
      setDraft((prev) => ({ ...prev, plan: serializePlanCards(snapshot) }));
      setOrderModules((prev) => prev.filter((module) => snapshot.some((card) => card.orderModuleId === module.id)));
      previousPlanCardsRef.current = null;
    }
  }, []);

  const handleObjectiveInsertText = useCallback((text: string) => {
    setDraft((prev) => ({ ...prev, objective: prev.objective ? `${prev.objective}\n${text}` : text }));
    setSaveState('idle');
    setHasUnsavedChanges(true);
  }, []);

  const handlePlanInsertText = useCallback(
    (text: string) => {
      if (focusedPlanCardId) {
        updatePlanCards((cards) =>
          cards.map((card) =>
            card.id === focusedPlanCardId
              ? { ...card, detail: card.detail ? `${card.detail}\n${text}` : text }
              : card,
          ),
        );
        return;
      }
      updatePlanCards((cards) => [...cards, createPlanCard('followup', text)]);
    },
    [focusedPlanCardId, updatePlanCards],
  );

  const handlePlanCardFocus = useCallback((id: string) => {
    setFocusedPlanCardId(id);
  }, []);

  const handleChiefComplaintChange = useCallback(
    (value: string) => {
      setChiefComplaint(value);
      if (!selectedVisit) {
        setChiefComplaintDirty(false);
        setChiefComplaintStatus('idle');
        setChiefComplaintError(null);
        return;
      }
      const original = selectedVisit.memo?.trim() ?? '';
      const normalized = value.trim();
      setChiefComplaintDirty(normalized !== original);
      setChiefComplaintStatus('idle');
      setChiefComplaintError(null);
    },
    [selectedVisit],
  );

  const handleChiefComplaintReset = useCallback(() => {
    setChiefComplaint(selectedVisit?.memo ?? '');
    setChiefComplaintDirty(false);
    setChiefComplaintStatus('idle');
    setChiefComplaintError(null);
  }, [selectedVisit]);

  const handleChiefComplaintCommit = useCallback(async () => {
    if (!selectedVisit) {
      return;
    }
    if (!chiefComplaintDirty && chiefComplaintStatus !== 'error') {
      return;
    }
    const normalized = chiefComplaint.trim();
    const original = selectedVisit.memo?.trim() ?? '';
    if (normalized === original && chiefComplaintStatus !== 'error') {
      setChiefComplaintDirty(false);
      setChiefComplaintStatus('idle');
      setChiefComplaintError(null);
      return;
    }

    setChiefComplaint(normalized);
    setChiefComplaintStatus('saving');
    setChiefComplaintError(null);

    try {
      setSaveState('saving');
      setSaveError(null);

      const progressContext = {
        draft,
        visit: selectedVisit,
        karteId,
        session,
        facilityName: session.userProfile?.facilityName,
        userDisplayName: session.userProfile?.displayName ?? session.userProfile?.commonName,
        userModelId: session.userProfile?.userModelId,
        licenseName: session.userProfile?.licenseName,
        departmentCode: selectedVisit.departmentCode,
        departmentName: selectedVisit.departmentName,
        billing: billingPayload,
        orderModules: orderModules.map((module) => ({
          moduleInfoBean: {
            stampName: module.moduleInfo.stampName,
            stampRole: module.moduleInfo.stampRole,
            stampNumber: module.moduleInfo.stampNumber,
            entity: module.moduleInfo.entity,
            stampId: module.moduleInfo.stampId ?? undefined,
          },
          beanBytes: module.beanBytes,
        })),
      };

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(progressContext);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        await saveProgressNote(progressContext, nextState, selectedVisit.visitId);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [
    buildSafetyNotes,
    billingPayload,
    chiefComplaint,
    chiefComplaintDirty,
    chiefComplaintStatus,
    publishChartEvent,
    queryClient,
    recordOperationEvent,
    selectedVisit,
  ]);

  const handlePatientMemoChange = useCallback(
    (value: string) => {
      setPatientMemo(value);
      const normalized = value.trim();
      const original = latestPatientMemo?.memo?.trim() ?? '';
      setPatientMemoDirty(normalized !== original);
      setPatientMemoStatus('idle');
      setPatientMemoError(null);
    },
    [latestPatientMemo],
  );

  const handlePatientMemoReset = useCallback(() => {
    setPatientMemo(latestPatientMemo?.memo ?? '');
    setPatientMemoDirty(false);
    setPatientMemoStatus('idle');
    setPatientMemoError(null);
  }, [latestPatientMemo]);

  const handlePatientMemoHistoryOpen = () => {
    if (patientMemoHistory.length === 0) {
      return;
    }
    setPatientMemoHistoryOpen(true);
  };

  const handlePatientMemoHistoryClose = () => {
    setPatientMemoHistoryOpen(false);
  };

  const handlePatientMemoHistoryRestore = (entry: PatientMemoHistoryEntry) => {
    const restoredMemo = entry.memo ?? '';
    setPatientMemo(restoredMemo);
    const normalized = restoredMemo.trim();
    const original = latestPatientMemo?.memo?.trim() ?? '';
    setPatientMemoDirty(normalized !== original);
    setPatientMemoStatus('idle');
    setPatientMemoError(null);
    setPatientMemoUpdatedAt(entry.confirmed ?? null);
    setPatientMemoHistoryOpen(false);
    if (selectedVisit) {
      recordOperationEvent('chart', 'info', 'patient_memo_history_apply', '患者メモの過去バージョンを展開しました', {
        patientId: selectedVisit.patientId,
        karteId,
        restoredMemoId: entry.id,
        restoredLength: normalized.length,
      });
    }
  };

  const handlePatientMemoSave = useCallback(async () => {
    if (!selectedVisit) {
      return;
    }
    if (!karteId) {
      setPatientMemoStatus('error');
      setPatientMemoError('カルテ情報を取得できませんでした。ページを再読み込みしてください。');
      return;
    }
    if (!session) {
      setPatientMemoStatus('error');
      setPatientMemoError('セッション情報が無効です。再度ログインしてください。');
      return;
    }
    if (!patientMemoDirty && patientMemoStatus !== 'error') {
      return;
    }

    const normalized = patientMemo.trim();
    setPatientMemo(normalized);
    setPatientMemoStatus('saving');
    setPatientMemoError(null);

    try {
      setSaveState('saving');
      setSaveError(null);

      const progressContext = {
        draft,
        visit: selectedVisit,
        karteId,
        session,
        facilityName: session.userProfile?.facilityName,
        userDisplayName: session.userProfile?.displayName ?? session.userProfile?.commonName,
        userModelId: session.userProfile?.userModelId,
        licenseName: session.userProfile?.licenseName,
        departmentCode: selectedVisit.departmentCode,
        departmentName: selectedVisit.departmentName,
        billing: billingPayload,
        orderModules: orderModules.map((module) => ({
          moduleInfoBean: {
            stampName: module.moduleInfo.stampName,
            stampRole: module.moduleInfo.stampRole,
            stampNumber: module.moduleInfo.stampNumber,
            entity: module.moduleInfo.entity,
            stampId: module.moduleInfo.stampId ?? undefined,
          },
          beanBytes: module.beanBytes,
        })),
      };

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(progressContext);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        await saveProgressNote(progressContext, nextState, selectedVisit.visitId);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [
    billingPayload,
    karteId,
    patientMemo,
    patientMemoDirty,
    patientMemoId,
    patientMemoStatus,
    refetchKarte,
    recordOperationEvent,
    selectedVisit,
    session,
    updatePatientMemo,
  ]);

  const handleFreeDocumentChange = useCallback(
    (value: string) => {
      setFreeDocumentComment(value);
      const normalized = value.trim();
      const original = latestFreeDocument?.comment?.trim() ?? '';
      setFreeDocumentDirty(normalized !== original);
      setFreeDocumentStatus('idle');
      setFreeDocumentError(null);
    },
    [latestFreeDocument],
  );

  const handleFreeDocumentReset = useCallback(() => {
    setFreeDocumentComment(latestFreeDocument?.comment ?? '');
    setFreeDocumentDirty(false);
    setFreeDocumentStatus('idle');
    setFreeDocumentError(null);
  }, [latestFreeDocument]);

  const handleFreeDocumentSave = useCallback(async () => {
    if (!selectedVisit) {
      return;
    }
    if (!session) {
      setFreeDocumentStatus('error');
      setFreeDocumentError('セッション情報が無効です。再度ログインしてください。');
      return;
    }
    if (!freeDocumentDirty && freeDocumentStatus !== 'error') {
      return;
    }

    const normalized = freeDocumentComment.trim();
    setFreeDocumentComment(normalized);
    setFreeDocumentStatus('saving');
    setFreeDocumentError(null);

    try {
      setSaveState('saving');
      setSaveError(null);

      const progressContext = {
        draft,
        visit: selectedVisit,
        karteId,
        session,
        facilityName: session.userProfile?.facilityName,
        userDisplayName: session.userProfile?.displayName ?? session.userProfile?.commonName,
        userModelId: session.userProfile?.userModelId,
        licenseName: session.userProfile?.licenseName,
        departmentCode: selectedVisit.departmentCode,
        departmentName: selectedVisit.departmentName,
        billing: billingPayload,
        orderModules: orderModules.map((module) => ({
          moduleInfoBean: {
            stampName: module.moduleInfo.stampName,
            stampRole: module.moduleInfo.stampRole,
            stampNumber: module.moduleInfo.stampNumber,
            entity: module.moduleInfo.entity,
            stampId: module.moduleInfo.stampId ?? undefined,
          },
          beanBytes: module.beanBytes,
        })),
      };

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(progressContext);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        await saveProgressNote(progressContext, nextState, selectedVisit.visitId);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [
    billingPayload,
    freeDocumentComment,
    freeDocumentDirty,
    freeDocumentId,
    freeDocumentStatus,
    freeDocumentQuery,
    recordOperationEvent,
    selectedVisit,
    session,
  ]);

  const handleDraftChange = useCallback((key: keyof ProgressNoteDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaveState('idle');
    setHasUnsavedChanges(true);
  }, []);

  const updateBilling = useCallback(
    (patch: Partial<BillingState>) => {
      setBilling((prev) => ({ ...prev, ...patch }));
      setSaveError(null);
      setSaveState('idle');
      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleBillingModeChange = useCallback(
    (mode: BillingMode) => {
      if (mode === 'insurance' && !canSelectInsurance) {
        return;
      }
      updateBilling({
        mode,
        insuranceId: mode === 'insurance' ? billing.insuranceId ?? (insuranceOptions[0]?.id ?? null) : billing.insuranceId,
      });
    },
    [billing.insuranceId, canSelectInsurance, insuranceOptions, updateBilling],
  );

  const isLockedByMe = useMemo(
    () => Boolean(selectedVisit && clientUuid && selectedVisit.ownerUuid === clientUuid),
    [clientUuid, selectedVisit],
  );
  const isLockedByOther = useMemo(
    () => Boolean(selectedVisit && selectedVisit.ownerUuid && clientUuid && selectedVisit.ownerUuid !== clientUuid),
    [clientUuid, selectedVisit],
  );

  const handleLock = useCallback(async () => {
    if (!selectedVisit) {
      setSaveError('診察対象の受付を選択してください');
      return;
    }
    setSaveError(null);
    try {
      setSaveState('saving');
      setSaveError(null);

      const progressContext = {
        draft,
        visit: selectedVisit,
        karteId,
        session,
        facilityName: session.userProfile?.facilityName,
        userDisplayName: session.userProfile?.displayName ?? session.userProfile?.commonName,
        userModelId: session.userProfile?.userModelId,
        licenseName: session.userProfile?.licenseName,
        departmentCode: selectedVisit.departmentCode,
        departmentName: selectedVisit.departmentName,
        billing: billingPayload,
        orderModules: orderModules.map((module) => ({
          moduleInfoBean: {
            stampName: module.moduleInfo.stampName,
            stampRole: module.moduleInfo.stampRole,
            stampNumber: module.moduleInfo.stampNumber,
            entity: module.moduleInfo.entity,
            stampId: module.moduleInfo.stampId ?? undefined,
          },
          beanBytes: module.beanBytes,
        })),
      };

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(progressContext);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        await saveProgressNote(progressContext, nextState, selectedVisit.visitId);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [billingPayload, lock, selectedVisit]);

  const handleSave = useCallback(async () => {
    if (!session || !selectedVisit) {
      setSaveError('保存対象の診察情報が選択されていません');
      return;
    }
    if (!clientUuid || selectedVisit.ownerUuid !== clientUuid) {
      setSaveError('診察を開始してから保存してください');
      return;
    }
    const karteId = karteQuery.data?.id;
    if (!karteId) {
      setSaveError('カルテ情報の取得に失敗しました。再度お試しください。');
      return;
    }
    if (billing.mode === 'insurance' && !selectedInsurance) {
      setSaveError('適用する保険を選択してください');
      return;
    }

    try {
      setSaveState('saving');
      setSaveError(null);

      const progressContext = {
        draft,
        visit: selectedVisit,
        karteId,
        session,
        facilityName: session.userProfile?.facilityName,
        userDisplayName: session.userProfile?.displayName ?? session.userProfile?.commonName,
        userModelId: session.userProfile?.userModelId,
        licenseName: session.userProfile?.licenseName,
        departmentCode: selectedVisit.departmentCode,
        departmentName: selectedVisit.departmentName,
        billing: billingPayload,
        orderModules: orderModules.map((module) => ({
          moduleInfoBean: {
            stampName: module.moduleInfo.stampName,
            stampRole: module.moduleInfo.stampRole,
            stampNumber: module.moduleInfo.stampNumber,
            entity: module.moduleInfo.entity,
            stampId: module.moduleInfo.stampId ?? undefined,
          },
          beanBytes: module.beanBytes,
        })),
      };

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(progressContext);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        await saveProgressNote(progressContext, nextState, selectedVisit.visitId);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [
    session,
    selectedVisit,
    clientUuid,
    karteQuery,
    billingPayload,
    billing,
    selectedInsurance,
    selectedSelfPayOption.label,
    draft,
    lock,
    orderModules,
    editingDocument,
  ]);

  const handleUnlock = useCallback(async () => {
    if (!selectedVisit) {
      setSaveError('診察対象の受付を選択してください');
      return;
    }
    if (saveState === 'saving') {
      setSaveError('保存処理が完了してから診察を終了してください');
      return;
    }
    if (hasUnsavedChanges) {
      await handleSave();
      return;
    }
    setSaveError(null);
    try {
      setSaveState('saving');
      setSaveError(null);

      const progressContext = {
        draft,
        visit: selectedVisit,
        karteId,
        session,
        facilityName: session.userProfile?.facilityName,
        userDisplayName: session.userProfile?.displayName ?? session.userProfile?.commonName,
        userModelId: session.userProfile?.userModelId,
        licenseName: session.userProfile?.licenseName,
        departmentCode: selectedVisit.departmentCode,
        departmentName: selectedVisit.departmentName,
        billing: billingPayload,
        orderModules: orderModules.map((module) => ({
          moduleInfoBean: {
            stampName: module.moduleInfo.stampName,
            stampRole: module.moduleInfo.stampRole,
            stampNumber: module.moduleInfo.stampNumber,
            entity: module.moduleInfo.entity,
            stampId: module.moduleInfo.stampId ?? undefined,
          },
          beanBytes: module.beanBytes,
        })),
      };

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(progressContext);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        await saveProgressNote(progressContext, nextState, selectedVisit.visitId);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [billingPayload, handleSave, hasUnsavedChanges, lock, saveState, selectedVisit]);

  const handleSaveDraft = useCallback(() => {
    void handleSave();
  }, [handleSave]);

  const handleAddDiagnosisTag = useCallback(
    (value: string) => {
      setDiagnosisTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    },
    [],
  );

  const handleRemoveDiagnosisTag = useCallback((value: string) => {
    setDiagnosisTags((prev) => prev.filter((tag) => tag !== value));
  }, []);

  const handleChecklistToggle = useCallback((id: string) => {
    setChecklist((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item));
      setUnsentTaskCount(next.filter((item) => !item.completed).length);
      return next;
    });
  }, []);

  const handleChecklistInstant = useCallback((id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, instantSave: !item.instantSave } : item)));
  }, []);

  const handleEditDocument = useCallback(
    (document: DocumentModelPayload) => {
      setEditingDocument(document);
      setSaveState('idle');
      setSaveError(null);

      const modules = document.modules ?? [];
      const soaModule = modules.find((module) => module.moduleInfoBean?.stampRole === 'soaSpec');
      const planModule = modules.find((module) => module.moduleInfoBean?.stampRole === 'pSpec');
      const soaSections = splitSoaSections(decodeProgressCourseText(soaModule?.beanBytes));
      const planRaw = decodeProgressCourseText(planModule?.beanBytes);
      const planText = planRaw.replace(/^P:\s*/, '').trim();

      setDraft({
        title: document.docInfoModel?.title ?? '',
        subjective: soaSections.subjective,
        objective: soaSections.objective,
        assessment: soaSections.assessment,
        plan: planText,
      });

      const orderDrafts = modules
        .filter((module) => module.moduleInfoBean?.entity && module.moduleInfoBean.entity !== 'progressCourse')
        .map((module, index) => convertModuleToOrderDraft(module, index))
        .filter((draft): draft is OrderModuleDraft => Boolean(draft));

      setOrderModules(orderDrafts);
      setPlanCards([]);

      if (document.docInfoModel?.sendClaim) {
        const performer = session?.userProfile?.displayName ?? session?.userProfile?.commonName ?? '';
        setBilling(
          createInitialBillingState(
            'insurance',
            document.docInfoModel?.healthInsuranceGUID ?? document.docInfoModel?.healthInsurance ?? null,
            performer,
          ),
        );
      } else {
        const performer = session?.userProfile?.displayName ?? session?.userProfile?.commonName ?? '';
        setBilling({
          ...createInitialBillingState('self-pay', null, performer),
          mode: 'self-pay',
          selfPayCategory: document.docInfoModel?.healthInsurance ?? '950',
          memo: document.docInfoModel?.healthInsuranceDesc ?? '',
        });
      }

      setHasUnsavedChanges(false);
      setActiveSurface('objective');
    },
    [session],
  );

  const handleCancelEditing = useCallback(() => {
    const performer = session?.userProfile?.displayName ?? session?.userProfile?.commonName;
    setEditingDocument(null);
    setDraft(defaultDraft);
    setPlanCards([]);
    setOrderModules([]);
    setBilling(createInitialBillingState('insurance', null, performer));
    setHasUnsavedChanges(false);
    setSaveState('idle');
    setSaveError(null);
    setActiveSurface('objective');
  }, [session]);

  const handleToggleSurface = useCallback((mode: SurfaceMode) => {
    setActiveSurface(mode);
  }, []);

  const handleInsertStamp = useCallback(
    (stamp: StampDefinition) => {
      void (async () => {
        if (!isLockedByMe) {
          setSaveError('診察を開始してからスタンプを挿入してください');
          return;
        }
        const contextLabel = stamp.path.slice(1).join(' / ');
        const snippet = [stamp.name, stamp.entity ? `(${stamp.entity})` : null, contextLabel ? `[${contextLabel}]` : null]
          .filter(Boolean)
          .join(' ');

        if (activeSurface === 'objective') {
          handleObjectiveInsertText(snippet);
        }

        if (!stamp.stampId) {
          updatePlanCards((cards) => [...cards, createPlanCard('procedure', snippet, stamp.name)]);
          setSaveError('スタンプに ID が未割り当てのため、テキストとして挿入しました。');
          return;
        }

        try {
      setSaveState('saving');
      setSaveError(null);

      const progressContext = {
        draft,
        visit: selectedVisit,
        karteId,
        session,
        facilityName: session.userProfile?.facilityName,
        userDisplayName: session.userProfile?.displayName ?? session.userProfile?.commonName,
        userModelId: session.userProfile?.userModelId,
        licenseName: session.userProfile?.licenseName,
        departmentCode: selectedVisit.departmentCode,
        departmentName: selectedVisit.departmentName,
        billing: billingPayload,
        orderModules: orderModules.map((module) => ({
          moduleInfoBean: {
            stampName: module.moduleInfo.stampName,
            stampRole: module.moduleInfo.stampRole,
            stampNumber: module.moduleInfo.stampNumber,
            entity: module.moduleInfo.entity,
            stampId: module.moduleInfo.stampId ?? undefined,
          },
          beanBytes: module.beanBytes,
        })),
      };

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(progressContext);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        await saveProgressNote(progressContext, nextState, selectedVisit.visitId);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date().toLocaleTimeString());
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
      })();
    },
    [
      activeSurface,
      billingPayload,
      handleObjectiveInsertText,
      isLockedByMe,
      recordOperationEvent,
      registerOrderModules,
      setSaveError,
      updatePlanCards,
    ],
  );

  const handleApplyOrderSet = useCallback(
    (definition: OrderSetDefinition) => {
        if (!isLockedByMe) {
          setSaveError('診察を開始してからオーダセットを適用してください');
          return;
        }

      const appendDraftField = (field: 'subjective' | 'assessment', value?: string) => {
        const snippet = value?.trim();
        if (!snippet) {
          return;
        }
        setDraft((prev) => {
          const current = prev[field] ?? '';
          return {
            ...prev,
            [field]: current ? `${current}\n${snippet}` : snippet,
          };
        });
      };

      appendDraftField('subjective', definition.progressNote?.subjective);
      appendDraftField('assessment', definition.progressNote?.assessment);
      if (definition.progressNote?.objective?.trim()) {
        handleObjectiveInsertText(definition.progressNote.objective.trim());
      }

      if (definition.planItems.length > 0) {
        updatePlanCards((cards) => [
          ...cards,
          ...definition.planItems.map((item) => ({
            ...createPlanCard(item.type, item.detail, item.title),
            note: item.note,
          })),
        ]);
      }

      if (definition.documentPreset) {
        setDocumentPreset({
          templateId: definition.documentPreset.templateId,
          memo: definition.documentPreset.memo,
          extraNote: definition.documentPreset.extraNote,
          version: Date.now(),
        });
      }

      setActiveSurface('plan');
      setSaveState('idle');
      setHasUnsavedChanges(true);
      setSaveError(null);
      setLastAppliedOrderSetId(definition.id);
      markOrderSetUsed(definition.id);
    },
    [handleObjectiveInsertText, isLockedByMe, markOrderSetUsed, updatePlanCards],
  );

  const handleCreateOrderFromOrca = useCallback(
    async ({ code, name }: { code: string; name: string }) => {
      if (!isLockedByMe) {
        throw new Error('診察を開始してからオーダを追加してください');
      }
      const modules = await fetchOrcaOrderModules(code, name);
      if (modules.length === 0) {
        throw new Error('ORCA から診療行為を取得できませんでした');
      }
      const drafts: OrderModuleDraft[] = modules
        .map((module, index) => {
          if (!module.moduleInfoBean || !module.beanBytes) {
            return null;
          }
          return {
            id: createOrderModuleId(),
            source: 'orca' as const,
            label: `${name} (${code})`,
            moduleInfo: {
              stampName: module.moduleInfoBean.stampName,
              stampRole: module.moduleInfoBean.stampRole ?? 'p',
              entity: module.moduleInfoBean.entity ?? 'generalOrder',
              stampNumber: module.moduleInfoBean.stampNumber ?? index,
              stampId: module.moduleInfoBean.stampId ?? undefined,
            },
            beanBytes: module.beanBytes,
          } satisfies OrderModuleDraft;
        })
        .filter((draft): draft is OrderModuleDraft => Boolean(draft));

      if (drafts.length === 0) {
        throw new Error('ORCA から取得したスタンプに有効なデータが含まれていません');
      }

      registerOrderModules(drafts);
      recordOperationEvent('chart', 'info', 'order_module_add', 'ORCA マスターからオーダを追加しました', {
        code,
        count: drafts.length,
      });
      setSaveError(null);
    },
    [isLockedByMe, recordOperationEvent, registerOrderModules],
  );

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const base: SearchResultItem[] = [];
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      base.push(
        ...diagnosisTags
          .filter((tag) => tag.toLowerCase().includes(query))
          .map((tag) => ({
            id: `dx-${tag}`,
            label: tag,
            detail: '診断タグ',
            section: 'A&P' as const,
            payload: tag,
            planType: 'followup',
          })),
      );
    }
    if (stampLibraryQuery.data) {
      base.push(
        ...stampLibraryQuery.data
          .filter((stamp) =>
            query
              ? stamp.name.toLowerCase().includes(query) ||
                stamp.entity?.toLowerCase().includes(query) ||
                stamp.path.join(' / ').toLowerCase().includes(query)
              : true,
          )
          .map((stamp) => ({
            id: stamp.stampId ?? stamp.name,
            label: stamp.name,
            detail: stamp.path.join(' / '),
            section:
              stamp.entity === 'medication'
                ? ('薬' as const)
                : stamp.entity === 'test'
                ? ('検査' as const)
                : stamp.entity === 'procedure'
                ? ('処置' as const)
                : ('A&P' as const),
            payload: [stamp.name, stamp.memo].filter(Boolean).join(' '),
            planType:
              stamp.entity === 'medication'
                ? 'medication'
                : stamp.entity === 'test'
                ? 'exam'
                : stamp.entity === 'procedure'
                ? 'procedure'
                : 'followup',
          })),
      );
    }
    base.push(
      ...pastSummaries.map((summary) => ({
        id: `history-${summary.id}`,
        label: summary.title,
        detail: summary.excerpt,
        section: '過去カルテ' as const,
        payload: `${summary.title}: ${summary.excerpt}`,
      })),
    );
    if (draft.objective) {
      base.push({
        id: 'current-objective',
        label: '現在の所見を引用',
        detail: draft.objective.slice(0, 64),
        section: 'O',
        payload: draft.objective,
      });
    }
    if (draft.assessment) {
      base.push({
        id: 'current-assessment',
        label: '現在の評価を引用',
        detail: draft.assessment.slice(0, 64),
        section: 'A&P',
        payload: draft.assessment,
        planType: 'followup',
      });
    }

    return base.filter((item) => (query ? item.label.toLowerCase().includes(query) || item.detail.toLowerCase().includes(query) : true));
  }, [diagnosisTags, draft.assessment, draft.objective, pastSummaries, searchQuery, stampLibraryQuery.data]);

  const filteredSearchResults = useMemo(() => searchResults.filter((item) => item.section === searchSection), [searchResults, searchSection]);

  useEffect(() => {
    if (searchIndex >= filteredSearchResults.length) {
      setSearchIndex(0);
    }
  }, [filteredSearchResults.length, searchIndex]);

  const handleSearchConfirm = useCallback(
    (item: SearchResultItem) => {
      if (item.section === 'O' || item.section === '繝・Φ繝励Ξ') {
        handleObjectiveInsertText(item.payload);
      } else {
        const type = item.planType ?? 'followup';
        updatePlanCards((cards) => [...cards, createPlanCard(type, item.payload, item.label)]);
      }
      setSearchOpen(false);
      setSearchQuery('');
    },
    [handleObjectiveInsertText, updatePlanCards],
  );

  const handleCallNextPatient = useCallback(() => {
    if (visits.length === 0) {
      navigate('/reception');
      return;
    }
    if (!selectedVisitId) {
      navigate(`/charts/${visits[0].visitId}`);
      return;
    }
    const currentIndex = visits.findIndex((visit) => visit.visitId === selectedVisitId);
    const next = visits[(currentIndex + 1) % visits.length];
    navigate(`/charts/${next.visitId}`);
  }, [navigate, selectedVisitId, visits]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < FORCE_COLLAPSE_BREAKPOINT) {
        forceCollapseRef.current = true;
        setForceCollapse(true);
        setRightPaneCollapsed(true);
        return;
      }

      const wasForced = forceCollapseRef.current;
      forceCollapseRef.current = false;
      setForceCollapse(false);

      if (wasForced || width >= AUTO_EXPAND_BREAKPOINT) {
        setRightPaneCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (isComposingRef.current) {
        return;
      }
      if (event.key === 'F1') {
        event.preventDefault();
        chiefComplaintRef.current?.focus();
      }
      if (event.key === 'F2') {
        event.preventDefault();
        setActiveSurface((prev) => (prev === 'objective' ? 'plan' : 'objective'));
      }
      if (event.key === 'F3') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSaveDraft();
      }
      if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown') && focusedPlanCardId) {
        event.preventDefault();
        const currentIndex = planCards.findIndex((card) => card.id === focusedPlanCardId);
        if (currentIndex === -1) {
          return;
        }
        const targetIndex = event.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= planCards.length) {
          return;
        }
        const targetId = planCards[targetIndex].id;
        handlePlanCardReorder(focusedPlanCardId, targetId);
      }
      if (event.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
        } else if (imageViewer.open) {
          setImageViewer({ open: false, media: null });
        } else if (diffMergeState.open) {
          setDiffMergeState((prev) => ({ ...prev, open: false }));
        }
      }
      if (searchOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSearchIndex((prev) => Math.min(prev + 1, filteredSearchResults.length - 1));
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSearchIndex((prev) => Math.max(prev - 1, 0));
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          const item = filteredSearchResults[searchIndex];
          if (item) {
            handleSearchConfirm(item);
          }
        }
      }
    };

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };
    const handleCompositionEnd = () => {
      isComposingRef.current = false;
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('compositionstart', handleCompositionStart);
    window.addEventListener('compositionend', handleCompositionEnd);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('compositionstart', handleCompositionStart);
      window.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [
    filteredSearchResults,
    focusedPlanCardId,
    handlePlanCardReorder,
    handleSaveDraft,
    handleSearchConfirm,
    imageViewer.open,
    diffMergeState.open,
    planCards,
    searchIndex,
    searchOpen,
  ]);

  const handleSnippetDragStart = useCallback((snippet: string) => {
    navigator?.clipboard?.writeText?.(snippet).catch(() => undefined);
  }, []);

  const handleMediaOpen = useCallback((media: MediaItem) => {
    setImageViewer({ open: true, media });
  }, []);

  const handlePastSummaryOpen = useCallback(
    (item: PastSummaryItem) => {
      setDiffMergeState({
        open: true,
        title: item.title,
        current: draft.plan ? draft.plan.split('\n').filter(Boolean) : [],
        incoming: item.excerpt.split('\n').map((paragraph) => paragraph.trim()).filter(Boolean),
      });
    },
    [draft.plan],
  );

  const handleDiffMerge = useCallback(
    (selected: string[]) => {
      selected.forEach((paragraph) => handlePlanInsertText(paragraph));
      setDiffMergeState((prev) => ({ ...prev, open: false }));
    },
    [handlePlanInsertText],
  );

  const handleMiniSummaryExpand = useCallback(() => {
    if (pastSummaries[0]) {
      handlePastSummaryOpen(pastSummaries[0]);
    }
  }, [handlePastSummaryOpen, pastSummaries]);

  return (
    <PageShell>
      <PatientHeaderBar
        ref={chiefComplaintRef}
        patient={selectedVisit}
        chiefComplaint={chiefComplaint}
        onChiefComplaintChange={handleChiefComplaintChange}
        diagnosisTags={diagnosisTags}
        onAddDiagnosisTag={handleAddDiagnosisTag}
        onRemoveDiagnosisTag={handleRemoveDiagnosisTag}
        cautionFlags={selectedVisit?.safetyNotes ?? []}
        onToggleLock={isLockedByMe ? handleUnlock : handleLock}
        isLockedByMe={isLockedByMe}
        isLockedByOther={isLockedByOther}
        isLockPending={lock.isPending}
        onOpenSearch={() => setSearchOpen(true)}
        canEdit={Boolean(selectedVisit)}
      />
      <ContentViewport>
        <ContentScrollArea>
          <ContentGrid>
        <LeftRail>
          <LeftRailContent>
            {selectedVisit ? (
              <>
                {safetyAlerts.length > 0 ? (
                  <LeftPanelCard role="region" aria-label="危険サイン / アレルギー">
                    <LeftPanelTitle>危険サイン / アレルギー</LeftPanelTitle>
                    <LeftPanelBody>
                      <BadgeWrap>
                        {safetyAlerts.map((alert) => (
                          <StatusBadge key={alert.id} tone={alert.tone}>
                            {alert.label}
                          </StatusBadge>
                        ))}
                      </BadgeWrap>
                    </LeftPanelBody>
                  </LeftPanelCard>
                ) : null}
                <MiniSummaryDock
                  summaryLines={miniSummaryLines}
                  onExpand={handleMiniSummaryExpand}
                  onSnippetDragStart={handleSnippetDragStart}
                />
                <LeftPanelCard role="region" aria-label="プロブレムリスト">
                  <LeftPanelTitle>プロブレムリスト</LeftPanelTitle>
                  <LeftPanelBody>
                    {problemList.length > 0 ? (
                      <BadgeWrap>
                        {problemList.map((problem) => (
                          <StatusBadge key={problem} tone="info">
                            {problem}
                          </StatusBadge>
                        ))}
                      </BadgeWrap>
                    ) : (
                      <LeftPanelEmpty>登録済みのプロブレムはありません。</LeftPanelEmpty>
                    )}
                  </LeftPanelBody>
                </LeftPanelCard>
                <LeftPanelCard role="region" aria-label="バイタルサマリ">
                  <LeftPanelTitle>バイタル</LeftPanelTitle>
                  <LeftPanelBody>
                    {vitalSigns.length > 0 ? (
                      <VitalList>
                        {vitalSigns.map((vital) => (
                          <VitalListItem key={vital.id}>
                            <VitalLabel>{vital.label}</VitalLabel>
                            <VitalValue>{vital.value}</VitalValue>
                          </VitalListItem>
                        ))}
                      </VitalList>
                    ) : (
                      <LeftPanelEmpty>バイタルは未入力です。</LeftPanelEmpty>
                    )}
                  </LeftPanelBody>
                </LeftPanelCard>
              </>
            ) : (
              <LeftPanelCard role="region" aria-label="左レール情報">
                <LeftPanelTitle>左レール情報</LeftPanelTitle>
                <LeftPanelBody>
                  <LeftPanelEmpty>患者を選択するとサマリや注意情報が表示されます。</LeftPanelEmpty>
                </LeftPanelBody>
              </LeftPanelCard>
            )}
            <VisitChecklist
              items={checklist}
              onToggleCompleted={handleChecklistToggle}
              onToggleInstantSave={handleChecklistInstant}
            />
            <LeftRailSpacer />
            <DocumentTimelinePanel
              karteId={karteId}
              fromDate={timelineFromDate}
              includeModified
              onDocInfosLoaded={setDocInfos}
              onEditDocument={handleEditDocument}
            />
          </LeftRailContent>
        </LeftRail>
        <CentralColumn>
          <CentralScroll>
            {selectedVisit ? (
              <WorkspaceStack>
                {editingDocument ? (
                  <SurfaceCard tone="warning">
                    <Stack gap={8}>
                      <div style={{ fontWeight: 600 }}>編集中: {editingDocument.docInfoModel?.title ?? '無題のカルテ'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        変更を保存すると既存のカルテ文書が上書きされます。
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button type="button" variant="secondary" onClick={handleCancelEditing}>
                          編集を終了
                        </Button>
                      </div>
                    </Stack>
                  </SurfaceCard>
                ) : null}
                <SurfaceCard tone="muted">
                  <Stack gap={12}>
                    <TextField
                      label="タイトル"
                      placeholder="例: 再診 / 高血圧"
                      value={draft.title}
                      onChange={(event) => handleDraftChange('title', event.currentTarget.value)}
                    />
                    <TextArea
                      label="Subjective"
                      placeholder="患者の主訴や自覚症状"
                      value={draft.subjective}
                      onChange={(event) => handleDraftChange('subjective', event.currentTarget.value)}
                      disabled={!isLockedByMe}
                    />
                    <Button type="button" onClick={handleSave} disabled={!isLockedByMe || lock.isPending}>
                      保存して終了
                    </Button>
                    {saveError ? <InlineError>{saveError}</InlineError> : null}
                    {lock.error ? <InlineError>{String(lock.error)}</InlineError> : null}
                  </Stack>
                </SurfaceCard>
                <WorkSurface
                  mode={activeSurface}
                  onModeChange={handleToggleSurface}
                  objectiveValue={draft.objective}
                  onObjectiveChange={(value) => handleDraftChange('objective', value)}
                  assessmentValue={draft.assessment}
                  onAssessmentChange={(value) => handleDraftChange('assessment', value)}
                  planCards={planCards}
                  onPlanCardChange={handlePlanCardChange}
                  onPlanCardRemove={handlePlanCardRemove}
                  onPlanCardInsert={handlePlanCardInsert}
                  onPlanCardReorder={handlePlanCardReorder}
                  onPlanUndo={handlePlanUndo}
                  onPlanCardFocus={handlePlanCardFocus}
                  onObjectiveInsertText={handleObjectiveInsertText}
                  onPlanInsertText={handlePlanInsertText}
                  isLockedByMe={isLockedByMe}
                />
                <SurfaceCard>
                  <Stack gap={16}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>請求モード</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button
                        type="button"
                        size="sm"
                        variant={billing.mode === 'insurance' ? 'primary' : 'ghost'}
                        onClick={() => handleBillingModeChange('insurance')}
                        disabled={!canSelectInsurance}
                      >
                        保険請求
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={billing.mode === 'self-pay' ? 'secondary' : 'ghost'}
                        onClick={() => handleBillingModeChange('self-pay')}
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
                </SurfaceCard>
                <SupplementGrid>
                  <CareMapPanel
                    patientId={selectedVisit ? selectedVisit.patientId : null}
                    patientName={selectedVisit?.fullName}
                    karteId={karteQuery.data?.id ?? null}
                    documents={docInfos}
                    mediaItems={mediaItems}
                    mediaLoading={mediaItemsLoading}
                    mediaError={attachmentsQuery.error ?? null}
                  />
                  <DiagnosisPanel
                    karteId={karteId}
                    fromDate={timelineFromDate}
                    userModelId={session?.userProfile?.userModelId ?? null}
                    departmentCode={selectedVisit?.departmentCode ?? null}
                    departmentName={selectedVisit?.departmentName ?? null}
                    relatedInsurance={selectedInsurance?.guid ?? selectedInsurance?.id ?? null}
                  />
                  <ClinicalPanelWrapper>
                    <ClinicalTabs>
                      <ClinicalTabButton
                        type="button"
                        $active={activeClinicalTab === 'observation'}
                        onClick={() => setActiveClinicalTab('observation')}
                      >
                        観察記録
                      </ClinicalTabButton>
                      <ClinicalTabButton
                        type="button"
                        $active={activeClinicalTab === 'claim'}
                        onClick={() => setActiveClinicalTab('claim')}
                      >
                        請求調整
                      </ClinicalTabButton>
                    </ClinicalTabs>
                    {activeClinicalTab === 'observation' ? (
                      <ObservationPanel karteId={karteId} userModelId={session?.userProfile?.userModelId ?? null} />
                    ) : (
                      <ClaimAdjustmentPanel
                        karteId={karteId}
                        docInfos={docInfos}
                        session={session}
                        selectedVisit={selectedVisit}
                        selectedInsurance={selectedInsurance}
                      />
                    )}
                  </ClinicalPanelWrapper>
                  <OrderSetPanel
                    orderSets={orderSets}
                    onApply={handleApplyOrderSet}
                    onCreate={createOrderSet}
                    onUpdate={updateOrderSet}
                    onDelete={deleteOrderSet}
                    disabled={!isLockedByMe}
                    lastAppliedId={lastAppliedOrderSetId}
                    onImportShared={importSharedOrderSets}
                    shareMetadata={{
                      facilityName: session?.userProfile?.facilityName,
                      author:
                        session?.userProfile?.displayName ??
                        session?.userProfile?.commonName ??
                        session?.credentials.userId,
                    }}
                  />
                  <StampLibraryPanel
                    stamps={stampLibraryQuery.data ?? []}
                    isLoading={canLoadStampLibrary ? stampLibraryQuery.isLoading : false}
                    isFetching={canLoadStampLibrary ? stampLibraryQuery.isFetching : false}
                    error={canLoadStampLibrary ? stampLibraryQuery.error : null}
                    onReload={() => {
                      if (canLoadStampLibrary) {
                        void stampLibraryQuery.refetch();
                      }
                    }}
                    onInsert={handleInsertStamp}
                    disabled={!isLockedByMe || !canLoadStampLibrary}
                  />
                  <OrcaOrderPanel disabled={!isLockedByMe} onCreateOrder={handleCreateOrderFromOrca} />
                  <PatientDocumentsPanel
                    patient={
                      patientSummaryForDocuments
                        ? {
                            id: patientSummaryForDocuments.id,
                            name: patientSummaryForDocuments.name,
                            gender: patientSummaryForDocuments.gender,
                            birthday: patientSummaryForDocuments.birthday,
                          }
                        : null
                    }
                    facilityName={session?.userProfile?.facilityName}
                    doctorName={doctorDisplayName}
                    disabled={!selectedVisit}
                    preset={documentPreset}
                  />
                  <MedicalCertificatesPanel
                    patient={patientSummaryForDocuments}
                    karteId={karteId}
                    patientPk={patientPk}
                    session={session}
                    facilityName={session?.userProfile?.facilityName}
                    doctorName={doctorDisplayName}
                    departmentName={selectedVisit?.departmentName ?? undefined}
                    disabled={!selectedVisit}
                    onSaved={() => {
                      void karteQuery.refetch();
                    }}
                  />
                  <SchemaEditorPanel
                    patient={patientSummaryForDocuments}
                    patientPk={patientPk}
                    karteId={karteId}
                    session={session}
                    facilityName={session?.userProfile?.facilityName}
                    licenseName={session?.userProfile?.licenseName ?? null}
                    departmentName={selectedVisit?.departmentName ?? null}
                    departmentCode={selectedVisit?.departmentCode ?? null}
                    disabled={!selectedVisit}
                    onSaved={() => {
                      void karteQuery.refetch();
                    }}
                  />
                  <LabResultsPanel
                    patientId={selectedVisit ? selectedVisit.patientId : null}
                    patientName={selectedVisit?.fullName}
                  />
                </SupplementGrid>
              </WorkspaceStack>
            ) : (
              <EmptyStateCard tone="muted">
                <Stack gap={12}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem' }}>カルテ対象が選択されていません</h2>
                  <p style={{ margin: 0, color: '#4b5563' }}>
                    受付患者一覧から対象患者を選択すると、カルテエリアが表示されます。
                  </p>
                  {visitNotFound ? (
                    <InlineError>保持した受付IDのカルテが見つかりません。受付一覧で状態をご確認ください。</InlineError>
                  ) : null}
                  {visitsQuery.isLoading ? (
                    <InlineMessage>最新の受付状況を取得しています…</InlineMessage>
                  ) : null}
                  {visitsQuery.error ? (
                    <InlineError>受付情報の取得に失敗しました。再読み込みをお試しください。</InlineError>
                  ) : null}
                </Stack>
                <EmptyStateActions>
                  <Button type="button" variant="primary" onClick={() => navigate('/reception')}>
                    受付患者一覧を開く
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      void visitsQuery.refetch();
                    }}
                  >
                    受付情報を再取得
                  </Button>
                </EmptyStateActions>
              </EmptyStateCard>
            )}
          </CentralScroll>
        </CentralColumn>
        <RightRail>
          <RightPane
            isCollapsed={rightPaneCollapsed}
            onToggleCollapse={() => (!forceCollapse ? setRightPaneCollapsed((prev) => !prev) : undefined)}
            onHoverExpand={() => {
              if (forceCollapse) {
                setRightPaneCollapsed(false);
              }
            }}
            onHoverLeave={() => {
              if (forceCollapse) {
                setRightPaneCollapsed(true);
              }
            }}
            visitMemo={chiefComplaint}
            visitMemoStatus={chiefComplaintStatus}
            visitMemoError={chiefComplaintError}
            visitMemoDirty={chiefComplaintDirty}
            onVisitMemoChange={handleChiefComplaintChange}
            onVisitMemoSave={handleChiefComplaintCommit}
            onVisitMemoReset={handleChiefComplaintReset}
            visitMemoDisabled={!selectedVisit}
            monshinSummary={monshinSummary}
            vitalSigns={vitalSigns}
            mediaItems={mediaItems}
            mediaLoading={mediaItemsLoading}
            mediaError={mediaItemsError}
            pastSummaries={pastSummaries}
            onSnippetDragStart={handleSnippetDragStart}
            onMediaOpen={handleMediaOpen}
            onPastSummaryOpen={handlePastSummaryOpen}
            patientMemo={patientMemo}
            patientMemoStatus={patientMemoStatus}
            patientMemoError={patientMemoError}
            patientMemoDirty={patientMemoDirty}
            patientMemoUpdatedAt={patientMemoUpdatedAt}
            onPatientMemoChange={handlePatientMemoChange}
            onPatientMemoSave={handlePatientMemoSave}
            onPatientMemoReset={handlePatientMemoReset}
            patientMemoDisabled={!selectedVisit}
            hasPatientMemoHistory={patientMemoHistory.length > 0}
            onPatientMemoHistoryOpen={handlePatientMemoHistoryOpen}
            freeDocumentComment={freeDocumentComment}
            freeDocumentStatus={freeDocumentStatus}
            freeDocumentError={freeDocumentError}
            freeDocumentDirty={freeDocumentDirty}
            freeDocumentUpdatedAt={freeDocumentUpdatedAt}
            onFreeDocumentChange={handleFreeDocumentChange}
            onFreeDocumentSave={handleFreeDocumentSave}
            onFreeDocumentReset={handleFreeDocumentReset}
            freeDocumentDisabled={!selectedVisit}
          />
        </RightRail>
          </ContentGrid>
        </ContentScrollArea>
      </ContentViewport>
      <StatusBar
        saveState={saveState}
        unsentTaskCount={unsentTaskCount}
        lastSavedAt={lastSavedAt}
        onSaveDraft={handleSaveDraft}
        onCallNextPatient={handleCallNextPatient}
        isLockedByMe={isLockedByMe}
      />
      <UnifiedSearchOverlay
        open={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        sections={SEARCH_SECTION_LABELS}
        activeSection={searchSection}
        onSectionChange={(section) => setSearchSection(section as SearchSection)}
        results={filteredSearchResults.map((item) => ({ ...item, section: item.section }))}
        selectedIndex={searchIndex}
        onSelectIndex={setSearchIndex}
        onConfirm={handleSearchConfirm}
        onClose={() => setSearchOpen(false)}
      />
      <ImageViewerOverlay open={imageViewer.open} media={imageViewer.media} onClose={() => setImageViewer({ open: false, media: null })} />
      <DiffMergeOverlay
        open={diffMergeState.open}
        title={diffMergeState.title}
        currentParagraphs={diffMergeState.current}
        incomingParagraphs={diffMergeState.incoming}
        onMerge={handleDiffMerge}
        onClose={() => setDiffMergeState((prev) => ({ ...prev, open: false }))}
      />
      <PatientMemoHistoryDialog
        open={isPatientMemoHistoryOpen}
        entries={patientMemoHistory}
        activeEntryId={latestPatientMemo?.id ?? null}
        onClose={handlePatientMemoHistoryClose}
        onRestore={handlePatientMemoHistoryRestore}
      />
    </PageShell>
  );
};














