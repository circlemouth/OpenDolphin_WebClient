import { Global } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { logAuditEvent, logUiState } from '../../../libs/audit/auditLogger';
import type { DataSourceTransition } from '../../../libs/observability/types';
import { OrderConsole } from '../components/OrderConsole';
import { ToneBanner } from '../components/ToneBanner';
import { fetchAppointmentOutpatients, fetchClaimFlags, type ReceptionEntry, type ReceptionStatus } from '../api';
import { receptionStyles } from '../styles';
import { applyAuthServicePatch, useAuthService, type AuthServiceFlags } from '../../charts/authService';
import { getChartToneDetails } from '../../../ux/charts/tones';
import type { ResolveMasterSource } from '../components/ResolveMasterBadge';
import { useAdminBroadcast } from '../../../libs/admin/useAdminBroadcast';
import { AdminBroadcastBanner } from '../../shared/AdminBroadcastBanner';
import { ApiFailureBanner } from '../../shared/ApiFailureBanner';
import { buildChartsUrl, type ReceptionCarryoverParams } from '../../charts/encounterContext';
import type { ClaimBundle, ClaimQueueEntry, ClaimQueuePhase } from '../../outpatient/types';

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

const loadCollapseState = (): Record<ReceptionStatus, boolean> => {
  if (typeof localStorage === 'undefined') return { 受付中: false, 診療中: false, 会計待ち: false, 会計済み: true, 予約: false };
  try {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored) {
      return { 受付中: false, 診療中: false, 会計待ち: false, 会計済み: true, 予約: false, ...(JSON.parse(stored) as Record<ReceptionStatus, boolean>) };
    }
  } catch {
    // ignore broken localStorage value
  }
  return { 受付中: false, 診療中: false, 会計待ち: false, 会計済み: true, 予約: false };
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

const filterEntries = (
  entries: ReceptionEntry[],
  keyword: string,
  department: string,
  physician: string,
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
    return matchesKeyword && matchesDept && matchesPhysician;
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
  title = 'Reception 検索と外来API接続',
  description = '外来請求/予約 API を React Query で取得し、missingMaster・cacheHit・dataSourceTransition をトーンバナーとリストへ反映します。行をダブルクリックすると同じ RUN_ID で Charts へ遷移します。',
}: ReceptionPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { broadcast } = useAdminBroadcast();
  const { flags, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed, bumpRunId } = useAuthService();
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') ?? todayString());
  const [keyword, setKeyword] = useState(() => searchParams.get('kw') ?? '');
  const [submittedKeyword, setSubmittedKeyword] = useState(() => searchParams.get('kw') ?? '');
  const [departmentFilter, setDepartmentFilter] = useState(() => searchParams.get('dept') ?? '');
  const [physicianFilter, setPhysicianFilter] = useState(() => searchParams.get('phys') ?? '');
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const fromUrl = searchParams.get('sort');
    return isSortKey(fromUrl) ? fromUrl : 'time';
  });
  const [collapsed, setCollapsed] = useState<Record<ReceptionStatus, boolean>>(loadCollapseState);
  const [missingMasterNote, setMissingMasterNote] = useState('');
  const summaryRef = useRef<HTMLParagraphElement | null>(null);
  const appliedMeta = useRef<Partial<AuthServiceFlags>>({});
  const lastAuditEventHash = useRef<string>();
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  const lastSidepaneAuditKey = useRef<string | null>(null);

  const claimQueryKey = ['outpatient-claim-flags'];
  const claimQuery = useQuery({
    queryKey: claimQueryKey,
    queryFn: (context) => fetchClaimFlags(context),
    refetchInterval: 90_000,
    staleTime: 90_000,
    meta: {
      servedFromCache: !!queryClient.getQueryState(claimQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(claimQueryKey)?.fetchFailureCount ?? 0,
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
    meta: {
      servedFromCache: !!queryClient.getQueryState(appointmentQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(appointmentQueryKey)?.fetchFailureCount ?? 0,
    },
  });

  const appointmentErrorContext = useMemo(() => {
    const httpStatus = appointmentQuery.data?.httpStatus;
    const hasHttpError = typeof httpStatus === 'number' && httpStatus >= 400;
    const error = appointmentQuery.isError ? appointmentQuery.error : appointmentQuery.data?.error;
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
    appointmentQuery.data?.error,
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
        return raw ? (JSON.parse(raw) as Partial<Record<'kw' | 'dept' | 'phys' | 'sort' | 'date', string>>) : null;
      } catch {
        return null;
      }
    })();
    const fromUrl = {
      kw: searchParams.get('kw') ?? undefined,
      dept: searchParams.get('dept') ?? undefined,
      phys: searchParams.get('phys') ?? undefined,
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
    if (merged.sort !== undefined && isSortKey(merged.sort)) setSortKey(merged.sort);
    if (merged.date !== undefined) setSelectedDate(merged.date);
  }, [searchParams]);

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
    if (sortKey) params.set('sort', sortKey);
    if (selectedDate) params.set('date', selectedDate);
    if (intentParam) params.set('intent', intentParam);
    setSearchParams(params, { replace: true });
    if (typeof localStorage !== 'undefined') {
      const snapshot = {
        kw: keyword,
        dept: departmentFilter,
        phys: physicianFilter,
        sort: sortKey,
        date: selectedDate,
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(snapshot));
    }
  }, [departmentFilter, intentParam, keyword, physicianFilter, selectedDate, setSearchParams, sortKey]);

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
      fetchedAt: claim?.fetchedAt ?? appointment?.fetchedAt,
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

  const entries = appointmentQuery.data?.entries ?? [];
  const filteredEntries = useMemo(
    () => filterEntries(entries, keyword, departmentFilter, physicianFilter),
    [entries, keyword, departmentFilter, physicianFilter],
  );
  const sortedEntries = useMemo(() => sortEntries(filteredEntries, sortKey), [filteredEntries, sortKey]);
  const grouped = useMemo(() => groupByStatus(sortedEntries), [sortedEntries]);

  const claimBundles = claimQuery.data?.bundles ?? [];
  const claimQueueEntries = claimQuery.data?.queueEntries ?? [];

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

  const selectedEntry = useMemo(() => {
    if (!selectedEntryKey) return undefined;
    return sortedEntries.find((entry) => entryKey(entry) === selectedEntryKey);
  }, [selectedEntryKey, sortedEntries]);

  const selectedBundle = useMemo(
    () => (selectedEntry ? resolveBundleForEntry(selectedEntry) : undefined),
    [resolveBundleForEntry, selectedEntry],
  );

  const selectedQueue = useMemo(
    () => (selectedEntry ? resolveQueueForEntry(selectedEntry) : undefined),
    [resolveQueueForEntry, selectedEntry],
  );
  const selectedQueueStatus = useMemo(() => resolveQueueStatus(selectedQueue), [selectedQueue]);

  const receptionCarryover = useMemo<ReceptionCarryoverParams>(
    () => ({
      kw: keyword.trim() || undefined,
      dept: departmentFilter || undefined,
      phys: physicianFilter || undefined,
      sort: sortKey,
      date: selectedDate || undefined,
    }),
    [departmentFilter, keyword, physicianFilter, selectedDate, sortKey],
  );

  const uniqueDepartments = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.department).filter(Boolean))) as string[],
    [entries],
  );
  const uniquePhysicians = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.physician).filter(Boolean))) as string[],
    [entries],
  );

  const summaryText = useMemo(() => {
    const counts = grouped.map(({ status, items }) => `${status}: ${items.length}件`).join(' / ');
    return `検索結果 ${sortedEntries.length}件（${counts}）`;
  }, [grouped, sortedEntries.length]);

  useEffect(() => {
    summaryRef.current?.focus?.();
  }, [summaryText]);

  useEffect(() => {
    if (sortedEntries.length === 0) {
      setSelectedEntryKey(null);
      return;
    }
    if (selectedEntryKey && sortedEntries.some((entry) => entryKey(entry) === selectedEntryKey)) return;
    setSelectedEntryKey(entryKey(sortedEntries[0]));
  }, [selectedEntryKey, sortedEntries]);

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
      receptionId: selectedEntry.receptionId,
      cacheHit: mergedMeta.cacheHit,
      missingMaster: mergedMeta.missingMaster,
      dataSourceTransition: mergedMeta.dataSourceTransition,
      payload: {
        action: 'RECEPTION_SIDEPANE_SUMMARY',
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
    setSortKey('time');
  }, []);

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
        receptionId: selected?.receptionId,
        payload: { missingMasterNote: value },
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
      const url = buildChartsUrl({
        patientId: entry.patientId,
        appointmentId: entry.appointmentId,
        receptionId: entry.receptionId,
        visitDate: entry.visitDate,
      }, receptionCarryover);
      navigate(url, {
        state: {
          patientId: entry.patientId,
          appointmentId: entry.appointmentId,
          receptionId: entry.receptionId,
          visitDate: entry.visitDate,
        },
      });
    },
    [
      bumpRunId,
      flags.runId,
      initialRunId,
      mergedMeta.cacheHit,
      mergedMeta.dataSourceTransition,
      mergedMeta.missingMaster,
      mergedMeta.runId,
      navigate,
      receptionCarryover,
    ],
  );

  const toggleSection = (status: ReceptionStatus) => {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  return (
    <>
      <Global styles={receptionStyles} />
      <main className="reception-page" data-run-id={mergedMeta.runId}>
        <AdminBroadcastBanner broadcast={broadcast} surface="reception" />
        <section className="reception-page__header">
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="reception-page__meta-bar" role="status" aria-live="polite" data-run-id={mergedMeta.runId}>
            <span className="reception-pill">RUN_ID: {mergedMeta.runId ?? '未取得'}</span>
            <span className="reception-pill">dataSourceTransition: {mergedMeta.dataSourceTransition ?? 'snapshot'}</span>
            <span className="reception-pill">missingMaster: {String(mergedMeta.missingMaster ?? true)}</span>
            <span className="reception-pill">cacheHit: {String(mergedMeta.cacheHit ?? false)}</span>
            {mergedMeta.fetchedAt && <span className="reception-pill">fetchedAt: {mergedMeta.fetchedAt}</span>}
          </div>
        </section>

        <section className="reception-layout">
          <div className="reception-layout__main">
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
                </div>
              </form>
              <p className="reception-summary" aria-live="polite" ref={summaryRef} tabIndex={-1}>
                {summaryText}
              </p>
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
              {appointmentQuery.isLoading && (
                <p role="status" aria-live="polite" className="reception-status">
                  外来リストを読み込み中…
                </p>
              )}
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
            </section>

            {grouped.map(({ status, items }) => (
              <section key={status} className="reception-section" aria-label={`${SECTION_LABEL[status]}リスト`}>
                <header className="reception-section__header">
                  <div>
                    <h2>{SECTION_LABEL[status]}</h2>
                    <span className="reception-section__count" aria-live="polite">
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
                  <div className="reception-table__wrapper">
                    <table className="reception-table">
                      <thead>
                        <tr>
                          <th scope="col">状態</th>
                          <th scope="col">患者ID</th>
                          <th scope="col">名前</th>
                          <th scope="col">来院時刻</th>
                          <th scope="col">保険/自費</th>
                          <th scope="col">メモ</th>
                          <th scope="col">直近診療</th>
                          <th scope="col">ORCAキュー</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 && (
                          <tr>
                            <td colSpan={8} className="reception-table__empty">
                              該当なし
                            </td>
                          </tr>
                        )}
                        {items.map((entry) => {
                          const queueStatus = resolveQueueStatusForEntry(entry);
                          const isSelected = selectedEntryKey === entryKey(entry);
                          return (
                            <tr
                              key={entry.id}
                              tabIndex={0}
                              className={isSelected ? 'reception-table__row--selected' : undefined}
                              onClick={() => setSelectedEntryKey(entryKey(entry))}
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
                                <span className={`reception-badge reception-badge--${status}`}>
                                  {SECTION_LABEL[status]}
                                </span>
                              </td>
                              <td>
                                <div className="reception-table__id">{entry.patientId ?? '未登録'}</div>
                                <small className="reception-table__sub">
                                  {entry.receptionId ? `受付ID:${entry.receptionId}` : entry.appointmentId ?? entry.id}
                                </small>
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
                              <td className="reception-table__insurance">{entry.insurance ?? '-'}</td>
                              <td className="reception-table__note">
                                {entry.note ?? '-'}
                                <div className="reception-table__source">source: {entry.source}</div>
                              </td>
                              <td className="reception-table__last">{resolveLastVisitForEntry(entry)}</td>
                              <td className="reception-table__queue">
                                <span className={`reception-queue reception-queue--${queueStatus.tone}`}>
                                  {queueStatus.label}
                                </span>
                                {queueStatus.detail && <small className="reception-table__sub">{queueStatus.detail}</small>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>

          <aside className="reception-layout__side" aria-label="右ペイン">
            <section className="reception-sidepane" data-run-id={mergedMeta.runId}>
              <header className="reception-sidepane__header">
                <h2>患者概要</h2>
                <span className="reception-sidepane__meta">
                  {selectedEntry?.name ?? '未選択'}
                </span>
              </header>
              {!selectedEntry ? (
                <p className="reception-sidepane__empty">一覧の行を選択すると詳細が表示されます。</p>
              ) : (
                <div className="reception-sidepane__grid">
                  <div className="reception-sidepane__item">
                    <span>患者ID</span>
                    <strong>{selectedEntry.patientId ?? '未登録'}</strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>氏名</span>
                    <strong>{selectedEntry.name ?? '未登録'}</strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>カナ</span>
                    <strong>{selectedEntry.kana ?? '—'}</strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>性別/生年月日</span>
                    <strong>
                      {selectedEntry.sex ?? '—'} / {selectedEntry.birthDate ?? '—'}
                    </strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>保険/自費</span>
                    <strong>{selectedEntry.insurance ?? '—'}</strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>診療科/担当医</span>
                    <strong>
                      {selectedEntry.department ?? '—'} / {selectedEntry.physician ?? '—'}
                    </strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>直近診療</span>
                    <strong>{resolveLastVisitForEntry(selectedEntry)}</strong>
                  </div>
                </div>
              )}
            </section>

            <section className="reception-sidepane" data-run-id={mergedMeta.runId}>
              <header className="reception-sidepane__header">
                <h2>オーダー概要</h2>
                <span className="reception-sidepane__meta">
                  {selectedBundle?.claimStatus ?? selectedBundle?.claimStatusText ?? '未取得'}
                </span>
              </header>
              {!selectedEntry ? (
                <p className="reception-sidepane__empty">対象患者を選択してください。</p>
              ) : (
                <div className="reception-sidepane__grid">
                  <div className="reception-sidepane__item">
                    <span>請求状態</span>
                    <strong>{selectedBundle?.claimStatus ?? selectedBundle?.claimStatusText ?? '未取得'}</strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>バンドル</span>
                    <strong>{selectedBundle?.bundleNumber ?? '—'}</strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>合計金額</span>
                    <strong>
                      {selectedBundle?.totalClaimAmount !== undefined
                        ? `${selectedBundle.totalClaimAmount.toLocaleString()}円`
                        : '—'}
                    </strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>診療時間</span>
                    <strong>{toDateLabel(selectedBundle?.performTime)}</strong>
                  </div>
                  <div className="reception-sidepane__item">
                    <span>ORCAキュー</span>
                    <strong>{selectedQueueStatus.label}</strong>
                    {selectedQueueStatus.detail && <small>{selectedQueueStatus.detail}</small>}
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
              nextAction={tone === 'error' || mergedMeta.missingMaster ? 'マスタ再取得' : 'ORCA再送'}
              transitionDescription={transitionMeta.description}
              onMasterSourceChange={handleMasterSourceChange}
              onToggleMissingMaster={handleToggleMissingMaster}
              onToggleCacheHit={handleToggleCacheHit}
              onMissingMasterNoteChange={handleMissingMasterNoteChange}
            />
          </aside>
        </section>
      </main>
    </>
  );
}
