import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuthService } from './authService';
import { recordChartsAuditEvent } from './audit';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { ReceptionEntry } from '../reception/api';
import type { AppointmentDataBanner } from '../outpatient/appointmentDataBanner';
import type { OutpatientEncounterContext } from './encounterContext';

export interface PatientsTabProps {
  entries?: ReceptionEntry[];
  appointmentBanner?: AppointmentDataBanner | null;
  auditEvent?: Record<string, unknown>;
  selectedContext?: OutpatientEncounterContext;
  draftDirty?: boolean;
  switchLocked?: boolean;
  switchLockedReason?: string;
  onDraftDirtyChange?: (params: {
    dirty: boolean;
    patientId?: string;
    appointmentId?: string;
    receptionId?: string;
    visitDate?: string;
  }) => void;
  onSelectEncounter?: (context?: OutpatientEncounterContext) => void;
}

export function PatientsTab({
  entries = [],
  appointmentBanner,
  auditEvent,
  selectedContext,
  draftDirty = false,
  switchLocked = false,
  switchLockedReason,
  onDraftDirtyChange,
  onSelectEncounter,
}: PatientsTabProps) {
  const { flags } = useAuthService();
  const navigate = useNavigate();
  const tonePayload: ChartTonePayload = {
    missingMaster: flags.missingMaster,
    cacheHit: flags.cacheHit,
    dataSourceTransition: flags.dataSourceTransition,
  };
  const { tone, message: toneMessage, transitionMeta } = getChartToneDetails(tonePayload);
  const [keyword, setKeyword] = useState('');
  const [localSelectedKey, setLocalSelectedKey] = useState<string | undefined>(
    selectedContext?.receptionId ?? selectedContext?.appointmentId ?? selectedContext?.patientId,
  );
  const [noteDraft, setNoteDraft] = useState('');
  const lastAuditPatientId = useRef<string | undefined>();

  const filteredEntries = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return entries;
    return entries.filter((entry) =>
      [entry.patientId, entry.name, entry.kana, entry.appointmentId, entry.receptionId].some((field) =>
        field?.toLowerCase().includes(kw),
      ),
    );
  }, [entries, keyword]);

  const selected = useMemo(() => {
    if (selectedContext?.receptionId) {
      return filteredEntries.find((entry) => entry.receptionId === selectedContext.receptionId) ?? filteredEntries[0];
    }
    if (selectedContext?.appointmentId) {
      return filteredEntries.find((entry) => entry.appointmentId === selectedContext.appointmentId) ?? filteredEntries[0];
    }
    if (selectedContext?.patientId) {
      return filteredEntries.find((entry) => (entry.patientId ?? entry.id) === selectedContext.patientId) ?? filteredEntries[0];
    }
    if (localSelectedKey) {
      return filteredEntries.find(
        (entry) =>
          entry.receptionId === localSelectedKey ||
          entry.appointmentId === localSelectedKey ||
          entry.patientId === localSelectedKey ||
          entry.id === localSelectedKey,
      );
    }
    return filteredEntries[0];
  }, [filteredEntries, localSelectedKey, selectedContext?.appointmentId, selectedContext?.patientId, selectedContext?.receptionId]);

  useEffect(() => {
    if (!selected && filteredEntries[0]) {
      const head = filteredEntries[0];
      const fallbackId = head.patientId ?? head.id;
      setLocalSelectedKey(head.receptionId ?? head.appointmentId ?? fallbackId);
      onSelectEncounter?.({
        patientId: fallbackId,
        appointmentId: head.appointmentId,
        receptionId: head.receptionId,
        visitDate: head.visitDate,
      });
      onDraftDirtyChange?.({
        dirty: false,
        patientId: fallbackId,
        appointmentId: head.appointmentId,
        receptionId: head.receptionId,
        visitDate: head.visitDate,
      });
      recordChartsAuditEvent({
        action: 'CHARTS_PATIENT_SWITCH',
        outcome: 'success',
        patientId: fallbackId,
        appointmentId: head.appointmentId,
        note: 'auto-select first patient',
        dataSourceTransition: flags.dataSourceTransition,
        cacheHit: flags.cacheHit,
        missingMaster: flags.missingMaster,
        fallbackUsed: flags.fallbackUsed,
        runId: flags.runId,
      });
      lastAuditPatientId.current = fallbackId;
    }
  }, [filteredEntries, onDraftDirtyChange, onSelectEncounter, selected]);

  const handleSelect = (entry: ReceptionEntry) => {
    if (switchLocked) return;
    const nextId = entry.patientId ?? entry.id;
    const nextKey = entry.receptionId ?? entry.appointmentId ?? nextId;
    const currentKey = selectedContext?.receptionId ?? selectedContext?.appointmentId ?? selectedContext?.patientId ?? localSelectedKey;
    if (draftDirty && currentKey && nextKey && currentKey !== nextKey) {
      const confirmed = typeof window === 'undefined'
        ? true
        : window.confirm('未保存の入力があります。ドラフトを破棄して患者を切り替えますか？');
      if (!confirmed) return;
    }
    setLocalSelectedKey(entry.receptionId ?? entry.appointmentId ?? nextId);
    onSelectEncounter?.({
      patientId: nextId,
      appointmentId: entry.appointmentId,
      receptionId: entry.receptionId,
      visitDate: entry.visitDate,
    });
    onDraftDirtyChange?.({
      dirty: false,
      patientId: nextId,
      appointmentId: entry.appointmentId,
      receptionId: entry.receptionId,
      visitDate: entry.visitDate,
    });
    if (lastAuditPatientId.current !== nextId) {
      recordChartsAuditEvent({
        action: 'CHARTS_PATIENT_SWITCH',
        outcome: 'success',
        patientId: nextId,
        appointmentId: entry.appointmentId,
        note: 'manual switch',
        dataSourceTransition: flags.dataSourceTransition,
        cacheHit: flags.cacheHit,
        missingMaster: flags.missingMaster,
        fallbackUsed: flags.fallbackUsed,
        runId: flags.runId,
      });
      lastAuditPatientId.current = nextId;
    }
  };

  const isReadOnly = flags.missingMaster || flags.fallbackUsed || flags.dataSourceTransition !== 'server';

  useEffect(() => {
    setNoteDraft(selected?.note ?? '');
    onDraftDirtyChange?.({
      dirty: false,
      patientId: selected?.patientId,
      appointmentId: selected?.appointmentId,
      receptionId: selected?.receptionId,
      visitDate: selected?.visitDate,
    });
  }, [onDraftDirtyChange, selected?.appointmentId, selected?.note, selected?.patientId, selected?.receptionId, selected?.visitDate]);

  useEffect(() => {
    const nextKey = selectedContext?.receptionId ?? selectedContext?.appointmentId ?? selectedContext?.patientId;
    if (nextKey) setLocalSelectedKey(nextKey);
  }, [selectedContext?.appointmentId, selectedContext?.patientId, selectedContext?.receptionId]);

  const navigateToReception = (intent: 'appointment_change' | 'appointment_cancel') => {
    const keywordValue = selected?.appointmentId ?? selected?.patientId ?? selected?.receptionId ?? '';
    const params = new URLSearchParams();
    if (keywordValue) params.set('kw', keywordValue);
    params.set('intent', intent);
    navigate(`/reception?${params.toString()}`);
    recordChartsAuditEvent({
      action: 'CHARTS_NAVIGATE_RECEPTION',
      outcome: 'success',
      patientId: selected?.patientId ?? selectedContext?.patientId ?? localSelectedKey,
      appointmentId: selected?.appointmentId,
      note: `navigate to reception intent=${intent}`,
      dataSourceTransition: flags.dataSourceTransition,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      fallbackUsed: flags.fallbackUsed,
      runId: flags.runId,
    });
  };

  return (
    <section
      className="patients-tab"
      aria-live={tone === 'info' ? 'polite' : 'assertive'}
      aria-atomic="false"
      data-run-id={flags.runId}
    >
      <ToneBanner
        tone={tone}
        message={toneMessage}
        runId={flags.runId}
        ariaLive={flags.missingMaster || flags.fallbackUsed ? 'assertive' : 'polite'}
      />
      {appointmentBanner && (
        <ToneBanner
          tone={appointmentBanner.tone}
          message={appointmentBanner.message}
          runId={flags.runId}
          destination="予約/来院リスト"
          nextAction="必要に応じて再取得"
          ariaLive={appointmentBanner.tone === 'info' ? 'polite' : 'assertive'}
        />
      )}
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
          <StatusBadge
            label="fallbackUsed"
            value={flags.fallbackUsed ? 'true' : 'false'}
            tone={flags.fallbackUsed ? 'warning' : 'info'}
            ariaLive={flags.fallbackUsed ? 'assertive' : 'polite'}
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
          {switchLocked
            ? `他の処理が進行中のため患者切替をロック中${switchLockedReason ? `: ${switchLockedReason}` : ''}`
            : isReadOnly
              ? 'missingMaster または tone=server 中は編集不可'
              : draftDirty
                ? '未保存ドラフトあり（ORCA送信前にドラフト保存してください）'
                : '編集可能（server route 待機中）'}
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
              (selectedContext?.receptionId && patient.receptionId === selectedContext.receptionId) ||
              (selectedContext?.appointmentId && patient.appointmentId === selectedContext.appointmentId) ||
              (selectedContext?.patientId && (patient.patientId === selectedContext.patientId || patient.id === selectedContext.patientId)) ||
              localSelectedKey === patient.receptionId ||
              localSelectedKey === patient.appointmentId ||
              localSelectedKey === patient.patientId ||
              localSelectedKey === patient.id;
            return (
              <button
                key={patient.id}
                type="button"
                className={`patients-tab__row${isSelected ? ' patients-tab__row--selected' : ''}`}
                data-run-id={flags.runId}
                disabled={switchLocked}
                onClick={() => handleSelect(patient)}
              >
                <div className="patients-tab__row-meta">
                  <span className="patients-tab__row-id">{patient.patientId ?? patient.appointmentId ?? 'ID不明'}</span>
                  <strong>{patient.name ?? '患者未登録'}</strong>
                </div>
                <p className="patients-tab__row-detail">
                  {patient.insurance ?? patient.source} | {patient.note ?? 'メモなし'}
                  {patient.receptionId ? ` | 受付ID: ${patient.receptionId}` : ''}
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
                <label>受付ID</label>
                <input value={selected.receptionId ?? '—'} readOnly />
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
                  onChange={(event) => {
                    const next = event.target.value;
                    setNoteDraft(next);
                    if (!isReadOnly) {
                      onDraftDirtyChange?.({
                        dirty: true,
                        patientId: selected.patientId,
                        appointmentId: selected.appointmentId,
                      });
                    }
                  }}
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
              <div className="patients-tab__detail-row">
                <label>予約操作</label>
                <div className="patients-tab__detail-actions">
                  <button type="button" onClick={() => navigateToReception('appointment_change')}>
                    予約変更へ（Reception）
                  </button>
                  <button type="button" onClick={() => navigateToReception('appointment_cancel')}>
                    予約キャンセルへ（Reception）
                  </button>
                </div>
                <small className="patients-tab__detail-guard">Charts は導線のみ。操作は Reception 側で実行します。</small>
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
