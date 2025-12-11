import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { updateObservabilityMeta } from '../../libs/observability/observability';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import { StatusBadge } from '../shared/StatusBadge';
import { ToneBanner } from '../reception/components/ToneBanner';
import { useAuthService } from '../charts/authService';
import {
  fetchPatients,
  savePatient,
  type PatientListResponse,
  type PatientMutationPayload,
  type PatientMutationResult,
  type PatientRecord,
} from './api';
import './patients.css';

const FILTER_STORAGE_KEY = 'patients-filter-state';
const RECEPTION_FILTER_STORAGE_KEY = 'reception-filter-state';

const DEFAULT_FILTER = {
  keyword: '',
  department: '',
  physician: '',
  paymentMode: 'all' as 'all' | 'insurance' | 'self',
};

const toSearchParams = (filters: typeof DEFAULT_FILTER) => {
  const params = new URLSearchParams();
  if (filters.keyword) params.set('kw', filters.keyword);
  if (filters.department) params.set('dept', filters.department);
  if (filters.physician) params.set('phys', filters.physician);
  if (filters.paymentMode && filters.paymentMode !== 'all') params.set('pay', filters.paymentMode);
  return params;
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
    paymentMode: (searchParams.get('pay') as 'all' | 'insurance' | 'self' | null) ?? undefined,
  };

  const normalizedReception: Partial<typeof DEFAULT_FILTER> = {
    keyword: (receptionStored?.kw as string | undefined) ?? undefined,
    department: (receptionStored?.dept as string | undefined) ?? undefined,
    physician: (receptionStored?.phys as string | undefined) ?? undefined,
  };

  const normalizedPatients: Partial<typeof DEFAULT_FILTER> = {
    keyword: (patientStored?.keyword as string | undefined) ?? (patientStored?.kw as string | undefined),
    department: (patientStored?.department as string | undefined) ?? (patientStored?.dept as string | undefined),
    physician: (patientStored?.physician as string | undefined) ?? (patientStored?.phys as string | undefined),
    paymentMode: patientStored?.paymentMode as 'all' | 'insurance' | 'self' | undefined,
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
  const initialFilters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [form, setForm] = useState<PatientRecord>({});
  const [toast, setToast] = useState<ToastState | null>(null);
  const [lastAuditEvent, setLastAuditEvent] = useState<Record<string, unknown> | undefined>();
  const [lastMeta, setLastMeta] = useState<Pick<PatientListResponse, 'missingMaster' | 'fallbackUsed' | 'cacheHit' | 'dataSourceTransition' | 'runId'>>({
    missingMaster: undefined,
    fallbackUsed: undefined,
    cacheHit: undefined,
    dataSourceTransition: undefined,
    runId,
  });
  const { flags, setCacheHit, setMissingMaster, setDataSourceTransition, bumpRunId } = useAuthService();

  useEffect(() => {
    const merged = readFilters(searchParams);
    setFilters((prev) => {
      const next = { ...prev, ...merged };
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
      const receptionSnapshot = {
        ...(readStorageJson(RECEPTION_FILTER_STORAGE_KEY) ?? {}),
        kw: filters.keyword,
        dept: filters.department,
        phys: filters.physician,
      };
      localStorage.setItem(RECEPTION_FILTER_STORAGE_KEY, JSON.stringify(receptionSnapshot));
    }
    const params = toSearchParams(filters);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

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

  useEffect(() => {
    const meta = patientsQuery.data;
    if (!meta) return;
    if (meta.runId) {
      bumpRunId(meta.runId);
      updateObservabilityMeta({ runId: meta.runId });
    }
    if (meta.cacheHit !== undefined) setCacheHit(meta.cacheHit);
    if (meta.missingMaster !== undefined) setMissingMaster(meta.missingMaster);
    if (meta.dataSourceTransition) setDataSourceTransition(meta.dataSourceTransition as DataSourceTransition);
    setLastAuditEvent(meta.auditEvent);
    setLastMeta({
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      cacheHit: meta.cacheHit,
      dataSourceTransition: meta.dataSourceTransition,
      runId: meta.runId,
    });
  }, [bumpRunId, patientsQuery.data, setCacheHit, setDataSourceTransition, setMissingMaster]);

  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };
  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);

  const patients = patientsQuery.data?.patients ?? [];

  useEffect(() => {
    if (!selectedId && patients[0]) {
      setSelectedId(patients[0].patientId ?? patients[0].name ?? patients[0].kana ?? 'new');
      setForm(patients[0]);
    }
  }, [patients, selectedId]);

  const handleSelect = (patient: PatientRecord) => {
    setSelectedId(patient.patientId ?? patient.name ?? 'new');
    setForm(patient);
    logUiState({
      action: 'tone_change',
      screen: 'patients',
      controlId: 'select-patient',
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      dataSourceTransition: flags.dataSourceTransition,
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
  };

  const mutation = useMutation({
    mutationFn: (payload: PatientMutationPayload) => savePatient(payload),
    onSuccess: (result: PatientMutationResult, variables) => {
      setLastAuditEvent(result.auditEvent);
      setToast({ tone: result.ok ? 'success' : 'error', message: result.message ?? '保存しました' });
      if (result.runId) {
        bumpRunId(result.runId);
      }
      if (result.cacheHit !== undefined) setCacheHit(result.cacheHit);
      if (result.missingMaster !== undefined) setMissingMaster(result.missingMaster);
      if (result.dataSourceTransition) setDataSourceTransition(result.dataSourceTransition);
      setLastMeta((prev) => ({
        missingMaster: result.missingMaster ?? prev.missingMaster,
        fallbackUsed: result.fallbackUsed ?? prev.fallbackUsed,
        cacheHit: result.cacheHit ?? prev.cacheHit,
        dataSourceTransition: result.dataSourceTransition ?? prev.dataSourceTransition,
        runId: result.runId ?? prev.runId,
      }));
      logAuditEvent({
        runId: result.runId,
        source: 'patient-save',
        cacheHit: result.cacheHit,
        missingMaster: result.missingMaster,
        fallbackUsed: result.fallbackUsed,
        dataSourceTransition: result.dataSourceTransition,
        payload: {
          auditEvent: result.auditEvent,
          operation: variables.operation,
        },
      });
      patientsQuery.refetch();
    },
    onError: (error: unknown) => {
      setToast({ tone: 'error', message: '保存に失敗しました', detail: error instanceof Error ? error.message : String(error) });
    },
  });

  const missingMasterFlag = patientsQuery.data?.missingMaster ?? flags.missingMaster ?? lastMeta.missingMaster ?? false;
  const fallbackUsedFlag = patientsQuery.data?.fallbackUsed ?? lastMeta.fallbackUsed ?? false;
  const blocking = Boolean(missingMasterFlag || fallbackUsedFlag);

  const save = (operation: 'create' | 'update' | 'delete') => {
    if (blocking) {
      setToast({
        tone: 'warning',
        message: 'missingMaster または fallbackUsed が true のため保存をブロックしました',
        detail: `missingMaster=${missingMasterFlag} / fallbackUsed=${fallbackUsedFlag}`,
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

    const payload: PatientMutationPayload = {
      patient: form,
      operation,
      runId: flags.runId,
    };
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

  const toneLive = missingMasterFlag || fallbackUsedFlag ? 'assertive' : 'polite';

  return (
    <main className="patients-page" data-run-id={flags.runId}>
      <header className="patients-page__header">
        <div>
          <p className="patients-page__kicker">Patients 編集と監査連携</p>
          <h1>患者一覧・編集</h1>
          <p className="patients-page__hint" role="status" aria-live="polite">
            Reception で選んだフィルタを復元し、/orca12/patientmodv2/outpatient へ保存します。保存時は auditEvent(operation=create|update|delete) と runId を送信します。
          </p>
        </div>
        <div className="patients-page__badges">
          <StatusBadge label="runId" value={flags.runId} tone="info" />
          <StatusBadge label="missingMaster" value={String(missingMasterFlag)} tone={missingMasterFlag ? 'warning' : 'success'} ariaLive={toneLive} />
          <StatusBadge label="fallbackUsed" value={String(fallbackUsedFlag)} tone={fallbackUsedFlag ? 'warning' : 'success'} ariaLive={toneLive} />
          <StatusBadge label="cacheHit" value={String(flags.cacheHit)} tone={flags.cacheHit ? 'success' : 'warning'} />
          <StatusBadge label="dataSourceTransition" value={flags.dataSourceTransition} tone="info" />
        </div>
      </header>

      <ToneBanner tone={tone} message={toneMessage} runId={flags.runId} ariaLive={missingMasterFlag || fallbackUsedFlag ? 'assertive' : 'polite'} />

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
        <button type="button" className="patients-page__filter-link" onClick={() => navigate({ pathname: '/reception', search: location.search })}>
          Reception に戻る
        </button>
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
              <button type="button" onClick={handleDelete} disabled={mutation.isLoading} className="ghost danger">
                削除
              </button>
              <button type="submit" disabled={mutation.isLoading}>
                {mutation.isLoading ? '保存中…' : '保存'}
              </button>
            </div>
          </div>

          <div className="patients-page__grid">
            <label>
              <span>患者ID</span>
              <input
                value={form.patientId ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))}
                placeholder="自動採番または手入力"
              />
            </label>
            <label>
              <span>氏名</span>
              <input
                required
                value={form.name ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="山田 花子"
              />
            </label>
            <label>
              <span>カナ</span>
              <input
                value={form.kana ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, kana: event.target.value }))}
                placeholder="ヤマダ ハナコ"
              />
            </label>
            <label>
              <span>生年月日</span>
              <input
                type="date"
                value={form.birthDate ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, birthDate: event.target.value }))}
              />
            </label>
            <label>
              <span>性別</span>
              <select value={form.sex ?? ''} onChange={(event) => setForm((prev) => ({ ...prev, sex: event.target.value }))}>
                <option value="">未選択</option>
                <option value="M">男性</option>
                <option value="F">女性</option>
                <option value="O">その他</option>
              </select>
            </label>
            <label>
              <span>電話</span>
              <input
                value={form.phone ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="03-1234-5678"
              />
            </label>
            <label>
              <span>郵便番号</span>
              <input
                value={form.zip ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, zip: event.target.value }))}
                placeholder="1000001"
              />
            </label>
            <label className="span-2">
              <span>住所</span>
              <input
                value={form.address ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="東京都千代田区..."
              />
            </label>
            <label>
              <span>保険/自費</span>
              <input
                value={form.insurance ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, insurance: event.target.value }))}
                placeholder="社保12 / 自費など"
              />
            </label>
            <label className="span-2">
              <span>メモ</span>
              <textarea
                rows={3}
                value={form.memo ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
                placeholder="アレルギー、受診メモなど"
              />
            </label>
          </div>

          {blocking && (
            <div className="patients-page__block" role="alert" aria-live="assertive">
              missingMaster または fallbackUsed が true のため保存できません。Reception で master を解決してから再試行してください。
            </div>
          )}

          {toast && (
            <div className={`patients-page__toast patients-page__toast--${toast.tone}`} role="alert" aria-live="assertive">
              <strong>{toast.message}</strong>
              {toast.detail && <p>{toast.detail}</p>}
            </div>
          )}

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
            <span>cacheHit: {String(flags.cacheHit)}</span>
            <span>missingMaster: {String(missingMasterFlag)}</span>
            <span>fallbackUsed: {String(fallbackUsedFlag)}</span>
          </div>
        </form>
      </section>
    </main>
  );
}
