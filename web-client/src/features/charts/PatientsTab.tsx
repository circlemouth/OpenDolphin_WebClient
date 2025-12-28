import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { ToneBanner } from '../reception/components/ToneBanner';
import { StatusBadge } from '../shared/StatusBadge';
import { logUiState, getAuditEventLog, type AuditEventRecord } from '../../libs/audit/auditLogger';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { useAuthService } from './authService';
import { recordChartsAuditEvent, type ChartsOperationPhase } from './audit';
import { getChartToneDetails, type ChartTonePayload } from '../../ux/charts/tones';
import type { ReceptionEntry } from '../reception/api';
import type { AppointmentDataBanner } from '../outpatient/appointmentDataBanner';
import { buildChartsUrl, type OutpatientEncounterContext, type ReceptionCarryoverParams } from './encounterContext';
import { useSession } from '../../AppRouter';
import { fetchPatients, type PatientRecord } from '../patients/api';
import { PatientInfoEditDialog } from './PatientInfoEditDialog';

export interface PatientsTabProps {
  entries?: ReceptionEntry[];
  appointmentBanner?: AppointmentDataBanner | null;
  auditEvent?: Record<string, unknown>;
  selectedContext?: OutpatientEncounterContext;
  receptionCarryover?: ReceptionCarryoverParams;
  draftDirty?: boolean;
  switchLocked?: boolean;
  switchLockedReason?: string;
  onDraftBlocked?: (message: string) => void;
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
  receptionCarryover,
  draftDirty = false,
  switchLocked = false,
  switchLockedReason,
  onDraftBlocked,
  onDraftDirtyChange,
  onSelectEncounter,
}: PatientsTabProps) {
  const { flags } = useAuthService();
  const session = useSession();
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
  const [memoDraft, setMemoDraft] = useState('');
  const [memoEditing, setMemoEditing] = useState(false);
  const [historyTab, setHistoryTab] = useState<'recent' | 'past90' | 'all'>('recent');
  const [historyKeyword, setHistoryKeyword] = useState('');
  const [historyFrom, setHistoryFrom] = useState('');
  const [historyTo, setHistoryTo] = useState('');
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditSnapshot, setAuditSnapshot] = useState<AuditEventRecord[]>([]);
  const [diffHighlightKeys, setDiffHighlightKeys] = useState<string[]>([]);
  const [patientEditDialog, setPatientEditDialog] = useState<{ open: boolean; section: 'basic' | 'insurance' }>({
    open: false,
    section: 'basic',
  });
  const lastAuditPatientId = useRef<string | undefined>(undefined);
  const memoPatientIdRef = useRef<string | undefined>(undefined);
  const basicRef = useRef<HTMLDivElement | null>(null);
  const insuranceRef = useRef<HTMLDivElement | null>(null);
  const diffRef = useRef<HTMLDivElement | null>(null);

  const logPatientSwitch = useCallback((params: {
    phase: ChartsOperationPhase;
    outcome: 'success' | 'blocked' | 'warning';
    patientId?: string;
    appointmentId?: string;
    note?: string;
    controlId: string;
    details?: Record<string, unknown>;
  }) => {
    recordChartsAuditEvent({
      action: 'CHARTS_PATIENT_SWITCH',
      outcome: params.outcome,
      subject: 'sidepane',
      patientId: params.patientId,
      appointmentId: params.appointmentId,
      note: params.note,
      dataSourceTransition: flags.dataSourceTransition,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      fallbackUsed: flags.fallbackUsed,
      runId: flags.runId,
      details: {
        operationPhase: params.phase,
        ...params.details,
      },
    });
    logUiState({
      action: 'history_jump',
      screen: 'charts/patients-tab',
      controlId: params.controlId,
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      dataSourceTransition: flags.dataSourceTransition,
      fallbackUsed: flags.fallbackUsed,
      details: {
        operationPhase: params.phase,
        outcome: params.outcome,
        note: params.note,
        patientId: params.patientId,
        appointmentId: params.appointmentId,
        ...params.details,
      },
    });
  }, [
    flags.cacheHit,
    flags.dataSourceTransition,
    flags.fallbackUsed,
    flags.missingMaster,
    flags.runId,
  ]);

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

  const selectedPatientId = selected?.patientId ?? selectedContext?.patientId ?? undefined;

  const patientBaselineQuery = useQuery({
    queryKey: ['charts-patient-sidepane-baseline', selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      const result = await fetchPatients({ keyword: selectedPatientId });
      const exact = result.patients.find((p) => p.patientId === selectedPatientId);
      return exact ?? result.patients[0] ?? null;
    },
    enabled: Boolean(selectedPatientId),
    staleTime: 60_000,
  });

  const patientBaseline: PatientRecord | null = patientBaselineQuery.data ?? null;

  const editBlockedByMaster = flags.missingMaster || flags.fallbackUsed || flags.dataSourceTransition !== 'server';
  const editBlockedReason = editBlockedByMaster
    ? `missingMaster=${String(flags.missingMaster)} / fallbackUsed=${String(flags.fallbackUsed)} / dataSourceTransition=${flags.dataSourceTransition}`
    : undefined;

  const canEditMemoByRole = useMemo(() => {
    const role = session.role?.toLowerCase?.() ?? '';
    return role === 'doctor' || role === 'nurse';
  }, [session.role]);

  const canEditPatientInfoByRole = useMemo(() => {
    const role = session.role?.toLowerCase?.() ?? '';
    return role === 'reception' || role === 'system_admin' || role === 'admin' || role === 'system-admin' || role === 'clerk' || role === 'office';
  }, [session.role]);

  const canEditByStatus = useMemo(() => {
    if (!selected) return false;
    return selected.status === '受付中' || selected.status === '診療中' || selected.status === '予約';
  }, [selected]);

  const canEditMemo = canEditMemoByRole && !editBlockedByMaster;
  const canEditPatientInfoNow =
    Boolean(selectedPatientId) && canEditPatientInfoByRole && canEditByStatus && !editBlockedByMaster && !switchLocked && !draftDirty;
  const canDeepLinkPatientsBasic = canEditPatientInfoByRole && canEditByStatus && !editBlockedByMaster;
  const canDeepLinkPatientsInsurance = canDeepLinkPatientsBasic;

  const patientEditBlockedReason = useMemo(() => {
    if (!selectedPatientId) return 'patientId が未確定のため編集できません。';
    if (switchLocked) return `他の処理が進行中のためロック中${switchLockedReason ? `: ${switchLockedReason}` : ''}`;
    if (draftDirty) return '未保存ドラフトあり（ドラフトを保存/破棄してから患者更新してください）。';
    if (editBlockedByMaster) return `編集不可（master/tone ガード）: ${editBlockedReason}`;
    if (!canEditByStatus) return `編集不可（受付ステータス=${selected?.status ?? '不明'}）`;
    if (!canEditPatientInfoByRole) return `編集不可（role=${session.role}）`;
    return undefined;
  }, [
    canEditByStatus,
    canEditPatientInfoByRole,
    draftDirty,
    editBlockedByMaster,
    editBlockedReason,
    selected?.status,
    selectedPatientId,
    session.role,
    switchLocked,
    switchLockedReason,
  ]);

  const guardMessage = useMemo(() => {
    if (switchLocked) {
      return `他の処理が進行中のため患者切替をロック中${switchLockedReason ? `: ${switchLockedReason}` : ''}`;
    }
    if (editBlockedByMaster) {
      return `編集不可（master/tone ガード）: ${editBlockedReason}`;
    }
    if (!canEditByStatus) {
      return `編集不可（受付ステータス=${selected?.status ?? '不明'}）: 会計待ち以降は編集できません。`;
    }
    if (!canEditPatientInfoByRole && !canEditMemoByRole) {
      return `編集不可（role=${session.role}）: 権限不足。`;
    }
    if (draftDirty) {
      return '未保存ドラフトあり（ORCA送信前にドラフト保存してください）';
    }
    return '閲覧モード（編集は権限とガード条件を満たす場合のみ）';
  }, [
    canEditByStatus,
    canEditMemoByRole,
    canEditPatientInfoByRole,
    draftDirty,
    editBlockedByMaster,
    editBlockedReason,
    selected?.status,
    session.role,
    switchLocked,
    switchLockedReason,
  ]);

  const scrollTo = (target: 'basic' | 'insurance' | 'diff' | 'timeline') => {
    const map: Record<typeof target, HTMLElement | null> = {
      basic: basicRef.current,
      insurance: insuranceRef.current,
      diff: diffRef.current,
      timeline: typeof document !== 'undefined' ? (document.getElementById('document-timeline') as HTMLElement | null) : null,
    };
    const el = map[target];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (target === 'timeline') {
      try {
        el.focus({ preventScroll: true });
      } catch {
        // focus できない環境ではスキップ
      }
    }
  };

  const fallbackPatientRecord: PatientRecord | null = useMemo(() => {
    if (!selected) return null;
    return {
      patientId: selected.patientId ?? selectedContext?.patientId,
      name: selected.name,
      kana: selected.kana,
      birthDate: selected.birthDate,
      sex: selected.sex,
      phone: undefined,
      zip: undefined,
      address: undefined,
      insurance: selected.insurance,
      memo: selected.note,
      lastVisit: selected.visitDate,
    };
  }, [selected, selectedContext?.patientId]);

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
      logPatientSwitch({
        phase: 'do',
        outcome: 'success',
        patientId: fallbackId,
        appointmentId: head.appointmentId,
        note: 'auto-select first patient',
        controlId: 'patient-switch-auto',
        details: {
          trigger: 'auto_select',
        },
      });
      lastAuditPatientId.current = fallbackId;
    }
  }, [filteredEntries, logPatientSwitch, onDraftDirtyChange, onSelectEncounter, selected]);

  const handleSelect = (entry: ReceptionEntry) => {
    if (switchLocked) {
      const reason = switchLockedReason ?? 'chart switch locked';
      logPatientSwitch({
        phase: 'lock',
        outcome: 'blocked',
        patientId: entry.patientId ?? entry.id,
        appointmentId: entry.appointmentId,
        note: reason,
        controlId: 'patient-switch-blocked',
        details: {
          trigger: 'lock',
          blockedReasons: ['switch_locked'],
        },
      });
      return;
    }
    const nextId = entry.patientId ?? entry.id;
    const nextKey = entry.receptionId ?? entry.appointmentId ?? nextId;
    const currentKey = selectedContext?.receptionId ?? selectedContext?.appointmentId ?? selectedContext?.patientId ?? localSelectedKey;
    const isSwitchingKey = Boolean(currentKey && nextKey && currentKey !== nextKey);
    const currentPatientId = selected?.patientId ?? selectedContext?.patientId ?? undefined;
    const isSwitchingPatient = Boolean(currentPatientId && nextId && currentPatientId !== nextId);
    if (draftDirty && isSwitchingKey) {
      const message = '未保存のドラフトがあるため患者切替をブロックしました。保存または破棄してから切り替えてください。';
      onDraftBlocked?.(message);
      logPatientSwitch({
        phase: 'lock',
        outcome: 'blocked',
        patientId: nextId,
        appointmentId: entry.appointmentId,
        note: message,
        controlId: 'patient-switch-blocked',
        details: {
          trigger: 'draft_dirty',
          currentPatientId,
          blockedReasons: ['draft_dirty'],
        },
      });
      return;
    }
    if (isSwitchingPatient && isSwitchingKey) {
      const message = `患者が切り替わります（現在: ${currentPatientId ?? '不明'} → 次: ${nextId}）。切り替えますか？`;
      const confirmed = typeof window === 'undefined' ? true : window.confirm(message);
      if (!confirmed) {
        logPatientSwitch({
          phase: 'approval',
          outcome: 'blocked',
          patientId: nextId,
          appointmentId: entry.appointmentId,
          note: 'user_cancelled',
          controlId: 'patient-switch-cancelled',
          details: {
            trigger: 'confirm',
            currentPatientId,
            blockedReasons: ['user_cancelled'],
          },
        });
        return;
      }
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
      logPatientSwitch({
        phase: 'do',
        outcome: 'success',
        patientId: nextId,
        appointmentId: entry.appointmentId,
        note: 'manual switch',
        controlId: 'patient-switch',
        details: {
          trigger: 'manual',
          currentPatientId,
        },
      });
      lastAuditPatientId.current = nextId;
    }
  };

  useEffect(() => {
    const currentPatientId = selected?.patientId ?? selectedContext?.patientId ?? undefined;
    const baselineMemo = patientBaseline?.memo;
    const initialMemo = baselineMemo ?? selected?.note ?? '';
    const patientChanged = memoPatientIdRef.current !== currentPatientId;
    if (patientChanged) {
      memoPatientIdRef.current = currentPatientId;
      setMemoEditing(false);
      setMemoDraft(initialMemo);
      onDraftDirtyChange?.({
        dirty: false,
        patientId: selected?.patientId,
        appointmentId: selected?.appointmentId,
        receptionId: selected?.receptionId,
        visitDate: selected?.visitDate,
      });
      return;
    }

    setMemoDraft((prev) => {
      if (memoEditing) return prev;
      if (draftDirty) return prev;
      return initialMemo;
    });
  }, [
    draftDirty,
    memoEditing,
    onDraftDirtyChange,
    patientBaseline?.memo,
    selected?.appointmentId,
    selected?.note,
    selected?.patientId,
    selected?.receptionId,
    selected?.visitDate,
    selectedContext?.patientId,
  ]);

  useEffect(() => {
    const nextKey = selectedContext?.receptionId ?? selectedContext?.appointmentId ?? selectedContext?.patientId;
    if (nextKey) setLocalSelectedKey(nextKey);
  }, [selectedContext?.appointmentId, selectedContext?.patientId, selectedContext?.receptionId]);

  useEffect(() => {
    if (!auditOpen) return;
    setAuditSnapshot(getAuditEventLog());
  }, [auditOpen]);

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

  const navigateToPatients = (intent: 'basic' | 'insurance') => {
    const params = new URLSearchParams();
    if (selectedPatientId) params.set('patientId', selectedPatientId);
    params.set('from', 'charts');
    params.set('intent', intent);
    params.set('runId', flags.runId);
    if (selectedContext?.appointmentId) params.set('appointmentId', selectedContext.appointmentId);
    if (selectedContext?.receptionId) params.set('receptionId', selectedContext.receptionId);
    if (selectedContext?.visitDate) params.set('visitDate', selectedContext.visitDate);
    if (receptionCarryover?.kw) params.set('kw', receptionCarryover.kw);
    if (receptionCarryover?.dept) params.set('dept', receptionCarryover.dept);
    if (receptionCarryover?.phys) params.set('phys', receptionCarryover.phys);
    if (receptionCarryover?.pay) params.set('pay', receptionCarryover.pay);
    if (receptionCarryover?.sort) params.set('sort', receptionCarryover.sort);
    if (receptionCarryover?.date) params.set('date', receptionCarryover.date);
    const returnTo = buildChartsUrl(
      {
        patientId: selectedPatientId ?? selectedContext?.patientId,
        appointmentId: selectedContext?.appointmentId,
        receptionId: selectedContext?.receptionId,
        visitDate: selectedContext?.visitDate,
      },
      receptionCarryover,
      { runId: flags.runId },
    );
    if (returnTo) params.set('returnTo', returnTo);
    navigate(`/patients?${params.toString()}`);

    recordOutpatientFunnel('charts_patient_sidepane', {
      runId: flags.runId,
      cacheHit: flags.cacheHit ?? false,
      missingMaster: flags.missingMaster ?? false,
      dataSourceTransition: flags.dataSourceTransition ?? 'snapshot',
      fallbackUsed: flags.fallbackUsed ?? false,
      action: 'deeplink',
      outcome: 'started',
      note: `intent=${intent}`,
    });

    logUiState({
      action: 'patient_fetch',
      screen: 'charts',
      controlId: `patients-deeplink-${intent}`,
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      dataSourceTransition: flags.dataSourceTransition,
      fallbackUsed: flags.fallbackUsed,
      details: {
        patientId: selectedPatientId,
        intent,
      },
    });
  };

  const formatVisit = (entry: ReceptionEntry) => {
    const date = entry.visitDate ?? '日付不明';
    const time = entry.appointmentTime ? ` ${entry.appointmentTime}` : '';
    return `${date}${time}`;
  };

  const historyEntriesForSelected = useMemo(() => {
    if (!selectedPatientId) return [];
    const list = entries.filter((entry) => (entry.patientId ?? entry.id) === selectedPatientId);
    const sorted = [...list].sort((a, b) => (b.visitDate ?? '').localeCompare(a.visitDate ?? ''));

    const now = new Date();
    const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const within90 = sorted.filter((entry) => {
      if (!entry.visitDate) return false;
      const parsed = new Date(entry.visitDate);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed >= cutoff;
    });

    const keywordLower = historyKeyword.trim().toLowerCase();
    const keywordFiltered = keywordLower
      ? sorted.filter((entry) =>
          [entry.department, entry.physician, entry.insurance, entry.status, entry.receptionId, entry.appointmentId]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(keywordLower)),
        )
      : sorted;

    const fromFiltered = historyFrom
      ? keywordFiltered.filter((entry) => (entry.visitDate ?? '') >= historyFrom)
      : keywordFiltered;
    const toFiltered = historyTo
      ? fromFiltered.filter((entry) => (entry.visitDate ?? '') <= historyTo)
      : fromFiltered;

    if (historyTab === 'recent') return sorted.slice(0, 3);
    if (historyTab === 'past90') return within90;
    return toFiltered;
  }, [entries, historyFrom, historyKeyword, historyTab, historyTo, selectedPatientId]);

  const isCurrentEncounterRow = (entry: ReceptionEntry) => {
    if (!selectedContext) return false;
    if (selectedContext.receptionId && entry.receptionId) return selectedContext.receptionId === entry.receptionId;
    if (selectedContext.appointmentId && entry.appointmentId) return selectedContext.appointmentId === entry.appointmentId;
    const entryPatientId = entry.patientId ?? entry.id;
    return selectedContext.patientId === entryPatientId && !selectedContext.receptionId && !selectedContext.appointmentId;
  };

  const jumpToEncounter = (entry: ReceptionEntry) => {
    if (switchLocked) return;
    const nextId = entry.patientId ?? entry.id;
    onSelectEncounter?.({
      patientId: nextId,
      appointmentId: entry.appointmentId,
      receptionId: entry.receptionId,
      visitDate: entry.visitDate,
    });
    recordOutpatientFunnel('charts_patient_sidepane', {
      runId: flags.runId,
      cacheHit: flags.cacheHit ?? false,
      missingMaster: flags.missingMaster ?? false,
      dataSourceTransition: flags.dataSourceTransition ?? 'snapshot',
      fallbackUsed: flags.fallbackUsed ?? false,
      action: 'history_jump',
      outcome: 'started',
      note: `receptionId=${entry.receptionId ?? '—'} appointmentId=${entry.appointmentId ?? '—'}`,
    });
    scrollTo('timeline');
  };

  const importantLabel = useMemo(() => {
    if (!selected) return '患者未選択';
    const id = selected.patientId ?? selected.id;
    const receptionId = selected.receptionId ? `受付ID:${selected.receptionId}` : undefined;
    const insurance = selected.insurance ? `保険:${selected.insurance}` : undefined;
    const status = `状態:${selected.status}`;
    return [selected.name ?? '氏名未登録', `患者ID:${id}`, receptionId, insurance, status].filter(Boolean).join(' ｜ ');
  }, [selected]);

  type DiffRow = {
    key: string;
    label: string;
    before: string;
    after: string;
  };

  const diffRows: DiffRow[] = useMemo(() => {
    const before = {
      name: patientBaseline?.name ?? selected?.name ?? '',
      kana: patientBaseline?.kana ?? selected?.kana ?? '',
      birthDate: patientBaseline?.birthDate ?? selected?.birthDate ?? '',
      sex: patientBaseline?.sex ?? selected?.sex ?? '',
      phone: patientBaseline?.phone ?? '',
      zip: patientBaseline?.zip ?? '',
      address: patientBaseline?.address ?? '',
      insurance: patientBaseline?.insurance ?? selected?.insurance ?? '',
      memo: patientBaseline?.memo ?? selected?.note ?? '',
    };
    const after = {
      ...before,
      memo: memoDraft,
    };
    const safe = (value: string) => (value?.trim?.() ? value : '—');
    return [
      { key: 'name', label: '氏名', before: safe(before.name), after: safe(after.name) },
      { key: 'kana', label: 'カナ', before: safe(before.kana), after: safe(after.kana) },
      { key: 'birthDate', label: '生年月日', before: safe(before.birthDate), after: safe(after.birthDate) },
      { key: 'sex', label: '性別', before: safe(before.sex), after: safe(after.sex) },
      { key: 'address', label: '住所', before: safe(before.address), after: safe(after.address) },
      { key: 'phone', label: '電話', before: safe(before.phone), after: safe(after.phone) },
      { key: 'insurance', label: '保険/自費', before: safe(before.insurance), after: safe(after.insurance) },
      { key: 'memo', label: 'メモ', before: safe(before.memo), after: safe(after.memo) },
    ];
  }, [memoDraft, patientBaseline?.address, patientBaseline?.birthDate, patientBaseline?.insurance, patientBaseline?.kana, patientBaseline?.memo, patientBaseline?.name, patientBaseline?.phone, patientBaseline?.sex, selected?.birthDate, selected?.insurance, selected?.kana, selected?.name, selected?.note, selected?.sex]);

  const changedKeys = useMemo(() => {
    return diffRows.filter((row) => row.before !== row.after).map((row) => row.key);
  }, [diffRows]);

  const openAudit = () => {
    setAuditSnapshot(getAuditEventLog());
    setAuditOpen(true);
    recordOutpatientFunnel('charts_patient_sidepane', {
      runId: flags.runId,
      cacheHit: flags.cacheHit ?? false,
      missingMaster: flags.missingMaster ?? false,
      dataSourceTransition: flags.dataSourceTransition ?? 'snapshot',
      fallbackUsed: flags.fallbackUsed ?? false,
      action: 'audit_open',
      outcome: 'started',
      note: `patientId=${selectedPatientId ?? '—'}`,
    });
  };

  const closeAudit = () => setAuditOpen(false);

  const relevantAuditEvents = useMemo(() => {
    const list = [...auditSnapshot].reverse();
    const filtered = list.filter((record) => {
      const payload = (record.payload ?? {}) as Record<string, unknown>;
      const details = (payload.details ?? {}) as Record<string, unknown>;
      const payloadPatientId =
        (payload.patientId as string | undefined) ??
        (details.patientId as string | undefined) ??
        ((payload.auditEvent as Record<string, unknown> | undefined)?.patientId as string | undefined);
      if (!selectedPatientId) return true;
      if (!payloadPatientId) return false;
      return payloadPatientId === selectedPatientId;
    });
    return filtered.slice(0, 5);
  }, [auditSnapshot, selectedPatientId]);

  const describeAudit = (record: AuditEventRecord) => {
    const payload = (record.payload ?? {}) as Record<string, unknown>;
    const details = (payload.details ?? {}) as Record<string, unknown>;
    const action = (payload.action as string | undefined) ?? ((payload.auditEvent as any)?.action as string | undefined) ?? 'unknown';
    const outcome = (payload.outcome as string | undefined) ?? ((payload.auditEvent as any)?.outcome as string | undefined) ?? '—';
    const runId = (payload.runId as string | undefined) ?? (details.runId as string | undefined) ?? record.runId ?? '—';
    const traceId = (details.traceId as string | undefined) ?? (payload.traceId as string | undefined) ?? '—';
    const changed =
      (payload.changedKeys as unknown) ??
      (details.changedKeys as unknown) ??
      ((payload.auditEvent as any)?.changedKeys as unknown);
    const changedText = Array.isArray(changed) ? changed.join(', ') : typeof changed === 'string' ? changed : undefined;
    return { action, outcome, runId, traceId, changedText };
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
      <div className="patients-tab__important">
        <button
          type="button"
          className="patients-tab__important-main"
          onClick={() => scrollTo('basic')}
          aria-label="患者基本情報へ移動"
        >
          <strong className="patients-tab__important-title">{selected?.name ?? '患者未選択'}</strong>
          <span className="patients-tab__important-sub">{importantLabel}</span>
        </button>
        <div className="patients-tab__important-actions" role="group" aria-label="患者サイドペイン操作">
          <button type="button" className="patients-tab__ghost" onClick={() => scrollTo('insurance')}>
            基本/保険へ
          </button>
          <button type="button" className="patients-tab__ghost" onClick={() => scrollTo('diff')}>
            差分へ{changedKeys.length > 0 ? `（${changedKeys.length}件）` : ''}
          </button>
          <button type="button" className="patients-tab__ghost" onClick={openAudit}>
            保存履歴
          </button>
        </div>
      </div>

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
          <StatusBadge label="role" value={session.role} tone="info" runId={flags.runId} />
        </div>
      </div>
      <div className="patients-tab__controls">
        <label className="patients-tab__search">
          <span>患者検索（外来一覧）</span>
          <input
            type="search"
            placeholder="氏名 / カナ / ID"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            aria-label="患者検索キーワード"
          />
        </label>
        <div className="patients-tab__edit-guard" aria-live="polite">
          {guardMessage}
        </div>
      </div>

      <div className="patients-tab__body">
        <div className="patients-tab__table" role="list" aria-label="外来一覧（患者切替）">
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

        <div className="patients-tab__detail" role="group" aria-label="患者サイドペイン（基本/保険/履歴/差分）">
          {!selected && <p className="patients-tab__detail-empty">患者を選択すると詳細が表示されます。</p>}
          {selected && (
            <>
              <div className="patients-tab__card" ref={basicRef}>
                <div className="patients-tab__card-header">
                  <h3>基本情報（閲覧）</h3>
                  <div className="patients-tab__card-actions" role="group" aria-label="基本情報操作">
                    <button
                      type="button"
                      onClick={() => setPatientEditDialog({ open: true, section: 'basic' })}
                      disabled={!canEditPatientInfoNow}
                      title={
                        canEditPatientInfoNow
                          ? 'Charts から安全に更新（差分確認/監査/再試行）'
                          : patientEditBlockedReason ?? '編集不可'
                      }
                      className="patients-tab__primary"
                    >
                      基本を編集（Charts）
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToPatients('basic')}
                      disabled={!canDeepLinkPatientsBasic}
                      className="patients-tab__ghost"
                      title={canDeepLinkPatientsBasic ? 'Patients 画面で編集（代替導線）' : '編集不可'}
                    >
                      Patients で開く
                    </button>
                    <button
                      type="button"
                      onClick={() => patientBaselineQuery.refetch()}
                      disabled={!selectedPatientId}
                      className="patients-tab__ghost"
                    >
                      再取得
                    </button>
                  </div>
                </div>
                <div className="patients-tab__grid">
                  <div className="patients-tab__kv">
                    <span>患者ID</span>
                    <strong>{selected.patientId ?? 'ID不明'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>受付ID</span>
                    <strong>{selected.receptionId ?? '—'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>氏名</span>
                    <strong>{patientBaseline?.name ?? selected.name ?? '—'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>カナ</span>
                    <strong>{patientBaseline?.kana ?? selected.kana ?? '—'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>生年月日</span>
                    <strong>{patientBaseline?.birthDate ?? selected.birthDate ?? '—'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>性別</span>
                    <strong>{patientBaseline?.sex ?? selected.sex ?? '—'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>住所</span>
                    <strong>{patientBaseline?.address ?? '—'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>電話</span>
                    <strong>{patientBaseline?.phone ?? '—'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>診療科</span>
                    <strong>{selected.department ?? '—'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>担当医</span>
                    <strong>{selected.physician ?? '—'}</strong>
                  </div>
                </div>
                <div className="patients-tab__memo">
                  <div className="patients-tab__memo-header">
                    <h4>患者メモ</h4>
                    <div className="patients-tab__memo-actions">
                      <button
                        type="button"
                        onClick={() => {
                          if (!canEditMemo) return;
                          setMemoEditing((prev) => !prev);
                          recordOutpatientFunnel('charts_patient_sidepane', {
                            runId: flags.runId,
                            cacheHit: flags.cacheHit ?? false,
                            missingMaster: flags.missingMaster ?? false,
                            dataSourceTransition: flags.dataSourceTransition ?? 'snapshot',
                            fallbackUsed: flags.fallbackUsed ?? false,
                            action: 'memo_edit_toggle',
                            outcome: 'started',
                            note: `next=${String(!memoEditing)}`,
                          });
                        }}
                        disabled={!canEditMemo}
                        title={canEditMemo ? 'メモ編集を開始/終了' : editBlockedByMaster ? `ガード中: ${editBlockedReason}` : `role=${session.role} のため編集不可`}
                        className="patients-tab__ghost"
                      >
                        {memoEditing ? 'メモ編集を終了' : 'メモ編集'}
                      </button>
                      {memoEditing ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMemoDraft(patientBaseline?.memo ?? selected?.note ?? '');
                            setMemoEditing(false);
                            setDiffHighlightKeys([]);
                          }}
                          className="patients-tab__ghost"
                        >
                          変更を破棄
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <textarea
                    value={memoDraft || 'メモなし'}
                    onChange={(event) => {
                      const next = event.target.value;
                      setMemoDraft(next);
                      if (memoEditing && canEditMemo) {
                        onDraftDirtyChange?.({
                          dirty: true,
                          patientId: selected.patientId,
                          appointmentId: selected.appointmentId,
                          receptionId: selected.receptionId,
                          visitDate: selected.visitDate,
                        });
                      }
                    }}
                    readOnly={!memoEditing || !canEditMemo}
                    aria-readonly={!memoEditing || !canEditMemo}
                    rows={3}
                  />
                  {!canEditMemo && <small className="patients-tab__detail-guard">医師/看護師のみメモ編集可（ガード条件により無効化されます）。</small>}
                </div>
              </div>

              <div className="patients-tab__card" ref={insuranceRef}>
                <div className="patients-tab__card-header">
                  <h3>保険・公費（閲覧）</h3>
                  <div className="patients-tab__card-actions" role="group" aria-label="保険操作">
                    <button
                      type="button"
                      onClick={() => setPatientEditDialog({ open: true, section: 'insurance' })}
                      disabled={!canEditPatientInfoNow}
                      title={
                        canEditPatientInfoNow
                          ? 'Charts から安全に更新（差分確認/監査/再試行）'
                          : patientEditBlockedReason ?? '編集不可'
                      }
                      className="patients-tab__primary"
                    >
                      保険を編集（Charts）
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToPatients('insurance')}
                      disabled={!canDeepLinkPatientsInsurance}
                      className="patients-tab__ghost"
                      title={canDeepLinkPatientsInsurance ? 'Patients 画面で編集（代替導線）' : '編集不可'}
                    >
                      Patients で開く
                    </button>
                    <button type="button" className="patients-tab__ghost" onClick={() => scrollTo('diff')}>
                      差分へ
                    </button>
                  </div>
                </div>
                <div className="patients-tab__grid">
                  <div className="patients-tab__kv">
                    <span>保険/自費</span>
                    <strong>{patientBaseline?.insurance ?? selected.insurance ?? '—'}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>受付ステータス</span>
                    <strong>{selected.status}</strong>
                  </div>
                  <div className="patients-tab__kv">
                    <span>予約時刻</span>
                    <strong>{selected.appointmentTime ?? '—'}</strong>
                  </div>
                </div>
                {editBlockedByMaster ? (
                  <small className="patients-tab__detail-guard">
                    missingMaster/fallbackUsed/非serverルートの場合は保険編集を停止します（{editBlockedReason}）。
                  </small>
                ) : null}
              </div>

              <PatientInfoEditDialog
                open={patientEditDialog.open}
                section={patientEditDialog.section}
                baseline={patientBaseline}
                fallback={fallbackPatientRecord}
                editAllowed={canEditPatientInfoNow}
                editBlockedReason={patientEditBlockedReason}
                meta={{
                  runId: flags.runId,
                  cacheHit: flags.cacheHit,
                  missingMaster: flags.missingMaster,
                  fallbackUsed: flags.fallbackUsed,
                  dataSourceTransition: flags.dataSourceTransition,
                  patientId: selectedPatientId,
                  appointmentId: selected?.appointmentId,
                  receptionId: selected?.receptionId,
                  visitDate: selected?.visitDate,
                  actorRole: session.role,
                }}
                onClose={() => setPatientEditDialog((prev) => ({ ...prev, open: false }))}
                onSaved={(result) => {
                  setAuditSnapshot(getAuditEventLog());
                  const details = (result.auditEvent as any)?.details as Record<string, unknown> | undefined;
                  const keys = Array.isArray(details?.changedKeys) ? (details?.changedKeys as string[]) : [];
                  if (keys.length > 0) {
                    setDiffHighlightKeys(keys);
                  }
                }}
                onRefetchBaseline={() => patientBaselineQuery.refetch()}
              />

              <div className="patients-tab__card">
                <div className="patients-tab__card-header">
                  <h3>履歴（過去受診/直近受診）</h3>
                  <div className="patients-tab__card-actions" role="group" aria-label="履歴タブ操作">
                    <button
                      type="button"
                      className={`patients-tab__tab${historyTab === 'recent' ? ' is-active' : ''}`}
                      onClick={() => setHistoryTab('recent')}
                    >
                      直近3回
                    </button>
                    <button
                      type="button"
                      className={`patients-tab__tab${historyTab === 'past90' ? ' is-active' : ''}`}
                      onClick={() => setHistoryTab('past90')}
                    >
                      過去90日
                    </button>
                    <button
                      type="button"
                      className={`patients-tab__tab${historyTab === 'all' ? ' is-active' : ''}`}
                      onClick={() => setHistoryTab('all')}
                    >
                      全期間検索
                    </button>
                  </div>
                </div>
                {historyTab === 'all' ? (
                  <div className="patients-tab__history-filters" aria-label="履歴検索フィルタ">
                    <label>
                      <span>キーワード</span>
                      <input
                        type="search"
                        value={historyKeyword}
                        onChange={(event) => setHistoryKeyword(event.target.value)}
                        placeholder="診療科/医師/保険/受付ID"
                      />
                    </label>
                    <label>
                      <span>開始日</span>
                      <input type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} />
                    </label>
                    <label>
                      <span>終了日</span>
                      <input type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} />
                    </label>
                  </div>
                ) : null}
                <div className="patients-tab__history" role="list" aria-label="受診履歴一覧">
                  {historyEntriesForSelected.length === 0 ? (
                    <p className="patients-tab__detail-empty" role="status" aria-live="polite">
                      該当する履歴がありません（このデモでは外来一覧の範囲内のみ表示）。
                    </p>
                  ) : (
                    historyEntriesForSelected.map((entry) => {
                      const active = isCurrentEncounterRow(entry);
                      return (
                        <button
                          key={`${entry.id}-${entry.receptionId ?? entry.appointmentId ?? 'x'}`}
                          type="button"
                          className={`patients-tab__history-row${active ? ' is-active' : ''}`}
                          onClick={() => jumpToEncounter(entry)}
                          disabled={switchLocked}
                          aria-current={active ? 'true' : undefined}
                        >
                          <div className="patients-tab__history-main">
                            <strong>{formatVisit(entry)}</strong>
                            <span className="patients-tab__history-badge">{entry.status}</span>
                          </div>
                          <div className="patients-tab__history-sub">
                            <span>{entry.department ?? '診療科不明'}</span>
                            <span>{entry.physician ?? '医師不明'}</span>
                            <span>{entry.insurance ?? '保険不明'}</span>
                            {entry.receptionId ? <span>受付ID:{entry.receptionId}</span> : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="patients-tab__detail-actions" role="group" aria-label="関連導線">
                  <button type="button" onClick={() => navigateToReception('appointment_change')} className="patients-tab__ghost">
                    予約変更へ（Reception）
                  </button>
                  <button type="button" onClick={() => navigateToReception('appointment_cancel')} className="patients-tab__ghost">
                    予約キャンセルへ（Reception）
                  </button>
                  <button type="button" onClick={() => scrollTo('timeline')} className="patients-tab__ghost">
                    DocumentTimeline へ
                  </button>
                </div>
                <small className="patients-tab__detail-guard">Charts は導線のみ。予約操作は Reception 側で実行します。</small>
              </div>

              <div className="patients-tab__card" ref={diffRef}>
                <div className="patients-tab__card-header">
                  <h3>差分（変更前/変更後）</h3>
                  <div className="patients-tab__card-actions" role="group" aria-label="差分操作">
                    <button
                      type="button"
                      className="patients-tab__ghost"
                      onClick={() => {
                        setDiffHighlightKeys(changedKeys);
                        recordOutpatientFunnel('charts_patient_sidepane', {
                          runId: flags.runId,
                          cacheHit: flags.cacheHit ?? false,
                          missingMaster: flags.missingMaster ?? false,
                          dataSourceTransition: flags.dataSourceTransition ?? 'snapshot',
                          fallbackUsed: flags.fallbackUsed ?? false,
                          action: 'diff',
                          outcome: 'started',
                          note: `changed=${changedKeys.join(',') || 'none'}`,
                        });
                      }}
                    >
                      差分を強調
                    </button>
                    <button type="button" className="patients-tab__ghost" onClick={() => setDiffHighlightKeys([])}>
                      強調解除
                    </button>
                  </div>
                </div>
                <div className="patients-tab__diff">
                  <div className="patients-tab__diff-head">
                    <span>項目</span>
                    <span>変更前</span>
                    <span>変更後</span>
                  </div>
                  {diffRows.map((row) => {
                    const changed = row.before !== row.after;
                    const highlighted = diffHighlightKeys.includes(row.key);
                    return (
                      <div
                        key={row.key}
                        className={`patients-tab__diff-row${changed ? ' is-changed' : ''}${highlighted ? ' is-highlighted' : ''}`}
                        data-key={row.key}
                      >
                        <span className="patients-tab__diff-label">{row.label}</span>
                        <span className="patients-tab__diff-before">{row.before}</span>
                        <span className="patients-tab__diff-after">{row.after}</span>
                      </div>
                    );
                  })}
                </div>
                <small className="patients-tab__detail-guard">
                  変更前は直近取得値、変更後は現在の表示（メモはローカル編集）です。基本/保険は Charts（差分確認）または Patients で保存できます。
                </small>
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

      {auditOpen ? (
        <div className="patients-tab__modal" role="dialog" aria-modal="true" aria-label="保存履歴（監査ログ）">
          <div className="patients-tab__modal-card">
            <div className="patients-tab__modal-header">
              <h3>保存履歴（最新5件）</h3>
              <button type="button" className="patients-tab__ghost" onClick={closeAudit}>
                閉じる
              </button>
            </div>
            <p className="patients-tab__modal-sub">
              runId={flags.runId} ／ patientId={selectedPatientId ?? '—'} ／ traceId={(auditEvent as any)?.details?.traceId ?? '—'}
            </p>
            <div className="patients-tab__modal-list" role="list">
              {relevantAuditEvents.length === 0 ? (
                <p className="patients-tab__detail-empty" role="status" aria-live="polite">
                  まだ保存履歴がありません（Charts/Patients で保存するとここに反映されます）。
                </p>
              ) : (
                relevantAuditEvents.map((record, index) => {
                  const desc = describeAudit(record);
                  return (
                    <button
                      key={`${record.timestamp}-${index}`}
                      type="button"
                      className="patients-tab__modal-row"
                      onClick={() => {
                        const changedText = desc.changedText;
                        const keys = changedText ? changedText.split(',').map((s) => s.trim()).filter(Boolean) : [];
                        setDiffHighlightKeys(keys.length > 0 ? keys : changedKeys);
                        setAuditOpen(false);
                        scrollTo('diff');
                      }}
                    >
                      <div className="patients-tab__modal-row-main">
                        <strong>{desc.action}</strong>
                        <span className="patients-tab__modal-pill">outcome: {desc.outcome}</span>
                      </div>
                      <div className="patients-tab__modal-row-sub">
                        <span>{record.timestamp}</span>
                        <span>runId: {desc.runId}</span>
                        <span>traceId: {desc.traceId}</span>
                        {desc.changedText ? <span>changedKeys: {desc.changedText}</span> : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="patients-tab__modal-actions" role="group" aria-label="保存履歴の補助操作">
              <button
                type="button"
                className="patients-tab__primary"
                onClick={() => {
                  closeAudit();
                  navigateToPatients('basic');
                }}
                disabled={!selectedPatientId}
              >
                Patients で編集/保存（代替）
              </button>
              <button
                type="button"
                className="patients-tab__ghost"
                onClick={() => {
                  setAuditSnapshot(getAuditEventLog());
                }}
              >
                履歴を更新
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
