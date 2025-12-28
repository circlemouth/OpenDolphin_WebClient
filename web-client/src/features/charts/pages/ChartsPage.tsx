import { Global } from '@emotion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

import { AuthServiceControls } from '../AuthServiceControls';
import { applyAuthServicePatch, useAuthService, type AuthServiceFlags, type DataSourceTransition } from '../authService';
import { DocumentTimeline } from '../DocumentTimeline';
import { OrcaSummary } from '../OrcaSummary';
import { MedicalOutpatientRecordPanel } from '../MedicalOutpatientRecordPanel';
import { PatientsTab } from '../PatientsTab';
import { TelemetryFunnelPanel } from '../TelemetryFunnelPanel';
import { ChartsActionBar } from '../ChartsActionBar';
import { DiagnosisEditPanel } from '../DiagnosisEditPanel';
import { OrderBundleEditPanel } from '../OrderBundleEditPanel';
import { normalizeAuditEventLog, normalizeAuditEventPayload, recordChartsAuditEvent } from '../audit';
import { SoapNotePanel } from '../SoapNotePanel';
import type { SoapEntry } from '../soapNote';
import { chartsStyles } from '../styles';
import { receptionStyles } from '../../reception/styles';
import { fetchAppointmentOutpatients, fetchClaimFlags, type AppointmentPayload, type ReceptionEntry } from '../../reception/api';
import { getAuditEventLog, logAuditEvent, logUiState, type AuditEventRecord } from '../../../libs/audit/auditLogger';
import { fetchOrcaOutpatientSummary } from '../api';
import { useAdminBroadcast } from '../../../libs/admin/useAdminBroadcast';
import { AdminBroadcastBanner } from '../../shared/AdminBroadcastBanner';
import { ToneBanner } from '../../reception/components/ToneBanner';
import { useSession } from '../../../AppRouter';
import { fetchEffectiveAdminConfig, type ChartsMasterSourcePolicy } from '../../administration/api';
import type { ClaimOutpatientPayload } from '../../outpatient/types';
import { hasStoredAuth } from '../../../libs/http/httpClient';
import { fetchOrcaQueue } from '../../outpatient/orcaQueueApi';
import { resolveOrcaSendStatus, toClaimQueueEntryFromOrcaQueueEntry } from '../../outpatient/orcaQueueStatus';
import { getObservabilityMeta } from '../../../libs/observability/observability';
import {
  buildChartsEncounterSearch,
  hasEncounterContext,
  loadChartsEncounterContext,
  normalizeVisitDate,
  normalizeRunId,
  parseChartsEncounterContext,
  parseChartsNavigationMeta,
  parseReceptionCarryoverParams,
  storeChartsEncounterContext,
  type OutpatientEncounterContext,
} from '../encounterContext';
import {
  buildChartsApprovalStorageKey,
  clearChartsApprovalRecord,
  readChartsApprovalRecord,
  writeChartsApprovalRecord,
  type ChartsApprovalRecord,
} from '../approvalState';
import { useChartsTabLock } from '../useChartsTabLock';
import { isNetworkError } from '../../shared/apiError';
import { getAppointmentDataBanner } from '../../outpatient/appointmentDataBanner';
import { resolveOutpatientFlags } from '../../outpatient/flags';

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatAge = (birthDate?: string, baseDate: Date = new Date()): string => {
  const birth = parseDate(birthDate);
  if (!birth) return '—';
  const baseYear = baseDate.getFullYear();
  const baseMonth = baseDate.getMonth();
  const baseDay = baseDate.getDate();
  const birthYear = birth.getFullYear();
  const birthMonth = birth.getMonth();
  const birthDay = birth.getDate();
  let totalMonths = (baseYear - birthYear) * 12 + (baseMonth - birthMonth);
  if (baseDay < birthDay) totalMonths -= 1;
  if (totalMonths < 0) return '—';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return months === 0 ? `${years}歳` : `${years}歳${months}ヶ月`;
};

const formatJapaneseEra = (date: Date): string => {
  const eras = [
    { name: '令和', start: new Date(2019, 4, 1) },
    { name: '平成', start: new Date(1989, 0, 8) },
    { name: '昭和', start: new Date(1926, 11, 25) },
    { name: '大正', start: new Date(1912, 6, 30) },
    { name: '明治', start: new Date(1868, 0, 25) },
  ];
  const found = eras.find((era) => date >= era.start);
  if (!found) return '—';
  const year = date.getFullYear() - found.start.getFullYear() + 1;
  const yearLabel = year === 1 ? '元' : String(year);
  return `${found.name}${yearLabel}年${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatBirthDate = (value?: string): string => {
  const date = parseDate(value);
  if (!date) return '—';
  const iso = date.toISOString().slice(0, 10);
  return `${iso}（${formatJapaneseEra(date)}）`;
};

const pickLatestOutpatientMeta = (pages: AppointmentPayload[]): AppointmentPayload | undefined => {
  if (pages.length === 0) return undefined;
  const toTimestamp = (value?: string): number => {
    if (!value) return Number.NEGATIVE_INFINITY;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
  };
  let latest = pages[0];
  let latestTimestamp = toTimestamp(latest.fetchedAt);
  for (const page of pages.slice(1)) {
    const parsed = toTimestamp(page.fetchedAt);
    if (parsed >= latestTimestamp) {
      latest = page;
      latestTimestamp = parsed;
    }
  }
  if (latestTimestamp === Number.NEGATIVE_INFINITY) {
    return pages[pages.length - 1];
  }
  return latest;
};

const SOAP_HISTORY_STORAGE_KEY = 'opendolphin:web-client:soap-history';
const SOAP_HISTORY_MAX_ENTRIES = 50;
const SOAP_HISTORY_MAX_ENCOUNTERS = 20;
const SOAP_HISTORY_MAX_BYTES = 200_000;

type SoapHistoryStorage = {
  version: 1;
  updatedAt: string;
  encounters: Record<
    string,
    {
      updatedAt: string;
      entries: SoapEntry[];
    }
  >;
};

type SidePanelAction =
  | 'lab'
  | 'document'
  | 'imaging'
  | 'diagnosis-edit'
  | 'prescription-edit'
  | 'order-edit';

const readSoapHistoryStorage = (): SoapHistoryStorage | null => {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SOAP_HISTORY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SoapHistoryStorage;
    if (!parsed || parsed.version !== 1 || !parsed.encounters) return null;
    return parsed;
  } catch {
    return null;
  }
};

const sanitizeSoapHistory = (entries: Record<string, SoapEntry[]>) => {
  const encounterKeys = Object.keys(entries);
  if (encounterKeys.length === 0) return { encounters: {}, removed: [] as string[] };
  const normalized: Record<string, { updatedAt: string; entries: SoapEntry[] }> = {};
  const removed: string[] = [];
  encounterKeys.forEach((key) => {
    const list = entries[key] ?? [];
    if (list.length === 0) return;
    const trimmed = list.slice(-SOAP_HISTORY_MAX_ENTRIES);
    const updatedAt = trimmed[trimmed.length - 1]?.authoredAt ?? new Date().toISOString();
    normalized[key] = { updatedAt, entries: trimmed };
  });
  const sortedKeys = Object.keys(normalized).sort((a, b) => {
    const left = normalized[a]?.updatedAt ?? '';
    const right = normalized[b]?.updatedAt ?? '';
    return left.localeCompare(right);
  });
  while (sortedKeys.length > SOAP_HISTORY_MAX_ENCOUNTERS) {
    const oldest = sortedKeys.shift();
    if (!oldest) break;
    removed.push(oldest);
    delete normalized[oldest];
  }
  return { encounters: normalized, removed };
};
export function ChartsPage() {
  return (
    <>
      <Global styles={[receptionStyles, chartsStyles]} />
      <ChartsContent />
    </>
  );
}

function ChartsContent() {
  const { flags, setCacheHit, setDataSourceTransition, setMissingMaster, setFallbackUsed, bumpRunId } = useAuthService();
  const session = useSession();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const focusRestoreRef = useRef<HTMLElement | null>(null);
  const tabLockReadOnlyRef = useRef(false);
  type ChartsNavigationState = Partial<OutpatientEncounterContext> & { runId?: string };
  const navigationState = (location.state as ChartsNavigationState | null) ?? {};
  const urlMeta = useMemo(() => parseChartsNavigationMeta(location.search), [location.search]);
  const navigationRunId = normalizeRunId(typeof navigationState.runId === 'string' ? navigationState.runId : undefined);
  const explicitRunId = urlMeta.runId ?? navigationRunId;
  const runIdForUrl = explicitRunId ?? flags.runId;
  const [encounterContext, setEncounterContext] = useState<OutpatientEncounterContext>(() => {
    const urlContext = parseChartsEncounterContext(location.search);
    if (hasEncounterContext(urlContext)) return urlContext;
    const stored = loadChartsEncounterContext();
    if (hasEncounterContext(stored)) return stored ?? {};
    return {
      patientId: typeof navigationState.patientId === 'string' ? navigationState.patientId : undefined,
      appointmentId: typeof navigationState.appointmentId === 'string' ? navigationState.appointmentId : undefined,
      receptionId: typeof navigationState.receptionId === 'string' ? navigationState.receptionId : undefined,
      visitDate: normalizeVisitDate(typeof navigationState.visitDate === 'string' ? navigationState.visitDate : undefined),
    };
  });
  const [draftState, setDraftState] = useState<{
    dirty: boolean;
    patientId?: string;
    appointmentId?: string;
    receptionId?: string;
    visitDate?: string;
  }>({ dirty: false });
  const [soapHistoryByEncounter, setSoapHistoryByEncounter] = useState<Record<string, SoapEntry[]>>(() => {
    const stored = readSoapHistoryStorage();
    if (!stored) return {};
    const entries: Record<string, SoapEntry[]> = {};
    Object.entries(stored.encounters).forEach(([key, value]) => {
      entries[key] = value.entries ?? [];
    });
    return entries;
  });
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [auditEvents, setAuditEvents] = useState<AuditEventRecord[]>([]);
  const [lockState, setLockState] = useState<{ locked: boolean; reason?: string }>({ locked: false });
  const [approvalState, setApprovalState] = useState<{
    status: 'none' | 'approved';
    record?: ChartsApprovalRecord;
  }>({ status: 'none' });
  const approvalLockLogRef = useRef<string | null>(null);
  const approvalUnlockLogRef = useRef<string | null>(null);
  const handleLockChange = useCallback((locked: boolean, reason?: string) => {
    setLockState({ locked, reason });
  }, []);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [contextAlert, setContextAlert] = useState<{ tone: 'info' | 'warning'; message: string } | null>(null);
  const [editLockAlert, setEditLockAlert] = useState<{
    tone: 'warning';
    message: string;
    ariaLive: 'polite' | 'assertive';
  } | null>(null);
  const [deliveryImpactBanner, setDeliveryImpactBanner] = useState<{ tone: 'info' | 'warning'; message: string } | null>(null);
  const [sidePanelAction, setSidePanelAction] = useState<SidePanelAction | null>(null);
  const [deliveryAppliedMeta, setDeliveryAppliedMeta] = useState<{
    appliedAt: string;
    appliedTo: string;
    role: string;
    runId?: string;
    deliveredAt?: string;
    deliveryId?: string;
    deliveryVersion?: string;
    syncMismatch?: boolean;
    syncMismatchFields?: string;
  } | null>(null);
  const appliedMeta = useRef<Partial<AuthServiceFlags>>({});
  const { broadcast } = useAdminBroadcast();
  const appliedDelivery = useRef<{ key?: string }>({});
  const previousDeliveryFlags = useRef<{
    chartsDisplayEnabled?: boolean;
    chartsSendEnabled?: boolean;
    chartsMasterSource?: ChartsMasterSourcePolicy;
  }>({});
  const lastEditLockAnnouncement = useRef<string | null>(null);
  const lastOrcaQueueSnapshot = useRef<string | null>(null);

  const urlContext = useMemo(() => parseChartsEncounterContext(location.search), [location.search]);
  const receptionCarryover = useMemo(() => parseReceptionCarryoverParams(location.search), [location.search]);
  const soapEncounterKey = useMemo(
    () =>
      [
        encounterContext.patientId ?? 'none',
        encounterContext.appointmentId ?? 'none',
        encounterContext.receptionId ?? 'none',
        encounterContext.visitDate ?? 'none',
      ].join('::'),
    [
      encounterContext.appointmentId,
      encounterContext.patientId,
      encounterContext.receptionId,
      encounterContext.visitDate,
    ],
  );
  const soapHistory = useMemo(() => soapHistoryByEncounter[soapEncounterKey] ?? [], [soapEncounterKey, soapHistoryByEncounter]);
  const appendSoapHistory = useCallback(
    (entries: SoapEntry[]) => {
      setSoapHistoryByEncounter((prev) => ({
        ...prev,
        [soapEncounterKey]: [...(prev[soapEncounterKey] ?? []), ...entries].slice(-SOAP_HISTORY_MAX_ENTRIES),
      }));
    },
    [soapEncounterKey],
  );
  const clearSoapHistory = useCallback(() => {
    setSoapHistoryByEncounter((prev) => {
      const next = { ...prev };
      delete next[soapEncounterKey];
      return next;
    });
    if (typeof sessionStorage !== 'undefined') {
      const stored = readSoapHistoryStorage();
      if (stored?.encounters?.[soapEncounterKey]) {
        delete stored.encounters[soapEncounterKey];
        try {
          sessionStorage.setItem(SOAP_HISTORY_STORAGE_KEY, JSON.stringify({ ...stored, updatedAt: new Date().toISOString() }));
        } catch {
          sessionStorage.removeItem(SOAP_HISTORY_STORAGE_KEY);
        }
      }
    }
  }, [soapEncounterKey]);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    const sanitized = sanitizeSoapHistory(soapHistoryByEncounter);
    if (sanitized.removed.length > 0) {
      setSoapHistoryByEncounter((prev) => {
        const next: Record<string, SoapEntry[]> = { ...prev };
        sanitized.removed.forEach((key) => {
          delete next[key];
        });
        return next;
      });
      setContextAlert({
        tone: 'warning',
        message: 'SOAP履歴が上限を超えたため、古い履歴を削除しました。',
      });
    }
    const payload: SoapHistoryStorage = {
      version: 1,
      updatedAt: new Date().toISOString(),
      encounters: sanitized.encounters,
    };
    try {
      const serialized = JSON.stringify(payload);
      if (serialized.length > SOAP_HISTORY_MAX_BYTES) {
        sessionStorage.removeItem(SOAP_HISTORY_STORAGE_KEY);
        setContextAlert({
          tone: 'warning',
          message: 'SOAP履歴が容量上限を超えたため、セッション保存をクリアしました。',
        });
        return;
      }
      sessionStorage.setItem(SOAP_HISTORY_STORAGE_KEY, serialized);
    } catch {
      sessionStorage.removeItem(SOAP_HISTORY_STORAGE_KEY);
      setContextAlert({
        tone: 'warning',
        message: 'SOAP履歴の保存に失敗したため、セッション保存をクリアしました。',
      });
    }
  }, [soapHistoryByEncounter, setContextAlert]);

  const sameEncounterContext = useCallback((left: OutpatientEncounterContext, right: OutpatientEncounterContext) => {
    return (
      (left.patientId ?? '') === (right.patientId ?? '') &&
      (left.appointmentId ?? '') === (right.appointmentId ?? '') &&
      (left.receptionId ?? '') === (right.receptionId ?? '') &&
      (normalizeVisitDate(left.visitDate) ?? '') === (normalizeVisitDate(right.visitDate) ?? '')
    );
  }, []);

  useEffect(() => {
    if (!explicitRunId) return;
    if (draftState.dirty || lockState.locked || tabLockReadOnlyRef.current) return;
    if (explicitRunId === flags.runId) return;
    bumpRunId(explicitRunId);
  }, [bumpRunId, draftState.dirty, explicitRunId, flags.runId, lockState.locked]);

  useEffect(() => {
    if (!hasEncounterContext(urlContext)) return;
    if (sameEncounterContext(urlContext, encounterContext)) return;
    if (draftState.dirty || lockState.locked || tabLockReadOnlyRef.current) {
      setContextAlert({
        tone: 'warning',
        message: '未保存ドラフトまたは処理中のため、URL からの患者切替をブロックしました（別患者混入防止）。',
      });
      const blockedReasons = [
        ...(draftState.dirty ? ['draft_dirty'] : []),
        ...(lockState.locked ? ['ui_locked'] : []),
        ...(tabLockReadOnlyRef.current ? ['tab_read_only'] : []),
      ];
      recordChartsAuditEvent({
        action: 'CHARTS_PATIENT_SWITCH',
        outcome: 'blocked',
        subject: 'charts-url',
        patientId: encounterContext.patientId,
        appointmentId: encounterContext.appointmentId,
        note: `url_context_switch_blocked targetPatientId=${urlContext.patientId ?? '—'} targetAppointmentId=${urlContext.appointmentId ?? '—'}`,
        runId: flags.runId,
        cacheHit: flags.cacheHit,
        missingMaster: flags.missingMaster,
        fallbackUsed: flags.fallbackUsed,
        dataSourceTransition: flags.dataSourceTransition,
        details: {
          operationPhase: 'lock',
          trigger: 'url',
          blockedReasons,
          ...(urlContext.patientId ? {} : encounterContext.patientId ? { fallbackPatientId: encounterContext.patientId } : {}),
          ...(urlContext.appointmentId
            ? {}
            : encounterContext.appointmentId
              ? { fallbackAppointmentId: encounterContext.appointmentId }
              : {}),
        },
      });
      logUiState({
        action: 'navigate',
        screen: 'charts',
        controlId: 'patient-switch-url-blocked',
        runId: flags.runId,
        cacheHit: flags.cacheHit,
        missingMaster: flags.missingMaster,
        dataSourceTransition: flags.dataSourceTransition,
        fallbackUsed: flags.fallbackUsed,
        patientId: encounterContext.patientId,
        appointmentId: encounterContext.appointmentId,
        details: {
          operationPhase: 'lock',
          trigger: 'url',
          blocked: true,
          blockedReasons,
          targetPatientId: urlContext.patientId ?? '—',
          targetAppointmentId: urlContext.appointmentId ?? '—',
        },
      });
      const currentSearch = buildChartsEncounterSearch(encounterContext, receptionCarryover, { runId: flags.runId });
      if (location.search !== currentSearch) {
        navigate({ pathname: '/charts', search: currentSearch }, { replace: true });
      }
      return;
    }
    setEncounterContext(urlContext);
    setContextAlert({
      tone: 'info',
      message: 'URL の外来コンテキストに合わせて表示を更新しました（戻る/進む操作）。',
    });
    recordChartsAuditEvent({
      action: 'CHARTS_PATIENT_SWITCH',
      outcome: 'success',
      subject: 'charts-url',
      patientId: urlContext.patientId,
      appointmentId: urlContext.appointmentId,
      note: `url_context_switch targetPatientId=${urlContext.patientId ?? '—'} targetAppointmentId=${urlContext.appointmentId ?? '—'}`,
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      fallbackUsed: flags.fallbackUsed,
      dataSourceTransition: flags.dataSourceTransition,
      details: {
        operationPhase: 'do',
        trigger: 'url',
        ...(urlContext.patientId ? {} : encounterContext.patientId ? { fallbackPatientId: encounterContext.patientId } : {}),
        ...(urlContext.appointmentId
          ? {}
          : encounterContext.appointmentId
            ? { fallbackAppointmentId: encounterContext.appointmentId }
            : {}),
      },
    });
    logUiState({
      action: 'navigate',
      screen: 'charts',
      controlId: 'patient-switch-url',
      runId: flags.runId,
      cacheHit: flags.cacheHit,
      missingMaster: flags.missingMaster,
      dataSourceTransition: flags.dataSourceTransition,
      fallbackUsed: flags.fallbackUsed,
      patientId: urlContext.patientId,
      appointmentId: urlContext.appointmentId,
      details: {
        operationPhase: 'do',
        trigger: 'url',
      },
    });
  }, [
    draftState.dirty,
    encounterContext,
    flags.runId,
    location.search,
    lockState.locked,
    navigate,
    sameEncounterContext,
    urlContext,
  ]);

  useEffect(() => {
    if (!hasEncounterContext(encounterContext)) return;
    storeChartsEncounterContext(encounterContext);
    const nextSearch = buildChartsEncounterSearch(encounterContext, receptionCarryover, { runId: runIdForUrl });
    if (location.search === nextSearch) return;
    navigate({ pathname: '/charts', search: nextSearch }, { replace: true });
  }, [encounterContext, location.search, navigate, receptionCarryover, runIdForUrl]);

  const adminQueryKey = ['admin-effective-config'];
  const adminConfigQuery = useQuery({
    queryKey: adminQueryKey,
    queryFn: fetchEffectiveAdminConfig,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });

  useEffect(() => {
    if (!broadcast?.updatedAt) return;
    void adminConfigQuery.refetch();
  }, [adminConfigQuery, broadcast?.updatedAt]);

  const chartsMasterSourcePolicy: ChartsMasterSourcePolicy =
    (adminConfigQuery.data?.chartsMasterSource as ChartsMasterSourcePolicy | undefined) ??
    (broadcast?.chartsMasterSource as ChartsMasterSourcePolicy | undefined) ??
    'auto';
  const chartsDisplayEnabled =
    (adminConfigQuery.data?.chartsDisplayEnabled ?? broadcast?.chartsDisplayEnabled) ?? true;
  const chartsSendEnabled =
    (adminConfigQuery.data?.chartsSendEnabled ?? broadcast?.chartsSendEnabled) ?? true;

  const resolvePreferredSourceOverride = (policy: ChartsMasterSourcePolicy) => {
    if (policy === 'server') return 'server' as const;
    if (policy === 'mock') return 'mock' as const;
    if (policy === 'fallback') return 'mock' as const;
    if (policy === 'snapshot') return 'snapshot' as const;
    return undefined;
  };
  const preferredSourceOverride = resolvePreferredSourceOverride(chartsMasterSourcePolicy);
  const forceFallbackUsed = chartsMasterSourcePolicy === 'fallback';
  const sendAllowedByDelivery = chartsSendEnabled && (chartsMasterSourcePolicy === 'auto' || chartsMasterSourcePolicy === 'server');
  const sendDisabledReason = !chartsSendEnabled
    ? '管理配信で ORCA送信 が disabled になっています。'
    : chartsMasterSourcePolicy === 'fallback'
      ? '管理配信で masterSource=fallback が指定されているため ORCA送信 を停止しています。'
      : chartsMasterSourcePolicy === 'mock'
        ? '管理配信で masterSource=mock が指定されているため ORCA送信 を停止しています。'
        : undefined;

  useEffect(() => {
    const data = adminConfigQuery.data;
    if (!data) return;
    const key = JSON.stringify({
      deliveryId: data.deliveryId,
      deliveryVersion: data.deliveryVersion,
      deliveredAt: data.deliveredAt,
      runId: data.runId,
      chartsDisplayEnabled: data.chartsDisplayEnabled,
      chartsSendEnabled: data.chartsSendEnabled,
      chartsMasterSource: data.chartsMasterSource,
    });
    if (appliedDelivery.current.key === key) return;
    appliedDelivery.current.key = key;

    const appliedAt = new Date().toISOString();
    const appliedTo = `${session.facilityId}:${session.userId}`;
    const resolvedDeliveryMode = data.deliveryMode ?? data.rawDelivery?.deliveryMode ?? data.rawConfig?.deliveryMode;
    const resolvedEnvironment = data.environment ?? data.rawDelivery?.environment ?? data.rawConfig?.environment;
    setDeliveryAppliedMeta({
      appliedAt,
      appliedTo,
      role: session.role,
      runId: data.runId ?? flags.runId,
      deliveredAt: data.deliveredAt,
      deliveryId: data.deliveryId,
      deliveryVersion: data.deliveryVersion,
      syncMismatch: data.syncMismatch,
      syncMismatchFields: data.syncMismatchFields?.length ? data.syncMismatchFields.join(', ') : undefined,
    });
    logAuditEvent({
      runId: data.runId ?? flags.runId,
      source: 'admin/delivery',
      note: 'admin delivery applied',
      payload: {
        operation: 'apply',
        appliedAt,
        appliedTo,
        role: session.role,
        environment: resolvedEnvironment,
        delivery: {
          deliveryId: data.deliveryId,
          deliveryVersion: data.deliveryVersion,
          deliveredAt: data.deliveredAt,
          deliveryMode: resolvedDeliveryMode,
        },
        flags: {
          chartsDisplayEnabled: data.chartsDisplayEnabled,
          chartsSendEnabled: data.chartsSendEnabled,
          chartsMasterSource: data.chartsMasterSource,
        },
        syncMismatch: data.syncMismatch,
        syncMismatchFields: data.syncMismatchFields,
        raw: {
          config: data.rawConfig,
          delivery: data.rawDelivery,
        },
      },
    });

    const prevSource = previousDeliveryFlags.current.chartsMasterSource ?? 'auto';
    const prevSend = previousDeliveryFlags.current.chartsSendEnabled;
    const prevDisplay = previousDeliveryFlags.current.chartsDisplayEnabled;

    const nextSource = (data.chartsMasterSource ?? chartsMasterSourcePolicy) as ChartsMasterSourcePolicy;
    const nextSend = data.chartsSendEnabled ?? chartsSendEnabled;
    const nextDisplay = data.chartsDisplayEnabled ?? chartsDisplayEnabled;
    const isFirstApply = previousDeliveryFlags.current.chartsMasterSource === undefined;
    previousDeliveryFlags.current = {
      chartsMasterSource: nextSource,
      chartsSendEnabled: nextSend,
      chartsDisplayEnabled: nextDisplay,
    };

    if (isFirstApply && (nextSource === 'fallback' || nextSource === 'mock')) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: `Charts masterSource=${nextSource} で起動しています（送信は停止扱い）。`,
      });
      return;
    }
    if (isFirstApply && nextSend === false) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: 'Charts の ORCA送信 は管理配信で disabled の状態です。',
      });
      return;
    }
    if (isFirstApply && nextDisplay === false) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: 'Charts の表示は管理配信で disabled の状態です。',
      });
      return;
    }
    if (prevSource !== nextSource) {
      const impact =
        nextSource === 'fallback'
          ? '（送信停止・フォールバック扱い）'
          : nextSource === 'mock'
            ? '（送信停止・モック優先）'
            : '';
      setDeliveryImpactBanner({
        tone: nextSource === 'fallback' ? 'warning' : nextSource === 'mock' ? 'warning' : 'info',
        message: `Charts masterSource が ${prevSource} → ${nextSource} に更新されました${impact}`,
      });
      return;
    }
    if (prevSend !== undefined && prevSend !== nextSend && nextSend === false) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: 'Charts の ORCA送信 が管理配信で無効化されました。',
      });
      return;
    }
    if (prevDisplay !== undefined && prevDisplay !== nextDisplay && nextDisplay === false) {
      setDeliveryImpactBanner({
        tone: 'warning',
        message: 'Charts の表示が管理配信で無効化されました。',
      });
      return;
    }
    setDeliveryImpactBanner(null);
  }, [
    adminConfigQuery.data,
    chartsDisplayEnabled,
    chartsMasterSourcePolicy,
    chartsSendEnabled,
    flags.runId,
    session.facilityId,
    session.role,
    session.userId,
  ]);

  const claimQueryKey = ['charts-claim-flags'];
  const claimQuery = useQuery({
    queryKey: claimQueryKey,
    queryFn: (context) => fetchClaimFlags(context, { screen: 'charts', preferredSourceOverride }),
    refetchInterval: 120_000,
    staleTime: 120_000,
    meta: {
      servedFromCache: !!queryClient.getQueryState(claimQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(claimQueryKey)?.fetchFailureCount ?? 0,
    },
  });

  const orcaQueueQueryKey = ['orca-queue'];
  const orcaQueueQuery = useQuery({
    queryKey: orcaQueueQueryKey,
    queryFn: () => fetchOrcaQueue(),
    refetchInterval: 30_000,
    staleTime: 30_000,
    retry: 1,
    meta: {
      servedFromCache: !!queryClient.getQueryState(orcaQueueQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(orcaQueueQueryKey)?.fetchFailureCount ?? 0,
    },
  });

  const appointmentQueryKey = ['charts-appointments', today];
  const appointmentQuery = useInfiniteQuery({
    queryKey: appointmentQueryKey,
    queryFn: ({ pageParam = 1, ...context }) =>
      fetchAppointmentOutpatients(
        { date: today, page: pageParam, size: 50 },
        context,
        { preferredSourceOverride, screen: 'charts' },
      ),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasNextPage === false) return undefined;
      if (lastPage.hasNextPage === true) return (lastPage.page ?? allPages.length) + 1;
      const size = lastPage.size ?? 50;
      if (lastPage.recordsReturned !== undefined && lastPage.recordsReturned < size) return undefined;
      return (lastPage.page ?? allPages.length) + 1;
    },
    initialPageParam: 1,
    refetchOnWindowFocus: false,
    meta: {
      servedFromCache: !!queryClient.getQueryState(appointmentQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(appointmentQueryKey)?.fetchFailureCount ?? 0,
    },
  });

  const orcaSummaryQueryKey = ['orca-outpatient-summary', flags.runId];
  const orcaSummaryQuery = useQuery({
    queryKey: orcaSummaryQueryKey,
    queryFn: (context) => fetchOrcaOutpatientSummary(context, { preferredSourceOverride }),
    refetchInterval: 120_000,
    staleTime: 120_000,
    meta: {
      servedFromCache: !!queryClient.getQueryState(orcaSummaryQueryKey)?.dataUpdatedAt,
      retryCount: queryClient.getQueryState(orcaSummaryQueryKey)?.fetchFailureCount ?? 0,
    },
  });

  const appointmentMeta = useMemo(() => {
    const pages = appointmentQuery.data?.pages ?? [];
    return pickLatestOutpatientMeta(pages as AppointmentPayload[]);
  }, [appointmentQuery.data?.pages]);

  const mergedFlags = useMemo(() => {
    const resolvedFlags = resolveOutpatientFlags(claimQuery.data, orcaSummaryQuery.data, appointmentMeta, flags);
    const runId = resolvedFlags.runId ?? flags.runId;
    const cacheHit = resolvedFlags.cacheHit ?? flags.cacheHit;
    const missingMaster = resolvedFlags.missingMaster ?? flags.missingMaster;
    const dataSourceTransition = resolvedFlags.dataSourceTransition ?? flags.dataSourceTransition;
    const fallbackUsed = resolvedFlags.fallbackUsed ?? flags.fallbackUsed;
    const auditMeta = { runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed };
    const auditEvent = normalizeAuditEventPayload(
      claimQuery.data?.auditEvent as Record<string, unknown> | undefined,
      auditMeta,
    );
    return { ...resolvedFlags, ...auditMeta, auditEvent };
  }, [
    appointmentMeta,
    claimQuery.data?.auditEvent,
    claimQuery.data?.cacheHit,
    claimQuery.data?.dataSourceTransition,
    claimQuery.data?.missingMaster,
    claimQuery.data?.runId,
    claimQuery.data?.fallbackUsed,
    flags.cacheHit,
    flags.dataSourceTransition,
    flags.fallbackUsed,
    flags.missingMaster,
    flags.runId,
    orcaSummaryQuery.data?.cacheHit,
    orcaSummaryQuery.data?.dataSourceTransition,
    orcaSummaryQuery.data?.missingMaster,
    orcaSummaryQuery.data?.runId,
    orcaSummaryQuery.data?.fallbackUsed,
  ]);

  const resolvedRunId = mergedFlags.runId ?? flags.runId;
  const resolvedCacheHit = mergedFlags.cacheHit ?? flags.cacheHit;
  const resolvedMissingMaster = mergedFlags.missingMaster ?? flags.missingMaster;
  const resolvedTransition = mergedFlags.dataSourceTransition ?? flags.dataSourceTransition;
  const resolvedFallbackUsed = (mergedFlags.fallbackUsed ?? flags.fallbackUsed ?? false) || forceFallbackUsed;
  const soapNoteMeta = useMemo(
    () => ({
      runId: resolvedRunId ?? flags.runId,
      cacheHit: resolvedCacheHit ?? false,
      missingMaster: resolvedMissingMaster ?? false,
      fallbackUsed: resolvedFallbackUsed ?? false,
      dataSourceTransition: resolvedTransition ?? 'snapshot',
      patientId: encounterContext.patientId,
      appointmentId: encounterContext.appointmentId,
      receptionId: encounterContext.receptionId,
      visitDate: encounterContext.visitDate,
    }),
    [
      encounterContext.appointmentId,
      encounterContext.patientId,
      encounterContext.receptionId,
      encounterContext.visitDate,
      flags.runId,
      resolvedCacheHit,
      resolvedFallbackUsed,
      resolvedMissingMaster,
      resolvedRunId,
      resolvedTransition,
    ],
  );
  const sidePanelMeta = useMemo(
    () => ({
      runId: resolvedRunId ?? flags.runId,
      cacheHit: resolvedCacheHit ?? false,
      missingMaster: resolvedMissingMaster ?? false,
      fallbackUsed: resolvedFallbackUsed ?? false,
      dataSourceTransition: resolvedTransition ?? 'snapshot',
      patientId: encounterContext.patientId,
      appointmentId: encounterContext.appointmentId,
      receptionId: encounterContext.receptionId,
      visitDate: encounterContext.visitDate,
      actorRole: session.role,
      readOnly: lockState.locked || tabLock.isReadOnly || approvalLocked,
      readOnlyReason: approvalLocked ? approvalReason : lockState.reason ?? tabLock.readOnlyReason,
    }),
    [
      approvalLocked,
      approvalReason,
      encounterContext.appointmentId,
      encounterContext.patientId,
      encounterContext.receptionId,
      encounterContext.visitDate,
      flags.runId,
      lockState.locked,
      lockState.reason,
      resolvedCacheHit,
      resolvedFallbackUsed,
      resolvedMissingMaster,
      resolvedRunId,
      resolvedTransition,
      session.role,
      tabLock.isReadOnly,
      tabLock.readOnlyReason,
    ],
  );
  const soapNoteAuthor = useMemo(
    () => ({
      role: session.role,
      displayName: session.displayName ?? session.commonName,
      userId: session.userId,
    }),
    [session.commonName, session.displayName, session.role, session.userId],
  );

  const selectedQueueEntry = useMemo(() => {
    const entries = (claimQuery.data as ClaimOutpatientPayload | undefined)?.queueEntries ?? [];
    if (!encounterContext.patientId) return entries[0];
    return entries.find((entry) => entry.patientId === encounterContext.patientId) ?? entries[0];
  }, [claimQuery.data, encounterContext.patientId]);

  const selectedOrcaQueueEntry = useMemo(() => {
    const patientId = encounterContext.patientId;
    if (!patientId) return undefined;
    const entries = orcaQueueQuery.data?.queue ?? [];
    return entries.find((entry) => entry.patientId === patientId);
  }, [encounterContext.patientId, orcaQueueQuery.data?.queue]);

  const selectedOrcaSendStatus = useMemo(() => resolveOrcaSendStatus(selectedOrcaQueueEntry), [selectedOrcaQueueEntry]);

  const orcaQueueCounts = useMemo(() => {
    const queue = orcaQueueQuery.data?.queue ?? [];
    const counts = { waiting: 0, processing: 0, success: 0, failure: 0, unknown: 0, stalled: 0 };
    for (const entry of queue) {
      const status = resolveOrcaSendStatus(entry);
      if (!status) {
        counts.unknown += 1;
        continue;
      }
      counts[status.key] += 1;
      if (status.isStalled) counts.stalled += 1;
    }
    return counts;
  }, [orcaQueueQuery.data?.queue]);

  const actionBarQueueEntry = useMemo(() => {
    if (!selectedOrcaQueueEntry) return selectedQueueEntry;
    const mapped = toClaimQueueEntryFromOrcaQueueEntry(selectedOrcaQueueEntry);
    if (!selectedQueueEntry) return mapped;
    return {
      ...selectedQueueEntry,
      phase: mapped.phase,
      errorMessage: mapped.errorMessage ?? selectedQueueEntry.errorMessage,
      patientId: selectedQueueEntry.patientId ?? mapped.patientId,
    };
  }, [selectedOrcaQueueEntry, selectedQueueEntry]);

  useEffect(() => {
    if (!orcaQueueQuery.data) return;
    const meta = getObservabilityMeta();
    const snapshot = JSON.stringify({
      patientId: encounterContext.patientId ?? null,
      queueRunId: orcaQueueQuery.data.runId ?? null,
      traceId: meta.traceId ?? null,
      selected: selectedOrcaSendStatus
        ? {
            key: selectedOrcaSendStatus.key,
            isStalled: selectedOrcaSendStatus.isStalled,
            lastDispatchAt: selectedOrcaSendStatus.lastDispatchAt ?? null,
            error: selectedOrcaSendStatus.error ?? null,
          }
        : null,
      counts: orcaQueueCounts,
    });
    if (lastOrcaQueueSnapshot.current === snapshot) return;
    lastOrcaQueueSnapshot.current = snapshot;

    logUiState({
      action: 'outpatient_fetch',
      screen: 'charts/orca-queue',
      runId: orcaQueueQuery.data.runId ?? resolvedRunId ?? flags.runId,
      missingMaster: resolvedMissingMaster,
      dataSourceTransition: resolvedTransition,
      fallbackUsed: resolvedFallbackUsed,
      patientId: encounterContext.patientId ?? undefined,
      details: {
        endpoint: '/api/orca/queue',
        fetchedAt: orcaQueueQuery.data.fetchedAt,
        queueSource: orcaQueueQuery.data.source,
        queueEntries: orcaQueueQuery.data.queue?.length ?? 0,
        patientId: encounterContext.patientId,
        selectedSendStatus: selectedOrcaSendStatus ?? null,
        counts: orcaQueueCounts,
        traceId: meta.traceId,
      },
    });

    recordChartsAuditEvent({
      action: 'ORCA_QUEUE_STATUS',
      outcome: selectedOrcaSendStatus?.key === 'failure' || selectedOrcaSendStatus?.isStalled ? 'warning' : 'success',
      subject: 'charts-orca-queue',
      patientId: encounterContext.patientId,
      runId: orcaQueueQuery.data.runId ?? resolvedRunId ?? flags.runId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      fallbackUsed: resolvedFallbackUsed,
      dataSourceTransition: resolvedTransition,
      details: {
        traceId: meta.traceId,
        queueSource: orcaQueueQuery.data.source,
        fetchedAt: orcaQueueQuery.data.fetchedAt,
        counts: orcaQueueCounts,
        selectedSendStatus: selectedOrcaSendStatus ?? null,
      },
    });
  }, [
    encounterContext.patientId,
    flags.runId,
    orcaQueueCounts,
    orcaQueueQuery.data,
    resolvedCacheHit,
    resolvedFallbackUsed,
    resolvedMissingMaster,
    resolvedRunId,
    resolvedTransition,
    selectedOrcaSendStatus,
  ]);

  const hasPermission = useMemo(() => hasStoredAuth(), []);

  const networkDegradedReason = useMemo(() => {
    const firstError =
      (claimQuery.isError && isNetworkError(claimQuery.error) ? claimQuery.error : undefined) ??
      (orcaSummaryQuery.isError && isNetworkError(orcaSummaryQuery.error) ? orcaSummaryQuery.error : undefined) ??
      (appointmentQuery.isError && isNetworkError(appointmentQuery.error) ? appointmentQuery.error : undefined);
    if (!firstError) return undefined;
    const message = firstError instanceof Error ? firstError.message : String(firstError);
    return `直近の取得でネットワークエラーを検知: ${message}`;
  }, [appointmentQuery.error, appointmentQuery.isError, claimQuery.error, claimQuery.isError, orcaSummaryQuery.error, orcaSummaryQuery.isError]);

  const handleRetryClaim = () => {
    logAuditEvent({
      runId: claimQuery.data?.runId ?? resolvedRunId,
      cacheHit: claimQuery.data?.cacheHit,
      missingMaster: claimQuery.data?.missingMaster,
      fallbackUsed: claimQuery.data?.fallbackUsed,
      dataSourceTransition: claimQuery.data?.dataSourceTransition ?? resolvedTransition,
      patientId: encounterContext.patientId,
      appointmentId: encounterContext.appointmentId,
      payload: {
        action: 'CLAIM_OUTPATIENT_RETRY',
        outcome: 'started',
        details: {
          runId: claimQuery.data?.runId ?? resolvedRunId,
          dataSourceTransition: claimQuery.data?.dataSourceTransition ?? resolvedTransition,
          cacheHit: claimQuery.data?.cacheHit,
          missingMaster: claimQuery.data?.missingMaster,
          fallbackUsed: claimQuery.data?.fallbackUsed,
          sourcePath: claimQuery.data?.sourcePath,
        },
      },
    });
    logUiState({
      action: 'outpatient_fetch',
      screen: 'charts/document-timeline',
      controlId: 'retry-claim',
      runId: claimQuery.data?.runId ?? resolvedRunId,
      cacheHit: claimQuery.data?.cacheHit ?? resolvedCacheHit,
      missingMaster: claimQuery.data?.missingMaster ?? resolvedMissingMaster,
      dataSourceTransition: claimQuery.data?.dataSourceTransition ?? resolvedTransition,
      fallbackUsed: claimQuery.data?.fallbackUsed ?? resolvedFallbackUsed,
      patientId: encounterContext.patientId ?? undefined,
      appointmentId: encounterContext.appointmentId ?? undefined,
      claimId: (claimQuery.data as ClaimOutpatientPayload | undefined)?.bundles?.[0]?.bundleNumber,
      details: {
        reason: 'manual_retry',
        endpoint: claimQuery.data?.sourcePath,
        httpStatus: claimQuery.data?.httpStatus,
        apiResult: (claimQuery.data as ClaimOutpatientPayload | undefined)?.apiResult,
        patientId: encounterContext.patientId,
        appointmentId: encounterContext.appointmentId,
        claimId: (claimQuery.data as ClaimOutpatientPayload | undefined)?.bundles?.[0]?.bundleNumber,
      },
    });
    void claimQuery.refetch();
  };

  const claimErrorForTimeline = useMemo(() => {
    const data = claimQuery.data as ClaimOutpatientPayload | undefined;
    if (data?.httpStatus === 0 || (typeof data?.httpStatus === 'number' && data.httpStatus >= 400)) {
      const endpoint = data.sourcePath ?? 'unknown';
      const message = data.apiResultMessage ? ` / ${data.apiResultMessage}` : '';
      const httpLabel = data.httpStatus === 0 ? 'NETWORK' : `HTTP ${data.httpStatus}`;
      return new Error(`請求バンドル取得に失敗（${httpLabel} / endpoint=${endpoint}${message}）`);
    }
    if (typeof data?.apiResult === 'string' && /error|^E/i.test(data.apiResult)) {
      const endpoint = data.sourcePath ?? 'unknown';
      const message = data.apiResultMessage ? ` / ${data.apiResultMessage}` : '';
      return new Error(`請求バンドルの処理結果がエラー（apiResult=${data.apiResult} / endpoint=${endpoint}${message}）`);
    }
    if (!claimQuery.isError) return undefined;
    return claimQuery.error instanceof Error ? claimQuery.error : new Error(String(claimQuery.error));
  }, [claimQuery.data, claimQuery.error, claimQuery.isError]);

  useEffect(() => {
    const { runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed } = mergedFlags;
    appliedMeta.current = applyAuthServicePatch(
      { runId, cacheHit, missingMaster, dataSourceTransition, fallbackUsed },
      appliedMeta.current,
      { bumpRunId, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed },
    );
    setAuditEvents(getAuditEventLog());
  }, [
    bumpRunId,
    mergedFlags.cacheHit,
    mergedFlags.dataSourceTransition,
    mergedFlags.fallbackUsed,
    mergedFlags.missingMaster,
    mergedFlags.runId,
    setCacheHit,
    setDataSourceTransition,
    setFallbackUsed,
    setMissingMaster,
  ]);

  useEffect(() => {
    setAuditEvents(getAuditEventLog());
  }, [flags.cacheHit, flags.dataSourceTransition, flags.missingMaster, flags.runId]);

  const appointmentPages = appointmentQuery.data?.pages ?? [];
  const patientEntries: ReceptionEntry[] = useMemo(
    () => appointmentPages.flatMap((page) => page.entries ?? []),
    [appointmentPages],
  );

  const selectedEntry = useMemo(() => {
    if (!encounterContext.patientId && !encounterContext.appointmentId && !encounterContext.receptionId) return undefined;
    const byReception = encounterContext.receptionId
      ? patientEntries.find((entry) => entry.receptionId === encounterContext.receptionId)
      : undefined;
    if (byReception) return byReception;
    const byAppointment = encounterContext.appointmentId
      ? patientEntries.find((entry) => entry.appointmentId === encounterContext.appointmentId)
      : undefined;
    if (byAppointment) return byAppointment;
    if (!encounterContext.patientId) return undefined;
    return patientEntries.find((entry) => (entry.patientId ?? entry.id) === encounterContext.patientId);
  }, [encounterContext.appointmentId, encounterContext.patientId, encounterContext.receptionId, patientEntries]);

  const lockTarget = useMemo(() => {
    const patientId = selectedEntry?.patientId ?? selectedEntry?.id ?? encounterContext.patientId;
    return {
      facilityId: session.facilityId,
      patientId,
      receptionId: selectedEntry?.receptionId ?? encounterContext.receptionId,
      appointmentId: selectedEntry?.appointmentId ?? encounterContext.appointmentId,
    };
  }, [
    encounterContext.appointmentId,
    encounterContext.patientId,
    encounterContext.receptionId,
    selectedEntry?.appointmentId,
    selectedEntry?.id,
    selectedEntry?.patientId,
    selectedEntry?.receptionId,
    session.facilityId,
  ]);
  const approvalTarget = useMemo(
    () => ({
      facilityId: session.facilityId,
      patientId: encounterContext.patientId,
      appointmentId: encounterContext.appointmentId,
      receptionId: encounterContext.receptionId,
    }),
    [
      encounterContext.appointmentId,
      encounterContext.patientId,
      encounterContext.receptionId,
      session.facilityId,
    ],
  );
  const approvalStorageKey = useMemo(
    () => buildChartsApprovalStorageKey(approvalTarget),
    [approvalTarget],
  );
  const handleApprovalConfirmed = useCallback(
    (meta: { action: 'send'; actor?: string }) => {
      if (!approvalStorageKey) return;
      const record: ChartsApprovalRecord = {
        version: 1,
        key: approvalStorageKey,
        approvedAt: new Date().toISOString(),
        runId: resolvedRunId ?? flags.runId,
        actor: meta.actor,
        action: meta.action,
      };
      writeChartsApprovalRecord(record);
      setApprovalState({ status: 'approved', record });
    },
    [approvalStorageKey, flags.runId, resolvedRunId],
  );
  const handleApprovalUnlock = useCallback(() => {
    if (!approvalStorageKey) {
      setApprovalState({ status: 'none' });
      return;
    }
    const approvedAt = approvalState.record?.approvedAt ?? 'unknown';
    const signature = `${approvalStorageKey}:${approvedAt}`;
    clearChartsApprovalRecord(approvalStorageKey);
    setApprovalState({ status: 'none' });
    if (approvalUnlockLogRef.current === signature) return;
    approvalUnlockLogRef.current = signature;
    recordChartsAuditEvent({
      action: 'CHARTS_EDIT_LOCK',
      outcome: 'released',
      subject: 'charts-approval-lock',
      patientId: approvalTarget.patientId,
      appointmentId: approvalTarget.appointmentId,
      runId: resolvedRunId ?? flags.runId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      fallbackUsed: resolvedFallbackUsed,
      dataSourceTransition: resolvedTransition,
      details: {
        operationPhase: 'lock',
        trigger: 'approval_unlock',
        approvalState: 'released',
        lockStatus: 'approved',
        patientId: approvalTarget.patientId,
        appointmentId: approvalTarget.appointmentId,
        receptionId: approvalTarget.receptionId,
        facilityId: session.facilityId,
        userId: session.userId,
      },
    });
    logUiState({
      action: 'lock',
      screen: 'charts/action-bar',
      controlId: 'approval-unlock',
      runId: resolvedRunId ?? flags.runId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      dataSourceTransition: resolvedTransition,
      fallbackUsed: resolvedFallbackUsed,
      patientId: approvalTarget.patientId,
      appointmentId: approvalTarget.appointmentId,
      details: {
        operationPhase: 'lock',
        trigger: 'approval_unlock',
        approvalState: 'released',
        lockStatus: 'approved',
        patientId: approvalTarget.patientId,
        appointmentId: approvalTarget.appointmentId,
        receptionId: approvalTarget.receptionId,
      },
    });
  }, [
    approvalState.record?.approvedAt,
    approvalStorageKey,
    approvalTarget.appointmentId,
    approvalTarget.patientId,
    approvalTarget.receptionId,
    flags.runId,
    resolvedCacheHit,
    resolvedFallbackUsed,
    resolvedMissingMaster,
    resolvedRunId,
    resolvedTransition,
    session.facilityId,
    session.userId,
  ]);
  const approvalLocked = approvalState.status === 'approved';
  const approvalReason = approvalLocked ? '署名確定済みのため編集できません。' : undefined;

  const tabLock = useChartsTabLock({
    runId: resolvedRunId ?? flags.runId,
    target: lockTarget,
    enabled: chartsDisplayEnabled && Boolean(lockTarget.patientId),
  });
  tabLockReadOnlyRef.current = tabLock.isReadOnly;

  useEffect(() => {
    if (!approvalStorageKey) {
      setApprovalState({ status: 'none' });
      return;
    }
    const record = readChartsApprovalRecord(approvalStorageKey);
    if (record) {
      setApprovalState({ status: 'approved', record });
      return;
    }
    setApprovalState({ status: 'none' });
  }, [approvalStorageKey]);

  useEffect(() => {
    if (!approvalLocked) {
      approvalLockLogRef.current = null;
      return;
    }
    if (!approvalStorageKey) return;
    const approvedAt = approvalState.record?.approvedAt ?? 'unknown';
    const signature = `${approvalStorageKey}:${approvedAt}`;
    if (approvalLockLogRef.current === signature) return;
    approvalLockLogRef.current = signature;
    recordChartsAuditEvent({
      action: 'CHARTS_EDIT_LOCK',
      outcome: 'acquired',
      subject: 'charts-approval-lock',
      patientId: approvalTarget.patientId,
      appointmentId: approvalTarget.appointmentId,
      runId: resolvedRunId ?? flags.runId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      fallbackUsed: resolvedFallbackUsed,
      dataSourceTransition: resolvedTransition,
      details: {
        operationPhase: 'lock',
        trigger: 'approval',
        lockStatus: 'approved',
        approvalState: 'confirmed',
        receptionId: approvalTarget.receptionId,
        facilityId: session.facilityId,
        userId: session.userId,
      },
    });
    logUiState({
      action: 'lock',
      screen: 'charts',
      controlId: 'approval-lock',
      runId: resolvedRunId ?? flags.runId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      dataSourceTransition: resolvedTransition,
      fallbackUsed: resolvedFallbackUsed,
      patientId: approvalTarget.patientId,
      appointmentId: approvalTarget.appointmentId,
      details: {
        operationPhase: 'lock',
        trigger: 'approval',
        lockStatus: 'approved',
        approvalState: 'confirmed',
        receptionId: approvalTarget.receptionId,
      },
    });
  }, [
    approvalLocked,
    approvalState.record?.approvedAt,
    approvalStorageKey,
    approvalTarget.appointmentId,
    approvalTarget.patientId,
    approvalTarget.receptionId,
    flags.runId,
    resolvedCacheHit,
    resolvedFallbackUsed,
    resolvedMissingMaster,
    resolvedRunId,
    resolvedTransition,
    session.facilityId,
    session.userId,
  ]);

  useEffect(() => {
    if (!tabLock.storageKey) {
      setEditLockAlert(null);
      return;
    }
    if (!tabLock.isReadOnly) {
      setEditLockAlert(null);
      return;
    }
    const announcementKey = `${tabLock.storageKey}:${tabLock.ownerTabSessionId ?? 'unknown'}:${tabLock.expiresAt ?? 'unknown'}`;
    const isFirst = lastEditLockAnnouncement.current !== announcementKey;
    lastEditLockAnnouncement.current = announcementKey;

    const message = `${tabLock.readOnlyReason ?? '別タブで編集中のため閲覧専用です。'}（patientId=${lockTarget.patientId ?? '—'} receptionId=${lockTarget.receptionId ?? '—'}）`;
    setEditLockAlert({
      tone: 'warning',
      message,
      ariaLive: isFirst ? 'assertive' : 'polite',
    });

    recordChartsAuditEvent({
      action: 'CHARTS_EDIT_LOCK',
      outcome: 'conflict',
      subject: 'charts-tab-lock',
      patientId: lockTarget.patientId,
      appointmentId: lockTarget.appointmentId,
      runId: resolvedRunId ?? flags.runId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      fallbackUsed: resolvedFallbackUsed,
      dataSourceTransition: resolvedTransition,
      details: {
        operationPhase: 'lock',
        trigger: 'tab',
        lockStatus: tabLock.status,
        tabSessionId: tabLock.tabSessionId,
        lockOwnerRunId: tabLock.ownerRunId,
        lockExpiresAt: tabLock.expiresAt,
        receptionId: lockTarget.receptionId,
        facilityId: session.facilityId,
        userId: session.userId,
      },
    });
    logUiState({
      action: 'lock',
      screen: 'charts',
      controlId: 'tab-lock',
      runId: resolvedRunId ?? flags.runId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      dataSourceTransition: resolvedTransition,
      fallbackUsed: resolvedFallbackUsed,
      patientId: lockTarget.patientId,
      appointmentId: lockTarget.appointmentId,
      details: {
        operationPhase: 'lock',
        trigger: 'tab',
        reason: tabLock.readOnlyReason,
        lockStatus: tabLock.status,
        tabSessionId: tabLock.tabSessionId,
        lockOwnerRunId: tabLock.ownerRunId,
        lockExpiresAt: tabLock.expiresAt,
        receptionId: lockTarget.receptionId,
      },
    });
  }, [
    flags.runId,
    lockTarget.appointmentId,
    lockTarget.patientId,
    lockTarget.receptionId,
    resolvedCacheHit,
    resolvedFallbackUsed,
    resolvedMissingMaster,
    resolvedRunId,
    resolvedTransition,
    session.facilityId,
    session.userId,
    tabLock.expiresAt,
    tabLock.isReadOnly,
    tabLock.ownerRunId,
    tabLock.ownerTabSessionId,
    tabLock.readOnlyReason,
    tabLock.storageKey,
    tabLock.tabSessionId,
  ]);

  const formattedLastUpdated = useMemo(() => {
    for (let idx = auditEvents.length - 1; idx >= 0; idx -= 1) {
      const record = auditEvents[idx];
      const payload = (record.payload ?? {}) as Record<string, unknown>;
      const action = payload.action;
      const outcome = payload.outcome;
      if (outcome !== 'success') continue;
      if (action !== 'DRAFT_SAVE' && action !== 'ORCA_SEND' && action !== 'ENCOUNTER_CLOSE') continue;
      const details = (payload.details ?? {}) as Record<string, unknown>;
      const actor = typeof details.actor === 'string' ? details.actor : undefined;
      const stamp = typeof record.timestamp === 'string' ? record.timestamp : undefined;
      if (!stamp) continue;
      const date = new Date(stamp);
      if (Number.isNaN(date.getTime())) continue;
      const hhmm = date.toISOString().slice(11, 16);
      return { action: String(action), actor, hhmm };
    }
    return null;
  }, [auditEvents]);
  const appointmentRecordsReturned = useMemo(
    () =>
      appointmentPages.reduce(
        (acc, page) => acc + (page.recordsReturned ?? page.entries?.length ?? 0),
        0,
      ),
    [appointmentPages],
  );
  const hasNextAppointments =
    appointmentQuery.hasNextPage ?? appointmentPages.some((page) => page.hasNextPage === true);

  const appointmentBanner = useMemo(
    () =>
      getAppointmentDataBanner({
        entries: patientEntries,
        isLoading: appointmentQuery.isLoading,
        isError: appointmentQuery.isError,
        error: appointmentQuery.error,
        date: today,
      }),
    [appointmentQuery.error, appointmentQuery.isError, appointmentQuery.isLoading, patientEntries, today],
  );
  const approvalLabel = approvalLocked ? '承認済（署名確定）' : '未承認';
  const approvalDetail = approvalLocked
    ? approvalState.record?.approvedAt
      ? `承認時刻: ${approvalState.record.approvedAt}`
      : '承認済み'
    : '署名未確定';
  const lockStatus = useMemo(() => {
    if (approvalLocked) {
      return { label: '編集不可', detail: approvalReason ?? '承認済みロック中' };
    }
    if (tabLock.isReadOnly) {
      return { label: '閲覧専用', detail: tabLock.readOnlyReason ?? '別タブが編集中です。' };
    }
    if (lockState.locked) {
      return { label: '操作中ロック', detail: lockState.reason ?? '処理中のため一時ロックしています。' };
    }
    return { label: '解除済み', detail: '編集可能' };
  }, [approvalLocked, approvalReason, lockState.locked, lockState.reason, tabLock.isReadOnly, tabLock.readOnlyReason]);
  const switchLocked = lockState.locked || tabLock.isReadOnly;
  const switchLockedReason = lockState.reason ?? (tabLock.isReadOnly ? tabLock.readOnlyReason : undefined);
  useEffect(() => {
    if (patientEntries.length === 0) return;
    if (draftState.dirty || lockState.locked || tabLock.isReadOnly) return;
    const resolve = (entries: ReceptionEntry[], context: OutpatientEncounterContext) => {
      if (context.receptionId) return entries.find((entry) => entry.receptionId === context.receptionId);
      if (context.appointmentId) return entries.find((entry) => entry.appointmentId === context.appointmentId);
      if (context.patientId) return entries.find((entry) => (entry.patientId ?? entry.id) === context.patientId);
      return undefined;
    };

    const resolved = resolve(patientEntries, encounterContext);
    const head = patientEntries[0];
    if (!resolved && hasEncounterContext(encounterContext)) {
      setContextAlert({
        tone: 'warning',
        message: `指定された外来コンテキストが見つかりません（patientId=${encounterContext.patientId ?? '―'} receptionId=${encounterContext.receptionId ?? '―'}）。先頭の患者へ切替えました。`,
      });
      recordChartsAuditEvent({
        action: 'CHARTS_PATIENT_SWITCH',
        outcome: 'warning',
        subject: 'charts-context',
        patientId: head.patientId ?? head.id,
        appointmentId: head.appointmentId,
        note: 'auto-resolve missing encounter context',
        runId: resolvedRunId ?? flags.runId,
        cacheHit: resolvedCacheHit,
        missingMaster: resolvedMissingMaster,
        fallbackUsed: resolvedFallbackUsed,
        dataSourceTransition: resolvedTransition,
        details: {
          operationPhase: 'do',
          trigger: 'auto_resolve',
          receptionId: head.receptionId,
        },
      });
      logUiState({
        action: 'navigate',
        screen: 'charts',
        controlId: 'patient-switch-auto-resolve',
        runId: resolvedRunId ?? flags.runId,
        cacheHit: resolvedCacheHit,
        missingMaster: resolvedMissingMaster,
        dataSourceTransition: resolvedTransition,
        fallbackUsed: resolvedFallbackUsed,
        patientId: head.patientId ?? head.id,
        appointmentId: head.appointmentId,
        details: {
          operationPhase: 'do',
          trigger: 'auto_resolve',
          receptionId: head.receptionId,
          previousContext: encounterContext,
        },
      });
      setEncounterContext({
        patientId: head.patientId ?? head.id,
        appointmentId: head.appointmentId,
        receptionId: head.receptionId,
        visitDate: normalizeVisitDate(head.visitDate) ?? today,
      });
      return;
    }

    const chosen = resolved ?? head;
    const nextContext: OutpatientEncounterContext = {
      patientId: chosen.patientId ?? chosen.id,
      appointmentId: chosen.appointmentId,
      receptionId: chosen.receptionId,
      visitDate: normalizeVisitDate(chosen.visitDate) ?? encounterContext.visitDate ?? today,
    };
    if (!sameEncounterContext(nextContext, encounterContext)) {
      setEncounterContext(nextContext);
      setContextAlert(null);
    }
  }, [draftState.dirty, encounterContext, lockState.locked, patientEntries, sameEncounterContext, tabLock.isReadOnly, today]);

  const latestAuditEvent = useMemo(() => {
    const auditMeta = {
      runId: resolvedRunId,
      cacheHit: resolvedCacheHit,
      missingMaster: resolvedMissingMaster,
      dataSourceTransition: resolvedTransition,
      fallbackUsed: resolvedFallbackUsed,
    };
    if (auditEvents.length > 0) {
      return normalizeAuditEventLog(auditEvents[auditEvents.length - 1], auditMeta);
    }
    return mergedFlags.auditEvent;
  }, [auditEvents, mergedFlags.auditEvent, resolvedCacheHit, resolvedFallbackUsed, resolvedMissingMaster, resolvedRunId, resolvedTransition]);

  const handleRefreshSummary = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([claimQuery.refetch(), orcaSummaryQuery.refetch(), appointmentQuery.refetch()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [appointmentQuery, claimQuery, orcaSummaryQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shouldIgnore = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    };
    const focusById = (id: string) => {
      const el = document.getElementById(id) as HTMLElement | null;
      if (!el) return false;
      el.focus();
      return true;
    };
    const clickById = (id: string) => {
      const el = document.getElementById(id) as HTMLButtonElement | null;
      if (!el) return false;
      el.click();
      return true;
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey) return;

      const key = event.key.toLowerCase();

      // Patient search: Alt+P / Ctrl+F
      if (!shouldIgnore(event.target) && event.altKey && !event.ctrlKey && key === 'p') {
        event.preventDefault();
        focusRestoreRef.current = document.activeElement as HTMLElement | null;
        focusById('charts-patient-search');
        return;
      }
      if (!shouldIgnore(event.target) && event.ctrlKey && !event.altKey && key === 'f') {
        event.preventDefault();
        focusRestoreRef.current = document.activeElement as HTMLElement | null;
        focusById('charts-patient-search');
        return;
      }

      // Action shortcuts
      if (!shouldIgnore(event.target) && event.altKey && !event.ctrlKey && key === 's') {
        event.preventDefault();
        clickById('charts-action-send');
        return;
      }
      if (!shouldIgnore(event.target) && event.altKey && !event.ctrlKey && key === 'i') {
        event.preventDefault();
        clickById('charts-action-print');
        return;
      }
      if (!shouldIgnore(event.target) && event.altKey && !event.ctrlKey && key === 'e') {
        event.preventDefault();
        clickById('charts-action-finish');
        return;
      }
      if (!shouldIgnore(event.target) && event.shiftKey && !event.altKey && !event.ctrlKey && key === 'enter') {
        event.preventDefault();
        clickById('charts-action-draft');
        return;
      }

      // Section navigation: Ctrl+Shift+Left/Right
      if (!shouldIgnore(event.target) && event.ctrlKey && event.shiftKey && (key === 'arrowright' || key === 'arrowleft')) {
        event.preventDefault();
        const anchors = [
          'charts-topbar',
          'charts-actionbar',
          'charts-document-timeline',
          'charts-orca-summary',
          'charts-patients-tab',
          'charts-telemetry',
        ];
        const active = document.activeElement as HTMLElement | null;
        const current = active?.closest?.('[data-focus-anchor="true"]') as HTMLElement | null;
        const currentId = current?.id ?? active?.id ?? '';
        const currentIdx = Math.max(0, anchors.indexOf(currentId));
        const delta = key === 'arrowright' ? 1 : -1;
        const nextIdx = (currentIdx + delta + anchors.length) % anchors.length;
        focusById(anchors[nextIdx]);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <a className="skip-link" href="#charts-main" data-test-id="charts-skip-main">
        本文へスキップ
      </a>
      <main
        id="charts-main"
        tabIndex={-1}
        className="charts-page"
        data-run-id={flags.runId}
        aria-busy={lockState.locked}
      >
      <header className="charts-page__header" id="charts-topbar" tabIndex={-1} data-focus-anchor="true">
        <h1>Charts / ORCA トーン連携デモ</h1>
        <p>
          Reception での `missingMaster` / `cacheHit` / `dataSourceTransition` を Charts 側へキャリーし、DocumentTimeline・
          OrcaSummary・Patients の各カードで同じ RUN_ID を基点にトーンをそろえます。Auth-service からのフラグを右上の
          コントロールで切り替え、監査メタの carry over を確認できます。
        </p>
        <div
          className="charts-page__meta"
          role="status"
          aria-live="off"
          data-test-id="charts-topbar-meta"
          data-run-id={resolvedRunId}
          data-source-transition={resolvedTransition}
          data-missing-master={String(resolvedMissingMaster)}
          data-cache-hit={String(resolvedCacheHit)}
          data-fallback-used={String(resolvedFallbackUsed)}
        >
          <span className="charts-page__pill">RUN_ID: {resolvedRunId}</span>
          <span className="charts-page__pill">dataSourceTransition: {resolvedTransition}</span>
          <span className="charts-page__pill">missingMaster: {String(resolvedMissingMaster)}</span>
          <span className="charts-page__pill">cacheHit: {String(resolvedCacheHit)}</span>
          <span className="charts-page__pill">fallbackUsed: {String(resolvedFallbackUsed)}</span>
          <span className="charts-page__pill" aria-live="off">
            編集: {tabLock.isReadOnly ? '閲覧専用' : tabLock.storageKey ? '編集中' : '—'}
            {tabLock.isReadOnly && tabLock.ownerRunId ? `（ownerRunId=${tabLock.ownerRunId}）` : ''}
          </span>
          <span className="charts-page__pill" aria-live="off">
            最終更新:{' '}
            {formattedLastUpdated
              ? `${formattedLastUpdated.hhmm} by ${formattedLastUpdated.actor ?? 'unknown'} (${formattedLastUpdated.action})`
              : '—'}
          </span>
          <span className="charts-page__pill">Charts master: {chartsMasterSourcePolicy}</span>
          <span className="charts-page__pill">Charts送信: {sendAllowedByDelivery ? 'enabled' : 'disabled'}</span>
          <span className="charts-page__pill">
            配信: {adminConfigQuery.data?.deliveryVersion ?? adminConfigQuery.data?.deliveryId ?? '―'}
          </span>
          <span className="charts-page__pill">適用先: {session.facilityId}:{session.userId}</span>
        </div>
      </header>
      <AdminBroadcastBanner broadcast={broadcast} surface="charts" runId={resolvedRunId ?? flags.runId} />
      {contextAlert ? (
        <ToneBanner
          tone={contextAlert.tone}
          message={contextAlert.message}
          destination="Charts"
          nextAction="必要なら Reception で再選択"
          runId={flags.runId}
          ariaLive={contextAlert.tone === 'info' ? 'polite' : 'assertive'}
        />
      ) : null}
      {editLockAlert ? (
        <ToneBanner
          tone={editLockAlert.tone}
          message={editLockAlert.message}
          destination="Charts"
          nextAction="別タブを閉じる / 最新を再読込 / 強制引き継ぎ"
          runId={resolvedRunId ?? flags.runId}
          ariaLive={editLockAlert.ariaLive}
        />
      ) : null}
      {deliveryImpactBanner ? (
        <ToneBanner
          tone={deliveryImpactBanner.tone}
          message={deliveryImpactBanner.message}
          destination="Charts"
          nextAction="再取得/リロードで反映"
          runId={adminConfigQuery.data?.runId ?? broadcast?.runId ?? flags.runId}
          ariaLive="assertive"
        />
      ) : null}

      {!chartsDisplayEnabled ? (
        <ToneBanner
          tone="warning"
          message="Charts の表示が管理配信で disabled です。Administration で再度 enabled にして配信してください。"
          destination="Charts"
          nextAction="Administration で再配信"
          runId={adminConfigQuery.data?.runId ?? broadcast?.runId ?? flags.runId}
          ariaLive="assertive"
        />
      ) : null}

      {deliveryAppliedMeta ? (
        <section className="charts-card" aria-label="管理配信の適用メタ">
          <h2>管理配信（適用メタ）</h2>
          <div className="charts-page__meta" aria-live="polite">
            <span className="charts-page__pill">適用時刻: {deliveryAppliedMeta.appliedAt}</span>
            <span className="charts-page__pill">適用ユーザー: {deliveryAppliedMeta.appliedTo}</span>
            <span className="charts-page__pill">role: {deliveryAppliedMeta.role}</span>
            <span className="charts-page__pill">配信runId: {deliveryAppliedMeta.runId ?? '―'}</span>
            <span className="charts-page__pill">deliveredAt: {deliveryAppliedMeta.deliveredAt ?? '―'}</span>
            <span className="charts-page__pill">deliveryId: {deliveryAppliedMeta.deliveryId ?? '―'}</span>
            <span className="charts-page__pill">deliveryVersion: {deliveryAppliedMeta.deliveryVersion ?? '―'}</span>
            <span className="charts-page__pill">
              syncMismatch: {deliveryAppliedMeta.syncMismatch === undefined ? '―' : String(deliveryAppliedMeta.syncMismatch)}
            </span>
            <span className="charts-page__pill">mismatchFields: {deliveryAppliedMeta.syncMismatchFields ?? '―'}</span>
          </div>
        </section>
      ) : null}

      {!chartsDisplayEnabled ? null : (
        <>
          <div className="charts-card charts-card--actions">
            <ChartsActionBar
              runId={resolvedRunId ?? flags.runId}
              cacheHit={resolvedCacheHit ?? false}
              missingMaster={resolvedMissingMaster ?? false}
              dataSourceTransition={resolvedTransition ?? 'snapshot'}
              fallbackUsed={resolvedFallbackUsed}
              selectedEntry={selectedEntry}
              sendEnabled={sendAllowedByDelivery}
              sendDisabledReason={sendDisabledReason}
              patientId={encounterContext.patientId}
              queueEntry={actionBarQueueEntry}
              hasUnsavedDraft={draftState.dirty}
              hasPermission={hasPermission}
              requireServerRouteForSend
              requirePatientForSend
              networkDegradedReason={networkDegradedReason}
              approvalLock={{
                locked: approvalLocked,
                approvedAt: approvalState.record?.approvedAt,
                runId: approvalState.record?.runId,
                action: approvalState.record?.action,
              }}
              editLock={{
                readOnly: tabLock.isReadOnly,
                reason: tabLock.readOnlyReason,
                ownerRunId: tabLock.ownerRunId,
                expiresAt: tabLock.expiresAt,
                lockStatus: tabLock.status,
              }}
              onReloadLatest={handleRefreshSummary}
              onDiscardChanges={() => {
                setDraftState((prev) => ({ ...prev, dirty: false }));
                recordChartsAuditEvent({
                  action: 'CHARTS_CONFLICT',
                  outcome: 'discarded',
                  subject: 'charts-tab-lock',
                  patientId: lockTarget.patientId,
                  appointmentId: lockTarget.appointmentId,
                  runId: resolvedRunId ?? flags.runId,
                  cacheHit: resolvedCacheHit,
                  missingMaster: resolvedMissingMaster,
                  fallbackUsed: resolvedFallbackUsed,
                  dataSourceTransition: resolvedTransition,
                  details: {
                    operationPhase: 'lock',
                    trigger: 'tab',
                    resolution: 'discard',
                    lockStatus: tabLock.status,
                    tabSessionId: tabLock.tabSessionId,
                    lockOwnerRunId: tabLock.ownerRunId,
                    lockExpiresAt: tabLock.expiresAt,
                    receptionId: lockTarget.receptionId,
                    facilityId: session.facilityId,
                    userId: session.userId,
                  },
                });
              }}
              onForceTakeover={() => {
                const wasReadOnly = tabLock.isReadOnly;
                tabLock.forceTakeover();
                recordChartsAuditEvent({
                  action: 'CHARTS_EDIT_LOCK',
                  outcome: wasReadOnly ? 'stolen' : 'acquired',
                  subject: 'charts-tab-lock',
                  patientId: lockTarget.patientId,
                  appointmentId: lockTarget.appointmentId,
                  runId: resolvedRunId ?? flags.runId,
                  cacheHit: resolvedCacheHit,
                  missingMaster: resolvedMissingMaster,
                  fallbackUsed: resolvedFallbackUsed,
                  dataSourceTransition: resolvedTransition,
                  details: {
                    operationPhase: 'lock',
                    trigger: 'tab',
                    resolution: 'force_takeover',
                    lockStatus: tabLock.status,
                    tabSessionId: tabLock.tabSessionId,
                    lockOwnerRunId: tabLock.ownerRunId,
                    lockExpiresAt: tabLock.expiresAt,
                    receptionId: lockTarget.receptionId,
                    facilityId: session.facilityId,
                    userId: session.userId,
                  },
                });
              }}
              onApprovalConfirmed={handleApprovalConfirmed}
              onApprovalUnlock={handleApprovalUnlock}
              onAfterSend={handleRefreshSummary}
              onDraftSaved={() => setDraftState((prev) => ({ ...prev, dirty: false }))}
              onLockChange={handleLockChange}
            />
          </div>
          <section className="charts-workbench" aria-label="外来カルテ作業台" data-run-id={resolvedRunId ?? flags.runId}>
            <div className="charts-workbench__sticky">
              <div className="charts-card charts-card--patient" id="charts-patient-header">
                <div className="charts-patient-header">
                  <div className="charts-patient-header__identity">
                    <span className="charts-patient-header__label">患者ヘッダ</span>
                    <h2 className="charts-patient-header__name">{patientDisplay.name}</h2>
                    <span className="charts-patient-header__kana">{patientDisplay.kana}</span>
                  </div>
                  <div className="charts-patient-header__meta">
                    <div>
                      <span className="charts-patient-header__meta-label">患者番号</span>
                      <strong>{patientId ?? '—'}</strong>
                    </div>
                    <div>
                      <span className="charts-patient-header__meta-label">性別/年齢</span>
                      <strong>{patientDisplay.sex} / {patientDisplay.age}</strong>
                    </div>
                    <div>
                      <span className="charts-patient-header__meta-label">生年月日</span>
                      <strong>{patientDisplay.birthDate}</strong>
                    </div>
                    <div>
                      <span className="charts-patient-header__meta-label">受付番号</span>
                      <strong>{receptionId ?? '—'}</strong>
                    </div>
                    <div>
                      <span className="charts-patient-header__meta-label">予約番号</span>
                      <strong>{appointmentId ?? '—'}</strong>
                    </div>
                    <div>
                      <span className="charts-patient-header__meta-label">TEL</span>
                      <strong>—</strong>
                    </div>
                  </div>
                  <p className="charts-patient-header__memo">{patientDisplay.note}</p>
                </div>
              </div>
              <div className="charts-card charts-card--clinical" id="charts-clinical-bar">
                <div className="charts-clinical-bar">
                  <div className="charts-clinical-bar__item">
                    <span className="charts-clinical-bar__label">診療ステータス</span>
                    <strong>{patientDisplay.status}</strong>
                  </div>
                  <div className="charts-clinical-bar__item">
                    <span className="charts-clinical-bar__label">診療科</span>
                    <strong>{patientDisplay.department}</strong>
                  </div>
                  <div className="charts-clinical-bar__item">
                    <span className="charts-clinical-bar__label">担当者</span>
                    <strong>{patientDisplay.physician}</strong>
                  </div>
                  <div className="charts-clinical-bar__item">
                    <span className="charts-clinical-bar__label">保険/自費</span>
                    <strong>{patientDisplay.insurance}</strong>
                  </div>
                  <div className="charts-clinical-bar__item">
                    <span className="charts-clinical-bar__label">診療日</span>
                    <strong>{patientDisplay.visitDate} {patientDisplay.appointmentTime}</strong>
                  </div>
                  <div className="charts-clinical-bar__item">
                    <span className="charts-clinical-bar__label">承認/ロック</span>
                    <strong>{approvalLabel}</strong>
                    <span className="charts-clinical-bar__meta">{approvalDetail}</span>
                    <span className="charts-clinical-bar__meta">ロック: {lockStatus.label}</span>
                    <span className="charts-clinical-bar__meta">{lockStatus.detail}</span>
                  </div>
                </div>
              </div>
              <div className="charts-card charts-card--safety" id="charts-safety-display">
                <div
                  className="charts-safety"
                  role="status"
                  aria-live={resolvedMissingMaster ? 'assertive' : 'polite'}
                  data-run-id={resolvedRunId}
                  data-missing-master={String(resolvedMissingMaster)}
                >
                  <div className="charts-safety__primary">
                    <span className="charts-safety__label">安全表示</span>
                    <strong>{patientDisplay.name}</strong>
                  </div>
                  <div className="charts-safety__meta">
                    <span>患者ID: {patientId ?? '—'}</span>
                    <span>受付ID: {receptionId ?? '—'}</span>
                    <span>生年月日: {patientDisplay.birthDate}</span>
                    <span>RUN_ID: {resolvedRunId}</span>
                    <span>missingMaster: {String(resolvedMissingMaster)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="charts-workbench__body">
              <div className="charts-workbench__column charts-workbench__column--left">
                <div className="charts-card" id="charts-patients-tab" tabIndex={-1} data-focus-anchor="true">
                  <PatientsTab
                    entries={patientEntries}
                    appointmentBanner={appointmentBanner}
                    auditEvent={latestAuditEvent as Record<string, unknown> | undefined}
                    selectedContext={encounterContext}
                    receptionCarryover={receptionCarryover}
                    draftDirty={draftState.dirty}
                    switchLocked={lockState.locked}
                    switchLockedReason={lockState.reason}
                    onDraftBlocked={(message) => setContextAlert({ tone: 'warning', message })}
                    onRequestRestoreFocus={() => {
                      const el = focusRestoreRef.current;
                      if (el && typeof el.focus === 'function') el.focus();
                    }}
                    onDraftDirtyChange={(next) => setDraftState(next)}
                    onSelectEncounter={(next) => {
                      if (!next) return;
                      setEncounterContext((prev) => ({
                        ...prev,
                        ...next,
                        visitDate: normalizeVisitDate(next.visitDate) ?? prev.visitDate ?? today,
                      }));
                      setContextAlert(null);
                    }}
                  />
                </div>
                <div className="charts-card">
                  <AuthServiceControls />
                </div>
              </div>
              <div className="charts-workbench__column charts-workbench__column--center">
                <div className="charts-card" id="charts-soap-note" tabIndex={-1} data-focus-anchor="true">
                  <SoapNotePanel
                    history={soapHistory}
                    meta={soapNoteMeta}
                    author={soapNoteAuthor}
                    readOnly={tabLock.isReadOnly || approvalLocked}
                    readOnlyReason={approvalLocked ? approvalReason : tabLock.readOnlyReason}
                    onAppendHistory={appendSoapHistory}
                    onDraftDirtyChange={setDraftState}
                    onClearHistory={clearSoapHistory}
                    onAuditLogged={() => setAuditEvents(getAuditEventLog())}
                  />
                </div>
                <div className="charts-card" id="charts-document-timeline" tabIndex={-1} data-focus-anchor="true">
                  <DocumentTimeline
                    entries={patientEntries}
                    appointmentBanner={appointmentBanner}
                    appointmentMeta={appointmentMeta}
                    auditEvent={latestAuditEvent as Record<string, unknown> | undefined}
                    soapHistory={soapHistory}
                    selectedPatientId={encounterContext.patientId}
                    selectedAppointmentId={encounterContext.appointmentId}
                    selectedReceptionId={encounterContext.receptionId}
                    claimData={claimQuery.data as ClaimOutpatientPayload | undefined}
                    claimError={claimErrorForTimeline}
                    isClaimLoading={claimQuery.isFetching}
                    orcaQueue={orcaQueueQuery.data}
                    orcaQueueUpdatedAt={orcaQueueQuery.dataUpdatedAt}
                    isOrcaQueueLoading={orcaQueueQuery.isFetching}
                    orcaQueueError={
                      orcaQueueQuery.isError
                        ? (orcaQueueQuery.error instanceof Error ? orcaQueueQuery.error : new Error(String(orcaQueueQuery.error)))
                        : undefined
                    }
                    onRetryClaim={handleRetryClaim}
                    recordsReturned={appointmentRecordsReturned}
                    hasNextPage={hasNextAppointments}
                    onLoadMore={() => appointmentQuery.fetchNextPage()}
                    isLoadingMore={appointmentQuery.isFetchingNextPage}
                    isInitialLoading={appointmentQuery.isLoading}
                    pageSize={appointmentQuery.data?.pages?.[0]?.size ?? 50}
                    isRefetchingList={appointmentQuery.isFetching && !appointmentQuery.isLoading}
                  />
                </div>
                <div className="charts-card">
                  <MedicalOutpatientRecordPanel summary={orcaSummaryQuery.data} selectedPatientId={encounterContext.patientId} />
                </div>
              </div>
              <div className="charts-workbench__column charts-workbench__column--right">
                <div className="charts-card" id="charts-orca-summary" tabIndex={-1} data-focus-anchor="true">
                  <OrcaSummary
                    summary={orcaSummaryQuery.data}
                    claim={claimQuery.data as ClaimOutpatientPayload | undefined}
                    appointments={patientEntries}
                    appointmentMeta={appointmentMeta}
                    onRefresh={handleRefreshSummary}
                    isRefreshing={isManualRefreshing}
                  />
                </div>
                <div className="charts-card" id="charts-telemetry" tabIndex={-1} data-focus-anchor="true">
                  <TelemetryFunnelPanel />
                </div>
              </div>
              <aside
                className="charts-workbench__side"
                aria-label="右固定メニュー"
                aria-describedby="charts-side-menu-desc"
              >
                <div className="charts-side-menu" role="region" aria-label="右固定メニュー">
                  <div className="charts-side-menu__header">
                    <h2>右固定メニュー</h2>
                    <span>追加機能入口</span>
                  </div>
                  <p id="charts-side-menu-desc" className="charts-side-menu__desc">
                    右固定メニューから補助機能を開き、必要なセクションへ即時移動します。
                  </p>
                  <button
                    type="button"
                    className="charts-side-menu__button"
                    aria-controls="charts-side-panel"
                    aria-expanded={sidePanelAction === 'diagnosis-edit'}
                    onClick={() => {
                      setSidePanelAction('diagnosis-edit');
                      focusSectionById('charts-orca-summary');
                    }}
                  >
                    病名編集
                  </button>
                  <button
                    type="button"
                    className="charts-side-menu__button"
                    aria-controls="charts-side-panel"
                    aria-expanded={sidePanelAction === 'prescription-edit'}
                    onClick={() => {
                      setSidePanelAction('prescription-edit');
                      focusSectionById('charts-document-timeline');
                    }}
                  >
                    処方編集
                  </button>
                  <button
                    type="button"
                    className="charts-side-menu__button"
                    aria-controls="charts-side-panel"
                    aria-expanded={sidePanelAction === 'order-edit'}
                    onClick={() => {
                      setSidePanelAction('order-edit');
                      focusSectionById('charts-document-timeline');
                    }}
                  >
                    オーダー編集
                  </button>
                  <button
                    type="button"
                    className="charts-side-menu__button"
                    aria-controls="charts-side-panel"
                    aria-expanded={sidePanelAction === 'lab'}
                    onClick={() => {
                      setSidePanelAction('lab');
                      focusSectionById('charts-telemetry');
                    }}
                  >
                    検査オーダー
                  </button>
                  <button
                    type="button"
                    className="charts-side-menu__button"
                    aria-controls="charts-side-panel"
                    aria-expanded={sidePanelAction === 'document'}
                    onClick={() => {
                      setSidePanelAction('document');
                      focusSectionById('charts-document-timeline');
                    }}
                  >
                    文書登録
                  </button>
                  <button
                    type="button"
                    className="charts-side-menu__button"
                    aria-controls="charts-side-panel"
                    aria-expanded={sidePanelAction === 'imaging'}
                    onClick={() => {
                      setSidePanelAction('imaging');
                      focusSectionById('charts-patients-tab');
                    }}
                  >
                    画像/スキャン
                  </button>
                  <button
                    type="button"
                    className="charts-side-menu__button charts-side-menu__button--primary"
                    aria-controls="charts-side-panel"
                    aria-expanded={sidePanelAction !== null}
                    onClick={() => setSidePanelAction((prev) => (prev ? null : 'prescription-edit'))}
                  >
                    右パネルを開く
                  </button>
                  <div
                    id="charts-side-panel"
                    className="charts-side-panel"
                    role="dialog"
                    aria-label="右固定メニューの詳細パネル"
                    aria-live="polite"
                    data-open={sidePanelAction ? 'true' : 'false'}
                  >
                    <div className="charts-side-panel__header">
                      <h3>
                        {sidePanelAction === 'diagnosis-edit' && '病名編集'}
                        {sidePanelAction === 'prescription-edit' && '処方編集'}
                        {sidePanelAction === 'order-edit' && 'オーダー編集'}
                        {sidePanelAction === 'lab' && '検査オーダー'}
                        {sidePanelAction === 'document' && '文書登録'}
                        {sidePanelAction === 'imaging' && '画像/スキャン'}
                        {!sidePanelAction && '右パネル'}
                      </h3>
                      <button type="button" className="charts-side-panel__close" onClick={() => setSidePanelAction(null)}>
                        閉じる
                      </button>
                    </div>
                    {(sidePanelAction === 'diagnosis-edit' ||
                      sidePanelAction === 'prescription-edit' ||
                      sidePanelAction === 'order-edit') && (
                      <div className="charts-side-panel__content">
                        {sidePanelAction === 'diagnosis-edit' && (
                          <DiagnosisEditPanel patientId={encounterContext.patientId} meta={sidePanelMeta} />
                        )}
                        {sidePanelAction === 'prescription-edit' && (
                          <OrderBundleEditPanel
                            patientId={encounterContext.patientId}
                            entity="medOrder"
                            title="処方編集"
                            bundleLabel="RP名"
                            itemQuantityLabel="用量"
                            meta={sidePanelMeta}
                          />
                        )}
                        {sidePanelAction === 'order-edit' && (
                          <OrderBundleEditPanel
                            patientId={encounterContext.patientId}
                            entity="generalOrder"
                            title="オーダー編集"
                            bundleLabel="オーダー名"
                            itemQuantityLabel="数量"
                            meta={sidePanelMeta}
                          />
                        )}
                      </div>
                    )}
                    {(sidePanelAction === 'lab' || sidePanelAction === 'document' || sidePanelAction === 'imaging' || !sidePanelAction) && (
                      <>
                        <p className="charts-side-panel__message">
                          {sidePanelAction
                            ? 'このパネルは実運用で検索・登録 UI を開く位置です。現在は関連セクションへの移動を補助します。'
                            : '右固定メニューから機能を選択すると、ここに操作内容が表示されます。'}
                        </p>
                        <div className="charts-side-panel__actions">
                          <button type="button" onClick={() => focusSectionById('charts-actionbar')}>
                            診療操作へ移動
                          </button>
                          <button type="button" onClick={() => focusSectionById('charts-document-timeline')}>
                            タイムラインへ移動
                          </button>
                          <button type="button" onClick={() => focusSectionById('charts-orca-summary')}>
                            ORCAサマリへ移動
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </>
      )}
    </main>
    </>
  );
}
