import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate, useParams } from 'react-router-dom';

import { Button, SelectField, Stack, StatusBadge, SurfaceCard, TextArea, TextField } from '@/components';
import { StampLibraryPanel } from '@/features/charts/components/StampLibraryPanel';
import { OrcaOrderPanel } from '@/features/charts/components/OrcaOrderPanel';
import { OrderSetPanel } from '@/features/charts/components/OrderSetPanel';
import { PatientDocumentsPanel } from '@/features/charts/components/PatientDocumentsPanel';
import { useChartEventSubscription } from '@/features/charts/hooks/useChartEventSubscription';
import { useChartLock } from '@/features/charts/hooks/useChartLock';
import { usePatientVisits } from '@/features/charts/hooks/usePatientVisits';
import { useStampLibrary } from '@/features/charts/hooks/useStampLibrary';
import { useOrderSets } from '@/features/charts/hooks/useOrderSets';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { StampDefinition } from '@/features/charts/types/stamp';
import type { OrderSetDefinition } from '@/features/charts/types/order-set';
import { saveProgressNote } from '@/features/charts/api/progress-note-api';
import type { ProgressNoteDraft } from '@/features/charts/utils/progress-note-payload';
import type { BillingMode, ProgressNoteBilling } from '@/features/charts/utils/progress-note-payload';
import { extractInsuranceOptions } from '@/features/charts/utils/health-insurance';
import type { ParsedHealthInsurance } from '@/features/charts/utils/health-insurance';
import { usePatientKarte } from '@/features/patients/hooks/usePatientKarte';
import { useAuth } from '@/libs/auth';
import { PatientHeaderBar } from '@/features/charts/components/layout/PatientHeaderBar';
import { VisitChecklist, type VisitChecklistItem } from '@/features/charts/components/layout/VisitChecklist';
import {
  WorkSurface,
  type PlanComposerCard,
  type SurfaceMode,
} from '@/features/charts/components/layout/WorkSurface';
import {
  RightPane,
  type MediaItem,
  type PastSummaryItem,
} from '@/features/charts/components/layout/RightPane';
import { MiniSummaryDock } from '@/features/charts/components/layout/MiniSummaryDock';
import { StatusBar } from '@/features/charts/components/layout/StatusBar';
import { UnifiedSearchOverlay } from '@/features/charts/components/layout/UnifiedSearchOverlay';
import { ImageViewerOverlay } from '@/features/charts/components/layout/ImageViewerOverlay';
import { DiffMergeOverlay } from '@/features/charts/components/layout/DiffMergeOverlay';
import { BIT_OPEN } from '@/features/charts/utils/visit-state';

const PageShell = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.palette.background};
  display: flex;
  flex-direction: column;
`;

const ContentGrid = styled.div`
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr) auto;
  column-gap: 24px;
  align-items: start;
  padding: 16px 24px 140px;
  min-height: 0;
`;

const LeftRail = styled.div`
  position: sticky;
  top: 80px;
  align-self: start;
`;

const CentralColumn = styled.div`
  min-width: 0;
  height: calc(100vh - 80px - 48px);
  display: flex;
  flex-direction: column;
`;

const CentralScroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 8px;
`;

const WorkspaceStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RightRail = styled.div`
  position: sticky;
  top: 80px;
  align-self: start;
  height: calc(100vh - 80px - 48px);
  display: flex;
`;

const SupplementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
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
  { id: 'vitals', label: '測定', completed: false, instantSave: false },
  { id: 'procedure', label: '処置', completed: false, instantSave: false },
  { id: 'billing', label: '会計', completed: false, instantSave: false },
];

const SEARCH_SECTIONS = ['O', '薬', '処置', '検査', 'フォローアップ', 'テンプレ', '過去文', 'A&P'] as const;

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

const createPlanCard = (type: PlanComposerCard['type'], detail = '', title = ''): PlanComposerCard => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  type,
  title,
  detail,
  note: '',
});

type DocumentPresetState = {
  templateId: string;
  memo?: string;
  extraNote?: string;
  version: number;
};

const placeholderImage = (title: string) => {
  const encoded = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">\n      <rect width="320" height="240" fill="${'#b8d0ed'}"/>\n      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="${'#1d3d5e'}">${
        title || 'No Image'
      }</text>\n    </svg>`,
  );
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
};

export const ChartsPage = () => {
  useChartEventSubscription();

  const navigate = useNavigate();
  const params = useParams<{ visitId?: string }>();
  const { session } = useAuth();
  const visitsQuery = usePatientVisits();
  const userPk = session?.userProfile?.userModelId ?? null;
  const stampLibraryQuery = useStampLibrary(userPk);
  const canLoadStampLibrary = Boolean(userPk);
  const { orderSets, createOrderSet, updateOrderSet, deleteOrderSet, markOrderSetUsed } = useOrderSets();
  const [draft, setDraft] = useState<ProgressNoteDraft>(defaultDraft);
  const [billing, setBilling] = useState<BillingState>(
    createInitialBillingState('insurance', null, session?.userProfile?.displayName),
  );
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosisTags, setDiagnosisTags] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<VisitChecklistItem[]>(INITIAL_CHECKLIST);
  const [activeSurface, setActiveSurface] = useState<SurfaceMode>('objective');
  const [planCards, setPlanCards] = useState<PlanComposerCard[]>([]);
  const previousPlanCardsRef = useRef<PlanComposerCard[] | null>(null);
  const [focusedPlanCardId, setFocusedPlanCardId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(undefined);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rightPaneCollapsed, setRightPaneCollapsed] = useState(false);
  const [forceCollapse, setForceCollapse] = useState(false);
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
  const claimSendEnabled = billing.mode === 'insurance' && Boolean(selectedInsurance?.classCode);
  const billingDisabled = !selectedVisit;

  const karteQuery = usePatientKarte(selectedVisit?.patientId ?? null, {
    fromDate: undefined,
    enabled: Boolean(selectedVisit),
  });

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
    previousPlanCardsRef.current = null;
    setChiefComplaint(selectedVisit.memo ?? '');
    setDiagnosisTags([]);
    setSaveState('idle');
    setSaveError(null);
    setDocumentPreset(null);
    setLastAppliedOrderSetId(null);
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
    previousPlanCardsRef.current = null;
    setChiefComplaint('');
    setDiagnosisTags([]);
    setSaveState('idle');
    setSaveError(null);
    setDocumentPreset(null);
    setLastAppliedOrderSetId(null);
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

  const monshinSummary = useMemo(() => {
    const memos = karteQuery.data?.memos ?? [];
    if (memos.length === 0) {
      return [];
    }
    return memos.slice(0, 3).map((memo) => ({
      id: `memo-${memo.id}`,
      question: memo.confirmed ? memo.confirmed : 'スタッフ記録',
      answer: memo.memo ?? '記録なし',
    }));
  }, [karteQuery.data?.memos]);

  const vitalSigns = useMemo(
    () =>
      draft.objective
        ? Array.from(draft.objective.matchAll(/(BP|SpO2|HR|Temp)[:：]\s*([^\n]+)/gi)).map((match, index) => ({
            id: `vital-${index}`,
            label: match[1].toUpperCase(),
            value: match[2].trim(),
          }))
        : [],
    [draft.objective],
  );

  const pastSummaries: PastSummaryItem[] = useMemo(() => {
    const documents = karteQuery.data?.documents ?? [];
    return documents.slice(0, 5).map((doc) => ({
      id: `doc-${doc.docPk}`,
      title: doc.title,
      excerpt: doc.departmentDesc ?? doc.status ?? '詳細なし',
      recordedAt: doc.confirmDate ?? undefined,
    }));
  }, [karteQuery.data?.documents]);

  const mediaItems: MediaItem[] = useMemo(
    () =>
      pastSummaries.slice(0, 4).map((summary) => ({
        id: `media-${summary.id}`,
        title: summary.title,
        thumbnailUrl: placeholderImage(summary.title),
        capturedAt: summary.recordedAt,
        description: summary.excerpt,
      })),
    [pastSummaries],
  );

  useEffect(() => {
    setMiniSummaryLines(pastSummaries.slice(0, 3).map((item) => `${item.title}：${item.excerpt}`));
  }, [pastSummaries]);

  const updatePlanCards = useCallback(
    (updater: (cards: PlanComposerCard[]) => PlanComposerCard[]) => {
      setPlanCards((prev) => {
        const snapshot = prev.map((card) => ({ ...card }));
        const next = updater(prev);
        previousPlanCardsRef.current = snapshot;
        setDraft((draftPrev) => ({ ...draftPrev, plan: serializePlanCards(next) }));
        setSaveState('idle');
        return next;
      });
    },
    [],
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
      updatePlanCards((cards) => cards.filter((card) => card.id !== id));
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
      previousPlanCardsRef.current = null;
    }
  }, []);

  const handleObjectiveInsertText = useCallback((text: string) => {
    setDraft((prev) => ({ ...prev, objective: prev.objective ? `${prev.objective}\n${text}` : text }));
    setSaveState('idle');
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

  const handleDraftChange = useCallback((key: keyof ProgressNoteDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setSaveState('idle');
  }, []);

  const updateBilling = useCallback(
    (patch: Partial<BillingState>) => {
      setBilling((prev) => ({ ...prev, ...patch }));
      setSaveError(null);
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
      await lock.lock();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '診察開始に失敗しました');
    }
  }, [lock, selectedVisit]);

  const handleUnlock = useCallback(async () => {
    setSaveError(null);
    try {
      await lock.unlock();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '診察終了に失敗しました');
    }
  }, [lock]);

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

    const billingPayload: ProgressNoteBilling =
      billing.mode === 'insurance'
        ? {
            mode: 'insurance' as const,
            classCode: selectedInsurance?.classCode,
            description: selectedInsurance?.description ?? selectedInsurance?.label ?? '',
            guid: selectedInsurance?.guid ?? selectedVisit.insuranceUid ?? undefined,
          }
        : {
            mode: 'self-pay' as const,
            receiptCode: billing.selfPayCategory,
            label: selectedSelfPayOption.label,
            quantity: billing.quantity.trim() || undefined,
            performer: billing.performer.trim() || undefined,
            lotNumber: billing.lotNumber.trim() || undefined,
            memo: billing.memo.trim() || undefined,
          };

    try {
      setSaveState('saving');
      setSaveError(null);
      const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
      await saveProgressNote(
        {
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
        },
        nextState,
        selectedVisit.visitId,
      );
      setSaveState('saved');
      setLastSavedAt(new Date().toLocaleTimeString());
      await lock.unlock();
      await karteQuery.refetch();
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [
    session,
    selectedVisit,
    clientUuid,
    karteQuery,
    billing,
    selectedInsurance,
    selectedSelfPayOption.label,
    draft,
    lock,
  ]);

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

  const handleToggleSurface = useCallback((mode: SurfaceMode) => {
    setActiveSurface(mode);
  }, []);

  const handleInsertStamp = useCallback(
    (stamp: StampDefinition) => {
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
      } else {
        updatePlanCards((cards) => [...cards, createPlanCard('procedure', snippet, stamp.name)]);
      }
      setSaveError(null);
    },
    [activeSurface, handleObjectiveInsertText, isLockedByMe, updatePlanCards],
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
      setSaveError(null);
      setLastAppliedOrderSetId(definition.id);
      markOrderSetUsed(definition.id);
    },
    [
      handleObjectiveInsertText,
      isLockedByMe,
      markOrderSetUsed,
      updatePlanCards,
    ],
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
            detail: '病名タグ',
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
        section: '過去文' as const,
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
      if (item.section === 'O' || item.section === 'テンプレ') {
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
      if (width < 1000) {
        setRightPaneCollapsed(true);
        setForceCollapse(true);
      } else if (width < 1400) {
        setForceCollapse(false);
      } else {
        setForceCollapse(false);
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
        incoming: item.excerpt.split('。').map((paragraph) => paragraph.trim()).filter(Boolean),
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
        onChiefComplaintChange={setChiefComplaint}
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
      <ContentGrid>
        <LeftRail>
          <VisitChecklist
            items={checklist}
            onToggleCompleted={handleChecklistToggle}
            onToggleInstantSave={handleChecklistInstant}
          />
        </LeftRail>
        <CentralColumn>
          <CentralScroll>
            {selectedVisit ? (
              <WorkspaceStack>
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
                        CLAIM送信: {claimSendEnabled ? '有効' : '停止'}
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
                  <OrderSetPanel
                    orderSets={orderSets}
                    onApply={handleApplyOrderSet}
                    onCreate={createOrderSet}
                    onUpdate={updateOrderSet}
                    onDelete={deleteOrderSet}
                    disabled={!isLockedByMe}
                    lastAppliedId={lastAppliedOrderSetId}
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
                  <OrcaOrderPanel disabled={!isLockedByMe} />
                  <PatientDocumentsPanel
                    patient={
                      selectedVisit
                        ? {
                            id: selectedVisit.patientId,
                            name: selectedVisit.fullName,
                            gender: selectedVisit.gender ?? undefined,
                            birthday: selectedVisit.birthday ?? undefined,
                          }
                        : null
                    }
                    facilityName={session?.userProfile?.facilityName}
                    doctorName={
                      session?.userProfile?.displayName ??
                      (session?.userProfile as { commonName?: string } | undefined)?.commonName ??
                      session?.credentials.userId
                    }
                    disabled={!selectedVisit}
                    preset={documentPreset}
                  />
                </SupplementGrid>
              </WorkspaceStack>
            ) : (
              <EmptyStateCard tone="muted">
                <Stack gap={12}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem' }}>カルテ対象が選択されていません</h2>
                  <p style={{ margin: 0, color: '#4b5563' }}>
                    受付患者一覧から対象患者を選択すると、カルテ編集エリアが表示されます。
                  </p>
                  {visitNotFound ? (
                    <InlineError>指定した受付 ID のカルテが見つかりません。受付一覧で状態をご確認ください。</InlineError>
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
            monshinSummary={monshinSummary}
            vitalSigns={vitalSigns}
            mediaItems={mediaItems}
            pastSummaries={pastSummaries}
            onSnippetDragStart={handleSnippetDragStart}
            onMediaOpen={handleMediaOpen}
            onPastSummaryOpen={handlePastSummaryOpen}
          />
        </RightRail>
      </ContentGrid>
      <StatusBar
        saveState={saveState}
        unsentTaskCount={unsentTaskCount}
        lastSavedAt={lastSavedAt}
        onSaveDraft={handleSaveDraft}
        onCallNextPatient={handleCallNextPatient}
        isLockedByMe={isLockedByMe}
      />
      <MiniSummaryDock
        summaryLines={miniSummaryLines}
        onExpand={handleMiniSummaryExpand}
        onSnippetDragStart={handleSnippetDragStart}
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
    </PageShell>
  );
};
