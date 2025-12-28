import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { logUiState } from '../../libs/audit/auditLogger';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import { StatusBadge } from '../shared/StatusBadge';
import { ApiFailureBanner } from '../shared/ApiFailureBanner';
import { ToneBanner } from '../reception/components/ToneBanner';
import { applyAuthServicePatch, useAuthService, type AuthServiceFlags, type DataSourceTransition } from '../charts/authService';
import { buildChartsUrl, normalizeVisitDate } from '../charts/encounterContext';
import { PatientFormErrorAlert } from './PatientFormErrorAlert';
import { useAppToast } from '../../libs/ui/appToast';
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

type ToastState = {
  tone: 'warning' | 'success' | 'error' | 'info';
  message: string;
  detail?: string;
};

type PatientsPageProps = {
  runId: string;
};

export function PatientsPage({ runId }: PatientsPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueue } = useAppToast();
  const fromCharts = searchParams.get('from') === 'charts';
  const chartsReturnUrl = useMemo(() => {
    if (!fromCharts) return null;
    const patientId = searchParams.get('patientId') ?? searchParams.get('kw') ?? undefined;
    const receptionId = searchParams.get('receptionId') ?? undefined;
    const visitDate = normalizeVisitDate(searchParams.get('visitDate') ?? undefined);
    return buildChartsUrl({ patientId, receptionId, visitDate });
  }, [fromCharts, searchParams]);
  const initialFilters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [form, setForm] = useState<PatientRecord>({});
  const [baseline, setBaseline] = useState<PatientRecord | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [lastAuditEvent, setLastAuditEvent] = useState<Record<string, unknown> | undefined>();
  const [validationErrors, setValidationErrors] = useState<PatientValidationError[]>([]);
  const [lastAttempt, setLastAttempt] = useState<PatientMutationPayload | null>(null);
  const baselineRef = useRef<PatientRecord | null>(null);
  const [savedViews, setSavedViews] = useState<OutpatientSavedView[]>(() => loadOutpatientSavedViews());
  const [savedViewName, setSavedViewName] = useState('');
  const [selectedViewId, setSelectedViewId] = useState<string>('');
  const lastUnlinkedToastKey = useRef<string | null>(null);
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
    const receptionId = carryoverSource.get('receptionId');
    const visitDate = carryoverSource.get('visitDate');
    if (sort) params.set('sort', sort);
    if (date) params.set('date', date);
    if (from) params.set('from', from);
    if (patientId) params.set('patientId', patientId);
    if (receptionId) params.set('receptionId', receptionId);
    if (visitDate) params.set('visitDate', visitDate);
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

  const tonePayload: ChartTonePayload = {
    missingMaster: resolvedMissingMaster,
    cacheHit: resolvedCacheHit,
    dataSourceTransition: resolvedTransition,
  };
  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const patients = patientsQuery.data?.patients ?? [];
  const resolvedRunId = patientsQuery.data?.runId ?? flags.runId;
  const resolvedCacheHit = patientsQuery.data?.cacheHit ?? flags.cacheHit ?? lastMeta.cacheHit ?? false;
  const resolvedMissingMaster = patientsQuery.data?.missingMaster ?? flags.missingMaster ?? lastMeta.missingMaster ?? false;
  const resolvedFallbackUsed = patientsQuery.data?.fallbackUsed ?? flags.fallbackUsed ?? lastMeta.fallbackUsed ?? false;
  const resolvedTransition =
    patientsQuery.data?.dataSourceTransition ?? flags.dataSourceTransition ?? lastMeta.dataSourceTransition;
  const resolvedFetchedAt = patientsQuery.data?.fetchedAt ?? lastMeta.fetchedAt;
  const resolvedRecordsReturned = patientsQuery.data?.recordsReturned ?? lastMeta.recordsReturned;

  const unlinkedNotice = useMemo(() => {
    const missingPatientId = patients.filter((patient) => !patient.patientId).length;
    const missingName = patients.filter((patient) => !patient.name).length;
    if (missingPatientId === 0 && missingName === 0) return null;
    const parts = [
      missingPatientId > 0 ? `患者ID未紐付: ${missingPatientId}` : undefined,
      missingName > 0 ? `氏名未紐付: ${missingName}` : undefined,
    ].filter((value): value is string => typeof value === 'string');
    const message = `患者一覧に未紐付ステータスがあります（${parts.join(' / ')}）`;
    const key = `${missingPatientId}-${missingName}-${resolvedRunId ?? 'runId'}`;
    return { message, detail: `recordsReturned=${resolvedRecordsReturned ?? '―'}`, key };
  }, [patients, resolvedRecordsReturned, resolvedRunId]);

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
    },
  });

  const missingMasterFlag = resolvedMissingMaster;
  const fallbackUsedFlag = resolvedFallbackUsed;
  const masterOk = !missingMasterFlag && !fallbackUsedFlag && (resolvedTransition ?? 'server') === 'server';
  const blocking = !masterOk;

  const focusField = (field: keyof PatientRecord) => {
    const el = typeof document !== 'undefined' ? (document.getElementById(`patients-form-${String(field)}`) as HTMLElement | null) : null;
    if (el && typeof el.focus === 'function') el.focus();
  };

  const save = (operation: 'create' | 'update' | 'delete') => {
    if (blocking) {
      setToast({
        tone: 'warning',
        message: 'missingMaster / fallbackUsed / 非server ルートのため保存をブロックしました',
        detail: `missingMaster=${missingMasterFlag} / fallbackUsed=${fallbackUsedFlag} / dataSourceTransition=${resolvedTransition ?? 'unknown'}`,
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

      <ToneBanner tone={tone} message={toneMessage} runId={resolvedRunId} ariaLive={missingMasterFlag || fallbackUsedFlag ? 'assertive' : 'polite'} />
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
          onClick={() => navigate({ pathname: '/reception', search: location.search })}
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
          {patients.length === 0 && (
            <p className="patients-page__empty" role="status" aria-live="polite">
              患者データがありません。フィルタを変えて再検索してください。
            </p>
          )}
          {patients.map((patient) => {
            const selected = selectedId === patient.patientId || (!selectedId && patients[0] === patient);
            return (
              <button
                key={patient.patientId ?? patient.name ?? Math.random().toString(36).slice(2, 8)}
                type="button"
                className={`patients-page__row${selected ? ' is-selected' : ''}`}
                onClick={() => handleSelect(patient)}
                aria-pressed={selected}
              >
                <div className="patients-page__row-main">
                  <span className="patients-page__row-id">{patient.patientId ?? '新規'}</span>
                  <strong>{patient.name ?? '氏名未登録'}</strong>
                  <span className="patients-page__row-kana">{patient.kana ?? 'カナ未登録'}</span>
                </div>
                <div className="patients-page__row-meta">
                  <span>{patient.birthDate ?? '生年月日未設定'}</span>
                  <span>{patient.insurance ?? '保険未設定'}</span>
                  <span>{patient.lastVisit ? `最終受診 ${patient.lastVisit}` : '受診履歴なし'}</span>
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
              <button type="button" onClick={handleNew} className="ghost">新規作成</button>
              <button type="button" onClick={handleDelete} disabled={mutation.isPending} className="ghost danger">
                削除
              </button>
              <button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? '保存中…' : '保存'}
              </button>
            </div>
          </div>

          <div className="patients-page__grid">
            <label>
              <span>患者ID</span>
              <input
                id="patients-form-patientId"
                value={form.patientId ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))}
                placeholder="自動採番または手入力"
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
              />
            </label>
            <label>
              <span>保険/自費</span>
              <input
                id="patients-form-insurance"
                value={form.insurance ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, insurance: event.target.value }))}
                placeholder="社保12 / 自費など"
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
              />
            </label>
          </div>

          {blocking && (
            <div className="patients-page__block" role="alert" aria-live="assertive">
              missingMaster / fallbackUsed / 非server ルートのため保存できません。Reception で master を解決してから再試行してください。
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

          {lastAuditEvent && (
            <div className="patients-page__audit" role="status" aria-live="polite">
              <h3>auditEvent</h3>
              <p>
                {Object.entries(lastAuditEvent)
                  .map(([key, value]) => `${key}: ${String(value)}`)
                  .join(' ｜ ')}
              </p>
            </div>
          )}

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
