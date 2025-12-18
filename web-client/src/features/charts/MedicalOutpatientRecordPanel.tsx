import { useMemo } from 'react';

import type { OrcaOutpatientSummary } from '../outpatient/types';
import { StatusBadge } from '../shared/StatusBadge';
import { extractMedicalOutpatientRecord, toOutcomeLabel, toOutcomeTone, type MedicalSectionState } from './medicalOutpatient';

export type MedicalOutpatientRecordPanelProps = {
  summary?: OrcaOutpatientSummary;
  selectedPatientId?: string;
};

const formatSectionMeta = (section: MedicalSectionState): string => {
  const count = section.recordsReturned ?? (section.items.length > 0 ? section.items.length : undefined);
  const suffix = count !== undefined ? ` (${count}件)` : '';
  if (section.outcome === 'ERROR' && section.message) return `エラー: ${section.message}${suffix}`;
  if (section.outcome === 'MISSING') return `未取得${suffix}`;
  if (section.outcome === 'PARTIAL') return `一部欠落${suffix}`;
  if (section.outcome === 'SUCCESS') return `取得済み${suffix}`;
  return `不明${suffix}`;
};

export function MedicalOutpatientRecordPanel({ summary, selectedPatientId }: MedicalOutpatientRecordPanelProps) {
  const record = useMemo(
    () => extractMedicalOutpatientRecord(summary?.payload, selectedPatientId),
    [selectedPatientId, summary?.payload],
  );

  if (!summary) {
    return (
      <section className="medical-record" aria-live="polite" data-test-id="medical-record-panel">
        <header className="medical-record__header">
          <strong>医療記録</strong>
        </header>
        <p className="medical-record__empty">外来医療記録を取得中です。</p>
      </section>
    );
  }

  if (!record) {
    const httpStatus = summary.httpStatus;
    const hasFetchError = httpStatus === 0 || (typeof httpStatus === 'number' && httpStatus >= 400) || summary.outcome === 'ERROR';
    if (hasFetchError) {
      const httpLabel = httpStatus === 0 ? 'NETWORK' : typeof httpStatus === 'number' ? `HTTP ${httpStatus}` : 'UNKNOWN';
      return (
        <section className="medical-record" aria-live="assertive" data-test-id="medical-record-panel" data-run-id={summary.runId}>
          <header className="medical-record__header">
            <strong>医療記録</strong>
            <span className="medical-record__meta">
              outcome: {summary.outcome ?? 'ERROR'} / recordsReturned: {summary.recordsReturned ?? '—'} / {httpLabel}
            </span>
          </header>
          <p className="medical-record__empty">
            外来医療記録の取得に失敗しました。OrcaSummary の「再取得」から再実行してください。
          </p>
        </section>
      );
    }
    return (
      <section className="medical-record" aria-live="polite" data-test-id="medical-record-panel">
        <header className="medical-record__header">
          <strong>医療記録</strong>
          <span className="medical-record__meta">recordsReturned: {summary.recordsReturned ?? '—'}</span>
        </header>
        <p className="medical-record__empty">
          表示対象の医療記録が見つかりません（patientId={selectedPatientId ?? '未選択'}）。
        </p>
      </section>
    );
  }

  const ariaLive = record.outcome === 'ERROR' ? 'assertive' : record.outcome === 'PARTIAL' ? 'polite' : 'off';

  return (
    <section className="medical-record" aria-live={ariaLive} data-test-id="medical-record-panel" data-run-id={summary.runId}>
      <header className="medical-record__header">
        <div className="medical-record__title">
          <strong>医療記録</strong>
          <span className="medical-record__meta">
            {record.patientName ?? '氏名未設定'}
            {record.patientId ? `（${record.patientId}）` : ''}
            {record.department ? ` / ${record.department}` : ''}
            {record.physician ? ` / ${record.physician}` : ''}
          </span>
        </div>
        <div className="medical-record__badges">
          <StatusBadge
            label="outcome"
            value={toOutcomeLabel(record.outcome)}
            tone={toOutcomeTone(record.outcome)}
            description="外来医療記録の取得結果（セクション集計）"
            ariaLive="off"
            runId={summary.runId}
          />
          <StatusBadge
            label="recordsReturned"
            value={String(summary.recordsReturned ?? record.recordsReturned ?? '—')}
            tone={summary.recordsReturned && summary.recordsReturned > 0 ? 'info' : 'warning'}
            description="医療記録（visit/encounter）件数"
            ariaLive="off"
            runId={summary.runId}
          />
          {summary.requestId && (
            <StatusBadge
              label="requestId"
              value={summary.requestId}
              tone="info"
              description="サーバー側 requestId"
              ariaLive="off"
              runId={summary.runId}
            />
          )}
        </div>
      </header>

      <div className="medical-record__sections">
        {record.sections.map((section) => (
          <details key={section.key} className="medical-record__section" open={section.outcome !== 'MISSING'}>
            <summary className="medical-record__section-summary">
              <span className="medical-record__section-title">{section.label}</span>
              <span className="medical-record__section-meta">{formatSectionMeta(section)}</span>
            </summary>
            {section.items.length === 0 ? (
              <p className="medical-record__section-empty">
                {section.outcome === 'ERROR'
                  ? '取得に失敗しました。再取得を試してください。'
                  : section.outcome === 'MISSING'
                    ? '未取得です。'
                    : '該当データがありません。'}
              </p>
            ) : (
              <ul className="medical-record__section-list">
                {section.items.map((item, index) => (
                  <li key={`${section.key}-${index}`} className="medical-record__item">
                    <div className="medical-record__item-headline">{item.headline}</div>
                    {(item.subline || item.meta) && (
                      <div className="medical-record__item-sub">
                        {item.subline ?? ''}
                        {item.subline && item.meta ? ' / ' : ''}
                        {item.meta ?? ''}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
