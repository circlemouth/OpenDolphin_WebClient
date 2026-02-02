import { Global } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { getAuditEventLog, logAuditEvent, logUiState } from '../../../libs/audit/auditLogger';
import { resolveAriaLive, resolveRunId } from '../../../libs/observability/observability';
import type { DataSourceTransition } from '../../../libs/observability/types';
import { OrderConsole } from '../components/OrderConsole';
import { ReceptionAuditPanel } from '../components/ReceptionAuditPanel';
import { ReceptionExceptionList, type ReceptionExceptionItem } from '../components/ReceptionExceptionList';
import { ToneBanner } from '../components/ToneBanner';
import {
  buildVisitEntryFromMutation,
  fetchAppointmentOutpatients,
  fetchClaimFlags,
  mutateVisit,
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
import { ORCA_QUEUE_STALL_THRESHOLD_MS, resolveOrcaSendStatus } from '../../outpatient/orcaQueueStatus';
import {
  buildExceptionAuditDetails,
  buildQueuePhaseSummary,
  resolveExceptionDecision,
} from '../exceptionLogic';
import { loadOrcaClaimSendCache } from '../../charts/orcaClaimSendCache';
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
const ORCA_QUEUE_REFRESH_INTERVAL_MS = 60_000;
const ORCA_QUEUE_QUERY_KEY = ['orca-queue'] as const;

const todayString = () => new Date().toISOString().slice(0, 10);

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
  const status = resolveOrcaSendStatus(entry);
  if (!status) return { label: '未取得', tone: 'warning' as const, detail: undefined };
  const detailParts = [
    status.isStalled ? '滞留' : undefined,
    status.error ? `エラー: ${status.error}` : undefined,
  ].filter((value): value is string => Boolean(value));
  return {
    label: status.label,
    tone: status.tone,
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
  const [acceptOperation, setAcceptOperation] = useState<'register' | 'cancel'>('register');
  const [acceptReceptionId, setAcceptReceptionId] = useState(() => receptionId ?? '');
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
  const lastAcceptAutoFill = useRef<{
    patientId?: string;
    receptionId?: string;
    paymentMode?: 'insurance' | 'self' | '';
  }>({});
  const lastAcceptAutoFillSignature = useRef<string | null>(null);
  const [acceptErrors, setAcceptErrors] = useState<{
    patientId?: string;
    paymentMode?: string;
    visitKind?: string;
    receptionId?: string;
  }>({});
  const [acceptResult, setAcceptResult] = useState<{
    tone: 'success' | 'warning' | 'error' | 'info';
    message: string;
    detail?: string;
    runId?: string;
    apiResult?: string;
  } | null>(null);
  const [retryingPatientId, setRetryingPatientId] = useState<string | null>(null);

  const claimQueryKey = ['outpatient-claim-flags'];
  const claimQuery = useQuery({
    queryKey: claimQueryKey,
    queryFn: (context) => fetchClaimFlags(context),
    refetchInterval: OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
    staleTime: OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
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
    void refetchClaim();
    void refetchAppointment();
  }, [broadcast?.updatedAt, refetchAppointment, refetchClaim]);

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
  const masterSearchMutation = useMutation<PatientMasterSearchResponse, Error, Parameters<typeof fetchPatientMasterSearch>[0]>({
    mutationFn: (params) => fetchPatientMasterSearch(params),
    onSuccess: (result) => {
      const apiResult = result.apiResult ?? result.raw?.Api_Result ?? result.raw?.apiResult;
      const isInOutMissing = apiResult === '91';
      setMasterSearchResults(result.patients);
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
    const params = new URLSearchParams();
    if (keyword) params.set('kw', keyword);
    if (departmentFilter) params.set('dept', departmentFilter);
    if (physicianFilter) params.set('phys', physicianFilter);
    if (paymentMode !== 'all') params.set('pay', paymentMode);
    if (sortKey) params.set('sort', sortKey);
    if (selectedDate) params.set('date', selectedDate);
    if (intentParam) params.set('intent', intentParam);
    setSearchParams(params, { replace: true });
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
  }, [departmentFilter, intentParam, keyword, physicianFilter, paymentMode, selectedDate, setSearchParams, sortKey]);

  const mergedMeta = useMemo(() => {
    const claim = claimQuery.data;
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
  }, [claimQuery.data?.auditEvent, mergedMeta.cacheHit, mergedMeta.dataSourceTransition, mergedMeta.missingMaster, mergedMeta.runId]);

  const appointmentEntries = appointmentQuery.data?.entries ?? [];
  const masterSearchEntries = useMemo<ReceptionEntry[]>(
    () =>
      masterSearchResults.map((patient, index) => {
        const hasInsurance = (patient.insuranceCount ?? 0) > 0 || (patient.publicInsuranceCount ?? 0) > 0;
        return {
          id: `master-${patient.patientId ?? index}`,
          patientId: patient.patientId,
          name: patient.name,
          kana: patient.kana,
          birthDate: patient.birthDate,
          sex: patient.sex,
          department: undefined,
          physician: undefined,
          appointmentTime: undefined,
          visitDate: undefined,
          status: '予約',
          insurance: hasInsurance ? '保険' : '自費',
          note: '患者マスタ検索',
          source: 'unknown',
        };
      }),
    [masterSearchResults],
  );
  const tableEntries = masterSearchEntries.length > 0 ? masterSearchEntries : appointmentEntries;
  const filteredEntries = useMemo(
    () =>
      masterSearchEntries.length > 0
        ? masterSearchEntries
        : filterEntries(tableEntries, keyword, departmentFilter, physicianFilter, paymentMode),
    [departmentFilter, keyword, masterSearchEntries, paymentMode, physicianFilter, tableEntries],
  );
  const sortedEntries = useMemo(() => sortEntries(filteredEntries, sortKey), [filteredEntries, sortKey]);
  const grouped = useMemo(() => groupByStatus(sortedEntries), [sortedEntries]);

  const claimBundles = claimQuery.data?.bundles ?? [];
  const claimQueueEntries = claimQuery.data?.queueEntries ?? [];
  const [claimSendCacheUpdatedAt, setClaimSendCacheUpdatedAt] = useState(0);
  useEffect(() => {
    setClaimSendCacheUpdatedAt(Date.now());
  }, [claimQuery.data?.runId, broadcast?.updatedAt]);
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

  const selectedEntry = useMemo(() => {
    if (!selectedEntryKey) return undefined;
    return sortedEntries.find((entry) => entryKey(entry) === selectedEntryKey);
  }, [selectedEntryKey, sortedEntries]);

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
      if (entry.source === 'unknown' && acceptOperation === 'cancel') {
        setAcceptOperation('register');
        setAcceptReceptionId('');
        setAcceptErrors((prev) => ({ ...prev, receptionId: undefined }));
      }
      const nextPatientId = entry.patientId?.trim() ?? '';
      const nextReceptionId = entry.receptionId?.trim() ?? '';
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
      if (shouldUpdate(acceptReceptionId, nextReceptionId, lastAcceptAutoFill.current.receptionId)) {
        setAcceptReceptionId(nextReceptionId);
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
          receptionId: nextReceptionId || lastAcceptAutoFill.current.receptionId,
          paymentMode: (nextPaymentMode && nextPaymentMode !== 'all'
            ? nextPaymentMode
            : lastAcceptAutoFill.current.paymentMode) as 'insurance' | 'self' | '',
        };
        setAcceptErrors((prev) => {
          const next = { ...prev };
          if (nextPatientId) delete next.patientId;
          if (nextReceptionId) delete next.receptionId;
          if (nextPaymentMode) delete next.paymentMode;
          return next;
        });
      }
    },
    [acceptOperation, acceptPatientId, acceptPaymentMode, acceptReceptionId, acceptVisitKind],
  );

  const acceptAutoFillSignature = useMemo(() => {
    if (!selectedEntry) return null;
    return JSON.stringify({
      key: entryKey(selectedEntry),
      patientId: selectedEntry.patientId ?? '',
      receptionId: selectedEntry.receptionId ?? '',
      paymentMode: resolvePaymentMode(selectedEntry.insurance ?? undefined) ?? '',
    });
  }, [selectedEntry]);

  useEffect(() => {
    if (!selectedEntry || !acceptAutoFillSignature) return;
    if (lastAcceptAutoFillSignature.current === acceptAutoFillSignature) return;
    lastAcceptAutoFillSignature.current = acceptAutoFillSignature;
    applyAcceptAutoFill(selectedEntry);
  }, [acceptAutoFillSignature, applyAcceptAutoFill, selectedEntry]);

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

  const uniqueDepartments = useMemo(
    () => Array.from(new Set(appointmentEntries.map((entry) => entry.department).filter(Boolean))) as string[],
    [appointmentEntries],
  );
  const uniquePhysicians = useMemo(
    () => Array.from(new Set(appointmentEntries.map((entry) => entry.physician).filter(Boolean))) as string[],
    [appointmentEntries],
  );

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
    return [
      `請求状態 ${selectedBundle?.claimStatus ?? selectedBundle?.claimStatusText ?? '未取得'}`,
      `バンドル ${selectedBundle?.bundleNumber ?? '—'}`,
      `合計金額 ${selectedBundle?.totalClaimAmount !== undefined ? `${selectedBundle.totalClaimAmount.toLocaleString()}円` : '—'}`,
      `診療時間 ${toDateLabel(selectedBundle?.performTime)}`,
      `ORCAキュー ${selectedQueueStatus.label}${selectedQueueStatus.detail ? ` ${selectedQueueStatus.detail}` : ''}`,
    ].join('、');
  }, [selectedBundle, selectedEntry, selectedQueueStatus]);

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

  const handleAcceptSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>) => {
      event?.preventDefault();
      setAcceptResult(null);
      setAcceptErrors({});
      setAcceptDurationMs(null);
      const trimmedPatientId = acceptPatientId.trim();
      const errors: typeof acceptErrors = {};
      if (!trimmedPatientId) errors.patientId = '患者IDは必須です';
      if (!acceptPaymentMode) errors.paymentMode = '保険/自費を選択してください';
      if (!acceptVisitKind.trim()) errors.visitKind = '来院区分を選択してください';
      if (acceptOperation === 'cancel' && !acceptReceptionId.trim()) {
        errors.receptionId = '取消には受付IDが必要です';
      }
      if (Object.keys(errors).length > 0) {
        setAcceptErrors(errors);
        setAcceptResult({
          tone: 'error',
          message: '入力内容を確認してください',
          detail: Object.values(errors).join(' / '),
        });
        return;
      }
      const now = new Date();
      const params: VisitMutationParams = {
        patientId: trimmedPatientId,
        requestNumber: acceptOperation === 'cancel' ? '02' : '01',
        acceptanceDate: selectedDate || todayString(),
        acceptanceTime: now.toISOString().slice(11, 19),
        acceptancePush: acceptVisitKind,
        acceptanceId: acceptReceptionId.trim() || undefined,
        medicalInformation: acceptNote.trim() || (acceptOperation === 'cancel' ? '受付取消' : '外来受付'),
        paymentMode: acceptPaymentMode || undefined,
        departmentCode: selectedEntry?.department,
        physicianCode: selectedEntry?.physician,
      };

      const started = performance.now();
      try {
        const payload = await visitMutation.mutateAsync(params);
        const durationMs = Math.round(performance.now() - started);
        setAcceptDurationMs(durationMs);
        const apiResult = payload.apiResult ?? '';
        const isSuccess = apiResult === '00' || apiResult === '0000';
        const isNoAcceptance = apiResult === '21';

        if (isSuccess) {
          applyMutationResultToList(payload, params);
          void refetchAppointment();
          void refetchClaim();
        }

        const toneResult: 'info' | 'warning' | 'error' = isSuccess
          ? 'info'
          : isNoAcceptance
            ? 'warning'
            : 'error';
        const message = isSuccess
          ? params.requestNumber === '02'
            ? '受付取消が完了しました'
            : '受付登録が完了しました'
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
      acceptOperation,
      acceptPatientId,
      acceptPaymentMode,
      acceptReceptionId,
      acceptVisitKind,
      applyMutationResultToList,
      enqueue,
      mergedMeta.runId,
      refetchAppointment,
      refetchClaim,
      selectedDate,
      selectedEntry?.department,
      selectedEntry?.physician,
      visitMutation,
    ],
  );

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
      if (acceptOperation === 'cancel') {
        setAcceptOperation('register');
        setAcceptReceptionId('');
        setAcceptErrors((prev) => ({ ...prev, receptionId: undefined }));
      }
      if (patient.patientId) {
        setAcceptPatientId(patient.patientId);
        lastAcceptAutoFill.current = {
          ...lastAcceptAutoFill.current,
          patientId: patient.patientId,
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
    [acceptOperation, acceptPaymentMode, acceptVisitKind, flags.runId, mergedMeta.runId],
  );

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

  const handleSelectRow = useCallback((entry: ReceptionEntry) => {
    setSelectedEntryKey(entryKey(entry));
    setSelectionNotice(null);
    setSelectionLost(false);
  }, []);

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
                      type="text"
                      value={masterSearchFilters.name}
                      onChange={(event) => setMasterSearchFilters((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="山田 太郎"
                    />
                  </label>
                  <label className="reception-master__field">
                    <span>カナ</span>
                    <input
                      type="text"
                      value={masterSearchFilters.kana}
                      onChange={(event) => setMasterSearchFilters((prev) => ({ ...prev, kana: event.target.value }))}
                      placeholder="ヤマダ タロウ"
                    />
                  </label>
                  <label className="reception-master__field">
                    <span>生年月日（開始）</span>
                    <input
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
            <section
              className="reception-accept"
              aria-label="当日受付登録/取消"
              data-run-id={resolvedRunId}
              id="reception-accept"
            >
              <header className="reception-accept__header">
                <div>
                  <h2>予約外当日受付（acceptmodv2）</h2>
                  <p className="reception-accept__lead">
                    /orca/visits/mutation に Request_Number=01/02 を送信し、Api_Result=00/21 をバナーとリストへ即時反映します。
                  </p>
                </div>
                <div className="reception-accept__meta">
                  <RunIdBadge runId={resolvedRunId} />
                  <StatusPill
                    className="reception-pill"
                    label="requestNumber"
                    value={acceptOperation === 'cancel' ? '02 (取消)' : '01 (登録)'}
                    tone={acceptOperation === 'cancel' ? 'warning' : 'info'}
                    runId={resolvedRunId}
                  />
                </div>
              </header>

              <div className="reception-accept__requirements" role="note">
                <strong>入力必須:</strong>
                <span>患者ID / 保険・自費 / 来院区分。取消時は受付IDが必須です。</span>
                <span>一覧または患者マスタ検索で選択すると、患者ID・保険区分を自動転記します。</span>
              </div>
              {acceptOperation === 'cancel' && (
                <div className="reception-accept__notice" role="note">
                  <strong>受付取消は受付ID必須。</strong>
                  <span>取り違え防止のため、一覧から選択した受付IDが一致しているか確認してください。</span>
                </div>
              )}

              <form
                className="reception-accept__form"
                onSubmit={handleAcceptSubmit}
                data-test-id="reception-accept-form"
              >
                <div className="reception-accept__row">
                  <label className="reception-accept__field">
                    <span>患者ID<span className="reception-accept__required">必須</span></span>
                    <input
                      type="text"
                      value={acceptPatientId}
                      onChange={(event) => setAcceptPatientId(event.target.value)}
                      placeholder="000001"
                      aria-invalid={Boolean(acceptErrors.patientId)}
                    />
                    {acceptErrors.patientId && <small className="reception-accept__error">{acceptErrors.patientId}</small>}
                  </label>
                  <label className="reception-accept__field">
                    <span>保険/自費<span className="reception-accept__required">必須</span></span>
                    <select
                      value={acceptPaymentMode}
                      onChange={(event) => setAcceptPaymentMode(event.target.value as 'insurance' | 'self' | '')}
                      aria-invalid={Boolean(acceptErrors.paymentMode)}
                    >
                      <option value="">選択してください</option>
                      <option value="insurance">保険（InsuranceProvider_Class=1）</option>
                      <option value="self">自費（InsuranceProvider_Class=9）</option>
                    </select>
                    {acceptErrors.paymentMode && <small className="reception-accept__error">{acceptErrors.paymentMode}</small>}
                  </label>
                  <label className="reception-accept__field">
                    <span>来院区分<span className="reception-accept__required">必須</span></span>
                    <select
                      value={acceptVisitKind}
                      onChange={(event) => setAcceptVisitKind(event.target.value)}
                      aria-invalid={Boolean(acceptErrors.visitKind)}
                    >
                      <option value="">選択してください</option>
                      <option value="1">通常(1)</option>
                      <option value="2">時間外(2)</option>
                      <option value="3">救急(3)</option>
                    </select>
                    {acceptErrors.visitKind && <small className="reception-accept__error">{acceptErrors.visitKind}</small>}
                  </label>
                </div>

                <div className="reception-accept__row">
                  <fieldset className="reception-accept__field reception-accept__field--inline">
                    <legend>操作</legend>
                    <label className="reception-accept__radio">
                      <input
                        type="radio"
                        name="accept-operation"
                        value="register"
                        checked={acceptOperation === 'register'}
                        onChange={() => {
                          setAcceptOperation('register');
                          setAcceptErrors({});
                        }}
                      />
                      受付登録 (Request_Number=01)
                    </label>
                    <label className="reception-accept__radio">
                      <input
                        type="radio"
                        name="accept-operation"
                        value="cancel"
                        checked={acceptOperation === 'cancel'}
                        onChange={() => {
                          setAcceptOperation('cancel');
                          setAcceptErrors({});
                        }}
                      />
                      受付取消 (Request_Number=02)
                    </label>
                  </fieldset>
                  <label
                    className={`reception-accept__field${acceptOperation === 'cancel' ? ' reception-accept__field--alert' : ''}`}
                  >
                    <span>
                      受付ID
                      {acceptOperation === 'cancel' ? (
                        <span className="reception-accept__required">必須</span>
                      ) : (
                        <span className="reception-accept__optional">任意</span>
                      )}
                    </span>
                    <input
                      type="text"
                      value={acceptReceptionId}
                      onChange={(event) => setAcceptReceptionId(event.target.value)}
                      placeholder="A20260120001"
                      required={acceptOperation === 'cancel'}
                      aria-required={acceptOperation === 'cancel'}
                      aria-disabled={acceptOperation === 'register'}
                      aria-invalid={Boolean(acceptErrors.receptionId)}
                    />
                    {acceptErrors.receptionId && (
                      <small className="reception-accept__error">{acceptErrors.receptionId}</small>
                    )}
                  </label>
                  <label className="reception-accept__field">
                    <span>メモ/診療内容</span>
                    <input
                      type="text"
                      value={acceptNote}
                      onChange={(event) => setAcceptNote(event.target.value)}
                      placeholder="外来受付メモ"
                    />
                  </label>
                </div>

                <div className="reception-accept__actions">
                  <div className="reception-accept__hints" aria-live={infoLive}>
                    <span>Api_Result=00: 受付リストへ即時追加 / Api_Result=21: 受付なし警告を表示</span>
                    <span>runId/traceId は監査ログ（action=reception_accept）とコンソールに残します</span>
                  </div>
                  <div className="reception-accept__buttons">
                    <button type="button" onClick={() => setAcceptResult(null)} className="reception-search__button ghost">
                      バナーをクリア
                    </button>
                    <button
                      type="button"
                      className="reception-search__button ghost"
                      onClick={() => {
                        if (!selectedEntry) return;
                        applyAcceptAutoFill(selectedEntry, { force: true });
                      }}
                    >
                      選択中の患者を反映
                    </button>
                    <button
                      type="submit"
                      className="reception-search__button primary"
                      onClick={handleAcceptSubmit}
                      disabled={isAcceptSubmitting}
                    >
                      {isAcceptSubmitting ? '送信中…' : '受付送信'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="reception-accept__result" role="status" aria-live={infoLive}>
                <div className="reception-accept__result-header">
                  <h3>送信結果</h3>
                  {acceptResult?.runId && <RunIdBadge runId={acceptResult.runId} />}
                </div>
                {acceptResult ? (
                  <ToneBanner
                    tone={acceptResult.tone === 'success' ? 'info' : acceptResult.tone}
                    message={acceptResult.message}
                    destination="Reception"
                    nextAction={acceptResult.tone === 'success' ? '受付リスト更新' : '内容確認'}
                    runId={acceptResult.runId ?? resolvedRunId}
                    ariaLive={acceptResult.tone === 'error' ? 'assertive' : 'polite'}
                  />
                ) : (
                  <p className="reception-accept__result-empty">まだ送信していません。入力後に「受付送信」を実行してください。</p>
                )}
                <div className="reception-accept__result-meta">
                  <span data-test-id="accept-api-result">Api_Result: {acceptResult?.apiResult ?? '—'}</span>
                  <span data-test-id="accept-duration-ms">所要時間: {acceptDurationMs !== null ? `${acceptDurationMs} ms` : '—'}</span>
                </div>
                {acceptResult?.detail && <p className="reception-accept__result-detail">{acceptResult.detail}</p>}
              </div>
            </section>

            <section className="reception-search" aria-label="検索とフィルタ">
              <form className="reception-search__form" onSubmit={handleSearchSubmit}>
                <div className="reception-search__row">
                  <label className="reception-search__field">
                    <span>日付</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      required
                    />
                  </label>
                  <label className="reception-search__field">
                    <span>検索（患者ID/氏名/カナ）</span>
                    <input
                      type="search"
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="PX-0001 / 山田 / ヤマダ"
                    />
                  </label>
                  <label className="reception-search__field">
                    <span>診療科</span>
                    <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
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
                    <select value={physicianFilter} onChange={(event) => setPhysicianFilter(event.target.value)}>
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
                    <select value={paymentMode} onChange={(event) => setPaymentMode(normalizePaymentMode(event.target.value))}>
                      <option value="all">すべて</option>
                      <option value="insurance">保険</option>
                      <option value="self">自費</option>
                    </select>
                  </label>
                  <label className="reception-search__field">
                    <span>ソート</span>
                    <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
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
                  <button type="button" className="reception-search__button ghost" onClick={() => appointmentQuery.refetch()}>
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
                  <span className="reception-summary__empty-hint">ヒント: 診療科・担当医・保険/自費を先に絞ると探しやすくなります。</span>
                </p>
              )}
              {appointmentQuery.isLoading && (
                <p role="status" aria-live={infoLive} className="reception-status">
                  外来リストを読み込み中…
                </p>
              )}
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

            <ReceptionExceptionList
              items={exceptionItems}
              counts={exceptionCounts}
              runId={mergedMeta.runId}
              onSelectEntry={handleSelectEntry}
              onOpenCharts={handleOpenChartsNewTab}
              onRetryQueue={handleRetryQueue}
              retryingPatientId={retryingPatientId}
            />

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
                          <th scope="col">請求</th>
                          <th scope="col">メモ/参照</th>
                          <th scope="col">直近</th>
                          <th scope="col">ORCA</th>
                          <th scope="col">Charts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 && (
                          <tr>
                            <td colSpan={10} className="reception-table__empty">
                              該当なし
                            </td>
                          </tr>
                        )}
                        {items.map((entry) => {
                          const queueStatus = resolveQueueStatusForEntry(entry);
                          const bundle = resolveBundleForEntry(entry);
                          const paymentLabel = paymentModeLabel(entry.insurance);
                          const canOpenCharts = Boolean(entry.patientId);
                          const fallbackAppointmentId =
                            entry.receptionId ? undefined : entry.appointmentId ?? (entry.id ? String(entry.id) : undefined);
                          const isSelected = selectedEntryKey === entryKey(entry);
                          return (
                            <tr
                              key={entry.id}
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
                                <span
                                  className={`reception-badge reception-badge--${status}`}
                                  aria-label={`状態: ${SECTION_LABEL[status]}`}
                                >
                                  {SECTION_LABEL[status]}
                                </span>
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
                              <td className="reception-table__note">
                                {entry.note ? truncateText(entry.note, 36) : '—'}
                                <div className="reception-table__source">src: {entry.source}</div>
                              </td>
                              <td className="reception-table__last">{resolveLastVisitForEntry(entry)}</td>
                              <td className="reception-table__queue">
                                <span
                                  className={`reception-queue reception-queue--${queueStatus.tone}`}
                                  aria-label={`ORCAキュー: ${queueStatus.label}${queueStatus.detail ? ` ${queueStatus.detail}` : ''}`}
                                >
                                  {queueStatus.label}
                                </span>
                                {queueStatus.detail && <small className="reception-table__sub">{queueStatus.detail}</small>}
                              </td>
                              <td className="reception-table__action">
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
          </div>

          <aside className="reception-layout__side" aria-label="右ペイン" id="reception-sidepane" tabIndex={-1}>
            <section
              className="reception-sidepane"
              data-run-id={resolvedRunId}
              role="region"
              aria-live={infoLive}
              aria-atomic="true"
              aria-labelledby="reception-sidepane-patient-title"
              aria-describedby="reception-sidepane-patient-status"
              tabIndex={0}
            >
              <header className="reception-sidepane__header">
                <div>
                  <h2 id="reception-sidepane-patient-title">患者概要</h2>
                  <span className="reception-sidepane__meta">
                    {selectedEntry?.name ?? '未選択'}
                  </span>
                </div>
                <div className="reception-sidepane__actions">
                  <button
                    type="button"
                    className="reception-sidepane__action primary"
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
                </div>
              </header>
              <div className="reception-sidepane__lead">
                <span
                  className={`reception-badge reception-badge--${selectedEntry?.status ?? 'muted'}`}
                  aria-label={`状態: ${selectedEntry?.status ?? '未選択'}`}
                >
                  {selectedEntry?.status ?? '未選択'}
                </span>
                <span className="reception-sidepane__lead-meta">
                  {selectedEntry?.appointmentTime ?? '—'} / {selectedEntry?.department ?? '—'}
                </span>
              </div>
              <p id="reception-sidepane-patient-status" className="sr-only">
                {selectionSummaryText}
              </p>
              {!selectedEntry ? (
                <p className="reception-sidepane__empty">一覧の行を選択すると詳細が表示されます。</p>
              ) : (
                <div className="reception-sidepane__grid">
                  <div className="reception-sidepane__item reception-sidepane__item--wide">
                    <span>ID</span>
                    <strong>
                      <PatientMetaRow
                        as="span"
                        patientId={selectedEntry.patientId}
                        receptionId={selectedEntry.receptionId}
                        appointmentId={selectedEntry.appointmentId}
                        showLabels={false}
                        showEmpty
                        separator="slash"
                        runId={resolvedRunId}
                      />
                    </strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>氏名/カナ</span>
                    <strong>{selectedEntry.name ?? '未登録'}</strong>
                    <small>{selectedEntry.kana ?? '—'}</small>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>性別/生年月日</span>
                    <strong>
                      {selectedEntry.sex ?? '—'} / {selectedEntry.birthDate ?? '—'}
                    </strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>支払/保険</span>
                    <strong>{paymentModeLabel(selectedEntry.insurance)}</strong>
                    <small>{selectedEntry.insurance ?? '—'}</small>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>来院/担当</span>
                    <strong>
                      {selectedEntry.appointmentTime ?? '—'} / {selectedEntry.department ?? '—'}
                    </strong>
                    <small>{selectedEntry.physician ? `担当: ${selectedEntry.physician}` : '担当: —'}</small>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>状態/直近</span>
                    <strong>{selectedEntry.status ?? '—'}</strong>
                    <small>直近: {resolveLastVisitForEntry(selectedEntry)}</small>
                  </div>
                </div>
              )}
            </section>

            <section
              className="reception-sidepane"
              data-run-id={resolvedRunId}
              role="region"
              aria-live={infoLive}
              aria-atomic="true"
              aria-labelledby="reception-sidepane-order-title"
              aria-describedby="reception-sidepane-order-status"
              tabIndex={0}
            >
              <header className="reception-sidepane__header">
                <div>
                  <h2 id="reception-sidepane-order-title">オーダー概要</h2>
                  <span className="reception-sidepane__meta">
                    {selectedBundle?.claimStatus ?? selectedBundle?.claimStatusText ?? '未取得'}
                  </span>
                </div>
                <div className="reception-sidepane__actions">
                  <button
                    type="button"
                    className="reception-sidepane__action"
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
                </div>
              </header>
              <p id="reception-sidepane-order-status" className="sr-only">
                {orderSummaryText}
              </p>
              {!selectedEntry ? (
                <p className="reception-sidepane__empty">対象患者を選択してください。</p>
              ) : (
                <div className="reception-sidepane__grid">
                  <div className="reception-sidepane__item">
                    <span>請求状態</span>
                    <strong>{selectedBundle?.claimStatus ?? selectedBundle?.claimStatusText ?? '未取得'}</strong>
                    {selectedBundle?.bundleNumber && <small>B: {selectedBundle.bundleNumber}</small>}
                  </div>
                  <div className="reception-sidepane__item">
                    <span>合計金額/診療時間</span>
                    <strong>
                      {selectedBundle?.totalClaimAmount !== undefined
                        ? `${selectedBundle.totalClaimAmount.toLocaleString()}円`
                        : '—'}
                    </strong>
                    <small>{toDateLabel(selectedBundle?.performTime)}</small>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>送信キャッシュ</span>
                    <strong>
                      {selectedSendCache?.sendStatus
                        ? selectedSendCache.sendStatus === 'success'
                          ? '送信成功'
                          : '送信失敗'
                        : '—'}
                    </strong>
                    {selectedSendCache?.invoiceNumber && <small>I: {selectedSendCache.invoiceNumber}</small>}
                    {selectedSendCache?.dataId && <small>D: {selectedSendCache.dataId}</small>}
                  </div>
                  <div className="reception-sidepane__item reception-sidepane__item--wide">
                    <span>ORCAキュー</span>
                    <strong>{selectedQueueStatus.label}</strong>
                    {selectedQueueStatus.detail && <small>{selectedQueueStatus.detail}</small>}
                    {selectedQueue?.nextRetryAt && <small>次回再送: {selectedQueue.nextRetryAt}</small>}
                    {selectedQueue?.errorMessage && <small>error: {selectedQueue.errorMessage}</small>}
                  </div>
                </div>
              )}
            </section>

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
          </aside>
        </section>

        <ReceptionAuditPanel runId={mergedMeta.runId} selectedEntry={selectedEntry} />
      </main>
    </>
  );
}
