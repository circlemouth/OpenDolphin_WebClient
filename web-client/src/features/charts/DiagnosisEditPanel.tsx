import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { fetchDiseases, mutateDiseases, type DiseaseEntry } from './diseaseApi';
import type { DataSourceTransition } from './authService';

export type DiagnosisEditPanelMeta = {
  runId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  dataSourceTransition?: DataSourceTransition;
  patientId?: string;
  appointmentId?: string;
  receptionId?: string;
  visitDate?: string;
  actorRole?: string;
};

export type DiagnosisEditPanelProps = {
  patientId?: string;
  meta: DiagnosisEditPanelMeta;
};

type DiagnosisFormState = {
  diagnosisId?: number;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  outcome: string;
  isMain: boolean;
  isSuspected: boolean;
};

const OUTCOME_PRESETS = ['継続', '治癒', '中止', '再発', '死亡', '転院', '不明'];

const buildEmptyForm = (today: string): DiagnosisFormState => ({
  name: '',
  code: '',
  startDate: today,
  endDate: '',
  outcome: '',
  isMain: false,
  isSuspected: false,
});

const toFormState = (entry: DiseaseEntry, today: string): DiagnosisFormState => ({
  diagnosisId: entry.diagnosisId,
  name: entry.diagnosisName ?? '',
  code: entry.diagnosisCode ?? '',
  startDate: entry.startDate ?? today,
  endDate: entry.endDate ?? '',
  outcome: entry.outcome ?? '',
  isMain: entry.category?.includes('主') ?? false,
  isSuspected: entry.suspectedFlag?.includes('疑い') ?? entry.category?.includes('疑い') ?? false,
});

const summarizeCategory = (entry: DiseaseEntry): string => {
  if (entry.category && entry.suspectedFlag) return `${entry.category} / ${entry.suspectedFlag}`;
  if (entry.category) return entry.category;
  if (entry.suspectedFlag) return entry.suspectedFlag;
  return '—';
};

export function DiagnosisEditPanel({ patientId, meta }: DiagnosisEditPanelProps) {
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState<DiagnosisFormState>(() => buildEmptyForm(today));
  const [notice, setNotice] = useState<{ tone: 'info' | 'success' | 'error'; message: string } | null>(null);

  const queryKey = ['charts-diagnosis', patientId];
  const diagnosisQuery = useQuery({
    queryKey,
    queryFn: () => {
      if (!patientId) throw new Error('patientId is required');
      return fetchDiseases({ patientId });
    },
    enabled: !!patientId,
  });

  useEffect(() => {
    logUiState({
      action: 'navigate',
      screen: 'charts/diagnosis-edit',
      runId: meta.runId,
      cacheHit: meta.cacheHit,
      missingMaster: meta.missingMaster,
      fallbackUsed: meta.fallbackUsed,
      dataSourceTransition: meta.dataSourceTransition,
      details: {
        patientId: meta.patientId,
        appointmentId: meta.appointmentId,
        receptionId: meta.receptionId,
        visitDate: meta.visitDate,
      },
    });
  }, [meta]);

  const mutation = useMutation({
    mutationFn: async (payload: DiagnosisFormState) => {
      if (!patientId) throw new Error('patientId is required');
      const operation = payload.diagnosisId ? 'update' : 'create';
      const category = payload.isMain ? '主病名' : '副病名';
      const suspectedFlag = payload.isSuspected ? '疑い' : undefined;
      return mutateDiseases({
        patientId,
        operations: [
          {
            operation,
            diagnosisId: payload.diagnosisId,
            diagnosisName: payload.name,
            diagnosisCode: payload.code || undefined,
            startDate: payload.startDate || undefined,
            endDate: payload.endDate || undefined,
            outcome: payload.outcome || undefined,
            category,
            suspectedFlag,
          },
        ],
      });
    },
    onSuccess: (result, payload) => {
      setNotice({ tone: result.ok ? 'success' : 'error', message: result.ok ? '病名を保存しました。' : '病名の保存に失敗しました。' });
      recordOutpatientFunnel('charts_action', {
        runId: result.runId ?? meta.runId,
        cacheHit: meta.cacheHit ?? false,
        missingMaster: meta.missingMaster ?? false,
        dataSourceTransition: meta.dataSourceTransition ?? 'server',
        fallbackUsed: meta.fallbackUsed ?? false,
        action: payload.diagnosisId ? 'update' : 'create',
        outcome: result.ok ? 'success' : 'error',
        note: payload.name,
      });
      logAuditEvent({
        runId: result.runId ?? meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_DISEASE_MUTATION',
          outcome: result.ok ? 'success' : 'error',
          subject: 'charts',
          details: {
            operation: payload.diagnosisId ? 'update' : 'create',
            patientId,
            diagnosisId: payload.diagnosisId,
            diagnosisName: payload.name,
            startDate: payload.startDate,
            endDate: payload.endDate,
            outcome: payload.outcome,
            isMain: payload.isMain,
            isSuspected: payload.isSuspected,
          },
        },
      });
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey });
        setForm(buildEmptyForm(today));
      }
    },
    onError: (error: unknown, payload) => {
      const message = error instanceof Error ? error.message : String(error);
      setNotice({ tone: 'error', message: `病名の保存に失敗しました: ${message}` });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_DISEASE_MUTATION',
          outcome: 'error',
          subject: 'charts',
          details: {
            operation: payload.diagnosisId ? 'update' : 'create',
            patientId,
            diagnosisId: payload.diagnosisId,
            error: message,
          },
        },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entry: DiseaseEntry) => {
      if (!patientId) throw new Error('patientId is required');
      return mutateDiseases({
        patientId,
        operations: [
          {
            operation: 'delete',
            diagnosisId: entry.diagnosisId,
            diagnosisName: entry.diagnosisName,
          },
        ],
      });
    },
    onSuccess: (result, entry) => {
      setNotice({ tone: result.ok ? 'success' : 'error', message: result.ok ? '病名を削除しました。' : '病名の削除に失敗しました。' });
      logAuditEvent({
        runId: result.runId ?? meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_DISEASE_MUTATION',
          outcome: result.ok ? 'success' : 'error',
          subject: 'charts',
          details: {
            operation: 'delete',
            patientId,
            diagnosisId: entry.diagnosisId,
            diagnosisName: entry.diagnosisName,
          },
        },
      });
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: (error: unknown, entry) => {
      const message = error instanceof Error ? error.message : String(error);
      setNotice({ tone: 'error', message: `病名の削除に失敗しました: ${message}` });
      logAuditEvent({
        runId: meta.runId,
        cacheHit: meta.cacheHit,
        missingMaster: meta.missingMaster,
        fallbackUsed: meta.fallbackUsed,
        dataSourceTransition: meta.dataSourceTransition,
        payload: {
          action: 'CHARTS_DISEASE_MUTATION',
          outcome: 'error',
          subject: 'charts',
          details: {
            operation: 'delete',
            patientId,
            diagnosisId: entry.diagnosisId,
            error: message,
          },
        },
      });
    },
  });

  const list = diagnosisQuery.data?.diseases ?? [];

  if (!patientId) {
    return <p className="charts-side-panel__empty">患者IDが未選択のため病名編集を開始できません。</p>;
  }

  return (
    <section className="charts-side-panel__section" data-test-id="diagnosis-edit-panel">
      <header className="charts-side-panel__section-header">
        <div>
          <strong>病名編集</strong>
          <p>主/疑い/開始/転帰を編集し ORCA へ反映します。</p>
        </div>
        <button
          type="button"
          className="charts-side-panel__ghost"
          onClick={() => {
            setForm(buildEmptyForm(today));
            setNotice(null);
          }}
        >
          新規入力
        </button>
      </header>

      {notice && <div className={`charts-side-panel__notice charts-side-panel__notice--${notice.tone}`}>{notice.message}</div>}

      <form
        className="charts-side-panel__form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim()) {
            setNotice({ tone: 'error', message: '病名を入力してください。' });
            return;
          }
          mutation.mutate(form);
        }}
      >
        <div className="charts-side-panel__field">
          <label htmlFor="diagnosis-name">病名</label>
          <input
            id="diagnosis-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="例: 高血圧症"
          />
        </div>
        <div className="charts-side-panel__field">
          <label htmlFor="diagnosis-code">病名コード</label>
          <input
            id="diagnosis-code"
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            placeholder="例: I10"
          />
        </div>
        <div className="charts-side-panel__field-row">
          <label className="charts-side-panel__toggle">
            <input
              type="checkbox"
              checked={form.isMain}
              onChange={(event) => setForm((prev) => ({ ...prev, isMain: event.target.checked }))}
            />
            主病名
          </label>
          <label className="charts-side-panel__toggle">
            <input
              type="checkbox"
              checked={form.isSuspected}
              onChange={(event) => setForm((prev) => ({ ...prev, isSuspected: event.target.checked }))}
            />
            疑い
          </label>
        </div>
        <div className="charts-side-panel__field-row">
          <div className="charts-side-panel__field">
            <label htmlFor="diagnosis-start">開始日</label>
            <input
              id="diagnosis-start"
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </div>
          <div className="charts-side-panel__field">
            <label htmlFor="diagnosis-end">転帰日</label>
            <input
              id="diagnosis-end"
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </div>
        </div>
        <div className="charts-side-panel__field">
          <label htmlFor="diagnosis-outcome">転帰</label>
          <input
            id="diagnosis-outcome"
            list="diagnosis-outcome-options"
            value={form.outcome}
            onChange={(event) => setForm((prev) => ({ ...prev, outcome: event.target.value }))}
            placeholder="例: 継続"
          />
          <datalist id="diagnosis-outcome-options">
            {OUTCOME_PRESETS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
        <div className="charts-side-panel__actions">
          <button type="submit" disabled={mutation.isPending}>
            {form.diagnosisId ? '更新する' : '追加する'}
          </button>
        </div>
      </form>

      <div className="charts-side-panel__list" aria-live="polite">
        <div className="charts-side-panel__list-header">
          <span>登録済み病名</span>
          <span>{diagnosisQuery.isFetching ? '更新中' : `${list.length}件`}</span>
        </div>
        {diagnosisQuery.isError && (
          <p className="charts-side-panel__empty">病名の取得に失敗しました。</p>
        )}
        {list.length === 0 && !diagnosisQuery.isFetching && (
          <p className="charts-side-panel__empty">病名が未登録です。</p>
        )}
        {list.length > 0 && (
          <ul className="charts-side-panel__items">
            {list.map((entry) => (
              <li key={entry.diagnosisId ?? `${entry.diagnosisName}-${entry.startDate}`}>
                <div>
                  <strong>{entry.diagnosisName ?? '名称未設定'}</strong>
                  <span>{entry.diagnosisCode ? `(${entry.diagnosisCode})` : ''}</span>
                  <span>{summarizeCategory(entry)}</span>
                </div>
                <div>
                  <span>{entry.startDate ?? '開始日未設定'}</span>
                  {entry.endDate ? ` → ${entry.endDate}` : ''}
                  {entry.outcome ? ` / ${entry.outcome}` : ''}
                </div>
                <div className="charts-side-panel__item-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(toFormState(entry, today));
                      setNotice(null);
                    }}
                  >
                    編集
                  </button>
                  <button type="button" onClick={() => deleteMutation.mutate(entry)} disabled={deleteMutation.isPending}>
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
