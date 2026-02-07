import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/features/charts/ChartsActionBar.tsx");import.meta.env = {"BASE_URL": "/", "DEV": true, "MODE": "development", "PROD": false, "SSR": false, "VITE_ALLOW_LEGACY_HEADER_AUTH_FALLBACK": "0", "VITE_API_BASE_URL": "/api", "VITE_BASE_PATH": "/", "VITE_DEV_PROXY_TARGET": "http://localhost:9080/openDolphin/resources", "VITE_DEV_USE_HTTPS": "0", "VITE_DISABLE_ACCEPTANCE_PUSH": "1", "VITE_DISABLE_AUDIT": "0", "VITE_DISABLE_MSW": "1", "VITE_DISABLE_SECURITY": "0", "VITE_ENABLE_FACILITY_HEADER": "1", "VITE_ENABLE_LEGACY_HEADER_AUTH": "0", "VITE_ENABLE_TELEMETRY": "0", "VITE_HTTP_MAX_RETRIES": "2", "VITE_HTTP_TIMEOUT_MS": "10000", "VITE_ORCA_API_PATH_PREFIX": "off", "VITE_ORCA_MASTER_PASSWORD": "21232f297a57a5a743894a0e4a801fc3", "VITE_ORCA_MASTER_USER": "1.3.6.1.4.1.9414.70.1:admin", "VITE_ORCA_MODE": "weborca"};import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=1a469f0c"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import __vite__cjsImport1_react from "/node_modules/.vite/deps/react.js?v=1a469f0c"; const useEffect = __vite__cjsImport1_react["useEffect"]; const useMemo = __vite__cjsImport1_react["useMemo"]; const useRef = __vite__cjsImport1_react["useRef"]; const useState = __vite__cjsImport1_react["useState"];
import { useNavigate } from "/node_modules/.vite/deps/react-router-dom.js?v=1a469f0c";
import { FocusTrapDialog } from "/src/components/modals/FocusTrapDialog.tsx";
import { logAuditEvent, logUiState } from "/src/libs/audit/auditLogger.ts";
import { resolveAuditActor } from "/src/libs/auth/storedAuth.ts";
import { httpFetch } from "/src/libs/http/httpClient.ts";
import { getObservabilityMeta, resolveAriaLive } from "/src/libs/observability/observability.ts";
import { recordOutpatientFunnel } from "/src/libs/telemetry/telemetryClient.ts";
import { ToneBanner } from "/src/features/reception/components/ToneBanner.tsx";
import { StatusPill } from "/src/features/shared/StatusPill.tsx";
import { recordChartsAuditEvent } from "/src/features/charts/audit.ts";
import {
  clearOutpatientOutputResult,
  loadOutpatientOutputResult,
  saveOutpatientPrintPreview,
  saveReportPrintPreview
} from "/src/features/charts/print/printPreviewStorage.ts";
import { isNetworkError } from "/src/features/shared/apiError.ts";
import { useOptionalSession } from "/src/AppRouter.tsx?t=1770195285248";
import { buildFacilityPath } from "/src/routes/facilityRoutes.ts";
import { buildMedicalModV23RequestXml, postOrcaMedicalModV23Xml } from "/src/features/charts/orcaMedicalModApi.ts?t=1770195234006";
import { buildMedicalModV2RequestXml, postOrcaMedicalModV2Xml } from "/src/features/charts/orcaClaimApi.ts?t=1770195226576";
import { getOrcaClaimSendEntry, saveOrcaClaimSendCache } from "/src/features/charts/orcaClaimSendCache.ts";
import { ReportPrintDialog } from "/src/features/charts/print/ReportPrintDialog.tsx";
import { useOrcaReportPrint } from "/src/features/charts/print/useOrcaReportPrint.ts";
import { MISSING_MASTER_RECOVERY_NEXT_STEPS } from "/src/features/shared/missingMasterRecovery.ts";
const ACTION_LABEL = {
  finish: "診療終了",
  send: "ORCA送信",
  draft: "ドラフト保存",
  cancel: "キャンセル",
  print: "印刷"
};
const ORCA_ACTION_TIMEOUT_MS = Number(import.meta.env.VITE_ORCA_SEND_TIMEOUT_MS ?? "60000");
const resolveActionTimeoutMs = (action) => {
  if (action !== "send" && action !== "finish") return 0;
  if (!Number.isFinite(ORCA_ACTION_TIMEOUT_MS) || ORCA_ACTION_TIMEOUT_MS <= 0) return 0;
  return ORCA_ACTION_TIMEOUT_MS;
};
const summarizeGuardReasons = (reasons) => {
  if (reasons.length === 0) return null;
  const parts = reasons.slice(0, 2).map((reason) => reason.summary);
  let summary = parts.join(" / ");
  const remaining = reasons.length - parts.length;
  if (remaining > 0) summary = `${summary}（他${remaining}件）`;
  const normalizeActionKey = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const bracketIndex = trimmed.search(/[（(]/);
    if (bracketIndex === -1) return trimmed;
    return trimmed.slice(0, bracketIndex).trim();
  };
  const nextActions = [];
  const nextActionKeys = /* @__PURE__ */ new Set();
  for (const reason of reasons) {
    for (const action of reason.next) {
      const normalized = action.trim();
      if (!normalized) continue;
      const normalizedKey = normalizeActionKey(normalized);
      if (nextActionKeys.has(normalizedKey) || nextActions.includes(normalized)) continue;
      nextActions.push(normalized);
      if (normalizedKey) nextActionKeys.add(normalizedKey);
      if (nextActions.length >= 2) break;
    }
    if (nextActions.length >= 2) break;
  }
  return {
    summary,
    nextActions
  };
};
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
  uiLockReason,
  onReloadLatest,
  onDiscardChanges,
  onForceTakeover,
  onAfterSend,
  onAfterFinish,
  onDraftSaved,
  onLockChange,
  onApprovalConfirmed,
  onApprovalUnlock
}) {
  _s();
  const session = useOptionalSession();
  const storageScope = useMemo(
    () => ({ facilityId: session?.facilityId, userId: session?.userId }),
    [session?.facilityId, session?.userId]
  );
  const navigate = useNavigate();
  const [lockReason, setLockReason] = useState(null);
  const [toast, setToast] = useState(null);
  const [banner, setBanner] = useState(null);
  const [retryAction, setRetryAction] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningAction, setRunningAction] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const abortControllerRef = useRef(null);
  const outpatientResultRef = useRef(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const resolvedLockReason = uiLockReason ?? lockReason;
  const uiLocked = resolvedLockReason !== null;
  const readOnly = editLock?.readOnly === true;
  const readOnlyReason = editLock?.reason ?? "並行編集を検知したため、このタブは閲覧専用です。";
  const approvalLocked = approvalLock?.locked === true;
  const approvalReason = approvalLocked ? "署名確定済みのため編集できません。" : void 0;
  const actionLocked = uiLocked || isRunning || readOnly;
  const isLocked = actionLocked || approvalLocked;
  const resolvedTraceId = traceId ?? getObservabilityMeta().traceId;
  const resolvedPatientId = patientId ?? selectedEntry?.patientId ?? selectedEntry?.id;
  const resolvedAppointmentId = queueEntry?.appointmentId ?? selectedEntry?.appointmentId;
  const resolvedReceptionId = selectedEntry?.receptionId;
  const resolvedVisitDate = useMemo(
    () => visitDate ?? selectedEntry?.visitDate,
    [selectedEntry?.visitDate, visitDate]
  );
  const orcaSendEntry = getOrcaClaimSendEntry(storageScope, resolvedPatientId);
  const reportPrint = useOrcaReportPrint({
    dialogOpen: printDialogOpen,
    patientId: resolvedPatientId,
    appointmentId: resolvedAppointmentId,
    visitDate: resolvedVisitDate,
    selectedEntry,
    orcaSendEntry,
    runId,
    cacheHit,
    missingMaster,
    fallbackUsed,
    dataSourceTransition,
    traceId: resolvedTraceId
  });
  const {
    printDestination,
    setPrintDestination,
    reportForm,
    updateReportField,
    reportFieldErrors,
    reportReady,
    reportIncomeStatus,
    reportIncomeError,
    reportIncomeLatest,
    reportInvoiceOptions,
    reportInsuranceOptions,
    reportNeedsInvoice,
    reportNeedsOutsideClass,
    reportNeedsDepartment,
    reportNeedsInsurance,
    reportNeedsPerformMonth,
    resolvedReportType,
    requestReportPreview
  } = reportPrint;
  const resolveDepartmentCode = (department) => {
    if (!department) return void 0;
    const match = department.match(/\b(\d{2})\b/);
    return match?.[1];
  };
  const normalizeVisitDate = (value) => {
    if (!value) return void 0;
    return value.length >= 10 ? value.slice(0, 10) : value;
  };
  const isApiResultOk = (apiResult) => Boolean(apiResult && /^0+$/.test(apiResult));
  const sendQueueLabel = useMemo(() => {
    const phase = queueEntry?.phase;
    if (!phase) return void 0;
    if (phase === "ack") return "成功";
    if (phase === "failed") return "失敗";
    if (phase === "retry" || phase === "sent") return "処理中";
    if (phase === "hold") return "待ち（保留）";
    return "待ち";
  }, [queueEntry?.phase]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  useEffect(() => {
    if (outpatientResultRef.current) return;
    const outputResult = loadOutpatientOutputResult(storageScope);
    if (!outputResult) return;
    clearOutpatientOutputResult(storageScope);
    outpatientResultRef.current = true;
    const detailParts = [
      outputResult.detail,
      outputResult.runId ? `runId=${outputResult.runId}` : void 0,
      outputResult.traceId ? `traceId=${outputResult.traceId}` : void 0,
      outputResult.endpoint ? `endpoint=${outputResult.endpoint}` : void 0,
      typeof outputResult.httpStatus === "number" ? `HTTP ${outputResult.httpStatus}` : void 0
    ].filter((part) => typeof part === "string" && part.length > 0);
    const detail = detailParts.join(" / ");
    if (outputResult.outcome === "success") {
      setBanner(null);
      setToast({
        tone: "success",
        message: "外来印刷を完了",
        detail
      });
      return;
    }
    const isBlocked = outputResult.outcome === "blocked";
    const nextAction = "印刷/エクスポートを再度開く / Reception で再取得";
    setBanner({
      tone: isBlocked ? "warning" : "error",
      message: isBlocked ? "外来印刷が停止されました" : "外来印刷に失敗しました",
      nextAction
    });
    setToast({
      tone: isBlocked ? "warning" : "error",
      message: isBlocked ? "外来印刷を停止" : "外来印刷に失敗",
      detail
    });
  }, []);
  const sendPrecheckReasons = useMemo(
    () => {
      const reasons = [];
      if (!sendEnabled) {
        reasons.push({
          key: "config_disabled",
          summary: "管理配信: 送信停止で送信不可",
          detail: sendDisabledReason ?? "管理配信により ORCA 送信が無効化されています。",
          next: ["Administration で再配信", "設定を再取得して反映を確認"]
        });
      }
      if (uiLocked) {
        reasons.push({
          key: "locked",
          summary: "他の操作: 実行中で送信不可",
          detail: resolvedLockReason ? resolvedLockReason : "別アクション実行中のため送信できません。",
          next: ["ロック解除", "処理完了を待って再試行"]
        });
      }
      if (readOnly) {
        reasons.push({
          key: "locked",
          summary: "並行編集: 閲覧専用で送信不可",
          detail: readOnlyReason,
          next: ["最新を再読込", "別タブを閉じる", "必要ならロック引き継ぎ（強制）"]
        });
      }
      if (approvalLocked) {
        reasons.push({
          key: "approval_locked",
          summary: "承認済み: 編集不可で送信不可",
          detail: approvalReason ?? "署名確定済みのため編集できません。",
          next: ["必要なら新規受付で再作成", "承認内容の確認（監査ログ）"]
        });
      }
      if (requirePatientForSend && !patientId) {
        reasons.push({
          key: "patient_not_selected",
          summary: "患者未選択: 対象未確定で送信不可",
          detail: "患者が未選択のため送信先が確定できません。",
          next: ["Patients で患者を選択", "Reception へ戻って対象患者を確定"]
        });
      }
      if (requireServerRouteForSend && dataSourceTransition !== "server") {
        reasons.push({
          key: "not_server_route",
          summary: "ルート不一致: server以外で送信不可",
          detail: `dataSourceTransition=${dataSourceTransition} のため ORCA 送信を停止します。`,
          next: ["server route に切替（MSW OFF / 実 API）", "Reception で再取得"]
        });
      }
      if (missingMaster) {
        reasons.push({
          key: "missing_master",
          summary: "マスタ欠損: missingMaster=true で送信不可",
          detail: "マスタ欠損を検知したため、送信は実施できません。",
          next: [...MISSING_MASTER_RECOVERY_NEXT_STEPS]
        });
      }
      if (fallbackUsed) {
        reasons.push({
          key: "fallback_used",
          summary: "フォールバック: fallbackUsed=true で送信不可",
          detail: "フォールバック経路のため、送信は実施できません。",
          next: [...MISSING_MASTER_RECOVERY_NEXT_STEPS]
        });
      }
      if (hasUnsavedDraft) {
        reasons.push({
          key: "draft_unsaved",
          summary: "未保存ドラフト: 保存前で送信不可",
          detail: "未保存の入力があるため、送信前にドラフト保存が必要です。",
          next: ["ドラフト保存", "不要なら入力を戻してから再送"]
        });
      }
      if (!isOnline) {
        reasons.push({
          key: "network_offline",
          summary: "通信断: オフラインで送信不可",
          detail: "ブラウザが offline 状態のため送信できません。",
          next: ["通信回復を待つ", "回線/プロキシ設定を確認"]
        });
      }
      if (networkDegradedReason) {
        reasons.push({
          key: "network_degraded",
          summary: "通信不安定: 再取得が必要で送信不可",
          detail: networkDegradedReason,
          next: ["再取得してから再送", "Reception へ戻って状態確認"]
        });
      }
      if (permissionDenied || !hasPermission) {
        reasons.push({
          key: "permission_denied",
          summary: "認証不備: 権限不足で送信不可",
          detail: permissionDenied ? "直近の送信で 401/403 を検知しました。" : "認証情報が揃っていないため送信を停止します。",
          next: ["再ログイン", "設定確認（facilityId/userId/password）"]
        });
      }
      return reasons;
    },
    [
      dataSourceTransition,
      fallbackUsed,
      hasPermission,
      hasUnsavedDraft,
      isOnline,
      resolvedLockReason,
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
      uiLocked
    ]
  );
  const finishPrecheckReasons = useMemo(() => {
    const reasons = [];
    if (isRunning) {
      reasons.push({
        key: "locked",
        summary: "他の操作: 実行中で診療終了不可",
        detail: "別アクションの実行中は診療終了を開始できません。",
        next: ["処理完了を待つ"]
      });
    }
    if (uiLocked) {
      reasons.push({
        key: "locked",
        summary: "ロック中: 操作中で診療終了不可",
        detail: resolvedLockReason ? resolvedLockReason : "別アクション実行中のため診療終了できません。",
        next: ["ロック解除", "処理完了を待って再試行"]
      });
    }
    if (readOnly) {
      reasons.push({
        key: "locked",
        summary: "並行編集: 閲覧専用で診療終了不可",
        detail: readOnlyReason,
        next: ["最新を再読込", "別タブを閉じる", "必要ならロック引き継ぎ（強制）"]
      });
    }
    if (approvalLocked) {
      reasons.push({
        key: "approval_locked",
        summary: "承認済み: 編集不可で診療終了不可",
        detail: approvalReason ?? "署名確定済みのため編集できません。",
        next: ["必要なら新規受付で再作成", "承認内容の確認（監査ログ）"]
      });
    }
    return reasons;
  }, [approvalLocked, approvalReason, isRunning, readOnly, readOnlyReason, resolvedLockReason, uiLocked]);
  const sendDisabled = isRunning || approvalLocked || sendPrecheckReasons.length > 0;
  const printPrecheckReasons = useMemo(
    () => {
      const reasons = [];
      if (isRunning) {
        reasons.push({
          key: "locked",
          summary: "他の操作: 実行中で印刷不可",
          detail: "別アクションの実行中は印刷を開始できません。",
          next: ["処理完了を待って再試行"]
        });
      }
      if (uiLocked) {
        reasons.push({
          key: "locked",
          summary: "ロック中: 操作中で印刷不可",
          detail: resolvedLockReason ? resolvedLockReason : "別アクション実行中のため印刷できません。",
          next: ["ロック解除", "処理完了を待って再試行"]
        });
      }
      if (readOnly) {
        reasons.push({
          key: "locked",
          summary: "並行編集: 閲覧専用で印刷不可",
          detail: readOnlyReason,
          next: ["最新を再読込", "別タブを閉じる", "必要ならロック引き継ぎ（強制）"]
        });
      }
      if (approvalLocked) {
        reasons.push({
          key: "approval_locked",
          summary: "承認済み: 編集不可で印刷不可",
          detail: approvalReason ?? "署名確定済みのため編集できません。",
          next: ["必要なら新規受付で再作成", "承認内容の確認（監査ログ）"]
        });
      }
      if (!selectedEntry) {
        reasons.push({
          key: "patient_not_selected",
          summary: "患者未選択: 対象未確定で印刷不可",
          detail: "患者が未選択のため印刷プレビューを開けません。",
          next: ["Patients で患者を選択", "Reception へ戻って対象患者を確定"]
        });
      }
      if (missingMaster) {
        reasons.push({
          key: "missing_master",
          summary: "マスタ欠損: missingMaster=true で印刷不可",
          detail: "マスタ欠損を検知したため出力を停止します。",
          next: [...MISSING_MASTER_RECOVERY_NEXT_STEPS]
        });
      }
      if (fallbackUsed) {
        reasons.push({
          key: "fallback_used",
          summary: "フォールバック: fallbackUsed=true で印刷不可",
          detail: "フォールバック経路のため出力を停止します。",
          next: [...MISSING_MASTER_RECOVERY_NEXT_STEPS]
        });
      }
      if (permissionDenied || !hasPermission) {
        reasons.push({
          key: "permission_denied",
          summary: "認証不備: 権限不足で印刷不可",
          detail: permissionDenied ? "直近の送信で 401/403 を検知しました。" : "認証情報が揃っていないため出力を停止します。",
          next: ["再ログイン", "設定確認（facilityId/userId/password）"]
        });
      }
      return reasons;
    },
    [
      approvalLocked,
      approvalReason,
      fallbackUsed,
      hasPermission,
      isRunning,
      resolvedLockReason,
      missingMaster,
      permissionDenied,
      readOnly,
      readOnlyReason,
      selectedEntry,
      uiLocked
    ]
  );
  const printDisabled = printPrecheckReasons.length > 0;
  const otherBlocked = isLocked;
  const guardSummaries = useMemo(() => {
    const entries = [];
    if (finishPrecheckReasons.length > 0) {
      const summary = summarizeGuardReasons(finishPrecheckReasons);
      if (summary) {
        entries.push({
          key: "finish",
          action: ACTION_LABEL.finish,
          summary: summary.summary,
          nextAction: summary.nextActions?.join(" / ")
        });
      }
    }
    if (sendPrecheckReasons.length > 0) {
      const summary = summarizeGuardReasons(sendPrecheckReasons);
      if (summary) {
        entries.push({
          key: "send",
          action: ACTION_LABEL.send,
          summary: summary.summary,
          nextAction: summary.nextActions?.join(" / ")
        });
      }
    }
    if (printPrecheckReasons.length > 0) {
      const summary = summarizeGuardReasons(printPrecheckReasons);
      if (summary) {
        entries.push({
          key: "print",
          action: ACTION_LABEL.print,
          summary: summary.summary,
          nextAction: summary.nextActions?.join(" / ")
        });
      }
    }
    return entries;
  }, [finishPrecheckReasons, printPrecheckReasons, sendPrecheckReasons]);
  useEffect(() => {
    onLockChange?.(actionLocked, resolvedLockReason ?? void 0);
  }, [actionLocked, onLockChange, resolvedLockReason]);
  const statusLine = useMemo(
    () => {
      if (isRunning && runningAction) {
        return `${ACTION_LABEL[runningAction]}を実行中… dataSourceTransition=${dataSourceTransition}`;
      }
      if (approvalLocked) {
        return `承認済み（署名確定）: 編集不可（runId=${approvalLock?.runId ?? runId}）`;
      }
      if (resolvedLockReason) return resolvedLockReason;
      if (readOnly) return readOnlyReason;
      if (sendPrecheckReasons.length > 0) {
        const summary = summarizeGuardReasons(sendPrecheckReasons);
        return `送信ガード: ${summary?.summary ?? sendPrecheckReasons[0].summary}`;
      }
      if (printPrecheckReasons.length > 0) {
        const summary = summarizeGuardReasons(printPrecheckReasons);
        return `印刷ガード: ${summary?.summary ?? printPrecheckReasons[0].summary}`;
      }
      if (finishPrecheckReasons.length > 0) {
        const summary = summarizeGuardReasons(finishPrecheckReasons);
        return `診療終了ガード: ${summary?.summary ?? finishPrecheckReasons[0].summary}`;
      }
      if (sendQueueLabel) {
        return `送信状態: ${sendQueueLabel}（runId=${runId} / traceId=${resolvedTraceId ?? "unknown"}${queueEntry?.requestId ? ` / requestId=${queueEntry.requestId}` : ""}）`;
      }
      return "アクションを選択できます";
    },
    [
      dataSourceTransition,
      isRunning,
      resolvedLockReason,
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
      finishPrecheckReasons,
      printPrecheckReasons
    ]
  );
  const logTelemetry = (action, outcome, durationMs, note, reason, meta) => {
    recordOutpatientFunnel("charts_action", {
      action,
      outcome,
      durationMs,
      note,
      reason,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      runId: meta?.runId ?? runId,
      traceId: meta?.traceId ?? resolvedTraceId
    });
  };
  const buildFallbackDetails = () => {
    const details = {};
    if (!patientId && resolvedPatientId) details.fallbackPatientId = resolvedPatientId;
    if (!queueEntry?.appointmentId && resolvedAppointmentId) details.fallbackAppointmentId = resolvedAppointmentId;
    if ((!patientId || !queueEntry?.appointmentId) && resolvedReceptionId) details.fallbackReceptionId = resolvedReceptionId;
    if (editLock?.lockStatus) details.lockStatus = editLock.lockStatus;
    return details;
  };
  const buildOutpatientPayload = () => {
    const payload = {};
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
  const logAudit = (action, outcome, detail, durationMs, options) => {
    const actionMap = {
      finish: "ENCOUNTER_CLOSE",
      send: "ORCA_SEND",
      draft: "DRAFT_SAVE",
      cancel: "DRAFT_CANCEL",
      print: "PRINT_OUTPATIENT"
    };
    const normalizedAction = outcome === "error" ? "CHARTS_ACTION_FAILURE" : actionMap[action];
    const phase = options?.phase ?? (outcome === "blocked" ? "lock" : "do");
    const details = {
      operationPhase: phase,
      ...action === "send" || action === "finish" ? {
        ...resolvedVisitDate ? { visitDate: resolvedVisitDate } : {}
      } : {},
      ...buildFallbackDetails(),
      ...options?.details
    };
    recordChartsAuditEvent({
      action: normalizedAction,
      outcome,
      subject: `charts-action-${action}`,
      note: detail,
      error: outcome === "error" ? detail : void 0,
      durationMs,
      patientId: resolvedPatientId,
      appointmentId: resolvedAppointmentId,
      dataSourceTransition,
      cacheHit,
      missingMaster,
      fallbackUsed,
      runId,
      details
    });
    if (action === "send") {
      logAuditEvent({
        runId,
        cacheHit,
        missingMaster,
        fallbackUsed,
        dataSourceTransition,
        payload: {
          action: "orca_claim_send",
          outcome,
          subject: `charts-action-${action}`,
          details
        }
      });
    }
  };
  const approvalSessionRef = useRef(null);
  const logApproval = (action, state) => {
    const blockedReasons = state === "cancelled" ? ["confirm_cancelled"] : void 0;
    logUiState({
      action: action === "print" ? "print" : "send",
      screen: "charts/action-bar",
      controlId: `action-${action}-approval`,
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        operationPhase: "approval",
        approvalState: state,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        requestId: queueEntry?.requestId,
        traceId: resolvedTraceId,
        ...blockedReasons ? { blockedReasons } : {},
        ...buildFallbackDetails()
      }
    });
    logAudit(action, state === "open" || state === "confirmed" ? "started" : "blocked", `approval_${state}`, void 0, {
      phase: "approval",
      details: {
        approvalState: state,
        requestId: queueEntry?.requestId,
        traceId: resolvedTraceId,
        ...blockedReasons ? { blockedReasons } : {},
        ...buildFallbackDetails()
      }
    });
  };
  const finalizeApproval = (action, state) => {
    const session2 = approvalSessionRef.current;
    if (!session2 || session2.action !== action || session2.closed) return;
    session2.closed = true;
    logApproval(action, state);
  };
  const handleAction = async (action) => {
    if (isRunning) return;
    if (approvalLocked) {
      const blockedReason = approvalReason ?? "署名確定済みのため編集できません。";
      setToast({
        tone: "warning",
        message: `${ACTION_LABEL[action]}を停止`,
        detail: blockedReason
      });
      setRetryAction(null);
      logTelemetry(action, "blocked", void 0, blockedReason, blockedReason);
      logUiState({
        action: action === "draft" ? "draft" : action === "finish" ? "finish" : action === "cancel" ? "cancel" : action === "print" ? "print" : "send",
        screen: "charts/action-bar",
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: "lock",
          blocked: true,
          reasons: ["approval_locked"],
          traceId: resolvedTraceId,
          approval: approvalLock ?? null
        }
      });
      logAudit(action, "blocked", blockedReason, void 0, {
        phase: "lock",
        details: {
          trigger: "approval_locked",
          blockedReasons: ["approval_locked"],
          approvalState: "confirmed"
        }
      });
      return;
    }
    if (readOnly) {
      const blockedReason = readOnlyReason;
      setToast({
        tone: "warning",
        message: `${ACTION_LABEL[action]}を停止`,
        detail: blockedReason
      });
      setRetryAction(null);
      logTelemetry(action, "blocked", void 0, blockedReason, blockedReason);
      logUiState({
        action: action === "draft" ? "draft" : action === "finish" ? "finish" : action === "cancel" ? "cancel" : action === "print" ? "print" : "send",
        screen: "charts/action-bar",
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: "lock",
          blocked: true,
          reasons: ["edit_lock_conflict"],
          traceId: resolvedTraceId,
          lockStatus: editLock?.lockStatus,
          editLock: editLock ?? null
        }
      });
      logAudit(action, "blocked", blockedReason, void 0, {
        phase: "lock",
        details: {
          trigger: "edit_lock",
          traceId: resolvedTraceId,
          blockedReasons: ["edit_lock_conflict"]
        }
      });
      return;
    }
    if (action === "send" && sendPrecheckReasons.length > 0) {
      const blockedReason = sendPrecheckReasons.map((reason) => `${reason.summary}: ${reason.detail}`).join(" / ");
      setBanner({
        tone: "warning",
        message: `ORCA送信を停止: ${blockedReason}`,
        nextAction: "送信前チェック（理由）を確認し、必要なら Reception で再取得してください。"
      });
      setRetryAction(null);
      setToast(null);
      logTelemetry(action, "blocked", void 0, blockedReason, blockedReason);
      logUiState({
        action: "send",
        screen: "charts/action-bar",
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: "lock",
          blocked: true,
          reasons: sendPrecheckReasons.map((reason) => reason.key),
          traceId: resolvedTraceId,
          lockStatus: editLock?.lockStatus
        }
      });
      logAudit(action, "blocked", blockedReason, void 0, {
        phase: "lock",
        details: {
          trigger: "precheck",
          traceId: resolvedTraceId,
          reasons: sendPrecheckReasons.map((reason) => reason.key),
          blockedReasons: sendPrecheckReasons.map((reason) => reason.key)
        }
      });
      return;
    }
    if (action === "send" && !patientId) {
      const blockedReason = "患者IDが未確定のため ORCA 送信を実行できません。Patients で患者を選択してください。";
      setBanner({ tone: "warning", message: `ORCA送信を停止: ${blockedReason}`, nextAction: "Patients で対象患者を選択してください。" });
      setRetryAction(null);
      setToast(null);
      logTelemetry(action, "blocked", void 0, blockedReason, blockedReason);
      logUiState({
        action: "send",
        screen: "charts/action-bar",
        controlId: `action-${action}`,
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: { operationPhase: "lock", blocked: true, reasons: ["patient_not_selected"], traceId: resolvedTraceId }
      });
      logAudit(action, "blocked", blockedReason, void 0, {
        phase: "lock",
        details: {
          trigger: "patient_not_selected",
          traceId: resolvedTraceId,
          blockedReasons: ["patient_not_selected"]
        }
      });
      return;
    }
    if (action === "send" && (fallbackUsed || missingMaster)) {
      setBanner({
        tone: "warning",
        message: missingMaster ? "missingMaster=true を検知しました。送信前に master を再取得してください。" : "fallbackUsed=true を検知しました。送信前に master 解消（server route）を確認してください。",
        nextAction: MISSING_MASTER_RECOVERY_NEXT_STEPS.join(" / ")
      });
    }
    const startedAt = performance.now();
    setIsRunning(true);
    setRunningAction(action);
    setRetryAction(null);
    setToast(null);
    logUiState({
      action: action === "draft" ? "draft" : action === "finish" ? "finish" : action === "cancel" ? "cancel" : action === "print" ? "print" : "send",
      screen: "charts/action-bar",
      controlId: `action-${action}`,
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        operationPhase: "do",
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        requestId: queueEntry?.requestId,
        traceId: resolvedTraceId,
        ...buildFallbackDetails()
      }
    });
    logTelemetry(action, "started");
    logAudit(action, "started", void 0, void 0, { phase: "do" });
    let timeoutId = null;
    try {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const timeoutMs = resolveActionTimeoutMs(action);
      timeoutId = timeoutMs > 0 ? setTimeout(() => abortControllerRef.current?.abort(), timeoutMs) : null;
      if (action === "send" || action === "finish") {
        if (action === "send") {
          const departmentCode = resolveDepartmentCode(selectedEntry?.department);
          const calculationDate = normalizeVisitDate(resolvedVisitDate);
          const missingFields = [
            !resolvedPatientId ? "Patient_ID" : void 0,
            !calculationDate ? "Perform_Date" : void 0,
            !departmentCode ? "Department_Code" : void 0
          ].filter((field) => Boolean(field));
          if (missingFields.length > 0) {
            const blockedReason = `medicalmodv2 を停止: ${missingFields.join(", ")} が不足しています。`;
            setBanner({
              tone: "warning",
              message: `ORCA送信を停止: ${blockedReason}`,
              nextAction: "Reception で患者/診療科/日付を確認してください。"
            });
            setIsRunning(false);
            setRunningAction(null);
            return;
          }
          if (!resolvedPatientId || !calculationDate || !departmentCode) {
            setIsRunning(false);
            setRunningAction(null);
            return;
          }
          const requestXml = buildMedicalModV2RequestXml({
            patientId: resolvedPatientId,
            performDate: calculationDate,
            departmentCode
          });
          const result = await postOrcaMedicalModV2Xml(requestXml, { classCode: "01", signal });
          const apiResultOk = isApiResultOk(result.apiResult);
          const hasMissingTags = Boolean(result.missingTags?.length);
          const outcome = result.ok && apiResultOk && !hasMissingTags ? "success" : result.ok ? "warning" : "error";
          const durationMs2 = Math.round(performance.now() - startedAt);
          const nextRunId2 = result.runId ?? getObservabilityMeta().runId ?? runId;
          const nextTraceId2 = result.traceId ?? getObservabilityMeta().traceId ?? resolvedTraceId;
          const detailParts = [
            `runId=${nextRunId2}`,
            `traceId=${nextTraceId2 ?? "unknown"}`,
            result.apiResult ? `Api_Result=${result.apiResult}` : void 0,
            result.invoiceNumber ? `Invoice_Number=${result.invoiceNumber}` : void 0,
            result.dataId ? `Data_Id=${result.dataId}` : void 0
          ].filter((part) => Boolean(part));
          let retryMeta;
          if (outcome === "success") {
            setBanner(null);
            setToast({
              tone: "success",
              message: "ORCA送信を完了",
              detail: detailParts.join(" / ")
            });
          } else {
            if (resolvedPatientId) {
              try {
                const retryResponse = await httpFetch(`/api/orca/queue?patientId=${resolvedPatientId}&retry=1`, {
                  method: "GET"
                });
                const retryJson = await retryResponse.json().catch(() => ({}));
                retryMeta = {
                  retryRequested: true,
                  retryApplied: Boolean(retryJson.retryApplied),
                  retryReason: typeof retryJson.retryReason === "string" ? retryJson.retryReason : void 0,
                  queueRunId: typeof retryJson.runId === "string" ? retryJson.runId : void 0,
                  queueTraceId: typeof retryJson.traceId === "string" ? retryJson.traceId : void 0
                };
              } catch {
                retryMeta = { retryRequested: true, retryApplied: false, retryReason: "retry_request_failed" };
              }
            }
            setBanner({
              tone: outcome === "error" ? "error" : "warning",
              message: `ORCA送信に警告/失敗: ${detailParts.join(" / ")}`,
              nextAction: "ORCA 応答を確認し再送してください。"
            });
            setToast({
              tone: outcome === "error" ? "error" : "warning",
              message: outcome === "error" ? "ORCA送信に失敗" : "ORCA送信に警告",
              detail: detailParts.join(" / ")
            });
          }
          logTelemetry(
            action,
            outcome === "success" ? "success" : "error",
            durationMs2,
            detailParts.join(" / "),
            result.apiResult,
            { runId: nextRunId2, traceId: nextTraceId2 ?? void 0 }
          );
          logAudit(action, outcome === "success" ? "success" : "error", detailParts.join(" / "), durationMs2, {
            phase: "do",
            details: {
              endpoint: "/api21/medicalmodv2",
              httpStatus: result.status,
              apiResult: result.apiResult,
              apiResultMessage: result.apiResultMessage,
              invoiceNumber: result.invoiceNumber,
              dataId: result.dataId,
              missingTags: result.missingTags,
              retryQueue: retryMeta
            }
          });
          if (resolvedPatientId) {
            saveOrcaClaimSendCache(
              {
                patientId: resolvedPatientId,
                appointmentId: resolvedAppointmentId,
                invoiceNumber: result.invoiceNumber,
                dataId: result.dataId,
                runId: nextRunId2,
                traceId: nextTraceId2 ?? void 0,
                apiResult: result.apiResult,
                sendStatus: outcome === "success" ? "success" : "error",
                errorMessage: outcome === "success" ? void 0 : detailParts.join(" / ")
              },
              storageScope
            );
          }
          const v23RequestXml = buildMedicalModV23RequestXml({
            patientId: resolvedPatientId ?? "",
            requestNumber: "01",
            firstCalculationDate: calculationDate,
            lastVisitDate: calculationDate,
            departmentCode
          });
          try {
            await postOrcaMedicalModV23Xml(v23RequestXml, { signal });
          } catch {
          }
          void Promise.resolve(onAfterSend?.()).catch((error) => {
            const detail = error instanceof Error ? error.message : String(error);
            logUiState({
              action: "send",
              screen: "charts/action-bar",
              controlId: "action-send",
              runId,
              cacheHit,
              missingMaster,
              dataSourceTransition,
              fallbackUsed,
              details: { operationPhase: "after_send", error: detail }
            });
          });
          return;
        } else {
          const endpoint = "/orca21/medicalmodv2/outpatient";
          const payload = buildOutpatientPayload();
          const response = await httpFetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal
          });
          const json = await response.json().catch(() => ({}));
          const responseRunId = typeof json.runId === "string" ? json.runId : void 0;
          const responseTraceId = typeof json.traceId === "string" ? json.traceId : void 0;
          const responseRequestId = typeof json.requestId === "string" ? json.requestId : void 0;
          const responseOutcome = typeof json.outcome === "string" ? json.outcome : void 0;
          const responseApiResult = typeof json.apiResult === "string" ? json.apiResult : void 0;
          const responseApiResultMessage = typeof json.apiResultMessage === "string" ? json.apiResultMessage : void 0;
          if (response.status === 401 || response.status === 403) {
            setPermissionDenied(true);
            const authError = new Error(`権限不足（HTTP ${response.status}）。再ログインまたは権限設定を確認してください。`);
            authError.apiDetails = {
              endpoint,
              httpStatus: response.status,
              runId: responseRunId,
              traceId: responseTraceId,
              requestId: responseRequestId,
              outcome: responseOutcome,
              apiResult: responseApiResult,
              apiResultMessage: responseApiResultMessage
            };
            throw authError;
          }
          if (!response.ok) {
            const detailParts = [
              `HTTP ${response.status}`,
              responseApiResult ? `apiResult=${responseApiResult}` : void 0,
              responseApiResultMessage ? `message=${responseApiResultMessage}` : void 0,
              responseOutcome ? `outcome=${responseOutcome}` : void 0
            ].filter((part) => typeof part === "string" && part.length > 0);
            const apiError = new Error(`${ACTION_LABEL[action]} API に失敗（${detailParts.join(" / ")}）`);
            apiError.apiDetails = {
              endpoint,
              httpStatus: response.status,
              runId: responseRunId,
              traceId: responseTraceId,
              requestId: responseRequestId,
              outcome: responseOutcome,
              apiResult: responseApiResult,
              apiResultMessage: responseApiResultMessage
            };
            throw apiError;
          }
          const after2 = getObservabilityMeta();
          const nextRunId2 = responseRunId ?? after2.runId ?? runId;
          const nextTraceId2 = responseTraceId ?? after2.traceId ?? resolvedTraceId;
          const responseDetailParts = [
            `runId=${nextRunId2}`,
            `traceId=${nextTraceId2 ?? "unknown"}`,
            responseRequestId ? `requestId=${responseRequestId}` : void 0,
            responseOutcome ? `outcome=${responseOutcome}` : void 0,
            responseApiResult ? `apiResult=${responseApiResult}` : void 0
          ].filter((part) => typeof part === "string" && part.length > 0);
          setBanner(null);
          setToast({
            tone: "success",
            message: `${ACTION_LABEL[action]}を完了`,
            detail: responseDetailParts.join(" / ")
          });
          const durationMs2 = Math.round(performance.now() - startedAt);
          logTelemetry(action, "success", durationMs2);
          logAudit(action, "success", void 0, durationMs2, {
            phase: "do",
            details: {
              endpoint,
              httpStatus: response.status,
              requestId: responseRequestId,
              outcome: responseOutcome,
              apiResult: responseApiResult,
              apiResultMessage: responseApiResultMessage
            }
          });
          const departmentCode = resolveDepartmentCode(selectedEntry?.department);
          const calculationDate = normalizeVisitDate(resolvedVisitDate);
          const missingFields = [
            !resolvedPatientId ? "Patient_ID" : void 0,
            !calculationDate ? "First_Calculation_Date" : void 0,
            !calculationDate ? "LastVisit_Date" : void 0,
            !departmentCode ? "Department_Code" : void 0
          ].filter((field) => typeof field === "string");
          if (missingFields.length > 0) {
            const blockedReason = `medicalmodv23 をスキップ: ${missingFields.join(", ")} が不足しています。`;
            setBanner({
              tone: "warning",
              message: `診療終了後の追加更新を停止: ${blockedReason}`,
              nextAction: "受付情報（患者/診療科/日付）を確認してください。"
            });
            logUiState({
              action: "medicalmodv23",
              screen: "charts/action-bar",
              controlId: "action-finish",
              runId,
              cacheHit,
              missingMaster,
              dataSourceTransition,
              fallbackUsed,
              details: {
                operationPhase: "lock",
                blocked: true,
                missingFields,
                patientId: resolvedPatientId,
                appointmentId: resolvedAppointmentId,
                traceId: resolvedTraceId
              }
            });
            recordChartsAuditEvent({
              action: "ORCA_MEDICAL_MOD_V23",
              outcome: "blocked",
              subject: "medicalmodv23",
              note: blockedReason,
              patientId: resolvedPatientId,
              appointmentId: resolvedAppointmentId,
              runId,
              cacheHit,
              missingMaster,
              fallbackUsed,
              dataSourceTransition,
              details: {
                operationPhase: "lock",
                trigger: "missing_fields",
                missingFields,
                endpoint: "/api21/medicalmodv23"
              }
            });
          } else {
            const requestXml = buildMedicalModV23RequestXml({
              patientId: resolvedPatientId ?? "",
              requestNumber: "01",
              firstCalculationDate: calculationDate,
              lastVisitDate: calculationDate,
              departmentCode
            });
            try {
              const result = await postOrcaMedicalModV23Xml(requestXml, { signal });
              const apiResultOk = isApiResultOk(result.apiResult);
              const hasMissingTags = Boolean(result.missingTags?.length);
              const outcome = result.ok && apiResultOk && !hasMissingTags ? "success" : result.ok ? "warning" : "error";
              const bannerDetail = [
                `Api_Result=${result.apiResult ?? "—"}`,
                result.apiResultMessage ? `Message=${result.apiResultMessage}` : void 0,
                hasMissingTags ? `missingTags=${result.missingTags?.join(", ")}` : void 0
              ].filter((part) => typeof part === "string" && part.length > 0);
              if (outcome !== "success") {
                setBanner({
                  tone: outcome === "error" ? "error" : "warning",
                  message: `診療終了後の追加更新(${outcome}) / ${bannerDetail.join(" / ")}`,
                  nextAction: "ORCA 応答を確認し、必要なら再送してください。"
                });
              }
              logUiState({
                action: "medicalmodv23",
                screen: "charts/action-bar",
                controlId: "action-finish",
                runId: result.runId ?? runId,
                cacheHit,
                missingMaster,
                dataSourceTransition,
                fallbackUsed,
                details: {
                  operationPhase: "do",
                  patientId: resolvedPatientId,
                  appointmentId: resolvedAppointmentId,
                  traceId: result.traceId ?? resolvedTraceId,
                  endpoint: "/api21/medicalmodv23",
                  httpStatus: result.status,
                  apiResult: result.apiResult,
                  apiResultMessage: result.apiResultMessage,
                  missingTags: result.missingTags
                }
              });
              recordChartsAuditEvent({
                action: "ORCA_MEDICAL_MOD_V23",
                outcome,
                subject: "medicalmodv23",
                patientId: resolvedPatientId,
                appointmentId: resolvedAppointmentId,
                runId: result.runId ?? runId,
                cacheHit,
                missingMaster,
                fallbackUsed,
                dataSourceTransition,
                details: {
                  operationPhase: "do",
                  endpoint: "/api21/medicalmodv23",
                  httpStatus: result.status,
                  apiResult: result.apiResult,
                  apiResultMessage: result.apiResultMessage,
                  missingTags: result.missingTags
                }
              });
            } catch (error) {
              const detail = error instanceof Error ? error.message : String(error);
              setBanner({
                tone: "error",
                message: `診療終了後の追加更新に失敗: ${detail}`,
                nextAction: "ORCA 接続と診療科情報を確認してください。"
              });
              logUiState({
                action: "medicalmodv23",
                screen: "charts/action-bar",
                controlId: "action-finish",
                runId,
                cacheHit,
                missingMaster,
                dataSourceTransition,
                fallbackUsed,
                details: {
                  operationPhase: "do",
                  patientId: resolvedPatientId,
                  appointmentId: resolvedAppointmentId,
                  traceId: resolvedTraceId,
                  endpoint: "/api21/medicalmodv23",
                  error: detail
                }
              });
              recordChartsAuditEvent({
                action: "ORCA_MEDICAL_MOD_V23",
                outcome: "error",
                subject: "medicalmodv23",
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
                  operationPhase: "do",
                  endpoint: "/api21/medicalmodv23",
                  error: detail
                }
              });
            }
          }
        }
        void Promise.resolve(onAfterFinish?.()).catch((error) => {
          const detail = error instanceof Error ? error.message : String(error);
          logUiState({
            action: "finish",
            screen: "charts/action-bar",
            controlId: "action-finish",
            runId,
            cacheHit,
            missingMaster,
            dataSourceTransition,
            fallbackUsed,
            details: { operationPhase: "after_finish", error: detail }
          });
        });
        return;
      } else if (action === "draft") {
        onDraftSaved?.();
      } else {
      }
      const durationMs = Math.round(performance.now() - startedAt);
      const after = getObservabilityMeta();
      const nextRunId = after.runId ?? runId;
      const nextTraceId = after.traceId ?? resolvedTraceId;
      setBanner(null);
      setToast({
        tone: "success",
        message: `${ACTION_LABEL[action]}を完了`,
        detail: `runId=${nextRunId} / traceId=${nextTraceId ?? "unknown"} / requestId=${queueEntry?.requestId ?? "unknown"} / transition=${dataSourceTransition}`
      });
      logTelemetry(action, "success", durationMs);
      logAudit(action, "success", void 0, durationMs, { phase: "do" });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const isAbort = error instanceof DOMException ? error.name === "AbortError" : error instanceof Error ? error.name === "AbortError" : false;
      const apiDetails = error && typeof error === "object" && "apiDetails" in error ? error.apiDetails ?? void 0 : void 0;
      const durationMs = Math.round(performance.now() - startedAt);
      const after = getObservabilityMeta();
      const errorRunId = (typeof apiDetails?.runId === "string" ? apiDetails?.runId : void 0) ?? after.runId ?? runId;
      const errorTraceId = (typeof apiDetails?.traceId === "string" ? apiDetails?.traceId : void 0) ?? after.traceId ?? resolvedTraceId;
      const errorRequestId = (typeof apiDetails?.requestId === "string" ? apiDetails?.requestId : void 0) ?? queueEntry?.requestId;
      const errorEndpoint = typeof apiDetails?.endpoint === "string" ? apiDetails?.endpoint : void 0;
      const errorHttpStatus = typeof apiDetails?.httpStatus === "number" ? apiDetails?.httpStatus : void 0;
      const errorOutcome = typeof apiDetails?.outcome === "string" ? apiDetails?.outcome : void 0;
      const errorApiResult = typeof apiDetails?.apiResult === "string" ? apiDetails?.apiResult : void 0;
      const errorApiResultMessage = typeof apiDetails?.apiResultMessage === "string" ? apiDetails?.apiResultMessage : void 0;
      if (isAbort) {
        const abortedDetail = "ユーザー操作により送信を中断しました。通信回復後に再試行できます。";
        setRetryAction("send");
        setBanner({ tone: "warning", message: `ORCA送信を中断: ${abortedDetail}`, nextAction: "通信回復後にリトライできます。" });
        if (action === "send") {
          setToast({ tone: "warning", message: "ORCA送信を中断", detail: abortedDetail });
        } else {
          setToast({ tone: "warning", message: `${ACTION_LABEL[action]}を中断`, detail: abortedDetail });
        }
        logTelemetry(action, "blocked", durationMs, abortedDetail, abortedDetail);
        logAudit(action, "blocked", abortedDetail, durationMs, {
          phase: "lock",
          details: {
            trigger: "abort",
            traceId: errorTraceId,
            endpoint: errorEndpoint,
            httpStatus: errorHttpStatus
          }
        });
      } else {
        const nextSteps = (() => {
          if (/HTTP 401|HTTP 403|権限不足/.test(detail)) {
            return "次にやること: 再ログイン / 設定確認（facilityId/userId/password）";
          }
          if (isNetworkError(error) || isNetworkError(detail)) {
            return "次にやること: 通信回復を待つ / Reception で再取得 / リトライ";
          }
          return "次にやること: Reception へ戻る / 請求を再取得 / 設定確認";
        })();
        let retryDetail;
        let retryMeta = {};
        if (action === "send" && resolvedPatientId) {
          try {
            const retryResponse = await httpFetch(`/api/orca/queue?patientId=${resolvedPatientId}&retry=1`, {
              method: "GET"
            });
            const retryJson = await retryResponse.json().catch(() => ({}));
            const retryApplied = Boolean(retryJson.retryApplied);
            const retryReason = typeof retryJson.retryReason === "string" ? retryJson.retryReason : void 0;
            const queueRunId = typeof retryJson.runId === "string" ? retryJson.runId : void 0;
            const queueTraceId = typeof retryJson.traceId === "string" ? retryJson.traceId : void 0;
            retryMeta = {
              retryRequested: true,
              retryApplied,
              retryReason,
              queueRunId,
              queueTraceId
            };
            retryDetail = `retryQueue=${retryApplied ? "applied" : "requested"}${retryReason ? `(${retryReason})` : ""}`;
          } catch (retryError) {
            retryMeta = { retryRequested: true, retryApplied: false, retryReason: "retry_request_failed" };
            retryDetail = "retryQueue=error";
          }
        }
        const extraTags = [
          `runId=${errorRunId}`,
          `traceId=${errorTraceId ?? "unknown"}`,
          errorRequestId ? `requestId=${errorRequestId}` : void 0,
          errorEndpoint ? `endpoint=${errorEndpoint}` : void 0,
          typeof errorHttpStatus === "number" ? `HTTP ${errorHttpStatus}` : void 0,
          errorApiResult ? `apiResult=${errorApiResult}` : void 0,
          errorApiResultMessage ? `message=${errorApiResultMessage}` : void 0,
          errorOutcome ? `outcome=${errorOutcome}` : void 0,
          retryDetail
        ].filter((part) => typeof part === "string");
        const composedDetail = `${detail}（${extraTags.join(" / ")}）${nextSteps ? ` / ${nextSteps}` : ""}`;
        if (action === "send" && resolvedPatientId) {
          saveOrcaClaimSendCache(
            {
              patientId: resolvedPatientId,
              appointmentId: resolvedAppointmentId,
              runId: errorRunId,
              traceId: errorTraceId ?? void 0,
              apiResult: errorApiResult,
              sendStatus: "error",
              errorMessage: detail
            },
            storageScope
          );
        }
        setRetryAction(action);
        setBanner({ tone: "error", message: `${ACTION_LABEL[action]}に失敗: ${composedDetail}`, nextAction: nextSteps });
        setToast({
          tone: "error",
          message: action === "send" ? "ORCA送信に失敗" : `${ACTION_LABEL[action]}に失敗`,
          detail: composedDetail
        });
        logTelemetry(action, "error", durationMs, composedDetail, composedDetail, { runId: errorRunId, traceId: errorTraceId });
        logAudit(action, "error", composedDetail, durationMs, {
          phase: "do",
          details: {
            traceId: errorTraceId,
            endpoint: errorEndpoint,
            httpStatus: errorHttpStatus,
            requestId: errorRequestId,
            apiResult: errorApiResult,
            apiResultMessage: errorApiResultMessage,
            outcome: errorOutcome,
            retryQueue: retryMeta
          }
        });
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsRunning(false);
      setRunningAction(null);
    }
  };
  const handlePrintExport = () => {
    if (printPrecheckReasons.length > 0) {
      const head = printPrecheckReasons[0];
      const blockedReasons = printPrecheckReasons.map((reason) => reason.key);
      const nextAction = head.next.join(" / ");
      setBanner({ tone: "warning", message: `印刷/エクスポートを停止: ${head.summary}`, nextAction });
      setToast(null);
      logUiState({
        action: "print",
        screen: "charts/action-bar",
        controlId: "action-print",
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: "lock",
          blocked: true,
          blockedReasons,
          ...buildFallbackDetails()
        }
      });
      logAudit("print", "blocked", head.detail, void 0, {
        phase: "lock",
        details: {
          trigger: blockedReasons[0],
          blockedReasons
        }
      });
      return;
    }
    if (!selectedEntry) {
      const message = "患者未選択のため印刷/エクスポートを停止しました";
      setBanner({ tone: "warning", message, nextAction: "患者を選択" });
      setToast({ tone: "warning", message: "患者未選択", detail: message });
      logUiState({
        action: "print",
        screen: "charts/action-bar",
        controlId: "action-print",
        runId,
        cacheHit,
        missingMaster,
        dataSourceTransition,
        fallbackUsed,
        details: {
          operationPhase: "lock",
          blocked: true,
          blockedReasons: ["no-selection"],
          ...buildFallbackDetails()
        }
      });
      logAudit("print", "blocked", message, void 0, {
        phase: "lock",
        details: { trigger: "no-selection", blockedReasons: ["no-selection"] }
      });
      return;
    }
    const { actor, facilityId } = resolveAuditActor();
    const detail = `印刷プレビューを開きました (actor=${actor})`;
    setBanner(null);
    setToast({ tone: "success", message: "印刷/エクスポートを開きました", detail });
    recordChartsAuditEvent({
      action: "PRINT_OUTPATIENT",
      outcome: "started",
      subject: "outpatient-document-preview",
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
        operationPhase: "do",
        endpoint: "/charts/print/outpatient",
        httpStatus: 200
      }
    });
    const printPath = buildFacilityPath(session?.facilityId, "/charts/print/outpatient");
    logUiState({
      action: "print",
      screen: "charts/action-bar",
      controlId: "action-print",
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        operationPhase: "do",
        destination: printPath,
        patientId: selectedEntry.patientId ?? selectedEntry.id,
        appointmentId: selectedEntry.appointmentId
      }
    });
    navigate(printPath, {
      state: {
        entry: selectedEntry,
        meta: { runId, cacheHit, missingMaster, fallbackUsed, dataSourceTransition },
        actor,
        facilityId
      }
    });
    saveOutpatientPrintPreview(
      {
        entry: selectedEntry,
        meta: { runId, cacheHit, missingMaster, fallbackUsed, dataSourceTransition },
        actor,
        facilityId
      },
      { facilityId: session?.facilityId, userId: session?.userId }
    );
  };
  const openPrintDialog = () => {
    setPrintDialogOpen(true);
    approvalSessionRef.current = { action: "print", closed: false };
    logApproval("print", "open");
  };
  const handleReportPrint = async () => {
    if (printPrecheckReasons.length > 0) {
      const head = printPrecheckReasons[0];
      const blockedReasons = printPrecheckReasons.map((reason) => reason.key);
      const nextAction = head.next.join(" / ");
      setBanner({ tone: "warning", message: `帳票出力を停止: ${head.summary}`, nextAction });
      setToast(null);
      recordChartsAuditEvent({
        action: "ORCA_REPORT_PRINT",
        outcome: "blocked",
        subject: "orca-report-preview",
        note: head.detail,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        runId,
        cacheHit,
        missingMaster,
        fallbackUsed,
        dataSourceTransition,
        details: {
          operationPhase: "lock",
          blockedReasons,
          reportType: resolvedReportType
        }
      });
      return;
    }
    if (!resolvedPatientId) {
      const message = "患者IDが未確定のため帳票出力を開始できません。";
      setBanner({ tone: "warning", message, nextAction: "Patients で患者を選択してください。" });
      setToast({ tone: "warning", message: "患者未選択", detail: message });
      recordChartsAuditEvent({
        action: "ORCA_REPORT_PRINT",
        outcome: "blocked",
        subject: "orca-report-preview",
        note: message,
        runId,
        cacheHit,
        missingMaster,
        fallbackUsed,
        dataSourceTransition,
        details: {
          operationPhase: "lock",
          blockedReasons: ["patient_not_selected"],
          reportType: resolvedReportType
        }
      });
      return;
    }
    if (!reportReady) {
      const message = reportFieldErrors.join(" / ") || "帳票出力条件が不足しています。";
      setBanner({ tone: "warning", message: `帳票出力を停止: ${message}`, nextAction: "入力内容を確認してください。" });
      setToast({ tone: "warning", message: "帳票出力を停止", detail: message });
      recordChartsAuditEvent({
        action: "ORCA_REPORT_PRINT",
        outcome: "blocked",
        subject: "orca-report-preview",
        note: message,
        patientId: resolvedPatientId,
        appointmentId: resolvedAppointmentId,
        runId,
        cacheHit,
        missingMaster,
        fallbackUsed,
        dataSourceTransition,
        details: {
          operationPhase: "lock",
          blockedReasons: reportFieldErrors,
          reportType: resolvedReportType,
          invoiceNumber: reportForm.invoiceNumber || void 0,
          departmentCode: reportForm.departmentCode || void 0,
          insuranceCombinationNumber: reportForm.insuranceCombinationNumber || void 0,
          performMonth: reportForm.performMonth || void 0
        }
      });
      return;
    }
    setIsRunning(true);
    setRunningAction("print");
    setRetryAction(null);
    setToast(null);
    setBanner(null);
    try {
      const result = await requestReportPreview();
      if (!result.ok) {
        throw new Error(result.error);
      }
      const previewState = result.previewState;
      const printPath = buildFacilityPath(session?.facilityId, "/charts/print/document");
      navigate(printPath, { state: previewState });
      saveReportPrintPreview(previewState, { facilityId: session?.facilityId, userId: session?.userId });
      setToast({
        tone: "success",
        message: "帳票プレビューを開きました",
        detail: `Data_Id=${result.responseMeta.dataId} / runId=${result.responseMeta.runId ?? runId} / traceId=${result.responseMeta.traceId ?? "unknown"}`
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const nextAction = resolvedReportType === "prescription" ? "代替: 診療記録（外来サマリ）をローカル印刷で出力してください。" : "ORCA 応答を確認し、再試行してください。";
      setBanner({ tone: "error", message: `帳票出力に失敗: ${detail}`, nextAction });
      setToast({ tone: "error", message: "帳票出力に失敗", detail });
    } finally {
      setIsRunning(false);
      setRunningAction(null);
    }
  };
  const handleUnlock = () => {
    setLockReason(null);
    setBanner({ tone: "info", message: "UIロックを解除しました。次のアクションを実行できます。" });
    setToast(null);
    logUiState({
      action: "lock",
      screen: "charts/action-bar",
      controlId: "unlock",
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: { operationPhase: "lock", unlocked: true }
    });
    recordChartsAuditEvent({
      action: "CHARTS_EDIT_LOCK",
      outcome: "released",
      subject: "charts-ui-lock",
      patientId: resolvedPatientId,
      appointmentId: resolvedAppointmentId,
      runId,
      cacheHit,
      missingMaster,
      fallbackUsed,
      dataSourceTransition,
      details: {
        operationPhase: "lock",
        trigger: "ui_unlock",
        lockStatus: "ui"
      }
    });
  };
  const handleAbort = () => {
    if (!isRunning) return;
    if (runningAction !== "send") return;
    abortControllerRef.current?.abort();
  };
  const handleApprovalUnlock = () => {
    if (!approvalLocked || !onApprovalUnlock) return;
    const first = typeof window !== "undefined" ? window.confirm("承認ロック（署名確定）を解除しますか？この操作は危険です。") : false;
    if (!first) return;
    const second = typeof window !== "undefined" ? window.confirm("最終確認: 承認ロック解除（署名取消）を実行します。よろしいですか？") : false;
    if (!second) return;
    onApprovalUnlock();
    setBanner({
      tone: "warning",
      message: "承認ロックを解除しました。署名確定が取り消され、編集が再開できます。",
      nextAction: "編集前に内容確認と再署名が必要か確認してください。"
    });
    setToast(null);
  };
  const handleReloadLatest = async () => {
    setToast({
      tone: "info",
      message: "最新を再読込",
      detail: "最新データを再取得します（取得完了後に編集可否が更新されます）。"
    });
    recordChartsAuditEvent({
      action: "CHARTS_CONFLICT",
      outcome: "resolved",
      subject: "charts-tab-lock",
      patientId: resolvedPatientId,
      appointmentId: resolvedAppointmentId,
      runId,
      cacheHit,
      missingMaster,
      fallbackUsed,
      dataSourceTransition,
      details: {
        operationPhase: "lock",
        trigger: "tab",
        resolution: "reload",
        lockStatus: editLock?.lockStatus
      }
    });
    logUiState({
      action: "lock",
      screen: "charts/action-bar",
      controlId: "reload-latest",
      runId,
      cacheHit,
      missingMaster,
      dataSourceTransition,
      fallbackUsed,
      details: {
        operationPhase: "lock",
        trigger: "tab",
        resolution: "reload",
        lockStatus: editLock?.lockStatus
      }
    });
    await onReloadLatest?.();
  };
  const handleDiscard = () => {
    onDiscardChanges?.();
    setToast({
      tone: "info",
      message: "変更を破棄しました",
      detail: "ローカルの未保存状態を破棄し、閲覧専用状態の解除を待てます。"
    });
  };
  const handleForceTakeover = () => {
    const confirmed = typeof window !== "undefined" ? window.confirm("別タブが保持している編集ロックを引き継ぎますか？（上書きの可能性があります）") : false;
    if (!confirmed) return;
    const second = typeof window !== "undefined" ? window.confirm("最終確認: 編集ロックの引き継ぎを実行します。よろしいですか？") : false;
    if (!second) return;
    onForceTakeover?.();
  };
  return /* @__PURE__ */ jsxDEV(
    "section",
    {
      className: `charts-actions${isLocked ? " charts-actions--locked" : ""}`,
      id: "charts-actionbar",
      tabIndex: -1,
      "data-focus-anchor": "true",
      "aria-live": "off",
      "data-run-id": runId,
      "data-test-id": "charts-actionbar",
      children: [
        /* @__PURE__ */ jsxDEV("header", { className: "charts-actions__header", children: [
          /* @__PURE__ */ jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDEV("p", { className: "charts-actions__kicker", children: "アクションバー / ORCA 送信とドラフト制御" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2028,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV("h2", { children: "診療終了・送信・ドラフト・キャンセル" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2029,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV("p", { className: "charts-actions__status", role: "status", children: statusLine }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2030,
              columnNumber: 11
            }, this)
          ] }, void 0, true, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2027,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__meta", children: [
            /* @__PURE__ */ jsxDEV(StatusPill, { className: "charts-actions__pill", label: "runId", value: runId ?? "—", tone: "info" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2035,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV(StatusPill, { className: "charts-actions__pill", label: "traceId", value: resolvedTraceId ?? "unknown", tone: "info" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2036,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV(StatusPill, { className: "charts-actions__pill", label: "transition", value: dataSourceTransition, tone: "info" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2037,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV(
              StatusPill,
              {
                className: "charts-actions__pill",
                label: "missingMaster",
                value: String(missingMaster),
                tone: missingMaster ? "warning" : "success"
              },
              void 0,
              false,
              {
                fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                lineNumber: 2038,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              StatusPill,
              {
                className: "charts-actions__pill",
                label: "fallbackUsed",
                value: String(fallbackUsed),
                tone: fallbackUsed ? "warning" : "success"
              },
              void 0,
              false,
              {
                fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                lineNumber: 2044,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              StatusPill,
              {
                className: "charts-actions__pill",
                label: "draftDirty",
                value: String(hasUnsavedDraft),
                tone: hasUnsavedDraft ? "warning" : "success"
              },
              void 0,
              false,
              {
                fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                lineNumber: 2050,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(
              StatusPill,
              {
                className: "charts-actions__pill",
                label: "患者",
                value: `${selectedEntry?.name ?? "未選択"}（${selectedEntry?.patientId ?? selectedEntry?.appointmentId ?? "ID不明"}）`
              },
              void 0,
              false,
              {
                fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                lineNumber: 2056,
                columnNumber: 11
              },
              this
            ),
            /* @__PURE__ */ jsxDEV(StatusPill, { className: "charts-actions__pill", label: "受付ID", value: selectedEntry?.receptionId ?? "—" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2061,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV(StatusPill, { className: "charts-actions__pill", label: "診療日", value: resolvedVisitDate ?? "—" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2062,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV(
              StatusPill,
              {
                className: "charts-actions__pill",
                label: "現在",
                value: `${selectedEntry?.status ?? "—"}（受付→診療→会計）`
              },
              void 0,
              false,
              {
                fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                lineNumber: 2063,
                columnNumber: 11
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2034,
            columnNumber: 9
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2026,
          columnNumber: 7
        }, this),
        guardSummaries.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__guard-summary", role: "status", "aria-live": "polite", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "ガード理由（短文）" }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2073,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("ul", { children: guardSummaries.map(
            (item) => /* @__PURE__ */ jsxDEV("li", { children: [
              item.action,
              ": ",
              item.summary,
              item.nextAction ? ` / 次: ${item.nextAction}` : ""
            ] }, item.key, true, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2076,
              columnNumber: 11
            }, this)
          ) }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2074,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2072,
          columnNumber: 7
        }, this) : null,
        /* @__PURE__ */ jsxDEV(
          FocusTrapDialog,
          {
            open: confirmAction === "send",
            role: "alertdialog",
            title: "ORCA送信の確認",
            description: `現在の患者/受付を ORCA へ送信します。実行後に取り消せない場合があります。（runId=${runId} / transition=${dataSourceTransition}）`,
            onClose: () => {
              finalizeApproval("send", "cancelled");
              setConfirmAction(null);
            },
            testId: "charts-send-dialog",
            children: /* @__PURE__ */ jsxDEV("div", { role: "group", "aria-label": "ORCA送信の確認", children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    finalizeApproval("send", "cancelled");
                    setConfirmAction(null);
                  },
                  children: "キャンセル"
                },
                void 0,
                false,
                {
                  fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                  lineNumber: 2097,
                  columnNumber: 11
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    finalizeApproval("send", "confirmed");
                    setConfirmAction(null);
                    const { actor } = resolveAuditActor();
                    onApprovalConfirmed?.({ action: "send", actor });
                    void handleAction("send");
                  },
                  children: "送信する"
                },
                void 0,
                false,
                {
                  fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                  lineNumber: 2106,
                  columnNumber: 11
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2096,
              columnNumber: 9
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2085,
            columnNumber: 7
          },
          this
        ),
        /* @__PURE__ */ jsxDEV(
          ReportPrintDialog,
          {
            open: printDialogOpen,
            runId,
            isRunning,
            onClose: () => {
              finalizeApproval("print", "cancelled");
              setPrintDialogOpen(false);
            },
            onConfirmOutpatient: () => {
              finalizeApproval("print", "confirmed");
              setPrintDialogOpen(false);
              handlePrintExport();
            },
            onConfirmReport: () => {
              finalizeApproval("print", "confirmed");
              setPrintDialogOpen(false);
              void handleReportPrint();
            },
            printDestination,
            onDestinationChange: setPrintDestination,
            reportForm,
            onReportFieldChange: updateReportField,
            reportFieldErrors,
            reportReady,
            reportIncomeStatus,
            reportIncomeError,
            reportIncomeLatest,
            reportInvoiceOptions,
            reportInsuranceOptions,
            reportNeedsInvoice,
            reportNeedsOutsideClass,
            reportNeedsDepartment,
            reportNeedsInsurance,
            reportNeedsPerformMonth,
            resolvedReportType
          },
          void 0,
          false,
          {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2121,
            columnNumber: 7
          },
          this
        ),
        banner && /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__banner", children: [
          /* @__PURE__ */ jsxDEV(ToneBanner, { tone: banner.tone, message: banner.message, nextAction: banner.nextAction, runId }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2160,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__banner-actions", role: "group", "aria-label": "通知操作", children: [
            retryAction && !isRunning && /* @__PURE__ */ jsxDEV("button", { type: "button", className: "charts-actions__retry", onClick: () => handleAction(retryAction), children: "リトライ" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2163,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV("button", { type: "button", className: "charts-actions__retry", onClick: () => setBanner(null), children: "閉じる" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2167,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2161,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2159,
          columnNumber: 7
        }, this),
        isRunning && runningAction === "send" && /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__banner-actions", role: "group", "aria-label": "進行中の操作", children: /* @__PURE__ */ jsxDEV("button", { type: "button", className: "charts-actions__retry", onClick: handleAbort, children: "送信を中断" }, void 0, false, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2176,
          columnNumber: 11
        }, this) }, void 0, false, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2175,
          columnNumber: 7
        }, this),
        approvalLocked ? /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__conflict", role: "group", "aria-label": "承認済み（署名確定）のため編集不可", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__conflict-title", children: [
            /* @__PURE__ */ jsxDEV("strong", { children: "承認済み（署名確定）" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2184,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "charts-actions__conflict-meta", children: approvalLock?.approvedAt ? `approvedAt=${approvalLock.approvedAt}` : "" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2185,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2183,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "charts-actions__conflict-message", children: approvalReason }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2189,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__conflict-actions", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", className: "charts-actions__button charts-actions__button--unlock", onClick: openPrintDialog, children: "印刷/エクスポートへ" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2191,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "charts-actions__button charts-actions__button--danger",
                onClick: handleApprovalUnlock,
                disabled: !onApprovalUnlock,
                children: "承認ロック解除"
              },
              void 0,
              false,
              {
                fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                lineNumber: 2194,
                columnNumber: 13
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2190,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2182,
          columnNumber: 7
        }, this) : null,
        readOnly && !approvalLocked ? /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__conflict", role: "group", "aria-label": "並行編集（閲覧専用）の対応", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__conflict-title", children: [
            /* @__PURE__ */ jsxDEV("strong", { children: "並行編集を検知" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2208,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "charts-actions__conflict-meta", children: [
              editLock?.ownerRunId ? `ownerRunId=${editLock.ownerRunId}` : "",
              editLock?.expiresAt ? ` expiresAt=${editLock.expiresAt}` : ""
            ] }, void 0, true, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2209,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2207,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "charts-actions__conflict-message", children: readOnlyReason }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2214,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__conflict-actions", children: [
            /* @__PURE__ */ jsxDEV("button", { type: "button", className: "charts-actions__button charts-actions__button--unlock", onClick: handleReloadLatest, children: "最新を再読込" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2216,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                className: "charts-actions__button charts-actions__button--ghost",
                onClick: handleDiscard,
                disabled: !hasUnsavedDraft,
                children: "自分の変更を破棄"
              },
              void 0,
              false,
              {
                fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                lineNumber: 2219,
                columnNumber: 13
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("button", { type: "button", className: "charts-actions__button", onClick: handleForceTakeover, children: "強制引き継ぎ" }, void 0, false, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2227,
              columnNumber: 13
            }, this)
          ] }, void 0, true, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2215,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2206,
          columnNumber: 7
        }, this) : null,
        /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__controls", role: "group", "aria-label": "Charts 操作用ボタン", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              id: "charts-action-finish",
              className: "charts-actions__button",
              disabled: otherBlocked,
              "data-disabled-reason": otherBlocked ? isLocked ? "locked" : void 0 : void 0,
              onClick: () => handleAction("finish"),
              "aria-keyshortcuts": "Alt+E",
              children: "診療終了"
            },
            void 0,
            false,
            {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2235,
              columnNumber: 9
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              id: "charts-action-send",
              className: "charts-actions__button charts-actions__button--primary",
              disabled: sendDisabled,
              onClick: () => {
                setConfirmAction("send");
                approvalSessionRef.current = { action: "send", closed: false };
                logApproval("send", "open");
              },
              "aria-disabled": sendDisabled,
              "aria-describedby": !isRunning && sendPrecheckReasons.length > 0 ? "charts-actions-send-guard" : void 0,
              "data-disabled-reason": sendDisabled ? isRunning ? "running" : sendPrecheckReasons.map((reason) => reason.key).join(",") : void 0,
              "aria-keyshortcuts": "Alt+S",
              children: "ORCA 送信"
            },
            void 0,
            false,
            {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2246,
              columnNumber: 9
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              id: "charts-action-print",
              className: "charts-actions__button",
              disabled: printDisabled,
              "aria-disabled": printDisabled,
              onClick: openPrintDialog,
              "aria-describedby": !isRunning && printPrecheckReasons.length > 0 ? "charts-actions-print-guard" : void 0,
              "data-disabled-reason": printDisabled ? printPrecheckReasons.map((reason) => reason.key).join(",") : void 0,
              "aria-keyshortcuts": "Alt+I",
              children: "印刷/エクスポート"
            },
            void 0,
            false,
            {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2267,
              columnNumber: 9
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              id: "charts-action-draft",
              className: "charts-actions__button",
              disabled: otherBlocked,
              "data-disabled-reason": otherBlocked ? isLocked ? "locked" : void 0 : void 0,
              onClick: () => handleAction("draft"),
              "aria-keyshortcuts": "Shift+Enter",
              children: "ドラフト保存"
            },
            void 0,
            false,
            {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2280,
              columnNumber: 9
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "charts-actions__button charts-actions__button--ghost",
              disabled: otherBlocked,
              "data-disabled-reason": otherBlocked ? isLocked ? "locked" : void 0 : void 0,
              onClick: () => handleAction("cancel"),
              children: "キャンセル"
            },
            void 0,
            false,
            {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2291,
              columnNumber: 9
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              type: "button",
              className: "charts-actions__button charts-actions__button--unlock",
              disabled: isRunning || !isLocked || approvalLocked,
              onClick: handleUnlock,
              children: "ロック解除"
            },
            void 0,
            false,
            {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2300,
              columnNumber: 9
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2234,
          columnNumber: 7
        }, this),
        !isRunning && sendPrecheckReasons.length > 0 && /* @__PURE__ */ jsxDEV("div", { id: "charts-actions-send-guard", className: "charts-actions__guard", role: "note", "aria-live": "off", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "送信前チェック: ORCA送信をブロック" }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2312,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("ul", { children: sendPrecheckReasons.map(
            (reason) => /* @__PURE__ */ jsxDEV("li", { children: [
              reason.summary,
              ": ",
              reason.detail,
              "（次にやること: ",
              reason.next.join(" / "),
              "）"
            ] }, reason.key, true, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2315,
              columnNumber: 11
            }, this)
          ) }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2313,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2311,
          columnNumber: 7
        }, this),
        !isRunning && printPrecheckReasons.length > 0 && /* @__PURE__ */ jsxDEV("div", { id: "charts-actions-print-guard", className: "charts-actions__guard", role: "note", "aria-live": "off", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "印刷前チェック: 印刷/エクスポートをブロック" }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2325,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("ul", { children: printPrecheckReasons.map(
            (reason) => /* @__PURE__ */ jsxDEV("li", { children: [
              reason.summary,
              ": ",
              reason.detail,
              "（次にやること: ",
              reason.next.join(" / "),
              "）"
            ] }, reason.key, true, {
              fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
              lineNumber: 2328,
              columnNumber: 11
            }, this)
          ) }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2326,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2324,
          columnNumber: 7
        }, this),
        isRunning && /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__skeleton", role: "status", "aria-live": resolveAriaLive("info"), children: [
          /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__skeleton-bar" }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2338,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "charts-actions__skeleton-bar charts-actions__skeleton-bar--short" }, void 0, false, {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2339,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
          lineNumber: 2337,
          columnNumber: 7
        }, this),
        toast && /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `charts-actions__toast charts-actions__toast--${toast.tone}`,
            role: "status",
            "aria-live": resolveAriaLive(toast.tone),
            "aria-atomic": "false",
            children: [
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("strong", { children: toast.message }, void 0, false, {
                  fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                  lineNumber: 2351,
                  columnNumber: 13
                }, this),
                toast.detail && /* @__PURE__ */ jsxDEV("p", { children: toast.detail }, void 0, false, {
                  fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                  lineNumber: 2352,
                  columnNumber: 30
                }, this)
              ] }, void 0, true, {
                fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                lineNumber: 2350,
                columnNumber: 11
              }, this),
              /* @__PURE__ */ jsxDEV("button", { type: "button", className: "charts-actions__retry", onClick: () => setToast(null), children: "閉じる" }, void 0, false, {
                fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
                lineNumber: 2354,
                columnNumber: 11
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
            lineNumber: 2344,
            columnNumber: 7
          },
          this
        )
      ]
    },
    void 0,
    true,
    {
      fileName: "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx",
      lineNumber: 2017,
      columnNumber: 5
    },
    this
  );
}
_s(ChartsActionBar, "xVf6oR8VcJvupKncrkOX+6iDgF0=", false, function() {
  return [useOptionalSession, useNavigate, useOrcaReportPrint];
});
_c = ChartsActionBar;
var _c;
$RefreshReg$(_c, "ChartsActionBar");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "/Users/Hayato/Documents/GitHub/OpenDolphin_WebClient/web-client/src/features/charts/ChartsActionBar.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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O0FBQUEsWUFDQyxXQUFXLGdEQUFnREEsTUFBTXFGLElBQUk7QUFBQSxZQUNyRSxNQUFLO0FBQUEsWUFDTCxhQUFXeEwsZ0JBQWdCbUcsTUFBTXFGLElBQUk7QUFBQSxZQUNyQyxlQUFZO0FBQUEsWUFFWjtBQUFBLHFDQUFDLFNBQ0M7QUFBQSx1Q0FBQyxZQUFRckYsZ0JBQU1zRixXQUFmO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBQXVCO0FBQUEsZ0JBQ3RCdEYsTUFBTStFLFVBQVUsdUJBQUMsT0FBRy9FLGdCQUFNK0UsVUFBVjtBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQUFpQjtBQUFBLG1CQUZwQztBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUdBO0FBQUEsY0FDQSx1QkFBQyxZQUFPLE1BQUssVUFBUyxXQUFVLHlCQUF3QixTQUFTLE1BQU05RSxTQUFTLElBQUksR0FBRSxtQkFBdEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQkFFQTtBQUFBO0FBQUE7QUFBQSxVQVpGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQWFBO0FBQUE7QUFBQTtBQUFBLElBcFZKO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXNWQTtBQUVKO0FBQUNULEdBMXBFZTlCLGlCQUFlO0FBQUEsVUErQmJuRCxvQkFLQ2pCLGFBK0JHMEIsa0JBQWtCO0FBQUE7QUFBQTRVLEtBbkV4QmxTO0FBQWUsSUFBQWtTO0FBQUFDLGFBQUFELElBQUEiLCJuYW1lcyI6WyJ1c2VFZmZlY3QiLCJ1c2VNZW1vIiwidXNlUmVmIiwidXNlU3RhdGUiLCJ1c2VOYXZpZ2F0ZSIsIkZvY3VzVHJhcERpYWxvZyIsImxvZ0F1ZGl0RXZlbnQiLCJsb2dVaVN0YXRlIiwicmVzb2x2ZUF1ZGl0QWN0b3IiLCJodHRwRmV0Y2giLCJnZXRPYnNlcnZhYmlsaXR5TWV0YSIsInJlc29sdmVBcmlhTGl2ZSIsInJlY29yZE91dHBhdGllbnRGdW5uZWwiLCJUb25lQmFubmVyIiwiU3RhdHVzUGlsbCIsInJlY29yZENoYXJ0c0F1ZGl0RXZlbnQiLCJjbGVhck91dHBhdGllbnRPdXRwdXRSZXN1bHQiLCJsb2FkT3V0cGF0aWVudE91dHB1dFJlc3VsdCIsInNhdmVPdXRwYXRpZW50UHJpbnRQcmV2aWV3Iiwic2F2ZVJlcG9ydFByaW50UHJldmlldyIsImlzTmV0d29ya0Vycm9yIiwidXNlT3B0aW9uYWxTZXNzaW9uIiwiYnVpbGRGYWNpbGl0eVBhdGgiLCJidWlsZE1lZGljYWxNb2RWMjNSZXF1ZXN0WG1sIiwicG9zdE9yY2FNZWRpY2FsTW9kVjIzWG1sIiwiYnVpbGRNZWRpY2FsTW9kVjJSZXF1ZXN0WG1sIiwicG9zdE9yY2FNZWRpY2FsTW9kVjJYbWwiLCJnZXRPcmNhQ2xhaW1TZW5kRW50cnkiLCJzYXZlT3JjYUNsYWltU2VuZENhY2hlIiwiUmVwb3J0UHJpbnREaWFsb2ciLCJ1c2VPcmNhUmVwb3J0UHJpbnQiLCJNSVNTSU5HX01BU1RFUl9SRUNPVkVSWV9ORVhUX1NURVBTIiwiQUNUSU9OX0xBQkVMIiwiZmluaXNoIiwic2VuZCIsImRyYWZ0IiwiY2FuY2VsIiwicHJpbnQiLCJPUkNBX0FDVElPTl9USU1FT1VUX01TIiwiTnVtYmVyIiwiaW1wb3J0IiwiZW52IiwiVklURV9PUkNBX1NFTkRfVElNRU9VVF9NUyIsInJlc29sdmVBY3Rpb25UaW1lb3V0TXMiLCJhY3Rpb24iLCJpc0Zpbml0ZSIsInN1bW1hcml6ZUd1YXJkUmVhc29ucyIsInJlYXNvbnMiLCJsZW5ndGgiLCJwYXJ0cyIsInNsaWNlIiwibWFwIiwicmVhc29uIiwic3VtbWFyeSIsImpvaW4iLCJyZW1haW5pbmciLCJub3JtYWxpemVBY3Rpb25LZXkiLCJ2YWx1ZSIsInRyaW1tZWQiLCJ0cmltIiwiYnJhY2tldEluZGV4Iiwic2VhcmNoIiwibmV4dEFjdGlvbnMiLCJuZXh0QWN0aW9uS2V5cyIsIlNldCIsIm5leHQiLCJub3JtYWxpemVkIiwibm9ybWFsaXplZEtleSIsImhhcyIsImluY2x1ZGVzIiwicHVzaCIsImFkZCIsIkNoYXJ0c0FjdGlvbkJhciIsInJ1bklkIiwidHJhY2VJZCIsImNhY2hlSGl0IiwibWlzc2luZ01hc3RlciIsImRhdGFTb3VyY2VUcmFuc2l0aW9uIiwiZmFsbGJhY2tVc2VkIiwic2VsZWN0ZWRFbnRyeSIsInNlbmRFbmFibGVkIiwic2VuZERpc2FibGVkUmVhc29uIiwicGF0aWVudElkIiwidmlzaXREYXRlIiwicXVldWVFbnRyeSIsImhhc1Vuc2F2ZWREcmFmdCIsImhhc1Blcm1pc3Npb24iLCJyZXF1aXJlU2VydmVyUm91dGVGb3JTZW5kIiwicmVxdWlyZVBhdGllbnRGb3JTZW5kIiwibmV0d29ya0RlZ3JhZGVkUmVhc29uIiwiYXBwcm92YWxMb2NrIiwiZWRpdExvY2siLCJ1aUxvY2tSZWFzb24iLCJvblJlbG9hZExhdGVzdCIsIm9uRGlzY2FyZENoYW5nZXMiLCJvbkZvcmNlVGFrZW92ZXIiLCJvbkFmdGVyU2VuZCIsIm9uQWZ0ZXJGaW5pc2giLCJvbkRyYWZ0U2F2ZWQiLCJvbkxvY2tDaGFuZ2UiLCJvbkFwcHJvdmFsQ29uZmlybWVkIiwib25BcHByb3ZhbFVubG9jayIsIl9zIiwic2Vzc2lvbiIsInN0b3JhZ2VTY29wZSIsImZhY2lsaXR5SWQiLCJ1c2VySWQiLCJuYXZpZ2F0ZSIsImxvY2tSZWFzb24iLCJzZXRMb2NrUmVhc29uIiwidG9hc3QiLCJzZXRUb2FzdCIsImJhbm5lciIsInNldEJhbm5lciIsInJldHJ5QWN0aW9uIiwic2V0UmV0cnlBY3Rpb24iLCJpc1J1bm5pbmciLCJzZXRJc1J1bm5pbmciLCJydW5uaW5nQWN0aW9uIiwic2V0UnVubmluZ0FjdGlvbiIsImNvbmZpcm1BY3Rpb24iLCJzZXRDb25maXJtQWN0aW9uIiwiaXNPbmxpbmUiLCJzZXRJc09ubGluZSIsIm5hdmlnYXRvciIsIm9uTGluZSIsInBlcm1pc3Npb25EZW5pZWQiLCJzZXRQZXJtaXNzaW9uRGVuaWVkIiwiYWJvcnRDb250cm9sbGVyUmVmIiwib3V0cGF0aWVudFJlc3VsdFJlZiIsInByaW50RGlhbG9nT3BlbiIsInNldFByaW50RGlhbG9nT3BlbiIsInJlc29sdmVkTG9ja1JlYXNvbiIsInVpTG9ja2VkIiwicmVhZE9ubHkiLCJyZWFkT25seVJlYXNvbiIsImFwcHJvdmFsTG9ja2VkIiwibG9ja2VkIiwiYXBwcm92YWxSZWFzb24iLCJ1bmRlZmluZWQiLCJhY3Rpb25Mb2NrZWQiLCJpc0xvY2tlZCIsInJlc29sdmVkVHJhY2VJZCIsInJlc29sdmVkUGF0aWVudElkIiwiaWQiLCJyZXNvbHZlZEFwcG9pbnRtZW50SWQiLCJhcHBvaW50bWVudElkIiwicmVzb2x2ZWRSZWNlcHRpb25JZCIsInJlY2VwdGlvbklkIiwicmVzb2x2ZWRWaXNpdERhdGUiLCJvcmNhU2VuZEVudHJ5IiwicmVwb3J0UHJpbnQiLCJkaWFsb2dPcGVuIiwicHJpbnREZXN0aW5hdGlvbiIsInNldFByaW50RGVzdGluYXRpb24iLCJyZXBvcnRGb3JtIiwidXBkYXRlUmVwb3J0RmllbGQiLCJyZXBvcnRGaWVsZEVycm9ycyIsInJlcG9ydFJlYWR5IiwicmVwb3J0SW5jb21lU3RhdHVzIiwicmVwb3J0SW5jb21lRXJyb3IiLCJyZXBvcnRJbmNvbWVMYXRlc3QiLCJyZXBvcnRJbnZvaWNlT3B0aW9ucyIsInJlcG9ydEluc3VyYW5jZU9wdGlvbnMiLCJyZXBvcnROZWVkc0ludm9pY2UiLCJyZXBvcnROZWVkc091dHNpZGVDbGFzcyIsInJlcG9ydE5lZWRzRGVwYXJ0bWVudCIsInJlcG9ydE5lZWRzSW5zdXJhbmNlIiwicmVwb3J0TmVlZHNQZXJmb3JtTW9udGgiLCJyZXNvbHZlZFJlcG9ydFR5cGUiLCJyZXF1ZXN0UmVwb3J0UHJldmlldyIsInJlc29sdmVEZXBhcnRtZW50Q29kZSIsImRlcGFydG1lbnQiLCJtYXRjaCIsIm5vcm1hbGl6ZVZpc2l0RGF0ZSIsImlzQXBpUmVzdWx0T2siLCJhcGlSZXN1bHQiLCJCb29sZWFuIiwidGVzdCIsInNlbmRRdWV1ZUxhYmVsIiwicGhhc2UiLCJ3aW5kb3ciLCJoYW5kbGVPbmxpbmUiLCJoYW5kbGVPZmZsaW5lIiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJjdXJyZW50Iiwib3V0cHV0UmVzdWx0IiwiZGV0YWlsUGFydHMiLCJkZXRhaWwiLCJlbmRwb2ludCIsImh0dHBTdGF0dXMiLCJmaWx0ZXIiLCJwYXJ0Iiwib3V0Y29tZSIsInRvbmUiLCJtZXNzYWdlIiwiaXNCbG9ja2VkIiwibmV4dEFjdGlvbiIsInNlbmRQcmVjaGVja1JlYXNvbnMiLCJrZXkiLCJmaW5pc2hQcmVjaGVja1JlYXNvbnMiLCJzZW5kRGlzYWJsZWQiLCJwcmludFByZWNoZWNrUmVhc29ucyIsInByaW50RGlzYWJsZWQiLCJvdGhlckJsb2NrZWQiLCJndWFyZFN1bW1hcmllcyIsImVudHJpZXMiLCJzdGF0dXNMaW5lIiwicmVxdWVzdElkIiwibG9nVGVsZW1ldHJ5IiwiZHVyYXRpb25NcyIsIm5vdGUiLCJtZXRhIiwiYnVpbGRGYWxsYmFja0RldGFpbHMiLCJkZXRhaWxzIiwiZmFsbGJhY2tQYXRpZW50SWQiLCJmYWxsYmFja0FwcG9pbnRtZW50SWQiLCJmYWxsYmFja1JlY2VwdGlvbklkIiwibG9ja1N0YXR1cyIsImJ1aWxkT3V0cGF0aWVudFBheWxvYWQiLCJwYXlsb2FkIiwiYXBwb2ludG1lbnREYXRlIiwiZGF0ZSIsIlBhdGllbnRfSUQiLCJwYXRpZW50SW5mb3JtYXRpb24iLCJsb2dBdWRpdCIsIm9wdGlvbnMiLCJhY3Rpb25NYXAiLCJub3JtYWxpemVkQWN0aW9uIiwib3BlcmF0aW9uUGhhc2UiLCJzdWJqZWN0IiwiZXJyb3IiLCJhcHByb3ZhbFNlc3Npb25SZWYiLCJsb2dBcHByb3ZhbCIsInN0YXRlIiwiYmxvY2tlZFJlYXNvbnMiLCJzY3JlZW4iLCJjb250cm9sSWQiLCJhcHByb3ZhbFN0YXRlIiwiZmluYWxpemVBcHByb3ZhbCIsImNsb3NlZCIsImhhbmRsZUFjdGlvbiIsImJsb2NrZWRSZWFzb24iLCJibG9ja2VkIiwiYXBwcm92YWwiLCJ0cmlnZ2VyIiwic3RhcnRlZEF0IiwicGVyZm9ybWFuY2UiLCJub3ciLCJ0aW1lb3V0SWQiLCJBYm9ydENvbnRyb2xsZXIiLCJzaWduYWwiLCJ0aW1lb3V0TXMiLCJzZXRUaW1lb3V0IiwiYWJvcnQiLCJkZXBhcnRtZW50Q29kZSIsImNhbGN1bGF0aW9uRGF0ZSIsIm1pc3NpbmdGaWVsZHMiLCJmaWVsZCIsInJlcXVlc3RYbWwiLCJwZXJmb3JtRGF0ZSIsInJlc3VsdCIsImNsYXNzQ29kZSIsImFwaVJlc3VsdE9rIiwiaGFzTWlzc2luZ1RhZ3MiLCJtaXNzaW5nVGFncyIsIm9rIiwiTWF0aCIsInJvdW5kIiwibmV4dFJ1bklkIiwibmV4dFRyYWNlSWQiLCJpbnZvaWNlTnVtYmVyIiwiZGF0YUlkIiwicmV0cnlNZXRhIiwicmV0cnlSZXNwb25zZSIsIm1ldGhvZCIsInJldHJ5SnNvbiIsImpzb24iLCJjYXRjaCIsInJldHJ5UmVxdWVzdGVkIiwicmV0cnlBcHBsaWVkIiwicmV0cnlSZWFzb24iLCJxdWV1ZVJ1bklkIiwicXVldWVUcmFjZUlkIiwic3RhdHVzIiwiYXBpUmVzdWx0TWVzc2FnZSIsInJldHJ5UXVldWUiLCJzZW5kU3RhdHVzIiwiZXJyb3JNZXNzYWdlIiwidjIzUmVxdWVzdFhtbCIsInJlcXVlc3ROdW1iZXIiLCJmaXJzdENhbGN1bGF0aW9uRGF0ZSIsImxhc3RWaXNpdERhdGUiLCJQcm9taXNlIiwicmVzb2x2ZSIsIkVycm9yIiwiU3RyaW5nIiwicmVzcG9uc2UiLCJoZWFkZXJzIiwiYm9keSIsIkpTT04iLCJzdHJpbmdpZnkiLCJyZXNwb25zZVJ1bklkIiwicmVzcG9uc2VUcmFjZUlkIiwicmVzcG9uc2VSZXF1ZXN0SWQiLCJyZXNwb25zZU91dGNvbWUiLCJyZXNwb25zZUFwaVJlc3VsdCIsInJlc3BvbnNlQXBpUmVzdWx0TWVzc2FnZSIsImF1dGhFcnJvciIsImFwaURldGFpbHMiLCJhcGlFcnJvciIsImFmdGVyIiwicmVzcG9uc2VEZXRhaWxQYXJ0cyIsImJhbm5lckRldGFpbCIsImlzQWJvcnQiLCJET01FeGNlcHRpb24iLCJuYW1lIiwiZXJyb3JSdW5JZCIsImVycm9yVHJhY2VJZCIsImVycm9yUmVxdWVzdElkIiwiZXJyb3JFbmRwb2ludCIsImVycm9ySHR0cFN0YXR1cyIsImVycm9yT3V0Y29tZSIsImVycm9yQXBpUmVzdWx0IiwiZXJyb3JBcGlSZXN1bHRNZXNzYWdlIiwiYWJvcnRlZERldGFpbCIsIm5leHRTdGVwcyIsInJldHJ5RGV0YWlsIiwicmV0cnlFcnJvciIsImV4dHJhVGFncyIsImNvbXBvc2VkRGV0YWlsIiwiY2xlYXJUaW1lb3V0IiwiaGFuZGxlUHJpbnRFeHBvcnQiLCJoZWFkIiwiYWN0b3IiLCJwcmludFBhdGgiLCJkZXN0aW5hdGlvbiIsImVudHJ5Iiwib3BlblByaW50RGlhbG9nIiwiaGFuZGxlUmVwb3J0UHJpbnQiLCJyZXBvcnRUeXBlIiwiaW5zdXJhbmNlQ29tYmluYXRpb25OdW1iZXIiLCJwZXJmb3JtTW9udGgiLCJwcmV2aWV3U3RhdGUiLCJyZXNwb25zZU1ldGEiLCJoYW5kbGVVbmxvY2siLCJ1bmxvY2tlZCIsImhhbmRsZUFib3J0IiwiaGFuZGxlQXBwcm92YWxVbmxvY2siLCJmaXJzdCIsImNvbmZpcm0iLCJzZWNvbmQiLCJoYW5kbGVSZWxvYWRMYXRlc3QiLCJyZXNvbHV0aW9uIiwiaGFuZGxlRGlzY2FyZCIsImhhbmRsZUZvcmNlVGFrZW92ZXIiLCJjb25maXJtZWQiLCJpdGVtIiwiYXBwcm92ZWRBdCIsIm93bmVyUnVuSWQiLCJleHBpcmVzQXQiLCJfYyIsIiRSZWZyZXNoUmVnJCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJDaGFydHNBY3Rpb25CYXIudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZUVmZmVjdCwgdXNlTWVtbywgdXNlUmVmLCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZU5hdmlnYXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XG5cbmltcG9ydCB7IEZvY3VzVHJhcERpYWxvZyB9IGZyb20gJy4uLy4uL2NvbXBvbmVudHMvbW9kYWxzL0ZvY3VzVHJhcERpYWxvZyc7XG5pbXBvcnQgeyBsb2dBdWRpdEV2ZW50LCBsb2dVaVN0YXRlIH0gZnJvbSAnLi4vLi4vbGlicy9hdWRpdC9hdWRpdExvZ2dlcic7XG5pbXBvcnQgeyByZXNvbHZlQXVkaXRBY3RvciB9IGZyb20gJy4uLy4uL2xpYnMvYXV0aC9zdG9yZWRBdXRoJztcbmltcG9ydCB7IGh0dHBGZXRjaCB9IGZyb20gJy4uLy4uL2xpYnMvaHR0cC9odHRwQ2xpZW50JztcbmltcG9ydCB7IGdldE9ic2VydmFiaWxpdHlNZXRhLCByZXNvbHZlQXJpYUxpdmUgfSBmcm9tICcuLi8uLi9saWJzL29ic2VydmFiaWxpdHkvb2JzZXJ2YWJpbGl0eSc7XG5pbXBvcnQgeyByZWNvcmRPdXRwYXRpZW50RnVubmVsIH0gZnJvbSAnLi4vLi4vbGlicy90ZWxlbWV0cnkvdGVsZW1ldHJ5Q2xpZW50JztcbmltcG9ydCB7IFRvbmVCYW5uZXIsIHR5cGUgQmFubmVyVG9uZSB9IGZyb20gJy4uL3JlY2VwdGlvbi9jb21wb25lbnRzL1RvbmVCYW5uZXInO1xuaW1wb3J0IHsgU3RhdHVzUGlsbCB9IGZyb20gJy4uL3NoYXJlZC9TdGF0dXNQaWxsJztcbmltcG9ydCB7IHJlY29yZENoYXJ0c0F1ZGl0RXZlbnQsIHR5cGUgQ2hhcnRzT3BlcmF0aW9uUGhhc2UgfSBmcm9tICcuL2F1ZGl0JztcbmltcG9ydCB0eXBlIHsgQ2hhcnRzVGFiTG9ja1N0YXR1cyB9IGZyb20gJy4vdXNlQ2hhcnRzVGFiTG9jayc7XG5pbXBvcnQgdHlwZSB7IERhdGFTb3VyY2VUcmFuc2l0aW9uIH0gZnJvbSAnLi9hdXRoU2VydmljZSc7XG5pbXBvcnQgdHlwZSB7IENsYWltUXVldWVFbnRyeSB9IGZyb20gJy4uL291dHBhdGllbnQvdHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBSZWNlcHRpb25FbnRyeSB9IGZyb20gJy4uL3JlY2VwdGlvbi9hcGknO1xuaW1wb3J0IHtcbiAgY2xlYXJPdXRwYXRpZW50T3V0cHV0UmVzdWx0LFxuICBsb2FkT3V0cGF0aWVudE91dHB1dFJlc3VsdCxcbiAgc2F2ZU91dHBhdGllbnRQcmludFByZXZpZXcsXG4gIHNhdmVSZXBvcnRQcmludFByZXZpZXcsXG59IGZyb20gJy4vcHJpbnQvcHJpbnRQcmV2aWV3U3RvcmFnZSc7XG5pbXBvcnQgeyBpc05ldHdvcmtFcnJvciB9IGZyb20gJy4uL3NoYXJlZC9hcGlFcnJvcic7XG5pbXBvcnQgeyB1c2VPcHRpb25hbFNlc3Npb24gfSBmcm9tICcuLi8uLi9BcHBSb3V0ZXInO1xuaW1wb3J0IHsgYnVpbGRGYWNpbGl0eVBhdGggfSBmcm9tICcuLi8uLi9yb3V0ZXMvZmFjaWxpdHlSb3V0ZXMnO1xuaW1wb3J0IHsgYnVpbGRNZWRpY2FsTW9kVjIzUmVxdWVzdFhtbCwgcG9zdE9yY2FNZWRpY2FsTW9kVjIzWG1sIH0gZnJvbSAnLi9vcmNhTWVkaWNhbE1vZEFwaSc7XG5pbXBvcnQgeyBidWlsZE1lZGljYWxNb2RWMlJlcXVlc3RYbWwsIHBvc3RPcmNhTWVkaWNhbE1vZFYyWG1sIH0gZnJvbSAnLi9vcmNhQ2xhaW1BcGknO1xuaW1wb3J0IHsgZ2V0T3JjYUNsYWltU2VuZEVudHJ5LCBzYXZlT3JjYUNsYWltU2VuZENhY2hlIH0gZnJvbSAnLi9vcmNhQ2xhaW1TZW5kQ2FjaGUnO1xuaW1wb3J0IHsgUmVwb3J0UHJpbnREaWFsb2cgfSBmcm9tICcuL3ByaW50L1JlcG9ydFByaW50RGlhbG9nJztcbmltcG9ydCB7IHVzZU9yY2FSZXBvcnRQcmludCB9IGZyb20gJy4vcHJpbnQvdXNlT3JjYVJlcG9ydFByaW50JztcbmltcG9ydCB7IE1JU1NJTkdfTUFTVEVSX1JFQ09WRVJZX05FWFRfU1RFUFMgfSBmcm9tICcuLi9zaGFyZWQvbWlzc2luZ01hc3RlclJlY292ZXJ5JztcblxudHlwZSBDaGFydEFjdGlvbiA9ICdmaW5pc2gnIHwgJ3NlbmQnIHwgJ2RyYWZ0JyB8ICdjYW5jZWwnIHwgJ3ByaW50JztcblxudHlwZSBUb2FzdFN0YXRlID0ge1xuICB0b25lOiAnc3VjY2VzcycgfCAnd2FybmluZycgfCAnZXJyb3InIHwgJ2luZm8nO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIGRldGFpbD86IHN0cmluZztcbn07XG5cbnR5cGUgQmFubmVyU3RhdGUgPSB7XG4gIHRvbmU6IEJhbm5lclRvbmU7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgbmV4dEFjdGlvbj86IHN0cmluZztcbn07XG5cbnR5cGUgR3VhcmRSZWFzb24gPSB7XG4gIGtleTpcbiAgICB8ICdtaXNzaW5nX21hc3RlcidcbiAgICB8ICdmYWxsYmFja191c2VkJ1xuICAgIHwgJ2NvbmZpZ19kaXNhYmxlZCdcbiAgICB8ICdkcmFmdF91bnNhdmVkJ1xuICAgIHwgJ3Blcm1pc3Npb25fZGVuaWVkJ1xuICAgIHwgJ25ldHdvcmtfb2ZmbGluZSdcbiAgICB8ICduZXR3b3JrX2RlZ3JhZGVkJ1xuICAgIHwgJ25vdF9zZXJ2ZXJfcm91dGUnXG4gICAgfCAncGF0aWVudF9ub3Rfc2VsZWN0ZWQnXG4gICAgfCAnbG9ja2VkJ1xuICAgIHwgJ2FwcHJvdmFsX2xvY2tlZCc7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgZGV0YWlsOiBzdHJpbmc7XG4gIG5leHQ6IHN0cmluZ1tdO1xufTtcblxuY29uc3QgQUNUSU9OX0xBQkVMOiBSZWNvcmQ8Q2hhcnRBY3Rpb24sIHN0cmluZz4gPSB7XG4gIGZpbmlzaDogJ+iouueZgue1guS6hicsXG4gIHNlbmQ6ICdPUkNB6YCB5L+hJyxcbiAgZHJhZnQ6ICfjg4njg6njg5Xjg4jkv53lrZgnLFxuICBjYW5jZWw6ICfjgq3jg6Pjg7Pjgrvjg6snLFxuICBwcmludDogJ+WNsOWItycsXG59O1xuXG5jb25zdCBPUkNBX0FDVElPTl9USU1FT1VUX01TID0gTnVtYmVyKGltcG9ydC5tZXRhLmVudi5WSVRFX09SQ0FfU0VORF9USU1FT1VUX01TID8/ICc2MDAwMCcpO1xuY29uc3QgcmVzb2x2ZUFjdGlvblRpbWVvdXRNcyA9IChhY3Rpb246IENoYXJ0QWN0aW9uKSA9PiB7XG4gIGlmIChhY3Rpb24gIT09ICdzZW5kJyAmJiBhY3Rpb24gIT09ICdmaW5pc2gnKSByZXR1cm4gMDtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoT1JDQV9BQ1RJT05fVElNRU9VVF9NUykgfHwgT1JDQV9BQ1RJT05fVElNRU9VVF9NUyA8PSAwKSByZXR1cm4gMDtcbiAgcmV0dXJuIE9SQ0FfQUNUSU9OX1RJTUVPVVRfTVM7XG59O1xuXG5jb25zdCBzdW1tYXJpemVHdWFyZFJlYXNvbnMgPSAocmVhc29uczogR3VhcmRSZWFzb25bXSkgPT4ge1xuICBpZiAocmVhc29ucy5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBjb25zdCBwYXJ0cyA9IHJlYXNvbnMuc2xpY2UoMCwgMikubWFwKChyZWFzb24pID0+IHJlYXNvbi5zdW1tYXJ5KTtcbiAgbGV0IHN1bW1hcnkgPSBwYXJ0cy5qb2luKCcgLyAnKTtcbiAgY29uc3QgcmVtYWluaW5nID0gcmVhc29ucy5sZW5ndGggLSBwYXJ0cy5sZW5ndGg7XG4gIGlmIChyZW1haW5pbmcgPiAwKSBzdW1tYXJ5ID0gYCR7c3VtbWFyeX3vvIjku5Yke3JlbWFpbmluZ33ku7bvvIlgO1xuXG4gIGNvbnN0IG5vcm1hbGl6ZUFjdGlvbktleSA9ICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIHJldHVybiAnJztcbiAgICBjb25zdCBicmFja2V0SW5kZXggPSB0cmltbWVkLnNlYXJjaCgvW++8iChdLyk7XG4gICAgaWYgKGJyYWNrZXRJbmRleCA9PT0gLTEpIHJldHVybiB0cmltbWVkO1xuICAgIHJldHVybiB0cmltbWVkLnNsaWNlKDAsIGJyYWNrZXRJbmRleCkudHJpbSgpO1xuICB9O1xuXG4gIGNvbnN0IG5leHRBY3Rpb25zOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBuZXh0QWN0aW9uS2V5cyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHJlYXNvbiBvZiByZWFzb25zKSB7XG4gICAgZm9yIChjb25zdCBhY3Rpb24gb2YgcmVhc29uLm5leHQpIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBhY3Rpb24udHJpbSgpO1xuICAgICAgaWYgKCFub3JtYWxpemVkKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRLZXkgPSBub3JtYWxpemVBY3Rpb25LZXkobm9ybWFsaXplZCk7XG4gICAgICBpZiAobmV4dEFjdGlvbktleXMuaGFzKG5vcm1hbGl6ZWRLZXkpIHx8IG5leHRBY3Rpb25zLmluY2x1ZGVzKG5vcm1hbGl6ZWQpKSBjb250aW51ZTtcbiAgICAgIG5leHRBY3Rpb25zLnB1c2gobm9ybWFsaXplZCk7XG4gICAgICBpZiAobm9ybWFsaXplZEtleSkgbmV4dEFjdGlvbktleXMuYWRkKG5vcm1hbGl6ZWRLZXkpO1xuICAgICAgaWYgKG5leHRBY3Rpb25zLmxlbmd0aCA+PSAyKSBicmVhaztcbiAgICB9XG4gICAgaWYgKG5leHRBY3Rpb25zLmxlbmd0aCA+PSAyKSBicmVhaztcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VtbWFyeSxcbiAgICBuZXh0QWN0aW9ucyxcbiAgfTtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2hhcnRzQWN0aW9uQmFyUHJvcHMge1xuICBydW5JZDogc3RyaW5nO1xuICB0cmFjZUlkPzogc3RyaW5nO1xuICBjYWNoZUhpdDogYm9vbGVhbjtcbiAgbWlzc2luZ01hc3RlcjogYm9vbGVhbjtcbiAgZGF0YVNvdXJjZVRyYW5zaXRpb246IERhdGFTb3VyY2VUcmFuc2l0aW9uO1xuICBmYWxsYmFja1VzZWQ/OiBib29sZWFuO1xuICBzZWxlY3RlZEVudHJ5PzogUmVjZXB0aW9uRW50cnk7XG4gIHNlbmRFbmFibGVkPzogYm9vbGVhbjtcbiAgc2VuZERpc2FibGVkUmVhc29uPzogc3RyaW5nO1xuICBwYXRpZW50SWQ/OiBzdHJpbmc7XG4gIHZpc2l0RGF0ZT86IHN0cmluZztcbiAgcXVldWVFbnRyeT86IENsYWltUXVldWVFbnRyeTtcbiAgaGFzVW5zYXZlZERyYWZ0PzogYm9vbGVhbjtcbiAgaGFzUGVybWlzc2lvbj86IGJvb2xlYW47XG4gIHJlcXVpcmVTZXJ2ZXJSb3V0ZUZvclNlbmQ/OiBib29sZWFuO1xuICByZXF1aXJlUGF0aWVudEZvclNlbmQ/OiBib29sZWFuO1xuICBuZXR3b3JrRGVncmFkZWRSZWFzb24/OiBzdHJpbmc7XG4gIGFwcHJvdmFsTG9jaz86IHtcbiAgICBsb2NrZWQ6IGJvb2xlYW47XG4gICAgYXBwcm92ZWRBdD86IHN0cmluZztcbiAgICBydW5JZD86IHN0cmluZztcbiAgICBhY3Rpb24/OiAnc2VuZCc7XG4gIH07XG4gIGVkaXRMb2NrPzoge1xuICAgIHJlYWRPbmx5OiBib29sZWFuO1xuICAgIHJlYXNvbj86IHN0cmluZztcbiAgICBvd25lclJ1bklkPzogc3RyaW5nO1xuICAgIGV4cGlyZXNBdD86IHN0cmluZztcbiAgICBsb2NrU3RhdHVzPzogQ2hhcnRzVGFiTG9ja1N0YXR1cztcbiAgfTtcbiAgdWlMb2NrUmVhc29uPzogc3RyaW5nIHwgbnVsbDtcbiAgb25SZWxvYWRMYXRlc3Q/OiAoKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgb25EaXNjYXJkQ2hhbmdlcz86ICgpID0+IHZvaWQ7XG4gIG9uRm9yY2VUYWtlb3Zlcj86ICgpID0+IHZvaWQ7XG4gIG9uQWZ0ZXJTZW5kPzogKCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD47XG4gIG9uQWZ0ZXJGaW5pc2g/OiAoKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbiAgb25EcmFmdFNhdmVkPzogKCkgPT4gdm9pZDtcbiAgb25Mb2NrQ2hhbmdlPzogKGxvY2tlZDogYm9vbGVhbiwgcmVhc29uPzogc3RyaW5nKSA9PiB2b2lkO1xuICBvbkFwcHJvdmFsQ29uZmlybWVkPzogKG1ldGE6IHsgYWN0aW9uOiAnc2VuZCc7IGFjdG9yPzogc3RyaW5nIH0pID0+IHZvaWQ7XG4gIG9uQXBwcm92YWxVbmxvY2s/OiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gQ2hhcnRzQWN0aW9uQmFyKHtcbiAgcnVuSWQsXG4gIHRyYWNlSWQsXG4gIGNhY2hlSGl0LFxuICBtaXNzaW5nTWFzdGVyLFxuICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgZmFsbGJhY2tVc2VkID0gZmFsc2UsXG4gIHNlbGVjdGVkRW50cnksXG4gIHNlbmRFbmFibGVkID0gdHJ1ZSxcbiAgc2VuZERpc2FibGVkUmVhc29uLFxuICBwYXRpZW50SWQsXG4gIHZpc2l0RGF0ZSxcbiAgcXVldWVFbnRyeSxcbiAgaGFzVW5zYXZlZERyYWZ0ID0gZmFsc2UsXG4gIGhhc1Blcm1pc3Npb24gPSB0cnVlLFxuICByZXF1aXJlU2VydmVyUm91dGVGb3JTZW5kID0gZmFsc2UsXG4gIHJlcXVpcmVQYXRpZW50Rm9yU2VuZCA9IGZhbHNlLFxuICBuZXR3b3JrRGVncmFkZWRSZWFzb24sXG4gIGFwcHJvdmFsTG9jayxcbiAgZWRpdExvY2ssXG4gIHVpTG9ja1JlYXNvbixcbiAgb25SZWxvYWRMYXRlc3QsXG4gIG9uRGlzY2FyZENoYW5nZXMsXG4gIG9uRm9yY2VUYWtlb3ZlcixcbiAgb25BZnRlclNlbmQsXG4gIG9uQWZ0ZXJGaW5pc2gsXG4gIG9uRHJhZnRTYXZlZCxcbiAgb25Mb2NrQ2hhbmdlLFxuICBvbkFwcHJvdmFsQ29uZmlybWVkLFxuICBvbkFwcHJvdmFsVW5sb2NrLFxufTogQ2hhcnRzQWN0aW9uQmFyUHJvcHMpIHtcbiAgY29uc3Qgc2Vzc2lvbiA9IHVzZU9wdGlvbmFsU2Vzc2lvbigpO1xuICBjb25zdCBzdG9yYWdlU2NvcGUgPSB1c2VNZW1vKFxuICAgICgpID0+ICh7IGZhY2lsaXR5SWQ6IHNlc3Npb24/LmZhY2lsaXR5SWQsIHVzZXJJZDogc2Vzc2lvbj8udXNlcklkIH0pLFxuICAgIFtzZXNzaW9uPy5mYWNpbGl0eUlkLCBzZXNzaW9uPy51c2VySWRdLFxuICApO1xuICBjb25zdCBuYXZpZ2F0ZSA9IHVzZU5hdmlnYXRlKCk7XG4gIGNvbnN0IFtsb2NrUmVhc29uLCBzZXRMb2NrUmVhc29uXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbdG9hc3QsIHNldFRvYXN0XSA9IHVzZVN0YXRlPFRvYXN0U3RhdGUgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2Jhbm5lciwgc2V0QmFubmVyXSA9IHVzZVN0YXRlPEJhbm5lclN0YXRlIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtyZXRyeUFjdGlvbiwgc2V0UmV0cnlBY3Rpb25dID0gdXNlU3RhdGU8Q2hhcnRBY3Rpb24gfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2lzUnVubmluZywgc2V0SXNSdW5uaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3J1bm5pbmdBY3Rpb24sIHNldFJ1bm5pbmdBY3Rpb25dID0gdXNlU3RhdGU8Q2hhcnRBY3Rpb24gfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2NvbmZpcm1BY3Rpb24sIHNldENvbmZpcm1BY3Rpb25dID0gdXNlU3RhdGU8Q2hhcnRBY3Rpb24gfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2lzT25saW5lLCBzZXRJc09ubGluZV0gPSB1c2VTdGF0ZSgoKSA9PiAodHlwZW9mIG5hdmlnYXRvciA9PT0gJ3VuZGVmaW5lZCcgPyB0cnVlIDogbmF2aWdhdG9yLm9uTGluZSkpO1xuICBjb25zdCBbcGVybWlzc2lvbkRlbmllZCwgc2V0UGVybWlzc2lvbkRlbmllZF0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IGFib3J0Q29udHJvbGxlclJlZiA9IHVzZVJlZjxBYm9ydENvbnRyb2xsZXIgfCBudWxsPihudWxsKTtcbiAgY29uc3Qgb3V0cGF0aWVudFJlc3VsdFJlZiA9IHVzZVJlZihmYWxzZSk7XG4gIGNvbnN0IFtwcmludERpYWxvZ09wZW4sIHNldFByaW50RGlhbG9nT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgY29uc3QgcmVzb2x2ZWRMb2NrUmVhc29uID0gdWlMb2NrUmVhc29uID8/IGxvY2tSZWFzb247XG4gIGNvbnN0IHVpTG9ja2VkID0gcmVzb2x2ZWRMb2NrUmVhc29uICE9PSBudWxsO1xuICBjb25zdCByZWFkT25seSA9IGVkaXRMb2NrPy5yZWFkT25seSA9PT0gdHJ1ZTtcbiAgY29uc3QgcmVhZE9ubHlSZWFzb24gPSBlZGl0TG9jaz8ucmVhc29uID8/ICfkuKbooYznt6jpm4bjgpLmpJznn6XjgZfjgZ/jgZ/jgoHjgIHjgZPjga7jgr/jg5bjga/plrLopqflsILnlKjjgafjgZnjgIInO1xuICBjb25zdCBhcHByb3ZhbExvY2tlZCA9IGFwcHJvdmFsTG9jaz8ubG9ja2VkID09PSB0cnVlO1xuICBjb25zdCBhcHByb3ZhbFJlYXNvbiA9IGFwcHJvdmFsTG9ja2VkID8gJ+e9suWQjeeiuuWumua4iOOBv+OBruOBn+OCgee3qOmbhuOBp+OBjeOBvuOBm+OCk+OAgicgOiB1bmRlZmluZWQ7XG4gIGNvbnN0IGFjdGlvbkxvY2tlZCA9IHVpTG9ja2VkIHx8IGlzUnVubmluZyB8fCByZWFkT25seTtcbiAgY29uc3QgaXNMb2NrZWQgPSBhY3Rpb25Mb2NrZWQgfHwgYXBwcm92YWxMb2NrZWQ7XG4gIGNvbnN0IHJlc29sdmVkVHJhY2VJZCA9IHRyYWNlSWQgPz8gZ2V0T2JzZXJ2YWJpbGl0eU1ldGEoKS50cmFjZUlkO1xuICBjb25zdCByZXNvbHZlZFBhdGllbnRJZCA9IHBhdGllbnRJZCA/PyBzZWxlY3RlZEVudHJ5Py5wYXRpZW50SWQgPz8gc2VsZWN0ZWRFbnRyeT8uaWQ7XG4gIGNvbnN0IHJlc29sdmVkQXBwb2ludG1lbnRJZCA9IHF1ZXVlRW50cnk/LmFwcG9pbnRtZW50SWQgPz8gc2VsZWN0ZWRFbnRyeT8uYXBwb2ludG1lbnRJZDtcbiAgY29uc3QgcmVzb2x2ZWRSZWNlcHRpb25JZCA9IHNlbGVjdGVkRW50cnk/LnJlY2VwdGlvbklkO1xuICBjb25zdCByZXNvbHZlZFZpc2l0RGF0ZSA9IHVzZU1lbW8oXG4gICAgKCkgPT4gdmlzaXREYXRlID8/IHNlbGVjdGVkRW50cnk/LnZpc2l0RGF0ZSxcbiAgICBbc2VsZWN0ZWRFbnRyeT8udmlzaXREYXRlLCB2aXNpdERhdGVdLFxuICApO1xuICBjb25zdCBvcmNhU2VuZEVudHJ5ID0gZ2V0T3JjYUNsYWltU2VuZEVudHJ5KHN0b3JhZ2VTY29wZSwgcmVzb2x2ZWRQYXRpZW50SWQpO1xuICBjb25zdCByZXBvcnRQcmludCA9IHVzZU9yY2FSZXBvcnRQcmludCh7XG4gICAgZGlhbG9nT3BlbjogcHJpbnREaWFsb2dPcGVuLFxuICAgIHBhdGllbnRJZDogcmVzb2x2ZWRQYXRpZW50SWQsXG4gICAgYXBwb2ludG1lbnRJZDogcmVzb2x2ZWRBcHBvaW50bWVudElkLFxuICAgIHZpc2l0RGF0ZTogcmVzb2x2ZWRWaXNpdERhdGUsXG4gICAgc2VsZWN0ZWRFbnRyeSxcbiAgICBvcmNhU2VuZEVudHJ5LFxuICAgIHJ1bklkLFxuICAgIGNhY2hlSGl0LFxuICAgIG1pc3NpbmdNYXN0ZXIsXG4gICAgZmFsbGJhY2tVc2VkLFxuICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgIHRyYWNlSWQ6IHJlc29sdmVkVHJhY2VJZCxcbiAgfSk7XG4gIGNvbnN0IHtcbiAgICBwcmludERlc3RpbmF0aW9uLFxuICAgIHNldFByaW50RGVzdGluYXRpb24sXG4gICAgcmVwb3J0Rm9ybSxcbiAgICB1cGRhdGVSZXBvcnRGaWVsZCxcbiAgICByZXBvcnRGaWVsZEVycm9ycyxcbiAgICByZXBvcnRSZWFkeSxcbiAgICByZXBvcnRJbmNvbWVTdGF0dXMsXG4gICAgcmVwb3J0SW5jb21lRXJyb3IsXG4gICAgcmVwb3J0SW5jb21lTGF0ZXN0LFxuICAgIHJlcG9ydEludm9pY2VPcHRpb25zLFxuICAgIHJlcG9ydEluc3VyYW5jZU9wdGlvbnMsXG4gICAgcmVwb3J0TmVlZHNJbnZvaWNlLFxuICAgIHJlcG9ydE5lZWRzT3V0c2lkZUNsYXNzLFxuICAgIHJlcG9ydE5lZWRzRGVwYXJ0bWVudCxcbiAgICByZXBvcnROZWVkc0luc3VyYW5jZSxcbiAgICByZXBvcnROZWVkc1BlcmZvcm1Nb250aCxcbiAgICByZXNvbHZlZFJlcG9ydFR5cGUsXG4gICAgcmVxdWVzdFJlcG9ydFByZXZpZXcsXG4gIH0gPSByZXBvcnRQcmludDtcblxuICBjb25zdCByZXNvbHZlRGVwYXJ0bWVudENvZGUgPSAoZGVwYXJ0bWVudD86IHN0cmluZykgPT4ge1xuICAgIGlmICghZGVwYXJ0bWVudCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBjb25zdCBtYXRjaCA9IGRlcGFydG1lbnQubWF0Y2goL1xcYihcXGR7Mn0pXFxiLyk7XG4gICAgcmV0dXJuIG1hdGNoPy5bMV07XG4gIH07XG5cbiAgY29uc3Qgbm9ybWFsaXplVmlzaXREYXRlID0gKHZhbHVlPzogc3RyaW5nKSA9PiB7XG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gdmFsdWUubGVuZ3RoID49IDEwID8gdmFsdWUuc2xpY2UoMCwgMTApIDogdmFsdWU7XG4gIH07XG5cbiAgY29uc3QgaXNBcGlSZXN1bHRPayA9IChhcGlSZXN1bHQ/OiBzdHJpbmcpID0+IEJvb2xlYW4oYXBpUmVzdWx0ICYmIC9eMCskLy50ZXN0KGFwaVJlc3VsdCkpO1xuXG4gIGNvbnN0IHNlbmRRdWV1ZUxhYmVsID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgcGhhc2UgPSBxdWV1ZUVudHJ5Py5waGFzZTtcbiAgICBpZiAoIXBoYXNlKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGlmIChwaGFzZSA9PT0gJ2FjaycpIHJldHVybiAn5oiQ5YqfJztcbiAgICBpZiAocGhhc2UgPT09ICdmYWlsZWQnKSByZXR1cm4gJ+WkseaVlyc7XG4gICAgaWYgKHBoYXNlID09PSAncmV0cnknIHx8IHBoYXNlID09PSAnc2VudCcpIHJldHVybiAn5Yem55CG5LitJztcbiAgICBpZiAocGhhc2UgPT09ICdob2xkJykgcmV0dXJuICflvoXjgaHvvIjkv53nlZnvvIknO1xuICAgIHJldHVybiAn5b6F44GhJztcbiAgfSwgW3F1ZXVlRW50cnk/LnBoYXNlXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybjtcbiAgICBjb25zdCBoYW5kbGVPbmxpbmUgPSAoKSA9PiBzZXRJc09ubGluZSh0cnVlKTtcbiAgICBjb25zdCBoYW5kbGVPZmZsaW5lID0gKCkgPT4gc2V0SXNPbmxpbmUoZmFsc2UpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvbmxpbmUnLCBoYW5kbGVPbmxpbmUpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvZmZsaW5lJywgaGFuZGxlT2ZmbGluZSk7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvbmxpbmUnLCBoYW5kbGVPbmxpbmUpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ29mZmxpbmUnLCBoYW5kbGVPZmZsaW5lKTtcbiAgICB9O1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBpZiAob3V0cGF0aWVudFJlc3VsdFJlZi5jdXJyZW50KSByZXR1cm47XG4gICAgY29uc3Qgb3V0cHV0UmVzdWx0ID0gbG9hZE91dHBhdGllbnRPdXRwdXRSZXN1bHQoc3RvcmFnZVNjb3BlKTtcbiAgICBpZiAoIW91dHB1dFJlc3VsdCkgcmV0dXJuO1xuICAgIGNsZWFyT3V0cGF0aWVudE91dHB1dFJlc3VsdChzdG9yYWdlU2NvcGUpO1xuICAgIG91dHBhdGllbnRSZXN1bHRSZWYuY3VycmVudCA9IHRydWU7XG4gICAgY29uc3QgZGV0YWlsUGFydHMgPSBbXG4gICAgICBvdXRwdXRSZXN1bHQuZGV0YWlsLFxuICAgICAgb3V0cHV0UmVzdWx0LnJ1bklkID8gYHJ1bklkPSR7b3V0cHV0UmVzdWx0LnJ1bklkfWAgOiB1bmRlZmluZWQsXG4gICAgICBvdXRwdXRSZXN1bHQudHJhY2VJZCA/IGB0cmFjZUlkPSR7b3V0cHV0UmVzdWx0LnRyYWNlSWR9YCA6IHVuZGVmaW5lZCxcbiAgICAgIG91dHB1dFJlc3VsdC5lbmRwb2ludCA/IGBlbmRwb2ludD0ke291dHB1dFJlc3VsdC5lbmRwb2ludH1gIDogdW5kZWZpbmVkLFxuICAgICAgdHlwZW9mIG91dHB1dFJlc3VsdC5odHRwU3RhdHVzID09PSAnbnVtYmVyJyA/IGBIVFRQICR7b3V0cHV0UmVzdWx0Lmh0dHBTdGF0dXN9YCA6IHVuZGVmaW5lZCxcbiAgICBdLmZpbHRlcigocGFydCk6IHBhcnQgaXMgc3RyaW5nID0+IHR5cGVvZiBwYXJ0ID09PSAnc3RyaW5nJyAmJiBwYXJ0Lmxlbmd0aCA+IDApO1xuICAgIGNvbnN0IGRldGFpbCA9IGRldGFpbFBhcnRzLmpvaW4oJyAvICcpO1xuICAgIGlmIChvdXRwdXRSZXN1bHQub3V0Y29tZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICBzZXRCYW5uZXIobnVsbCk7XG4gICAgICBzZXRUb2FzdCh7XG4gICAgICAgIHRvbmU6ICdzdWNjZXNzJyxcbiAgICAgICAgbWVzc2FnZTogJ+WkluadpeWNsOWIt+OCkuWujOS6hicsXG4gICAgICAgIGRldGFpbCxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBpc0Jsb2NrZWQgPSBvdXRwdXRSZXN1bHQub3V0Y29tZSA9PT0gJ2Jsb2NrZWQnO1xuICAgIGNvbnN0IG5leHRBY3Rpb24gPSAn5Y2w5Yi3L+OCqOOCr+OCueODneODvOODiOOCkuWGjeW6pumWi+OBjyAvIFJlY2VwdGlvbiDjgaflho3lj5blvpcnO1xuICAgIHNldEJhbm5lcih7XG4gICAgICB0b25lOiBpc0Jsb2NrZWQgPyAnd2FybmluZycgOiAnZXJyb3InLFxuICAgICAgbWVzc2FnZTogaXNCbG9ja2VkID8gJ+WkluadpeWNsOWIt+OBjOWBnOatouOBleOCjOOBvuOBl+OBnycgOiAn5aSW5p2l5Y2w5Yi344Gr5aSx5pWX44GX44G+44GX44GfJyxcbiAgICAgIG5leHRBY3Rpb24sXG4gICAgfSk7XG4gICAgc2V0VG9hc3Qoe1xuICAgICAgdG9uZTogaXNCbG9ja2VkID8gJ3dhcm5pbmcnIDogJ2Vycm9yJyxcbiAgICAgIG1lc3NhZ2U6IGlzQmxvY2tlZCA/ICflpJbmnaXljbDliLfjgpLlgZzmraInIDogJ+WkluadpeWNsOWIt+OBq+WkseaVlycsXG4gICAgICBkZXRhaWwsXG4gICAgfSk7XG4gIH0sIFtdKTtcblxuICBjb25zdCBzZW5kUHJlY2hlY2tSZWFzb25zOiBHdWFyZFJlYXNvbltdID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgcmVhc29uczogR3VhcmRSZWFzb25bXSA9IFtdO1xuXG4gICAgaWYgKCFzZW5kRW5hYmxlZCkge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnY29uZmlnX2Rpc2FibGVkJyxcbiAgICAgICAgc3VtbWFyeTogJ+euoeeQhumFjeS/oTog6YCB5L+h5YGc5q2i44Gn6YCB5L+h5LiN5Y+vJyxcbiAgICAgICAgZGV0YWlsOiBzZW5kRGlzYWJsZWRSZWFzb24gPz8gJ+euoeeQhumFjeS/oeOBq+OCiOOCiiBPUkNBIOmAgeS/oeOBjOeEoeWKueWMluOBleOCjOOBpuOBhOOBvuOBmeOAgicsXG4gICAgICAgIG5leHQ6IFsnQWRtaW5pc3RyYXRpb24g44Gn5YaN6YWN5L+hJywgJ+ioreWumuOCkuWGjeWPluW+l+OBl+OBpuWPjeaYoOOCkueiuuiqjSddLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHVpTG9ja2VkKSB7XG4gICAgICByZWFzb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdsb2NrZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn5LuW44Gu5pON5L2cOiDlrp/ooYzkuK3jgafpgIHkv6HkuI3lj68nLFxuICAgICAgICBkZXRhaWw6IHJlc29sdmVkTG9ja1JlYXNvbiA/IHJlc29sdmVkTG9ja1JlYXNvbiA6ICfliKXjgqLjgq/jgrfjg6fjg7Plrp/ooYzkuK3jga7jgZ/jgoHpgIHkv6HjgafjgY3jgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ+ODreODg+OCr+ino+mZpCcsICflh6bnkIblrozkuobjgpLlvoXjgaPjgablho3oqabooYwnXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChyZWFkT25seSkge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnbG9ja2VkJyxcbiAgICAgICAgc3VtbWFyeTogJ+S4puihjOe3qOmbhjog6Zay6Kan5bCC55So44Gn6YCB5L+h5LiN5Y+vJyxcbiAgICAgICAgZGV0YWlsOiByZWFkT25seVJlYXNvbixcbiAgICAgICAgbmV4dDogWyfmnIDmlrDjgpLlho3oqq3ovrwnLCAn5Yil44K/44OW44KS6ZaJ44GY44KLJywgJ+W/heimgeOBquOCieODreODg+OCr+W8leOBjee2meOBju+8iOW8t+WItu+8iSddLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGFwcHJvdmFsTG9ja2VkKSB7XG4gICAgICByZWFzb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdhcHByb3ZhbF9sb2NrZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn5om/6KqN5riI44G/OiDnt6jpm4bkuI3lj6/jgafpgIHkv6HkuI3lj68nLFxuICAgICAgICBkZXRhaWw6IGFwcHJvdmFsUmVhc29uID8/ICfnvbLlkI3norrlrprmuIjjgb/jga7jgZ/jgoHnt6jpm4bjgafjgY3jgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ+W/heimgeOBquOCieaWsOimj+WPl+S7mOOBp+WGjeS9nOaIkCcsICfmib/oqo3lhoXlrrnjga7norroqo3vvIjnm6Pmn7vjg63jgrDvvIknXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChyZXF1aXJlUGF0aWVudEZvclNlbmQgJiYgIXBhdGllbnRJZCkge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAncGF0aWVudF9ub3Rfc2VsZWN0ZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn5oKj6ICF5pyq6YG45oqeOiDlr77osaHmnKrnorrlrprjgafpgIHkv6HkuI3lj68nLFxuICAgICAgICBkZXRhaWw6ICfmgqPogIXjgYzmnKrpgbjmip7jga7jgZ/jgoHpgIHkv6HlhYjjgYznorrlrprjgafjgY3jgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ1BhdGllbnRzIOOBp+aCo+iAheOCkumBuOaKnicsICdSZWNlcHRpb24g44G45oi744Gj44Gm5a++6LGh5oKj6ICF44KS56K65a6aJ10sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAocmVxdWlyZVNlcnZlclJvdXRlRm9yU2VuZCAmJiBkYXRhU291cmNlVHJhbnNpdGlvbiAhPT0gJ3NlcnZlcicpIHtcbiAgICAgIHJlYXNvbnMucHVzaCh7XG4gICAgICAgIGtleTogJ25vdF9zZXJ2ZXJfcm91dGUnLFxuICAgICAgICBzdW1tYXJ5OiAn44Or44O844OI5LiN5LiA6Ie0OiBzZXJ2ZXLku6XlpJbjgafpgIHkv6HkuI3lj68nLFxuICAgICAgICBkZXRhaWw6IGBkYXRhU291cmNlVHJhbnNpdGlvbj0ke2RhdGFTb3VyY2VUcmFuc2l0aW9ufSDjga7jgZ/jgoEgT1JDQSDpgIHkv6HjgpLlgZzmraLjgZfjgb7jgZnjgIJgLFxuICAgICAgICBuZXh0OiBbJ3NlcnZlciByb3V0ZSDjgavliIfmm7/vvIhNU1cgT0ZGIC8g5a6fIEFQSe+8iScsICdSZWNlcHRpb24g44Gn5YaN5Y+W5b6XJ10sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobWlzc2luZ01hc3Rlcikge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnbWlzc2luZ19tYXN0ZXInLFxuICAgICAgICBzdW1tYXJ5OiAn44Oe44K544K/5qyg5pCNOiBtaXNzaW5nTWFzdGVyPXRydWUg44Gn6YCB5L+h5LiN5Y+vJyxcbiAgICAgICAgZGV0YWlsOiAn44Oe44K544K/5qyg5pCN44KS5qSc55+l44GX44Gf44Gf44KB44CB6YCB5L+h44Gv5a6f5pa944Gn44GN44G+44Gb44KT44CCJyxcbiAgICAgICAgbmV4dDogWy4uLk1JU1NJTkdfTUFTVEVSX1JFQ09WRVJZX05FWFRfU1RFUFNdLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGZhbGxiYWNrVXNlZCkge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnZmFsbGJhY2tfdXNlZCcsXG4gICAgICAgIHN1bW1hcnk6ICfjg5Xjgqnjg7zjg6vjg5Djg4Pjgq86IGZhbGxiYWNrVXNlZD10cnVlIOOBp+mAgeS/oeS4jeWPrycsXG4gICAgICAgIGRldGFpbDogJ+ODleOCqeODvOODq+ODkOODg+OCr+e1jOi3r+OBruOBn+OCgeOAgemAgeS/oeOBr+Wun+aWveOBp+OBjeOBvuOBm+OCk+OAgicsXG4gICAgICAgIG5leHQ6IFsuLi5NSVNTSU5HX01BU1RFUl9SRUNPVkVSWV9ORVhUX1NURVBTXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChoYXNVbnNhdmVkRHJhZnQpIHtcbiAgICAgIHJlYXNvbnMucHVzaCh7XG4gICAgICAgIGtleTogJ2RyYWZ0X3Vuc2F2ZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn5pyq5L+d5a2Y44OJ44Op44OV44OIOiDkv53lrZjliY3jgafpgIHkv6HkuI3lj68nLFxuICAgICAgICBkZXRhaWw6ICfmnKrkv53lrZjjga7lhaXlipvjgYzjgYLjgovjgZ/jgoHjgIHpgIHkv6HliY3jgavjg4njg6njg5Xjg4jkv53lrZjjgYzlv4XopoHjgafjgZnjgIInLFxuICAgICAgICBuZXh0OiBbJ+ODieODqeODleODiOS/neWtmCcsICfkuI3opoHjgarjgonlhaXlipvjgpLmiLvjgZfjgabjgYvjgonlho3pgIEnXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghaXNPbmxpbmUpIHtcbiAgICAgIHJlYXNvbnMucHVzaCh7XG4gICAgICAgIGtleTogJ25ldHdvcmtfb2ZmbGluZScsXG4gICAgICAgIHN1bW1hcnk6ICfpgJrkv6Hmlq06IOOCquODleODqeOCpOODs+OBp+mAgeS/oeS4jeWPrycsXG4gICAgICAgIGRldGFpbDogJ+ODluODqeOCpuOCtuOBjCBvZmZsaW5lIOeKtuaFi+OBruOBn+OCgemAgeS/oeOBp+OBjeOBvuOBm+OCk+OAgicsXG4gICAgICAgIG5leHQ6IFsn6YCa5L+h5Zue5b6p44KS5b6F44GkJywgJ+Wbnue3mi/jg5fjg63jgq3jgrfoqK3lrprjgpLnorroqo0nXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChuZXR3b3JrRGVncmFkZWRSZWFzb24pIHtcbiAgICAgIHJlYXNvbnMucHVzaCh7XG4gICAgICAgIGtleTogJ25ldHdvcmtfZGVncmFkZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn6YCa5L+h5LiN5a6J5a6aOiDlho3lj5blvpfjgYzlv4XopoHjgafpgIHkv6HkuI3lj68nLFxuICAgICAgICBkZXRhaWw6IG5ldHdvcmtEZWdyYWRlZFJlYXNvbixcbiAgICAgICAgbmV4dDogWyflho3lj5blvpfjgZfjgabjgYvjgonlho3pgIEnLCAnUmVjZXB0aW9uIOOBuOaIu+OBo+OBpueKtuaFi+eiuuiqjSddLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHBlcm1pc3Npb25EZW5pZWQgfHwgIWhhc1Blcm1pc3Npb24pIHtcbiAgICAgIHJlYXNvbnMucHVzaCh7XG4gICAgICAgIGtleTogJ3Blcm1pc3Npb25fZGVuaWVkJyxcbiAgICAgICAgc3VtbWFyeTogJ+iqjeiovOS4jeWCmTog5qip6ZmQ5LiN6Laz44Gn6YCB5L+h5LiN5Y+vJyxcbiAgICAgICAgZGV0YWlsOiBwZXJtaXNzaW9uRGVuaWVkXG4gICAgICAgICAgPyAn55u06L+R44Gu6YCB5L+h44GnIDQwMS80MDMg44KS5qSc55+l44GX44G+44GX44Gf44CCJ1xuICAgICAgICAgIDogJ+iqjeiovOaDheWgseOBjOaPg+OBo+OBpuOBhOOBquOBhOOBn+OCgemAgeS/oeOCkuWBnOatouOBl+OBvuOBmeOAgicsXG4gICAgICAgIG5leHQ6IFsn5YaN44Ot44Kw44Kk44OzJywgJ+ioreWumueiuuiqje+8iGZhY2lsaXR5SWQvdXNlcklkL3Bhc3N3b3Jk77yJJ10sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVhc29ucztcbiAgfSwgW1xuICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgIGZhbGxiYWNrVXNlZCxcbiAgICBoYXNQZXJtaXNzaW9uLFxuICAgIGhhc1Vuc2F2ZWREcmFmdCxcbiAgICBpc09ubGluZSxcbiAgICByZXNvbHZlZExvY2tSZWFzb24sXG4gICAgbWlzc2luZ01hc3RlcixcbiAgICBuZXR3b3JrRGVncmFkZWRSZWFzb24sXG4gICAgcGF0aWVudElkLFxuICAgIHBlcm1pc3Npb25EZW5pZWQsXG4gICAgYXBwcm92YWxMb2NrZWQsXG4gICAgYXBwcm92YWxSZWFzb24sXG4gICAgcmVhZE9ubHksXG4gICAgcmVhZE9ubHlSZWFzb24sXG4gICAgcmVxdWlyZVNlcnZlclJvdXRlRm9yU2VuZCxcbiAgICByZXF1aXJlUGF0aWVudEZvclNlbmQsXG4gICAgc2VuZERpc2FibGVkUmVhc29uLFxuICAgIHNlbmRFbmFibGVkLFxuICAgIHVpTG9ja2VkLFxuICBdKTtcblxuICBjb25zdCBmaW5pc2hQcmVjaGVja1JlYXNvbnM6IEd1YXJkUmVhc29uW10gPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCByZWFzb25zOiBHdWFyZFJlYXNvbltdID0gW107XG5cbiAgICBpZiAoaXNSdW5uaW5nKSB7XG4gICAgICByZWFzb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdsb2NrZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn5LuW44Gu5pON5L2cOiDlrp/ooYzkuK3jgafoqLrnmYLntYLkuobkuI3lj68nLFxuICAgICAgICBkZXRhaWw6ICfliKXjgqLjgq/jgrfjg6fjg7Pjga7lrp/ooYzkuK3jga/oqLrnmYLntYLkuobjgpLplovlp4vjgafjgY3jgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ+WHpueQhuWujOS6huOCkuW+heOBpCddLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHVpTG9ja2VkKSB7XG4gICAgICByZWFzb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdsb2NrZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn44Ot44OD44Kv5LitOiDmk43kvZzkuK3jgafoqLrnmYLntYLkuobkuI3lj68nLFxuICAgICAgICBkZXRhaWw6IHJlc29sdmVkTG9ja1JlYXNvbiA/IHJlc29sdmVkTG9ja1JlYXNvbiA6ICfliKXjgqLjgq/jgrfjg6fjg7Plrp/ooYzkuK3jga7jgZ/jgoHoqLrnmYLntYLkuobjgafjgY3jgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ+ODreODg+OCr+ino+mZpCcsICflh6bnkIblrozkuobjgpLlvoXjgaPjgablho3oqabooYwnXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChyZWFkT25seSkge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnbG9ja2VkJyxcbiAgICAgICAgc3VtbWFyeTogJ+S4puihjOe3qOmbhjog6Zay6Kan5bCC55So44Gn6Ki655mC57WC5LqG5LiN5Y+vJyxcbiAgICAgICAgZGV0YWlsOiByZWFkT25seVJlYXNvbixcbiAgICAgICAgbmV4dDogWyfmnIDmlrDjgpLlho3oqq3ovrwnLCAn5Yil44K/44OW44KS6ZaJ44GY44KLJywgJ+W/heimgeOBquOCieODreODg+OCr+W8leOBjee2meOBju+8iOW8t+WItu+8iSddLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGFwcHJvdmFsTG9ja2VkKSB7XG4gICAgICByZWFzb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdhcHByb3ZhbF9sb2NrZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn5om/6KqN5riI44G/OiDnt6jpm4bkuI3lj6/jgafoqLrnmYLntYLkuobkuI3lj68nLFxuICAgICAgICBkZXRhaWw6IGFwcHJvdmFsUmVhc29uID8/ICfnvbLlkI3norrlrprmuIjjgb/jga7jgZ/jgoHnt6jpm4bjgafjgY3jgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ+W/heimgeOBquOCieaWsOimj+WPl+S7mOOBp+WGjeS9nOaIkCcsICfmib/oqo3lhoXlrrnjga7norroqo3vvIjnm6Pmn7vjg63jgrDvvIknXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZWFzb25zO1xuICB9LCBbYXBwcm92YWxMb2NrZWQsIGFwcHJvdmFsUmVhc29uLCBpc1J1bm5pbmcsIHJlYWRPbmx5LCByZWFkT25seVJlYXNvbiwgcmVzb2x2ZWRMb2NrUmVhc29uLCB1aUxvY2tlZF0pO1xuXG4gIGNvbnN0IHNlbmREaXNhYmxlZCA9IGlzUnVubmluZyB8fCBhcHByb3ZhbExvY2tlZCB8fCBzZW5kUHJlY2hlY2tSZWFzb25zLmxlbmd0aCA+IDA7XG5cbiAgY29uc3QgcHJpbnRQcmVjaGVja1JlYXNvbnM6IEd1YXJkUmVhc29uW10gPSB1c2VNZW1vKCgpID0+IHtcbiAgICBjb25zdCByZWFzb25zOiBHdWFyZFJlYXNvbltdID0gW107XG5cbiAgICBpZiAoaXNSdW5uaW5nKSB7XG4gICAgICByZWFzb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdsb2NrZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn5LuW44Gu5pON5L2cOiDlrp/ooYzkuK3jgafljbDliLfkuI3lj68nLFxuICAgICAgICBkZXRhaWw6ICfliKXjgqLjgq/jgrfjg6fjg7Pjga7lrp/ooYzkuK3jga/ljbDliLfjgpLplovlp4vjgafjgY3jgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ+WHpueQhuWujOS6huOCkuW+heOBo+OBpuWGjeippuihjCddLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHVpTG9ja2VkKSB7XG4gICAgICByZWFzb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdsb2NrZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn44Ot44OD44Kv5LitOiDmk43kvZzkuK3jgafljbDliLfkuI3lj68nLFxuICAgICAgICBkZXRhaWw6IHJlc29sdmVkTG9ja1JlYXNvbiA/IHJlc29sdmVkTG9ja1JlYXNvbiA6ICfliKXjgqLjgq/jgrfjg6fjg7Plrp/ooYzkuK3jga7jgZ/jgoHljbDliLfjgafjgY3jgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ+ODreODg+OCr+ino+mZpCcsICflh6bnkIblrozkuobjgpLlvoXjgaPjgablho3oqabooYwnXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChyZWFkT25seSkge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnbG9ja2VkJyxcbiAgICAgICAgc3VtbWFyeTogJ+S4puihjOe3qOmbhjog6Zay6Kan5bCC55So44Gn5Y2w5Yi35LiN5Y+vJyxcbiAgICAgICAgZGV0YWlsOiByZWFkT25seVJlYXNvbixcbiAgICAgICAgbmV4dDogWyfmnIDmlrDjgpLlho3oqq3ovrwnLCAn5Yil44K/44OW44KS6ZaJ44GY44KLJywgJ+W/heimgeOBquOCieODreODg+OCr+W8leOBjee2meOBju+8iOW8t+WItu+8iSddLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGFwcHJvdmFsTG9ja2VkKSB7XG4gICAgICByZWFzb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdhcHByb3ZhbF9sb2NrZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn5om/6KqN5riI44G/OiDnt6jpm4bkuI3lj6/jgafljbDliLfkuI3lj68nLFxuICAgICAgICBkZXRhaWw6IGFwcHJvdmFsUmVhc29uID8/ICfnvbLlkI3norrlrprmuIjjgb/jga7jgZ/jgoHnt6jpm4bjgafjgY3jgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ+W/heimgeOBquOCieaWsOimj+WPl+S7mOOBp+WGjeS9nOaIkCcsICfmib/oqo3lhoXlrrnjga7norroqo3vvIjnm6Pmn7vjg63jgrDvvIknXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghc2VsZWN0ZWRFbnRyeSkge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAncGF0aWVudF9ub3Rfc2VsZWN0ZWQnLFxuICAgICAgICBzdW1tYXJ5OiAn5oKj6ICF5pyq6YG45oqeOiDlr77osaHmnKrnorrlrprjgafljbDliLfkuI3lj68nLFxuICAgICAgICBkZXRhaWw6ICfmgqPogIXjgYzmnKrpgbjmip7jga7jgZ/jgoHljbDliLfjg5fjg6zjg5Pjg6Xjg7zjgpLplovjgZHjgb7jgZvjgpPjgIInLFxuICAgICAgICBuZXh0OiBbJ1BhdGllbnRzIOOBp+aCo+iAheOCkumBuOaKnicsICdSZWNlcHRpb24g44G45oi744Gj44Gm5a++6LGh5oKj6ICF44KS56K65a6aJ10sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAobWlzc2luZ01hc3Rlcikge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnbWlzc2luZ19tYXN0ZXInLFxuICAgICAgICBzdW1tYXJ5OiAn44Oe44K544K/5qyg5pCNOiBtaXNzaW5nTWFzdGVyPXRydWUg44Gn5Y2w5Yi35LiN5Y+vJyxcbiAgICAgICAgZGV0YWlsOiAn44Oe44K544K/5qyg5pCN44KS5qSc55+l44GX44Gf44Gf44KB5Ye65Yqb44KS5YGc5q2i44GX44G+44GZ44CCJyxcbiAgICAgICAgbmV4dDogWy4uLk1JU1NJTkdfTUFTVEVSX1JFQ09WRVJZX05FWFRfU1RFUFNdLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGZhbGxiYWNrVXNlZCkge1xuICAgICAgcmVhc29ucy5wdXNoKHtcbiAgICAgICAga2V5OiAnZmFsbGJhY2tfdXNlZCcsXG4gICAgICAgIHN1bW1hcnk6ICfjg5Xjgqnjg7zjg6vjg5Djg4Pjgq86IGZhbGxiYWNrVXNlZD10cnVlIOOBp+WNsOWIt+S4jeWPrycsXG4gICAgICAgIGRldGFpbDogJ+ODleOCqeODvOODq+ODkOODg+OCr+e1jOi3r+OBruOBn+OCgeWHuuWKm+OCkuWBnOatouOBl+OBvuOBmeOAgicsXG4gICAgICAgIG5leHQ6IFsuLi5NSVNTSU5HX01BU1RFUl9SRUNPVkVSWV9ORVhUX1NURVBTXSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChwZXJtaXNzaW9uRGVuaWVkIHx8ICFoYXNQZXJtaXNzaW9uKSB7XG4gICAgICByZWFzb25zLnB1c2goe1xuICAgICAgICBrZXk6ICdwZXJtaXNzaW9uX2RlbmllZCcsXG4gICAgICAgIHN1bW1hcnk6ICfoqo3oqLzkuI3lgpk6IOaoqemZkOS4jei2s+OBp+WNsOWIt+S4jeWPrycsXG4gICAgICAgIGRldGFpbDogcGVybWlzc2lvbkRlbmllZFxuICAgICAgICAgID8gJ+ebtOi/keOBrumAgeS/oeOBpyA0MDEvNDAzIOOCkuaknOefpeOBl+OBvuOBl+OBn+OAgidcbiAgICAgICAgICA6ICfoqo3oqLzmg4XloLHjgYzmj4PjgaPjgabjgYTjgarjgYTjgZ/jgoHlh7rlipvjgpLlgZzmraLjgZfjgb7jgZnjgIInLFxuICAgICAgICBuZXh0OiBbJ+WGjeODreOCsOOCpOODsycsICfoqK3lrprnorroqo3vvIhmYWNpbGl0eUlkL3VzZXJJZC9wYXNzd29yZO+8iSddLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlYXNvbnM7XG4gIH0sIFtcbiAgICBhcHByb3ZhbExvY2tlZCxcbiAgICBhcHByb3ZhbFJlYXNvbixcbiAgICBmYWxsYmFja1VzZWQsXG4gICAgaGFzUGVybWlzc2lvbixcbiAgICBpc1J1bm5pbmcsXG4gICAgcmVzb2x2ZWRMb2NrUmVhc29uLFxuICAgIG1pc3NpbmdNYXN0ZXIsXG4gICAgcGVybWlzc2lvbkRlbmllZCxcbiAgICByZWFkT25seSxcbiAgICByZWFkT25seVJlYXNvbixcbiAgICBzZWxlY3RlZEVudHJ5LFxuICAgIHVpTG9ja2VkLFxuICBdKTtcblxuICBjb25zdCBwcmludERpc2FibGVkID0gcHJpbnRQcmVjaGVja1JlYXNvbnMubGVuZ3RoID4gMDtcbiAgY29uc3Qgb3RoZXJCbG9ja2VkID0gaXNMb2NrZWQ7XG4gIGNvbnN0IGd1YXJkU3VtbWFyaWVzID0gdXNlTWVtbygoKSA9PiB7XG4gICAgY29uc3QgZW50cmllczogeyBrZXk6IHN0cmluZzsgYWN0aW9uOiBzdHJpbmc7IHN1bW1hcnk6IHN0cmluZzsgbmV4dEFjdGlvbj86IHN0cmluZyB9W10gPSBbXTtcbiAgICBpZiAoZmluaXNoUHJlY2hlY2tSZWFzb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHN1bW1hcnkgPSBzdW1tYXJpemVHdWFyZFJlYXNvbnMoZmluaXNoUHJlY2hlY2tSZWFzb25zKTtcbiAgICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICAgIGVudHJpZXMucHVzaCh7XG4gICAgICAgICAga2V5OiAnZmluaXNoJyxcbiAgICAgICAgICBhY3Rpb246IEFDVElPTl9MQUJFTC5maW5pc2gsXG4gICAgICAgICAgc3VtbWFyeTogc3VtbWFyeS5zdW1tYXJ5LFxuICAgICAgICAgIG5leHRBY3Rpb246IHN1bW1hcnkubmV4dEFjdGlvbnM/LmpvaW4oJyAvICcpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNlbmRQcmVjaGVja1JlYXNvbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgc3VtbWFyeSA9IHN1bW1hcml6ZUd1YXJkUmVhc29ucyhzZW5kUHJlY2hlY2tSZWFzb25zKTtcbiAgICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICAgIGVudHJpZXMucHVzaCh7XG4gICAgICAgICAga2V5OiAnc2VuZCcsXG4gICAgICAgICAgYWN0aW9uOiBBQ1RJT05fTEFCRUwuc2VuZCxcbiAgICAgICAgICBzdW1tYXJ5OiBzdW1tYXJ5LnN1bW1hcnksXG4gICAgICAgICAgbmV4dEFjdGlvbjogc3VtbWFyeS5uZXh0QWN0aW9ucz8uam9pbignIC8gJyksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocHJpbnRQcmVjaGVja1JlYXNvbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgc3VtbWFyeSA9IHN1bW1hcml6ZUd1YXJkUmVhc29ucyhwcmludFByZWNoZWNrUmVhc29ucyk7XG4gICAgICBpZiAoc3VtbWFyeSkge1xuICAgICAgICBlbnRyaWVzLnB1c2goe1xuICAgICAgICAgIGtleTogJ3ByaW50JyxcbiAgICAgICAgICBhY3Rpb246IEFDVElPTl9MQUJFTC5wcmludCxcbiAgICAgICAgICBzdW1tYXJ5OiBzdW1tYXJ5LnN1bW1hcnksXG4gICAgICAgICAgbmV4dEFjdGlvbjogc3VtbWFyeS5uZXh0QWN0aW9ucz8uam9pbignIC8gJyksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfSwgW2ZpbmlzaFByZWNoZWNrUmVhc29ucywgcHJpbnRQcmVjaGVja1JlYXNvbnMsIHNlbmRQcmVjaGVja1JlYXNvbnNdKTtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBvbkxvY2tDaGFuZ2U/LihhY3Rpb25Mb2NrZWQsIHJlc29sdmVkTG9ja1JlYXNvbiA/PyB1bmRlZmluZWQpO1xuICB9LCBbYWN0aW9uTG9ja2VkLCBvbkxvY2tDaGFuZ2UsIHJlc29sdmVkTG9ja1JlYXNvbl0pO1xuXG4gIGNvbnN0IHN0YXR1c0xpbmUgPSB1c2VNZW1vKCgpID0+IHtcbiAgICBpZiAoaXNSdW5uaW5nICYmIHJ1bm5pbmdBY3Rpb24pIHtcbiAgICAgIHJldHVybiBgJHtBQ1RJT05fTEFCRUxbcnVubmluZ0FjdGlvbl1944KS5a6f6KGM5Lit4oCmIGRhdGFTb3VyY2VUcmFuc2l0aW9uPSR7ZGF0YVNvdXJjZVRyYW5zaXRpb259YDtcbiAgICB9XG4gICAgaWYgKGFwcHJvdmFsTG9ja2VkKSB7XG4gICAgICByZXR1cm4gYOaJv+iqjea4iOOBv++8iOe9suWQjeeiuuWumu+8iTog57eo6ZuG5LiN5Y+v77yIcnVuSWQ9JHthcHByb3ZhbExvY2s/LnJ1bklkID8/IHJ1bklkfe+8iWA7XG4gICAgfVxuICAgIGlmIChyZXNvbHZlZExvY2tSZWFzb24pIHJldHVybiByZXNvbHZlZExvY2tSZWFzb247XG4gICAgaWYgKHJlYWRPbmx5KSByZXR1cm4gcmVhZE9ubHlSZWFzb247XG4gICAgaWYgKHNlbmRQcmVjaGVja1JlYXNvbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgc3VtbWFyeSA9IHN1bW1hcml6ZUd1YXJkUmVhc29ucyhzZW5kUHJlY2hlY2tSZWFzb25zKTtcbiAgICAgIHJldHVybiBg6YCB5L+h44Ks44O844OJOiAke3N1bW1hcnk/LnN1bW1hcnkgPz8gc2VuZFByZWNoZWNrUmVhc29uc1swXS5zdW1tYXJ5fWA7XG4gICAgfVxuICAgIGlmIChwcmludFByZWNoZWNrUmVhc29ucy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBzdW1tYXJ5ID0gc3VtbWFyaXplR3VhcmRSZWFzb25zKHByaW50UHJlY2hlY2tSZWFzb25zKTtcbiAgICAgIHJldHVybiBg5Y2w5Yi344Ks44O844OJOiAke3N1bW1hcnk/LnN1bW1hcnkgPz8gcHJpbnRQcmVjaGVja1JlYXNvbnNbMF0uc3VtbWFyeX1gO1xuICAgIH1cbiAgICBpZiAoZmluaXNoUHJlY2hlY2tSZWFzb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHN1bW1hcnkgPSBzdW1tYXJpemVHdWFyZFJlYXNvbnMoZmluaXNoUHJlY2hlY2tSZWFzb25zKTtcbiAgICAgIHJldHVybiBg6Ki655mC57WC5LqG44Ks44O844OJOiAke3N1bW1hcnk/LnN1bW1hcnkgPz8gZmluaXNoUHJlY2hlY2tSZWFzb25zWzBdLnN1bW1hcnl9YDtcbiAgICB9XG4gICAgaWYgKHNlbmRRdWV1ZUxhYmVsKSB7XG4gICAgICByZXR1cm4gYOmAgeS/oeeKtuaFizogJHtzZW5kUXVldWVMYWJlbH3vvIhydW5JZD0ke3J1bklkfSAvIHRyYWNlSWQ9JHtyZXNvbHZlZFRyYWNlSWQgPz8gJ3Vua25vd24nfSR7cXVldWVFbnRyeT8ucmVxdWVzdElkID8gYCAvIHJlcXVlc3RJZD0ke3F1ZXVlRW50cnkucmVxdWVzdElkfWAgOiAnJ33vvIlgO1xuICAgIH1cbiAgICByZXR1cm4gJ+OCouOCr+OCt+ODp+ODs+OCkumBuOaKnuOBp+OBjeOBvuOBmSc7XG4gIH0sIFtcbiAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICBpc1J1bm5pbmcsXG4gICAgcmVzb2x2ZWRMb2NrUmVhc29uLFxuICAgIHF1ZXVlRW50cnk/LnJlcXVlc3RJZCxcbiAgICByZWFkT25seSxcbiAgICByZWFkT25seVJlYXNvbixcbiAgICByZXNvbHZlZFRyYWNlSWQsXG4gICAgcnVuSWQsXG4gICAgcnVubmluZ0FjdGlvbixcbiAgICBzZW5kUHJlY2hlY2tSZWFzb25zLFxuICAgIHNlbmRRdWV1ZUxhYmVsLFxuICAgIGFwcHJvdmFsTG9ja2VkLFxuICAgIGFwcHJvdmFsTG9jaz8ucnVuSWQsXG4gICAgZmluaXNoUHJlY2hlY2tSZWFzb25zLFxuICAgIHByaW50UHJlY2hlY2tSZWFzb25zLFxuICBdKTtcblxuICBjb25zdCBsb2dUZWxlbWV0cnkgPSAoXG4gICAgYWN0aW9uOiBDaGFydEFjdGlvbixcbiAgICBvdXRjb21lOiAnc3VjY2VzcycgfCAnZXJyb3InIHwgJ2Jsb2NrZWQnIHwgJ3N0YXJ0ZWQnLFxuICAgIGR1cmF0aW9uTXM/OiBudW1iZXIsXG4gICAgbm90ZT86IHN0cmluZyxcbiAgICByZWFzb24/OiBzdHJpbmcsXG4gICAgbWV0YT86IHsgcnVuSWQ/OiBzdHJpbmc7IHRyYWNlSWQ/OiBzdHJpbmcgfSxcbiAgKSA9PiB7XG4gICAgcmVjb3JkT3V0cGF0aWVudEZ1bm5lbCgnY2hhcnRzX2FjdGlvbicsIHtcbiAgICAgIGFjdGlvbixcbiAgICAgIG91dGNvbWUsXG4gICAgICBkdXJhdGlvbk1zLFxuICAgICAgbm90ZSxcbiAgICAgIHJlYXNvbixcbiAgICAgIGNhY2hlSGl0LFxuICAgICAgbWlzc2luZ01hc3RlcixcbiAgICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgcnVuSWQ6IG1ldGE/LnJ1bklkID8/IHJ1bklkLFxuICAgICAgdHJhY2VJZDogbWV0YT8udHJhY2VJZCA/PyByZXNvbHZlZFRyYWNlSWQsXG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgYnVpbGRGYWxsYmFja0RldGFpbHMgPSAoKSA9PiB7XG4gICAgY29uc3QgZGV0YWlsczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgICBpZiAoIXBhdGllbnRJZCAmJiByZXNvbHZlZFBhdGllbnRJZCkgZGV0YWlscy5mYWxsYmFja1BhdGllbnRJZCA9IHJlc29sdmVkUGF0aWVudElkO1xuICAgIGlmICghcXVldWVFbnRyeT8uYXBwb2ludG1lbnRJZCAmJiByZXNvbHZlZEFwcG9pbnRtZW50SWQpIGRldGFpbHMuZmFsbGJhY2tBcHBvaW50bWVudElkID0gcmVzb2x2ZWRBcHBvaW50bWVudElkO1xuICAgIGlmICgoIXBhdGllbnRJZCB8fCAhcXVldWVFbnRyeT8uYXBwb2ludG1lbnRJZCkgJiYgcmVzb2x2ZWRSZWNlcHRpb25JZCkgZGV0YWlscy5mYWxsYmFja1JlY2VwdGlvbklkID0gcmVzb2x2ZWRSZWNlcHRpb25JZDtcbiAgICBpZiAoZWRpdExvY2s/LmxvY2tTdGF0dXMpIGRldGFpbHMubG9ja1N0YXR1cyA9IGVkaXRMb2NrLmxvY2tTdGF0dXM7XG4gICAgcmV0dXJuIGRldGFpbHM7XG4gIH07XG5cbiAgY29uc3QgYnVpbGRPdXRwYXRpZW50UGF5bG9hZCA9ICgpID0+IHtcbiAgICBjb25zdCBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICAgIGlmIChyZXNvbHZlZFZpc2l0RGF0ZSkge1xuICAgICAgcGF5bG9hZC5hcHBvaW50bWVudERhdGUgPSByZXNvbHZlZFZpc2l0RGF0ZTtcbiAgICAgIHBheWxvYWQuZGF0ZSA9IHJlc29sdmVkVmlzaXREYXRlO1xuICAgIH1cbiAgICBpZiAocmVzb2x2ZWRBcHBvaW50bWVudElkKSBwYXlsb2FkLmFwcG9pbnRtZW50SWQgPSByZXNvbHZlZEFwcG9pbnRtZW50SWQ7XG4gICAgaWYgKHJlc29sdmVkUmVjZXB0aW9uSWQpIHBheWxvYWQucmVjZXB0aW9uSWQgPSByZXNvbHZlZFJlY2VwdGlvbklkO1xuICAgIGlmIChyZXNvbHZlZFBhdGllbnRJZCkge1xuICAgICAgcGF5bG9hZC5QYXRpZW50X0lEID0gcmVzb2x2ZWRQYXRpZW50SWQ7XG4gICAgICBwYXlsb2FkLnBhdGllbnRJZCA9IHJlc29sdmVkUGF0aWVudElkO1xuICAgICAgcGF5bG9hZC5wYXRpZW50SW5mb3JtYXRpb24gPSB7IFBhdGllbnRfSUQ6IHJlc29sdmVkUGF0aWVudElkIH07XG4gICAgfVxuICAgIHJldHVybiBwYXlsb2FkO1xuICB9O1xuXG4gIGNvbnN0IGxvZ0F1ZGl0ID0gKFxuICAgIGFjdGlvbjogQ2hhcnRBY3Rpb24sXG4gICAgb3V0Y29tZTogJ3N1Y2Nlc3MnIHwgJ2Vycm9yJyB8ICdibG9ja2VkJyB8ICdzdGFydGVkJyxcbiAgICBkZXRhaWw/OiBzdHJpbmcsXG4gICAgZHVyYXRpb25Ncz86IG51bWJlcixcbiAgICBvcHRpb25zPzogeyBwaGFzZT86IENoYXJ0c09wZXJhdGlvblBoYXNlOyBkZXRhaWxzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfSxcbiAgKSA9PiB7XG4gICAgY29uc3QgYWN0aW9uTWFwOiBSZWNvcmQ8Q2hhcnRBY3Rpb24sICdFTkNPVU5URVJfQ0xPU0UnIHwgJ09SQ0FfU0VORCcgfCAnRFJBRlRfU0FWRScgfCAnRFJBRlRfQ0FOQ0VMJyB8ICdQUklOVF9PVVRQQVRJRU5UJz4gPSB7XG4gICAgICBmaW5pc2g6ICdFTkNPVU5URVJfQ0xPU0UnLFxuICAgICAgc2VuZDogJ09SQ0FfU0VORCcsXG4gICAgICBkcmFmdDogJ0RSQUZUX1NBVkUnLFxuICAgICAgY2FuY2VsOiAnRFJBRlRfQ0FOQ0VMJyxcbiAgICAgIHByaW50OiAnUFJJTlRfT1VUUEFUSUVOVCcsXG4gICAgfTtcbiAgICBjb25zdCBub3JtYWxpemVkQWN0aW9uID0gb3V0Y29tZSA9PT0gJ2Vycm9yJyA/ICdDSEFSVFNfQUNUSU9OX0ZBSUxVUkUnIDogYWN0aW9uTWFwW2FjdGlvbl07XG4gICAgY29uc3QgcGhhc2UgPSBvcHRpb25zPy5waGFzZSA/PyAob3V0Y29tZSA9PT0gJ2Jsb2NrZWQnID8gJ2xvY2snIDogJ2RvJyk7XG4gICAgY29uc3QgZGV0YWlsczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7XG4gICAgICBvcGVyYXRpb25QaGFzZTogcGhhc2UsXG4gICAgICAuLi4oYWN0aW9uID09PSAnc2VuZCcgfHwgYWN0aW9uID09PSAnZmluaXNoJ1xuICAgICAgICA/IHtcbiAgICAgICAgICAgIC4uLihyZXNvbHZlZFZpc2l0RGF0ZSA/IHsgdmlzaXREYXRlOiByZXNvbHZlZFZpc2l0RGF0ZSB9IDoge30pLFxuICAgICAgICAgIH1cbiAgICAgICAgOiB7fSksXG4gICAgICAuLi5idWlsZEZhbGxiYWNrRGV0YWlscygpLFxuICAgICAgLi4ub3B0aW9ucz8uZGV0YWlscyxcbiAgICB9O1xuICAgIHJlY29yZENoYXJ0c0F1ZGl0RXZlbnQoe1xuICAgICAgYWN0aW9uOiBub3JtYWxpemVkQWN0aW9uLFxuICAgICAgb3V0Y29tZSxcbiAgICAgIHN1YmplY3Q6IGBjaGFydHMtYWN0aW9uLSR7YWN0aW9ufWAsXG4gICAgICBub3RlOiBkZXRhaWwsXG4gICAgICBlcnJvcjogb3V0Y29tZSA9PT0gJ2Vycm9yJyA/IGRldGFpbCA6IHVuZGVmaW5lZCxcbiAgICAgIGR1cmF0aW9uTXMsXG4gICAgICBwYXRpZW50SWQ6IHJlc29sdmVkUGF0aWVudElkLFxuICAgICAgYXBwb2ludG1lbnRJZDogcmVzb2x2ZWRBcHBvaW50bWVudElkLFxuICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICBjYWNoZUhpdCxcbiAgICAgIG1pc3NpbmdNYXN0ZXIsXG4gICAgICBmYWxsYmFja1VzZWQsXG4gICAgICBydW5JZCxcbiAgICAgIGRldGFpbHMsXG4gICAgfSk7XG4gICAgaWYgKGFjdGlvbiA9PT0gJ3NlbmQnKSB7XG4gICAgICBsb2dBdWRpdEV2ZW50KHtcbiAgICAgICAgcnVuSWQsXG4gICAgICAgIGNhY2hlSGl0LFxuICAgICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgICBmYWxsYmFja1VzZWQsXG4gICAgICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgICAgICBwYXlsb2FkOiB7XG4gICAgICAgICAgYWN0aW9uOiAnb3JjYV9jbGFpbV9zZW5kJyxcbiAgICAgICAgICBvdXRjb21lLFxuICAgICAgICAgIHN1YmplY3Q6IGBjaGFydHMtYWN0aW9uLSR7YWN0aW9ufWAsXG4gICAgICAgICAgZGV0YWlscyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBhcHByb3ZhbFNlc3Npb25SZWYgPSB1c2VSZWY8eyBhY3Rpb246IENoYXJ0QWN0aW9uOyBjbG9zZWQ6IGJvb2xlYW4gfSB8IG51bGw+KG51bGwpO1xuXG4gIGNvbnN0IGxvZ0FwcHJvdmFsID0gKGFjdGlvbjogQ2hhcnRBY3Rpb24sIHN0YXRlOiAnb3BlbicgfCAnY29uZmlybWVkJyB8ICdjYW5jZWxsZWQnKSA9PiB7XG4gICAgY29uc3QgYmxvY2tlZFJlYXNvbnMgPSBzdGF0ZSA9PT0gJ2NhbmNlbGxlZCcgPyBbJ2NvbmZpcm1fY2FuY2VsbGVkJ10gOiB1bmRlZmluZWQ7XG4gICAgbG9nVWlTdGF0ZSh7XG4gICAgICBhY3Rpb246IGFjdGlvbiA9PT0gJ3ByaW50JyA/ICdwcmludCcgOiAnc2VuZCcsXG4gICAgICBzY3JlZW46ICdjaGFydHMvYWN0aW9uLWJhcicsXG4gICAgICBjb250cm9sSWQ6IGBhY3Rpb24tJHthY3Rpb259LWFwcHJvdmFsYCxcbiAgICAgIHJ1bklkLFxuICAgICAgY2FjaGVIaXQsXG4gICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICBmYWxsYmFja1VzZWQsXG4gICAgICBkZXRhaWxzOiB7XG4gICAgICAgIG9wZXJhdGlvblBoYXNlOiAnYXBwcm92YWwnLFxuICAgICAgICBhcHByb3ZhbFN0YXRlOiBzdGF0ZSxcbiAgICAgICAgcGF0aWVudElkOiByZXNvbHZlZFBhdGllbnRJZCxcbiAgICAgICAgYXBwb2ludG1lbnRJZDogcmVzb2x2ZWRBcHBvaW50bWVudElkLFxuICAgICAgICByZXF1ZXN0SWQ6IHF1ZXVlRW50cnk/LnJlcXVlc3RJZCxcbiAgICAgICAgdHJhY2VJZDogcmVzb2x2ZWRUcmFjZUlkLFxuICAgICAgICAuLi4oYmxvY2tlZFJlYXNvbnMgPyB7IGJsb2NrZWRSZWFzb25zIH0gOiB7fSksXG4gICAgICAgIC4uLmJ1aWxkRmFsbGJhY2tEZXRhaWxzKCksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGxvZ0F1ZGl0KGFjdGlvbiwgc3RhdGUgPT09ICdvcGVuJyB8fCBzdGF0ZSA9PT0gJ2NvbmZpcm1lZCcgPyAnc3RhcnRlZCcgOiAnYmxvY2tlZCcsIGBhcHByb3ZhbF8ke3N0YXRlfWAsIHVuZGVmaW5lZCwge1xuICAgICAgcGhhc2U6ICdhcHByb3ZhbCcsXG4gICAgICBkZXRhaWxzOiB7XG4gICAgICAgIGFwcHJvdmFsU3RhdGU6IHN0YXRlLFxuICAgICAgICByZXF1ZXN0SWQ6IHF1ZXVlRW50cnk/LnJlcXVlc3RJZCxcbiAgICAgICAgdHJhY2VJZDogcmVzb2x2ZWRUcmFjZUlkLFxuICAgICAgICAuLi4oYmxvY2tlZFJlYXNvbnMgPyB7IGJsb2NrZWRSZWFzb25zIH0gOiB7fSksXG4gICAgICAgIC4uLmJ1aWxkRmFsbGJhY2tEZXRhaWxzKCksXG4gICAgICB9LFxuICAgIH0pO1xuICB9O1xuXG4gIGNvbnN0IGZpbmFsaXplQXBwcm92YWwgPSAoYWN0aW9uOiBDaGFydEFjdGlvbiwgc3RhdGU6ICdjb25maXJtZWQnIHwgJ2NhbmNlbGxlZCcpID0+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXBwcm92YWxTZXNzaW9uUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFzZXNzaW9uIHx8IHNlc3Npb24uYWN0aW9uICE9PSBhY3Rpb24gfHwgc2Vzc2lvbi5jbG9zZWQpIHJldHVybjtcbiAgICBzZXNzaW9uLmNsb3NlZCA9IHRydWU7XG4gICAgbG9nQXBwcm92YWwoYWN0aW9uLCBzdGF0ZSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlQWN0aW9uID0gYXN5bmMgKGFjdGlvbjogQ2hhcnRBY3Rpb24pID0+IHtcbiAgICBpZiAoaXNSdW5uaW5nKSByZXR1cm47XG5cbiAgICBpZiAoYXBwcm92YWxMb2NrZWQpIHtcbiAgICAgIGNvbnN0IGJsb2NrZWRSZWFzb24gPSBhcHByb3ZhbFJlYXNvbiA/PyAn572y5ZCN56K65a6a5riI44G/44Gu44Gf44KB57eo6ZuG44Gn44GN44G+44Gb44KT44CCJztcbiAgICAgIHNldFRvYXN0KHtcbiAgICAgICAgdG9uZTogJ3dhcm5pbmcnLFxuICAgICAgICBtZXNzYWdlOiBgJHtBQ1RJT05fTEFCRUxbYWN0aW9uXX3jgpLlgZzmraJgLFxuICAgICAgICBkZXRhaWw6IGJsb2NrZWRSZWFzb24sXG4gICAgICB9KTtcbiAgICAgIHNldFJldHJ5QWN0aW9uKG51bGwpO1xuICAgICAgbG9nVGVsZW1ldHJ5KGFjdGlvbiwgJ2Jsb2NrZWQnLCB1bmRlZmluZWQsIGJsb2NrZWRSZWFzb24sIGJsb2NrZWRSZWFzb24pO1xuICAgICAgbG9nVWlTdGF0ZSh7XG4gICAgICAgIGFjdGlvbjpcbiAgICAgICAgICBhY3Rpb24gPT09ICdkcmFmdCdcbiAgICAgICAgICAgID8gJ2RyYWZ0J1xuICAgICAgICAgICAgOiBhY3Rpb24gPT09ICdmaW5pc2gnXG4gICAgICAgICAgICAgID8gJ2ZpbmlzaCdcbiAgICAgICAgICAgICAgOiBhY3Rpb24gPT09ICdjYW5jZWwnXG4gICAgICAgICAgICAgICAgPyAnY2FuY2VsJ1xuICAgICAgICAgICAgICAgIDogYWN0aW9uID09PSAncHJpbnQnXG4gICAgICAgICAgICAgICAgICA/ICdwcmludCdcbiAgICAgICAgICAgICAgICAgIDogJ3NlbmQnLFxuICAgICAgICBzY3JlZW46ICdjaGFydHMvYWN0aW9uLWJhcicsXG4gICAgICAgIGNvbnRyb2xJZDogYGFjdGlvbi0ke2FjdGlvbn1gLFxuICAgICAgICBydW5JZCxcbiAgICAgICAgY2FjaGVIaXQsXG4gICAgICAgIG1pc3NpbmdNYXN0ZXIsXG4gICAgICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgICAgICBmYWxsYmFja1VzZWQsXG4gICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICBvcGVyYXRpb25QaGFzZTogJ2xvY2snLFxuICAgICAgICAgIGJsb2NrZWQ6IHRydWUsXG4gICAgICAgICAgcmVhc29uczogWydhcHByb3ZhbF9sb2NrZWQnXSxcbiAgICAgICAgICB0cmFjZUlkOiByZXNvbHZlZFRyYWNlSWQsXG4gICAgICAgICAgYXBwcm92YWw6IGFwcHJvdmFsTG9jayA/PyBudWxsLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBsb2dBdWRpdChhY3Rpb24sICdibG9ja2VkJywgYmxvY2tlZFJlYXNvbiwgdW5kZWZpbmVkLCB7XG4gICAgICAgIHBoYXNlOiAnbG9jaycsXG4gICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICB0cmlnZ2VyOiAnYXBwcm92YWxfbG9ja2VkJyxcbiAgICAgICAgICBibG9ja2VkUmVhc29uczogWydhcHByb3ZhbF9sb2NrZWQnXSxcbiAgICAgICAgICBhcHByb3ZhbFN0YXRlOiAnY29uZmlybWVkJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChyZWFkT25seSkge1xuICAgICAgY29uc3QgYmxvY2tlZFJlYXNvbiA9IHJlYWRPbmx5UmVhc29uO1xuICAgICAgc2V0VG9hc3Qoe1xuICAgICAgICB0b25lOiAnd2FybmluZycsXG4gICAgICAgIG1lc3NhZ2U6IGAke0FDVElPTl9MQUJFTFthY3Rpb25dfeOCkuWBnOatomAsXG4gICAgICAgIGRldGFpbDogYmxvY2tlZFJlYXNvbixcbiAgICAgIH0pO1xuICAgICAgc2V0UmV0cnlBY3Rpb24obnVsbCk7XG4gICAgICBsb2dUZWxlbWV0cnkoYWN0aW9uLCAnYmxvY2tlZCcsIHVuZGVmaW5lZCwgYmxvY2tlZFJlYXNvbiwgYmxvY2tlZFJlYXNvbik7XG4gICAgICBsb2dVaVN0YXRlKHtcbiAgICAgICAgYWN0aW9uOlxuICAgICAgICAgIGFjdGlvbiA9PT0gJ2RyYWZ0J1xuICAgICAgICAgICAgPyAnZHJhZnQnXG4gICAgICAgICAgICA6IGFjdGlvbiA9PT0gJ2ZpbmlzaCdcbiAgICAgICAgICAgICAgPyAnZmluaXNoJ1xuICAgICAgICAgICAgICA6IGFjdGlvbiA9PT0gJ2NhbmNlbCdcbiAgICAgICAgICAgICAgICA/ICdjYW5jZWwnXG4gICAgICAgICAgICAgICAgOiBhY3Rpb24gPT09ICdwcmludCdcbiAgICAgICAgICAgICAgICAgID8gJ3ByaW50J1xuICAgICAgICAgICAgICAgICAgOiAnc2VuZCcsXG4gICAgICAgIHNjcmVlbjogJ2NoYXJ0cy9hY3Rpb24tYmFyJyxcbiAgICAgICAgY29udHJvbElkOiBgYWN0aW9uLSR7YWN0aW9ufWAsXG4gICAgICAgIHJ1bklkLFxuICAgICAgICBjYWNoZUhpdCxcbiAgICAgICAgbWlzc2luZ01hc3RlcixcbiAgICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICAgIGZhbGxiYWNrVXNlZCxcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIG9wZXJhdGlvblBoYXNlOiAnbG9jaycsXG4gICAgICAgICAgYmxvY2tlZDogdHJ1ZSxcbiAgICAgICAgICByZWFzb25zOiBbJ2VkaXRfbG9ja19jb25mbGljdCddLFxuICAgICAgICAgIHRyYWNlSWQ6IHJlc29sdmVkVHJhY2VJZCxcbiAgICAgICAgICBsb2NrU3RhdHVzOiBlZGl0TG9jaz8ubG9ja1N0YXR1cyxcbiAgICAgICAgICBlZGl0TG9jazogZWRpdExvY2sgPz8gbnVsbCxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgbG9nQXVkaXQoYWN0aW9uLCAnYmxvY2tlZCcsIGJsb2NrZWRSZWFzb24sIHVuZGVmaW5lZCwge1xuICAgICAgICBwaGFzZTogJ2xvY2snLFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgdHJpZ2dlcjogJ2VkaXRfbG9jaycsXG4gICAgICAgICAgdHJhY2VJZDogcmVzb2x2ZWRUcmFjZUlkLFxuICAgICAgICAgIGJsb2NrZWRSZWFzb25zOiBbJ2VkaXRfbG9ja19jb25mbGljdCddLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGFjdGlvbiA9PT0gJ3NlbmQnICYmIHNlbmRQcmVjaGVja1JlYXNvbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgYmxvY2tlZFJlYXNvbiA9IHNlbmRQcmVjaGVja1JlYXNvbnNcbiAgICAgICAgLm1hcCgocmVhc29uKSA9PiBgJHtyZWFzb24uc3VtbWFyeX06ICR7cmVhc29uLmRldGFpbH1gKVxuICAgICAgICAuam9pbignIC8gJyk7XG4gICAgICBzZXRCYW5uZXIoe1xuICAgICAgICB0b25lOiAnd2FybmluZycsXG4gICAgICAgIG1lc3NhZ2U6IGBPUkNB6YCB5L+h44KS5YGc5q2iOiAke2Jsb2NrZWRSZWFzb259YCxcbiAgICAgICAgbmV4dEFjdGlvbjogJ+mAgeS/oeWJjeODgeOCp+ODg+OCr++8iOeQhueUse+8ieOCkueiuuiqjeOBl+OAgeW/heimgeOBquOCiSBSZWNlcHRpb24g44Gn5YaN5Y+W5b6X44GX44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgIH0pO1xuICAgICAgc2V0UmV0cnlBY3Rpb24obnVsbCk7XG4gICAgICBzZXRUb2FzdChudWxsKTtcbiAgICAgIGxvZ1RlbGVtZXRyeShhY3Rpb24sICdibG9ja2VkJywgdW5kZWZpbmVkLCBibG9ja2VkUmVhc29uLCBibG9ja2VkUmVhc29uKTtcbiAgICAgIGxvZ1VpU3RhdGUoe1xuICAgICAgICBhY3Rpb246ICdzZW5kJyxcbiAgICAgICAgc2NyZWVuOiAnY2hhcnRzL2FjdGlvbi1iYXInLFxuICAgICAgICBjb250cm9sSWQ6IGBhY3Rpb24tJHthY3Rpb259YCxcbiAgICAgICAgcnVuSWQsXG4gICAgICAgIGNhY2hlSGl0LFxuICAgICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgb3BlcmF0aW9uUGhhc2U6ICdsb2NrJyxcbiAgICAgICAgICBibG9ja2VkOiB0cnVlLFxuICAgICAgICAgIHJlYXNvbnM6IHNlbmRQcmVjaGVja1JlYXNvbnMubWFwKChyZWFzb24pID0+IHJlYXNvbi5rZXkpLFxuICAgICAgICAgIHRyYWNlSWQ6IHJlc29sdmVkVHJhY2VJZCxcbiAgICAgICAgICBsb2NrU3RhdHVzOiBlZGl0TG9jaz8ubG9ja1N0YXR1cyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgbG9nQXVkaXQoYWN0aW9uLCAnYmxvY2tlZCcsIGJsb2NrZWRSZWFzb24sIHVuZGVmaW5lZCwge1xuICAgICAgICBwaGFzZTogJ2xvY2snLFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgdHJpZ2dlcjogJ3ByZWNoZWNrJyxcbiAgICAgICAgICB0cmFjZUlkOiByZXNvbHZlZFRyYWNlSWQsXG4gICAgICAgICAgcmVhc29uczogc2VuZFByZWNoZWNrUmVhc29ucy5tYXAoKHJlYXNvbikgPT4gcmVhc29uLmtleSksXG4gICAgICAgICAgYmxvY2tlZFJlYXNvbnM6IHNlbmRQcmVjaGVja1JlYXNvbnMubWFwKChyZWFzb24pID0+IHJlYXNvbi5rZXkpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGFjdGlvbiA9PT0gJ3NlbmQnICYmICFwYXRpZW50SWQpIHtcbiAgICAgIGNvbnN0IGJsb2NrZWRSZWFzb24gPSAn5oKj6ICFSUTjgYzmnKrnorrlrprjga7jgZ/jgoEgT1JDQSDpgIHkv6HjgpLlrp/ooYzjgafjgY3jgb7jgZvjgpPjgIJQYXRpZW50cyDjgafmgqPogIXjgpLpgbjmip7jgZfjgabjgY/jgaDjgZXjgYTjgIInO1xuICAgICAgc2V0QmFubmVyKHsgdG9uZTogJ3dhcm5pbmcnLCBtZXNzYWdlOiBgT1JDQemAgeS/oeOCkuWBnOatojogJHtibG9ja2VkUmVhc29ufWAsIG5leHRBY3Rpb246ICdQYXRpZW50cyDjgaflr77osaHmgqPogIXjgpLpgbjmip7jgZfjgabjgY/jgaDjgZXjgYTjgIInIH0pO1xuICAgICAgc2V0UmV0cnlBY3Rpb24obnVsbCk7XG4gICAgICBzZXRUb2FzdChudWxsKTtcbiAgICAgIGxvZ1RlbGVtZXRyeShhY3Rpb24sICdibG9ja2VkJywgdW5kZWZpbmVkLCBibG9ja2VkUmVhc29uLCBibG9ja2VkUmVhc29uKTtcbiAgICAgIGxvZ1VpU3RhdGUoe1xuICAgICAgICBhY3Rpb246ICdzZW5kJyxcbiAgICAgICAgc2NyZWVuOiAnY2hhcnRzL2FjdGlvbi1iYXInLFxuICAgICAgICBjb250cm9sSWQ6IGBhY3Rpb24tJHthY3Rpb259YCxcbiAgICAgICAgcnVuSWQsXG4gICAgICAgIGNhY2hlSGl0LFxuICAgICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgICBkZXRhaWxzOiB7IG9wZXJhdGlvblBoYXNlOiAnbG9jaycsIGJsb2NrZWQ6IHRydWUsIHJlYXNvbnM6IFsncGF0aWVudF9ub3Rfc2VsZWN0ZWQnXSwgdHJhY2VJZDogcmVzb2x2ZWRUcmFjZUlkIH0sXG4gICAgICB9KTtcbiAgICAgIGxvZ0F1ZGl0KGFjdGlvbiwgJ2Jsb2NrZWQnLCBibG9ja2VkUmVhc29uLCB1bmRlZmluZWQsIHtcbiAgICAgICAgcGhhc2U6ICdsb2NrJyxcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIHRyaWdnZXI6ICdwYXRpZW50X25vdF9zZWxlY3RlZCcsXG4gICAgICAgICAgdHJhY2VJZDogcmVzb2x2ZWRUcmFjZUlkLFxuICAgICAgICAgIGJsb2NrZWRSZWFzb25zOiBbJ3BhdGllbnRfbm90X3NlbGVjdGVkJ10sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoYWN0aW9uID09PSAnc2VuZCcgJiYgKGZhbGxiYWNrVXNlZCB8fCBtaXNzaW5nTWFzdGVyKSkge1xuICAgICAgc2V0QmFubmVyKHtcbiAgICAgICAgdG9uZTogJ3dhcm5pbmcnLFxuICAgICAgICBtZXNzYWdlOiBtaXNzaW5nTWFzdGVyXG4gICAgICAgICAgPyAnbWlzc2luZ01hc3Rlcj10cnVlIOOCkuaknOefpeOBl+OBvuOBl+OBn+OAgumAgeS/oeWJjeOBqyBtYXN0ZXIg44KS5YaN5Y+W5b6X44GX44Gm44GP44Gg44GV44GE44CCJ1xuICAgICAgICAgIDogJ2ZhbGxiYWNrVXNlZD10cnVlIOOCkuaknOefpeOBl+OBvuOBl+OBn+OAgumAgeS/oeWJjeOBqyBtYXN0ZXIg6Kej5raI77yIc2VydmVyIHJvdXRl77yJ44KS56K66KqN44GX44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgbmV4dEFjdGlvbjogTUlTU0lOR19NQVNURVJfUkVDT1ZFUllfTkVYVF9TVEVQUy5qb2luKCcgLyAnKSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0ZWRBdCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIHNldElzUnVubmluZyh0cnVlKTtcbiAgICBzZXRSdW5uaW5nQWN0aW9uKGFjdGlvbik7XG4gICAgc2V0UmV0cnlBY3Rpb24obnVsbCk7XG4gICAgc2V0VG9hc3QobnVsbCk7XG5cbiAgICBsb2dVaVN0YXRlKHtcbiAgICAgIGFjdGlvbjpcbiAgICAgICAgYWN0aW9uID09PSAnZHJhZnQnXG4gICAgICAgICAgPyAnZHJhZnQnXG4gICAgICAgICAgOiBhY3Rpb24gPT09ICdmaW5pc2gnXG4gICAgICAgICAgICA/ICdmaW5pc2gnXG4gICAgICAgICAgICA6IGFjdGlvbiA9PT0gJ2NhbmNlbCdcbiAgICAgICAgICAgICAgPyAnY2FuY2VsJ1xuICAgICAgICAgICAgICA6IGFjdGlvbiA9PT0gJ3ByaW50J1xuICAgICAgICAgICAgICAgID8gJ3ByaW50J1xuICAgICAgICAgICAgICAgIDogJ3NlbmQnLFxuICAgICAgc2NyZWVuOiAnY2hhcnRzL2FjdGlvbi1iYXInLFxuICAgICAgY29udHJvbElkOiBgYWN0aW9uLSR7YWN0aW9ufWAsXG4gICAgICBydW5JZCxcbiAgICAgIGNhY2hlSGl0LFxuICAgICAgbWlzc2luZ01hc3RlcixcbiAgICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgZGV0YWlsczoge1xuICAgICAgICBvcGVyYXRpb25QaGFzZTogJ2RvJyxcbiAgICAgICAgcGF0aWVudElkOiByZXNvbHZlZFBhdGllbnRJZCxcbiAgICAgICAgYXBwb2ludG1lbnRJZDogcmVzb2x2ZWRBcHBvaW50bWVudElkLFxuICAgICAgICByZXF1ZXN0SWQ6IHF1ZXVlRW50cnk/LnJlcXVlc3RJZCxcbiAgICAgICAgdHJhY2VJZDogcmVzb2x2ZWRUcmFjZUlkLFxuICAgICAgICAuLi5idWlsZEZhbGxiYWNrRGV0YWlscygpLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBsb2dUZWxlbWV0cnkoYWN0aW9uLCAnc3RhcnRlZCcpO1xuICAgIGxvZ0F1ZGl0KGFjdGlvbiwgJ3N0YXJ0ZWQnLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgeyBwaGFzZTogJ2RvJyB9KTtcblxuICAgIGxldCB0aW1lb3V0SWQ6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIGFib3J0Q29udHJvbGxlclJlZi5jdXJyZW50ID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgY29uc3Qgc2lnbmFsID0gYWJvcnRDb250cm9sbGVyUmVmLmN1cnJlbnQuc2lnbmFsO1xuICAgICAgY29uc3QgdGltZW91dE1zID0gcmVzb2x2ZUFjdGlvblRpbWVvdXRNcyhhY3Rpb24pO1xuICAgICAgdGltZW91dElkID0gdGltZW91dE1zID4gMCA/IHNldFRpbWVvdXQoKCkgPT4gYWJvcnRDb250cm9sbGVyUmVmLmN1cnJlbnQ/LmFib3J0KCksIHRpbWVvdXRNcykgOiBudWxsO1xuXG4gICAgICBpZiAoYWN0aW9uID09PSAnc2VuZCcgfHwgYWN0aW9uID09PSAnZmluaXNoJykge1xuICAgICAgICBpZiAoYWN0aW9uID09PSAnc2VuZCcpIHtcbiAgICAgICAgICBjb25zdCBkZXBhcnRtZW50Q29kZSA9IHJlc29sdmVEZXBhcnRtZW50Q29kZShzZWxlY3RlZEVudHJ5Py5kZXBhcnRtZW50KTtcbiAgICAgICAgICBjb25zdCBjYWxjdWxhdGlvbkRhdGUgPSBub3JtYWxpemVWaXNpdERhdGUocmVzb2x2ZWRWaXNpdERhdGUpO1xuICAgICAgICAgIGNvbnN0IG1pc3NpbmdGaWVsZHMgPSBbXG4gICAgICAgICAgICAhcmVzb2x2ZWRQYXRpZW50SWQgPyAnUGF0aWVudF9JRCcgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAhY2FsY3VsYXRpb25EYXRlID8gJ1BlcmZvcm1fRGF0ZScgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAhZGVwYXJ0bWVudENvZGUgPyAnRGVwYXJ0bWVudF9Db2RlJyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBdLmZpbHRlcigoZmllbGQpOiBmaWVsZCBpcyBzdHJpbmcgPT4gQm9vbGVhbihmaWVsZCkpO1xuICAgICAgICAgIGlmIChtaXNzaW5nRmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGJsb2NrZWRSZWFzb24gPSBgbWVkaWNhbG1vZHYyIOOCkuWBnOatojogJHttaXNzaW5nRmllbGRzLmpvaW4oJywgJyl9IOOBjOS4jei2s+OBl+OBpuOBhOOBvuOBmeOAgmA7XG4gICAgICAgICAgICBzZXRCYW5uZXIoe1xuICAgICAgICAgICAgICB0b25lOiAnd2FybmluZycsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGBPUkNB6YCB5L+h44KS5YGc5q2iOiAke2Jsb2NrZWRSZWFzb259YCxcbiAgICAgICAgICAgICAgbmV4dEFjdGlvbjogJ1JlY2VwdGlvbiDjgafmgqPogIUv6Ki655mC56eRL+aXpeS7mOOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhOOAgicsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNldElzUnVubmluZyhmYWxzZSk7XG4gICAgICAgICAgICBzZXRSdW5uaW5nQWN0aW9uKG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghcmVzb2x2ZWRQYXRpZW50SWQgfHwgIWNhbGN1bGF0aW9uRGF0ZSB8fCAhZGVwYXJ0bWVudENvZGUpIHtcbiAgICAgICAgICAgIHNldElzUnVubmluZyhmYWxzZSk7XG4gICAgICAgICAgICBzZXRSdW5uaW5nQWN0aW9uKG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHJlcXVlc3RYbWwgPSBidWlsZE1lZGljYWxNb2RWMlJlcXVlc3RYbWwoe1xuICAgICAgICAgICAgcGF0aWVudElkOiByZXNvbHZlZFBhdGllbnRJZCxcbiAgICAgICAgICAgIHBlcmZvcm1EYXRlOiBjYWxjdWxhdGlvbkRhdGUsXG4gICAgICAgICAgICBkZXBhcnRtZW50Q29kZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwb3N0T3JjYU1lZGljYWxNb2RWMlhtbChyZXF1ZXN0WG1sLCB7IGNsYXNzQ29kZTogJzAxJywgc2lnbmFsIH0pO1xuICAgICAgICAgIGNvbnN0IGFwaVJlc3VsdE9rID0gaXNBcGlSZXN1bHRPayhyZXN1bHQuYXBpUmVzdWx0KTtcbiAgICAgICAgICBjb25zdCBoYXNNaXNzaW5nVGFncyA9IEJvb2xlYW4ocmVzdWx0Lm1pc3NpbmdUYWdzPy5sZW5ndGgpO1xuICAgICAgICAgIGNvbnN0IG91dGNvbWUgPSByZXN1bHQub2sgJiYgYXBpUmVzdWx0T2sgJiYgIWhhc01pc3NpbmdUYWdzID8gJ3N1Y2Nlc3MnIDogcmVzdWx0Lm9rID8gJ3dhcm5pbmcnIDogJ2Vycm9yJztcbiAgICAgICAgICBjb25zdCBkdXJhdGlvbk1zID0gTWF0aC5yb3VuZChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0ZWRBdCk7XG4gICAgICAgICAgY29uc3QgbmV4dFJ1bklkID0gcmVzdWx0LnJ1bklkID8/IGdldE9ic2VydmFiaWxpdHlNZXRhKCkucnVuSWQgPz8gcnVuSWQ7XG4gICAgICAgICAgY29uc3QgbmV4dFRyYWNlSWQgPSByZXN1bHQudHJhY2VJZCA/PyBnZXRPYnNlcnZhYmlsaXR5TWV0YSgpLnRyYWNlSWQgPz8gcmVzb2x2ZWRUcmFjZUlkO1xuICAgICAgICAgIGNvbnN0IGRldGFpbFBhcnRzID0gW1xuICAgICAgICAgICAgYHJ1bklkPSR7bmV4dFJ1bklkfWAsXG4gICAgICAgICAgICBgdHJhY2VJZD0ke25leHRUcmFjZUlkID8/ICd1bmtub3duJ31gLFxuICAgICAgICAgICAgcmVzdWx0LmFwaVJlc3VsdCA/IGBBcGlfUmVzdWx0PSR7cmVzdWx0LmFwaVJlc3VsdH1gIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVzdWx0Lmludm9pY2VOdW1iZXIgPyBgSW52b2ljZV9OdW1iZXI9JHtyZXN1bHQuaW52b2ljZU51bWJlcn1gIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVzdWx0LmRhdGFJZCA/IGBEYXRhX0lkPSR7cmVzdWx0LmRhdGFJZH1gIDogdW5kZWZpbmVkLFxuICAgICAgICAgIF0uZmlsdGVyKChwYXJ0KTogcGFydCBpcyBzdHJpbmcgPT4gQm9vbGVhbihwYXJ0KSk7XG5cbiAgICAgICAgICBsZXQgcmV0cnlNZXRhOlxuICAgICAgICAgICAgfCB7IHJldHJ5UmVxdWVzdGVkPzogYm9vbGVhbjsgcmV0cnlBcHBsaWVkPzogYm9vbGVhbjsgcmV0cnlSZWFzb24/OiBzdHJpbmc7IHF1ZXVlUnVuSWQ/OiBzdHJpbmc7IHF1ZXVlVHJhY2VJZD86IHN0cmluZyB9XG4gICAgICAgICAgICB8IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAob3V0Y29tZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICBzZXRCYW5uZXIobnVsbCk7XG4gICAgICAgICAgICBzZXRUb2FzdCh7XG4gICAgICAgICAgICAgIHRvbmU6ICdzdWNjZXNzJyxcbiAgICAgICAgICAgICAgbWVzc2FnZTogJ09SQ0HpgIHkv6HjgpLlrozkuoYnLFxuICAgICAgICAgICAgICBkZXRhaWw6IGRldGFpbFBhcnRzLmpvaW4oJyAvICcpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChyZXNvbHZlZFBhdGllbnRJZCkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJldHJ5UmVzcG9uc2UgPSBhd2FpdCBodHRwRmV0Y2goYC9hcGkvb3JjYS9xdWV1ZT9wYXRpZW50SWQ9JHtyZXNvbHZlZFBhdGllbnRJZH0mcmV0cnk9MWAsIHtcbiAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmV0cnlKc29uID0gKGF3YWl0IHJldHJ5UmVzcG9uc2UuanNvbigpLmNhdGNoKCgpID0+ICh7fSkpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICAgICAgICAgICAgICByZXRyeU1ldGEgPSB7XG4gICAgICAgICAgICAgICAgICByZXRyeVJlcXVlc3RlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgIHJldHJ5QXBwbGllZDogQm9vbGVhbihyZXRyeUpzb24ucmV0cnlBcHBsaWVkKSxcbiAgICAgICAgICAgICAgICAgIHJldHJ5UmVhc29uOiB0eXBlb2YgcmV0cnlKc29uLnJldHJ5UmVhc29uID09PSAnc3RyaW5nJyA/IHJldHJ5SnNvbi5yZXRyeVJlYXNvbiA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgIHF1ZXVlUnVuSWQ6IHR5cGVvZiByZXRyeUpzb24ucnVuSWQgPT09ICdzdHJpbmcnID8gcmV0cnlKc29uLnJ1bklkIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgcXVldWVUcmFjZUlkOiB0eXBlb2YgcmV0cnlKc29uLnRyYWNlSWQgPT09ICdzdHJpbmcnID8gcmV0cnlKc29uLnRyYWNlSWQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgcmV0cnlNZXRhID0geyByZXRyeVJlcXVlc3RlZDogdHJ1ZSwgcmV0cnlBcHBsaWVkOiBmYWxzZSwgcmV0cnlSZWFzb246ICdyZXRyeV9yZXF1ZXN0X2ZhaWxlZCcgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0QmFubmVyKHtcbiAgICAgICAgICAgICAgdG9uZTogb3V0Y29tZSA9PT0gJ2Vycm9yJyA/ICdlcnJvcicgOiAnd2FybmluZycsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGBPUkNB6YCB5L+h44Gr6K2m5ZGKL+WkseaVlzogJHtkZXRhaWxQYXJ0cy5qb2luKCcgLyAnKX1gLFxuICAgICAgICAgICAgICBuZXh0QWN0aW9uOiAnT1JDQSDlv5znrZTjgpLnorroqo3jgZflho3pgIHjgZfjgabjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZXRUb2FzdCh7XG4gICAgICAgICAgICAgIHRvbmU6IG91dGNvbWUgPT09ICdlcnJvcicgPyAnZXJyb3InIDogJ3dhcm5pbmcnLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBvdXRjb21lID09PSAnZXJyb3InID8gJ09SQ0HpgIHkv6HjgavlpLHmlZcnIDogJ09SQ0HpgIHkv6HjgavorablkYonLFxuICAgICAgICAgICAgICBkZXRhaWw6IGRldGFpbFBhcnRzLmpvaW4oJyAvICcpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbG9nVGVsZW1ldHJ5KFxuICAgICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgICAgb3V0Y29tZSA9PT0gJ3N1Y2Nlc3MnID8gJ3N1Y2Nlc3MnIDogJ2Vycm9yJyxcbiAgICAgICAgICAgIGR1cmF0aW9uTXMsXG4gICAgICAgICAgICBkZXRhaWxQYXJ0cy5qb2luKCcgLyAnKSxcbiAgICAgICAgICAgIHJlc3VsdC5hcGlSZXN1bHQsXG4gICAgICAgICAgICB7IHJ1bklkOiBuZXh0UnVuSWQsIHRyYWNlSWQ6IG5leHRUcmFjZUlkID8/IHVuZGVmaW5lZCB9LFxuICAgICAgICAgICk7XG4gICAgICAgICAgbG9nQXVkaXQoYWN0aW9uLCBvdXRjb21lID09PSAnc3VjY2VzcycgPyAnc3VjY2VzcycgOiAnZXJyb3InLCBkZXRhaWxQYXJ0cy5qb2luKCcgLyAnKSwgZHVyYXRpb25Ncywge1xuICAgICAgICAgICAgcGhhc2U6ICdkbycsXG4gICAgICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgICAgIGVuZHBvaW50OiAnL2FwaTIxL21lZGljYWxtb2R2MicsXG4gICAgICAgICAgICAgIGh0dHBTdGF0dXM6IHJlc3VsdC5zdGF0dXMsXG4gICAgICAgICAgICAgIGFwaVJlc3VsdDogcmVzdWx0LmFwaVJlc3VsdCxcbiAgICAgICAgICAgICAgYXBpUmVzdWx0TWVzc2FnZTogcmVzdWx0LmFwaVJlc3VsdE1lc3NhZ2UsXG4gICAgICAgICAgICAgIGludm9pY2VOdW1iZXI6IHJlc3VsdC5pbnZvaWNlTnVtYmVyLFxuICAgICAgICAgICAgICBkYXRhSWQ6IHJlc3VsdC5kYXRhSWQsXG4gICAgICAgICAgICAgIG1pc3NpbmdUYWdzOiByZXN1bHQubWlzc2luZ1RhZ3MsXG4gICAgICAgICAgICAgIHJldHJ5UXVldWU6IHJldHJ5TWV0YSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAocmVzb2x2ZWRQYXRpZW50SWQpIHtcbiAgICAgICAgICAgIHNhdmVPcmNhQ2xhaW1TZW5kQ2FjaGUoXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXRpZW50SWQ6IHJlc29sdmVkUGF0aWVudElkLFxuICAgICAgICAgICAgICAgIGFwcG9pbnRtZW50SWQ6IHJlc29sdmVkQXBwb2ludG1lbnRJZCxcbiAgICAgICAgICAgICAgICBpbnZvaWNlTnVtYmVyOiByZXN1bHQuaW52b2ljZU51bWJlcixcbiAgICAgICAgICAgICAgICBkYXRhSWQ6IHJlc3VsdC5kYXRhSWQsXG4gICAgICAgICAgICAgICAgcnVuSWQ6IG5leHRSdW5JZCxcbiAgICAgICAgICAgICAgICB0cmFjZUlkOiBuZXh0VHJhY2VJZCA/PyB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgYXBpUmVzdWx0OiByZXN1bHQuYXBpUmVzdWx0LFxuICAgICAgICAgICAgICAgIHNlbmRTdGF0dXM6IG91dGNvbWUgPT09ICdzdWNjZXNzJyA/ICdzdWNjZXNzJyA6ICdlcnJvcicsXG4gICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlOiBvdXRjb21lID09PSAnc3VjY2VzcycgPyB1bmRlZmluZWQgOiBkZXRhaWxQYXJ0cy5qb2luKCcgLyAnKSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgc3RvcmFnZVNjb3BlLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBtZWRpY2FsbW9kdjIzIOOCkuW+jOe2muOBp+Wun+ihjO+8iOiouueZgue1guS6huebuOW9k++8ieOAgue1kOaenOOBr+WPguiAg+aDheWgseOBqOOBl+OBpuaJseOBhuOAglxuICAgICAgICAgIGNvbnN0IHYyM1JlcXVlc3RYbWwgPSBidWlsZE1lZGljYWxNb2RWMjNSZXF1ZXN0WG1sKHtcbiAgICAgICAgICAgIHBhdGllbnRJZDogcmVzb2x2ZWRQYXRpZW50SWQgPz8gJycsXG4gICAgICAgICAgICByZXF1ZXN0TnVtYmVyOiAnMDEnLFxuICAgICAgICAgICAgZmlyc3RDYWxjdWxhdGlvbkRhdGU6IGNhbGN1bGF0aW9uRGF0ZSxcbiAgICAgICAgICAgIGxhc3RWaXNpdERhdGU6IGNhbGN1bGF0aW9uRGF0ZSxcbiAgICAgICAgICAgIGRlcGFydG1lbnRDb2RlLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBwb3N0T3JjYU1lZGljYWxNb2RWMjNYbWwodjIzUmVxdWVzdFhtbCwgeyBzaWduYWwgfSk7XG4gICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyB2MjMg5aSx5pWX44Gv6K2m5ZGK44Gu44G/77yI5pei5a2Y44Ot44K444OD44Kv44Gn5o2V5o2J5riI44G/77yJ44CC44GT44GT44Gn44Gv5o+h44KK44Gk44G244GZ44CCXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdm9pZCBQcm9taXNlLnJlc29sdmUob25BZnRlclNlbmQ/LigpKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgICAgIGxvZ1VpU3RhdGUoe1xuICAgICAgICAgICAgICBhY3Rpb246ICdzZW5kJyxcbiAgICAgICAgICAgICAgc2NyZWVuOiAnY2hhcnRzL2FjdGlvbi1iYXInLFxuICAgICAgICAgICAgICBjb250cm9sSWQ6ICdhY3Rpb24tc2VuZCcsXG4gICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICBjYWNoZUhpdCxcbiAgICAgICAgICAgICAgbWlzc2luZ01hc3RlcixcbiAgICAgICAgICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICAgICAgICAgIGZhbGxiYWNrVXNlZCxcbiAgICAgICAgICAgICAgZGV0YWlsczogeyBvcGVyYXRpb25QaGFzZTogJ2FmdGVyX3NlbmQnLCBlcnJvcjogZGV0YWlsIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgZW5kcG9pbnQgPSAnL29yY2EyMS9tZWRpY2FsbW9kdjIvb3V0cGF0aWVudCc7XG4gICAgICAgICAgY29uc3QgcGF5bG9hZCA9IGJ1aWxkT3V0cGF0aWVudFBheWxvYWQoKTtcbiAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGh0dHBGZXRjaChlbmRwb2ludCwge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnN0IGpzb24gPSAoYXdhaXQgcmVzcG9uc2UuanNvbigpLmNhdGNoKCgpID0+ICh7fSkpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICAgICAgICBjb25zdCByZXNwb25zZVJ1bklkID0gdHlwZW9mIGpzb24ucnVuSWQgPT09ICdzdHJpbmcnID8ganNvbi5ydW5JZCA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb25zdCByZXNwb25zZVRyYWNlSWQgPSB0eXBlb2YganNvbi50cmFjZUlkID09PSAnc3RyaW5nJyA/IGpzb24udHJhY2VJZCA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb25zdCByZXNwb25zZVJlcXVlc3RJZCA9IHR5cGVvZiBqc29uLnJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyBqc29uLnJlcXVlc3RJZCA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb25zdCByZXNwb25zZU91dGNvbWUgPSB0eXBlb2YganNvbi5vdXRjb21lID09PSAnc3RyaW5nJyA/IGpzb24ub3V0Y29tZSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb25zdCByZXNwb25zZUFwaVJlc3VsdCA9IHR5cGVvZiBqc29uLmFwaVJlc3VsdCA9PT0gJ3N0cmluZycgPyBqc29uLmFwaVJlc3VsdCA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb25zdCByZXNwb25zZUFwaVJlc3VsdE1lc3NhZ2UgPSB0eXBlb2YganNvbi5hcGlSZXN1bHRNZXNzYWdlID09PSAnc3RyaW5nJyA/IGpzb24uYXBpUmVzdWx0TWVzc2FnZSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSA0MDEgfHwgcmVzcG9uc2Uuc3RhdHVzID09PSA0MDMpIHtcbiAgICAgICAgICAgIHNldFBlcm1pc3Npb25EZW5pZWQodHJ1ZSk7XG4gICAgICAgICAgICBjb25zdCBhdXRoRXJyb3IgPSBuZXcgRXJyb3IoYOaoqemZkOS4jei2s++8iEhUVFAgJHtyZXNwb25zZS5zdGF0dXN977yJ44CC5YaN44Ot44Kw44Kk44Oz44G+44Gf44Gv5qip6ZmQ6Kit5a6a44KS56K66KqN44GX44Gm44GP44Gg44GV44GE44CCYCkgYXMgRXJyb3IgJiB7XG4gICAgICAgICAgICAgIGFwaURldGFpbHM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhdXRoRXJyb3IuYXBpRGV0YWlscyA9IHtcbiAgICAgICAgICAgICAgZW5kcG9pbnQsXG4gICAgICAgICAgICAgIGh0dHBTdGF0dXM6IHJlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICAgICAgcnVuSWQ6IHJlc3BvbnNlUnVuSWQsXG4gICAgICAgICAgICAgIHRyYWNlSWQ6IHJlc3BvbnNlVHJhY2VJZCxcbiAgICAgICAgICAgICAgcmVxdWVzdElkOiByZXNwb25zZVJlcXVlc3RJZCxcbiAgICAgICAgICAgICAgb3V0Y29tZTogcmVzcG9uc2VPdXRjb21lLFxuICAgICAgICAgICAgICBhcGlSZXN1bHQ6IHJlc3BvbnNlQXBpUmVzdWx0LFxuICAgICAgICAgICAgICBhcGlSZXN1bHRNZXNzYWdlOiByZXNwb25zZUFwaVJlc3VsdE1lc3NhZ2UsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhyb3cgYXV0aEVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICBjb25zdCBkZXRhaWxQYXJ0cyA9IFtcbiAgICAgICAgICAgICAgYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YCxcbiAgICAgICAgICAgICAgcmVzcG9uc2VBcGlSZXN1bHQgPyBgYXBpUmVzdWx0PSR7cmVzcG9uc2VBcGlSZXN1bHR9YCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgcmVzcG9uc2VBcGlSZXN1bHRNZXNzYWdlID8gYG1lc3NhZ2U9JHtyZXNwb25zZUFwaVJlc3VsdE1lc3NhZ2V9YCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgcmVzcG9uc2VPdXRjb21lID8gYG91dGNvbWU9JHtyZXNwb25zZU91dGNvbWV9YCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIF0uZmlsdGVyKChwYXJ0KTogcGFydCBpcyBzdHJpbmcgPT4gdHlwZW9mIHBhcnQgPT09ICdzdHJpbmcnICYmIHBhcnQubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICBjb25zdCBhcGlFcnJvciA9IG5ldyBFcnJvcihgJHtBQ1RJT05fTEFCRUxbYWN0aW9uXX0gQVBJIOOBq+WkseaVl++8iCR7ZGV0YWlsUGFydHMuam9pbignIC8gJyl977yJYCkgYXMgRXJyb3IgJiB7XG4gICAgICAgICAgICAgIGFwaURldGFpbHM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhcGlFcnJvci5hcGlEZXRhaWxzID0ge1xuICAgICAgICAgICAgICBlbmRwb2ludCxcbiAgICAgICAgICAgICAgaHR0cFN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLFxuICAgICAgICAgICAgICBydW5JZDogcmVzcG9uc2VSdW5JZCxcbiAgICAgICAgICAgICAgdHJhY2VJZDogcmVzcG9uc2VUcmFjZUlkLFxuICAgICAgICAgICAgICByZXF1ZXN0SWQ6IHJlc3BvbnNlUmVxdWVzdElkLFxuICAgICAgICAgICAgICBvdXRjb21lOiByZXNwb25zZU91dGNvbWUsXG4gICAgICAgICAgICAgIGFwaVJlc3VsdDogcmVzcG9uc2VBcGlSZXN1bHQsXG4gICAgICAgICAgICAgIGFwaVJlc3VsdE1lc3NhZ2U6IHJlc3BvbnNlQXBpUmVzdWx0TWVzc2FnZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aHJvdyBhcGlFcnJvcjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBhZnRlciA9IGdldE9ic2VydmFiaWxpdHlNZXRhKCk7XG4gICAgICAgICAgY29uc3QgbmV4dFJ1bklkID0gcmVzcG9uc2VSdW5JZCA/PyBhZnRlci5ydW5JZCA/PyBydW5JZDtcbiAgICAgICAgICBjb25zdCBuZXh0VHJhY2VJZCA9IHJlc3BvbnNlVHJhY2VJZCA/PyBhZnRlci50cmFjZUlkID8/IHJlc29sdmVkVHJhY2VJZDtcblxuICAgICAgICAgIGNvbnN0IHJlc3BvbnNlRGV0YWlsUGFydHMgPSBbXG4gICAgICAgICAgICBgcnVuSWQ9JHtuZXh0UnVuSWR9YCxcbiAgICAgICAgICAgIGB0cmFjZUlkPSR7bmV4dFRyYWNlSWQgPz8gJ3Vua25vd24nfWAsXG4gICAgICAgICAgICByZXNwb25zZVJlcXVlc3RJZCA/IGByZXF1ZXN0SWQ9JHtyZXNwb25zZVJlcXVlc3RJZH1gIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVzcG9uc2VPdXRjb21lID8gYG91dGNvbWU9JHtyZXNwb25zZU91dGNvbWV9YCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHJlc3BvbnNlQXBpUmVzdWx0ID8gYGFwaVJlc3VsdD0ke3Jlc3BvbnNlQXBpUmVzdWx0fWAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgXS5maWx0ZXIoKHBhcnQpOiBwYXJ0IGlzIHN0cmluZyA9PiB0eXBlb2YgcGFydCA9PT0gJ3N0cmluZycgJiYgcGFydC5sZW5ndGggPiAwKTtcblxuICAgICAgICAgIHNldEJhbm5lcihudWxsKTtcbiAgICAgICAgICBzZXRUb2FzdCh7XG4gICAgICAgICAgICB0b25lOiAnc3VjY2VzcycsXG4gICAgICAgICAgICBtZXNzYWdlOiBgJHtBQ1RJT05fTEFCRUxbYWN0aW9uXX3jgpLlrozkuoZgLFxuICAgICAgICAgICAgZGV0YWlsOiByZXNwb25zZURldGFpbFBhcnRzLmpvaW4oJyAvICcpLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgY29uc3QgZHVyYXRpb25NcyA9IE1hdGgucm91bmQocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydGVkQXQpO1xuICAgICAgICAgIGxvZ1RlbGVtZXRyeShhY3Rpb24sICdzdWNjZXNzJywgZHVyYXRpb25Ncyk7XG4gICAgICAgICAgbG9nQXVkaXQoYWN0aW9uLCAnc3VjY2VzcycsIHVuZGVmaW5lZCwgZHVyYXRpb25Ncywge1xuICAgICAgICAgICAgcGhhc2U6ICdkbycsXG4gICAgICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgICAgIGVuZHBvaW50LFxuICAgICAgICAgICAgICBodHRwU3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG4gICAgICAgICAgICAgIHJlcXVlc3RJZDogcmVzcG9uc2VSZXF1ZXN0SWQsXG4gICAgICAgICAgICAgIG91dGNvbWU6IHJlc3BvbnNlT3V0Y29tZSxcbiAgICAgICAgICAgICAgYXBpUmVzdWx0OiByZXNwb25zZUFwaVJlc3VsdCxcbiAgICAgICAgICAgICAgYXBpUmVzdWx0TWVzc2FnZTogcmVzcG9uc2VBcGlSZXN1bHRNZXNzYWdlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNvbnN0IGRlcGFydG1lbnRDb2RlID0gcmVzb2x2ZURlcGFydG1lbnRDb2RlKHNlbGVjdGVkRW50cnk/LmRlcGFydG1lbnQpO1xuICAgICAgICAgIGNvbnN0IGNhbGN1bGF0aW9uRGF0ZSA9IG5vcm1hbGl6ZVZpc2l0RGF0ZShyZXNvbHZlZFZpc2l0RGF0ZSk7XG4gICAgICAgICAgY29uc3QgbWlzc2luZ0ZpZWxkcyA9IFtcbiAgICAgICAgICAgICFyZXNvbHZlZFBhdGllbnRJZCA/ICdQYXRpZW50X0lEJyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICFjYWxjdWxhdGlvbkRhdGUgPyAnRmlyc3RfQ2FsY3VsYXRpb25fRGF0ZScgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAhY2FsY3VsYXRpb25EYXRlID8gJ0xhc3RWaXNpdF9EYXRlJyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICFkZXBhcnRtZW50Q29kZSA/ICdEZXBhcnRtZW50X0NvZGUnIDogdW5kZWZpbmVkLFxuICAgICAgICAgIF0uZmlsdGVyKChmaWVsZCk6IGZpZWxkIGlzIHN0cmluZyA9PiB0eXBlb2YgZmllbGQgPT09ICdzdHJpbmcnKTtcblxuICAgICAgICAgIGlmIChtaXNzaW5nRmllbGRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGJsb2NrZWRSZWFzb24gPSBgbWVkaWNhbG1vZHYyMyDjgpLjgrnjgq3jg4Pjg5c6ICR7bWlzc2luZ0ZpZWxkcy5qb2luKCcsICcpfSDjgYzkuI3otrPjgZfjgabjgYTjgb7jgZnjgIJgO1xuICAgICAgICAgICAgc2V0QmFubmVyKHtcbiAgICAgICAgICAgICAgdG9uZTogJ3dhcm5pbmcnLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBg6Ki655mC57WC5LqG5b6M44Gu6L+95Yqg5pu05paw44KS5YGc5q2iOiAke2Jsb2NrZWRSZWFzb259YCxcbiAgICAgICAgICAgICAgbmV4dEFjdGlvbjogJ+WPl+S7mOaDheWgse+8iOaCo+iAhS/oqLrnmYLnp5Ev5pel5LuY77yJ44KS56K66KqN44GX44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbG9nVWlTdGF0ZSh7XG4gICAgICAgICAgICAgIGFjdGlvbjogJ21lZGljYWxtb2R2MjMnLFxuICAgICAgICAgICAgICBzY3JlZW46ICdjaGFydHMvYWN0aW9uLWJhcicsXG4gICAgICAgICAgICAgIGNvbnRyb2xJZDogJ2FjdGlvbi1maW5pc2gnLFxuICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgY2FjaGVIaXQsXG4gICAgICAgICAgICAgIG1pc3NpbmdNYXN0ZXIsXG4gICAgICAgICAgICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgICAgICAgICAgICBmYWxsYmFja1VzZWQsXG4gICAgICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25QaGFzZTogJ2xvY2snLFxuICAgICAgICAgICAgICAgIGJsb2NrZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgbWlzc2luZ0ZpZWxkcyxcbiAgICAgICAgICAgICAgICBwYXRpZW50SWQ6IHJlc29sdmVkUGF0aWVudElkLFxuICAgICAgICAgICAgICAgIGFwcG9pbnRtZW50SWQ6IHJlc29sdmVkQXBwb2ludG1lbnRJZCxcbiAgICAgICAgICAgICAgICB0cmFjZUlkOiByZXNvbHZlZFRyYWNlSWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlY29yZENoYXJ0c0F1ZGl0RXZlbnQoe1xuICAgICAgICAgICAgICBhY3Rpb246ICdPUkNBX01FRElDQUxfTU9EX1YyMycsXG4gICAgICAgICAgICAgIG91dGNvbWU6ICdibG9ja2VkJyxcbiAgICAgICAgICAgICAgc3ViamVjdDogJ21lZGljYWxtb2R2MjMnLFxuICAgICAgICAgICAgICBub3RlOiBibG9ja2VkUmVhc29uLFxuICAgICAgICAgICAgICBwYXRpZW50SWQ6IHJlc29sdmVkUGF0aWVudElkLFxuICAgICAgICAgICAgICBhcHBvaW50bWVudElkOiByZXNvbHZlZEFwcG9pbnRtZW50SWQsXG4gICAgICAgICAgICAgIHJ1bklkLFxuICAgICAgICAgICAgICBjYWNoZUhpdCxcbiAgICAgICAgICAgICAgbWlzc2luZ01hc3RlcixcbiAgICAgICAgICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgICAgICAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICAgICAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvblBoYXNlOiAnbG9jaycsXG4gICAgICAgICAgICAgICAgdHJpZ2dlcjogJ21pc3NpbmdfZmllbGRzJyxcbiAgICAgICAgICAgICAgICBtaXNzaW5nRmllbGRzLFxuICAgICAgICAgICAgICAgIGVuZHBvaW50OiAnL2FwaTIxL21lZGljYWxtb2R2MjMnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3RYbWwgPSBidWlsZE1lZGljYWxNb2RWMjNSZXF1ZXN0WG1sKHtcbiAgICAgICAgICAgICAgcGF0aWVudElkOiByZXNvbHZlZFBhdGllbnRJZCA/PyAnJyxcbiAgICAgICAgICAgICAgcmVxdWVzdE51bWJlcjogJzAxJyxcbiAgICAgICAgICAgICAgZmlyc3RDYWxjdWxhdGlvbkRhdGU6IGNhbGN1bGF0aW9uRGF0ZSxcbiAgICAgICAgICAgICAgbGFzdFZpc2l0RGF0ZTogY2FsY3VsYXRpb25EYXRlLFxuICAgICAgICAgICAgICBkZXBhcnRtZW50Q29kZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcG9zdE9yY2FNZWRpY2FsTW9kVjIzWG1sKHJlcXVlc3RYbWwsIHsgc2lnbmFsIH0pO1xuICAgICAgICAgICAgICBjb25zdCBhcGlSZXN1bHRPayA9IGlzQXBpUmVzdWx0T2socmVzdWx0LmFwaVJlc3VsdCk7XG4gICAgICAgICAgICAgIGNvbnN0IGhhc01pc3NpbmdUYWdzID0gQm9vbGVhbihyZXN1bHQubWlzc2luZ1RhZ3M/Lmxlbmd0aCk7XG4gICAgICAgICAgICAgIGNvbnN0IG91dGNvbWUgPSByZXN1bHQub2sgJiYgYXBpUmVzdWx0T2sgJiYgIWhhc01pc3NpbmdUYWdzID8gJ3N1Y2Nlc3MnIDogcmVzdWx0Lm9rID8gJ3dhcm5pbmcnIDogJ2Vycm9yJztcbiAgICAgICAgICAgICAgY29uc3QgYmFubmVyRGV0YWlsID0gW1xuICAgICAgICAgICAgICAgIGBBcGlfUmVzdWx0PSR7cmVzdWx0LmFwaVJlc3VsdCA/PyAn4oCUJ31gLFxuICAgICAgICAgICAgICAgIHJlc3VsdC5hcGlSZXN1bHRNZXNzYWdlID8gYE1lc3NhZ2U9JHtyZXN1bHQuYXBpUmVzdWx0TWVzc2FnZX1gIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIGhhc01pc3NpbmdUYWdzID8gYG1pc3NpbmdUYWdzPSR7cmVzdWx0Lm1pc3NpbmdUYWdzPy5qb2luKCcsICcpfWAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgIF0uZmlsdGVyKChwYXJ0KTogcGFydCBpcyBzdHJpbmcgPT4gdHlwZW9mIHBhcnQgPT09ICdzdHJpbmcnICYmIHBhcnQubGVuZ3RoID4gMCk7XG5cbiAgICAgICAgICAgICAgaWYgKG91dGNvbWUgIT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIHNldEJhbm5lcih7XG4gICAgICAgICAgICAgICAgICB0b25lOiBvdXRjb21lID09PSAnZXJyb3InID8gJ2Vycm9yJyA6ICd3YXJuaW5nJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDoqLrnmYLntYLkuoblvozjga7ov73liqDmm7TmlrAoJHtvdXRjb21lfSkgLyAke2Jhbm5lckRldGFpbC5qb2luKCcgLyAnKX1gLFxuICAgICAgICAgICAgICAgICAgbmV4dEFjdGlvbjogJ09SQ0Eg5b+c562U44KS56K66KqN44GX44CB5b+F6KaB44Gq44KJ5YaN6YCB44GX44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGxvZ1VpU3RhdGUoe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ21lZGljYWxtb2R2MjMnLFxuICAgICAgICAgICAgICAgIHNjcmVlbjogJ2NoYXJ0cy9hY3Rpb24tYmFyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sSWQ6ICdhY3Rpb24tZmluaXNoJyxcbiAgICAgICAgICAgICAgICBydW5JZDogcmVzdWx0LnJ1bklkID8/IHJ1bklkLFxuICAgICAgICAgICAgICAgIGNhY2hlSGl0LFxuICAgICAgICAgICAgICAgIG1pc3NpbmdNYXN0ZXIsXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICAgICAgICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgICAgICAgIG9wZXJhdGlvblBoYXNlOiAnZG8nLFxuICAgICAgICAgICAgICAgICAgcGF0aWVudElkOiByZXNvbHZlZFBhdGllbnRJZCxcbiAgICAgICAgICAgICAgICAgIGFwcG9pbnRtZW50SWQ6IHJlc29sdmVkQXBwb2ludG1lbnRJZCxcbiAgICAgICAgICAgICAgICAgIHRyYWNlSWQ6IHJlc3VsdC50cmFjZUlkID8/IHJlc29sdmVkVHJhY2VJZCxcbiAgICAgICAgICAgICAgICAgIGVuZHBvaW50OiAnL2FwaTIxL21lZGljYWxtb2R2MjMnLFxuICAgICAgICAgICAgICAgICAgaHR0cFN0YXR1czogcmVzdWx0LnN0YXR1cyxcbiAgICAgICAgICAgICAgICAgIGFwaVJlc3VsdDogcmVzdWx0LmFwaVJlc3VsdCxcbiAgICAgICAgICAgICAgICAgIGFwaVJlc3VsdE1lc3NhZ2U6IHJlc3VsdC5hcGlSZXN1bHRNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgbWlzc2luZ1RhZ3M6IHJlc3VsdC5taXNzaW5nVGFncyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICByZWNvcmRDaGFydHNBdWRpdEV2ZW50KHtcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdPUkNBX01FRElDQUxfTU9EX1YyMycsXG4gICAgICAgICAgICAgICAgb3V0Y29tZSxcbiAgICAgICAgICAgICAgICBzdWJqZWN0OiAnbWVkaWNhbG1vZHYyMycsXG4gICAgICAgICAgICAgICAgcGF0aWVudElkOiByZXNvbHZlZFBhdGllbnRJZCxcbiAgICAgICAgICAgICAgICBhcHBvaW50bWVudElkOiByZXNvbHZlZEFwcG9pbnRtZW50SWQsXG4gICAgICAgICAgICAgICAgcnVuSWQ6IHJlc3VsdC5ydW5JZCA/PyBydW5JZCxcbiAgICAgICAgICAgICAgICBjYWNoZUhpdCxcbiAgICAgICAgICAgICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgICAgICAgICAgIGZhbGxiYWNrVXNlZCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgICAgICAgICBvcGVyYXRpb25QaGFzZTogJ2RvJyxcbiAgICAgICAgICAgICAgICAgIGVuZHBvaW50OiAnL2FwaTIxL21lZGljYWxtb2R2MjMnLFxuICAgICAgICAgICAgICAgICAgaHR0cFN0YXR1czogcmVzdWx0LnN0YXR1cyxcbiAgICAgICAgICAgICAgICAgIGFwaVJlc3VsdDogcmVzdWx0LmFwaVJlc3VsdCxcbiAgICAgICAgICAgICAgICAgIGFwaVJlc3VsdE1lc3NhZ2U6IHJlc3VsdC5hcGlSZXN1bHRNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgbWlzc2luZ1RhZ3M6IHJlc3VsdC5taXNzaW5nVGFncyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGRldGFpbCA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgICAgICAgc2V0QmFubmVyKHtcbiAgICAgICAgICAgICAgICB0b25lOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGDoqLrnmYLntYLkuoblvozjga7ov73liqDmm7TmlrDjgavlpLHmlZc6ICR7ZGV0YWlsfWAsXG4gICAgICAgICAgICAgICAgbmV4dEFjdGlvbjogJ09SQ0Eg5o6l57aa44Go6Ki655mC56eR5oOF5aCx44KS56K66KqN44GX44Gm44GP44Gg44GV44GE44CCJyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGxvZ1VpU3RhdGUoe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ21lZGljYWxtb2R2MjMnLFxuICAgICAgICAgICAgICAgIHNjcmVlbjogJ2NoYXJ0cy9hY3Rpb24tYmFyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sSWQ6ICdhY3Rpb24tZmluaXNoJyxcbiAgICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgICBjYWNoZUhpdCxcbiAgICAgICAgICAgICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgICAgICAgICAgICAgIGZhbGxiYWNrVXNlZCxcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgICAgICAgICBvcGVyYXRpb25QaGFzZTogJ2RvJyxcbiAgICAgICAgICAgICAgICAgIHBhdGllbnRJZDogcmVzb2x2ZWRQYXRpZW50SWQsXG4gICAgICAgICAgICAgICAgICBhcHBvaW50bWVudElkOiByZXNvbHZlZEFwcG9pbnRtZW50SWQsXG4gICAgICAgICAgICAgICAgICB0cmFjZUlkOiByZXNvbHZlZFRyYWNlSWQsXG4gICAgICAgICAgICAgICAgICBlbmRwb2ludDogJy9hcGkyMS9tZWRpY2FsbW9kdjIzJyxcbiAgICAgICAgICAgICAgICAgIGVycm9yOiBkZXRhaWwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJlY29yZENoYXJ0c0F1ZGl0RXZlbnQoe1xuICAgICAgICAgICAgICAgIGFjdGlvbjogJ09SQ0FfTUVESUNBTF9NT0RfVjIzJyxcbiAgICAgICAgICAgICAgICBvdXRjb21lOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgIHN1YmplY3Q6ICdtZWRpY2FsbW9kdjIzJyxcbiAgICAgICAgICAgICAgICBub3RlOiBkZXRhaWwsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGRldGFpbCxcbiAgICAgICAgICAgICAgICBwYXRpZW50SWQ6IHJlc29sdmVkUGF0aWVudElkLFxuICAgICAgICAgICAgICAgIGFwcG9pbnRtZW50SWQ6IHJlc29sdmVkQXBwb2ludG1lbnRJZCxcbiAgICAgICAgICAgICAgICBydW5JZCxcbiAgICAgICAgICAgICAgICBjYWNoZUhpdCxcbiAgICAgICAgICAgICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgICAgICAgICAgIGZhbGxiYWNrVXNlZCxcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgICAgICAgICBvcGVyYXRpb25QaGFzZTogJ2RvJyxcbiAgICAgICAgICAgICAgICAgIGVuZHBvaW50OiAnL2FwaTIxL21lZGljYWxtb2R2MjMnLFxuICAgICAgICAgICAgICAgICAgZXJyb3I6IGRldGFpbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2b2lkIFByb21pc2UucmVzb2x2ZShvbkFmdGVyRmluaXNoPy4oKSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgY29uc3QgZGV0YWlsID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICAgIGxvZ1VpU3RhdGUoe1xuICAgICAgICAgICAgYWN0aW9uOiAnZmluaXNoJyxcbiAgICAgICAgICAgIHNjcmVlbjogJ2NoYXJ0cy9hY3Rpb24tYmFyJyxcbiAgICAgICAgICAgIGNvbnRyb2xJZDogJ2FjdGlvbi1maW5pc2gnLFxuICAgICAgICAgICAgcnVuSWQsXG4gICAgICAgICAgICBjYWNoZUhpdCxcbiAgICAgICAgICAgIG1pc3NpbmdNYXN0ZXIsXG4gICAgICAgICAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICAgICAgICAgIGZhbGxiYWNrVXNlZCxcbiAgICAgICAgICAgIGRldGFpbHM6IHsgb3BlcmF0aW9uUGhhc2U6ICdhZnRlcl9maW5pc2gnLCBlcnJvcjogZGV0YWlsIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gJ2RyYWZ0Jykge1xuICAgICAgICAvLyBUT0RPOiDmnKzlrp/oo4Xjgafjga8gbG9jYWxTdG9yYWdlIC8gc2VydmVyIOOBq+S/neWtmOOAguePvuautemajuOBr+mAgeS/oeWJjeODgeOCp+ODg+OCr+eUqOOBruOCrOODvOODiemAo+aQuuOCkuWEquWFiOOAglxuICAgICAgICBvbkRyYWZ0U2F2ZWQ/LigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gY2FuY2VsIOOBr+ePvueKtuODh+ODou+8iOebo+afu+ODu+ODhuODrOODoeODiOODquOBruiomOmMsu+8ieOBqOOBl+OBpuaJseOBhuOAglxuICAgICAgfVxuXG4gICAgICBjb25zdCBkdXJhdGlvbk1zID0gTWF0aC5yb3VuZChwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0ZWRBdCk7XG4gICAgICBjb25zdCBhZnRlciA9IGdldE9ic2VydmFiaWxpdHlNZXRhKCk7XG4gICAgICBjb25zdCBuZXh0UnVuSWQgPSBhZnRlci5ydW5JZCA/PyBydW5JZDtcbiAgICAgIGNvbnN0IG5leHRUcmFjZUlkID0gYWZ0ZXIudHJhY2VJZCA/PyByZXNvbHZlZFRyYWNlSWQ7XG4gICAgICBzZXRCYW5uZXIobnVsbCk7XG4gICAgICBzZXRUb2FzdCh7XG4gICAgICAgIHRvbmU6ICdzdWNjZXNzJyxcbiAgICAgICAgbWVzc2FnZTogYCR7QUNUSU9OX0xBQkVMW2FjdGlvbl1944KS5a6M5LqGYCxcbiAgICAgICAgZGV0YWlsOiBgcnVuSWQ9JHtuZXh0UnVuSWR9IC8gdHJhY2VJZD0ke25leHRUcmFjZUlkID8/ICd1bmtub3duJ30gLyByZXF1ZXN0SWQ9JHtxdWV1ZUVudHJ5Py5yZXF1ZXN0SWQgPz8gJ3Vua25vd24nfSAvIHRyYW5zaXRpb249JHtkYXRhU291cmNlVHJhbnNpdGlvbn1gLFxuICAgICAgfSk7XG4gICAgICBsb2dUZWxlbWV0cnkoYWN0aW9uLCAnc3VjY2VzcycsIGR1cmF0aW9uTXMpO1xuICAgICAgbG9nQXVkaXQoYWN0aW9uLCAnc3VjY2VzcycsIHVuZGVmaW5lZCwgZHVyYXRpb25NcywgeyBwaGFzZTogJ2RvJyB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZGV0YWlsID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgY29uc3QgaXNBYm9ydCA9XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uXG4gICAgICAgICAgPyBlcnJvci5uYW1lID09PSAnQWJvcnRFcnJvcidcbiAgICAgICAgICA6IGVycm9yIGluc3RhbmNlb2YgRXJyb3JcbiAgICAgICAgICAgID8gZXJyb3IubmFtZSA9PT0gJ0Fib3J0RXJyb3InXG4gICAgICAgICAgICA6IGZhbHNlO1xuICAgICAgY29uc3QgYXBpRGV0YWlscyA9XG4gICAgICAgIGVycm9yICYmIHR5cGVvZiBlcnJvciA9PT0gJ29iamVjdCcgJiYgJ2FwaURldGFpbHMnIGluIGVycm9yXG4gICAgICAgICAgPyAoKGVycm9yIGFzIHsgYXBpRGV0YWlscz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0pLmFwaURldGFpbHMgPz8gdW5kZWZpbmVkKVxuICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgY29uc3QgZHVyYXRpb25NcyA9IE1hdGgucm91bmQocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydGVkQXQpO1xuICAgICAgY29uc3QgYWZ0ZXIgPSBnZXRPYnNlcnZhYmlsaXR5TWV0YSgpO1xuICAgICAgY29uc3QgZXJyb3JSdW5JZCA9ICh0eXBlb2YgYXBpRGV0YWlscz8ucnVuSWQgPT09ICdzdHJpbmcnID8gKGFwaURldGFpbHM/LnJ1bklkIGFzIHN0cmluZykgOiB1bmRlZmluZWQpID8/IGFmdGVyLnJ1bklkID8/IHJ1bklkO1xuICAgICAgY29uc3QgZXJyb3JUcmFjZUlkID1cbiAgICAgICAgKHR5cGVvZiBhcGlEZXRhaWxzPy50cmFjZUlkID09PSAnc3RyaW5nJyA/IChhcGlEZXRhaWxzPy50cmFjZUlkIGFzIHN0cmluZykgOiB1bmRlZmluZWQpID8/XG4gICAgICAgIGFmdGVyLnRyYWNlSWQgPz9cbiAgICAgICAgcmVzb2x2ZWRUcmFjZUlkO1xuICAgICAgY29uc3QgZXJyb3JSZXF1ZXN0SWQgPVxuICAgICAgICAodHlwZW9mIGFwaURldGFpbHM/LnJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyAoYXBpRGV0YWlscz8ucmVxdWVzdElkIGFzIHN0cmluZykgOiB1bmRlZmluZWQpID8/XG4gICAgICAgIHF1ZXVlRW50cnk/LnJlcXVlc3RJZDtcbiAgICAgIGNvbnN0IGVycm9yRW5kcG9pbnQgPSB0eXBlb2YgYXBpRGV0YWlscz8uZW5kcG9pbnQgPT09ICdzdHJpbmcnID8gKGFwaURldGFpbHM/LmVuZHBvaW50IGFzIHN0cmluZykgOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBlcnJvckh0dHBTdGF0dXMgPSB0eXBlb2YgYXBpRGV0YWlscz8uaHR0cFN0YXR1cyA9PT0gJ251bWJlcicgPyAoYXBpRGV0YWlscz8uaHR0cFN0YXR1cyBhcyBudW1iZXIpIDogdW5kZWZpbmVkO1xuICAgICAgY29uc3QgZXJyb3JPdXRjb21lID0gdHlwZW9mIGFwaURldGFpbHM/Lm91dGNvbWUgPT09ICdzdHJpbmcnID8gKGFwaURldGFpbHM/Lm91dGNvbWUgYXMgc3RyaW5nKSA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IGVycm9yQXBpUmVzdWx0ID0gdHlwZW9mIGFwaURldGFpbHM/LmFwaVJlc3VsdCA9PT0gJ3N0cmluZycgPyAoYXBpRGV0YWlscz8uYXBpUmVzdWx0IGFzIHN0cmluZykgOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBlcnJvckFwaVJlc3VsdE1lc3NhZ2UgPVxuICAgICAgICB0eXBlb2YgYXBpRGV0YWlscz8uYXBpUmVzdWx0TWVzc2FnZSA9PT0gJ3N0cmluZycgPyAoYXBpRGV0YWlscz8uYXBpUmVzdWx0TWVzc2FnZSBhcyBzdHJpbmcpIDogdW5kZWZpbmVkO1xuXG4gICAgICBpZiAoaXNBYm9ydCkge1xuICAgICAgICBjb25zdCBhYm9ydGVkRGV0YWlsID0gJ+ODpuODvOOCtuODvOaTjeS9nOOBq+OCiOOCiumAgeS/oeOCkuS4reaWreOBl+OBvuOBl+OBn+OAgumAmuS/oeWbnuW+qeW+jOOBq+WGjeippuihjOOBp+OBjeOBvuOBmeOAgic7XG4gICAgICAgIHNldFJldHJ5QWN0aW9uKCdzZW5kJyk7XG4gICAgICAgIHNldEJhbm5lcih7IHRvbmU6ICd3YXJuaW5nJywgbWVzc2FnZTogYE9SQ0HpgIHkv6HjgpLkuK3mlq06ICR7YWJvcnRlZERldGFpbH1gLCBuZXh0QWN0aW9uOiAn6YCa5L+h5Zue5b6p5b6M44Gr44Oq44OI44Op44Kk44Gn44GN44G+44GZ44CCJyB9KTtcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ3NlbmQnKSB7XG4gICAgICAgICAgc2V0VG9hc3QoeyB0b25lOiAnd2FybmluZycsIG1lc3NhZ2U6ICdPUkNB6YCB5L+h44KS5Lit5patJywgZGV0YWlsOiBhYm9ydGVkRGV0YWlsIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNldFRvYXN0KHsgdG9uZTogJ3dhcm5pbmcnLCBtZXNzYWdlOiBgJHtBQ1RJT05fTEFCRUxbYWN0aW9uXX3jgpLkuK3mlq1gLCBkZXRhaWw6IGFib3J0ZWREZXRhaWwgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbG9nVGVsZW1ldHJ5KGFjdGlvbiwgJ2Jsb2NrZWQnLCBkdXJhdGlvbk1zLCBhYm9ydGVkRGV0YWlsLCBhYm9ydGVkRGV0YWlsKTtcbiAgICAgICAgbG9nQXVkaXQoYWN0aW9uLCAnYmxvY2tlZCcsIGFib3J0ZWREZXRhaWwsIGR1cmF0aW9uTXMsIHtcbiAgICAgICAgICBwaGFzZTogJ2xvY2snLFxuICAgICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICAgIHRyaWdnZXI6ICdhYm9ydCcsXG4gICAgICAgICAgICB0cmFjZUlkOiBlcnJvclRyYWNlSWQsXG4gICAgICAgICAgICBlbmRwb2ludDogZXJyb3JFbmRwb2ludCxcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IGVycm9ySHR0cFN0YXR1cyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG5leHRTdGVwcyA9ICgoKSA9PiB7XG4gICAgICAgICAgaWYgKC9IVFRQIDQwMXxIVFRQIDQwM3zmqKnpmZDkuI3otrMvLnRlc3QoZGV0YWlsKSkge1xuICAgICAgICAgICAgcmV0dXJuICfmrKHjgavjgoTjgovjgZPjgag6IOWGjeODreOCsOOCpOODsyAvIOioreWumueiuuiqje+8iGZhY2lsaXR5SWQvdXNlcklkL3Bhc3N3b3Jk77yJJztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGlzTmV0d29ya0Vycm9yKGVycm9yKSB8fCBpc05ldHdvcmtFcnJvcihkZXRhaWwpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ+asoeOBq+OChOOCi+OBk+OBqDog6YCa5L+h5Zue5b6p44KS5b6F44GkIC8gUmVjZXB0aW9uIOOBp+WGjeWPluW+lyAvIOODquODiOODqeOCpCc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAn5qyh44Gr44KE44KL44GT44GoOiBSZWNlcHRpb24g44G45oi744KLIC8g6KuL5rGC44KS5YaN5Y+W5b6XIC8g6Kit5a6a56K66KqNJztcbiAgICAgICAgfSkoKTtcbiAgICAgICAgbGV0IHJldHJ5RGV0YWlsOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICAgIGxldCByZXRyeU1ldGE6IHsgcmV0cnlSZXF1ZXN0ZWQ/OiBib29sZWFuOyByZXRyeUFwcGxpZWQ/OiBib29sZWFuOyByZXRyeVJlYXNvbj86IHN0cmluZzsgcXVldWVSdW5JZD86IHN0cmluZzsgcXVldWVUcmFjZUlkPzogc3RyaW5nIH0gPVxuICAgICAgICAgIHt9O1xuICAgICAgICBpZiAoYWN0aW9uID09PSAnc2VuZCcgJiYgcmVzb2x2ZWRQYXRpZW50SWQpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmV0cnlSZXNwb25zZSA9IGF3YWl0IGh0dHBGZXRjaChgL2FwaS9vcmNhL3F1ZXVlP3BhdGllbnRJZD0ke3Jlc29sdmVkUGF0aWVudElkfSZyZXRyeT0xYCwge1xuICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCByZXRyeUpzb24gPSAoYXdhaXQgcmV0cnlSZXNwb25zZS5qc29uKCkuY2F0Y2goKCkgPT4gKHt9KSkpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgICAgICAgICAgY29uc3QgcmV0cnlBcHBsaWVkID0gQm9vbGVhbihyZXRyeUpzb24ucmV0cnlBcHBsaWVkKTtcbiAgICAgICAgICAgIGNvbnN0IHJldHJ5UmVhc29uID0gdHlwZW9mIHJldHJ5SnNvbi5yZXRyeVJlYXNvbiA9PT0gJ3N0cmluZycgPyByZXRyeUpzb24ucmV0cnlSZWFzb24gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBjb25zdCBxdWV1ZVJ1bklkID0gdHlwZW9mIHJldHJ5SnNvbi5ydW5JZCA9PT0gJ3N0cmluZycgPyByZXRyeUpzb24ucnVuSWQgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBjb25zdCBxdWV1ZVRyYWNlSWQgPSB0eXBlb2YgcmV0cnlKc29uLnRyYWNlSWQgPT09ICdzdHJpbmcnID8gcmV0cnlKc29uLnRyYWNlSWQgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICByZXRyeU1ldGEgPSB7XG4gICAgICAgICAgICAgIHJldHJ5UmVxdWVzdGVkOiB0cnVlLFxuICAgICAgICAgICAgICByZXRyeUFwcGxpZWQsXG4gICAgICAgICAgICAgIHJldHJ5UmVhc29uLFxuICAgICAgICAgICAgICBxdWV1ZVJ1bklkLFxuICAgICAgICAgICAgICBxdWV1ZVRyYWNlSWQsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0cnlEZXRhaWwgPSBgcmV0cnlRdWV1ZT0ke3JldHJ5QXBwbGllZCA/ICdhcHBsaWVkJyA6ICdyZXF1ZXN0ZWQnfSR7cmV0cnlSZWFzb24gPyBgKCR7cmV0cnlSZWFzb259KWAgOiAnJ31gO1xuICAgICAgICAgIH0gY2F0Y2ggKHJldHJ5RXJyb3IpIHtcbiAgICAgICAgICAgIHJldHJ5TWV0YSA9IHsgcmV0cnlSZXF1ZXN0ZWQ6IHRydWUsIHJldHJ5QXBwbGllZDogZmFsc2UsIHJldHJ5UmVhc29uOiAncmV0cnlfcmVxdWVzdF9mYWlsZWQnIH07XG4gICAgICAgICAgICByZXRyeURldGFpbCA9ICdyZXRyeVF1ZXVlPWVycm9yJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXh0cmFUYWdzID0gW1xuICAgICAgICAgIGBydW5JZD0ke2Vycm9yUnVuSWR9YCxcbiAgICAgICAgICBgdHJhY2VJZD0ke2Vycm9yVHJhY2VJZCA/PyAndW5rbm93bid9YCxcbiAgICAgICAgICBlcnJvclJlcXVlc3RJZCA/IGByZXF1ZXN0SWQ9JHtlcnJvclJlcXVlc3RJZH1gIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGVycm9yRW5kcG9pbnQgPyBgZW5kcG9pbnQ9JHtlcnJvckVuZHBvaW50fWAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgdHlwZW9mIGVycm9ySHR0cFN0YXR1cyA9PT0gJ251bWJlcicgPyBgSFRUUCAke2Vycm9ySHR0cFN0YXR1c31gIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGVycm9yQXBpUmVzdWx0ID8gYGFwaVJlc3VsdD0ke2Vycm9yQXBpUmVzdWx0fWAgOiB1bmRlZmluZWQsXG4gICAgICAgICAgZXJyb3JBcGlSZXN1bHRNZXNzYWdlID8gYG1lc3NhZ2U9JHtlcnJvckFwaVJlc3VsdE1lc3NhZ2V9YCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBlcnJvck91dGNvbWUgPyBgb3V0Y29tZT0ke2Vycm9yT3V0Y29tZX1gIDogdW5kZWZpbmVkLFxuICAgICAgICAgIHJldHJ5RGV0YWlsLFxuICAgICAgICBdLmZpbHRlcigocGFydCk6IHBhcnQgaXMgc3RyaW5nID0+IHR5cGVvZiBwYXJ0ID09PSAnc3RyaW5nJyk7XG4gICAgICAgIGNvbnN0IGNvbXBvc2VkRGV0YWlsID0gYCR7ZGV0YWlsfe+8iCR7ZXh0cmFUYWdzLmpvaW4oJyAvICcpfe+8iSR7bmV4dFN0ZXBzID8gYCAvICR7bmV4dFN0ZXBzfWAgOiAnJ31gO1xuICAgICAgICBpZiAoYWN0aW9uID09PSAnc2VuZCcgJiYgcmVzb2x2ZWRQYXRpZW50SWQpIHtcbiAgICAgICAgICBzYXZlT3JjYUNsYWltU2VuZENhY2hlKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBwYXRpZW50SWQ6IHJlc29sdmVkUGF0aWVudElkLFxuICAgICAgICAgICAgICBhcHBvaW50bWVudElkOiByZXNvbHZlZEFwcG9pbnRtZW50SWQsXG4gICAgICAgICAgICAgIHJ1bklkOiBlcnJvclJ1bklkLFxuICAgICAgICAgICAgICB0cmFjZUlkOiBlcnJvclRyYWNlSWQgPz8gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICBhcGlSZXN1bHQ6IGVycm9yQXBpUmVzdWx0LFxuICAgICAgICAgICAgICBzZW5kU3RhdHVzOiAnZXJyb3InLFxuICAgICAgICAgICAgICBlcnJvck1lc3NhZ2U6IGRldGFpbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlU2NvcGUsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBzZXRSZXRyeUFjdGlvbihhY3Rpb24pO1xuICAgICAgICBzZXRCYW5uZXIoeyB0b25lOiAnZXJyb3InLCBtZXNzYWdlOiBgJHtBQ1RJT05fTEFCRUxbYWN0aW9uXX3jgavlpLHmlZc6ICR7Y29tcG9zZWREZXRhaWx9YCwgbmV4dEFjdGlvbjogbmV4dFN0ZXBzIH0pO1xuICAgICAgICBzZXRUb2FzdCh7XG4gICAgICAgICAgdG9uZTogJ2Vycm9yJyxcbiAgICAgICAgICBtZXNzYWdlOiBhY3Rpb24gPT09ICdzZW5kJyA/ICdPUkNB6YCB5L+h44Gr5aSx5pWXJyA6IGAke0FDVElPTl9MQUJFTFthY3Rpb25dfeOBq+WkseaVl2AsXG4gICAgICAgICAgZGV0YWlsOiBjb21wb3NlZERldGFpbCxcbiAgICAgICAgfSk7XG4gICAgICAgIGxvZ1RlbGVtZXRyeShhY3Rpb24sICdlcnJvcicsIGR1cmF0aW9uTXMsIGNvbXBvc2VkRGV0YWlsLCBjb21wb3NlZERldGFpbCwgeyBydW5JZDogZXJyb3JSdW5JZCwgdHJhY2VJZDogZXJyb3JUcmFjZUlkIH0pO1xuICAgICAgICBsb2dBdWRpdChhY3Rpb24sICdlcnJvcicsIGNvbXBvc2VkRGV0YWlsLCBkdXJhdGlvbk1zLCB7XG4gICAgICAgICAgcGhhc2U6ICdkbycsXG4gICAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgICAgdHJhY2VJZDogZXJyb3JUcmFjZUlkLFxuICAgICAgICAgICAgZW5kcG9pbnQ6IGVycm9yRW5kcG9pbnQsXG4gICAgICAgICAgICBodHRwU3RhdHVzOiBlcnJvckh0dHBTdGF0dXMsXG4gICAgICAgICAgICByZXF1ZXN0SWQ6IGVycm9yUmVxdWVzdElkLFxuICAgICAgICAgICAgYXBpUmVzdWx0OiBlcnJvckFwaVJlc3VsdCxcbiAgICAgICAgICAgIGFwaVJlc3VsdE1lc3NhZ2U6IGVycm9yQXBpUmVzdWx0TWVzc2FnZSxcbiAgICAgICAgICAgIG91dGNvbWU6IGVycm9yT3V0Y29tZSxcbiAgICAgICAgICAgIHJldHJ5UXVldWU6IHJldHJ5TWV0YSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKHRpbWVvdXRJZCkgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICBhYm9ydENvbnRyb2xsZXJSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICBzZXRJc1J1bm5pbmcoZmFsc2UpO1xuICAgICAgc2V0UnVubmluZ0FjdGlvbihudWxsKTtcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlUHJpbnRFeHBvcnQgPSAoKSA9PiB7XG4gICAgaWYgKHByaW50UHJlY2hlY2tSZWFzb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGhlYWQgPSBwcmludFByZWNoZWNrUmVhc29uc1swXTtcbiAgICAgIGNvbnN0IGJsb2NrZWRSZWFzb25zID0gcHJpbnRQcmVjaGVja1JlYXNvbnMubWFwKChyZWFzb24pID0+IHJlYXNvbi5rZXkpO1xuICAgICAgY29uc3QgbmV4dEFjdGlvbiA9IGhlYWQubmV4dC5qb2luKCcgLyAnKTtcbiAgICAgIHNldEJhbm5lcih7IHRvbmU6ICd3YXJuaW5nJywgbWVzc2FnZTogYOWNsOWIty/jgqjjgq/jgrnjg53jg7zjg4jjgpLlgZzmraI6ICR7aGVhZC5zdW1tYXJ5fWAsIG5leHRBY3Rpb24gfSk7XG4gICAgICBzZXRUb2FzdChudWxsKTtcbiAgICAgIGxvZ1VpU3RhdGUoe1xuICAgICAgICBhY3Rpb246ICdwcmludCcsXG4gICAgICAgIHNjcmVlbjogJ2NoYXJ0cy9hY3Rpb24tYmFyJyxcbiAgICAgICAgY29udHJvbElkOiAnYWN0aW9uLXByaW50JyxcbiAgICAgICAgcnVuSWQsXG4gICAgICAgIGNhY2hlSGl0LFxuICAgICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgb3BlcmF0aW9uUGhhc2U6ICdsb2NrJyxcbiAgICAgICAgICBibG9ja2VkOiB0cnVlLFxuICAgICAgICAgIGJsb2NrZWRSZWFzb25zLFxuICAgICAgICAgIC4uLmJ1aWxkRmFsbGJhY2tEZXRhaWxzKCksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGxvZ0F1ZGl0KCdwcmludCcsICdibG9ja2VkJywgaGVhZC5kZXRhaWwsIHVuZGVmaW5lZCwge1xuICAgICAgICBwaGFzZTogJ2xvY2snLFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgdHJpZ2dlcjogYmxvY2tlZFJlYXNvbnNbMF0sXG4gICAgICAgICAgYmxvY2tlZFJlYXNvbnMsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXNlbGVjdGVkRW50cnkpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSAn5oKj6ICF5pyq6YG45oqe44Gu44Gf44KB5Y2w5Yi3L+OCqOOCr+OCueODneODvOODiOOCkuWBnOatouOBl+OBvuOBl+OBnyc7XG4gICAgICBzZXRCYW5uZXIoeyB0b25lOiAnd2FybmluZycsIG1lc3NhZ2UsIG5leHRBY3Rpb246ICfmgqPogIXjgpLpgbjmip4nIH0pO1xuICAgICAgc2V0VG9hc3QoeyB0b25lOiAnd2FybmluZycsIG1lc3NhZ2U6ICfmgqPogIXmnKrpgbjmip4nLCBkZXRhaWw6IG1lc3NhZ2UgfSk7XG4gICAgICBsb2dVaVN0YXRlKHtcbiAgICAgICAgYWN0aW9uOiAncHJpbnQnLFxuICAgICAgICBzY3JlZW46ICdjaGFydHMvYWN0aW9uLWJhcicsXG4gICAgICAgIGNvbnRyb2xJZDogJ2FjdGlvbi1wcmludCcsXG4gICAgICAgIHJ1bklkLFxuICAgICAgICBjYWNoZUhpdCxcbiAgICAgICAgbWlzc2luZ01hc3RlcixcbiAgICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICAgIGZhbGxiYWNrVXNlZCxcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIG9wZXJhdGlvblBoYXNlOiAnbG9jaycsXG4gICAgICAgICAgYmxvY2tlZDogdHJ1ZSxcbiAgICAgICAgICBibG9ja2VkUmVhc29uczogWyduby1zZWxlY3Rpb24nXSxcbiAgICAgICAgICAuLi5idWlsZEZhbGxiYWNrRGV0YWlscygpLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBsb2dBdWRpdCgncHJpbnQnLCAnYmxvY2tlZCcsIG1lc3NhZ2UsIHVuZGVmaW5lZCwge1xuICAgICAgICBwaGFzZTogJ2xvY2snLFxuICAgICAgICBkZXRhaWxzOiB7IHRyaWdnZXI6ICduby1zZWxlY3Rpb24nLCBibG9ja2VkUmVhc29uczogWyduby1zZWxlY3Rpb24nXSB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgeyBhY3RvciwgZmFjaWxpdHlJZCB9ID0gcmVzb2x2ZUF1ZGl0QWN0b3IoKTtcblxuICAgIGNvbnN0IGRldGFpbCA9IGDljbDliLfjg5fjg6zjg5Pjg6Xjg7zjgpLplovjgY3jgb7jgZfjgZ8gKGFjdG9yPSR7YWN0b3J9KWA7XG4gICAgc2V0QmFubmVyKG51bGwpO1xuICAgIHNldFRvYXN0KHsgdG9uZTogJ3N1Y2Nlc3MnLCBtZXNzYWdlOiAn5Y2w5Yi3L+OCqOOCr+OCueODneODvOODiOOCkumWi+OBjeOBvuOBl+OBnycsIGRldGFpbCB9KTtcblxuICAgIHJlY29yZENoYXJ0c0F1ZGl0RXZlbnQoe1xuICAgICAgYWN0aW9uOiAnUFJJTlRfT1VUUEFUSUVOVCcsXG4gICAgICBvdXRjb21lOiAnc3RhcnRlZCcsXG4gICAgICBzdWJqZWN0OiAnb3V0cGF0aWVudC1kb2N1bWVudC1wcmV2aWV3JyxcbiAgICAgIG5vdGU6IGRldGFpbCxcbiAgICAgIGFjdG9yLFxuICAgICAgcGF0aWVudElkOiBzZWxlY3RlZEVudHJ5LnBhdGllbnRJZCA/PyBzZWxlY3RlZEVudHJ5LmlkLFxuICAgICAgYXBwb2ludG1lbnRJZDogc2VsZWN0ZWRFbnRyeS5hcHBvaW50bWVudElkLFxuICAgICAgcnVuSWQsXG4gICAgICBjYWNoZUhpdCxcbiAgICAgIG1pc3NpbmdNYXN0ZXIsXG4gICAgICBmYWxsYmFja1VzZWQsXG4gICAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgb3BlcmF0aW9uUGhhc2U6ICdkbycsXG4gICAgICAgIGVuZHBvaW50OiAnL2NoYXJ0cy9wcmludC9vdXRwYXRpZW50JyxcbiAgICAgICAgaHR0cFN0YXR1czogMjAwLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHByaW50UGF0aCA9IGJ1aWxkRmFjaWxpdHlQYXRoKHNlc3Npb24/LmZhY2lsaXR5SWQsICcvY2hhcnRzL3ByaW50L291dHBhdGllbnQnKTtcbiAgICBsb2dVaVN0YXRlKHtcbiAgICAgIGFjdGlvbjogJ3ByaW50JyxcbiAgICAgIHNjcmVlbjogJ2NoYXJ0cy9hY3Rpb24tYmFyJyxcbiAgICAgIGNvbnRyb2xJZDogJ2FjdGlvbi1wcmludCcsXG4gICAgICBydW5JZCxcbiAgICAgIGNhY2hlSGl0LFxuICAgICAgbWlzc2luZ01hc3RlcixcbiAgICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgZGV0YWlsczoge1xuICAgICAgICBvcGVyYXRpb25QaGFzZTogJ2RvJyxcbiAgICAgICAgZGVzdGluYXRpb246IHByaW50UGF0aCxcbiAgICAgICAgcGF0aWVudElkOiBzZWxlY3RlZEVudHJ5LnBhdGllbnRJZCA/PyBzZWxlY3RlZEVudHJ5LmlkLFxuICAgICAgICBhcHBvaW50bWVudElkOiBzZWxlY3RlZEVudHJ5LmFwcG9pbnRtZW50SWQsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgbmF2aWdhdGUocHJpbnRQYXRoLCB7XG4gICAgICBzdGF0ZToge1xuICAgICAgICBlbnRyeTogc2VsZWN0ZWRFbnRyeSxcbiAgICAgICAgbWV0YTogeyBydW5JZCwgY2FjaGVIaXQsIG1pc3NpbmdNYXN0ZXIsIGZhbGxiYWNrVXNlZCwgZGF0YVNvdXJjZVRyYW5zaXRpb24gfSxcbiAgICAgICAgYWN0b3IsXG4gICAgICAgIGZhY2lsaXR5SWQsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHNhdmVPdXRwYXRpZW50UHJpbnRQcmV2aWV3KFxuICAgICAge1xuICAgICAgICBlbnRyeTogc2VsZWN0ZWRFbnRyeSxcbiAgICAgICAgbWV0YTogeyBydW5JZCwgY2FjaGVIaXQsIG1pc3NpbmdNYXN0ZXIsIGZhbGxiYWNrVXNlZCwgZGF0YVNvdXJjZVRyYW5zaXRpb24gfSxcbiAgICAgICAgYWN0b3IsXG4gICAgICAgIGZhY2lsaXR5SWQsXG4gICAgICB9LFxuICAgICAgeyBmYWNpbGl0eUlkOiBzZXNzaW9uPy5mYWNpbGl0eUlkLCB1c2VySWQ6IHNlc3Npb24/LnVzZXJJZCB9LFxuICAgICk7XG4gIH07XG5cbiAgY29uc3Qgb3BlblByaW50RGlhbG9nID0gKCkgPT4ge1xuICAgIHNldFByaW50RGlhbG9nT3Blbih0cnVlKTtcbiAgICBhcHByb3ZhbFNlc3Npb25SZWYuY3VycmVudCA9IHsgYWN0aW9uOiAncHJpbnQnLCBjbG9zZWQ6IGZhbHNlIH07XG4gICAgbG9nQXBwcm92YWwoJ3ByaW50JywgJ29wZW4nKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVSZXBvcnRQcmludCA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAocHJpbnRQcmVjaGVja1JlYXNvbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgaGVhZCA9IHByaW50UHJlY2hlY2tSZWFzb25zWzBdO1xuICAgICAgY29uc3QgYmxvY2tlZFJlYXNvbnMgPSBwcmludFByZWNoZWNrUmVhc29ucy5tYXAoKHJlYXNvbikgPT4gcmVhc29uLmtleSk7XG4gICAgICBjb25zdCBuZXh0QWN0aW9uID0gaGVhZC5uZXh0LmpvaW4oJyAvICcpO1xuICAgICAgc2V0QmFubmVyKHsgdG9uZTogJ3dhcm5pbmcnLCBtZXNzYWdlOiBg5biz56Wo5Ye65Yqb44KS5YGc5q2iOiAke2hlYWQuc3VtbWFyeX1gLCBuZXh0QWN0aW9uIH0pO1xuICAgICAgc2V0VG9hc3QobnVsbCk7XG4gICAgICByZWNvcmRDaGFydHNBdWRpdEV2ZW50KHtcbiAgICAgICAgYWN0aW9uOiAnT1JDQV9SRVBPUlRfUFJJTlQnLFxuICAgICAgICBvdXRjb21lOiAnYmxvY2tlZCcsXG4gICAgICAgIHN1YmplY3Q6ICdvcmNhLXJlcG9ydC1wcmV2aWV3JyxcbiAgICAgICAgbm90ZTogaGVhZC5kZXRhaWwsXG4gICAgICAgIHBhdGllbnRJZDogcmVzb2x2ZWRQYXRpZW50SWQsXG4gICAgICAgIGFwcG9pbnRtZW50SWQ6IHJlc29sdmVkQXBwb2ludG1lbnRJZCxcbiAgICAgICAgcnVuSWQsXG4gICAgICAgIGNhY2hlSGl0LFxuICAgICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgICBmYWxsYmFja1VzZWQsXG4gICAgICAgIGRhdGFTb3VyY2VUcmFuc2l0aW9uLFxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgb3BlcmF0aW9uUGhhc2U6ICdsb2NrJyxcbiAgICAgICAgICBibG9ja2VkUmVhc29ucyxcbiAgICAgICAgICByZXBvcnRUeXBlOiByZXNvbHZlZFJlcG9ydFR5cGUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXJlc29sdmVkUGF0aWVudElkKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gJ+aCo+iAhUlE44GM5pyq56K65a6a44Gu44Gf44KB5biz56Wo5Ye65Yqb44KS6ZaL5aeL44Gn44GN44G+44Gb44KT44CCJztcbiAgICAgIHNldEJhbm5lcih7IHRvbmU6ICd3YXJuaW5nJywgbWVzc2FnZSwgbmV4dEFjdGlvbjogJ1BhdGllbnRzIOOBp+aCo+iAheOCkumBuOaKnuOBl+OBpuOBj+OBoOOBleOBhOOAgicgfSk7XG4gICAgICBzZXRUb2FzdCh7IHRvbmU6ICd3YXJuaW5nJywgbWVzc2FnZTogJ+aCo+iAheacqumBuOaKnicsIGRldGFpbDogbWVzc2FnZSB9KTtcbiAgICAgIHJlY29yZENoYXJ0c0F1ZGl0RXZlbnQoe1xuICAgICAgICBhY3Rpb246ICdPUkNBX1JFUE9SVF9QUklOVCcsXG4gICAgICAgIG91dGNvbWU6ICdibG9ja2VkJyxcbiAgICAgICAgc3ViamVjdDogJ29yY2EtcmVwb3J0LXByZXZpZXcnLFxuICAgICAgICBub3RlOiBtZXNzYWdlLFxuICAgICAgICBydW5JZCxcbiAgICAgICAgY2FjaGVIaXQsXG4gICAgICAgIG1pc3NpbmdNYXN0ZXIsXG4gICAgICAgIGZhbGxiYWNrVXNlZCxcbiAgICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICBvcGVyYXRpb25QaGFzZTogJ2xvY2snLFxuICAgICAgICAgIGJsb2NrZWRSZWFzb25zOiBbJ3BhdGllbnRfbm90X3NlbGVjdGVkJ10sXG4gICAgICAgICAgcmVwb3J0VHlwZTogcmVzb2x2ZWRSZXBvcnRUeXBlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFyZXBvcnRSZWFkeSkge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHJlcG9ydEZpZWxkRXJyb3JzLmpvaW4oJyAvICcpIHx8ICfluLPnpajlh7rlipvmnaHku7bjgYzkuI3otrPjgZfjgabjgYTjgb7jgZnjgIInO1xuICAgICAgc2V0QmFubmVyKHsgdG9uZTogJ3dhcm5pbmcnLCBtZXNzYWdlOiBg5biz56Wo5Ye65Yqb44KS5YGc5q2iOiAke21lc3NhZ2V9YCwgbmV4dEFjdGlvbjogJ+WFpeWKm+WGheWuueOCkueiuuiqjeOBl+OBpuOBj+OBoOOBleOBhOOAgicgfSk7XG4gICAgICBzZXRUb2FzdCh7IHRvbmU6ICd3YXJuaW5nJywgbWVzc2FnZTogJ+W4s+elqOWHuuWKm+OCkuWBnOatoicsIGRldGFpbDogbWVzc2FnZSB9KTtcbiAgICAgIHJlY29yZENoYXJ0c0F1ZGl0RXZlbnQoe1xuICAgICAgICBhY3Rpb246ICdPUkNBX1JFUE9SVF9QUklOVCcsXG4gICAgICAgIG91dGNvbWU6ICdibG9ja2VkJyxcbiAgICAgICAgc3ViamVjdDogJ29yY2EtcmVwb3J0LXByZXZpZXcnLFxuICAgICAgICBub3RlOiBtZXNzYWdlLFxuICAgICAgICBwYXRpZW50SWQ6IHJlc29sdmVkUGF0aWVudElkLFxuICAgICAgICBhcHBvaW50bWVudElkOiByZXNvbHZlZEFwcG9pbnRtZW50SWQsXG4gICAgICAgIHJ1bklkLFxuICAgICAgICBjYWNoZUhpdCxcbiAgICAgICAgbWlzc2luZ01hc3RlcixcbiAgICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgICBkYXRhU291cmNlVHJhbnNpdGlvbixcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIG9wZXJhdGlvblBoYXNlOiAnbG9jaycsXG4gICAgICAgICAgYmxvY2tlZFJlYXNvbnM6IHJlcG9ydEZpZWxkRXJyb3JzLFxuICAgICAgICAgIHJlcG9ydFR5cGU6IHJlc29sdmVkUmVwb3J0VHlwZSxcbiAgICAgICAgICBpbnZvaWNlTnVtYmVyOiByZXBvcnRGb3JtLmludm9pY2VOdW1iZXIgfHwgdW5kZWZpbmVkLFxuICAgICAgICAgIGRlcGFydG1lbnRDb2RlOiByZXBvcnRGb3JtLmRlcGFydG1lbnRDb2RlIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgICBpbnN1cmFuY2VDb21iaW5hdGlvbk51bWJlcjogcmVwb3J0Rm9ybS5pbnN1cmFuY2VDb21iaW5hdGlvbk51bWJlciB8fCB1bmRlZmluZWQsXG4gICAgICAgICAgcGVyZm9ybU1vbnRoOiByZXBvcnRGb3JtLnBlcmZvcm1Nb250aCB8fCB1bmRlZmluZWQsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRJc1J1bm5pbmcodHJ1ZSk7XG4gICAgc2V0UnVubmluZ0FjdGlvbigncHJpbnQnKTtcbiAgICBzZXRSZXRyeUFjdGlvbihudWxsKTtcbiAgICBzZXRUb2FzdChudWxsKTtcbiAgICBzZXRCYW5uZXIobnVsbCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxdWVzdFJlcG9ydFByZXZpZXcoKTtcbiAgICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihyZXN1bHQuZXJyb3IpO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJldmlld1N0YXRlID0gcmVzdWx0LnByZXZpZXdTdGF0ZTtcbiAgICAgIGNvbnN0IHByaW50UGF0aCA9IGJ1aWxkRmFjaWxpdHlQYXRoKHNlc3Npb24/LmZhY2lsaXR5SWQsICcvY2hhcnRzL3ByaW50L2RvY3VtZW50Jyk7XG4gICAgICBuYXZpZ2F0ZShwcmludFBhdGgsIHsgc3RhdGU6IHByZXZpZXdTdGF0ZSB9KTtcbiAgICAgIHNhdmVSZXBvcnRQcmludFByZXZpZXcocHJldmlld1N0YXRlLCB7IGZhY2lsaXR5SWQ6IHNlc3Npb24/LmZhY2lsaXR5SWQsIHVzZXJJZDogc2Vzc2lvbj8udXNlcklkIH0pO1xuICAgICAgc2V0VG9hc3Qoe1xuICAgICAgICB0b25lOiAnc3VjY2VzcycsXG4gICAgICAgIG1lc3NhZ2U6ICfluLPnpajjg5fjg6zjg5Pjg6Xjg7zjgpLplovjgY3jgb7jgZfjgZ8nLFxuICAgICAgICBkZXRhaWw6IGBEYXRhX0lkPSR7cmVzdWx0LnJlc3BvbnNlTWV0YS5kYXRhSWR9IC8gcnVuSWQ9JHtyZXN1bHQucmVzcG9uc2VNZXRhLnJ1bklkID8/IHJ1bklkfSAvIHRyYWNlSWQ9JHtcbiAgICAgICAgICByZXN1bHQucmVzcG9uc2VNZXRhLnRyYWNlSWQgPz8gJ3Vua25vd24nXG4gICAgICAgIH1gLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGRldGFpbCA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIGNvbnN0IG5leHRBY3Rpb24gPVxuICAgICAgICByZXNvbHZlZFJlcG9ydFR5cGUgPT09ICdwcmVzY3JpcHRpb24nXG4gICAgICAgICAgPyAn5Luj5pu/OiDoqLrnmYLoqJjpjLLvvIjlpJbmnaXjgrXjg57jg6rvvInjgpLjg63jg7zjgqvjg6vljbDliLfjgaflh7rlipvjgZfjgabjgY/jgaDjgZXjgYTjgIInXG4gICAgICAgICAgOiAnT1JDQSDlv5znrZTjgpLnorroqo3jgZfjgIHlho3oqabooYzjgZfjgabjgY/jgaDjgZXjgYTjgIInO1xuICAgICAgc2V0QmFubmVyKHsgdG9uZTogJ2Vycm9yJywgbWVzc2FnZTogYOW4s+elqOWHuuWKm+OBq+WkseaVlzogJHtkZXRhaWx9YCwgbmV4dEFjdGlvbiB9KTtcbiAgICAgIHNldFRvYXN0KHsgdG9uZTogJ2Vycm9yJywgbWVzc2FnZTogJ+W4s+elqOWHuuWKm+OBq+WkseaVlycsIGRldGFpbCB9KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNSdW5uaW5nKGZhbHNlKTtcbiAgICAgIHNldFJ1bm5pbmdBY3Rpb24obnVsbCk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVVubG9jayA9ICgpID0+IHtcbiAgICBzZXRMb2NrUmVhc29uKG51bGwpO1xuICAgIHNldEJhbm5lcih7IHRvbmU6ICdpbmZvJywgbWVzc2FnZTogJ1VJ44Ot44OD44Kv44KS6Kej6Zmk44GX44G+44GX44Gf44CC5qyh44Gu44Ki44Kv44K344On44Oz44KS5a6f6KGM44Gn44GN44G+44GZ44CCJyB9KTtcbiAgICBzZXRUb2FzdChudWxsKTtcbiAgICBsb2dVaVN0YXRlKHtcbiAgICAgIGFjdGlvbjogJ2xvY2snLFxuICAgICAgc2NyZWVuOiAnY2hhcnRzL2FjdGlvbi1iYXInLFxuICAgICAgY29udHJvbElkOiAndW5sb2NrJyxcbiAgICAgIHJ1bklkLFxuICAgICAgY2FjaGVIaXQsXG4gICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICBmYWxsYmFja1VzZWQsXG4gICAgICBkZXRhaWxzOiB7IG9wZXJhdGlvblBoYXNlOiAnbG9jaycsIHVubG9ja2VkOiB0cnVlIH0sXG4gICAgfSk7XG4gICAgcmVjb3JkQ2hhcnRzQXVkaXRFdmVudCh7XG4gICAgICBhY3Rpb246ICdDSEFSVFNfRURJVF9MT0NLJyxcbiAgICAgIG91dGNvbWU6ICdyZWxlYXNlZCcsXG4gICAgICBzdWJqZWN0OiAnY2hhcnRzLXVpLWxvY2snLFxuICAgICAgcGF0aWVudElkOiByZXNvbHZlZFBhdGllbnRJZCxcbiAgICAgIGFwcG9pbnRtZW50SWQ6IHJlc29sdmVkQXBwb2ludG1lbnRJZCxcbiAgICAgIHJ1bklkLFxuICAgICAgY2FjaGVIaXQsXG4gICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICBkZXRhaWxzOiB7XG4gICAgICAgIG9wZXJhdGlvblBoYXNlOiAnbG9jaycsXG4gICAgICAgIHRyaWdnZXI6ICd1aV91bmxvY2snLFxuICAgICAgICBsb2NrU3RhdHVzOiAndWknLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVBYm9ydCA9ICgpID0+IHtcbiAgICBpZiAoIWlzUnVubmluZykgcmV0dXJuO1xuICAgIGlmIChydW5uaW5nQWN0aW9uICE9PSAnc2VuZCcpIHJldHVybjtcbiAgICBhYm9ydENvbnRyb2xsZXJSZWYuY3VycmVudD8uYWJvcnQoKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVBcHByb3ZhbFVubG9jayA9ICgpID0+IHtcbiAgICBpZiAoIWFwcHJvdmFsTG9ja2VkIHx8ICFvbkFwcHJvdmFsVW5sb2NrKSByZXR1cm47XG4gICAgY29uc3QgZmlyc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICAgPyB3aW5kb3cuY29uZmlybSgn5om/6KqN44Ot44OD44Kv77yI572y5ZCN56K65a6a77yJ44KS6Kej6Zmk44GX44G+44GZ44GL77yf44GT44Gu5pON5L2c44Gv5Y2x6Zm644Gn44GZ44CCJylcbiAgICAgIDogZmFsc2U7XG4gICAgaWYgKCFmaXJzdCkgcmV0dXJuO1xuICAgIGNvbnN0IHNlY29uZCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgICA/IHdpbmRvdy5jb25maXJtKCfmnIDntYLnorroqo06IOaJv+iqjeODreODg+OCr+ino+mZpO+8iOe9suWQjeWPlua2iO+8ieOCkuWun+ihjOOBl+OBvuOBmeOAguOCiOOCjeOBl+OBhOOBp+OBmeOBi++8nycpXG4gICAgICA6IGZhbHNlO1xuICAgIGlmICghc2Vjb25kKSByZXR1cm47XG4gICAgb25BcHByb3ZhbFVubG9jaygpO1xuICAgIHNldEJhbm5lcih7XG4gICAgICB0b25lOiAnd2FybmluZycsXG4gICAgICBtZXNzYWdlOiAn5om/6KqN44Ot44OD44Kv44KS6Kej6Zmk44GX44G+44GX44Gf44CC572y5ZCN56K65a6a44GM5Y+W44KK5raI44GV44KM44CB57eo6ZuG44GM5YaN6ZaL44Gn44GN44G+44GZ44CCJyxcbiAgICAgIG5leHRBY3Rpb246ICfnt6jpm4bliY3jgavlhoXlrrnnorroqo3jgajlho3nvbLlkI3jgYzlv4XopoHjgYvnorroqo3jgZfjgabjgY/jgaDjgZXjgYTjgIInLFxuICAgIH0pO1xuICAgIHNldFRvYXN0KG51bGwpO1xuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVJlbG9hZExhdGVzdCA9IGFzeW5jICgpID0+IHtcbiAgICBzZXRUb2FzdCh7XG4gICAgICB0b25lOiAnaW5mbycsXG4gICAgICBtZXNzYWdlOiAn5pyA5paw44KS5YaN6Kqt6L68JyxcbiAgICAgIGRldGFpbDogJ+acgOaWsOODh+ODvOOCv+OCkuWGjeWPluW+l+OBl+OBvuOBme+8iOWPluW+l+WujOS6huW+jOOBq+e3qOmbhuWPr+WQpuOBjOabtOaWsOOBleOCjOOBvuOBme+8ieOAgicsXG4gICAgfSk7XG4gICAgcmVjb3JkQ2hhcnRzQXVkaXRFdmVudCh7XG4gICAgICBhY3Rpb246ICdDSEFSVFNfQ09ORkxJQ1QnLFxuICAgICAgb3V0Y29tZTogJ3Jlc29sdmVkJyxcbiAgICAgIHN1YmplY3Q6ICdjaGFydHMtdGFiLWxvY2snLFxuICAgICAgcGF0aWVudElkOiByZXNvbHZlZFBhdGllbnRJZCxcbiAgICAgIGFwcG9pbnRtZW50SWQ6IHJlc29sdmVkQXBwb2ludG1lbnRJZCxcbiAgICAgIHJ1bklkLFxuICAgICAgY2FjaGVIaXQsXG4gICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgZmFsbGJhY2tVc2VkLFxuICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICBkZXRhaWxzOiB7XG4gICAgICAgIG9wZXJhdGlvblBoYXNlOiAnbG9jaycsXG4gICAgICAgIHRyaWdnZXI6ICd0YWInLFxuICAgICAgICByZXNvbHV0aW9uOiAncmVsb2FkJyxcbiAgICAgICAgbG9ja1N0YXR1czogZWRpdExvY2s/LmxvY2tTdGF0dXMsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGxvZ1VpU3RhdGUoe1xuICAgICAgYWN0aW9uOiAnbG9jaycsXG4gICAgICBzY3JlZW46ICdjaGFydHMvYWN0aW9uLWJhcicsXG4gICAgICBjb250cm9sSWQ6ICdyZWxvYWQtbGF0ZXN0JyxcbiAgICAgIHJ1bklkLFxuICAgICAgY2FjaGVIaXQsXG4gICAgICBtaXNzaW5nTWFzdGVyLFxuICAgICAgZGF0YVNvdXJjZVRyYW5zaXRpb24sXG4gICAgICBmYWxsYmFja1VzZWQsXG4gICAgICBkZXRhaWxzOiB7XG4gICAgICAgIG9wZXJhdGlvblBoYXNlOiAnbG9jaycsXG4gICAgICAgIHRyaWdnZXI6ICd0YWInLFxuICAgICAgICByZXNvbHV0aW9uOiAncmVsb2FkJyxcbiAgICAgICAgbG9ja1N0YXR1czogZWRpdExvY2s/LmxvY2tTdGF0dXMsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIGF3YWl0IG9uUmVsb2FkTGF0ZXN0Py4oKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVEaXNjYXJkID0gKCkgPT4ge1xuICAgIG9uRGlzY2FyZENoYW5nZXM/LigpO1xuICAgIHNldFRvYXN0KHtcbiAgICAgIHRvbmU6ICdpbmZvJyxcbiAgICAgIG1lc3NhZ2U6ICflpInmm7TjgpLnoLTmo4TjgZfjgb7jgZfjgZ8nLFxuICAgICAgZGV0YWlsOiAn44Ot44O844Kr44Or44Gu5pyq5L+d5a2Y54q25oWL44KS56C05qOE44GX44CB6Zay6Kan5bCC55So54q25oWL44Gu6Kej6Zmk44KS5b6F44Gm44G+44GZ44CCJyxcbiAgICB9KTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVGb3JjZVRha2VvdmVyID0gKCkgPT4ge1xuICAgIGNvbnN0IGNvbmZpcm1lZCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgICA/IHdpbmRvdy5jb25maXJtKCfliKXjgr/jg5bjgYzkv53mjIHjgZfjgabjgYTjgovnt6jpm4bjg63jg4Pjgq/jgpLlvJXjgY3ntpnjgY7jgb7jgZnjgYvvvJ/vvIjkuIrmm7jjgY3jga7lj6/og73mgKfjgYzjgYLjgorjgb7jgZnvvIknKVxuICAgICAgOiBmYWxzZTtcbiAgICBpZiAoIWNvbmZpcm1lZCkgcmV0dXJuO1xuICAgIGNvbnN0IHNlY29uZCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgICA/IHdpbmRvdy5jb25maXJtKCfmnIDntYLnorroqo06IOe3qOmbhuODreODg+OCr+OBruW8leOBjee2meOBjuOCkuWun+ihjOOBl+OBvuOBmeOAguOCiOOCjeOBl+OBhOOBp+OBmeOBi++8nycpXG4gICAgICA6IGZhbHNlO1xuICAgIGlmICghc2Vjb25kKSByZXR1cm47XG4gICAgb25Gb3JjZVRha2VvdmVyPy4oKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxzZWN0aW9uXG4gICAgICBjbGFzc05hbWU9e2BjaGFydHMtYWN0aW9ucyR7aXNMb2NrZWQgPyAnIGNoYXJ0cy1hY3Rpb25zLS1sb2NrZWQnIDogJyd9YH1cbiAgICAgIGlkPVwiY2hhcnRzLWFjdGlvbmJhclwiXG4gICAgICB0YWJJbmRleD17LTF9XG4gICAgICBkYXRhLWZvY3VzLWFuY2hvcj1cInRydWVcIlxuICAgICAgYXJpYS1saXZlPVwib2ZmXCJcbiAgICAgIGRhdGEtcnVuLWlkPXtydW5JZH1cbiAgICAgIGRhdGEtdGVzdC1pZD1cImNoYXJ0cy1hY3Rpb25iYXJcIlxuICAgID5cbiAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2hlYWRlclwiPlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19raWNrZXJcIj7jgqLjgq/jgrfjg6fjg7Pjg5Djg7wgLyBPUkNBIOmAgeS/oeOBqOODieODqeODleODiOWItuW+oTwvcD5cbiAgICAgICAgICA8aDI+6Ki655mC57WC5LqG44O76YCB5L+h44O744OJ44Op44OV44OI44O744Kt44Oj44Oz44K744OrPC9oMj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fc3RhdHVzXCIgcm9sZT1cInN0YXR1c1wiPlxuICAgICAgICAgICAge3N0YXR1c0xpbmV9XG4gICAgICAgICAgPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fbWV0YVwiPlxuICAgICAgICAgIDxTdGF0dXNQaWxsIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19waWxsXCIgbGFiZWw9XCJydW5JZFwiIHZhbHVlPXtydW5JZCA/PyAn4oCUJ30gdG9uZT1cImluZm9cIiAvPlxuICAgICAgICAgIDxTdGF0dXNQaWxsIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19waWxsXCIgbGFiZWw9XCJ0cmFjZUlkXCIgdmFsdWU9e3Jlc29sdmVkVHJhY2VJZCA/PyAndW5rbm93bid9IHRvbmU9XCJpbmZvXCIgLz5cbiAgICAgICAgICA8U3RhdHVzUGlsbCBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fcGlsbFwiIGxhYmVsPVwidHJhbnNpdGlvblwiIHZhbHVlPXtkYXRhU291cmNlVHJhbnNpdGlvbn0gdG9uZT1cImluZm9cIiAvPlxuICAgICAgICAgIDxTdGF0dXNQaWxsXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fcGlsbFwiXG4gICAgICAgICAgICBsYWJlbD1cIm1pc3NpbmdNYXN0ZXJcIlxuICAgICAgICAgICAgdmFsdWU9e1N0cmluZyhtaXNzaW5nTWFzdGVyKX1cbiAgICAgICAgICAgIHRvbmU9e21pc3NpbmdNYXN0ZXIgPyAnd2FybmluZycgOiAnc3VjY2Vzcyd9XG4gICAgICAgICAgLz5cbiAgICAgICAgICA8U3RhdHVzUGlsbFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX3BpbGxcIlxuICAgICAgICAgICAgbGFiZWw9XCJmYWxsYmFja1VzZWRcIlxuICAgICAgICAgICAgdmFsdWU9e1N0cmluZyhmYWxsYmFja1VzZWQpfVxuICAgICAgICAgICAgdG9uZT17ZmFsbGJhY2tVc2VkID8gJ3dhcm5pbmcnIDogJ3N1Y2Nlc3MnfVxuICAgICAgICAgIC8+XG4gICAgICAgICAgPFN0YXR1c1BpbGxcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19waWxsXCJcbiAgICAgICAgICAgIGxhYmVsPVwiZHJhZnREaXJ0eVwiXG4gICAgICAgICAgICB2YWx1ZT17U3RyaW5nKGhhc1Vuc2F2ZWREcmFmdCl9XG4gICAgICAgICAgICB0b25lPXtoYXNVbnNhdmVkRHJhZnQgPyAnd2FybmluZycgOiAnc3VjY2Vzcyd9XG4gICAgICAgICAgLz5cbiAgICAgICAgICA8U3RhdHVzUGlsbFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX3BpbGxcIlxuICAgICAgICAgICAgbGFiZWw9XCLmgqPogIVcIlxuICAgICAgICAgICAgdmFsdWU9e2Ake3NlbGVjdGVkRW50cnk/Lm5hbWUgPz8gJ+acqumBuOaKnid977yIJHtzZWxlY3RlZEVudHJ5Py5wYXRpZW50SWQgPz8gc2VsZWN0ZWRFbnRyeT8uYXBwb2ludG1lbnRJZCA/PyAnSUTkuI3mmI4nfe+8iWB9XG4gICAgICAgICAgLz5cbiAgICAgICAgICA8U3RhdHVzUGlsbCBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fcGlsbFwiIGxhYmVsPVwi5Y+X5LuYSURcIiB2YWx1ZT17c2VsZWN0ZWRFbnRyeT8ucmVjZXB0aW9uSWQgPz8gJ+KAlCd9IC8+XG4gICAgICAgICAgPFN0YXR1c1BpbGwgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX3BpbGxcIiBsYWJlbD1cIuiouueZguaXpVwiIHZhbHVlPXtyZXNvbHZlZFZpc2l0RGF0ZSA/PyAn4oCUJ30gLz5cbiAgICAgICAgICA8U3RhdHVzUGlsbFxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX3BpbGxcIlxuICAgICAgICAgICAgbGFiZWw9XCLnj77lnKhcIlxuICAgICAgICAgICAgdmFsdWU9e2Ake3NlbGVjdGVkRW50cnk/LnN0YXR1cyA/PyAn4oCUJ33vvIjlj5fku5jihpLoqLrnmYLihpLkvJroqIjvvIlgfVxuICAgICAgICAgIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9oZWFkZXI+XG5cbiAgICAgIHtndWFyZFN1bW1hcmllcy5sZW5ndGggPiAwID8gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19ndWFyZC1zdW1tYXJ5XCIgcm9sZT1cInN0YXR1c1wiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPlxuICAgICAgICAgIDxzdHJvbmc+44Ks44O844OJ55CG55Sx77yI55+t5paH77yJPC9zdHJvbmc+XG4gICAgICAgICAgPHVsPlxuICAgICAgICAgICAge2d1YXJkU3VtbWFyaWVzLm1hcCgoaXRlbSkgPT4gKFxuICAgICAgICAgICAgICA8bGkga2V5PXtpdGVtLmtleX0+XG4gICAgICAgICAgICAgICAge2l0ZW0uYWN0aW9ufToge2l0ZW0uc3VtbWFyeX1cbiAgICAgICAgICAgICAgICB7aXRlbS5uZXh0QWN0aW9uID8gYCAvIOasoTogJHtpdGVtLm5leHRBY3Rpb259YCA6ICcnfVxuICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogbnVsbH1cblxuICAgICAgPEZvY3VzVHJhcERpYWxvZ1xuICAgICAgICBvcGVuPXtjb25maXJtQWN0aW9uID09PSAnc2VuZCd9XG4gICAgICAgIHJvbGU9XCJhbGVydGRpYWxvZ1wiXG4gICAgICAgIHRpdGxlPVwiT1JDQemAgeS/oeOBrueiuuiqjVwiXG4gICAgICAgIGRlc2NyaXB0aW9uPXtg54++5Zyo44Gu5oKj6ICFL+WPl+S7mOOCkiBPUkNBIOOBuOmAgeS/oeOBl+OBvuOBmeOAguWun+ihjOW+jOOBq+WPluOCiua2iOOBm+OBquOBhOWgtOWQiOOBjOOBguOCiuOBvuOBmeOAgu+8iHJ1bklkPSR7cnVuSWR9IC8gdHJhbnNpdGlvbj0ke2RhdGFTb3VyY2VUcmFuc2l0aW9ufe+8iWB9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHtcbiAgICAgICAgICBmaW5hbGl6ZUFwcHJvdmFsKCdzZW5kJywgJ2NhbmNlbGxlZCcpO1xuICAgICAgICAgIHNldENvbmZpcm1BY3Rpb24obnVsbCk7XG4gICAgICAgIH19XG4gICAgICAgIHRlc3RJZD1cImNoYXJ0cy1zZW5kLWRpYWxvZ1wiXG4gICAgICA+XG4gICAgICAgIDxkaXYgcm9sZT1cImdyb3VwXCIgYXJpYS1sYWJlbD1cIk9SQ0HpgIHkv6Hjga7norroqo1cIj5cbiAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgZmluYWxpemVBcHByb3ZhbCgnc2VuZCcsICdjYW5jZWxsZWQnKTtcbiAgICAgICAgICAgICAgc2V0Q29uZmlybUFjdGlvbihudWxsKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAg44Kt44Oj44Oz44K744OrXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgIGZpbmFsaXplQXBwcm92YWwoJ3NlbmQnLCAnY29uZmlybWVkJyk7XG4gICAgICAgICAgICAgIHNldENvbmZpcm1BY3Rpb24obnVsbCk7XG4gICAgICAgICAgICAgIGNvbnN0IHsgYWN0b3IgfSA9IHJlc29sdmVBdWRpdEFjdG9yKCk7XG4gICAgICAgICAgICAgIG9uQXBwcm92YWxDb25maXJtZWQ/Lih7IGFjdGlvbjogJ3NlbmQnLCBhY3RvciB9KTtcbiAgICAgICAgICAgICAgdm9pZCBoYW5kbGVBY3Rpb24oJ3NlbmQnKTtcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAg6YCB5L+h44GZ44KLXG4gICAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9Gb2N1c1RyYXBEaWFsb2c+XG5cbiAgICAgIDxSZXBvcnRQcmludERpYWxvZ1xuICAgICAgICBvcGVuPXtwcmludERpYWxvZ09wZW59XG4gICAgICAgIHJ1bklkPXtydW5JZH1cbiAgICAgICAgaXNSdW5uaW5nPXtpc1J1bm5pbmd9XG4gICAgICAgIG9uQ2xvc2U9eygpID0+IHtcbiAgICAgICAgICBmaW5hbGl6ZUFwcHJvdmFsKCdwcmludCcsICdjYW5jZWxsZWQnKTtcbiAgICAgICAgICBzZXRQcmludERpYWxvZ09wZW4oZmFsc2UpO1xuICAgICAgICB9fVxuICAgICAgICBvbkNvbmZpcm1PdXRwYXRpZW50PXsoKSA9PiB7XG4gICAgICAgICAgZmluYWxpemVBcHByb3ZhbCgncHJpbnQnLCAnY29uZmlybWVkJyk7XG4gICAgICAgICAgc2V0UHJpbnREaWFsb2dPcGVuKGZhbHNlKTtcbiAgICAgICAgICBoYW5kbGVQcmludEV4cG9ydCgpO1xuICAgICAgICB9fVxuICAgICAgICBvbkNvbmZpcm1SZXBvcnQ9eygpID0+IHtcbiAgICAgICAgICBmaW5hbGl6ZUFwcHJvdmFsKCdwcmludCcsICdjb25maXJtZWQnKTtcbiAgICAgICAgICBzZXRQcmludERpYWxvZ09wZW4oZmFsc2UpO1xuICAgICAgICAgIHZvaWQgaGFuZGxlUmVwb3J0UHJpbnQoKTtcbiAgICAgICAgfX1cbiAgICAgICAgcHJpbnREZXN0aW5hdGlvbj17cHJpbnREZXN0aW5hdGlvbn1cbiAgICAgICAgb25EZXN0aW5hdGlvbkNoYW5nZT17c2V0UHJpbnREZXN0aW5hdGlvbn1cbiAgICAgICAgcmVwb3J0Rm9ybT17cmVwb3J0Rm9ybX1cbiAgICAgICAgb25SZXBvcnRGaWVsZENoYW5nZT17dXBkYXRlUmVwb3J0RmllbGR9XG4gICAgICAgIHJlcG9ydEZpZWxkRXJyb3JzPXtyZXBvcnRGaWVsZEVycm9yc31cbiAgICAgICAgcmVwb3J0UmVhZHk9e3JlcG9ydFJlYWR5fVxuICAgICAgICByZXBvcnRJbmNvbWVTdGF0dXM9e3JlcG9ydEluY29tZVN0YXR1c31cbiAgICAgICAgcmVwb3J0SW5jb21lRXJyb3I9e3JlcG9ydEluY29tZUVycm9yfVxuICAgICAgICByZXBvcnRJbmNvbWVMYXRlc3Q9e3JlcG9ydEluY29tZUxhdGVzdH1cbiAgICAgICAgcmVwb3J0SW52b2ljZU9wdGlvbnM9e3JlcG9ydEludm9pY2VPcHRpb25zfVxuICAgICAgICByZXBvcnRJbnN1cmFuY2VPcHRpb25zPXtyZXBvcnRJbnN1cmFuY2VPcHRpb25zfVxuICAgICAgICByZXBvcnROZWVkc0ludm9pY2U9e3JlcG9ydE5lZWRzSW52b2ljZX1cbiAgICAgICAgcmVwb3J0TmVlZHNPdXRzaWRlQ2xhc3M9e3JlcG9ydE5lZWRzT3V0c2lkZUNsYXNzfVxuICAgICAgICByZXBvcnROZWVkc0RlcGFydG1lbnQ9e3JlcG9ydE5lZWRzRGVwYXJ0bWVudH1cbiAgICAgICAgcmVwb3J0TmVlZHNJbnN1cmFuY2U9e3JlcG9ydE5lZWRzSW5zdXJhbmNlfVxuICAgICAgICByZXBvcnROZWVkc1BlcmZvcm1Nb250aD17cmVwb3J0TmVlZHNQZXJmb3JtTW9udGh9XG4gICAgICAgIHJlc29sdmVkUmVwb3J0VHlwZT17cmVzb2x2ZWRSZXBvcnRUeXBlfVxuICAgICAgLz5cblxuICAgICAge2Jhbm5lciAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2Jhbm5lclwiPlxuICAgICAgICAgIDxUb25lQmFubmVyIHRvbmU9e2Jhbm5lci50b25lfSBtZXNzYWdlPXtiYW5uZXIubWVzc2FnZX0gbmV4dEFjdGlvbj17YmFubmVyLm5leHRBY3Rpb259IHJ1bklkPXtydW5JZH0gLz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19iYW5uZXItYWN0aW9uc1wiIHJvbGU9XCJncm91cFwiIGFyaWEtbGFiZWw9XCLpgJrnn6Xmk43kvZxcIj5cbiAgICAgICAgICAgIHtyZXRyeUFjdGlvbiAmJiAhaXNSdW5uaW5nICYmIChcbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX3JldHJ5XCIgb25DbGljaz17KCkgPT4gaGFuZGxlQWN0aW9uKHJldHJ5QWN0aW9uKX0+XG4gICAgICAgICAgICAgICAg44Oq44OI44Op44KkXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19yZXRyeVwiIG9uQ2xpY2s9eygpID0+IHNldEJhbm5lcihudWxsKX0+XG4gICAgICAgICAgICAgIOmWieOBmOOCi1xuICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge2lzUnVubmluZyAmJiBydW5uaW5nQWN0aW9uID09PSAnc2VuZCcgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19iYW5uZXItYWN0aW9uc1wiIHJvbGU9XCJncm91cFwiIGFyaWEtbGFiZWw9XCLpgLLooYzkuK3jga7mk43kvZxcIj5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fcmV0cnlcIiBvbkNsaWNrPXtoYW5kbGVBYm9ydH0+XG4gICAgICAgICAgICDpgIHkv6HjgpLkuK3mlq1cbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgICAge2FwcHJvdmFsTG9ja2VkID8gKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19jb25mbGljdFwiIHJvbGU9XCJncm91cFwiIGFyaWEtbGFiZWw9XCLmib/oqo3muIjjgb/vvIjnvbLlkI3norrlrprvvInjga7jgZ/jgoHnt6jpm4bkuI3lj69cIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19jb25mbGljdC10aXRsZVwiPlxuICAgICAgICAgICAgPHN0cm9uZz7mib/oqo3muIjjgb/vvIjnvbLlkI3norrlrprvvIk8L3N0cm9uZz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19jb25mbGljdC1tZXRhXCI+XG4gICAgICAgICAgICAgIHthcHByb3ZhbExvY2s/LmFwcHJvdmVkQXQgPyBgYXBwcm92ZWRBdD0ke2FwcHJvdmFsTG9jay5hcHByb3ZlZEF0fWAgOiAnJ31cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fY29uZmxpY3QtbWVzc2FnZVwiPnthcHByb3ZhbFJlYXNvbn08L3A+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fY29uZmxpY3QtYWN0aW9uc1wiPlxuICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2J1dHRvbiBjaGFydHMtYWN0aW9uc19fYnV0dG9uLS11bmxvY2tcIiBvbkNsaWNrPXtvcGVuUHJpbnREaWFsb2d9PlxuICAgICAgICAgICAgICDljbDliLcv44Ko44Kv44K544Od44O844OI44G4XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19idXR0b24gY2hhcnRzLWFjdGlvbnNfX2J1dHRvbi0tZGFuZ2VyXCJcbiAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlQXBwcm92YWxVbmxvY2t9XG4gICAgICAgICAgICAgIGRpc2FibGVkPXshb25BcHByb3ZhbFVubG9ja31cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAg5om/6KqN44Ot44OD44Kv6Kej6ZmkXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogbnVsbH1cbiAgICAgIHtyZWFkT25seSAmJiAhYXBwcm92YWxMb2NrZWQgPyAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2NvbmZsaWN0XCIgcm9sZT1cImdyb3VwXCIgYXJpYS1sYWJlbD1cIuS4puihjOe3qOmbhu+8iOmWsuimp+WwgueUqO+8ieOBruWvvuW/nFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2NvbmZsaWN0LXRpdGxlXCI+XG4gICAgICAgICAgICA8c3Ryb25nPuS4puihjOe3qOmbhuOCkuaknOefpTwvc3Ryb25nPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2NvbmZsaWN0LW1ldGFcIj5cbiAgICAgICAgICAgICAge2VkaXRMb2NrPy5vd25lclJ1bklkID8gYG93bmVyUnVuSWQ9JHtlZGl0TG9jay5vd25lclJ1bklkfWAgOiAnJ31cbiAgICAgICAgICAgICAge2VkaXRMb2NrPy5leHBpcmVzQXQgPyBgIGV4cGlyZXNBdD0ke2VkaXRMb2NrLmV4cGlyZXNBdH1gIDogJyd9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2NvbmZsaWN0LW1lc3NhZ2VcIj57cmVhZE9ubHlSZWFzb259PC9wPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2NvbmZsaWN0LWFjdGlvbnNcIj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19idXR0b24gY2hhcnRzLWFjdGlvbnNfX2J1dHRvbi0tdW5sb2NrXCIgb25DbGljaz17aGFuZGxlUmVsb2FkTGF0ZXN0fT5cbiAgICAgICAgICAgICAg5pyA5paw44KS5YaN6Kqt6L68XG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19idXR0b24gY2hhcnRzLWFjdGlvbnNfX2J1dHRvbi0tZ2hvc3RcIlxuICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVEaXNjYXJkfVxuICAgICAgICAgICAgICBkaXNhYmxlZD17IWhhc1Vuc2F2ZWREcmFmdH1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAg6Ieq5YiG44Gu5aSJ5pu044KS56C05qOEXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19idXR0b25cIiBvbkNsaWNrPXtoYW5kbGVGb3JjZVRha2VvdmVyfT5cbiAgICAgICAgICAgICAg5by35Yi25byV44GN57aZ44GOXG4gICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApIDogbnVsbH1cblxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fY29udHJvbHNcIiByb2xlPVwiZ3JvdXBcIiBhcmlhLWxhYmVsPVwiQ2hhcnRzIOaTjeS9nOeUqOODnOOCv+ODs1wiPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgaWQ9XCJjaGFydHMtYWN0aW9uLWZpbmlzaFwiXG4gICAgICAgICAgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2J1dHRvblwiXG4gICAgICAgICAgZGlzYWJsZWQ9e290aGVyQmxvY2tlZH1cbiAgICAgICAgICBkYXRhLWRpc2FibGVkLXJlYXNvbj17b3RoZXJCbG9ja2VkID8gKGlzTG9ja2VkID8gJ2xvY2tlZCcgOiB1bmRlZmluZWQpIDogdW5kZWZpbmVkfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUFjdGlvbignZmluaXNoJyl9XG4gICAgICAgICAgYXJpYS1rZXlzaG9ydGN1dHM9XCJBbHQrRVwiXG4gICAgICAgID5cbiAgICAgICAgICDoqLrnmYLntYLkuoZcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBpZD1cImNoYXJ0cy1hY3Rpb24tc2VuZFwiXG4gICAgICAgICAgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2J1dHRvbiBjaGFydHMtYWN0aW9uc19fYnV0dG9uLS1wcmltYXJ5XCJcbiAgICAgICAgICBkaXNhYmxlZD17c2VuZERpc2FibGVkfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgIHNldENvbmZpcm1BY3Rpb24oJ3NlbmQnKTtcbiAgICAgICAgICAgIGFwcHJvdmFsU2Vzc2lvblJlZi5jdXJyZW50ID0geyBhY3Rpb246ICdzZW5kJywgY2xvc2VkOiBmYWxzZSB9O1xuICAgICAgICAgICAgbG9nQXBwcm92YWwoJ3NlbmQnLCAnb3BlbicpO1xuICAgICAgICAgIH19XG4gICAgICAgICAgYXJpYS1kaXNhYmxlZD17c2VuZERpc2FibGVkfVxuICAgICAgICAgIGFyaWEtZGVzY3JpYmVkYnk9eyFpc1J1bm5pbmcgJiYgc2VuZFByZWNoZWNrUmVhc29ucy5sZW5ndGggPiAwID8gJ2NoYXJ0cy1hY3Rpb25zLXNlbmQtZ3VhcmQnIDogdW5kZWZpbmVkfVxuICAgICAgICAgIGRhdGEtZGlzYWJsZWQtcmVhc29uPXtcbiAgICAgICAgICAgIHNlbmREaXNhYmxlZFxuICAgICAgICAgICAgICA/IChpc1J1bm5pbmcgPyAncnVubmluZycgOiBzZW5kUHJlY2hlY2tSZWFzb25zLm1hcCgocmVhc29uKSA9PiByZWFzb24ua2V5KS5qb2luKCcsJykpXG4gICAgICAgICAgICAgIDogdW5kZWZpbmVkXG4gICAgICAgICAgfVxuICAgICAgICAgIGFyaWEta2V5c2hvcnRjdXRzPVwiQWx0K1NcIlxuICAgICAgICA+XG4gICAgICAgICAgT1JDQSDpgIHkv6FcbiAgICAgICAgPC9idXR0b24+XG4gICAgICAgIDxidXR0b25cbiAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICBpZD1cImNoYXJ0cy1hY3Rpb24tcHJpbnRcIlxuICAgICAgICAgIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19idXR0b25cIlxuICAgICAgICAgIGRpc2FibGVkPXtwcmludERpc2FibGVkfVxuICAgICAgICAgIGFyaWEtZGlzYWJsZWQ9e3ByaW50RGlzYWJsZWR9XG4gICAgICAgICAgb25DbGljaz17b3BlblByaW50RGlhbG9nfVxuICAgICAgICAgIGFyaWEtZGVzY3JpYmVkYnk9eyFpc1J1bm5pbmcgJiYgcHJpbnRQcmVjaGVja1JlYXNvbnMubGVuZ3RoID4gMCA/ICdjaGFydHMtYWN0aW9ucy1wcmludC1ndWFyZCcgOiB1bmRlZmluZWR9XG4gICAgICAgICAgZGF0YS1kaXNhYmxlZC1yZWFzb249e3ByaW50RGlzYWJsZWQgPyBwcmludFByZWNoZWNrUmVhc29ucy5tYXAoKHJlYXNvbikgPT4gcmVhc29uLmtleSkuam9pbignLCcpIDogdW5kZWZpbmVkfVxuICAgICAgICAgIGFyaWEta2V5c2hvcnRjdXRzPVwiQWx0K0lcIlxuICAgICAgICA+XG4gICAgICAgICAg5Y2w5Yi3L+OCqOOCr+OCueODneODvOODiFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGlkPVwiY2hhcnRzLWFjdGlvbi1kcmFmdFwiXG4gICAgICAgICAgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2J1dHRvblwiXG4gICAgICAgICAgZGlzYWJsZWQ9e290aGVyQmxvY2tlZH1cbiAgICAgICAgICBkYXRhLWRpc2FibGVkLXJlYXNvbj17b3RoZXJCbG9ja2VkID8gKGlzTG9ja2VkID8gJ2xvY2tlZCcgOiB1bmRlZmluZWQpIDogdW5kZWZpbmVkfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUFjdGlvbignZHJhZnQnKX1cbiAgICAgICAgICBhcmlhLWtleXNob3J0Y3V0cz1cIlNoaWZ0K0VudGVyXCJcbiAgICAgICAgPlxuICAgICAgICAgIOODieODqeODleODiOS/neWtmFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPGJ1dHRvblxuICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19idXR0b24gY2hhcnRzLWFjdGlvbnNfX2J1dHRvbi0tZ2hvc3RcIlxuICAgICAgICAgIGRpc2FibGVkPXtvdGhlckJsb2NrZWR9XG4gICAgICAgICAgZGF0YS1kaXNhYmxlZC1yZWFzb249e290aGVyQmxvY2tlZCA/IChpc0xvY2tlZCA/ICdsb2NrZWQnIDogdW5kZWZpbmVkKSA6IHVuZGVmaW5lZH1cbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVBY3Rpb24oJ2NhbmNlbCcpfVxuICAgICAgICA+XG4gICAgICAgICAg44Kt44Oj44Oz44K744OrXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX2J1dHRvbiBjaGFydHMtYWN0aW9uc19fYnV0dG9uLS11bmxvY2tcIlxuICAgICAgICAgIGRpc2FibGVkPXtpc1J1bm5pbmcgfHwgIWlzTG9ja2VkIHx8IGFwcHJvdmFsTG9ja2VkfVxuICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVVubG9ja31cbiAgICAgICAgPlxuICAgICAgICAgIOODreODg+OCr+ino+mZpFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7IWlzUnVubmluZyAmJiBzZW5kUHJlY2hlY2tSZWFzb25zLmxlbmd0aCA+IDAgJiYgKFxuICAgICAgICA8ZGl2IGlkPVwiY2hhcnRzLWFjdGlvbnMtc2VuZC1ndWFyZFwiIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19ndWFyZFwiIHJvbGU9XCJub3RlXCIgYXJpYS1saXZlPVwib2ZmXCI+XG4gICAgICAgICAgPHN0cm9uZz7pgIHkv6HliY3jg4Hjgqfjg4Pjgq86IE9SQ0HpgIHkv6HjgpLjg5bjg63jg4Pjgq88L3N0cm9uZz5cbiAgICAgICAgICA8dWw+XG4gICAgICAgICAgICB7c2VuZFByZWNoZWNrUmVhc29ucy5tYXAoKHJlYXNvbikgPT4gKFxuICAgICAgICAgICAgICA8bGkga2V5PXtyZWFzb24ua2V5fT5cbiAgICAgICAgICAgICAgICB7cmVhc29uLnN1bW1hcnl9OiB7cmVhc29uLmRldGFpbH3vvIjmrKHjgavjgoTjgovjgZPjgag6IHtyZWFzb24ubmV4dC5qb2luKCcgLyAnKX3vvIlcbiAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgeyFpc1J1bm5pbmcgJiYgcHJpbnRQcmVjaGVja1JlYXNvbnMubGVuZ3RoID4gMCAmJiAoXG4gICAgICAgIDxkaXYgaWQ9XCJjaGFydHMtYWN0aW9ucy1wcmludC1ndWFyZFwiIGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19ndWFyZFwiIHJvbGU9XCJub3RlXCIgYXJpYS1saXZlPVwib2ZmXCI+XG4gICAgICAgICAgPHN0cm9uZz7ljbDliLfliY3jg4Hjgqfjg4Pjgq86IOWNsOWIty/jgqjjgq/jgrnjg53jg7zjg4jjgpLjg5bjg63jg4Pjgq88L3N0cm9uZz5cbiAgICAgICAgICA8dWw+XG4gICAgICAgICAgICB7cHJpbnRQcmVjaGVja1JlYXNvbnMubWFwKChyZWFzb24pID0+IChcbiAgICAgICAgICAgICAgPGxpIGtleT17cmVhc29uLmtleX0+XG4gICAgICAgICAgICAgICAge3JlYXNvbi5zdW1tYXJ5fToge3JlYXNvbi5kZXRhaWx977yI5qyh44Gr44KE44KL44GT44GoOiB7cmVhc29uLm5leHQuam9pbignIC8gJyl977yJXG4gICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICApKX1cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHtpc1J1bm5pbmcgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19za2VsZXRvblwiIHJvbGU9XCJzdGF0dXNcIiBhcmlhLWxpdmU9e3Jlc29sdmVBcmlhTGl2ZSgnaW5mbycpfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNoYXJ0cy1hY3Rpb25zX19za2VsZXRvbi1iYXJcIiAvPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY2hhcnRzLWFjdGlvbnNfX3NrZWxldG9uLWJhciBjaGFydHMtYWN0aW9uc19fc2tlbGV0b24tYmFyLS1zaG9ydFwiIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAge3RvYXN0ICYmIChcbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzTmFtZT17YGNoYXJ0cy1hY3Rpb25zX190b2FzdCBjaGFydHMtYWN0aW9uc19fdG9hc3QtLSR7dG9hc3QudG9uZX1gfVxuICAgICAgICAgIHJvbGU9XCJzdGF0dXNcIlxuICAgICAgICAgIGFyaWEtbGl2ZT17cmVzb2x2ZUFyaWFMaXZlKHRvYXN0LnRvbmUpfVxuICAgICAgICAgIGFyaWEtYXRvbWljPVwiZmFsc2VcIlxuICAgICAgICA+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxzdHJvbmc+e3RvYXN0Lm1lc3NhZ2V9PC9zdHJvbmc+XG4gICAgICAgICAgICB7dG9hc3QuZGV0YWlsICYmIDxwPnt0b2FzdC5kZXRhaWx9PC9wPn1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjaGFydHMtYWN0aW9uc19fcmV0cnlcIiBvbkNsaWNrPXsoKSA9PiBzZXRUb2FzdChudWxsKX0+XG4gICAgICAgICAgICDplonjgZjjgotcbiAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApfVxuICAgIDwvc2VjdGlvbj5cbiAgKTtcbn1cbiJdLCJmaWxlIjoiL1VzZXJzL0hheWF0by9Eb2N1bWVudHMvR2l0SHViL09wZW5Eb2xwaGluX1dlYkNsaWVudC93ZWItY2xpZW50L3NyYy9mZWF0dXJlcy9jaGFydHMvQ2hhcnRzQWN0aW9uQmFyLnRzeCJ9