import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FocusTrapDialog } from '../../components/modals/FocusTrapDialog';
import { logUiState } from '../../libs/audit/auditLogger';
import { resolveAuditActor } from '../../libs/auth/storedAuth';
import { httpFetch } from '../../libs/http/httpClient';
import { getObservabilityMeta, resolveAriaLive } from '../../libs/observability/observability';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { ToneBanner, type BannerTone } from '../reception/components/ToneBanner';
import { StatusPill } from '../shared/StatusPill';
import { recordChartsAuditEvent, type ChartsOperationPhase } from './audit';
import type { ChartsTabLockStatus } from './useChartsTabLock';
import type { DataSourceTransition } from './authService';
import type { ClaimQueueEntry } from '../outpatient/types';
import type { ReceptionEntry } from '../reception/api';
import {
  clearOutpatientOutputResult,
  loadOutpatientOutputResult,
  saveOutpatientPrintPreview,
  saveReportPrintPreview,
} from './print/printPreviewStorage';
import { isNetworkError } from '../shared/apiError';
import { useOptionalSession } from '../../AppRouter';
import { buildFacilityPath } from '../../routes/facilityRoutes';
import { buildMedicalModV23RequestXml, postOrcaMedicalModV23Xml } from './orcaMedicalModApi';
import { buildIncomeInfoRequestXml, fetchOrcaIncomeInfoXml, type IncomeInfoEntry } from './orcaIncomeInfoApi';
import {
  buildOrcaReportRequestXml,
  ORCA_REPORT_LABELS,
  postOrcaReportXml,
  resolveOrcaReportEndpoint,
  type OrcaReportType,
} from './orcaReportApi';

type ChartAction = 'finish' | 'send' | 'draft' | 'cancel' | 'print';

type ToastState = {
  tone: 'success' | 'warning' | 'error' | 'info';
  message: string;
  detail?: string;
};

type PrintDestination = 'outpatient' | OrcaReportType;

type ReportFormState = {
  type: OrcaReportType;
  invoiceNumber: string;
  outsideClass: 'True' | 'False';
  departmentCode: string;
  insuranceCombinationNumber: string;
  performMonth: string;
};

type BannerState = {
  tone: BannerTone;
  message: string;
  nextAction?: string;
};

type GuardReason = {
  key:
    | 'missing_master'
    | 'fallback_used'
    | 'config_disabled'
    | 'draft_unsaved'
    | 'permission_denied'
    | 'network_offline'
    | 'network_degraded'
    | 'not_server_route'
    | 'patient_not_selected'
    | 'locked'
    | 'approval_locked';
  summary: string;
  detail: string;
  next: string[];
};

const ACTION_LABEL: Record<ChartAction, string> = {
  finish: '診療終了',
  send: 'ORCA送信',
  draft: 'ドラフト保存',
  cancel: 'キャンセル',
  print: '印刷',
};

const PRINT_DESTINATIONS: Array<{ value: PrintDestination; label: string; detail: string }> = [
  { value: 'outpatient', label: '診療記録（外来サマリ）', detail: 'ブラウザ印刷/エクスポート' },
  { value: 'prescription', label: ORCA_REPORT_LABELS.prescription, detail: 'ORCA帳票' },
  { value: 'medicinenotebook', label: ORCA_REPORT_LABELS.medicinenotebook, detail: 'ORCA帳票' },
  { value: 'karteno1', label: ORCA_REPORT_LABELS.karteno1, detail: 'ORCA帳票' },
  { value: 'karteno3', label: ORCA_REPORT_LABELS.karteno3, detail: 'ORCA帳票' },
  { value: 'invoicereceipt', label: ORCA_REPORT_LABELS.invoicereceipt, detail: 'ORCA帳票' },
  { value: 'statement', label: ORCA_REPORT_LABELS.statement, detail: 'ORCA帳票' },
];

export interface ChartsActionBarProps {
  runId: string;
  traceId?: string;
  cacheHit: boolean;
  missingMaster: boolean;
  dataSourceTransition: DataSourceTransition;
  fallbackUsed?: boolean;
  selectedEntry?: ReceptionEntry;
  sendEnabled?: boolean;
  sendDisabledReason?: string;
  patientId?: string;
  visitDate?: string;
  queueEntry?: ClaimQueueEntry;
  hasUnsavedDraft?: boolean;
  hasPermission?: boolean;
  requireServerRouteForSend?: boolean;
  requirePatientForSend?: boolean;
  networkDegradedReason?: string;
  approvalLock?: {
    locked: boolean;
    approvedAt?: string;
    runId?: string;
    action?: 'send';
  };
  editLock?: {
    readOnly: boolean;
    reason?: string;
    ownerRunId?: string;
    expiresAt?: string;
    lockStatus?: ChartsTabLockStatus;
  };
  onReloadLatest?: () => void | Promise<void>;
  onDiscardChanges?: () => void;
  onForceTakeover?: () => void;
  onAfterSend?: () => void | Promise<void>;
  onAfterFinish?: () => void | Promise<void>;
  onDraftSaved?: () => void;
  onLockChange?: (locked: boolean, reason?: string) => void;
  onApprovalConfirmed?: (meta: { action: 'send'; actor?: string }) => void;
  onApprovalUnlock?: () => void;
}

export function ChartsActionBar({
  runId,
  traceId,
  cacheHit,
  missingMaster,
  dataSourceTransition,
  fallbackUsed = false,
  selectedEntry,
  sendEnabled = true,
  sendDisabledReason,
  patientId,
  visitDate,
  queueEntry,
  hasUnsavedDraft = false,
  hasPermission = true,
  requireServerRouteForSend = false,
  requirePatientForSend = false,
  networkDegradedReason,
  approvalLock,
  editLock,
  onReloadLatest,
  onDiscardChanges,
  onForceTakeover,
  onAfterSend,
  onAfterFinish,
  onDraftSaved,
  onLockChange,
  onApprovalConfirmed,
  onApprovalUnlock,
}: ChartsActionBarProps) {
  const session = useOptionalSession();
  const navigate = useNavigate();
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [retryAction, setRetryAction] = useState<ChartAction | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState<ChartAction | null>(null);
  const [confirmAction, setConfirmAction] = useState<ChartAction | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [permissionDenied, setPermissionDenied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const outpatientResultRef = useRef(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printDestination, setPrintDestination] = useState<PrintDestination>('outpatient');
  const [reportForm, setReportForm] = useState<ReportFormState>({
    type: 'prescription',
    invoiceNumber: '',
    outsideClass: 'False',
    departmentCode: '',
    insuranceCombinationNumber: '',
    performMonth: '',
  });
  const reportTouchedRef = useRef({
    invoiceNumber: false,
    departmentCode: false,
    insuranceCombinationNumber: false,
    performMonth: false,
  });
  const [reportIncomeEntries, setReportIncomeEntries] = useState<IncomeInfoEntry[]>([]);
  const [reportIncomeStatus, setReportIncomeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reportIncomeError, setReportIncomeError] = useState<string | null>(null);

  const uiLocked = lockReason !== null;
  const readOnly = editLock?.readOnly === true;
  const readOnlyReason = editLock?.reason ?? '並行編集を検知したため、このタブは閲覧専用です。';
  const approvalLocked = approvalLock?.locked === true;
  const approvalReason = approvalLocked ? '署名確定済みのため編集できません。' : undefined;
  const actionLocked = uiLocked || isRunning || readOnly;
  const isLocked = actionLocked || approvalLocked;
  const resolvedTraceId = traceId ?? getObservabilityMeta().traceId;
  const resolvedPatientId = patientId ?? selectedEntry?.patientId ?? selectedEntry?.id;
  const resolvedAppointmentId = queueEntry?.appointmentId ?? selectedEntry?.appointmentId;
  const resolvedReceptionId = selectedEntry?.receptionId;
  const resolvedVisitDate = useMemo(
    () => visitDate ?? selectedEntry?.visitDate,
    [selectedEntry?.visitDate, visitDate],
  );

  const resolveDepartmentCode = (department?: string) => {
    if (!department) return undefined;
    const match = department.match(/\b(\d{2})\b/);
    return match?.[1];
  };

  const normalizeVisitDate = (value?: string) => {
    if (!value) return undefined;
    return value.length >= 10 ? value.slice(0, 10) : value;
  };

  const defaultPerformMonth = useMemo(() => {
    const base = normalizeVisitDate(resolvedVisitDate ?? new Date().toISOString());
    return base ? base.slice(0, 7) : new Date().toISOString().slice(0, 7);
  }, [resolvedVisitDate]);

  const pickLatestIncomeEntry = (entries: IncomeInfoEntry[]) => {
    if (entries.length === 0) return undefined;
    const toTimestamp = (value?: string) => {
      if (!value) return Number.NEGATIVE_INFINITY;
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
    };
    return entries.reduce((latest, entry) => {
      if (!latest) return entry;
      return toTimestamp(entry.performDate) >= toTimestamp(latest.performDate) ? entry : latest;
    }, entries[0]);
  };

  const isApiResultOk = (apiResult?: string) => Boolean(apiResult && /^0+$/.test(apiResult));

  const sendQueueLabel = useMemo(() => {
    const phase = queueEntry?.phase;
    if (!phase) return undefined;
    if (phase === 'ack') return '成功';
    if (phase === 'failed') return '失敗';
    if (phase === 'retry' || phase === 'sent') return '処理中';
    if (phase === 'hold') return '待ち（保留）';
    return '待ち';
  }, [queueEntry?.phase]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    reportTouchedRef.current = {
      invoiceNumber: false,
      departmentCode: false,
      insuranceCombinationNumber: false,
      performMonth: false,
    };
    setReportForm((prev) => ({
      ...prev,
      invoiceNumber: '',
      departmentCode: '',
      insuranceCombinationNumber: '',
      performMonth: '',
    }));
  }, [resolvedPatientId]);

  useEffect(() => {
    if (!printDialogOpen || !resolvedPatientId) return;
    let cancelled = false;
    const performMonth = reportForm.performMonth || defaultPerformMonth;
    setReportIncomeStatus('loading');
    setReportIncomeError(null);
    const requestXml = buildIncomeInfoRequestXml({ patientId: resolvedPatientId, performMonth });
    fetchOrcaIncomeInfoXml(requestXml)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setReportIncomeEntries(result.entries);
          setReportIncomeStatus('success');
        } else {
          setReportIncomeEntries([]);
          setReportIncomeStatus('error');
          setReportIncomeError(result.apiResultMessage ?? `HTTP ${result.status}`);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setReportIncomeEntries([]);
        setReportIncomeStatus('error');
        setReportIncomeError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
    };
  }, [printDialogOpen, resolvedPatientId, reportForm.performMonth, defaultPerformMonth]);

  useEffect(() => {
    const latestIncome = pickLatestIncomeEntry(reportIncomeEntries);
    const departmentCode = resolveDepartmentCode(selectedEntry?.department);
    setReportForm((prev) => {
      const next = { ...prev };
      if (!reportTouchedRef.current.invoiceNumber && latestIncome?.invoiceNumber) {
        next.invoiceNumber = latestIncome.invoiceNumber;
      }
      if (!reportTouchedRef.current.insuranceCombinationNumber && latestIncome?.insuranceCombinationNumber) {
        next.insuranceCombinationNumber = latestIncome.insuranceCombinationNumber;
      }
      if (!reportTouchedRef.current.departmentCode && departmentCode) {
        next.departmentCode = departmentCode;
      }
      if (!reportTouchedRef.current.performMonth && !prev.performMonth) {
        next.performMonth = defaultPerformMonth;
      }
      return next;
    });
  }, [defaultPerformMonth, reportIncomeEntries, selectedEntry?.department]);

  useEffect(() => {
    if (outpatientResultRef.current) return;
    const outputResult = loadOutpatientOutputResult();
    if (!outputResult) return;
    clearOutpatientOutputResult();
    outpatientResultRef.current = true;
    const detailParts = [
      outputResult.detail,
      outputResult.runId ? `runId=${outputResult.runId}` : undefined,
      outputResult.traceId ? `traceId=${outputResult.traceId}` : undefined,
      outputResult.endpoint ? `endpoint=${outputResult.endpoint}` : undefined,
      typeof outputResult.httpStatus === 'number' ? `HTTP ${outputResult.httpStatus}` : undefined,
    ].filter((part): part is string => typeof part === 'string' && part.length > 0);
    const detail = detailParts.join(' / ');
    if (outputResult.outcome === 'success') {
      setBanner(null);
      setToast({
        tone: 'success',
        message: '外来印刷を完了',
        detail,
      });
      return;
    }
    const isBlocked = outputResult.outcome === 'blocked';
    const nextAction = '印刷/エクスポートを再度開く / Reception で再取得';
    setBanner({
      tone: isBlocked ? 'warning' : 'error',
      message: isBlocked ? '外来印刷が停止されました' : '外来印刷に失敗しました',
      nextAction,
    });
    setToast({
      tone: isBlocked ? 'warning' : 'error',
      message: isBlocked ? '外来印刷を停止' : '外来印刷に失敗',
      detail,
    });
  }, []);

  const sendPrecheckReasons: GuardReason[] = useMemo(() => {
    const reasons: GuardReason[] = [];

    if (!sendEnabled) {
      reasons.push({
        key: 'config_disabled',
        summary: '管理配信で送信停止',
        detail: sendDisabledReason ?? '管理配信により ORCA 送信が無効化されています。',
        next: ['Administration で再配信', '設定を再取得して反映を確認'],
      });
    }

    if (uiLocked) {
      reasons.push({
        key: 'locked',
        summary: '他の操作が進行中/ロック中',
        detail: lockReason ? lockReason : '別アクション実行中のため送信できません。',
        next: ['ロック解除', '処理完了を待って再試行'],
      });
    }

    if (readOnly) {
      reasons.push({
        key: 'locked',
        summary: '閲覧専用（並行編集）',
        detail: readOnlyReason,
        next: ['最新を再読込', '別タブを閉じる', '必要ならロック引き継ぎ（強制）'],
      });
    }

    if (approvalLocked) {
      reasons.push({
        key: 'approval_locked',
        summary: '承認済み（署名確定）',
        detail: approvalReason ?? '署名確定済みのため編集できません。',
        next: ['必要なら新規受付で再作成', '承認内容の確認（監査ログ）'],
      });
    }

    if (requirePatientForSend && !patientId) {
      reasons.push({
        key: 'patient_not_selected',
        summary: '患者未選択',
        detail: '患者が未選択のため送信先が確定できません。',
        next: ['Patients で患者を選択', 'Reception へ戻って対象患者を確定'],
      });
    }

    if (requireServerRouteForSend && dataSourceTransition !== 'server') {
      reasons.push({
        key: 'not_server_route',
        summary: 'server ルートではない',
        detail: `dataSourceTransition=${dataSourceTransition} のため ORCA 送信を停止します。`,
        next: ['server route に切替（MSW OFF / 実 API）', 'Reception で再取得'],
      });
    }

    if (missingMaster) {
      reasons.push({
        key: 'missing_master',
        summary: 'missingMaster=true',
        detail: 'マスタ欠損を検知したため、送信は実施できません。',
        next: ['Reception で master を再取得', '再取得完了後に ORCA再送'],
      });
    }

    if (fallbackUsed) {
      reasons.push({
        key: 'fallback_used',
        summary: 'fallbackUsed=true',
        detail: 'フォールバック経路のため、送信は実施できません。',
        next: ['Reception で再取得', 'master 解消後に再送'],
      });
    }

    if (hasUnsavedDraft) {
      reasons.push({
        key: 'draft_unsaved',
        summary: '未保存ドラフト',
        detail: '未保存の入力があるため、送信前にドラフト保存が必要です。',
        next: ['ドラフト保存', '不要なら入力を戻してから再送'],
      });
    }

    if (!isOnline) {
      reasons.push({
        key: 'network_offline',
        summary: '通信オフライン',
        detail: 'ブラウザが offline 状態のため送信できません。',
        next: ['通信回復を待つ', '回線/プロキシ設定を確認'],
      });
    }

    if (networkDegradedReason) {
      reasons.push({
        key: 'network_degraded',
        summary: '通信不安定',
        detail: networkDegradedReason,
        next: ['再取得してから再送', 'Reception へ戻って状態確認'],
      });
    }

    if (permissionDenied || !hasPermission) {
      reasons.push({
        key: 'permission_denied',
        summary: '権限不足/認証不備',
        detail: permissionDenied
          ? '直近の送信で 401/403 を検知しました。'
          : '認証情報が揃っていないため送信を停止します。',
        next: ['再ログイン', '設定確認（facilityId/userId/password）'],
      });
    }

    return reasons;
  }, [
    dataSourceTransition,
    fallbackUsed,
    hasPermission,
    hasUnsavedDraft,
    isOnline,
    lockReason,
    missingMaster,
    networkDegradedReason,
    patientId,
    permissionDenied,
    approvalLocked,
    approvalReason,
    readOnly,
    readOnlyReason,
    requireServerRouteForSend,
    requirePatientForSend,
    sendDisabledReason,
    sendEnabled,
    uiLocked,
  ]);

  const sendDisabled = isRunning || approvalLocked || sendPrecheckReasons.length > 0;

  const printPrecheckReasons: GuardReason[] = useMemo(() => {
    const reasons: GuardReason[] = [];

    if (isRunning) {
      reasons.push({
        key: 'locked',
        summary: '他の操作が進行中',
        detail: '別アクションの実行中は印刷を開始できません。',
        next: ['処理完了を待って再試行'],
      });
    }

    if (!selectedEntry) {
      reasons.push({
        key: 'patient_not_selected',
        summary: '患者未選択',
        detail: '患者が未選択のため印刷プレビューを開けません。',
        next: ['Patients で患者を選択', 'Reception へ戻って対象患者を確定'],
      });
    }

    if (missingMaster) {
      reasons.push({
        key: 'missing_master',
        summary: 'missingMaster=true',
        detail: 'マスタ欠損を検知したため出力を停止します。',
        next: ['Reception で master を再取得', '再取得完了後に出力'],
      });
    }

    if (fallbackUsed) {
      reasons.push({
        key: 'fallback_used',
        summary: 'fallbackUsed=true',
        detail: 'フォールバック経路のため出力を停止します。',
        next: ['Reception で再取得', 'master 解消後に出力'],
      });
    }

    if (permissionDenied || !hasPermission) {
      reasons.push({
        key: 'permission_denied',
        summary: '権限不足/認証不備',
        detail: permissionDenied
          ? '直近の送信で 401/403 を検知しました。'
          : '認証情報が揃っていないため出力を停止します。',
        next: ['再ログイン', '設定確認（facilityId/userId/password）'],
      });
    }

    return reasons;
  }, [hasPermission, isRunning, missingMaster, permissionDenied, fallbackUsed, selectedEntry]);

  const printDisabled = printPrecheckReasons.length > 0;
  const otherBlocked = isLocked;
  const resolvedReportType = printDestination === 'outpatient' ? reportForm.type : printDestination;

  const reportFieldErrors = useMemo(() => {
    if (printDestination === 'outpatient') return [] as string[];
    const errors: string[] = [];
    if (!resolvedPatientId) errors.push('患者IDが未確定です。');
    if (
      (resolvedReportType === 'prescription' ||
        resolvedReportType === 'medicinenotebook' ||
        resolvedReportType === 'invoicereceipt' ||
        resolvedReportType === 'statement') &&
      !reportForm.invoiceNumber.trim()
    ) {
      errors.push('伝票番号（Invoice_Number）が必要です。');
    }
    if (resolvedReportType === 'karteno1') {
      if (!reportForm.departmentCode.trim()) errors.push('診療科コード（Department_Code）が必要です。');
      if (!reportForm.insuranceCombinationNumber.trim()) errors.push('保険組合せ番号が必要です。');
    }
    if (resolvedReportType === 'karteno3' && !reportForm.performMonth.trim()) {
      errors.push('対象月（Perform_Month）が必要です。');
    }
    return errors;
  }, [printDestination, reportForm, resolvedPatientId, resolvedReportType]);

  const reportReady = reportFieldErrors.length === 0;
  const reportInvoiceOptions = useMemo(
    () => Array.from(new Set(reportIncomeEntries.map((entry) => entry.invoiceNumber).filter(Boolean))) as string[],
    [reportIncomeEntries],
  );
  const reportInsuranceOptions = useMemo(
    () =>
      Array.from(new Set(reportIncomeEntries.map((entry) => entry.insuranceCombinationNumber).filter(Boolean))) as string[],
    [reportIncomeEntries],
  );
  const reportIncomeLatest = useMemo(() => pickLatestIncomeEntry(reportIncomeEntries), [reportIncomeEntries]);
  const reportNeedsInvoice =
    resolvedReportType === 'prescription' ||
    resolvedReportType === 'medicinenotebook' ||
    resolvedReportType === 'invoicereceipt' ||
    resolvedReportType === 'statement';
  const reportNeedsOutsideClass = resolvedReportType === 'prescription' || resolvedReportType === 'medicinenotebook';
  const reportNeedsDepartment = resolvedReportType === 'karteno1' || resolvedReportType === 'karteno3';
  const reportNeedsInsurance = resolvedReportType === 'karteno1' || resolvedReportType === 'karteno3';
  const reportNeedsPerformMonth = resolvedReportType === 'karteno3';

  useEffect(() => {
    onLockChange?.(actionLocked, lockReason ?? undefined);
  }, [actionLocked, lockReason, onLockChange]);

  const statusLine = useMemo(() => {
    if (isRunning && runningAction) {
      return `${ACTION_LABEL[runningAction]}を実行中… dataSourceTransition=${dataSourceTransition}`;
    }
    if (approvalLocked) {
      return `承認済み（署名確定）: 編集不可（runId=${approvalLock?.runId ?? runId}）`;
    }
    if (lockReason) return lockReason;
    if (readOnly) return readOnlyReason;
    if (sendPrecheckReasons.length > 0) {
      const head = sendPrecheckReasons[0];
      return `送信不可: ${head.summary}（runId=${runId} / traceId=${resolvedTraceId ?? 'unknown'}）`;
    }
    if (sendQueueLabel) {
      return `送信状態: ${sendQueueLabel}（runId=${runId} / traceId=${resolvedTraceId ?? 'unknown'}${queueEntry?.requestId ? ` / requestId=${queueEntry.requestId}` : ''}）`;
    }
    return 'アクションを選択できます';
  }, [
    dataSourceTransition,
    isRunning,
    lockReason,
    queueEntry?.requestId,
    readOnly,
    readOnlyReason,
    resolvedTraceId,
    runId,
    runningAction,
    sendPrecheckReasons,
    sendQueueLabel,
    approvalLocked,
    approvalLock?.runId,
  ]);

  const logTelemetry = (
    action: ChartAction,
    outcome: 'success' | 'error' | 'blocked' | 'started',
    durationMs?: number,
    note?: string,
    reason?: string,
  ) => {
    recordOutpatientFunnel('charts_action', {
      action,
      outcome,
      durationMs,
      note,
      reason,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      runId,
    });
  };

  const buildFallbackDetails = () => {
    const details: Record<string, unknown> = {};
    if (!patientId && resolvedPatientId) details.fallbackPatientId = resolvedPatientId;
    if (!queueEntry?.appointmentId && resolvedAppointmentId) details.fallbackAppointmentId = resolvedAppointmentId;
    if ((!patientId || !queueEntry?.appointmentId) && resolvedReceptionId) details.fallbackReceptionId = resolvedReceptionId;
    if (editLock?.lockStatus) details.lockStatus = editLock.lockStatus;
    return details;
  };

  const buildOutpatientPayload = () => {
    const payload: Record<string, unknown> = {};
    if (resolvedVisitDate) {
      payload.appointmentDate = resolvedVisitDate;
      payload.date = resolvedVisitDate;
    }
    if (resolvedAppointmentId) payload.appointmentId = resolvedAppointmentId;
    if (resolvedReceptionId) payload.receptionId = resolvedReceptionId;
    if (resolvedPatientId) {
      payload.Patient_ID = resolvedPatientId;
      payload.patientId = resolvedPatientId;
      payload.patientInformation = { Patient_ID: resolvedPatientId };
    }
    return payload;
  };

  const logAudit = (
    action: ChartAction,
    outcome: 'success' | 'error' | 'blocked' | 'started',
    detail?: string,
    durationMs?: number,
    options?: { phase?: ChartsOperationPhase; details?: Record<string, unknown> },
  ) => {
    const actionMap: Record<ChartAction, 'ENCOUNTER_CLOSE' | 'ORCA_SEND' | 'DRAFT_SAVE' | 'DRAFT_CANCEL' | 'PRINT_OUTPATIENT'> = {
      finish: 'ENCOUNTER_CLOSE',
      send: 'ORCA_SEND',
      draft: 'DRAFT_SAVE',
      cancel: 'DRAFT_CANCEL',
      print: 'PRINT_OUTPATIENT',
    };
    const normalizedAction = outcome === 'error' ? 'CHARTS_ACTION_FAILURE' : actionMap[action];
    const phase = options?.phase ?? (outcome === 'blocked' ? 'lock' : 'do');
    recordChartsAuditEvent({
      action: normalizedAction,
      outcome,
      subject: `charts-action-${action}`,
      note: detail,
      error: outcome === 'error' ? detail : undefined,
      durationMs,
      patientId: resolvedPatientId,
      appointmentId: resolvedAppointmentId,
      dataSourceTransition,
      cacheHit,
      missingMaster,
      fallbackUsed,
      runId,
      details: {
        operationPhase: phase,
        ...(action === 'send' || action === 'finish'
          ? {
              ...(resolvedVisitDate ? { visitDate: resolvedVisitDate } : {}),
            }
          : {}),
        ...buildFallbackDetails(),
        ...options?.details,
      },
    });
  };

  const approvalSessionRef = useRef<{ action: ChartAction; closed: boolean } | null>(null);

  const logApproval = (action: ChartAction, state: 'open' | 'confirmed' | 'cancelled') => {
    const blockedReasons = state === 'cancelled' ? ['confirm_cancelled'] : undefined;
    logUiState({
      action: action === 'print' ? 'print' : 'send',
      screen: 'charts/action-bar',
      controlId: `action-${action}-approval`,
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        operationPhase: 'approval',
        approvalState: state,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        requestId: queueEntry?.requestId,
        traceId: resolvedTraceId,
        ...(blockedReasons ? { blockedReasons } : {}),
        ...buildFallbackDetails(),
      },
    });
    logAudit(action, state === 'open' || state === 'confirmed' ? 'started' : 'blocked', `approval_${state}`, undefined, {
      phase: 'approval',
      details: {
        approvalState: state,
        requestId: queueEntry?.requestId,
        traceId: resolvedTraceId,
        ...(blockedReasons ? { blockedReasons } : {}),
        ...buildFallbackDetails(),
      },
    });
  };

  const finalizeApproval = (action: ChartAction, state: 'confirmed' | 'cancelled') => {
    const session = approvalSessionRef.current;
    if (!session || session.action !== action || session.closed) return;
    session.closed = true;
    logApproval(action, state);
  };

  const handleAction = async (action: ChartAction) => {
    if (isRunning) return;

    if (approvalLocked) {
      const blockedReason = approvalReason ?? '署名確定済みのため編集できません。';
      setToast({
        tone: 'warning',
        message: `${ACTION_LABEL[action]}を停止`,
        detail: blockedReason,
      });
      setRetryAction(null);
      logTelemetry(action, 'blocked', undefined, blockedReason, blockedReason);
      logUiState({
        action:
          action === 'draft'
            ? 'draft'
            : action === 'finish'
              ? 'finish'
              : action === 'cancel'
                ? 'cancel'
                : action === 'print'
                  ? 'print'
                  : 'send',
        screen: 'charts/action-bar',
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: 'lock',
          blocked: true,
          reasons: ['approval_locked'],
          traceId: resolvedTraceId,
          approval: approvalLock ?? null,
        },
      });
      logAudit(action, 'blocked', blockedReason, undefined, {
        phase: 'lock',
        details: {
          trigger: 'approval_locked',
          blockedReasons: ['approval_locked'],
          approvalState: 'confirmed',
        },
      });
      return;
    }

    if (readOnly) {
      const blockedReason = readOnlyReason;
      setToast({
        tone: 'warning',
        message: `${ACTION_LABEL[action]}を停止`,
        detail: blockedReason,
      });
      setRetryAction(null);
      logTelemetry(action, 'blocked', undefined, blockedReason, blockedReason);
      logUiState({
        action:
          action === 'draft'
            ? 'draft'
            : action === 'finish'
              ? 'finish'
              : action === 'cancel'
                ? 'cancel'
                : action === 'print'
                  ? 'print'
                  : 'send',
        screen: 'charts/action-bar',
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: 'lock',
          blocked: true,
          reasons: ['edit_lock_conflict'],
          traceId: resolvedTraceId,
          lockStatus: editLock?.lockStatus,
          editLock: editLock ?? null,
        },
      });
      logAudit(action, 'blocked', blockedReason, undefined, {
        phase: 'lock',
        details: {
          trigger: 'edit_lock',
          traceId: resolvedTraceId,
          blockedReasons: ['edit_lock_conflict'],
        },
      });
      return;
    }

    if (action === 'send' && sendPrecheckReasons.length > 0) {
      const blockedReason = sendPrecheckReasons
        .map((reason) => `${reason.summary}: ${reason.detail}`)
        .join(' / ');
      setBanner({
        tone: 'warning',
        message: `ORCA送信を停止: ${blockedReason}`,
        nextAction: '送信前チェック（理由）を確認し、必要なら Reception で再取得してください。',
      });
      setRetryAction(null);
      setToast(null);
      logTelemetry(action, 'blocked', undefined, blockedReason, blockedReason);
      logUiState({
        action: 'send',
        screen: 'charts/action-bar',
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: 'lock',
          blocked: true,
          reasons: sendPrecheckReasons.map((reason) => reason.key),
          traceId: resolvedTraceId,
          lockStatus: editLock?.lockStatus,
        },
      });
      logAudit(action, 'blocked', blockedReason, undefined, {
        phase: 'lock',
        details: {
          trigger: 'precheck',
          traceId: resolvedTraceId,
          reasons: sendPrecheckReasons.map((reason) => reason.key),
          blockedReasons: sendPrecheckReasons.map((reason) => reason.key),
        },
      });
      return;
    }

    if (action === 'send' && !patientId) {
      const blockedReason = '患者IDが未確定のため ORCA 送信を実行できません。Patients で患者を選択してください。';
      setBanner({ tone: 'warning', message: `ORCA送信を停止: ${blockedReason}`, nextAction: 'Patients で対象患者を選択してください。' });
      setRetryAction(null);
      setToast(null);
      logTelemetry(action, 'blocked', undefined, blockedReason, blockedReason);
      logUiState({
        action: 'send',
        screen: 'charts/action-bar',
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: { operationPhase: 'lock', blocked: true, reasons: ['patient_not_selected'], traceId: resolvedTraceId },
      });
      logAudit(action, 'blocked', blockedReason, undefined, {
        phase: 'lock',
        details: {
          trigger: 'patient_not_selected',
          traceId: resolvedTraceId,
          blockedReasons: ['patient_not_selected'],
        },
      });
      return;
    }

    if (action === 'send' && (fallbackUsed || missingMaster)) {
      setBanner({
        tone: 'warning',
        message: missingMaster
          ? 'missingMaster=true を検知しました。送信前に master を再取得してください。'
          : 'fallbackUsed=true を検知しました。送信前に master 解消（server route）を確認してください。',
        nextAction: 'Reception で再取得してから再送してください。',
      });
    }

    const startedAt = performance.now();
    setIsRunning(true);
    setRunningAction(action);
    setRetryAction(null);
    setToast(null);

    logUiState({
      action:
        action === 'draft'
          ? 'draft'
          : action === 'finish'
            ? 'finish'
            : action === 'cancel'
              ? 'cancel'
              : action === 'print'
                ? 'print'
                : 'send',
      screen: 'charts/action-bar',
      controlId: `action-${action}`,
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        operationPhase: 'do',
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        requestId: queueEntry?.requestId,
        traceId: resolvedTraceId,
        ...buildFallbackDetails(),
      },
    });
    logTelemetry(action, 'started');
    logAudit(action, 'started', undefined, undefined, { phase: 'do' });

    try {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (action === 'send' || action === 'finish') {
        const endpoint = action === 'send' ? '/api01rv2/claim/outpatient' : '/orca21/medicalmodv2/outpatient';
        const payload = buildOutpatientPayload();
        const response = await httpFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal,
        });
        const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const responseRunId = typeof json.runId === 'string' ? json.runId : undefined;
        const responseTraceId = typeof json.traceId === 'string' ? json.traceId : undefined;
        const responseRequestId = typeof json.requestId === 'string' ? json.requestId : undefined;
        const responseOutcome = typeof json.outcome === 'string' ? json.outcome : undefined;
        const responseApiResult = typeof json.apiResult === 'string' ? json.apiResult : undefined;
        const responseApiResultMessage = typeof json.apiResultMessage === 'string' ? json.apiResultMessage : undefined;
        if (response.status === 401 || response.status === 403) {
          setPermissionDenied(true);
          const authError = new Error(`権限不足（HTTP ${response.status}）。再ログインまたは権限設定を確認してください。`) as Error & {
            apiDetails?: Record<string, unknown>;
          };
          authError.apiDetails = {
            endpoint,
            httpStatus: response.status,
            runId: responseRunId,
            traceId: responseTraceId,
            requestId: responseRequestId,
            outcome: responseOutcome,
            apiResult: responseApiResult,
            apiResultMessage: responseApiResultMessage,
          };
          throw authError;
        }
        if (!response.ok) {
          const detailParts = [
            `HTTP ${response.status}`,
            responseApiResult ? `apiResult=${responseApiResult}` : undefined,
            responseApiResultMessage ? `message=${responseApiResultMessage}` : undefined,
            responseOutcome ? `outcome=${responseOutcome}` : undefined,
          ].filter((part): part is string => typeof part === 'string' && part.length > 0);
          const apiError = new Error(`${ACTION_LABEL[action]} API に失敗（${detailParts.join(' / ')}）`) as Error & {
            apiDetails?: Record<string, unknown>;
          };
          apiError.apiDetails = {
            endpoint,
            httpStatus: response.status,
            runId: responseRunId,
            traceId: responseTraceId,
            requestId: responseRequestId,
            outcome: responseOutcome,
            apiResult: responseApiResult,
            apiResultMessage: responseApiResultMessage,
          };
          throw apiError;
        }

        const after = getObservabilityMeta();
        const nextRunId = responseRunId ?? after.runId ?? runId;
        const nextTraceId = responseTraceId ?? after.traceId ?? resolvedTraceId;

        const responseDetailParts = [
          `runId=${nextRunId}`,
          `traceId=${nextTraceId ?? 'unknown'}`,
          responseRequestId ? `requestId=${responseRequestId}` : undefined,
          responseOutcome ? `outcome=${responseOutcome}` : undefined,
          responseApiResult ? `apiResult=${responseApiResult}` : undefined,
        ].filter((part): part is string => typeof part === 'string' && part.length > 0);

        setBanner(null);
        setToast({
          tone: 'success',
          message: `${ACTION_LABEL[action]}を完了`,
          detail: responseDetailParts.join(' / '),
        });

        const durationMs = Math.round(performance.now() - startedAt);
        logTelemetry(action, 'success', durationMs);
        logAudit(action, 'success', undefined, durationMs, {
          phase: 'do',
          details: {
            endpoint,
            httpStatus: response.status,
            requestId: responseRequestId,
            outcome: responseOutcome,
            apiResult: responseApiResult,
            apiResultMessage: responseApiResultMessage,
          },
        });

        if (action === 'finish') {
          const departmentCode = resolveDepartmentCode(selectedEntry?.department);
          const calculationDate = normalizeVisitDate(resolvedVisitDate);
          const missingFields = [
            !resolvedPatientId ? 'Patient_ID' : undefined,
            !calculationDate ? 'First_Calculation_Date' : undefined,
            !calculationDate ? 'LastVisit_Date' : undefined,
            !departmentCode ? 'Department_Code' : undefined,
          ].filter((field): field is string => typeof field === 'string');

          if (missingFields.length > 0) {
            const blockedReason = `medicalmodv23 をスキップ: ${missingFields.join(', ')} が不足しています。`;
            setBanner({
              tone: 'warning',
              message: `診療終了後の追加更新を停止: ${blockedReason}`,
              nextAction: '受付情報（患者/診療科/日付）を確認してください。',
            });
            logUiState({
              action: 'medicalmodv23',
              screen: 'charts/action-bar',
              controlId: 'action-finish',
              runId,
              cacheHit,
              missingMaster,
              dataSourceTransition,
              fallbackUsed,
              details: {
                operationPhase: 'lock',
                blocked: true,
                missingFields,
                patientId: resolvedPatientId,
                appointmentId: resolvedAppointmentId,
                traceId: resolvedTraceId,
              },
            });
            recordChartsAuditEvent({
              action: 'ORCA_MEDICAL_MOD_V23',
              outcome: 'blocked',
              subject: 'medicalmodv23',
              note: blockedReason,
              patientId: resolvedPatientId,
              appointmentId: resolvedAppointmentId,
              runId,
              cacheHit,
              missingMaster,
              fallbackUsed,
              dataSourceTransition,
              details: {
                operationPhase: 'lock',
                trigger: 'missing_fields',
                missingFields,
                endpoint: '/api21/medicalmodv23',
              },
            });
          } else {
            const requestXml = buildMedicalModV23RequestXml({
              patientId: resolvedPatientId ?? '',
              requestNumber: '01',
              firstCalculationDate: calculationDate,
              lastVisitDate: calculationDate,
              departmentCode,
            });
            try {
              const result = await postOrcaMedicalModV23Xml(requestXml);
              const apiResultOk = isApiResultOk(result.apiResult);
              const hasMissingTags = Boolean(result.missingTags?.length);
              const outcome = result.ok && apiResultOk && !hasMissingTags ? 'success' : result.ok ? 'warning' : 'error';
              const bannerDetail = [
                `Api_Result=${result.apiResult ?? '—'}`,
                result.apiResultMessage ? `Message=${result.apiResultMessage}` : undefined,
                hasMissingTags ? `missingTags=${result.missingTags?.join(', ')}` : undefined,
              ].filter((part): part is string => typeof part === 'string' && part.length > 0);

              if (outcome !== 'success') {
                setBanner({
                  tone: outcome === 'error' ? 'error' : 'warning',
                  message: `診療終了後の追加更新(${outcome}) / ${bannerDetail.join(' / ')}`,
                  nextAction: 'ORCA 応答を確認し、必要なら再送してください。',
                });
              }

              logUiState({
                action: 'medicalmodv23',
                screen: 'charts/action-bar',
                controlId: 'action-finish',
                runId: result.runId ?? runId,
                cacheHit,
                missingMaster,
                dataSourceTransition,
                fallbackUsed,
                details: {
                  operationPhase: 'do',
                  patientId: resolvedPatientId,
                  appointmentId: resolvedAppointmentId,
                  traceId: result.traceId ?? resolvedTraceId,
                  endpoint: '/api21/medicalmodv23',
                  httpStatus: result.status,
                  apiResult: result.apiResult,
                  apiResultMessage: result.apiResultMessage,
                  missingTags: result.missingTags,
                },
              });

              recordChartsAuditEvent({
                action: 'ORCA_MEDICAL_MOD_V23',
                outcome,
                subject: 'medicalmodv23',
                patientId: resolvedPatientId,
                appointmentId: resolvedAppointmentId,
                runId: result.runId ?? runId,
                cacheHit,
                missingMaster,
                fallbackUsed,
                dataSourceTransition,
                details: {
                  operationPhase: 'do',
                  endpoint: '/api21/medicalmodv23',
                  httpStatus: result.status,
                  apiResult: result.apiResult,
                  apiResultMessage: result.apiResultMessage,
                  missingTags: result.missingTags,
                },
              });
            } catch (error) {
              const detail = error instanceof Error ? error.message : String(error);
              setBanner({
                tone: 'error',
                message: `診療終了後の追加更新に失敗: ${detail}`,
                nextAction: 'ORCA 接続と診療科情報を確認してください。',
              });
              logUiState({
                action: 'medicalmodv23',
                screen: 'charts/action-bar',
                controlId: 'action-finish',
                runId,
                cacheHit,
                missingMaster,
                dataSourceTransition,
                fallbackUsed,
                details: {
                  operationPhase: 'do',
                  patientId: resolvedPatientId,
                  appointmentId: resolvedAppointmentId,
                  traceId: resolvedTraceId,
                  endpoint: '/api21/medicalmodv23',
                  error: detail,
                },
              });
              recordChartsAuditEvent({
                action: 'ORCA_MEDICAL_MOD_V23',
                outcome: 'error',
                subject: 'medicalmodv23',
                note: detail,
                error: detail,
                patientId: resolvedPatientId,
                appointmentId: resolvedAppointmentId,
                runId,
                cacheHit,
                missingMaster,
                fallbackUsed,
                dataSourceTransition,
                details: {
                  operationPhase: 'do',
                  endpoint: '/api21/medicalmodv23',
                  error: detail,
                },
              });
            }
          }
        }

        if (action === 'send') {
          await onAfterSend?.();
        } else {
          await onAfterFinish?.();
        }
        return;
      } else if (action === 'draft') {
        // TODO: 本実装では localStorage / server に保存。現段階は送信前チェック用のガード連携を優先。
        onDraftSaved?.();
      } else {
        // cancel は現状デモ（監査・テレメトリの記録）として扱う。
      }

      const durationMs = Math.round(performance.now() - startedAt);
      const after = getObservabilityMeta();
      const nextRunId = after.runId ?? runId;
      const nextTraceId = after.traceId ?? resolvedTraceId;
      setBanner(null);
      setToast({
        tone: 'success',
        message: `${ACTION_LABEL[action]}を完了`,
        detail: `runId=${nextRunId} / traceId=${nextTraceId ?? 'unknown'} / requestId=${queueEntry?.requestId ?? 'unknown'} / transition=${dataSourceTransition}`,
      });
      logTelemetry(action, 'success', durationMs);
      logAudit(action, 'success', undefined, durationMs, { phase: 'do' });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const isAbort =
        error instanceof DOMException
          ? error.name === 'AbortError'
          : error instanceof Error
            ? error.name === 'AbortError'
            : false;
      const apiDetails =
        error && typeof error === 'object' && 'apiDetails' in error
          ? ((error as { apiDetails?: Record<string, unknown> }).apiDetails ?? undefined)
          : undefined;
      const durationMs = Math.round(performance.now() - startedAt);
      const after = getObservabilityMeta();
      const errorRunId = (typeof apiDetails?.runId === 'string' ? (apiDetails?.runId as string) : undefined) ?? after.runId ?? runId;
      const errorTraceId =
        (typeof apiDetails?.traceId === 'string' ? (apiDetails?.traceId as string) : undefined) ??
        after.traceId ??
        resolvedTraceId;
      const errorRequestId =
        (typeof apiDetails?.requestId === 'string' ? (apiDetails?.requestId as string) : undefined) ??
        queueEntry?.requestId;
      const errorEndpoint = typeof apiDetails?.endpoint === 'string' ? (apiDetails?.endpoint as string) : undefined;
      const errorHttpStatus = typeof apiDetails?.httpStatus === 'number' ? (apiDetails?.httpStatus as number) : undefined;
      const errorOutcome = typeof apiDetails?.outcome === 'string' ? (apiDetails?.outcome as string) : undefined;
      const errorApiResult = typeof apiDetails?.apiResult === 'string' ? (apiDetails?.apiResult as string) : undefined;
      const errorApiResultMessage =
        typeof apiDetails?.apiResultMessage === 'string' ? (apiDetails?.apiResultMessage as string) : undefined;

      if (isAbort) {
        const abortedDetail = 'ユーザー操作により送信を中断しました。通信回復後に再試行できます。';
        setRetryAction('send');
        setBanner({ tone: 'warning', message: `ORCA送信を中断: ${abortedDetail}`, nextAction: '通信回復後にリトライできます。' });
        if (action === 'send') {
          setToast({ tone: 'warning', message: 'ORCA送信を中断', detail: abortedDetail });
        } else {
          setToast({ tone: 'warning', message: `${ACTION_LABEL[action]}を中断`, detail: abortedDetail });
        }
        logTelemetry(action, 'blocked', durationMs, abortedDetail, abortedDetail);
        logAudit(action, 'blocked', abortedDetail, durationMs, {
          phase: 'lock',
          details: {
            trigger: 'abort',
            traceId: errorTraceId,
            endpoint: errorEndpoint,
            httpStatus: errorHttpStatus,
          },
        });
      } else {
        const nextSteps = (() => {
          if (/HTTP 401|HTTP 403|権限不足/.test(detail)) {
            return '次にやること: 再ログイン / 設定確認（facilityId/userId/password）';
          }
          if (isNetworkError(error) || isNetworkError(detail)) {
            return '次にやること: 通信回復を待つ / Reception で再取得 / リトライ';
          }
          return '次にやること: Reception へ戻る / 請求を再取得 / 設定確認';
        })();
        const extraTags = [
          `runId=${errorRunId}`,
          `traceId=${errorTraceId ?? 'unknown'}`,
          errorRequestId ? `requestId=${errorRequestId}` : undefined,
          errorEndpoint ? `endpoint=${errorEndpoint}` : undefined,
          typeof errorHttpStatus === 'number' ? `HTTP ${errorHttpStatus}` : undefined,
          errorApiResult ? `apiResult=${errorApiResult}` : undefined,
          errorApiResultMessage ? `message=${errorApiResultMessage}` : undefined,
          errorOutcome ? `outcome=${errorOutcome}` : undefined,
        ].filter((part): part is string => typeof part === 'string');
        const composedDetail = `${detail}（${extraTags.join(' / ')}）${nextSteps ? ` / ${nextSteps}` : ''}`;
        setRetryAction(action);
        setBanner({ tone: 'error', message: `${ACTION_LABEL[action]}に失敗: ${composedDetail}`, nextAction: nextSteps });
        setToast({
          tone: 'error',
          message: action === 'send' ? 'ORCA送信に失敗' : `${ACTION_LABEL[action]}に失敗`,
          detail: composedDetail,
        });
        logTelemetry(action, 'error', durationMs, composedDetail, composedDetail);
        logAudit(action, 'error', composedDetail, durationMs, {
          phase: 'do',
          details: {
            traceId: errorTraceId,
            endpoint: errorEndpoint,
            httpStatus: errorHttpStatus,
            requestId: errorRequestId,
            apiResult: errorApiResult,
            apiResultMessage: errorApiResultMessage,
            outcome: errorOutcome,
          },
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsRunning(false);
      setRunningAction(null);
    }
  };

  const handlePrintExport = () => {
    if (printPrecheckReasons.length > 0) {
      const head = printPrecheckReasons[0];
      const blockedReasons = printPrecheckReasons.map((reason) => reason.key);
      const nextAction = head.next.join(' / ');
      setBanner({ tone: 'warning', message: `印刷/エクスポートを停止: ${head.summary}`, nextAction });
      setToast(null);
      logUiState({
        action: 'print',
        screen: 'charts/action-bar',
        controlId: 'action-print',
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: 'lock',
          blocked: true,
          blockedReasons,
          ...buildFallbackDetails(),
        },
      });
      logAudit('print', 'blocked', head.detail, undefined, {
        phase: 'lock',
        details: {
          trigger: blockedReasons[0],
          blockedReasons,
        },
      });
      return;
    }

    if (!selectedEntry) {
      const message = '患者未選択のため印刷/エクスポートを停止しました';
      setBanner({ tone: 'warning', message, nextAction: '患者を選択' });
      setToast({ tone: 'warning', message: '患者未選択', detail: message });
      logUiState({
        action: 'print',
        screen: 'charts/action-bar',
        controlId: 'action-print',
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: 'lock',
          blocked: true,
          blockedReasons: ['no-selection'],
          ...buildFallbackDetails(),
        },
      });
      logAudit('print', 'blocked', message, undefined, {
        phase: 'lock',
        details: { trigger: 'no-selection', blockedReasons: ['no-selection'] },
      });
      return;
    }

    const { actor, facilityId } = resolveAuditActor();

    const detail = `印刷プレビューを開きました (actor=${actor})`;
    setBanner(null);
    setToast({ tone: 'success', message: '印刷/エクスポートを開きました', detail });

    recordChartsAuditEvent({
      action: 'PRINT_OUTPATIENT',
      outcome: 'started',
      subject: 'outpatient-document-preview',
      note: detail,
      actor,
      patientId: selectedEntry.patientId ?? selectedEntry.id,
      appointmentId: selectedEntry.appointmentId,
      runId,
      cacheHit,
      missingMaster,
      fallbackUsed,
      dataSourceTransition,
      details: {
        operationPhase: 'do',
        endpoint: '/charts/print/outpatient',
        httpStatus: 200,
      },
    });

    const printPath = buildFacilityPath(session?.facilityId, '/charts/print/outpatient');
    logUiState({
      action: 'print',
      screen: 'charts/action-bar',
      controlId: 'action-print',
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        operationPhase: 'do',
        destination: printPath,
        patientId: selectedEntry.patientId ?? selectedEntry.id,
        appointmentId: selectedEntry.appointmentId,
      },
    });

    navigate(printPath, {
      state: {
        entry: selectedEntry,
        meta: { runId, cacheHit, missingMaster, fallbackUsed, dataSourceTransition },
        actor,
        facilityId,
      },
    });
    saveOutpatientPrintPreview({
      entry: selectedEntry,
      meta: { runId, cacheHit, missingMaster, fallbackUsed, dataSourceTransition },
      actor,
      facilityId,
    });
  };

  const openPrintDialog = () => {
    setPrintDialogOpen(true);
    approvalSessionRef.current = { action: 'print', closed: false };
    logApproval('print', 'open');
  };

  const handleReportPrint = async () => {
    if (printPrecheckReasons.length > 0) {
      const head = printPrecheckReasons[0];
      const blockedReasons = printPrecheckReasons.map((reason) => reason.key);
      const nextAction = head.next.join(' / ');
      setBanner({ tone: 'warning', message: `帳票出力を停止: ${head.summary}`, nextAction });
      setToast(null);
      recordChartsAuditEvent({
        action: 'ORCA_REPORT_PRINT',
        outcome: 'blocked',
        subject: 'orca-report-preview',
        note: head.detail,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        runId,
        cacheHit,
        missingMaster,
        fallbackUsed,
        dataSourceTransition,
        details: {
          operationPhase: 'lock',
          blockedReasons,
          reportType: resolvedReportType,
        },
      });
      return;
    }

    if (!resolvedPatientId) {
      const message = '患者IDが未確定のため帳票出力を開始できません。';
      setBanner({ tone: 'warning', message, nextAction: 'Patients で患者を選択してください。' });
      setToast({ tone: 'warning', message: '患者未選択', detail: message });
      recordChartsAuditEvent({
        action: 'ORCA_REPORT_PRINT',
        outcome: 'blocked',
        subject: 'orca-report-preview',
        note: message,
        runId,
        cacheHit,
        missingMaster,
        fallbackUsed,
        dataSourceTransition,
        details: {
          operationPhase: 'lock',
          blockedReasons: ['patient_not_selected'],
          reportType: resolvedReportType,
        },
      });
      return;
    }

    if (!reportReady) {
      const message = reportFieldErrors.join(' / ') || '帳票出力条件が不足しています。';
      setBanner({ tone: 'warning', message: `帳票出力を停止: ${message}`, nextAction: '入力内容を確認してください。' });
      setToast({ tone: 'warning', message: '帳票出力を停止', detail: message });
      recordChartsAuditEvent({
        action: 'ORCA_REPORT_PRINT',
        outcome: 'blocked',
        subject: 'orca-report-preview',
        note: message,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        runId,
        cacheHit,
        missingMaster,
        fallbackUsed,
        dataSourceTransition,
        details: {
          operationPhase: 'lock',
          blockedReasons: reportFieldErrors,
          reportType: resolvedReportType,
          invoiceNumber: reportForm.invoiceNumber || undefined,
          departmentCode: reportForm.departmentCode || undefined,
          insuranceCombinationNumber: reportForm.insuranceCombinationNumber || undefined,
          performMonth: reportForm.performMonth || undefined,
        },
      });
      return;
    }

    const { actor, facilityId } = resolveAuditActor();
    const startedAt = performance.now();
    setIsRunning(true);
    setRunningAction('print');
    setRetryAction(null);
    setToast(null);
    setBanner(null);

    const requestXml = buildOrcaReportRequestXml(resolvedReportType, {
      patientId: resolvedPatientId,
      invoiceNumber: reportForm.invoiceNumber || undefined,
      outsideClass: reportForm.outsideClass,
      departmentCode: reportForm.departmentCode || undefined,
      insuranceCombinationNumber: reportForm.insuranceCombinationNumber || undefined,
      performMonth: reportForm.performMonth || undefined,
    });
    const endpoint = resolveOrcaReportEndpoint(resolvedReportType);

    recordChartsAuditEvent({
      action: 'ORCA_REPORT_PRINT',
      outcome: 'started',
      subject: 'orca-report-request',
      note: `report=${resolvedReportType}`,
      actor,
      patientId: resolvedPatientId,
      appointmentId: resolvedAppointmentId,
      runId,
      cacheHit,
      missingMaster,
      fallbackUsed,
      dataSourceTransition,
      details: {
        operationPhase: 'do',
        reportType: resolvedReportType,
        reportLabel: ORCA_REPORT_LABELS[resolvedReportType],
        invoiceNumber: reportForm.invoiceNumber || undefined,
        departmentCode: reportForm.departmentCode || undefined,
        insuranceCombinationNumber: reportForm.insuranceCombinationNumber || undefined,
        performMonth: reportForm.performMonth || undefined,
        endpoint,
      },
    });

    logUiState({
      action: 'print',
      screen: 'charts/action-bar',
      controlId: 'action-print-report',
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        operationPhase: 'do',
        reportType: resolvedReportType,
        endpoint,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
      },
    });

    try {
      const result = await postOrcaReportXml(resolvedReportType, requestXml);
      const apiResultOk = isApiResultOk(result.apiResult);
      const responseRunId = result.runId ?? runId;
      const responseTraceId = result.traceId ?? resolvedTraceId;
      if (!result.ok || !apiResultOk || !result.dataId) {
        const detail = [
          `HTTP ${result.status}`,
          result.apiResult ? `apiResult=${result.apiResult}` : undefined,
          result.apiResultMessage ? `message=${result.apiResultMessage}` : undefined,
          !result.dataId ? 'Data_Id missing' : undefined,
        ]
          .filter((part): part is string => Boolean(part))
          .join(' / ');
        throw new Error(detail || '帳票出力に失敗しました。');
      }

      const previewState = {
        reportType: resolvedReportType,
        reportLabel: ORCA_REPORT_LABELS[resolvedReportType],
        dataId: result.dataId,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        invoiceNumber: reportForm.invoiceNumber || undefined,
        departmentCode: reportForm.departmentCode || undefined,
        insuranceCombinationNumber: reportForm.insuranceCombinationNumber || undefined,
        performMonth: reportForm.performMonth || undefined,
        requestedAt: new Date().toISOString(),
        meta: {
          runId: responseRunId ?? runId,
          cacheHit,
          missingMaster,
          fallbackUsed,
          dataSourceTransition,
        },
        actor,
        facilityId,
      };

      const printPath = buildFacilityPath(session?.facilityId, '/charts/print/document');
      navigate(printPath, { state: previewState });
      saveReportPrintPreview(previewState);

      const durationMs = Math.round(performance.now() - startedAt);
      setToast({
        tone: 'success',
        message: '帳票プレビューを開きました',
        detail: `Data_Id=${result.dataId} / runId=${responseRunId} / traceId=${responseTraceId ?? 'unknown'}`,
      });

      recordChartsAuditEvent({
        action: 'ORCA_REPORT_PRINT',
        outcome: 'success',
        subject: 'orca-report-preview',
        note: `Data_Id=${result.dataId}`,
        actor,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        runId: responseRunId,
        cacheHit,
        missingMaster,
        fallbackUsed,
        dataSourceTransition,
        durationMs,
        details: {
          operationPhase: 'do',
          reportType: resolvedReportType,
          reportLabel: ORCA_REPORT_LABELS[resolvedReportType],
          dataId: result.dataId,
          endpoint,
          httpStatus: result.status,
          apiResult: result.apiResult,
          apiResultMessage: result.apiResultMessage,
        },
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setBanner({ tone: 'error', message: `帳票出力に失敗: ${detail}`, nextAction: 'ORCA 応答を確認し、再試行してください。' });
      setToast({ tone: 'error', message: '帳票出力に失敗', detail });
      recordChartsAuditEvent({
        action: 'ORCA_REPORT_PRINT',
        outcome: 'error',
        subject: 'orca-report-preview',
        note: detail,
        error: detail,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        runId,
        cacheHit,
        missingMaster,
        fallbackUsed,
        dataSourceTransition,
        details: {
          operationPhase: 'do',
          reportType: resolvedReportType,
          reportLabel: ORCA_REPORT_LABELS[resolvedReportType],
          endpoint,
          error: detail,
        },
      });
    } finally {
      setIsRunning(false);
      setRunningAction(null);
    }
  };

  const handleUnlock = () => {
    setLockReason(null);
    setBanner({ tone: 'info', message: 'UIロックを解除しました。次のアクションを実行できます。' });
    setToast(null);
    logUiState({
      action: 'lock',
      screen: 'charts/action-bar',
      controlId: 'unlock',
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: { operationPhase: 'lock', unlocked: true },
    });
    recordChartsAuditEvent({
      action: 'CHARTS_EDIT_LOCK',
      outcome: 'released',
      subject: 'charts-ui-lock',
      patientId: resolvedPatientId,
      appointmentId: resolvedAppointmentId,
      runId,
      cacheHit,
      missingMaster,
      fallbackUsed,
      dataSourceTransition,
      details: {
        operationPhase: 'lock',
        trigger: 'ui_unlock',
        lockStatus: 'ui',
      },
    });
  };

  const handleAbort = () => {
    if (!isRunning) return;
    if (runningAction !== 'send') return;
    abortControllerRef.current?.abort();
  };

  const handleApprovalUnlock = () => {
    if (!approvalLocked || !onApprovalUnlock) return;
    const first = typeof window !== 'undefined'
      ? window.confirm('承認ロック（署名確定）を解除しますか？この操作は危険です。')
      : false;
    if (!first) return;
    const second = typeof window !== 'undefined'
      ? window.confirm('最終確認: 承認ロック解除（署名取消）を実行します。よろしいですか？')
      : false;
    if (!second) return;
    onApprovalUnlock();
    setBanner({
      tone: 'warning',
      message: '承認ロックを解除しました。署名確定が取り消され、編集が再開できます。',
      nextAction: '編集前に内容確認と再署名が必要か確認してください。',
    });
    setToast(null);
  };

  const handleReloadLatest = async () => {
    setToast({
      tone: 'info',
      message: '最新を再読込',
      detail: '最新データを再取得します（取得完了後に編集可否が更新されます）。',
    });
    recordChartsAuditEvent({
      action: 'CHARTS_CONFLICT',
      outcome: 'resolved',
      subject: 'charts-tab-lock',
      patientId: resolvedPatientId,
      appointmentId: resolvedAppointmentId,
      runId,
      cacheHit,
      missingMaster,
      fallbackUsed,
      dataSourceTransition,
      details: {
        operationPhase: 'lock',
        trigger: 'tab',
        resolution: 'reload',
        lockStatus: editLock?.lockStatus,
      },
    });
    logUiState({
      action: 'lock',
      screen: 'charts/action-bar',
      controlId: 'reload-latest',
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        operationPhase: 'lock',
        trigger: 'tab',
        resolution: 'reload',
        lockStatus: editLock?.lockStatus,
      },
    });
    await onReloadLatest?.();
  };

  const handleDiscard = () => {
    onDiscardChanges?.();
    setToast({
      tone: 'info',
      message: '変更を破棄しました',
      detail: 'ローカルの未保存状態を破棄し、閲覧専用状態の解除を待てます。',
    });
  };

  const handleForceTakeover = () => {
    const confirmed = typeof window !== 'undefined'
      ? window.confirm('別タブが保持している編集ロックを引き継ぎますか？（上書きの可能性があります）')
      : false;
    if (!confirmed) return;
    const second = typeof window !== 'undefined'
      ? window.confirm('最終確認: 編集ロックの引き継ぎを実行します。よろしいですか？')
      : false;
    if (!second) return;
    onForceTakeover?.();
  };

  return (
    <section
      className={`charts-actions${isLocked ? ' charts-actions--locked' : ''}`}
      id="charts-actionbar"
      tabIndex={-1}
      data-focus-anchor="true"
      aria-live="off"
      data-run-id={runId}
      data-test-id="charts-actionbar"
    >
      <header className="charts-actions__header">
        <div>
          <p className="charts-actions__kicker">アクションバー / ORCA 送信とドラフト制御</p>
          <h2>診療終了・送信・ドラフト・キャンセル</h2>
          <p className="charts-actions__status" role="status">
            {statusLine}
          </p>
        </div>
        <div className="charts-actions__meta">
          <StatusPill className="charts-actions__pill" label="runId" value={runId ?? '—'} tone="info" />
          <StatusPill className="charts-actions__pill" label="traceId" value={resolvedTraceId ?? 'unknown'} tone="info" />
          <StatusPill className="charts-actions__pill" label="transition" value={dataSourceTransition} tone="info" />
          <StatusPill
            className="charts-actions__pill"
            label="missingMaster"
            value={String(missingMaster)}
            tone={missingMaster ? 'warning' : 'success'}
          />
          <StatusPill
            className="charts-actions__pill"
            label="fallbackUsed"
            value={String(fallbackUsed)}
            tone={fallbackUsed ? 'warning' : 'success'}
          />
          <StatusPill
            className="charts-actions__pill"
            label="draftDirty"
            value={String(hasUnsavedDraft)}
            tone={hasUnsavedDraft ? 'warning' : 'success'}
          />
          <StatusPill
            className="charts-actions__pill"
            label="患者"
            value={`${selectedEntry?.name ?? '未選択'}（${selectedEntry?.patientId ?? selectedEntry?.appointmentId ?? 'ID不明'}）`}
          />
          <StatusPill className="charts-actions__pill" label="受付ID" value={selectedEntry?.receptionId ?? '—'} />
          <StatusPill className="charts-actions__pill" label="診療日" value={resolvedVisitDate ?? '—'} />
          <StatusPill
            className="charts-actions__pill"
            label="現在"
            value={`${selectedEntry?.status ?? '—'}（受付→診療→会計）`}
          />
        </div>
      </header>

      <FocusTrapDialog
        open={confirmAction === 'send'}
        role="alertdialog"
        title="ORCA送信の確認"
        description={`現在の患者/受付を ORCA へ送信します。実行後に取り消せない場合があります。（runId=${runId} / transition=${dataSourceTransition}）`}
        onClose={() => {
          finalizeApproval('send', 'cancelled');
          setConfirmAction(null);
        }}
        testId="charts-send-dialog"
      >
        <div role="group" aria-label="ORCA送信の確認">
          <button
            type="button"
            onClick={() => {
              finalizeApproval('send', 'cancelled');
              setConfirmAction(null);
            }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              finalizeApproval('send', 'confirmed');
              setConfirmAction(null);
              const { actor } = resolveAuditActor();
              onApprovalConfirmed?.({ action: 'send', actor });
              void handleAction('send');
            }}
          >
            送信する
          </button>
        </div>
      </FocusTrapDialog>

      <FocusTrapDialog
        open={printDialogOpen}
        role="dialog"
        title="印刷/帳票出力の確認"
        description={`個人情報を含む帳票を表示します。画面共有/第三者の閲覧に注意してください。（runId=${runId}）`}
        onClose={() => {
          finalizeApproval('print', 'cancelled');
          setPrintDialogOpen(false);
        }}
        testId="charts-print-dialog"
      >
        <div className="charts-actions__print-dialog" role="group" aria-label="印刷/帳票出力の確認">
          <div className="charts-actions__print-field">
            <label htmlFor="charts-print-destination">帳票種別</label>
            <select
              id="charts-print-destination"
              value={printDestination}
              onChange={(event) => {
                const next = event.target.value as PrintDestination;
                setPrintDestination(next);
                if (next !== 'outpatient') {
                  setReportForm((prev) => ({ ...prev, type: next }));
                }
              }}
            >
              {PRINT_DESTINATIONS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}（{entry.detail}）
                </option>
              ))}
            </select>
          </div>

          {printDestination !== 'outpatient' && (
            <>
              {reportIncomeStatus === 'loading' && (
                <p className="charts-actions__print-note">収納情報を取得中…</p>
              )}
              {reportIncomeStatus === 'error' && reportIncomeError && (
                <p className="charts-actions__print-note charts-actions__print-note--error">
                  収納情報の取得に失敗: {reportIncomeError}
                </p>
              )}
              {reportIncomeLatest?.performDate && (
                <p className="charts-actions__print-note">
                  参考: 最新収納 {reportIncomeLatest.performDate} / 伝票番号 {reportIncomeLatest.invoiceNumber ?? '—'}
                </p>
              )}

              {reportNeedsInvoice && (
                <div className="charts-actions__print-field">
                  <label htmlFor="charts-print-invoice">伝票番号（Invoice_Number）*</label>
                  <input
                    id="charts-print-invoice"
                    list="charts-print-invoice-options"
                    value={reportForm.invoiceNumber}
                    onChange={(event) => {
                      reportTouchedRef.current.invoiceNumber = true;
                      setReportForm((prev) => ({ ...prev, invoiceNumber: event.target.value }));
                    }}
                    placeholder="例: 0002375"
                  />
                  {reportInvoiceOptions.length > 0 && (
                    <datalist id="charts-print-invoice-options">
                      {reportInvoiceOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  )}
                </div>
              )}

              {reportNeedsOutsideClass && (
                <div className="charts-actions__print-field">
                  <label htmlFor="charts-print-outside">院外処方区分（Outside_Class）</label>
                  <select
                    id="charts-print-outside"
                    value={reportForm.outsideClass}
                    onChange={(event) => {
                      setReportForm((prev) => ({ ...prev, outsideClass: event.target.value as 'True' | 'False' }));
                    }}
                  >
                    <option value="False">院内</option>
                    <option value="True">院外</option>
                  </select>
                </div>
              )}

              {reportNeedsDepartment && (
                <div className="charts-actions__print-field">
                  <label htmlFor="charts-print-department">診療科コード（Department_Code）{resolvedReportType === 'karteno1' ? '*' : ''}</label>
                  <input
                    id="charts-print-department"
                    value={reportForm.departmentCode}
                    onChange={(event) => {
                      reportTouchedRef.current.departmentCode = true;
                      setReportForm((prev) => ({ ...prev, departmentCode: event.target.value }));
                    }}
                    placeholder="例: 01"
                  />
                </div>
              )}

              {reportNeedsInsurance && (
                <div className="charts-actions__print-field">
                  <label htmlFor="charts-print-insurance">保険組合せ番号{resolvedReportType === 'karteno1' ? '*' : ''}</label>
                  <input
                    id="charts-print-insurance"
                    list="charts-print-insurance-options"
                    value={reportForm.insuranceCombinationNumber}
                    onChange={(event) => {
                      reportTouchedRef.current.insuranceCombinationNumber = true;
                      setReportForm((prev) => ({ ...prev, insuranceCombinationNumber: event.target.value }));
                    }}
                    placeholder="例: 0001"
                  />
                  {reportInsuranceOptions.length > 0 && (
                    <datalist id="charts-print-insurance-options">
                      {reportInsuranceOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  )}
                </div>
              )}

              {reportNeedsPerformMonth && (
                <div className="charts-actions__print-field">
                  <label htmlFor="charts-print-perform-month">対象月（Perform_Month）*</label>
                  <input
                    id="charts-print-perform-month"
                    type="month"
                    value={reportForm.performMonth}
                    onChange={(event) => {
                      reportTouchedRef.current.performMonth = true;
                      setReportForm((prev) => ({ ...prev, performMonth: event.target.value }));
                    }}
                  />
                </div>
              )}
            </>
          )}

          {reportFieldErrors.length > 0 && printDestination !== 'outpatient' && (
            <div className="charts-actions__print-errors" role="alert">
              {reportFieldErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          <div className="charts-actions__print-actions" role="group" aria-label="印刷/帳票出力の確認">
            <button
              type="button"
              onClick={() => {
                finalizeApproval('print', 'cancelled');
                setPrintDialogOpen(false);
              }}
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={printDestination !== 'outpatient' && (!reportReady || isRunning)}
              onClick={() => {
                finalizeApproval('print', 'confirmed');
                setPrintDialogOpen(false);
                if (printDestination === 'outpatient') {
                  handlePrintExport();
                } else {
                  void handleReportPrint();
                }
              }}
            >
              開く
            </button>
          </div>
        </div>
      </FocusTrapDialog>

      {banner && (
        <div className="charts-actions__banner">
          <ToneBanner tone={banner.tone} message={banner.message} nextAction={banner.nextAction} runId={runId} />
          <div className="charts-actions__banner-actions" role="group" aria-label="通知操作">
            {retryAction && !isRunning && (
              <button type="button" className="charts-actions__retry" onClick={() => handleAction(retryAction)}>
                リトライ
              </button>
            )}
            <button type="button" className="charts-actions__retry" onClick={() => setBanner(null)}>
              閉じる
            </button>
          </div>
        </div>
      )}

      {isRunning && runningAction === 'send' && (
        <div className="charts-actions__banner-actions" role="group" aria-label="進行中の操作">
          <button type="button" className="charts-actions__retry" onClick={handleAbort}>
            送信を中断
          </button>
        </div>
      )}
      {approvalLocked ? (
        <div className="charts-actions__conflict" role="group" aria-label="承認済み（署名確定）のため編集不可">
          <div className="charts-actions__conflict-title">
            <strong>承認済み（署名確定）</strong>
            <span className="charts-actions__conflict-meta">
              {approvalLock?.approvedAt ? `approvedAt=${approvalLock.approvedAt}` : ''}
            </span>
          </div>
          <p className="charts-actions__conflict-message">{approvalReason}</p>
          <div className="charts-actions__conflict-actions">
            <button type="button" className="charts-actions__button charts-actions__button--unlock" onClick={openPrintDialog}>
              印刷/エクスポートへ
            </button>
            <button
              type="button"
              className="charts-actions__button charts-actions__button--danger"
              onClick={handleApprovalUnlock}
              disabled={!onApprovalUnlock}
            >
              承認ロック解除
            </button>
          </div>
        </div>
      ) : null}
      {readOnly && !approvalLocked ? (
        <div className="charts-actions__conflict" role="group" aria-label="並行編集（閲覧専用）の対応">
          <div className="charts-actions__conflict-title">
            <strong>並行編集を検知</strong>
            <span className="charts-actions__conflict-meta">
              {editLock?.ownerRunId ? `ownerRunId=${editLock.ownerRunId}` : ''}
              {editLock?.expiresAt ? ` expiresAt=${editLock.expiresAt}` : ''}
            </span>
          </div>
          <p className="charts-actions__conflict-message">{readOnlyReason}</p>
          <div className="charts-actions__conflict-actions">
            <button type="button" className="charts-actions__button charts-actions__button--unlock" onClick={handleReloadLatest}>
              最新を再読込
            </button>
            <button
              type="button"
              className="charts-actions__button charts-actions__button--ghost"
              onClick={handleDiscard}
              disabled={!hasUnsavedDraft}
            >
              自分の変更を破棄
            </button>
            <button type="button" className="charts-actions__button" onClick={handleForceTakeover}>
              強制引き継ぎ
            </button>
          </div>
        </div>
      ) : null}

      <div className="charts-actions__controls" role="group" aria-label="Charts 操作用ボタン">
        <button
          type="button"
          id="charts-action-finish"
          className="charts-actions__button"
          disabled={otherBlocked}
          data-disabled-reason={otherBlocked ? (isLocked ? 'locked' : undefined) : undefined}
          onClick={() => handleAction('finish')}
          aria-keyshortcuts="Alt+E"
        >
          診療終了
        </button>
        <button
          type="button"
          id="charts-action-send"
          className="charts-actions__button charts-actions__button--primary"
          disabled={sendDisabled}
          onClick={() => {
            setConfirmAction('send');
            approvalSessionRef.current = { action: 'send', closed: false };
            logApproval('send', 'open');
          }}
          aria-disabled={sendDisabled}
          aria-describedby={!isRunning && sendPrecheckReasons.length > 0 ? 'charts-actions-send-guard' : undefined}
          data-disabled-reason={
            sendDisabled
              ? (isRunning ? 'running' : sendPrecheckReasons.map((reason) => reason.key).join(','))
              : undefined
          }
          aria-keyshortcuts="Alt+S"
        >
          ORCA 送信
        </button>
        <button
          type="button"
          id="charts-action-print"
          className="charts-actions__button"
          disabled={printDisabled}
          aria-disabled={printDisabled}
          onClick={openPrintDialog}
          aria-describedby={!isRunning && printPrecheckReasons.length > 0 ? 'charts-actions-print-guard' : undefined}
          data-disabled-reason={printDisabled ? printPrecheckReasons.map((reason) => reason.key).join(',') : undefined}
          aria-keyshortcuts="Alt+I"
        >
          印刷/エクスポート
        </button>
        <button
          type="button"
          id="charts-action-draft"
          className="charts-actions__button"
          disabled={otherBlocked}
          data-disabled-reason={otherBlocked ? (isLocked ? 'locked' : undefined) : undefined}
          onClick={() => handleAction('draft')}
          aria-keyshortcuts="Shift+Enter"
        >
          ドラフト保存
        </button>
        <button
          type="button"
          className="charts-actions__button charts-actions__button--ghost"
          disabled={otherBlocked}
          data-disabled-reason={otherBlocked ? (isLocked ? 'locked' : undefined) : undefined}
          onClick={() => handleAction('cancel')}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="charts-actions__button charts-actions__button--unlock"
          disabled={isRunning || !isLocked || approvalLocked}
          onClick={handleUnlock}
        >
          ロック解除
        </button>
      </div>

      {!isRunning && sendPrecheckReasons.length > 0 && (
        <div id="charts-actions-send-guard" className="charts-actions__guard" role="note" aria-live="off">
          <strong>送信前チェック: ORCA送信をブロック</strong>
          <ul>
            {sendPrecheckReasons.map((reason) => (
              <li key={reason.key}>
                {reason.summary}: {reason.detail}（次にやること: {reason.next.join(' / ')}）
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isRunning && printPrecheckReasons.length > 0 && (
        <div id="charts-actions-print-guard" className="charts-actions__guard" role="note" aria-live="off">
          <strong>印刷前チェック: 印刷/エクスポートをブロック</strong>
          <ul>
            {printPrecheckReasons.map((reason) => (
              <li key={reason.key}>
                {reason.summary}: {reason.detail}（次にやること: {reason.next.join(' / ')}）
              </li>
            ))}
          </ul>
        </div>
      )}

      {isRunning && (
        <div className="charts-actions__skeleton" role="status" aria-live={resolveAriaLive('info')}>
          <div className="charts-actions__skeleton-bar" />
          <div className="charts-actions__skeleton-bar charts-actions__skeleton-bar--short" />
        </div>
      )}

      {toast && (
        <div
          className={`charts-actions__toast charts-actions__toast--${toast.tone}`}
          role="status"
          aria-live={resolveAriaLive(toast.tone)}
          aria-atomic="false"
        >
          <div>
            <strong>{toast.message}</strong>
            {toast.detail && <p>{toast.detail}</p>}
          </div>
          <button type="button" className="charts-actions__retry" onClick={() => setToast(null)}>
            閉じる
          </button>
        </div>
      )}
    </section>
  );
}
