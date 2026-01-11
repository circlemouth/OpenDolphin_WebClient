import { useEffect, useMemo, useState } from 'react';

import { resolveAriaLive } from '../../libs/observability/observability';
import type { DataSourceTransition } from '../../libs/observability/types';
import { RunIdBadge } from '../shared/RunIdBadge';

type PatientDisplay = {
  name: string;
  kana?: string;
  sex?: string;
  age?: string;
  birthDateEra?: string;
  birthDateIso?: string;
  status?: string;
  department?: string;
  physician?: string;
  insurance?: string;
  visitDate?: string;
  appointmentTime?: string;
};

type ChartsPatientSummaryBarProps = {
  patientDisplay: PatientDisplay;
  patientId?: string;
  receptionId?: string;
  appointmentId?: string;
  runId?: string;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  cacheHit?: boolean;
  dataSourceTransition?: DataSourceTransition;
  recordsReturned?: number;
  fetchedAt?: string;
  approvalLabel?: string;
  approvalDetail?: string;
  lockStatus?: {
    label?: string;
    detail?: string;
  };
  onToggleSafetyDetail?: (open: boolean) => void;
};

const normalizeValue = (value?: string): string | undefined => {
  if (!value) return undefined;
  if (value.trim() === '' || value === '—') return undefined;
  return value;
};

const formatSexAge = (sex?: string, age?: string): string | undefined => {
  const safeSex = normalizeValue(sex);
  const safeAge = normalizeValue(age);
  if (safeSex && safeAge) return `${safeSex} / ${safeAge}`;
  return safeSex ?? safeAge;
};

const formatVisitDate = (date?: string, time?: string): string => {
  const safeDate = normalizeValue(date);
  const safeTime = normalizeValue(time);
  if (safeDate && safeTime) return `${safeDate} ${safeTime}`;
  return safeDate ?? safeTime ?? '—';
};

const resolveSafetyTone = (params: {
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  cacheHit?: boolean;
  dataSourceTransition?: DataSourceTransition;
}): 'warning' | 'info' | 'neutral' => {
  if (params.missingMaster || params.fallbackUsed) return 'warning';
  if (params.dataSourceTransition && params.dataSourceTransition !== 'server') return 'info';
  if (params.cacheHit) return 'info';
  return 'neutral';
};

const resolveSafetyLabel = (params: {
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  cacheHit?: boolean;
  dataSourceTransition?: DataSourceTransition;
}): string => {
  if (params.missingMaster) return 'master未同期';
  if (params.fallbackUsed) return 'fallback';
  if (params.cacheHit) return 'cache';
  if (params.dataSourceTransition && params.dataSourceTransition !== 'server') return params.dataSourceTransition;
  return 'OK';
};

export function ChartsPatientSummaryBar({
  patientDisplay,
  patientId,
  receptionId,
  appointmentId,
  runId,
  missingMaster,
  fallbackUsed,
  cacheHit,
  dataSourceTransition,
  recordsReturned,
  fetchedAt,
  approvalLabel,
  approvalDetail,
  lockStatus,
  onToggleSafetyDetail,
}: ChartsPatientSummaryBarProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    setDetailOpen(false);
  }, [appointmentId, patientDisplay.name, patientId, receptionId]);

  const safetyTone = resolveSafetyTone({ missingMaster, fallbackUsed, cacheHit, dataSourceTransition });
  const safetyLabel = resolveSafetyLabel({ missingMaster, fallbackUsed, cacheHit, dataSourceTransition });
  const kana = normalizeValue(patientDisplay.kana);
  const sexAge = formatSexAge(patientDisplay.sex, patientDisplay.age);
  const birthEra = normalizeValue(patientDisplay.birthDateEra);
  const birthIso = normalizeValue(patientDisplay.birthDateIso);
  const birthLabel = useMemo(() => {
    if (birthEra && birthIso) return `${birthEra} / ${birthIso}`;
    return birthEra ?? birthIso;
  }, [birthEra, birthIso]);

  const detailRows = useMemo(
    () =>
      [
        birthLabel ? { label: '生年月日', value: birthLabel } : undefined,
        typeof missingMaster === 'boolean' ? { label: 'missingMaster', value: String(missingMaster) } : undefined,
        typeof fallbackUsed === 'boolean' ? { label: 'fallbackUsed', value: String(fallbackUsed) } : undefined,
        typeof cacheHit === 'boolean' ? { label: 'cacheHit', value: String(cacheHit) } : undefined,
        dataSourceTransition ? { label: 'dataSourceTransition', value: dataSourceTransition } : undefined,
        typeof recordsReturned === 'number' ? { label: 'recordsReturned', value: String(recordsReturned) } : undefined,
        fetchedAt ? { label: 'fetchedAt', value: fetchedAt } : undefined,
        runId ? { label: 'runId', value: runId } : undefined,
      ].filter((item): item is { label: string; value: string } => Boolean(item)),
    [birthLabel, cacheHit, dataSourceTransition, fallbackUsed, fetchedAt, missingMaster, recordsReturned, runId],
  );

  const toggleDetail = () => {
    setDetailOpen((prev) => {
      const next = !prev;
      if (onToggleSafetyDetail) onToggleSafetyDetail(next);
      return next;
    });
  };

  const toggleLabel = detailOpen ? '詳細を閉じる' : '詳細を開く';
  const toggleIcon = detailOpen ? 'v' : '>';
  const ariaLive = resolveAriaLive(safetyTone === 'warning' ? 'warning' : 'info');

  return (
    <div
      className="charts-patient-summary"
      data-run-id={runId}
      data-missing-master={String(missingMaster ?? false)}
      data-cache-hit={String(cacheHit ?? false)}
      data-fallback-used={String(fallbackUsed ?? false)}
      data-source-transition={dataSourceTransition}
    >
      <div className="charts-patient-summary__left">
        <span className="charts-patient-summary__label">患者サマリ</span>
        <h2 className="charts-patient-summary__name">{patientDisplay.name}</h2>
        {kana ? <span className="charts-patient-summary__kana">{kana}</span> : null}
        <span className="charts-patient-summary__sex-age">{sexAge ?? '—'}</span>
      </div>
      <div className="charts-patient-summary__center">
        <div className="charts-patient-summary__meta-row">
          <div className="charts-patient-summary__meta-item">
            <span className="charts-patient-summary__meta-label">患者ID</span>
            <strong className="charts-patient-summary__meta-value">{normalizeValue(patientId) ?? '—'}</strong>
          </div>
          <div className="charts-patient-summary__meta-item">
            <span className="charts-patient-summary__meta-label">受付ID</span>
            <strong className="charts-patient-summary__meta-value">{normalizeValue(receptionId) ?? '—'}</strong>
          </div>
          <div className="charts-patient-summary__meta-item">
            <span className="charts-patient-summary__meta-label">予約ID</span>
            <strong className="charts-patient-summary__meta-value">{normalizeValue(appointmentId) ?? '—'}</strong>
          </div>
        </div>
        <div className="charts-patient-summary__clinical-row">
          <div className="charts-patient-summary__meta-item">
            <span className="charts-patient-summary__meta-label">診療ステータス</span>
            <strong className="charts-patient-summary__meta-value">{normalizeValue(patientDisplay.status) ?? '—'}</strong>
          </div>
          <div className="charts-patient-summary__meta-item">
            <span className="charts-patient-summary__meta-label">診療科</span>
            <strong className="charts-patient-summary__meta-value">{normalizeValue(patientDisplay.department) ?? '—'}</strong>
          </div>
          <div className="charts-patient-summary__meta-item">
            <span className="charts-patient-summary__meta-label">担当者</span>
            <strong className="charts-patient-summary__meta-value">{normalizeValue(patientDisplay.physician) ?? '—'}</strong>
          </div>
          <div className="charts-patient-summary__meta-item">
            <span className="charts-patient-summary__meta-label">保険/自費</span>
            <strong className="charts-patient-summary__meta-value">{normalizeValue(patientDisplay.insurance) ?? '—'}</strong>
          </div>
        </div>
        <div className="charts-patient-summary__clinical-row charts-patient-summary__clinical-row--compact">
          <div className="charts-patient-summary__meta-item">
            <span className="charts-patient-summary__meta-label">診療日</span>
            <strong className="charts-patient-summary__meta-value">
              {formatVisitDate(patientDisplay.visitDate, patientDisplay.appointmentTime)}
            </strong>
          </div>
          <div className="charts-patient-summary__meta-item charts-patient-summary__meta-item--stack">
            <span className="charts-patient-summary__meta-label">承認/ロック</span>
            <strong className="charts-patient-summary__meta-value">{approvalLabel ?? '—'}</strong>
            <span className="charts-patient-summary__meta-sub">{approvalDetail ?? '—'}</span>
            <span className="charts-patient-summary__meta-sub">ロック: {lockStatus?.label ?? '—'}</span>
            <span className="charts-patient-summary__meta-sub">{lockStatus?.detail ?? '—'}</span>
          </div>
        </div>
      </div>
      <div className="charts-patient-summary__right">
        <div className="charts-patient-summary__safety-header">
          <div
            className={`charts-patient-summary__safety-summary charts-patient-summary__safety-summary--${safetyTone}`}
            role="status"
            aria-live={ariaLive}
          >
            <span className="charts-patient-summary__safety-label">安全表示</span>
            <span className="charts-patient-summary__safety-state">{safetyLabel}</span>
          </div>
          <RunIdBadge runId={runId} className="charts-patient-summary__runid" />
        </div>
        <button
          type="button"
          className="charts-patient-summary__safety-toggle"
          aria-expanded={detailOpen}
          aria-controls="charts-safety-detail"
          onClick={toggleDetail}
        >
          <span className="charts-patient-summary__safety-toggle-icon" aria-hidden="true">
            {toggleIcon}
          </span>
          {toggleLabel}
        </button>
        <div
          id="charts-safety-detail"
          className="charts-patient-summary__safety-detail"
          hidden={!detailOpen}
        >
          {detailRows.length > 0 ? (
            detailRows.map((row) => (
              <div key={row.label} className="charts-patient-summary__safety-item">
                <span className="charts-patient-summary__safety-item-label">{row.label}</span>
                <span className="charts-patient-summary__safety-item-value">{row.value}</span>
              </div>
            ))
          ) : (
            <span className="charts-patient-summary__safety-empty">詳細データなし</span>
          )}
        </div>
      </div>
    </div>
  );
}
