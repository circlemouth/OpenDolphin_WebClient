import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { getAuditEventLog, logUiState, type AuditEventRecord } from '../../libs/audit/auditLogger';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import { StatusBadge } from '../shared/StatusBadge';
import { ApiFailureBanner } from '../shared/ApiFailureBanner';
import { AdminBroadcastBanner } from '../shared/AdminBroadcastBanner';
import { ToneBanner } from '../reception/components/ToneBanner';
import { applyAuthServicePatch, useAuthService, type AuthServiceFlags, type DataSourceTransition } from '../charts/authService';
import { buildChartsUrl, normalizeRunId, normalizeVisitDate, parseReceptionCarryoverParams } from '../charts/encounterContext';
import { useSession } from '../../AppRouter';
import { buildFacilityPath, parseFacilityPath } from '../../routes/facilityRoutes';
import { PatientFormErrorAlert } from './PatientFormErrorAlert';
import { useAppToast } from '../../libs/ui/appToast';
import { useAdminBroadcast } from '../../libs/admin/useAdminBroadcast';
import {
  fetchPatients,
  savePatient,
  type PatientListResponse,
  type PatientMutationPayload,
  type PatientMutationResult,
  type PatientRecord,
} from './api';
import { validatePatientMutation, type PatientValidationError } from './patientValidation';
import {
  loadOutpatientSavedViews,
  removeOutpatientSavedView,
  type OutpatientSavedView,
  type PaymentMode,
  upsertOutpatientSavedView,
} from '../outpatient/savedViews';
import './patients.css';

const FILTER_STORAGE_KEY = 'patients-filter-state';
const RECEPTION_FILTER_STORAGE_KEY = 'reception-filter-state';
const RETURN_TO_STORAGE_KEY = 'opendolphin:web-client:patients:returnTo:v1';

const DEFAULT_FILTER = {
  keyword: '',
  department: '',
  physician: '',
  paymentMode: 'all' as 'all' | 'insurance' | 'self',
};

const normalizePaymentMode = (value?: string | null): PaymentMode | undefined =>
  value === 'insurance' || value === 'self' ? value : undefined;

const toSearchParams = (filters: typeof DEFAULT_FILTER) => {
  const params = new URLSearchParams();
  if (filters.keyword) params.set('kw', filters.keyword);
  if (filters.department) params.set('dept', filters.department);
  if (filters.physician) params.set('phys', filters.physician);
  if (filters.paymentMode && filters.paymentMode !== 'all') params.set('pay', filters.paymentMode);
  return params;
};

const pickString = (value: unknown): string | undefined => (typeof value === 'string' && value.length > 0 ? value : undefined);

const isSafeChartsReturnTo = (value?: string | null) => {
  if (!value) return false;
  if (value.startsWith('/charts')) return true;
  const facilityMatch = parseFacilityPath(value);
  return facilityMatch ? facilityMatch.suffix.startsWith('/charts') : false;
};

const readStorageJson = (key: string) => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const readFilters = (searchParams: URLSearchParams): typeof DEFAULT_FILTER => {
  const receptionStored = readStorageJson(RECEPTION_FILTER_STORAGE_KEY);
  const patientStored = readStorageJson(FILTER_STORAGE_KEY);

  const fromUrl: Partial<typeof DEFAULT_FILTER> = {
    keyword: searchParams.get('kw') ?? undefined,
    department: searchParams.get('dept') ?? undefined,
    physician: searchParams.get('phys') ?? undefined,
    paymentMode: normalizePaymentMode(searchParams.get('pay')),
  };

  const normalizedReception: Partial<typeof DEFAULT_FILTER> = {
    keyword: (receptionStored?.kw as string | undefined) ?? undefined,
    department: (receptionStored?.dept as string | undefined) ?? undefined,
    physician: (receptionStored?.phys as string | undefined) ?? undefined,
    paymentMode: normalizePaymentMode(receptionStored?.pay as string | undefined),
  };

  const normalizedPatients: Partial<typeof DEFAULT_FILTER> = {
    keyword: (patientStored?.keyword as string | undefined) ?? (patientStored?.kw as string | undefined),
    department: (patientStored?.department as string | undefined) ?? (patientStored?.dept as string | undefined),
    physician: (patientStored?.physician as string | undefined) ?? (patientStored?.phys as string | undefined),
    paymentMode: normalizePaymentMode(patientStored?.paymentMode as string | undefined),
  };

  return {
    ...DEFAULT_FILTER,
    ...normalizedReception,
    ...normalizedPatients,
    ...Object.fromEntries(Object.entries(fromUrl).filter(([, v]) => v !== undefined)),
  } as typeof DEFAULT_FILTER;
};

const normalizeAuditValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).normalize('NFKC').toLowerCase();
};

const resolveUnlinkedState = (patient?: PatientRecord | null) => {
  const missingPatientId = !patient?.patientId;
  const missingName = !patient?.name;
  return {
    missingPatientId,
    missingName,
    isUnlinked: missingPatientId || missingName,
  };
};

type ToastState = {
  tone: 'warning' | 'success' | 'error' | 'info';
  message: string;
  detail?: string;
};

type PatientsPageProps = {
  runId: string;
};

export function PatientsPage({ runId }: PatientsPageProps) {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueue } = useAppToast();
  const fromCharts = searchParams.get('from') === 'charts';
  const receptionCarryover = useMemo(() => parseReceptionCarryoverParams(location.search), [location.search]);
  const patientIdParam = searchParams.get('patientId') ?? undefined;
  const appointmentIdParam = searchParams.get('appointmentId') ?? undefined;
  const receptionIdParam = searchParams.get('receptionId') ?? undefined;
  const visitDateParam = normalizeVisitDate(searchParams.get('visitDate') ?? undefined);
  const runIdParam = normalizeRunId(searchParams.get('runId') ?? undefined);
  const returnToParam = searchParams.get('returnTo') ?? undefined;
  const chartsReturnUrl = useMemo(() => {
    if (!fromCharts) return null;
    if (isSafeChartsReturnTo(returnToParam)) return returnToParam;
    const storedReturnTo = (() => {
      if (typeof sessionStorage === 'undefined') return undefined;
      try {
        return sessionStorage.getItem(RETURN_TO_STORAGE_KEY) ?? undefined;
      } catch {
        return undefined;
      }
    })();
    if (isSafeChartsReturnTo(storedReturnTo)) return storedReturnTo;
    const patientId = patientIdParam ?? searchParams.get('kw') ?? undefined;
    return buildChartsUrl(
      { patientId, appointmentId: appointmentIdParam, receptionId: receptionIdParam, visitDate: visitDateParam },
      receptionCarryover,
      { runId: runIdParam ?? runId },
      buildFacilityPath(session.facilityId, '/charts'),
    );
  }, [
    appointmentIdParam,
    fromCharts,
    patientIdParam,
    receptionCarryover,
    receptionIdParam,
    returnToParam,
    runIdParam,
    runId,
    searchParams,
    session.facilityId,
    visitDateParam,
  ]);
  const initialFilters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [form, setForm] = useState<PatientRecord>({});
  const [baseline, setBaseline] = useState<PatientRecord | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [lastAuditEvent, setLastAuditEvent] = useState<Record<string, unknown> | undefined>();
  const [lastSaveResult, setLastSaveResult] = useState<PatientMutationResult | null>(null);
  const [auditSnapshot, setAuditSnapshot] = useState<AuditEventRecord[]>(() => getAuditEventLog());
  const [validationErrors, setValidationErrors] = useState<PatientValidationError[]>([]);
  const [lastAttempt, setLastAttempt] = useState<PatientMutationPayload | null>(null);
  const baselineRef = useRef<PatientRecord | null>(null);
  const [savedViews, setSavedViews] = useState<OutpatientSavedView[]>(() => loadOutpatientSavedViews());
  const [savedViewName, setSavedViewName] = useState('');
  const [selectedViewId, setSelectedViewId] = useState<string>('');
  const lastUnlinkedToastKey = useRef<string | null>(null);
  const lastChartsPatientId = useRef<string | null>(null);
  const [auditKeyword, setAuditKeyword] = useState('');
  const [auditOutcome, setAuditOutcome] = useState<'all' | 'success' | 'error' | 'warning' | 'partial' | 'unknown'>('all');
  const [auditScope, setAuditScope] = useState<'selected' | 'all'>('selected');
  const [auditSort, setAuditSort] = useState<'desc' | 'asc'>('desc');
  const [auditLimit, setAuditLimit] = useState<'10' | '20' | '50' | 'all'>('10');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [lastMeta, setLastMeta] = useState<
    Pick<PatientListResponse, 'missingMaster' | 'fallbackUsed' | 'cacheHit' | 'dataSourceTransition' | 'runId' | 'fetchedAt' | 'recordsReturned'>
  >({
    missingMaster: undefined,
    fallbackUsed: undefined,
    cacheHit: undefined,
    dataSourceTransition: undefined,
    runId,
    fetchedAt: undefined,
    recordsReturned: undefined,
  });
  const appliedMeta = useRef<Partial<AuthServiceFlags>>({});
  const { flags, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed, bumpRunId } = useAuthService();
  const { broadcast } = useAdminBroadcast();

  useEffect(() => {
    const merged = readFilters(searchParams);
    setFilters((prev) => {
      const next = { ...prev, ...merged };
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    const carryoverSource = new URLSearchParams(location.search);
    const receptionStored = readStorageJson(RECEPTION_FILTER_STORAGE_KEY);
    const sortFromUrl = carryoverSource.get('sort');
    const dateFromUrl = carryoverSource.get('date');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
      const receptionSnapshot = {
        ...(receptionStored ?? {}),
        kw: filters.keyword,
        dept: filters.department,
        phys: filters.physician,
        pay: filters.paymentMode,
        sort: sortFromUrl ?? receptionStored?.sort,
        date: dateFromUrl ?? receptionStored?.date,
      };
      localStorage.setItem(RECEPTION_FILTER_STORAGE_KEY, JSON.stringify(receptionSnapshot));
    }
    const params = toSearchParams(filters);
    const sort = sortFromUrl ?? pickString(receptionStored?.sort);
    const date = dateFromUrl ?? pickString(receptionStored?.date);
    const from = carryoverSource.get('from');
    const patientId = carryoverSource.get('patientId');
    const appointmentId = carryoverSource.get('appointmentId');
    const receptionId = carryoverSource.get('receptionId');
    const visitDate = carryoverSource.get('visitDate');
    const returnTo = carryoverSource.get('returnTo');
    const runIdFromUrl = carryoverSource.get('runId');
    if (sort) params.set('sort', sort);
    if (date) params.set('date', date);
    if (from) params.set('from', from);
    if (patientId) params.set('patientId', patientId);
    if (appointmentId) params.set('appointmentId', appointmentId);
    if (receptionId) params.set('receptionId', receptionId);
    if (visitDate) params.set('visitDate', visitDate);
    if (returnTo) params.set('returnTo', returnTo);
    if (runIdFromUrl) params.set('runId', runIdFromUrl);
    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    if (nextSearch !== currentSearch) {
      setSearchParams(params, { replace: true });
    }
  }, [filters, location.search, setSearchParams]);

  const patientsQuery = useQuery({
    queryKey: ['patients', filters],
    queryFn: () =>
      fetchPatients({
        keyword: filters.keyword || undefined,
        departmentCode: filters.department || undefined,
        physicianCode: filters.physician || undefined,
        paymentMode: filters.paymentMode,
      }),
    staleTime: 60_000,
  });
  const refetchPatients = patientsQuery.refetch;

  useEffect(() => {
    if (!broadcast?.updatedAt) return;
    void refetchPatients();
  }, [broadcast?.updatedAt, refetchPatients]);

  const patientsErrorContext = useMemo(() => {
    const httpStatus = patientsQuery.data?.status;
    const hasHttpError = typeof httpStatus === 'number' && httpStatus >= 400;
    const error = patientsQuery.isError ? patientsQuery.error : patientsQuery.data?.error;
    if (!error && !hasHttpError) return null;
    return {
      error,
      httpStatus,
    };
  }, [patientsQuery.data?.error, patientsQuery.data?.status, patientsQuery.error, patientsQuery.isError]);

  useEffect(() => {
    const meta = patientsQuery.data;
    if (!meta) return;
    appliedMeta.current = applyAuthServicePatch(
      {
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        dataSourceTransition: meta.dataSourceTransition as DataSourceTransition | undefined,
        fallbackUsed: meta.fallbackUsed,
      },
      appliedMeta.current,
      { bumpRunId, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed },
    );
    setLastAuditEvent(meta.auditEvent);
    setLastMeta({
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      cacheHit: meta.cacheHit,
      dataSourceTransition: meta.dataSourceTransition,
      runId: meta.runId,
      fetchedAt: meta.fetchedAt,
      recordsReturned: meta.recordsReturned,
    });
  }, [bumpRunId, patientsQuery.data, setCacheHit, setDataSourceTransition, setFallbackUsed, setMissingMaster]);

  const patients = patientsQuery.data?.patients ?? [];
  const resolvedRunId = patientsQuery.data?.runId ?? flags.runId;
  const resolvedCacheHit = patientsQuery.data?.cacheHit ?? flags.cacheHit ?? lastMeta.cacheHit ?? false;
  const resolvedMissingMaster = patientsQuery.data?.missingMaster ?? flags.missingMaster ?? lastMeta.missingMaster ?? false;
  const resolvedFallbackUsed = patientsQuery.data?.fallbackUsed ?? flags.fallbackUsed ?? lastMeta.fallbackUsed ?? false;
  const resolvedTransition =
    patientsQuery.data?.dataSourceTransition ?? flags.dataSourceTransition ?? lastMeta.dataSourceTransition;
  const resolvedFetchedAt = patientsQuery.data?.fetchedAt ?? lastMeta.fetchedAt;
  const resolvedRecordsReturned = patientsQuery.data?.recordsReturned ?? lastMeta.recordsReturned;
  const isUnlinkedStopNotice = resolvedMissingMaster || resolvedFallbackUsed;
  const unlinkedAlertLabel = isUnlinkedStopNotice ? '反映停止注意' : '未紐付警告';
  const unlinkedBadgeLabel = isUnlinkedStopNotice ? '反映停止' : '未紐付';

  const tonePayload: ChartTonePayload = {
    missingMaster: resolvedMissingMaster,
    cacheHit: resolvedCacheHit,
    dataSourceTransition: resolvedTransition,
  };
  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const unlinkedCounts = useMemo(() => {
    return patients.reduce(
      (acc, patient) => {
        const state = resolveUnlinkedState(patient);
        if (state.missingPatientId) acc.missingPatientId += 1;
        if (state.missingName) acc.missingName += 1;
        return acc;
      },
      { missingPatientId: 0, missingName: 0 },
    );
  }, [patients]);

  const unlinkedNotice = useMemo(() => {
    if (unlinkedCounts.missingPatientId === 0 && unlinkedCounts.missingName === 0) return null;
    const parts = [
      unlinkedCounts.missingPatientId > 0 ? `患者ID未紐付: ${unlinkedCounts.missingPatientId}` : undefined,
      unlinkedCounts.missingName > 0 ? `氏名未紐付: ${unlinkedCounts.missingName}` : undefined,
    ].filter((value): value is string => typeof value === 'string');
    const message = `患者一覧に${unlinkedAlertLabel}があります（${parts.join(' / ')}）`;
    const key = `${unlinkedCounts.missingPatientId}-${unlinkedCounts.missingName}-${resolvedRunId ?? 'runId'}`;
    return { message, detail: `recordsReturned=${resolvedRecordsReturned ?? '―'}`, key };
  }, [resolvedRecordsReturned, resolvedRunId, unlinkedAlertLabel, unlinkedCounts.missingName, unlinkedCounts.missingPatientId]);

  const selectedUnlinked = useMemo(() => {
    if (!baseline) return null;
    const state = resolveUnlinkedState(form);
    return state.isUnlinked ? state : null;
  }, [baseline, form]);

  const chartsArrivalBanner = useMemo(() => {
    if (!fromCharts) return null;
    const hasPatient = Boolean(patientIdParam);
    const matched = hasPatient && patients.some((patient) => patient.patientId === patientIdParam);
    if (hasPatient && !matched) {
      return {
        tone: 'warning' as const,
        message: 'Charts から移動しましたが、対象患者が一覧に見つかりません。Reception の検索条件を確認してください。',
        nextAction: '検索条件を見直す',
      };
    }
    return {
      tone: 'warning' as const,
      message: 'Charts から患者管理へ移動しました。受付フィルタを維持しているため、操作前に対象患者を確認してください。',
      nextAction: '対象患者を確認',
    };
  }, [fromCharts, patientIdParam, patients]);

  useEffect(() => {
    if (!unlinkedNotice) {
      lastUnlinkedToastKey.current = null;
      return;
    }
    if (lastUnlinkedToastKey.current === unlinkedNotice.key) return;
    lastUnlinkedToastKey.current = unlinkedNotice.key;
    enqueue({
      id: `patients-unlinked-${unlinkedNotice.key}`,
      tone: 'warning',
      message: unlinkedNotice.message,
      detail: unlinkedNotice.detail,
    });
  }, [enqueue, unlinkedNotice]);

  useEffect(() => {
    if (!selectedId && patients[0]) {
      setSelectedId(patients[0].patientId ?? patients[0].name ?? patients[0].kana ?? 'new');
      setForm(patients[0]);
      setBaseline(patients[0]);
      baselineRef.current = patients[0];
    }
  }, [patients, selectedId]);

  useEffect(() => {
    if (!patientIdParam) return;
    if (lastChartsPatientId.current === patientIdParam) return;
    const target = patients.find((patient) => patient.patientId === patientIdParam);
    if (target) {
      setSelectedId(patientIdParam);
      setForm(target);
      setBaseline(target);
      baselineRef.current = target;
    }
    lastChartsPatientId.current = patientIdParam;
  }, [patientIdParam, patients]);

  useEffect(() => {
    if (!lastAuditEvent) return;
    setAuditSnapshot(getAuditEventLog());
  }, [lastAuditEvent]);

  const handleSelect = (patient: PatientRecord) => {
    setSelectedId(patient.patientId ?? patient.name ?? 'new');
    setForm(patient);
    setBaseline(patient);
    baselineRef.current = patient;
    setValidationErrors([]);
    setLastAttempt(null);
    logUiState({
      action: 'tone_change',
      screen: 'patients',
      controlId: 'select-patient',
      runId: resolvedRunId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      dataSourceTransition: resolvedTransition,
      fallbackUsed: resolvedFallbackUsed,
      details: { patientId: patient.patientId },
    });
  };

  const handleNew = () => {
    const draft: PatientRecord = {
      patientId: '',
      name: '',
      kana: '',
      birthDate: '',
      sex: '',
      phone: '',
      insurance: '',
      memo: '',
    };
    setSelectedId(undefined);
    setForm(draft);
    setBaseline(null);
    baselineRef.current = null;
    setValidationErrors([]);
    setLastAttempt(null);
  };

  const mutation = useMutation({
    mutationFn: (payload: PatientMutationPayload) => savePatient(payload),
    onSuccess: (result: PatientMutationResult, variables) => {
      setLastAuditEvent(result.auditEvent);
      setLastSaveResult(result);
      setToast({ tone: result.ok ? 'success' : 'error', message: result.message ?? '保存しました' });
      appliedMeta.current = applyAuthServicePatch(
        {
          runId: result.runId,
          cacheHit: result.cacheHit,
          missingMaster: result.missingMaster,
          dataSourceTransition: result.dataSourceTransition,
          fallbackUsed: result.fallbackUsed,
        },
        appliedMeta.current,
        { bumpRunId, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed },
      );
      setLastMeta((prev) => ({
        missingMaster: result.missingMaster ?? prev.missingMaster,
        fallbackUsed: result.fallbackUsed ?? prev.fallbackUsed,
        cacheHit: result.cacheHit ?? prev.cacheHit,
        dataSourceTransition: result.dataSourceTransition ?? prev.dataSourceTransition,
        runId: result.runId ?? prev.runId,
      }));
      if (result.ok) {
        setBaseline(variables.patient);
        baselineRef.current = variables.patient;
        setValidationErrors([]);
        setLastAttempt(null);
      } else {
        setLastAttempt(variables);
      }
      patientsQuery.refetch();
    },
    onError: (error: unknown) => {
      setToast({ tone: 'error', message: '保存に失敗しました', detail: error instanceof Error ? error.message : String(error) });
      // onError は network/throw のみなので、直前の attempt を残して UI から再試行できるようにする
      setLastSaveResult({
        ok: false,
        message: '保存に失敗しました',
      });
    },
  });

  const missingMasterFlag = resolvedMissingMaster;
  const fallbackUsedFlag = resolvedFallbackUsed;
  const masterOk = !missingMasterFlag && !fallbackUsedFlag && (resolvedTransition ?? 'server') === 'server';
  const blockReasons = useMemo(() => {
    const reasons: string[] = [];
    if (missingMasterFlag) reasons.push('missingMaster=true: ORCAマスタ未取得のため編集不可');
    if (fallbackUsedFlag) reasons.push('fallbackUsed=true: フォールバックデータのため編集不可');
    if ((resolvedTransition ?? 'server') !== 'server') {
      reasons.push(`dataSourceTransition=${resolvedTransition ?? 'unknown'}: 非serverルートのため編集不可`);
    }
    return reasons;
  }, [fallbackUsedFlag, missingMasterFlag, resolvedTransition]);
  const blocking = blockReasons.length > 0;

  const currentOrcaStatus = useMemo(() => {
    if (missingMasterFlag) {
      return { state: '反映停止', detail: 'missingMaster=true のため ORCA 反映を停止中' };
    }
    if (fallbackUsedFlag) {
      return { state: '反映停止', detail: 'fallbackUsed=true のため ORCA 反映を停止中' };
    }
    if ((resolvedTransition ?? 'server') !== 'server') {
      return { state: '反映停止', detail: `dataSourceTransition=${resolvedTransition ?? 'unknown'} のため ORCA 反映を停止中` };
    }
    return { state: '反映可能', detail: 'server ルートで ORCA 反映可能' };
  }, [fallbackUsedFlag, missingMasterFlag, resolvedTransition]);

  const lastSaveOrcaStatus = useMemo(() => {
    if (!lastSaveResult) return { state: '未送信', detail: '保存操作がまだありません' };
    if (lastSaveResult.missingMaster) return { state: '反映停止', detail: 'missingMaster=true のため ORCA 反映を停止' };
    if (lastSaveResult.fallbackUsed) return { state: '反映停止', detail: 'fallbackUsed=true のため ORCA 反映を停止' };
    if ((lastSaveResult.dataSourceTransition ?? 'server') !== 'server') {
      return { state: '反映停止', detail: `dataSourceTransition=${lastSaveResult.dataSourceTransition ?? 'unknown'} のため ORCA 反映を停止` };
    }
    if (!lastSaveResult.ok) {
      return { state: '反映失敗', detail: lastSaveResult.message ?? '保存に失敗しました' };
    }
    return {
      state: '反映完了',
      detail: `status=${lastSaveResult.status ?? 'unknown'} / endpoint=${lastSaveResult.sourcePath ?? 'unknown'}`,
    };
  }, [lastSaveResult]);

  const resolveAuditPatientId = (record: AuditEventRecord) => {
    const payload = record.payload as Record<string, unknown> | undefined;
    const details = payload?.details as Record<string, unknown> | undefined;
    return (
      (record.patientId as string | undefined) ??
      (payload?.patientId as string | undefined) ??
      (details?.patientId as string | undefined)
    );
  };

  const auditDateValidation = useMemo(() => {
    if (!auditDateFrom || !auditDateTo) {
      return { fromDate: auditDateFrom, toDate: auditDateTo, isValid: true, message: '' };
    }
    const fromValue = Date.parse(`${auditDateFrom}T00:00:00`);
    const toValue = Date.parse(`${auditDateTo}T23:59:59`);
    if (Number.isNaN(fromValue) || Number.isNaN(toValue)) {
      return { fromDate: auditDateFrom, toDate: auditDateTo, isValid: true, message: '' };
    }
    if (fromValue > toValue) {
      return {
        fromDate: auditDateFrom,
        toDate: auditDateTo,
        isValid: false,
        message: `開始日 (${auditDateFrom}) が終了日 (${auditDateTo}) より後です。`,
      };
    }
    return { fromDate: auditDateFrom, toDate: auditDateTo, isValid: true, message: '' };
  }, [auditDateFrom, auditDateTo]);

  const auditRows = useMemo(() => {
    const selectedPatientId = form.patientId ?? baseline?.patientId ?? undefined;
    const list = [...auditSnapshot];
    const filtered = list.filter((record) => {
      const payload = record.payload as Record<string, unknown> | undefined;
      const action = (payload?.action as string | undefined) ?? '';
      const source = record.source ?? '';
      if (!action.includes('PATIENT') && !source.includes('patient')) return false;
      const recordPatientId = resolveAuditPatientId(record);
      if (auditScope === 'selected' && selectedPatientId) {
        return recordPatientId === selectedPatientId;
      }
      return true;
    });

    const keyword = normalizeAuditValue(auditKeyword).trim();
    const outcomeFilter = normalizeAuditValue(auditOutcome);
    const fromDate = auditDateFrom ? new Date(`${auditDateFrom}T00:00:00`).getTime() : undefined;
    const toDate = auditDateTo ? new Date(`${auditDateTo}T23:59:59`).getTime() : undefined;

    const matches = filtered.filter((record) => {
      const payload = record.payload as Record<string, unknown> | undefined;
      const details = payload?.details as Record<string, unknown> | undefined;
      const action = normalizeAuditValue((payload?.action as string | undefined) ?? '');
      const outcome = normalizeAuditValue(
        (payload?.outcome as string | undefined) ?? (details?.outcome as string | undefined) ?? 'unknown',
      );
      const patientId = resolveAuditPatientId(record);
      const changedKeys = details?.changedKeys as string[] | string | undefined;
      const message = (details?.message as string | undefined) ?? (payload?.message as string | undefined);
      const sourcePath = (details?.sourcePath as string | undefined) ?? (payload?.sourcePath as string | undefined);
      const recordTime = new Date(record.timestamp).getTime();

      if (auditDateValidation.isValid) {
        if (fromDate && recordTime < fromDate) return false;
        if (toDate && recordTime > toDate) return false;
      }

      if (outcomeFilter !== 'all' && outcome !== outcomeFilter) return false;

      if (keyword) {
        const haystack = normalizeAuditValue(
          [
            action,
            outcome,
            record.source ?? '',
            record.note ?? '',
            record.runId ?? '',
            record.traceId ?? '',
            patientId ?? '',
            String(details?.operation ?? ''),
            String(details?.section ?? ''),
            String(details?.appointmentId ?? ''),
            String(details?.receptionId ?? ''),
            String(details?.visitDate ?? ''),
            String(details?.requestId ?? ''),
            typeof changedKeys === 'string' ? changedKeys : Array.isArray(changedKeys) ? changedKeys.join(',') : '',
            message ?? '',
            sourcePath ?? '',
          ].join(' '),
        );
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });

    const sorted = [...matches].sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return auditSort === 'asc' ? aTime - bTime : bTime - aTime;
    });

    const limit = auditLimit === 'all' ? sorted.length : Number(auditLimit);
    return {
      total: sorted.length,
      items: sorted.slice(0, limit),
    };
  }, [
    auditDateFrom,
    auditDateTo,
    auditDateValidation.isValid,
    auditKeyword,
    auditLimit,
    auditOutcome,
    auditScope,
    auditSnapshot,
    auditSort,
    baseline?.patientId,
    form.patientId,
  ]);

  const describeAudit = (record: AuditEventRecord) => {
    const payload = record.payload as Record<string, unknown> | undefined;
    const details = payload?.details as Record<string, unknown> | undefined;
    const action =
      (payload?.action as string | undefined) ??
      (details?.operation ? `PATIENT_${String(details.operation).toUpperCase()}` : undefined) ??
      'PATIENT_EVENT';
    const outcome = (payload?.outcome as string | undefined) ?? (details?.outcome as string | undefined) ?? '—';
    const runId = (payload?.runId as string | undefined) ?? record.runId ?? '—';
    const traceId = (payload?.traceId as string | undefined) ?? record.traceId ?? '—';
    const requestId = (payload?.requestId as string | undefined) ?? (details?.requestId as string | undefined) ?? '—';
    const patientId = resolveAuditPatientId(record) ?? '—';
    const changedKeysRaw = details?.changedKeys as string[] | string | undefined;
    const changedKeys = Array.isArray(changedKeysRaw)
      ? changedKeysRaw.length <= 5
        ? changedKeysRaw.join(', ')
        : `${changedKeysRaw.slice(0, 5).join(', ')} 他${changedKeysRaw.length - 5}件`
      : changedKeysRaw ?? '';
    const status = details?.status as string | number | undefined;
    const sourcePath = details?.sourcePath as string | undefined;
    const message = (details?.message as string | undefined) ?? (payload?.message as string | undefined);
    const section = (details?.section as string | undefined) ?? (payload?.section as string | undefined);
    const operation = (details?.operation as string | undefined) ?? (payload?.operation as string | undefined);
    const orcaStatus =
      record.missingMaster || record.fallbackUsed || record.dataSourceTransition !== 'server'
        ? '反映停止'
        : outcome === 'success'
          ? '反映完了'
          : outcome === 'error'
            ? '反映失敗'
            : '反映待ち';
    return {
      action,
      outcome,
      runId,
      traceId,
      requestId,
      patientId,
      changedKeys,
      status,
      sourcePath,
      message,
      section,
      operation,
      orcaStatus,
    };
  };

  const renderAuditMessage = (message?: string) => {
    if (!message) return null;
    if (message.length <= 100) {
      return <span>message: {message}</span>;
    }
    const summary = `${message.slice(0, 100)}…`;
    return (
      <details className="patients-page__audit-message">
        <summary>message: {summary}</summary>
        <div>{message}</div>
      </details>
    );
  };

  const focusField = (field: keyof PatientRecord) => {
    const el = typeof document !== 'undefined' ? (document.getElementById(`patients-form-${String(field)}`) as HTMLElement | null) : null;
    if (el && typeof el.focus === 'function') el.focus();
  };

  const save = (operation: 'create' | 'update' | 'delete') => {
    if (blocking) {
      setToast({
        tone: 'warning',
        message: '編集ブロック中のため保存できません',
        detail: blockReasons.join(' / '),
      });
      logUiState({
        action: 'save',
        screen: 'patients',
        controlId: 'save-blocked',
        runId: flags.runId,
        cacheHit: flags.cacheHit,
        missingMaster: missingMasterFlag,
        dataSourceTransition: flags.dataSourceTransition,
        fallbackUsed: fallbackUsedFlag,
      });
      return;
    }

    const validation = validatePatientMutation({ patient: form, operation, context: { masterOk } });
    setValidationErrors(validation);
    if (validation.length > 0) {
      setToast({ tone: 'error', message: '入力エラーがあります（保存できません）。' });
      const firstField = validation.find((e) => e.field && e.field !== 'form')?.field;
      if (firstField && firstField !== 'form') {
        focusField(firstField as keyof PatientRecord);
      }
      return;
    }

    const payload: PatientMutationPayload = {
      patient: form,
      operation,
      runId: flags.runId,
      auditMeta: {
        source: 'patients',
      },
    };
    setLastAttempt(payload);
    mutation.mutate(payload);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const op: 'create' | 'update' = form.patientId ? 'update' : 'create';
    save(op);
  };

  const handleDelete = () => {
    if (!form.patientId) {
      setToast({ tone: 'warning', message: '削除対象の患者IDがありません' });
      return;
    }
    save('delete');
  };

  const onFilterChange = (key: keyof typeof DEFAULT_FILTER, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applySavedView = (view: OutpatientSavedView) => {
    setFilters({
      keyword: view.filters.keyword ?? '',
      department: view.filters.department ?? '',
      physician: view.filters.physician ?? '',
      paymentMode: view.filters.paymentMode ?? 'all',
    });
    patientsQuery.refetch();
  };

  const handleSaveView = () => {
    const label = savedViewName || `検索 ${new Date().toLocaleString()}`;
    const nextViews = upsertOutpatientSavedView({
      label,
      filters: {
        keyword: filters.keyword.trim() || undefined,
        department: filters.department || undefined,
        physician: filters.physician || undefined,
        paymentMode: filters.paymentMode,
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

  const toneLive = missingMasterFlag || fallbackUsedFlag ? 'assertive' : 'polite';

  return (
    <main className="patients-page" data-run-id={resolvedRunId}>
      <header className="patients-page__header">
        <div>
          <p className="patients-page__kicker">Patients 編集と監査連携</p>
          <h1>患者一覧・編集</h1>
          <p className="patients-page__hint" role="status" aria-live="polite">
            Reception で選んだフィルタを復元し、/api01rv2/patient/outpatient で閲覧・/orca12/patientmodv2/outpatient で保存します。取得時は runId/cacheHit/missingMaster/fallbackUsed/dataSourceTransition/fetchedAt/recordsReturned を透過します。
          </p>
        </div>
        <div className="patients-page__badges">
          <StatusBadge label="runId" value={resolvedRunId ?? ''} tone="info" />
          <StatusBadge label="missingMaster" value={String(missingMasterFlag)} tone={missingMasterFlag ? 'warning' : 'success'} ariaLive={toneLive} />
          <StatusBadge label="fallbackUsed" value={String(fallbackUsedFlag)} tone={fallbackUsedFlag ? 'warning' : 'success'} ariaLive={toneLive} />
          <StatusBadge label="cacheHit" value={String(resolvedCacheHit)} tone={resolvedCacheHit ? 'success' : 'warning'} />
          <StatusBadge label="dataSourceTransition" value={resolvedTransition ?? 'unknown'} tone="info" />
          <StatusBadge label="recordsReturned" value={String(resolvedRecordsReturned ?? '―') } tone="info" />
        </div>
      </header>

      <AdminBroadcastBanner broadcast={broadcast} surface="patients" runId={resolvedRunId ?? runId} />
      <ToneBanner tone={tone} message={toneMessage} runId={resolvedRunId} ariaLive={missingMasterFlag || fallbackUsedFlag ? 'assertive' : 'polite'} />
      {chartsArrivalBanner && (
        <ToneBanner
          tone={chartsArrivalBanner.tone}
          message={chartsArrivalBanner.message}
          patientId={patientIdParam}
          receptionId={receptionIdParam}
          destination="Patients"
          nextAction={chartsArrivalBanner.nextAction}
          runId={resolvedRunId}
          ariaLive="assertive"
        />
      )}
      {unlinkedNotice && (
        <ToneBanner
          tone="warning"
          message={unlinkedNotice.message}
          destination="Patients"
          nextAction="一覧を確認"
          runId={resolvedRunId}
          ariaLive="assertive"
        />
      )}

      <section className="patients-page__filters" aria-label="フィルタ" aria-live="polite">
        <label>
          <span>キーワード</span>
          <input
            type="search"
            value={filters.keyword}
            onChange={(event) => onFilterChange('keyword', event.target.value)}
            placeholder="氏名 / カナ / ID"
            aria-label="患者検索キーワード"
          />
        </label>
        <label>
          <span>診療科</span>
          <input
            value={filters.department}
            onChange={(event) => onFilterChange('department', event.target.value)}
            placeholder="例: 内科"
          />
        </label>
        <label>
          <span>担当医</span>
          <input
            value={filters.physician}
            onChange={(event) => onFilterChange('physician', event.target.value)}
            placeholder="例: 藤井"
          />
        </label>
        <label>
          <span>保険/自費</span>
          <select value={filters.paymentMode} onChange={(event) => onFilterChange('paymentMode', event.target.value)}>
            <option value="all">すべて</option>
            <option value="insurance">保険</option>
            <option value="self">自費</option>
          </select>
        </label>
        <button
          type="button"
          className="patients-page__filter-apply"
          onClick={() => patientsQuery.refetch()}
        >
          検索を更新
        </button>
        {fromCharts && chartsReturnUrl ? (
          <button
            type="button"
            className="patients-page__filter-link"
            onClick={() => navigate(chartsReturnUrl)}
          >
            Charts に戻る
          </button>
        ) : null}
        <button
          type="button"
          className="patients-page__filter-link"
          onClick={() => navigate({ pathname: buildFacilityPath(session.facilityId, '/reception'), search: location.search })}
        >
          Reception に戻る
        </button>
        <div className="patients-page__views" aria-label="保存ビュー">
          <div className="patients-page__views-row">
            <label>
              <span>保存ビュー</span>
              <select value={selectedViewId} onChange={(event) => setSelectedViewId(event.target.value)}>
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
              className="patients-page__filter-link"
              onClick={() => {
                const view = savedViews.find((item) => item.id === selectedViewId);
                if (view) applySavedView(view);
              }}
              disabled={!selectedViewId}
            >
              適用
            </button>
            <button type="button" className="patients-page__filter-link" onClick={handleDeleteView} disabled={!selectedViewId}>
              削除
            </button>
          </div>
          <div className="patients-page__views-row">
            <label>
              <span>ビュー名</span>
              <input
                value={savedViewName}
                onChange={(event) => setSavedViewName(event.target.value)}
                placeholder="例: 内科/午前/保険"
              />
            </label>
            <button type="button" className="patients-page__filter-apply" onClick={handleSaveView}>
              現在の条件を保存
            </button>
          </div>
        </div>
        {patientsErrorContext && (
          <ApiFailureBanner
            subject="患者情報"
            destination="Patients"
            runId={patientsQuery.data?.runId ?? flags.runId}
            nextAction="再取得"
            retryLabel="再取得"
            onRetry={() => patientsQuery.refetch()}
            isRetrying={patientsQuery.isFetching}
            {...patientsErrorContext}
          />
        )}
        {resolvedFetchedAt && (
          <p className="patients-page__hint" role="note">
            fetchedAt: {resolvedFetchedAt} ／ recordsReturned: {resolvedRecordsReturned ?? '―'} ／ endpoint: {patientsQuery.data?.sourcePath ?? 'api01rv2/patient/outpatient'}
          </p>
        )}
      </section>

      <section className="patients-page__content">
        <div className="patients-page__list" role="list" aria-label="患者一覧">
          {(unlinkedCounts.missingPatientId > 0 || unlinkedCounts.missingName > 0) && (
            <div className={`patients-page__list-alert${isUnlinkedStopNotice ? ' is-blocked' : ''}`} role="status" aria-live="polite">
              <strong>{unlinkedAlertLabel}</strong>
              <span>患者ID欠損: {unlinkedCounts.missingPatientId}</span>
              <span>氏名欠損: {unlinkedCounts.missingName}</span>
            </div>
          )}
          {patients.length === 0 && (
            <p className="patients-page__empty" role="status" aria-live="polite">
              患者データがありません。フィルタを変えて再検索してください。
            </p>
          )}
          {patients.map((patient) => {
            const selected = selectedId === patient.patientId || (!selectedId && patients[0] === patient);
            const unlinkedState = resolveUnlinkedState(patient);
            return (
              <button
                key={patient.patientId ?? patient.name ?? Math.random().toString(36).slice(2, 8)}
                type="button"
                className={`patients-page__row${selected ? ' is-selected' : ''}${unlinkedState.isUnlinked ? ' is-unlinked' : ''}`}
                onClick={() => handleSelect(patient)}
                aria-pressed={selected}
              >
                <div className="patients-page__row-main">
                  <span className="patients-page__row-id">{patient.patientId ?? '新規'}</span>
                  <strong>{patient.name ?? '氏名未登録'}</strong>
                  <span className="patients-page__row-kana">{patient.kana ?? 'カナ未登録'}</span>
                  {unlinkedState.isUnlinked ? (
                    <span
                      className={`patients-page__row-warning${isUnlinkedStopNotice ? ' is-blocked' : ''}`}
                      role="status"
                      aria-live="polite"
                    >
                      {unlinkedBadgeLabel}
                    </span>
                  ) : null}
                </div>
                <div className="patients-page__row-meta">
                  <span>{patient.birthDate ?? '生年月日未設定'}</span>
                  <span>{patient.insurance ?? '保険未設定'}</span>
                  <span>{patient.lastVisit ? `最終受診 ${patient.lastVisit}` : '受診履歴なし'}</span>
                  {unlinkedState.missingPatientId ? (
                    <span className={`patients-page__row-warning-detail${isUnlinkedStopNotice ? ' is-blocked' : ''}`}>患者ID欠損</span>
                  ) : null}
                  {unlinkedState.missingName ? (
                    <span className={`patients-page__row-warning-detail${isUnlinkedStopNotice ? ' is-blocked' : ''}`}>氏名欠損</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <form className="patients-page__form" onSubmit={handleSubmit} aria-live={blocking ? 'assertive' : 'polite'}>
          <div className="patients-page__form-header">
            <div>
              <p className="patients-page__pill">編集フォーム</p>
              <h2>{form.patientId ? `患者ID ${form.patientId}` : '新規患者'}</h2>
              <p className="patients-page__sub">保存時に runId と auditEvent を付与します。</p>
            </div>
            <div className="patients-page__form-actions">
              <button type="button" onClick={handleNew} className="ghost" disabled={mutation.isPending || blocking}>
                新規作成
              </button>
              <button type="button" onClick={handleDelete} disabled={mutation.isPending || blocking} className="ghost danger">
                削除
              </button>
              <button type="submit" disabled={mutation.isPending || blocking}>
                {mutation.isPending ? '保存中…' : '保存'}
              </button>
            </div>
          </div>

          {selectedUnlinked ? (
            <div className={`patients-page__unlinked-alert${isUnlinkedStopNotice ? ' is-blocked' : ''}`} role="alert" aria-live="assertive">
              <strong>{unlinkedAlertLabel}</strong>
              <p>選択中の患者データに欠損があります。</p>
              <div className="patients-page__unlinked-alert-tags">
                {selectedUnlinked.missingPatientId ? <span>患者ID欠損</span> : null}
                {selectedUnlinked.missingName ? <span>氏名欠損</span> : null}
              </div>
            </div>
          ) : null}

          <div className="patients-page__grid">
            <label>
              <span>患者ID</span>
              <input
                id="patients-form-patientId"
                value={form.patientId ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))}
                placeholder="自動採番または手入力"
                disabled={blocking}
              />
            </label>
            <label>
              <span>氏名</span>
              <input
                id="patients-form-name"
                required
                value={form.name ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="山田 花子"
                aria-invalid={validationErrors.some((e) => e.field === 'name')}
                aria-describedby={validationErrors.some((e) => e.field === 'name') ? 'patients-form-error-name' : undefined}
                disabled={blocking}
              />
              {validationErrors.some((e) => e.field === 'name') ? (
                <small id="patients-form-error-name" className="patients-page__field-error" role="alert">
                  {validationErrors.find((e) => e.field === 'name')?.message}
                </small>
              ) : null}
            </label>
            <label>
              <span>カナ</span>
              <input
                id="patients-form-kana"
                value={form.kana ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, kana: event.target.value }))}
                placeholder="ヤマダ ハナコ"
                aria-invalid={validationErrors.some((e) => e.field === 'kana')}
                aria-describedby={validationErrors.some((e) => e.field === 'kana') ? 'patients-form-error-kana' : undefined}
                disabled={blocking}
              />
              {validationErrors.some((e) => e.field === 'kana') ? (
                <small id="patients-form-error-kana" className="patients-page__field-error" role="alert">
                  {validationErrors.find((e) => e.field === 'kana')?.message}
                </small>
              ) : null}
            </label>
            <label>
              <span>生年月日</span>
              <input
                id="patients-form-birthDate"
                type="date"
                value={form.birthDate ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, birthDate: event.target.value }))}
                aria-invalid={validationErrors.some((e) => e.field === 'birthDate')}
                aria-describedby={validationErrors.some((e) => e.field === 'birthDate') ? 'patients-form-error-birthDate' : undefined}
                disabled={blocking}
              />
              {validationErrors.some((e) => e.field === 'birthDate') ? (
                <small id="patients-form-error-birthDate" className="patients-page__field-error" role="alert">
                  {validationErrors.find((e) => e.field === 'birthDate')?.message}
                </small>
              ) : null}
            </label>
            <label>
              <span>性別</span>
              <select
                id="patients-form-sex"
                value={form.sex ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, sex: event.target.value }))}
                aria-invalid={validationErrors.some((e) => e.field === 'sex')}
                aria-describedby={validationErrors.some((e) => e.field === 'sex') ? 'patients-form-error-sex' : undefined}
                disabled={blocking}
              >
                <option value="">未選択</option>
                <option value="M">男性</option>
                <option value="F">女性</option>
                <option value="O">その他</option>
              </select>
              {validationErrors.some((e) => e.field === 'sex') ? (
                <small id="patients-form-error-sex" className="patients-page__field-error" role="alert">
                  {validationErrors.find((e) => e.field === 'sex')?.message}
                </small>
              ) : null}
            </label>
            <label>
              <span>電話</span>
              <input
                id="patients-form-phone"
                value={form.phone ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="03-1234-5678"
                aria-invalid={validationErrors.some((e) => e.field === 'phone')}
                aria-describedby={validationErrors.some((e) => e.field === 'phone') ? 'patients-form-error-phone' : undefined}
                disabled={blocking}
              />
              {validationErrors.some((e) => e.field === 'phone') ? (
                <small id="patients-form-error-phone" className="patients-page__field-error" role="alert">
                  {validationErrors.find((e) => e.field === 'phone')?.message}
                </small>
              ) : null}
            </label>
            <label>
              <span>郵便番号</span>
              <input
                id="patients-form-zip"
                value={form.zip ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, zip: event.target.value }))}
                placeholder="1000001"
                aria-invalid={validationErrors.some((e) => e.field === 'zip')}
                aria-describedby={validationErrors.some((e) => e.field === 'zip') ? 'patients-form-error-zip' : undefined}
                disabled={blocking}
              />
              {validationErrors.some((e) => e.field === 'zip') ? (
                <small id="patients-form-error-zip" className="patients-page__field-error" role="alert">
                  {validationErrors.find((e) => e.field === 'zip')?.message}
                </small>
              ) : null}
            </label>
            <label className="span-2">
              <span>住所</span>
              <input
                id="patients-form-address"
                value={form.address ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="東京都千代田区..."
                disabled={blocking}
              />
            </label>
            <label>
              <span>保険/自費</span>
              <input
                id="patients-form-insurance"
                value={form.insurance ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, insurance: event.target.value }))}
                placeholder="社保12 / 自費など"
                disabled={blocking}
              />
            </label>
            <label className="span-2">
              <span>メモ</span>
              <textarea
                id="patients-form-memo"
                rows={3}
                value={form.memo ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
                placeholder="アレルギー、受診メモなど"
                disabled={blocking}
              />
            </label>
          </div>

          {blocking && (
            <div className="patients-page__block" role="alert" aria-live="assertive">
              <strong>編集をブロックしました</strong>
              <ul>
                {blockReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p>Reception で master を再取得してから再試行してください。</p>
              <small>現在の ORCA 状態: {currentOrcaStatus.state}（{currentOrcaStatus.detail}）</small>
            </div>
          )}

          <PatientFormErrorAlert errors={validationErrors} onFocusField={focusField} />

          {toast && (
            <div className={`patients-page__toast patients-page__toast--${toast.tone}`} role="alert" aria-live="assertive">
              <strong>{toast.message}</strong>
              {toast.detail && <p>{toast.detail}</p>}
            </div>
          )}

              {(toast?.tone === 'error' || toast?.tone === 'warning') && lastAttempt ? (
            <div className="patients-page__retry-save" role="alert" aria-live="assertive">
              <p className="patients-page__retry-save-title">保存を再試行できます</p>
              <div className="patients-page__retry-save-actions" role="group" aria-label="保存失敗時の操作">
                <button type="button" onClick={() => mutation.mutate(lastAttempt)} disabled={mutation.isPending}>
                  再試行
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const base = baselineRef.current ?? baseline;
                    if (!base) return;
                    setForm(base);
                    setValidationErrors([]);
                    setToast({ tone: 'info', message: '変更を巻き戻しました（直近取得値へ復元）。' });
                  }}
                  disabled={mutation.isPending || !(baselineRef.current ?? baseline)}
                >
                  巻き戻し
                </button>
                <button type="button" onClick={() => patientsQuery.refetch()} disabled={mutation.isPending}>
                  再取得
                </button>
              </div>
            </div>
          ) : null}

          <div className="patients-page__audit-view" role="status" aria-live="polite">
            <div className="patients-page__audit-head">
              <h3>監査ログビュー</h3>
              <div className="patients-page__audit-actions">
                <button type="button" onClick={() => setAuditSnapshot(getAuditEventLog())}>
                  履歴を更新
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuditKeyword('');
                    setAuditOutcome('all');
                    setAuditScope('selected');
                    setAuditSort('desc');
                    setAuditLimit('10');
                    setAuditDateFrom('');
                    setAuditDateTo('');
                  }}
                >
                  フィルタ初期化
                </button>
              </div>
            </div>
            <div className="patients-page__audit-filters" role="group" aria-label="監査検索">
              <label>
                <span>キーワード</span>
                <input
                  value={auditKeyword}
                  onChange={(event) => setAuditKeyword(event.target.value)}
                  placeholder="patientId / runId / action / endpoint"
                />
              </label>
              <label>
                <span>outcome</span>
                <select value={auditOutcome} onChange={(event) => setAuditOutcome(event.target.value as typeof auditOutcome)}>
                  <option value="all">全件</option>
                  <option value="success">success</option>
                  <option value="error">error</option>
                  <option value="warning">warning</option>
                  <option value="partial">partial</option>
                  <option value="unknown">unknown</option>
                </select>
              </label>
              <label>
                <span>対象</span>
                <select value={auditScope} onChange={(event) => setAuditScope(event.target.value as typeof auditScope)}>
                  <option value="selected">選択患者のみ</option>
                  <option value="all">全患者</option>
                </select>
              </label>
              <label>
                <span>並び順</span>
                <select value={auditSort} onChange={(event) => setAuditSort(event.target.value as typeof auditSort)}>
                  <option value="desc">新しい順</option>
                  <option value="asc">古い順</option>
                </select>
              </label>
              <label>
                <span>件数</span>
                <select value={auditLimit} onChange={(event) => setAuditLimit(event.target.value as typeof auditLimit)}>
                  <option value="10">10件</option>
                  <option value="20">20件</option>
                  <option value="50">50件</option>
                  <option value="all">全件</option>
                </select>
              </label>
              <label>
                <span>開始日</span>
                <input type="date" value={auditDateFrom} onChange={(event) => setAuditDateFrom(event.target.value)} />
              </label>
              <label>
                <span>終了日</span>
                <input type="date" value={auditDateTo} onChange={(event) => setAuditDateTo(event.target.value)} />
              </label>
              <div className="patients-page__audit-count" role="status" aria-live="polite">
                対象件数: {auditRows.total}
              </div>
            </div>
            {auditDateValidation.message ? (
              <div className="patients-page__audit-date-error" role="alert" aria-live="assertive">
                {auditDateValidation.message}
              </div>
            ) : null}
            <div className="patients-page__audit-summary">
              <div className="patients-page__audit-card">
                <span>保存結果</span>
                <strong>{lastSaveResult ? (lastSaveResult.ok ? '成功' : '失敗') : '未送信'}</strong>
                <small>
                  runId={lastSaveResult?.runId ?? resolvedRunId ?? '—'} ／ status={lastSaveResult?.status ?? '—'} ／ endpoint=
                  {lastSaveResult?.sourcePath ?? '—'}
                </small>
                {lastSaveResult?.message ? <small>message: {lastSaveResult.message}</small> : null}
              </div>
              <div className="patients-page__audit-card">
                <span>ORCA反映</span>
                <strong>{lastSaveOrcaStatus.state}</strong>
                <small>{lastSaveOrcaStatus.detail}</small>
              </div>
              <div className="patients-page__audit-card">
                <span>現在の反映可否</span>
                <strong>{currentOrcaStatus.state}</strong>
                <small>{currentOrcaStatus.detail}</small>
              </div>
            </div>
            {lastAuditEvent && (
              <div className="patients-page__audit-raw">
                <strong>最新 auditEvent</strong>
                <p>
                  {Object.entries(lastAuditEvent)
                    .map(([key, value]) => `${key}: ${String(value)}`)
                    .join(' ｜ ')}
                </p>
              </div>
            )}
            <div className="patients-page__audit-list" role="list" aria-label="保存履歴">
              {auditRows.items.length === 0 ? (
                <p className="patients-page__audit-empty" role="status" aria-live="polite">
                  まだ保存履歴がありません（Patients/Charts で保存すると反映されます）。
                </p>
              ) : (
                auditRows.items.map((record, index) => {
                  const desc = describeAudit(record);
                  return (
                    <div key={`${record.timestamp}-${index}`} className="patients-page__audit-row" role="listitem">
                      <div className="patients-page__audit-row-main">
                        <strong>{desc.action}</strong>
                        <span className="patients-page__audit-pill">outcome: {desc.outcome}</span>
                        <span className="patients-page__audit-pill">ORCA: {desc.orcaStatus}</span>
                      </div>
                      <div className="patients-page__audit-row-sub">
                        <span>patientId: {desc.patientId}</span>
                        <span>runId: {desc.runId}</span>
                        <span>traceId: {desc.traceId}</span>
                        <span>requestId: {desc.requestId}</span>
                        <span>{record.timestamp}</span>
                        {desc.status ? <span>status: {String(desc.status)}</span> : null}
                        {desc.sourcePath ? <span>endpoint: {desc.sourcePath}</span> : null}
                        {desc.changedKeys ? <span>changedKeys: {desc.changedKeys}</span> : null}
                        {desc.operation ? <span>operation: {desc.operation}</span> : null}
                        {desc.section ? <span>section: {desc.section}</span> : null}
                        {renderAuditMessage(desc.message)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="patients-page__footnote" role="note">
            <span>dataSourceTransition: {transitionMeta.label}</span>
            <span>cacheHit: {String(resolvedCacheHit)}</span>
            <span>missingMaster: {String(missingMasterFlag)}</span>
            <span>fallbackUsed: {String(fallbackUsedFlag)}</span>
            <span>fetchedAt: {resolvedFetchedAt ?? '―'}</span>
            <span>recordsReturned: {resolvedRecordsReturned ?? '―'}</span>
          </div>
        </form>
      </section>
    </main>
  );
}
