import { Global } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getAuditEventLog, logAuditEvent, logUiState } from '../../../libs/audit/auditLogger';
import { resolveAriaLive, resolveRunId } from '../../../libs/observability/observability';
import { buildHttpHeaders, httpFetch } from '../../../libs/http/httpClient';
import type { DataSourceTransition } from '../../../libs/observability/types';
import { FocusTrapDialog } from '../../../components/modals/FocusTrapDialog';
import { OrderConsole } from '../components/OrderConsole';
import { ReceptionAuditPanel } from '../components/ReceptionAuditPanel';
import { ReceptionExceptionList, type ReceptionExceptionItem } from '../components/ReceptionExceptionList';
import { ToneBanner } from '../components/ToneBanner';
import {
  buildVisitEntryFromMutation,
  fetchAppointmentOutpatients,
  fetchClaimFlags,
  isClaimOutpatientEnabled,
  mutateVisit,
  resolveAcceptancePush,
  type AppointmentPayload,
  type ReceptionEntry,
  type ReceptionStatus,
  type VisitMutationParams,
  type VisitMutationPayload,
} from '../api';
import {
  fetchPatientMasterSearch,
  type PatientMasterRecord,
  type PatientMasterSearchResponse,
} from '../patientSearchApi';
import { receptionStyles } from '../styles';
import { applyAuthServicePatch, useAuthService, type AuthServiceFlags } from '../../charts/authService';
import { getChartToneDetails } from '../../../ux/charts/tones';
import type { ResolveMasterSource } from '../components/ResolveMasterBadge';
import { useAdminBroadcast } from '../../../libs/admin/useAdminBroadcast';
import { AdminBroadcastBanner } from '../../shared/AdminBroadcastBanner';
import { ApiFailureBanner } from '../../shared/ApiFailureBanner';
import { AuditSummaryInline } from '../../shared/AuditSummaryInline';
import { RunIdBadge } from '../../shared/RunIdBadge';
import { StatusPill } from '../../shared/StatusPill';
import { resolveCacheHitTone, resolveMetaFlagTone, resolveTransitionTone } from '../../shared/metaPillRules';
import { PatientMetaRow } from '../../shared/PatientMetaRow';
import {
  OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
  formatAutoRefreshTimestamp,
  resolveAutoRefreshIntervalMs,
  useAutoRefreshNotice,
} from '../../shared/autoRefreshNotice';
import { MISSING_MASTER_RECOVERY_NEXT_ACTION } from '../../shared/missingMasterRecovery';
import { buildChartsUrl, type ReceptionCarryoverParams } from '../../charts/encounterContext';
import { useSession } from '../../../AppRouter';
import { buildFacilityPath } from '../../../routes/facilityRoutes';
import type { ClaimBundle, ClaimQueueEntry, ClaimQueuePhase } from '../../outpatient/types';
import { getAppointmentDataBanner } from '../../outpatient/appointmentDataBanner';
import type { OrcaQueueEntry } from '../../outpatient/orcaQueueApi';
import { fetchOrcaQueue, retryOrcaQueue } from '../../outpatient/orcaQueueApi';
import { ORCA_QUEUE_STALL_THRESHOLD_MS, resolveOrcaSendStatus, toClaimQueueEntryFromOrcaQueueEntry } from '../../outpatient/orcaQueueStatus';
import {
  buildExceptionAuditDetails,
  buildQueuePhaseSummary,
  resolveExceptionDecision,
} from '../exceptionLogic';
import { loadOrcaClaimSendCache } from '../../charts/orcaClaimSendCache';
import { postMedicalRecords, type MedicalRecordEntry } from '../../administration/orcaInternalWrapperApi';
import { fetchPatients, type PatientListResponse, type PatientRecord } from '../../patients/api';
import {
  loadOutpatientSavedViews,
  removeOutpatientSavedView,
  resolvePaymentMode,
  type OutpatientSavedView,
  type PaymentMode,
  upsertOutpatientSavedView,
} from '../../outpatient/savedViews';
import { useAppToast } from '../../../libs/ui/appToast';

type SortKey = 'time' | 'name' | 'department';

const SECTION_ORDER: ReceptionStatus[] = ['受付中', '診療中', '会計待ち', '会計済み', '予約'];
const SECTION_LABEL: Record<ReceptionStatus, string> = {
  受付中: '受付中',
  診療中: '診療中',
  会計待ち: '会計待ち',
  会計済み: '会計済み',
  予約: '予約',
};

const COLLAPSE_STORAGE_KEY = 'reception-section-collapses';
const FILTER_STORAGE_KEY = 'reception-filter-state';
const FILTER_PANEL_COLLAPSE_KEY = 'reception-filter-panel-collapsed';
const ACCEPT_DETAILS_COLLAPSE_KEY = 'reception-accept-details-collapsed';
const ORCA_QUEUE_REFRESH_INTERVAL_MS = 60_000;
const ORCA_QUEUE_QUERY_KEY = ['orca-queue'] as const;

const todayString = () => new Date().toISOString().slice(0, 10);

const receptionStatusMvpPhase = (() => {
  const raw = import.meta.env.VITE_RECEPTION_STATUS_MVP ?? '';
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
})();
const isReceptionStatusMvpEnabled = receptionStatusMvpPhase >= 1;
const isReceptionStatusMvpPhase2 = receptionStatusMvpPhase >= 2;

  const isSortKey = (value?: string | null): value is SortKey => value === 'time' || value === 'name' || value === 'department';

const entryKey = (entry: ReceptionEntry) =>
  entry.receptionId ?? entry.appointmentId ?? entry.patientId ?? entry.id;

const queuePhaseLabel: Record<ClaimQueuePhase, string> = {
  pending: '待ち',
  retry: '再送待ち',
  hold: '保留',
  failed: '失敗',
  sent: '送信済',
  ack: '応答済',
};

const queuePhaseTone: Record<ClaimQueuePhase, 'info' | 'warning' | 'error' | 'success'> = {
  pending: 'warning',
  retry: 'warning',
  hold: 'warning',
  failed: 'error',
  sent: 'info',
  ack: 'success',
};

const resolveQueueStatus = (entry?: ClaimQueueEntry) => {
  if (!entry) return { label: '未取得', tone: 'warning' as const, detail: undefined };
  const label = queuePhaseLabel[entry.phase];
  const tone = queuePhaseTone[entry.phase];
  const detail =
    entry.retryCount !== undefined ? `再送${entry.retryCount}回` : entry.holdReason ?? entry.errorMessage ?? undefined;
  return { label, tone, detail };
};

const resolveOrcaQueueStatus = (entry?: OrcaQueueEntry) => {
  if (!entry) return { label: '未取得', tone: 'warning' as const, detail: undefined };
  const sendStatus = resolveOrcaSendStatus(entry);
  const phase = toClaimQueueEntryFromOrcaQueueEntry(entry).phase;
  const detailParts = [
    sendStatus?.isStalled ? '滞留' : undefined,
    sendStatus?.error ? `エラー: ${sendStatus.error}` : undefined,
  ].filter((value): value is string => Boolean(value));
  return {
    // ORCA queue の status は retry/sent/ack などを含むため、Reception 側は phase ベースのラベルで表示する。
    // (例) retry -> 再送待ち。UI と E2E で「次に何をすべきか」が分かる表現を優先する。
    label: queuePhaseLabel[phase],
    tone: queuePhaseTone[phase],
    detail: detailParts.length > 0 ? detailParts.join(' / ') : undefined,
  };
};

const paymentModeLabel = (insurance?: string | null) => {
  const mode = resolvePaymentMode(insurance ?? undefined);
  if (mode === 'insurance') return '保険';
  if (mode === 'self') return '自費';
  return '不明';
};

const truncateText = (value: string, maxLength = 60) => {
  if (value.length <= maxLength) return value;
  const limit = Math.max(0, maxLength - 3);
  return `${value.slice(0, limit)}...`;
};

type Rec001MvpDecision = {
  label: string;
  tone: 'info' | 'warning' | 'error' | 'success';
  detail?: string;
  nextAction: string;
  canRetry: boolean;
  retryTitle?: string;
};

const resolveRec001MvpDecision = (options: {
  missingMaster: boolean;
  orcaQueueErrorMessage?: string;
  orcaQueueStatus: ReturnType<typeof resolveOrcaQueueStatus>;
  orcaQueueEntry?: OrcaQueueEntry;
}): Rec001MvpDecision => {
  if (options.missingMaster) {
    return {
      label: 'マスタ欠損',
      tone: 'warning',
      detail: 'missingMaster=true',
      nextAction: '復旧ガイド確認',
      canRetry: false,
    };
  }
  if (options.orcaQueueErrorMessage) {
    const msg = options.orcaQueueErrorMessage.toLowerCase();
    const kind =
      msg.includes('401') || msg.includes('unauthorized')
        ? '認証'
        : msg.includes('403')
          ? '権限'
          : msg.includes('502') || msg.includes('503')
            ? '上流'
            : '取得失敗';
    return {
      label: `ORCA queue ${kind}`,
      tone: 'error',
      detail: options.orcaQueueStatus.detail,
      nextAction: '接続/設定を確認して再取得',
      canRetry: false,
    };
  }
  if (options.orcaQueueEntry?.status === 'failed') {
    const retryable = options.orcaQueueEntry.retryable !== false;
    return {
      label: options.orcaQueueStatus.label,
      tone: 'error',
      detail: options.orcaQueueStatus.detail,
      nextAction: retryable ? '再送' : '原因確認',
      canRetry: retryable,
      retryTitle: retryable ? 'ORCA再送を要求します（/api/orca/queue?retry=1）' : 'retryable=false のため再送できません',
    };
  }
  if (options.orcaQueueEntry?.status === 'pending') {
    const stalled = Boolean(resolveOrcaSendStatus(options.orcaQueueEntry)?.isStalled);
    const retryable = stalled && options.orcaQueueEntry.retryable !== false;
    return {
      label: options.orcaQueueStatus.label,
      tone: 'warning',
      detail: options.orcaQueueStatus.detail,
      nextAction: retryable ? '再送' : '待機/滞留確認',
      canRetry: retryable,
      retryTitle: retryable ? '滞留のため ORCA再送を要求します（/api/orca/queue?retry=1）' : undefined,
    };
  }
  if (options.orcaQueueEntry?.status === 'delivered') {
    return {
      label: options.orcaQueueStatus.label,
      tone: 'success',
      detail: options.orcaQueueStatus.detail,
      nextAction: '—',
      canRetry: false,
    };
  }
  return {
    label: options.orcaQueueStatus.label,
    tone: options.orcaQueueStatus.tone,
    detail: options.orcaQueueStatus.detail,
    nextAction: options.orcaQueueStatus.tone === 'error' ? '原因確認' : '—',
    canRetry: false,
  };
};


const toDateLabel = (value?: string) => {
  if (!value) return '-';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  if (value.includes('T')) return value.split('T')[0] ?? value;
  return value;
};

const toBundleTimeMs = (value?: string): number => {
  if (!value) return -1;
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return parsed;
  if (/^\d{8}$/.test(value)) {
    const normalized = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    const date = Date.parse(normalized);
    return Number.isNaN(date) ? -1 : date;
  }
  return -1;
};

const baseCollapseState: Record<ReceptionStatus, boolean> = {
  受付中: false,
  診療中: false,
  会計待ち: false,
  会計済み: true,
  予約: false,
};

const loadCollapseState = (): Record<ReceptionStatus, boolean> => {
  if (typeof localStorage === 'undefined') return { ...baseCollapseState };
  try {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored) {
      return { ...baseCollapseState, ...(JSON.parse(stored) as Record<ReceptionStatus, boolean>) };
    }
  } catch {
    // ignore broken localStorage value
  }
  return { ...baseCollapseState };
};

const persistCollapseState = (state: Record<ReceptionStatus, boolean>) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

const loadCollapsedPanel = (key: string, fallback: boolean) => {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return stored === '1' || stored === 'true';
  } catch {
    return fallback;
  }
};

const persistCollapsedPanel = (key: string, value: boolean) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // ignore
  }
};

const toMasterSource = (transition?: DataSourceTransition): ResolveMasterSource => {
  if (!transition) return 'snapshot';
  if (transition === 'fallback') return 'fallback';
  if (transition === 'server') return 'server';
  if (transition === 'mock') return 'mock';
  return 'snapshot';
};

const normalizePaymentMode = (value?: string | null): PaymentMode =>
  value === 'insurance' || value === 'self' ? value : 'all';

const filterEntries = (
  entries: ReceptionEntry[],
  keyword: string,
  department: string,
  physician: string,
  paymentMode: PaymentMode,
): ReceptionEntry[] => {
  const kw = keyword.trim().toLowerCase();
  return entries.filter((entry) => {
    const matchesKeyword =
      kw.length === 0 ||
      [entry.name, entry.kana, entry.patientId, entry.appointmentId].some((value) =>
        value?.toLowerCase().includes(kw),
      );
    const matchesDept = department ? entry.department === department : true;
    const matchesPhysician = physician ? entry.physician === physician : true;
    const resolvedPayment = resolvePaymentMode(entry.insurance);
    const matchesPayment =
      paymentMode === 'all' ? true : resolvedPayment ? resolvedPayment === paymentMode : false;
    return matchesKeyword && matchesDept && matchesPhysician && matchesPayment;
  });
};

const sortEntries = (entries: ReceptionEntry[], sortKey: SortKey) => {
  const toMinutes = (time?: string) => {
    if (!time) return Number.MAX_SAFE_INTEGER;
    const [h, m] = time.split(':').map((v) => Number(v));
    if (Number.isNaN(h) || Number.isNaN(m)) return Number.MAX_SAFE_INTEGER;
    return h * 60 + m;
  };

  return [...entries].sort((a, b) => {
    if (sortKey === 'time') {
      return toMinutes(a.appointmentTime) - toMinutes(b.appointmentTime);
    }
    if (sortKey === 'department') {
      return (a.department ?? '').localeCompare(b.department ?? '', 'ja');
    }
    return (a.name ?? '').localeCompare(b.name ?? '', 'ja');
  });
};

const groupByStatus = (entries: ReceptionEntry[]) =>
  SECTION_ORDER.map((status) => ({
    status,
    items: entries.filter((entry) => entry.status === status),
  }));

type ReceptionPageProps = {
  runId?: string;
  patientId?: string;
  receptionId?: string;
  destination?: string;
  title?: string;
  description?: string;
};

export function ReceptionPage({
  runId: initialRunId,
  patientId,
  receptionId,
  destination = 'ORCA queue',
  title = 'Reception 受付一覧と更新状況',
  description = '受付一覧の状態と更新時刻をひと目で確認し、例外対応とカルテ起動の優先度を判断します。選択した患者は右ペインで詳細を確認できます。',
}: ReceptionPageProps) {
  const session = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueue } = useAppToast();
  const { broadcast } = useAdminBroadcast({ facilityId: session.facilityId, userId: session.userId });
  const { flags, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed, bumpRunId } = useAuthService();
  const claimOutpatientEnabled = isClaimOutpatientEnabled();
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') ?? todayString());
  const [keyword, setKeyword] = useState(() => searchParams.get('kw') ?? '');
  const [submittedKeyword, setSubmittedKeyword] = useState(() => searchParams.get('kw') ?? '');
  const [departmentFilter, setDepartmentFilter] = useState(() => searchParams.get('dept') ?? '');
  const [physicianFilter, setPhysicianFilter] = useState(() => searchParams.get('phys') ?? '');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(() => normalizePaymentMode(searchParams.get('pay')));
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const fromUrl = searchParams.get('sort');
    return isSortKey(fromUrl) ? fromUrl : 'time';
  });
  const [collapsed, setCollapsed] = useState<Record<ReceptionStatus, boolean>>(loadCollapseState);
  const [filtersCollapsed, setFiltersCollapsed] = useState(() =>
    loadCollapsedPanel(FILTER_PANEL_COLLAPSE_KEY, true),
  );
  const [acceptDetailsCollapsed, setAcceptDetailsCollapsed] = useState(() =>
    loadCollapsedPanel(ACCEPT_DETAILS_COLLAPSE_KEY, true),
  );
  const [exceptionsModalOpen, setExceptionsModalOpen] = useState(false);
  const [recordsModalPatient, setRecordsModalPatient] = useState<{ patientId: string; name?: string } | null>(null);
  const [missingMasterNote, setMissingMasterNote] = useState('');
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const appliedMeta = useRef<Partial<AuthServiceFlags>>({});
  const lastAuditEventHash = useRef<string | undefined>(undefined);
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  const [selectionNotice, setSelectionNotice] = useState<{ tone: 'info' | 'warning'; message: string } | null>(null);
  const [selectionLost, setSelectionLost] = useState(false);
  const lastSidepaneAuditKey = useRef<string | null>(null);
  const lastExceptionAuditKey = useRef<string | null>(null);
  const lastAppointmentUpdatedAt = useRef<number | null>(null);
  const [savedViews, setSavedViews] = useState<OutpatientSavedView[]>(() => loadOutpatientSavedViews());
  const [savedViewName, setSavedViewName] = useState('');
  const [selectedViewId, setSelectedViewId] = useState<string>('');
  const lastUnlinkedToastKey = useRef<string | null>(null);
  const [acceptPatientId, setAcceptPatientId] = useState(() => patientId ?? '');
  const [acceptPaymentMode, setAcceptPaymentMode] = useState<'insurance' | 'self' | ''>('');
  const [acceptVisitKind, setAcceptVisitKind] = useState('');
  const [acceptNote, setAcceptNote] = useState('');
  const [acceptDurationMs, setAcceptDurationMs] = useState<number | null>(null);
  const [masterSearchFilters, setMasterSearchFilters] = useState({
    name: '',
    kana: '',
    birthStartDate: '',
    birthEndDate: '',
    sex: '',
    inOut: '2',
  });
  const [masterSearchResults, setMasterSearchResults] = useState<PatientMasterRecord[]>([]);
  const [masterSearchMeta, setMasterSearchMeta] = useState<PatientMasterSearchResponse | null>(null);
  const [masterSearchNotice, setMasterSearchNotice] = useState<{ tone: 'info' | 'warning' | 'error'; message: string; detail?: string } | null>(
    null,
  );
  const [masterSearchError, setMasterSearchError] = useState<string | null>(null);
  const [masterSelected, setMasterSelected] = useState<PatientMasterRecord | null>(null);

  const [patientSearchNameSei, setPatientSearchNameSei] = useState('');
  const [patientSearchNameMei, setPatientSearchNameMei] = useState('');
  const [patientSearchKanaSei, setPatientSearchKanaSei] = useState('');
  const [patientSearchKanaMei, setPatientSearchKanaMei] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<PatientRecord[]>([]);
  const [patientSearchMeta, setPatientSearchMeta] = useState<PatientListResponse | null>(null);
  const [patientSearchError, setPatientSearchError] = useState<string | null>(null);
  const [patientSearchSelected, setPatientSearchSelected] = useState<PatientRecord | null>(null);
  const patientSearchFilterRef = useRef<{
    patientId: string;
    nameSei: string;
    nameMei: string;
    kanaSei: string;
    kanaMei: string;
  } | null>(null);

  const lastAcceptAutoFill = useRef<{
    patientId?: string;
    paymentMode?: 'insurance' | 'self' | '';
  }>({});
  const lastAcceptAutoFillSignature = useRef<string | null>(null);
  const [acceptErrors, setAcceptErrors] = useState<{
    patientId?: string;
    paymentMode?: string;
    visitKind?: string;
    department?: string;
    physician?: string;
  }>({});
  const [acceptDepartmentSelection, setAcceptDepartmentSelection] = useState('');
  const [acceptPhysicianSelection, setAcceptPhysicianSelection] = useState('');
  const [acceptResult, setAcceptResult] = useState<{
    tone: 'success' | 'warning' | 'error' | 'info';
    message: string;
    detail?: string;
    runId?: string;
    apiResult?: string;
  } | null>(null);
  const [deptInfoOptions, setDeptInfoOptions] = useState<Array<[string, string]>>([]);
  const [xhrDebugState, setXhrDebugState] = useState<{
    lastAttemptAt?: string;
    status?: number | null;
    error?: string | null;
  }>({});
  const [retryingPatientId, setRetryingPatientId] = useState<string | null>(null);

  const debugUiEnabled =
    (import.meta.env.DEV && searchParams.get('debug') === '1') || session.role === 'system_admin';

  const resolvePatientIdFromRaw = useCallback(
    (name?: string, kana?: string): string | undefined => {
      const raw = masterSearchMeta?.raw;
      if (!raw) return undefined;
      const stack: Array<{ node: unknown; depth: number }> = [{ node: raw, depth: 0 }];
      const visited = new Set<unknown>();
      while (stack.length) {
        const current = stack.pop();
        if (!current) continue;
        const { node, depth } = current;
        if (visited.has(node) || depth > 6) continue;
        visited.add(node);
        if (Array.isArray(node)) {
          for (const entry of node) {
            if (entry && typeof entry === 'object') stack.push({ node: entry, depth: depth + 1 });
          }
          continue;
        }
        if (node && typeof node === 'object') {
          const record = node as Record<string, unknown>;
          const candidateId =
            (record.patientId as string | undefined) ??
            (record.Patient_ID as string | undefined) ??
            (record.PatientId as string | undefined) ??
            (record.PatientID as string | undefined) ??
            (record.Patient_No as string | undefined) ??
            (record.Patient_Number as string | undefined) ??
            (record.patientNo as string | undefined) ??
            (record.patientNumber as string | undefined);
          const candidateName =
            (record.wholeName as string | undefined) ??
            (record.WholeName as string | undefined) ??
            (record.Patient_Name as string | undefined) ??
            (record.name as string | undefined);
          const candidateKana =
            (record.wholeNameKana as string | undefined) ??
            (record.WholeName_inKana as string | undefined) ??
            (record.Patient_Kana as string | undefined) ??
            (record.kana as string | undefined);
          if (candidateId) {
            const nameMatch = name ? candidateName === name : true;
            const kanaMatch = kana ? candidateKana === kana : true;
            if (nameMatch && kanaMatch) return candidateId;
          }
          for (const entry of Object.values(record)) {
            if (entry && typeof entry === 'object') stack.push({ node: entry, depth: depth + 1 });
          }
        }
      }
      return undefined;
    },
    [masterSearchMeta?.raw],
  );

  const resolvePatientIdFromSearchRaw = useCallback(
    (raw: Record<string, unknown> | undefined, name?: string, kana?: string): string | undefined => {
      if (!raw) return undefined;
      const stack: Array<{ node: unknown; depth: number }> = [{ node: raw, depth: 0 }];
      const visited = new Set<unknown>();
      while (stack.length) {
        const current = stack.pop();
        if (!current) continue;
        const { node, depth } = current;
        if (visited.has(node) || depth > 6) continue;
        visited.add(node);
        if (Array.isArray(node)) {
          for (const entry of node) {
            if (entry && typeof entry === 'object') stack.push({ node: entry, depth: depth + 1 });
          }
          continue;
        }
        if (node && typeof node === 'object') {
          const record = node as Record<string, unknown>;
          const candidateId =
            (record.patientId as string | undefined) ??
            (record.Patient_ID as string | undefined) ??
            (record.PatientId as string | undefined) ??
            (record.PatientID as string | undefined) ??
            (record.Patient_No as string | undefined) ??
            (record.Patient_Number as string | undefined) ??
            (record.patientNo as string | undefined) ??
            (record.patientNumber as string | undefined);
          const candidateName =
            (record.wholeName as string | undefined) ??
            (record.WholeName as string | undefined) ??
            (record.Patient_Name as string | undefined) ??
            (record.name as string | undefined);
          const candidateKana =
            (record.wholeNameKana as string | undefined) ??
            (record.WholeName_inKana as string | undefined) ??
            (record.Patient_Kana as string | undefined) ??
            (record.kana as string | undefined);
          if (candidateId) {
            const nameMatch = name ? candidateName === name : true;
            const kanaMatch = kana ? candidateKana === kana : true;
            if (nameMatch && kanaMatch) return candidateId;
          }
          for (const entry of Object.values(record)) {
            if (entry && typeof entry === 'object') stack.push({ node: entry, depth: depth + 1 });
          }
        }
      }
      return undefined;
    },
    [],
  );

  const claimQueryKey = ['outpatient-claim-flags'];
  const claimQuery = useQuery({
    queryKey: claimQueryKey,
    queryFn: (context) => fetchClaimFlags(context),
    enabled: claimOutpatientEnabled,
    refetchInterval: claimOutpatientEnabled ? OUTPATIENT_AUTO_REFRESH_INTERVAL_MS : false,
    staleTime: claimOutpatientEnabled ? OUTPATIENT_AUTO_REFRESH_INTERVAL_MS : Infinity,
    refetchOnWindowFocus: false,
    meta: {
      servedFromCache: !!queryClient.getQueryState(claimQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(claimQueryKey)?.fetchFailureCount ?? 0,
    },
  });
  const refetchClaim = claimQuery.refetch;

  const orcaQueueQuery = useQuery({
    queryKey: ORCA_QUEUE_QUERY_KEY,
    queryFn: () => fetchOrcaQueue(),
    refetchInterval: ORCA_QUEUE_REFRESH_INTERVAL_MS,
    staleTime: ORCA_QUEUE_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
    retry: 1,
    meta: {
      servedFromCache: !!queryClient.getQueryState(ORCA_QUEUE_QUERY_KEY)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(ORCA_QUEUE_QUERY_KEY)?.fetchFailureCount ?? 0,
    },
  });

  const appointmentQueryKey = ['outpatient-appointments', selectedDate, submittedKeyword, departmentFilter, physicianFilter];
  const appointmentQuery = useQuery({
    queryKey: appointmentQueryKey,
    queryFn: (context) =>
      fetchAppointmentOutpatients(
        {
          date: selectedDate,
          keyword: submittedKeyword,
          departmentCode: departmentFilter || undefined,
          physicianCode: physicianFilter || undefined,
        },
        context,
      ),
    refetchOnWindowFocus: false,
    refetchInterval: OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
    staleTime: OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
    meta: {
      servedFromCache: !!queryClient.getQueryState(appointmentQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(appointmentQueryKey)?.fetchFailureCount ?? 0,
    },
  });
  const refetchAppointment = appointmentQuery.refetch;

  const appointmentAutoRefreshNotice = useAutoRefreshNotice({
    subject: '受付一覧',
    dataUpdatedAt: appointmentQuery.dataUpdatedAt,
    isFetching: appointmentQuery.isFetching,
    isError: appointmentQuery.isError,
    intervalMs: OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
  });
  const appointmentUpdatedAtLabel = useMemo(() => {
    if (!appointmentQuery.dataUpdatedAt) return '—';
    return formatAutoRefreshTimestamp(appointmentQuery.dataUpdatedAt);
  }, [appointmentQuery.dataUpdatedAt]);
  const autoRefreshIntervalLabel = useMemo(() => {
    const resolved = resolveAutoRefreshIntervalMs(OUTPATIENT_AUTO_REFRESH_INTERVAL_MS);
    if (!Number.isFinite(resolved) || resolved <= 0) return '停止';
    return `${Math.round(resolved / 1000)}秒`;
  }, []);

  useEffect(() => {
    if (!broadcast?.updatedAt) return;
    if (claimOutpatientEnabled) {
      void refetchClaim();
    }
    void refetchAppointment();
  }, [broadcast?.updatedAt, claimOutpatientEnabled, refetchAppointment, refetchClaim]);

  const appointmentErrorContext = useMemo(() => {
    const httpStatus = appointmentQuery.data?.httpStatus;
    const hasHttpError = typeof httpStatus === 'number' && httpStatus >= 400;
    const error = appointmentQuery.isError ? appointmentQuery.error : hasHttpError ? `status ${httpStatus}` : undefined;
    if (!error && !hasHttpError) return null;
    return {
      error,
      httpStatus,
      apiResult: appointmentQuery.data?.apiResult,
      apiResultMessage: appointmentQuery.data?.apiResultMessage,
    };
  }, [
    appointmentQuery.data?.apiResult,
    appointmentQuery.data?.apiResultMessage,
    appointmentQuery.data?.httpStatus,
    appointmentQuery.error,
    appointmentQuery.isError,
  ]);

  useEffect(() => {
    persistCollapseState(collapsed);
  }, [collapsed]);

  useEffect(() => {
    persistCollapsedPanel(FILTER_PANEL_COLLAPSE_KEY, filtersCollapsed);
  }, [filtersCollapsed]);

  useEffect(() => {
    persistCollapsedPanel(ACCEPT_DETAILS_COLLAPSE_KEY, acceptDetailsCollapsed);
  }, [acceptDetailsCollapsed]);

  useEffect(() => {
    const stored = (() => {
      if (typeof localStorage === 'undefined') return null;
      try {
        const raw = localStorage.getItem(FILTER_STORAGE_KEY);
        return raw
          ? (JSON.parse(raw) as Partial<Record<'kw' | 'dept' | 'phys' | 'sort' | 'date' | 'pay', string>>)
          : null;
      } catch {
        return null;
      }
    })();
    const fromUrl = {
      kw: searchParams.get('kw') ?? undefined,
      dept: searchParams.get('dept') ?? undefined,
      phys: searchParams.get('phys') ?? undefined,
      pay: searchParams.get('pay') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      date: searchParams.get('date') ?? undefined,
    };
    const merged = { ...(stored ?? {}), ...Object.fromEntries(Object.entries(fromUrl).filter(([, v]) => v !== undefined)) };
    if (merged.kw !== undefined) {
      setKeyword(merged.kw);
      setSubmittedKeyword(merged.kw);
    }
    if (merged.dept !== undefined) setDepartmentFilter(merged.dept);
    if (merged.phys !== undefined) setPhysicianFilter(merged.phys);
    if (merged.pay !== undefined) setPaymentMode(normalizePaymentMode(merged.pay));
    if (merged.sort !== undefined && isSortKey(merged.sort)) setSortKey(merged.sort);
    if (merged.date !== undefined) setSelectedDate(merged.date);
  }, [searchParams]);

  const visitMutation = useMutation<VisitMutationPayload, Error, VisitMutationParams>({
    mutationFn: (params) => mutateVisit(params),
  });
  const patientSearchMutation = useMutation<PatientListResponse, Error, { keyword: string }>({
    mutationFn: (params) => fetchPatients({ keyword: params.keyword }),
    onSuccess: (result) => {
      const normalizeToken = (value: string) => value.replace(/\s+/g, '').trim();
      const filters = patientSearchFilterRef.current;
      const basePatients = result.patients ?? [];
      const filteredPatients =
        filters
          ? basePatients.filter((patient) => {
              const patientId = (patient.patientId ?? '').trim();
              const fullName = normalizeToken(patient.name ?? '');
              const fullKana = normalizeToken(patient.kana ?? '');
              const needlePatientId = filters.patientId.trim();
              const needleNameSei = normalizeToken(filters.nameSei);
              const needleNameMei = normalizeToken(filters.nameMei);
              const needleKanaSei = normalizeToken(filters.kanaSei);
              const needleKanaMei = normalizeToken(filters.kanaMei);

              if (needlePatientId && !patientId.startsWith(needlePatientId)) return false;
              if (needleNameSei && !fullName.includes(needleNameSei)) return false;
              if (needleNameMei && !fullName.includes(needleNameMei)) return false;
              if (needleKanaSei && !fullKana.includes(needleKanaSei)) return false;
              if (needleKanaMei && !fullKana.includes(needleKanaMei)) return false;
              return true;
            })
          : basePatients;

      setPatientSearchResults(filteredPatients);
      setPatientSearchMeta({
        ...result,
        recordsReturned: filteredPatients.length,
      });
      setPatientSearchError(null);
    },
    onError: (error) => {
      const detail = error instanceof Error ? error.message : String(error);
      setPatientSearchError(detail);
    },
  });
  const masterSearchMutation = useMutation<PatientMasterSearchResponse, Error, Parameters<typeof fetchPatientMasterSearch>[0]>({
    mutationFn: (params) => fetchPatientMasterSearch(params),
    onSuccess: (result) => {
      const apiResult = result.apiResult ?? result.raw?.Api_Result ?? result.raw?.apiResult;
      const normalizedPatients = result.patients.map((patient) => {
        if (patient.patientId) return patient;
        const recoveredId = resolvePatientIdFromSearchRaw(result.raw, patient.name, patient.kana);
        return recoveredId ? { ...patient, patientId: recoveredId } : patient;
      });
      const isInOutMissing = apiResult === '91';
      setMasterSearchResults(normalizedPatients);
      setMasterSearchMeta(result);
      setMasterSearchNotice({
        tone: result.ok && !isInOutMissing ? 'info' : 'warning',
        message: isInOutMissing
          ? '処理区分が未設定のため患者マスタ検索ができませんでした。区分（入院/外来）を選択して再検索してください。'
          : result.ok
            ? '患者マスタ検索が完了しました。'
            : '患者マスタ検索で警告が返却されました。',
        detail: result.apiResultMessage ?? result.error,
      });
      setMasterSelected(null);
      setMasterSearchError(isInOutMissing ? '区分（入院/外来）を選択して再検索してください。' : null);
    },
    onError: (error) => {
      const detail = error instanceof Error ? error.message : String(error);
      setMasterSearchNotice({ tone: 'error', message: '患者マスタ検索に失敗しました。', detail });
    },
  });

  const applyMutationResultToList = useCallback(
    (payload: VisitMutationPayload, params: VisitMutationParams) => {
      queryClient.setQueryData<AppointmentPayload>(appointmentQueryKey, (previous) => {
        const base: AppointmentPayload =
          previous ??
          ({
            entries: [],
            raw: {},
            recordsReturned: 0,
            runId: payload.runId,
            cacheHit: payload.cacheHit,
            missingMaster: payload.missingMaster,
            dataSourceTransition: payload.dataSourceTransition ?? 'snapshot',
            fetchedAt: new Date().toISOString(),
          } as AppointmentPayload);
        const baseEntries = base.entries ?? [];
        if (params.requestNumber === '02') {
          const filtered = baseEntries.filter((entry) => {
            if (payload.acceptanceId && entry.receptionId === payload.acceptanceId) return false;
            const targetPatient = payload.patient?.patientId ?? params.patientId;
            if (targetPatient && entry.patientId === targetPatient) return false;
            return true;
          });
          return {
            ...base,
            entries: filtered,
            recordsReturned: filtered.length,
            apiResult: payload.apiResult ?? base.apiResult,
            apiResultMessage: payload.apiResultMessage ?? base.apiResultMessage,
          };
        }
        const nextEntry = buildVisitEntryFromMutation(payload, { paymentMode: params.paymentMode });
        if (!nextEntry) return base;
        const deduped = baseEntries.filter((entry) => {
          if (entry.receptionId && nextEntry.receptionId && entry.receptionId === nextEntry.receptionId) return false;
          if (entry.id && nextEntry.id && entry.id === nextEntry.id) return false;
          return true;
        });
        const nextEntries = [nextEntry, ...deduped];
        return {
          ...base,
          entries: nextEntries,
          recordsReturned: nextEntries.length,
          apiResult: payload.apiResult ?? base.apiResult,
          apiResultMessage: payload.apiResultMessage ?? base.apiResultMessage,
        };
      });
      const createdEntry = buildVisitEntryFromMutation(payload, { paymentMode: params.paymentMode });
      if (createdEntry?.id) {
        setSelectedEntryKey(entryKey(createdEntry));
      }
    },
    [appointmentQueryKey, queryClient],
  );

  const intent = searchParams.get('intent') as 'appointment_change' | 'appointment_cancel' | null;
  const intentKeyword = searchParams.get('kw') ?? '';
  const intentParam = intent ?? '';
  const intentBanner = useMemo(() => {
    if (!intent) return null;
    if (intent === 'appointment_cancel') {
      return {
        tone: 'warning' as const,
        message: 'Charts から「予約キャンセル」導線で開きました。対象患者/予約を確認してから操作してください。',
        nextAction: '予約キャンセル確認',
      };
    }
    return {
      tone: 'info' as const,
      message: 'Charts から「予約変更」導線で開きました。対象患者/予約を確認してから操作してください。',
      nextAction: '予約変更',
    };
  }, [intent]);

  useEffect(() => {
    // Preserve external flags (?msw=1 / ?debug=1 / section=...) while keeping filter params canonical.
    const params = new URLSearchParams(searchParams);
    const setOrDelete = (key: string, value?: string) => {
      if (value && value.trim()) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };
    setOrDelete('kw', keyword);
    setOrDelete('dept', departmentFilter);
    setOrDelete('phys', physicianFilter);
    if (paymentMode !== 'all') {
      params.set('pay', paymentMode);
    } else {
      params.delete('pay');
    }
    setOrDelete('sort', sortKey);
    setOrDelete('date', selectedDate);
    setOrDelete('intent', intentParam);
    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      setSearchParams(params, { replace: true });
    }
    if (typeof localStorage !== 'undefined') {
      const snapshot = {
        kw: keyword,
        dept: departmentFilter,
        phys: physicianFilter,
        pay: paymentMode,
        sort: sortKey,
        date: selectedDate,
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(snapshot));
    }
  }, [departmentFilter, intentParam, keyword, physicianFilter, paymentMode, searchParams, selectedDate, setSearchParams, sortKey]);

  const mergedMeta = useMemo(() => {
    const claim = claimOutpatientEnabled ? claimQuery.data : undefined;
    const appointment = appointmentQuery.data;
    const run = claim?.runId ?? appointment?.runId ?? initialRunId ?? flags.runId;
    const missing = claim?.missingMaster ?? appointment?.missingMaster ?? flags.missingMaster;
    const cache = claim?.cacheHit ?? appointment?.cacheHit ?? flags.cacheHit;
    const transition = claim?.dataSourceTransition ?? appointment?.dataSourceTransition ?? flags.dataSourceTransition;
    const fallbackUsed = claim?.fallbackUsed ?? appointment?.fallbackUsed ?? flags.fallbackUsed;
    return {
      runId: run,
      missingMaster: missing,
      cacheHit: cache,
      dataSourceTransition: transition,
      fallbackUsed,
      fetchedAt: appointment?.fetchedAt ?? claim?.fetchedAt,
    };
  }, [
    appointmentQuery.data,
    claimOutpatientEnabled,
    claimQuery.data,
    flags.cacheHit,
    flags.dataSourceTransition,
    flags.fallbackUsed,
    flags.missingMaster,
    flags.runId,
    initialRunId,
  ]);
  const resolvedRunId = resolveRunId(mergedMeta.runId ?? initialRunId ?? flags.runId);
  const infoLive = resolveAriaLive('info');
  const metaDataSourceTransition = mergedMeta.dataSourceTransition ?? 'snapshot';
  const metaMissingMaster = mergedMeta.missingMaster ?? true;
  const metaCacheHit = mergedMeta.cacheHit ?? false;

  useEffect(() => {
    const { runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed } = mergedMeta;
    appliedMeta.current = applyAuthServicePatch(
      { runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed },
      appliedMeta.current,
      { bumpRunId, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed },
    );
  }, [bumpRunId, mergedMeta, setCacheHit, setDataSourceTransition, setFallbackUsed, setMissingMaster]);

  useEffect(() => {
    if (!claimOutpatientEnabled) return;
    const apiAudit = claimQuery.data?.auditEvent as Record<string, unknown> | undefined;
    const serialized = apiAudit ? JSON.stringify(apiAudit) : undefined;
    if (serialized && serialized !== lastAuditEventHash.current) {
      lastAuditEventHash.current = serialized;
      const noteFromApi = typeof (apiAudit as Record<string, unknown>)?.missingMasterNote === 'string'
        ? String((apiAudit as Record<string, unknown>).missingMasterNote)
        : typeof (apiAudit as Record<string, unknown>)?.note === 'string'
          ? String((apiAudit as Record<string, unknown>).note)
          : undefined;
      if (noteFromApi) {
        setMissingMasterNote(noteFromApi);
      }
      logAuditEvent({
        runId: mergedMeta.runId,
        source: 'claim-flags',
        cacheHit: mergedMeta.cacheHit,
        missingMaster: mergedMeta.missingMaster,
        dataSourceTransition: mergedMeta.dataSourceTransition,
        payload: apiAudit,
      });
    }
  }, [
    claimOutpatientEnabled,
    claimQuery.data?.auditEvent,
    mergedMeta.cacheHit,
    mergedMeta.dataSourceTransition,
    mergedMeta.missingMaster,
    mergedMeta.runId,
  ]);

  const appointmentEntries = appointmentQuery.data?.entries ?? [];
  const departmentCodeMap = useMemo(() => {
    const raw = appointmentQuery.data?.raw as Record<string, unknown> | undefined;
    const map = new Map<string, string>();
    if (!raw) return map;
    const collect = (items?: unknown) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const name =
          (record.departmentName as string | undefined) ??
          (record.Department_WholeName as string | undefined) ??
          (record.department_name as string | undefined);
        const code =
          (record.departmentCode as string | undefined) ??
          (record.Department_Code as string | undefined) ??
          (record.department_code as string | undefined);
        if (name && code) map.set(name, code);
      });
    };
    const rawRecord = raw as Record<string, unknown>;
    collect(rawRecord.slots);
    collect(rawRecord.reservations);
    collect(rawRecord.visits);
    return map;
  }, [appointmentQuery.data?.raw]);
  useEffect(() => {
    let active = true;
    const parseDeptInfo = (text: string): Array<[string, string]> => {
      const tokens = text
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);
      const byCode = new Map<string, string>();
      let pendingCode: string | null = null;
      for (const token of tokens) {
        if (/^\d{1,3}$/.test(token)) {
          pendingCode = token;
          continue;
        }
        if (pendingCode) {
          if (!byCode.has(pendingCode)) {
            byCode.set(pendingCode, token);
          }
          pendingCode = null;
          continue;
        }
        const leadingMatch = token.match(/^(\d{1,3})\s*(.*)$/);
        if (leadingMatch) {
          const code = leadingMatch[1];
          const rawName = leadingMatch[2]?.trim();
          const name = rawName && rawName !== code ? rawName : '';
          if (!byCode.has(code)) {
            byCode.set(code, name || code);
          }
        }
      }
      return Array.from(byCode.entries());
    };
    const fetchDeptInfo = async () => {
      try {
        const response = await httpFetch('/orca/deptinfo');
        if (response.status === 404) return;
        if (!response.ok) return;
        const text = await response.text();
        const parsed = parseDeptInfo(text);
        if (active && parsed.length > 0) {
          setDeptInfoOptions(parsed);
        }
      } catch {
        // ignore
      }
    };
    void fetchDeptInfo();
    return () => {
      active = false;
    };
  }, []);
  const uniqueDepartments = useMemo(
    () => Array.from(new Set(appointmentEntries.map((entry) => entry.department).filter(Boolean))) as string[],
    [appointmentEntries],
  );
  const uniquePhysicians = useMemo(
    () => Array.from(new Set(appointmentEntries.map((entry) => entry.physician).filter(Boolean))) as string[],
    [appointmentEntries],
  );
  const departmentOptions = useMemo(() => {
    const byCode = new Map<string, string>();
    deptInfoOptions.forEach(([code, name]) => {
      if (!code) return;
      if (!byCode.has(code)) {
        const trimmedName = (name ?? '').trim();
        byCode.set(code, trimmedName && trimmedName !== code ? trimmedName : code);
      }
    });
    departmentCodeMap.forEach((code, name) => {
      if (code && !byCode.has(code)) {
        const trimmedName = (name ?? '').trim();
        byCode.set(code, trimmedName && trimmedName !== code ? trimmedName : code);
      }
    });
    uniqueDepartments.forEach((dept) => {
      if (!dept) return;
      const trimmed = dept.trim();
      if (!trimmed) return;
      const leadingMatch = trimmed.match(/^(\d{1,3})\s*(.*)$/);
      if (leadingMatch) {
        const code = leadingMatch[1];
        const rawName = leadingMatch[2]?.trim();
        const name = rawName && rawName !== code ? rawName : code;
        if (!byCode.has(code)) byCode.set(code, name);
        return;
      }
      if (/^\d+$/.test(trimmed) && !byCode.has(trimmed)) {
        byCode.set(trimmed, trimmed);
      }
    });
    if (byCode.size === 0) {
      byCode.set('01', '01');
    }
    return Array.from(byCode.entries())
      .sort(([aCode, aName], [bCode, bName]) => `${aCode} ${aName}`.localeCompare(`${bCode} ${bName}`, 'ja'))
      .slice(0, 200);
  }, [deptInfoOptions, departmentCodeMap, uniqueDepartments]);
  useEffect(() => {
    // TEMP: 診療科候補が取得できない場合はデフォルトコードを適用（撤去前提）
    if (!acceptDepartmentSelection && departmentOptions.length > 0 && departmentOptions[0]?.[0]) {
      setAcceptDepartmentSelection(departmentOptions[0][0]);
    }
  }, [acceptDepartmentSelection, departmentOptions]);
  const filteredEntries = useMemo(
    () => filterEntries(appointmentEntries, keyword, departmentFilter, physicianFilter, paymentMode),
    [appointmentEntries, departmentFilter, keyword, paymentMode, physicianFilter],
  );
  const sortedEntries = useMemo(() => sortEntries(filteredEntries, sortKey), [filteredEntries, sortKey]);
  const grouped = useMemo(() => groupByStatus(sortedEntries), [sortedEntries]);
  const tableColCount = claimOutpatientEnabled ? 10 : 9;

  const claimBundles = claimOutpatientEnabled ? claimQuery.data?.bundles ?? [] : [];
  const claimQueueEntries = claimOutpatientEnabled ? claimQuery.data?.queueEntries ?? [] : [];
  const [claimSendCacheUpdatedAt, setClaimSendCacheUpdatedAt] = useState(0);
  useEffect(() => {
    setClaimSendCacheUpdatedAt(Date.now());
  }, [broadcast?.updatedAt, claimQuery.data?.runId]);
  const claimSendCache = useMemo(
    () => loadOrcaClaimSendCache({ facilityId: session.facilityId, userId: session.userId }) ?? {},
    [claimSendCacheUpdatedAt, session.facilityId, session.userId],
  );

  const queueSummary = useMemo(() => {
    const nowMs = Date.now();
    return buildQueuePhaseSummary(claimQueueEntries, nowMs, ORCA_QUEUE_STALL_THRESHOLD_MS);
  }, [claimQueueEntries]);

  const claimBundlesByKey = useMemo(() => {
    const map = new Map<string, ClaimBundle[]>();
    for (const bundle of claimBundles) {
      if (bundle.appointmentId) {
        const key = `appointment:${bundle.appointmentId}`;
        const list = map.get(key) ?? [];
        list.push(bundle);
        map.set(key, list);
      }
      if (bundle.patientId) {
        const key = `patient:${bundle.patientId}`;
        const list = map.get(key) ?? [];
        list.push(bundle);
        map.set(key, list);
      }
    }
    return map;
  }, [claimBundles]);

  const claimQueueByKey = useMemo(() => {
    const map = new Map<string, ClaimQueueEntry>();
    for (const queue of claimQueueEntries) {
      if (queue.appointmentId) {
        map.set(`appointment:${queue.appointmentId}`, queue);
      }
      if (queue.patientId) {
        map.set(`patient:${queue.patientId}`, queue);
      }
    }
    return map;
  }, [claimQueueEntries]);

  const orcaQueueByPatientId = useMemo(() => {
    const map = new Map<string, OrcaQueueEntry>();
    const entries = orcaQueueQuery.data?.queue ?? [];
    for (const entry of entries) {
      if (entry.patientId) map.set(entry.patientId, entry);
    }
    return map;
  }, [orcaQueueQuery.data?.queue]);

  const orcaQueueErrorMessage = useMemo(() => {
    if (!orcaQueueQuery.isError) return undefined;
    const raw =
      orcaQueueQuery.error instanceof Error ? orcaQueueQuery.error.message : String(orcaQueueQuery.error ?? '');
    return raw ? truncateText(raw, 60) : undefined;
  }, [orcaQueueQuery.error, orcaQueueQuery.isError]);

  const orcaQueueErrorStatus = useMemo(() => {
    if (!orcaQueueQuery.isError) return undefined;
    return {
      label: '取得失敗',
      tone: 'error' as const,
      detail: orcaQueueErrorMessage ? `error: ${orcaQueueErrorMessage}` : 'error',
    };
  }, [orcaQueueErrorMessage, orcaQueueQuery.isError]);

  const resolveBundleForEntry = useCallback(
    (entry: ReceptionEntry): ClaimBundle | undefined => {
      const bundles: ClaimBundle[] = [];
      if (entry.appointmentId) {
        const byAppointment = claimBundlesByKey.get(`appointment:${entry.appointmentId}`);
        if (byAppointment) bundles.push(...byAppointment);
      }
      if (entry.patientId) {
        const byPatient = claimBundlesByKey.get(`patient:${entry.patientId}`);
        if (byPatient) bundles.push(...byPatient);
      }
      if (bundles.length === 0) return undefined;
      return [...bundles].sort((a, b) => toBundleTimeMs(b.performTime) - toBundleTimeMs(a.performTime))[0];
    },
    [claimBundlesByKey],
  );

  const resolveQueueForEntry = useCallback(
    (entry: ReceptionEntry): ClaimQueueEntry | undefined => {
      if (entry.appointmentId) {
        const queue = claimQueueByKey.get(`appointment:${entry.appointmentId}`);
        if (queue) return queue;
      }
      if (entry.patientId) {
        const queue = claimQueueByKey.get(`patient:${entry.patientId}`);
        if (queue) return queue;
      }
      return undefined;
    },
    [claimQueueByKey],
  );

  const resolveLastVisitForEntry = useCallback(
    (entry: ReceptionEntry) => {
      const bundle = resolveBundleForEntry(entry);
      return toDateLabel(bundle?.performTime ?? entry.visitDate);
    },
    [resolveBundleForEntry],
  );

  const resolveQueueStatusForEntry = useCallback(
    (entry: ReceptionEntry) => resolveQueueStatus(resolveQueueForEntry(entry)),
    [resolveQueueForEntry],
  );

  const receptionCarryover = useMemo<ReceptionCarryoverParams>(
    () => ({
      kw: keyword.trim() || undefined,
      dept: departmentFilter || undefined,
      phys: physicianFilter || undefined,
      pay: paymentMode !== 'all' ? paymentMode : undefined,
      sort: sortKey,
      date: selectedDate || undefined,
    }),
    [departmentFilter, keyword, paymentMode, physicianFilter, selectedDate, sortKey],
  );

  const buildChartsUrlForEntry = useCallback(
    (entry: ReceptionEntry, runIdOverride?: string) => {
      const runId = runIdOverride ?? mergedMeta.runId ?? initialRunId ?? flags.runId;
      return buildChartsUrl(
        {
          patientId: entry.patientId,
          appointmentId: entry.appointmentId,
          receptionId: entry.receptionId,
          visitDate: entry.visitDate,
        },
        receptionCarryover,
        { runId },
        buildFacilityPath(session.facilityId, '/charts'),
      );
    },
    [flags.runId, initialRunId, mergedMeta.runId, receptionCarryover, session.facilityId],
  );

  const exceptionItems = useMemo(() => {
    const nowMs = Date.now();
    const baseRunId = mergedMeta.runId ?? initialRunId ?? flags.runId;
    const list: ReceptionExceptionItem[] = [];
    for (const entry of sortedEntries) {
      const bundle = resolveBundleForEntry(entry);
      const queue = resolveQueueForEntry(entry);
      const queueStatus = resolveQueueStatus(queue);
      const orcaQueueEntry = entry.patientId ? orcaQueueByPatientId.get(entry.patientId) : undefined;
      const orcaQueueStatus = orcaQueueErrorStatus ?? resolveOrcaQueueStatus(orcaQueueEntry);
      const decision = resolveExceptionDecision({
        entry,
        bundle,
        queue,
        nowMs,
        thresholdMs: ORCA_QUEUE_STALL_THRESHOLD_MS,
      });
      if (!decision.kind) continue;

      list.push({
        id: `${decision.kind}-${entryKey(entry)}`,
        kind: decision.kind,
        detail: decision.detail,
        nextAction: decision.nextAction,
        entry,
        bundle,
        queue,
        queueLabel: queueStatus.label,
        queueDetail: queueStatus.detail,
        queueTone: queueStatus.tone,
        orcaQueueLabel: orcaQueueStatus.label,
        orcaQueueDetail: orcaQueueStatus.detail,
        orcaQueueTone: orcaQueueStatus.tone,
        orcaQueueSource: orcaQueueQuery.data?.source,
        paymentLabel: paymentModeLabel(entry.insurance),
        chartsUrl: buildChartsUrlForEntry(entry, baseRunId),
        reasons: decision.reasons,
      });
    }
    return list;
  }, [
    buildChartsUrlForEntry,
    flags.runId,
    initialRunId,
    mergedMeta.runId,
    orcaQueueByPatientId,
    orcaQueueErrorStatus,
    orcaQueueQuery.data?.source,
    resolveBundleForEntry,
    resolveQueueForEntry,
    sortedEntries,
  ]);

  const exceptionCounts = useMemo(() => {
    const counts = {
      total: exceptionItems.length,
      unapproved: 0,
      sendError: 0,
      delayed: 0,
    };
    exceptionItems.forEach((item) => {
      if (item.kind === 'send_error') counts.sendError += 1;
      if (item.kind === 'delayed') counts.delayed += 1;
      if (item.kind === 'unapproved') counts.unapproved += 1;
    });
    return counts;
  }, [exceptionItems]);

  const exceptionIndicatorTone =
    exceptionCounts.sendError > 0
      ? 'error'
      : exceptionCounts.delayed > 0
        ? 'warning'
        : exceptionCounts.unapproved > 0
          ? 'info'
          : 'neutral';

  const latestAuditEvent = useMemo(() => {
    const snapshot = getAuditEventLog();
    const latest = snapshot[snapshot.length - 1];
    return (latest?.payload as Record<string, unknown> | undefined) ?? undefined;
  }, [
    appointmentQuery.data?.runId,
    claimQuery.data?.runId,
    exceptionItems.length,
    mergedMeta.runId,
    missingMasterNote,
    selectedEntryKey,
  ]);

  const physicianOptions = useMemo(() => {
    const normalized = uniquePhysicians
      .map((physician) => physician?.trim())
      .filter((value): value is string => Boolean(value));
    const merged = new Set<string>(normalized);
    const selected =
      selectedEntryKey && sortedEntries.length > 0
        ? sortedEntries.find((entry) => entryKey(entry) === selectedEntryKey)
        : undefined;
    if (selected?.physician?.trim()) {
      merged.add(selected.physician.trim());
    }
    if (physicianFilter?.trim()) {
      merged.add(physicianFilter.trim());
    }
    if (merged.size === 0) {
      merged.add('0001');
    }
    return Array.from(merged).sort((a, b) => a.localeCompare(b, 'ja')).slice(0, 200);
  }, [uniquePhysicians, physicianFilter, selectedEntryKey, sortedEntries]);

  const selectedEntry = useMemo(() => {
    if (!selectedEntryKey) return undefined;
    return sortedEntries.find((entry) => entryKey(entry) === selectedEntryKey);
  }, [selectedEntryKey, sortedEntries]);

  const recordsModalPatientId = recordsModalPatient?.patientId?.trim() ?? '';
  const recordsModalPatientLabel = recordsModalPatient?.name?.trim() || recordsModalPatientId || '—';

  const medicalRecordsModalQuery = useQuery({
    queryKey: ['orca-medical-records', recordsModalPatientId],
    enabled: Boolean(recordsModalPatientId),
    queryFn: async () => {
      if (!recordsModalPatientId) throw new Error('patientId is required');
      return postMedicalRecords({ patientId: recordsModalPatientId, performMonths: 18, includeVisitStatus: false });
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!acceptPhysicianSelection && physicianOptions.length > 0) {
      setAcceptPhysicianSelection(physicianOptions[0]);
    }
  }, [acceptPhysicianSelection, physicianOptions]);

  useEffect(() => {
    if (!appointmentQuery.dataUpdatedAt) return;
    if (lastAppointmentUpdatedAt.current === appointmentQuery.dataUpdatedAt) return;
    const previous = lastAppointmentUpdatedAt.current;
    lastAppointmentUpdatedAt.current = appointmentQuery.dataUpdatedAt;
    if (!previous) return;
    if (!selectedEntryKey) return;
    const stillExists = sortedEntries.some((entry) => entryKey(entry) === selectedEntryKey);
    if (stillExists) {
      setSelectionNotice({ tone: 'info', message: '一覧を更新しました。選択は保持されています。' });
      setSelectionLost(false);
    } else {
      setSelectionNotice({ tone: 'warning', message: '一覧更新で選択中の行が見つかりません。検索条件を確認してください。' });
      setSelectedEntryKey(null);
      setSelectionLost(true);
    }
  }, [appointmentQuery.dataUpdatedAt, selectedEntryKey, sortedEntries]);

  const applyAcceptAutoFill = useCallback(
    (entry: ReceptionEntry | undefined, options?: { force?: boolean }) => {
      if (!entry) return;
      const nextPatientId = entry.patientId?.trim() ?? '';
      const nextPaymentMode = resolvePaymentMode(entry.insurance ?? undefined);
      const nextVisitKind = acceptVisitKind.trim() ? acceptVisitKind : '1';
      const shouldUpdate = (current: string, next: string, last?: string) =>
        Boolean(next) && (options?.force || !current.trim() || (last && current === last));
      let updated = false;
      if (
        nextPatientId &&
        nextPatientId !== acceptPatientId.trim() &&
        (options?.force || !acceptPatientId.trim() || entry.source === 'unknown')
      ) {
        setAcceptPatientId(nextPatientId);
        updated = true;
      } else if (shouldUpdate(acceptPatientId, nextPatientId, lastAcceptAutoFill.current.patientId)) {
        setAcceptPatientId(nextPatientId);
        updated = true;
      }
      if (
        nextPaymentMode &&
        nextPaymentMode !== 'all' &&
        shouldUpdate(acceptPaymentMode, nextPaymentMode, lastAcceptAutoFill.current.paymentMode)
      ) {
        setAcceptPaymentMode(nextPaymentMode);
        updated = true;
      }
      if (!acceptVisitKind.trim() && nextVisitKind) {
        setAcceptVisitKind(nextVisitKind);
        updated = true;
      }
      if (updated) {
        lastAcceptAutoFill.current = {
          patientId: nextPatientId || lastAcceptAutoFill.current.patientId,
          paymentMode: (nextPaymentMode && nextPaymentMode !== 'all'
            ? nextPaymentMode
            : lastAcceptAutoFill.current.paymentMode) as 'insurance' | 'self' | '',
        };
        setAcceptErrors((prev) => {
          const next = { ...prev };
          if (nextPatientId) delete next.patientId;
          if (nextPaymentMode) delete next.paymentMode;
          return next;
        });
      }
    },
    [acceptPatientId, acceptPaymentMode, acceptVisitKind],
  );

  const acceptAutoFillSignature = useMemo(() => {
    if (!selectedEntry) return null;
    return JSON.stringify({
      key: entryKey(selectedEntry),
      patientId: selectedEntry.patientId ?? '',
      paymentMode: resolvePaymentMode(selectedEntry.insurance ?? undefined) ?? '',
    });
  }, [selectedEntry]);

  useEffect(() => {
    if (!selectedEntry || !acceptAutoFillSignature) return;
    if (lastAcceptAutoFillSignature.current === acceptAutoFillSignature) return;
    lastAcceptAutoFillSignature.current = acceptAutoFillSignature;
    applyAcceptAutoFill(selectedEntry);
  }, [acceptAutoFillSignature, applyAcceptAutoFill, selectedEntry]);

  useEffect(() => {
    if (!selectedEntry || selectedEntry.source !== 'unknown') return;
    if (!selectedEntry.patientId) return;
    if (acceptPatientId.trim()) return;
    setAcceptPatientId(selectedEntry.patientId);
    lastAcceptAutoFill.current = { ...lastAcceptAutoFill.current, patientId: selectedEntry.patientId };
  }, [acceptPatientId, selectedEntry]);

  const selectedBundle = useMemo(
    () => (selectedEntry ? resolveBundleForEntry(selectedEntry) : undefined),
    [resolveBundleForEntry, selectedEntry],
  );

  const selectedQueue = useMemo(
    () => (selectedEntry ? resolveQueueForEntry(selectedEntry) : undefined),
    [resolveQueueForEntry, selectedEntry],
  );
  const selectedQueueStatus = useMemo(() => resolveQueueStatus(selectedQueue), [selectedQueue]);
  const selectedSendCache = useMemo(() => {
    if (!selectedEntry?.patientId) return null;
    return claimSendCache[selectedEntry.patientId] ?? null;
  }, [claimSendCache, selectedEntry?.patientId]);

  const summaryText = useMemo(() => {
    const counts = grouped.map(({ status, items }) => `${status}: ${items.length}件`).join(' / ');
    return `検索結果 ${sortedEntries.length}件（${counts}）`;
  }, [grouped, sortedEntries.length]);

  const selectionSummaryText = useMemo(() => {
    if (!selectedEntry) return '選択中の患者はありません。';
    const queue = resolveQueueStatus(selectedQueue);
    return [
      `選択中: ${selectedEntry.name ?? '未登録'}`,
      `患者ID ${selectedEntry.patientId ?? '未登録'}`,
      `状態 ${selectedEntry.status ?? '-'}`,
      `ORCAキュー ${queue.label}${queue.detail ? ` ${queue.detail}` : ''}`,
    ].join('、');
  }, [selectedEntry, selectedQueue]);
  const selectionSummaryShort = useMemo(() => {
    if (!selectedEntry) return '一覧の行を選択してください。';
    const parts = [
      selectedEntry.status ?? '—',
      selectedEntry.appointmentTime ? `来院 ${selectedEntry.appointmentTime}` : undefined,
      selectedEntry.department ?? undefined,
    ].filter((value): value is string => Boolean(value));
    const base = parts.length > 0 ? parts.join(' / ') : '状態未取得';
    return selectedEntry.patientId ? `患者ID ${selectedEntry.patientId} / ${base}` : `患者ID未登録 / ${base}`;
  }, [selectedEntry]);

  const selectedSavedView = useMemo(
    () => savedViews.find((view) => view.id === selectedViewId) ?? null,
    [savedViews, selectedViewId],
  );
  const savedViewUpdatedAtLabel = useMemo(() => {
    if (!selectedSavedView?.updatedAt) return null;
    const parsed = Date.parse(selectedSavedView.updatedAt);
    if (Number.isNaN(parsed)) return selectedSavedView.updatedAt;
    return formatAutoRefreshTimestamp(parsed);
  }, [selectedSavedView]);

  const orderSummaryText = useMemo(() => {
    if (!selectedEntry) return 'オーダー概要は未選択です。';
    if (!claimOutpatientEnabled) {
      return [
        `状態 ${selectedEntry.status ?? '—'}`,
        `直近 ${resolveLastVisitForEntry(selectedEntry)}`,
        `ORCAキュー ${selectedQueueStatus.label}${selectedQueueStatus.detail ? ` ${selectedQueueStatus.detail}` : ''}`,
      ].join('、');
    }
    return [
      `請求状態 ${selectedBundle?.claimStatus ?? selectedBundle?.claimStatusText ?? '未取得'}`,
      `バンドル ${selectedBundle?.bundleNumber ?? '—'}`,
      `合計金額 ${selectedBundle?.totalClaimAmount !== undefined ? `${selectedBundle.totalClaimAmount.toLocaleString()}円` : '—'}`,
      `診療時間 ${toDateLabel(selectedBundle?.performTime)}`,
      `ORCAキュー ${selectedQueueStatus.label}${selectedQueueStatus.detail ? ` ${selectedQueueStatus.detail}` : ''}`,
    ].join('、');
  }, [claimOutpatientEnabled, resolveLastVisitForEntry, selectedBundle, selectedEntry, selectedQueueStatus]);

  const unlinkedCounts = useMemo(() => {
    return {
      missingPatientId: appointmentEntries.filter((entry) => !entry.patientId).length,
      missingAppointmentId: appointmentEntries.filter((entry) => !entry.appointmentId).length,
      missingReceptionId: appointmentEntries.filter((entry) => entry.source === 'visits' && !entry.receptionId).length,
    };
  }, [appointmentEntries]);

  const unlinkedWarning = useMemo(() => {
    const banner = getAppointmentDataBanner({
      entries: appointmentEntries,
      isLoading: appointmentQuery.isLoading,
      isError: appointmentQuery.isError,
      error: appointmentQuery.error,
      date: selectedDate,
    });
    if (!banner || banner.tone !== 'warning') return null;
    const parts = [
      unlinkedCounts.missingPatientId > 0 ? `患者ID欠損: ${unlinkedCounts.missingPatientId}` : undefined,
      unlinkedCounts.missingAppointmentId > 0 ? `予約ID欠損: ${unlinkedCounts.missingAppointmentId}` : undefined,
      unlinkedCounts.missingReceptionId > 0 ? `受付ID欠損: ${unlinkedCounts.missingReceptionId}` : undefined,
    ].filter((value): value is string => typeof value === 'string');
    const key = `${mergedMeta.runId ?? 'runId'}-${selectedDate}-${unlinkedCounts.missingPatientId}-${unlinkedCounts.missingAppointmentId}-${unlinkedCounts.missingReceptionId}`;
    return { ...banner, key, detail: parts.join(' / ') };
  }, [
    appointmentQuery.error,
    appointmentQuery.isError,
    appointmentQuery.isLoading,
    appointmentEntries,
    mergedMeta.runId,
    selectedDate,
    unlinkedCounts.missingAppointmentId,
    unlinkedCounts.missingPatientId,
    unlinkedCounts.missingReceptionId,
  ]);

  useEffect(() => {
    if (!unlinkedWarning) {
      lastUnlinkedToastKey.current = null;
      return;
    }
    if (lastUnlinkedToastKey.current === unlinkedWarning.key) return;
    lastUnlinkedToastKey.current = unlinkedWarning.key;
    enqueue({
      id: `reception-unlinked-${unlinkedWarning.key}`,
      tone: 'warning',
      message: unlinkedWarning.message,
      detail: unlinkedWarning.detail ? `${unlinkedWarning.detail} / 検索日: ${selectedDate}` : `検索日: ${selectedDate}`,
    });
  }, [enqueue, selectedDate, unlinkedWarning]);

  useEffect(() => {
    summaryRef.current?.focus?.();
  }, [summaryText]);

  useEffect(() => {
    if (sortedEntries.length === 0) {
      setSelectedEntryKey(null);
      setSelectionLost(false);
      return;
    }
    if (selectionLost) return;
    if (selectedEntryKey && sortedEntries.some((entry) => entryKey(entry) === selectedEntryKey)) return;
    setSelectedEntryKey(entryKey(sortedEntries[0]));
  }, [selectedEntryKey, selectionLost, sortedEntries]);

  useEffect(() => {
    if (!selectedEntry) return;
    const queue = resolveQueueStatus(selectedQueue);
    const payload = {
      entryKey: entryKey(selectedEntry),
      bundleNumber: selectedBundle?.bundleNumber ?? null,
      queuePhase: selectedQueue?.phase ?? null,
      lastVisit: toDateLabel(selectedBundle?.performTime ?? selectedEntry.visitDate),
    };
    const signature = JSON.stringify(payload);
    if (lastSidepaneAuditKey.current === signature) return;
    lastSidepaneAuditKey.current = signature;
    logAuditEvent({
      runId: mergedMeta.runId,
      patientId: selectedEntry.patientId,
      appointmentId: selectedEntry.appointmentId,
      cacheHit: mergedMeta.cacheHit,
      missingMaster: mergedMeta.missingMaster,
      dataSourceTransition: mergedMeta.dataSourceTransition,
      payload: {
        action: 'RECEPTION_SIDEPANE_SUMMARY',
        receptionId: selectedEntry.receptionId,
        patientSummary: {
          patientId: selectedEntry.patientId,
          name: selectedEntry.name,
          kana: selectedEntry.kana,
          birthDate: selectedEntry.birthDate,
          sex: selectedEntry.sex,
          insurance: selectedEntry.insurance,
          department: selectedEntry.department,
          physician: selectedEntry.physician,
          status: selectedEntry.status,
        },
        orderSummary: {
          claimStatus: selectedBundle?.claimStatus ?? selectedBundle?.claimStatusText,
          bundleNumber: selectedBundle?.bundleNumber,
          totalClaimAmount: selectedBundle?.totalClaimAmount,
          performTime: selectedBundle?.performTime,
          orcaQueue: {
            phase: selectedQueue?.phase,
            label: queue.label,
            detail: queue.detail,
          },
        },
      },
    });
  }, [
    mergedMeta.cacheHit,
    mergedMeta.dataSourceTransition,
    mergedMeta.missingMaster,
    mergedMeta.runId,
    selectedBundle,
    selectedEntry,
    selectedQueue,
  ]);

  useEffect(() => {
    if (!selectedEntryKey && selectionNotice?.tone !== 'warning') {
      setSelectionNotice(null);
    }
  }, [selectedEntryKey, selectionNotice?.tone]);

  useEffect(() => {
    const runId = mergedMeta.runId ?? initialRunId ?? flags.runId;
    if (!runId) return;
    const auditDetails = buildExceptionAuditDetails({
      runId,
      items: exceptionItems.map((item) => ({
        kind: item.kind,
        entry: item.entry,
        reasons: item.reasons ?? {},
      })),
      queueSummary,
      thresholdMs: ORCA_QUEUE_STALL_THRESHOLD_MS,
    });
    const signature = JSON.stringify(auditDetails);
    if (lastExceptionAuditKey.current === signature) return;
    lastExceptionAuditKey.current = signature;
    logAuditEvent({
      runId,
      source: 'reception-exception-list',
      cacheHit: mergedMeta.cacheHit,
      missingMaster: mergedMeta.missingMaster,
      dataSourceTransition: mergedMeta.dataSourceTransition,
      payload: {
        action: 'RECEPTION_EXCEPTION_LIST',
        outcome: 'info',
        details: {
          runId,
          summary: auditDetails,
        },
      },
    });
  }, [
    exceptionItems,
    flags.runId,
    initialRunId,
    mergedMeta.cacheHit,
    mergedMeta.dataSourceTransition,
    mergedMeta.missingMaster,
    mergedMeta.runId,
    queueSummary,
  ]);

  const tonePayload = useMemo(
    () => ({
      missingMaster: mergedMeta.missingMaster ?? true,
      cacheHit: mergedMeta.cacheHit ?? false,
      dataSourceTransition: mergedMeta.dataSourceTransition ?? 'snapshot',
    }),
    [mergedMeta.cacheHit, mergedMeta.dataSourceTransition, mergedMeta.missingMaster],
  );
  const toneDetails = useMemo(() => getChartToneDetails(tonePayload), [tonePayload]);
  const { tone, message: toneMessage, transitionMeta } = toneDetails;
  const masterSource = toMasterSource(tonePayload.dataSourceTransition);
  const isAcceptSubmitting = visitMutation.isPending;
  const resolveMedicalInformation = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return '01';
    if (/^\d+$/.test(trimmed)) return trimmed;
    if (trimmed === '外来受付') return '01';
    return '01';
  }, []);
  const buildAuthJsonHeaders = useCallback(() => buildHttpHeaders({ headers: { 'Content-Type': 'application/json' } }), []);
  const resolvedDepartmentCode = acceptDepartmentSelection || departmentFilter || '';
  const resolvedPhysicianCode = acceptPhysicianSelection || physicianFilter || selectedEntry?.physician || '';
  useEffect(() => {
    if (!acceptPhysicianSelection && resolvedPhysicianCode) {
      setAcceptPhysicianSelection(resolvedPhysicianCode);
    }
  }, [acceptPhysicianSelection, resolvedPhysicianCode]);
  const sendDirectAcceptMinimalForced = useCallback(() => {
    // TEMP: 強制送信ボタン専用（撤去前提）
    const now = new Date();
    const acceptancePush = resolveAcceptancePush('1');
    const resolvedMedicalInformation = resolveMedicalInformation(acceptNote);
    if (!resolvedDepartmentCode) {
      setAcceptErrors((prev) => ({ ...prev, department: '診療科を選択してください' }));
      setAcceptResult({
        tone: 'error',
        message: '診療科を選択してください',
        detail: '診療科コードが未設定です',
      });
      return;
    }
    if (!resolvedPhysicianCode) {
      setAcceptErrors((prev) => ({ ...prev, physician: '担当医を選択してください' }));
      setAcceptResult({
        tone: 'error',
        message: '担当医を選択してください',
        detail: 'ドクターコードが未設定です',
      });
      return;
    }
    const patientId = acceptPatientId.trim() || masterSelected?.patientId?.trim() || selectedEntry?.patientId?.trim() || '';
    const payload = {
      requestNumber: '01',
      patientId,
      acceptanceDate: selectedDate || todayString(),
      acceptanceTime: now.toISOString().slice(11, 19),
      acceptancePush,
      medicalInformation: resolvedMedicalInformation,
      departmentCode: resolvedDepartmentCode || undefined,
      physicianCode: resolvedPhysicianCode || undefined,
      insurances: [
        {
          insuranceProviderClass: acceptPaymentMode === 'self' ? '9' : '1',
          insuranceCombinationNumber: acceptPaymentMode === 'self' ? undefined : '0001',
        },
      ],
    };
    // TEMP: XHRで送信可否/ステータスを可視化（撤去前提）
    setXhrDebugState({ lastAttemptAt: now.toISOString(), status: null, error: null });
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/orca/visits/mutation', true);
    xhr.withCredentials = true;
    const headers = buildAuthJsonHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.onload = () => {
      setXhrDebugState({ lastAttemptAt: now.toISOString(), status: xhr.status, error: null });
    };
    xhr.onerror = () => {
      setXhrDebugState({
        lastAttemptAt: now.toISOString(),
        status: xhr.status || null,
        error: 'XHR送信でエラーが発生しました。',
      });
    };
    xhr.send(JSON.stringify(payload));
  }, [
    acceptPatientId,
    acceptNote,
    acceptPaymentMode,
    masterSelected?.patientId,
    resolvedDepartmentCode,
    resolvedPhysicianCode,
    resolveMedicalInformation,
    selectedDate,
    selectedEntry?.patientId,
  ]);

  const handleAcceptRegister = useCallback(
    async (event?: MouseEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      setAcceptResult(null);
      setAcceptErrors({});
      setAcceptDurationMs(null);
      let trimmedPatientId =
        acceptPatientId.trim() || masterSelected?.patientId?.trim() || selectedEntry?.patientId?.trim() || '';
      if (!acceptPatientId.trim() && trimmedPatientId) {
        setAcceptPatientId(trimmedPatientId);
      }
      const resolvedPaymentMode = acceptPaymentMode || 'insurance';
      const resolvedVisitKind = acceptVisitKind.trim() || '1';
      const acceptancePush = resolveAcceptancePush(resolvedVisitKind);
      if (!acceptPaymentMode) {
        setAcceptPaymentMode(resolvedPaymentMode);
      }
      if (!acceptVisitKind.trim()) {
        setAcceptVisitKind(resolvedVisitKind);
      }
      const resolvedMedicalInformation = resolveMedicalInformation(acceptNote);
      const errors: typeof acceptErrors = {};
      if (!trimmedPatientId) errors.patientId = '患者IDは必須です';
      if (!resolvedPaymentMode) errors.paymentMode = '保険/自費を選択してください';
      if (!resolvedVisitKind) errors.visitKind = '来院区分を選択してください';
      if (!resolvedDepartmentCode) errors.department = '診療科を選択してください';
      if (!resolvedPhysicianCode) errors.physician = '担当医を選択してください';
      const hasErrors = Object.keys(errors).length > 0;
      if (hasErrors) {
        setAcceptErrors(errors);
        setAcceptDetailsCollapsed(false);
        setAcceptResult({
          tone: 'error',
          message: '入力内容を確認してください',
          detail: Object.values(errors).join(' / '),
        });
      }
      const now = new Date();
      const params: VisitMutationParams = {
        patientId: trimmedPatientId || '',
        requestNumber: '01',
        acceptanceDate: selectedDate || todayString(),
        acceptanceTime: now.toISOString().slice(11, 19),
        acceptancePush,
        medicalInformation: resolvedMedicalInformation,
        paymentMode: resolvedPaymentMode || undefined,
        departmentCode: resolvedDepartmentCode || undefined,
        physicianCode: resolvedPhysicianCode || undefined,
      };

      const started = performance.now();
      try {
        if (hasErrors) return;
        // TEMP: 直接呼び出しフォールバック（mutateAsyncが未配線の場合に備える）
        const payload = await (visitMutation.mutateAsync ? visitMutation.mutateAsync(params) : mutateVisit(params));
        const durationMs = Math.round(performance.now() - started);
        setAcceptDurationMs(durationMs);
        const apiResult = payload.apiResult ?? '';
        const isSuccess = apiResult === '00' || apiResult === '0000';
        const isNoAcceptance = apiResult === '21';

        if (isSuccess) {
          applyMutationResultToList(payload, params);
          if (payload.acceptanceId) {
            void refetchAppointment();
          }
          if (claimOutpatientEnabled) {
            void refetchClaim();
          }
        }

        const toneResult: 'info' | 'warning' | 'error' = isSuccess
          ? 'info'
          : isNoAcceptance
            ? 'warning'
            : 'error';
        const message = isSuccess
          ? '受付登録が完了しました'
          : isNoAcceptance
            ? 'ORCA から「受付なし」が返却されました'
            : '受付処理でエラーが返却されました';

        setAcceptResult({
          tone: toneResult,
          message,
          detail: payload.apiResultMessage ?? payload.apiResult ?? 'status unknown',
          runId: payload.runId ?? mergedMeta.runId,
          apiResult: payload.apiResult,
        });

        if (durationMs > 1000) {
          enqueue({
            tone: 'warning',
            message: '受付リクエストが1秒を超えました',
            detail: `${durationMs}ms`,
          });
        }

        console.info(
          '[acceptmodv2]',
          JSON.stringify(
            {
              runId: payload.runId ?? mergedMeta.runId,
              traceId: payload.traceId,
              requestNumber: params.requestNumber,
              apiResult: payload.apiResult,
              apiResultMessage: payload.apiResultMessage,
              acceptanceId: payload.acceptanceId,
              patientId: payload.patient?.patientId ?? params.patientId,
              durationMs,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        setAcceptResult({
          tone: 'error',
          message: '受付処理に失敗しました',
          detail,
          runId: mergedMeta.runId,
        });
        enqueue({ tone: 'error', message: '受付処理に失敗しました', detail });
        // eslint-disable-next-line no-console
        console.error('[acceptmodv2]', detail);
      }
    },
    [
      acceptNote,
      acceptPatientId,
      acceptPaymentMode,
      acceptVisitKind,
      applyMutationResultToList,
      enqueue,
      masterSelected?.patientId,
      mergedMeta.runId,
      resolveMedicalInformation,
      refetchAppointment,
      refetchClaim,
      resolvedDepartmentCode,
      selectedDate,
      selectedEntry?.department,
      selectedEntry?.patientId,
      selectedEntry?.physician,
      visitMutation,
    ],
  );

  const handleCancelSelectedEntry = useCallback(async () => {
    setAcceptResult(null);
    setAcceptErrors({});
    setAcceptDurationMs(null);
    if (!selectedEntry) {
      enqueue({ tone: 'warning', message: '取消する患者を選択してください。' });
      return;
    }
    const patientId = selectedEntry.patientId?.trim() ?? '';
    const acceptanceId = selectedEntry.receptionId?.trim() ?? '';
    if (!patientId) {
      enqueue({ tone: 'warning', message: '患者IDが未登録のため取消できません。' });
      return;
    }
    if (!acceptanceId) {
      enqueue({ tone: 'warning', message: '受付IDが未登録のため取消できません。' });
      return;
    }
    const now = new Date();
    const params: VisitMutationParams = {
      patientId,
      requestNumber: '02',
      acceptanceDate: selectedDate || todayString(),
      acceptanceTime: now.toISOString().slice(11, 19),
      acceptancePush: resolveAcceptancePush('1'),
      acceptanceId,
    };
    const started = performance.now();
    try {
      const payload = await (visitMutation.mutateAsync ? visitMutation.mutateAsync(params) : mutateVisit(params));
      const durationMs = Math.round(performance.now() - started);
      setAcceptDurationMs(durationMs);
      const apiResult = payload.apiResult ?? '';
      const isSuccess = apiResult === '00' || apiResult === '0000';
      const isNoAcceptance = apiResult === '21';
      if (isSuccess) {
        applyMutationResultToList(payload, params);
        void refetchAppointment();
        if (claimOutpatientEnabled) {
          void refetchClaim();
        }
      }
      const toneResult: 'info' | 'warning' | 'error' = isSuccess ? 'info' : isNoAcceptance ? 'warning' : 'error';
      const message = isSuccess
        ? '受付取消が完了しました'
        : isNoAcceptance
          ? 'ORCA から「受付なし」が返却されました'
          : '受付取消でエラーが返却されました';
      setAcceptResult({
        tone: toneResult,
        message,
        detail: payload.apiResultMessage ?? payload.apiResult ?? 'status unknown',
        runId: payload.runId ?? mergedMeta.runId,
        apiResult: payload.apiResult,
      });
      enqueue({
        tone: toneResult === 'info' ? 'info' : toneResult,
        message,
        detail: payload.apiResultMessage ?? payload.apiResult ?? undefined,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setAcceptResult({
        tone: 'error',
        message: '受付取消に失敗しました',
        detail,
        runId: mergedMeta.runId,
      });
      enqueue({ tone: 'error', message: '受付取消に失敗しました', detail });
      // eslint-disable-next-line no-console
      console.error('[acceptmodv2]', detail);
    }
  }, [
    applyMutationResultToList,
    claimOutpatientEnabled,
    enqueue,
    mergedMeta.runId,
    refetchAppointment,
    refetchClaim,
    selectedDate,
    selectedEntry,
    visitMutation,
  ]);

  const handlePatientSearchSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const filters = {
        patientId: acceptPatientId.trim(),
        nameSei: patientSearchNameSei.trim(),
        nameMei: patientSearchNameMei.trim(),
        kanaSei: patientSearchKanaSei.trim(),
        kanaMei: patientSearchKanaMei.trim(),
      };
      const primaryKeyword =
        filters.patientId ||
        filters.kanaSei ||
        filters.kanaMei ||
        filters.nameSei ||
        filters.nameMei;
      if (!primaryKeyword) {
        setPatientSearchError('患者ID / 氏名 / カナ のいずれかを入力してください。');
        return;
      }
      patientSearchFilterRef.current = filters;
      setPatientSearchError(null);
      setPatientSearchSelected(null);
      await patientSearchMutation.mutateAsync({ keyword: primaryKeyword });
      logUiState({
        action: 'patient_search',
        screen: 'reception',
        runId: mergedMeta.runId ?? flags.runId,
        details: { keyword: primaryKeyword, ...filters },
      });
    },
    [
      acceptPatientId,
      flags.runId,
      mergedMeta.runId,
      patientSearchKanaMei,
      patientSearchKanaSei,
      patientSearchMutation,
      patientSearchNameMei,
      patientSearchNameSei,
    ],
  );

  const clearPatientSearch = useCallback(() => {
    setAcceptPatientId('');
    setPatientSearchNameSei('');
    setPatientSearchNameMei('');
    setPatientSearchKanaSei('');
    setPatientSearchKanaMei('');
    setPatientSearchResults([]);
    setPatientSearchMeta(null);
    setPatientSearchSelected(null);
    setPatientSearchError(null);
    patientSearchFilterRef.current = null;
  }, []);

  const handleSelectPatientSearchResult = useCallback(
    (patient: PatientRecord) => {
      setPatientSearchSelected(patient);
      const resolvedPatientId = patient.patientId?.trim() ?? '';
      if (resolvedPatientId) {
        setAcceptPatientId(resolvedPatientId);
        lastAcceptAutoFill.current = { ...lastAcceptAutoFill.current, patientId: resolvedPatientId };
        setAcceptErrors((prev) => ({ ...prev, patientId: undefined }));
        const matched = sortedEntries.find((entry) => entry.patientId === resolvedPatientId);
        if (matched) {
          setSelectedEntryKey(entryKey(matched));
          setSelectionNotice(null);
          setSelectionLost(false);
        } else {
          setSelectedEntryKey(null);
        }
      }
      const resolvedPaymentMode = resolvePaymentMode(patient.insurance ?? undefined);
      if (resolvedPaymentMode && resolvedPaymentMode !== 'all') {
        const shouldAutoFill =
          !acceptPaymentMode.trim() ||
          (lastAcceptAutoFill.current.paymentMode && acceptPaymentMode === lastAcceptAutoFill.current.paymentMode);
        if (shouldAutoFill) {
          setAcceptPaymentMode(resolvedPaymentMode);
          lastAcceptAutoFill.current = { ...lastAcceptAutoFill.current, paymentMode: resolvedPaymentMode };
          setAcceptErrors((prev) => ({ ...prev, paymentMode: undefined }));
        }
      }
      if (!acceptVisitKind.trim()) {
        setAcceptVisitKind('1');
      }
      logUiState({
        action: 'patient_select',
        screen: 'reception/patient-search',
        runId: mergedMeta.runId ?? flags.runId,
        patientId: resolvedPatientId || undefined,
        details: {
          patientId: resolvedPatientId || undefined,
          name: patient.name,
          kana: patient.kana,
        },
      });
    },
    [acceptPaymentMode, acceptVisitKind, flags.runId, mergedMeta.runId, sortedEntries],
  );

  const acceptTargetPatientId = useMemo(() => {
    const direct = acceptPatientId.trim();
    if (direct) return direct;
    const fromSearch = patientSearchSelected?.patientId?.trim();
    if (fromSearch) return fromSearch;
    const fromMaster = masterSelected?.patientId?.trim();
    if (fromMaster) return fromMaster;
    const fromSelection = selectedEntry?.patientId?.trim();
    if (fromSelection) return fromSelection;
    return '';
  }, [acceptPatientId, masterSelected?.patientId, patientSearchSelected?.patientId, selectedEntry?.patientId]);

  const acceptTargetPatientLabel = useMemo(() => {
    const candidateNames = [
      patientSearchSelected?.name,
      masterSelected?.name,
      selectedEntry?.name,
    ];
    const resolved = candidateNames.find((value) => typeof value === 'string' && value.trim());
    return resolved?.trim() || acceptTargetPatientId || '未選択';
  }, [acceptTargetPatientId, masterSelected?.name, patientSearchSelected?.name, selectedEntry?.name]);

  const acceptRegisterDecision = useMemo(() => {
    if (!acceptTargetPatientId) {
      return { disabled: true, label: '受付登録', reason: '患者を選択してください。' };
    }
    const matches = sortedEntries.filter((entry) => entry.patientId === acceptTargetPatientId);
    const hasActive = matches.some((entry) => Boolean(entry.status) && entry.status !== '予約');
    const hasReservation = matches.some((entry) => entry.status === '予約');
    if (hasActive) {
      return { disabled: true, label: '受付済み', reason: '本日はすでに受付済みです。' };
    }
    if (hasReservation) {
      return { disabled: false, label: '通常受付', reason: undefined };
    }
    return { disabled: false, label: '予約外受付', reason: undefined };
  }, [acceptTargetPatientId, sortedEntries]);

  const openExceptionsModal = useCallback(() => {
    setExceptionsModalOpen(true);
    logUiState({
      action: 'open_modal',
      screen: 'reception/exceptions',
      controlId: 'exceptions-modal',
      runId: mergedMeta.runId ?? flags.runId,
      details: {
        total: exceptionCounts.total,
        sendError: exceptionCounts.sendError,
        delayed: exceptionCounts.delayed,
        unapproved: exceptionCounts.unapproved,
      },
    });
  }, [exceptionCounts, flags.runId, mergedMeta.runId]);

  const closeExceptionsModal = useCallback(() => {
    setExceptionsModalOpen(false);
  }, []);

  const openMedicalRecordsModal = useCallback(
    (patient: { patientId?: string | null; name?: string | null }, source: 'search' | 'selection') => {
      const resolvedPatientId = patient.patientId?.trim() ?? '';
      if (!resolvedPatientId) {
        enqueue({ tone: 'warning', message: '患者IDが未登録のため過去カルテを表示できません。' });
        return;
      }
      setRecordsModalPatient({
        patientId: resolvedPatientId,
        name: patient.name?.trim() ? patient.name.trim() : undefined,
      });
      logUiState({
        action: 'open_modal',
        screen: 'reception/medical-records',
        controlId: 'medical-records-modal',
        runId: mergedMeta.runId ?? flags.runId,
        patientId: resolvedPatientId,
        details: { source },
      });
    },
    [enqueue, flags.runId, mergedMeta.runId],
  );

  const closeMedicalRecordsModal = useCallback(() => {
    setRecordsModalPatient(null);
  }, []);

  const handleMasterSearchSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      setMasterSearchNotice(null);
      setMasterSearchError(null);
      const trimmedName = masterSearchFilters.name.trim();
      const trimmedKana = masterSearchFilters.kana.trim();
      if (masterSearchFilters.birthEndDate && !masterSearchFilters.birthStartDate) {
        setMasterSearchError('生年月日（終了）を指定する場合は開始日も入力してください。');
        return;
      }
      if (masterSearchFilters.birthStartDate && masterSearchFilters.birthEndDate) {
        const start = Date.parse(masterSearchFilters.birthStartDate);
        const end = Date.parse(masterSearchFilters.birthEndDate);
        if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
          setMasterSearchError('生年月日の開始日が終了日より後になっています。');
          return;
        }
      }
      if (!trimmedName && !trimmedKana) {
        setMasterSearchError('氏名またはカナを入力してください。');
        return;
      }
      if (!masterSearchFilters.inOut) {
        setMasterSearchError('処理区分（入院/外来）を選択してください。');
        return;
      }
      setMasterSearchError(null);
      await masterSearchMutation.mutateAsync({
        name: trimmedName || undefined,
        kana: trimmedKana || undefined,
        birthStartDate: masterSearchFilters.birthStartDate || undefined,
        birthEndDate: masterSearchFilters.birthEndDate || undefined,
        sex: masterSearchFilters.sex || undefined,
        inOut: masterSearchFilters.inOut || undefined,
      });
    },
    [masterSearchFilters, masterSearchMutation],
  );

  const handleSelectMasterPatient = useCallback(
    (patient: PatientMasterRecord) => {
      setMasterSelected(patient);
      const resolvedPatientId = patient.patientId ?? resolvePatientIdFromRaw(patient.name, patient.kana);
      if (resolvedPatientId) {
        setAcceptPatientId(resolvedPatientId);
        lastAcceptAutoFill.current = {
          ...lastAcceptAutoFill.current,
          patientId: resolvedPatientId,
        };
        setAcceptErrors((prev) => ({ ...prev, patientId: undefined }));
      }
      if (!acceptPaymentMode) {
        const hasInsurance = (patient.insuranceCount ?? 0) > 0 || (patient.publicInsuranceCount ?? 0) > 0;
        setAcceptPaymentMode(hasInsurance ? 'insurance' : 'self');
      }
      if (!acceptVisitKind.trim()) {
        setAcceptVisitKind('1');
      }
      logUiState({
        action: 'patient_master_select',
        screen: 'reception',
        runId: mergedMeta.runId ?? flags.runId,
        details: {
          patientId: patient.patientId,
          name: patient.name,
          kana: patient.kana,
        },
      });
    },
    [acceptPaymentMode, acceptVisitKind, flags.runId, mergedMeta.runId, resolvePatientIdFromRaw],
  );

  useEffect(() => {
    if (!masterSelected?.patientId) return;
    if (!acceptPatientId.trim()) {
      setAcceptPatientId(masterSelected.patientId);
      lastAcceptAutoFill.current = {
        ...lastAcceptAutoFill.current,
        patientId: masterSelected.patientId,
      };
    }
    if (!acceptPaymentMode) {
      const hasInsurance =
        (masterSelected.insuranceCount ?? 0) > 0 || (masterSelected.publicInsuranceCount ?? 0) > 0;
      setAcceptPaymentMode(hasInsurance ? 'insurance' : 'self');
    }
    if (!acceptVisitKind.trim()) {
      setAcceptVisitKind('1');
    }
  }, [acceptPatientId, acceptPaymentMode, acceptVisitKind, masterSelected]);

  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmittedKeyword(keyword.trim());
      appointmentQuery.refetch();
      logUiState({
        action: 'search',
        screen: 'reception/list',
        controlId: 'search-form',
        runId: mergedMeta.runId,
        dataSourceTransition: mergedMeta.dataSourceTransition,
      });
    },
    [appointmentQuery, keyword, mergedMeta.dataSourceTransition, mergedMeta.runId],
  );

  const handleClear = useCallback(() => {
    setKeyword('');
    setSubmittedKeyword('');
    setDepartmentFilter('');
    setPhysicianFilter('');
    setPaymentMode('all');
    setSortKey('time');
  }, []);

  const applySavedView = useCallback(
    (view: OutpatientSavedView) => {
      setSelectedViewId(view.id);
      const nextKeyword = view.filters.keyword ?? '';
      setKeyword(nextKeyword);
      setSubmittedKeyword(nextKeyword);
      setDepartmentFilter(view.filters.department ?? '');
      setPhysicianFilter(view.filters.physician ?? '');
      setPaymentMode(view.filters.paymentMode ?? 'all');
      setSortKey(isSortKey(view.filters.sort) ? (view.filters.sort as SortKey) : 'time');
      setSelectedDate(view.filters.date ?? selectedDate);
      appointmentQuery.refetch();
    },
    [appointmentQuery, selectedDate],
  );

  const handleSaveView = () => {
    const label = savedViewName || `検索 ${new Date().toLocaleString()}`;
    const nextViews = upsertOutpatientSavedView({
      label,
      filters: {
        keyword: keyword.trim() || undefined,
        department: departmentFilter || undefined,
        physician: physicianFilter || undefined,
        paymentMode,
        sort: sortKey,
        date: selectedDate,
      },
    });
    setSavedViews(nextViews);
    const saved = nextViews.find((view) => view.label === label);
    if (saved) setSelectedViewId(saved.id);
    setSavedViewName('');
  };

  const handleDeleteView = () => {
    if (!selectedViewId) return;
    const nextViews = removeOutpatientSavedView(selectedViewId);
    setSavedViews(nextViews);
    setSelectedViewId('');
  };

  const handleMasterSourceChange = useCallback(
    (value: ResolveMasterSource) => {
      const transition = value as DataSourceTransition;
      setDataSourceTransition(transition);
      logUiState({
        action: 'config_delivery',
        screen: 'reception/order-console',
        controlId: 'resolve-master-source',
        dataSourceTransition: transition,
        cacheHit: tonePayload.cacheHit,
        missingMaster: tonePayload.missingMaster,
        runId: mergedMeta.runId,
      });
      logAuditEvent({
        runId: mergedMeta.runId,
        source: 'order-console',
        cacheHit: tonePayload.cacheHit,
        missingMaster: tonePayload.missingMaster,
        dataSourceTransition: transition,
        payload: { resolveMasterSource: value },
      });
    },
    [mergedMeta.runId, setDataSourceTransition, tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster],
  );

  const handleToggleMissingMaster = useCallback(() => {
    const next = !tonePayload.missingMaster;
    setMissingMaster(next);
    logUiState({
      action: 'tone_change',
      screen: 'reception/order-console',
      controlId: 'toggle-missing-master',
      dataSourceTransition: tonePayload.dataSourceTransition,
      cacheHit: tonePayload.cacheHit,
      missingMaster: next,
      runId: mergedMeta.runId,
    });
    logAuditEvent({
      runId: mergedMeta.runId,
      source: 'order-console',
      note: missingMasterNote,
      cacheHit: tonePayload.cacheHit,
      missingMaster: next,
      dataSourceTransition: tonePayload.dataSourceTransition,
    });
  }, [mergedMeta.runId, missingMasterNote, setMissingMaster, tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster]);

  const handleToggleCacheHit = useCallback(() => {
    const next = !tonePayload.cacheHit;
    setCacheHit(next);
    logUiState({
      action: 'tone_change',
      screen: 'reception/order-console',
      controlId: 'toggle-cache-hit',
      dataSourceTransition: tonePayload.dataSourceTransition,
      cacheHit: next,
      missingMaster: tonePayload.missingMaster,
      runId: mergedMeta.runId,
    });
    logAuditEvent({
      runId: mergedMeta.runId,
      source: 'order-console',
      note: missingMasterNote,
      cacheHit: next,
      missingMaster: tonePayload.missingMaster,
      dataSourceTransition: tonePayload.dataSourceTransition,
    });
  }, [mergedMeta.runId, missingMasterNote, setCacheHit, tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster]);

  const handleMissingMasterNoteChange = useCallback(
    (value: string) => {
      setMissingMasterNote(value);
      const selected = selectedEntry;
      logUiState({
        action: 'save',
        screen: 'reception/order-console',
        controlId: 'missing-master-note',
        runId: mergedMeta.runId,
        dataSourceTransition: tonePayload.dataSourceTransition,
        cacheHit: tonePayload.cacheHit,
        missingMaster: tonePayload.missingMaster,
        patientId: selected?.patientId,
        appointmentId: selected?.appointmentId,
        details: { missingMasterNote: value },
      });
      logAuditEvent({
        runId: mergedMeta.runId,
        source: 'order-console-note',
        note: value,
        cacheHit: tonePayload.cacheHit,
        missingMaster: tonePayload.missingMaster,
        dataSourceTransition: tonePayload.dataSourceTransition,
        patientId: selected?.patientId,
        appointmentId: selected?.appointmentId,
        payload: { missingMasterNote: value, receptionId: selected?.receptionId },
      });
    },
    [mergedMeta.runId, selectedEntry, tonePayload.cacheHit, tonePayload.dataSourceTransition, tonePayload.missingMaster],
  );

  const handleRowDoubleClick = useCallback(
    (entry: ReceptionEntry) => {
      const nextRunId = mergedMeta.runId ?? initialRunId ?? flags.runId;
      if (nextRunId) {
        bumpRunId(nextRunId);
      }
      logUiState({
        action: 'navigate',
        screen: 'reception/list',
        controlId: entry.id,
        runId: nextRunId,
        dataSourceTransition: mergedMeta.dataSourceTransition,
        cacheHit: mergedMeta.cacheHit,
        missingMaster: mergedMeta.missingMaster,
        patientId: entry.patientId,
      });
      const url = buildChartsUrlForEntry(entry, nextRunId);
      navigate(url, {
        state: {
          runId: nextRunId,
          patientId: entry.patientId,
          appointmentId: entry.appointmentId,
          receptionId: entry.receptionId,
          visitDate: entry.visitDate,
        },
      });
    },
    [
      bumpRunId,
      buildChartsUrlForEntry,
      enqueue,
      flags.runId,
      initialRunId,
      mergedMeta.cacheHit,
      mergedMeta.dataSourceTransition,
      mergedMeta.missingMaster,
      mergedMeta.runId,
      navigate,
    ],
  );

  const handleRetryQueue = useCallback(
    async (entry: ReceptionEntry) => {
      const patientId = entry.patientId;
      if (!patientId) return;
      const baseRunId = mergedMeta.runId ?? initialRunId ?? flags.runId;
      setRetryingPatientId(patientId);
      const started = performance.now();
      try {
        const data = await retryOrcaQueue(patientId);
        queryClient.setQueryData(ORCA_QUEUE_QUERY_KEY, data);
        const durationMs = Math.round(performance.now() - started);
        const detailParts = [
          data.source ? `source=${data.source}` : undefined,
          `queue=${data.queue.length}`,
          data.verifyAdminDelivery ? 'verify=on' : undefined,
          `duration=${durationMs}ms`,
        ].filter((value): value is string => Boolean(value));
        enqueue({
          tone: 'info',
          message: 'ORCA再送を要求しました',
          detail: detailParts.join(' / '),
        });
        logUiState({
          action: 'orca_queue_retry',
          screen: 'reception/exceptions',
          controlId: 'retry-orca-queue',
          runId: data.runId ?? baseRunId,
          dataSourceTransition: mergedMeta.dataSourceTransition,
          cacheHit: mergedMeta.cacheHit,
          missingMaster: mergedMeta.missingMaster,
          patientId,
          details: {
            queueSource: data.source,
            queueEntries: data.queue.length,
            durationMs,
          },
        });
        logAuditEvent({
          runId: data.runId ?? baseRunId,
          source: 'reception/exceptions',
          patientId,
          payload: {
            action: 'RECEPTION_QUEUE_RETRY',
            result: 'success',
            queueSource: data.source,
            queueEntries: data.queue.length,
            verifyAdminDelivery: data.verifyAdminDelivery,
            durationMs,
          },
        });
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        enqueue({ tone: 'error', message: 'ORCA再送に失敗しました', detail });
        logAuditEvent({
          runId: baseRunId,
          source: 'reception/exceptions',
          patientId,
          payload: {
            action: 'RECEPTION_QUEUE_RETRY',
            result: 'error',
            error: detail,
          },
        });
      } finally {
        setRetryingPatientId(null);
      }
    },
    [
      enqueue,
      flags.runId,
      initialRunId,
      mergedMeta.cacheHit,
      mergedMeta.dataSourceTransition,
      mergedMeta.missingMaster,
      mergedMeta.runId,
      queryClient,
    ],
  );

  const handleOpenChartsNewTab = useCallback(
    (entry: ReceptionEntry, urlOverride?: string) => {
      const guardRunId = mergedMeta.runId ?? initialRunId ?? flags.runId;
      if (!entry.patientId) {
        enqueue({
          id: `reception-open-charts-blocked-${entryKey(entry)}`,
          tone: 'warning',
          message: '患者IDが未設定のため Charts を開けません。',
          detail: '受付情報の患者IDを確認してください。',
        });
        logAuditEvent({
          runId: guardRunId,
          source: 'reception/open-charts',
          cacheHit: mergedMeta.cacheHit,
          missingMaster: mergedMeta.missingMaster,
          dataSourceTransition: mergedMeta.dataSourceTransition,
          appointmentId: entry.appointmentId,
          payload: {
            action: 'RECEPTION_OPEN_CHARTS',
            outcome: 'blocked',
            details: {
              entryKey: entryKey(entry),
              appointmentId: entry.appointmentId,
              receptionId: entry.receptionId,
              blockedReasons: ['missing_patient_id'],
            },
          },
        });
        logUiState({
          action: 'navigate',
          screen: 'reception/list',
          controlId: 'open-charts-new-tab',
          runId: guardRunId,
          details: {
            blockedReason: 'missing_patient_id',
            blockedReasons: ['missing_patient_id'],
            entryKey: entryKey(entry),
          },
        });
        return;
      }
      const nextRunId = guardRunId;
      if (nextRunId) bumpRunId(nextRunId);
      const url = urlOverride ?? buildChartsUrlForEntry(entry, nextRunId);
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      logUiState({
        action: 'navigate',
        screen: 'reception/list',
        controlId: 'open-charts-new-tab',
        runId: nextRunId,
        dataSourceTransition: mergedMeta.dataSourceTransition,
        cacheHit: mergedMeta.cacheHit,
        missingMaster: mergedMeta.missingMaster,
        patientId: entry.patientId,
      });
    },
    [
      bumpRunId,
      buildChartsUrlForEntry,
      flags.runId,
      initialRunId,
      mergedMeta.cacheHit,
      mergedMeta.dataSourceTransition,
      mergedMeta.missingMaster,
      mergedMeta.runId,
    ],
  );

  const handleSelectEntry = useCallback(
    (entry: ReceptionEntry) => {
      setSelectedEntryKey(entryKey(entry));
      setPatientSearchSelected(null);
      setSelectionNotice(null);
      setSelectionLost(false);
      logUiState({
        action: 'history_jump',
        screen: 'reception/exceptions',
        controlId: 'exception-select',
        runId: mergedMeta.runId ?? initialRunId ?? flags.runId,
        patientId: entry.patientId,
        appointmentId: entry.appointmentId,
      });
    },
    [flags.runId, initialRunId, mergedMeta.runId],
  );

  const toggleSection = (status: ReceptionStatus) => {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const handleSelectRow = useCallback(
    (entry: ReceptionEntry) => {
      setSelectedEntryKey(entryKey(entry));
      setPatientSearchSelected(null);
      setSelectionNotice(null);
      setSelectionLost(false);
      if (entry.source === 'unknown') {
        let resolvedPatientId = entry.patientId;
        if (!resolvedPatientId && entry.id.startsWith('master-')) {
          const rawIndex = entry.id.replace('master-', '');
          const index = Number(rawIndex);
          if (Number.isFinite(index)) {
            resolvedPatientId = masterSearchResults[index]?.patientId;
          }
        }
        if (!resolvedPatientId) {
          const matched = masterSearchResults.find(
            (patient) =>
              patient.patientId &&
              patient.name === entry.name &&
              patient.kana === entry.kana,
          );
          resolvedPatientId = matched?.patientId;
        }
        if (resolvedPatientId) {
          setAcceptPatientId(resolvedPatientId);
          lastAcceptAutoFill.current = { ...lastAcceptAutoFill.current, patientId: resolvedPatientId };
        }
        if (!acceptPaymentMode) {
          const hasInsurance = resolvePaymentMode(entry.insurance ?? undefined) ?? 'self';
          setAcceptPaymentMode(hasInsurance === 'self' ? 'self' : 'insurance');
        }
        if (!acceptVisitKind.trim()) {
          setAcceptVisitKind('1');
        }
      }
    },
    [acceptPaymentMode, acceptVisitKind, masterSearchResults],
  );

  return (
    <>
      <Global styles={receptionStyles} />
      <main className="reception-page" data-run-id={resolvedRunId}>
        <a className="skip-link" href="#reception-results">
          検索結果へスキップ
        </a>
        <a className="skip-link" href="#reception-sidepane">
          右ペインへスキップ
        </a>
        <section className="reception-page__header">
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="reception-page__meta-bar" role="status" aria-live={infoLive} data-run-id={resolvedRunId}>
            <RunIdBadge runId={resolvedRunId} />
            <StatusPill
              className="reception-pill"
              label="dataSourceTransition"
              value={metaDataSourceTransition}
              tone={resolveTransitionTone()}
              runId={resolvedRunId}
            />
            <StatusPill
              className="reception-pill"
              label="missingMaster"
              value={String(metaMissingMaster)}
              tone={resolveMetaFlagTone(metaMissingMaster)}
              runId={resolvedRunId}
            />
            <StatusPill
              className="reception-pill"
              label="cacheHit"
              value={String(metaCacheHit)}
              tone={resolveCacheHitTone(metaCacheHit)}
              runId={resolvedRunId}
            />
            <AuditSummaryInline
              auditEvent={latestAuditEvent}
              className="reception-pill"
              variant="inline"
              label="監査サマリ"
              runId={resolvedRunId}
            />
            <StatusPill
              className="reception-pill"
              label="最終更新"
              value={appointmentUpdatedAtLabel}
              tone="neutral"
              runId={resolvedRunId}
            />
            <button
              type="button"
              className={`reception-exception-indicator${exceptionCounts.total > 0 ? ' is-active' : ''}`}
              data-tone={exceptionIndicatorTone}
              onClick={openExceptionsModal}
              aria-label={`例外一覧を開く（${exceptionCounts.total}件）`}
              title={`送信エラー:${exceptionCounts.sendError} / 遅延:${exceptionCounts.delayed} / 未承認:${exceptionCounts.unapproved}`}
            >
              <span className="reception-exception-indicator__icon" aria-hidden="true">
                !
              </span>
              <span className="reception-exception-indicator__label">例外</span>
              <span className="reception-exception-indicator__count">{exceptionCounts.total}</span>
            </button>
          </div>
          {(appointmentErrorContext ||
            unlinkedWarning ||
            intentBanner ||
            broadcast ||
            appointmentAutoRefreshNotice) && (
            <div className="reception-page__alerts" role="region" aria-label="警告/通知">
              {appointmentErrorContext && (
                <ApiFailureBanner
                  subject="外来リスト"
                  destination="Reception"
                  runId={appointmentQuery.data?.runId ?? flags.runId}
                  nextAction="再取得"
                  retryLabel="再取得"
                  onRetry={() => appointmentQuery.refetch()}
                  isRetrying={appointmentQuery.isFetching}
                  {...appointmentErrorContext}
                />
              )}
              {unlinkedWarning && (
                <ToneBanner
                  tone="warning"
                  message={unlinkedWarning.message}
                  destination="Reception"
                  nextAction="一覧を確認"
                  runId={mergedMeta.runId}
                  ariaLive="assertive"
                />
              )}
              <AdminBroadcastBanner broadcast={broadcast} surface="reception" runId={resolvedRunId} />
              {intentBanner && (
                <ToneBanner
                  tone={intentBanner.tone}
                  message={intentBanner.message}
                  patientId={intentKeyword || undefined}
                  destination="Reception"
                  nextAction={intentBanner.nextAction}
                  runId={flags.runId}
                  ariaLive={intentBanner.tone === 'info' ? 'polite' : 'assertive'}
                />
              )}
              {appointmentAutoRefreshNotice && (
                <ToneBanner
                  tone={appointmentAutoRefreshNotice.tone}
                  message={appointmentAutoRefreshNotice.message}
                  destination="Reception"
                  nextAction={appointmentAutoRefreshNotice.nextAction}
                  runId={resolvedRunId}
                />
              )}
            </div>
          )}
        </section>

        <section className="reception-layout" id="reception-results" tabIndex={-1}>
          <div className="reception-layout__main">
            {debugUiEnabled ? (
            <section className="reception-master" aria-label="患者マスタ検索" data-run-id={resolvedRunId}>
              <header className="reception-master__header">
                <div>
                  <h2>患者マスタ検索（name-search）</h2>
                  <p className="reception-master__lead">
                    /orca/patients/name-search で患者マスタを検索し、選択した患者IDを受付登録へ反映します。
                  </p>
                </div>
                <div className="reception-master__meta">
                  <RunIdBadge runId={resolvedRunId} />
                  <StatusPill
                    className="reception-pill"
                    label="recordsReturned"
                    value={String(masterSearchMeta?.recordsReturned ?? masterSearchResults.length ?? 0)}
                    tone="neutral"
                    runId={resolvedRunId}
                  />
                </div>
              </header>

              <form className="reception-master__form" onSubmit={handleMasterSearchSubmit}>
                <div className="reception-master__form-row">
                  <label className="reception-master__field">
                    <span>氏名</span>
                    <input
                      id="reception-master-name"
                      name="receptionMasterName"
                      type="text"
                      value={masterSearchFilters.name}
                      onChange={(event) => setMasterSearchFilters((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="山田 太郎"
                    />
                  </label>
                  <label className="reception-master__field">
                    <span>カナ</span>
                    <input
                      id="reception-master-kana"
                      name="receptionMasterKana"
                      type="text"
                      value={masterSearchFilters.kana}
                      onChange={(event) => setMasterSearchFilters((prev) => ({ ...prev, kana: event.target.value }))}
                      placeholder="ヤマダ タロウ"
                    />
                  </label>
                  <label className="reception-master__field">
                    <span>生年月日（開始）</span>
                    <input
                      id="reception-master-birth-start"
                      name="receptionMasterBirthStart"
                      type="date"
                      value={masterSearchFilters.birthStartDate}
                      onChange={(event) =>
                        setMasterSearchFilters((prev) => ({ ...prev, birthStartDate: event.target.value }))
                      }
                    />
                  </label>
                  <label className="reception-master__field">
                    <span>生年月日（終了）</span>
                    <input
                      id="reception-master-birth-end"
                      name="receptionMasterBirthEnd"
                      type="date"
                      value={masterSearchFilters.birthEndDate}
                      onChange={(event) =>
                        setMasterSearchFilters((prev) => ({ ...prev, birthEndDate: event.target.value }))
                      }
                    />
                  </label>
                  <label className="reception-master__field">
                    <span>性別</span>
                    <select
                      id="reception-master-sex"
                      name="receptionMasterSex"
                      value={masterSearchFilters.sex}
                      onChange={(event) => setMasterSearchFilters((prev) => ({ ...prev, sex: event.target.value }))}
                    >
                      <option value="">指定なし</option>
                      <option value="M">男性</option>
                      <option value="F">女性</option>
                      <option value="O">その他</option>
                    </select>
                  </label>
                  <label className="reception-master__field">
                    <span>
                      区分<span className="reception-master__required">必須</span>
                    </span>
                    <select
                      id="reception-master-inout"
                      name="receptionMasterInOut"
                      value={masterSearchFilters.inOut}
                      onChange={(event) => setMasterSearchFilters((prev) => ({ ...prev, inOut: event.target.value }))}
                    >
                      <option value="">選択してください</option>
                      <option value="2">外来(2)</option>
                      <option value="1">入院(1)</option>
                    </select>
                  </label>
                </div>
                <div className="reception-master__actions">
                  <div className="reception-master__hints" aria-live={infoLive}>
                    <span>氏名またはカナは必須です。</span>
                    <span>処理区分（入院/外来）も必須です。</span>
                    {masterSearchError ? <span className="reception-master__error">{masterSearchError}</span> : null}
                  </div>
                  <div className="reception-master__buttons">
                    <button
                      type="button"
                      className="reception-search__button ghost"
                      onClick={() => {
                        const el = document.getElementById('reception-accept');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      受付登録へ
                    </button>
                    <button
                      type="button"
                      className="reception-search__button ghost"
                      onClick={() => {
                        setMasterSearchFilters({
                          name: '',
                          kana: '',
                          birthStartDate: '',
                          birthEndDate: '',
                          sex: '',
                          inOut: '2',
                        });
                        setMasterSearchResults([]);
                        setMasterSearchMeta(null);
                        setMasterSelected(null);
                        setMasterSearchNotice(null);
                        setMasterSearchError(null);
                      }}
                    >
                      クリア
                    </button>
                    <button type="submit" className="reception-search__button primary" disabled={masterSearchMutation.isPending}>
                      {masterSearchMutation.isPending ? '検索中…' : '患者検索'}
                    </button>
                  </div>
                </div>
              </form>

              {masterSearchNotice ? (
                <ToneBanner
                  tone={masterSearchNotice.tone}
                  message={masterSearchNotice.message}
                  destination="Reception"
                  nextAction="検索結果を確認"
                  runId={masterSearchMeta?.runId ?? resolvedRunId}
                />
              ) : null}

              <div className="reception-master__results" role="status" aria-live={infoLive}>
                <div className="reception-master__results-meta">
                  <span>Api_Result: {masterSearchMeta?.apiResult ?? '—'}</span>
                  <span>Api_Result_Message: {masterSearchMeta?.apiResultMessage ?? '—'}</span>
                  <span>records: {masterSearchMeta?.recordsReturned ?? masterSearchResults.length}</span>
                  <span>fetchedAt: {masterSearchMeta?.fetchedAt ?? '—'}</span>
                </div>
                {masterSearchResults.length === 0 ? (
                  <p className="reception-master__empty">検索結果がありません。条件を見直してください。</p>
                ) : (
                  <div className="reception-master__list" role="list">
                    {masterSearchResults.map((patient, index) => {
                      const key = patient.patientId ?? `${patient.name ?? 'unknown'}-${index}`;
                      const isSelected = masterSelected?.patientId === patient.patientId && Boolean(patient.patientId);
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`reception-master__row${isSelected ? ' is-selected' : ''}`}
                          onClick={() => handleSelectMasterPatient(patient)}
                          disabled={!patient.patientId}
                        >
                          <div className="reception-master__row-main">
                            <strong>{patient.name ?? '氏名未登録'}</strong>
                            <span>{patient.kana ?? 'カナ未登録'}</span>
                          </div>
                          <div className="reception-master__row-meta">
                            <span>患者ID: {patient.patientId ?? '未登録'}</span>
                            <span>生年月日: {patient.birthDate ?? '—'}</span>
                            <span>性別: {patient.sex ?? '—'}</span>
                            <span>保険: {patient.insuranceCount ?? 0}件</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
            ) : null}
            <section
              className={`reception-search${filtersCollapsed ? ' is-collapsed' : ''}`}
              aria-label="検索とフィルタ"
              data-collapsed={filtersCollapsed ? 'true' : 'false'}
            >
              <header className="reception-search__header">
                <div className="reception-search__header-main">
                  <h2>検索/フィルタ</h2>
                  <div className="reception-search__header-meta" aria-live={infoLive}>
                    <span>日付: {selectedDate || '—'}</span>
                    <span>kw: {keyword.trim() || '—'}</span>
                    <span>科: {departmentFilter || 'すべて'}</span>
                    <span>医: {physicianFilter || 'すべて'}</span>
                    <span>
                      支払: {paymentMode === 'all' ? 'すべて' : paymentMode === 'insurance' ? '保険' : '自費'}
                    </span>
                    <span>sort: {sortKey}</span>
                  </div>
                  <span className="reception-search__header-summary" aria-live={infoLive}>
                    {summaryText}
                    {appointmentQuery.isFetching ? ' (更新中…)' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className="reception-search__button ghost"
                  onClick={() => setFiltersCollapsed((prev) => !prev)}
                  aria-expanded={!filtersCollapsed}
                >
                  {filtersCollapsed ? '開く' : '折りたたむ'}
                </button>
              </header>
              {!filtersCollapsed ? (
                <>
                  <form className="reception-search__form" onSubmit={handleSearchSubmit}>
                    <div className="reception-search__row">
                      <label className="reception-search__field">
                        <span>日付</span>
                        <input
                          id="reception-search-date"
                          name="receptionSearchDate"
                          type="date"
                          value={selectedDate}
                          onChange={(event) => setSelectedDate(event.target.value)}
                          required
                        />
                      </label>
                      <label className="reception-search__field">
                        <span>検索（患者ID/氏名/カナ）</span>
                        <input
                          id="reception-search-keyword"
                          name="receptionSearchKeyword"
                          type="search"
                          value={keyword}
                          onChange={(event) => setKeyword(event.target.value)}
                          placeholder="PX-0001 / 山田 / ヤマダ"
                        />
                      </label>
                      <label className="reception-search__field">
                        <span>診療科</span>
                        <select
                          id="reception-search-department"
                          name="receptionSearchDepartment"
                          value={departmentFilter}
                          onChange={(event) => setDepartmentFilter(event.target.value)}
                        >
                          <option value="">すべて</option>
                          {uniqueDepartments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="reception-search__field">
                        <span>担当医</span>
                        <select
                          id="reception-search-physician"
                          name="receptionSearchPhysician"
                          value={physicianFilter}
                          onChange={(event) => setPhysicianFilter(event.target.value)}
                        >
                          <option value="">すべて</option>
                          {uniquePhysicians.map((physician) => (
                            <option key={physician} value={physician}>
                              {physician}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="reception-search__field">
                        <span>保険/自費</span>
                        <select
                          id="reception-search-payment-mode"
                          name="receptionSearchPaymentMode"
                          value={paymentMode}
                          onChange={(event) => setPaymentMode(normalizePaymentMode(event.target.value))}
                        >
                          <option value="all">すべて</option>
                          <option value="insurance">保険</option>
                          <option value="self">自費</option>
                        </select>
                      </label>
                      <label className="reception-search__field">
                        <span>ソート</span>
                        <select
                          id="reception-search-sort"
                          name="receptionSearchSort"
                          value={sortKey}
                          onChange={(event) => setSortKey(event.target.value as SortKey)}
                        >
                          <option value="time">受付/予約時間</option>
                          <option value="name">氏名</option>
                          <option value="department">診療科</option>
                        </select>
                      </label>
                    </div>
                    <div className="reception-search__actions">
                      <button type="submit" className="reception-search__button primary">
                        検索
                      </button>
                      <button
                        type="button"
                        className="reception-search__button ghost"
                        onClick={() => appointmentQuery.refetch()}
                      >
                        再取得
                      </button>
                      <button type="button" className="reception-search__button ghost" onClick={handleClear}>
                        クリア
                      </button>
                      <button
                        type="button"
                        className="reception-search__button ghost"
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (keyword) params.set('kw', keyword);
                          if (departmentFilter) params.set('dept', departmentFilter);
                          if (physicianFilter) params.set('phys', physicianFilter);
                          if (paymentMode !== 'all') params.set('pay', paymentMode);
                          if (sortKey) params.set('sort', sortKey);
                          if (selectedDate) params.set('date', selectedDate);
                          params.set('from', 'reception');
                          navigate(`${buildFacilityPath(session.facilityId, '/patients')}?${params.toString()}`);
                        }}
                      >
                        Patients へ
                      </button>
                    </div>
                  </form>
                  <div className="reception-search__saved" aria-label="保存ビュー">
                    <div className="reception-search__saved-meta" role="status" aria-live={infoLive}>
                      <span className="reception-search__saved-share">Reception ↔ Patients で共有</span>
                      <span className="reception-search__saved-updated">
                        {selectedSavedView ? `選択中の更新: ${savedViewUpdatedAtLabel ?? '—'}` : '選択中のビューはありません'}
                      </span>
                    </div>
                    <div className="reception-search__saved-row">
                      <label className="reception-search__field">
                        <span>保存ビュー</span>
                        <select
                          id="reception-search-saved-view"
                          name="receptionSearchSavedView"
                          value={selectedViewId}
                          onChange={(event) => setSelectedViewId(event.target.value)}
                        >
                          <option value="">選択してください</option>
                          {savedViews.map((view) => (
                            <option key={view.id} value={view.id}>
                              {view.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="reception-search__button ghost"
                        onClick={() => {
                          const view = savedViews.find((item) => item.id === selectedViewId);
                          if (view) applySavedView(view);
                        }}
                        disabled={!selectedViewId}
                      >
                        適用
                      </button>
                      <button
                        type="button"
                        className="reception-search__button ghost"
                        onClick={handleDeleteView}
                        disabled={!selectedViewId}
                      >
                        削除
                      </button>
                    </div>
                    <div className="reception-search__saved-row">
                      <label className="reception-search__field">
                        <span>ビュー名</span>
                        <input
                          id="reception-search-saved-view-name"
                          name="receptionSearchSavedViewName"
                          value={savedViewName}
                          onChange={(event) => setSavedViewName(event.target.value)}
                          placeholder="例: 内科/午前/保険"
                        />
                      </label>
                      <button type="button" className="reception-search__button primary" onClick={handleSaveView}>
                        現在の条件を保存
                      </button>
                    </div>
                  </div>
                  <div className="reception-summary" aria-live={infoLive} ref={summaryRef} tabIndex={-1}>
                    <div className="reception-summary__main">
                      <strong>{summaryText}</strong>
                      {appointmentQuery.isFetching && <span className="reception-summary__state">更新中…</span>}
                    </div>
                    <div className="reception-summary__meta">
                      <span>最終更新: {appointmentUpdatedAtLabel}</span>
                      <span>自動更新: {autoRefreshIntervalLabel}</span>
                      <span>選択保持: {selectedEntry ? '保持中' : '未選択'}</span>
                    </div>
                  </div>
                  {!appointmentQuery.isLoading && sortedEntries.length === 0 && (
                    <p className="reception-summary__empty" role="status" aria-live={infoLive}>
                      0件です。日付やキーワードを見直してください。
                      <span className="reception-summary__empty-hint">
                        ヒント: 診療科・担当医・保険/自費を先に絞ると探しやすくなります。
                      </span>
                    </p>
                  )}
                  {appointmentQuery.isLoading && (
                    <p role="status" aria-live={infoLive} className="reception-status">
                      外来リストを読み込み中…
                    </p>
                  )}
                </>
              ) : null}
            </section>

            <section className="reception-selection" aria-live={infoLive} aria-atomic="true">
              <div className="reception-selection__main">
                <span className="reception-selection__label">選択中</span>
                <strong>{selectedEntry?.name ?? '未選択'}</strong>
                <span className="reception-selection__meta">{selectionSummaryShort}</span>
              </div>
              <div className="reception-selection__actions">
                <button
                  type="button"
                  className="reception-selection__button"
                  onClick={() => {
                    if (!selectedEntry) return;
                    handleOpenChartsNewTab(selectedEntry);
                  }}
                  disabled={!selectedEntry || !selectedEntry.patientId}
                  title={
                    !selectedEntry
                      ? '患者を選択してください'
                      : selectedEntry.patientId
                        ? 'Charts を新規タブで開く'
                        : '患者IDが未登録のため新規タブを開けません'
                  }
                >
                  Charts 新規タブ
                </button>
                <button
                  type="button"
                  className="reception-selection__button danger"
                  onClick={() => void handleCancelSelectedEntry()}
                  disabled={
                    isAcceptSubmitting ||
                    !selectedEntry?.patientId ||
                    !selectedEntry?.receptionId ||
                    selectedEntry?.status === '予約'
                  }
                  title={
                    isAcceptSubmitting
                      ? '送信中です'
                      : !selectedEntry
                        ? '患者を選択してください'
                        : !selectedEntry.patientId
                          ? '患者IDが未登録のため取消できません'
                          : selectedEntry.status === '予約'
                            ? '予約は受付取消できません'
                            : selectedEntry.receptionId
                              ? '受付取消（一覧選択 → 取消）'
                              : '受付IDが未登録のため取消できません'
                  }
                  data-test-id="reception-cancel-selected"
                >
                  受付取消
                </button>
                <button
                  type="button"
                  className="reception-search__button ghost"
                  onClick={() => {
                    if (!selectedEntry?.patientId) return;
                    openMedicalRecordsModal(
                      { patientId: selectedEntry.patientId, name: selectedEntry.name },
                      'selection',
                    );
                  }}
                  disabled={!selectedEntry?.patientId}
                  title={selectedEntry?.patientId ? '過去カルテをモーダルで確認' : '患者IDが未登録のため過去カルテを表示できません'}
                >
                  過去カルテ
                </button>
                <span className="reception-selection__hint">
                  行クリックで右ペイン更新 / ダブルクリック・Enter で Charts（新規タブ）
                </span>
                {selectionNotice && (
                  <span
                    className={`reception-selection__notice reception-selection__notice--${selectionNotice.tone}`}
                    role="status"
                    aria-live={selectionNotice.tone === 'warning' ? 'assertive' : 'polite'}
                  >
                    {selectionNotice.message}
                  </span>
                )}
              </div>
            </section>

            <div className="reception-board" role="region" aria-label="ステータス別患者一覧">
              {grouped.map(({ status, items }) => (
                <section
                  key={status}
                  className="reception-board__column"
                  data-status={status}
                  aria-label={`${SECTION_LABEL[status]} ${items.length}件`}
                >
                  <header className="reception-board__header">
                    <div className="reception-board__title">
                      <h2>{SECTION_LABEL[status]}</h2>
                      <span className="reception-board__count" aria-live={infoLive}>
                        {items.length}件
                      </span>
                    </div>
                    <button
                      type="button"
                      className="reception-board__toggle"
                      aria-expanded={!collapsed[status]}
                      onClick={() => toggleSection(status)}
                    >
                      {collapsed[status] ? '開く' : '折りたたむ'}
                    </button>
                  </header>
                  {!collapsed[status] && (
                    <div className="reception-board__body" role="list" aria-label={`${SECTION_LABEL[status]}の患者一覧`}>
                      {items.length === 0 ? (
                        <p className="reception-board__empty">該当なし</p>
                      ) : (
                        items.map((entry) => {
                          const bundle = resolveBundleForEntry(entry);
                          const paymentLabel = paymentModeLabel(entry.insurance);
                          const canOpenCharts = Boolean(entry.patientId);
                          const orcaQueueEntry = entry.patientId ? orcaQueueByPatientId.get(entry.patientId) : undefined;
                          const orcaQueueStatus = orcaQueueErrorStatus ?? resolveOrcaQueueStatus(orcaQueueEntry);
                          const mvpDecision = isReceptionStatusMvpEnabled
                            ? resolveRec001MvpDecision({
                                missingMaster: metaMissingMaster,
                                orcaQueueErrorMessage,
                                orcaQueueStatus,
                                orcaQueueEntry,
                              })
                            : null;
                          const cached = entry.patientId ? claimSendCache[entry.patientId] : null;
                          const isSelected = selectedEntryKey === entryKey(entry);
                          const rowKey =
                            entryKey(entry) ??
                            `${entry.patientId ?? 'unknown'}-${entry.appointmentTime ?? entry.department ?? 'card'}`;
                          const activeQueue = orcaQueueStatus;
                          return (
                            <div
                              key={rowKey}
                              tabIndex={0}
                              role="button"
                              aria-pressed={isSelected}
                              className={`reception-card${isSelected ? ' is-selected' : ''}`}
                              data-test-id="reception-entry-card"
                              data-patient-id={entry.patientId ?? ''}
                              data-reception-status={status}
                              aria-label={`${entry.name ?? '患者'} ${entry.patientId ?? ''}`}
                              onClick={() => handleSelectRow(entry)}
                              onDoubleClick={() => handleRowDoubleClick(entry)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  handleRowDoubleClick(entry);
                                }
                                if (event.key === ' ') {
                                  event.preventDefault();
                                  handleSelectRow(entry);
                                }
                              }}
                            >
                              <div className="reception-card__head">
                                <span className="reception-card__time">{entry.appointmentTime ?? '—'}</span>
                                <span
                                  className={`reception-badge reception-badge--${status}`}
                                  aria-label={`状態: ${SECTION_LABEL[status]}`}
                                >
                                  {isReceptionStatusMvpEnabled ? (
                                    <span className="reception-status-mvp" data-test-id="reception-status-mvp">
                                      <span className="reception-status-mvp__dot" aria-hidden="true" data-status={status} />
                                      <span className="reception-status-mvp__label">{SECTION_LABEL[status]}</span>
                                    </span>
                                  ) : (
                                    SECTION_LABEL[status]
                                  )}
                                </span>
                              </div>
                              <div className="reception-card__name">
                                <strong>{entry.name ?? '未登録'}</strong>
                                {entry.kana ? <small>{entry.kana}</small> : null}
                              </div>
                              <div className="reception-card__meta">
                                <span>
                                  患者ID: <code>{entry.patientId ?? '—'}</code>
                                </span>
                                {entry.receptionId ? (
                                  <span>
                                    受付ID: <code>{entry.receptionId}</code>
                                  </span>
                                ) : null}
                                {entry.appointmentId ? (
                                  <span>
                                    予約ID: <code>{entry.appointmentId}</code>
                                  </span>
                                ) : null}
                                <span>{entry.department ?? '—'}</span>
                                {entry.physician ? <span>担当: {entry.physician}</span> : null}
                                <span>直近: {resolveLastVisitForEntry(entry)}</span>
                              </div>
                              <div className="reception-card__signals">
                                <StatusPill className="reception-pill" ariaLabel={`支払区分: ${paymentLabel}`} runId={resolvedRunId}>
                                  {paymentLabel}
                                </StatusPill>
                                {bundle?.claimStatus || bundle?.claimStatusText ? (
                                  <small>請求: {bundle.claimStatus ?? bundle.claimStatusText}</small>
                                ) : null}
                                {cached?.invoiceNumber ? <small>invoice: {cached.invoiceNumber}</small> : null}
                                {cached?.dataId ? <small>data: {cached.dataId}</small> : null}
                                {cached?.sendStatus ? (
                                  <small>ORCA送信: {cached.sendStatus === 'success' ? '成功' : '失敗'}</small>
                                ) : null}
                                <span className={`reception-queue reception-queue--${activeQueue.tone}`}>{activeQueue.label}</span>
                                {activeQueue.detail ? <small>{truncateText(activeQueue.detail, 44)}</small> : null}
                              </div>
                              {isReceptionStatusMvpPhase2 && mvpDecision ? (
                                <div className="reception-status-mvp__next" data-tone={mvpDecision.tone}>
                                  <span className="reception-status-mvp__next-label">次:</span>
                                  <strong className="reception-status-mvp__next-action">{mvpDecision.nextAction}</strong>
                                  {mvpDecision.detail ? (
                                    <small className="reception-status-mvp__next-detail">{truncateText(mvpDecision.detail, 44)}</small>
                                  ) : null}
                                </div>
                              ) : null}
                              <div className="reception-card__actions">
                                {isReceptionStatusMvpPhase2 && mvpDecision?.canRetry ? (
                                  <button
                                    type="button"
                                    className="reception-card__action warning"
                                    data-test-id="reception-status-mvp-retry"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleRetryQueue(entry);
                                    }}
                                    title={mvpDecision.retryTitle ?? 'ORCA再送を要求します'}
                                  >
                                    再送
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="reception-card__action"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenChartsNewTab(entry);
                                  }}
                                  disabled={!canOpenCharts}
                                  title={canOpenCharts ? 'Charts を新規タブで開く' : '患者IDが未登録のため新規タブを開けません'}
                                >
                                  Charts
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </section>
              ))}
            </div>

            {debugUiEnabled ? (
              <>
                {grouped.map(({ status, items }, index) => {
              const sectionId = `reception-section-${index}`;
              const tableHelpId = `${sectionId}-help`;
              const tableStatusId = `${sectionId}-status`;
              const tableLabelId = `${sectionId}-label`;
              const tableStatusText =
                selectedEntry && selectedEntry.status === status
                  ? selectionSummaryText
                  : `${SECTION_LABEL[status]} ${items.length}件`;
              return (
              <section key={status} className="reception-section" aria-label={`${SECTION_LABEL[status]}リスト`}>
                <header className="reception-section__header">
                  <div>
                    <h2 id={tableLabelId}>{SECTION_LABEL[status]}</h2>
                    <span className="reception-section__count" aria-live={infoLive}>
                      {items.length} 件
                    </span>
                  </div>
                  <button
                    type="button"
                    className="reception-section__toggle"
                    aria-expanded={!collapsed[status]}
                    onClick={() => toggleSection(status)}
                  >
                    {collapsed[status] ? '開く' : '折りたたむ'}
                  </button>
                </header>
                {!collapsed[status] && (
                  <div
                    className="reception-table__wrapper"
                    role="region"
                    tabIndex={0}
                    aria-labelledby={tableLabelId}
                  >
                    <p id={tableHelpId} className="sr-only">
                      行クリックで右ペインを更新し、ダブルクリックまたは Enter で Charts（新規タブ）へ移動します。
                    </p>
                    <p id={tableStatusId} className="sr-only" role="status" aria-live={infoLive} aria-atomic="true">
                      {tableStatusText}
                    </p>
                    <table className="reception-table" aria-describedby={`${tableHelpId} ${tableStatusId}`}>
                      <thead>
                        <tr>
                          <th scope="col">状態</th>
                          <th scope="col">ID</th>
                          <th scope="col">氏名</th>
                          <th scope="col">来院/科</th>
                          <th scope="col">支払</th>
                          {claimOutpatientEnabled && <th scope="col">請求</th>}
                          <th scope="col">メモ/参照</th>
                          <th scope="col">直近</th>
                          <th scope="col">ORCA</th>
                          <th scope="col">Charts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 && (
                          <tr>
                            <td colSpan={tableColCount} className="reception-table__empty">
                              該当なし
                            </td>
                          </tr>
                        )}
                        {items.map((entry) => {
                          const queueStatus = resolveQueueStatusForEntry(entry);
                          const bundle = resolveBundleForEntry(entry);
                          const paymentLabel = paymentModeLabel(entry.insurance);
                          const canOpenCharts = Boolean(entry.patientId);
                          const orcaQueueEntry = entry.patientId ? orcaQueueByPatientId.get(entry.patientId) : undefined;
                          const orcaQueueStatus = orcaQueueErrorStatus ?? resolveOrcaQueueStatus(orcaQueueEntry);
                          const mvpDecision = isReceptionStatusMvpEnabled
                            ? resolveRec001MvpDecision({
                                missingMaster: metaMissingMaster,
                                orcaQueueErrorMessage,
                                orcaQueueStatus,
                                orcaQueueEntry,
                              })
                            : null;
                          const fallbackAppointmentId =
                            entry.receptionId ? undefined : entry.appointmentId ?? (entry.id ? String(entry.id) : undefined);
                          const isSelected = selectedEntryKey === entryKey(entry);
                          const rowKey =
                            entryKey(entry) ??
                            `${entry.patientId ?? 'unknown'}-${entry.appointmentTime ?? entry.department ?? 'row'}`;
                          return (
                            <tr
                              key={rowKey}
                              tabIndex={0}
                              className={`reception-table__row${isSelected ? ' reception-table__row--selected' : ''}`}
                              onClick={() => handleSelectRow(entry)}
                              onDoubleClick={() => handleRowDoubleClick(entry)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  handleRowDoubleClick(entry);
                                }
                              }}
                              aria-selected={isSelected}
                              aria-label={`${entry.name ?? '患者'} ${entry.appointmentTime ?? ''} ${entry.department ?? ''}`}
                            >
                              <td>
                                <div className="reception-table__status">
                                  <span
                                    className={`reception-badge reception-badge--${status}`}
                                    aria-label={`状態: ${SECTION_LABEL[status]}`}
                                  >
                                    {isReceptionStatusMvpEnabled ? (
                                      <span className="reception-status-mvp" data-test-id="reception-status-mvp">
                                        <span className="reception-status-mvp__dot" aria-hidden="true" data-status={status} />
                                        <span className="reception-status-mvp__label">{SECTION_LABEL[status]}</span>
                                      </span>
                                    ) : (
                                      SECTION_LABEL[status]
                                    )}
                                  </span>
                                  {isReceptionStatusMvpPhase2 && mvpDecision ? (
                                    <div className="reception-status-mvp__next" data-tone={mvpDecision.tone}>
                                      <span className="reception-status-mvp__next-label">次:</span>
                                      <strong className="reception-status-mvp__next-action">{mvpDecision.nextAction}</strong>
                                      {mvpDecision.detail ? (
                                        <small className="reception-status-mvp__next-detail">{truncateText(mvpDecision.detail, 44)}</small>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                              <td>
                                <PatientMetaRow
                                  as="div"
                                  className="reception-table__id"
                                  patientId={entry.patientId ?? '未登録'}
                                  receptionId={entry.receptionId}
                                  appointmentId={fallbackAppointmentId}
                                  showLabels
                                  separator="slash"
                                  runId={resolvedRunId}
                                  itemClassName="reception-table__id-item"
                                  labelClassName="reception-table__id-label"
                                  valueClassName="reception-table__id-value"
                                />
                              </td>
                              <td>
                                <div className="reception-table__patient">
                                  <strong>{entry.name ?? '未登録'}</strong>
                                  {entry.kana && <small>{entry.kana}</small>}
                                </div>
                              </td>
                              <td>
                                <div className="reception-table__time">{entry.appointmentTime ?? '-'}</div>
                                <small className="reception-table__sub">{entry.department ?? '-'}</small>
                              </td>
                              <td className="reception-table__insurance">
                                <StatusPill className="reception-pill" ariaLabel={`支払区分: ${paymentLabel}`} runId={resolvedRunId}>
                                  {paymentLabel}
                                </StatusPill>
                                <small className="reception-table__sub">{entry.insurance ?? '—'}</small>
                              </td>
                              {claimOutpatientEnabled && (
                                <td className="reception-table__claim">
                                  <div>{bundle?.claimStatus ?? bundle?.claimStatusText ?? '未取得'}</div>
                                  {bundle?.bundleNumber && <small className="reception-table__sub">B: {bundle.bundleNumber}</small>}
                                  {(() => {
                                    const cached = entry.patientId ? claimSendCache[entry.patientId] : null;
                                    if (!cached) return null;
                                    return (
                                      <>
                                        {cached.invoiceNumber && (
                                          <small className="reception-table__sub">I: {cached.invoiceNumber}</small>
                                        )}
                                        {cached.dataId && <small className="reception-table__sub">D: {cached.dataId}</small>}
                                        {cached.sendStatus && (
                                          <small className="reception-table__sub">
                                            送信: {cached.sendStatus === 'success' ? '成功' : '失敗'}
                                          </small>
                                        )}
                                      </>
                                    );
                                  })()}
                                </td>
                              )}
                              <td className="reception-table__note">
                                {entry.note ? truncateText(entry.note, 36) : '—'}
                                <div className="reception-table__source">src: {entry.source}</div>
                              </td>
                              <td className="reception-table__last">{resolveLastVisitForEntry(entry)}</td>
                              <td className="reception-table__queue">
                                {isReceptionStatusMvpEnabled ? (
                                  <>
                                    <span
                                      className={`reception-queue reception-queue--${orcaQueueStatus.tone}`}
                                      aria-label={`ORCAキュー: ${orcaQueueStatus.label}${orcaQueueStatus.detail ? ` ${orcaQueueStatus.detail}` : ''}`}
                                    >
                                      {orcaQueueStatus.label}
                                    </span>
                                    {orcaQueueStatus.detail && <small className="reception-table__sub">{orcaQueueStatus.detail}</small>}
                                  </>
                                ) : (
                                  <>
                                    <span
                                      className={`reception-queue reception-queue--${queueStatus.tone}`}
                                      aria-label={`ORCAキュー: ${queueStatus.label}${queueStatus.detail ? ` ${queueStatus.detail}` : ''}`}
                                    >
                                      {queueStatus.label}
                                    </span>
                                    {queueStatus.detail && <small className="reception-table__sub">{queueStatus.detail}</small>}
                                  </>
                                )}
                              </td>
                              <td className="reception-table__action">
                                {isReceptionStatusMvpPhase2 && mvpDecision?.canRetry ? (
                                  <button
                                    type="button"
                                    className="reception-table__action-button warning"
                                    data-test-id="reception-status-mvp-retry"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleRetryQueue(entry);
                                    }}
                                    title={mvpDecision.retryTitle ?? 'ORCA再送を要求します'}
                                  >
                                    再送
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="reception-table__action-button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenChartsNewTab(entry);
                                  }}
                                  disabled={!canOpenCharts}
                                  title={canOpenCharts ? 'Charts を新規タブで開く' : '患者IDが未登録のため新規タブを開けません'}
                                >
                                  Charts 新規タブ
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )})}
              </>
            ) : null}
          </div>

          <aside className="reception-layout__side" aria-label="右ペイン" id="reception-sidepane" tabIndex={-1}>
            <section
              className="reception-accept"
              aria-label="当日受付"
              data-run-id={resolvedRunId}
              id="reception-accept"
              data-test-id="reception-accept"
            >
              <header className="reception-accept__header">
                <div>
                  <h2>当日受付</h2>
                  <p className="reception-accept__lead">患者検索（AND）→ 選択 → 受付登録。</p>
                </div>
                <div className="reception-accept__meta">
                  <RunIdBadge runId={resolvedRunId} />
                </div>
              </header>

              <section
                className="reception-patient-search reception-patient-search--embedded"
                aria-label="患者検索"
                data-run-id={resolvedRunId}
              >
                <header className="reception-patient-search__header">
                  <h3>患者検索</h3>
                  <div className="reception-patient-search__header-actions">
                    <span className="reception-patient-search__meta" aria-live={infoLive}>
                      {patientSearchMutation.isPending ? '検索中…' : `${patientSearchResults.length}件`}
                    </span>
                    <button
                      type="button"
                      className="reception-search__button ghost"
                      onClick={clearPatientSearch}
                      disabled={patientSearchMutation.isPending && patientSearchResults.length === 0}
                    >
                      クリア
                    </button>
                  </div>
                </header>

                <form
                  className="reception-patient-search__form"
                  onSubmit={handlePatientSearchSubmit}
                  data-test-id="reception-patient-search-form"
                >
                  <div className="reception-patient-search__row">
                    <label className="reception-patient-search__field">
                      <span>患者ID</span>
                      <input
                        id="reception-patient-search-patient-id"
                        name="receptionPatientSearchPatientId"
                        type="search"
                        inputMode="numeric"
                        autoComplete="off"
                        value={acceptPatientId}
                        onChange={(event) => setAcceptPatientId(event.target.value)}
                        placeholder="000001"
                      />
                    </label>
                  </div>
                  <div className="reception-patient-search__row">
                    <label className="reception-patient-search__field">
                      <span>氏名（姓）</span>
                      <input
                        id="reception-patient-search-name-sei"
                        name="receptionPatientSearchNameSei"
                        type="search"
                        autoComplete="off"
                        value={patientSearchNameSei}
                        onChange={(event) => setPatientSearchNameSei(event.target.value)}
                        placeholder="山田"
                      />
                    </label>
                    <label className="reception-patient-search__field">
                      <span>氏名（名）</span>
                      <input
                        id="reception-patient-search-name-mei"
                        name="receptionPatientSearchNameMei"
                        type="search"
                        autoComplete="off"
                        value={patientSearchNameMei}
                        onChange={(event) => setPatientSearchNameMei(event.target.value)}
                        placeholder="太郎"
                      />
                    </label>
                  </div>
                  <div className="reception-patient-search__row">
                    <label className="reception-patient-search__field">
                      <span>カナ（セイ）</span>
                      <input
                        id="reception-patient-search-kana-sei"
                        name="receptionPatientSearchKanaSei"
                        type="search"
                        autoComplete="off"
                        value={patientSearchKanaSei}
                        onChange={(event) => setPatientSearchKanaSei(event.target.value)}
                        placeholder="ヤマダ"
                      />
                    </label>
                    <label className="reception-patient-search__field">
                      <span>カナ（メイ）</span>
                      <input
                        id="reception-patient-search-kana-mei"
                        name="receptionPatientSearchKanaMei"
                        type="search"
                        autoComplete="off"
                        value={patientSearchKanaMei}
                        onChange={(event) => setPatientSearchKanaMei(event.target.value)}
                        placeholder="タロウ"
                      />
                    </label>
                  </div>
                  <div className="reception-patient-search__buttons">
                    <button
                      type="submit"
                      className="reception-search__button primary"
                      disabled={patientSearchMutation.isPending}
                      data-test-id="reception-patient-search-submit"
                    >
                      {patientSearchMutation.isPending ? '検索中…' : '検索'}
                    </button>
                  </div>
                </form>

                {patientSearchError ? (
                  <ToneBanner
                    tone="error"
                    message={patientSearchError}
                    destination="Reception"
                    nextAction="条件を見直す"
                    runId={patientSearchMeta?.runId ?? resolvedRunId}
                    ariaLive="assertive"
                  />
                ) : null}

                <div className="reception-patient-search__list" role="list" aria-label="検索結果">
                  {patientSearchMutation.isPending ? (
                    <p className="reception-sidepane__empty">検索中…</p>
                  ) : patientSearchResults.length === 0 ? (
                    <p className="reception-sidepane__empty">検索結果がありません。</p>
                  ) : (
                    patientSearchResults.map((patient, index) => {
                      const key = patient.patientId ?? `${patient.name ?? 'unknown'}-${index}`;
                      const resolvedPatientId = patient.patientId?.trim() ?? '';
                      const isSelected =
                        Boolean(resolvedPatientId) &&
                        Boolean(patientSearchSelected?.patientId) &&
                        resolvedPatientId === patientSearchSelected?.patientId;
                      const matchedEntry = resolvedPatientId
                        ? sortedEntries.find((entry) => entry.patientId === resolvedPatientId)
                        : undefined;
                      return (
                        <div
                          key={key}
                          className={`reception-patient-search__item${isSelected ? ' is-selected' : ''}`}
                          role="listitem"
                        >
                          <button
                            type="button"
                            className="reception-patient-search__item-select"
                            onClick={() => handleSelectPatientSearchResult(patient)}
                            data-test-id={`reception-patient-search-select-${resolvedPatientId || index}`}
                          >
                            <strong>{patient.name ?? '氏名未登録'}</strong>
                            <small>
                              {[patient.kana, patient.patientId]
                                .filter((value): value is string => Boolean(value))
                                .join(' / ') || '—'}
                            </small>
                            <div className="reception-patient-search__item-meta">
                              <span>患者ID: {patient.patientId ?? '—'}</span>
                              {patient.birthDate ? <span>生年月日: {patient.birthDate}</span> : null}
                              {patient.sex ? <span>性別: {patient.sex}</span> : null}
                              {patient.insurance ? <span>保険: {patient.insurance}</span> : null}
                              {patient.lastVisit ? <span>直近: {patient.lastVisit}</span> : null}
                              {matchedEntry?.status ? <span>今日: {matchedEntry.status}</span> : null}
                            </div>
                          </button>
                          <div className="reception-patient-search__item-actions" role="group" aria-label="カルテ">
                            <button
                              type="button"
                              className="reception-search__button ghost"
                              onClick={() =>
                                openMedicalRecordsModal({ patientId: patient.patientId, name: patient.name }, 'search')
                              }
                              disabled={!resolvedPatientId}
                              title={
                                resolvedPatientId
                                  ? '過去カルテをモーダルで確認'
                                  : '患者IDが未登録のため過去カルテを表示できません'
                              }
                            >
                              カルテ
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <div className="reception-accept__acceptbar" data-test-id="reception-accept-bar" aria-live={infoLive}>
                <div className="reception-accept__acceptbar-main">
                  <span className="reception-accept__acceptbar-label">受付対象</span>
                  <strong>{acceptTargetPatientLabel}</strong>
                  <span className="reception-accept__acceptbar-meta">患者ID: {acceptTargetPatientId || '—'}</span>
                </div>
                <div className="reception-accept__acceptbar-actions">
                  <button
                    type="button"
                    className="reception-search__button ghost"
                    onClick={() => setAcceptDetailsCollapsed((prev) => !prev)}
                    aria-expanded={!acceptDetailsCollapsed}
                    data-test-id="reception-accept-toggle-details"
                  >
                    {acceptDetailsCollapsed ? '詳細' : '詳細を閉じる'}
                  </button>
                  <button
                    type="button"
                    className="reception-search__button primary"
                    onClick={(event) => void handleAcceptRegister(event)}
                    disabled={isAcceptSubmitting || acceptRegisterDecision.disabled}
                    aria-disabled={isAcceptSubmitting || acceptRegisterDecision.disabled}
                    data-test-id="reception-accept-register"
                    title={acceptRegisterDecision.reason}
                  >
                    {isAcceptSubmitting ? '受付中…' : acceptRegisterDecision.label}
                  </button>
                </div>
              </div>

              {!acceptDetailsCollapsed ? (
                <div className="reception-accept__details" data-test-id="reception-accept-details">
                  <div className="reception-accept__row">
                    <label className="reception-accept__field">
                      <span>
                        診療科（コード）<span className="reception-accept__required">必須</span>
                      </span>
                      <select
                        id="reception-accept-department"
                        name="receptionAcceptDepartment"
                        data-testid="accept-department-select"
                        value={acceptDepartmentSelection}
                        onChange={(event) => {
                          const value = event.target.value;
                          setAcceptDepartmentSelection(value);
                          setAcceptErrors((prev) => ({ ...prev, department: undefined }));
                        }}
                        aria-invalid={Boolean(acceptErrors.department)}
                      >
                        <option value="">選択してください</option>
                        {departmentOptions.map(([code, name]) => (
                          <option key={code} value={code}>
                            {code} {name}
                          </option>
                        ))}
                      </select>
                      {departmentOptions.length >= 200 && (
                        <small className="reception-accept__optional">候補が多いため上位200件に制限しています。</small>
                      )}
                      {acceptDepartmentSelection && departmentOptions.length === 1 && departmentOptions[0]?.[0] && (
                        <small className="reception-accept__optional">暫定: 診療科コードのデフォルトを適用中</small>
                      )}
                      {acceptDepartmentSelection && departmentOptions.length > 1 && (
                        <small className="reception-accept__optional">既定: 先頭の診療科コードを自動選択</small>
                      )}
                      {acceptErrors.department && <small className="reception-accept__error">{acceptErrors.department}</small>}
                    </label>

                    <label className="reception-accept__field">
                      <span>
                        保険/自費<span className="reception-accept__required">必須</span>
                      </span>
                      <select
                        id="reception-accept-payment-mode"
                        name="receptionAcceptPaymentMode"
                        value={acceptPaymentMode}
                        onChange={(event) => setAcceptPaymentMode(event.target.value as 'insurance' | 'self' | '')}
                        aria-invalid={Boolean(acceptErrors.paymentMode)}
                      >
                        <option value="">自動（既定: 保険）</option>
                        <option value="insurance">保険（InsuranceProvider_Class=1）</option>
                        <option value="self">自費（InsuranceProvider_Class=9）</option>
                      </select>
                      {acceptErrors.paymentMode && <small className="reception-accept__error">{acceptErrors.paymentMode}</small>}
                    </label>

                    <label className="reception-accept__field">
                      <span>
                        担当医<span className="reception-accept__required">必須</span>
                      </span>
                      <select
                        id="reception-accept-physician"
                        name="receptionAcceptPhysician"
                        data-testid="accept-physician-select"
                        value={acceptPhysicianSelection}
                        onChange={(event) => {
                          const value = event.target.value;
                          setAcceptPhysicianSelection(value);
                          setAcceptErrors((prev) => ({ ...prev, physician: undefined }));
                        }}
                        aria-invalid={Boolean(acceptErrors.physician)}
                      >
                        <option value="">選択してください</option>
                        {physicianOptions.map((physician) => (
                          <option key={physician} value={physician}>
                            {physician}
                          </option>
                        ))}
                      </select>
                      {physicianOptions.length === 0 && (
                        <small className="reception-accept__optional">
                          担当医が取得できません。フィルタ/受付一覧の読み込みを確認してください。
                        </small>
                      )}
                      {acceptPhysicianSelection === '0001' && (
                        <small className="reception-accept__optional">暫定: 担当医コードのデフォルト(0001)を適用中</small>
                      )}
                      {physicianOptions.length >= 200 && (
                        <small className="reception-accept__optional">候補が多いため上位200件に制限しています。</small>
                      )}
                      {acceptPhysicianSelection && physicianOptions.length > 0 && (
                        <small className="reception-accept__optional">既定: 先頭の担当医を自動選択</small>
                      )}
                      {acceptErrors.physician && <small className="reception-accept__error">{acceptErrors.physician}</small>}
                    </label>

                    <label className="reception-accept__field">
                      <span>
                        来院区分<span className="reception-accept__required">必須</span>
                      </span>
                      <select
                        id="reception-accept-visit-kind"
                        name="receptionAcceptVisitKind"
                        value={acceptVisitKind}
                        onChange={(event) => setAcceptVisitKind(event.target.value)}
                        aria-invalid={Boolean(acceptErrors.visitKind)}
                      >
                        <option value="">自動（既定: 通常）</option>
                        <option value="1">通常(1)</option>
                        <option value="2">時間外(2)</option>
                        <option value="3">救急(3)</option>
                      </select>
                      {acceptErrors.visitKind && <small className="reception-accept__error">{acceptErrors.visitKind}</small>}
                    </label>
                  </div>

                  <div className="reception-accept__row">
                    <label className="reception-accept__field">
                      <span>メモ/診療内容</span>
                      <input
                        id="reception-accept-note"
                        name="receptionAcceptNote"
                        type="text"
                        value={acceptNote}
                        onChange={(event) => setAcceptNote(event.target.value)}
                        placeholder="外来受付メモ（省略可）"
                      />
                    </label>
                  </div>

                  <div className="reception-accept__actions">
                    <div className="reception-accept__hints" aria-live={infoLive}>
                      <span>Api_Result=00: 左の一覧へ即時反映 / Api_Result=21: 「受付なし」警告</span>
                      <span>runId/traceId は監査ログ（action=reception_accept）とコンソールに残します</span>
                    </div>
                    <div className="reception-accept__buttons">
                      <button type="button" onClick={() => setAcceptResult(null)} className="reception-search__button ghost">
                        バナーをクリア
                      </button>
                      {debugUiEnabled ? (
                        <button
                          type="button"
                          className="reception-search__button ghost"
                          onClick={sendDirectAcceptMinimalForced}
                          data-test-id="accept-submit-forced"
                        >
                          送信(強制)
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {debugUiEnabled ? (
                <div className="reception-accept__result" role="status" aria-live={infoLive}>
                  <div className="reception-accept__result-header">
                    <h3>XHR送信デバッグ（暫定）</h3>
                  </div>
                  <div className="reception-accept__result-meta" data-test-id="accept-xhr-debug">
                    <span>lastAttemptAt: {xhrDebugState.lastAttemptAt ?? '—'}</span>
                    <span>status: {xhrDebugState.status ?? '—'}</span>
                    <span>error: {xhrDebugState.error ?? '—'}</span>
                  </div>
                </div>
              ) : null}

              {acceptResult ? (
                <div className="reception-accept__result" role="status" aria-live={infoLive}>
                  <div className="reception-accept__result-header">
                    <h3>送信結果</h3>
                    {acceptResult.runId && <RunIdBadge runId={acceptResult.runId} />}
                  </div>
                  <ToneBanner
                    tone={acceptResult.tone === 'success' ? 'info' : acceptResult.tone}
                    message={acceptResult.message}
                    destination="Reception"
                    nextAction={acceptResult.tone === 'success' ? '受付リスト更新' : '内容確認'}
                    runId={acceptResult.runId ?? resolvedRunId}
                    ariaLive={acceptResult.tone === 'error' ? 'assertive' : 'polite'}
                  />
                  <div className="reception-accept__result-meta">
                    <span data-test-id="accept-api-result">Api_Result: {acceptResult.apiResult ?? '—'}</span>
                    <span data-test-id="accept-duration-ms">
                      所要時間: {acceptDurationMs !== null ? `${acceptDurationMs} ms` : '—'}
                    </span>
                  </div>
                  {acceptResult.detail && <p className="reception-accept__result-detail">{acceptResult.detail}</p>}
                </div>
              ) : null}
            </section>

	            {debugUiEnabled ? (
	              <OrderConsole
	                masterSource={masterSource}
                missingMaster={tonePayload.missingMaster ?? true}
                cacheHit={tonePayload.cacheHit ?? false}
                missingMasterNote={missingMasterNote}
                runId={mergedMeta.runId ?? initialRunId ?? flags.runId}
                tone={tone}
                toneMessage={`${toneMessage} ｜ transition=${transitionMeta.label}`}
                patientId={selectedEntry?.patientId ?? patientId ?? ''}
                receptionId={selectedEntry?.receptionId ?? receptionId ?? ''}
                destination={destination}
                nextAction={tone === 'error' || mergedMeta.missingMaster ? MISSING_MASTER_RECOVERY_NEXT_ACTION : 'ORCA再送'}
                transitionDescription={transitionMeta.description}
                onMasterSourceChange={handleMasterSourceChange}
                onToggleMissingMaster={handleToggleMissingMaster}
                onToggleCacheHit={handleToggleCacheHit}
                onMissingMasterNoteChange={handleMissingMasterNoteChange}
              />
            ) : null}
          </aside>
        </section>

        {debugUiEnabled ? <ReceptionAuditPanel runId={mergedMeta.runId} selectedEntry={selectedEntry} /> : null}

        <FocusTrapDialog
          open={exceptionsModalOpen}
          title={`例外一覧（${exceptionCounts.total}件）`}
          description="送信エラー・遅延・未承認の詳細を確認します。"
          onClose={closeExceptionsModal}
          testId="reception-exceptions-modal"
        >
          <div className="reception-modal__actions">
            <button type="button" className="reception-search__button ghost" onClick={closeExceptionsModal}>
              閉じる
            </button>
          </div>
          <ReceptionExceptionList
            variant="modal"
            items={exceptionItems}
            counts={exceptionCounts}
            runId={mergedMeta.runId}
            claimEnabled={claimOutpatientEnabled}
            onSelectEntry={(entry) => {
              handleSelectEntry(entry);
              closeExceptionsModal();
            }}
            onOpenCharts={handleOpenChartsNewTab}
            onRetryQueue={handleRetryQueue}
            retryingPatientId={retryingPatientId}
          />
        </FocusTrapDialog>

        <FocusTrapDialog
          open={Boolean(recordsModalPatientId)}
          title={`過去カルテ（${recordsModalPatientLabel}）`}
          description={recordsModalPatientId ? `患者ID: ${recordsModalPatientId}` : undefined}
          onClose={closeMedicalRecordsModal}
          testId="reception-medical-records-modal"
        >
          <div className="reception-modal__actions">
            {medicalRecordsModalQuery.data?.runId ? <RunIdBadge runId={medicalRecordsModalQuery.data.runId} /> : null}
            <button type="button" className="reception-search__button ghost" onClick={closeMedicalRecordsModal}>
              閉じる
            </button>
          </div>
          {!recordsModalPatientId ? null : medicalRecordsModalQuery.isFetching ? (
            <p className="reception-sidepane__empty">過去カルテを取得中…</p>
          ) : medicalRecordsModalQuery.isError ? (
            <ToneBanner
              tone="error"
              message={`過去カルテの取得に失敗しました: ${
                medicalRecordsModalQuery.error instanceof Error ? medicalRecordsModalQuery.error.message : 'unknown'
              }`}
              destination="Reception"
              nextAction="条件を見直す"
              runId={medicalRecordsModalQuery.data?.runId ?? resolvedRunId}
              ariaLive="assertive"
            />
          ) : medicalRecordsModalQuery.data?.records?.length ? (
            <div className="reception-history__list" role="list" aria-label="過去カルテ一覧">
              {medicalRecordsModalQuery.data.records.map((record: MedicalRecordEntry, index: number) => {
                const key =
                  record.documentId ?? record.sequentialNumber ?? `${record.performDate ?? 'unknown'}-${index}`;
                const deptLabel = record.departmentName?.trim() || record.departmentCode?.trim();
                const metaParts = [
                  deptLabel ? `科: ${deptLabel}` : undefined,
                  record.sequentialNumber ? `連番: ${record.sequentialNumber}` : undefined,
                  record.documentStatus ? `状態: ${record.documentStatus}` : undefined,
                ].filter((value): value is string => Boolean(value));
                return (
                  <div key={key} className="reception-history__item" role="listitem">
                    <strong>{record.performDate ?? '—'}</strong>
                    <small>{metaParts.join(' / ') || '—'}</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="reception-sidepane__empty">過去カルテがありません。</p>
          )}
        </FocusTrapDialog>
      </main>
    </>
  );
}
