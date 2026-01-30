import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { getAuditEventLog, logAuditEvent, logUiState, type AuditEventRecord } from '../../libs/audit/auditLogger';
import { resolveAriaLive, resolveRunId } from '../../libs/observability/observability';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import { ApiFailureBanner } from '../shared/ApiFailureBanner';
import { AdminBroadcastBanner } from '../shared/AdminBroadcastBanner';
import { MissingMasterRecoveryGuide } from '../shared/MissingMasterRecoveryGuide';
import { RunIdBadge } from '../shared/RunIdBadge';
import { StatusPill } from '../shared/StatusPill';
import { AuditSummaryInline } from '../shared/AuditSummaryInline';
import { resolveCacheHitTone, resolveMetaFlagTone, resolveTransitionTone } from '../shared/metaPillRules';
import {
  OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
  formatAutoRefreshTimestamp,
  resolveAutoRefreshIntervalMs,
  useAutoRefreshNotice,
} from '../shared/autoRefreshNotice';
import { MISSING_MASTER_RECOVERY_NEXT_ACTION } from '../shared/missingMasterRecovery';
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
import { fetchPatientMemo, updatePatientMemo, type PatientMemoUpdateResult } from './patientMemoApi';
import { fetchPatientOriginal, type PatientOriginalFormat, type PatientOriginalResponse } from './patientOriginalApi';
import { fetchInsuranceList, type HealthInsuranceEntry, type InsuranceListResponse, type PublicInsuranceEntry } from './insuranceApi';
import { validatePatientMutation, type PatientOperation, type PatientValidationError } from './patientValidation';
import {
  loadOutpatientSavedViews,
  removeOutpatientSavedView,
  type OutpatientSavedView,
  type PaymentMode,
  upsertOutpatientSavedView,
} from '../outpatient/savedViews';
import { buildScopedStorageKey } from '../../libs/session/storageScope';
import './patients.css';

const FILTER_STORAGE_KEY = 'patients-filter-state';
const RECEPTION_FILTER_STORAGE_KEY = 'reception-filter-state';
const RETURN_TO_STORAGE_BASE = 'opendolphin:web-client:patients:returnTo';
const RETURN_TO_VERSION = 'v2';
const RETURN_TO_LEGACY_KEY = `${RETURN_TO_STORAGE_BASE}:v1`;

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

const normalizeSearchKeyword = (value: string) => value.trim().toLowerCase();

const formatInsuranceLabel = (entry: { name?: string; id?: string; classCode?: string }) => {
  const idPart = entry.id ? entry.id : '—';
  const namePart = entry.name ?? '名称不明';
  const classPart = entry.classCode ? `（${entry.classCode}）` : '';
  return `${idPart} ${namePart}${classPart}`;
};

const formatMissingTags = (tags?: string[]) => (tags && tags.length > 0 ? tags.join(', ') : 'なし');

const resolveUnlinkedState = (patient?: PatientRecord | null) => {
  const missingPatientId = !patient?.patientId;
  const missingName = !patient?.name;
  return {
    missingPatientId,
    missingName,
    isUnlinked: missingPatientId || missingName,
  };
};

const resolvePatientKey = (patient: PatientRecord) => {
  if (patient.patientId) return patient.patientId;
  if (patient.name) return `name:${patient.name}`;
  if (patient.kana) return `kana:${patient.kana}`;
  const fallback = [patient.birthDate, patient.sex, patient.insurance].filter(Boolean).join('|');
  return fallback || 'unknown';
};

const normalizePatientRecord = (record?: PatientRecord | null) => ({
  patientId: record?.patientId ?? '',
  name: record?.name ?? '',
  kana: record?.kana ?? '',
  birthDate: record?.birthDate ?? '',
  sex: record?.sex ?? '',
  phone: record?.phone ?? '',
  zip: record?.zip ?? '',
  address: record?.address ?? '',
  insurance: record?.insurance ?? '',
  memo: record?.memo ?? '',
});

type ToastState = {
  tone: 'warning' | 'success' | 'error' | 'info';
  message: string;
  detail?: string;
};

type OrcaMetaItem = {
  label: string;
  value: ReactNode;
  tone?: 'warning';
};

const renderOrcaMeta = (items: OrcaMetaItem[], className?: string) => (
  <div className={`patients-page__orca-meta${className ? ` ${className}` : ''}`} role="list">
    {items.map((item, index) => (
      <div
        key={`${item.label}-${index}`}
        className={`patients-page__orca-meta-item${item.tone === 'warning' ? ' is-warning' : ''}`}
        role="listitem"
      >
        <strong className="patients-page__orca-meta-label">{item.label}:</strong> <span className="patients-page__orca-meta-value">{item.value}</span>
      </div>
    ))}
  </div>
);

type PatientsPageProps = {
  runId: string;
};

export function PatientsPage({ runId }: PatientsPageProps) {
  const session = useSession();
  const storageScope = useMemo(
    () => ({ facilityId: session.facilityId, userId: session.userId }),
    [session.facilityId, session.userId],
  );
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueue } = useAppToast();
  const fromCharts = searchParams.get('from') === 'charts';
  const receptionCarryover = useMemo(() => parseReceptionCarryoverParams(location.search), [location.search]);
  const handleOpenReception = useCallback(() => {
    navigate({ pathname: buildFacilityPath(session.facilityId, '/reception'), search: location.search });
  }, [location.search, navigate, session.facilityId]);
  const patientIdParam = searchParams.get('patientId') ?? undefined;
  const appointmentIdParam = searchParams.get('appointmentId') ?? undefined;
  const receptionIdParam = searchParams.get('receptionId') ?? undefined;
  const visitDateParam = normalizeVisitDate(searchParams.get('visitDate') ?? undefined);
  const runIdParam = normalizeRunId(searchParams.get('runId') ?? undefined);
  const returnToParam = searchParams.get('returnTo') ?? undefined;
  const chartsReturnState = useMemo(() => {
    if (!fromCharts) {
      return {
        url: null,
        label: '未設定',
        detail: 'Charts からの遷移ではないため returnTo はありません。',
        tone: 'neutral' as const,
      };
    }
    if (isSafeChartsReturnTo(returnToParam)) {
      return {
        url: returnToParam,
        label: 'クエリ指定',
        detail: 'returnTo パラメータを使用します。',
        tone: 'success' as const,
      };
    }
    const storedReturnTo = (() => {
      if (typeof sessionStorage === 'undefined') return undefined;
      try {
        const scopedKey =
          buildScopedStorageKey(RETURN_TO_STORAGE_BASE, RETURN_TO_VERSION, storageScope) ?? RETURN_TO_LEGACY_KEY;
        const raw = sessionStorage.getItem(scopedKey) ?? sessionStorage.getItem(RETURN_TO_LEGACY_KEY);
        if (!raw) return undefined;
        if (scopedKey !== RETURN_TO_LEGACY_KEY && !sessionStorage.getItem(scopedKey)) {
          sessionStorage.setItem(scopedKey, raw);
          sessionStorage.removeItem(RETURN_TO_LEGACY_KEY);
        }
        return raw ?? undefined;
      } catch {
        return undefined;
      }
    })();
    if (isSafeChartsReturnTo(storedReturnTo)) {
      return {
        url: storedReturnTo,
        label: '保存済み',
        detail: 'sessionStorage の returnTo を使用します。',
        tone: 'info' as const,
      };
    }
    const patientId = patientIdParam ?? searchParams.get('kw') ?? undefined;
    const fallbackUrl = buildChartsUrl(
      { patientId, appointmentId: appointmentIdParam, receptionId: receptionIdParam, visitDate: visitDateParam },
      receptionCarryover,
      { runId: runIdParam ?? runId },
      buildFacilityPath(session.facilityId, '/charts'),
    );
    return {
      url: fallbackUrl,
      label: '自動生成',
      detail: returnToParam
        ? 'returnTo が不正のため自動生成しました。'
        : 'returnTo が未設定のため自動生成しました。',
      tone: 'warning' as const,
    };
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
    storageScope,
    visitDateParam,
  ]);
  const chartsReturnUrl = chartsReturnState.url;
  const initialFilters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [form, setForm] = useState<PatientRecord>({});
  const [baseline, setBaseline] = useState<PatientRecord | null>(null);
  const [selectionNotice, setSelectionNotice] = useState<{ tone: 'info' | 'warning'; message: string } | null>(null);
  const [selectionLost, setSelectionLost] = useState(false);
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
  const lastPatientsUpdatedAt = useRef<number | null>(null);
  const [auditKeyword, setAuditKeyword] = useState('');
  const [auditOutcome, setAuditOutcome] = useState<'all' | 'success' | 'error' | 'warning' | 'partial' | 'unknown'>('all');
  const [auditScope, setAuditScope] = useState<'selected' | 'all'>('selected');
  const [auditSort, setAuditSort] = useState<'desc' | 'asc'>('desc');
  const [auditLimit, setAuditLimit] = useState<'10' | '20' | '50' | 'all'>('10');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [orcaMemoFilters, setOrcaMemoFilters] = useState({
    baseDate: today,
    memoClass: '',
    departmentCode: '',
  });
  const [orcaMemoEditor, setOrcaMemoEditor] = useState({
    memo: '',
    memoClass: '2',
    departmentCode: '',
    performDate: today,
  });
  const [orcaMemoDirty, setOrcaMemoDirty] = useState(false);
  const [orcaMemoNotice, setOrcaMemoNotice] = useState<ToastState | null>(null);
  const [orcaMemoLastUpdate, setOrcaMemoLastUpdate] = useState<PatientMemoUpdateResult | null>(null);
  const [orcaOriginalFormat, setOrcaOriginalFormat] = useState<PatientOriginalFormat>('xml');
  const [orcaOriginalClass, setOrcaOriginalClass] = useState('');
  const [orcaOriginalResult, setOrcaOriginalResult] = useState<PatientOriginalResponse | null>(null);
  const [orcaOriginalNotice, setOrcaOriginalNotice] = useState<ToastState | null>(null);
  const [insuranceFilters, setInsuranceFilters] = useState({
    baseDate: today,
    keyword: '',
  });
  const [insuranceResult, setInsuranceResult] = useState<InsuranceListResponse | null>(null);
  const [insuranceNotice, setInsuranceNotice] = useState<ToastState | null>(null);
  const [lastMeta, setLastMeta] = useState<
    Pick<
      PatientListResponse,
      | 'missingMaster'
      | 'fallbackUsed'
      | 'cacheHit'
      | 'dataSourceTransition'
      | 'runId'
      | 'fetchedAt'
      | 'recordsReturned'
      | 'apiResult'
      | 'apiResultMessage'
      | 'missingTags'
    >
  >({
    missingMaster: undefined,
    fallbackUsed: undefined,
    cacheHit: undefined,
    dataSourceTransition: undefined,
    runId,
    fetchedAt: undefined,
    recordsReturned: undefined,
    apiResult: undefined,
    apiResultMessage: undefined,
    missingTags: undefined,
  });
  const appliedMeta = useRef<Partial<AuthServiceFlags>>({});
  const { flags, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed, bumpRunId } = useAuthService();
  const { broadcast } = useAdminBroadcast({ facilityId: session.facilityId, userId: session.userId });
  const orcaMemoPatientId = form.patientId ?? selectedId;
  const orcaOriginalPatientId = form.patientId ?? selectedId;
  const insuranceKeyword = normalizeSearchKeyword(insuranceFilters.keyword);
  const filteredHealthInsurances = useMemo(() => {
    if (!insuranceResult?.healthInsurances?.length) return [];
    if (!insuranceKeyword) return insuranceResult.healthInsurances;
    return insuranceResult.healthInsurances.filter((entry) => {
      const target = [entry.providerName, entry.providerId, entry.providerClass].filter(Boolean).join(' ').toLowerCase();
      return target.includes(insuranceKeyword);
    });
  }, [insuranceKeyword, insuranceResult?.healthInsurances]);
  const filteredPublicInsurances = useMemo(() => {
    if (!insuranceResult?.publicInsurances?.length) return [];
    if (!insuranceKeyword) return insuranceResult.publicInsurances;
    return insuranceResult.publicInsurances.filter((entry) => {
      const target = [entry.publicName, entry.publicId, entry.publicClass].filter(Boolean).join(' ').toLowerCase();
      return target.includes(insuranceKeyword);
    });
  }, [insuranceKeyword, insuranceResult?.publicInsurances]);
  const patientOriginalPreview = useMemo(() => {
    if (!orcaOriginalResult) return '—';
    if (orcaOriginalResult.format === 'json') {
      if (orcaOriginalResult.rawJson) {
        return JSON.stringify(orcaOriginalResult.rawJson, null, 2);
      }
      return orcaOriginalResult.rawText || '—';
    }
    return orcaOriginalResult.rawXml ?? orcaOriginalResult.rawText ?? '—';
  }, [orcaOriginalResult]);

  const orcaMemoQuery = useQuery({
    queryKey: [
      'patients-orca-memo',
      orcaMemoPatientId,
      orcaMemoFilters.baseDate,
      orcaMemoFilters.memoClass,
      orcaMemoFilters.departmentCode,
    ],
    queryFn: () => {
      if (!orcaMemoPatientId) throw new Error('patientId is required');
      return fetchPatientMemo({
        patientId: orcaMemoPatientId,
        baseDate: orcaMemoFilters.baseDate || undefined,
        memoClass: orcaMemoFilters.memoClass || undefined,
        departmentCode: orcaMemoFilters.departmentCode || undefined,
      });
    },
    enabled: Boolean(orcaMemoPatientId),
  });

  useEffect(() => {
    if (!orcaMemoPatientId) {
      setOrcaMemoEditor((prev) => ({ ...prev, memo: '', performDate: today }));
      setOrcaMemoDirty(false);
      return;
    }
    setOrcaMemoEditor((prev) => ({ ...prev, performDate: today }));
    setOrcaMemoDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcaMemoPatientId, today]);

  useEffect(() => {
    setOrcaOriginalResult(null);
    setOrcaOriginalNotice(null);
  }, [orcaOriginalPatientId]);

  useEffect(() => {
    const data = orcaMemoQuery.data;
    if (!data) return;
    if (!orcaMemoDirty) {
      const memo = data.memos[0]?.memo ?? '';
      setOrcaMemoEditor((prev) => ({ ...prev, memo }));
    }
    logAuditEvent({
      runId: data.runId ?? runId,
      source: 'patient-memo-fetch',
      payload: {
        action: 'PATIENT_MEMO_FETCH',
        outcome: data.ok ? 'success' : 'error',
        details: {
          patientId: data.patientId,
          baseDate: data.baseDate,
          apiResult: data.apiResult,
          apiResultMessage: data.apiResultMessage,
          status: data.status,
          inputSource: 'memo',
          hasRawXml: Boolean(data.rawXml),
          missingTags: data.missingTags,
        },
      },
    });
  }, [orcaMemoDirty, orcaMemoQuery.data, runId]);

  const orcaMemoMutation = useMutation({
    mutationFn: async () => {
      if (!orcaMemoPatientId) throw new Error('patientId is required');
      return updatePatientMemo({
        patientId: orcaMemoPatientId,
        memo: orcaMemoEditor.memo,
        performDate: orcaMemoEditor.performDate,
        memoClass: orcaMemoEditor.memoClass || undefined,
        departmentCode: orcaMemoEditor.departmentCode || undefined,
      });
    },
    onSuccess: (result) => {
      setOrcaMemoLastUpdate(result);
      setOrcaMemoNotice({
        tone: result.ok ? 'success' : 'error',
        message: result.ok ? 'ORCAメモを更新しました。' : 'ORCAメモの更新に失敗しました。',
        detail: result.apiResultMessage,
      });
      logAuditEvent({
        runId: result.runId ?? runId,
        source: 'patient-memo-update',
        payload: {
          action: 'PATIENT_MEMO_UPDATE',
          outcome: result.ok ? 'success' : 'error',
          details: {
            patientId: orcaMemoPatientId,
            memoClass: orcaMemoEditor.memoClass,
            departmentCode: orcaMemoEditor.departmentCode,
            performDate: orcaMemoEditor.performDate,
            apiResult: result.apiResult,
            apiResultMessage: result.apiResultMessage,
            status: result.status,
            inputSource: 'memo',
            hasRawXml: Boolean(result.rawXml),
            missingTags: result.missingTags,
          },
        },
      });
      if (result.ok) {
        setOrcaMemoDirty(false);
        orcaMemoQuery.refetch();
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      setOrcaMemoNotice({ tone: 'error', message: `ORCAメモの更新に失敗しました: ${message}` });
    },
  });

  const orcaOriginalMutation = useMutation({
    mutationFn: async () => {
      if (!orcaOriginalPatientId) throw new Error('patientId is required');
      return fetchPatientOriginal({
        patientId: orcaOriginalPatientId,
        format: orcaOriginalFormat,
        classCode: orcaOriginalClass || undefined,
      });
    },
    onSuccess: (result) => {
      setOrcaOriginalResult(result);
      setOrcaOriginalNotice({
        tone: result.ok ? 'success' : 'warning',
        message: result.ok ? 'ORCA 原本を取得しました。' : 'ORCA 原本の取得に失敗しました。',
        detail: result.apiResultMessage ?? result.error,
      });
      logAuditEvent({
        runId: result.runId ?? runId,
        source: 'patient-original-fetch',
        payload: {
          action: 'ORCA_PATIENT_GET',
          outcome: result.ok ? 'success' : 'error',
          details: {
            patientId: orcaOriginalPatientId,
            classCode: orcaOriginalClass || undefined,
            format: orcaOriginalFormat,
            apiResult: result.apiResult,
            apiResultMessage: result.apiResultMessage,
            status: result.status,
            inputSource: 'original',
            hasRawXml: Boolean(result.rawXml),
            hasRawJson: Boolean(result.rawJson),
            missingTags: result.missingTags,
          },
        },
      });
      logUiState({
        action: 'orca_original_fetch',
        screen: 'patients',
        runId: result.runId ?? runId,
        details: {
          endpoint: 'patientgetv2',
          patientId: orcaOriginalPatientId,
          format: orcaOriginalFormat,
          status: result.status,
          apiResult: result.apiResult,
          apiResultMessage: result.apiResultMessage,
        },
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      setOrcaOriginalNotice({ tone: 'error', message: `ORCA 原本の取得に失敗しました: ${message}` });
    },
  });

  const insuranceMutation = useMutation({
    mutationFn: async () => {
      return fetchInsuranceList({ baseDate: insuranceFilters.baseDate });
    },
    onSuccess: (result) => {
      setInsuranceResult(result);
      setInsuranceNotice({
        tone: result.ok ? 'success' : 'warning',
        message: result.ok ? '保険者一覧を取得しました。' : '保険者一覧の取得に失敗しました。',
        detail: result.apiResultMessage ?? result.error,
      });
      logAuditEvent({
        runId: result.runId ?? runId,
        source: 'insurance-list-fetch',
        payload: {
          action: 'ORCA_INSURANCE_LIST',
          outcome: result.ok ? 'success' : 'error',
          details: {
            baseDate: result.baseDate ?? insuranceFilters.baseDate,
            apiResult: result.apiResult,
            apiResultMessage: result.apiResultMessage,
            status: result.status,
            inputSource: 'insurance',
            hasRawXml: Boolean(result.rawXml),
            missingTags: result.missingTags,
          },
        },
      });
      logUiState({
        action: 'orca_insurance_list_fetch',
        screen: 'patients',
        runId: result.runId ?? runId,
        details: {
          endpoint: 'insuranceinf1v2',
          baseDate: result.baseDate ?? insuranceFilters.baseDate,
          status: result.status,
          apiResult: result.apiResult,
          apiResultMessage: result.apiResultMessage,
        },
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      setInsuranceNotice({ tone: 'error', message: `保険者一覧の取得に失敗しました: ${message}` });
    },
  });

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
    staleTime: OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
    refetchInterval: OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
  });
  const refetchPatients = patientsQuery.refetch;

  const patientsAutoRefreshNotice = useAutoRefreshNotice({
    subject: '患者一覧',
    dataUpdatedAt: patientsQuery.dataUpdatedAt,
    isFetching: patientsQuery.isFetching,
    isError: patientsQuery.isError,
    intervalMs: OUTPATIENT_AUTO_REFRESH_INTERVAL_MS,
  });

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
      apiResult: meta.apiResult,
      apiResultMessage: meta.apiResultMessage,
      missingTags: meta.missingTags,
    });
  }, [bumpRunId, patientsQuery.data, setCacheHit, setDataSourceTransition, setFallbackUsed, setMissingMaster]);

  const patients = patientsQuery.data?.patients ?? [];
  const resolvedRunId = resolveRunId(patientsQuery.data?.runId ?? flags.runId);
  const infoLive = resolveAriaLive('info');
  const resolvedCacheHit = patientsQuery.data?.cacheHit ?? flags.cacheHit ?? lastMeta.cacheHit ?? false;
  const resolvedMissingMaster = patientsQuery.data?.missingMaster ?? flags.missingMaster ?? lastMeta.missingMaster ?? false;
  const resolvedFallbackUsed = patientsQuery.data?.fallbackUsed ?? flags.fallbackUsed ?? lastMeta.fallbackUsed ?? false;
  const resolvedTransition =
    patientsQuery.data?.dataSourceTransition ?? flags.dataSourceTransition ?? lastMeta.dataSourceTransition;
  const resolvedFetchedAt = patientsQuery.data?.fetchedAt ?? lastMeta.fetchedAt;
  const resolvedRecordsReturned = patientsQuery.data?.recordsReturned ?? lastMeta.recordsReturned;
  const resolvedApiResult = patientsQuery.data?.apiResult ?? lastMeta.apiResult;
  const resolvedApiResultMessage = patientsQuery.data?.apiResultMessage ?? lastMeta.apiResultMessage;
  const resolvedMissingTags = patientsQuery.data?.missingTags ?? lastMeta.missingTags ?? [];
  const masterOk = !resolvedMissingMaster && !resolvedFallbackUsed && (resolvedTransition ?? 'server') === 'server';
  const isUnlinkedStopNotice = resolvedMissingMaster || resolvedFallbackUsed;
  const unlinkedAlertLabel = isUnlinkedStopNotice ? '反映停止注意' : '未紐付警告';
  const unlinkedBadgeLabel = isUnlinkedStopNotice ? '反映停止' : '未紐付';
  const patientsUpdatedAtLabel = useMemo(() => {
    if (!patientsQuery.dataUpdatedAt) return '—';
    return formatAutoRefreshTimestamp(patientsQuery.dataUpdatedAt);
  }, [patientsQuery.dataUpdatedAt]);
  const autoRefreshIntervalLabel = useMemo(() => {
    const resolved = resolveAutoRefreshIntervalMs(OUTPATIENT_AUTO_REFRESH_INTERVAL_MS);
    if (!Number.isFinite(resolved) || resolved <= 0) return '停止';
    return `${Math.round(resolved / 1000)}秒`;
  }, []);
  const hasUnsavedChanges = useMemo(() => {
    const normalizedForm = normalizePatientRecord(form);
    if (!baseline) {
      return Object.values(normalizedForm).some((value) => value !== '');
    }
    return JSON.stringify(normalizedForm) !== JSON.stringify(normalizePatientRecord(baseline));
  }, [baseline, form]);
  const saveOperation: PatientOperation = form.patientId ? 'update' : 'create';
  const liveValidationErrors = useMemo(
    () => validatePatientMutation({ patient: form, operation: saveOperation, context: { masterOk } }),
    [form, masterOk, saveOperation],
  );
  const shouldShowLiveValidation = hasUnsavedChanges || validationErrors.length > 0;
  const displayedValidationErrors = useMemo(
    () => (validationErrors.length ? validationErrors : shouldShowLiveValidation ? liveValidationErrors : []),
    [liveValidationErrors, shouldShowLiveValidation, validationErrors],
  );
  const liveValidationCount = liveValidationErrors.length;
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
  const { blockReasons, blockReasonKeys } = useMemo(() => {
    const reasons: string[] = [];
    const keys: string[] = [];
    if (resolvedMissingMaster) {
      reasons.push('missingMaster=true: ORCAマスタ未取得のため編集不可');
      keys.push('missing_master');
    }
    if (resolvedFallbackUsed) {
      reasons.push('fallbackUsed=true: フォールバックデータのため編集不可');
      keys.push('fallback_used');
    }
    if ((resolvedTransition ?? 'server') !== 'server') {
      const transition = resolvedTransition ?? 'unknown';
      reasons.push(`dataSourceTransition=${transition}: 非serverルートのため編集不可`);
      keys.push(`data_source_transition:${transition}`);
    }
    return { blockReasons: reasons, blockReasonKeys: keys };
  }, [resolvedFallbackUsed, resolvedMissingMaster, resolvedTransition]);
  const blocking = blockReasons.length > 0;
  const missingMasterFlag = resolvedMissingMaster;
  const fallbackUsedFlag = resolvedFallbackUsed;
  const memoValidationErrors: string[] = [];
  if (!orcaMemoPatientId) memoValidationErrors.push('患者IDが未選択です。');
  if (!orcaMemoEditor.performDate) memoValidationErrors.push('Perform_Date が未設定です。');
  if (!orcaMemoEditor.memo.trim()) memoValidationErrors.push('メモが空です。');
  const canSaveMemo = memoValidationErrors.length === 0 && !blocking;
  const fieldErrorMap = useMemo(() => {
    const map = new Map<keyof PatientRecord, PatientValidationError>();
    for (const error of displayedValidationErrors) {
      if (!error.field || error.field === 'form') continue;
      map.set(error.field as keyof PatientRecord, error);
    }
    return map;
  }, [displayedValidationErrors]);
  const buildAriaDescribedBy = (...ids: Array<string | undefined>) => {
    const filtered = ids.filter(Boolean);
    return filtered.length ? filtered.join(' ') : undefined;
  };

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
  const selectedUnlinkedBadge = useMemo(() => {
    if (!selectedUnlinked) return null;
    const parts = [
      selectedUnlinked.missingPatientId ? '患者ID欠損' : null,
      selectedUnlinked.missingName ? '氏名欠損' : null,
    ].filter((value): value is string => Boolean(value));
    return parts.length ? `未紐付: ${parts.join(' / ')}` : '未紐付';
  }, [selectedUnlinked]);

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
    if (!selectedId && patients[0] && !selectionLost) {
      setSelectedId(resolvePatientKey(patients[0]));
      setForm(patients[0]);
      setBaseline(patients[0]);
      baselineRef.current = patients[0];
    }
  }, [patients, selectedId, selectionLost]);

  useEffect(() => {
    if (!patientIdParam) return;
    if (lastChartsPatientId.current === patientIdParam) return;
    const target = patients.find((patient) => patient.patientId === patientIdParam);
    if (target) {
      setSelectedId(resolvePatientKey(target));
      setForm(target);
      setBaseline(target);
      baselineRef.current = target;
      setSelectionLost(false);
    }
    lastChartsPatientId.current = patientIdParam;
  }, [patientIdParam, patients]);

  useEffect(() => {
    if (!selectedId && selectionNotice?.tone !== 'warning') {
      setSelectionNotice(null);
    }
  }, [selectedId, selectionNotice?.tone]);

  useEffect(() => {
    if (!patientsQuery.dataUpdatedAt) return;
    if (lastPatientsUpdatedAt.current === patientsQuery.dataUpdatedAt) return;
    const previous = lastPatientsUpdatedAt.current;
    lastPatientsUpdatedAt.current = patientsQuery.dataUpdatedAt;
    if (!previous) return;
    if (!selectedId) return;
    const selectedPatient = patients.find((patient) => resolvePatientKey(patient) === selectedId);
    if (!selectedPatient) {
      setSelectionNotice({ tone: 'warning', message: '一覧更新で選択中の患者が見つかりません。検索条件を確認してください。' });
      if (!hasUnsavedChanges) {
        setSelectedId(undefined);
        setForm({});
        setBaseline(null);
        baselineRef.current = null;
        setSelectionLost(true);
      }
      return;
    }
    if (hasUnsavedChanges) {
      setSelectionNotice({ tone: 'info', message: '一覧を更新しました。編集中の内容は保持しています。' });
      setSelectionLost(false);
      return;
    }
    setForm(selectedPatient);
    setBaseline(selectedPatient);
    baselineRef.current = selectedPatient;
    setSelectionNotice({ tone: 'info', message: '一覧を更新しました。選択は保持されています。' });
    setSelectionLost(false);
  }, [hasUnsavedChanges, patients, patientsQuery.dataUpdatedAt, selectedId]);

  useEffect(() => {
    if (!lastAuditEvent) return;
    setAuditSnapshot(getAuditEventLog());
  }, [lastAuditEvent]);

  const handleSelect = (patient: PatientRecord) => {
    setSelectedId(resolvePatientKey(patient));
    setForm(patient);
    setBaseline(patient);
    baselineRef.current = patient;
    setValidationErrors([]);
    setLastAttempt(null);
    setSelectionNotice(null);
    setSelectionLost(false);
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

  const saveDisabled = useMemo(
    () => mutation.isPending || blocking || liveValidationCount > 0,
    [blocking, liveValidationCount, mutation.isPending],
  );

  const currentOrcaStatus = useMemo(() => {
    if (missingMasterFlag) {
      return { state: '反映停止', detail: `missingMaster=true のため ORCA 反映を停止中。${MISSING_MASTER_RECOVERY_NEXT_ACTION}してください。` };
    }
    if (fallbackUsedFlag) {
      return { state: '反映停止', detail: `fallbackUsed=true のため ORCA 反映を停止中。${MISSING_MASTER_RECOVERY_NEXT_ACTION}してください。` };
    }
    if ((resolvedTransition ?? 'server') !== 'server') {
      return { state: '反映停止', detail: `dataSourceTransition=${resolvedTransition ?? 'unknown'} のため ORCA 反映を停止中` };
    }
    return { state: '反映可能', detail: 'server ルートで ORCA 反映可能' };
  }, [fallbackUsedFlag, missingMasterFlag, resolvedTransition]);

  const lastSaveOrcaStatus = useMemo(() => {
    if (!lastSaveResult) return { state: '未送信', detail: '保存操作がまだありません' };
    if (lastSaveResult.missingMaster) {
      return { state: '反映停止', detail: `missingMaster=true のため ORCA 反映を停止。${MISSING_MASTER_RECOVERY_NEXT_ACTION}してください。` };
    }
    if (lastSaveResult.fallbackUsed) {
      return { state: '反映停止', detail: `fallbackUsed=true のため ORCA 反映を停止。${MISSING_MASTER_RECOVERY_NEXT_ACTION}してください。` };
    }
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
      logAuditEvent({
        runId: resolvedRunId ?? flags.runId,
        source: 'patient-save',
        cacheHit: resolvedCacheHit,
        missingMaster: missingMasterFlag,
        dataSourceTransition: resolvedTransition,
        fallbackUsed: fallbackUsedFlag,
        patientId: form.patientId,
        payload: {
          action: 'PATIENT_SAVE_BLOCKED',
          outcome: 'blocked',
          details: {
            operation,
            patientId: form.patientId,
            blockedReasons: blockReasonKeys,
            message: blockReasons.join(' / '),
          },
        },
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
        details: {
          blockedReasons: blockReasonKeys,
          message: blockReasons.join(' / '),
        },
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
    setSelectedViewId(view.id);
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
  const handleFilterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    patientsQuery.refetch();
  };
  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTER);
  };

  return (
    <main className="patients-page" data-run-id={resolvedRunId}>
      <header className="patients-page__header">
        <div>
          <p className="patients-page__kicker">Patients 検索・編集</p>
          <h1>患者一覧と編集</h1>
          <p className="patients-page__hint" role="status" aria-live={infoLive}>
            Reception のフィルタを初期値として復元し、/orca/patients/local-search で閲覧、/orca12/patientmodv2/outpatient で保存します。
            RUN_ID と dataSourceTransition/missingMaster/fallbackUsed/cacheHit はヘッダーで、検索結果メタは検索サマリで確認できます。
          </p>
        </div>
        <div className="patients-page__badges" role="status" aria-live={infoLive}>
          <RunIdBadge runId={resolvedRunId} />
          <StatusPill
            className="patients-page__badge"
            label="dataSourceTransition"
            value={resolvedTransition ?? 'unknown'}
            tone={resolveTransitionTone()}
            runId={resolvedRunId}
          />
          <StatusPill
            className="patients-page__badge"
            label="missingMaster"
            value={String(missingMasterFlag)}
            tone={resolveMetaFlagTone(missingMasterFlag)}
            runId={resolvedRunId}
          />
          <StatusPill
            className="patients-page__badge"
            label="fallbackUsed"
            value={String(fallbackUsedFlag)}
            tone={resolveMetaFlagTone(fallbackUsedFlag)}
            runId={resolvedRunId}
          />
          <StatusPill
            className="patients-page__badge"
            label="cacheHit"
            value={String(resolvedCacheHit)}
            tone={resolveCacheHitTone(resolvedCacheHit)}
            runId={resolvedRunId}
          />
          <AuditSummaryInline
            auditEvent={lastAuditEvent}
            variant="inline"
            className="patients-page__badge"
            label="監査サマリ"
            runId={resolvedRunId}
          />
        </div>
      </header>

      <section className="patients-page__return" aria-label="戻り導線" aria-live={infoLive}>
        <div className="patients-page__return-main">
          <span className="patients-page__return-label">戻り導線</span>
          <div className="patients-page__return-actions">
            <button
              type="button"
              className="patients-search__button primary"
              onClick={() => chartsReturnUrl && navigate(chartsReturnUrl)}
              disabled={!chartsReturnUrl}
              title={chartsReturnUrl ? `returnTo: ${chartsReturnUrl}` : 'Charts からの遷移がありません'}
            >
              Charts に戻る
            </button>
            <button type="button" className="patients-search__button ghost" onClick={handleOpenReception}>
              Reception に戻る
            </button>
          </div>
        </div>
        <div className="patients-page__return-meta" role="status" aria-live={infoLive}>
          <StatusPill
            className="patients-page__return-pill"
            label="returnTo"
            value={chartsReturnState.label}
            tone={chartsReturnState.tone}
            runId={resolvedRunId}
          />
          <span className="patients-page__return-detail">{chartsReturnState.detail}</span>
        </div>
      </section>

      <AdminBroadcastBanner broadcast={broadcast} surface="patients" runId={resolvedRunId} />
      {patientsAutoRefreshNotice && (
        <ToneBanner
          tone={patientsAutoRefreshNotice.tone}
          message={patientsAutoRefreshNotice.message}
          destination="Patients"
          nextAction={patientsAutoRefreshNotice.nextAction}
          runId={resolvedRunId}
        />
      )}
      <ToneBanner tone={tone} message={toneMessage} runId={resolvedRunId} />
      {chartsArrivalBanner && (
        <ToneBanner
          tone={chartsArrivalBanner.tone}
          message={chartsArrivalBanner.message}
          patientId={patientIdParam}
          receptionId={receptionIdParam}
          destination="Patients"
          nextAction={chartsArrivalBanner.nextAction}
          runId={resolvedRunId}
        />
      )}
      {unlinkedNotice && (
        <ToneBanner
          tone="warning"
          message={unlinkedNotice.message}
          destination="Patients"
          nextAction="一覧を確認"
          runId={resolvedRunId}
        />
      )}

      <section className="patients-search" aria-label="検索とフィルタ" aria-live={infoLive}>
        <form className="patients-search__form" onSubmit={handleFilterSubmit}>
          <div className="patients-search__row">
            <label className="patients-search__field">
              <span>キーワード</span>
              <input
                type="search"
                value={filters.keyword}
                onChange={(event) => onFilterChange('keyword', event.target.value)}
                placeholder="氏名 / カナ / ID"
                aria-label="患者検索キーワード"
              />
            </label>
            <label className="patients-search__field">
              <span>診療科</span>
              <input
                value={filters.department}
                onChange={(event) => onFilterChange('department', event.target.value)}
                placeholder="例: 内科"
              />
            </label>
            <label className="patients-search__field">
              <span>担当医</span>
              <input
                value={filters.physician}
                onChange={(event) => onFilterChange('physician', event.target.value)}
                placeholder="例: 藤井"
              />
            </label>
            <label className="patients-search__field">
              <span>保険/自費</span>
              <select value={filters.paymentMode} onChange={(event) => onFilterChange('paymentMode', event.target.value)}>
                <option value="all">すべて</option>
                <option value="insurance">保険</option>
                <option value="self">自費</option>
              </select>
            </label>
          </div>
          <div className="patients-search__actions">
            <button type="submit" className="patients-search__button primary">
              検索を更新
            </button>
            <button type="button" className="patients-search__button ghost" onClick={() => patientsQuery.refetch()}>
              再取得
            </button>
            <button type="button" className="patients-search__button ghost" onClick={handleClearFilters}>
              クリア
            </button>
          </div>
        </form>
        <div className="patients-search__saved" aria-label="保存ビュー">
          <div className="patients-search__saved-meta" role="status" aria-live={infoLive}>
            <span className="patients-search__saved-share">Reception ↔ Patients で共有</span>
            <span className="patients-search__saved-updated">
              {selectedSavedView ? `選択中の更新: ${savedViewUpdatedAtLabel ?? '—'}` : '選択中のビューはありません'}
            </span>
          </div>
          <div className="patients-search__saved-row">
            <label className="patients-search__field">
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
              className="patients-search__button ghost"
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
              className="patients-search__button ghost"
              onClick={handleDeleteView}
              disabled={!selectedViewId}
            >
              削除
            </button>
          </div>
          <div className="patients-search__saved-row">
            <label className="patients-search__field">
              <span>ビュー名</span>
              <input
                value={savedViewName}
                onChange={(event) => setSavedViewName(event.target.value)}
                placeholder="例: 内科/午前/保険"
              />
            </label>
            <button type="button" className="patients-search__button primary" onClick={handleSaveView}>
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
        <div className="patients-search__summary" role="status" aria-live={infoLive}>
          <div className="patients-search__summary-main">
            <span className="patients-search__summary-label">検索結果</span>
            <strong>{resolvedRecordsReturned ?? patients.length}件</strong>
            {patientsQuery.isFetching && <span className="patients-search__summary-state">更新中…</span>}
          </div>
          <div className="patients-search__summary-meta">
            <span>更新完了: {patientsUpdatedAtLabel}</span>
            <span>自動更新: {autoRefreshIntervalLabel}</span>
            <span>server fetchedAt: {resolvedFetchedAt ?? '—'}</span>
            <span>endpoint: {patientsQuery.data?.sourcePath ?? 'orca/patients/local-search'}</span>
            <span>Api_Result: {resolvedApiResult ?? '—'}</span>
            <span>Api_Result_Message: {resolvedApiResultMessage ?? '—'}</span>
            <span>不足タグ: {resolvedMissingTags.length ? resolvedMissingTags.join(', ') : 'なし'}</span>
          </div>
          {selectionNotice && (
            <div
              className={`patients-search__summary-note patients-search__summary-note--${selectionNotice.tone}`}
              role="status"
              aria-live={selectionNotice.tone === 'warning' ? 'assertive' : 'polite'}
            >
              {selectionNotice.message}
            </div>
          )}
        </div>
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
            <p className="patients-page__empty" role="status" aria-live={infoLive}>
              0件です。キーワードを見直してください。
              <span className="patients-page__empty-hint">ヒント: ID/氏名/カナ・診療科・担当医で絞れます。</span>
            </p>
          )}
          {patients.map((patient, index) => {
            const selected = selectedId === resolvePatientKey(patient) || (!selectedId && patients[0] === patient);
            const unlinkedState = resolveUnlinkedState(patient);
            return (
              <button
                key={`${resolvePatientKey(patient)}-${index}`}
                type="button"
                className={`patients-page__row${selected ? ' is-selected' : ''}${unlinkedState.isUnlinked ? ' is-unlinked' : ''}`}
                onClick={() => handleSelect(patient)}
                aria-pressed={selected}
              >
                <div className="patients-page__row-main">
                  <StatusPill
                    className="patients-page__row-id"
                    size="xs"
                    tone="info"
                    runId={resolvedRunId}
                    ariaLabel={`患者ID ${patient.patientId ?? '新規'}`}
                  >
                    {patient.patientId ?? '新規'}
                  </StatusPill>
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

        <form className="patients-page__form" onSubmit={handleSubmit} aria-live={resolveAriaLive(blocking ? 'warning' : 'info')}>
          <div className="patients-page__form-header">
            <div>
              <p className="patients-page__pill">編集フォーム</p>
              <div className="patients-page__form-title">
                <h2>{form.patientId ? `患者ID ${form.patientId}` : '新規患者'}</h2>
                {selectedUnlinkedBadge ? (
                  <span className="patients-page__status-pill is-unlinked" role="status">
                    {selectedUnlinkedBadge}
                  </span>
                ) : null}
                {blocking ? (
                  <span className="patients-page__status-pill is-blocked" role="status">
                    編集ブロック中
                  </span>
                ) : null}
              </div>
              <p className="patients-page__sub">保存時に runId と auditEvent を付与します。</p>
              {blocking ? <p className="patients-page__block-summary">編集ブロック中（詳細は下部）</p> : null}
            </div>
            <div className="patients-page__form-actions">
              <button type="button" onClick={handleNew} className="ghost" disabled={mutation.isPending || blocking}>
                新規作成
              </button>
              <button type="button" onClick={handleDelete} disabled={mutation.isPending || blocking} className="ghost danger">
                削除
              </button>
              <button type="submit" disabled={saveDisabled}>
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

          {blocking && (
            <div className="patients-page__block" role="alert" aria-live={resolveAriaLive('warning')}>
              <strong>編集ブロック中のため保存できません</strong>
              <p>復旧手順は下記を確認してください。</p>
              <MissingMasterRecoveryGuide
                runId={resolvedRunId}
                onRefetch={() => patientsQuery.refetch()}
                onOpenReception={handleOpenReception}
                isRefetching={patientsQuery.isFetching}
              />
              <div className="patients-page__block-reasons">
                <span>ブロック理由</span>
                <ul>
                  {blockReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <small>
                現在の ORCA 状態: {currentOrcaStatus.state}（{currentOrcaStatus.detail}）
              </small>
            </div>
          )}

          <PatientFormErrorAlert errors={displayedValidationErrors} onFocusField={focusField} />

          <div className="patients-page__grid">
            <label>
              <span>患者ID</span>
              <input
                id="patients-form-patientId"
                value={form.patientId ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))}
                placeholder="自動採番または手入力"
                inputMode="numeric"
                aria-invalid={fieldErrorMap.has('patientId')}
                aria-describedby={buildAriaDescribedBy(
                  'patients-form-help-patientId',
                  fieldErrorMap.has('patientId') ? 'patients-form-error-patientId' : undefined,
                )}
                disabled={blocking}
              />
              <small id="patients-form-help-patientId" className="patients-page__field-help">
                数字のみ・最大16桁。削除時は必須です（例: 00001234）。
              </small>
              {fieldErrorMap.has('patientId') ? (
                <small id="patients-form-error-patientId" className="patients-page__field-error" role="alert">
                  {fieldErrorMap.get('patientId')?.message}
                </small>
              ) : null}
            </label>
            <label>
              <span>氏名</span>
              <input
                id="patients-form-name"
                required
                value={form.name ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="山田 花子"
                aria-invalid={fieldErrorMap.has('name')}
                aria-describedby={buildAriaDescribedBy(
                  'patients-form-help-name',
                  fieldErrorMap.has('name') ? 'patients-form-error-name' : undefined,
                )}
                disabled={blocking}
              />
              <small id="patients-form-help-name" className="patients-page__field-help">
                必須項目です（例: 山田 花子）。
              </small>
              {fieldErrorMap.has('name') ? (
                <small id="patients-form-error-name" className="patients-page__field-error" role="alert">
                  {fieldErrorMap.get('name')?.message}
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
                aria-invalid={fieldErrorMap.has('kana')}
                aria-describedby={buildAriaDescribedBy(
                  'patients-form-help-kana',
                  fieldErrorMap.has('kana') ? 'patients-form-error-kana' : undefined,
                )}
                disabled={blocking}
              />
              <small id="patients-form-help-kana" className="patients-page__field-help">
                全角カタカナ（長音・空白可）で入力してください。
              </small>
              {fieldErrorMap.has('kana') ? (
                <small id="patients-form-error-kana" className="patients-page__field-error" role="alert">
                  {fieldErrorMap.get('kana')?.message}
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
                aria-invalid={fieldErrorMap.has('birthDate')}
                aria-describedby={buildAriaDescribedBy(
                  'patients-form-help-birthDate',
                  fieldErrorMap.has('birthDate') ? 'patients-form-error-birthDate' : undefined,
                )}
                disabled={blocking}
              />
              <small id="patients-form-help-birthDate" className="patients-page__field-help">
                YYYY-MM-DD 形式（例: 1980-04-01）。
              </small>
              {fieldErrorMap.has('birthDate') ? (
                <small id="patients-form-error-birthDate" className="patients-page__field-error" role="alert">
                  {fieldErrorMap.get('birthDate')?.message}
                </small>
              ) : null}
            </label>
            <label>
              <span>性別</span>
              <select
                id="patients-form-sex"
                value={form.sex ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, sex: event.target.value }))}
                aria-invalid={fieldErrorMap.has('sex')}
                aria-describedby={buildAriaDescribedBy(
                  'patients-form-help-sex',
                  fieldErrorMap.has('sex') ? 'patients-form-error-sex' : undefined,
                )}
                disabled={blocking}
              >
                <option value="">未選択</option>
                <option value="M">男性</option>
                <option value="F">女性</option>
                <option value="O">その他</option>
              </select>
              <small id="patients-form-help-sex" className="patients-page__field-help">
                M/F/O から選択します（未選択可）。
              </small>
              {fieldErrorMap.has('sex') ? (
                <small id="patients-form-error-sex" className="patients-page__field-error" role="alert">
                  {fieldErrorMap.get('sex')?.message}
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
                inputMode="tel"
                aria-invalid={fieldErrorMap.has('phone')}
                aria-describedby={buildAriaDescribedBy(
                  'patients-form-help-phone',
                  fieldErrorMap.has('phone') ? 'patients-form-error-phone' : undefined,
                )}
                disabled={blocking}
              />
              <small id="patients-form-help-phone" className="patients-page__field-help">
                数字/括弧/ハイフン/空白のみ（6〜24文字）。
              </small>
              {fieldErrorMap.has('phone') ? (
                <small id="patients-form-error-phone" className="patients-page__field-error" role="alert">
                  {fieldErrorMap.get('phone')?.message}
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
                inputMode="numeric"
                aria-invalid={fieldErrorMap.has('zip')}
                aria-describedby={buildAriaDescribedBy(
                  'patients-form-help-zip',
                  fieldErrorMap.has('zip') ? 'patients-form-error-zip' : undefined,
                )}
                disabled={blocking}
              />
              <small id="patients-form-help-zip" className="patients-page__field-help">
                123-4567 形式（ハイフンは任意）。
              </small>
              {fieldErrorMap.has('zip') ? (
                <small id="patients-form-error-zip" className="patients-page__field-error" role="alert">
                  {fieldErrorMap.get('zip')?.message}
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

          {(toast || ((toast?.tone === 'error' || toast?.tone === 'warning') && lastAttempt)) && (
            <div className="patients-page__save-support" role="status" aria-live={resolveAriaLive('info')}>
              {toast && (
                <div className={`patients-page__toast patients-page__toast--${toast.tone}`} role="alert" aria-live={resolveAriaLive(toast.tone)}>
                  <strong>{toast.message}</strong>
                  {toast.detail && <p>{toast.detail}</p>}
                </div>
              )}

              {(toast?.tone === 'error' || toast?.tone === 'warning') && lastAttempt ? (
                <div className="patients-page__retry-save" role="alert" aria-live={resolveAriaLive('warning')}>
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
            </div>
          )}

          <section className="patients-page__orca-original" aria-live={resolveAriaLive(orcaOriginalNotice?.tone ?? 'info')}>
            <header className="patients-page__orca-original-header">
              <div>
                <p className="patients-page__orca-original-kicker">ORCA 原本</p>
                <h3>patientgetv2 原本参照</h3>
                <p className="patients-page__orca-original-sub">XML2 / JSON を切り替えて取得できます。</p>
              </div>
              <div className="patients-page__orca-original-actions">
                <div className="patients-page__orca-original-toggle" role="radiogroup" aria-label="取得形式">
                  <span className="patients-page__orca-original-toggle-label">取得形式</span>
                  <label>
                    <input
                      type="radio"
                      name="patientget-format"
                      value="xml"
                      checked={orcaOriginalFormat === 'xml'}
                      onChange={() => setOrcaOriginalFormat('xml')}
                    />
                    XML2
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="patientget-format"
                      value="json"
                      checked={orcaOriginalFormat === 'json'}
                      onChange={() => setOrcaOriginalFormat('json')}
                    />
                    JSON
                  </label>
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => orcaOriginalMutation.mutate()}
                  disabled={!orcaOriginalPatientId || orcaOriginalMutation.isPending}
                >
                  {orcaOriginalMutation.isPending ? '取得中…' : 'patientgetv2 取得'}
                </button>
              </div>
            </header>

            {!orcaOriginalPatientId ? (
              <p className="patients-page__orca-original-empty">患者を選択すると ORCA 原本を取得できます。</p>
            ) : (
              <>
                <div className="patients-page__orca-original-grid">
                  <label>
                    <span>Patient_ID</span>
                    <input value={orcaOriginalPatientId ?? ''} readOnly />
                  </label>
                  <label>
                    <span>class</span>
                    <input
                      value={orcaOriginalClass}
                      onChange={(event) => setOrcaOriginalClass(event.target.value)}
                      placeholder="例: 01"
                    />
                  </label>
                </div>
                {renderOrcaMeta([
                  { label: 'Api_Result', value: orcaOriginalResult?.apiResult ?? '—' },
                  { label: 'Api_Result_Message', value: orcaOriginalResult?.apiResultMessage ?? '—' },
                  { label: 'Information_Date', value: orcaOriginalResult?.informationDate ?? '—' },
                  { label: 'Information_Time', value: orcaOriginalResult?.informationTime ?? '—' },
                  { label: 'RunId', value: orcaOriginalResult?.runId ?? '—' },
                  { label: 'TraceId', value: orcaOriginalResult?.traceId ?? '—' },
                  { label: 'Status', value: orcaOriginalResult?.status ?? '—' },
                  {
                    label: 'Format',
                    value: orcaOriginalResult ? (orcaOriginalResult.format === 'json' ? 'JSON' : 'XML2') : '—',
                  },
                  {
                    label: '必須タグ不足',
                    value: orcaOriginalResult ? formatMissingTags(orcaOriginalResult.missingTags) : '—',
                    tone: orcaOriginalResult?.missingTags?.length ? 'warning' : undefined,
                  },
                ])}
                {orcaOriginalNotice ? (
                  <div className={`patients-page__toast patients-page__toast--${orcaOriginalNotice.tone}`} role="status">
                    <strong>{orcaOriginalNotice.message}</strong>
                    {orcaOriginalNotice.detail && <p>{orcaOriginalNotice.detail}</p>}
                  </div>
                ) : null}
                {orcaOriginalResult ? (
                  <pre className="patients-page__orca-original-response">{patientOriginalPreview}</pre>
                ) : (
                  <p className="patients-page__orca-original-empty">原本の取得結果がここに表示されます。</p>
                )}
              </>
            )}
          </section>

          <section className="patients-page__insurance-helper" aria-live={resolveAriaLive(insuranceNotice?.tone ?? 'info')}>
            <header className="patients-page__insurance-header">
              <div>
                <p className="patients-page__insurance-kicker">ORCA 保険</p>
                <h3>保険者検索（insuranceinf1v2）</h3>
                <p className="patients-page__insurance-sub">Base_Date デフォルト: {today}</p>
              </div>
              <div className="patients-page__insurance-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => insuranceMutation.mutate()}
                  disabled={insuranceMutation.isPending}
                >
                  {insuranceMutation.isPending ? '取得中…' : '保険者一覧を取得'}
                </button>
              </div>
            </header>
            {renderOrcaMeta([
              { label: 'Api_Result', value: insuranceResult?.apiResult ?? '—' },
              { label: 'Api_Result_Message', value: insuranceResult?.apiResultMessage ?? '—' },
              { label: 'Base_Date', value: insuranceResult?.baseDate ?? insuranceFilters.baseDate ?? '—' },
              { label: 'RunId', value: insuranceResult?.runId ?? '—' },
              { label: 'TraceId', value: insuranceResult?.traceId ?? '—' },
              { label: 'Status', value: insuranceResult?.status ?? '—' },
              {
                label: '必須タグ不足',
                value: insuranceResult ? formatMissingTags(insuranceResult.missingTags) : '—',
                tone: insuranceResult?.missingTags?.length ? 'warning' : undefined,
              },
            ])}
            <div className="patients-page__insurance-grid">
              <label>
                <span>取得基準日</span>
                <input
                  type="date"
                  value={insuranceFilters.baseDate}
                  onChange={(event) => setInsuranceFilters((prev) => ({ ...prev, baseDate: event.target.value }))}
                />
              </label>
              <label>
                <span>検索キーワード</span>
                <input
                  value={insuranceFilters.keyword}
                  onChange={(event) => setInsuranceFilters((prev) => ({ ...prev, keyword: event.target.value }))}
                  placeholder="保険者番号/名称/公費名称"
                />
              </label>
            </div>
            {insuranceNotice ? (
              <div className={`patients-page__toast patients-page__toast--${insuranceNotice.tone}`} role="status">
                <strong>{insuranceNotice.message}</strong>
                {insuranceNotice.detail && <p>{insuranceNotice.detail}</p>}
              </div>
            ) : null}
            {insuranceResult ? (
              <div className="patients-page__insurance-summary" role="status" aria-live="polite">
                <div className="patients-page__insurance-summary-main">
                  <strong>検索結果</strong>
                  <span>
                    保険者 {filteredHealthInsurances.length}件 / 公費 {filteredPublicInsurances.length}件
                  </span>
                </div>
                <div className="patients-page__insurance-summary-meta">
                  <span>キーワード: {insuranceFilters.keyword || '指定なし'}</span>
                  <span>反映先: 編集フォームの「保険/自費」欄</span>
                </div>
              </div>
            ) : null}
            {!insuranceResult ? (
              <p className="patients-page__insurance-empty">保険者一覧はまだ取得されていません。</p>
            ) : (
              <div className="patients-page__insurance-results">
                <div className="patients-page__insurance-group">
                  <div className="patients-page__insurance-group-header">
                    <strong>保険者</strong>
                    <span>{filteredHealthInsurances.length} 件</span>
                  </div>
                  {filteredHealthInsurances.length === 0 ? (
                    <p className="patients-page__insurance-empty">該当する保険者がありません。</p>
                  ) : (
                    <ul>
                      {filteredHealthInsurances.map((entry: HealthInsuranceEntry, index) => (
                        <li key={`${entry.providerId ?? 'provider'}-${index}`}>
                          <div className="patients-page__insurance-item-main">
                            <span>{entry.providerName ?? '名称不明'}</span>
                            <small>
                              番号: {entry.providerId ?? '—'} / class: {entry.providerClass ?? '—'}
                            </small>
                          </div>
                          <div className="patients-page__insurance-item-actions">
                            <button
                              type="button"
                              onClick={() =>
                                (() => {
                                  const label = formatInsuranceLabel({
                                    name: entry.providerName,
                                    id: entry.providerId,
                                    classCode: entry.providerClass,
                                  });
                                  setForm((prev) => ({
                                    ...prev,
                                    insurance: label,
                                  }));
                                  enqueue({
                                    tone: 'success',
                                    message: '保険者情報を反映しました。',
                                    detail: label,
                                  });
                                })()
                              }
                              disabled={blocking}
                            >
                              反映
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="patients-page__insurance-group">
                  <div className="patients-page__insurance-group-header">
                    <strong>公費</strong>
                    <span>{filteredPublicInsurances.length} 件</span>
                  </div>
                  {filteredPublicInsurances.length === 0 ? (
                    <p className="patients-page__insurance-empty">該当する公費がありません。</p>
                  ) : (
                    <ul>
                      {filteredPublicInsurances.map((entry: PublicInsuranceEntry, index) => (
                        <li key={`${entry.publicId ?? 'public'}-${index}`}>
                          <div className="patients-page__insurance-item-main">
                            <span>{entry.publicName ?? '名称不明'}</span>
                            <small>
                              番号: {entry.publicId ?? '—'} / class: {entry.publicClass ?? '—'}
                            </small>
                          </div>
                          <div className="patients-page__insurance-item-actions">
                            <button
                              type="button"
                              onClick={() =>
                                (() => {
                                  const label = formatInsuranceLabel({
                                    name: entry.publicName,
                                    id: entry.publicId,
                                    classCode: entry.publicClass,
                                  });
                                  setForm((prev) => ({
                                    ...prev,
                                    insurance: label,
                                  }));
                                  enqueue({
                                    tone: 'success',
                                    message: '公費情報を反映しました。',
                                    detail: label,
                                  });
                                })()
                              }
                              disabled={blocking}
                            >
                              反映
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="patients-page__orca-memo" aria-live={resolveAriaLive(orcaMemoNotice?.tone ?? 'info')}>
            <header className="patients-page__orca-memo-header">
              <div>
                <p className="patients-page__orca-memo-kicker">ORCA患者メモ</p>
                <h3>ORCA メモ取得/更新</h3>
                <p className="patients-page__orca-memo-sub">patientlst7v2 / patientmemomodv2 を XML2 で送信します。</p>
                <p className="patients-page__orca-memo-sub">Base_Date デフォルト: {today} / Perform_Date デフォルト: {today}</p>
              </div>
              <div className="patients-page__orca-memo-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => orcaMemoQuery.refetch()}
                  disabled={!orcaMemoPatientId || orcaMemoQuery.isFetching}
                >
                  {orcaMemoQuery.isFetching ? '取得中…' : '再取得'}
                </button>
                <button
                  type="button"
                  onClick={() => orcaMemoMutation.mutate()}
                  disabled={!canSaveMemo || orcaMemoMutation.isPending}
                >
                  {orcaMemoMutation.isPending ? '保存中…' : 'ORCAへ保存'}
                </button>
              </div>
            </header>

            {!orcaMemoPatientId ? (
              <p className="patients-page__orca-memo-empty">患者を選択すると ORCA メモを取得できます。</p>
            ) : (
              <>
                <div className="patients-page__orca-status-grid">
                  <div className="patients-page__orca-status-card">
                    <div className="patients-page__orca-status-head">
                      <strong>取得結果</strong>
                      <span>patientlst7v2</span>
                    </div>
                    {renderOrcaMeta(
                      [
                        { label: 'Api_Result', value: orcaMemoQuery.data?.apiResult ?? '—' },
                        { label: 'Api_Result_Message', value: orcaMemoQuery.data?.apiResultMessage ?? '—' },
                        { label: 'Base_Date', value: orcaMemoQuery.data?.baseDate ?? orcaMemoFilters.baseDate ?? '—' },
                        { label: 'RunId', value: orcaMemoQuery.data?.runId ?? '—' },
                        { label: 'TraceId', value: orcaMemoQuery.data?.traceId ?? '—' },
                        { label: 'Status', value: orcaMemoQuery.data?.status ?? '—' },
                        {
                          label: '必須タグ不足',
                          value: orcaMemoQuery.data ? formatMissingTags(orcaMemoQuery.data.missingTags) : '—',
                          tone: orcaMemoQuery.data?.missingTags?.length ? 'warning' : undefined,
                        },
                      ],
                      'patients-page__orca-meta--compact',
                    )}
                  </div>
                  <div className="patients-page__orca-status-card">
                    <div className="patients-page__orca-status-head">
                      <strong>更新結果</strong>
                      <span>patientmemomodv2</span>
                    </div>
                    {renderOrcaMeta(
                      [
                        { label: 'Api_Result', value: orcaMemoLastUpdate?.apiResult ?? '—' },
                        { label: 'Api_Result_Message', value: orcaMemoLastUpdate?.apiResultMessage ?? '—' },
                        { label: 'RunId', value: orcaMemoLastUpdate?.runId ?? '—' },
                        { label: 'TraceId', value: orcaMemoLastUpdate?.traceId ?? '—' },
                        { label: 'Status', value: orcaMemoLastUpdate?.status ?? '—' },
                        {
                          label: '必須タグ不足',
                          value: orcaMemoLastUpdate ? formatMissingTags(orcaMemoLastUpdate.missingTags) : '—',
                          tone: orcaMemoLastUpdate?.missingTags?.length ? 'warning' : undefined,
                        },
                      ],
                      'patients-page__orca-meta--compact',
                    )}
                    <p className="patients-page__orca-status-note">
                      監査ログビューでも反映状況を確認できます。<a href="#patients-audit-log">監査ログへ</a>
                    </p>
                  </div>
                </div>
                {memoValidationErrors.length > 0 ? (
                  <div className="patients-page__orca-memo-warning" role="alert">
                    {memoValidationErrors.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                ) : null}
                <div className="patients-page__orca-memo-grid">
                  <label>
                    <span>取得基準日</span>
                    <input
                      type="date"
                      value={orcaMemoFilters.baseDate}
                      onChange={(event) =>
                        setOrcaMemoFilters((prev) => ({ ...prev, baseDate: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    <span>取得 Memo_Class</span>
                    <input
                      value={orcaMemoFilters.memoClass}
                      onChange={(event) =>
                        setOrcaMemoFilters((prev) => ({ ...prev, memoClass: event.target.value }))
                      }
                      placeholder="例: 2"
                    />
                  </label>
                  <label>
                    <span>取得 診療科コード</span>
                    <input
                      value={orcaMemoFilters.departmentCode}
                      onChange={(event) =>
                        setOrcaMemoFilters((prev) => ({ ...prev, departmentCode: event.target.value }))
                      }
                      placeholder="例: 01"
                    />
                  </label>
                </div>
                <label className="patients-page__orca-memo-textarea">
                  <span>ORCA メモ内容</span>
                  <textarea
                    rows={4}
                    value={orcaMemoEditor.memo}
                    onChange={(event) => {
                      setOrcaMemoEditor((prev) => ({ ...prev, memo: event.target.value }));
                      setOrcaMemoDirty(true);
                    }}
                    placeholder="ORCA メモを入力"
                    disabled={blocking}
                  />
                </label>
                <div className="patients-page__orca-memo-grid">
                  <label>
                    <span>更新 Perform_Date</span>
                    <input
                      type="date"
                      value={orcaMemoEditor.performDate}
                      onChange={(event) => setOrcaMemoEditor((prev) => ({ ...prev, performDate: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>更新 Memo_Class</span>
                    <input
                      value={orcaMemoEditor.memoClass}
                      onChange={(event) =>
                        setOrcaMemoEditor((prev) => ({ ...prev, memoClass: event.target.value }))
                      }
                      placeholder="例: 2"
                    />
                  </label>
                  <label>
                    <span>更新 診療科コード</span>
                    <input
                      value={orcaMemoEditor.departmentCode}
                      onChange={(event) =>
                        setOrcaMemoEditor((prev) => ({ ...prev, departmentCode: event.target.value }))
                      }
                      placeholder="例: 01"
                    />
                  </label>
                </div>
                {orcaMemoNotice ? (
                  <div className={`patients-page__toast patients-page__toast--${orcaMemoNotice.tone}`} role="status">
                    <strong>{orcaMemoNotice.message}</strong>
                    {orcaMemoNotice.detail && <p>{orcaMemoNotice.detail}</p>}
                  </div>
                ) : null}
                {orcaMemoQuery.data && orcaMemoQuery.data.ok && orcaMemoQuery.data.memos.length === 0 ? (
                  <p className="patients-page__orca-memo-empty">空メモ（取得成功・登録なし）</p>
                ) : null}
                {orcaMemoQuery.data?.memos?.length ? (
                  <details className="patients-page__orca-memo-list">
                    <summary>取得済みメモ一覧</summary>
                    <ul>
                      {orcaMemoQuery.data.memos.map((memo, index) => (
                        <li key={`${memo.departmentCode ?? 'dept'}-${index}`}>
                          <strong>{memo.departmentName ?? memo.departmentCode ?? '診療科不明'}</strong>
                          <span>{memo.memo ?? 'メモなし'}</span>
                          {memo.acceptanceDate && (
                            <small>
                              受付: {memo.acceptanceDate} {memo.acceptanceTime ?? ''}
                            </small>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </>
            )}
          </section>

          <div id="patients-audit-log" className="patients-page__audit-view" role="status" aria-live={infoLive}>
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
                <span>ORCAメモ更新</span>
                <strong>{orcaMemoLastUpdate ? (orcaMemoLastUpdate.ok ? '成功' : '失敗') : '未送信'}</strong>
                {renderOrcaMeta(
                  [
                    { label: 'Api_Result', value: orcaMemoLastUpdate?.apiResult ?? '—' },
                    { label: 'Api_Result_Message', value: orcaMemoLastUpdate?.apiResultMessage ?? '—' },
                    { label: 'RunId', value: orcaMemoLastUpdate?.runId ?? '—' },
                    { label: 'TraceId', value: orcaMemoLastUpdate?.traceId ?? '—' },
                    { label: 'Status', value: orcaMemoLastUpdate?.status ?? '—' },
                    {
                      label: '必須タグ不足',
                      value: orcaMemoLastUpdate ? formatMissingTags(orcaMemoLastUpdate.missingTags) : '—',
                      tone: orcaMemoLastUpdate?.missingTags?.length ? 'warning' : undefined,
                    },
                  ],
                  'patients-page__orca-meta--compact',
                )}
                {orcaMemoLastUpdate?.apiResultMessage ? <small>message: {orcaMemoLastUpdate.apiResultMessage}</small> : null}
              </div>
              <div className="patients-page__audit-card">
                <span>現在の反映可否</span>
                <strong>{currentOrcaStatus.state}</strong>
                <small>{currentOrcaStatus.detail}</small>
              </div>
            </div>
            {lastAuditEvent && (
              <AuditSummaryInline
                auditEvent={lastAuditEvent}
                variant="inline"
                className="patients-page__audit-inline"
                runId={resolvedRunId}
              />
            )}
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
                <p className="patients-page__audit-empty" role="status" aria-live={infoLive}>
                  まだ保存履歴がありません（Patients/Charts で保存すると反映されます）。
                </p>
              ) : (
                auditRows.items.map((record, index) => {
                  const desc = describeAudit(record);
                  return (
                    <div key={`${record.timestamp}-${index}`} className="patients-page__audit-row" role="listitem">
                      <div className="patients-page__audit-row-main">
                        <strong>{desc.action}</strong>
                        <StatusPill className="patients-page__audit-pill" label="outcome" value={desc.outcome} />
                        <StatusPill className="patients-page__audit-pill" label="ORCA" value={desc.orcaStatus} />
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

        </form>
      </section>
    </main>
  );
}
