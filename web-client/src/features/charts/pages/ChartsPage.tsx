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
    confirmDate: updated.docInfoModel.confirmDate ?? original.docInfoModel.confirmDate ?? null,
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
    recordedAt: updated.docInfoModel.recordedAt ?? original.docInfoModel.recordedAt ?? updated.docInfoModel.confirmDate ?? original.docInfoModel.confirmDate ?? null,
    createdAt: updated.docInfoModel.createdAt ?? original.docInfoModel.createdAt ?? original.docInfoModel.firstConfirmDate ?? original.docInfoModel.confirmDate ?? null,
    updatedAt: updated.docInfoModel.updatedAt ?? updated.docInfoModel.confirmDate ?? original.docInfoModel.updatedAt ?? original.docInfoModel.confirmDate ?? null,
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { useNavigate, useParams } from 'react-router-dom';
import type { ComponentProps } from 'react';

const RIGHT_CONSOLE_COLLAPSE_BREAKPOINT = 1000;
const RIGHT_CONSOLE_AUTO_EXPAND_BREAKPOINT = 1400;

import { Button, ReplayGapBanner, Stack, SurfaceCard, TextArea, TextField } from '@/components';
import { recordOperationEvent } from '@/libs/audit';
import { CareMapPanel } from '@/features/charts/components/CareMapPanel';
import { DocumentTimelinePanel } from '@/features/charts/components/DocumentTimelinePanel';
import { DiagnosisPanel } from '@/features/charts/components/DiagnosisPanel';
import { ObservationPanel } from '@/features/charts/components/ObservationPanel';
import { publishChartEvent } from '@/features/charts/api/chart-event-api';
import { useChartEventSubscription } from '@/features/charts/hooks/useChartEventSubscription';
import { useChartLock } from '@/features/charts/hooks/useChartLock';
import { usePatientVisits } from '@/features/charts/hooks/usePatientVisits';
import { useStampLibrary } from '@/features/charts/hooks/useStampLibrary';
import { useOrderSets } from '@/features/charts/hooks/useOrderSets';
import { saveFreeDocument } from '@/features/charts/api/free-document-api';
import { freeDocumentQueryKey, useFreeDocument } from '@/features/charts/hooks/useFreeDocument';
import { useDocumentAttachments } from '@/features/charts/hooks/useDocumentAttachments';
import { useDiagnoses, useDiagnosisBuckets } from '@/features/charts/hooks/useDiagnoses';
import { useTimelineEvents } from '@/features/charts/hooks/useTimelineEvents';
import { useChartsReplayGap } from '@/features/charts/hooks/useChartsReplayGap';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { StampDefinition } from '@/features/charts/types/stamp';
import type { OrderSetDefinition } from '@/features/charts/types/order-set';
import type { RegisteredDiagnosis } from '@/features/charts/types/diagnosis';
import {
  diagnosisDisplayName,
  diagnosisStatusLabel,
  formatDiagnosisDate,
} from '@/features/charts/components/diagnosis-utils';
import { saveProgressNote } from '@/features/charts/api/progress-note-api';
import {
  buildObjectiveNarrative,
  createProgressNoteDocument,
  type ProgressNoteDraft,
  type ProgressNoteContext,
  type BillingMode,
  type ProgressNoteBilling,
} from '@/features/charts/utils/progress-note-payload';
import { extractInsuranceOptions } from '@/features/charts/utils/health-insurance';
import type { ParsedHealthInsurance } from '@/features/charts/utils/health-insurance';
import { updatePatientMemo } from '@/features/patients/api/patient-memo-api';
import { usePatientDetail } from '@/features/patients/hooks/usePatientDetail';
import { patientKarteQueryKey, usePatientKarte } from '@/features/patients/hooks/usePatientKarte';
import { defaultKarteFromDate, formatRestDate } from '@/features/patients/utils/rest-date';
import { useAuth } from '@/libs/auth';
import { fetchOrcaOrderModules } from '@/features/charts/api/orca-api';
import { PatientHeaderBar } from '@/features/charts/components/layout/PatientHeaderBar';
import { ProblemListCard } from '@/features/charts/components/layout/ProblemListCard';
import { WorkSurface, type PlanComposerCard, type SoapSection } from '@/features/charts/components/layout/WorkSurface';
import type { MediaItem } from '@/features/charts/types/media';
import type { DocInfoSummary, DocumentModelPayload } from '@/features/charts/types/doc';
import type { ModuleModelPayload } from '@/features/charts/types/module';
import {
  PatientMemoHistoryDialog,
  type PatientMemoHistoryEntry,
} from '@/features/charts/components/layout/PatientMemoHistoryDialog';
import { MiniSummaryDock } from '@/features/charts/components/layout/MiniSummaryDock';
import {
  SafetySummaryCard,
  type SafetySummaryEntry,
  type SafetySummarySection,
} from '@/features/charts/components/layout/SafetySummaryCard';
import { OrderConsole } from '@/features/charts/components/layout/OrderConsole';
import { StatusBar } from '@/features/charts/components/layout/StatusBar';
import { UnifiedSearchOverlay, type SearchResultItem as UnifiedSearchResultItem } from '@/features/charts/components/layout/UnifiedSearchOverlay';
import { ImageViewerOverlay } from '@/features/charts/components/layout/ImageViewerOverlay';
import { DiffMergeOverlay } from '@/features/charts/components/layout/DiffMergeOverlay';
import { ClinicalReferencePanel } from '@/features/charts/components/layout/ClinicalReferencePanel';
import { BIT_OPEN } from '@/features/charts/utils/visit-state';
import { calculateAgeLabel } from '@/features/charts/utils/age-label';
import { formatRestTimestamp } from '@/features/charts/utils/rest-timestamp';
import { determineSafetyTone } from '@/features/charts/utils/caution-tone';
import {
  routineMedicationLabel,
  routineMedicationModules,
  routineMedicationUpdatedAt,
} from '@/features/charts/utils/routine-medication';
import { fetchDocumentsByIds } from '@/features/charts/api/doc-info-api';
import { fetchRoutineMedications } from '@/features/charts/api/masuda-api';
import { sendClaimDocument } from '@/features/charts/api/claim-api';
import { updateDocument } from '@/features/charts/api/document-api';
import { ShortcutOverlay } from '@/features/charts/components/layout/ShortcutOverlay';
import type { MonshinSummaryItem, PastSummaryItem, VitalSignItem } from '@/features/charts/types/reference';
import type { OrderModuleSummary } from '@/features/charts/components/layout/OrderConsole';
import type { DecisionSupportMessage } from '@/features/charts/types/decision-support';
import type { LaboModule } from '@/features/charts/types/labo';
import type {
  TimelineEventPayload,
  TimelineOrderSource,
  TimelinePlanCardSource,
} from '@/features/charts/utils/timeline-events';

const PageShell = styled.div`
  --charts-shell-offset: var(--app-shell-sticky-offset, 0px);
  --charts-header-height: 80px;
  --charts-header-height-compact: 60px;
  --charts-footer-height: 48px;
  --charts-dock-height: 0px;
  --charts-viewport-span: min(100vw, 100%);
  --charts-content-padding-x: clamp(12px, 1.15vw, 20px);
  --charts-content-padding-top: 12px;
  --charts-content-padding-bottom: 128px;
  --charts-content-gap: clamp(16px, 1.6vw, 22px);
  --charts-left-rail-min-width: 264px;
  --charts-left-rail-max-width: 264px;
  --charts-left-rail-width: clamp(var(--charts-left-rail-min-width), 19vw, var(--charts-left-rail-max-width));
  --charts-right-rail-min-width: 264px;
  --charts-right-rail-max-width: 264px;
  --charts-right-rail-width: clamp(var(--charts-right-rail-min-width), 19vw, var(--charts-right-rail-max-width));
  --charts-central-min-width: 736px;
  --charts-central-dynamic-width: calc(
    var(--charts-viewport-span) - var(--charts-left-rail-width) - var(--charts-right-rail-width) -
    (var(--charts-content-gap) * 2) - (var(--charts-content-padding-x) * 2)
  );
  --charts-central-max-width: var(--charts-central-dynamic-width);
  --charts-central-width: clamp(
    var(--charts-central-min-width),
    var(--charts-central-dynamic-width),
    var(--charts-central-max-width)
  );

  min-height: 100vh;
  background: ${({ theme }) => theme.palette.background};
  display: flex;
  flex-direction: column;

  &[data-right-collapsed='true'] {
    --charts-right-rail-min-width: 48px;
    --charts-right-rail-max-width: 56px;
    --charts-right-rail-width: clamp(var(--charts-right-rail-min-width), 5vw, var(--charts-right-rail-max-width));
    --charts-content-gap: clamp(14px, 1.4vw, 20px);
  }

  @media (min-width: 1600px) {
    --charts-left-rail-max-width: 288px;
    --charts-right-rail-max-width: 288px;
  }

  @media (min-width: 1920px) {
    --charts-content-gap: clamp(18px, 1.6vw, 24px);
  }

  @media (max-width: 1359px) {
    --charts-content-padding-x: clamp(12px, 1.8vw, 18px);
    --charts-content-gap: clamp(14px, 2vw, 20px);
    --charts-left-rail-min-width: 240px;
    --charts-left-rail-max-width: 252px;
    --charts-left-rail-width: clamp(var(--charts-left-rail-min-width), 22vw, var(--charts-left-rail-max-width));
    --charts-right-rail-min-width: 240px;
    --charts-right-rail-max-width: 252px;
    --charts-right-rail-width: clamp(var(--charts-right-rail-min-width), 22vw, var(--charts-right-rail-max-width));
    --charts-central-min-width: 640px;
  }

  @media (max-width: 1279px) {
    --charts-content-padding-x: clamp(10px, 2.2vw, 16px);
    --charts-content-gap: clamp(12px, 2.4vw, 18px);
    --charts-left-rail-min-width: 228px;
    --charts-left-rail-max-width: 236px;
    --charts-left-rail-width: clamp(var(--charts-left-rail-min-width), 24vw, var(--charts-left-rail-max-width));
    --charts-right-rail-min-width: 220px;
    --charts-right-rail-max-width: 232px;
    --charts-right-rail-width: clamp(var(--charts-right-rail-min-width), 24vw, var(--charts-right-rail-max-width));
    --charts-central-min-width: 600px;
  }

  @media (max-width: 1099px) {
    --charts-content-padding-x: clamp(10px, 3vw, 16px);
    --charts-content-gap: clamp(12px, 3vw, 18px);
    --charts-left-rail-min-width: 188px;
    --charts-left-rail-max-width: 208px;
    --charts-left-rail-width: clamp(var(--charts-left-rail-min-width), 28vw, var(--charts-left-rail-max-width));
    --charts-right-rail-min-width: 80px;
    --charts-right-rail-max-width: 160px;
    --charts-right-rail-width: clamp(var(--charts-right-rail-min-width), 18vw, var(--charts-right-rail-max-width));
    --charts-central-min-width: 560px;
  }

  @media (max-width: 999px) {
    --charts-content-padding-x: clamp(12px, 4vw, 20px);
    --charts-content-gap: clamp(14px, 4vw, 22px);
    --charts-central-dynamic-width: calc(var(--charts-viewport-span) - (var(--charts-content-padding-x) * 2));
    --charts-central-min-width: 0px;
    --charts-central-max-width: var(--charts-central-dynamic-width);
    --charts-central-width: clamp(0px, var(--charts-central-dynamic-width), var(--charts-central-max-width));
  }

  @media (max-width: 767px) {
    --charts-content-padding-top: 10px;
    --charts-content-padding-bottom: 112px;
  }

  &[data-replay-gap='true'] {
    filter: saturate(0.85);
  }
`;

const ContentGrid = styled.div<{ $locked: boolean }>`
  flex: 1 1 auto;
  display: grid;
  grid-template-columns:
    minmax(var(--charts-left-rail-min-width), var(--charts-left-rail-width))
    minmax(var(--charts-central-min-width), var(--charts-central-width))
    minmax(var(--charts-right-rail-min-width), var(--charts-right-rail-width));
  grid-template-areas: 'left central right';
  column-gap: var(--charts-content-gap);
  align-items: start;
  padding: var(--charts-content-padding-top) var(--charts-content-padding-x) var(--charts-content-padding-bottom);
  box-sizing: border-box;
  width: 100%;
  min-height: 0;

  @media (max-width: 1099px) {
    grid-template-columns:
      minmax(var(--charts-left-rail-min-width), var(--charts-left-rail-width))
      minmax(var(--charts-central-min-width), var(--charts-central-width))
      minmax(var(--charts-right-rail-min-width), var(--charts-right-rail-width));
  }

  @media (max-width: 999px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'central'
      'left'
      'right';
    row-gap: var(--charts-content-gap);
  }

  &[data-compact-header='true'] {
    --charts-header-height: var(--charts-header-height-compact);
    --charts-content-padding-top: 6px;
  }

  ${({ $locked }) =>
    $locked
      ? `
    pointer-events: none;
    opacity: 0.55;
  `
      : ''}
`;

const LeftRail = styled.div`
  grid-area: left;
  width: min(100%, var(--charts-left-rail-width, 264px));
  max-width: var(--charts-left-rail-width, 264px);
  min-width: var(--charts-left-rail-min-width, 0px);
  position: sticky;
  top: calc(var(--charts-shell-offset, 0px) + var(--charts-header-height) + var(--charts-content-padding-top));
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
  padding-bottom: calc(var(--charts-footer-height, 0px) + 24px);
  scroll-padding-bottom: calc(var(--charts-footer-height, 0px) + 24px);
  height: calc(
    100vh - var(--charts-shell-offset, 0px) - var(--charts-header-height) - var(--charts-content-padding-top) -
      var(--charts-footer-height, 0px)
  );
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable both-edge;

  & > * {
    width: 100%;
  }

  @media (max-width: 1099px) {
    gap: 10px;
  }

  @media (max-width: 999px) {
    height: auto;
    min-height: auto;
    overflow: visible;
    position: static;
    top: auto;
    width: 100%;
    max-width: none;
    min-width: 0;
    padding-bottom: 24px;
    scroll-padding-bottom: 24px;
  }
`;

const CentralColumn = styled.div`
  grid-area: central;
  min-width: 0;
  min-height: 0;
  height: calc(100vh - var(--charts-header-height) - var(--charts-footer-height));
  display: flex;
  flex-direction: column;
  padding-inline: clamp(8px, 1.2vw, 16px);

  @media (max-width: 1099px) {
    height: auto;
  }

  @media (max-width: 999px) {
    padding-inline: 0;
  }
`;

const CentralScroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding: 0 clamp(6px, 1vw, 10px) 6px;
  scrollbar-gutter: stable both-edge;

  @media (max-width: 999px) {
    overflow-y: visible;
    padding: 0;
  }
`;

const WorkspaceStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const WorkspaceToolbar = styled(SurfaceCard)`
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px clamp(10px, 1.2vw, 16px);
  background: ${({ theme }) => theme.palette.surface};
  box-shadow: ${({ theme }) => theme.elevation.level2};
`;

const WorkspaceViewTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const WorkspaceTabButton = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.border)};
  background: ${({ theme, $active }) => ($active ? theme.palette.accent : theme.palette.surfaceMuted)};
  color: ${({ theme, $active }) => ($active ? theme.palette.primaryStrong : theme.palette.text)};
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;

  &:hover {
    background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surfaceStrong)};
    color: ${({ theme, $active }) => ($active ? theme.palette.onPrimary : theme.palette.text)};
  }
`;

const WorkspaceBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const RightRail = styled.div`
  grid-area: right;
  width: min(100%, var(--charts-right-rail-width, 264px));
  max-width: var(--charts-right-rail-width, 264px);
  min-width: var(--charts-right-rail-min-width, 0px);
  position: sticky;
  top: calc(var(--charts-shell-offset, 0px) + var(--charts-header-height) + var(--charts-content-padding-top));
  align-self: start;
  height: calc(100vh - var(--charts-header-height) - var(--charts-footer-height));
  display: flex;

  @media (max-width: 999px) {
    position: static;
    height: auto;
    width: 100%;
    max-width: none;
  }
`;

const SupplementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 14px;
`;

const ContextCard = styled(SurfaceCard)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
`;

const ContextHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const ContextHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ContextHistoryToggle = styled.button`
  border: none;
  background: ${({ theme }) => theme.palette.surfaceMuted};
  color: ${({ theme }) => theme.palette.text};
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;
  font-size: 0.85rem;

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceStrong};
  }
`;

const ContextSection = styled.section`
  display: grid;
  gap: 12px;
`;

const ContextSectionTitle = styled.h4`
  margin: 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.palette.text};
`;

const ContextItemList = styled.div`
  display: grid;
  gap: 8px;
`;

const ContextItemRow = styled.div<{ $pinned?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $pinned }) => ($pinned ? theme.palette.surfaceStrong : theme.palette.surfaceMuted)};
`;

const ContextItemBody = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

const ContextItemTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ContextItemDetail = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.palette.textMuted};
  line-height: 1.4;
`;

const ContextItemActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

const ContextItemMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
`;

const ContextPinButton = styled.button<{ $active?: boolean }>`
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 4px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  background: ${({ theme, $active }) => ($active ? theme.palette.primary : theme.palette.surface)};
  color: ${({ theme, $active }) => ($active ? theme.palette.onPrimary : theme.palette.text)};
  box-shadow: ${({ theme }) => theme.elevation.level1};

  &:hover {
    background: ${({ theme, $active }) => ($active ? theme.palette.primaryStrong : theme.palette.surfaceStrong)};
  }
`;

const MemoCard = styled(SurfaceCard)`
  display: grid;
  gap: 12px;
  padding: 16px;
`;

const MemoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const MemoActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MemoHelper = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.palette.textMuted};
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
  ros: '',
  physicalExam: '',
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

const SEARCH_SECTIONS = ['O', '薬', '処置', '検査', 'フォローアップ', 'テンプレ', '過去カルテ', 'A&P'] as const;

type SearchSection = (typeof SEARCH_SECTIONS)[number];

type ChartSearchResultItem = UnifiedSearchResultItem<SearchSection, PlanComposerCard['type']>;

type ContextItemKind = 'monshin' | 'vital' | 'summary' | 'media';

type ContextItemDescriptor = {
  id: string;
  kind: ContextItemKind;
  title: string;
  detail: string;
  timestamp?: string | null;
  payload?: string;
  actionLabel?: string;
  onActivate?: () => void;
};

type ReferenceLabModuleItem = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  abnormalFlag: string | null;
};

type ReferenceLabModuleSnapshot = {
  id: string;
  sampleDate: string | null;
  items: ReferenceLabModuleItem[];
};

const areReferenceLabModulesEqual = (
  prevModules: ReferenceLabModuleSnapshot[] | undefined,
  nextModules: ReferenceLabModuleSnapshot[] | undefined,
) => {
  if (prevModules === nextModules) {
    return true;
  }
  if (!prevModules || !nextModules) {
    return false;
  }
  if (prevModules.length !== nextModules.length) {
    return false;
  }
  for (let moduleIndex = 0; moduleIndex < prevModules.length; moduleIndex += 1) {
    const prevModule = prevModules[moduleIndex];
    const nextModule = nextModules[moduleIndex];
    if (!nextModule) {
      return false;
    }
    if (prevModule.id !== nextModule.id || prevModule.sampleDate !== nextModule.sampleDate) {
      return false;
    }
    if (prevModule.items.length !== nextModule.items.length) {
      return false;
    }
    for (let itemIndex = 0; itemIndex < prevModule.items.length; itemIndex += 1) {
      const prevItem = prevModule.items[itemIndex];
      const nextItem = nextModule.items[itemIndex];
      if (!nextItem) {
        return false;
      }
      if (
        prevItem.id !== nextItem.id ||
        prevItem.label !== nextItem.label ||
        prevItem.value !== nextItem.value ||
        prevItem.unit !== nextItem.unit ||
        prevItem.abnormalFlag !== nextItem.abnormalFlag
      ) {
        return false;
      }
    }
  }
  return true;
};

type DocumentTimelineProps = Pick<
  ComponentProps<typeof DocumentTimelinePanel>,
  | 'events'
  | 'isLoading'
  | 'isFetching'
  | 'error'
  | 'onRefresh'
  | 'onDocumentSelected'
  | 'onVisitEventSelected'
  | 'onLabEventSelected'
  | 'onOrderEventSelected'
  | 'onEditDocument'
>;

type TimelineLabPayload = Extract<TimelineEventPayload, { kind: 'lab' }>;
type TimelineOrderPayload = Extract<TimelineEventPayload, { kind: 'order' }>;

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
  createdAt: string;
  moduleInfo: {
    stampName: string;
    stampRole: string;
    entity: string;
    stampNumber: number;
    stampId?: string;
  };
  beanBytes: string;
}

type BuildProgressContextInput = {
  draft: ProgressNoteDraft;
  visit: PatientVisitSummary;
  billing: ProgressNoteBilling;
  visitMemo?: string | null;
  orderModules?: ModuleModelPayload[];
};

const createOrderModuleId = () => globalThis.crypto?.randomUUID?.() ?? `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildOrderSummary = (draft: OrderModuleDraft) => {
  const label = getEntityLabel(draft.moduleInfo.entity);
  const name = draft.moduleInfo.stampName || draft.label;
  return `${label}: ${name}`;
};

const toLocaleTimeLabel = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleTimeString();
};

const GLOBAL_SEARCH_SHORTCUT = 'F3';

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
  isPrimaryDiagnosis: false,
});

const resolvePrimaryDiagnosisText = (card: PlanComposerCard): string => {
  const title = card.title?.trim();
  if (title) {
    return title;
  }
  const detail = card.detail?.trim();
  if (detail) {
    const [firstLine] = detail.split(/\r?\n/);
    return firstLine?.trim() ?? '';
  }
  return '';
};

const extractTimestampFromId = (id: string | null | undefined): string | null => {
  if (!id) {
    return null;
  }
  const segments = id.split('-');
  if (segments.length < 3) {
    return null;
  }
  const maybeTimestamp = Number.parseInt(segments[1] ?? '', 10);
  if (!Number.isFinite(maybeTimestamp)) {
    return null;
  }
  const date = new Date(maybeTimestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
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

interface LeftContextColumnProps {
  documentTimeline: DocumentTimelineProps;
  visitMemo: string;
  visitMemoStatus: 'idle' | 'saving' | 'saved' | 'error';
  visitMemoError: string | null;
  visitMemoDirty: boolean;
  onVisitMemoChange: (value: string) => void;
  onVisitMemoSave: () => void;
  onVisitMemoReset: () => void;
  visitMemoDisabled?: boolean;
  contextItems: ContextItemDescriptor[];
  pinnedContextIds: string[];
  onTogglePinContext: (id: string) => void;
  showHistory: boolean;
  onToggleHistory: () => void;
  monshinSummary: MonshinSummaryItem[];
  vitalSigns: VitalSignItem[];
  mediaItems: MediaItem[];
  mediaLoading?: boolean;
  mediaError?: string | null;
  onSnippetDragStart: (snippet: string) => void;
  onMediaOpen: (item: MediaItem) => void;
  pastSummaries: PastSummaryItem[];
  onPastSummaryOpen: (item: PastSummaryItem) => void;
  problemList: {
    activeDiagnoses: RegisteredDiagnosis[];
    pastDiagnoses: RegisteredDiagnosis[];
    primaryDiagnosisName: string;
    isLoading: boolean;
    isFetching: boolean;
    error: unknown;
    onReload: () => void;
    onSelectPrimary: (diagnosis: RegisteredDiagnosis) => void;
    onAppendToPlan: (diagnosis: RegisteredDiagnosis) => void;
  };
  safetySummarySections: SafetySummarySection[];
  patientMemo: string;
  patientMemoStatus: 'idle' | 'saving' | 'saved' | 'error';
  patientMemoError: string | null;
  patientMemoDirty: boolean;
  patientMemoUpdatedAt: string | null;
  onPatientMemoChange: (value: string) => void;
  onPatientMemoSave: () => void;
  onPatientMemoReset: () => void;
  patientMemoDisabled?: boolean;
  hasPatientMemoHistory: boolean;
  onPatientMemoHistoryOpen: () => void;
  freeDocumentComment: string;
  freeDocumentStatus: 'idle' | 'saving' | 'saved' | 'error';
  freeDocumentError: string | null;
  freeDocumentDirty: boolean;
  freeDocumentUpdatedAt: string | null;
  onFreeDocumentChange: (value: string) => void;
  onFreeDocumentSave: () => void;
  onFreeDocumentReset: () => void;
  freeDocumentDisabled?: boolean;
}

const formatUpdatedAt = (value: string | null) => {
  if (!value) {
    return null;
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const LeftContextColumn = ({
  documentTimeline,
  visitMemo,
  visitMemoStatus,
  visitMemoError,
  visitMemoDirty,
  onVisitMemoChange,
  onVisitMemoSave,
  onVisitMemoReset,
  visitMemoDisabled,
  contextItems,
  pinnedContextIds,
  onTogglePinContext,
  showHistory,
  onToggleHistory,
  monshinSummary,
  vitalSigns,
  mediaItems,
  mediaLoading,
  mediaError,
  onSnippetDragStart,
  onMediaOpen,
  pastSummaries,
  onPastSummaryOpen,
  problemList,
  safetySummarySections,
  patientMemo,
  patientMemoStatus,
  patientMemoError,
  patientMemoDirty,
  patientMemoUpdatedAt,
  onPatientMemoChange,
  onPatientMemoSave,
  onPatientMemoReset,
  patientMemoDisabled,
  hasPatientMemoHistory,
  onPatientMemoHistoryOpen,
  freeDocumentComment,
  freeDocumentStatus,
  freeDocumentError,
  freeDocumentDirty,
  freeDocumentUpdatedAt,
  onFreeDocumentChange,
  onFreeDocumentSave,
  onFreeDocumentReset,
  freeDocumentDisabled,
}: LeftContextColumnProps) => {
  const pinnedEntries = pinnedContextIds
    .map((id) => contextItems.find((item) => item.id === id))
    .filter((item): item is ContextItemDescriptor => Boolean(item));
  const otherEntries = contextItems.filter((item) => !pinnedContextIds.includes(item.id));
  const historyEntries = otherEntries.filter(
    (item) => item.kind !== 'monshin' && item.kind !== 'vital' && item.kind !== 'media',
  );
  const visibleHistory = showHistory ? historyEntries : historyEntries.slice(0, 4);
  const hasMoreHistory = historyEntries.length > visibleHistory.length;

  const renderContextItem = (item: ContextItemDescriptor, pinned: boolean) => (
    <ContextItemRow
      key={item.id}
      $pinned={pinned}
      draggable={Boolean(item.payload)}
      onDragStart={(event) => {
        if (item.payload) {
          event.dataTransfer.setData('text/plain', item.payload);
          onSnippetDragStart(item.payload);
        }
      }}
    >
      <ContextItemBody>
        <ContextItemTitle>
          {item.kind === 'monshin'
            ? `問診: ${item.title}`
            : item.kind === 'summary'
            ? `カルテ: ${item.title}`
            : item.kind === 'media'
            ? `メディア: ${item.title}`
            : `${item.title}`}
        </ContextItemTitle>
        <ContextItemDetail>{item.detail}</ContextItemDetail>
        {item.timestamp ? <ContextItemMeta>{item.timestamp}</ContextItemMeta> : null}
      </ContextItemBody>
      <ContextItemActions>
        <ContextPinButton type="button" $active={pinned} onClick={() => onTogglePinContext(item.id)}>
          {pinned ? 'ピン解除' : 'ピン留め'}
        </ContextPinButton>
        {item.onActivate ? (
          <Button type="button" size="sm" variant="ghost" onClick={item.onActivate}>
            {item.actionLabel ?? '開く'}
          </Button>
        ) : null}
      </ContextItemActions>
    </ContextItemRow>
  );

  return (
    <LeftRail>
      <ProblemListCard
        activeDiagnoses={problemList.activeDiagnoses}
        pastDiagnoses={problemList.pastDiagnoses}
        primaryDiagnosisName={problemList.primaryDiagnosisName}
        onSelectPrimary={problemList.onSelectPrimary}
        onAppendToPlan={problemList.onAppendToPlan}
        isLoading={problemList.isLoading}
        isFetching={problemList.isFetching}
        error={problemList.error}
        onReload={problemList.onReload}
      />

      <SafetySummaryCard sections={safetySummarySections} onSnippetDragStart={onSnippetDragStart} />

      <MemoCard>
        <MemoHeader>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>問診メモ</h3>
          <MemoActions>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onVisitMemoReset}
              disabled={visitMemoDisabled || (!visitMemoDirty && visitMemoStatus !== 'error') || visitMemoStatus === 'saving'}
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onVisitMemoSave}
              disabled={visitMemoDisabled || (visitMemoStatus === 'idle' && !visitMemoDirty)}
              isLoading={visitMemoStatus === 'saving'}
            >
              保存
            </Button>
          </MemoActions>
        </MemoHeader>
        <TextArea
          label="問診メモ"
          value={visitMemo}
          onChange={(event) => onVisitMemoChange(event.currentTarget.value)}
          rows={4}
          disabled={visitMemoDisabled}
        />
        {visitMemoError ? <InlineError>{visitMemoError}</InlineError> : null}
        {visitMemoStatus === 'saving' ? <InlineMessage>保存中…</InlineMessage> : null}
        {visitMemoStatus === 'saved' ? <InlineMessage>保存しました</InlineMessage> : null}
        {visitMemoDirty && visitMemoStatus !== 'saving' && visitMemoStatus !== 'error' ? (
          <InlineMessage>未保存の変更があります</InlineMessage>
        ) : null}
      </MemoCard>

      <ClinicalReferencePanel
        monshinSummary={monshinSummary}
        vitalSigns={vitalSigns}
        mediaItems={mediaItems}
        mediaLoading={mediaLoading}
        mediaError={mediaError}
        pastSummaries={pastSummaries}
        onSnippetDragStart={onSnippetDragStart}
        onMediaOpen={onMediaOpen}
        onPastSummaryOpen={onPastSummaryOpen}
      />

      <ContextCard>
        <ContextHeader>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>診療コンテキスト</h3>
          {historyEntries.length > 0 ? (
            <ContextHeaderActions>
              <ContextHistoryToggle type="button" onClick={onToggleHistory}>
                {showHistory ? '履歴を閉じる' : '履歴を展開'}
              </ContextHistoryToggle>
            </ContextHeaderActions>
          ) : null}
        </ContextHeader>

        {pinnedEntries.length > 0 ? (
          <ContextSection>
            <ContextSectionTitle>ピン留め</ContextSectionTitle>
            <ContextItemList>
              {pinnedEntries.map((item) => renderContextItem(item, true))}
            </ContextItemList>
          </ContextSection>
        ) : null}

        <ContextSection>
          <ContextSectionTitle>履歴スナップショット</ContextSectionTitle>
          {visibleHistory.length === 0 ? <InlineMessage>参照履歴がまだありません。</InlineMessage> : null}
          <ContextItemList>
            {visibleHistory.map((item) => renderContextItem(item, false))}
          </ContextItemList>
          {hasMoreHistory ? (
            <ContextHistoryToggle type="button" onClick={onToggleHistory}>
              {showHistory ? '履歴を閉じる' : `${historyEntries.length - visibleHistory.length}件の履歴を表示`}
            </ContextHistoryToggle>
          ) : null}
        </ContextSection>
      </ContextCard>

      <MemoCard>
        <MemoHeader>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>患者メモ</h3>
          <MemoActions>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onPatientMemoHistoryOpen}
              disabled={!hasPatientMemoHistory}
            >
              履歴
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onPatientMemoReset}
              disabled={
                patientMemoDisabled ||
                (!patientMemoDirty && patientMemoStatus !== 'error') ||
                patientMemoStatus === 'saving'
              }
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onPatientMemoSave}
              disabled={patientMemoDisabled || (patientMemoStatus === 'idle' && !patientMemoDirty)}
              isLoading={patientMemoStatus === 'saving'}
            >
              保存
            </Button>
          </MemoActions>
        </MemoHeader>
        <TextArea
          label="患者メモ"
          value={patientMemo}
          onChange={(event) => onPatientMemoChange(event.currentTarget.value)}
          rows={5}
          disabled={patientMemoDisabled}
        />
        {patientMemoError ? <InlineError>{patientMemoError}</InlineError> : null}
        {patientMemoStatus === 'saving' ? <InlineMessage>保存中…</InlineMessage> : null}
        {patientMemoStatus === 'saved' ? <InlineMessage>保存しました</InlineMessage> : null}
        {patientMemoDirty && patientMemoStatus !== 'saving' && patientMemoStatus !== 'error' ? (
          <InlineMessage>未保存の変更があります</InlineMessage>
        ) : null}
        {patientMemoUpdatedAt ? <MemoHelper>最終更新: {formatUpdatedAt(patientMemoUpdatedAt)}</MemoHelper> : null}
      </MemoCard>

      <MemoCard>
        <MemoHeader>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>サマリメモ</h3>
          <MemoActions>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onFreeDocumentReset}
              disabled={
                freeDocumentDisabled ||
                (!freeDocumentDirty && freeDocumentStatus !== 'error') ||
                freeDocumentStatus === 'saving'
              }
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onFreeDocumentSave}
              disabled={freeDocumentDisabled || (freeDocumentStatus === 'idle' && !freeDocumentDirty)}
              isLoading={freeDocumentStatus === 'saving'}
            >
              保存
            </Button>
          </MemoActions>
        </MemoHeader>
        <TextArea
          label="サマリメモ"
          value={freeDocumentComment}
          onChange={(event) => onFreeDocumentChange(event.currentTarget.value)}
          rows={5}
          disabled={freeDocumentDisabled}
        />
        {freeDocumentError ? <InlineError>{freeDocumentError}</InlineError> : null}
        {freeDocumentStatus === 'saving' ? <InlineMessage>保存中…</InlineMessage> : null}
        {freeDocumentStatus === 'saved' ? <InlineMessage>保存しました</InlineMessage> : null}
        {freeDocumentDirty && freeDocumentStatus !== 'saving' && freeDocumentStatus !== 'error' ? (
          <InlineMessage>未保存の変更があります</InlineMessage>
        ) : null}
        {freeDocumentUpdatedAt ? <MemoHelper>最終更新: {formatUpdatedAt(freeDocumentUpdatedAt)}</MemoHelper> : null}
      </MemoCard>

      <DocumentTimelinePanel {...documentTimeline} />
    </LeftRail>
  );
};

type WorkSurfaceProps = ComponentProps<typeof WorkSurface>;
type CareMapProps = ComponentProps<typeof CareMapPanel>;
type DiagnosisProps = ComponentProps<typeof DiagnosisPanel>;
type ObservationProps = ComponentProps<typeof ObservationPanel>;
type StampLibraryPanelProps = ComponentProps<typeof import('@/features/charts/components/StampLibraryPanel').StampLibraryPanel>;
type OrcaOrderPanelProps = ComponentProps<typeof import('@/features/charts/components/OrcaOrderPanel').OrcaOrderPanel>;
type LabResultsPanelProps = ComponentProps<typeof import('@/features/charts/components/LabResultsPanel').LabResultsPanel>;
type PatientDocumentsPanelProps = ComponentProps<typeof import('@/features/charts/components/PatientDocumentsPanel').PatientDocumentsPanel>;
type MedicalCertificatesPanelProps = ComponentProps<typeof import('@/features/charts/components/MedicalCertificatesPanel').MedicalCertificatesPanel>;
type SchemaEditorPanelProps = ComponentProps<typeof import('@/features/charts/components/SchemaEditorPanel').SchemaEditorPanel>;
type ClaimAdjustmentPanelProps = ComponentProps<typeof import('@/features/charts/components/ClaimAdjustmentPanel').ClaimAdjustmentPanel>;

type WorkspaceView = 'note' | 'summary' | 'observe';

interface WorkSurfaceNoteProps {
  title: string;
  onTitleChange: (value: string) => void;
  onSave: () => void;
  saveDisabled: boolean;
  saveError: string | null;
  lockError: string | null;
}

interface WorkSurfaceColumnProps {
  editingDocument: DocumentModelPayload | null;
  onCancelEditing: () => void;
  workSurface: WorkSurfaceProps;
  noteProps: WorkSurfaceNoteProps;
  careMap: CareMapProps;
  diagnosis: DiagnosisProps;
  observation: ObservationProps;
  activeView: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
}

const WorkSurfaceColumn = ({
  editingDocument,
  onCancelEditing,
  workSurface,
  noteProps,
  careMap,
  diagnosis,
  observation,
  activeView,
  onViewChange,
}: WorkSurfaceColumnProps) => (
  <CentralColumn>
    <CentralScroll>
      <WorkspaceStack>
        {editingDocument ? (
          <SurfaceCard tone="warning">
            <Stack gap={8}>
              <div style={{ fontWeight: 600 }}>編集中: {editingDocument.docInfoModel?.title ?? '無題のカルテ'}</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>変更を保存すると既存のカルテ文書が上書きされます。</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="button" variant="secondary" onClick={onCancelEditing}>
                  編集を終了
                </Button>
              </div>
            </Stack>
          </SurfaceCard>
        ) : null}

        <WorkspaceToolbar>
          <WorkspaceViewTabs role="tablist" aria-label="カルテ作業ビュー切替">
            {[
              { id: 'note' as WorkspaceView, label: '記録入力' },
              { id: 'summary' as WorkspaceView, label: 'サマリ/計画' },
              { id: 'observe' as WorkspaceView, label: '観察・経過' },
            ].map((item) => (
              <WorkspaceTabButton
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeView === item.id}
                aria-pressed={activeView === item.id}
                $active={activeView === item.id}
                onClick={() => onViewChange(item.id)}
              >
                {item.label}
              </WorkspaceTabButton>
            ))}
          </WorkspaceViewTabs>
          <div style={{ minWidth: 0 }}>
            <TextField
              label="タイトル"
              placeholder="例: 再診 / 高血圧"
              value={noteProps.title}
              onChange={(event) => noteProps.onTitleChange(event.currentTarget.value)}
            />
          </div>
          <Button type="button" onClick={noteProps.onSave} disabled={noteProps.saveDisabled}>
            保存して終了
          </Button>
        </WorkspaceToolbar>
        {noteProps.saveError ? <InlineError>{noteProps.saveError}</InlineError> : null}
        {noteProps.lockError ? <InlineError>{noteProps.lockError}</InlineError> : null}

        <WorkspaceBody>
          {activeView === 'note' ? <WorkSurface {...workSurface} /> : null}
          {activeView === 'summary' ? (
            <SupplementGrid>
              <CareMapPanel {...careMap} />
              <DiagnosisPanel {...diagnosis} />
            </SupplementGrid>
          ) : null}
          {activeView === 'observe' ? <ObservationPanel {...observation} /> : null}
        </WorkspaceBody>
      </WorkspaceStack>
    </CentralScroll>
  </CentralColumn>
);

type OrderConsoleBaseProps = Omit<
  ComponentProps<typeof OrderConsole>,
  'collapsed' | 'forceCollapse' | 'onToggleCollapse' | 'onHoverExpand' | 'onHoverLeave' | 'activeTab' | 'onTabChange'
>;

interface OrderResultsColumnProps {
  collapsed: boolean;
  forceCollapse: boolean;
  onToggleCollapse: () => void;
  onHoverExpand: () => void;
  onHoverLeave: () => void;
  consoleProps: OrderConsoleBaseProps;
}

const OrderResultsColumn = ({
  collapsed,
  forceCollapse,
  onToggleCollapse,
  onHoverExpand,
  onHoverLeave,
  consoleProps,
}: OrderResultsColumnProps) => (
  <RightRail>
    <OrderConsole
      collapsed={collapsed}
      forceCollapse={forceCollapse}
      onToggleCollapse={onToggleCollapse}
      onHoverExpand={onHoverExpand}
      onHoverLeave={onHoverLeave}
      {...consoleProps}
    />
  </RightRail>
);

const splitSoaSections = (text: string) => {
  const sections = {
    subjective: '',
    objective: '',
    ros: '',
    physicalExam: '',
    assessment: '',
  };

  const parseObjectiveBlock = (raw: string) => {
    const lines = raw.split('\n');
    const buffers: Record<'objective' | 'ros' | 'physicalExam', string[]> = {
      objective: [],
      ros: [],
      physicalExam: [],
    };
    let current: 'objective' | 'ros' | 'physicalExam' = 'objective';

    lines.forEach((line) => {
      const rosMatch = line.match(/^\s*ROS[:：]\s*(.*)$/i);
      if (rosMatch) {
        current = 'ros';
        if (rosMatch[1]) {
          buffers.ros.push(rosMatch[1]);
        }
        return;
      }
      const peMatch = line.match(/^\s*(PE|Physical\s*Exam)[:：]\s*(.*)$/i);
      if (peMatch) {
        current = 'physicalExam';
        if (peMatch[2]) {
          buffers.physicalExam.push(peMatch[2]);
        }
        return;
      }

      if (current === 'ros') {
        const value = line.trim();
        if (value) {
          buffers.ros.push(value);
        }
        return;
      }
      if (current === 'physicalExam') {
        const value = line.trim();
        if (value) {
          buffers.physicalExam.push(value);
        }
        return;
      }
      buffers.objective.push(line);
    });

    return {
      objective: buffers.objective.join('\n').trim(),
      ros: buffers.ros.join('\n').trim(),
      physicalExam: buffers.physicalExam.join('\n').trim(),
    };
  };

  const blocks = text.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);
  blocks.forEach((block) => {
    if (block.startsWith('S:')) {
      sections.subjective = block.replace(/^S:\s*/, '').trim();
      return;
    }
    if (block.startsWith('O:')) {
      const parsed = parseObjectiveBlock(block.replace(/^O:\s*/, ''));
      sections.objective = parsed.objective;
      sections.ros = parsed.ros;
      sections.physicalExam = parsed.physicalExam;
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
    createdAt: new Date().toISOString(),
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
  const chartsReplayGap = useChartsReplayGap();
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
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [primaryDiagnosisCardId, setPrimaryDiagnosisCardId] = useState<string | null>(null);
  const [consultationStartAt, setConsultationStartAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeSection, setActiveSection] = useState<SoapSection>('subjective');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('note');
  const [planCards, setPlanCards] = useState<PlanComposerCard[]>([]);
  const previousPlanCardsRef = useRef<PlanComposerCard[] | null>(null);
  const [focusedPlanCardId, setFocusedPlanCardId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [orderModules, setOrderModules] = useState<OrderModuleDraft[]>([]);
  const orderModuleSummaries = useMemo<OrderModuleSummary[]>(
    () =>
      orderModules.map((module) => ({
        id: module.id,
        entity: module.moduleInfo.entity,
        label: module.moduleInfo.stampName || module.label,
        source: module.source,
      })),
    [orderModules],
  );
  const orderModulePayloads = useMemo<ModuleModelPayload[]>(
    () =>
      orderModules.reduce<ModuleModelPayload[]>((acc, module) => {
        const info = module.moduleInfo;
        if (!info) {
          return acc;
        }
        acc.push({
          moduleInfoBean: {
            stampName: info.stampName,
            stampRole: info.stampRole,
            stampNumber: info.stampNumber,
            entity: info.entity,
            stampId: info.stampId ?? null,
          },
          beanBytes: module.beanBytes,
        });
        return acc;
      }, []),
    [orderModules],
  );
  const timelineOrderSources = useMemo<TimelineOrderSource[]>(
    () =>
      orderModules.map((module) => {
        const summary = buildOrderSummary(module);
        return {
          id: module.id,
          type: ORDER_ENTITY_PLAN_TYPE[module.moduleInfo.entity] ?? 'procedure',
          label: module.moduleInfo.stampName || module.label || summary,
          detail: module.label,
          orderModuleId: module.id,
          createdAt: module.createdAt,
          orderSummary: summary,
        };
      }),
    [orderModules],
  );
  const timelinePlanSources = useMemo<TimelinePlanCardSource[]>(
    () =>
      planCards.map((card) => ({
        id: card.orderModuleId ?? card.id,
        type: card.type,
        title: card.title,
        detail: card.detail,
        orderModuleId: card.orderModuleId ?? undefined,
        orderSummary: card.orderSummary ?? undefined,
        createdAt: extractTimestampFromId(card.id),
      })),
    [planCards],
  );
  const [editingDocument, setEditingDocument] = useState<DocumentModelPayload | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
    target: 'plan' | 'subjective';
  }>({ open: false, title: '', current: [], incoming: [], target: 'plan' });
  const [miniSummaryLines, setMiniSummaryLines] = useState<string[]>([]);
  const [lastSavedDocId, setLastSavedDocId] = useState<number | null>(null);
  const [signatureState, setSignatureState] = useState<'idle' | 'signing' | 'signed' | 'blocked' | 'error'>('idle');
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [lastSignedAt, setLastSignedAt] = useState<string | null>(null);
  const [claimState, setClaimState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [lastClaimSentAt, setLastClaimSentAt] = useState<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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
  const [pinnedContextIds, setPinnedContextIds] = useState<string[]>([]);
  const [contextHistoryOpen, setContextHistoryOpen] = useState(false);
  const [referenceSplitOpen, setReferenceSplitOpen] = useState(false);
  const [referenceDocument, setReferenceDocument] = useState<DocumentModelPayload | null>(null);
  const chiefComplaintRef = useRef<HTMLInputElement | null>(null);
  const isComposingRef = useRef(false);
  const previousLockStateRef = useRef(false);
  const previousVisitIdRef = useRef<number | null>(null);

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
  useEffect(() => {
    setWorkspaceView('note');
  }, [selectedVisit?.visitId]);
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
  const patientDetailQuery = usePatientDetail(selectedVisit?.patientId ?? null, {
    enabled: Boolean(selectedVisit),
  });
  const patientDetail = patientDetailQuery.data ?? null;

  const [docInfos, setDocInfos] = useState<DocInfoSummary[]>([]);

  const karteId = karteQuery.data?.id ?? null;

  const buildProgressContext = useCallback(
    ({
      draft: contextDraft,
      visit,
      billing: contextBilling,
      visitMemo: contextVisitMemo,
      orderModules: contextOrderModules,
    }: BuildProgressContextInput): ProgressNoteContext => {
      if (karteId == null || !session) {
        throw new Error('セッション情報が未設定です。再度サインインしてから操作をやり直してください。');
      }
      return {
        draft: contextDraft,
        visit,
        karteId,
        session,
        visitMemo: contextVisitMemo ?? null,
        facilityName: session.userProfile?.facilityName,
        userDisplayName: session.userProfile?.displayName ?? session.userProfile?.commonName,
        userModelId: session.userProfile?.userModelId,
        licenseName: session.userProfile?.licenseName,
        departmentCode: visit.departmentCode,
        departmentName: visit.departmentName,
        billing: contextBilling,
        orderModules: contextOrderModules ?? orderModulePayloads,
      };
    },
    [karteId, orderModulePayloads, session],
  );
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
  const patientPhotoUrl = useMemo(() => {
    if (!patientDetail?.raw) {
      return null;
    }
    const raw = patientDetail.raw as Record<string, unknown>;
    const portrait = typeof raw.portrait === 'string' ? raw.portrait.trim() : '';
    if (portrait) {
      return portrait;
    }
    const photo = typeof raw.photo === 'string' ? raw.photo.trim() : '';
    if (photo) {
      if (photo.startsWith('data:') || /^https?:\/\//.test(photo)) {
        return photo;
      }
      return `data:image/jpeg;base64,${photo}`;
    }
    return null;
  }, [patientDetail]);
  const visitPurpose = useMemo(() => {
    if (!selectedVisit) {
      return null;
    }
    const appointment = selectedVisit.raw?.appointment?.trim();
    if (appointment) {
      return appointment;
    }
    const memo = selectedVisit.memo?.trim();
    if (memo) {
      return memo;
    }
    return null;
  }, [selectedVisit]);
  const paymentCategory = useMemo(() => {
    if (!selectedVisit) {
      return null;
    }
    if (billing.mode === 'self-pay') {
      return `自費: ${selectedSelfPayOption.label}`;
    }
    if (selectedInsurance) {
      const base = selectedInsurance.className ?? selectedInsurance.label ?? '';
      const code = selectedInsurance.classCode?.trim();
      if (base && code) {
        return `${base} (${code})`;
      }
      return base || null;
    }
    return null;
  }, [billing.mode, selectedInsurance, selectedSelfPayOption.label, selectedVisit]);
  const emergencyContact = useMemo(() => {
    if (!patientDetail) {
      return null;
    }
    const sanitize = (value?: string | null) => value?.trim() ?? '';
    const entries = [sanitize(patientDetail.relations), sanitize(patientDetail.telephone), sanitize(patientDetail.mobilePhone)].filter(
      (entry) => entry.length > 0,
    );
    return entries.length > 0 ? entries.join(' / ') : null;
  }, [patientDetail]);
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
  const timeline = useTimelineEvents({
    karteId,
    fromDate: timelineFromDate,
    includeModified: true,
    patientId: selectedVisit ? selectedVisit.patientId : null,
    orderSources: timelineOrderSources,
    planCards: timelinePlanSources,
    labLimit: 24,
  });

  const diagnosisHistoryQuery = useDiagnoses({
    karteId,
    fromDate: timelineFromDate,
    activeOnly: false,
  });

  const diagnosisBuckets = useDiagnosisBuckets({
    karteId,
    fromDate: timelineFromDate,
    enabled: Boolean(karteId),
  });

  const routineMedicationsQuery = useQuery({
    queryKey: ['masuda', 'routineMed', karteId ?? 'none'],
    enabled: typeof karteId === 'number',
    queryFn: () => fetchRoutineMedications(karteId ?? 0, { firstResult: 0, maxResults: 50 }),
    staleTime: 1000 * 30,
  });

  const allergySummaryItems = useMemo<SafetySummaryEntry[]>(() => {
    const allergies = karteQuery.data?.allergies ?? [];
    return allergies.map((allergy, index) => {
      const factor = allergy.factor?.trim() ?? '';
      const label = factor.length ? factor : `アレルギー ${index + 1}`;
      const detailParts = [allergy.severity?.trim(), allergy.memo?.trim()].filter(
        (value): value is string => Boolean(value && value.length > 0),
      );
      const description = detailParts.length ? detailParts.join(' / ') : undefined;
      const identified = allergy.identifiedDate ? formatDiagnosisDate(allergy.identifiedDate) : '---';
      const meta = identified && identified !== '---' ? `確認日: ${identified}` : undefined;
      const snippetParts = [`アレルギー: ${label}`];
      if (allergy.severity && allergy.severity.trim().length) {
        snippetParts.push(`重症度: ${allergy.severity.trim()}`);
      }
      if (allergy.memo && allergy.memo.trim().length) {
        snippetParts.push(allergy.memo.trim());
      }
      if (meta) {
        snippetParts.push(meta);
      }
      const snippet = snippetParts.join(' / ');
      const tone = determineSafetyTone(`${label} ${detailParts.join(' ')}`);
      return {
        id: `allergy-${index}`,
        label,
        description,
        meta,
        tone,
        snippet,
      } satisfies SafetySummaryEntry;
    });
  }, [karteQuery.data?.allergies]);

  const diagnosisSummaryItems = useMemo<SafetySummaryEntry[]>(() => {
    const toTime = (value?: string | null) => {
      if (!value) {
        return Number.NEGATIVE_INFINITY;
      }
      const normalized = value.includes('T') ? value : `${value}T00:00:00`;
      const time = new Date(normalized).getTime();
      return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
    };

    const diagnoses = diagnosisHistoryQuery.data ?? [];
    return diagnoses
      .filter((diagnosis) => diagnosis.diagnosis && diagnosis.diagnosis.trim().length)
      .sort((a, b) => {
        const left = toTime(a.started ?? a.firstEncounterDate ?? null);
        const right = toTime(b.started ?? b.firstEncounterDate ?? null);
        return right - left;
      })
      .slice(0, 6)
      .map((diagnosis, index) => {
        const name = diagnosisDisplayName(diagnosis);
        const statusLabel = diagnosisStatusLabel(diagnosis.status);
        const description = statusLabel ? `状態: ${statusLabel}` : undefined;
        const firstEncounter = diagnosis.firstEncounterDate ? formatDiagnosisDate(diagnosis.firstEncounterDate) : '---';
        const ended = diagnosis.ended ? formatDiagnosisDate(diagnosis.ended) : '---';
        const metaParts: string[] = [];
        if (firstEncounter && firstEncounter !== '---') {
          metaParts.push(`初回: ${firstEncounter}`);
        }
        if (ended && ended !== '---') {
          metaParts.push(`終了: ${ended}`);
        }
        const meta = metaParts.length ? metaParts.join(' / ') : undefined;
        const snippetParts = [`既往歴: ${name}`];
        if (statusLabel && statusLabel !== '状態不明') {
          snippetParts.push(`状態: ${statusLabel}`);
        }
        if (firstEncounter && firstEncounter !== '---') {
          snippetParts.push(`初回: ${firstEncounter}`);
        }
        if (ended && ended !== '---') {
          snippetParts.push(`終了: ${ended}`);
        }
        const snippet = snippetParts.join(' / ');
        const tone = determineSafetyTone(`${name} ${statusLabel}`);
        return {
          id: `history-${diagnosis.id ?? index}`,
          label: name,
          description,
          meta,
          tone,
          snippet,
        } satisfies SafetySummaryEntry;
      });
  }, [diagnosisHistoryQuery.data]);

  const medicationSummaryItems = useMemo<SafetySummaryEntry[]>(() => {
    const toTime = (value?: string | null) => {
      if (!value) {
        return Number.NEGATIVE_INFINITY;
      }
      const time = new Date(value).getTime();
      return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
    };

    const entries = routineMedicationsQuery.data ?? [];
    return entries
      .slice()
      .sort((a, b) => toTime(b.lastUpdated) - toTime(a.lastUpdated))
      .slice(0, 6)
      .map((entry, index) => {
        const label = routineMedicationLabel(entry);
        const modules = routineMedicationModules(entry, 4);
        const description = modules.length ? modules.join(' / ') : undefined;
        const updated = routineMedicationUpdatedAt(entry);
        const memo = entry.memo?.trim();
        const metaParts: string[] = [];
        if (memo && memo.length) {
          metaParts.push(memo);
        }
        if (updated) {
          metaParts.push(`最終更新: ${updated}`);
        }
        const meta = metaParts.length ? metaParts.join(' / ') : undefined;
        const snippetParts = [`内服薬: ${label}`];
        if (modules.length) {
          snippetParts.push(`構成: ${modules.join(' / ')}`);
        }
        if (memo && memo.length) {
          snippetParts.push(`備考: ${memo}`);
        }
        if (updated) {
          snippetParts.push(`最終更新: ${updated}`);
        }
        const snippet = snippetParts.join(' / ');
        const tone = determineSafetyTone(`${label} ${memo ?? ''}`);
        return {
          id: `medication-${entry.id ?? index}`,
          label,
          description,
          meta,
          tone,
          snippet,
        } satisfies SafetySummaryEntry;
      });
  }, [routineMedicationsQuery.data]);

  const safetySummarySections = useMemo<SafetySummarySection[]>(() => {
    if (!selectedVisit) {
      const placeholder = 'カルテ対象を選択すると表示されます。';
      return [
        { id: 'allergies', title: 'アレルギー', items: [], emptyMessage: placeholder },
        { id: 'histories', title: '既往歴', items: [], emptyMessage: placeholder },
        { id: 'medications', title: '内服薬（現用）', items: [], emptyMessage: placeholder },
      ];
    }

    const allergyError = karteQuery.error ? 'アレルギー情報の取得に失敗しました。' : null;
    const historyError = diagnosisHistoryQuery.error ? '既往歴の取得に失敗しました。' : null;
    const medicationError = routineMedicationsQuery.error ? '定期処方の取得に失敗しました。' : null;

    return [
      {
        id: 'allergies',
        title: 'アレルギー',
        items: allergySummaryItems,
        loading: karteQuery.isLoading,
        error: allergyError,
        emptyMessage: '登録されたアレルギーはありません。',
      },
      {
        id: 'histories',
        title: '既往歴',
        items: diagnosisSummaryItems,
        loading: diagnosisHistoryQuery.isLoading,
        error: historyError,
        emptyMessage: '既往歴はまだ登録されていません。',
      },
      {
        id: 'medications',
        title: '内服薬（現用）',
        items: medicationSummaryItems,
        loading: routineMedicationsQuery.isLoading,
        error: medicationError,
        emptyMessage: '登録された定期処方はありません。',
      },
    ];
  }, [
    allergySummaryItems,
    diagnosisHistoryQuery.error,
    diagnosisHistoryQuery.isLoading,
    diagnosisSummaryItems,
    karteQuery.error,
    karteQuery.isLoading,
    medicationSummaryItems,
    routineMedicationsQuery.error,
    routineMedicationsQuery.isLoading,
    selectedVisit,
  ]);

  useEffect(() => {
    if (!selectedVisit) {
      setDocInfos([]);
    }
  }, [selectedVisit]);

  useEffect(() => {
    if (timeline.documents.length === 0 && docInfos.length === 0) {
      return;
    }
    setDocInfos(timeline.documents);
  }, [timeline.documents, docInfos.length]);

  useEffect(() => {
    setEditingDocument(null);
  }, [selectedVisit]);

  const clientUuid = session?.credentials.clientUuid;
  const lock = useChartLock(selectedVisit, clientUuid);

  useEffect(() => {
    if (!selectedVisit) {
      return;
    }
    const performer = session?.userProfile?.displayName;
    setBilling(createInitialBillingState('insurance', null, performer));
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
    setPrimaryDiagnosis('');
    setPrimaryDiagnosisCardId(null);
    setConsultationStartAt(null);
    setElapsedSeconds(0);
    previousLockStateRef.current = false;
    previousVisitIdRef.current = selectedVisit.visitId ?? null;
  }, [selectedVisit, selectedVisit?.visitId, session?.userProfile?.displayName]);

  useEffect(() => {
    if (selectedVisit) {
      return;
    }
    setBilling(createInitialBillingState('insurance', null, session?.userProfile?.displayName));
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
    setPrimaryDiagnosis('');
    setPrimaryDiagnosisCardId(null);
    setConsultationStartAt(null);
    setElapsedSeconds(0);
    previousLockStateRef.current = false;
    previousVisitIdRef.current = null;
  }, [selectedVisit, session?.userProfile?.displayName]);

  useEffect(() => {
    setReferenceDocument(null);
    setReferenceSplitOpen(false);
  }, [selectedVisit?.visitId]);

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

  const monshinSummary = useMemo<MonshinSummaryItem[]>(() => {
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

  const referenceDocumentSnapshot = useMemo(() => {
    if (!referenceDocument) {
      return null;
    }
    const modules = referenceDocument.modules ?? [];
    const soaModule = modules.find((module) => module.moduleInfoBean?.stampRole === 'soaSpec');
    const planModule = modules.find((module) => module.moduleInfoBean?.stampRole === 'pSpec');
    const soaText = decodeProgressCourseText(soaModule?.beanBytes);
    const planText = decodeProgressCourseText(planModule?.beanBytes).replace(/^P:\s*/, '').trim();
    const sections = splitSoaSections(soaText);
    return {
      title: referenceDocument.docInfoModel?.title ?? '過去カルテ',
      confirmedAt: referenceDocument.docInfoModel?.confirmDate ?? null,
      subjective: sections.subjective,
      objective: sections.objective,
      ros: sections.ros,
      physicalExam: sections.physicalExam,
      assessment: sections.assessment,
      plan: planText,
    };
  }, [referenceDocument]);

  const mapLabModules = useCallback(
    (modules: LaboModule[], limit = 6) =>
      modules.slice(0, limit).map((module) => ({
        id: `lab-${module.id}`,
        sampleDate: module.sampleDate ?? null,
        items: module.items.slice(0, 6).map((item) => ({
          id: `lab-${module.id}-${item.id}`,
          label: item.itemName ?? '検査項目',
          value: item.valueText ?? '---',
          unit: item.unit ?? undefined,
          abnormalFlag: item.abnormalFlag ?? null,
        })),
      })),
    [],
  );

  const defaultReferenceLabModules = useMemo(
    () => mapLabModules(timeline.labModules, 6),
    [mapLabModules, timeline.labModules],
  );

  const [referenceLabModules, setReferenceLabModules] = useState(() => defaultReferenceLabModules);
  const [labSelectionActive, setLabSelectionActive] = useState(false);

  useEffect(() => {
    if (labSelectionActive) {
      return;
    }
    setReferenceLabModules((prev) => {
      if (areReferenceLabModulesEqual(prev, defaultReferenceLabModules)) {
        return prev;
      }
      return defaultReferenceLabModules;
    });
  }, [defaultReferenceLabModules, labSelectionActive]);

  const referenceLabLoading = timeline.isLoading || timeline.isFetching;

  const referenceLabError = useMemo(() => {
    if (!timeline.labError) {
      return null;
    }
    return timeline.labError instanceof Error
      ? timeline.labError.message
      : '検査結果の取得に失敗しました。';
  }, [timeline.labError]);

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

  const objectiveNarrative = useMemo(
    () => buildObjectiveNarrative({ objective: draft.objective, ros: draft.ros, physicalExam: draft.physicalExam }),
    [draft.objective, draft.physicalExam, draft.ros],
  );

  const vitalSigns = useMemo<VitalSignItem[]>(
    () =>
      objectiveNarrative
        ? Array.from(
            objectiveNarrative.matchAll(
              /(BP|SpO2|HR|Temp)\s*[:=\uFF1A\u30FB-]?\s*([^\n]+)/gi,
            ),
          ).map((match, index) => ({
            id: `vital-${index}`,
            label: match[1].toUpperCase(),
            value: match[2].trim(),
          }))
        : [],
    [objectiveNarrative],
  );

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
          confirmedAt: attachment.confirmedAt ?? null,
          createdAt: attachment.createdAt ?? null,
          recordedAt: attachment.recordedAt ?? null,
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
          thumbnailUri: attachment.thumbnailUri ?? null,
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

  useEffect(() => {
    const primaryCard = planCards.find((card) => card.isPrimaryDiagnosis);
    if (!primaryCard) {
      if (primaryDiagnosisCardId) {
        setPrimaryDiagnosisCardId(null);
      }
      return;
    }
    if (primaryDiagnosisCardId !== primaryCard.id) {
      setPrimaryDiagnosisCardId(primaryCard.id);
    }
    const resolved = resolvePrimaryDiagnosisText(primaryCard);
    if (resolved !== primaryDiagnosis) {
      setPrimaryDiagnosis(resolved);
    }
  }, [planCards, primaryDiagnosis, primaryDiagnosisCardId]);

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

  const handlePlanPrimaryDiagnosisSelect = useCallback(
    (id: string) => {
      let found = false;
      let resolved = '';
      updatePlanCards((cards) =>
        cards.map((card) => {
          if (card.id === id) {
            found = true;
            const nextCard = { ...card, isPrimaryDiagnosis: true };
            resolved = resolvePrimaryDiagnosisText(nextCard);
            return nextCard;
          }
          if (card.isPrimaryDiagnosis) {
            return { ...card, isPrimaryDiagnosis: false };
          }
          return card;
        }),
      );
      if (found) {
        setPrimaryDiagnosisCardId(id);
        setPrimaryDiagnosis(resolved);
        if (resolved) {
          setDiagnosisTags((prev) => (prev.includes(resolved) ? prev : [resolved, ...prev]));
        }
      }
    },
    [updatePlanCards],
  );

  const handlePrimaryDiagnosisChange = useCallback((value: string) => {
    setPrimaryDiagnosis(value);
    setSaveState('idle');
    setHasUnsavedChanges(true);
  }, []);

  const handlePrimaryDiagnosisCommit = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      setPrimaryDiagnosis(trimmed);
      if (!trimmed) {
        updatePlanCards((cards) =>
          cards.map((card) => (card.isPrimaryDiagnosis ? { ...card, isPrimaryDiagnosis: false } : card)),
        );
        setPrimaryDiagnosisCardId(null);
        return;
      }

      let nextPrimaryCardId: string | null = primaryDiagnosisCardId;
      updatePlanCards((cards) => {
        let found = false;
        const nextCards = cards.map((card) => {
          if (card.id === primaryDiagnosisCardId || card.isPrimaryDiagnosis) {
            if (!found) {
              found = true;
              const nextCard = { ...card, title: trimmed, isPrimaryDiagnosis: true };
              nextPrimaryCardId = nextCard.id;
              return nextCard;
            }
            return { ...card, isPrimaryDiagnosis: false };
          }
          return card;
        });
        if (found) {
          return nextCards;
        }
        const newCard: PlanComposerCard = { ...createPlanCard('followup', '', trimmed), isPrimaryDiagnosis: true };
        nextPrimaryCardId = newCard.id;
        return [newCard, ...cards];
      });

      setPrimaryDiagnosisCardId(nextPrimaryCardId);
      if (trimmed) {
        setDiagnosisTags((prev) => (prev.includes(trimmed) ? prev : [trimmed, ...prev]));
      }
    },
    [primaryDiagnosisCardId, updatePlanCards],
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
      if (id === primaryDiagnosisCardId) {
        setPrimaryDiagnosisCardId(null);
        setPrimaryDiagnosis('');
      }
    },
    [primaryDiagnosisCardId, updatePlanCards],
  );

  const handlePlanCardInsert = useCallback(
    (type: PlanComposerCard['type'], initializer?: (card: PlanComposerCard) => PlanComposerCard) => {
      let insertedId: string | null = null;
      updatePlanCards((cards) => {
        const baseCard = createPlanCard(type);
        const nextCard = initializer ? initializer(baseCard) : baseCard;
        insertedId = nextCard.id;
        return [...cards, nextCard];
      });
      return insertedId;
    },
    [updatePlanCards],
  );

  const ensurePlanCardForDiagnosis = useCallback(
    (diagnosis: RegisteredDiagnosis) => {
      const label = diagnosis.diagnosis?.trim();
      if (!label) {
        return null;
      }
      const normalized = label.toLowerCase();
      const existing = planCards.find((card) => {
        const title = card.title?.trim().toLowerCase() ?? '';
        const detailText = card.detail?.trim().toLowerCase() ?? '';
        return title === normalized || (!title && detailText === normalized);
      });
      if (existing) {
        return { id: existing.id, created: false } as const;
      }
      const detail = diagnosis.diagnosisCode?.trim();
      const insertedId = handlePlanCardInsert('followup', (card) => ({
        ...card,
        title: label,
        detail: detail ? `ICD10: ${detail}` : card.detail,
      }));
      return insertedId ? ({ id: insertedId, created: true } as const) : null;
    },
    [handlePlanCardInsert, planCards],
  );

  const handleProblemPrimarySelect = useCallback(
    (diagnosis: RegisteredDiagnosis) => {
      const ensured = ensurePlanCardForDiagnosis(diagnosis);
      if (!ensured) {
        return;
      }
      handlePlanPrimaryDiagnosisSelect(ensured.id);
    },
    [ensurePlanCardForDiagnosis, handlePlanPrimaryDiagnosisSelect],
  );

  const handleProblemPlanAppend = useCallback(
    (diagnosis: RegisteredDiagnosis) => {
      const ensured = ensurePlanCardForDiagnosis(diagnosis);
      if (!ensured) {
        return;
      }
      setFocusedPlanCardId(ensured.id);
    },
    [ensurePlanCardForDiagnosis, setFocusedPlanCardId],
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

  const handleSubjectiveInsertText = useCallback((text: string) => {
    setDraft((prev) => ({ ...prev, subjective: prev.subjective ? `${prev.subjective}\n${text}` : text }));
    setSaveState('idle');
    setHasUnsavedChanges(true);
  }, []);

  const handleRosInsertText = useCallback((text: string) => {
    setDraft((prev) => ({ ...prev, ros: prev.ros ? `${prev.ros}\n${text}` : text }));
    setSaveState('idle');
    setHasUnsavedChanges(true);
  }, []);

  const handlePhysicalExamInsertText = useCallback((text: string) => {
    setDraft((prev) => ({ ...prev, physicalExam: prev.physicalExam ? `${prev.physicalExam}\n${text}` : text }));
    setSaveState('idle');
    setHasUnsavedChanges(true);
  }, []);

  const handleAssessmentInsertText = useCallback((text: string) => {
    setDraft((prev) => ({ ...prev, assessment: prev.assessment ? `${prev.assessment}\n${text}` : text }));
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

      if (!selectedVisit) {
        throw new Error('診察対象の受付が選択されていません。');
      }
      const progressContext = buildProgressContext({
        draft,
        visit: selectedVisit,
        billing: billingPayload,
        visitMemo: chiefComplaint,
      });

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
      await refetchKarte();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [
    billingPayload,
    buildProgressContext,
    chiefComplaint,
    chiefComplaintDirty,
    chiefComplaintStatus,
    draft,
    editingDocument,
    lock,
    refetchKarte,
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
      await updatePatientMemo({
        memoId: patientMemoId,
        karteId,
        memo: normalized,
        session,
      });

      setPatientMemoStatus('saved');
      setPatientMemoDirty(false);
      setPatientMemoUpdatedAt(new Date().toISOString());

      recordOperationEvent('chart', 'info', 'patient_memo_save', '患者メモを保存しました', {
        patientId: selectedVisit.patientId,
        karteId,
        memoLength: normalized.length,
      });

      await queryClient.invalidateQueries({ queryKey: patientKarteQueryKey });
    } catch (error) {
      setPatientMemoStatus('error');
      setPatientMemoError(
        error instanceof Error && error.message
          ? error.message
          : '患者メモの保存に失敗しました。通信状態を確認して再度お試しください。',
      );
    }
  }, [
    karteId,
    patientMemo,
    patientMemoDirty,
    patientMemoId,
    patientMemoStatus,
    queryClient,
    selectedVisit,
    session,
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
    if (!freeDocumentDirty && freeDocumentStatus !== 'error') {
      return;
    }

    const normalized = freeDocumentComment.trim();
    setFreeDocumentComment(normalized);
    setFreeDocumentStatus('saving');
    setFreeDocumentError(null);

    try {
      const result = await saveFreeDocument({
        patientId: selectedVisit.patientId,
        comment: normalized,
        id: freeDocumentId,
      });

      setFreeDocumentStatus('saved');
      setFreeDocumentDirty(false);
      setFreeDocumentUpdatedAt(result?.confirmedAt ?? new Date().toISOString());
      setFreeDocumentId(result?.id ?? freeDocumentId ?? null);

      recordOperationEvent('chart', 'info', 'free_document_save', '自由記載欄を保存しました', {
        patientId: selectedVisit.patientId,
        freeDocumentId: result?.id ?? freeDocumentId ?? null,
        snippetLength: normalized.length,
      });

      await queryClient.invalidateQueries({ queryKey: freeDocumentQueryKey });
    } catch (error) {
      setFreeDocumentStatus('error');
      setFreeDocumentError(
        error instanceof Error && error.message
          ? error.message
          : '自由記載欄の保存に失敗しました。時間をおいて再度お試しください。',
      );
    }
  }, [
    freeDocumentComment,
    freeDocumentDirty,
    freeDocumentId,
    freeDocumentStatus,
    queryClient,
    selectedVisit,
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

  const resolveProgressContext = useCallback(
    (): { context: ProgressNoteContext | null; error: string | null } => {
      if (!session || !selectedVisit) {
        return { context: null, error: '診察対象の受付が選択されていません' };
      }
      if (!karteId) {
        return { context: null, error: 'カルテ情報の取得に失敗しました。再度お試しください。' };
      }
      if (billing.mode === 'insurance' && !selectedInsurance) {
        return { context: null, error: '適用する保険を選択してください' };
      }

      try {
        const context = buildProgressContext({
          draft,
          visit: selectedVisit,
          billing: billingPayload,
          visitMemo: chiefComplaint,
        });
        return { context, error: null };
      } catch (error) {
        return { context: null, error: error instanceof Error ? error.message : 'カルテ文書の準備に失敗しました' };
      }
    },
    [billing.mode, billingPayload, buildProgressContext, chiefComplaint, karteId, selectedInsurance, selectedVisit, session, draft],
  );

  const isLockedByMe = useMemo(
    () => Boolean(selectedVisit && clientUuid && selectedVisit.ownerUuid === clientUuid),
    [clientUuid, selectedVisit],
  );
  const isLockedByOther = useMemo(
    () => Boolean(selectedVisit && selectedVisit.ownerUuid && clientUuid && selectedVisit.ownerUuid !== clientUuid),
    [clientUuid, selectedVisit],
  );

  useEffect(() => {
    const currentVisitId = selectedVisit?.visitId ?? null;
    if (currentVisitId !== previousVisitIdRef.current) {
      setConsultationStartAt(null);
      setElapsedSeconds(0);
      previousLockStateRef.current = false;
      previousVisitIdRef.current = currentVisitId;
    }

    if (!selectedVisit) {
      return;
    }

    if (isLockedByMe && !previousLockStateRef.current) {
      setConsultationStartAt(Date.now());
    } else if (!isLockedByMe && previousLockStateRef.current) {
      setConsultationStartAt(null);
      setElapsedSeconds(0);
    }

    previousLockStateRef.current = isLockedByMe;
  }, [isLockedByMe, selectedVisit]);

  useEffect(() => {
    if (!consultationStartAt || !isLockedByMe) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - consultationStartAt) / 1000));
      setElapsedSeconds(diff);
    };
    tick();
    const handle = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(handle);
    };
  }, [consultationStartAt, isLockedByMe]);

  useEffect(() => {
    setSignatureState('idle');
    setSignatureError(null);
    setLastSignedAt(null);
    setClaimState('idle');
    setClaimError(null);
    setLastClaimSentAt(null);
    setLastSavedDocId(null);
  }, [selectedVisit]);

  const elapsedTimeLabel = useMemo(() => {
    const total = Math.max(0, elapsedSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);
  const isTimerRunning = Boolean(isLockedByMe && consultationStartAt);

  const planSignatureRequirements = useMemo(
    () => new Set<PlanComposerCard['type']>(['medication', 'injection', 'procedure', 'exam', 'guidance']),
    [],
  );

  const pendingPlanOrders = useMemo(
    () => planCards.filter((card) => planSignatureRequirements.has(card.type) && !card.orderModuleId),
    [planCards, planSignatureRequirements],
  );

  const orphanOrderModules = useMemo(
    () => orderModules.filter((module) => !planCards.some((card) => card.orderModuleId === module.id)),
    [orderModules, planCards],
  );

  const signatureGuard = useMemo(() => {
    if (!isLockedByMe) {
      return { ready: false, reason: '診察を開始してから署名してください' };
    }
    if (saveState === 'saving') {
      return { ready: false, reason: '保存完了を待ってください' };
    }
    if (hasUnsavedChanges) {
      return { ready: false, reason: '保存してから署名してください' };
    }
    if (saveState !== 'saved') {
      return { ready: false, reason: '保存してから署名してください' };
    }
    if (!editingDocument && !lastSavedDocId) {
      return { ready: false, reason: '保存済みのカルテが見つかりません。保存後に再度お試しください。' };
    }
    if (pendingPlanOrders.length > 0) {
      return { ready: false, reason: 'Planカードに未確定のオーダがあります。必要なオーダを確定してください。' };
    }
    if (orphanOrderModules.length > 0) {
      return { ready: false, reason: 'Planとオーダの内容が一致していません。不要なオーダを整理してください。' };
    }
    return { ready: true, reason: null };
  }, [
    editingDocument,
    hasUnsavedChanges,
    isLockedByMe,
    lastSavedDocId,
    orphanOrderModules,
    pendingPlanOrders,
    saveState,
  ]);

  const claimGuard = useMemo(() => {
    if (!isLockedByMe) {
      return { ready: false, reason: '診察を開始してから会計連携してください' };
    }
    if (signatureState !== 'signed') {
      return { ready: false, reason: '署名完了後に会計連携を実行してください' };
    }
    if (!claimSendEnabled) {
      return { ready: false, reason: '保険診療（送信対象の保険選択時）のみ CLAIM を送信できます' };
    }
    if (saveState !== 'saved') {
      return { ready: false, reason: '保存してから会計連携を実行してください' };
    }
    if (!editingDocument && !lastSavedDocId) {
      return { ready: false, reason: '保存済みのカルテが見つかりません。保存後に再度お試しください。' };
    }
    return { ready: true, reason: null };
  }, [claimSendEnabled, editingDocument, isLockedByMe, lastSavedDocId, saveState, signatureState]);

  const signatureDisabled = !signatureGuard.ready;
  const signatureDisabledReason = signatureGuard.reason;
  const claimDisabled = !claimGuard.ready;
  const claimDisabledReason = claimGuard.reason;

  const handleLock = useCallback(async () => {
    if (!selectedVisit) {
      setSaveError('診察対象の受付を選択してください');
      return;
    }
    const { context, error } = resolveProgressContext();
    if (!context) {
      setSaveError(error);
      setSaveState('error');
      return;
    }

    try {
      setSaveState('saving');
      setSaveError(null);

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(context);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
        setLastSavedDocId(editingDocument.docInfoModel?.docPk ?? editingDocument.id);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        const docIdentifier = await saveProgressNote(context, nextState, selectedVisit.visitId);
        const parsedId = Number.parseInt(docIdentifier ?? '', 10);
        setLastSavedDocId(Number.isFinite(parsedId) ? parsedId : null);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      const nowLabel = new Date().toLocaleTimeString();
      setLastSavedAt(nowLabel);
      setSignatureState('idle');
      setSignatureError(null);
      setLastSignedAt(null);
      setClaimState('idle');
      setClaimError(null);
      setLastClaimSentAt(null);
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [editingDocument, karteQuery, lock, resolveProgressContext, selectedVisit]);

  const handleSave = useCallback(async () => {
    if (!session || !selectedVisit) {
      setSaveError('保存対象の診察情報が選択されていません');
      return;
    }
    if (!clientUuid || selectedVisit.ownerUuid !== clientUuid) {
      setSaveError('診察を開始してから保存してください');
      return;
    }

    const { context, error } = resolveProgressContext();
    if (!context) {
      setSaveError(error);
      setSaveState('error');
      return;
    }

    try {
      setSaveState('saving');
      setSaveError(null);

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(context);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
        setLastSavedDocId(editingDocument.docInfoModel?.docPk ?? editingDocument.id);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        const docIdentifier = await saveProgressNote(context, nextState, selectedVisit.visitId);
        const parsedId = Number.parseInt(docIdentifier ?? '', 10);
        setLastSavedDocId(Number.isFinite(parsedId) ? parsedId : null);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      const nowLabel = new Date().toLocaleTimeString();
      setLastSavedAt(nowLabel);
      setSignatureState('idle');
      setSignatureError(null);
      setLastSignedAt(null);
      setClaimState('idle');
      setClaimError(null);
      setLastClaimSentAt(null);
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [clientUuid, editingDocument, karteQuery, lock, resolveProgressContext, selectedVisit, session]);

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

      const { context, error } = resolveProgressContext();
      if (!context) {
        setSaveState('error');
        setSaveError(error);
        return;
      }

      if (editingDocument) {
        const updatedDocument = createProgressNoteDocument(context);
        const payload = buildUpdatedDocumentPayload(editingDocument, updatedDocument);
        await updateDocument(payload);
        setLastSavedDocId(editingDocument.docInfoModel?.docPk ?? editingDocument.id);
      } else {
        const nextState = selectedVisit.state & ~(1 << BIT_OPEN);
        const docIdentifier = await saveProgressNote(context, nextState, selectedVisit.visitId);
        const parsedId = Number.parseInt(docIdentifier ?? '', 10);
        setLastSavedDocId(Number.isFinite(parsedId) ? parsedId : null);
      }

      setSaveState('saved');
      setHasUnsavedChanges(false);
      const nowLabel = new Date().toLocaleTimeString();
      setLastSavedAt(nowLabel);
      await lock.unlock();
      await karteQuery.refetch();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
  }, [editingDocument, handleSave, hasUnsavedChanges, karteQuery, lock, resolveProgressContext, saveState, selectedVisit]);

  const handleSaveDraft = useCallback(() => {
    void handleSave();
  }, [handleSave]);

  const handleOpenShortcuts = useCallback(() => {
    setShortcutsOpen(true);
  }, []);

  const handleCloseShortcuts = useCallback(() => {
    setShortcutsOpen(false);
  }, []);

  const handleSignDocument = useCallback(async () => {
    if (!signatureGuard.ready) {
      setSignatureState('blocked');
      setSignatureError(null);
      return;
    }

    if (!selectedVisit) {
      setSignatureState('error');
      setSignatureError('診察対象の受付が選択されていません。');
      return;
    }

    const activeVisit = selectedVisit;

    const { context, error } = resolveProgressContext();
    if (!context) {
      setSignatureState('error');
      setSignatureError(error ?? '署名に必要な情報を取得できませんでした');
      return;
    }

    const targetDocId = editingDocument?.docInfoModel?.docPk ?? editingDocument?.id ?? lastSavedDocId;
    if (!targetDocId) {
      setSignatureState('error');
      setSignatureError('保存済みのカルテが見つかりません。保存後に再度お試しください。');
      return;
    }

    setSignatureState('signing');
    setSignatureError(null);

    try {
      let baseDocument: DocumentModelPayload | null = editingDocument;
      if (!baseDocument) {
        const documents = await fetchDocumentsByIds([targetDocId]);
        baseDocument = documents[0] ?? null;
      }

      if (!baseDocument) {
        throw new Error('カルテ文書の取得に失敗しました');
      }

      const updatedDocument = createProgressNoteDocument(context);
      const payload = buildUpdatedDocumentPayload(baseDocument, updatedDocument);
      const now = new Date();
      const confirmTimestamp = formatRestTimestamp(now);
      payload.confirmed = confirmTimestamp;
      payload.recorded = payload.recorded ?? confirmTimestamp;
      payload.status = 'F';
      payload.docInfoModel.status = 'F';
      payload.docInfoModel.confirmDate = confirmTimestamp;
      payload.docInfoModel.firstConfirmDate = payload.docInfoModel.firstConfirmDate ?? confirmTimestamp;

      await updateDocument(payload);
      await publishChartEvent({ visit: activeVisit, nextState: activeVisit.state, ownerUuid: clientUuid });
      setSignatureState('signed');
      setSignatureError(null);
      setLastSignedAt(now.toLocaleTimeString());
      setLastSavedDocId(payload.docInfoModel.docPk ?? targetDocId);
      setClaimState('idle');
      setClaimError(null);
      setLastClaimSentAt(null);
      await karteQuery.refetch();
    } catch (error) {
      setSignatureState('error');
      setSignatureError(error instanceof Error ? error.message : '署名処理に失敗しました');
    }
  }, [
    clientUuid,
    editingDocument,
    karteQuery,
    lastSavedDocId,
    resolveProgressContext,
    selectedVisit,
    signatureGuard.ready,
  ]);

  const handleSendClaim = useCallback(async () => {
    if (!claimGuard.ready) {
      setClaimError(claimDisabledReason ?? null);
      return;
    }

    if (!selectedVisit) {
      setClaimState('error');
      setClaimError('診察対象の受付が選択されていません。');
      return;
    }

    const activeVisit = selectedVisit;

    const { context, error } = resolveProgressContext();
    if (!context) {
      setClaimState('error');
      setClaimError(error ?? '会計連携に必要な情報を取得できませんでした');
      return;
    }

    const targetDocId = editingDocument?.docInfoModel?.docPk ?? editingDocument?.id ?? lastSavedDocId;
    if (!targetDocId) {
      setClaimState('error');
      setClaimError('保存済みのカルテが見つかりません。保存後に再度お試しください。');
      return;
    }

    setClaimState('sending');
    setClaimError(null);

    try {
      let baseDocument: DocumentModelPayload | null = editingDocument;
      if (!baseDocument) {
        const documents = await fetchDocumentsByIds([targetDocId]);
        baseDocument = documents[0] ?? null;
      }

      if (!baseDocument) {
        throw new Error('カルテ文書の取得に失敗しました');
      }

      const updatedDocument = createProgressNoteDocument(context);
      const payload = buildUpdatedDocumentPayload(baseDocument, updatedDocument);
      const now = new Date();
      const confirmTimestamp = formatRestTimestamp(now);
      payload.confirmed = confirmTimestamp;
      payload.recorded = payload.recorded ?? confirmTimestamp;
      payload.status = 'F';
      payload.docInfoModel.status = 'F';
      payload.docInfoModel.confirmDate = confirmTimestamp;
      payload.docInfoModel.firstConfirmDate = payload.docInfoModel.firstConfirmDate ?? confirmTimestamp;
      payload.docInfoModel.sendClaim = true;

      await sendClaimDocument(payload);
      setClaimState('sent');
      setClaimError(null);
      setLastClaimSentAt(now.toLocaleTimeString());
    } catch (error) {
      setClaimState('error');
      setClaimError(error instanceof Error ? error.message : '会計連携に失敗しました');
      return;
    }

    try {
      await publishChartEvent({ visit: activeVisit, nextState: activeVisit.state, ownerUuid: clientUuid });
      await karteQuery.refetch();
    } catch (eventError) {
      // ChartEvent 送信失敗は重大ではないため、警告のみ表示
      setClaimError((prev) => prev ?? (eventError instanceof Error ? `ChartEvent送信に失敗しました: ${eventError.message}` : 'ChartEvent送信に失敗しました'));
    }
  }, [
    claimDisabledReason,
    claimGuard.ready,
    clientUuid,
    editingDocument,
    karteQuery,
    lastSavedDocId,
    resolveProgressContext,
    selectedVisit,
  ]);

  const handleAddDiagnosisTag = useCallback(
    (value: string) => {
      setDiagnosisTags((prev) => (prev.includes(value) ? prev : [...prev, value]));
    },
    [],
  );

  const handleRemoveDiagnosisTag = useCallback((value: string) => {
    setDiagnosisTags((prev) => prev.filter((tag) => tag !== value));
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
        ros: soaSections.ros,
        physicalExam: soaSections.physicalExam,
        assessment: soaSections.assessment,
        plan: planText,
      });

      const orderDrafts = modules
        .filter((module) => module.moduleInfoBean?.entity && module.moduleInfoBean.entity !== 'progressCourse')
        .map((module, index) => convertModuleToOrderDraft(module, index))
        .filter((draft): draft is OrderModuleDraft => Boolean(draft));

      setOrderModules(orderDrafts);
      setPlanCards([]);

      const confirmLabel = toLocaleTimeLabel(document.docInfoModel?.confirmDate ?? document.docInfoModel?.firstConfirmDate ?? null);
      if (confirmLabel) {
        setSignatureState('signed');
        setLastSignedAt(confirmLabel);
      } else {
        setSignatureState('idle');
        setLastSignedAt(null);
      }
      setSignatureError(null);

      if (document.docInfoModel?.sendClaim) {
        setClaimState('sent');
        setClaimError(null);
        setLastClaimSentAt(toLocaleTimeLabel(document.docInfoModel?.claimDate ?? null));
      } else {
        setClaimState('idle');
        setClaimError(null);
        setLastClaimSentAt(null);
      }
      setLastSavedDocId(document.docInfoModel?.docPk ?? document.id ?? null);

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
      setActiveSection('objective');
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
    setActiveSection('subjective');
  }, [session]);

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

        if (activeSection !== 'plan') {
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

      if (!selectedVisit) {
        throw new Error('診察対象の受付が選択されていません。');
      }
      const progressContext = buildProgressContext({
        draft,
        visit: selectedVisit,
        billing: billingPayload,
        visitMemo: chiefComplaint,
      });

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
      await refetchKarte();
      setEditingDocument(null);
    } catch (error) {
      setSaveState('error');
      setSaveError(error instanceof Error ? error.message : 'カルテの保存に失敗しました');
    }
      })();
    },
    [
      activeSection,
      billingPayload,
      buildProgressContext,
      chiefComplaint,
      draft,
      editingDocument,
      handleObjectiveInsertText,
      isLockedByMe,
      lock,
      refetchKarte,
      selectedVisit,
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

      setActiveSection('plan');
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
      const modules = await fetchOrcaOrderModules(code, name, {
        visitDate: selectedVisit?.visitDate ?? undefined,
      });
      if (modules.length === 0) {
        throw new Error('ORCA から診療行為を取得できませんでした');
      }
      const drafts = modules.reduce<OrderModuleDraft[]>((acc, module, index) => {
        if (!module.moduleInfoBean || !module.beanBytes) {
          return acc;
        }
        acc.push({
          id: createOrderModuleId(),
          source: 'orca' as const,
          label: `${name} (${code})`,
          createdAt: new Date().toISOString(),
          moduleInfo: {
            stampName: module.moduleInfoBean.stampName,
            stampRole: module.moduleInfoBean.stampRole ?? 'p',
            entity: module.moduleInfoBean.entity ?? 'generalOrder',
            stampNumber: module.moduleInfoBean.stampNumber ?? index,
            stampId: module.moduleInfoBean.stampId ?? undefined,
          },
          beanBytes: module.beanBytes,
        });
        return acc;
      }, []);

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
    [isLockedByMe, registerOrderModules, selectedVisit?.visitDate],
  );

  const searchResults = useMemo<ChartSearchResultItem[]>(() => {
    const base: ChartSearchResultItem[] = [];
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      base.push(
        ...diagnosisTags
          .filter((tag) => tag.toLowerCase().includes(query))
          .map((tag) => ({
            id: `dx-${tag}`,
            label: tag,
            detail: '診断タグ',
            section: 'A&P' as SearchSection,
            payload: tag,
            planType: 'followup' as PlanComposerCard['type'],
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
                ? ('薬' as SearchSection)
                : stamp.entity === 'test'
                ? ('検査' as SearchSection)
                : stamp.entity === 'procedure'
                ? ('処置' as SearchSection)
                : ('A&P' as SearchSection),
            payload: [stamp.name, stamp.memo].filter(Boolean).join(' '),
            planType:
              stamp.entity === 'medication'
                ? ('medication' as PlanComposerCard['type'])
                : stamp.entity === 'test'
                ? ('exam' as PlanComposerCard['type'])
                : stamp.entity === 'procedure'
                ? ('procedure' as PlanComposerCard['type'])
                : ('followup' as PlanComposerCard['type']),
          })),
      );
    }
    base.push(
      ...pastSummaries.map((summary) => ({
        id: `history-${summary.id}`,
        label: summary.title,
        detail: summary.excerpt,
        section: '過去カルテ' as SearchSection,
        payload: `${summary.title}: ${summary.excerpt}`,
      })),
    );
    if (objectiveNarrative) {
      base.push({
        id: 'current-objective',
        label: '現在の所見を引用',
        detail: objectiveNarrative.slice(0, 64),
        section: 'O' as SearchSection,
        payload: objectiveNarrative,
      });
    }
    if (draft.assessment) {
      base.push({
        id: 'current-assessment',
        label: '現在の評価を引用',
        detail: draft.assessment.slice(0, 64),
        section: 'A&P' as SearchSection,
        payload: draft.assessment,
        planType: 'followup' as PlanComposerCard['type'],
      });
    }

    return base.filter((item) => (query ? item.label.toLowerCase().includes(query) || item.detail.toLowerCase().includes(query) : true));
  }, [diagnosisTags, draft.assessment, objectiveNarrative, pastSummaries, searchQuery, stampLibraryQuery.data]);

  const filteredSearchResults = useMemo(() => searchResults.filter((item) => item.section === searchSection), [searchResults, searchSection]);

  useEffect(() => {
    if (searchIndex >= filteredSearchResults.length) {
      setSearchIndex(0);
    }
  }, [filteredSearchResults.length, searchIndex]);

  const handleSearchConfirm = useCallback(
    (item: ChartSearchResultItem) => {
      if (!item.payload) {
        setSearchOpen(false);
        setSearchQuery('');
        return;
      }
      if (item.section === 'O' || item.section === 'テンプレ') {
        handleObjectiveInsertText(item.payload);
      } else {
        const type: PlanComposerCard['type'] = item.planType ?? 'followup';
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
      const shouldForceCollapse = width < RIGHT_CONSOLE_COLLAPSE_BREAKPOINT;

      setForceCollapse(shouldForceCollapse);

      if (shouldForceCollapse) {
        setRightPaneCollapsed(true);
        return;
      }

      if (width >= RIGHT_CONSOLE_AUTO_EXPAND_BREAKPOINT) {
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
        setActiveSection((prev) => {
          if (prev === 'objective') {
            return 'plan';
          }
          if (prev === 'plan') {
            return 'objective';
          }
          return 'objective';
        });
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
        target: 'plan',
      });
    },
    [draft.plan],
  );

  const handleMonshinDiffRequest = useCallback(
    (incoming: string[]) => {
      setDiffMergeState({
        open: true,
        title: '問診との差分確認',
        current: draft.subjective ? draft.subjective.split('\n').map((paragraph) => paragraph.trim()).filter(Boolean) : [],
        incoming,
        target: 'subjective',
      });
    },
    [draft.subjective],
  );

  const handleMonshinHistoryRequest = useCallback(() => {
    setContextHistoryOpen(true);
  }, []);

  const handleReferenceSplitToggle = useCallback(() => {
    setReferenceSplitOpen((prev) => !prev);
  }, []);

  const handleReferenceDocumentSelected = useCallback(
    (document: DocumentModelPayload | null) => {
      setReferenceDocument(document);
      setLabSelectionActive(false);
      setReferenceLabModules(defaultReferenceLabModules);
    },
    [defaultReferenceLabModules],
  );

  const handleTimelineVisitSelected = useCallback(() => {
    setLabSelectionActive(false);
    setReferenceLabModules(defaultReferenceLabModules);
  }, [defaultReferenceLabModules]);

  const handleTimelineLabSelected = useCallback(
    (payload: TimelineLabPayload) => {
      setLabSelectionActive(true);
      const matched = timeline.labModules.find((module) => module.id === payload.moduleId);
      if (matched) {
        setReferenceLabModules(mapLabModules([matched], 1));
        return;
      }
      setReferenceLabModules(defaultReferenceLabModules);
    },
    [defaultReferenceLabModules, mapLabModules, timeline.labModules],
  );

  const handleTimelineOrderSelected = useCallback(
    (payload: TimelineOrderPayload) => {
      setLabSelectionActive(false);
      setReferenceLabModules(defaultReferenceLabModules);
      setActiveSection('plan');
      updatePlanCards((cards) => {
        const existing = cards.find(
          (card) => card.id === payload.orderId || (payload.orderModuleId && card.orderModuleId === payload.orderModuleId),
        );
        if (existing) {
          return cards.map((card) =>
            card.id === existing.id
              ? {
                  ...card,
                  title: card.title || payload.summary,
                  detail: card.detail || (payload.detail ?? ''),
                  orderSummary: payload.summary || card.orderSummary,
                }
              : card,
          );
        }
        const newCard = {
          ...createPlanCard(payload.orderType, payload.detail ?? '', payload.summary, {
            orderModuleId: payload.orderModuleId ?? null,
            orderSummary: payload.summary,
          }),
          id: payload.orderId,
        };
        return [...cards, newCard];
      });
      setFocusedPlanCardId(payload.orderId);
    },
    [defaultReferenceLabModules, updatePlanCards],
  );

  const contextItems = useMemo<ContextItemDescriptor[]>(() => {
    const items: ContextItemDescriptor[] = [];

    for (const summary of monshinSummary) {
      const snippet = `${summary.question}: ${summary.answer}`;
      items.push({
        id: `monshin-${summary.id}`,
        kind: 'monshin',
        title: summary.question,
        detail: summary.answer,
        payload: snippet,
        actionLabel: 'コピー',
        onActivate: () => handleSnippetDragStart(snippet),
      });
    }

    for (const vital of vitalSigns) {
      const snippet = `${vital.label}: ${vital.value}`;
      items.push({
        id: `vital-${vital.id}`,
        kind: 'vital',
        title: vital.label,
        detail: vital.value,
        payload: snippet,
        actionLabel: 'コピー',
        onActivate: () => handleSnippetDragStart(snippet),
      });
    }

    for (const summary of pastSummaries) {
      items.push({
        id: `summary-${summary.id}`,
        kind: 'summary',
        title: summary.title,
        detail: summary.excerpt,
        timestamp: summary.recordedAt ?? null,
        actionLabel: '展開',
        onActivate: () => handlePastSummaryOpen(summary),
      });
    }

    for (const media of mediaItems) {
      const timestamp = media.capturedAt ?? media.confirmedAt ?? media.createdAt ?? null;
      items.push({
        id: `media-${media.id}`,
        kind: 'media',
        title: media.title,
        detail: media.description ?? media.documentTitle ?? 'プレビューを開きます',
        timestamp: timestamp ? formatUpdatedAt(timestamp) ?? timestamp : null,
        actionLabel: 'プレビュー',
        onActivate: () => handleMediaOpen(media),
      });
    }

    return items;
  }, [handleMediaOpen, handlePastSummaryOpen, handleSnippetDragStart, mediaItems, monshinSummary, pastSummaries, vitalSigns]);

  useEffect(() => {
    setPinnedContextIds((prev) => prev.filter((id) => contextItems.some((item) => item.id === id)));
  }, [contextItems]);

  const handleTogglePinnedContext = useCallback((id: string) => {
    setPinnedContextIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  }, []);

  const handleToggleContextHistory = useCallback(() => {
    setContextHistoryOpen((prev) => !prev);
  }, []);

  const handleDiffMerge = useCallback(
    (selected: string[]) => {
      if (diffMergeState.target === 'subjective') {
        selected.forEach((paragraph) => handleSubjectiveInsertText(paragraph));
      } else {
        selected.forEach((paragraph) => handlePlanInsertText(paragraph));
      }
      setDiffMergeState((prev) => ({ ...prev, open: false }));
    },
    [diffMergeState.target, handlePlanInsertText, handleSubjectiveInsertText],
  );

  const handleMiniSummaryExpand = useCallback(() => {
    if (pastSummaries[0]) {
      handlePastSummaryOpen(pastSummaries[0]);
    }
  }, [handlePastSummaryOpen, pastSummaries]);

  const documentTimelineProps: DocumentTimelineProps = {
    events: timeline.events,
    isLoading: timeline.isLoading,
    isFetching: timeline.isFetching,
    error: timeline.error,
    onRefresh: timeline.refetch,
    onDocumentSelected: handleReferenceDocumentSelected,
    onVisitEventSelected: handleTimelineVisitSelected,
    onLabEventSelected: handleTimelineLabSelected,
    onOrderEventSelected: handleTimelineOrderSelected,
    onEditDocument: handleEditDocument,
  };

  const problemListProps = {
    activeDiagnoses: diagnosisBuckets.activeDiagnoses,
    pastDiagnoses: diagnosisBuckets.pastDiagnoses,
    primaryDiagnosisName: primaryDiagnosis,
    isLoading: diagnosisBuckets.isLoading,
    isFetching: diagnosisBuckets.isFetching,
    error: diagnosisBuckets.error,
    onReload: () => {
      void diagnosisBuckets.refetch();
    },
    onSelectPrimary: handleProblemPrimarySelect,
    onAppendToPlan: handleProblemPlanAppend,
  };

  const handleSectionChange = useCallback((section: SoapSection) => {
    setActiveSection(section);
  }, []);

  const workSurfaceProps: WorkSurfaceProps = {
    activeSection,
    onSectionChange: handleSectionChange,
    subjectiveValue: draft.subjective,
    onSubjectiveChange: (value) => handleDraftChange('subjective', value),
    onSubjectiveInsertText: handleSubjectiveInsertText,
    objectiveValue: draft.objective,
    onObjectiveChange: (value) => handleDraftChange('objective', value),
    onObjectiveInsertText: handleObjectiveInsertText,
    rosValue: draft.ros,
    onRosChange: (value) => handleDraftChange('ros', value),
    onRosInsertText: handleRosInsertText,
    physicalExamValue: draft.physicalExam,
    onPhysicalExamChange: (value) => handleDraftChange('physicalExam', value),
    onPhysicalExamInsertText: handlePhysicalExamInsertText,
    assessmentValue: draft.assessment,
    onAssessmentChange: (value) => handleDraftChange('assessment', value),
    onAssessmentInsertText: handleAssessmentInsertText,
    planCards,
    onPlanCardChange: handlePlanCardChange,
    onPlanCardRemove: handlePlanCardRemove,
    onPlanCardInsert: handlePlanCardInsert,
    onPlanCardReorder: handlePlanCardReorder,
    onPlanUndo: handlePlanUndo,
    onPlanCardFocus: handlePlanCardFocus,
    onPlanInsertText: handlePlanInsertText,
    primaryDiagnosisCardId,
    onPrimaryDiagnosisSelect: handlePlanPrimaryDiagnosisSelect,
    referenceSplitOpen,
    onReferenceSplitToggle: handleReferenceSplitToggle,
    referenceDocument: referenceDocumentSnapshot,
    referenceLabModules,
    referenceLabLoading,
    referenceLabError,
    monshinSummary,
    onMonshinDiffRequest: handleMonshinDiffRequest,
    onMonshinHistoryRequest: handleMonshinHistoryRequest,
    isLockedByMe,
  };

  const lockErrorMessage = lock.error ? (lock.error instanceof Error ? lock.error.message : String(lock.error)) : null;

  const noteProps: WorkSurfaceNoteProps = {
    title: draft.title,
    onTitleChange: (value) => handleDraftChange('title', value),
    onSave: handleSave,
    saveDisabled: !isLockedByMe || lock.isPending,
    saveError,
    lockError: lockErrorMessage,
  };

  const careMapProps: CareMapProps = {
    patientId: selectedVisit ? selectedVisit.patientId : null,
    patientName: selectedVisit?.fullName,
    karteId: karteQuery.data?.id ?? null,
    documents: docInfos,
    mediaItems,
    mediaLoading: mediaItemsLoading,
    mediaError: attachmentsQuery.error ?? null,
  };

  const diagnosisProps: DiagnosisProps = {
    karteId,
    fromDate: timelineFromDate,
    userModelId: session?.userProfile?.userModelId ?? null,
    departmentCode: selectedVisit?.departmentCode ?? null,
    departmentName: selectedVisit?.departmentName ?? null,
    relatedInsurance: selectedInsurance?.guid ?? selectedInsurance?.id ?? null,
  };

  const observationProps: ObservationProps = {
    karteId,
    userModelId: session?.userProfile?.userModelId ?? null,
  };

  const orderSetPanelProps = {
    orderSets,
    onApply: handleApplyOrderSet,
    onCreate: createOrderSet,
    onUpdate: updateOrderSet,
    onDelete: deleteOrderSet,
    disabled: !isLockedByMe,
    lastAppliedId: lastAppliedOrderSetId,
    onImportShared: importSharedOrderSets,
    shareMetadata: {
      facilityName: session?.userProfile?.facilityName,
      author:
        session?.userProfile?.displayName ??
        session?.userProfile?.commonName ??
        session?.credentials.userId,
    },
  };

  const stampLibraryProps: StampLibraryPanelProps = {
    stamps: stampLibraryQuery.data ?? [],
    isLoading: canLoadStampLibrary ? stampLibraryQuery.isLoading : false,
    isFetching: canLoadStampLibrary ? stampLibraryQuery.isFetching : false,
    error: canLoadStampLibrary ? stampLibraryQuery.error : null,
    onReload: () => {
      if (canLoadStampLibrary) {
        void stampLibraryQuery.refetch();
      }
    },
    onInsert: handleInsertStamp,
    disabled: !isLockedByMe || !canLoadStampLibrary,
  };

  const orcaOrderProps: OrcaOrderPanelProps = {
    disabled: !isLockedByMe,
    onCreateOrder: handleCreateOrderFromOrca,
  };

  const labResultsProps: LabResultsPanelProps = {
    patientId: selectedVisit ? selectedVisit.patientId : null,
    patientName: selectedVisit?.fullName,
  };

  const patientDocumentsProps: PatientDocumentsPanelProps = {
    patient:
      patientSummaryForDocuments
        ? {
            id: patientSummaryForDocuments.id,
            name: patientSummaryForDocuments.name,
            gender: patientSummaryForDocuments.gender,
            birthday: patientSummaryForDocuments.birthday,
          }
        : null,
    facilityName: session?.userProfile?.facilityName,
    doctorName: doctorDisplayName,
    disabled: !selectedVisit,
    preset: documentPreset,
  };

  const medicalCertificatesProps: MedicalCertificatesPanelProps = {
    patient: patientSummaryForDocuments,
    karteId,
    patientPk,
    session,
    facilityName: session?.userProfile?.facilityName,
    doctorName: doctorDisplayName,
    departmentName: selectedVisit?.departmentName ?? undefined,
    disabled: !selectedVisit,
    onSaved: () => {
      void karteQuery.refetch();
    },
  };

  const schemaEditorProps: SchemaEditorPanelProps = {
    patient: patientSummaryForDocuments,
    patientPk,
    karteId,
    session,
    facilityName: session?.userProfile?.facilityName,
    licenseName: session?.userProfile?.licenseName ?? null,
    departmentName: selectedVisit?.departmentName ?? null,
    departmentCode: selectedVisit?.departmentCode ?? null,
    disabled: !selectedVisit,
    onSaved: () => {
      void karteQuery.refetch();
    },
  };

  const claimAdjustmentProps: ClaimAdjustmentPanelProps = {
    karteId,
    docInfos,
    session,
    selectedVisit,
    selectedInsurance,
  };

  const baseDecisionSupportMessages = useMemo<DecisionSupportMessage[]>(() => {
    const safetyNotes = selectedVisit?.safetyNotes ?? [];
    return safetyNotes.map((note, index) => {
      const normalized = note.trim();
      const severity: DecisionSupportMessage['severity'] =
        /禁忌|アナフィラ|ショック|重症/.test(normalized) ? 'danger' :
        /注意|慎重|警告/.test(normalized) ? 'warning' :
        'info';
      const category: DecisionSupportMessage['category'] = /アレルギ/.test(normalized) ? 'allergy' : 'safety';
      return {
        id: `safety-${index}`,
        severity,
        category,
        headline: normalized,
      };
    });
  }, [selectedVisit?.safetyNotes]);

  const orderConsoleProps: OrderConsoleBaseProps = {
    orderSetProps: orderSetPanelProps,
    stampLibraryProps,
    orcaOrderProps,
    labResultsProps,
    patientDocumentsProps,
    medicalCertificatesProps,
    schemaEditorProps,
    planCards,
    orderModules: orderModuleSummaries,
    onPlanCardChange: handlePlanCardChange,
    onPlanCardRemove: handlePlanCardRemove,
    onPlanCardFocus: handlePlanCardFocus,
    orderEditingDisabled: !isLockedByMe,
    decisionSupportMessages: baseDecisionSupportMessages,
    billingProps: {
      billing,
      onModeChange: handleBillingModeChange,
      updateBilling,
      canSelectInsurance,
      insuranceOptions,
      selectedInsurance,
      claimSendEnabled,
      billingDisabled,
    },
    claimAdjustmentProps,
  };

  const hasSelectedVisit = Boolean(selectedVisit);
  const isRightRailCollapsed = forceCollapse || rightPaneCollapsed;

  return (
    <PageShell
      data-right-collapsed={isRightRailCollapsed}
      data-compact-header={hasSelectedVisit ? 'false' : 'true'}
      data-replay-gap={chartsReplayGap.lockEditing ? 'true' : 'false'}
      aria-busy={chartsReplayGap.ariaBusy}
    >
      <ReplayGapBanner {...chartsReplayGap.banner} placement="inline" />
      <PatientHeaderBar
        ref={chiefComplaintRef}
        patient={selectedVisit}
        chiefComplaint={chiefComplaint}
        onChiefComplaintChange={handleChiefComplaintChange}
        primaryDiagnosis={primaryDiagnosis}
        onPrimaryDiagnosisChange={handlePrimaryDiagnosisChange}
        onPrimaryDiagnosisCommit={handlePrimaryDiagnosisCommit}
        diagnosisTags={diagnosisTags}
        onAddDiagnosisTag={handleAddDiagnosisTag}
        onRemoveDiagnosisTag={handleRemoveDiagnosisTag}
        visitPurpose={visitPurpose}
        paymentCategory={paymentCategory}
        emergencyContact={emergencyContact}
        patientPhotoUrl={patientPhotoUrl}
        cautionFlags={selectedVisit?.safetyNotes ?? []}
        onToggleLock={isLockedByMe ? handleUnlock : handleLock}
        isLockedByMe={isLockedByMe}
        isLockedByOther={isLockedByOther}
        isLockPending={lock.isPending}
        onOpenSearch={() => setSearchOpen(true)}
        searchShortcutHint={GLOBAL_SEARCH_SHORTCUT}
        elapsedTimeLabel={elapsedTimeLabel}
        isTimerRunning={isTimerRunning}
        canEdit={hasSelectedVisit}
      />
      <ContentGrid $locked={chartsReplayGap.lockEditing} aria-busy={chartsReplayGap.ariaBusy}>
        <LeftContextColumn
          documentTimeline={documentTimelineProps}
          visitMemo={chiefComplaint}
          visitMemoStatus={chiefComplaintStatus}
          visitMemoError={chiefComplaintError}
          visitMemoDirty={chiefComplaintDirty}
          onVisitMemoChange={handleChiefComplaintChange}
          onVisitMemoSave={handleChiefComplaintCommit}
          onVisitMemoReset={handleChiefComplaintReset}
          visitMemoDisabled={!selectedVisit}
          contextItems={contextItems}
          pinnedContextIds={pinnedContextIds}
          onTogglePinContext={handleTogglePinnedContext}
          showHistory={contextHistoryOpen}
          onToggleHistory={handleToggleContextHistory}
          monshinSummary={monshinSummary}
          vitalSigns={vitalSigns}
          mediaItems={mediaItems}
          mediaLoading={mediaItemsLoading}
          mediaError={mediaItemsError}
          onSnippetDragStart={handleSnippetDragStart}
          onMediaOpen={handleMediaOpen}
          pastSummaries={pastSummaries}
          onPastSummaryOpen={handlePastSummaryOpen}
          problemList={problemListProps}
          safetySummarySections={safetySummarySections}
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
        {selectedVisit ? (
          <WorkSurfaceColumn
            editingDocument={editingDocument}
            onCancelEditing={handleCancelEditing}
            workSurface={workSurfaceProps}
            noteProps={noteProps}
            careMap={careMapProps}
            diagnosis={diagnosisProps}
            observation={observationProps}
            activeView={workspaceView}
            onViewChange={setWorkspaceView}
          />
        ) : (
          <CentralColumn>
            <CentralScroll>
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
            </CentralScroll>
          </CentralColumn>
        )}
        <OrderResultsColumn
          collapsed={rightPaneCollapsed}
          forceCollapse={forceCollapse}
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
          consoleProps={orderConsoleProps}
        />
      </ContentGrid>
      <StatusBar
        saveState={saveState}
        signatureState={signatureState}
        claimState={claimState}
        lastSavedAt={lastSavedAt}
        lastSignedAt={lastSignedAt}
        lastClaimSentAt={lastClaimSentAt}
        onSaveDraft={handleSaveDraft}
        onSignDocument={handleSignDocument}
        onSendClaim={handleSendClaim}
        onOpenShortcuts={handleOpenShortcuts}
        onCallNextPatient={handleCallNextPatient}
        isLockedByMe={isLockedByMe}
        signatureDisabled={signatureDisabled}
        claimDisabled={claimDisabled}
        signatureDisabledReason={signatureDisabledReason}
        claimDisabledReason={claimDisabledReason}
        signatureError={signatureError}
        claimError={claimError}
      />
      <MiniSummaryDock
        summaryLines={miniSummaryLines}
        onExpand={handleMiniSummaryExpand}
        onSnippetDragStart={handleSnippetDragStart}
      />

      <ShortcutOverlay open={shortcutsOpen} onClose={handleCloseShortcuts} />

      <UnifiedSearchOverlay
        open={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        sections={SEARCH_SECTIONS}
        activeSection={searchSection}
        onSectionChange={setSearchSection}
        results={filteredSearchResults}
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
