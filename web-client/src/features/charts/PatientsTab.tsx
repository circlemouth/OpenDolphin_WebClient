import { useEffect, useMemo, useState } from 'react';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { ReceptionEntry } from '../reception/api';

export interface PatientsTabProps {
  entries?: ReceptionEntry[];
  auditEvent?: Record<string, unknown>;
  selectedPatientId?: string;
  onSelectPatient?: (patientId?: string) => void;
  onSelectAppointment?: (appointmentId?: string) => void;
}

export function PatientsTab({
  entries = [],
  auditEvent,
  selectedPatientId,
  onSelectPatient,
  onSelectAppointment,
}: PatientsTabProps) {
  const { flags } = useAuthService();
  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };
  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);
  const [keyword, setKeyword] = useState('');
  const [localSelectedId, setLocalSelectedId] = useState<string | undefined>(selectedPatientId);
  const [noteDraft, setNoteDraft] = useState('');

  const filteredEntries = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return entries;
    return entries.filter((entry) =>
      [entry.patientId, entry.name, entry.kana, entry.appointmentId].some((field) =>
        field?.toLowerCase().includes(kw),
      ),
    );
  }, [entries, keyword]);

  const selected = useMemo(() => {
    const id = selectedPatientId ?? localSelectedId;
    if (id) {
      return filteredEntries.find(
        (entry) => entry.patientId === id || entry.appointmentId === id || entry.id === id,
      );
    }
    return filteredEntries[0];
  }, [filteredEntries, localSelectedId, selectedPatientId]);

  useEffect(() => {
    if (!selected && filteredEntries[0]) {
      const fallbackId = filteredEntries[0].patientId ?? filteredEntries[0].id;
      setLocalSelectedId(fallbackId);
      onSelectPatient?.(fallbackId);
      onSelectAppointment?.(filteredEntries[0].appointmentId);
    }
  }, [filteredEntries, onSelectAppointment, onSelectPatient, selected]);

  const handleSelect = (entry: ReceptionEntry) => {
    const nextId = entry.patientId ?? entry.id;
    setLocalSelectedId(nextId);
    onSelectPatient?.(nextId);
    onSelectAppointment?.(entry.appointmentId);
  };

  const isReadOnly = flags.missingMaster || flags.dataSourceTransition !== 'server';

  useEffect(() => {
    setNoteDraft(selected?.note ?? '');
  }, [selected?.note]);

  useEffect(() => {
    if (selectedPatientId) {
      setLocalSelectedId(selectedPatientId);
    }
  }, [selectedPatientId]);

  return (
    <section
      className="patients-tab"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      data-run-id={flags.runId}
    >
      <ToneBanner tone={tone} message={toneMessage} runId={flags.runId} ariaLive={flags.missingMaster ? 'assertive' : 'polite'} />
      <div className="patients-tab__header">
        <div>
          <p className="patients-tab__header-label">dataSourceTransition</p>
          <strong>{transitionMeta.label}</strong>
          <p className="patients-tab__header-description">{transitionMeta.description}</p>
        </div>
        <div className="patients-tab__badges">
          <StatusBadge
            label="missingMaster"
            value={flags.missingMaster ? 'true' : 'false'}
            tone={flags.missingMaster ? 'warning' : 'success'}
            ariaLive={flags.missingMaster ? 'assertive' : 'polite'}
            runId={flags.runId}
          />
          <StatusBadge
            label="cacheHit"
            value={flags.cacheHit ? 'true' : 'false'}
            tone={flags.cacheHit ? 'success' : 'warning'}
            runId={flags.runId}
          />
        </div>
      </div>
      <div className="patients-tab__controls">
        <label className="patients-tab__search">
          <span>患者検索</span>
          <input
            type="search"
            placeholder="氏名 / カナ / ID"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            aria-label="患者検索キーワード"
          />
        </label>
        <div className="patients-tab__edit-guard" aria-live="polite">
          {isReadOnly ? 'missingMaster または tone=server 中は編集不可' : '編集可能（server route 待機中）'}
        </div>
      </div>

      <div className="patients-tab__body">
        <div className="patients-tab__table" role="list">
          {filteredEntries.length === 0 && (
            <article className="patients-tab__row" data-run-id={flags.runId}>
              <div className="patients-tab__row-meta">
                <span className="patients-tab__row-id">患者データなし</span>
                <strong>外来 API 応答を待機</strong>
              </div>
              <p className="patients-tab__row-detail">Reception からの取得結果がまだ届いていません。</p>
              <span className="patients-tab__row-status">tone={tone}</span>
            </article>
          )}
          {filteredEntries.slice(0, 8).map((patient) => {
            const isSelected =
              (selectedPatientId && (patient.patientId === selectedPatientId || patient.id === selectedPatientId)) ||
              localSelectedId === patient.patientId ||
              localSelectedId === patient.id;
            return (
              <button
                key={patient.id}
                type="button"
                className={`patients-tab__row${isSelected ? ' patients-tab__row--selected' : ''}`}
                data-run-id={flags.runId}
                onClick={() => handleSelect(patient)}
              >
                <div className="patients-tab__row-meta">
                  <span className="patients-tab__row-id">{patient.patientId ?? patient.appointmentId ?? 'ID不明'}</span>
                  <strong>{patient.name ?? '患者未登録'}</strong>
                </div>
                <p className="patients-tab__row-detail">
                  {patient.insurance ?? patient.source} | {patient.note ?? 'メモなし'}
                </p>
                <span className="patients-tab__row-status">
                  {flags.missingMaster ? 'missingMaster 警告' : flags.cacheHit ? 'cacheHit 命中' : 'server route'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="patients-tab__detail" role="group" aria-label="患者詳細">
          {!selected && <p className="patients-tab__detail-empty">患者を選択すると詳細が表示されます。</p>}
          {selected && (
            <>
              <div className="patients-tab__detail-row">
                <label>患者ID</label>
                <input value={selected.patientId ?? 'ID不明'} readOnly />
              </div>
              <div className="patients-tab__detail-row">
                <label>氏名 / カナ</label>
                <input value={selected.name ?? '患者未登録'} readOnly />
                <input value={selected.kana ?? ''} readOnly />
              </div>
              <div className="patients-tab__detail-row">
                <label>診療科 / 医師</label>
                <input value={selected.department ?? '―'} readOnly />
                <input value={selected.physician ?? '―'} readOnly />
              </div>
              <div className="patients-tab__detail-row">
                <label>保険 / メモ</label>
                <input value={selected.insurance ?? '―'} readOnly />
                <textarea
                  value={noteDraft || selected.note || 'メモなし'}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  readOnly={isReadOnly}
                  aria-readonly={isReadOnly}
                  rows={3}
                />
                {isReadOnly && <small className="patients-tab__detail-guard">missingMaster または tone=server 中は編集不可</small>}
              </div>
              <div className="patients-tab__detail-row">
                <label>ステータス</label>
                <input value={selected.status} readOnly />
                <input value={selected.appointmentTime ?? '時刻未設定'} readOnly />
              </div>
            </>
          )}
        </div>
      </div>

      {auditEvent && (
        <div className="patients-tab__audit" role="alert" aria-live="assertive">
          <strong>auditEvent</strong>
          <p>
            {Object.entries(auditEvent)
              .map(([key, value]) => `${key}: ${String(value)}`)
              .join(' ｜ ')}
          </p>
        </div>
      )}
    </section>
  );
}
